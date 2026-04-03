import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import pool from './src/server/db.js'; // Using the pool from your pg config
import { optimizeAllocations } from './src/server/optimizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000; // Good practice for cloud deployments like Vercel

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Jobs
  // Note: Route handlers are now async
  app.get('/api/jobs', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM jobs');
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/jobs', async (req, res) => {
    try {
      const { title, required_skill, complexity, deadline, priority } = req.body;
      // PostgreSQL uses $1, $2 and RETURNING id instead of lastInsertRowid
      const query = `
        INSERT INTO jobs (title, required_skill, complexity, deadline, priority, status) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING id
      `;
      const result = await pool.query(query, [title, required_skill, complexity, deadline, priority, 'pending']);
      res.json({ id: result.rows[0].id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/jobs/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const assignRes = await pool.query('SELECT * FROM assignments WHERE job_id = $1', [id]);
      const assignment = assignRes.rows[0];
      
      if (assignment) {
        const jobRes = await pool.query('SELECT complexity FROM jobs WHERE id = $1', [id]);
        const job = jobRes.rows[0];
        
        if (job) {
          // PostgreSQL uses GREATEST instead of SQLite's MAX for scalar comparison
          await pool.query(
            'UPDATE workers SET current_load = GREATEST(0, current_load - $1) WHERE id = $2',
            [job.complexity, assignment.worker_id]
          );
        }
        await pool.query('DELETE FROM assignments WHERE job_id = $1', [id]);
      }
      await pool.query('DELETE FROM jobs WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Workers
  app.get('/api/workers', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM workers');
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/workers', async (req, res) => {
    try {
      const { name, skill, experience, capacity } = req.body;
      const query = `
        INSERT INTO workers (name, skill, experience, capacity, current_load) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING id
      `;
      const result = await pool.query(query, [name, skill, experience, capacity, 0]);
      res.json({ id: result.rows[0].id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/workers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const assignRes = await pool.query('SELECT * FROM assignments WHERE worker_id = $1', [id]);
      const assignments = assignRes.rows;
      
      for (const a of assignments) {
        await pool.query("UPDATE jobs SET status = 'pending' WHERE id = $1", [a.job_id]);
      }
      
      await pool.query('DELETE FROM assignments WHERE worker_id = $1', [id]);
      await pool.query('DELETE FROM workers WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Assignments
  app.get('/api/assignments', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT a.*, j.title as job_title, w.name as worker_name 
        FROM assignments a
        JOIN jobs j ON a.job_id = j.id
        JOIN workers w ON a.worker_id = w.id
      `);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Optimization Engine
  app.post('/api/optimize', async (req, res) => {
    try {
      // optimizeAllocations is now async, so we await it
      const results = await optimizeAllocations();
      res.json(results);
    } catch (error: any) {
      console.error('Optimization error:', error);
      res.status(500).json({ error: 'Optimization failed: ' + error.message });
    }
  });

  // Reset & Clear
  app.post('/api/reset', async (req, res) => {
    try {
      await pool.query('DELETE FROM assignments');
      await pool.query("UPDATE jobs SET status = 'pending'");
      await pool.query('UPDATE workers SET current_load = 0');
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/clear', async (req, res) => {
    try {
      await pool.query('DELETE FROM assignments');
      await pool.query('DELETE FROM jobs');
      await pool.query('DELETE FROM workers');
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Dashboard Stats
  app.get('/api/stats', async (req, res) => {
    try {
      // PostgreSQL COUNT returns a string, so we parseInt
      const totalJobsRes = await pool.query('SELECT COUNT(*) as count FROM jobs');
      const pendingJobsRes = await pool.query("SELECT COUNT(*) as count FROM jobs WHERE status = 'pending'");
      const totalWorkersRes = await pool.query('SELECT COUNT(*) as count FROM workers');
      const activeAssignmentsRes = await pool.query('SELECT COUNT(*) as count FROM assignments');

      res.json({ 
        totalJobs: parseInt(totalJobsRes.rows[0].count, 10), 
        pendingJobs: parseInt(pendingJobsRes.rows[0].count, 10), 
        totalWorkers: parseInt(totalWorkersRes.rows[0].count, 10), 
        activeAssignments: parseInt(activeAssignmentsRes.rows[0].count, 10) 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();