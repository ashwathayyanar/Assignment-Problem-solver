/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { LayoutDashboard, Briefcase, Users, GitMerge, Play, RotateCcw, Trash2, Menu, X } from 'lucide-react';
import Dashboard from './components/Dashboard';
import JobsList from './components/JobsList';
import WorkersList from './components/WorkersList';
import Assignments from './components/Assignments';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ totalJobs: 0, pendingJobs: 0, totalWorkers: 0, activeAssignments: 0 });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationLogs, setOptimizationLogs] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const res = await fetch('/api/optimize', { method: 'POST' });
      const data = await res.json();
      if (data.logs) setOptimizationLogs(data.logs);
      triggerRefresh();
      setActiveTab('assignments');
    } catch (e) {
      console.error(e);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleReset = async () => {
    await fetch('/api/reset', { method: 'POST' });
    setOptimizationLogs([]);
    triggerRefresh();
  };

  const handleClear = async () => {
    await fetch('/api/clear', { method: 'POST' });
    setOptimizationLogs([]);
    triggerRefresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
            <GitMerge size={20} />
          </div>
          <h1 className="text-lg font-bold tracking-tight">Problem Solver</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:flex w-full md:w-64 bg-slate-900 text-slate-300 flex-col shrink-0 min-h-screen md:min-h-0`}>
        <div className="p-6 border-b border-slate-800 hidden md:flex items-center gap-3">
          <div className="bg-indigo-500 text-white p-2 rounded-lg shadow-sm shadow-indigo-500/20">
            <GitMerge size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Problem Solver</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} />
          <NavItem icon={<Briefcase size={20} />} label="Jobs" active={activeTab === 'jobs'} onClick={() => { setActiveTab('jobs'); setIsMobileMenuOpen(false); }} />
          <NavItem icon={<Users size={20} />} label="Workers" active={activeTab === 'workers'} onClick={() => { setActiveTab('workers'); setIsMobileMenuOpen(false); }} />
          <NavItem icon={<GitMerge size={20} />} label="Assignments" active={activeTab === 'assignments'} onClick={() => { setActiveTab('assignments'); setIsMobileMenuOpen(false); }} />
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <button 
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"
          >
            {isOptimizing ? <span className="animate-pulse">Optimizing...</span> : <><Play size={18} /> Run Optimizer</>}
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={handleReset}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 px-2 rounded-lg text-xs font-medium transition-colors"
              title="Reset all assignments to 0"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button 
              onClick={handleClear}
              className="flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 px-2 rounded-lg text-xs font-medium transition-colors"
              title="Delete all jobs and workers"
            >
              <Trash2 size={14} /> Clear All
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto">
        {activeTab === 'dashboard' && <Dashboard stats={stats} />}
        {activeTab === 'jobs' && <JobsList refreshTrigger={refreshTrigger} triggerRefresh={triggerRefresh} />}
        {activeTab === 'workers' && <WorkersList refreshTrigger={refreshTrigger} triggerRefresh={triggerRefresh} />}
        {activeTab === 'assignments' && <Assignments refreshTrigger={refreshTrigger} logs={optimizationLogs} />}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all duration-200 ${
        active 
          ? 'bg-indigo-600 text-white shadow-sm' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

