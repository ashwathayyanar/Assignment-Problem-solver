import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, User, Briefcase, ChevronRight } from 'lucide-react';

export default function Assignments({ refreshTrigger, logs }: { refreshTrigger: number, logs: string[] }) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ totalAssigned: 0, totalPending: 0, utilizationRate: 0 });

  useEffect(() => {
    const fetchAssignments = async () => {
      const res = await fetch('/api/assignments');
      const data = await res.json();
      setAssignments(data);
    };
    const fetchStats = async () => {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setMetrics({
        totalAssigned: data.activeAssignments,
        totalPending: data.pendingJobs,
        utilizationRate: data.totalWorkers > 0 ? Math.round((data.activeAssignments / data.totalWorkers) * 100) : 0
      });
    };
    fetchAssignments();
    fetchStats();
  }, [refreshTrigger]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Assignments</h2>
        <p className="text-slate-500 mt-1">View current job allocations and optimization logs.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-xl shadow-sm">
          <div className="text-indigo-800 text-sm font-medium mb-1">Jobs Assigned</div>
          <div className="text-3xl font-bold text-indigo-900">{metrics.totalAssigned}</div>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-5 rounded-xl shadow-sm">
          <div className="text-amber-800 text-sm font-medium mb-1">Jobs Pending</div>
          <div className="text-3xl font-bold text-amber-900">{metrics.totalPending}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl shadow-sm">
          <div className="text-emerald-800 text-sm font-medium mb-1">Workforce Utilization</div>
          <div className="text-3xl font-bold text-emerald-900">{metrics.utilizationRate}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500" size={20} />
            Current Allocations
          </h3>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {assignments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {assignments.map(assignment => (
                  <div key={assignment.id} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                            Assigned
                          </span>
                          <span className="text-xs text-slate-500">Score: {assignment.score?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                          <Briefcase size={16} className="text-slate-400" />
                          {assignment.job_title || `Job ID: ${assignment.jobId}`}
                        </h4>
                      </div>
                      
                      <div className="hidden sm:block text-slate-300">
                        <ChevronRight size={20} />
                      </div>
                      
                      <div className="flex-1 sm:text-right">
                        <div className="text-sm text-slate-500 mb-1">Assigned to</div>
                        <div className="font-medium text-slate-900 flex items-center sm:justify-end gap-2">
                          <User size={16} className="text-indigo-500" />
                          {assignment.worker_name || `Worker ID: ${assignment.workerId}`}
                        </div>
                      </div>
                    </div>
                    {assignment.reasoning && (
                      <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 flex items-start gap-2 border border-slate-100">
                        <Info size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                        <p><strong>Reasoning:</strong> {assignment.reasoning}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="bg-slate-100 p-3 rounded-full mb-4">
                  <Info size={32} className="text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">No active assignments.</p>
                <p className="text-sm text-slate-400 mt-1">Run the optimizer to allocate jobs.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <AlertCircle className="text-indigo-500" size={20} />
            Optimization Logs
          </h3>
          
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden h-[500px] flex flex-col">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
              <span className="text-xs font-mono text-slate-400">system.log</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="p-4 overflow-y-auto flex-1 font-mono text-sm space-y-2">
              {logs && logs.length > 0 ? (
                logs.map((log, i) => (
                  <div key={i} className={`${log.includes('Failed') ? 'text-red-400' : log.includes('Assigned') ? 'text-emerald-400' : 'text-slate-300'}`}>
                    <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-slate-500 italic">Waiting for optimization run...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
