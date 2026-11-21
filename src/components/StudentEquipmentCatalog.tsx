import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from './StatusBadge';
import { getCatalogSports, matchesSportFilter } from '../utils/sportsHelper';
import { 
  Package, 
  Search, 
  PlusCircle, 
  Layers,
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface StudentEquipmentCatalogProps {
  onRequestItem: (equipmentId: string) => void;
}

export const StudentEquipmentCatalog: React.FC<StudentEquipmentCatalogProps> = ({ onRequestItem }) => {
  const { equipment, sports, requests, currentUser, getSportName, highlightRecord, setHighlightRecord } = useApp();

  const [selectedSport, setSelectedSport] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-scroll to highlighted equipment from notification
  React.useEffect(() => {
    if (highlightRecord?.recordId) {
      setSelectedSport('ALL');
      setSearchTerm('');
      setTimeout(() => {
        const el = document.getElementById(`catalog-item-${highlightRecord.recordId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  }, [highlightRecord?.recordId]);

  const catalogSports = getCatalogSports(equipment, sports);

  // Active items for students to browse
  const items = equipment.filter(item => {
    if (!item.active) return false;
    if (selectedSport !== 'ALL' && !matchesSportFilter(item.sport_id, selectedSport, sports)) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!item.name.toLowerCase().includes(term) && !item.equipment_code.toLowerCase().includes(term)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <Package className="w-5 h-5 text-blue-600" />
          <span>College Sports Equipment Catalogue</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Browse sports equipment available in Dr. Moonje Institute sports store and request items by quantity.
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search sports gear (bat, ball, racket, TT...)"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-600">Category:</span>
          <select
            value={selectedSport}
            onChange={e => setSelectedSport(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white"
          >
            <option value="ALL">All Sports</option>
            {catalogSports.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Equipment Grid */}
      {equipment.filter(e => e.active).length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No equipment added yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            The sports department catalog does not have any equipment listed yet. Please check back once faculty add new items.
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-10 text-center">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No matching equipment found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try clearing your search term or selecting All Sports.
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => {
          const hasAvailableUnits = item.available_quantity > 0;
          const activeStudentRequests = requests.filter(
            r =>
              r.student_id === currentUser?.id &&
              r.equipment_id === item.id &&
              (r.status === 'PENDING' || r.status === 'APPROVED' || r.status === 'ISSUED')
          );

          const isHighlighted = highlightRecord?.recordId === item.id;

          return (
            <div
              key={item.id}
              id={`catalog-item-${item.id}`}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                isHighlighted
                  ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-500 shadow-md'
                  : hasAvailableUnits
                  ? 'bg-white border-slate-200 shadow-xs hover:border-blue-300'
                  : 'bg-slate-50/70 border-slate-200 opacity-80'
              }`}
            >
              <div>
                {/* Code and Status */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {item.equipment_code}
                    </span>
                    {isHighlighted && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider animate-pulse">
                        Linked
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    {hasAvailableUnits ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {item.available_quantity} In Stock
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {item.name}
                </h3>
                <div className="text-xs text-blue-600 font-semibold mt-0.5">
                  {getSportName(item.sport_id)}
                </div>

                {/* Real-time Inventory Quantities: Total, Issued, Available */}
                <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-3 gap-1.5 text-center">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total</div>
                    <div className="text-sm font-black text-slate-800">{item.quantity}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-blue-500">Issued</div>
                    <div className="text-sm font-black text-blue-700">{item.issued_quantity}</div>
                  </div>
                  <div className={hasAvailableUnits ? 'text-emerald-700' : 'text-rose-600'}>
                    <div className="text-[10px] uppercase font-bold">Available</div>
                    <div className="text-sm font-black">{item.available_quantity}</div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center space-x-3 text-xs text-slate-500">
                  <span>Condition: <strong className="text-slate-700">{item.condition}</strong></span>
                  {item.location && (
                    <span className="truncate max-w-[130px]">• {item.location}</span>
                  )}
                </div>

                {/* Informational chip if student already has active units */}
                {activeStudentRequests.length > 0 && (
                  <div className="mt-2.5 p-2 bg-amber-50/80 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      You have {activeStudentRequests.length} active request(s) ({activeStudentRequests.map(r => `${r.quantity}x ${r.status}`).join(', ')}).
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {hasAvailableUnits
                    ? `${item.available_quantity} ready to borrow`
                    : 'All units currently issued'}
                </span>

                <button
                  disabled={!hasAvailableUnits}
                  onClick={() => onRequestItem(item.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors ${
                    hasAvailableUnits
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{hasAvailableUnits ? 'Request Item' : 'Out of Stock'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
