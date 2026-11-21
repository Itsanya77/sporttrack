import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VideoItem } from '../types';
import { 
  Video, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Clock, 
  Tag, 
  ExternalLink, 
  Play, 
  X, 
  Check, 
  AlertTriangle,
  Sparkles,
  Youtube
} from 'lucide-react';

// Helper to convert YouTube URL to embed URL
export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  // Match youtube.com/watch?v=ID or youtu.be/ID or youtube.com/embed/ID
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://www.youtube-nocookie.com/embed/${match[2]}`
    : null;
}

interface VideoManagementProps {
  readOnlyStudentMode?: boolean;
}

export const VideoManagement: React.FC<VideoManagementProps> = ({ readOnlyStudentMode = false }) => {
  const { videos, addVideo, editVideo, deleteVideo, togglePublishVideo } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<VideoItem | null>(null);
  const [activeWatchVideo, setActiveWatchVideo] = useState<VideoItem | null>(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Cricket Tutorials',
    youtube_url: '',
    duration: '10:00',
    tags: 'Cricket, Batting, Drills',
    thumbnail: '',
    published: true,
  });

  const categories = [
    'ALL',
    'Cricket Tutorials',
    'Football Tutorials',
    'Fitness',
    'Warm-up',
    'Rules',
    'Training',
    'Safety',
    'Sports Tips',
    'Badminton',
    'Table Tennis',
  ];

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      category: 'Cricket Tutorials',
      youtube_url: '',
      duration: '10:00',
      tags: 'Tutorial, Skills',
      thumbnail: '',
      published: true,
    });
    setEditingVideo(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (v: VideoItem) => {
    setEditingVideo(v);
    setForm({
      title: v.title,
      description: v.description,
      category: v.category,
      youtube_url: v.youtube_url,
      duration: v.duration || '10:00',
      tags: v.tags ? v.tags.join(', ') : '',
      thumbnail: v.thumbnail || '',
      published: v.published,
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tagArray = form.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    if (editingVideo) {
      editVideo(editingVideo.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        youtube_url: form.youtube_url.trim(),
        duration: form.duration.trim(),
        tags: tagArray,
        thumbnail: form.thumbnail.trim(),
        published: form.published,
      });
    } else {
      addVideo({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        youtube_url: form.youtube_url.trim(),
        duration: form.duration.trim(),
        tags: tagArray,
        thumbnail: form.thumbnail.trim() || 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80',
        published: form.published,
      });
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  const handleDeleteConfirm = () => {
    if (deleteCandidate) {
      deleteVideo(deleteCandidate.id);
      setDeleteCandidate(null);
    }
  };

  // Filter videos
  const displayedVideos = videos.filter(v => {
    if (readOnlyStudentMode && !v.published) return false;
    const matchesCategory = selectedCategory === 'ALL' || v.category === selectedCategory;
    const matchesSearch = 
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.tags && v.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 mb-1">
            <Video className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {readOnlyStudentMode ? 'Learn & Play Portal' : 'Video & Tutorial Management'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {readOnlyStudentMode ? 'Sports Drills & Video Masterclasses' : 'Learn & Play Video Library'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {readOnlyStudentMode
              ? 'Watch certified sports tutorials, tactical masterclasses, and proper equipment handling guides.'
              : 'Add, publish, and manage sports training videos and YouTube drill tutorials for students.'}
          </p>
        </div>

        {!readOnlyStudentMode && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Video Tutorial</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by title, sport technique, or tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        {/* Categories scrollable pill row */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      {displayedVideos.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Video className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Video Tutorials Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {readOnlyStudentMode 
              ? 'No videos match the selected category. Check back soon for new training sessions.'
              : 'Try changing your search terms or click "Add New Video Tutorial" to publish videos.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedVideos.map(video => {
            const embedUrl = getYouTubeEmbedUrl(video.youtube_url);

            return (
              <div
                key={video.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
              >
                {/* Thumbnail / Video Preview Header */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                  <img
                    src={video.thumbnail || 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80'}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors" />

                  {/* Play Button Overlay */}
                  <button
                    onClick={() => setActiveWatchVideo(video)}
                    className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-blue-600/90 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg transition-transform transform group-hover:scale-110 cursor-pointer"
                    title="Watch Video"
                  >
                    <Play className="w-5 h-5 ml-0.5 fill-current" />
                  </button>

                  {/* Category Pill */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold">
                    {video.category}
                  </span>

                  {/* Duration Pill */}
                  {video.duration && (
                    <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-slate-900/90 text-white text-[10px] font-mono font-bold flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-300" />
                      <span>{video.duration}</span>
                    </span>
                  )}

                  {/* Published State (Teacher Only) */}
                  {!readOnlyStudentMode && (
                    <span
                      className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        video.published
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-amber-500 text-white shadow-xs'
                      }`}
                    >
                      {video.published ? 'Published' : 'Draft'}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {video.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {video.description}
                    </p>

                    {/* Tags */}
                    {video.tags && video.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {video.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                          >
                            <Tag className="w-2.5 h-2.5 mr-1 text-slate-400" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setActiveWatchVideo(video)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Watch Tutorial</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    {/* Admin Actions */}
                    {!readOnlyStudentMode && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => togglePublishVideo(video.id)}
                          className={`p-1.5 rounded-lg text-xs font-semibold ${
                            video.published
                              ? 'text-emerald-700 hover:bg-emerald-50'
                              : 'text-amber-700 hover:bg-amber-50'
                          }`}
                          title={video.published ? 'Unpublish video' : 'Publish video'}
                        >
                          {video.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => handleOpenEdit(video)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                          title="Edit Video"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeleteCandidate(video)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Delete Video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Watch Video Modal Player */}
      {activeWatchVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-950 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-800 relative">
            <button
              onClick={() => setActiveWatchVideo(null)}
              className="absolute top-4 right-4 z-10 text-white/80 hover:text-white bg-black/60 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video Player */}
            <div className="aspect-video w-full bg-black">
              {getYouTubeEmbedUrl(activeWatchVideo.youtube_url) ? (
                <iframe
                  src={`${getYouTubeEmbedUrl(activeWatchVideo.youtube_url)}?autoplay=1`}
                  title={activeWatchVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white p-6 text-center">
                  <Youtube className="w-12 h-12 text-rose-500 mb-2" />
                  <p className="font-bold text-sm">Direct Video Link</p>
                  <a
                    href={activeWatchVideo.youtube_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2"
                  >
                    <span>Open on YouTube / Video Source</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            {/* Video Info footer */}
            <div className="p-5 text-white">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded">
                  {activeWatchVideo.category}
                </span>
                {activeWatchVideo.duration && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    • {activeWatchVideo.duration}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold">{activeWatchVideo.title}</h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {activeWatchVideo.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Video Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-blue-600 mb-2">
              <Video className="w-5 h-5" />
              <h2 className="text-lg font-bold text-slate-900">
                {editingVideo ? 'Edit Video Tutorial' : 'Add New Video Tutorial'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Enter training tutorial details, YouTube link, and categories for student learning.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Video Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masterclass: Badminton Footwork Drills"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                  >
                    {categories.filter(c => c !== 'ALL').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Duration (MM:SS)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 08:45"
                    value={form.duration}
                    onChange={e => setForm({ ...form, duration: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  YouTube Video URL <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Youtube className="w-4 h-4 text-rose-600 absolute left-3 top-3" />
                  <input
                    type="url"
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={form.youtube_url}
                    onChange={e => setForm({ ...form, youtube_url: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>
                {form.youtube_url && getYouTubeEmbedUrl(form.youtube_url) && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Valid YouTube video detected. Embed preview enabled!</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Thumbnail Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... (auto-generated if blank)"
                  value={form.thumbnail}
                  onChange={e => setForm({ ...form, thumbnail: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Description & Coaching Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Outline key techniques, proper form, and what drills students should practice."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Footwork, Singles, Defense, Agility"
                  value={form.tags}
                  onChange={e => setForm({ ...form, tags: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Publish Toggle */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="pub-check"
                  checked={form.published}
                  onChange={e => setForm({ ...form, published: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="pub-check" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Publish immediately (visible to all students in Learn & Play)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 cursor-pointer"
                >
                  {editingVideo ? 'Save Changes' : 'Publish Tutorial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Video Tutorial?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Are you sure you want to permanently delete &ldquo;{deleteCandidate.title}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-md shadow-rose-600/25"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
