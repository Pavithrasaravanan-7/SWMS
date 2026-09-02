import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Phone,
  Clock,
  BatteryCharging,
  Fuel,
  Radio,
  ArrowRight,
  Layers,
  Sparkles,
  ShieldCheck,
  Compass,
  FileSpreadsheet,
  Download,
  Check,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getVehicleAssignmentSummary,
  getStoredAssignedAreas,
  saveStoredAssignedAreas,
  VEHICLE_ASSIGNMENT_EVENT,
  AssignedVehicleSummaryItem,
  VehicleMasterInfo,
} from '../utils/vehicleAssignmentStorage';
import { AreaOption } from './VehicleAreaAssignmentView';
import { 
  vehicleAssignmentIcon, 
  vehicleAssignmentFallbackIcon 
} from '../constants/branding';

interface AdminVehicleAssignmentViewProps {
  lang: 'en' | 'ta';
  onNavigateToLiveTracking?: (zone?: string) => void;
  onShowToast?: (msg: string) => void;
}

export const AdminVehicleAssignmentView: React.FC<AdminVehicleAssignmentViewProps> = ({
  lang,
  onNavigateToLiveTracking,
  onShowToast,
}) => {
  const [summaryData, setSummaryData] = useState(() => getVehicleAssignmentSummary());
  const [areas, setAreas] = useState<AreaOption[]>(() => getStoredAssignedAreas());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedVehicleModal, setSelectedVehicleModal] = useState<AssignedVehicleSummaryItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toLocaleTimeString());

  // Function to refresh state from storage
  const refreshData = () => {
    setIsRefreshing(true);
    setSummaryData(getVehicleAssignmentSummary());
    setAreas(getStoredAssignedAreas());
    setLastSyncTime(new Date().toLocaleTimeString());
    setTimeout(() => setIsRefreshing(false), 400);
  };

  // Real-time synchronization listener with field officer assignments
  useEffect(() => {
    const handleUpdate = () => {
      refreshData();
    };

    window.addEventListener(VEHICLE_ASSIGNMENT_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(VEHICLE_ASSIGNMENT_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return summaryData.vehicles.filter((item) => {
      const v = item.vehicle;
      // Vehicle type filter
      if (selectedVehicleType !== 'all' && v.id !== selectedVehicleType) {
        return false;
      }
      // Zone filter
      if (selectedZone !== 'all' && !item.allZones.includes(selectedZone)) {
        return false;
      }
      // Search term filter
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();
      const inPlate = v.plateNo.toLowerCase().includes(q);
      const inName = v.name.toLowerCase().includes(q);
      const inDriver = v.driverName.toLowerCase().includes(q);
      const inArea = item.assignedAreas.some((a) =>
        a.name.toLowerCase().includes(q) || (a.nameTa && a.nameTa.toLowerCase().includes(q))
      );
      const inWard = item.allWards.some((w) => w.toLowerCase().includes(q));
      const inStreet = item.assignedAreas.some((a) =>
        a.streets?.some((s) => s.toLowerCase().includes(q))
      );

      return inPlate || inName || inDriver || inArea || inWard || inStreet;
    });
  }, [summaryData, selectedVehicleType, selectedZone, searchTerm]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Vehicle ID',
      'Vehicle Plate No',
      'Vehicle Type',
      'Capacity',
      'Driver / Officer Name',
      'Driver Phone',
      'Shift Timing',
      'Assigned Areas',
      'Assigned Wards',
      'Total Streets',
      'Total QR Checkpoints',
      'Est. Target Households',
      'GPS Status',
      'Operational Status',
    ];

    const rows = summaryData.vehicles.map((vItem) => [
      vItem.vehicle.id,
      vItem.vehicle.plateNo,
      vItem.vehicle.name,
      vItem.vehicle.capacity,
      vItem.vehicle.driverName,
      vItem.vehicle.driverPhone,
      vItem.vehicle.shiftTiming,
      vItem.assignedAreas.map((a) => a.name).join('; '),
      vItem.allWards.join(', '),
      vItem.totalStreetsCount,
      vItem.totalQrPoints,
      vItem.estimatedHouseholds,
      vItem.vehicle.gpsStatus,
      vItem.vehicle.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CCMC_Vehicle_Area_Assignments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onShowToast) {
      onShowToast(
        lang === 'ta'
          ? 'வாகன ஒதுக்கீடு அறிக்கை CSV பதிவிறக்கம் செய்யப்பட்டது'
          : 'Vehicle assignment report exported as CSV'
      );
    }
  };

  const isTa = lang === 'ta';

  return (
    <div className="space-y-6 select-none font-sans pb-10">
      
      {/* 1. TOP HEADER & REAL-TIME SYNC BANNER WITH OFFICIAL LOGO */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-emerald-500/60 bg-white p-1 flex-shrink-0 flex items-center justify-center shadow-md">
            <img
              src={vehicleAssignmentIcon}
              alt="Vehicle & Area Assignment Console"
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (e.currentTarget.src !== vehicleAssignmentFallbackIcon) {
                  e.currentTarget.src = vehicleAssignmentFallbackIcon;
                }
              }}
              className="w-full h-full object-cover rounded-xl"
            />
            <span className="flex h-3 w-3 absolute top-1 right-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-white"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {isTa ? 'நேரலை கள ஒத்திசைவு (Live Synced)' : 'Officer Field Synchronized'}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                {isTa ? `கடைசி புதுப்பிப்பு: ${lastSyncTime}` : `Last synced: ${lastSyncTime}`}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              {isTa ? 'வாகனம் மற்றும் பகுதி ஒதுக்கீடு பட்டியல்' : 'Vehicle & Area Assignment Console'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 font-medium mt-0.5">
              {isTa
                ? 'துப்புரவு கள அலுவலர் பக்கத்தில் ஒதுக்கப்பட்ட அனைத்து வாகனங்கள் மற்றும் தெரு வழிகளின் முழு பட்டியல்'
                : 'Live centralized registry of vehicles and street routes assigned across Coimbatore Corporation'}
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5 flex-wrap self-stretch md:self-auto">
          <button
            onClick={() => {
              refreshData();
              if (onShowToast) {
                onShowToast(isTa ? 'தரவு புதுப்பிக்கப்பட்டது' : 'Assignment data refreshed');
              }
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer border border-gray-300 shadow-2xs"
            title="Refresh assignments from officer page"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isTa ? 'புதுப்பி' : 'Refresh Sync'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E7A38] hover:bg-[#166534] text-white font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isTa ? 'CSV ஏற்றுமதி' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* 2. FLEET METRIC OVERVIEW CARDS (4 GOOGLE THEMED METRICS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryData.vehicles.map((vItem) => {
          const v = vItem.vehicle;
          const isSelected = selectedVehicleType === v.id;

          return (
            <div
              key={v.id}
              onClick={() => setSelectedVehicleType(selectedVehicleType === v.id ? 'all' : v.id)}
              className={`rounded-2xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                v.id === 'v-tata-ace'
                  ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:border-blue-400 hover:shadow-md'
                  : v.id === 'v-bov'
                  ? 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200 hover:border-red-400 hover:shadow-md'
                  : v.id === 'v-obl-pvt'
                  ? 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200 hover:border-amber-400 hover:shadow-md'
                  : 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 hover:border-emerald-400 hover:shadow-md'
              } ${isSelected ? 'ring-2 ring-offset-2 ring-emerald-600 shadow-md scale-[1.02]' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: v.colorHex }}
                    />
                    <span className="font-black text-sm text-gray-900 tracking-tight">
                      {v.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/80 border border-gray-200 text-gray-700 shadow-2xs">
                    {v.plateNo}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600 font-medium mb-3">
                  <span className="truncate">{v.type}</span>
                  <span className="font-bold text-gray-800 bg-white/60 px-1.5 py-0.5 rounded">
                    {v.capacity}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-gray-200/70">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{isTa ? 'ஒதுக்கப்பட்ட பகுதிகள்:' : 'Assigned Areas:'}</span>
                    <span className="font-black text-gray-900">
                      {vItem.assignedAreas.length} {isTa ? 'பகுதிகள்' : 'Areas'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{isTa ? 'மொத்த தெருக்கள்:' : 'Total Streets:'}</span>
                    <span className="font-black text-gray-900">{vItem.totalStreetsCount} {isTa ? 'தெருக்கள்' : 'Streets'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{isTa ? 'இலக்கு வீடுகள்:' : 'Target Houses:'}</span>
                    <span className="font-black text-emerald-700 font-mono">~{vItem.estimatedHouseholds}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-gray-200/70 flex items-center justify-between text-[11px] text-gray-600 font-semibold">
                <span className="truncate max-w-[130px]">{v.driverName.split('(')[0]}</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  {isSelected ? (isTa ? 'அனைத்தும் காட்டு' : 'Clear Filter') : (isTa ? 'வடிகட்டு' : 'Filter')}{' '}
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. CONTROLS, SEARCH & FILTER BAR */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              isTa
                ? 'வாகனம், ஓட்டுநர், பகுதி (SS Nagar, RS Puram), வார்டு அல்லது தெரு தேடுக...'
                : 'Search vehicle plate, officer, area name (SS Nagar, RS Puram), ward, street...'
            }
            className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-gray-900 font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right: Filters & View Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Vehicle Type filter */}
          <select
            value={selectedVehicleType}
            onChange={(e) => setSelectedVehicleType(e.target.value)}
            aria-label="Filter by Vehicle Type"
            className="px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">{isTa ? 'அனைத்து வாகனங்கள் (All Vehicles)' : 'All Vehicles'}</option>
            <option value="v-tata-ace">TATA ACE (Google Blue)</option>
            <option value="v-bov">BOV (Google Red)</option>
            <option value="v-obl-pvt">OBL-PVT (Google Yellow)</option>
            <option value="v-push-cart">PUSH CART (Google Green)</option>
          </select>

          {/* Zone filter */}
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            aria-label="Filter by Zone"
            className="px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">{isTa ? 'அனைத்து மண்டலங்கள் (All Zones)' : 'All Zones'}</option>
            <option value="East Zone">East Zone</option>
            <option value="Central Zone">Central Zone</option>
            <option value="South Zone">South Zone</option>
            <option value="West Zone">West Zone</option>
            <option value="North Zone">North Zone</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-300">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-[#1E7A38] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {isTa ? 'அட்டைகள்' : 'Cards'}
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#1E7A38] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {isTa ? 'அட்டவணை' : 'Table'}
            </button>
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA: CARDS GRID OR COMPREHENSIVE TABLE */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredVehicles.map((vItem) => {
            const v = vItem.vehicle;

            return (
              <div
                key={v.id}
                className="bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
              >
                {/* Card Top Header */}
                <div
                  className="p-4 sm:p-5 border-b"
                  style={{
                    backgroundColor: `${v.colorHex}0A`,
                    borderColor: `${v.colorHex}30`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Vehicle Thumbnail/Icon */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-xs flex-shrink-0 font-bold overflow-hidden"
                        style={{ backgroundColor: v.colorHex }}
                      >
                        {v.imageUrl ? (
                          <img
                            src={v.imageUrl}
                            alt={v.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Truck className="w-6 h-6" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base sm:text-lg font-black text-gray-900">
                            {v.name}
                          </h2>
                          <span
                            className="text-[11px] font-black font-mono px-2 py-0.5 rounded-md text-white shadow-2xs"
                            style={{ backgroundColor: v.colorHex }}
                          >
                            {v.plateNo}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 font-medium mt-0.5">
                          {v.type} • {v.capacity}
                        </p>
                      </div>
                    </div>

                    {/* Operational Badge */}
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                        <Check className="w-3 h-3 text-emerald-600" />
                        {v.status}
                      </span>
                      <span className="text-[10px] text-gray-500 font-semibold flex items-center gap-1">
                        <Radio className="w-3 h-3 text-blue-500 animate-pulse" />
                        {v.gpsStatus}
                      </span>
                    </div>
                  </div>

                  {/* Driver and Shift Info Row */}
                  <div className="mt-3.5 pt-3 border-t border-gray-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-gray-700">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="font-semibold text-gray-900 truncate">
                        {v.driverName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 text-gray-600">
                      <span className="flex items-center gap-1 font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-gray-200">
                        <Phone className="w-3 h-3 text-gray-400" /> {v.driverPhone}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-gray-500">
                        <Clock className="w-3 h-3" /> {v.shiftTiming.split('-')[0]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Assigned Areas & Routes Body */}
                <div className="p-4 sm:p-5 space-y-3.5 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#1E7A38]" />
                      {isTa ? 'ஒதுக்கப்பட்ட பகுதிகள் மற்றும் தெருக்கள்:' : 'Assigned Areas & Active Routes:'}
                    </h3>
                    <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                      {vItem.assignedAreas.length} {isTa ? 'பகுதிகள்' : 'Areas'} • {vItem.totalStreetsCount}{' '}
                      {isTa ? 'தெருக்கள்' : 'Streets'}
                    </span>
                  </div>

                  {/* Assigned Areas List */}
                  {vItem.assignedAreas.length === 0 ? (
                    <div className="p-4 rounded-xl bg-gray-50 border border-dashed border-gray-300 text-center text-xs text-gray-500">
                      {isTa ? 'இன்னும் பகுதிகள் ஒதுக்கப்படவில்லை' : 'No areas assigned to this vehicle yet'}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {vItem.assignedAreas.map((area) => (
                        <div
                          key={area.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-gray-900">
                                {isTa && area.nameTa ? `${area.nameTa} (${area.name})` : area.name}
                              </span>
                              <span className="text-[10px] font-bold text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">
                                {area.ward} • {area.zone}
                              </span>
                            </div>
                            <span className="text-[11px] font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {area.qrPoints} QR Checkpoints
                            </span>
                          </div>

                          {/* Streets preview */}
                          {area.streets && area.streets.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap mt-2">
                              {area.streets.map((st, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] font-semibold text-gray-700 bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-2xs"
                                >
                                  {st}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 sm:px-5 sm:py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2">
                  <div className="text-xs text-gray-600 font-semibold flex items-center gap-1">
                    <span>{isTa ? 'வெள்ளலூர் டிரிப்ஸ்:' : 'Vellalore Trips:'}</span>
                    <span className="font-bold text-gray-900">{v.tripsToDumpYard} {isTa ? 'முறை' : 'trips/day'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedVehicleModal(vItem)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-800 font-bold text-xs border border-gray-300 transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3 text-gray-600" />
                      <span>{isTa ? 'முழு விவரம்' : 'View Full Details'}</span>
                    </button>

                    {onNavigateToLiveTracking && (
                      <button
                        onClick={() => onNavigateToLiveTracking(vItem.allZones[0])}
                        className="px-3 py-1.5 rounded-lg bg-[#1E7A38] hover:bg-[#166534] text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                      >
                        <Compass className="w-3 h-3" />
                        <span>{isTa ? 'ஜிபிஎஸ் வரைபடம்' : 'GPS Map'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPREHENSIVE TABULAR VIEW */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100/80 border-b border-gray-200 text-gray-700 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3.5">#</th>
                  <th className="py-3 px-3.5">{isTa ? 'வாகன எண் & வகை' : 'Vehicle Plate & Type'}</th>
                  <th className="py-3 px-3.5">{isTa ? 'ஓட்டுநர் / அலுவலர்' : 'Officer / Driver'}</th>
                  <th className="py-3 px-3.5">{isTa ? 'மண்டலம் & வார்டுகள்' : 'Zone & Wards'}</th>
                  <th className="py-3 px-3.5">{isTa ? 'ஒதுக்கப்பட்ட பகுதிகள்' : 'Assigned Areas'}</th>
                  <th className="py-3 px-3.5">{isTa ? 'தெருக்கள்' : 'Assigned Streets'}</th>
                  <th className="py-3 px-3.5 text-center">{isTa ? 'QR புள்ளிகள்' : 'QR Points'}</th>
                  <th className="py-3 px-3.5 text-center">{isTa ? 'இலக்கு வீடுகள்' : 'Target Houses'}</th>
                  <th className="py-3 px-3.5">{isTa ? 'ஜிபிஎஸ் நிலை' : 'GPS Status'}</th>
                  <th className="py-3 px-3.5 text-right">{isTa ? 'செயல்பாடு' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium text-gray-800">
                {filteredVehicles.map((vItem, idx) => {
                  const v = vItem.vehicle;

                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-3.5 font-bold text-gray-400">{idx + 1}</td>
                      <td className="py-3.5 px-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: v.colorHex }}
                          />
                          <div>
                            <div className="font-black text-gray-900 font-mono text-xs">
                              {v.plateNo}
                            </div>
                            <div className="text-[11px] text-gray-500 font-semibold">{v.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3.5">
                        <div className="font-bold text-gray-900">{v.driverName}</div>
                        <div className="text-[11px] text-gray-500 font-mono">{v.driverPhone}</div>
                      </td>
                      <td className="py-3.5 px-3.5">
                        <div className="font-semibold text-gray-800">
                          {vItem.allZones.join(', ') || 'Central Zone'}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {vItem.allWards.join(', ') || 'Ward 12'}
                        </div>
                      </td>
                      <td className="py-3.5 px-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {vItem.assignedAreas.map((a) => (
                            <span
                              key={a.id}
                              className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-700 border border-gray-200"
                            >
                              {a.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-3.5">
                        <span className="font-bold text-gray-900">{vItem.totalStreetsCount}</span>{' '}
                        <span className="text-gray-500">{isTa ? 'தெருக்கள்' : 'streets'}</span>
                      </td>
                      <td className="py-3.5 px-3.5 text-center font-mono font-bold text-emerald-700">
                        {vItem.totalQrPoints}
                      </td>
                      <td className="py-3.5 px-3.5 text-center font-mono font-bold text-gray-900">
                        ~{vItem.estimatedHouseholds}
                      </td>
                      <td className="py-3.5 px-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Radio className="w-2.5 h-2.5 text-blue-500 animate-pulse" />
                          {v.gpsStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-3.5 text-right">
                        <button
                          onClick={() => setSelectedVehicleModal(vItem)}
                          className="px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer border border-gray-300"
                        >
                          {isTa ? 'விவரம்' : 'Details'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. DETAILED INSPECTION MODAL */}
      <AnimatePresence>
        {selectedVehicleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 p-6 space-y-5"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-xs"
                    style={{ backgroundColor: selectedVehicleModal.vehicle.colorHex }}
                  >
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900">
                      {selectedVehicleModal.vehicle.name} ({selectedVehicleModal.vehicle.plateNo})
                    </h2>
                    <p className="text-xs text-gray-600 font-medium">
                      {selectedVehicleModal.vehicle.type} • {selectedVehicleModal.vehicle.capacity}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedVehicleModal(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Driver & Operational Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500 block text-[11px]">{isTa ? 'ஓட்டுநர் / அலுவலர்:' : 'Assigned Officer:'}</span>
                  <span className="font-bold text-gray-900 block mt-0.5">{selectedVehicleModal.vehicle.driverName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">{isTa ? 'தொடர்பு எண்:' : 'Contact Phone:'}</span>
                  <span className="font-bold font-mono text-gray-900 block mt-0.5">{selectedVehicleModal.vehicle.driverPhone}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">{isTa ? 'ஷிப்ட் நேரம்:' : 'Shift Timing:'}</span>
                  <span className="font-bold text-gray-900 block mt-0.5">{selectedVehicleModal.vehicle.shiftTiming}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">{isTa ? 'ஜிபிஎஸ் நிலை:' : 'GPS Status:'}</span>
                  <span className="font-bold text-emerald-700 block mt-0.5">{selectedVehicleModal.vehicle.gpsStatus}</span>
                </div>
              </div>

              {/* Modal Assigned Areas & All Streets */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-700">
                  {isTa ? 'ஒதுக்கப்பட்ட அனைத்து பகுதிகள் மற்றும் தெருக்கள் பட்டியல்:' : 'Full Area & Street Allocation Breakdown:'}
                </h3>

                <div className="space-y-3">
                  {selectedVehicleModal.assignedAreas.map((area) => (
                    <div
                      key={area.id}
                      className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-gray-900">
                          {isTa && area.nameTa ? `${area.nameTa} (${area.name})` : area.name}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {area.qrPoints} QR Points • {area.ward} ({area.zone})
                        </span>
                      </div>

                      {/* Streets List */}
                      {area.streets && area.streets.length > 0 && (
                        <div>
                          <span className="text-[11px] text-gray-500 font-semibold block mb-1">
                            {isTa ? 'தெருக்கள்:' : 'Covered Streets:'}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {area.streets.map((st, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-xs font-medium text-gray-800"
                              >
                                {st}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Bottom Actions */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedVehicleModal(null)}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  {isTa ? 'மூடு' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
