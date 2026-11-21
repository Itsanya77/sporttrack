import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getCatalogSports, matchesSportFilter, resolveEquipmentSportName } from '../utils/sportsHelper';
import { StatusBadge } from './StatusBadge';
import { Equipment, EquipmentCondition, EquipmentStatus } from '../types';
import { 
  Package, 
  Plus, 
  Layers, 
  Search, 
  Filter, 
  Edit3, 
  Archive, 
  AlertOctagon, 
  HelpCircle, 
  CheckCircle2, 
  X,
  AlertTriangle,
  Tag
} from 'lucide-react';

export const EquipmentManagement: React.FC = () => {
  const { 
    equipment, 
    sports, 
    currentUser,
    addEquipment, 
    editEquipment, 
    bulkCreateEquipment, 
    updateEquipmentStatus, 
    getSportName,
    highlightRecord,
    setHighlightRecord 
  } = useApp();

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sportFilter, setSportFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [conditionFilter, setConditionFilter] = useState('ALL');

  // Auto-scroll to highlighted equipment from notification
  React.useEffect(() => {
    if (highlightRecord?.recordId) {
      setSportFilter('ALL');
      setStatusFilter('ALL');
      setConditionFilter('ALL');
      setSearchTerm('');
      setTimeout(() => {
        const el = document.getElementById(`equipment-row-${highlightRecord.recordId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  }, [highlightRecord?.recordId]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = React.useRef(false);

  // Single Item Form State
  const [singleForm, setSingleForm] = useState({
    equipment_code: '',
    name: '',
    sport_id: '',
    quantity: 1,
    condition: 'GOOD' as EquipmentCondition,
    status: 'AVAILABLE' as EquipmentStatus,
    purchase_date: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  // Bulk Generator Form State
  const [bulkForm, setBulkForm] = useState({
    prefix: '',
    name: '',
    sport_id: '',
    condition: 'EXCELLENT' as EquipmentCondition,
    quantity: 5,
    purchase_date: new Date().toISOString().split('T')[0],
  });

  const catalogSports = getCatalogSports(equipment, sports, true);

  // Combined sport choices for creating new equipment (catalog sports + any configured sports without duplicating names)
  const creationSports = (() => {
    const map = new Map<string, { id: string; name: string }>();
    catalogSports.forEach(s => map.set(s.name.toLowerCase(), s));
    sports.forEach(s => {
      const canonicalName = resolveEquipmentSportName(s.id, sports);
      const key = canonicalName.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { id: canonicalName, name: canonicalName });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  })();

  // Filtered Equipment List
  const filteredEquipment = equipment.filter(item => {
    if (sportFilter !== 'ALL' && !matchesSportFilter(item.sport_id, sportFilter, sports)) return false;
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (conditionFilter !== 'ALL' && item.condition !== conditionFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const code = item.equipment_code.toLowerCase();
      const name = item.name.toLowerCase();
      const sportName = getSportName(item.sport_id).toLowerCase();
      if (!code.includes(term) && !name.includes(term) && !sportName.includes(term)) {
        return false;
      }
    }
    return true;
  });

  // Stats (counted in units for active equipment)
  const activeEquipment = equipment.filter(e => e.active);
  const totalItemTypes = activeEquipment.length;
  const total = activeEquipment.reduce((sum, e) => sum + (e.quantity || 0), 0);
  const available = activeEquipment
    .filter(e => e.status !== 'DAMAGED' && e.status !== 'LOST' && e.status !== 'ARCHIVED')
    .reduce((sum, e) => sum + (e.available_quantity ?? 0), 0);
  const issued = activeEquipment.reduce((sum, e) => sum + (e.issued_quantity ?? 0), 0);
  const returnPending = activeEquipment
    .filter(e => e.status === 'RETURN_PENDING')
    .reduce((sum, e) => sum + (e.quantity || 0), 0);
  const damaged = activeEquipment
    .filter(e => e.status === 'DAMAGED' || e.condition === 'DAMAGED')
    .reduce((sum, e) => sum + (e.quantity || 0), 0);
  const lost = activeEquipment
    .filter(e => e.status === 'LOST')
    .reduce((sum, e) => sum + (e.quantity || 0), 0);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || isSubmitting) return;
    setFeedback(null);
    setModalError(null);

    const normalizedCode = singleForm.equipment_code.trim().toUpperCase();
    if (!normalizedCode) {
      setModalError('Equipment Code is required.');
      return;
    }

    if (equipment.some(item => item.equipment_code.trim().toUpperCase() === normalizedCode)) {
      setModalError(`Equipment Code "${normalizedCode}" already exists. Please enter a unique code.`);
      return;
    }

    const qty = Number(singleForm.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      setModalError('Quantity must be a positive whole number greater than 0.');
      return;
    }

    const sportId = singleForm.sport_id || creationSports[0]?.id || '';
    if (!sportId) {
      setModalError('Please select a sport / discipline.');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const res = await addEquipment({
        equipment_code: normalizedCode,
        name: singleForm.name,
        sport_id: sportId,
        quantity: qty,
        condition: singleForm.condition,
        status: singleForm.status,
        purchase_date: singleForm.purchase_date,
        remarks: singleForm.remarks,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setIsAddModalOpen(false);
        setSingleForm({
          equipment_code: '',
          name: '',
          sport_id: creationSports[0]?.id || '',
          quantity: 1,
          condition: 'GOOD',
          status: 'AVAILABLE',
          purchase_date: new Date().toISOString().split('T')[0],
          remarks: '',
        });
      } else {
        setModalError(res.message);
      }
    } catch (err: any) {
      setModalError(err?.message || 'Failed to add equipment.');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || isSubmitting) return;
    setFeedback(null);
    setModalError(null);

    const cleanPrefix = bulkForm.prefix.trim().toUpperCase();
    if (!cleanPrefix) {
      setModalError('Code Prefix is required.');
      return;
    }

    const sportId = bulkForm.sport_id || creationSports[0]?.id || '';
    if (!sportId) {
      setModalError('Please select a sport / discipline.');
      return;
    }

    const qty = Number(bulkForm.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
      setModalError('Quantity must be a whole number between 1 and 50.');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const res = await bulkCreateEquipment(
        cleanPrefix,
        bulkForm.name,
        sportId,
        bulkForm.condition,
        qty,
        bulkForm.purchase_date
      );

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setIsBulkModalOpen(false);
        setBulkForm({
          prefix: '',
          name: '',
          sport_id: creationSports[0]?.id || '',
          condition: 'EXCELLENT',
          quantity: 5,
          purchase_date: new Date().toISOString().split('T')[0],
        });
      } else {
        setModalError(res.message);
      }
    } catch (err: any) {
      setModalError(err?.message || 'Failed to bulk create equipment.');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setFeedback(null);
    setModalError(null);

    // Authorization check: Only staff (TEACHER or ADMIN)
    if (currentUser && currentUser.role !== 'TEACHER' && currentUser.role !== 'ADMIN') {
      setModalError('Unauthorized: Only faculty and staff can edit equipment inventory.');
      return;
    }

    const currentIssued = editingItem.issued_quantity ?? 0;
    const inputTotal = Number(editingItem.quantity);

    if (isNaN(inputTotal) || !Number.isInteger(inputTotal) || inputTotal <= 0) {
      setModalError('Total quantity must be a positive whole number greater than 0.');
      return;
    }

    if (inputTotal < currentIssued) {
      setModalError(`Cannot reduce total quantity below currently issued quantity (${currentIssued}).`);
      return;
    }

    const calculatedAvailable = inputTotal - currentIssued;
    if (calculatedAvailable < 0) {
      setModalError('Available quantity cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await editEquipment(editingItem.id, {
        name: editingItem.name,
        condition: editingItem.condition,
        purchase_date: editingItem.purchase_date,
        remarks: editingItem.remarks,
        quantity: inputTotal,
        available_quantity: calculatedAvailable,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setEditingItem(null);
      } else {
        setModalError(res.message);
      }
    } catch (err: any) {
      setModalError(err?.message || 'Failed to update equipment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: Equipment['status'], remarks: string) => {
    setFeedback(null);
    try {
      const res = await updateEquipmentStatus(id, status, remarks);
      setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update equipment status.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span>Sports Equipment Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain sports inventory, track conditions, register batches, and update status lifecycles.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setModalError(null);
              if (!bulkForm.sport_id && creationSports[0]) {
                setBulkForm(prev => ({ ...prev, sport_id: creationSports[0].id }));
              }
              setIsBulkModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors"
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Bulk Code Generator</span>
          </button>

          <button
            onClick={() => {
              setModalError(null);
              if (!singleForm.sport_id && creationSports[0]) {
                setSingleForm(prev => ({ ...prev, sport_id: creationSports[0].id }));
              }
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Single Equipment</span>
          </button>
        </div>
      </div>

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

      {/* Mini Stat Summary (Section 10) */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
          <div className="text-[11px] font-semibold text-slate-500">Total Units</div>
          <div className="text-xl font-bold text-slate-900">{total}</div>
          <div className="text-[10px] text-slate-400">{totalItemTypes} gear types</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-emerald-200 text-center">
          <div className="text-[11px] font-semibold text-emerald-600">Available</div>
          <div className="text-xl font-bold text-emerald-700">{available}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-blue-200 text-center">
          <div className="text-[11px] font-semibold text-blue-600">Issued</div>
          <div className="text-xl font-bold text-blue-700">{issued}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-orange-200 text-center">
          <div className="text-[11px] font-semibold text-orange-600">Return Pending</div>
          <div className="text-xl font-bold text-orange-700">{returnPending}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-rose-200 text-center">
          <div className="text-[11px] font-semibold text-rose-600">Damaged</div>
          <div className="text-xl font-bold text-rose-700">{damaged}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-neutral-300 text-center">
          <div className="text-[11px] font-semibold text-neutral-600">Lost</div>
          <div className="text-xl font-bold text-neutral-800">{lost}</div>
        </div>
      </div>

      {/* Filters and Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search equipment name, code (e.g. TT-R-001)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sport Filter */}
          <select
            value={sportFilter}
            onChange={e => setSportFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white"
          >
            <option value="ALL">All Sports</option>
            {catalogSports.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ISSUED">Issued</option>
            <option value="RETURN_PENDING">Return Pending</option>
            <option value="DAMAGED">Damaged</option>
            <option value="LOST">Lost</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Condition Filter */}
          <select
            value={conditionFilter}
            onChange={e => setConditionFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white"
          >
            <option value="ALL">All Conditions</option>
            <option value="EXCELLENT">Excellent</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
            <option value="DAMAGED">Damaged</option>
          </select>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {equipment.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No equipment added yet</div>
            <p className="text-xs text-slate-400">
              Use &ldquo;Add Single Equipment&rdquo; or &ldquo;Bulk Code Generator&rdquo; above to add sports inventory.
            </p>
          </div>
        ) : filteredEquipment.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No equipment matches the selected search filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Equipment Name</th>
                  <th className="px-4 py-3">Sport</th>
                  <th className="px-4 py-3">Inventory Units</th>
                  <th className="px-4 py-3">Condition</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Purchase Date</th>
                  <th className="px-4 py-3 text-right">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEquipment.map(item => {
                  const isHighlighted = highlightRecord?.recordId === item.id;

                  return (
                    <tr 
                      key={item.id} 
                      id={`equipment-row-${item.id}`}
                      className={`transition-all ${
                        isHighlighted 
                          ? 'bg-blue-50/90 ring-2 ring-blue-500 shadow-sm' 
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Equipment Code */}
                      <td className="px-4 py-3 font-mono font-bold text-xs text-slate-800">
                        <div className="flex items-center space-x-1.5">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {item.equipment_code}
                          </span>
                          {isHighlighted && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider animate-pulse">
                              Linked
                            </span>
                          )}
                        </div>
                      </td>

                    {/* Equipment Name & Sample flag */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      {item.sample_data_flag && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-medium">
                          SAMPLE DATA
                        </span>
                      )}
                      {item.remarks && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                          {item.remarks}
                        </div>
                      )}
                    </td>

                    {/* Sport */}
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {getSportName(item.sport_id)}
                    </td>

                    {/* Inventory Units */}
                    <td className="px-4 py-3 text-xs">
                      <div className="font-bold text-slate-800">
                        Total: {item.quantity}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                        {item.available_quantity} available
                      </div>
                      <div className="text-[10px] text-blue-600">
                        {item.issued_quantity} issued
                      </div>
                    </td>

                    {/* Condition */}
                    <td className="px-4 py-3">
                      <StatusBadge status={item.condition} />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* Purchase Date */}
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                      {item.purchase_date}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          id={`btn-manage-equipment-${item.id}`}
                          onClick={() => {
                            setFeedback(null);
                            setModalError(null);
                            setEditingItem({ ...item });
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 rounded-lg border border-slate-200 transition-colors shadow-2xs"
                          title={`Edit specifications and manage quantity for ${item.name} (${item.equipment_code})`}
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Manage</span>
                        </button>

                        {/* Quick Status Adjustments */}
                        {item.status !== 'AVAILABLE' && item.status !== 'ISSUED' && item.status !== 'RETURN_PENDING' && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'AVAILABLE', 'Restored to inventory after maintenance')}
                            className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 cursor-pointer"
                            title="Restore to Available"
                          >
                            Mark Available
                          </button>
                        )}

                        {item.status === 'AVAILABLE' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(item.id, 'DAMAGED', 'Reported damaged during inspection')}
                              className="px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 cursor-pointer"
                              title="Mark Damaged"
                            >
                              Damaged
                            </button>
                            <button
                              onClick={() => handleStatusChange(item.id, 'LOST', 'Flagged lost during inventory audit')}
                              className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                              title="Mark Lost"
                            >
                              Lost
                            </button>
                            <button
                              onClick={() => handleStatusChange(item.id, 'ARCHIVED', 'Archived older model')}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                              title="Archive Equipment"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          </>
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

      {/* MODAL 1: Add Single Equipment */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add Sports Equipment</h3>
              <button
                type="button"
                onClick={() => {
                  setModalError(null);
                  setIsAddModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-3.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Equipment Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TT-R-005, CR-010"
                    value={singleForm.equipment_code}
                    onChange={e => setSingleForm({ ...singleForm, equipment_code: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    step={1}
                    value={singleForm.quantity}
                    onChange={e => setSingleForm({ ...singleForm, quantity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Equipment Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yonex Astrox 88D Play"
                  value={singleForm.name}
                  onChange={e => setSingleForm({ ...singleForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Sport / Discipline <span className="text-rose-500">*</span>
                </label>
                <select
                  value={singleForm.sport_id || creationSports[0]?.id || ''}
                  onChange={e => setSingleForm({ ...singleForm, sport_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {creationSports.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Initial Condition
                  </label>
                  <select
                    value={singleForm.condition}
                    onChange={e => setSingleForm({ ...singleForm, condition: e.target.value as EquipmentCondition })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EXCELLENT">Excellent</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={singleForm.purchase_date}
                    onChange={e => setSingleForm({ ...singleForm, purchase_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Remarks / Specifications
                </label>
                <textarea
                  rows={2}
                  value={singleForm.remarks}
                  onChange={e => setSingleForm({ ...singleForm, remarks: e.target.value })}
                  placeholder="e.g. Purchased under Dr. Moonje Sports Budget 2024-25"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setModalError(null);
                    setIsAddModalOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Save Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Bulk Code Generator (Section 12) */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Bulk Equipment Generator</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalError(null);
                  setIsBulkModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Quickly generate sequentially numbered inventory codes (e.g. prefix <span className="font-mono font-bold text-slate-800">TT-R</span> with quantity <span className="font-bold text-slate-800">5</span> generates <span className="font-mono text-slate-800">TT-R-001</span> through <span className="font-mono text-slate-800">TT-R-005</span>, checking for existing codes automatically).
            </p>

            {modalError && (
              <div className="mb-3.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleBulkSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Code Prefix <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TT-R, FB, VB"
                    value={bulkForm.prefix}
                    onChange={e => setBulkForm({ ...bulkForm, prefix: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={50}
                    value={bulkForm.quantity}
                    onChange={e => setBulkForm({ ...bulkForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Base Equipment Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stag Championship TT Paddle"
                  value={bulkForm.name}
                  onChange={e => setBulkForm({ ...bulkForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Sport / Discipline
                </label>
                <select
                  value={bulkForm.sport_id || creationSports[0]?.id || ''}
                  onChange={e => setBulkForm({ ...bulkForm, sport_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {creationSports.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Initial Condition
                  </label>
                  <select
                    value={bulkForm.condition}
                    onChange={e => setBulkForm({ ...bulkForm, condition: e.target.value as EquipmentCondition })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="EXCELLENT">Excellent</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={bulkForm.purchase_date}
                    onChange={e => setBulkForm({ ...bulkForm, purchase_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setModalError(null);
                    setIsBulkModalOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Generate Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit & Manage Equipment */}
      {editingItem && (() => {
        const currentIssued = editingItem.issued_quantity ?? 0;
        const inputTotal = Number(editingItem.quantity);
        const derivedAvailable = inputTotal - currentIssued;
        const isQuantityInvalid = isNaN(inputTotal) || !Number.isInteger(inputTotal) || inputTotal <= 0;
        const isBelowIssued = !isQuantityInvalid && inputTotal < currentIssued;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <Edit3 className="w-4 h-4 text-blue-600" />
                    <span>Manage Equipment: {editingItem.equipment_code}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update item details and manage total stock. ID ({editingItem.id}) and code remain unchanged.
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setModalError(null);
                    setEditingItem(null);
                  }} 
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="mb-3.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Equipment Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.name}
                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                {/* INVENTORY QUANTITY MANAGEMENT BOX */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                      <Package className="w-3.5 h-3.5 text-blue-600" />
                      <span>Manage Inventory Units</span>
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Code: {editingItem.equipment_code}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Total Quantity: Staff Editable */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-left">
                      <label htmlFor="edit-item-total-qty" className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                        Total Units <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="edit-item-total-qty"
                        type="number"
                        min={currentIssued > 0 ? currentIssued : 1}
                        step={1}
                        required
                        value={editingItem.quantity}
                        onChange={e => {
                          const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                          setEditingItem({
                            ...editingItem,
                            quantity: val as any,
                          });
                        }}
                        className={`w-full px-2.5 py-1.5 text-base font-bold rounded border ${
                          isBelowIssued || isQuantityInvalid 
                            ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/30' 
                            : 'border-slate-300 focus:ring-blue-500 text-slate-900'
                        } focus:ring-2 focus:outline-none`}
                      />
                      <div className="text-[10px] text-slate-400 mt-1">Staff editable</div>
                    </div>

                    {/* Issued Quantity: Immutable */}
                    <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-200 text-center flex flex-col justify-between">
                      <div className="text-[10px] uppercase font-bold text-blue-700">Currently Issued</div>
                      <div className="text-xl font-black text-blue-800">{currentIssued}</div>
                      <div className="text-[10px] text-blue-600 font-medium">With students</div>
                    </div>

                    {/* Available Quantity: System Derived (Total - Issued) */}
                    <div className={`p-3 rounded-lg border text-center flex flex-col justify-between ${
                      derivedAvailable > 0 
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800' 
                        : derivedAvailable === 0 
                          ? 'bg-amber-50/70 border-amber-200 text-amber-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      <div className="text-[10px] uppercase font-bold">Auto Available</div>
                      <div className="text-xl font-black">{Math.max(0, derivedAvailable)}</div>
                      <div className="text-[10px] font-semibold">
                        {derivedAvailable >= 0 ? `${inputTotal || 0} − ${currentIssued}` : 'Invalid'}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Validation Alerts */}
                  {isBelowIssued && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Validation Error:</strong> Cannot reduce total quantity below currently issued quantity ({currentIssued}).
                      </div>
                    </div>
                  )}

                  {isQuantityInvalid && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Validation Error:</strong> Total quantity must be a positive whole number greater than 0.
                      </div>
                    </div>
                  )}

                  {!isBelowIssued && !isQuantityInvalid && (
                    <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200/80">
                      <span className="font-semibold text-slate-700">Calculated inventory:</span> Total {inputTotal} − Issued {currentIssued} = <strong className="text-emerald-700 font-bold">{derivedAvailable} available {derivedAvailable === 1 ? 'unit' : 'units'}</strong>. The equipment ID and code ({editingItem.equipment_code}) remain unchanged.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Physical Condition
                    </label>
                    <select
                      value={editingItem.condition}
                      onChange={e => setEditingItem({ ...editingItem, condition: e.target.value as EquipmentCondition })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="EXCELLENT">Excellent</option>
                      <option value="GOOD">Good</option>
                      <option value="FAIR">Fair</option>
                      <option value="DAMAGED">Damaged</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      value={editingItem.purchase_date}
                      onChange={e => setEditingItem({ ...editingItem, purchase_date: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Remarks / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={editingItem.remarks}
                    onChange={e => setEditingItem({ ...editingItem, remarks: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Match grade equipment, recently audited"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setModalError(null);
                      setEditingItem(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isBelowIssued || isQuantityInvalid}
                    className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-xs transition-colors ${
                      isSubmitting || isBelowIssued || isQuantityInvalid 
                        ? 'bg-slate-300 cursor-not-allowed text-slate-500' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isSubmitting ? 'Updating...' : 'Update Equipment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
