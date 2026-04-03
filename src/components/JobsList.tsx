import { useState, useEffect } from 'react';
import { Plus, Trash2, Briefcase } from 'lucide-react';

export default function JobsList({ refreshTrigger, triggerRefresh }: { refreshTrigger: number, triggerRefresh: () => void }) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    required_skill: 'Frontend',
    complexity: 5,
    deadline: new Date().toISOString().split('T')[0],
    priority: 3
  });

  const fetchJobs = async () => {
    const res = await fetch('/api/jobs');
    const data = await res.json();
    setJobs(data);
  };

  useEffect(() => {
    fetchJobs();
  }, [refreshTrigger]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        deadline: new Date(formData.deadline).toISOString()
      })
    });
    setIsAdding(false);
    setFormData({
      title: '',
      required_skill: 'Frontend',
      complexity: 5,
      deadline: new Date().toISOString().split('T')[0],
      priority: 3
    });
    triggerRefresh();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
    triggerRefresh();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Jobs</h2>
          <p className="text-slate-500 mt-1">Manage tasks that need to be assigned.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus size={18} /> Add Job
          </button>
        )}
      </header>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">New Job Details</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
            <input required type="text" placeholder="e.g. Build Landing Page" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Required Skill</label>
            <select value={formData.required_skill} onChange={e => setFormData({...formData, required_skill: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
              <option>Frontend</option>
              <option>Backend</option>
              <option>Fullstack</option>
              <option>Design</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Complexity (1-10)</label>
            <input required type="number" min="1" max="10" value={formData.complexity} onChange={e => setFormData({...formData, complexity: parseInt(e.target.value)})} className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority (1-5)</label>
            <input required type="number" min="1" max="5" value={formData.priority} onChange={e => setFormData({...formData, priority: parseInt(e.target.value)})} className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Deadline</label>
            <input required type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
          </div>
          <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition-colors">Cancel</button>
            <button type="submit" className="bg-indigo-600 text-white px-5 py-2.5 font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Save Job</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Skill</th>
                <th className="px-6 py-4">Complexity</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map(job => (
                <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{job.title}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 ring-inset">
                      {job.required_skill}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{job.complexity}</td>
                  <td className="px-6 py-4 text-slate-600">{job.priority}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ring-1 ring-inset ${
                      job.status === 'pending' 
                        ? 'bg-amber-50 text-amber-700 ring-amber-200' 
                        : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(job.id)} className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors" title="Delete job">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && !isAdding && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <div className="bg-slate-100 p-3 rounded-full mb-4">
                        <Briefcase size={32} className="text-slate-400" />
                      </div>
                      <p className="text-lg font-medium text-slate-900 mb-1">No jobs found</p>
                      <p className="mb-6 text-sm">Get started by creating a new job to be assigned.</p>
                      <button 
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                      >
                        <Plus size={18} /> Add Job
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
