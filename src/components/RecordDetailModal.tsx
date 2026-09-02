import React from 'react';
import {
  X,
  MapPin,
  Truck,
  User,
  Phone,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Calendar,
  Navigation,
} from 'lucide-react';
import { CollectionRecord } from '../types';

interface RecordDetailModalProps {
  record: CollectionRecord | null;
  onClose: () => void;
  onStatusChange?: (id: string | number, newStatus: 'Collected' | 'Not Collected') => void;
  onViewOnMap?: (record: CollectionRecord) => void;
  onUploadPhoto?: (recordId: string | number, photoUrl: string, timestamp: string) => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  record,
  onClose,
  onStatusChange,
  onViewOnMap,
}) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#1E7A38] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#166534]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#166534] rounded-lg text-amber-300">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold leading-tight">
                {record.street} — {record.ward}
              </h3>
              <p className="text-xs text-emerald-200 font-medium">
                {record.zone} • Coimbatore Municipal Corporation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-100 hover:text-white hover:bg-[#166534] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-gray-800 text-sm">
          {/* Status & Timestamp Banner */}
          <div
            className={`p-4 rounded-xl flex items-center justify-between border ${
              record.status === 'Collected'
                ? 'bg-[#E9F5ED] border-emerald-200 text-[#1E7A38]'
                : 'bg-[#FCE8E6] border-rose-200 text-[#C5221F]'
            }`}
          >
            <div className="flex items-center gap-3">
              {record.status === 'Collected' ? (
                <ShieldCheck className="w-6 h-6 text-[#1E7A38]" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-[#C5221F]" />
              )}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider opacity-80">Collection Status</div>
                <div className="text-base font-extrabold">{record.status}</div>
              </div>
            </div>

            <div className="text-right text-xs font-semibold">
              <div className="flex items-center gap-1 justify-end">
                <Calendar className="w-3.5 h-3.5" />
                <span>{record.date}</span>
              </div>
              <div className="flex items-center gap-1 justify-end text-gray-600 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{record.time}</span>
              </div>
            </div>
          </div>

          {record.status === 'Not Collected' && record.reasonIfNotCollected && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs">
              <span className="font-bold block text-amber-800 mb-1">Reason for Delay / Non-Collection:</span>
              <p className="font-medium">{record.reasonIfNotCollected}</p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Worker Info */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 space-y-1">
              <div className="text-xs text-gray-500 font-bold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#1E7A38]" />
                <span>Sanitation Worker</span>
              </div>
              <div className="font-bold text-gray-900">{record.workerName}</div>
              {record.workerPhone && (
                <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{record.workerPhone}</span>
                </div>
              )}
            </div>

            {/* Vehicle Info */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 space-y-1">
              <div className="text-xs text-gray-500 font-bold flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#1E7A38]" />
                <span>Assigned Vehicle</span>
              </div>
              <div className="font-mono font-bold text-gray-900">{record.vehicleNo || 'TN 37 CZ 1022'}</div>
              <div className="text-xs text-gray-600 font-medium">GPS Compactor Unit</div>
            </div>
          </div>

          {/* Bin Level Progress */}
          <div className="space-y-1.5 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
            <div className="flex justify-between items-center text-xs font-bold text-gray-700">
              <span>Smart Bin Capacity Sensor Level</span>
              <span className="text-[#1E7A38] font-extrabold">{record.binLevelPercent || 85}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full ${
                  (record.binLevelPercent || 85) > 90
                    ? 'bg-rose-500'
                    : (record.binLevelPercent || 85) > 75
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
                }`}
                style={{ width: `${record.binLevelPercent || 85}%` }}
              ></div>
            </div>
          </div>

          {/* Zone Officer / Supervisor */}
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200/80 flex items-center justify-between">
            <span className="font-semibold">Supervising Officer:</span>
            <span className="font-bold text-gray-900">{record.supervisor || 'S. Rajendran (AE, Zone Officer)'}</span>
          </div>

          {/* Action toggle if needed */}
          {onStatusChange && (
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-600">Manual Override Status:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onStatusChange(record.id, 'Collected');
                    onClose();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    record.status === 'Collected'
                      ? 'bg-[#1E7A38] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-emerald-100 hover:text-emerald-900'
                  }`}
                >
                  Mark Collected
                </button>
                <button
                  onClick={() => {
                    onStatusChange(record.id, 'Not Collected');
                    onClose();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    record.status === 'Not Collected'
                      ? 'bg-[#C5221F] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-rose-100 hover:text-rose-900'
                  }`}
                >
                  Mark Pending
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          {onViewOnMap ? (
            <button
              onClick={() => {
                onViewOnMap(record);
                onClose();
              }}
              className="px-4 py-2 bg-[#1E7A38] hover:bg-[#166534] text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Track on Live GPS Map</span>
            </button>
          ) : <div />}

          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close Telemetry Detail
          </button>
        </div>
      </div>
    </div>
  );
};
