import React, { useState, useMemo, useEffect } from 'react';
import {
  Flame,
  AlertTriangle,
  MapPin,
  Truck,
  Send,
  CheckCircle2,
  Phone,
  User,
  ShieldCheck,
  Navigation,
  Search,
  Filter,
  Download,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  Clock,
  Home,
  FileWarning,
  Sparkles,
  RefreshCw,
  Info,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  AlertOctagon,
  Eye
} from 'lucide-react';
import { FrequentlyNotCoveredAreaSummary, FrequentlyNotCollectedItem, ZoneName, SWMSHouseholdRecord } from '../types';
import { INITIAL_FREQUENTLY_NOT_COVERED_AREAS, INITIAL_FREQUENTLY_NOT_COLLECTED } from '../data/frequentlyNotCollectedData';

interface FrequentlyNotCoveredAreaViewProps {
  records?: SWMSHouseholdRecord[];
  lang?: 'en' | 'ta';
  onNavigateToLiveTracking?: (zone?: string, info?: string) => void;
  onShowToast?: (msg: string) => void;
}

export const FrequentlyNotCoveredAreaView: React.FC<FrequentlyNotCoveredAreaViewProps> = ({
  records = [],
  lang = 'en',
  onNavigateToLiveTracking,
  onShowToast
}) => {
  // Derive real not covered houses from real submissions
  const derivedHouses: FrequentlyNotCollectedItem[] = useMemo(() => {
    return records
      .filter(r => r.coverageStatus === 'Not Covered')
      .map((r, idx) => ({
        id: `FNC-${101 + idx}`,
        houseId: r.houseId,
        doorNo: r.doorNo,
        streetName: r.streetName,
        ward: r.ward,
        zone: r.zone || 'Central Zone',
        householderName: r.householderName || 'Resident',
        householderPhone: r.householderContact || '',
        consecutiveDaysMissed: 1,
        totalMissedThisMonth: 1,
        primaryReason: r.notCoveredReason || 'House Locked',
        lastMissedDate: r.submittedAt ? r.submittedAt.split(',')[0] : 'Today',
        lastWorkerName: r.driverWorkerName || 'Field Worker',
        lastWorkerPhone: r.driverWorkerContact || '',
        supervisorName: r.ssName || r.siName || 'Sanitation Supervisor',
        supervisorPhone: r.ssContact || r.siContact || '',
        coordinates: { lat: r.latitude || 11.0168, lng: r.longitude || 76.9558 },
        remarks: r.remarks || r.notCoveredReason || 'Uncollected household reported',
        actionStatus: 'Pending' as const
      }));
  }, [records]);

  // Derive real not covered area summaries from real submissions
  const derivedAreas: FrequentlyNotCoveredAreaSummary[] = useMemo(() => {
    const notCovered = records.filter(r => r.coverageStatus === 'Not Covered');
    const streetMap: { [streetKey: string]: SWMSHouseholdRecord[] } = {};

    notCovered.forEach(r => {
      const key = `${r.ward}-${r.streetName}`;
      if (!streetMap[key]) streetMap[key] = [];
      streetMap[key].push(r);
    });

    return Object.entries(streetMap).map(([key, items], idx) => {
      const first = items[0];
      return {
        areaId: `area-fnc-${101 + idx}`,
        areaName: `${first.streetName} Sector`,
        streetName: first.streetName,
        ward: first.ward,
        zone: first.zone || 'Central Zone',
        totalHouses: items.length,
        uncoveredHouses: items.length,
        uncoveredPercentage: 100,
        consecutiveDaysMissed: 1,
        primaryReason: first.notCoveredReason || 'Access Blocked',
        obstacleType: 'Narrow_Access' as const,
        supervisorName: first.ssName || first.siName || 'Supervisor',
        supervisorPhone: first.ssContact || '',
        assignedDriver: first.driverWorkerName || 'Driver',
        assignedVehicle: first.vehicleNo || 'TN 37 CCMC (BOV)',
        coordinates: { lat: first.latitude || 11.0168, lng: first.longitude || 76.9558 },
        lastAttemptTime: first.submittedAt ? first.submittedAt.split(',')[1]?.trim() || '08:30 AM' : '08:30 AM',
        status: 'Critical Attention' as const
      };
    });
  }, [records]);

  const [areas, setAreas] = useState<FrequentlyNotCoveredAreaSummary[]>(derivedAreas);
  const [houses, setHouses] = useState<FrequentlyNotCollectedItem[]>(derivedHouses);

  useEffect(() => {
    setAreas(derivedAreas);
    setHouses(derivedHouses);
  }, [derivedAreas, derivedHouses]);
  
  const [activeSubTab, setActiveSubTab] = useState<'areas' | 'houses'>('areas');
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [selectedObstacle, setSelectedObstacle] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals
  const [selectedAreaModal, setSelectedAreaModal] = useState<FrequentlyNotCoveredAreaSummary | null>(null);
  const [actionDispatchModal, setActionDispatchModal] = useState<{
    targetName: string;
    type: 'dispatch_bov' | 'bulk_sms' | 'resolve';
    id: string;
  } | null>(null);

  // Filtered areas
  const filteredAreas = useMemo(() => {
    return areas.filter((a) => {
      const matchesZone = selectedZone === 'All' || a.zone === selectedZone;
      const matchesObstacle = selectedObstacle === 'All' || a.obstacleType === selectedObstacle || a.primaryReason.toLowerCase().includes(selectedObstacle.toLowerCase());
      const matchesSearch =
        searchQuery.trim() === '' ||
        a.areaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.streetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.ward.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.supervisorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.assignedDriver.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesZone && matchesObstacle && matchesSearch;
    });
  }, [areas, selectedZone, selectedObstacle, searchQuery]);

  // Filtered houses
  const filteredHouses = useMemo(() => {
    return houses.filter((h) => {
      const matchesZone = selectedZone === 'All' || h.zone === selectedZone;
      const matchesSearch =
        searchQuery.trim() === '' ||
        h.houseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.doorNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.streetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.householderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.ward.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesZone && matchesSearch;
    });
  }, [houses, selectedZone, searchQuery]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalAreasCount = areas.length;
    const totalImpactedHouses = areas.reduce((acc, curr) => acc + curr.uncoveredHouses, 0);
    const severeStreakCount = areas.filter((a) => a.consecutiveDaysMissed >= 4).length;
    const dispatchedCount = areas.filter((a) => a.status === 'Dispatched').length;
    const avgPercentage = Math.round(
      areas.reduce((acc, curr) => acc + curr.uncoveredPercentage, 0) / (areas.length || 1)
    );

    return {
      totalAreasCount,
      totalImpactedHouses,
      severeStreakCount,
      dispatchedCount,
      avgPercentage
    };
  }, [areas]);

  // Handle action dispatch
  const handleConfirmAction = () => {
    if (!actionDispatchModal) return;
    const { targetName, type, id } = actionDispatchModal;

    let toastMsg = '';
    if (type === 'dispatch_bov') {
      setAreas((prev) =>
        prev.map((a) => (a.areaId === id ? { ...a, status: 'Dispatched' } : a))
      );
      toastMsg =
        lang === 'ta'
          ? `🚚 ${targetName} பகுதிக்கு சிறப்பு BOV மீட்புப் படை உடனடியாக ஒதுக்கப்பட்டது!`
          : `🚚 Special Clearance BOV Squad successfully dispatched to ${targetName}!`;
    } else if (type === 'bulk_sms') {
      toastMsg =
        lang === 'ta'
          ? `📢 ${targetName} தெருவில் உள்ள குடியிருப்பாளர்களுக்கு SBM விதிமுறை SMS எச்சரிக்கை அனுப்பப்பட்டது!`
          : `📢 Formal SBM Compliance Notice & Bulk SMS broadcasted to residents in ${targetName}!`;
    } else if (type === 'resolve') {
      setAreas((prev) =>
        prev.map((a) => (a.areaId === id ? { ...a, status: 'Cleared', uncoveredHouses: 0, uncoveredPercentage: 0 } : a))
      );
      toastMsg =
        lang === 'ta'
          ? `✅ ${targetName} பகுதி வெற்றிகரமாக தூய்மை செய்யப்பட்டு தீர்க்கப்பட்டது!`
          : `✅ ${targetName} marked as cleared and resolved!`;
    }

    if (onShowToast) {
      onShowToast(toastMsg);
    }
    setActionDispatchModal(null);
  };

  // Export report
  const handleExportReport = () => {
    const reportData = {
      title: 'CCMC Frequently Not Covered Areas Report',
      generatedAt: new Date().toISOString(),
      summary: summaryMetrics,
      areas: filteredAreas,
      individualHouses: filteredHouses
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `CCMC_Frequently_Not_Covered_Areas_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (onShowToast) {
      onShowToast(lang === 'ta' ? '📥 அறிக்கை பதிவிறக்கப்பட்டது!' : '📥 Area Hotspot Report downloaded!');
    }
  };

  const getObstacleBadge = (type: string, reason: string) => {
    switch (type) {
      case 'Lockout':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
            🔒 {lang === 'ta' ? 'வீடு பூட்டு / ஆட்கள் இன்மை' : 'House Locked / Absent'}
          </span>
        );
      case 'Segregation_Failure':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-900 border border-rose-300">
            ⚠️ {lang === 'ta' ? 'குப்பை பிரிக்காத மறுப்பு' : 'Unsegregated Waste'}
          </span>
        );
      case 'Narrow_Access':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-900 border border-blue-300">
            🚧 {lang === 'ta' ? 'குறுகிய சந்து / வாகனம் நுழைய இயலாமை' : 'Narrow Lane Access'}
          </span>
        );
      case 'Road_Work':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-900 border border-purple-300">
            🛠️ {lang === 'ta' ? 'சாக்கடை / சாலை பராமரிப்பு' : 'Culvert / Drain Work'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-800 border border-gray-300">
            ℹ️ {reason}
          </span>
        );
    }
  };

  return (
    <div id="frequently-not-covered-area-view" className="space-y-6">
      
      {/* 1. Main Header & Hero Banner */}
      <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-rose-50 text-rose-700 text-xs font-black px-3 py-1 rounded-full border border-rose-200 uppercase tracking-widest flex items-center gap-1.5 shadow-2xs">
                <Flame className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
                {lang === 'ta' ? 'தொடர் விடுபடல் கண்காணிப்பு மையம்' : 'Chronic Household Intelligence'}
              </span>
              <span className="bg-amber-50 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200 shadow-2xs">
                {lang === 'ta' ? 'முன்னுரிமை வீடுகள்' : 'High Priority Households'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <span>{lang === 'ta' ? 'அடிக்கடி சேகரிக்கப்படாத வீடுகள்' : 'Frequently Not Collected Household'}</span>
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-3xl leading-relaxed">
              {lang === 'ta'
                ? 'கோயம்புத்தூர் மாநகராட்சியில் தொடர்ந்து 3+ நாட்களுக்கு மேல் குப்பை சேகரிக்கப்படாத வீடுகள், தெருக்கள், மற்றும் தொடர் சிக்கல் குடியிருப்புகளைக் கண்காணித்து விரைவு நடவடிக்கை எடுக்கும் பிரத்யேக பகுதி.'
                : 'CCMC Directorate monitoring portal for chronic uncollected households, recurring access obstacles, and multi-day missed residential clusters requiring SBM intervention.'}
            </p>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap flex-shrink-0">
            <button
              onClick={handleExportReport}
              className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl border border-slate-300 transition-all cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>{lang === 'ta' ? 'அறிக்கை பதிவிறக்கு' : 'Export Area Report'}</span>
            </button>

            <button
              onClick={() => {
                if (onNavigateToLiveTracking) {
                  onNavigateToLiveTracking('All', 'Frequently Missed Hotspot Areas');
                }
              }}
              className="px-4 py-3 bg-[#1E7A38] hover:bg-[#166534] text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Navigation className="w-4 h-4 text-white" />
              <span>{lang === 'ta' ? 'GPS வரைபடத்தில் பார்' : 'View GPS Hotspots'}</span>
            </button>
          </div>
        </div>

        {/* Highlight KPI Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 hover:border-slate-300 transition">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
              {lang === 'ta' ? 'விடுபட்ட பகுதிகள்' : 'Hotspot Areas'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
              {summaryMetrics.totalAreasCount} <span className="text-xs font-normal text-slate-400">Pockets</span>
            </div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 hover:border-slate-300 transition">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
              {lang === 'ta' ? 'பாதிக்கப்பட்ட வீடுகள்' : 'Impacted Houses'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-0.5">
              {summaryMetrics.totalImpactedHouses} <span className="text-xs font-normal text-slate-400">Doors</span>
            </div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 hover:border-slate-300 transition">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
              {lang === 'ta' ? 'தொடர் 4+ நாட்கள்' : 'Streak > 3 Days'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 mt-0.5">
              {summaryMetrics.severeStreakCount} <span className="text-xs font-normal text-slate-400">Streets</span>
            </div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 hover:border-slate-300 transition">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
              {lang === 'ta' ? 'சராசரி விடுபடல் வீதம்' : 'Avg Missed Rate'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#1E7A38] mt-0.5">
              {summaryMetrics.avgPercentage}% <span className="text-xs font-normal text-slate-400">Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sub-Tab Navigator & Search/Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-4">
        
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <button
              onClick={() => setActiveSubTab('areas')}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
                activeSubTab === 'areas'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>{lang === 'ta' ? 'பகுதி & தெரு வாரியாக' : 'Hotspot Areas & Streets'}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeSubTab === 'areas' ? 'bg-rose-800 text-rose-100' : 'bg-slate-200 text-slate-800'}`}>
                {filteredAreas.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('houses')}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
                activeSubTab === 'houses'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>{lang === 'ta' ? 'வீட்டு வாரியான விவரம்' : 'Individual Households'}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeSubTab === 'houses' ? 'bg-rose-800 text-rose-100' : 'bg-slate-200 text-slate-800'}`}>
                {filteredHouses.length}
              </span>
            </button>
          </div>

          {/* Live sync pill */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 self-end sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{lang === 'ta' ? 'நேரலைத் தரவு புதுப்பிக்கப்பட்டது' : 'Live ICCC Data Active'}</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'ta'
                  ? 'பகுதி பெயர், தெரு, வார்டு, மேற்பார்வையாளர் தேடவும்...'
                  : 'Search Area, Street, Ward, Door No, Supervisor...'
              }
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap justify-between md:justify-end">
            {/* Zone Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-600 flex-shrink-0">
                {lang === 'ta' ? 'மண்டலம்:' : 'Zone:'}
              </span>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
              >
                <option value="All">{lang === 'ta' ? 'அனைத்து மண்டலங்கள்' : 'All Zones'}</option>
                <option value="North Zone">{lang === 'ta' ? 'வடக்கு மண்டலம் (North Zone)' : 'North Zone (வடக்கு மண்டலம்)'}</option>
                <option value="Central Zone">{lang === 'ta' ? 'மத்திய மண்டலம் (Central Zone)' : 'Central Zone (மத்திய மண்டலம்)'}</option>
                <option value="South Zone">{lang === 'ta' ? 'தெற்கு மண்டலம் (South Zone)' : 'South Zone (தெற்கு மண்டலம்)'}</option>
                <option value="West Zone">{lang === 'ta' ? 'மேற்கு மண்டலம் (West Zone)' : 'West Zone (மேற்கு மண்டலம்)'}</option>
                <option value="East Zone">{lang === 'ta' ? 'கிழக்கு மண்டலம் (East Zone)' : 'East Zone (கிழக்கு மண்டலம்)'}</option>
              </select>
            </div>

            {/* Obstacle Type Filter (for Area View) */}
            {activeSubTab === 'areas' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-600 flex-shrink-0">
                  {lang === 'ta' ? 'காரணம்:' : 'Obstacle:'}
                </span>
                <select
                  value={selectedObstacle}
                  onChange={(e) => setSelectedObstacle(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="All">{lang === 'ta' ? 'அனைத்து காரணங்கள்' : 'All Obstacles'}</option>
                  <option value="Lockout">House Lockout / Closed Doors</option>
                  <option value="Segregation_Failure">Unsegregated Waste Refusal</option>
                  <option value="Narrow_Access">Narrow Lane / Pushcart Needed</option>
                  <option value="Road_Work">Culvert / Road Obstruction</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Content Rendering */}

      {/* SUB-TAB 1: HOTSPOT AREAS & STREETS */}
      {activeSubTab === 'areas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredAreas.length === 0 ? (
            <div className="col-span-2 bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-black text-slate-800">
                {lang === 'ta' ? 'பொருத்தமான பகுதிகள் இல்லை' : 'No frequently missed areas found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {lang === 'ta'
                  ? 'தேர்ந்தெடுக்கப்பட்ட வடிகட்டிகளில் விடுபட்ட பகுதிகள் எதுவும் பதிவு செய்யப்படவில்லை.'
                  : 'All street corridors under current filter criteria are operating within expected SBM coverage.'}
              </p>
            </div>
          ) : (
            filteredAreas.map((area) => (
              <div
                key={area.areaId}
                className="bg-white rounded-2xl border border-rose-200/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group"
              >
                {/* Area Card Header */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono font-bold text-rose-900 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                          {area.areaId}
                        </span>
                        <span className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {area.ward} • {area.zone}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-rose-700 transition">
                        {area.areaName}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-slate-600 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                        <span>{area.streetName}</span>
                      </div>
                    </div>

                    {/* Streak Badge */}
                    <div className="text-right flex-shrink-0">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-2xs">
                        <Clock className="w-3 h-3 text-rose-200" />
                        <span>{area.consecutiveDaysMissed} {lang === 'ta' ? 'நாட்கள்' : 'Days'}</span>
                      </span>
                      <span className="text-[10px] text-rose-700 block font-extrabold mt-0.5">
                        {lang === 'ta' ? 'தொடர் விடுபடல்' : 'Chronic Streak'}
                      </span>
                    </div>
                  </div>

                  {/* Uncollected Gauge & Progress */}
                  <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">
                        {lang === 'ta' ? 'விடுபட்ட வீடுகள்:' : 'Uncollected Doors:'} 
                        <strong className="text-rose-700 ml-1 font-black text-sm">{area.uncoveredHouses}</strong> / {area.totalHouses}
                      </span>
                      <span className="font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md text-xs">
                        {area.uncoveredPercentage}% Missed
                      </span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-emerald-500 rounded-l-full"
                        style={{ width: `${100 - area.uncoveredPercentage}%` }}
                        title="Covered"
                      />
                      <div
                        className="h-full bg-rose-500 rounded-r-full"
                        style={{ width: `${area.uncoveredPercentage}%` }}
                        title="Not Covered"
                      />
                    </div>
                  </div>

                  {/* Obstacle Reason & Description */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getObstacleBadge(area.obstacleType, area.primaryReason)}
                      <span className="text-[11px] text-slate-500 font-medium">
                        Last Attempt: <strong>{area.lastAttemptTime}</strong>
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-200/70">
                      {area.primaryReason}
                    </p>
                  </div>

                  {/* Supervisor & Assigned Crew */}
                  <div className="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Supervisor (SI/AE):</span>
                      <div className="flex items-center gap-1 font-bold text-slate-800">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{area.supervisorName}</span>
                        <a href={`tel:${area.supervisorPhone}`} className="text-emerald-700 hover:text-emerald-800 ml-1" title="Call Supervisor">
                          <Phone className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Assigned Vehicle:</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-blue-600" />
                        {area.assignedVehicle} ({area.assignedDriver})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    onClick={() => {
                      if (onNavigateToLiveTracking) {
                        onNavigateToLiveTracking(area.zone, `Area: ${area.areaName} (${area.streetName})`);
                      }
                    }}
                    className="flex-1 py-2 px-3 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl border border-slate-300 hover:border-emerald-300 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{lang === 'ta' ? 'GPS வரைபடம்' : 'Track GPS'}</span>
                  </button>

                  <button
                    onClick={() =>
                      setActionDispatchModal({
                        targetName: area.areaName,
                        type: 'bulk_sms',
                        id: area.areaId
                      })
                    }
                    className="flex-1 py-2 px-3 bg-white hover:bg-purple-50 text-purple-800 font-bold text-xs rounded-xl border border-slate-300 hover:border-purple-300 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5 text-purple-600" />
                    <span>{lang === 'ta' ? 'SMS நோட்டீஸ்' : 'Bulk Notice'}</span>
                  </button>

                  <button
                    onClick={() =>
                      setActionDispatchModal({
                        targetName: area.areaName,
                        type: 'dispatch_bov',
                        id: area.areaId
                      })
                    }
                    className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5 text-white" />
                    <span>{lang === 'ta' ? 'BOV அனுப்பு' : 'Dispatch BOV'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SUB-TAB 2: INDIVIDUAL HOUSEHOLDS DRILLDOWN */}
      {activeSubTab === 'houses' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden divide-y divide-slate-100">
          {filteredHouses.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-70 mb-2" />
              <p className="text-sm font-bold text-slate-800">
                {lang === 'ta' ? 'விடுபட்ட வீடுகள் இல்லை' : 'No uncollected households found'}
              </p>
            </div>
          ) : (
            filteredHouses.map((house) => (
              <div
                key={house.id}
                className="p-4 hover:bg-rose-50/20 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white">
                      <Clock className="w-3 h-3" />
                      {house.consecutiveDaysMissed} {lang === 'ta' ? 'நாட்கள் தொடர் விடுபடல்' : 'Days Missed Streak'}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {house.houseId}
                    </span>
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {house.ward} • {house.zone}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                    <MapPin className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>Door #{house.doorNo}, {house.streetName}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800">{house.householderName}</span>
                      <a
                        href={`tel:${house.householderPhone || '9842101234'}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const targetPhone = house.householderPhone || '9842101234';
                          if (onShowToast) {
                            onShowToast(
                              lang === 'ta'
                                ? `📞 ${house.householderName} (${targetPhone}) எண்ணிற்கு அழைப்பு மேற்கொள்ளப்படுகிறது...`
                                : `📞 Calling ${house.householderName} at ${targetPhone}...`
                            );
                          }
                          window.location.href = `tel:${targetPhone}`;
                        }}
                        className="text-emerald-700 hover:text-emerald-800 font-extrabold ml-1 flex items-center gap-1 hover:underline bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/80 cursor-pointer shadow-2xs"
                        title={lang === 'ta' ? 'அழைப்பு செய்ய கிளிக் செய்க' : 'Click to call resident'}
                      >
                        <Phone className="w-3 h-3 text-emerald-700 animate-pulse" />
                        <span>{house.householderPhone || '9842101234'}</span>
                      </a>
                    </div>

                    <div className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Supervisor: <strong className="text-slate-800">{house.supervisorName}</strong></span>
                    </div>
                  </div>

                  {house.remarks && (
                    <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-2 text-xs text-amber-950 font-medium">
                      {house.remarks}
                    </div>
                  )}
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 self-start lg:self-center flex-shrink-0">
                  <button
                    onClick={() =>
                      setActionDispatchModal({
                        targetName: `House #${house.doorNo} (${house.householderName})`,
                        type: 'bulk_sms',
                        id: house.id
                      })
                    }
                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs rounded-xl border border-purple-200 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5 text-purple-600" />
                    <span>{lang === 'ta' ? 'நோட்டீஸ்' : 'Notice'}</span>
                  </button>

                  <button
                    onClick={() =>
                      setActionDispatchModal({
                        targetName: `House #${house.doorNo} (${house.streetName})`,
                        type: 'dispatch_bov',
                        id: house.id
                      })
                    }
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5 text-white" />
                    <span>{lang === 'ta' ? 'BOV அனுப்பு' : 'Dispatch'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. Action Confirmation Modal */}
      {actionDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-center">
            <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              {actionDispatchModal.type === 'dispatch_bov' && <Truck className="w-7 h-7" />}
              {actionDispatchModal.type === 'bulk_sms' && <Send className="w-7 h-7" />}
              {actionDispatchModal.type === 'resolve' && <CheckCircle2 className="w-7 h-7" />}
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                {actionDispatchModal.type === 'dispatch_bov' && (lang === 'ta' ? 'சிறப்பு மீட்பு வாகனம் அனுப்பவா?' : 'Dispatch Special Clearance Squad?')}
                {actionDispatchModal.type === 'bulk_sms' && (lang === 'ta' ? 'SBM எச்சரிக்கை அறிவிப்பு அனுப்பவா?' : 'Broadcast Resident Warning Notice?')}
                {actionDispatchModal.type === 'resolve' && (lang === 'ta' ? 'தீர்க்கப்பட்டதாக உறுதி செய்யவா?' : 'Confirm Area Clearance?')}
              </h3>
              <p className="text-xs text-slate-600 font-semibold">
                {actionDispatchModal.targetName}
              </p>
            </div>

            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 text-left">
              {actionDispatchModal.type === 'dispatch_bov' &&
                (lang === 'ta'
                  ? 'குறிப்பிட்ட பகுதிக்கு அருகிலுள்ள அவசர பேட்டரி வாகனம் (BOV) மற்றும் துப்புரவுப் பணியாளர்கள் நேரடியாக ஒதுக்கப்படுவார்கள்.'
                  : 'An emergency battery-operated vehicle (BOV) and sanitation crew will be assigned to clear the chronic missed sector immediately.')}
              {actionDispatchModal.type === 'bulk_sms' &&
                (lang === 'ta'
                  ? 'குப்பை பிரித்தல் மற்றும் காலை நேர சேகரிப்பு குறித்த அதிகாரப்பூர்வ அறிவிப்பு குடியிருப்பாளர்களுக்கு SMS மூலம் அனுப்பப்படும்.'
                  : 'Formal SBM compliance rules & collection timing notices will be dispatched to all registered resident contacts in this sector.')}
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionDispatchModal(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                {lang === 'ta' ? 'ரத்துசெய்' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{lang === 'ta' ? 'உறுதி செய்' : 'Confirm Dispatch'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
