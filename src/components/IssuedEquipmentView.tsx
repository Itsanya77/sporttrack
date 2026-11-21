import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  PackageCheck, 
  Search, 
  Filter, 
  AlertTriangle, 
  Clock, 
  User, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  RotateCcw,
  Send,
  AlertCircle
} from 'lucide-react';
import { EquipmentCondition, ReturnInspectionOutcome } from '../types';

export const IssuedEquipmentView: React.FC = () => {
  const { 
    issueRecords, 
    equipment, 
    users, 
    returnRecords, 
    acceptReturn, 
    isOverdue, 
    getEquipmentById, 
    getUserName, 
    getSportName,
    addNotification,
    highlightRecord,
    setHighlightRecord 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'OVERDUE' | 'DUE_SOON'>('ALL');
  const [activeReturnModalIssue, setActiveReturnModalIssue] = useState<string | null>(null);
  const [returnCondition, setReturnCondition] = useState<ReturnInspectionOutcome>('GOOD');
  const [returnRemarks, setReturnRemarks] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

  // Auto-highlight record when navigated from notification
  React.useEffect(() => {
    if (highlightRecord?.recordId) {
      setFilterType('ALL');
      setSearchQuery('');
      setTimeout(() => {
        const el = document.getElementById(`issue-${highlightRecord.recordId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  }, [highlightRecord?.recordId]);

  // Active issued items only (strictly for real registered students with users/{uid} documents)
  const registeredStudents = users.filter(u => u.role === 'STUDENT');
  const registeredStudentIds = new Set([
    ...registeredStudents.map(u => u.id),
    ...registeredStudents.map(u => u.student_id).filter(Boolean) as string[]
  ]);
  const activeIssues = issueRecords.filter(i => i.status === 'ISSUED' && registeredStudentIds.has(i.student_id));

  // Filter and search
  const filteredIssues = activeIssues.filter(issue => {
    const eq = getEquipmentById(issue.equipment_id);
    const student = users.find(u => u.id === issue.student_id);
    const od = isOverdue(issue.expected_return, issue.status);

    if (filterType === 'OVERDUE' && !od.overdue) return false;
    if (filterType === 'DUE_SOON') {
      const today = new Date().toISOString().split('T')[0];
      if (issue.expected_return !== today) return false;
    }

    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    const eqName = eq?.name || (issue as any).equipment_name || 'Removed item';
    return (
      eqName.toLowerCase().includes(term) ||
      (eq?.equipment_code && eq.equipment_code.toLowerCase().includes(term)) ||
      (student?.name && student.name.toLowerCase().includes(term)) ||
      (student?.student_id && student.student_id.toLowerCase().includes(term))
    );
  });

  const totalIssued = activeIssues.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const overdueCount = activeIssues.filter(i => isOverdue(i.expected_return, i.status).overdue).length;
  const dueTodayCount = activeIssues.filter(i => {
    const today = new Date().toISOString().split('T')[0];
    return i.expected_return === today;
  }).length;

  const handleSendReminder = (studentName: string, eqName: string, returnDate: string, issueId?: string) => {
    addNotification(
      'Return Due Reminder Sent',
      `Reminder notification dispatched to ${studentName} for return of ${eqName} (Due: ${returnDate}).`,
      'INFO',
      'TEACHER',
      'issued',
      issueId,
      'ISSUE'
    );
    addNotification(
      'Return Due Reminder: Sports Gear',
      `Please return ${eqName} to the Sports Counter on or before ${returnDate}.`,
      'WARNING',
      'STUDENT',
      'my-equipment',
      issueId,
      'ISSUE'
    );
    setActionNotice(`Return reminder notice issued for ${studentName}.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReturnModalIssue || isProcessingReturn) return;

    if (returnCondition === 'LOST' && !returnRemarks.trim()) {
      setActionNotice('Inspection remarks are required when recording equipment as LOST.');
      return;
    }

    setIsProcessingReturn(true);
    try {
      // Check if return record exists, else create or find it
      let ret = returnRecords.find(r => r.issue_id === activeReturnModalIssue);
      let retId = ret?.id;

      if (!retId) {
        retId = `ret_quick_${Date.now()}`;
      }

      const res = await acceptReturn(retId, returnCondition, returnRemarks);
      setActionNotice(res.message);
      if (res.success) {
        setActiveReturnModalIssue(null);
        setReturnRemarks('');
      }
    } catch (err: any) {
      setActionNotice(err?.message || 'Failed to process return.');
    } finally {
      setIsProcessingReturn(false);
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 mb-1">
            <PackageCheck className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Teacher / Admin Custody</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Active Issued Equipment</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time track of all sports gear currently in student possession with return deadlines and inspection triggers.
          </p>
        </div>
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-3 text-emerald-800 text-xs font-bold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-blue-700">Total Active In Custody</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalIssued} Units</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-rose-700">Overdue Equipment</div>
            <div className="text-2xl font-black text-rose-700 mt-0.5">{overdueCount} Items</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-700">Due for Return Today</div>
            <div className="text-2xl font-black text-amber-700 mt-0.5">{dueTodayCount} Items</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by student name, roll number, equipment name or code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterType === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Active ({totalIssued})
          </button>
          <button
            onClick={() => setFilterType('OVERDUE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterType === 'OVERDUE' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Overdue ({overdueCount})
          </button>
          <button
            onClick={() => setFilterType('DUE_SOON')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterType === 'DUE_SOON' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Due Today ({dueTodayCount})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredIssues.length === 0 ? (
          <div className="p-12 text-center">
            <PackageCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Issued Equipment Records</h3>
            <p className="text-xs text-slate-400 mt-1">
              No active equipment matches your current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Student Custodian</th>
                  <th className="px-4 py-3">Issued On</th>
                  <th className="px-4 py-3">Expected Return</th>
                  <th className="px-4 py-3">Status / Overdue</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIssues.map(issue => {
                  const eq = getEquipmentById(issue.equipment_id);
                  const student = users.find(u => u.id === issue.student_id);
                  const od = isOverdue(issue.expected_return, issue.status);

                  const isHighlighted = highlightRecord?.recordId === issue.id;

                  return (
                    <tr 
                      key={issue.id} 
                      id={`issue-${issue.id}`}
                      className={`transition-all ${
                        isHighlighted 
                          ? 'bg-blue-50/90 ring-2 ring-blue-500 shadow-xs' 
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">
                            {eq?.name || (issue as any).equipment_name || 'Removed item'}
                          </span>
                          {isHighlighted && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider animate-pulse">
                              Linked
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className="text-[11px] font-mono text-blue-600">{eq?.equipment_code || 'Removed'}</span>
                          <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-[10px]">
                            {issue.quantity || 1} {(issue.quantity || 1) === 1 ? 'unit' : 'units'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{eq ? getSportName(eq.sport_id) : '-'}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{student?.name || 'Unknown Student'}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {student?.student_id} • {student?.course}
                        </div>
                        {student?.phone && (
                          <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{student.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {new Date(issue.issued_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="px-4 py-3 font-medium">
                        <span className={od.overdue ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                          {issue.expected_return}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {od.overdue ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>OVERDUE ({od.days}d)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            <span>IN CUSTODY</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleSendReminder(student?.name || 'Student', eq?.name || (issue as any).equipment_name || 'Removed item', issue.expected_return, issue.id)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg text-xs"
                            title="Send Return Reminder"
                          >
                            <Send className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setActiveReturnModalIssue(issue.id)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Accept Return</span>
                          </button>
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

      {/* Quick Return Inspection Modal */}
      {activeReturnModalIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">Verify & Accept Return</h3>
            <p className="text-xs text-slate-500 mb-4">
              Inspect physical equipment condition before restoring to general inventory.
            </p>

            <form onSubmit={handleProcessReturn} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Physical Condition
                </label>
                <select
                  value={returnCondition}
                  onChange={e => setReturnCondition(e.target.value as ReturnInspectionOutcome)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                >
                  <option value="EXCELLENT">EXCELLENT (Pristine)</option>
                  <option value="GOOD">GOOD (Normal play wear)</option>
                  <option value="FAIR">FAIR (Needs cleaning/re-grip)</option>
                  <option value="DAMAGED">DAMAGED (Quarantine for repair)</option>
                  <option value="LOST">LOST (Unreturned / missing)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Inspection Remarks {returnCondition === 'LOST' && <span className="text-rose-600 font-bold">* (Required)</span>}
                </label>
                <textarea
                  rows={2}
                  placeholder={returnCondition === 'LOST' ? 'Required: record circumstances of loss reported by student...' : 'e.g. Checked strings, seam intact, sanitized.'}
                  value={returnRemarks}
                  onChange={e => setReturnRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                  required={returnCondition === 'LOST'}
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveReturnModalIssue(null)}
                  disabled={isProcessingReturn}
                  className="px-3 py-1.5 rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingReturn}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer flex items-center space-x-1"
                >
                  <span>{isProcessingReturn ? 'Processing...' : 'Complete Return'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
