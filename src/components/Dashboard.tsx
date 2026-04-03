import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Briefcase, Users, CheckCircle2, Clock } from 'lucide-react';

export default function Dashboard({ stats }: { stats: any }) {
  const data = [
    { name: 'Total Jobs', value: stats.totalJobs },
    { name: 'Pending Jobs', value: stats.pendingJobs },
    { name: 'Total Workers', value: stats.totalWorkers },
    { name: 'Active Assignments', value: stats.activeAssignments },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Dashboard</h2>
        <p className="text-slate-500 mt-1">Overview of your workforce optimization system.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Total Jobs" value={stats.totalJobs} icon={<Briefcase size={20} />} />
        <StatCard title="Pending Jobs" value={stats.pendingJobs} icon={<Clock size={20} />} color="text-amber-600" bg="bg-amber-50" />
        <StatCard title="Total Workers" value={stats.totalWorkers} icon={<Users size={20} />} />
        <StatCard title="Active Assignments" value={stats.activeAssignments} icon={<CheckCircle2 size={20} />} color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-6 text-slate-800">System Overview</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }} 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
              />
              <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color = "text-slate-900", bg = "bg-slate-50" }: { title: string, value: number, icon: React.ReactNode, color?: string, bg?: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group">
      <div className="flex justify-between items-start">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className={`p-2 rounded-lg ${bg} ${color} opacity-80 group-hover:opacity-100 transition-opacity`}>
          {icon}
        </div>
      </div>
      <span className={`text-4xl font-bold mt-4 ${color}`}>{value}</span>
    </div>
  );
}
