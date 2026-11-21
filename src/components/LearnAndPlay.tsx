import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LearningContent, LearningContentType } from '../types';
import { 
  BookOpen, 
  Plus, 
  ExternalLink, 
  Tag, 
  PlayCircle, 
  CheckCircle2, 
  Trash2, 
  X, 
  Edit3 
} from 'lucide-react';

export const LearnAndPlay: React.FC = () => {
  const { 
    currentUser, 
    learningContent, 
    sports, 
    addLearningContent, 
    deleteLearningContent, 
    getSportName 
  } = useApp();

  const [selectedSportFilter, setSelectedSportFilter] = useState('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [form, setForm] = useState({
    sport_id: sports[0]?.id || '',
    title: '',
    description: '',
    video_url: '',
    content_type: 'Rules' as LearningContentType,
  });

  const categories: LearningContentType[] = [
    'Rules',
    'Equipment usage',
    'Beginner techniques',
    'Common mistakes',
    'Safety tips',
  ];

  const filteredContent = learningContent.filter(item => {
    if (selectedSportFilter !== 'ALL' && item.sport_id !== selectedSportFilter) return false;
    if (selectedTypeFilter !== 'ALL' && item.content_type !== selectedTypeFilter) return false;
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLearningContent({
      sport_id: form.sport_id,
      title: form.title,
      description: form.description,
      video_url: form.video_url,
      content_type: form.content_type,
      active: true,
    });
    setIsAddModalOpen(false);
    setForm({
      sport_id: sports[0]?.id || '',
      title: '',
      description: '',
      video_url: '',
      content_type: 'Rules',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>Learn & Play — Sports Knowledge Base</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rules, equipment handling instructions, beginner drills, and safety guidelines for Dr. Moonje Institute student athletes.
          </p>
        </div>

        {currentUser?.role === 'TEACHER' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Resource</span>
          </button>
        )}
      </div>

      {/* Category Pills & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Category Type Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedTypeFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedTypeFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedTypeFilter === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sport Filter */}
        <div>
          <select
            value={selectedSportFilter}
            onChange={e => setSelectedSportFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white"
          >
            <option value="ALL">All Sports</option>
            {sports.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Learning Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredContent.map(item => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {item.content_type}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {getSportName(item.sport_id)}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {item.title}
              </h3>
              <p className="text-xs text-slate-600 mt-2 line-clamp-4 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              {item.video_url ? (
                <a
                  href={item.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  <PlayCircle className="w-4 h-4 text-indigo-600" />
                  <span>Video Tutorial</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                </a>
              ) : (
                <span className="text-slate-400 italic">Reading Guide</span>
              )}

              {currentUser?.role === 'TEACHER' && (
                <button
                  onClick={() => deleteLearningContent(item.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                  title="Remove Resource"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Learning Modal (Teacher Only) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Publish Sports Learning Resource</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Sport Discipline <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.sport_id}
                  onChange={e => setForm({ ...form, sport_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {sports.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Resource Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.content_type}
                  onChange={e => setForm({ ...form, content_type: e.target.value as LearningContentType })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Badminton Serving Height & Fault Rules"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Description / Technique Summary <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Explain official regulations or step-by-step guidance..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Verified Video URL (YouTube / Public Link)
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={form.video_url}
                  onChange={e => setForm({ ...form, video_url: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
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
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Publish Content
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
