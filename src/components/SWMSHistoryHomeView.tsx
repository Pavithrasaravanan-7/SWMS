import React, { useState, useEffect } from 'react';
import { 
  SWMSHouseholdRecord, 
  SWMSDashboardStats
} from '../types';
import { HouseholdLocationMapModal } from './HouseholdLocationMapModal';
import { 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  MapPin, 
  Clock, 
  Home,
  ShieldAlert,
  Globe,
  LogOut,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  Truck,
  Check,
  X,
  XCircle,
  QrCode,
  RotateCcw,
  Navigation,
  ExternalLink,
  Edit3,
  Pencil
} from 'lucide-react';
import { 
  ccmcLogo, 
  ccmcFallbackLogo,
  smartCityLogo,
  smartCityFallbackLogo
} from '../constants/branding';
import { 
  TotalHouseholdsLogo,
  CollectedTruckLogo,
  NotCollectedDustbinLogo
} from './icons/KpiLogos';
import { AnimatedCounter } from './AnimatedCounter';

interface StreetScanPoint {
  id: number;
  label: string;
  taLabel: string;
  locationName: string;
  taLocationName: string;
  isScanned: boolean;
  scannedAt?: string;
}

interface StreetRecordGroup {
  id: string;
  streetName: string;
  zone: string;
  ward: string;
  representativeHouseId: string;
  residentName: string;
  contactNo: string;
  submittedAt: string;
  scans: StreetScanPoint[];
}

interface SWMSHistoryHomeViewProps {
  stats: SWMSDashboardStats;
  records: SWMSHouseholdRecord[];
  lang?: 'en' | 'ta';
  assignedVehicleId?: string;
  onSetAssignedVehicle?: (vehicleId: string) => void;
  onSetLanguage?: (lang: 'en' | 'ta') => void;
  onToggleLang?: () => void;
  onSelectDoor: (houseId: string) => void;
  onOpenScanner: () => void;
  onOpenVehicleAssignment?: () => void;
  userName?: string;
  workerInfo?: any;
  onLogout?: () => void;
}

export const getStreetCoverageStatus = (completedScans: number) => {
  if (completedScans >= 5) {
    return {
      status: 'Covered' as const,
      labelEn: 'Covered',
      labelTa: 'மூடப்பட்டது (Covered)',
      colorType: 'green' as const,
      cardBorder: 'border-emerald-400 hover:border-emerald-500',
      badgeBg: 'bg-[#ECFDF5]',
      badgeText: 'text-[#047857]',
      badgeBorder: 'border-[#A7F3D0]',
      pointsBadgeBg: 'bg-[#ECFDF5] text-[#047857] border-[#6EE7B7]',
      iconClass: 'text-[#059669]',
      iconBg: 'bg-[#1E7A38]',
      bannerBg: 'bg-emerald-50 text-emerald-900 border-emerald-300',
      ruleTextEn: 'All 5 checkpoints scanned • 100% Street Covered ✓',
      ruleTextTa: '5/5 QR புள்ளிகளும் ஸ்கேன் செய்யப்பட்டுள்ளது • தெரு முழுவதும் மூடப்பட்டது (Covered ✓)',
    };
  } else if (completedScans === 4) {
    return {
      status: 'Partially Covered' as const,
      labelEn: 'Partially Covered',
      labelTa: 'பகுதி மூடப்பட்டது (Partially Covered)',
      colorType: 'redorange' as const,
      cardBorder: 'border-[#FB923C]/90 hover:border-[#EA580C]',
      badgeBg: 'bg-[#FFF7ED]',
      badgeText: 'text-[#C2410C]',
      badgeBorder: 'border-[#FDBA74]',
      pointsBadgeBg: 'bg-[#FFF7ED] text-[#C2410C] border-[#FDBA74]',
      iconClass: 'text-[#EA580C]',
      iconBg: 'bg-[#EA580C]',
      bannerBg: 'bg-orange-50 text-orange-950 border-orange-300',
      ruleTextEn: '4/5 Checkpoints Scanned • Partially Covered ⚡ (1 more checkpoint to reach 100% Covered)',
      ruleTextTa: '4/5 QR புள்ளிகள் முடிந்தது • பகுதி மூடப்பட்டது (Partially Covered ⚡) • இன்னும் 1 புள்ளி விடுபட்டுள்ளது',
    };
  } else {
    // completedScans <= 3 (0, 1, 2, 3)
    return {
      status: 'Not Covered' as const,
      labelEn: 'Not Covered',
      labelTa: 'மூடப்படாதவை (Not Covered)',
      colorType: 'red' as const,
      cardBorder: 'border-rose-400/90 hover:border-rose-500',
      badgeBg: 'bg-[#FFF1F2]',
      badgeText: 'text-[#BE123C]',
      badgeBorder: 'border-[#FECDD3]',
      pointsBadgeBg: 'bg-[#FFF1F2] text-[#BE123C] border-[#FDA4AF]',
      iconClass: 'text-[#E11D48]',
      iconBg: 'bg-[#D93025]',
      bannerBg: 'bg-rose-50 text-rose-900 border-rose-300',
      ruleTextEn: `${completedScans}/5 checkpoints scanned • Not Covered ⚠ (${5 - completedScans} pending)`,
      ruleTextTa: `${completedScans}/5 QR புள்ளிகள் மட்டுமே முடிந்தது • மூடப்படவில்லை (Not Covered ⚠) • ${5 - completedScans} புள்ளி விடுபட்டுள்ளது`,
    };
  }
};

export const SWMSHistoryHomeView: React.FC<SWMSHistoryHomeViewProps> = ({
  stats,
  records,
  lang = 'ta',
  assignedVehicleId = 'v-push-cart',
  onSetAssignedVehicle,
  onSetLanguage,
  onToggleLang,
  onSelectDoor,
  onOpenScanner,
  onOpenVehicleAssignment,
  userName = 'Karthik Muthusamy',
  workerInfo,
  onLogout
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Covered' | 'Partially Covered' | 'Not Covered'>('All');

  // Per-street vehicle number assignment (stored in localStorage)
  const [streetVehicleMap, setStreetVehicleMap] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem('ccmc_street_vehicle');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  const handleSetStreetVehicle = (streetName: string, vehicleNo: string) => {
    const next = { ...streetVehicleMap, [streetName]: vehicleNo };
    setStreetVehicleMap(next);
    localStorage.setItem('ccmc_street_vehicle', JSON.stringify(next));
  };
  
  const isPushCart = !assignedVehicleId || assignedVehicleId === 'v-push-cart' || assignedVehicleId.includes('push');

  const VEHICLE_META: Record<string, { name: string; color: string; icon: string; taName: string }> = {
    'v-push-cart': { name: 'PUSH CART', color: 'bg-emerald-600', icon: '🛒', taName: 'தள்ளுவண்டி' },
    'v-tata-ace': { name: 'TATA ACE', color: 'bg-blue-600', icon: '🚚', taName: 'டாடா ஏஸ்' },
    'v-bov': { name: 'BOV', color: 'bg-rose-600', icon: '🔋', taName: 'பி.ஓ.வி மின்கலன்' },
    'v-obl-pvt': { name: 'OBL-PVT', color: 'bg-amber-600', icon: '🚛', taName: 'தனியார் வாகனம்' },
  };

  const activeVehicle = VEHICLE_META[assignedVehicleId] || VEHICLE_META['v-push-cart'];

  // 5 Scan Checkpoints State for Streets (Tata Ace / BOV / OBL-PVT)
  const [streetScansState, setStreetScansState] = useState<Record<string, StreetScanPoint[]>>(() => {
    const saved = localStorage.getItem('ccmc_street_5scans');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {};
  });

  // Re-sync streetScansState from localStorage whenever records or assignedVehicle changes
  useEffect(() => {
    const saved = localStorage.getItem('ccmc_street_5scans');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStreetScansState(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        // ignore
      }
    }
  }, [records, assignedVehicleId]);

  // Play pleasant chime on scan checkpoint toggle
  const playScanToggleChime = (scanned: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      if (scanned) {
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.12); // C6
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      }
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      // Audio fallback
    }
  };

  // Toggle single scan point for a street
  const handleToggleStreetScan = (e: React.MouseEvent, streetName: string, scanId: number) => {
    e.stopPropagation();
    setStreetScansState(prev => {
      const currentList = prev[streetName] || [
        { id: 1, label: 'Scan 1', taLabel: 'ஸ்கேன் 1', locationName: 'Point 1 QR', taLocationName: 'புள்ளி 1 QR', isScanned: false },
        { id: 2, label: 'Scan 2', taLabel: 'ஸ்கேன் 2', locationName: 'Point 2 QR', taLocationName: 'புள்ளி 2 QR', isScanned: false },
        { id: 3, label: 'Scan 3', taLabel: 'ஸ்கேன் 3', locationName: 'Point 3 QR', taLocationName: 'புள்ளி 3 QR', isScanned: false },
        { id: 4, label: 'Scan 4', taLabel: 'ஸ்கேன் 4', locationName: 'Point 4 QR', taLocationName: 'புள்ளி 4 QR', isScanned: false },
        { id: 5, label: 'Scan 5', taLabel: 'ஸ்கேன் 5', locationName: 'Point 5 QR', taLocationName: 'புள்ளி 5 QR', isScanned: false },
      ];

      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const updatedList = currentList.map(sc => {
        if (sc.id === scanId) {
          const nextState = !sc.isScanned;
          playScanToggleChime(nextState);
          return {
            ...sc,
            isScanned: nextState,
            scannedAt: nextState ? nowStr : undefined
          };
        }
        return sc;
      });

      const nextObj = { ...prev, [streetName]: updatedList };
      try {
        localStorage.setItem('ccmc_street_5scans', JSON.stringify(nextObj));
      } catch (err) {
        // storage fallback
      }
      return nextObj;
    });
  };

  // State for collapsible cards (expand / collapse details via down arrow)
  const [expandedStreetIds, setExpandedStreetIds] = useState<Record<string, boolean>>({ 'st-group-0': true });
  const [expandedDoorIds, setExpandedDoorIds] = useState<Record<string, boolean>>({ 'REC-1001': true, '1': true });

  // State for selected scan card (streetId-scanId), to show detail panel
  const [selectedScanKey, setSelectedScanKey] = useState<string | null>(null);

  const handleScanCardClick = (e: React.MouseEvent, streetId: string, scanId: number) => {
    e.stopPropagation();
    const key = `${streetId}-${scanId}`;
    setSelectedScanKey(prev => prev === key ? null : key);
  };
  const [selectedMapRecord, setSelectedMapRecord] = useState<SWMSHouseholdRecord | null>(null);

  const toggleStreetExpand = (e: React.MouseEvent, streetId: string) => {
    e.stopPropagation();
    setExpandedStreetIds(prev => ({
      ...prev,
      [streetId]: !prev[streetId]
    }));
  };

  const toggleDoorExpand = (e: React.MouseEvent, doorId: string) => {
    e.stopPropagation();
    setExpandedDoorIds(prev => ({
      ...prev,
      [doorId]: !prev[doorId]
    }));
  };

  // Build Distinct Street Groups dynamically from real submitted records
  const uniqueStreetNames = Array.from(new Set(records.map(r => r.streetName).filter(Boolean)));

  const streetGroups: StreetRecordGroup[] = uniqueStreetNames.map((stName, idx) => {
    const matchingRec = records.find(r => r.streetName.toLowerCase() === stName.toLowerCase()) || records[0];

    const scans = streetScansState[stName] || [
      { id: 1, label: 'Scan 1', taLabel: 'ஸ்கேன் 1', locationName: 'North Point QR', taLocationName: 'வடமுனை QR', isScanned: false },
      { id: 2, label: 'Scan 2', taLabel: 'ஸ்கேன் 2', locationName: 'Cross 1 QR', taLocationName: 'குறுக்கு 1 QR', isScanned: false },
      { id: 3, label: 'Scan 3', taLabel: 'ஸ்கேன் 3', locationName: 'Center QR', taLocationName: 'மைய QR', isScanned: false },
      { id: 4, label: 'Scan 4', taLabel: 'ஸ்கேன் 4', locationName: 'Cross 2 QR', taLocationName: 'குறுக்கு 2 QR', isScanned: false },
      { id: 5, label: 'Scan 5', taLabel: 'ஸ்கேன் 5', locationName: 'Exit QR', taLocationName: 'முடிவு QR', isScanned: false },
    ];

    return {
      id: `st-group-${idx}`,
      streetName: stName,
      zone: matchingRec?.zone || 'Central Zone',
      ward: matchingRec?.ward || 'Ward 12',
      representativeHouseId: matchingRec?.houseId || `HID-${idx + 1}`,
      residentName: matchingRec?.householderName || 'Resident Rep',
      contactNo: matchingRec?.householderContact || '',
      submittedAt: matchingRec?.submittedAt || '',
      scans
    };
  });

  // Filter records based on search and status
  const filteredRecords = records.filter(rec => {
    const matchesSearch = 
      rec.doorNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.streetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.householderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.houseId.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'All') return matchesSearch;
    if (statusFilter === 'Covered') return matchesSearch && rec.coverageStatus === 'Covered';
    if (statusFilter === 'Not Covered') return matchesSearch && rec.coverageStatus === 'Not Covered';
    return matchesSearch;
  });

  // 📄 PUSH CART SPECIFIC PAGINATION (< [ number ] > layout)
  const [pushCartPage, setPushCartPage] = useState<number>(1);
  const PUSH_CART_PER_PAGE = 8;

  // Reset pagination to page 1 whenever search, filter, or vehicle changes
  useEffect(() => {
    setPushCartPage(1);
  }, [searchTerm, statusFilter, assignedVehicleId]);

  const totalPushCartPages = Math.max(1, Math.ceil(filteredRecords.length / PUSH_CART_PER_PAGE));
  const currentPushCartPage = Math.min(Math.max(1, pushCartPage), totalPushCartPages);
  const pushCartStartIdx = (currentPushCartPage - 1) * PUSH_CART_PER_PAGE;
  const pushCartEndIdx = Math.min(pushCartStartIdx + PUSH_CART_PER_PAGE, filteredRecords.length);
  const paginatedPushCartRecords = filteredRecords.slice(pushCartStartIdx, pushCartEndIdx);

  const handlePushCartPrev = () => {
    if (currentPushCartPage > 1) {
      setPushCartPage(prev => prev - 1);
    }
  };

  const handlePushCartNext = () => {
    if (currentPushCartPage < totalPushCartPages) {
      setPushCartPage(prev => prev + 1);
    }
  };

  // Filter Street Groups for Tata Ace, BOV, and OBL-PVT
  const filteredStreetGroups = streetGroups.filter(st => {
    const matchesSearch = 
      st.streetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.ward.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.residentName.toLowerCase().includes(searchTerm.toLowerCase());

    const completedScansCount = st.scans.filter(s => s.isScanned).length;

    if (statusFilter === 'All') return matchesSearch;
    if (statusFilter === 'Covered') return matchesSearch && completedScansCount === 5;
    if (statusFilter === 'Partially Covered') return matchesSearch && completedScansCount === 4;
    if (statusFilter === 'Not Covered') return matchesSearch && completedScansCount <= 3;
    return matchesSearch;
  });

  // Calculate reliable statistics dynamically based on vehicle mode
  const totalCount = isPushCart
    ? (records.length || 300)
    : streetGroups.length;
  const coveredCount = isPushCart
    ? records.filter(r => r.coverageStatus === 'Covered').length
    : streetGroups.filter(st => st.scans.filter(s => s.isScanned).length === 5).length;
  const partiallyCoveredCount = isPushCart
    ? 0
    : streetGroups.filter(st => st.scans.filter(s => s.isScanned).length === 4).length;
  const notCoveredCount = isPushCart
    ? records.filter(r => r.coverageStatus === 'Not Covered').length
    : streetGroups.filter(st => st.scans.filter(s => s.isScanned).length <= 3).length;
  const coveredPct = totalCount > 0 ? Math.round((coveredCount / totalCount) * 100) : 0;
  const notCoveredPct = 100 - coveredPct;

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto pb-32">
      
      {/* TOP GREEN HEADER BANNER - EXACT CCMC MUNICIPAL GREEN (HEADER ONLY) */}
      <div className="bg-[#1E7A38] text-white p-0 shadow-md sticky top-0 z-20 border-b border-[#166534] overflow-hidden">
        
        {/* OFFICIAL CCMC TOP HEADER ROW: CM PHOTO + EMBLEM + MUNICIPAL TITLES IN 3 LINES + PROFILE + LOGOUT */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-4 px-2 xs:px-2.5 sm:px-5 lg:px-6 py-1.5 sm:py-2.5 lg:py-3 border-b border-emerald-700/60 min-h-[56px] sm:min-h-[64px]">
          
          {/* Left: Back Button + Unified Government Brand Insignia (CM Portrait + CCMC Emblem) + Municipal Titles in 3 Lines */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
            {/* Back Button to Vehicle Assignment */}
            {onOpenVehicleAssignment && (
              <button
                type="button"
                onClick={onOpenVehicleAssignment}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#113B22] hover:bg-black/30 border border-emerald-500/50 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer flex-shrink-0 shadow-xs mr-0.5"
                title={lang === 'ta' ? 'வாகன ஒதுக்கீடு பக்கத்திற்குச் செல்லவும் (Back to Vehicle Assignment)' : 'Back to Vehicle Assignment'}
                aria-label="Back to Vehicle Assignment"
              >
                <ArrowLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
              </button>
            )}

            {/* Unified Government Brand Insignia Duo */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* 1. Coimbatore City Emblem / CCMC Logo */}
              <div 
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-amber-400 bg-white p-0.5 shadow-sm relative flex-shrink-0 flex items-center justify-center" 
                title="Coimbatore City Municipal Corporation Emblem"
              >
                <img
                  src={ccmcLogo}
                  alt="Coimbatore City Municipal Corporation Logo"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    if (e.currentTarget.src !== ccmcFallbackLogo) {
                      e.currentTarget.src = ccmcFallbackLogo;
                    }
                  }}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* 2. Smart City Mission Logo */}
              <div 
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-amber-400 bg-white p-0.5 shadow-sm relative flex-shrink-0 flex items-center justify-center" 
                title="Smart City Mission"
              >
                <img
                  src={smartCityLogo}
                  alt="Smart City Mission Logo"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    if (e.currentTarget.src !== smartCityFallbackLogo) {
                      e.currentTarget.src = smartCityFallbackLogo;
                    }
                  }}
                  className="w-full h-full object-contain p-0.5"
                />
              </div>
            </div>

            {/* Municipal Title - Responsive Layout: Desktop single line, Mobile stacked */}
            <div className="min-w-0 flex flex-col justify-center">
              {/* Mobile View: Stacked line-by-line (< sm) */}
              <div className="sm:hidden flex flex-col justify-center leading-none">
                <div className="text-[12px] font-black tracking-tight text-white truncate leading-tight drop-shadow-xs">
                  Coimbatore City
                </div>
                <div className="text-[10px] font-black tracking-tight text-amber-300 truncate leading-tight mt-0.5 drop-shadow-xs">
                  Municipal Corporation
                </div>
                <div className="text-[9px] font-bold text-cyan-300 tracking-wide uppercase truncate leading-tight mt-0.5">
                  USER
                </div>
              </div>

              {/* Desktop View: Single horizontal line (>= sm) */}
              <div className="hidden sm:flex sm:items-center sm:gap-2 leading-tight">
                <span className="text-sm lg:text-base font-black tracking-tight text-white whitespace-nowrap drop-shadow-xs">
                  Coimbatore City Municipal Corporation
                </span>
                <span className="text-xs lg:text-sm font-black tracking-wider text-amber-300 uppercase whitespace-nowrap drop-shadow-xs">
                  • USER
                </span>
              </div>
            </div>
          </div>

          {/* Right: Assigned Vehicle Badge (Fixed Header), Worker Profile Pill, Language Toggle & Logout */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
            
            {/* FIXED ASSIGNED VEHICLE NAME BADGE IN HEADER */}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-[#FF9E00] text-slate-950 px-2 sm:px-3 py-1 rounded-full font-black text-[10px] sm:text-xs shadow-md border border-amber-300 flex-shrink-0">
              <span className="text-xs sm:text-sm">{activeVehicle.icon}</span>
              <span className="uppercase tracking-tight">{lang === 'ta' ? activeVehicle.taName : activeVehicle.name}</span>
            </div>

            {/* Worker Profile Pill - Hidden on small mobile to give full room to title */}
            <div className="hidden sm:flex items-center gap-1 sm:gap-2 bg-[#113B22] border border-emerald-500/30 rounded-full p-1 sm:px-2.5 sm:py-1 shadow-xs">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white flex items-center justify-center shadow-xs flex-shrink-0 overflow-hidden p-0.5 border border-emerald-200">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9Yi9x2fIRfFWOX4bKywfFVpp7-ZnDqGUpXdxKwQ0g15y5DQlyWabP8PI&s=10"
                  alt="SWMS"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-xs"
                />
              </div>
              <div className="text-left pr-1 hidden md:block">
                <div className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
                  {userName}
                </div>
                <div className="text-[9px] font-semibold text-emerald-200 tracking-wider flex items-center gap-1">
                  <span>{lang === 'ta' ? 'கள அதிகாரி' : 'FIELD OFFICER'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </div>
              </div>
            </div>

            {/* Language Switcher Segment [ தமிழ் | English ] - Compact */}
            <div className="bg-[#113B22] border border-emerald-500/40 rounded-full p-0.5 flex items-center shadow-xs flex-shrink-0 scale-90 sm:scale-100 origin-right">
              <button
                type="button"
                onClick={() => {
                  if (onSetLanguage) onSetLanguage('ta');
                  else if (lang !== 'ta' && onToggleLang) onToggleLang();
                }}
                className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black transition-all cursor-pointer flex items-center gap-0.5 sm:gap-1 ${
                  lang === 'ta'
                    ? 'bg-[#FF9E00] text-slate-950 shadow-xs'
                    : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
                }`}
                title="தமிழ் மொழியைத் தேர்வு செய்"
              >
                <Globe className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${lang === 'ta' ? 'text-slate-950' : 'text-emerald-300'}`} />
                <span>தமிழ்</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onSetLanguage) onSetLanguage('en');
                  else if (lang !== 'en' && onToggleLang) onToggleLang();
                }}
                className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-[#FF9E00] text-slate-950 shadow-xs'
                    : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
                }`}
                title="Select English Language"
              >
                <span>English</span>
              </button>
            </div>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1 p-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-[9px] sm:text-[10px] transition shadow-md border border-rose-400 cursor-pointer flex-shrink-0"
                title="Logout / வெளியேறு"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">{lang === 'ta' ? 'வெளியேறு' : 'Logout'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Operational Status Sub-Bar */}
        <div className="flex px-2.5 sm:px-4 lg:px-6 py-1.5 items-center gap-3 text-[9px] sm:text-[10px] lg:text-xs text-emerald-100 font-semibold border-t border-emerald-700/50 bg-[#113B22]">
          {/* Vehicle badge */}
          <div className="hidden sm:flex items-center gap-1 bg-amber-400/20 border border-amber-400/50 text-amber-300 font-bold px-2 py-0.5 rounded-full text-[9px] sm:text-[10px]">
            <span>{activeVehicle.icon}</span>
            <span>{lang === 'ta' ? activeVehicle.taName : activeVehicle.name}</span>
          </div>
          <span className="hidden md:inline text-emerald-300/80 text-[10px]">
            • {lang === 'ta' ? 'GPS ஒத்திசைக்கப்பட்டது' : 'GPS Synced'}
          </span>
        </div>

      </div>

      {/* MAIN BODY CONTENT - CRISP WHITE BACKGROUND */}
      <div className="bg-white p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6 flex-1">

        {/* SUMMARY STATS CARDS GRID - GOOGLE BRAND COLORS (BLUE, GREEN, RED) */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 lg:gap-6">
          
          {/* Card 1: Total Area / Houses or Streets (Google Blue #1A73E8) */}
          <div className="bg-[#1A73E8] text-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 lg:p-5 shadow-md border border-blue-400/50 flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1 text-white">
                <span className="text-[8.5px] sm:text-[10px] lg:text-xs font-black uppercase tracking-tight text-blue-100">
                  {lang === 'ta' ? 'மொத்த பகுதி' : 'TOTAL AREA'}
                </span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-xl sm:text-2xl lg:text-4xl font-black text-white leading-none">
                  <AnimatedCounter value={totalCount} />
                </span>
                <span className="block text-[10px] sm:text-xs lg:text-sm font-bold text-blue-100 mt-0.5 lg:mt-1">
                  {lang === 'ta' ? (isPushCart ? 'வீடுகள்' : 'தெருக்கள்') : (isPushCart ? 'Houses' : 'Streets')}
                </span>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-13 lg:h-13 rounded-lg lg:rounded-2xl overflow-hidden border border-white/80 shadow-xs flex-shrink-0 bg-white p-1 lg:p-1.5 flex items-center justify-center">
                <TotalHouseholdsLogo className="w-full h-full object-contain" />
              </div>
            </div>
          </div>

          {/* Card 2: Collected / Covered (Google Green #1E8E3E) */}
          <div className="bg-[#1E8E3E] text-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 lg:p-5 shadow-md border border-emerald-400/50 flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1 text-white">
                <span className="text-[8.5px] sm:text-[10px] lg:text-xs font-black uppercase tracking-tight text-emerald-100">
                  {isPushCart
                    ? (lang === 'ta' ? 'சேகரித்தது' : 'COLLECTED')
                    : (lang === 'ta' ? 'மூடப்பட்டது (5/5)' : 'COVERED (5/5)')}
                </span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-xl sm:text-2xl lg:text-4xl font-black text-white leading-none">
                  <AnimatedCounter value={coveredCount} />
                </span>
                <span className="block text-[10px] sm:text-xs lg:text-sm font-bold text-emerald-100 mt-0.5 lg:mt-1">
                  {coveredPct}% {lang === 'ta' ? (isPushCart ? 'சேகரிக்கப்பட்டது' : 'முடிந்தது (5/5)') : 'Done (5/5)'}
                </span>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-13 lg:h-13 rounded-lg lg:rounded-2xl overflow-hidden border border-white/80 shadow-xs flex-shrink-0 bg-white p-1 lg:p-1.5 flex items-center justify-center">
                <CollectedTruckLogo className="w-full h-full object-contain" />
              </div>
            </div>
          </div>

          {/* Card 3: Not Collected / Not Covered & Partial (Google Red #D93025) */}
          <div className="bg-[#D93025] text-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 lg:p-5 shadow-md border border-rose-400/50 flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1 text-white">
                <span className="text-[8.5px] sm:text-[10px] lg:text-xs font-black uppercase tracking-tight text-rose-100">
                  {isPushCart
                    ? (lang === 'ta' ? 'சேகரிக்காதவை' : 'NOT COLLECTED')
                    : (lang === 'ta' ? 'மூடப்படாதவை / பகுதி' : 'PENDING / PARTIAL')}
                </span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-xl sm:text-2xl lg:text-4xl font-black text-white leading-none">
                  <AnimatedCounter value={isPushCart ? notCoveredCount : (notCoveredCount + partiallyCoveredCount)} />
                </span>
                <span className="block text-[10px] sm:text-xs lg:text-sm font-bold text-rose-100 mt-0.5 lg:mt-1">
                  {isPushCart
                    ? `${notCoveredPct}% ${lang === 'ta' ? 'நிலுவை' : 'Pending'}`
                    : (lang === 'ta' 
                        ? `4/5 பகுதி: ${partiallyCoveredCount} • ≤3 விடுபட்டவை: ${notCoveredCount}` 
                        : `4/5 Partial: ${partiallyCoveredCount} • ≤3 Pending: ${notCoveredCount}`)}
                </span>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-13 lg:h-13 rounded-lg lg:rounded-2xl overflow-hidden border border-white/80 shadow-xs flex-shrink-0 bg-white p-1 lg:p-1.5 flex items-center justify-center">
                <NotCollectedDustbinLogo className="w-full h-full object-contain" />
              </div>
            </div>
          </div>

        </div>


        {/* 🎙️ AREA COVERAGE HISTORY & RECORD LIST */}
        <div id="push-cart-records-section" className="bg-white text-slate-900 rounded-3xl p-4 sm:p-5 lg:p-6 shadow-md border-2 border-emerald-300 space-y-4 relative overflow-hidden">
          {/* SEARCH & FILTER CONTROLS */}
          <div className="space-y-2.5 lg:space-y-3.5">
            {/* Search Bar */}
            <div className="relative group">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-[#1E7A38] group-hover:text-[#1E7A38] transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  isPushCart
                    ? (lang === 'ta' ? 'கதவு எண், தெரு அல்லது குடியிருப்பாளர் பெயர்...' : 'Search door no, street, or resident name...')
                    : (lang === 'ta' ? 'தெரு பெயர் அல்லது குடியிருப்பாளர் பெயர்...' : 'Search street name or resident name...')
                }
                className="w-full bg-slate-50 hover:bg-white focus:bg-white pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 lg:py-3.5 rounded-2xl border border-slate-200 hover:border-[#1E7A38] text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 shadow-xs focus:outline-none focus:border-[#1E7A38] focus:ring-2 focus:ring-[#1E7A38]/30 transition"
              />
            </div>

            {/* Filter Pills */}
            {isPushCart ? (
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setStatusFilter('All')}
                  className={`py-2.5 sm:py-3 px-3 rounded-2xl font-black text-xs sm:text-sm lg:text-base transition border-2 shadow-xs cursor-pointer truncate active:scale-95 ${
                    statusFilter === 'All'
                      ? 'bg-[#1E7A38] text-white border-[#1E7A38] shadow-sm'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-[#1E7A38] hover:text-[#1E7A38]'
                  }`}
                >
                  {lang === 'ta' ? 'அனைத்தும்' : 'All'}
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('Covered')}
                  className={`py-2.5 sm:py-3 px-3 rounded-2xl font-black text-xs sm:text-sm lg:text-base transition border-2 shadow-xs cursor-pointer truncate active:scale-95 ${
                    statusFilter === 'Covered'
                      ? 'bg-[#1E7A38] text-white border-[#1E7A38] shadow-sm'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-[#1E7A38] hover:text-[#1E7A38]'
                  }`}
                >
                  {lang === 'ta' ? 'சேகரித்தது' : 'Collected'}
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('Not Covered')}
                  className={`py-2.5 sm:py-3 px-3 rounded-2xl font-black text-xs sm:text-sm lg:text-base transition border-2 shadow-xs cursor-pointer truncate active:scale-95 ${
                    statusFilter === 'Not Covered'
                      ? 'bg-[#D93025] text-white border-[#D93025] shadow-sm'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-[#D93025] hover:text-[#D93025]'
                  }`}
                >
                  {lang === 'ta' ? 'சேகரிக்காதவை' : 'Not Collected'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={() => setStatusFilter('All')}
                  className={`py-2.5 px-2.5 rounded-2xl font-black text-xs sm:text-sm transition border-2 shadow-xs cursor-pointer truncate active:scale-95 text-center ${
                    statusFilter === 'All'
                      ? 'bg-[#1E7A38] text-white border-[#1E7A38] shadow-sm'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-[#1E7A38] hover:text-[#1E7A38]'
                  }`}
                >
                  {lang === 'ta' ? 'அனைத்தும்' : 'All'}
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('Covered')}
                  className={`py-2.5 px-2 rounded-2xl font-black text-xs sm:text-sm transition border-2 shadow-xs cursor-pointer truncate active:scale-95 flex items-center justify-center gap-1 text-center ${
                    statusFilter === 'Covered'
                      ? 'bg-[#1E7A38] text-white border-[#1E7A38] shadow-sm'
                      : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0] hover:border-[#1E7A38]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{lang === 'ta' ? 'மூடப்பட்டது (5/5)' : 'Covered (5/5)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('Partially Covered')}
                  className={`py-2.5 px-2 rounded-2xl font-black text-xs sm:text-sm transition border-2 shadow-xs cursor-pointer truncate active:scale-95 flex items-center justify-center gap-1 text-center ${
                    statusFilter === 'Partially Covered'
                      ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-sm'
                      : 'bg-[#FFF7ED] text-[#C2410C] border-[#FDBA74] hover:border-[#EA580C]'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{lang === 'ta' ? 'பகுதி (4/5)' : 'Partial (4/5)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('Not Covered')}
                  className={`py-2.5 px-2 rounded-2xl font-black text-xs sm:text-sm transition border-2 shadow-xs cursor-pointer truncate active:scale-95 flex items-center justify-center gap-1 text-center ${
                    statusFilter === 'Not Covered'
                      ? 'bg-[#D93025] text-white border-[#D93025] shadow-sm'
                      : 'bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3] hover:border-[#D93025]'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{lang === 'ta' ? 'மூடப்படாதவை (≤3)' : 'Not Covered (≤3)'}</span>
                </button>
              </div>
            )}

            {/* 📄 COMPACT STEPPER PAGINATION (< [ number ] >) - Push Cart Only */}
            {isPushCart && filteredRecords.length > 0 && (
              <div className="pt-1 flex items-center justify-between bg-[#F0FDF4] border-2 border-[#A7F3D0] rounded-2xl px-4 py-2.5 sm:py-3 shadow-2xs">
                {/* Left: Summary Text */}
                <div className="text-xs sm:text-sm font-black text-slate-800">
                  {lang === 'ta' ? (
                    <span>
                      கதவுகள் {pushCartStartIdx + 1}–{pushCartEndIdx} (மொத்தம் {filteredRecords.length})
                    </span>
                  ) : (
                    <span>
                      Doors {pushCartStartIdx + 1}–{pushCartEndIdx} of {filteredRecords.length}
                    </span>
                  )}
                </div>

                {/* Right: < [ Square Number ] > Stepper */}
                <div className="flex items-center space-x-2">
                  {/* < Previous Button */}
                  <button
                    type="button"
                    onClick={handlePushCartPrev}
                    disabled={currentPushCartPage <= 1}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl font-black text-sm flex items-center justify-center transition border shadow-2xs active:scale-95 ${
                      currentPushCartPage <= 1
                        ? 'bg-[#F8FAFC] text-slate-300 border-slate-200 cursor-not-allowed'
                        : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#1E7A38] border-slate-200 hover:border-emerald-400 cursor-pointer'
                    }`}
                    title={lang === 'ta' ? 'முந்தைய பக்கம் (<)' : 'Previous Page (<)'}
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  {/* [ Square Box with Current Page Number ] */}
                  <div 
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#1E7A38] text-white font-black text-xs sm:text-sm flex items-center justify-center border border-emerald-800 shadow-sm select-none"
                    title={`Page ${currentPushCartPage} of ${totalPushCartPages}`}
                  >
                    {currentPushCartPage}
                  </div>

                  {/* > Next Button */}
                  <button
                    type="button"
                    onClick={handlePushCartNext}
                    disabled={currentPushCartPage >= totalPushCartPages}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl font-black text-sm flex items-center justify-center transition border shadow-2xs active:scale-95 ${
                      currentPushCartPage >= totalPushCartPages
                        ? 'bg-[#F8FAFC] text-slate-300 border-slate-200 cursor-not-allowed'
                        : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#1E7A38] border-emerald-300 hover:border-emerald-500 cursor-pointer'
                    }`}
                    title={lang === 'ta' ? 'அடுத்த பக்கம் (>)' : 'Next Page (>)'}
                    aria-label="Next Page"
                  >
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* INTEGRATED RECORDS & VOICE AUDIO FEED (2-Column Grid on Desktop) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4 lg:gap-5 pt-1">
            {!isPushCart ? (
              /* TATA ACE / BOV / OBL-PVT MODE: 5-SCAN CHECKPOINTS PER STREET */
              filteredStreetGroups.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2">
                  <Truck className="w-8 h-8 text-blue-600 mx-auto animate-pulse" />
                  <p className="text-xs font-black text-slate-800">
                    {lang === 'ta' 
                      ? 'தெரு பதிவுகள் எதுவும் கிடைக்கவில்லை.' 
                      : 'No street records match your search filter.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}
                    className="text-[11px] font-black text-[#1E7A38] hover:bg-[#1E7A38] hover:text-white bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 transition cursor-pointer"
                  >
                    {lang === 'ta' ? 'தேடலை மீட்டமை' : 'Reset Filter'}
                  </button>
                </div>
              ) : (
                filteredStreetGroups.map((stGroup) => {
                  const completedScans = stGroup.scans.filter(s => s.isScanned).length;
                  const totalScans = stGroup.scans.length;
                  const covMeta = getStreetCoverageStatus(completedScans);
                  const isExpanded = !!expandedStreetIds[stGroup.id];

                  return (
                    <div
                      key={stGroup.id}
                      className={`bg-white rounded-3xl p-4 sm:p-5 border-2 transition-all shadow-xs space-y-3.5 group hover:shadow-md ${covMeta.cardBorder}`}
                    >
                      {/* Top Header Row matching the user's uploaded image */}
                      <div 
                        onClick={(e) => toggleStreetExpand(e, stGroup.id)}
                        className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        {/* Left Side: Solid Blue Street Badge + Zone/Ward Badges + Total 5 QR Points */}
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          {/* Street Name Solid Blue Pill */}
                          <div className="bg-[#0B63F6] hover:bg-blue-600 text-white px-4 py-2 rounded-2xl font-black text-xs sm:text-sm shadow-xs flex-shrink-0">
                            {stGroup.streetName}
                          </div>

                          {/* Zone, Ward & Total 5 QR Points Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              {/* Zone Badge */}
                              <span className="bg-[#FAF5FF] text-[#6B21A8] border border-[#D8B4FE] font-black text-xs px-3 py-1 rounded-xl shadow-2xs">
                                {stGroup.zone || 'East Zone'}
                              </span>

                              {/* Ward Badge */}
                              <span className="bg-[#FEFCE8] text-[#854D0E] border border-[#FDE047] font-black text-xs px-3 py-1 rounded-xl shadow-2xs">
                                {stGroup.ward || 'Ward 12'}
                              </span>
                            </div>

                            {/* Total 5 QR Points (X/5) Badge */}
                            <span className={`font-black text-xs px-3 py-1 rounded-xl shadow-2xs flex items-center gap-1.5 border ${covMeta.pointsBadgeBg}`}>
                              <QrCode className="w-3.5 h-3.5" />
                              <span>{lang === 'ta' ? `மொத்த 5 QR புள்ளிகள் (${completedScans}/5)` : `Total 5 QR Points (${completedScans}/5)`}</span>
                            </span>
                          </div>
                        </div>

                        {/* Right Side: Covered (Green) / Partially Covered (Red-Orange) / Not Covered (Red) Pill + Green Chevron Toggle Button */}
                        <div className="flex items-center gap-2 flex-shrink-0 ml-auto sm:ml-0">
                          <span className={`px-3.5 py-1.5 rounded-2xl text-xs font-black border-2 shadow-2xs flex items-center gap-1.5 ${covMeta.badgeBg} ${covMeta.badgeText} ${covMeta.badgeBorder}`}>
                            {completedScans === 5 ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0" />
                                <span>{lang === 'ta' ? 'மூடப்பட்டது (Covered)' : 'Covered'}</span>
                              </>
                            ) : completedScans === 4 ? (
                              <>
                                <AlertTriangle className="w-4 h-4 text-[#EA580C] flex-shrink-0" />
                                <span>{lang === 'ta' ? 'பகுதி மூடப்பட்டது (Partially Covered)' : 'Partially Covered'}</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-[#E11D48] flex-shrink-0" />
                                <span>{lang === 'ta' ? 'மூடப்படாதவை (Not Covered)' : 'Not Covered'}</span>
                              </>
                            )}
                          </span>

                          {/* Green Accordion Toggle Button with Up/Down Chevron */}
                          <button
                            type="button"
                            onClick={(e) => toggleStreetExpand(e, stGroup.id)}
                            className="w-8 h-8 rounded-xl bg-[#1E7A38] hover:bg-[#166534] text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
                            title={isExpanded ? (lang === 'ta' ? 'மறைக்க' : 'Collapse Details') : (lang === 'ta' ? 'விவரங்களை திறக்க' : 'Expand Details')}
                            aria-expanded={isExpanded}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 stroke-[3]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 stroke-[3]" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* 📍 COLLAPSIBLE DETAILS SECTION (5 QR Scans + Telemetry + Actions) */}
                      {isExpanded && (
                        <div className="space-y-3 pt-2 border-t border-slate-100 animate-fadeIn">
                          {/* 📍 5-SCAN CHECKPOINTS CONTAINER */}
                          <div className="bg-[#F8FAFC] rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 space-y-2.5">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                              <span className="flex items-center gap-1.5 font-extrabold text-slate-800">
                                <QrCode className="w-4 h-4 text-[#1E7A38]" />
                                <span>
                                  {lang === 'ta' 
                                     ? `5 QR ஸ்கேன் நிலவரம் (${completedScans} சரி ✓, ${totalScans - completedScans} மீதம்)` 
                                     : `5 QR Scan Checkpoints (${completedScans} Done ✓, ${totalScans - completedScans} Pending)`}
                                </span>
                              </span>
                              <span className="text-[10px] text-blue-500 font-bold flex items-center gap-1">
                                <QrCode className="w-3 h-3" />
                                {lang === 'ta' ? 'QR ஸ்கேன் மட்டும்' : 'QR scan only'}
                              </span>
                            </div>

                            {/* 5 Scan Cards Row — Display only, updated by real QR scan */}
                            <div className="grid grid-cols-5 gap-2 sm:gap-3">
                              {stGroup.scans.map((scan) => {
                                const isDone = scan.isScanned;
                                return (
                                  <div
                                    key={scan.id}
                                    className={`flex flex-col items-center justify-center py-2.5 px-1.5 sm:py-3 sm:px-2 rounded-2xl border-2 shadow-2xs text-center select-none w-full ${
                                      isDone
                                        ? 'bg-[#ECFDF5] border-[#10B981] text-slate-900'
                                        : 'bg-[#FFF1F2] border-[#FDA4AF] text-[#991B1B] opacity-80'
                                    }`}
                                    title={isDone ? `${scan.label}: Done (${scan.scannedAt || 'Scanned'})` : `${scan.label}: Pending`}
                                  >
                                    {/* Circle Icon: Green Check or Red X */}
                                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-black mb-1.5 shadow-2xs ${
                                      isDone
                                        ? 'bg-[#1E7A38] text-white ring-2 ring-emerald-200'
                                        : 'bg-[#D93025] text-white ring-2 ring-rose-200'
                                    }`}>
                                      {isDone ? (
                                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                                      ) : (
                                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                                      )}
                                    </div>

                                    {/* Scan Number Label */}
                                    <span className="text-[11px] sm:text-xs font-black truncate w-full leading-tight text-slate-900">
                                      {lang === 'ta' ? scan.taLabel : scan.label}
                                    </span>

                                    {/* Status or Time */}
                                    <span className={`text-[9px] sm:text-[10.5px] font-bold mt-1 leading-tight ${
                                      isDone ? 'text-emerald-700 font-mono' : 'text-rose-500'
                                    }`}>
                                      {isDone ? (scan.scannedAt || (lang === 'ta' ? 'சரி ✓' : 'Done ✓')) : (lang === 'ta' ? 'மீதம்' : 'Pending')}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Rule Banner: 5/5 Green Covered, 4/5 Red-Orange Partially Covered, <=3 Red Not Covered */}
                            <div className={`p-2 sm:p-2.5 rounded-xl border text-[11px] sm:text-xs font-bold flex items-center justify-between gap-2 ${covMeta.bannerBg}`}>
                              <div className="flex items-center gap-1.5 min-w-0">
                                {completedScans === 5 ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                ) : completedScans === 4 ? (
                                  <AlertTriangle className="w-4 h-4 text-[#EA580C] flex-shrink-0" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                                )}
                                <span className="truncate">
                                  {lang === 'ta' ? covMeta.ruleTextTa : covMeta.ruleTextEn}
                                </span>
                              </div>
                              {completedScans < 5 && (
                                <span className={`text-[10px] font-extrabold flex-shrink-0 flex items-center gap-1 ${
                                  completedScans === 4 ? 'text-orange-700' : 'text-rose-700'
                                }`}>
                                  <QrCode className="w-3 h-3" />
                                  {lang === 'ta' 
                                    ? `${5 - completedScans} ஸ்கேன் மீதம்` 
                                    : `${5 - completedScans} scan(s) left`}
                                </span>
                              )}
                            </div>


                          </div>

                          {/* 📍 GPS TELEMETRY & LOCATION BOX - Styled matching Door view image */}
                          <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start space-x-2.5 min-w-0">
                                <Navigation className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <div className="min-w-0 space-y-1">
                                  <div className="font-mono font-black text-xs sm:text-sm text-slate-800">
                                    11.0129° N, 76.9556° E
                                  </div>
                                  <div className="text-xs text-slate-600 leading-snug">
                                    {stGroup.streetName}, Cross Cut Rd, Gandhipuram, Coimbatore - 641012
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const matchingRec = records.find(r => r.streetName.toLowerCase().includes(stGroup.streetName.toLowerCase())) || records[0];
                                  setSelectedMapRecord(matchingRec);
                                }}
                                className="text-[#047857] hover:text-emerald-900 bg-[#ECFDF5] hover:bg-[#D1FAE5] px-3 py-1.5 rounded-xl border border-[#6EE7B7] font-black text-xs flex items-center space-x-1.5 cursor-pointer shadow-2xs active:scale-95 flex-shrink-0"
                              >
                                <span>{lang === 'ta' ? 'வரைபடம்' : 'Map'}</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Footer Row: Timestamp & Actions */}
                          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                            <span className="font-semibold text-slate-400">
                              {stGroup.submittedAt || '12 May 2025, 08:04 AM'}
                            </span>
                            
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenScanner();
                                }}
                                className="text-blue-700 hover:text-blue-900 font-black flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-2xl border border-blue-200 cursor-pointer transition shadow-2xs text-xs active:scale-95"
                              >
                                <QrCode className="w-4 h-4 text-blue-700" />
                                <span>{lang === 'ta' ? 'QR ஸ்கேன்' : 'Scan QR'}</span>
                              </button>


                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )
            ) : (
              /* PUSH CART MODE: DOOR-BY-DOOR RECORDS LIST WITH PAGINATION */
              filteredRecords.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2 col-span-1 lg:col-span-2">
                  <Search className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-xs font-black text-slate-800">
                    {lang === 'ta' 
                      ? 'கதவு பதிவுகள் எதுவும் கிடைக்கவில்லை.' 
                      : 'No door records match your search filter.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}
                    className="text-[11px] font-black text-[#1E7A38] hover:bg-[#1E7A38] hover:text-white bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 transition cursor-pointer"
                  >
                    {lang === 'ta' ? 'தேடலை மீட்டமை' : 'Reset Filter'}
                  </button>
                </div>
              ) : (
                paginatedPushCartRecords.map((rec) => {
                  const isCovered = rec.coverageStatus === 'Covered';
                  const cleanDoorLabel = rec.doorNo.toString().trim().toLowerCase().startsWith('door')
                    ? rec.doorNo
                    : `${lang === 'ta' ? 'கதவு' : 'Door'} ${rec.doorNo}`;

                  const isExpanded = !!expandedDoorIds[rec.id];

                  return (
                    <div
                      key={`door-${rec.id}`}
                      className={`bg-white rounded-3xl p-4 sm:p-5 border-2 transition-all shadow-xs space-y-3.5 group hover:shadow-md ${
                        isCovered 
                          ? 'border-emerald-400 hover:border-emerald-500' 
                          : 'border-rose-400/90 hover:border-rose-500'
                      }`}
                    >
                      {/* Top Header Row matching Image 2 */}
                      <div 
                        onClick={(e) => toggleDoorExpand(e, rec.id)}
                        className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        {/* Left Side: Solid Green Door Badge + Street Name + Zone & Ward Badges + Resident Info */}
                        <div className="flex items-center space-x-3 min-w-0">
                          {/* Door Pill Badge */}
                          <div className="bg-[#047857] hover:bg-[#065F46] text-white px-4 py-2 rounded-2xl font-black text-xs sm:text-sm shadow-xs flex-shrink-0">
                            {cleanDoorLabel}
                          </div>
                          
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm sm:text-base font-black text-slate-900 truncate leading-tight group-hover:text-[#1E7A38] transition-colors">
                                {rec.streetName}
                              </h3>
                              {/* Zone Badge */}
                              <span className="bg-[#FAF5FF] text-[#6B21A8] border border-[#D8B4FE] font-black text-xs px-2.5 py-0.5 rounded-xl shadow-2xs">
                                {rec.zone || 'Central Zone'}
                              </span>
                              {/* Ward Badge */}
                              <span className="bg-[#FEFCE8] text-[#854D0E] border border-[#FDE047] font-black text-xs px-2.5 py-0.5 rounded-xl shadow-2xs">
                                {rec.ward || 'Ward 12'}
                              </span>
                            </div>
                            {/* Resident Name & Householder ID */}
                            <p className="text-xs text-slate-500 font-semibold truncate mt-1">
                              {rec.householderName} • <span className="font-mono text-slate-400">{rec.houseId}</span>
                            </p>
                          </div>
                        </div>

                        {/* Right Side: Collected / Not Collected Pill + Green/White Accordion Button */}
                        <div className="flex items-center gap-2 flex-shrink-0 ml-auto sm:ml-0">
                          <span className={`px-3.5 py-1.5 rounded-2xl text-xs font-black border-2 shadow-2xs flex items-center gap-1.5 ${
                            isCovered
                              ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                              : 'bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]'
                          }`}>
                            {isCovered ? (lang === 'ta' ? 'சேகரித்தது' : 'Collected') : (lang === 'ta' ? 'சேகரிக்கவில்லை' : 'Not Collected')}
                          </span>

                          {/* Accordion Toggle Button with Up/Down Chevron */}
                          <button
                            type="button"
                            onClick={(e) => toggleDoorExpand(e, rec.id)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs active:scale-95 ${
                              isExpanded
                                ? 'bg-[#1E7A38] hover:bg-[#166534] text-white'
                                : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-[#1E7A38] border border-slate-200'
                            }`}
                            title={isExpanded ? (lang === 'ta' ? 'மறைக்க' : 'Collapse Details') : (lang === 'ta' ? 'விவரங்களை திறக்க' : 'Expand Details')}
                            aria-expanded={isExpanded}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 stroke-[3]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* 📍 COLLAPSIBLE DETAILS SECTION - Shown ONLY when isExpanded is true */}
                      {isExpanded && (
                        <div className="space-y-3 pt-2 border-t border-slate-100 animate-fadeIn">
                          {/* 📍 GPS TELEMETRY & LOCATION BOX */}
                          <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start space-x-2.5 min-w-0">
                                <Navigation className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <div className="min-w-0 space-y-1">
                                  <div className="font-mono font-black text-xs sm:text-sm text-slate-800">
                                    {rec.gpsCoordinates || (rec.latitude && rec.longitude ? `${rec.latitude.toFixed(4)}° N, ${rec.longitude.toFixed(4)}° E` : '11.0129° N, 76.9556° E')}
                                  </div>
                                  <div className="text-xs text-slate-600 leading-snug">
                                    {rec.locationName || `${cleanDoorLabel}, ${rec.streetName}, Cross Cut Rd, Gandhipuram, Coimbatore - 641012`}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMapRecord(rec);
                                }}
                                className="text-[#047857] hover:text-emerald-900 bg-[#ECFDF5] hover:bg-[#D1FAE5] px-3 py-1.5 rounded-xl border border-[#6EE7B7] font-black text-xs flex items-center space-x-1.5 cursor-pointer shadow-2xs active:scale-95 flex-shrink-0"
                              >
                                <span>{lang === 'ta' ? 'வரைபடம்' : 'Map'}</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Footer Row: Timestamp & "Edit Details >" Button */}
                          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                            <span className="font-semibold text-slate-400">
                              {rec.submittedAt || '12 May 2025, 08:04 AM'}
                            </span>
                            

                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )
            )}
          </div>

        </div>

      </div>

      {/* Real Interactive Leaflet Household Location Map Modal */}
      {selectedMapRecord && (
        <HouseholdLocationMapModal
          isOpen={Boolean(selectedMapRecord)}
          onClose={() => setSelectedMapRecord(null)}
          lat={selectedMapRecord.latitude || 11.0168}
          lng={selectedMapRecord.longitude || 76.9558}
          accuracy={selectedMapRecord.gpsAccuracy || 3.2}
          houseId={selectedMapRecord.houseId}
          doorNo={selectedMapRecord.doorNo}
          streetName={selectedMapRecord.streetName}
          ward={selectedMapRecord.ward}
          zone={selectedMapRecord.zone}
          residentName={selectedMapRecord.householderName}
          locationName={selectedMapRecord.locationName}
          lang={lang}
        />
      )}

    </div>
  );
};
