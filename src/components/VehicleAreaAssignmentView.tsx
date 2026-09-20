import React, { useState, useEffect, useMemo } from 'react';
import { Truck, MapPin, Check, ArrowRight, RotateCcw, Globe, LogOut, Bell, ChevronDown, Sparkles, RefreshCw, AlertCircle, ShieldCheck, Search, X, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ICCCLiveBadge } from './ICCCLiveBadge';
import { 
  ccmcLogo, 
  ccmcFallbackLogo,
  smartCityLogo,
  smartCityFallbackLogo
} from '../constants/branding';
import { 
  getStoredAssignedAreas, 
  saveStoredAssignedAreas 
} from '../utils/vehicleAssignmentStorage';

export interface VehicleOption {
  id: string;
  name: string;
  type: string;
  capacity: string;
  colorHex: string;
  colorName: string;
  imageUrl?: string;
  bgGradient: string;
  cardBorder: string;
  cardBg: string;
  iconBg: string;
  iconColor: string;
  titleColor: string;
  textColor: string;
  dotColor: string;
  activeRing: string;
  shadowColor: string;
}

export interface AreaOption {
  id: string;
  name: string;
  nameTa?: string;
  zone?: string;
  ward?: string;
  streets?: string[];
  streetsCount: number;
  qrPoints: number;
  assignedVehicleId?: string;
  assignedVehicleName?: string;
  assignedColorHex?: string;
  assignedBgColor?: string;
}

interface VehicleAreaAssignmentViewProps {
  lang: 'en' | 'ta';
  userName?: string;
  onSetLanguage?: (lang: 'en' | 'ta') => void;
  onToggleLang?: () => void;
  onLogout?: () => void;
  onComplete: (assignments: { areaId: string; vehicleId: string }[], assignedVehicleId?: string) => void;
  onSkip: () => void;
}

const DEFAULT_VEHICLES: VehicleOption[] = [
  {
    id: 'v-tata-ace',
    name: 'TATA ACE',
    type: 'Mini truck · wide streets',
    capacity: '1.2 T',
    colorHex: '#4285F4', // 🔵 Google Blue
    colorName: 'Google Blue',
    imageUrl: 'https://images.jdmagicbox.com/quickquotes/images_main/tata-ace-hydraulic-garbage-tipper-body-ms-construction-green-2236342196-0nl3bq2j.jpeg',
    bgGradient: 'from-blue-500/10 via-blue-500/5 to-white',
    cardBg: '#F8FAFF',
    cardBorder: 'border-blue-200 hover:border-blue-400',
    iconBg: 'bg-[#4285F4] text-white',
    iconColor: '#4285F4',
    titleColor: 'text-[#1A73E8]',
    textColor: 'text-blue-900/70',
    dotColor: '#4285F4',
    activeRing: 'ring-blue-400',
    shadowColor: 'rgba(66, 133, 244, 0.25)',
  },
  {
    id: 'v-bov',
    name: 'BOV',
    type: 'Battery operated · inner lanes',
    capacity: '600 kg',
    colorHex: '#EA4335', // 🔴 Google Red
    colorName: 'Google Red',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTScUmlqQZ3UI_btMH8RztQrSQKGZsUzCPknknaz5Alg&s=10',
    bgGradient: 'from-red-500/10 via-red-500/5 to-white',
    cardBg: '#FFF9F9',
    cardBorder: 'border-red-200 hover:border-red-400',
    iconBg: 'bg-[#EA4335] text-white',
    iconColor: '#EA4335',
    titleColor: 'text-[#D93025]',
    textColor: 'text-red-900/70',
    dotColor: '#EA4335',
    activeRing: 'ring-red-400',
    shadowColor: 'rgba(234, 67, 53, 0.25)',
  },
  {
    id: 'v-obl-pvt',
    name: 'OBL-PVT',
    type: 'Private contractor lorry',
    capacity: '2.5 T',
    colorHex: '#FBBC05', // 🟡 Google Yellow
    colorName: 'Google Yellow',
    imageUrl: 'https://image.shutterstock.com/image-vector/zero-waste-separation-concept-containers-260nw-2277880785.jpg',
    bgGradient: 'from-amber-500/15 via-amber-500/5 to-white',
    cardBg: '#FFFDF5',
    cardBorder: 'border-amber-200 hover:border-amber-400',
    iconBg: 'bg-[#FBBC05] text-slate-900',
    iconColor: '#B08800',
    titleColor: 'text-[#B08800]',
    textColor: 'text-amber-950/70',
    dotColor: '#FBBC05',
    activeRing: 'ring-amber-400',
    shadowColor: 'rgba(251, 188, 5, 0.3)',
  },
  {
    id: 'v-push-cart',
    name: 'PUSH CART',
    type: 'Manual · narrow streets',
    capacity: '120 kg',
    colorHex: '#34A853', // 🟢 Google Green
    colorName: 'Google Green',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKXfYeMiA902KDmyOxqrZrZx95qvNMWjpTtB8u-PVy2Dfgo-spg2zimk0&s=10',
    bgGradient: 'from-emerald-500/10 via-emerald-500/5 to-white',
    cardBg: '#F6FDF8',
    cardBorder: 'border-emerald-200 hover:border-emerald-400',
    iconBg: 'bg-[#34A853] text-white',
    iconColor: '#34A853',
    titleColor: 'text-[#1E8E3E]',
    textColor: 'text-emerald-900/70',
    dotColor: '#34A853',
    activeRing: 'ring-emerald-400',
    shadowColor: 'rgba(52, 168, 83, 0.25)',
  },
];

const DEFAULT_AREAS: AreaOption[] = [
  {
    id: 'a-ss-nagar',
    name: 'SS Nagar',
    nameTa: 'எஸ்.எஸ் நகர்',
    zone: 'East Zone',
    ward: 'Ward 54',
    streets: ['1st Main Road', 'Cross Street 1', 'Cross Street 2', 'Temple Road'],
    streetsCount: 4,
    qrPoints: 22,
  },
  {
    id: 'a-kpr-nagar',
    name: 'KPR Nagar',
    nameTa: 'கே.பி.ஆர் நகர்',
    zone: 'North Zone',
    ward: 'Ward 32',
    streets: ['Gandhi Street', 'Park Avenue', 'School Road'],
    streetsCount: 3,
    qrPoints: 17,
  },
  {
    id: 'a-lw-nagar',
    name: 'LW Nagar',
    nameTa: 'எல்.டபிள்யூ நகர்',
    zone: 'Central Zone',
    ward: 'Ward 45',
    streets: ['Lake View Street', 'North Street', 'South Lane'],
    streetsCount: 3,
    qrPoints: 20,
  },
  {
    id: 'a-gandhi-puram',
    name: 'Gandhi Puram',
    nameTa: 'காந்தி புரம்',
    zone: 'Central Zone',
    ward: 'Ward 12',
    streets: ['7th Street', 'Cross Cut Road', 'Bharathi Street'],
    streetsCount: 3,
    qrPoints: 16,
  },
  {
    id: 'a-anna-colony',
    name: 'Anna Colony',
    nameTa: 'அண்ணா காலனி',
    zone: 'South Zone',
    ward: 'Ward 68',
    streets: ['Kamaraj Road', 'Anna Salai', 'Periyar Street'],
    streetsCount: 3,
    qrPoints: 15,
  },
  {
    id: 'a-vivek-nagar',
    name: 'Vivek Nagar',
    nameTa: 'விவேக் நகர்',
    zone: 'West Zone',
    ward: 'Ward 29',
    streets: ['Swami Vivekananda Street', 'Bazaar Street', 'Library Lane'],
    streetsCount: 3,
    qrPoints: 18,
  },
  {
    id: 'a-ram-nagar',
    name: 'Ram Nagar',
    nameTa: 'ராம் நகர்',
    zone: 'Central Zone',
    ward: 'Ward 18',
    streets: ['Ramachandra Road', 'Sastri Road', 'Devan Road'],
    streetsCount: 4,
    qrPoints: 24,
  },
  {
    id: 'a-rs-puram',
    name: 'RS Puram',
    nameTa: 'ஆர்.எஸ் புரம்',
    zone: 'West Zone',
    ward: 'Ward 22',
    streets: ['DB Road', 'Cowley Brown Road', 'Sir Shanmugam Road'],
    streetsCount: 5,
    qrPoints: 28,
  },
  {
    id: 'a-peelamedu',
    name: 'Peelamedu',
    nameTa: 'பீளமேடு',
    zone: 'East Zone',
    ward: 'Ward 58',
    streets: ['Avinashi Road', 'College Road', 'Pioneer Mill Road'],
    streetsCount: 4,
    qrPoints: 26,
  },
  {
    id: 'a-singanallur',
    name: 'Singanallur',
    nameTa: 'சிங்கநல்லூர்',
    zone: 'East Zone',
    ward: 'Ward 62',
    streets: ['Trichy Road', 'Kamatchi Amman Kovil Street', 'Bus Stand Lane'],
    streetsCount: 4,
    qrPoints: 21,
  },
  {
    id: 'a-saibaba-colony',
    name: 'Saibaba Colony',
    nameTa: 'சாய்பாபா காலனி',
    zone: 'North Zone',
    ward: 'Ward 36',
    streets: ['NSR Road', 'Bharathi Park Road', 'Alagesan Road'],
    streetsCount: 5,
    qrPoints: 25,
  },
  {
    id: 'a-saravanampatti',
    name: 'Saravanampatti',
    nameTa: 'சரவணம்பட்டி',
    zone: 'North Zone',
    ward: 'Ward 40',
    streets: ['Sathy Road', 'IT Park Avenue', 'KCT Junction Road'],
    streetsCount: 4,
    qrPoints: 23,
  },
];

// Helper for solid Google color theme on hover (matching the solid dashboard status cards)
const getVehicleHoverStyles = (vehicle: VehicleOption) => {
  switch (vehicle.id) {
    case 'v-tata-ace':
      return {
        bg: 'linear-gradient(135deg, #1A73E8 0%, #1557BF 100%)',
        borderColor: '#1557BF',
        shadow: '0 16px 32px -4px rgba(26, 115, 232, 0.5), 0 6px 16px -2px rgba(26, 115, 232, 0.3)',
        text: '#FFFFFF',
        subtext: '#E8F0FE',
        badgeBg: 'rgba(255, 255, 255, 0.22)',
        badgeText: '#FFFFFF',
        badgeBorder: 'rgba(255, 255, 255, 0.4)',
        assignedBg: '#FFFFFF',
        assignedText: '#1557BF',
        dotBg: '#FFFFFF',
      };
    case 'v-bov':
      return {
        bg: 'linear-gradient(135deg, #EA4335 0%, #C5221F 100%)',
        borderColor: '#C5221F',
        shadow: '0 16px 32px -4px rgba(234, 67, 53, 0.5), 0 6px 16px -2px rgba(234, 67, 53, 0.3)',
        text: '#FFFFFF',
        subtext: '#FCE8E6',
        badgeBg: 'rgba(255, 255, 255, 0.22)',
        badgeText: '#FFFFFF',
        badgeBorder: 'rgba(255, 255, 255, 0.4)',
        assignedBg: '#FFFFFF',
        assignedText: '#C5221F',
        dotBg: '#FFFFFF',
      };
    case 'v-obl-pvt':
      return {
        bg: 'linear-gradient(135deg, #F29900 0%, #D97706 100%)',
        borderColor: '#D97706',
        shadow: '0 16px 32px -4px rgba(242, 153, 0, 0.5), 0 6px 16px -2px rgba(242, 153, 0, 0.3)',
        text: '#FFFFFF',
        subtext: '#FEF3C7',
        badgeBg: 'rgba(255, 255, 255, 0.25)',
        badgeText: '#FFFFFF',
        badgeBorder: 'rgba(255, 255, 255, 0.45)',
        assignedBg: '#FFFFFF',
        assignedText: '#92400E',
        dotBg: '#FFFFFF',
      };
    case 'v-push-cart':
    default:
      return {
        bg: 'linear-gradient(135deg, #1E8E3E 0%, #137333 100%)',
        borderColor: '#137333',
        shadow: '0 16px 32px -4px rgba(30, 142, 62, 0.5), 0 6px 16px -2px rgba(30, 142, 62, 0.3)',
        text: '#FFFFFF',
        subtext: '#E6F4EA',
        badgeBg: 'rgba(255, 255, 255, 0.22)',
        badgeText: '#FFFFFF',
        badgeBorder: 'rgba(255, 255, 255, 0.4)',
        assignedBg: '#FFFFFF',
        assignedText: '#137333',
        dotBg: '#FFFFFF',
      };
  }
};

export const VehicleAreaAssignmentView: React.FC<VehicleAreaAssignmentViewProps> = ({
  lang,
  userName = 'Thiru. Katta Ravi Teja, IAS',
  onSetLanguage,
  onToggleLang,
  onLogout,
  onComplete,
  onSkip,
}) => {
  const [vehicles] = useState<VehicleOption[]>(DEFAULT_VEHICLES);
  const [areas, setAreas] = useState<AreaOption[]>(() => getStoredAssignedAreas());
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
  const [hoveredVehicleId, setHoveredVehicleId] = useState<string | null>(null);
  const [activeVehicleFeedback, setActiveVehicleFeedback] = useState<string | null>(null);
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);
  const [liveConnected, setLiveConnected] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('21 August 2026 • Friday 10:26 am');

  // Search & Filter state for areas
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unassigned' | 'assigned'>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');

  // Filtered areas calculation
  const filteredAreas = useMemo(() => {
    return areas.filter((area) => {
      // Status filter
      if (statusFilter === 'unassigned' && area.assignedVehicleId) return false;
      if (statusFilter === 'assigned' && !area.assignedVehicleId) return false;

      // Zone filter
      if (selectedZone !== 'all' && area.zone !== selectedZone) return false;

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = area.name.toLowerCase().includes(q);
      const nameTaMatch = area.nameTa ? area.nameTa.toLowerCase().includes(q) : false;
      const zoneMatch = area.zone ? area.zone.toLowerCase().includes(q) : false;
      const wardMatch = area.ward ? area.ward.toLowerCase().includes(q) : false;
      const vehicleMatch = area.assignedVehicleName ? area.assignedVehicleName.toLowerCase().includes(q) : false;
      const streetMatch = area.streets ? area.streets.some((s) => s.toLowerCase().includes(q)) : false;

      return nameMatch || nameTaMatch || zoneMatch || wardMatch || vehicleMatch || streetMatch;
    });
  }, [areas, statusFilter, selectedZone, searchQuery]);

  // Bulk selection helpers for filtered results
  const handleSelectAllFiltered = () => {
    const filteredIds = filteredAreas.map((a) => a.id);
    setSelectedAreaIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const handleDeselectAllFiltered = () => {
    const filteredIds = new Set(filteredAreas.map((a) => a.id));
    setSelectedAreaIds((prev) => prev.filter((id) => !filteredIds.has(id)));
  };

  // Confirmation modal state
  const [confirmModalData, setConfirmModalData] = useState<{
    vehicle: VehicleOption;
    areaNames: string[];
    areaIds: string[];
  } | null>(null);

  // Success modal state
  const [successModalData, setSuccessModalData] = useState<{
    vehicleName: string;
    areaNames: string[];
    count: number;
  } | null>(null);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const day = now.getDate();
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const month = monthNames[now.getMonth()];
      const year = now.getFullYear();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = dayNames[now.getDay()];

      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;

      setCurrentTime(`${day} ${month} ${year} • ${dayOfWeek} ${hours}:${minutes} ${ampm}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Toggle selection for an area
  const handleToggleSelectArea = (areaId: string) => {
    setSelectedAreaIds((prev) =>
      prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId]
    );
  };

  // Trigger confirmation dialog when vehicle is clicked
  const handleVehicleClick = (vehicle: VehicleOption) => {
    if (selectedAreaIds.length === 0) {
      setActiveVehicleFeedback(vehicle.name);
      setTimeout(() => setActiveVehicleFeedback(null), 4000);
      return;
    }

    const selectedAreasList = areas.filter((a) => selectedAreaIds.includes(a.id));
    const areaNames = selectedAreasList.map((a) => a.name);

    setConfirmModalData({
      vehicle,
      areaNames,
      areaIds: [...selectedAreaIds],
    });
  };

  // Confirm and execute the assignment
  const handleConfirmAssignment = () => {
    if (!confirmModalData) return;

    const { vehicle, areaIds, areaNames } = confirmModalData;

    setAreas((prev) => {
      const updated = prev.map((area) => {
        if (areaIds.includes(area.id)) {
          return {
            ...area,
            assignedVehicleId: vehicle.id,
            assignedVehicleName: vehicle.name,
            assignedColorHex: vehicle.colorHex,
          };
        }
        return area;
      });
      saveStoredAssignedAreas(updated);
      return updated;
    });

    // Close confirmation dialog
    setConfirmModalData(null);
    setSelectedAreaIds([]);

    // Open success modal
    setSuccessModalData({
      vehicleName: vehicle.name,
      areaNames,
      count: areaIds.length,
    });
  };

  // Cancel assignment confirmation
  const handleCancelAssignment = () => {
    setConfirmModalData(null);
  };

  // Close success modal and stay on the assignment page so user can assign more or review
  const handleCloseSuccessModal = () => {
    setSuccessModalData(null);
  };

  // Unassign specific area
  const handleUnassignArea = (areaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAreas((prev) => {
      const updated = prev.map((a) =>
        a.id === areaId
          ? { ...a, assignedVehicleId: undefined, assignedVehicleName: undefined, assignedColorHex: undefined }
          : a
      );
      saveStoredAssignedAreas(updated);
      return updated;
    });
    setSelectedAreaIds((prev) => prev.filter((id) => id !== areaId));
  };

  // Clear selected checkmarks AND unassign selected/assigned areas
  const handleClearSelectedAndAssigned = () => {
    const idsToClear = new Set([
      ...selectedAreaIds,
      ...filteredAreas.filter((a) => a.assignedVehicleId).map((a) => a.id),
      ...areas.filter((a) => a.assignedVehicleId).map((a) => a.id),
    ]);

    setAreas((prev) => {
      const updated = prev.map((a) =>
        idsToClear.has(a.id)
          ? { ...a, assignedVehicleId: undefined, assignedVehicleName: undefined, assignedColorHex: undefined }
          : a
      );
      saveStoredAssignedAreas(updated);
      return updated;
    });

    setSelectedAreaIds([]);
  };

  // Submit completed assignments
  const handleComplete = (overrideVehicleId?: string) => {
    saveStoredAssignedAreas(areas);
    const assignments = areas
      .filter((a) => a.assignedVehicleId)
      .map((a) => ({
        areaId: a.id,
        vehicleId: a.assignedVehicleId!,
      }));

    if (assignments.length === 0) {
      return;
    }

    const chosenVehicleId = overrideVehicleId || assignments[0]?.vehicleId || 'v-push-cart';
    onComplete(assignments, chosenVehicleId);
  };

  const isTamil = lang === 'ta';
  const assignedCount = areas.filter((a) => a.assignedVehicleId).length;

  return (
    <div className="min-h-screen w-full bg-[#EEF2F6] flex flex-col justify-between font-sans text-slate-800 select-none">
      
      {/* Top Main Green Header Bar (Matching Commissioner's Review Console Screenshot) */}
      <header className="w-full select-none text-white shadow-md mb-2">
        {/* Main Green Bar #1E7A38 */}
        <div className="bg-[#1E7A38] px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2 flex items-center justify-between gap-1.5 sm:gap-4 border-b border-[#166534] min-h-[52px] sm:min-h-[64px]">
          {/* Left: CM Portrait + CCMC Emblem + Full Municipal Title */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
            {/* Unified Government Brand Insignia Duo */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* 1. Coimbatore City Municipal Corporation Emblem */}
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

            {/* Municipal Title - Responsive Multi-line Format (Matching Image 1) */}
            <div className="min-w-0 flex flex-col justify-center">
              {/* Line 1: Coimbatore City */}
              <div className="text-[12px] sm:text-sm lg:text-base font-black tracking-tight text-white leading-tight whitespace-nowrap drop-shadow-xs">
                Coimbatore City
              </div>
              {/* Line 2: Municipal Corporation */}
              <div className="text-[11px] sm:text-xs lg:text-[14px] font-black tracking-tight text-amber-300 leading-tight whitespace-nowrap drop-shadow-xs">
                Municipal Corporation
              </div>
              {/* Line 3: User */}
              <div className="text-[9px] sm:text-[10.5px] lg:text-xs font-black tracking-wider text-cyan-300 uppercase leading-tight mt-0.5 whitespace-nowrap drop-shadow-xs">
                USER
              </div>
            </div>
          </div>

          {/* Right: ICCC Live Pill (Desktop only) + Language Switcher + Logout */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
            {/* Red Badge Notification Bell - Desktop View Only */}
            <div className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                className="relative p-2.5 rounded-full bg-[#166534] hover:bg-[#113B22] text-emerald-100 border border-emerald-400/30 transition-all shadow-xs cursor-pointer"
                title="Operational Alerts"
              >
                <Bell className="w-5 h-5 text-emerald-100" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 text-[10px] font-black items-center justify-center text-white bg-rose-600">
                    6
                  </span>
                </span>
              </button>

              {/* Alerts Dropdown Modal */}
              {isAlertsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 bg-[#1E7A38] text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-200" />
                      <span className="text-xs font-bold uppercase tracking-wider">Live Municipal Alerts</span>
                    </div>
                    <span className="bg-[#166534] text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      6 active
                    </span>
                  </div>
                  <div className="p-3 text-xs text-slate-600 space-y-2 max-h-56 overflow-y-auto">
                    <div className="p-2 bg-rose-50 border-l-3 border-rose-500 rounded">
                      <div className="font-bold text-rose-800">South Zone - Ward 12 Pending</div>
                      <div className="text-[11px] text-rose-600">SS Nagar route delay by 18 mins</div>
                    </div>
                    <div className="p-2 bg-amber-50 border-l-3 border-amber-500 rounded">
                      <div className="font-bold text-amber-800">Compactor #248 Route Synced</div>
                      <div className="text-[11px] text-amber-700">GPS signal locked & transmitting</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ICCC Live Status Pill - Desktop Only */}
            <div className="hidden lg:flex items-center">
              <ICCCLiveBadge lang={lang} />
            </div>

            {/* Language Switcher Segment [ தமிழ் | English ] - Compact */}
            <div className="bg-[#113B22] border border-emerald-500/40 rounded-full p-0.5 flex items-center shadow-xs flex-shrink-0 scale-90 sm:scale-100 origin-right">
              <button
                type="button"
                onClick={() => {
                  if (onSetLanguage) onSetLanguage('ta');
                  else if (!isTamil && onToggleLang) onToggleLang();
                }}
                className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black transition-all cursor-pointer flex items-center gap-0.5 sm:gap-1 ${
                  isTamil
                    ? 'bg-[#FF9E00] text-slate-950 shadow-xs'
                    : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
                }`}
                title="தமிழ் மொழியைத் தேர்வு செய்"
              >
                <Globe className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isTamil ? 'text-slate-950' : 'text-emerald-300'}`} />
                <span>தமிழ்</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onSetLanguage) onSetLanguage('en');
                  else if (isTamil && onToggleLang) onToggleLang();
                }}
                className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black transition-all cursor-pointer ${
                  !isTamil
                    ? 'bg-[#FF9E00] text-slate-950 shadow-xs'
                    : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
                }`}
                title="Select English Language"
              >
                <span>English</span>
              </button>
            </div>

            {/* Red Logout Button */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1 bg-[#E11D48] hover:bg-[#BE123C] active:bg-[#9F1239] text-white font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs transition-all shadow-md border border-rose-400/50 cursor-pointer active:scale-95 flex-shrink-0"
                title="Logout Console / வெளியேறு"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="font-bold hidden sm:inline">{isTamil ? 'வெளியேறு' : 'Logout'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Dark Secondary Ticker Stream Status Bar - Hidden on mobile & tablet (< lg), visible only on large desktop */}
        <div className="hidden lg:flex bg-[#113B22] px-2.5 py-1.5 sm:px-6 sm:py-1.5 items-center justify-between text-[9px] sm:text-xs text-emerald-100/90 font-medium border-t border-[#166534] overflow-hidden">
            <span className="hidden md:inline text-emerald-100 truncate">{currentTime}</span>

            <div className="flex items-center gap-2 flex-shrink-0">
              <ICCCLiveBadge lang={lang} />
            </div>
          </div>
      </header>

      {/* Main Content Area */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-24 flex-1">
        
        {/* Header Prompt */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-sm sm:text-base font-semibold text-slate-700">
            {isTamil ? 'தேர்ந்தெடுக்கப்பட்ட பகுதிகளை ஒதுக்க ஒரு வாகனத்தைத் தொடவும்' : 'Tap a vehicle to assign the selected areas'}
          </h1>
          <span className="text-xs sm:text-sm font-medium text-slate-500">
            {selectedAreaIds.length} {isTamil ? 'தேர்ந்தெடுக்கப்பட்டது' : 'selected'}
          </span>
        </div>

        {/* Feedback Banner if vehicle tapped without selection */}
        <AnimatePresence>
          {activeVehicleFeedback && selectedAreaIds.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center justify-between"
            >
              <span>
                {isTamil
                  ? `முதலில் கீழேயுள்ள பகுதிகளைத் தேர்ந்தெடுத்து, பின் "${activeVehicleFeedback}" வாகனத்தைத் தொடவும்.`
                  : `Select one or more areas below first, then tap "${activeVehicleFeedback}" to assign.`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vehicles Horizontal Grid (4 Cards Styled with Rich Google Colors - Micro & Ultra-Compact) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 mb-4">
          {vehicles.map((vehicle) => {
            const assignedAreasToThis = areas.filter((a) => a.assignedVehicleId === vehicle.id);
            const isAssigned = assignedAreasToThis.length > 0;
            const isReadyToAssign = selectedAreaIds.length > 0;
            const isHovered = hoveredVehicleId === vehicle.id;
            const hStyles = getVehicleHoverStyles(vehicle);

            return (
              <button
                key={vehicle.id}
                type="button"
                onMouseEnter={() => setHoveredVehicleId(vehicle.id)}
                onMouseLeave={() => setHoveredVehicleId(null)}
                onClick={() => handleVehicleClick(vehicle)}
                style={{
                  background: isHovered ? hStyles.bg : vehicle.cardBg,
                  borderColor: isHovered ? hStyles.borderColor : isReadyToAssign ? vehicle.colorHex : `${vehicle.colorHex}45`,
                  boxShadow: isHovered
                    ? hStyles.shadow
                    : isReadyToAssign
                    ? `0 3px 10px ${vehicle.shadowColor}`
                    : `0 1px 4px ${vehicle.shadowColor}`,
                  transform: isHovered ? 'translateY(-1.5px)' : 'none',
                }}
                className={`w-full text-left rounded-xl p-2 sm:p-2.5 border transition-all duration-200 relative group cursor-pointer overflow-hidden ${
                  isReadyToAssign ? 'active:scale-[0.98]' : ''
                }`}
              >
                {/* Truck Icon or Vehicle Photo in White Squarish Badge */}
                <div className="mb-1.5 flex items-center justify-between">
                  <div
                    className="w-9 h-8 sm:w-10 sm:h-9 rounded-lg flex items-center justify-center p-0.5 transition-all duration-200 overflow-hidden"
                    style={{
                      backgroundColor: '#FFFFFF',
                      boxShadow: isHovered
                        ? '0 2px 8px -1px rgba(0, 0, 0, 0.16)'
                        : '0 1px 2px rgba(0, 0, 0, 0.05)',
                      border: isHovered ? '1.5px solid rgba(255, 255, 255, 0.9)' : '1px solid rgba(226, 232, 240, 0.8)',
                    }}
                  >
                    {vehicle.imageUrl ? (
                      <img
                        src={vehicle.imageUrl}
                        alt={vehicle.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    ) : (
                      <div
                        className="w-full h-full rounded-md flex items-center justify-center"
                        style={{
                          backgroundColor: vehicle.colorHex,
                          color: vehicle.colorHex === '#FBBC05' ? '#1E293B' : '#FFFFFF',
                        }}
                      >
                        <Truck className="w-4 h-4 stroke-[2]" />
                      </div>
                    )}
                  </div>

                  {/* Indicator Pill / Dot */}
                  <div className="flex flex-col items-end gap-0.5">
                    <span
                      className="rounded-full flex-shrink-0 transition-all duration-200"
                      style={{
                        backgroundColor: isHovered ? '#FFFFFF' : vehicle.colorHex,
                        width: isHovered ? '8px' : '7px',
                        height: isHovered ? '8px' : '7px',
                        boxShadow: isHovered ? '0 0 6px #FFFFFF' : 'none',
                      }}
                    />
                    {isReadyToAssign && (
                      <span
                        className="text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-2xs transition-all animate-pulse"
                        style={{
                          backgroundColor: isHovered ? '#FFFFFF' : vehicle.colorHex,
                          color: isHovered ? (vehicle.id === 'v-obl-pvt' ? '#B45309' : vehicle.colorHex) : vehicle.colorHex === '#FBBC05' ? '#1E293B' : '#FFFFFF',
                        }}
                      >
                        {isTamil ? 'ஒதுக்கு' : 'Assign'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Vehicle Name */}
                <div className="text-[11px] sm:text-xs font-black tracking-tight flex items-center justify-between">
                  <span
                    className="transition-colors duration-200"
                    style={{
                      color: isHovered ? '#FFFFFF' : (vehicle.colorHex === '#FBBC05' ? '#B08800' : vehicle.colorHex),
                      textShadow: isHovered ? '0 1px 2px rgba(0, 0, 0, 0.2)' : 'none',
                    }}
                  >
                    {vehicle.name}
                  </span>
                </div>

                {/* Subtitle / Description */}
                <div
                  className="text-[9px] sm:text-[10px] font-medium mt-0.5 mb-1 line-clamp-1 transition-colors duration-200"
                  style={{
                    color: isHovered ? hStyles.subtext : `${vehicle.colorHex}CC`,
                  }}
                >
                  {vehicle.type}
                </div>

                {/* Status Mode Badge: Covered vs Collected */}
                <div className="mb-1.5">
                  <span
                    className="text-[8px] sm:text-[8.5px] font-black px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 transition-all duration-200"
                    style={{
                      backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.25)' : `${vehicle.colorHex}12`,
                      color: isHovered ? '#FFFFFF' : (vehicle.colorHex === '#FBBC05' ? '#8a6500' : vehicle.colorHex),
                      border: isHovered ? '1px solid rgba(255, 255, 255, 0.4)' : `1px solid ${vehicle.colorHex}30`,
                    }}
                  >
                    {vehicle.id === 'v-push-cart'
                      ? (isTamil ? '● சேகரித்தது / சேகரிக்காதவை' : '● Collected / Not Collected')
                      : (isTamil ? '● மூடப்பட்டது / மூடப்படாதவை' : '● Covered / Not Covered')}
                  </span>
                </div>

                {/* Capacity & Assigned Count Row */}
                <div className="flex items-center justify-between pt-0.5">
                  <span
                    className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded transition-all duration-200"
                    style={{
                      backgroundColor: isHovered ? hStyles.badgeBg : `${vehicle.colorHex}15`,
                      color: isHovered ? hStyles.badgeText : (vehicle.colorHex === '#FBBC05' ? '#8a6500' : vehicle.colorHex),
                      border: isHovered ? `1px solid ${hStyles.badgeBorder}` : '1px solid transparent',
                    }}
                  >
                    {vehicle.capacity}
                  </span>

                  {isAssigned && (
                    <span
                      className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border shadow-2xs transition-all duration-200"
                      style={{
                        backgroundColor: isHovered ? hStyles.assignedBg : vehicle.colorHex,
                        color: isHovered ? hStyles.assignedText : (vehicle.colorHex === '#FBBC05' ? '#1E293B' : '#FFFFFF'),
                        borderColor: isHovered ? '#FFFFFF' : vehicle.colorHex,
                      }}
                    >
                      {assignedAreasToThis.length} {isTamil ? 'பகுதிகள்' : 'areas'}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Search, Filter & Bulk Selection Section */}
        <div className="mb-4 space-y-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          
          {/* Main Search Input & Clear Control */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isTamil
                    ? 'பகுதி, தெரு, வார்டு அல்லது மண்டலத்தைத் தேடுக... (எ.கா: SS Nagar, Gandhi, Ward 54)'
                    : 'Search areas, streets, wards or zones... (e.g. SS Nagar, DB Road, Ward 54)'
                }
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-200/80 transition-colors cursor-pointer"
                  title={isTamil ? 'தேடலை அழிக்கவும்' : 'Clear search'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Zone Filter Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">{isTamil ? 'அனைத்து மண்டலங்கள் (All Zones)' : 'All Zones'}</option>
                <option value="East Zone">{isTamil ? 'கிழக்கு மண்டலம் (East Zone)' : 'East Zone'}</option>
                <option value="North Zone">{isTamil ? 'வடக்கு மண்டலம் (North Zone)' : 'North Zone'}</option>
                <option value="Central Zone">{isTamil ? 'மத்திய மண்டலம் (Central Zone)' : 'Central Zone'}</option>
                <option value="West Zone">{isTamil ? 'மேற்கு மண்டலம் (West Zone)' : 'West Zone'}</option>
                <option value="South Zone">{isTamil ? 'தெற்கு மண்டலம் (South Zone)' : 'South Zone'}</option>
              </select>
            </div>
          </div>

          {/* Filter Pills & Quick Selection Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
            
            {/* Status Filter Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-[#1E7A38] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isTamil ? 'அனைத்தும்' : 'All'} ({areas.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('unassigned')}
                className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'unassigned'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isTamil ? 'ஒதுக்கப்படாதவை' : 'Unassigned'} ({areas.filter((a) => !a.assignedVehicleId).length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('assigned')}
                className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'assigned'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isTamil ? 'ஒதுக்கப்பட்டவை' : 'Assigned'} ({areas.filter((a) => a.assignedVehicleId).length})
              </button>
            </div>

            {/* Selection Actions & Match Counter */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 text-[11px] font-medium hidden sm:inline">
                {isTamil ? 'காட்டப்படுகிறது:' : 'Showing:'}{' '}
                <strong className="text-slate-800 font-bold">{filteredAreas.length}</strong> / {areas.length}
              </span>

              {filteredAreas.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="px-2 sm:px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[11px] border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                  title={isTamil ? 'காட்டப்படும் அனைத்து பகுதிகளையும் தேர்ந்தெடுக்கவும்' : 'Select all filtered areas'}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>{isTamil ? 'அனைத்தும் தேர்ந்தெடு' : 'Select All Filtered'}</span>
                </button>
              )}

              {(selectedAreaIds.length > 0 || assignedCount > 0) && (
                <button
                  type="button"
                  onClick={handleClearSelectedAndAssigned}
                  className="px-2 sm:px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-lg font-bold text-[11px] border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                  title={isTamil ? 'தேர்வு மற்றும் ஒதுக்கீட்டை நீக்கு' : 'Clear selection & vehicle assignments'}
                >
                  <X className="w-3 h-3 stroke-[2.5]" />
                  <span>{isTamil ? 'தேர்வை நீக்கு' : 'Clear Selected'} ({selectedAreaIds.length || assignedCount})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Instruction Sub-bar */}
        <div className="flex items-center gap-2 text-slate-600 text-xs sm:text-sm mb-4 bg-emerald-50/70 border border-emerald-200/80 px-3.5 py-2 rounded-xl">
          <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold text-slate-700">
            {isTamil
              ? 'தெரு அல்லது பகுதியைத் தொட்டு தேர்வு செய்யவும், பின் மேலே உள்ள வாகனத்தைத் தொடவும்.'
              : 'Tap a street / area to select, then click a vehicle above to assign.'}
          </span>
        </div>

        {/* Empty State when no area matches search or filters */}
        {filteredAreas.length === 0 && (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center flex flex-col items-center justify-center my-6">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-1">
              {isTamil ? 'பொருத்தமான பகுதிகள் எதுவும் கிடைக்கவில்லை' : 'No matching areas found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mb-4">
              {isTamil
                ? `"${searchQuery}" என்ற தேடலுக்கு அல்லது தேர்ந்தெடுக்கப்பட்ட வடிகட்டிகளுக்கு ஏற்ப எந்த பகுதியும் இல்லை.`
                : `We couldn't find any area matching "${searchQuery}" with the current filters.`}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setSelectedZone('all');
              }}
              className="px-4 py-2 bg-[#1E7A38] text-white rounded-xl font-bold text-xs shadow-xs hover:bg-[#166534] transition-all cursor-pointer"
            >
              {isTamil ? 'தேடலை மீட்டமை (Reset Filters)' : 'Reset Filters & Search'}
            </button>
          </div>
        )}

        {/* Areas Grid (2-Column Compact Rectangle Cards in Mobile View) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
          {filteredAreas.map((area) => {
            const isSelected = selectedAreaIds.includes(area.id);
            const isAssigned = !!area.assignedVehicleName;
            const assignedColor = area.assignedColorHex || '#15803D';

            return (
              <div
                key={area.id}
                onClick={() => handleToggleSelectArea(area.id)}
                className={`bg-white rounded-2xl p-3 sm:p-4 border-2 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer relative flex flex-col justify-between min-h-[110px] sm:min-h-[118px] active:scale-[0.98] ${
                  isSelected
                    ? 'border-emerald-600 ring-2 ring-emerald-400/40 bg-emerald-50/40 shadow-md'
                    : isAssigned
                    ? 'border-slate-300/90 hover:border-emerald-400'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Top Row: Title & Radio/Circle */}
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-xs sm:text-base font-black text-slate-900 truncate leading-tight">
                        {isTamil && area.nameTa ? `${area.nameTa} (${area.name})` : area.name}
                      </h3>
                    </div>
                    
                    {/* Ward & Zone tags */}
                    {(area.ward || area.zone) && (
                      <p className="text-[9.5px] sm:text-[11px] text-emerald-800 font-bold mt-0.5 flex items-center gap-1">
                        {area.ward && <span>{area.ward}</span>}
                        {area.ward && area.zone && <span>•</span>}
                        {area.zone && <span className="text-slate-500 font-semibold">{area.zone}</span>}
                      </p>
                    )}

                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1 font-semibold flex items-center gap-1 sm:gap-1.5 flex-wrap leading-tight">
                      <span>{area.streetsCount} {isTamil ? 'தெருக்கள்' : 'streets'}</span>
                      <span className="text-slate-300 font-bold">•</span>
                      <span>{area.qrPoints} {isTamil ? 'QR புள்ளிகள்' : 'QR points'}</span>
                    </p>

                    {/* Highlighted streets if searched */}
                    {searchQuery.trim() && area.streets && area.streets.some(s => s.toLowerCase().includes(searchQuery.toLowerCase().trim())) && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {area.streets
                          .filter(s => s.toLowerCase().includes(searchQuery.toLowerCase().trim()))
                          .slice(0, 2)
                          .map((st, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-semibold">
                              🛣️ {st}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Radio / Selection Circle and Unassign Action */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isAssigned && (
                      <button
                        type="button"
                        onClick={(e) => handleUnassignArea(area.id, e)}
                        title={isTamil ? 'ஒதுக்கீட்டை நீக்கு' : 'Remove assignment'}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded-lg hover:bg-rose-50 transition-colors flex-shrink-0 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}

                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-2 border-emerald-600 shadow-xs ring-2 ring-emerald-300'
                          : 'border-2 border-slate-300 bg-white hover:border-slate-400'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                {/* Bottom Pill: Not assigned OR Assigned to this vehicle */}
                <div className="mt-2 flex items-center justify-between gap-1">
                  {isAssigned ? (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl text-[9.5px] sm:text-[11px] font-black border truncate shadow-2xs max-w-full"
                      style={{
                        backgroundColor: `${assignedColor}15`,
                        color: assignedColor === '#FBBC05' ? '#7c5e00' : assignedColor,
                        borderColor: `${assignedColor}50`,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: assignedColor }} />
                      <span className="truncate">
                        {isTamil 
                          ? `ஒதுக்கப்பட்டது: ${area.assignedVehicleName}` 
                          : `Assigned to ${area.assignedVehicleName}`}
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl text-[9.5px] sm:text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200/80 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                      <span>{isTamil ? 'ஒதுக்கப்படவில்லை' : 'Not assigned'}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200/90 py-3 px-4 sm:px-8 z-30 shadow-lg">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
          
          {/* Left Action: Skip this page */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={onSkip}
              className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              {isTamil ? 'இப்பக்கத்தைத் தவிர்க்கவும்' : 'Skip this page'}
            </button>

            {assignedCount > 0 && (
              <span className="text-[11px] sm:text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>
                  {isTamil
                    ? `${assignedCount} பகுதிகள் ஒதுக்கப்பட்டன`
                    : `${assignedCount} areas assigned`}
                </span>
                <button
                  type="button"
                  onClick={handleClearSelectedAndAssigned}
                  className="ml-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-0.5 rounded-full transition-colors cursor-pointer"
                  title={isTamil ? 'ஒதுக்கீட்டை நீக்கு' : 'Clear all assignments'}
                >
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              </span>
            )}
          </div>

          {/* Right Action: Helper status + Complete assignment button */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {assignedCount === 0 && (
              <span className="text-[11px] text-amber-800 font-bold bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl flex items-center gap-1.5 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span>
                  {isTamil
                    ? 'முடிக்க ஒரு பகுதியை வாகனத்திற்கு ஒதுக்கவும்'
                    : 'Assign an area to a vehicle to complete'}
                </span>
              </span>
            )}

            <button
              type="button"
              disabled={assignedCount === 0}
              onClick={() => {
                if (assignedCount > 0) {
                  handleComplete();
                }
              }}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm flex-1 sm:flex-initial ${
                assignedCount > 0
                  ? 'bg-[#1E7A38] hover:bg-[#166534] active:bg-[#113B22] text-white cursor-pointer active:scale-95 shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-75'
              }`}
              title={
                assignedCount === 0
                  ? isTamil
                    ? 'வாகனம் மற்றும் பகுதியை ஒதுக்கிய பிறகு இந்த பட்டன் செயல்படும்'
                    : 'Assign vehicle and area first to enable this button'
                  : isTamil
                  ? `${assignedCount} பகுதிகள் ஒதுக்கீடு முடிந்தது - தொடர்க`
                  : `${assignedCount} areas assigned - Click to complete`
              }
            >
              {assignedCount > 0 ? (
                <Check className="w-4 h-4 stroke-[3]" />
              ) : (
                <ArrowRight className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {isTamil
                  ? assignedCount > 0
                    ? `ஒதுக்கீட்டை முடிக்கவும் (${assignedCount})`
                    : 'ஒதுக்கீட்டை முடிக்கவும்'
                  : assignedCount > 0
                  ? `Complete assignment (${assignedCount})`
                  : 'Complete assignment'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Confirmation Modal (Matching user screenshot) */}
      {confirmModalData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-slate-100 transition-all transform scale-100"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-4">
              {/* Green Alert Icon Badge */}
              <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertCircle className="w-6 h-6 stroke-[2.2]" />
              </div>

              {/* Title & Description */}
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                  {isTamil
                    ? `${confirmModalData.vehicle.name}-க்கு ஒதுக்கவா?`
                    : `Assign to ${confirmModalData.vehicle.name}?`}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  {isTamil ? (
                    <>
                      இன்றைய சேகரிப்பு சுற்றுக்கு{' '}
                      <span className="font-bold text-slate-800">
                        {confirmModalData.areaNames.join(', ')}
                      </span>{' '}
                      பகுதிகள்{' '}
                      <span className="font-extrabold text-slate-900">
                        {confirmModalData.vehicle.name}
                      </span>{' '}
                      மூலம் ஒதுக்கப்படும்.
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-slate-700">
                        {confirmModalData.areaNames.join(', ')}
                      </span>{' '}
                      will be covered by{' '}
                      <span className="font-extrabold text-slate-900">
                        {confirmModalData.vehicle.name}
                      </span>{' '}
                      for today's collection round.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Action Buttons: Cancel and OK */}
            <div className="flex items-center justify-end gap-3 mt-7 pt-2">
              <button
                type="button"
                onClick={handleCancelAssignment}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                {isTamil ? 'ரத்துசெய்' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmAssignment}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer hover:shadow-lg active:scale-98"
              >
                {isTamil ? 'சரி' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Success Modal with Professional Vehicle Moving Animation */}
      {successModalData && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={handleCloseSuccessModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 sm:p-7 border border-slate-100 flex flex-col items-center text-center overflow-hidden relative"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated Vehicle Driving Track Animation */}
            <div className="w-full h-16 bg-gradient-to-r from-emerald-50 via-emerald-100/70 to-emerald-50 rounded-2xl relative flex items-center px-4 overflow-hidden mb-4 border border-emerald-200/80">
              {/* Road line dashes */}
              <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 border-b-2 border-dashed border-emerald-400/50" />

              {/* Moving Vehicle */}
              <motion.div
                initial={{ x: -60, opacity: 0 }}
                animate={{ x: [ -60, 180, 200 ], opacity: [ 0, 1, 1 ] }}
                transition={{ duration: 1.4, ease: 'easeInOut' }}
                className="relative z-10 flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl shadow-md border border-emerald-300 text-emerald-800 font-extrabold text-xs"
              >
                <Truck className="w-4 h-4 text-emerald-700 animate-bounce" />
                <span>{successModalData.vehicleName}</span>
              </motion.div>

              {/* Target Flag / Destination Point */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            </div>

            {/* Success Heading */}
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {isTamil ? 'வாகனம் வெற்றிகரமாக ஒதுக்கப்பட்டது!' : 'Vehicle Successfully Assigned!'}
            </h3>

            {/* Success Description */}
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              {isTamil ? (
                <>
                  {successModalData.count} பகுதி —{' '}
                  <span className="font-semibold text-slate-700">
                    {successModalData.areaNames.join(', ')}
                  </span>{' '}
                  — இப்போது{' '}
                  <span className="font-extrabold text-slate-900">
                    {successModalData.vehicleName}
                  </span>{' '}
                  மூலம் ஒதுக்கப்பட்டுள்ளது.
                </>
              ) : (
                <>
                  {successModalData.count} {successModalData.count > 1 ? 'areas' : 'area'} —{' '}
                  <span className="font-semibold text-slate-700">
                    {successModalData.areaNames.join(', ')}
                  </span>{' '}
                  — now assigned to{' '}
                  <span className="font-extrabold text-slate-900">
                    {successModalData.vehicleName}
                  </span>{' '}
                  for live field collection.
                </>
              )}
            </p>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleCloseSuccessModal}
              className="mt-6 w-full py-2.5 bg-[#1E7A38] hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer hover:shadow-lg active:scale-98 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isTamil ? 'சரி' : 'Done'}</span>
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

