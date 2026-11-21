import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Palette, 
  Upload, 
  RefreshCw, 
  Trash2, 
  Eye, 
  Sliders, 
  Type, 
  Building, 
  CheckCircle2, 
  Image as ImageIcon,
  Sparkles,
  Trophy
} from 'lucide-react';
import defaultStadiumBg from '../assets/images/sports_stadium_bg_1789122177534.jpg';

export const LoginPageSettings: React.FC = () => {
  const { loginSettings, updateLoginSettings, resetLoginSettings } = useApp();

  // Local draft state for live preview before saving
  const [formData, setFormData] = useState({
    background_image: loginSettings.background_image || '',
    overlay_color: loginSettings.overlay_color || '#020617',
    overlay_opacity: loginSettings.overlay_opacity ?? 0.8,
    card_opacity: loginSettings.card_opacity ?? 0.95,
    college_name: loginSettings.college_name || 'Dr. Moonje Institute of Management and Computer Studies',
    welcome_text: loginSettings.welcome_text || 'Welcome to SportTrack',
    subtitle: loginSettings.subtitle || 'Sports Equipment Management System',
    college_logo_url: loginSettings.college_logo_url || '',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Preset sports backgrounds for quick 1-click selection
  const presetBackgrounds = [
    {
      name: 'Indoor Arena (Default)',
      url: defaultStadiumBg,
    },
    {
      name: 'Athletics Track & Stadium',
      url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Basketball Hardwood Court',
      url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Badminton Hall & Nets',
      url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Outdoor Football Field',
      url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1600&auto=format&fit=crop&q=80',
    },
  ];

  // Overlay color palettes
  const colorPresets = [
    { label: 'Dark Navy', color: '#020617' },
    { label: 'Deep Slate', color: '#0f172a' },
    { label: 'Charcoal Black', color: '#18181b' },
    { label: 'Midnight Blue', color: '#172554' },
    { label: 'Deep Forest', color: '#022c22' },
  ];

  // Handle local image file upload converting to DataURL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormData(prev => ({ ...prev, background_image: event.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateLoginSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleReset = () => {
    if (confirm('Reset all login page customizations to default settings?')) {
      resetLoginSettings();
      setFormData({
        background_image: '',
        overlay_color: '#020617',
        overlay_opacity: 0.8,
        card_opacity: 0.95,
        college_name: 'Dr. Moonje Institute of Management and Computer Studies',
        welcome_text: 'Welcome to SportTrack',
        subtitle: 'Sports Equipment Management System',
        college_logo_url: '',
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    }
  };

  const previewBg = formData.background_image || defaultStadiumBg;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 mb-1">
            <Palette className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Teacher / Admin Panel</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Login Page Settings & Branding</h1>
          <p className="text-sm text-slate-500 mt-1">
            Customize the public login screen background image, opacity, overlay tints, and institutional slogans.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save & Apply Changes</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-3 text-emerald-800 text-sm font-semibold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Login page settings saved! These changes immediately reflect on the public login page.</span>
        </div>
      )}

      {/* Main Layout: Config Form + Live Real-Time Interactive Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Settings Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Background Image Upload & Presets */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 mb-4">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <span>Background Image Customization</span>
            </h2>

            <div className="space-y-4">
              {/* File upload input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Upload Custom Image
                </label>
                <div className="flex items-center space-x-3">
                  <label className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Choose Image File</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </label>

                  {formData.background_image && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, background_image: '' }))}
                      className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Revert to Default Stadium</span>
                    </button>
                  )}
                </div>
                {uploadError && (
                  <p className="text-xs text-rose-600 font-semibold mt-1">
                    {uploadError}
                  </p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  Supported formats: JPG, PNG, WebP. High resolution landscape images recommended.
                </p>
              </div>

              {/* Or enter Image URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Or Image Web URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.background_image}
                  onChange={e => setFormData(prev => ({ ...prev, background_image: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>

              {/* Preset Background Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Or Select a Pre-Packaged Sports Theme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {presetBackgrounds.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, background_image: preset.url }))}
                      className={`relative rounded-xl overflow-hidden border-2 text-left transition-all p-1 group ${
                        formData.background_image === preset.url || (!formData.background_image && idx === 0)
                          ? 'border-blue-600 shadow-md ring-2 ring-blue-400/30'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="h-16 w-full rounded-lg overflow-hidden bg-slate-900 relative">
                        <img 
                          src={preset.url} 
                          alt={preset.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        <div className="absolute inset-0 bg-black/40" />
                        <span className="absolute bottom-1 left-1.5 right-1.5 text-[10px] font-bold text-white truncate drop-shadow-sm">
                          {preset.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Transparency & Tint Controls */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 mb-4">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Overlay Opacity & Color Tint</span>
            </h2>

            <div className="space-y-4">
              {/* Opacity slider */}
              <div>
                <div className="flex justify-between items-center mb-1 text-xs font-bold">
                  <span className="text-slate-700 uppercase">Dark Overlay Opacity</span>
                  <span className="text-blue-600 font-mono font-black">
                    {Math.round(formData.overlay_opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.95"
                  step="0.05"
                  value={formData.overlay_opacity}
                  onChange={e => setFormData(prev => ({ ...prev, overlay_opacity: parseFloat(e.target.value) }))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Transparent (10%)</span>
                  <span>Balanced Contrast (80%)</span>
                  <span>Opaque (95%)</span>
                </div>
              </div>

              {/* Card transparency slider */}
              <div>
                <div className="flex justify-between items-center mb-1 text-xs font-bold">
                  <span className="text-slate-700 uppercase">Login Card Opacity / Glass Effect</span>
                  <span className="text-blue-600 font-mono font-black">
                    {Math.round(formData.card_opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.70"
                  max="1.0"
                  step="0.02"
                  value={formData.card_opacity}
                  onChange={e => setFormData(prev => ({ ...prev, card_opacity: parseFloat(e.target.value) }))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Overlay Color Palette
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {colorPresets.map(preset => (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, overlay_color: preset.color }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-2 border transition-all ${
                        formData.overlay_color === preset.color
                          ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span 
                        className="w-3.5 h-3.5 rounded-full border border-white shadow-xs" 
                        style={{ backgroundColor: preset.color }}
                      />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="color"
                    value={formData.overlay_color}
                    onChange={e => setFormData(prev => ({ ...prev, overlay_color: e.target.value }))}
                    className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.overlay_color}
                    onChange={e => setFormData(prev => ({ ...prev, overlay_color: e.target.value }))}
                    className="w-28 px-2 py-1 text-xs rounded-lg border border-slate-300 font-mono"
                  />
                  <span className="text-[11px] text-slate-400">Custom hex code</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Headings & Logos */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 mb-4">
              <Type className="w-4 h-4 text-blue-600" />
              <span>Institutional Branding & Text</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  College / Institution Name
                </label>
                <input
                  type="text"
                  value={formData.college_name}
                  onChange={e => setFormData(prev => ({ ...prev, college_name: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Welcome Heading
                </label>
                <input
                  type="text"
                  value={formData.welcome_text}
                  onChange={e => setFormData(prev => ({ ...prev, welcome_text: e.target.value }))}
                  placeholder="Welcome to SportTrack"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Subtitle Slogan
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={e => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Sports Equipment Management System"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  College Emblem / Logo URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="/college_logo.jpg (Dr. Moonje Institute Official Emblem)"
                    value={formData.college_logo_url}
                    onChange={e => setFormData(prev => ({ ...prev, college_logo_url: e.target.value }))}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, college_logo_url: '/college_logo.jpg' }))}
                    className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors whitespace-nowrap"
                  >
                    Reset to DMIMCS Emblem
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Currently loaded: Dr. Moonje Institute of Management & Computer Studies Official Logo
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Interactive Miniature Preview */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Live Public Login Preview</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Real-Time</span>
              </span>
            </div>

            {/* Simulated Miniature Login Stage */}
            <div 
              className="relative w-full rounded-2xl overflow-hidden shadow-inner border border-slate-800 flex flex-col items-center justify-center p-4 min-h-[460px] bg-cover bg-center transition-all duration-300"
              style={{ backgroundImage: `url(${previewBg})` }}
            >
              {/* Dynamic Overlay Preview */}
              <div 
                className="absolute inset-0 transition-all pointer-events-none"
                style={{ 
                  backgroundColor: formData.overlay_color,
                  opacity: formData.overlay_opacity
                }}
              />

              {/* Dynamic Preview Login Card */}
              <div 
                className="relative z-10 w-full max-w-xs rounded-xl p-4 shadow-xl border border-white/20 backdrop-blur-xs flex flex-col items-center text-center transition-all"
                style={{ 
                  backgroundColor: `rgba(255, 255, 255, ${formData.card_opacity})` 
                }}
              >
                {/* Logo */}
                <div className="p-1 rounded-xl bg-white border border-slate-200 shadow-sm mb-2 w-10 h-10 flex items-center justify-center overflow-hidden">
                  <img 
                    src={formData.college_logo_url || '/college_logo.jpg'} 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="text-sm font-black text-slate-900 tracking-tight">
                  SportTrack
                </div>
                <div className="text-[9px] font-bold text-blue-600 uppercase tracking-wider line-clamp-1">
                  {formData.college_name}
                </div>
                <div className="text-[10px] text-slate-500 line-clamp-1 mb-3">
                  {formData.subtitle}
                </div>

                {/* Single unified inputs preview */}
                <div className="w-full space-y-2 mb-3">
                  <div className="w-full h-7 bg-slate-100/90 rounded-lg border border-slate-200 flex items-center px-2 text-[10px] text-slate-400">
                    Email, Username, or Student ID
                  </div>
                  <div className="w-full h-7 bg-slate-100/90 rounded-lg border border-slate-200 flex items-center px-2 text-[10px] text-slate-400">
                    ••••••••
                  </div>
                </div>

                {/* Unified Sign In button preview */}
                <div className="w-full py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold shadow-xs">
                  Sign In
                </div>
              </div>

              {/* Bottom text */}
              <div className="relative z-10 mt-3 text-[9px] text-white/80 font-medium text-center">
                {formData.welcome_text}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Preview reflects public visitor view</span>
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Apply Live
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
