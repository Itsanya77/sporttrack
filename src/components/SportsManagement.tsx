import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { matchesSportFilter } from '../utils/sportsHelper';
import { Sport } from '../types';
import { 
  Medal, 
  Plus, 
  Edit3, 
  Package, 
  CheckCircle2, 
  X, 
  AlertTriangle 
} from 'lucide-react';

export const SportsManagement: React.FC = () => {
  const { sports, equipment, addSport, editSport, toggleSportActive } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSport, setEditingSport] = useState<Sport | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const res = addSport(name, description);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setIsAddModalOpen(false);
      setName('');
      setDescription('');
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSport) return;
    setFeedback(null);

    const res = editSport(editingSport.id, editingSport.name, editingSport.description);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setEditingSport(null);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Medal className="w-5 h-5 text-blue-600" />
            <span>Sports Disciplines & Categories</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage college sports divisions (Table Tennis, Badminton, Cricket, Football, Kho-Kho, Kabaddi, etc.).
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Sport</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-2 text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Sports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sports.map(sport => {
          const itemCount = equipment.filter(e => matchesSportFilter(e.sport_id, sport.id, sports) && e.active).length;
          const availableCount = equipment.filter(e => matchesSportFilter(e.sport_id, sport.id, sports) && e.active && e.status === 'AVAILABLE').length;

          return (
            <div
              key={sport.id}
              className={`p-5 rounded-2xl border transition-all ${
                sport.active
                  ? 'bg-white border-slate-200 shadow-xs'
                  : 'bg-slate-50 border-slate-300 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{sport.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{sport.description}</p>
                </div>
                <button
                  onClick={() => setEditingSport(sport)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-slate-600">
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    <span className="font-bold text-slate-800">{itemCount}</span> Total Items (
                    <span className="text-emerald-700 font-bold">{availableCount}</span> Available)
                  </span>
                </div>

                <button
                  onClick={() => toggleSportActive(sport.id)}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    sport.active
                      ? 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {sport.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Sport Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add Sports Discipline</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Sport Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lawn Tennis, Archery"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Collegiate court requirements, balls and equipment rules..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Save Sport
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Sport Modal */}
      {editingSport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Edit Sport Discipline</h3>
              <button onClick={() => setEditingSport(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Sport Name
                </label>
                <input
                  type="text"
                  required
                  value={editingSport.name}
                  onChange={e => setEditingSport({ ...editingSport, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editingSport.description}
                  onChange={e => setEditingSport({ ...editingSport, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSport(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
