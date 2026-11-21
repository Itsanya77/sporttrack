import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { FeedbackType, FeedbackItem } from '../types';
import { StatusBadge } from './StatusBadge';
import { auth, isFirebaseConfigured } from '../firebase';
import { subscribeToFirestoreFeedback } from '../services/firestoreService';
import { 
  MessageSquarePlus, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Package, 
  HelpCircle, 
  Lightbulb, 
  Wrench,
  Clock,
  UserCheck
} from 'lucide-react';

export const StudentFeedbackView: React.FC = () => {
  const { currentUser, feedback: contextFeedback, submitFeedback } = useApp();

  const [type, setType] = useState<FeedbackType>('EQUIPMENT_NEEDED');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [equipmentName, setEquipmentName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Realtime listener list for the logged-in student
  const [realtimeFeedback, setRealtimeFeedback] = useState<FeedbackItem[]>([]);

  const studentUid = auth?.currentUser?.uid || currentUser?.id || '';

  useEffect(() => {
    if (!currentUser || !studentUid) return;

    if (isFirebaseConfigured) {
      const unsubscribe = subscribeToFirestoreFeedback((items) => {
        setRealtimeFeedback(items);
      }, studentUid);

      return () => {
        unsubscribe();
      };
    }
  }, [studentUid, currentUser]);

  // Combine real-time listener items or fallback to context items matching student
  const isStudentMatch = (item: FeedbackItem) => {
    if (!currentUser) return false;
    return (
      item.student_id === studentUid ||
      item.student_id === currentUser.id ||
      (Boolean(currentUser.email) && item.student_id.toLowerCase() === (currentUser.email || '').toLowerCase()) ||
      (Boolean(currentUser.student_id) && item.student_roll.toUpperCase() === (currentUser.student_id || '').toUpperCase())
    );
  };

  const displayedFeedback = (realtimeFeedback.length > 0 ? realtimeFeedback : contextFeedback)
    .filter(isStudentMatch)
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  if (!currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Client-side validations
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!cleanSubject) {
      setErrorMessage('Please provide a subject line.');
      return;
    }
    if (cleanSubject.length > 100) {
      setErrorMessage('Subject cannot exceed 100 characters.');
      return;
    }

    if (!cleanMessage) {
      setErrorMessage('Please provide a detailed message.');
      return;
    }
    if (cleanMessage.length > 1000) {
      setErrorMessage('Message cannot exceed 1000 characters.');
      return;
    }

    if (type === 'EQUIPMENT_NEEDED') {
      if (!equipmentName.trim()) {
        setErrorMessage('Please specify the name of the equipment you need.');
        return;
      }
      if (!quantity || quantity < 1) {
        setErrorMessage('Quantity must be at least 1 unit.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const res = await submitFeedback({
        type,
        subject: cleanSubject,
        message: cleanMessage,
        equipment_name: type === 'EQUIPMENT_NEEDED' ? equipmentName.trim() : undefined,
        quantity: type === 'EQUIPMENT_NEEDED' ? quantity : undefined,
      });

      if (res.success) {
        setSuccessMessage(res.message);
        // Reset form
        setSubject('');
        setMessage('');
        setEquipmentName('');
        setQuantity(1);
        setType('EQUIPMENT_NEEDED');
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An error occurred while submitting feedback.');
    } finally {
      setIsSubmitting(false);
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
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
            <MessageSquarePlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Feedback Box & Gear Requisitions
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Report equipment issues, suggest facility upgrades, or ask the Sports Department to procure new gear.
            </p>
          </div>
        </div>
      </div>

      {/* Submission Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <span>Submit New Feedback or Gear Request</span>
          </h2>
          <span className="text-[11px] text-slate-500">
            Logged as: <strong className="text-slate-700">{currentUser.name}</strong> ({currentUser.student_id || 'Student'})
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Feedback Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Category of Feedback <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'EQUIPMENT_NEEDED', label: 'Equipment Needed', icon: Package, desc: 'Ask for unstocked gear' },
                { id: 'PROBLEM', label: 'Report a Problem', icon: Wrench, desc: 'Broken gear or facility issue' },
                { id: 'SUGGESTION', label: 'Suggestion', icon: Lightbulb, desc: 'Ideas for improvements' },
                { id: 'OTHER', label: 'Other Query', icon: HelpCircle, desc: 'General inquiry' },
              ].map(opt => {
                const Icon = opt.icon;
                const isSelected = type === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setType(opt.id as FeedbackType)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 text-blue-900'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold">{opt.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Gear Name & Quantity for EQUIPMENT_NEEDED */}
          {type === 'EQUIPMENT_NEEDED' && (
            <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Requested Equipment Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={equipmentName}
                  onChange={e => setEquipmentName(e.target.value)}
                  placeholder="e.g. Badminton Grip Tape, Stopwatches, Cones, Table Tennis Nets"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Quantity Needed <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white font-medium"
                />
              </div>
            </div>
          )}

          {/* Subject Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Subject Line <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] font-mono ${subject.length > 90 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                {subject.length}/100
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={100}
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Need additional practice balls for badminton nets"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            />
          </div>

          {/* Message Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Detailed Message / Explanation <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] font-mono ${message.length > 900 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                {message.length}/1000
              </span>
            </div>
            <textarea
              required
              rows={4}
              maxLength={1000}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Please describe the context, requirement, or problem in detail so faculty can take appropriate action..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-normal leading-relaxed resize-y"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-700 hover:text-emerald-900 text-[11px] font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting to Sports Dept...' : 'Submit Feedback'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* "My Feedback" List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>My Submitted Feedback & Replies ({displayedFeedback.length})</span>
          </h2>
          <span className="text-xs text-slate-400">Live synchronized</span>
        </div>

        {displayedFeedback.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
            <MessageSquarePlus className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-slate-600">No feedback submitted yet</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Use the form above whenever you notice equipment issues or would like to request new gear for college sports.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedFeedback.map(item => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5 hover:border-slate-300 transition-colors"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {getTypeIcon(item.type)}
                      <span className="ml-1">{getTypeLabel(item.type)}</span>
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{item.subject}</h3>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <StatusBadge status={item.status} />
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Requested gear pill if applicable */}
                {item.type === 'EQUIPMENT_NEEDED' && item.equipment_name && (
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-900">
                    <Package className="w-3.5 h-3.5 text-blue-600" />
                    <span>Requested Item: <strong>{item.equipment_name}</strong></span>
                    {item.quantity && (
                      <span className="px-1.5 py-0.2 bg-blue-200/60 rounded text-[10px]">
                        Qty: {item.quantity}
                      </span>
                    )}
                  </div>
                )}

                {/* Message body */}
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {item.message}
                </p>

                {/* Faculty reply card when present */}
                {item.reply ? (
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between text-emerald-900 font-bold text-[11px]">
                      <div className="flex items-center space-x-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Reply from Sports Department ({item.replied_by || 'Faculty In-Charge'})</span>
                      </div>
                      {item.replied_at && (
                        <span className="text-[10px] text-emerald-700 font-normal">
                          {new Date(item.replied_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-emerald-800 leading-relaxed font-medium">
                      "{item.reply}"
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 italic">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Under review by Sports In-Charge — Reply will appear here.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
