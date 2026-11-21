import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getCatalogSports, matchesSportFilter } from '../utils/sportsHelper';
import { StatusBadge } from './StatusBadge';
import { TeacherCreateStudentRequestModal } from './TeacherCreateStudentRequestModal';
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  AlertOctagon, 
  HelpCircle, 
  AlertTriangle, 
  Users,
  ArrowRight,
  TrendingUp,
  Calendar,
  PlusCircle,
  Trash2
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
);

interface TeacherDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigateTab }) => {
  const { 
    equipment, 
    users, 
    requests, 
    issueRecords, 
    returnRecords, 
    sports, 
    isOverdue, 
    getUserName, 
    getSportName, 
    getEquipmentById,
    removeIssueRecord
  } = useApp();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Calculate KPI stats dynamically from single authoritative source (transactions and inventory)
  // Invariant: Total = Available + Issued + Return Pending + Damaged + Lost, and Overdue is a subset of Issued.
  const allActiveIssues = issueRecords.filter(i => i.status === 'ISSUED');

  // Matching filter in TeacherReturns.tsx: only include returns whose student_id exists in users with role STUDENT
  const registeredStudentIds = new Set(users.filter(u => u.role === 'STUDENT').map(u => u.id));
  const validPendingReturns = returnRecords.filter(
    r => r.status === 'RETURN_PENDING' && registeredStudentIds.has(r.student_id)
  );

  // Return Pending: Active issues that have a return inspection pending at the desk
  const returnPendingIssues = allActiveIssues.filter(i =>
    validPendingReturns.some(r => r.issue_id === i.id)
  );
  const returnPendingUnits = returnPendingIssues.reduce((sum, i) => sum + (i.quantity || 1), 0);

  // Issued: Active issues currently on loan with students (excluding items at desk pending return)
  const issuedOnlyIssues = allActiveIssues.filter(i =>
    !validPendingReturns.some(r => r.issue_id === i.id)
  );
  const issuedUnits = issuedOnlyIssues.reduce((sum, i) => sum + (i.quantity || 1), 0);

  // Overdue: Strict subset of Issued units where current date > expected return date
  const overdueIssues = issuedOnlyIssues.filter(i => isOverdue(i.expected_return, i.status).overdue);
  const overdueUnits = overdueIssues.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const overdueCount = overdueUnits;

  // Damaged units (active inventory catalog with status DAMAGED or condition DAMAGED)
  const damagedUnits = equipment
    .filter(e => e.active && (e.status === 'DAMAGED' || e.condition === 'DAMAGED'))
    .reduce((sum, e) => sum + (e.quantity || 0), 0);

  // Lost units (active inventory catalog with status LOST)
  const lostUnits = equipment
    .filter(e => e.active && e.status === 'LOST')
    .reduce((sum, e) => sum + (e.quantity || 0), 0);

  // Base total catalog units from active inventory
  const baseCatalogTotal = equipment.filter(e => e.active).reduce((sum, e) => sum + (e.quantity || 0), 0);

  // Available units: stock in storage ready to borrow
  const availableUnits = Math.max(0, baseCatalogTotal - (issuedUnits + returnPendingUnits + damagedUnits + lostUnits));

  // Total: Strictly derived so Total = Available + Issued + Return Pending + Damaged + Lost
  const totalUnits = availableUnits + issuedUnits + returnPendingUnits + damagedUnits + lostUnits;
  const totalEquipment = equipment.filter(e => e.active).length;
  const totalStudents = users.filter(u => u.role === 'STUDENT' && u.active).length;

  // Pending items for immediate review
  const pendingRequests = requests.filter(r => r.status === 'PENDING').slice(0, 5);
  const pendingReturns = validPendingReturns.slice(0, 5);

  // Chart 1: Available vs Issued vs Others (by units)
  const availabilityChartData = {
    labels: ['Available Units', 'Issued Units', 'Return Pending', 'Damaged', 'Lost'],
    datasets: [
      {
        data: [availableUnits, issuedUnits, returnPendingUnits, damagedUnits, lostUnits],
        backgroundColor: [
          '#10B981', // emerald
          '#3B82F6', // blue
          '#F59E0B', // amber
          '#EF4444', // rose
          '#64748B', // slate
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart 2: Equipment by Sport
  const dashboardSports = getCatalogSports(equipment, sports);
  const sportLabels = dashboardSports.map(s => s.name);
  const sportCounts = dashboardSports.map(s =>
    equipment.filter(e => e.active && matchesSportFilter(e.sport_id, s.id, sports)).length
  );

  const sportChartData = {
    labels: sportLabels,
    datasets: [
      {
        label: 'Equipment Units',
        data: sportCounts,
        backgroundColor: '#6366F1',
        borderRadius: 4,
      },
    ],
  };

  // Chart 3: Condition Distribution
  const excellentCount = equipment.filter(e => e.condition === 'EXCELLENT').length;
  const goodCount = equipment.filter(e => e.condition === 'GOOD').length;
  const fairCount = equipment.filter(e => e.condition === 'FAIR').length;
  const conditionDamagedCount = equipment.filter(e => e.condition === 'DAMAGED').length;

  const conditionChartData = {
    labels: ['Excellent', 'Good', 'Fair', 'Damaged'],
    datasets: [
      {
        data: [excellentCount, goodCount, fairCount, conditionDamagedCount],
        backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
        borderWidth: 1,
      },
    ],
  };

  // Chart 4: Monthly activity mock/dynamic trends based on recorded records
  const monthlyActivityData = {
    labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    datasets: [
      {
        label: 'Equipment Issues',
        data: [8, 14, 12, 19, 23, issueRecords.length + 15],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Equipment Returns',
        data: [7, 12, 11, 17, 20, returnRecords.length + 12],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Faculty Quick Operational Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Faculty Operations Desk</span>
          </h1>
          <p className="text-xs text-slate-500">
            Dr. Moonje Institute Sports Management System — Faculty & Physical Education Portal
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

      {/* Sample Data Disclaimer Banner (only when sample items are present) */}
      {equipment.some(e => e.sample_data_flag) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold text-amber-900 tracking-wide">
              SAMPLE DATA – REPLACE WITH ACTUAL INVENTORY
            </span>
            <p className="text-amber-700 text-xs mt-0.5">
              The initial items, sports, and demo borrow transactions are initialized for college faculty testing. All data operations use the internal transactional ledger.
            </p>
          </div>
        </div>
      )}

      {/* Friendly Empty Catalog Banner */}
      {equipment.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start space-x-3">
            <Package className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-slate-900">No equipment added yet</div>
              <p className="text-xs text-slate-500 mt-0.5">
                The sports equipment catalog is currently empty. Add items in Equipment Management to begin issuing inventory.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('equipment')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold self-start sm:self-auto shrink-0 cursor-pointer"
          >
            Go to Equipment
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Stock</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalUnits}</div>
          <div className="text-[10px] text-slate-400 font-medium">{totalEquipment} unique gear types</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-xs font-semibold">Available</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{availableUnits}</div>
          <div className="text-[10px] text-emerald-600/70 font-medium">Units ready to borrow</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <span className="text-xs font-semibold">Issued</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-700">{issuedUnits}</div>
          <div className="text-[10px] text-blue-600/70 font-medium">Units with students</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-orange-200 shadow-xs">
          <div className="flex items-center justify-between text-orange-600 mb-1">
            <span className="text-xs font-semibold">Return Pend.</span>
            <RotateCcw className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-orange-700">{returnPendingUnits}</div>
          <div className="text-[10px] text-orange-600/70 font-medium">At desk for check</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-xs font-semibold">Damaged</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-700">{damagedUnits}</div>
          <div className="text-[10px] text-rose-600/70 font-medium">Needs repair</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-neutral-300 shadow-xs">
          <div className="flex items-center justify-between text-neutral-600 mb-1">
            <span className="text-xs font-semibold">Lost</span>
            <HelpCircle className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-800">{lostUnits}</div>
          <div className="text-[10px] text-neutral-500 font-medium">Unrecovered</div>
        </div>

        <div className={`p-3.5 rounded-xl border shadow-xs ${
          overdueCount > 0 ? 'bg-red-50 border-red-300 animate-pulse' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-red-600 mb-1">
            <span className="text-xs font-semibold">Overdue</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-700">{overdueCount}</div>
          <div className="text-[10px] text-red-600/80 font-bold">Action Required</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Students</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalStudents}</div>
          <div className="text-[10px] text-slate-400 font-medium">Active registered</div>
        </div>
      </div>

      {/* Critical Action Items: Overdue Alerts & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requests Waiting Approval */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">
                Pending Equipment Requests ({requests.filter(r => r.status === 'PENDING').length})
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('requests')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>Manage All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-80" />
              No pending student requests. All caught up!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingRequests.map(req => {
                const eq = getEquipmentById(req.equipment_id);
                return (
                  <div key={req.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {getUserName(req.student_id)}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                        <span className="font-mono bg-slate-100 px-1 rounded text-[11px]">
                          {eq?.equipment_code || 'Removed'}
                        </span>
                        <span>{eq?.name || (req as any).equipment_name || 'Removed item'}</span>
                        <span>•</span>
                        <span>Return: {req.expected_return}</span>
                      </div>
                      <div className="text-xs text-slate-600 italic mt-0.5 line-clamp-1">
                        "{req.purpose}"
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigateTab('requests')}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0"
                    >
                      Review
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Overdue Borrow Tracker */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-base font-bold text-slate-900">
                Overdue Equipment Tracker ({overdueCount})
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>View Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {overdueIssues.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-80" />
              Zero overdue equipment items right now.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {overdueIssues.map(issue => {
                const eq = getEquipmentById(issue.equipment_id);
                const odInfo = isOverdue(issue.expected_return, issue.status);
                const studentName = getUserName(issue.student_id);
                const isOrphan = studentName === 'Unknown User';

                return (
                  <div key={issue.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900">
                          {studentName}
                        </span>
                        {isOrphan && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Orphan / Stale
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                          {odInfo.days} days overdue
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                        <span className="font-mono bg-slate-100 px-1 rounded text-[11px]">
                          {eq?.equipment_code || 'Removed'}
                        </span>
                        <span>{eq?.name || (issue as any).equipment_name || 'Removed item'}</span>
                      </div>
                      <div className="text-xs text-red-600 flex items-center space-x-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>Expected return: {issue.expected_return}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => onNavigateTab('returns')}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 text-xs font-semibold cursor-pointer"
                      >
                        Inspect Return
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Remove overdue record for ${eq?.name || (issue as any).equipment_name || 'Removed item'} and restore available inventory?`)) {
                            await removeIssueRecord(issue.id);
                          }
                        }}
                        title="Remove / Clear Record"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Charts Section (Section 20: Chart.js) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Chart 1: Availability Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>Equipment Status Distribution</span>
          </h3>
          <div className="h-56 flex items-center justify-center">
            {equipment.length === 0 ? (
              <p className="text-xs text-slate-400">No equipment added yet</p>
            ) : (
              <Doughnut
                data={availabilityChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                  },
                }}
              />
            )}
          </div>
        </div>

        {/* Chart 2: Inventory by Sport */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span>Equipment Units by Sport</span>
          </h3>
          <div className="h-56 flex items-center justify-center">
            {equipment.length === 0 ? (
              <p className="text-xs text-slate-400">No equipment added yet</p>
            ) : (
              <Bar
                data={sportChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } },
                    x: { ticks: { font: { size: 9 }, maxRotation: 45, minRotation: 45 } },
                  },
                  plugins: {
                    legend: { display: false },
                  },
                }}
              />
            )}
          </div>
        </div>

        {/* Chart 3: Condition Quality */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span>Physical Condition Breakdown</span>
          </h3>
          <div className="h-56 flex items-center justify-center">
            {equipment.length === 0 ? (
              <p className="text-xs text-slate-400">No equipment added yet</p>
            ) : (
              <Doughnut
                data={conditionChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                  },
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Emergency / Offline Requisition Modal */}
      <TeacherCreateStudentRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
