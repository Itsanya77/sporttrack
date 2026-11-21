import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from './StatusBadge';
import { 
  FileText, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  Calendar 
} from 'lucide-react';
import { DEFAULT_COLLEGE_LOGO, handleLogoImgError } from '../utils/logoUtils';

export const HistoryAndReports: React.FC = () => {
  const { 
    issueRecords, 
    requests, 
    returnRecords, 
    equipment, 
    users, 
    getEquipmentById, 
    getUserName, 
    getSportName, 
    isOverdue, 
    currentUser,
    settings
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'history' | 'overdue' | 'reports'>('history');
  const [searchTerm, setSearchTerm] = useState('');
  const [reportType, setReportType] = useState<'ACTIVE' | 'OVERDUE' | 'DAMAGED' | 'USAGE'>('ACTIVE');

  // RBAC Safeguard: Scope issue records strictly to the logged-in student if accessed by a student
  // In staff view, match records strictly against existing real registered student profiles
  const isStudent = currentUser?.role === 'STUDENT';
  const registeredStudents = users.filter(u => u.role === 'STUDENT');
  const registeredStudentIds = new Set([
    ...registeredStudents.map(u => u.id),
    ...registeredStudents.map(u => u.student_id).filter(Boolean) as string[]
  ]);
  const scopedIssues = isStudent
    ? issueRecords.filter(issue => issue.student_id === currentUser?.id)
    : issueRecords.filter(issue => registeredStudentIds.has(issue.student_id));

  // Overdue issues scoped
  const overdueIssues = scopedIssues.filter(issue => {
    const od = isOverdue(issue.expected_return, issue.status);
    return od.overdue;
  });

  // Export to CSV helper
  const handleExportCSV = () => {
    let rows: string[][] = [];
    let headers: string[] = [];
    let filename = 'SportTrack_Report.csv';

    if (activeSubTab === 'overdue' || (activeSubTab === 'reports' && reportType === 'OVERDUE')) {
      filename = 'SportTrack_Overdue_Report.csv';
      headers = ['Equipment Code', 'Equipment Name', 'Student Name', 'Student ID', 'Issued Date', 'Expected Return', 'Days Overdue'];
      rows = overdueIssues.map(issue => {
        const eq = getEquipmentById(issue.equipment_id);
        const student = users.find(u => u.id === issue.student_id);
        const od = isOverdue(issue.expected_return, issue.status);
        return [
          `"${eq?.equipment_code || 'Removed'}"`,
          `"${eq?.name || (issue as any).equipment_name || 'Removed item'}"`,
          `"${student?.name || ''}"`,
          `"${student?.student_id || ''}"`,
          `"${new Date(issue.issued_at).toLocaleDateString()}"`,
          `"${issue.expected_return}"`,
          `"${od.days}"`,
        ];
      });
    } else {
      filename = 'SportTrack_Transaction_History.csv';
      headers = ['Record ID', 'Equipment Code', 'Equipment Name', 'Student Name', 'Student ID', 'Issued Date', 'Expected Return', 'Actual Return', 'Status'];
      rows = scopedIssues.map(issue => {
        const eq = getEquipmentById(issue.equipment_id);
        const student = users.find(u => u.id === issue.student_id);
        return [
          `"${issue.id}"`,
          `"${eq?.equipment_code || 'Removed'}"`,
          `"${eq?.name || (issue as any).equipment_name || 'Removed item'}"`,
          `"${student?.name || ''}"`,
          `"${student?.student_id || ''}"`,
          `"${new Date(issue.issued_at).toLocaleDateString()}"`,
          `"${issue.expected_return}"`,
          `"${issue.actual_return ? new Date(issue.actual_return).toLocaleDateString() : 'N/A'}"`,
          `"${issue.status}"`,
        ];
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered issue records for history
  const filteredHistory = scopedIssues.filter(issue => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const student = users.find(u => u.id === issue.student_id);
    const eq = getEquipmentById(issue.equipment_id);
    const eqName = eq?.name || (issue as any).equipment_name || 'Removed item';
    return (
      (student?.name.toLowerCase().includes(term) ?? false) ||
      (student?.student_id?.toLowerCase().includes(term) ?? false) ||
      eqName.toLowerCase().includes(term) ||
      (eq?.equipment_code?.toLowerCase().includes(term) ?? false)
    );
  });

  // Institutional RBAC Screen: Students are forbidden from accessing department audit registers
  if (isStudent) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-rose-200 shadow-sm text-center max-w-xl mx-auto my-12">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
          Access Denied: Teacher Permissions Required
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          The departmental audit and full issue register is restricted to Sports Department faculty and administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* College Report Header banner for print & display */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
            <img 
              src={settings.logo_url || DEFAULT_COLLEGE_LOGO} 
              alt="DMIMCS Emblem" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
              onError={handleLogoImgError}
            />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 flex items-center space-x-2">
              <span>{settings.college_name}</span>
              <span className="text-amber-600 font-semibold">• उद्योगः कर्मसु कौशलम्</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Sports Department — Audit, Overdue & Reports
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official Register • Generated by {currentUser?.name} on {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setActiveSubTab('history')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeSubTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Full Issue Register ({scopedIssues.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('overdue')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeSubTab === 'overdue'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Overdue Escalations ({overdueIssues.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reports')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeSubTab === 'reports'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Departmental Summaries</span>
        </button>
      </div>

      {/* SUB-TAB 1: FULL TRANSACTION HISTORY */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search history by student name, roll number, equipment code..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Equipment</th>
                    <th className="px-4 py-3">Sport</th>
                    <th className="px-4 py-3">Issue Date</th>
                    <th className="px-4 py-3">Expected Return</th>
                    <th className="px-4 py-3">Actual Return</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map(issue => {
                    const student = users.find(u => u.id === issue.student_id);
                    const eq = getEquipmentById(issue.equipment_id);
                    const od = isOverdue(issue.expected_return, issue.status);

                    return (
                      <tr key={issue.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900">{student?.name}</div>
                          <div className="text-xs text-slate-500 font-mono">
                            {student?.student_id} • {student?.course}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-slate-900">
                            {eq?.name || (issue as any).equipment_name || 'Removed item'}
                          </div>
                          <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {eq?.equipment_code || 'Removed'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-600">
                          {eq ? getSportName(eq.sport_id) : '-'}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-500">
                          {new Date(issue.issued_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5 text-xs font-medium">
                          <span className={od.overdue ? 'text-red-700 font-bold' : 'text-slate-700'}>
                            {issue.expected_return}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-500">
                          {issue.actual_return ? (
                            <span className="text-emerald-700 font-medium">
                              {new Date(issue.actual_return).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {od.overdue ? (
                            <StatusBadge status="OVERDUE" />
                          ) : (
                            <StatusBadge status={issue.status} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: OVERDUE MANAGEMENT (Section 18) */}
      {activeSubTab === 'overdue' && (
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-900 text-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Automated Overdue Escalations:</span> Sports items that have surpassed their expected return date while status is ISSUED. Departmental rules mandate issuing warning notifications or contacting students directly.
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {overdueIssues.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                Excellent! There are currently no overdue sports items.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-red-50/50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-red-100">
                    <tr>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Roll / ID</th>
                      <th className="px-4 py-3">Equipment</th>
                      <th className="px-4 py-3">Expected Return</th>
                      <th className="px-4 py-3">Days Overdue</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overdueIssues.map(issue => {
                      const student = users.find(u => u.id === issue.student_id);
                      const eq = getEquipmentById(issue.equipment_id);
                      const od = isOverdue(issue.expected_return, issue.status);

                      return (
                        <tr key={issue.id} className="hover:bg-red-50/30 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-slate-900">
                            {student?.name}
                            <div className="text-xs text-slate-500 font-normal">
                              {student?.email}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-slate-700">
                            {student?.student_id} ({student?.course})
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-900">
                              {eq?.name || (issue as any).equipment_name || 'Removed item'}
                            </div>
                            <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {eq?.equipment_code || 'Removed'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-xs font-bold text-red-700">
                            {issue.expected_return}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                              +{od.days} days late
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status="OVERDUE" />
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
      )}

      {/* SUB-TAB 3: DEPARTMENTAL SUMMARIES & REPORTS */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Active Borrower Load
              </h4>
              <div className="text-3xl font-extrabold text-blue-700">
                {scopedIssues.filter(i => i.status === 'ISSUED').length}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Equipment currently in circulation among college students
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Damaged / Quarantined
              </h4>
              <div className="text-3xl font-extrabold text-rose-700">
                {equipment.filter(e => e.status === 'DAMAGED').length}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Equipment pending repair or retirement
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                On-Time Return Ratio
              </h4>
              <div className="text-3xl font-extrabold text-emerald-700">
                {scopedIssues.length > 0
                  ? `${Math.round(((scopedIssues.length - overdueIssues.length) / scopedIssues.length) * 100)}%`
                  : '100%'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Students returning gear before overdue deadlines
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-3">
              Official College Audit Attestation
            </h3>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
              <p>
                <strong>Institution:</strong> Dr. Moonje Institute of Management and Computer Studies (Affiliated to Savitribai Phule Pune University).
              </p>
              <p>
                <strong>Authorized Physical In-charge:</strong> Prof. Aniket Badhe (Sports Coordinator / Physical Director).
              </p>
              <p>
                <strong>System Integrity:</strong> All transactions conform to automated state transition policies. Physical returns require desk verification before inventory availability is restored.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
