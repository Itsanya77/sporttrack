import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { isFirebaseConfigured } from '../firebase';
import {
  loadRawFirestoreEquipmentDocs,
  atomicImportFirestoreEquipment,
} from '../services/firestoreService';
import {
  buildImportEquipmentRows,
  EXPECTED_IMPORT_RECORDS,
  EXPECTED_IMPORT_UNITS,
} from '../data/collegeEquipmentImport';
import {
  Upload,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Search,
  Lock,
  PackagePlus,
} from 'lucide-react';

interface AdminImportEquipmentProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminImportEquipment: React.FC<AdminImportEquipmentProps> = ({ onNavigateTab }) => {
  const {
    currentUser,
    equipment,
    replaceEquipmentCatalogState,
    refreshEquipmentFromFirestore,
  } = useApp();

  const isAdmin = currentUser?.role === 'ADMIN';

  const [existingCount, setExistingCount] = useState<number>(0);
  const [existingItems, setExistingItems] = useState<Array<{ id: string; code: string; name: string; quantity: number }>>([]);
  const [isCheckingExisting, setIsCheckingExisting] = useState<boolean>(true);
  const [checkError, setCheckError] = useState<string | null>(null);

  const [previewSearch, setPreviewSearch] = useState<string>('');
  const [confirmText, setConfirmText] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{
    createdCount: number;
    totalUnits: number;
  } | null>(null);

  const prepared = useMemo(() => buildImportEquipmentRows(), []);

  const filteredRows = useMemo(() => {
    if (!previewSearch.trim()) return prepared.rows;
    const term = previewSearch.trim().toLowerCase();
    return prepared.rows.filter(
      r =>
        r.name.toLowerCase().includes(term) ||
        r.sport.toLowerCase().includes(term) ||
        r.equipment_code.toLowerCase().includes(term) ||
        r.remarks.toLowerCase().includes(term)
    );
  }, [prepared.rows, previewSearch]);

  const checkExistingEquipment = async () => {
    setIsCheckingExisting(true);
    setCheckError(null);

    try {
      if (isFirebaseConfigured) {
        const docs = await loadRawFirestoreEquipmentDocs();
        setExistingCount(docs.length);
        setExistingItems(
          docs.map(d => ({
            id: d.id,
            code: d.normalized.equipment_code,
            name: d.normalized.name,
            quantity: d.normalized.quantity,
          }))
        );
      } else {
        const validLocal = equipment.filter(
          item => item && typeof item.name === 'string' && typeof item.quantity === 'number'
        );
        setExistingCount(validLocal.length);
        setExistingItems(
          validLocal.map(item => ({
            id: item.id,
            code: item.equipment_code,
            name: item.name,
            quantity: item.quantity,
          }))
        );
      }
    } catch (err: any) {
      setCheckError(err?.message || 'Failed to inspect the equipment collection in Firestore.');
    } finally {
      setIsCheckingExisting(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      checkExistingEquipment();
    } else {
      setIsCheckingExisting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Strict ADMIN-only guard (rendered if non-admin opens the route)
  if (!isAdmin) {
    const fallbackTab = currentUser?.role === 'STUDENT' ? 'student-dashboard' : 'dashboard';
    return (
      <div className="bg-white rounded-2xl p-8 border border-rose-200 shadow-sm text-center max-w-xl mx-auto my-12">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
          Admin access required
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          This one-time catalog import tool is restricted exclusively to accounts with the <strong>ADMIN</strong> role. Teachers and students cannot access or run it.
        </p>
        <button
          type="button"
          onClick={() => onNavigateTab(fallbackTab)}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const countsMatchExpected =
    prepared.totalRecords === EXPECTED_IMPORT_RECORDS &&
    prepared.totalUnits === EXPECTED_IMPORT_UNITS;

  const isValidationValid =
    prepared.validationErrors.length === 0 && countsMatchExpected;

  const isBlockedByExisting = existingCount > 0;

  const canImport =
    !isCheckingExisting &&
    !checkError &&
    !isBlockedByExisting &&
    isValidationValid &&
    confirmText === 'IMPORT' &&
    !isImporting &&
    !importSummary;

  const handleConfirmImport = async () => {
    if (!canImport) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const freshRows = buildImportEquipmentRows();
      if (
        freshRows.validationErrors.length > 0 ||
        freshRows.totalRecords !== EXPECTED_IMPORT_RECORDS ||
        freshRows.totalUnits !== EXPECTED_IMPORT_UNITS
      ) {
        throw new Error('Catalog validation failed prior to Firestore write.');
      }

      const itemsToCreate = freshRows.rows.map(r => r.equipment);
      let createdCount = itemsToCreate.length;

      if (isFirebaseConfigured) {
        const res = await atomicImportFirestoreEquipment(itemsToCreate);
        createdCount = res.createdCount;
        try {
          await refreshEquipmentFromFirestore();
        } catch {
          replaceEquipmentCatalogState(itemsToCreate);
        }
      } else {
        replaceEquipmentCatalogState(itemsToCreate);
      }

      setExistingCount(createdCount);
      setImportSummary({
        createdCount,
        totalUnits: freshRows.totalUnits,
      });
    } catch (err: any) {
      setImportError(err?.message || 'Atomic batch import failed in Firestore. Nothing was created.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin-Only One-Time Catalog Import Tool</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Import Equipment
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Creates the college&apos;s official sports equipment catalog ({EXPECTED_IMPORT_RECORDS} records, {EXPECTED_IMPORT_UNITS} total units) with new document IDs in one atomic Firestore write batch. Does not delete or modify any existing records.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={checkExistingEquipment}
            disabled={isCheckingExisting || isImporting}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingExisting ? 'animate-spin' : ''}`} />
            <span>Re-check Collection</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('equipment')}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
          >
            Back to Equipment
          </button>
        </div>
      </div>

      {/* Totals & Validation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Catalog Records to Create</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {prepared.totalRecords}
            <span className={`text-xs font-bold ml-2 ${prepared.totalRecords === EXPECTED_IMPORT_RECORDS ? 'text-emerald-600' : 'text-rose-600'}`}>
              / {EXPECTED_IMPORT_RECORDS} expected {prepared.totalRecords === EXPECTED_IMPORT_RECORDS ? '✓' : '✗'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Equipment Units</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {prepared.totalUnits}
            <span className={`text-xs font-bold ml-2 ${prepared.totalUnits === EXPECTED_IMPORT_UNITS ? 'text-emerald-600' : 'text-rose-600'}`}>
              / {EXPECTED_IMPORT_UNITS} expected {prepared.totalUnits === EXPECTED_IMPORT_UNITS ? '✓' : '✗'}
            </span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-xs ${
          isCheckingExisting
            ? 'bg-slate-50 border-slate-200'
            : checkError || isBlockedByExisting
            ? 'bg-rose-50 border-rose-300'
            : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="text-xs font-semibold text-slate-600">Current Equipment Collection</div>
          <div className="text-lg font-black mt-1 flex items-center space-x-2">
            {isCheckingExisting ? (
              <span className="text-slate-600 flex items-center space-x-1.5 text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Checking Firestore...</span>
              </span>
            ) : importSummary ? (
              <span className="text-emerald-800 text-sm">Imported ({importSummary.createdCount} items)</span>
            ) : isBlockedByExisting ? (
              <span className="text-rose-800 text-sm">{existingCount} existing item(s) — Blocked</span>
            ) : (
              <span className="text-emerald-800 text-sm">0 items — Ready to Import</span>
            )}
          </div>
        </div>
      </div>

      {/* Collection Check Error Banner */}
      {checkError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">Could not verify equipment collection</div>
            <p className="mt-1">{checkError}</p>
          </div>
        </div>
      )}

      {/* Existing Equipment Blocker Banner */}
      {!importSummary && !isCheckingExisting && !checkError && isBlockedByExisting && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 flex items-start space-x-3">
          <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-2 flex-1">
            <div className="text-sm font-bold text-rose-950">
              Import Blocked: Equipment collection already contains {existingCount} real equipment item(s)
            </div>
            <p>
              This tool only imports into an empty equipment collection and will never delete or overwrite existing items. Please verify the equipment collection has 0 real equipment items (documents with a string name and numeric quantity), then click <strong>Re-check Collection</strong>.
            </p>
            {existingItems.length > 0 && (
              <div className="bg-white/80 border border-rose-200 rounded-xl p-2.5 text-[11px] space-y-1 max-h-36 overflow-y-auto">
                <div className="font-bold text-rose-950">Detected existing items:</div>
                {existingItems.slice(0, 12).map(item => (
                  <div key={item.id} className="font-mono text-rose-900">
                    • {item.code} — {item.name} (Qty: {item.quantity})
                  </div>
                ))}
                {existingItems.length > 12 && (
                  <div className="text-rose-700 font-semibold">
                    ...and {existingItems.length - 12} more item(s).
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Validation Errors Banner */}
      {!isValidationValid && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs space-y-2">
          <div className="font-bold text-sm flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Dataset Validation Failed</span>
          </div>
          {!countsMatchExpected && (
            <p>
              Totals mismatch: found {prepared.totalRecords} records ({prepared.totalUnits} units), expected {EXPECTED_IMPORT_RECORDS} records ({EXPECTED_IMPORT_UNITS} units).
            </p>
          )}
          {prepared.validationErrors.map((err, i) => (
            <p key={i}>• {err}</p>
          ))}
        </div>
      )}

      {/* Final Import Summary Banner */}
      {importSummary && (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-4">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-bold text-emerald-950">
                College Equipment Catalog Imported Successfully
              </h3>
              <p className="text-sm text-emerald-800 mt-1">
                Summary: <strong>created {importSummary.createdCount}</strong> equipment records (<strong>{importSummary.totalUnits} total units</strong>) with status AVAILABLE and condition GOOD. Equipment state has been refreshed from Firestore.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={() => onNavigateTab('equipment')}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
            >
              Open Equipment Management
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className="px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Preview: Equipment Records to Create ({prepared.totalRecords} records • {prepared.totalUnits} total units)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Expected check: <strong>{EXPECTED_IMPORT_RECORDS}</strong> records, <strong>{EXPECTED_IMPORT_UNITS}</strong> total units. Defaults: <span className="font-mono font-semibold">status: AVAILABLE</span>, <span className="font-mono font-semibold">condition: GOOD</span>, <span className="font-mono font-semibold">issued_quantity: 0</span>, <span className="font-mono font-semibold">available_quantity: Qty</span>.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={previewSearch}
              onChange={e => setPreviewSearch(e.target.value)}
              placeholder="Filter preview by name, sport, code..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[28rem] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200 sticky top-0">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Sport</th>
                <th className="px-4 py-3">Generated Code</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map(row => (
                <tr key={row.equipment_code} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-400 font-mono">{row.index}</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-900">{row.name}</td>
                  <td className="px-4 py-2.5 text-slate-700 font-medium">{row.sport}</td>
                  <td className="px-4 py-2.5 font-mono font-bold text-blue-700">{row.equipment_code}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-900">{row.quantity}</td>
                  <td className="px-4 py-2.5">
                    {row.remarks ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold text-[10px]">
                        {row.remarks}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-800 sticky bottom-0">
              <tr>
                <td className="px-4 py-2.5" colSpan={3}>
                  Total ({filteredRows.length} shown of {prepared.totalRecords} records)
                </td>
                <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">Unique codes</td>
                <td className="px-4 py-2.5 text-right">
                  {filteredRows.reduce((sum, r) => sum + r.quantity, 0)}
                </td>
                <td className="px-4 py-2.5" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Confirmation & Execute Section */}
      {!importSummary && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <PackagePlus className="w-4 h-4 text-blue-600" />
              <span>Confirm & Execute Atomic Catalog Import</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Creates all {prepared.totalRecords} documents ({prepared.totalUnits} total units) with new document IDs in ONE atomic Firestore <span className="font-mono font-semibold">writeBatch</span>. If the write fails, nothing is created.
            </p>
          </div>

          {importError && (
            <div className="p-4 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-semibold flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <span>Error: {importError}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Type <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 text-blue-700">IMPORT</span> exactly to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                disabled={isImporting || isBlockedByExisting || !isValidationValid || isCheckingExisting || Boolean(checkError)}
                placeholder="Type IMPORT"
                className="w-full sm:w-72 px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />
            </div>

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={!canImport}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing ({prepared.totalRecords} items)...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Import {prepared.totalRecords} Equipment Records</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
