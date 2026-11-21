import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getCatalogSports, matchesSportFilter, resolveEquipmentSportName } from '../utils/sportsHelper';
import { X, AlertCircle, CheckCircle2, PackageCheck, Layers, Minus, Plus } from 'lucide-react';

interface RequestEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEquipmentId?: string;
}

export const RequestEquipmentModal: React.FC<RequestEquipmentModalProps> = ({
  isOpen,
  onClose,
  initialEquipmentId,
}) => {
  const { sports, equipment, currentUser, requestEquipment } = useApp();

  const [selectedSportId, setSelectedSportId] = useState<string>('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>(initialEquipmentId || '');
  const [requestedQuantity, setRequestedQuantity] = useState<number>(1);
  const [expectedReturn, setExpectedReturn] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [purpose, setPurpose] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initial equipment if provided
  useEffect(() => {
    if (initialEquipmentId) {
      setSelectedEquipmentId(initialEquipmentId);
      const found = equipment.find(e => e.id === initialEquipmentId);
      if (found) {
        setSelectedSportId(resolveEquipmentSportName(found.sport_id, sports));
        setRequestedQuantity(found.available_quantity > 0 ? 1 : 0);
      }
    }
  }, [initialEquipmentId, equipment, sports]);

  // When equipment selection changes, reset/validate quantity
  const selectedItem = equipment.find(e => e.id === selectedEquipmentId);

  useEffect(() => {
    if (selectedItem) {
      if (selectedItem.available_quantity > 0) {
        setRequestedQuantity(1);
      } else {
        setRequestedQuantity(0);
      }
      setErrorMsg(null);
    }
  }, [selectedEquipmentId]);

  if (!isOpen) return null;

  const catalogSports = getCatalogSports(equipment, sports);

  // Filter items by sport
  const filteredEquipment = equipment.filter(e => {
    if (!e.active) return false;
    if (selectedSportId && !matchesSportFilter(e.sport_id, selectedSportId, sports)) return false;
    return true;
  });

  // Quantity validation checks
  const maxAvailable = selectedItem ? selectedItem.available_quantity : 0;
  const isOutOfStock = selectedItem ? selectedItem.available_quantity <= 0 : false;
  const isQuantityExceeded = selectedItem ? requestedQuantity > maxAvailable : false;
  const isQuantityTooLow = requestedQuantity < 1;

  const handleClose = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleQuantityChange = (val: number) => {
    setErrorMsg(null);
    setRequestedQuantity(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedEquipmentId || !selectedItem) {
      setErrorMsg('Please select an equipment item.');
      return;
    }

    if (selectedItem.available_quantity <= 0) {
      setErrorMsg('Equipment is currently out of stock.');
      return;
    }

    if (requestedQuantity < 1) {
      setErrorMsg('Please request at least 1 unit.');
      return;
    }

    if (requestedQuantity > selectedItem.available_quantity) {
      setErrorMsg(`Only ${selectedItem.available_quantity} available`);
      return;
    }

    if (!expectedReturn) {
      setErrorMsg('Please select an expected return date.');
      return;
    }

    if (!purpose.trim()) {
      setErrorMsg('Please state the purpose of borrowing this equipment.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await requestEquipment(
        selectedEquipmentId,
        expectedReturn,
        purpose,
        undefined,
        requestedQuantity
      );

      if (!result.success) {
        setErrorMsg(result.message);
      } else {
        setSuccessMsg(result.message);
        setTimeout(() => {
          handleClose();
        }, 1400);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Request Sports Equipment</h3>
            <p className="text-xs text-slate-300">
              Select sport, item, and requested quantity for Dr. Moonje Institute Sports Dept
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2 text-emerald-700 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* STEP 1: Sport Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Step 1: Select Sport / Category
            </label>
            <select
              value={selectedSportId}
              onChange={e => {
                const sportId = e.target.value;
                setSelectedSportId(sportId);
                // Clear selected equipment if it does not belong to the newly selected sport
                if (selectedItem && sportId && !matchesSportFilter(selectedItem.sport_id, sportId, sports)) {
                  setSelectedEquipmentId('');
                }
              }}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 font-medium"
            >
              <option value="">All Sports Categories</option>
              {catalogSports.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* STEP 2: Item Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Step 2: Select Equipment Item <span className="text-rose-500">*</span>
            </label>
            {filteredEquipment.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                No equipment items registered under this category.
              </div>
            ) : (
              <select
                required
                value={selectedEquipmentId}
                onChange={e => setSelectedEquipmentId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              >
                <option value="">-- Choose Equipment --</option>
                {filteredEquipment.map(item => (
                  <option key={item.id} value={item.id}>
                    [{item.equipment_code}] {item.name} — {item.available_quantity} available (Total: {item.quantity})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* STEP 3: Show Total Quantity, Currently Issued, and Currently Available */}
          {selectedItem && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">Inventory Status: {selectedItem.name}</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {selectedItem.equipment_code}
                </span>
              </div>

              {/* 3-Column Stats: Total Quantity, Currently Issued, Currently Available */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-center shadow-2xs">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Quantity</div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">{selectedItem.quantity}</div>
                  <div className="text-[10px] text-slate-400">Total units</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-blue-200 text-center shadow-2xs">
                  <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Currently Issued</div>
                  <div className="text-xl font-black text-blue-700 mt-0.5">{selectedItem.issued_quantity}</div>
                  <div className="text-[10px] text-blue-500">In custody</div>
                </div>

                <div className={`p-3 rounded-lg border text-center shadow-2xs ${
                  selectedItem.available_quantity > 0 
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900' 
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}>
                  <div className="text-[11px] font-semibold uppercase tracking-wider">Currently Available</div>
                  <div className="text-xl font-black mt-0.5">
                    {selectedItem.available_quantity}
                  </div>
                  <div className="text-[10px] font-medium">
                    {selectedItem.available_quantity > 0 ? 'Ready to issue' : 'Out of stock'}
                  </div>
                </div>
              </div>

              {/* Condition and location notes */}
              <div className="flex items-center justify-between text-[11px] text-slate-600 px-1 pt-1">
                <div>
                  <span className="font-semibold text-slate-700">Condition:</span>{' '}
                  <span className="font-medium text-slate-900">{selectedItem.condition}</span>
                  {selectedItem.brand && <span> • {selectedItem.brand}</span>}
                </div>
                {selectedItem.location && (
                  <div>
                    <span className="font-semibold text-slate-700">Location:</span> {selectedItem.location}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Student selects requested quantity */}
          {selectedItem && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Step 3: Requested Quantity <span className="text-rose-500">*</span>
                </label>
                <div className="text-xs font-semibold text-slate-600">
                  Currently Available: <span className="font-bold text-emerald-700">{selectedItem.available_quantity}</span> units
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    disabled={requestedQuantity <= 1 || isOutOfStock}
                    onClick={() => handleQuantityChange(Math.max(1, requestedQuantity - 1))}
                    className="p-2.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min={1}
                    value={requestedQuantity}
                    disabled={isOutOfStock}
                    onChange={e => handleQuantityChange(parseInt(e.target.value, 10) || 0)}
                    className="w-20 text-center font-bold text-base py-2 border-x border-slate-200 focus:outline-none"
                  />

                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => handleQuantityChange(requestedQuantity + 1)}
                    className="p-2.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {selectedItem.available_quantity > 0 && (
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(selectedItem.available_quantity)}
                    className="text-xs px-3 py-2 rounded-lg font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    Max ({selectedItem.available_quantity})
                  </button>
                )}
              </div>

              {/* Real-time Inventory Validation Messages */}
              {isOutOfStock && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Out of stock: 0 units are currently available. All units are issued or undergoing maintenance.</span>
                </div>
              )}

              {isQuantityExceeded && !isOutOfStock && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-start space-x-2.5 text-rose-800 text-xs shadow-2xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <span className="font-bold text-rose-900">Only {selectedItem.available_quantity} available</span>
                    <p className="mt-0.5 text-rose-700">
                      You requested {requestedQuantity} units, which exceeds the {selectedItem.available_quantity} units currently in stock. Please adjust your quantity to {selectedItem.available_quantity} or less.
                    </p>
                  </div>
                </div>
              )}

              {isQuantityTooLow && !isOutOfStock && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium">
                  Requested quantity must be at least 1.
                </div>
              )}

              {!isQuantityExceeded && !isOutOfStock && requestedQuantity >= 1 && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Requesting {requestedQuantity} of {selectedItem.available_quantity} available units ({selectedItem.available_quantity - requestedQuantity} will remain in stock).
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Expected Return Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Expected Return Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={expectedReturn}
                onChange={e => setExpectedReturn(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Standard college equipment loan period is typically same-day or 1-2 school days.
            </p>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Purpose / Reason for Borrowing <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="e.g. Practice session for Inter-College Championship in sports hall..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !selectedEquipmentId || 
                !selectedItem || 
                isOutOfStock || 
                isQuantityExceeded || 
                isQuantityTooLow || 
                isSubmitting
              }
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold shadow-xs transition-colors flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <PackageCheck className="w-4 h-4" />
                  <span>
                    {isQuantityExceeded
                      ? `Only ${selectedItem?.available_quantity} available`
                      : isOutOfStock
                      ? 'Out of Stock'
                      : `Submit Request (${requestedQuantity} ${requestedQuantity === 1 ? 'Unit' : 'Units'})`}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
