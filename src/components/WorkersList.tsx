import { useState, useEffect } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';

export default function WorkersList({ refreshTrigger, triggerRefresh }: { refreshTrigger: number, triggerRefresh: () => void }) {
  const [workers, setWorkers] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    skill: 'Frontend',
    experience: 5,
    capacity: 10
  });

  const fetchWorkers = async () => {
    const res = await fetch('/api/workers');
    const data = await res.json();
    setWorkers(data);
  };

  useEffect(() => {
    fetchWorkers();
  }, [refreshTrigger]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/workers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setIsAdding(false);
    setFormData({
      name: '',
      skill: 'Frontend',
      experience: 5,
      capacity: 10
    });
    triggerRefresh();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/workers/${id}`, { method: 'DELETE' });
    triggerRefresh();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Workers</h2>
          <p className="text-slate-500 mt-1">Manage your workforce and their capabilities.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus size={18} /> Add Worker
          </button>
        )}
      </header>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">New Worker Details</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
            <input required type="text" placeholder="e.g. Jane Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Primary Skill</label>
            <select value={formData.skill} onChange={e => setFormData({...formData, skill: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
              <option>Frontend</option>
              <option>Backend</option>
              <option>Fullstack</option>
              <option>Design</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Experience Level (1-10)</label>
            <input required type="number" min="1" max="10" value={formData.experience} onChange={e => setFormData({...formData, experience: parseInt(e.target.value)})} className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Capacity (Max Complexity)</label>
            <input required type="number" min="1" max="50" value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
          </div>
          <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition-colors">Cancel</button>
            <button type="submit" className="bg-indigo-600 text-white px-5 py-2.5 font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Save Worker</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Skill</th>
                <th className="px-6 py-4">Experience</th>
                <th className="px-6 py-4">Capacity</th>
                <th className="px-6 py-4">Current Load</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workers.map(worker => {
                const loadPercentage = Math.round((worker.current_load / worker.capacity) * 100) || 0;
                return (
                  <tr key={worker.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{worker.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 ring-inset">
                        {worker.skill}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{worker.experience}/10</td>
                    <td className="px-6 py-4 text-slate-600">{worker.capacity}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-full bg-slate-200 rounded-full h-2 max-w-[100px]">
                          <div 
                            className={`h-2 rounded-full ${loadPercentage > 90 ? 'bg-red-500' : loadPercentage > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${Math.min(loadPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-slate-600">{worker.current_load}/{worker.capacity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(worker.id)} className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors" title="Delete worker">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {workers.length === 0 && !isAdding && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <div className="bg-slate-100 p-3 rounded-full mb-4">
                        <Users size={32} className="text-slate-400" />
                      </div>
                      <p className="text-lg font-medium text-slate-900 mb-1">No workers found</p>
                      <p className="mb-6 text-sm">Get started by adding workers to your team.</p>
                      <button 
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                      >
                        <Plus size={18} /> Add Worker
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
