import React, { useState } from 'react';
import { AlertTriangle, XCircle, Search, Filter, Eye, RefreshCw, MapPin, Truck, ArrowLeft, CheckCircle2, Phone, AlertCircle, FileSpreadsheet, Lock, AlertOctagon } from 'lucide-react';
import { CollectionRecord } from '../types';
import { householdNotCoveredIcon, householdNotCoveredFallbackIcon } from '../constants/branding';

interface NotCollectedViewProps {
  records: CollectionRecord[];
  onInspectRecord: (record: CollectionRecord) => void;
  onBackToOverview?: () => void;
  onNavigateToCovered?: () => void;
}

export const NotCollectedView: React.FC<NotCollectedViewProps> = ({
  records,
  onInspectRecord,
  onBackToOverview,
  onNavigateToCovered,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('All');
  const [reasonFilter, setReasonFilter] = useState('All');

  const pendingRecords = records.filter(
    (r) => r.status === 'Not Collected'
  );
  const collectedCount = records.filter(r => r.status === 'Collected').length;

  const lockedCount = pendingRecords.filter(r => r.reasonIfNotCollected?.toLowerCase().includes('lock') || r.remarks?.toLowerCase().includes('lock')).length;
  const obstacleCount = pendingRecords.filter(r => r.reasonIfNotCollected?.toLowerCase().includes('road') || r.reasonIfNotCollected?.toLowerCase().includes('obstacle') || r.remarks?.toLowerCase().includes('road')).length;
  const delayCount = pendingRecords.length - lockedCount - obstacleCount > 0 ? pendingRecords.length - lockedCount - obstacleCount : 0;

  const filtered = pendingRecords.filter((r) => {
    const matchesSearch =
      r.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ward.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.workerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = selectedZone === 'All' || r.zone === selectedZone;
    const matchesReason = reasonFilter === 'All' || (r.reasonIfNotCollected && r.reasonIfNotCollected.includes(reasonFilter));
    return matchesSearch && matchesZone && matchesReason;
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-white rounded-2xl p-6 border border-rose-200/90 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-rose-600/60 bg-white p-0.5 flex-shrink-0 shadow-sm flex items-center justify-center">
            <img
              src={householdNotCoveredIcon}
              alt="Total Household Not Collected"
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (e.currentTarget.src !== householdNotCoveredFallbackIcon) {
                  e.currentTarget.src = householdNotCoveredFallbackIcon;
                }
              }}
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md">
                Priority Missed Locations Report
              </span>
              {onBackToOverview && (
                <button
                  onClick={onBackToOverview}
                  className="text-xs text-gray-500 hover:text-rose-700 font-bold flex items-center gap-1 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
                </button>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
              Total Household Not Collected Reports
            </h1>
            <p className="text-xs sm:text-sm font-medium text-rose-800">
              Immediate Attention Required — Uncollected Waste Locations Requiring Inspection & Resolution
            </p>
          </div>
        </div>

        {/* Action / Stats Pill */}
        <div className="flex items-center gap-3">
          <div className="bg-rose-50 border border-rose-200 px-4 py-3 rounded-2xl flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-[#C5221F]" />
            <div>
              <div className="text-[11px] text-rose-800 font-bold uppercase tracking-wider">Not Collected Count</div>
              <div className="text-2xl font-black text-[#C5221F]">{pendingRecords.length.toLocaleString()} <span className="text-xs font-normal text-gray-500">Households</span></div>
            </div>
          </div>

          {onNavigateToCovered && (
            <button
              onClick={onNavigateToCovered}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-3.5 py-3 rounded-2xl transition flex items-center gap-2"
            >
              <span>View Collected ({collectedCount.toLocaleString()})</span>
            </button>
          )}
        </div>
      </div>

      {/* Missed Reason Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-semibold">Locked House / Gate</div>
            <div className="text-xl font-black text-rose-900">{lockedCount} Households</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-semibold">Road Obstacle / Construction</div>
            <div className="text-xl font-black text-amber-900">{obstacleCount} Locations</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-semibold">Other / Vehicle Delay</div>
            <div className="text-xl font-black text-blue-900">{delayCount} Locations</div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search uncollected street, ward or worker name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5221F] font-medium text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#C5221F] text-xs sm:text-sm cursor-pointer"
          >
            <option value="All">All Zones</option>
            <option value="North Zone">North Zone</option>
            <option value="Central Zone">Central Zone</option>
            <option value="South Zone">South Zone</option>
            <option value="West Zone">West Zone</option>
            <option value="East Zone">East Zone</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs font-bold text-gray-600">
            Showing <span className="text-rose-700 font-extrabold">{filtered.length}</span> Priority Pending Waste Locations
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FCE8E6] text-[#C5221F] text-xs sm:text-sm font-bold border-b border-gray-200">
                <th className="px-5 py-3.5">Date & Time</th>
                <th className="px-5 py-3.5">Zone</th>
                <th className="px-5 py-3.5">Ward</th>
                <th className="px-5 py-3.5">Street Address</th>
                <th className="px-5 py-3.5">Reason / Obstacle</th>
                <th className="px-5 py-3.5">Worker Name</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-800">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-rose-50/30 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-gray-700 text-xs">{item.date} • {item.timestamp || '09:15 AM'}</td>
                  <td className="px-5 py-3.5 font-bold text-gray-900">{item.zone}</td>
                  <td className="px-5 py-3.5 font-semibold text-gray-700">{item.ward}</td>
                  <td className="px-5 py-3.5 font-bold text-gray-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#C5221F] flex-shrink-0" />
                    <span>{item.street}</span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-rose-900 font-bold max-w-[220px]">
                    <span className="bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md block truncate">
                      {item.reasonIfNotCollected || 'Vehicle Delay'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-gray-800">{item.workerName}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-[#FCE8E6] text-[#C5221F] border border-rose-200">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Not Collected</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onInspectRecord(item)}
                        title="View Incident Details"
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#C5221F] bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
