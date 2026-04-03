import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    skill TEXT NOT NULL,
    experience INTEGER NOT NULL, -- 1 to 10
    capacity INTEGER NOT NULL, -- max complexity they can handle at once
    current_load INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    required_skill TEXT NOT NULL,
    complexity INTEGER NOT NULL, -- 1 to 10
    deadline TEXT NOT NULL, -- ISO date string
    priority INTEGER NOT NULL, -- 1 (low) to 5 (high)
    status TEXT DEFAULT 'pending' -- pending, assigned, completed
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    worker_id INTEGER NOT NULL,
    score REAL NOT NULL,
    reasoning TEXT NOT NULL,
    assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(job_id) REFERENCES jobs(id),
    FOREIGN KEY(worker_id) REFERENCES workers(id)
  );
`);

// Seed data if empty
const workerCount = (db.prepare('SELECT COUNT(*) as count FROM workers').get() as any).count;
if (workerCount === 0) {
  const insertWorker = db.prepare('INSERT INTO workers (name, skill, experience, capacity) VALUES (?, ?, ?, ?)');
  insertWorker.run('Alice Smith', 'Frontend', 8, 15);
  insertWorker.run('Bob Jones', 'Backend', 6, 10);
  insertWorker.run('Charlie Brown', 'Fullstack', 9, 20);
  insertWorker.run('Diana Prince', 'Design', 7, 12);
  insertWorker.run('Evan Wright', 'Frontend', 4, 8);
}

const jobCount = (db.prepare('SELECT COUNT(*) as count FROM jobs').get() as any).count;
if (jobCount === 0) {
  const insertJob = db.prepare('INSERT INTO jobs (title, required_skill, complexity, deadline, priority) VALUES (?, ?, ?, ?, ?)');
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  insertJob.run('Build Landing Page', 'Frontend', 5, nextWeek.toISOString(), 3);
  insertJob.run('Setup Database', 'Backend', 8, nextWeek.toISOString(), 5);
  insertJob.run('Create Logo', 'Design', 3, today.toISOString(), 2);
  insertJob.run('API Integration', 'Fullstack', 7, nextWeek.toISOString(), 4);
  insertJob.run('Fix CSS Bugs', 'Frontend', 2, today.toISOString(), 1);
}

export default db;
