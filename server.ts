import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import db from './src/server/db.js';
import { optimizeAllocations } from './src/server/optimizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Jobs
  app.get('/api/jobs', (req, res) => {
    const jobs = db.prepare('SELECT * FROM jobs').all();
    res.json(jobs);
  });

  app.post('/api/jobs', (req, res) => {
    const { title, required_skill, complexity, deadline, priority } = req.body;
    const stmt = db.prepare('INSERT INTO jobs (title, required_skill, complexity, deadline, priority, status) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(title, required_skill, complexity, deadline, priority, 'pending');
    res.json({ id: info.lastInsertRowid });
  });

  app.delete('/api/jobs/:id', (req, res) => {
    try {
      const assignment = db.prepare('SELECT * FROM assignments WHERE job_id = ?').get(req.params.id) as any;
      if (assignment) {
        const job = db.prepare('SELECT complexity FROM jobs WHERE id = ?').get(req.params.id) as any;
        if (job) {
          db.prepare('UPDATE workers SET current_load = MAX(0, current_load - ?) WHERE id = ?').run(job.complexity, assignment.worker_id);
        }
        db.prepare('DELETE FROM assignments WHERE job_id = ?').run(req.params.id);
      }
      db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Workers
  app.get('/api/workers', (req, res) => {
    const workers = db.prepare('SELECT * FROM workers').all();
    res.json(workers);
  });

  app.post('/api/workers', (req, res) => {
    const { name, skill, experience, capacity } = req.body;
    const stmt = db.prepare('INSERT INTO workers (name, skill, experience, capacity, current_load) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(name, skill, experience, capacity, 0);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete('/api/workers/:id', (req, res) => {
    try {
      const assignments = db.prepare('SELECT * FROM assignments WHERE worker_id = ?').all(req.params.id) as any[];
      for (const a of assignments) {
        db.prepare("UPDATE jobs SET status = 'pending' WHERE id = ?").run(a.job_id);
      }
      db.prepare('DELETE FROM assignments WHERE worker_id = ?').run(req.params.id);
      db.prepare('DELETE FROM workers WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Assignments
  app.get('/api/assignments', (req, res) => {
    const assignments = db.prepare(`
      SELECT a.*, j.title as job_title, w.name as worker_name 
      FROM assignments a
      JOIN jobs j ON a.job_id = j.id
      JOIN workers w ON a.worker_id = w.id
    `).all();
    res.json(assignments);
  });

  // Optimization Engine
  app.post('/api/optimize', (req, res) => {
    try {
      const results = optimizeAllocations();
      res.json(results);
    } catch (error: any) {
      console.error('Optimization error:', error);
      res.status(500).json({ error: 'Optimization failed: ' + error.message });
    }
  });

  // Reset & Clear
  app.post('/api/reset', (req, res) => {
    try {
      db.prepare('DELETE FROM assignments').run();
      db.prepare("UPDATE jobs SET status = 'pending'").run();
      db.prepare('UPDATE workers SET current_load = 0').run();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/clear', (req, res) => {
    try {
      db.prepare('DELETE FROM assignments').run();
      db.prepare('DELETE FROM jobs').run();
      db.prepare('DELETE FROM workers').run();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Dashboard Stats
  app.get('/api/stats', (req, res) => {
    const totalJobs = (db.prepare('SELECT COUNT(*) as count FROM jobs').get() as any).count;
    const pendingJobs = (db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'pending'").get() as any).count;
    const totalWorkers = (db.prepare('SELECT COUNT(*) as count FROM workers').get() as any).count;
    const activeAssignments = (db.prepare('SELECT COUNT(*) as count FROM assignments').get() as any).count;
    
    res.json({ totalJobs, pendingJobs, totalWorkers, activeAssignments });
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
