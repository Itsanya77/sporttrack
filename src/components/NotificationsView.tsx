import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  Trash2, 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  Send,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationsViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigateTab }) => {
  const { 
    currentUser, 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    clearAllNotifications, 
    addNotification,
    resolveNotificationTarget,
    navigateToNotification,
    setHighlightRecord
  } = useApp();

  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'WARNING'>('ALL');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastRole, setBroadcastRole] = useState<AppNotification['target_role']>('STUDENT');
  const [broadcastTab, setBroadcastTab] = useState<string>('equipment');
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);

  // Filter based on user's role
  const relevantNotifications = notifications.filter(n => {
    if (!currentUser) return false;
    if (n.target_role !== 'ALL' && n.target_role !== currentUser.role) return false;
    if (filter === 'UNREAD') return !n.read;
    if (filter === 'WARNING') return n.type === 'WARNING' || n.type === 'ALERT';
    return true;
  });

  const unreadCount = notifications.filter(n => {
    if (!currentUser) return false;
    if (n.target_role !== 'ALL' && n.target_role !== currentUser.role) return false;
    return !n.read;
  }).length;

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    addNotification(
      broadcastTitle.trim(), 
      broadcastMessage.trim(), 
      'INFO', 
      broadcastRole,
      broadcastTab,
      undefined,
      'GENERAL'
    );
    setBroadcastTitle('');
    setBroadcastMessage('');
    setShowBroadcastForm(false);
  };

  /**
   * Resolves the navigation destination tab and action label with strict Role-Based Access Control
   */
  const resolveTarget = (item: AppNotification): { tab: string; label: string; recordId?: string; type?: string } => {
    return resolveNotificationTarget(item, currentUser?.role);
  };

  /**
   * Action when clicking a notification
   */
  const handleNotificationClick = (item: AppNotification) => {
    navigateToNotification(item, onNavigateTab);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 mb-1">
            <Bell className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Department Broadcasts & Alerts</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            Click any notification to navigate directly to its related requisition, return, or inventory record.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {currentUser?.role === 'TEACHER' && (
            <button
              onClick={() => setShowBroadcastForm(!showBroadcastForm)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Notice</span>
            </button>
          )}

          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="px-3.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors"
              title="Mark all notifications as read"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark All Read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
              title="Clear all notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Broadcast Form (Teacher Only) */}
      {showBroadcastForm && currentUser?.role === 'TEACHER' && (
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-blue-200 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 text-blue-700">
            <Sparkles className="w-5 h-5" />
            <h3 className="text-sm font-bold">Compose Department Broadcast</h3>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Notice Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Return Deadline: Cricket Bats Maintenance Inspection"
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Target Audience</label>
                <select
                  value={broadcastRole}
                  onChange={e => setBroadcastRole(e.target.value as AppNotification['target_role'])}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                >
                  <option value="STUDENT">Students Only</option>
                  <option value="TEACHER">Faculty & Staff Only</option>
                  <option value="ALL">Everyone</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Notice Details</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Write message to appear in the recipient's notification bell..."
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Link Destination</label>
                <select
                  value={broadcastTab}
                  onChange={e => setBroadcastTab(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                >
                  <option value="equipment">Equipment Inventory</option>
                  <option value="requests">Equipment Requests</option>
                  <option value="returns">Returns Desk</option>
                  <option value="learn">Learn & Play Videos</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowBroadcastForm(false)}
                className="px-3 py-1.5 rounded-lg text-slate-500 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 cursor-pointer"
              >
                Dispatch Broadcast
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            filter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Notices ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            filter === 'UNREAD' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('WARNING')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            filter === 'WARNING' ? 'bg-amber-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Alerts & Reminders
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {relevantNotifications.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No Notifications</h3>
            <p className="text-xs text-slate-400 mt-1">You are all caught up with sports department notices.</p>
          </div>
        ) : (
          relevantNotifications.map(item => {
            const target = resolveTarget(item);

            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
                  item.read
                    ? 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                    : 'bg-blue-50/50 border-blue-200 hover:border-blue-400 shadow-xs hover:shadow-md'
                }`}
                title={`Click to open ${target.label}`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className="shrink-0 mt-0.5">
                    {item.type === 'ALERT' ? (
                      <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                    ) : item.type === 'WARNING' ? (
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    ) : item.type === 'SUCCESS' ? (
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                        <Info className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center space-x-2 min-w-0">
                        <h4 className={`text-xs font-bold truncate ${item.read ? 'text-slate-800' : 'text-slate-900 font-extrabold'}`}>
                          {item.title}
                        </h4>
                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" title="Unread notice" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center space-x-1 font-mono shrink-0">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>
                  </div>
                </div>

                {/* Clickable Destination Action Bar */}
                <div className="mt-3 pt-2.5 border-t border-slate-100/90 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-blue-600 font-bold group-hover:text-blue-700 group-hover:underline transition-colors text-[11px]">
                    <span>{target.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>

                  <div className="flex items-center space-x-2">
                    {target.type && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                        {target.type}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 italic group-hover:text-slate-600">
                      Click to navigate
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

