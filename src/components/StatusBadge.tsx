import React from 'react';
import { EquipmentStatus, RequestStatus, ReturnStatus, EquipmentCondition, FeedbackStatus } from '../types';

interface StatusBadgeProps {
  status: EquipmentStatus | RequestStatus | ReturnStatus | EquipmentCondition | FeedbackStatus | 'OVERDUE';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-300';
  let label = status as string;

  switch (status) {
    case 'PENDING':
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-200';
      label = 'Pending';
      break;
    case 'APPROVED':
      badgeStyle = 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-200';
      label = 'Approved';
      break;
    case 'ISSUED':
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-200';
      label = 'Issued';
      break;
    case 'RETURN_PENDING':
      badgeStyle = 'bg-orange-50 text-orange-700 border-orange-300 ring-1 ring-orange-200';
      label = 'Return Pending';
      break;
    case 'RETURNED':
      badgeStyle = 'bg-green-50 text-green-700 border-green-300 ring-1 ring-green-200';
      label = 'Returned';
      break;
    case 'AVAILABLE':
      badgeStyle = 'bg-teal-50 text-teal-700 border-teal-300 ring-1 ring-teal-200';
      label = 'Available';
      break;
    case 'DAMAGED':
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-200';
      label = 'Damaged';
      break;
    case 'LOST':
      badgeStyle = 'bg-neutral-800 text-neutral-100 border-neutral-700 ring-1 ring-neutral-600';
      label = 'Lost';
      break;
    case 'OVERDUE':
      badgeStyle = 'bg-red-100 text-red-800 border-red-400 font-bold ring-2 ring-red-300 animate-pulse';
      label = 'OVERDUE';
      break;
    case 'ARCHIVED':
      badgeStyle = 'bg-gray-100 text-gray-600 border-gray-300 ring-1 ring-gray-200';
      label = 'Archived';
      break;
    case 'REJECTED':
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-200';
      label = 'Rejected';
      break;
    case 'CANCELLED':
      badgeStyle = 'bg-slate-100 text-slate-600 border-slate-300 ring-1 ring-slate-200';
      label = 'Cancelled';
      break;
    case 'NEW':
      badgeStyle = 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-200';
      label = 'New';
      break;
    case 'IN_REVIEW':
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-200';
      label = 'In Review';
      break;
    case 'RESOLVED':
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-200';
      label = 'Resolved';
      break;
    case 'EXCELLENT':
      badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      label = 'Excellent';
      break;
    case 'GOOD':
      badgeStyle = 'bg-blue-50 text-blue-800 border-blue-300';
      label = 'Good';
      break;
    case 'FAIR':
      badgeStyle = 'bg-amber-50 text-amber-800 border-amber-300';
      label = 'Fair';
      break;
    default:
      badgeStyle = 'bg-slate-100 text-slate-700 border-slate-300';
      label = status;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyle} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {label}
    </span>
  );
};
