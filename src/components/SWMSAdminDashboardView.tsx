import React, { useState, useMemo } from 'react';
import { SWMSHouseholdRecord, SWMSDashboardStats } from '../types';
import { FrequentlyNotCollectedSection } from './FrequentlyNotCollectedSection';
import { appLogo, appLogoFallback } from '../constants/branding';
import { INITIAL_FREQUENTLY_NOT_COLLECTED } from '../data/frequentlyNotCollectedData';
import { 
  LayoutDashboard, 
  Home, 
  CheckCircle2, 
  XCircle, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  Download, 
  Filter, 
  Search, 
  Calendar, 
  ChevronRight, 
  ChevronLeft, 
  ArrowLeft, 
  Sparkles, 
  PieChart, 
  BarChart3, 
  X, 
  Building2, 
  MapPin, 
  RotateCcw, 
  SlidersHorizontal, 
  Hash,
  Flame
} from 'lucide-react';

interface SWMSAdminDashboardViewProps {
  records: SWMSHouseholdRecord[];
  stats: SWMSDashboardStats;
  onOpenAiAudit: () => void;
}

export const SWMSAdminDashboardView: React.FC<SWMSAdminDashboardViewProps> = ({
  records,
  stats,
  onOpenAiAudit
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'covered' | 'not-covered' | 'users' | 'reports' | 'settings'>('dashboard');
  const [selectedRecord, setSelectedRecord] = useState<SWMSHouseholdRecord | null>(null);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWard, setFilterWard] = useState('All');
  const [filterZone, setFilterZone] = useState('All');
  const [filterStreet, setFilterStreet] = useState('All');
  const [doorRange, setDoorRange] = useState('All');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Derived unique dropdown options
  const availableWards = useMemo(() => {
    return Array.from(new Set(records.map(r => r.ward))).sort();
  }, [records]);

  const availableZones = useMemo(() => {
    return Array.from(new Set(records.map(r => r.zone))).sort();
  }, [records]);

  const availableStreets = useMemo(() => {
    return Array.from(new Set(records.map(r => r.streetName))).sort();
  }, [records]);

  // Ward-wise aggregated breakdown for cards
  const wardBreakdown = useMemo(() => {
    const wardMap: { [wardName: string]: { ward: string; zone: string; street: string; total: number; covered: number; notCovered: number } } = {};
    
    records.forEach(r => {
      if (!wardMap[r.ward]) {
        wardMap[r.ward] = {
          ward: r.ward,
          zone: r.zone,
          street: r.streetName,
          total: 0,
          covered: 0,
          notCovered: 0
        };
      }
      wardMap[r.ward].total++;
      if (r.coverageStatus === 'Covered') {
        wardMap[r.ward].covered++;
      } else {
        wardMap[r.ward].notCovered++;
      }
    });

    return Object.values(wardMap);
  }, [records]);

  // Comprehensive Filtering Logic
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Tab filter
      if (activeTab === 'covered' && r.coverageStatus !== 'Covered') return false;
      if (activeTab === 'not-covered' && r.coverageStatus !== 'Not Covered') return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQ = 
          r.houseId.toLowerCase().includes(q) ||
          r.streetName.toLowerCase().includes(q) ||
          r.doorNo.toLowerCase().includes(q) ||
          r.householderName.toLowerCase().includes(q) ||
          r.ward.toLowerCase().includes(q);
        if (!matchesQ) return false;
      }

      // Dropdown filters
      if (filterWard !== 'All' && r.ward !== filterWard) return false;
      if (filterZone !== 'All' && r.zone !== filterZone) return false;
      if (filterStreet !== 'All' && r.streetName !== filterStreet) return false;

      // Door Number Range Filter (1-25, 26-50, 51-75, 76-100)
      if (doorRange !== 'All') {
        const doorNumMatch = r.doorNo.match(/\d+/);
        if (doorNumMatch) {
          const num = parseInt(doorNumMatch[0], 10);
          if (doorRange === '1-25' && (num < 1 || num > 25)) return false;
          if (doorRange === '26-50' && (num < 26 || num > 50)) return false;
          if (doorRange === '51-75' && (num < 51 || num > 75)) return false;
          if (doorRange === '76-100' && (num < 76 || num > 100)) return false;
        }
      }

      return true;
    });
  }, [records, activeTab, searchQuery, filterWard, filterZone, filterStreet, doorRange]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredRecords.length);
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  // Reset all filters helper
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterWard('All');
    setFilterZone('All');
    setFilterStreet('All');
    setDoorRange('All');
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredRecords, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `SWMS_Filtered_Households_Report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* 1. Admin Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 shadow-xs">
        <div>
          {/* Logo Brand Header */}
          <div className="p-5 border-b border-slate-200 bg-blue-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-full border-[2.5px] border-[#F59E0B] bg-white p-0.5 flex items-center justify-center overflow-hidden shadow-md flex-shrink-0">
                <img
                  src={appLogo}
                  alt="Coimbatore City Municipal Corporation Logo"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    if (e.currentTarget.src !== appLogoFallback) e.currentTarget.src = appLogoFallback;
                  }}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-base font-black text-white tracking-wider">SWMS ADMIN</h1>
                <p className="text-[10px] text-blue-200 font-medium">Ward & Household Monitoring</p>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-3 space-y-1 text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setCurrentPage(1);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${
                activeTab === 'dashboard' ? 'bg-blue-600 text-white font-bold shadow-md' : 'text-slate-600 hover:text-blue-950 hover:bg-blue-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            {/* Households Group */}
            <div className="pt-3">
              <span className="text-[10px] uppercase font-extrabold text-blue-900 px-3 tracking-wider">Households</span>
              <div className="mt-1 space-y-1 pl-1">
                <button
                  onClick={() => {
                    setActiveTab('covered');
                    setCurrentPage(1);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition ${
                    activeTab === 'covered' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold' : 'text-slate-600 hover:text-blue-950 hover:bg-blue-50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Covered Households</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('not-covered');
                    setCurrentPage(1);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition ${
                    activeTab === 'not-covered' ? 'bg-rose-50 text-rose-800 border border-rose-200 font-extrabold' : 'text-slate-600 hover:text-blue-950 hover:bg-blue-50'
                  }`}
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Not Covered Households</span>
                </button>
              </div>
            </div>

            <div className="pt-2 space-y-1">
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${
                  activeTab === 'users' ? 'bg-blue-600 text-white font-bold shadow-md' : 'text-slate-600 hover:text-blue-950 hover:bg-blue-50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Users</span>
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${
                  activeTab === 'reports' ? 'bg-blue-600 text-white font-bold shadow-md' : 'text-slate-600 hover:text-blue-950 hover:bg-blue-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Reports</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${
                  activeTab === 'settings' ? 'bg-blue-600 text-white font-bold shadow-md' : 'text-slate-600 hover:text-blue-950 hover:bg-blue-50'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Footer Logout & AI Trigger */}
        <div className="p-3 border-t border-slate-200 space-y-2">
          <button
            onClick={onOpenAiAudit}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-md flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-blue-300" />
            <span>Gemini SBM AI Audit</span>
          </button>

          <button className="w-full flex items-center space-x-3 px-3 py-2 text-xs text-slate-600 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-black text-blue-950 capitalize">{activeTab.replace('-', ' ')}</h2>
            {(filterWard !== 'All' || filterZone !== 'All' || filterStreet !== 'All' || doorRange !== 'All') && (
              <span className="text-[10px] font-extrabold bg-blue-100 text-blue-900 px-2.5 py-1 rounded-full border border-blue-300">
                Active Filter
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 text-xs font-semibold text-blue-950">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>12 May 2025</span>
            </div>

            <div className="flex items-center space-x-2 text-xs font-bold text-blue-950 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                A
              </div>
              <span>Admin</span>
            </div>
          </div>
        </header>

        {/* Dynamic Body Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Stat Cards Row */}
              <div className="grid grid-cols-4 gap-4">
                
                {/* Total Households */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-blue-900/80 block mb-1">Total Households</span>
                    <span className="text-2xl font-black text-blue-950">{stats.totalHouseholds}</span>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Doors 1 to 100 per Ward</span>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-200">
                    <Home className="w-6 h-6" />
                  </div>
                </div>

                {/* Covered Households */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-blue-900/80 block mb-1">Covered Households</span>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-black text-emerald-600">{stats.coveredHouseholds}</span>
                      <span className="text-xs font-extrabold text-emerald-700">({stats.coveragePercentage}%)</span>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-200">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                {/* Not Covered Households */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-blue-900/80 block mb-1">Not Covered Households</span>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-black text-rose-600">{stats.notCoveredHouseholds}</span>
                      <span className="text-xs font-extrabold text-rose-700">({100 - stats.coveragePercentage}%)</span>
                    </div>
                  </div>
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200">
                    <XCircle className="w-6 h-6" />
                  </div>
                </div>

                {/* Today's Entries */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-blue-900/80 block mb-1">Active Wards</span>
                    <span className="text-2xl font-black text-blue-950">{wardBreakdown.length}</span>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Ward 12, 15, 18</span>
                  </div>
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-200">
                    <Building2 className="w-6 h-6" />
                  </div>
                </div>

              </div>

              {/* WARD OVERVIEW CARDS (1 to 100 Doors per Area) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-blue-950 flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span>Ward & Area House Coverage (1 to 100 Doors per Area)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Select a Ward to quickly view and filter all 1-100 door households in that area
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {wardBreakdown.map((w) => {
                    const pct = Math.round((w.covered / w.total) * 100);
                    return (
                      <div 
                        key={w.ward} 
                        className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition space-y-3 cursor-pointer group"
                        onClick={() => {
                          setFilterWard(w.ward);
                          setActiveTab('covered');
                          setCurrentPage(1);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-blue-950 bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200">
                            {w.ward}
                          </span>
                          <span className="text-xs font-bold text-slate-600">
                            {w.zone}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-700 transition">
                            {w.street} (1 to 100 Doors)
                          </h4>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                            Total Registered: {w.total} Houses
                          </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-emerald-700">Covered: {w.covered}</span>
                            <span className="text-rose-700">Pending: {w.notCovered}</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                            <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                            <div className="h-full bg-rose-400" style={{ width: `${100 - pct}%` }} />
                          </div>
                        </div>

                        <div className="pt-1 flex items-center justify-between text-[11px] font-bold text-blue-700 group-hover:underline">
                          <span>Filter Ward Houses</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-2 gap-6">
                
                {/* Households Overview Donut Chart */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-black text-blue-950 flex items-center space-x-2">
                      <PieChart className="w-4 h-4 text-blue-600" />
                      <span>Overall Households Distribution</span>
                    </h3>
                  </div>

                  <div className="flex items-center justify-center py-6 space-x-8">
                    {/* Simulated Donut Circle */}
                    <div className="relative w-40 h-40 rounded-full bg-gradient-to-tr from-emerald-500 via-emerald-400 to-rose-500 p-4 flex items-center justify-center shadow-md">
                      <div className="w-28 h-28 bg-white rounded-full flex flex-col items-center justify-center text-center shadow-inner">
                        <span className="text-2xl font-black text-blue-950">{stats.coveragePercentage}%</span>
                        <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-widest">COVERED</span>
                      </div>
                    </div>

                    {/* Chart Legend */}
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center space-x-3">
                        <div className="w-3.5 h-3.5 rounded bg-emerald-500 shadow-xs" />
                        <div>
                          <p className="font-extrabold text-blue-950">Covered ({stats.coveredHouseholds})</p>
                          <p className="text-[10px] text-slate-500 font-medium">{stats.coveragePercentage}% completion rate</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-3.5 h-3.5 rounded bg-rose-500 shadow-xs" />
                        <div>
                          <p className="font-extrabold text-blue-950">Not Covered ({stats.notCoveredHouseholds})</p>
                          <p className="text-[10px] text-slate-500 font-medium">{100 - stats.coveragePercentage}% pending doors</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Households by Zone Bar Chart */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-black text-blue-950 flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      <span>Households by Zone</span>
                    </h3>
                  </div>

                  {/* Bar Chart Visualization */}
                  <div className="pt-2 space-y-3">
                    {stats.zoneBreakdown.map((z, idx) => {
                      const pct = Math.round((z.covered / z.total) * 100);
                      return (
                        <div key={idx} className="space-y-1 text-xs">
                          <div className="flex justify-between font-bold">
                            <span className="text-blue-950">{z.zone}</span>
                            <span className="text-slate-600">{z.covered} / {z.total} ({pct}%)</span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 flex">
                            <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* FREQUENTLY NOT COLLECTED HOTSPOTS */}
              <div className="pt-2">
                <FrequentlyNotCollectedSection
                  items={records.filter(r => r.coverageStatus === 'Not Covered').map((r, idx) => ({
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
                    supervisorName: r.ssName || r.siName || 'Supervisor',
                    supervisorPhone: r.ssContact || r.siContact || '',
                    coordinates: { lat: r.latitude || 11.0168, lng: r.longitude || 76.9558 },
                    remarks: r.remarks || r.notCoveredReason || 'Uncollected household reported',
                    actionStatus: 'Pending' as const
                  }))}
                  lang="en"
                />
              </div>

            </div>
          )}

          {/* TAB 2 & 3: COVERED & NOT COVERED HOUSEHOLDS WITH 1-100 DOOR & WARD FILTERS */}
          {(activeTab === 'covered' || activeTab === 'not-covered') && (
            <div className="space-y-4">
              
              {/* Comprehensive Filter Control Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <SlidersHorizontal className="w-4 h-4 text-blue-700" />
                    <h3 className="text-xs font-black text-blue-950 uppercase tracking-wider">
                      Area & Ward Filter Tools
                    </h3>
                  </div>

                  {/* Reset Filters & Export Excel */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleResetFilters}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center space-x-1 border border-slate-300"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear Filters</span>
                    </button>

                    <button
                      onClick={exportToExcel}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition shadow flex items-center space-x-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Excel</span>
                    </button>
                  </div>
                </div>

                {/* Filter Row 1: Search, Ward, Zone, Street, Door Range */}
                <div className="grid grid-cols-5 gap-3 text-xs">
                  
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search House ID, Door..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* Ward Dropdown */}
                  <div>
                    <select
                      value={filterWard}
                      onChange={(e) => {
                        setFilterWard(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="All">All Wards ({availableWards.length})</option>
                      {availableWards.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>

                  {/* Zone Dropdown */}
                  <div>
                    <select
                      value={filterZone}
                      onChange={(e) => {
                        setFilterZone(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="All">All Zones</option>
                      {availableZones.map(z => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                  </div>

                  {/* Street Dropdown */}
                  <div>
                    <select
                      value={filterStreet}
                      onChange={(e) => {
                        setFilterStreet(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="All">All Streets</option>
                      {availableStreets.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  {/* Door Range Dropdown (1 to 100) */}
                  <div>
                    <select
                      value={doorRange}
                      onChange={(e) => {
                        setDoorRange(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-blue-900 font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="All">All Doors (1 to 100)</option>
                      <option value="1-25">Door 1 - 25</option>
                      <option value="26-50">Door 26 - 50</option>
                      <option value="51-75">Door 51 - 75</option>
                      <option value="76-100">Door 76 - 100</option>
                    </select>
                  </div>

                </div>

                {/* Filter Summary Badge */}
                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-700">Filtered Result:</span>
                    <span className="font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200">
                      {filteredRecords.length} Household Doors
                    </span>
                    {filterWard !== 'All' && (
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                        {filterWard}
                      </span>
                    )}
                    {doorRange !== 'All' && (
                      <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-md">
                        Doors {doorRange}
                      </span>
                    )}
                  </div>

                  {/* Rows per page selector */}
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-slate-100 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Household Data Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-blue-900 text-white font-extrabold uppercase text-[10px] border-b border-blue-800">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">House ID</th>
                        <th className="p-3">Door No</th>
                        <th className="p-3">Street Name</th>
                        <th className="p-3">Ward</th>
                        <th className="p-3">Zone</th>
                        <th className="p-3">Householder Name</th>
                        <th className="p-3">Contact</th>
                        {activeTab === 'covered' ? (
                          <th className="p-3">Covered Time</th>
                        ) : (
                          <th className="p-3">Reason</th>
                        )}
                        <th className="p-3">Vehicle</th>
                        <th className="p-3">Sanitary Inspector</th>
                        <th className="p-3">Supervisor</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedRecords.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="p-8 text-center text-slate-500 font-bold">
                            No households found matching your current filter criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedRecords.map((r, idx) => (
                          <tr key={r.id} className="hover:bg-blue-50/50 transition">
                            <td className="p-3 text-slate-500 font-mono font-medium">
                              {startIndex + idx + 1}
                            </td>
                            <td className="p-3 font-mono font-black text-blue-700">
                              {r.houseId}
                            </td>
                            <td className="p-3 font-black text-blue-950 bg-blue-50/80 px-2 py-1 rounded-lg">
                              {r.doorNo}
                            </td>
                            <td className="p-3 font-bold text-slate-800">
                              {r.streetName}
                            </td>
                            <td className="p-3 text-slate-700 font-bold">
                              {r.ward}
                            </td>
                            <td className="p-3 text-slate-600 font-medium">
                              {r.zone}
                            </td>
                            <td className="p-3 text-slate-900 font-bold">
                              {r.householderName}
                            </td>
                            <td className="p-3 text-slate-600 font-mono text-[11px]">
                              {r.householderContact}
                            </td>

                            {activeTab === 'covered' ? (
                              <td className="p-3 text-slate-600 font-mono text-[11px]">
                                {r.submittedAt}
                              </td>
                            ) : (
                              <td className="p-3">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                                  {r.notCoveredReason || 'House Locked'}
                                </span>
                              </td>
                            )}

                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-sky-50 text-sky-800 border border-sky-200 flex items-center gap-1 w-fit">
                                <span>🚚</span>
                                <span>{r.vehicleType || 'PUSH CART'}</span>
                              </span>
                            </td>
                            <td className="p-3 text-slate-700 font-medium">{r.siName}</td>
                            <td className="p-3 text-slate-700 font-medium">{r.ssName}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => setSelectedRecord(r)}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-extrabold text-xs transition border border-blue-200"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls Footer */}
                <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium bg-slate-50/50">
                  <span>
                    Showing {filteredRecords.length > 0 ? startIndex + 1 : 0} to {endIndex} of {filteredRecords.length} households
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <span className="px-3 py-1 text-xs font-bold text-blue-950 bg-white border border-slate-300 rounded-lg">
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* OTHER TABS PLACEHOLDER */}
          {(activeTab === 'users' || activeTab === 'reports' || activeTab === 'settings') && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3 max-w-lg mx-auto my-12 shadow-xs">
              <Users className="w-12 h-12 text-blue-600 mx-auto" />
              <h3 className="text-lg font-black text-blue-950 capitalize">{activeTab} Management Module</h3>
              <p className="text-xs text-slate-600">
                Configure user roles (Sanitary Inspectors, Supervisors, Drivers) and field audit preferences.
              </p>
            </div>
          )}

        </main>
      </div>

      {/* HOUSEHOLD DETAILS VIEW MODAL (WEB) */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl text-slate-900">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-base font-black text-blue-950">Household Field Record</h3>
                  <p className="text-xs text-slate-500 font-medium">Home / Ward & Household Details View</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2-Column Detail View Grid */}
            <div className="grid grid-cols-2 gap-6 bg-blue-50/50 p-5 rounded-2xl border border-blue-100 text-xs">
              
              {/* Left Column: House Details */}
              <div className="space-y-3 border-r border-blue-100 pr-4">
                <div className="flex justify-between py-1 border-b border-slate-200/80">
                  <span className="font-bold text-slate-500">House ID</span>
                  <span className="font-mono font-black text-blue-700">{selectedRecord.houseId}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/80">
                  <span className="font-bold text-slate-500">Door No</span>
                  <span className="font-extrabold text-blue-950 bg-blue-100 px-2 py-0.5 rounded">{selectedRecord.doorNo}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/80">
                  <span className="font-bold text-slate-500">Ward</span>
                  <span className="font-extrabold text-blue-950">{selectedRecord.ward}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/80">
                  <span className="font-bold text-slate-500">Zone</span>
                  <span className="font-extrabold text-blue-950">{selectedRecord.zone}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/80">
                  <span className="font-bold text-slate-500">Street Name</span>
                  <span className="font-extrabold text-blue-950">{selectedRecord.streetName}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/80">
                  <span className="font-bold text-slate-500">Coverage Status</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                    selectedRecord.coverageStatus === 'Covered' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {selectedRecord.coverageStatus === 'Covered' ? 'Covered' : (selectedRecord.notCoveredReason || 'Not Covered')}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="font-bold text-slate-500">Logged On</span>
                  <span className="font-mono text-slate-800 font-semibold">{selectedRecord.submittedAt}</span>
                </div>
              </div>

              {/* Right Column: Staff & Contact Details */}
              <div className="space-y-3">
                <div className="flex justify-between py-1 border-b border-slate-200/80">
                  <span className="font-bold text-slate-500">Resident Name</span>
                  <span className="font-extrabold text-blue-950">{selectedRecord.householderName}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/80">
                  <span className="font-bold text-slate-500">Resident Contact</span>
                  <span className="font-mono text-slate-800 font-semibold">{selectedRecord.householderContact}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/80">
                  <span className="font-bold text-slate-500">SI Name</span>
                  <span className="font-extrabold text-blue-950">{selectedRecord.siName} ({selectedRecord.siContact})</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/80">
                  <span className="font-bold text-slate-500">SS Name</span>
                  <span className="font-extrabold text-blue-950">{selectedRecord.ssName} ({selectedRecord.ssContact})</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/80">
                  <span className="font-bold text-slate-500">CSS Name</span>
                  <span className="font-extrabold text-blue-950">{selectedRecord.cssName}</span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="font-bold text-slate-500">Driver / Worker</span>
                  <span className="font-extrabold text-blue-950">{selectedRecord.driverWorkerName} ({selectedRecord.driverWorkerContact})</span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition shadow-md"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
