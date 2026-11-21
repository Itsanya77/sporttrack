import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from './StatusBadge';
import { EquipmentCondition, ReturnInspectionOutcome } from '../types';
import { 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  ShieldCheck, 
  Check, 
  Calendar 
} from 'lucide-react';

export const TeacherReturns: React.FC = () => {
  const { 
    returnRecords, 
    issueRecords, 
    acceptReturn, 
    getEquipmentById, 
    getUserName, 
    getSportName, 
    users,
    highlightRecord,
    setHighlightRecord 
  } = useApp();

  const [activeInspectReturnId, setActiveInspectReturnId] = useState<string | null>(null);
  const [condition, setCondition] = useState<ReturnInspectionOutcome>('GOOD');
  const [remarks, setRemarks] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registeredStudentIds = new Set(users.map(u => u.id));
  const pendingReturns = returnRecords.filter(r => r.status === 'RETURN_PENDING' && registeredStudentIds.has(r.student_id));
  const pastReturns = returnRecords.filter(r => r.status === 'RETURNED' && registeredStudentIds.has(r.student_id));

  // Auto-focus or open return when navigated from notification
  React.useEffect(() => {
    if (highlightRecord?.recordId) {
      const matchPending = pendingReturns.find(
        r => r.id === highlightRecord.recordId || r.issue_id === highlightRecord.recordId
      );
      if (matchPending) {
        // Automatically open the inspection desk modal for direct verification!
        setActiveInspectReturnId(matchPending.id);
      } else {
        setTimeout(() => {
          const el = document.getElementById(`return-${highlightRecord.recordId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
    }
  }, [highlightRecord?.recordId, returnRecords]);

  const handleOpenInspect = (returnId: string) => {
    setActiveInspectReturnId(returnId);
    setCondition('GOOD');
    setRemarks('');
    setFeedback(null);
  };

  const handleAcceptReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInspectReturnId || isSubmitting) return;

    if (condition === 'LOST' && !remarks.trim()) {
      setFeedback({ type: 'error', message: 'Inspection remarks are required when recording equipment as LOST (e.g. details of loss reported by student).' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await acceptReturn(activeInspectReturnId, condition, remarks);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setActiveInspectReturnId(null);
        setRemarks('');
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to complete return inspection.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <RotateCcw className="w-5 h-5 text-orange-600" />
          <span>Equipment Return & Inspection Desk</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Verify physical equipment condition (Good, Fair, Damaged), record remarks, and complete return transactions.
        </p>
      </div>

      {highlightRecord?.recordId && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center justify-between text-xs text-orange-950 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-orange-600 animate-ping" />
            <span className="font-semibold">Navigated from Notification:</span>
            <span>Focusing return transaction #{highlightRecord.recordId}</span>
          </div>
          <button
            onClick={() => setHighlightRecord(null)}
            className="text-orange-800 hover:text-orange-950 font-bold underline cursor-pointer"
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
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Pending Return Requests (Awaiting physical check) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
              <span>Pending Returns at Sports Counter ({pendingReturns.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Equipment brought back by students waiting for teacher inspection.
            </p>
          </div>
        </div>

        {pendingReturns.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-80" />
            No pending returns at the counter right now. All handed equipment has been inspected.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Sport</th>
                  <th className="px-4 py-3">Return Requested</th>
                  <th className="px-4 py-3">Current Status</th>
                  <th className="px-4 py-3 text-right">Physical Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingReturns.map(ret => {
                  const issue = issueRecords.find(i => i.id === ret.issue_id);
                  const student = users.find(u => u.id === issue?.student_id);
                  const eq = issue ? getEquipmentById(issue.equipment_id) : undefined;
                  const isHighlighted = highlightRecord?.recordId === ret.id || highlightRecord?.recordId === ret.issue_id;

                  return (
                    <tr 
                      key={ret.id} 
                      id={`return-${ret.id}`}
                      className={`transition-all ${
                        isHighlighted 
                          ? 'bg-orange-50/90 ring-2 ring-orange-500 shadow-sm' 
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-900">
                            {student?.name || 'Unknown Student'}
                          </span>
                          {isHighlighted && (
                            <span className="px-1.5 py-0.5 rounded bg-orange-600 text-white text-[9px] font-bold uppercase tracking-wider animate-pulse">
                              Linked
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          ID: <span className="font-mono font-medium">{student?.student_id || '-'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {student?.course} ({student?.division})
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {eq?.name || (issue as any)?.equipment_name || 'Removed item'}
                        </div>
                        <div className="text-xs font-mono text-slate-600 flex items-center space-x-1.5 mt-0.5">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {eq?.equipment_code || 'Removed'}
                          </span>
                          <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            Returning: {issue?.quantity || 1} {(issue?.quantity || 1) === 1 ? 'unit' : 'units'}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {eq ? getSportName(eq.sport_id) : '-'}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {new Date(ret.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                        {new Date(ret.requested_at).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3.5">
                        <StatusBadge status="RETURN_PENDING" />
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenInspect(ret.id)}
                          className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs flex items-center space-x-1 ml-auto"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Inspect & Accept</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Return Inspection Modal */}
      {activeInspectReturnId && (() => {
        const activeRet = returnRecords.find(r => r.id === activeInspectReturnId);
        const activeIssue = activeRet ? issueRecords.find(i => i.id === activeRet.issue_id) : undefined;
        const activeEq = activeIssue ? getEquipmentById(activeIssue.equipment_id) : undefined;
        const returnUnits = activeIssue?.quantity || 1;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Inspect & Verify Returned Equipment</span>
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Select the observed condition after physical examination.
              </p>

              {/* Item & Quantity Details */}
              {activeEq && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{activeEq.name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{activeEq.equipment_code}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                      {returnUnits} {returnUnits === 1 ? 'Unit' : 'Units'} Returning
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={handleAcceptReturn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Observed Equipment Condition <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['GOOD', 'FAIR', 'DAMAGED', 'LOST'] as ReturnInspectionOutcome[]).map(cond => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => setCondition(cond)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold border text-center transition-all ${
                          condition === cond
                            ? cond === 'DAMAGED'
                              ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-200'
                              : cond === 'LOST'
                              ? 'bg-neutral-900 border-neutral-900 text-white ring-2 ring-neutral-400'
                              : 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-200'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Inspection Remarks / Condition Notes {condition === 'LOST' && <span className="text-rose-600 font-bold">* (Required for LOST items)</span>}
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder={condition === 'LOST' ? 'Required: record circumstances of loss reported by student...' : 'e.g. Normal cosmetic wear on grip tape, strings intact.'}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required={condition === 'LOST'}
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  <span className="font-bold text-slate-800">System Workflow:</span>{' '}
                  {condition === 'DAMAGED' ? (
                    <span className="text-rose-700 font-semibold">
                      {returnUnits} unit(s) will be marked DAMAGED and quarantined from the available borrow stock.
                    </span>
                  ) : condition === 'LOST' ? (
                    <span className="text-neutral-900 font-semibold">
                      {returnUnits} unit(s) will be recorded as LOST. Student custody is cleared; units are NOT restocked into available stock.
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold">
                      {returnUnits} unit(s) will be restored to AVAILABLE status for subsequent student borrow requests.
                    </span>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveInspectReturnId(null)}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-xs cursor-pointer flex items-center space-x-1"
                  >
                    <span>{isSubmitting ? 'Processing...' : `Complete Return (${returnUnits} ${returnUnits === 1 ? 'Unit' : 'Units'})`}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Completed Return Records History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            Recent Return Audit Log ({pastReturns.length})
          </h3>
        </div>

        {pastReturns.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm">
            No past returned equipment records yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Accepted Date</th>
                  <th className="px-4 py-3">Verified Condition</th>
                  <th className="px-4 py-3">Remarks</th>
                  <th className="px-4 py-3">Accepted By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pastReturns.slice(0, 10).map(ret => {
                  const issue = issueRecords.find(i => i.id === ret.issue_id);
                  const student = users.find(u => u.id === issue?.student_id);
                  const eq = issue ? getEquipmentById(issue.equipment_id) : undefined;
                  const acceptedTeacher = users.find(u => u.id === ret.accepted_by);
                  const isHighlighted = highlightRecord?.recordId === ret.id || highlightRecord?.recordId === ret.issue_id;

                  return (
                    <tr 
                      key={ret.id} 
                      id={`return-${ret.id}`}
                      className={`transition-all ${
                        isHighlighted 
                          ? 'bg-orange-50/90 ring-2 ring-orange-500 shadow-sm' 
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <span>{student?.name}</span>
                          {isHighlighted && (
                            <span className="px-1.5 py-0.5 rounded bg-orange-600 text-white text-[9px] font-bold uppercase tracking-wider animate-pulse">
                              Linked
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">
                          {eq?.name || (issue as any)?.equipment_name || 'Removed item'}
                        </span>
                        <span className="ml-1 text-xs font-mono text-slate-500">
                          ({eq?.equipment_code || 'Removed'})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {ret.accepted_at ? new Date(ret.accepted_at).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {ret.condition && <StatusBadge status={ret.condition} />}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">
                        {ret.remarks || 'No issues noted'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 font-medium">
                        {acceptedTeacher?.name || 'Prof. Aniket Badhe'}
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
  );
};
