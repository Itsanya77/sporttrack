import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from './StatusBadge';
import { TeacherCreateStudentRequestModal } from './TeacherCreateStudentRequestModal';
import { 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  Clock, 
  Search, 
  Filter, 
  AlertTriangle, 
  User, 
  Calendar,
  Check,
  PlusCircle,
  ShieldCheck
} from 'lucide-react';

export const TeacherRequests: React.FC = () => {
  const { 
    requests, 
    approveRequest, 
    rejectRequest, 
    issueEquipment, 
    getUserName, 
    getEquipmentById, 
    getSportName, 
    users,
    highlightRecord,
    setHighlightRecord 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Auto-focus and scroll to request when navigated from notification
  React.useEffect(() => {
    if (highlightRecord?.recordId) {
      const match = requests.find(r => r.id === highlightRecord.recordId);
      if (match) {
        setStatusFilter('ALL');
        setSearchTerm('');
        setTimeout(() => {
          const el = document.getElementById(`request-${highlightRecord.recordId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
    }
  }, [highlightRecord?.recordId, requests]);

  // Filter requests (matching registered students by UID, email, or roll number)
  const registeredStudentIds = new Set([
    ...users.map(u => u.id),
    ...users.map(u => u.email?.toLowerCase()).filter(Boolean),
    ...users.map(u => u.student_id?.toUpperCase()).filter(Boolean),
  ]);
  const filteredRequests = requests.filter(req => {
    const studentIdentifier = req.student_id;
    const matchesRegistered = registeredStudentIds.has(studentIdentifier) || 
      registeredStudentIds.has(studentIdentifier.toLowerCase()) || 
      registeredStudentIds.has(studentIdentifier.toUpperCase());
    if (!matchesRegistered) return false;
    if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const studentName = getUserName(req.student_id).toLowerCase();
      const eq = getEquipmentById(req.equipment_id);
      const eqName = (eq?.name || (req as any).equipment_name || 'Removed item').toLowerCase();
      const eqCode = eq?.equipment_code?.toLowerCase() || '';
      if (!studentName.includes(term) && !eqName.includes(term) && !eqCode.includes(term)) {
        return false;
      }
    }
    return true;
  });

  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (requestId: string) => {
    setFeedback(null);
    setProcessingId(requestId);
    try {
      const res = await approveRequest(requestId);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to approve request.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenReject = (requestId: string) => {
    setRejectingRequestId(requestId);
    setRejectionReason('');
    setFeedback(null);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequestId) return;
    if (!rejectionReason.trim()) {
      setFeedback({ type: 'error', message: 'Rejection reason is required.' });
      return;
    }

    setProcessingId(rejectingRequestId);
    try {
      const res = await rejectRequest(rejectingRequestId, rejectionReason);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setRejectingRequestId(null);
        setRejectionReason('');
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to reject request.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleIssue = async (requestId: string) => {
    setFeedback(null);
    setProcessingId(requestId);
    try {
      const res = await issueEquipment(requestId);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to issue equipment.' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Equipment Requests Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review student requisitions, approve/reject with justifications, and record physical equipment issue.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/25 flex items-center space-x-2 transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Request for Student</span>
        </button>
      </div>

      {highlightRecord?.recordId && requests.some(r => r.id === highlightRecord.recordId) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs text-blue-900 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span className="font-semibold">Navigated from Notification:</span>
            <span>Focusing requisition #{highlightRecord.recordId}</span>
          </div>
          <button
            onClick={() => setHighlightRecord(null)}
            className="text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
          >
            Clear Highlight
          </button>
        </div>
      )}

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-2 text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search student, item, or code..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Only</option>
            <option value="APPROVED">Approved (Ready to Issue)</option>
            <option value="ISSUED">Issued</option>
            <option value="RETURNED">Returned</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No equipment requests match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Student & Course</th>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Sport</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map(req => {
                  const student = users.find(u => u.id === req.student_id);
                  const eq = getEquipmentById(req.equipment_id);
                  const isHighlighted = highlightRecord?.recordId === req.id;

                  return (
                    <tr 
                      key={req.id} 
                      id={`request-${req.id}`}
                      className={`transition-all ${
                        isHighlighted 
                          ? 'bg-blue-50/90 ring-2 ring-blue-500 shadow-sm' 
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Student Info */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-900">
                            {student?.name || 'Unknown Student'}
                          </span>
                          {isHighlighted && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider animate-pulse">
                              Linked
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          ID: <span className="font-mono font-medium">{student?.student_id || '-'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {student?.course} • Yr {student?.year} ({student?.division})
                        </div>
                        {req.request_source === 'TEACHER_CREATED' && (
                          <div className="mt-1">
                            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300" title="Created by faculty on behalf of student (Offline / Emergency)">
                              <ShieldCheck className="w-3 h-3 text-amber-700" />
                              <span>Offline Request (Faculty)</span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Equipment Info */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {eq?.name || (req as any).equipment_name || 'Removed item'}
                        </div>
                        <div className="text-xs font-mono text-slate-600 flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {eq?.equipment_code || 'Removed'}
                          </span>
                          <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            {req.quantity || 1} {(req.quantity || 1) === 1 ? 'unit' : 'units'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Stock: <span className="font-bold text-emerald-700">{eq?.available_quantity ?? 0} avail</span> / {eq?.quantity ?? 0} total
                        </div>
                      </td>

                      {/* Sport */}
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {eq ? getSportName(eq.sport_id) : '-'}
                      </td>

                      {/* Request & Expected Dates */}
                      <td className="px-4 py-3.5 text-xs">
                        <div className="text-slate-500">
                          Req: {new Date(req.created_at).toLocaleDateString()}
                        </div>
                        <div className="font-semibold text-slate-800 flex items-center space-x-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Exp: {req.expected_return}</span>
                        </div>
                      </td>

                      {/* Purpose */}
                      <td className="px-4 py-3.5 text-xs text-slate-600 max-w-xs">
                        <p className="line-clamp-2">{req.purpose}</p>
                        {req.notes && (
                          <p className="text-[11px] text-slate-500 italic mt-0.5">
                            Note: {req.notes}
                          </p>
                        )}
                        {req.rejection_reason && (
                          <p className="text-rose-600 font-medium mt-1">
                            Reason: {req.rejection_reason}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={req.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {req.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(req.id)}
                                disabled={processingId === req.id}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
                                title="Approve Request"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{processingId === req.id ? 'Approving...' : 'Approve'}</span>
                              </button>
                              <button
                                onClick={() => handleOpenReject(req.id)}
                                disabled={processingId === req.id}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-semibold border border-slate-200 disabled:opacity-50 cursor-pointer"
                                title="Reject with Reason"
                              >
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {req.status === 'APPROVED' && (
                            eq && eq.available_quantity < (req.quantity || 1) ? (
                              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-200" title="Cannot issue: available inventory is less than requested quantity">
                                Only {eq.available_quantity} available
                              </span>
                            ) : (
                              <button
                                onClick={() => handleIssue(req.id)}
                                disabled={processingId === req.id}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center space-x-1 cursor-pointer"
                                title={`Confirm physical issue of ${req.quantity || 1} units to student`}
                              >
                                <span>{processingId === req.id ? 'Issuing...' : `Issue ${req.quantity || 1} ${(req.quantity || 1) === 1 ? 'Unit' : 'Units'}`}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}

                          {req.status === 'ISSUED' && (
                            <span className="text-xs text-emerald-700 font-medium">
                              Handed Over
                            </span>
                          )}

                          {req.status === 'RETURNED' && (
                            <span className="text-xs text-slate-500 font-medium">
                              Archived in Logs
                            </span>
                          )}

                          {req.status === 'REJECTED' && (
                            <span className="text-xs text-rose-600 font-medium">
                              Closed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      {rejectingRequestId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Reject Equipment Request
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              A rejection reason is mandatory and will be displayed to the student in their portal.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="e.g., Equipment scheduled for collegiate tournament; please select alternate racket."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRejectingRequestId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency / Offline Request Modal */}
      <TeacherCreateStudentRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
