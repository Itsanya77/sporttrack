import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from './StatusBadge';
import { 
  Clock, 
  PlusCircle, 
  Calendar, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Package, 
  History 
} from 'lucide-react';

interface StudentRequestsProps {
  onRequestNewClick: () => void;
}

export const StudentRequests: React.FC<StudentRequestsProps> = ({ onRequestNewClick }) => {
  const { 
    currentUser, 
    requests, 
    issueRecords, 
    getEquipmentById, 
    getSportName,
    highlightRecord,
    setHighlightRecord,
    cancelRequest
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'history'>('requests');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirmCancel = async (requestId: string) => {
    setIsProcessing(true);
    setActionFeedback(null);
    try {
      const res = await cancelRequest(requestId, 'Cancelled by student');
      if (res.success) {
        setActionFeedback({ type: 'success', message: 'Equipment request successfully cancelled.' });
        setCancellingRequestId(null);
        setTimeout(() => setActionFeedback(null), 3500);
      } else {
        setActionFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err?.message || 'Failed to cancel request.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-focus and scroll to requested record from notification
  React.useEffect(() => {
    if (highlightRecord?.recordId) {
      const isReq = requests.some(r => r.id === highlightRecord.recordId);
      const isHist = issueRecords.some(i => i.id === highlightRecord.recordId);
      if (isReq) {
        setActiveSubTab('requests');
        setFilterStatus('ALL');
        setTimeout(() => {
          const el = document.getElementById(`student-req-${highlightRecord.recordId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      } else if (isHist) {
        setActiveSubTab('history');
        setTimeout(() => {
          const el = document.getElementById(`student-hist-${highlightRecord.recordId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
    }
  }, [highlightRecord?.recordId, requests, issueRecords]);

  if (!currentUser) return null;

  // Strict student isolation supporting UID, email, or student roll number
  const isStudentMatch = (studentId: string | undefined) => {
    if (!studentId || !currentUser) return false;
    return (
      studentId === currentUser.id ||
      (Boolean(currentUser.email) && studentId.toLowerCase() === currentUser.email.toLowerCase()) ||
      (Boolean(currentUser.student_id) && studentId.toUpperCase() === (currentUser.student_id || '').toUpperCase())
    );
  };

  const myRequests = requests.filter(r => isStudentMatch(r.student_id));
  const myIssues = issueRecords.filter(i => isStudentMatch(i.student_id));

  const filteredRequests = myRequests.filter(req => {
    if (filterStatus !== 'ALL' && req.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>My Equipment Requisitions & Log</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track requisition statuses, approval notifications, and past sports borrowing history.
          </p>
        </div>

        <button
          onClick={onRequestNewClick}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Equipment Request</span>
        </button>
      </div>

      {highlightRecord?.recordId && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs text-blue-900 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span className="font-semibold">Navigated from Notification:</span>
            <span>Focusing record #{highlightRecord.recordId}</span>
          </div>
          <button
            onClick={() => setHighlightRecord(null)}
            className="text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
          >
            Clear Highlight
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setActiveSubTab('requests')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeSubTab === 'requests'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Borrow Requests ({myRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeSubTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historical Issue Records ({myIssues.length})</span>
        </button>
      </div>

      {activeSubTab === 'requests' ? (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600">Filter Status:</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white"
            >
              <option value="ALL">All Requests</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved (Ready to collect)</option>
              <option value="ISSUED">Issued / Active</option>
              <option value="RETURNED">Returned</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {actionFeedback && (
            <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center space-x-2 ${
              actionFeedback.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {actionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{actionFeedback.message}</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No requests found under this status.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Equipment</th>
                      <th className="px-4 py-3">Sport</th>
                      <th className="px-4 py-3">Submitted On</th>
                      <th className="px-4 py-3">Expected Return</th>
                      <th className="px-4 py-3">Purpose</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Department Remark</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.map(req => {
                      const eq = getEquipmentById(req.equipment_id);
                      const isHighlighted = highlightRecord?.recordId === req.id;
                      const isConfirmingCancel = cancellingRequestId === req.id;

                      return (
                        <tr 
                          key={req.id} 
                          id={`student-req-${req.id}`}
                          className={`transition-all ${
                            isHighlighted 
                              ? 'bg-blue-50/90 ring-2 ring-blue-500 shadow-sm' 
                              : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            <div className="flex items-center space-x-2">
                              <span>{eq?.name || (req as any).equipment_name || 'Removed item'}</span>
                              {isHighlighted && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider animate-pulse">
                                  Linked
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-mono text-slate-500 font-normal flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span>{eq?.equipment_code || 'Removed'}</span>
                              <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 text-[11px]">
                                {req.quantity || 1} {(req.quantity || 1) === 1 ? 'unit' : 'units'}
                              </span>
                              {req.request_source === 'TEACHER_CREATED' && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200" title="Created on your behalf by faculty (Offline Requisition)">
                                  Created by Faculty
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            {eq ? getSportName(eq.sport_id) : '-'}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {new Date(req.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-700 font-medium">
                            {req.expected_return}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">
                            {req.purpose}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={req.status} />
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {req.rejection_reason ? (
                              <span className="text-rose-600 font-medium">
                                {req.rejection_reason}
                              </span>
                            ) : req.status === 'APPROVED' ? (
                              <span className="text-emerald-700 font-medium">
                                Approved! Please collect equipment from Sports Department Room 102.
                              </span>
                            ) : req.status === 'ISSUED' ? (
                              <span className="text-blue-700 font-medium">
                                In your custody
                              </span>
                            ) : req.status === 'CANCELLED' ? (
                              <span className="text-slate-500 italic">
                                {req.teacher_remarks || 'Cancelled by requester'}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Under review by Sports In-charge</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {req.status === 'PENDING' ? (
                              isConfirmingCancel ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleConfirmCancel(req.id)}
                                    disabled={isProcessing}
                                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
                                  >
                                    {isProcessing ? 'Cancelling...' : 'Confirm'}
                                  </button>
                                  <button
                                    onClick={() => setCancellingRequestId(null)}
                                    disabled={isProcessing}
                                    className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                                  >
                                    Back
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setCancellingRequestId(req.id)}
                                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                                  title="Cancel this pending request"
                                >
                                  Cancel Request
                                </button>
                              )
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Historical Issues for Student */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {myIssues.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No historical issue records logged.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Equipment</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Issued On</th>
                    <th className="px-4 py-3">Expected Return</th>
                    <th className="px-4 py-3">Returned On</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myIssues.map(issue => {
                    const eq = getEquipmentById(issue.equipment_id);
                    const isHighlighted = highlightRecord?.recordId === issue.id;

                    return (
                      <tr 
                        key={issue.id} 
                        id={`student-hist-${issue.id}`}
                        className={`transition-all ${
                          isHighlighted 
                            ? 'bg-blue-50/90 ring-2 ring-blue-500 shadow-sm' 
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <div className="flex items-center space-x-2">
                            <span>{eq?.name || (issue as any).equipment_name || 'Removed item'}</span>
                            {isHighlighted && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider animate-pulse">
                                Linked
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-bold text-blue-700 mt-0.5">
                            {issue.quantity || 1} {(issue.quantity || 1) === 1 ? 'unit' : 'units'}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">
                          {eq?.equipment_code || 'Removed'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(issue.issued_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-700">
                          {issue.expected_return}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {issue.actual_return ? (
                            <span className="text-emerald-700 font-medium">
                              {new Date(issue.actual_return).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not returned yet</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={issue.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
