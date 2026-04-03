import pkg from 'pg';
const { Pool } = pkg;

// Initialize the PostgreSQL connection pool
// Make sure to replace the connectionString with your actual PostgreSQL database URL
// or ensure process.env.DATABASE_URL is set in your environment variables.
// Inside src/server/db.ts
const pool = new Pool({
  connectionString: process.env.POSTGRE_POSTGRES_URL || process.env.DATABASE_URL,
});

// Since pg is asynchronous, we wrap the setup in an async function
async function initDB() {
  try {
    // Initialize schema
    // Note: 'AUTOINCREMENT' is changed to 'SERIAL' for PostgreSQL
    await pool.query(`
      CREATE TABLE IF NOT EXISTS workers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        skill TEXT NOT NULL,
        experience INTEGER NOT NULL, -- 1 to 10
        capacity INTEGER NOT NULL, -- max complexity they can handle at once
        current_load INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        required_skill TEXT NOT NULL,
        complexity INTEGER NOT NULL, -- 1 to 10
        deadline TIMESTAMP NOT NULL, -- Changed to native TIMESTAMP
        priority INTEGER NOT NULL, -- 1 (low) to 5 (high)
        status TEXT DEFAULT 'pending' -- pending, assigned, completed
      );

      CREATE TABLE IF NOT EXISTS assignments (
        id SERIAL PRIMARY KEY,
        job_id INTEGER NOT NULL,
        worker_id INTEGER NOT NULL,
        score REAL NOT NULL,
        reasoning TEXT NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(job_id) REFERENCES jobs(id),
        FOREIGN KEY(worker_id) REFERENCES workers(id)
      );
    `);

    // Seed workers if empty
    const workerRes = await pool.query('SELECT COUNT(*) as count FROM workers');
    // pg returns counts as strings to avoid JavaScript integer overflow, so we parse it
    const workerCount = parseInt(workerRes.rows[0].count, 10);
    
    if (workerCount === 0) {
      // PostgreSQL uses $1, $2 instead of ? for parameterized queries
      const insertWorkerQuery = 'INSERT INTO workers (name, skill, experience, capacity) VALUES ($1, $2, $3, $4)';
      
      await pool.query(insertWorkerQuery, ['Alice Smith', 'Frontend', 8, 15]);
      await pool.query(insertWorkerQuery, ['Bob Jones', 'Backend', 6, 10]);
      await pool.query(insertWorkerQuery, ['Charlie Brown', 'Fullstack', 9, 20]);
      await pool.query(insertWorkerQuery, ['Diana Prince', 'Design', 7, 12]);
      await pool.query(insertWorkerQuery, ['Evan Wright', 'Frontend', 4, 8]);
      
      console.log('Workers seeded successfully.');
    }

    // Seed jobs if empty
    const jobRes = await pool.query('SELECT COUNT(*) as count FROM jobs');
    const jobCount = parseInt(jobRes.rows[0].count, 10);

    if (jobCount === 0) {
      const insertJobQuery = 'INSERT INTO jobs (title, required_skill, complexity, deadline, priority) VALUES ($1, $2, $3, $4, $5)';
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      await pool.query(insertJobQuery, ['Build Landing Page', 'Frontend', 5, nextWeek.toISOString(), 3]);
      await pool.query(insertJobQuery, ['Setup Database', 'Backend', 8, nextWeek.toISOString(), 5]);
      await pool.query(insertJobQuery, ['Create Logo', 'Design', 3, today.toISOString(), 2]);
      await pool.query(insertJobQuery, ['API Integration', 'Fullstack', 7, nextWeek.toISOString(), 4]);
      await pool.query(insertJobQuery, ['Fix CSS Bugs', 'Frontend', 2, today.toISOString(), 1]);

      console.log('Jobs seeded successfully.');
    }

    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Execute the initialization
initDB();

// Export the pool so you can import and use it in other parts of your app
// e.g., const result = await pool.query('SELECT * FROM workers');
export default pool;