import React from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from './StatusBadge';
import { 
  Package, 
  Clock, 
  RotateCcw, 
  CheckCircle2, 
  PlusCircle, 
  Calendar, 
  AlertCircle,
  AlertTriangle
} from 'lucide-react';

interface StudentDashboardProps {
  onRequestEquipmentClick: () => void;
  onNavigateTab: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
  onRequestEquipmentClick,
  onNavigateTab 
}) => {
  const { 
    currentUser, 
    equipment,
    issueRecords, 
    requests, 
    returnRecords, 
    requestReturn, 
    cancelRequest,
    getEquipmentById, 
    getSportName, 
    isOverdue,
    highlightRecord,
    setHighlightRecord 
  } = useApp();

  // Auto-scroll to issued gear from notification
  React.useEffect(() => {
    if (highlightRecord?.recordId) {
      setTimeout(() => {
        const el = document.getElementById(`student-issue-${highlightRecord.recordId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  }, [highlightRecord?.recordId]);

  if (!currentUser || currentUser.role !== 'STUDENT') {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
        Unauthorized: Student session required.
      </div>
    );
  }

  // Match student records reliably by UID, Email, or Institutional Roll Number
  const isStudentMatch = (studentId: string | undefined) => {
    if (!studentId || !currentUser) return false;
    return (
      studentId === currentUser.id ||
      (Boolean(currentUser.email) && studentId.toLowerCase() === currentUser.email.toLowerCase()) ||
      (Boolean(currentUser.student_id) && studentId.toUpperCase() === (currentUser.student_id || '').toUpperCase())
    );
  };

  const myIssues = issueRecords.filter(i => isStudentMatch(i.student_id));
  const myActiveIssues = myIssues.filter(i => i.status === 'ISSUED');
  const myActiveUnits = myActiveIssues.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const myCompletedIssues = myIssues.filter(i => i.status === 'RETURNED');

  const myRequests = requests.filter(r => isStudentMatch(r.student_id));
  const myPendingRequests = myRequests.filter(r => r.status === 'PENDING' || r.status === 'APPROVED');
  
  // Return pending: returns initiated by this student that are waiting for teacher acceptance
  const myReturnPendingCount = myActiveIssues.filter(i => {
    const ret = returnRecords.find(r => r.issue_id === i.id && r.status === 'RETURN_PENDING');
    return !!ret;
  }).length;

  const [returnError, setReturnError] = React.useState<string | null>(null);
  const [cancellingReqId, setCancellingReqId] = React.useState<string | null>(null);

  const handleReturnClick = async (issueId: string) => {
    setReturnError(null);
    const res = await requestReturn(issueId);
    if (!res.success) {
      setReturnError(res.message);
    }
  };

  const handleCancelReq = async (reqId: string) => {
    setReturnError(null);
    try {
      const res = await cancelRequest(reqId, 'Cancelled by student');
      if (!res.success) {
        setReturnError(res.message);
      }
      setCancellingReqId(null);
    } catch (err: any) {
      setReturnError(err?.message || 'Failed to cancel request.');
    }
  };

  return (
    <div className="space-y-6">
      {returnError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-xs font-semibold shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{returnError}</span>
          </div>
          <button 
            onClick={() => setReturnError(null)}
            className="text-rose-700 hover:text-rose-900 font-bold ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}
      {/* Student Profile Overview Card */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 text-white p-6 rounded-2xl shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-xs font-semibold mb-2">
              <span>Dr. Moonje Institute of Management & Computer Studies</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Welcome, {currentUser.name}
            </h2>
            <p className="text-blue-200 text-sm mt-0.5">
              Roll/Student ID: <span className="font-semibold text-white font-mono">{currentUser.student_id}</span> • Course: {currentUser.course} ({currentUser.year}, Div {currentUser.division})
            </p>
          </div>

          <button
            onClick={onRequestEquipmentClick}
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-md transition-all shrink-0 hover:scale-[1.02]"
          >
            <PlusCircle className="w-5 h-5 text-blue-600" />
            <span>Request Sports Equipment</span>
          </button>
        </div>
      </div>

      {equipment.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center space-x-3 text-xs text-slate-600 shadow-xs">
          <Package className="w-4 h-4 text-slate-400 shrink-0" />
          <span>No equipment added yet in the sports department catalog.</span>
        </div>
      )}

      {highlightRecord?.recordId && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs text-blue-900 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span className="font-semibold">Navigated from Notification:</span>
            <span>Focusing equipment record #{highlightRecord.recordId}</span>
          </div>
          <button
            onClick={() => setHighlightRecord(null)}
            className="text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
          >
            Clear Highlight
          </button>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Active Equipment</span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{myActiveUnits} <span className="text-sm font-normal text-slate-500">units</span></div>
          <div className="text-[11px] text-slate-400 font-medium">{myActiveIssues.length} equipment items in possession</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Pending Requests</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{myPendingRequests.length}</div>
          <div className="text-[11px] text-slate-400 font-medium">Waiting for teacher approval</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Return Pending</span>
            <RotateCcw className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-orange-700">{myReturnPendingCount}</div>
          <div className="text-[11px] text-slate-400 font-medium">Under physical desk check</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Completed Returns</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{myCompletedIssues.length}</div>
          <div className="text-[11px] text-slate-400 font-medium">Past equipment safely returned</div>
        </div>
      </div>

      {/* Section 1: My Active Equipment */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span>My Active Equipment ({myActiveIssues.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Equipment currently issued to you. Please return on or before the expected return date.
            </p>
          </div>
        </div>

        {myActiveIssues.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-slate-700">No equipment currently issued to you.</p>
            <p className="text-xs text-slate-400 mt-1">
              Need sports gear for practice or matches? Click the button above to request.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Sport</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Expected Return</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myActiveIssues.map(issue => {
                  const eq = getEquipmentById(issue.equipment_id);
                  const returnReq = returnRecords.find(r => r.issue_id === issue.id && r.status === 'RETURN_PENDING');
                  const odInfo = isOverdue(issue.expected_return, issue.status);

                  const isHighlighted = highlightRecord?.recordId === issue.id;

                  return (
                    <tr 
                      key={issue.id} 
                      id={`student-issue-${issue.id}`}
                      className={`transition-all ${
                        isHighlighted 
                          ? 'bg-blue-50/90 ring-2 ring-blue-500 shadow-sm' 
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <span>{eq?.name || (issue as any).equipment_name || 'Removed item'}</span>
                          {isHighlighted && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider animate-pulse">
                              Linked
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-bold text-blue-700 font-sans mt-0.5">
                          {issue.quantity || 1} {(issue.quantity || 1) === 1 ? 'unit' : 'units'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {eq?.equipment_code || 'Removed'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {eq ? getSportName(eq.sport_id) : '-'}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {issue.issued_at ? new Date(issue.issued_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className={odInfo.overdue ? 'text-red-700 font-bold' : 'text-slate-700 font-medium'}>
                            {issue.expected_return}
                          </span>
                        </div>
                        {odInfo.overdue && (
                          <span className="inline-block text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded mt-0.5">
                            {odInfo.days} days overdue
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {odInfo.overdue ? (
                          <StatusBadge status="OVERDUE" />
                        ) : returnReq ? (
                          <StatusBadge status="RETURN_PENDING" />
                        ) : (
                          <StatusBadge status="ISSUED" />
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {returnReq ? (
                          <span className="text-xs text-orange-600 font-medium italic">
                            Hand over to teacher
                          </span>
                        ) : (
                          <button
                            onClick={() => handleReturnClick(issue.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                          >
                            Return
                          </button>
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

      {/* Section 2: Recent Requests */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span>My Equipment Requests ({myRequests.length})</span>
          </h3>
          <button
            onClick={() => onNavigateTab('my-requests')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            View All
          </button>
        </div>

        {myRequests.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm">
            No past or current requests made yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Request Date</th>
                  <th className="px-4 py-3">Expected Return</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes / Reason</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myRequests.slice(0, 5).map(req => {
                  const eq = getEquipmentById(req.equipment_id);
                  const isConfirming = cancellingReqId === req.id;

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {eq?.name || (req as any).equipment_name || 'Removed item'}
                        <div className="text-xs font-mono text-slate-400 font-normal">
                          {eq?.equipment_code || 'Removed'}
                          {req.quantity && req.quantity > 1 && ` • ${req.quantity} units`}
                        </div>
                        {req.request_source === 'TEACHER_CREATED' && (
                          <div className="mt-1">
                            <span className="inline-block text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                              Created by Sports Teacher
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">
                        {req.expected_return}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">
                        {req.purpose}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {req.rejection_reason ? (
                          <span className="text-rose-600 font-medium">
                            Rejected: {req.rejection_reason}
                          </span>
                        ) : req.status === 'APPROVED' ? (
                          <span className="text-blue-600 font-medium">
                            Approved! Collect at sports room.
                          </span>
                        ) : req.status === 'ISSUED' ? (
                          <span className="text-emerald-600 font-medium">
                            Issued
                          </span>
                        ) : req.status === 'CANCELLED' ? (
                          <span className="text-slate-400 italic">
                            {req.teacher_remarks || 'Cancelled'}
                          </span>
                        ) : (
                          'Awaiting Teacher Decision'
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {req.status === 'PENDING' ? (
                          isConfirming ? (
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => handleCancelReq(req.id)}
                                className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setCancellingReqId(null)}
                                className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                              >
                                Back
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setCancellingReqId(req.id)}
                              className="px-2 py-1 text-[11px] font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                          )
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
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
  );
};
