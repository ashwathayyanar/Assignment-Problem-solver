import pool from './db.js'; // Ensure you are importing the default export (the pg pool) from your db file

export async function optimizeAllocations() {
  // 1. Fetch pending jobs and available workers
  const jobsRes = await pool.query("SELECT * FROM jobs WHERE status = 'pending' ORDER BY priority DESC, deadline ASC");
  const jobs = jobsRes.rows;
  
  const workersRes = await pool.query('SELECT * FROM workers');
  const workers = workersRes.rows;

  const assignments = [];
  const logs = [];

  // Reset current loads for simplicity in this run
  await pool.query('UPDATE workers SET current_load = 0');
  await pool.query('DELETE FROM assignments');
  await pool.query("UPDATE jobs SET status = 'pending'");

  // 2. Greedy matching algorithm
  for (const job of jobs) {
    let bestWorker = null;
    let bestScore = -1;
    let bestReasoning = '';

    for (const worker of workers) {
      // Hard constraints
      if (worker.skill !== job.required_skill && worker.skill !== 'Fullstack') continue;
      if (worker.current_load + job.complexity > worker.capacity) continue;

      // Scoring (Heuristic)
      let score = 0;
      let reasoningParts = [];

      // Skill match
      if (worker.skill === job.required_skill) {
        score += 50;
        reasoningParts.push('Exact skill match');
      } else if (worker.skill === 'Fullstack') {
        score += 30;
        reasoningParts.push('Fullstack flexibility');
      }

      // Experience vs Complexity
      const expDiff = worker.experience - (job.complexity / 2); // rough mapping
      if (expDiff >= 0) {
        score += 20 - expDiff; // Prefer closer matches to avoid overqualification
        reasoningParts.push('Appropriate experience level');
      } else {
        score -= Math.abs(expDiff) * 10; // Penalty for underqualification
        reasoningParts.push('Slightly underqualified but capable');
      }

      // Workload balancing (prefer workers with less current load relative to capacity)
      const loadPercentage = worker.current_load / worker.capacity;
      score += (1 - loadPercentage) * 30;
      reasoningParts.push('Good availability');

      if (score > bestScore) {
        bestScore = score;
        bestWorker = worker;
        bestReasoning = reasoningParts.join(', ');
      }
    }

    if (bestWorker) {
      // Make assignment
      bestWorker.current_load += job.complexity;
      
      // Changed to async PostgreSQL queries with $1, $2 parameters
      await pool.query(
        'INSERT INTO assignments (job_id, worker_id, score, reasoning) VALUES ($1, $2, $3, $4)',
        [job.id, bestWorker.id, bestScore, bestReasoning]
      );
      
      await pool.query("UPDATE jobs SET status = 'assigned' WHERE id = $1", [job.id]);
      await pool.query('UPDATE workers SET current_load = $1 WHERE id = $2', [bestWorker.current_load, bestWorker.id]);

      assignments.push({
        jobId: job.id,
        workerId: bestWorker.id,
        score: bestScore,
        reasoning: bestReasoning
      });
      
      logs.push(`Assigned Job "${job.title}" to Worker "${bestWorker.name}" (Score: ${bestScore.toFixed(1)})`);
    } else {
      logs.push(`Failed to assign Job "${job.title}" - No suitable worker found with capacity.`);
    }
  }

  // Calculate efficiency metrics
  const totalAssigned = assignments.length;
  const totalPending = jobs.length - totalAssigned;
  
  let totalCapacity = 0;
  let totalLoad = 0;
  for(const w of workers) {
    totalCapacity += w.capacity;
    totalLoad += w.current_load;
  }
  const utilizationRate = totalCapacity > 0 ? (totalLoad / totalCapacity) * 100 : 0;

  return {
    assignments,
    logs,
    metrics: {
      totalAssigned,
      totalPending,
      utilizationRate: utilizationRate.toFixed(1)
    }
  };
}