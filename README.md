# 🎯 Assignment Problem Solver

An intelligent full-stack web application that optimizes the allocation of workers to jobs. The system uses a specialized algorithm to match tasks to workforce members based on required skills, job complexity, worker capacity, and experience levels, ensuring a balanced workload and efficient task completion.

## 🚀 Tech Stack

* **Frontend:** React, TypeScript, Vite
* **Backend:** Node.js, Express (Configured for Vercel Serverless Functions)
* **Database:** PostgreSQL (`pg` driver)
* **Deployment:** Vercel

## ✨ Features

* **Manage Workers:** Add and remove workers, defining their primary skills, experience levels, and maximum workload capacity.
* **Manage Jobs:** Create tasks with specific skill requirements, complexities, and deadlines.
* **Optimization Engine:** Run an automated, heuristic-based greedy matching algorithm to instantly assign the best workers to pending jobs while balancing capacity.
* **Dashboard Analytics:** View real-time statistics on total jobs, pending tasks, workforce size, and active assignments.
* **One-Click Reset:** Clear assignments or wipe the entire database for fresh simulations.

---

## 🛠️ Local Development Setup

### 1. Prerequisites
* Node.js installed on your machine
* A PostgreSQL database (Local or Cloud-hosted like Neon, Supabase, or Vercel Postgres)

### 2. Installation
Clone the repository and install the dependencies:
```bash
npm install
