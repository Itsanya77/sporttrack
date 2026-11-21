import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FeedbackType, FeedbackStatus, FeedbackItem } from '../types';
import { StatusBadge } from './StatusBadge';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Package, 
  Wrench, 
  Lightbulb, 
  HelpCircle, 
  Clock, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Hash, 
  MessageCircle,
  Check
} from 'lucide-react';

export const TeacherFeedbackView: React.FC = () => {
  const { feedback, replyFeedback } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Tracking in-progress replies per item
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [statusDrafts, setStatusDrafts] = useState<Record<string, FeedbackStatus>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<{ id: string; message: string } | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<{ id: string; message: string } | null>(null);

  // Counters
  const totalCount = feedback.length;
  const newCount = feedback.filter(f => f.status === 'NEW').length;
  const inReviewCount = feedback.filter(f => f.status === 'IN_REVIEW').length;
  const resolvedCount = feedback.filter(f => f.status === 'RESOLVED').length;
  const equipmentReqCount = feedback.filter(f => f.type === 'EQUIPMENT_NEEDED').length;

  // Filtered feedback
  const filteredFeedback = feedback.filter(item => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = item.student_name?.toLowerCase().includes(term);
      const matchRoll = item.student_roll?.toLowerCase().includes(term);
      const matchSubject = item.subject?.toLowerCase().includes(term);
      const matchEquip = item.equipment_name?.toLowerCase().includes(term);
      const matchMsg = item.message?.toLowerCase().includes(term);
      if (!matchName && !matchRoll && !matchSubject && !matchEquip && !matchMsg) {
        return false;
      }
    }

    return true;
  });

  const handleReplyChange = (id: string, text: string) => {
    setReplyDrafts(prev => ({ ...prev, [id]: text }));
  };

  const handleStatusChange = (id: string, newStatus: FeedbackStatus) => {
    setStatusDrafts(prev => ({ ...prev, [id]: newStatus }));
  };

  const handleSaveReply = async (item: FeedbackItem) => {
    const selectedStatus = statusDrafts[item.id] || item.status;
    const replyText = replyDrafts[item.id] !== undefined ? replyDrafts[item.id] : (item.reply || '');

    setSavingId(item.id);
    setErrorFeedback(null);
    setSuccessFeedback(null);

    try {
      const res = await replyFeedback(item.id, selectedStatus, replyText);
      if (res.success) {
        setSuccessFeedback({ id: item.id, message: 'Reply saved and student notified!' });
        setTimeout(() => {
          setSuccessFeedback(null);
        }, 3500);
      } else {
        setErrorFeedback({ id: item.id, message: res.message });
      }
    } catch (err: any) {
      setErrorFeedback({ id: item.id, message: err?.message || 'Failed to update feedback.' });
    } finally {
      setSavingId(null);
    }
  };

  const getTypeIcon = (t: FeedbackType) => {
    switch (t) {
      case 'EQUIPMENT_NEEDED':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'PROBLEM':
        return <Wrench className="w-4 h-4 text-rose-600" />;
      case 'SUGGESTION':
        return <Lightbulb className="w-4 h-4 text-amber-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-600" />;
    }
  };

  const getTypeLabel = (t: FeedbackType) => {
    switch (t) {
      case 'EQUIPMENT_NEEDED':
        return 'Equipment Request';
      case 'PROBLEM':
        return 'Problem Report';
      case 'SUGGESTION':
        return 'Facility Suggestion';
      default:
        return 'General Query';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span>Student Feedback & Equipment Requisitions Desk</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student reports, unstocked equipment requests, and send direct administrative replies.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">Total Received</div>
          <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
          <div className="text-[10px] text-slate-400 font-medium">All student entries</div>
        </div>

        <div className={`p-3.5 rounded-xl border shadow-xs ${
          newCount > 0 ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'
        }`}>
          <div className="text-xs font-semibold text-blue-700 mb-1">New Submissions</div>
          <div className="text-2xl font-bold text-blue-800">{newCount}</div>
          <div className="text-[10px] text-blue-600 font-medium">Awaiting first response</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
          <div className="text-xs font-semibold text-amber-700 mb-1">In Review</div>
          <div className="text-2xl font-bold text-amber-800">{inReviewCount}</div>
          <div className="text-[10px] text-amber-600 font-medium">Under discussion</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs">
          <div className="text-xs font-semibold text-emerald-700 mb-1">Resolved</div>
          <div className="text-2xl font-bold text-emerald-800">{resolvedCount}</div>
          <div className="text-[10px] text-emerald-600 font-medium">Completed & answered</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-xs">
          <div className="text-xs font-semibold text-purple-700 mb-1">Equipment Needed</div>
          <div className="text-2xl font-bold text-purple-800">{equipmentReqCount}</div>
          <div className="text-[10px] text-purple-600 font-medium">Procurement requests</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by student, ID, subject, or item..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2.5 w-full md:w-auto flex-wrap">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-600">Type:</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="EQUIPMENT_NEEDED">Equipment Needed</option>
              <option value="PROBLEM">Problem Report</option>
              <option value="SUGGESTION">Suggestion</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      {filteredFeedback.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
          <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2 opacity-80" />
          <p className="font-semibold text-slate-700">No feedback items match the selected filters</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {feedback.length === 0 ? 'No students have submitted feedback yet.' : 'Try adjusting the search query or status filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedback.map(item => {
            const currentSelectedStatus = statusDrafts[item.id] || item.status;
            const currentReplyText = replyDrafts[item.id] !== undefined ? replyDrafts[item.id] : (item.reply || '');
            const isSaving = savingId === item.id;
            const hasError = errorFeedback?.id === item.id;
            const hasSuccess = successFeedback?.id === item.id;

            return (
              <div
                key={item.id}
                id={`feedback-card-${item.id}`}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden hover:border-slate-300 transition-colors"
              >
                {/* Header Strip */}
                <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5 flex-wrap">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-white border border-slate-200 text-slate-700">
                      {getTypeIcon(item.type)}
                      <span className="ml-1">{getTypeLabel(item.type)}</span>
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{item.subject}</h3>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <StatusBadge status={item.status} />
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-5 space-y-4">
                  {/* Student metadata */}
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <span className="flex items-center space-x-1 font-semibold text-slate-700">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>{item.student_name}</span>
                    </span>
                    <span className="flex items-center space-x-1 font-mono">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      <span>Roll ID: {item.student_roll || 'N/A'}</span>
                    </span>
                  </div>

                  {/* Highlight for equipment requests */}
                  {item.type === 'EQUIPMENT_NEEDED' && item.equipment_name && (
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs font-semibold text-blue-900">
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Requested Item: <strong className="text-blue-950 font-bold">{item.equipment_name}</strong></span>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-200/80 rounded font-bold text-blue-900 text-[11px]">
                        Quantity: {item.quantity || 1} units
                      </span>
                    </div>
                  )}

                  {/* Student Message */}
                  <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Student's Note
                    </span>
                    {item.message}
                  </div>

                  {/* Interactive Faculty Actions & Reply Box */}
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
                        <span>Faculty Status & Reply</span>
                      </label>

                      {/* Status Selector */}
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-semibold text-slate-500">Update Status:</span>
                        <select
                          value={currentSelectedStatus}
                          onChange={e => handleStatusChange(item.id, e.target.value as FeedbackStatus)}
                          className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="NEW">NEW</option>
                          <option value="IN_REVIEW">IN_REVIEW</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={currentReplyText}
                      onChange={e => handleReplyChange(item.id, e.target.value)}
                      placeholder="Type reply or procurement decision to inform the student..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-normal leading-relaxed resize-y bg-white"
                    />

                    {/* Feedback messages */}
                    {hasError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-semibold flex items-center space-x-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{errorFeedback.message}</span>
                      </div>
                    )}

                    {hasSuccess && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center space-x-1.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{successFeedback.message}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      {item.replied_by && (
                        <span className="text-[11px] text-slate-400">
                          Last replied by: <strong className="text-slate-600">{item.replied_by}</strong> on {item.replied_at ? new Date(item.replied_at).toLocaleDateString() : 'N/A'}
                        </span>
                      )}
                      <div className="ml-auto">
                        <button
                          onClick={() => handleSaveReply(item)}
                          disabled={isSaving}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Send className="w-3 h-3" />
                          <span>{isSaving ? 'Saving & Syncing...' : 'Save Reply & Notify Student'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
