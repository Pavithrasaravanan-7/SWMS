import React, { useState, useEffect } from 'react';
import { CoverageStatus, NotCoveredReason, SWMSHouseholdRecord, StreetScanPoint } from '../types';
import { playChimeTone } from '../utils/audioHelper';
import { HouseholdLocationMapModal } from './HouseholdLocationMapModal';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Send, 
  User, 
  MapPin, 
  Building2, 
  Truck, 
  ShieldCheck, 
  FileText,
  MoreVertical,
  Sparkles,
  X,
  SlidersHorizontal,
  Navigation,
  Crosshair,
  ExternalLink,
  RefreshCw,
  Compass,
  Edit3,
  Pencil,
  Save,
  Check,
  Globe,
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { cmPhoto, cmFallbackPhoto, ccmcLogo, ccmcFallbackLogo } from '../constants/branding';
import { ICCCLiveBadge } from './ICCCLiveBadge';

interface SWMSHouseholdFormViewProps {
  scannedHouseId?: string;
  lang?: 'en' | 'ta';
  onSetLanguage?: (lang: 'en' | 'ta') => void;
  onToggleLang?: () => void;
  assignedVehicleId?: string;
  onBackToScanner: () => void;
  onSubmitSuccess: (record: SWMSHouseholdRecord, status: CoverageStatus) => void;
}

// Clean any full URL or prefix into a pure alphanumeric House ID
const cleanHouseId = (rawId?: string): string => {
  if (!rawId) return 'HID100101';
  let cleaned = rawId.trim();
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    cleaned = parts[parts.length - 1].trim();
  }
  if (cleaned.includes('?')) {
    cleaned = cleaned.split('?')[0].trim();
  }
  return cleaned || 'HID100101';
};

export const SWMSHouseholdFormView: React.FC<SWMSHouseholdFormViewProps> = ({
  scannedHouseId = 'HID100101',
  lang = 'ta',
  onSetLanguage,
  onToggleLang,
  assignedVehicleId = 'v-push-cart',
  onBackToScanner,
  onSubmitSuccess
}) => {
  const isPushCart = !assignedVehicleId || assignedVehicleId === 'v-push-cart' || assignedVehicleId.includes('push');
  
  const [formData, setFormData] = useState<{
    houseId: string;
    zone: string;
    ward: string;
    siName: string;
    siContact: string;
    ssName: string;
    ssContact: string;
    cssName: string;
    driverWorkerName: string;
    driverWorkerContact: string;
    householderName: string;
    householderContact: string;
    streetName: string;
    doorNo: string;
    coverageStatus: CoverageStatus;
    notCoveredReason?: NotCoveredReason;
    remarks: string;
  }>({
    houseId: cleanHouseId(scannedHouseId),
    zone: 'East Zone',
    ward: 'Ward 12',
    siName: 'K. Rajan',
    siContact: '9876543210',
    ssName: 'M. Selvam',
    ssContact: '9876543211',
    cssName: 'S. Kumar',
    driverWorkerName: 'P. Murugan',
    driverWorkerContact: '9876543212',
    householderName: 'Ramanathan',
    householderContact: '9840123456',
    streetName: 'Kamaraj Salai',
    doorNo: '45',
    coverageStatus: 'Covered' as CoverageStatus,
    notCoveredReason: 'House Locked' as NotCoveredReason,
    remarks: ''
  });

  // 5 Scan Checkpoints State for Vehicle Mode
  const [streetScans, setStreetScans] = useState<StreetScanPoint[]>(() => {
    const stName = formData.streetName || 'Kamaraj Salai';
    const saved = localStorage.getItem('ccmc_street_5scans');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed[stName] && Array.isArray(parsed[stName])) return parsed[stName];
      } catch (e) {
        // ignore
      }
    }
    return [
      { id: 1, label: 'Scan 1', taLabel: 'ஸ்கேன் 1', locationName: 'North Junction Entry', taLocationName: 'வடமுனை நுழைவு QR', isScanned: false },
      { id: 2, label: 'Scan 2', taLabel: 'ஸ்கேன் 2', locationName: 'Cross Street 1 Point', taLocationName: 'குறுக்குத்தெரு 1 QR', isScanned: false },
      { id: 3, label: 'Scan 3', taLabel: 'ஸ்கேன் 3', locationName: 'Center Main Bin Area', taLocationName: 'மைய குப்பைத்தொட்டி QR', isScanned: false },
      { id: 4, label: 'Scan 4', taLabel: 'ஸ்கேன் 4', locationName: 'Cross Street 2 Point', taLocationName: 'குறுக்குத்தெரு 2 QR', isScanned: false },
      { id: 5, label: 'Scan 5', taLabel: 'ஸ்கேன் 5', locationName: 'South Exit Point', taLocationName: 'தென்முனை வெளியேறும் QR', isScanned: false },
    ];
  });

  // When form mounts from a scan in Vehicle mode, mark ONLY the single newly scanned checkpoint
  useEffect(() => {
    if (!isPushCart) {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setStreetScans(prev => {
        // Check if there is an unscanned point to mark as scanned from this QR scan
        const firstUnscannedIdx = prev.findIndex(s => !s.isScanned);
        if (firstUnscannedIdx !== -1) {
          const updated = [...prev];
          updated[firstUnscannedIdx] = {
            ...updated[firstUnscannedIdx],
            isScanned: true,
            scannedAt: nowStr
          };
          return updated;
        }
        return prev;
      });
    }
  }, [scannedHouseId, isPushCart]);

  // Compute vehicle coverage state
  const completedScansCount = streetScans.filter(s => s.isScanned).length;
  const isVehicleAll5Covered = completedScansCount === 5;
  const isVehicle4PartiallyCovered = completedScansCount === 4;

  // Sync formData.coverageStatus for vehicle mode
  useEffect(() => {
    if (!isPushCart) {
      if (completedScansCount === 5) {
        setFormData(prev => ({ ...prev, coverageStatus: 'Covered', notCoveredReason: undefined }));
      } else if (completedScansCount === 4) {
        setFormData(prev => ({ 
          ...prev, 
          coverageStatus: 'Partially Covered',
          notCoveredReason: 'Other' as NotCoveredReason
        }));
      } else {
        setFormData(prev => ({ 
          ...prev, 
          coverageStatus: 'Not Covered',
          notCoveredReason: 'Other' as NotCoveredReason
        }));
      }
    }
  }, [isPushCart, completedScansCount]);

  const handleToggleFormScanPoint = (scanId: number) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setStreetScans(prev => {
      const updated = prev.map(sc => {
        if (sc.id === scanId) {
          const nextState = !sc.isScanned;
          playChimeTone(nextState ? 'success' : 'warning');
          return {
            ...sc,
            isScanned: nextState,
            scannedAt: nextState ? nowStr : undefined
          };
        }
        return sc;
      });
      return updated;
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [editToast, setEditToast] = useState<string | null>(null);

  // Real-time GPS Geolocation States
  const [gpsLat, setGpsLat] = useState<number>(11.01684);
  const [gpsLng, setGpsLng] = useState<number>(76.95582);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(3.2);
  const [gpsLocationName, setGpsLocationName] = useState<string>('Kamaraj Salai, Cross Cut Rd, Gandhipuram, Coimbatore - 641012');
  const [gpsStatus, setGpsStatus] = useState<'acquiring' | 'locked' | 'live'>('acquiring');
  const [isRefreshingGps, setIsRefreshingGps] = useState<boolean>(false);
  const [showMapModal, setShowMapModal] = useState<boolean>(false);

  // Function to acquire real or simulated high-precision GPS telemetry
  const acquireGps = () => {
    setIsRefreshingGps(true);
    setGpsStatus('acquiring');

    const doorMatch = (formData.doorNo || '').match(/\d+/);
    const doorNum = doorMatch ? parseInt(doorMatch[0], 10) : 45;
    const baseLat = formData.ward === 'Ward 15' ? 11.0250 : formData.ward === 'Ward 18' ? 11.0020 : 11.0168;
    const baseLng = formData.ward === 'Ward 15' ? 76.9610 : formData.ward === 'Ward 18' ? 76.9680 : 76.9558;
    const streetBase = formData.ward === 'Ward 15' 
      ? 'Gandhi Road, DB Road Corner, RS Puram, Coimbatore - 641002'
      : formData.ward === 'Ward 18'
      ? 'Periyar Nagar, Big Bazaar St, Town Hall, Coimbatore - 641001'
      : 'Kamaraj Salai, Cross Cut Rd, Gandhipuram, Coimbatore - 641012';

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = +pos.coords.latitude.toFixed(5);
          const lng = +pos.coords.longitude.toFixed(5);
          setGpsLat(lat);
          setGpsLng(lng);
          setGpsAccuracy(Math.max(2.1, Math.min(6.5, +pos.coords.accuracy.toFixed(1))));
          setGpsStatus('live');
          setGpsLocationName(`${formData.doorNo ? `${formData.doorNo}, ` : ''}${formData.streetName}, ${formData.ward}, Coimbatore - 641012`);
          setIsRefreshingGps(false);
        },
        (err) => {
          console.warn('Geolocation fallback to street coordinates:', err);
          const calculatedLat = +(baseLat + (doorNum * 0.00008) - 0.003).toFixed(5);
          const calculatedLng = +(baseLng + ((doorNum % 10) * 0.00006) - 0.0002).toFixed(5);
          setGpsLat(calculatedLat);
          setGpsLng(calculatedLng);
          setGpsAccuracy(3.4);
          setGpsStatus('locked');
          setGpsLocationName(`${formData.doorNo ? `${formData.doorNo}, ` : ''}${formData.streetName}, ${streetBase}`);
          setIsRefreshingGps(false);
        },
        { enableHighAccuracy: true, timeout: 3500 }
      );
    } else {
      const calculatedLat = +(baseLat + (doorNum * 0.00008) - 0.003).toFixed(5);
      const calculatedLng = +(baseLng + ((doorNum % 10) * 0.00006) - 0.0002).toFixed(5);
      setGpsLat(calculatedLat);
      setGpsLng(calculatedLng);
      setGpsAccuracy(3.4);
      setGpsStatus('locked');
      setGpsLocationName(`${formData.doorNo ? `${formData.doorNo}, ` : ''}${formData.streetName}, ${streetBase}`);
      setIsRefreshingGps(false);
    }
  };

  useEffect(() => {
    acquireGps();
  }, [formData.doorNo, formData.streetName, formData.ward]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    playChimeTone('success');

    const timestampStr = new Date().toLocaleString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

    // Calculate 5-Point Street Scans & Coverage Status for Vehicle Mode
    let finalCoverageStatus: CoverageStatus = formData.coverageStatus;
    if (!isPushCart) {
      const isAllCovered = streetScans.filter(s => s.isScanned).length === 5;
      finalCoverageStatus = isAllCovered ? 'Covered' : 'Not Covered';

      try {
        const stName = formData.streetName || "Kamaraj Salai";
        const savedScansRaw = localStorage.getItem('ccmc_street_5scans');
        let currentScansObj: Record<string, any[]> = {};
        if (savedScansRaw) {
          try { currentScansObj = JSON.parse(savedScansRaw); } catch (e) { /* ignore */ }
        }
        currentScansObj[stName] = streetScans;
        localStorage.setItem('ccmc_street_5scans', JSON.stringify(currentScansObj));
      } catch (err) {
        console.warn('Error updating street scans:', err);
      }
    }

    const fallbackRecord: SWMSHouseholdRecord = {
      id: `REC-${Date.now()}`,
      houseId: formData.houseId || scannedHouseId,
      zone: formData.zone || "East Zone",
      ward: formData.ward || "Ward 12",
      siName: formData.siName || "K. Rajan",
      siContact: formData.siContact || "9876543210",
      ssName: formData.ssName || "M. Selvam",
      ssContact: formData.ssContact || "9876543211",
      cssName: formData.cssName || "S. Kumar",
      driverWorkerName: formData.driverWorkerName || "P. Murugan",
      driverWorkerContact: formData.driverWorkerContact || "9876543212",
      householderName: formData.householderName || "Householder",
      householderContact: formData.householderContact || "9840123456",
      streetName: formData.streetName || "Kamaraj Salai",
      doorNo: formData.doorNo || "45",
      coverageStatus: finalCoverageStatus,
      notCoveredReason: finalCoverageStatus === 'Not Covered' ? (isPushCart ? (formData.notCoveredReason || 'House Locked') : 'Other') : undefined,
      remarks: formData.remarks || (!isPushCart && finalCoverageStatus === 'Not Covered' ? `${5 - completedScansCount} QR Checkpoints Pending` : undefined),
      latitude: gpsLat,
      longitude: gpsLng,
      gpsCoordinates: `${gpsLat.toFixed(5)}° N, ${gpsLng.toFixed(5)}° E`,
      locationName: gpsLocationName,
      gpsAccuracy: gpsAccuracy,
      gpsTimestamp: timestampStr,
      assignedVehicleId: assignedVehicleId || 'v-push-cart',
      vehicleNo: assignedVehicleId === 'v-tata-ace' ? 'TN 38 BG 4410' : assignedVehicleId === 'v-bov' ? 'TN 38 EV 1022' : assignedVehicleId === 'v-obl-pvt' ? 'TN 38 PV 9001' : 'TN 38 PC 0089',
      vehicleType: assignedVehicleId === 'v-tata-ace' ? 'TATA ACE' : assignedVehicleId === 'v-bov' ? 'BOV' : assignedVehicleId === 'v-obl-pvt' ? 'OBL PRIVATE' : 'PUSH CART',
      submittedAt: timestampStr
    };

    const submissionPayload = {
      ...fallbackRecord
    };

    try {
      const res = await fetch('/api/swms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionPayload)
      });
      const data = await res.json();
      if (data && data.success && data.record) {
        onSubmitSuccess(data.record, finalCoverageStatus);
      } else {
        onSubmitSuccess(fallbackRecord, finalCoverageStatus);
      }
    } catch (err) {
      console.warn('Direct fallback record generated due to network/offline mode:', err);
      onSubmitSuccess(fallbackRecord, finalCoverageStatus);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 overflow-hidden w-full relative">
      
      {/* Green Header with Back, Hon'ble CM Photo, CCMC Branding, House ID & Three-Dots Menu */}
      <div className="bg-[#1E7A38] px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 flex items-center justify-between border-b border-emerald-700/60 sticky top-0 z-20 shadow-md text-white min-h-[52px] sm:min-h-[56px] lg:min-h-[62px]">
        {/* Left Branding Group */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <button
            onClick={onBackToScanner}
            className="w-7 h-7 sm:w-8 sm:h-8 bg-[#113B22] hover:bg-[#166534] text-white rounded-full transition flex items-center justify-center border border-emerald-500/30 shadow-xs cursor-pointer active:scale-95 flex-shrink-0"
            title="Back to Scanner / ஸ்கேனருக்குத் திரும்பு"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </button>

          {/* Hon'ble CM Portrait */}
          <div 
            className="h-9 sm:h-10 w-8 sm:w-10 flex-shrink-0 overflow-hidden border-r-2 border-amber-400 shadow-xs bg-emerald-950 -my-1 relative"
            title="Hon'ble Chief Minister of Tamil Nadu"
          >
            <img
              src={cmPhoto}
              alt="CM"
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (e.currentTarget.src !== cmFallbackPhoto) {
                  e.currentTarget.src = cmFallbackPhoto;
                }
              }}
              className="w-full h-full object-cover object-top"
            />
          </div>

          {/* CCMC Emblem */}
          <div className="relative flex-shrink-0 flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 bg-white rounded-full border border-amber-400 sm:border-2 shadow-xs overflow-hidden">
            <img
              src={ccmcLogo}
              alt="CCMC"
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (e.currentTarget.src !== ccmcFallbackLogo) {
                  e.currentTarget.src = ccmcFallbackLogo;
                }
              }}
              className="w-full h-full object-contain p-0.5"
            />
          </div>

          {/* Municipal Title */}
          <div className="min-w-0 flex flex-col justify-center">
            {/* Line 1: Coimbatore City */}
            <div className="text-[11px] sm:text-sm lg:text-base font-black tracking-tight text-white leading-tight whitespace-nowrap drop-shadow-xs">
              Coimbatore City
            </div>
            {/* Line 2: Municipal Corporation */}
            <div className="text-[10px] sm:text-xs lg:text-[14px] font-black tracking-tight text-amber-300 leading-tight whitespace-nowrap drop-shadow-xs">
              Municipal Corporation
            </div>
            {/* Line 3: Sanitary Field Worker */}
            <div className="text-[8.5px] sm:text-[10.5px] lg:text-xs font-black tracking-wider text-cyan-300 uppercase leading-tight mt-0.5 whitespace-nowrap drop-shadow-xs">
              {lang === 'ta' ? 'குப்பை சேகரிப்பு பதிவு' : 'SANITARY FIELD WORKER'}
            </div>
          </div>
        </div>

        {/* Right Header: Language Switcher Segment [ தமிழ் | English ] */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div className="bg-[#113B22] border border-emerald-500/40 rounded-full p-0.5 flex items-center shadow-xs flex-shrink-0 scale-90 sm:scale-100 origin-right">
            <button
              type="button"
              onClick={() => {
                if (onSetLanguage) onSetLanguage('ta');
                else if (lang !== 'ta' && onToggleLang) onToggleLang();
              }}
              className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[8.5px] sm:text-[10px] font-black transition-all cursor-pointer flex items-center gap-0.5 sm:gap-1 ${
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
              className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[8.5px] sm:text-[10px] font-black transition-all cursor-pointer ${
                lang === 'en'
                  ? 'bg-[#FF9E00] text-slate-950 shadow-xs'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
              }`}
              title="Select English Language"
            >
              <span>English</span>
            </button>
          </div>
        </div>
      </div>

      {/* Operational Status Sub-Bar: Hidden on mobile & tablet view (< lg), visible only on large desktop */}
      <div className="hidden lg:flex bg-[#113B22] px-2 sm:px-4 py-1.5 items-center justify-between gap-1.5 text-[9px] sm:text-xs text-emerald-100 font-medium border-t border-emerald-700/50">
        {/* Left: Field Officer */}
        <div className="flex items-center gap-1 bg-[#0A2E17] border border-emerald-400/50 rounded-full px-2 py-0.5 shadow-xs flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
          <span className="text-amber-300 font-black text-[9px] sm:text-[10px] whitespace-nowrap">
            {lang === 'ta' ? 'கள அதிகாரி' : 'Field Officer'}:
          </span>
          <span className="text-white font-bold text-[9px] sm:text-[10px] truncate max-w-[85px] sm:max-w-[150px]">
            Karthik Muthusamy
          </span>
        </div>

        {/* Center: Prominent White House ID / Street ID Pill Badge */}
        <div className="bg-white text-[#1E7A38] px-2.5 sm:px-3.5 py-0.5 rounded-full border border-emerald-300 shadow-sm flex items-center justify-center flex-shrink-0 mx-auto">
          <span className="text-[10px] sm:text-[11.5px] font-black tracking-wider uppercase font-mono">
            {isPushCart ? formData.houseId : formData.streetName}
          </span>
        </div>

        {/* Right: ICCC Live */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <ICCCLiveBadge lang={lang} />
        </div>
      </div>

      {/* Main Focus: HOUSEHOLD INFO + REAL-TIME GPS + COVERED & NOT COVERED + SUBMIT */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 text-xs text-slate-800 pb-28">
        
        {/* Toast feedback when details are edited */}
        {editToast && (
          <div className="bg-emerald-700 text-white px-4 py-2.5 rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold animate-fadeIn">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-200" />
              <span>{editToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setEditToast(null)}
              className="text-white hover:text-emerald-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scanned House / Street Information & EDIT Card */}
        <div className="bg-white p-4 rounded-3xl border-2 border-emerald-200/90 shadow-md space-y-3">
          {/* Header Row with Vehicle Tag & Action Buttons */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-[#1E7A38] flex items-center justify-center font-black text-sm flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="bg-[#1E7A38] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-2xs">
                    {assignedVehicleId === 'v-tata-ace'
                      ? (lang === 'ta' ? '🚚 டாடா ஏஸ்' : '🚚 TATA ACE')
                      : assignedVehicleId === 'v-bov'
                      ? (lang === 'ta' ? '🔋 பி.ஓ.வி' : '🔋 BOV')
                      : assignedVehicleId === 'v-obl-pvt'
                      ? (lang === 'ta' ? '🚛 தனியார் வாகனம்' : '🚛 OBL-PVT')
                      : (lang === 'ta' ? '🛒 தள்ளுவண்டி' : '🛒 Push Cart')}
                  </span>
                  {isPushCart && (
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-black text-[10px] sm:text-[10.5px] px-2 py-0.5 rounded-full shadow-2xs">
                      {formData.houseId}
                    </span>
                  )}
                  <span className="bg-purple-100 text-purple-800 border border-purple-300 text-[9.5px] font-extrabold px-2 py-0.5 rounded-md">
                    {formData.zone}
                  </span>
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9.5px] font-extrabold px-2 py-0.5 rounded-md">
                    {formData.ward}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Edit and Details */}
            <div className="flex items-center space-x-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsEditingInline(!isEditingInline)}
                className={`text-[11px] font-black px-3 py-1.5 rounded-xl border transition cursor-pointer flex items-center space-x-1.5 shadow-2xs active:scale-95 ${
                  isEditingInline
                    ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                }`}
                title={isEditingInline ? 'Cancel Editing' : 'Edit Details / விவரங்களைத் திருத்து'}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>{isEditingInline ? (lang === 'ta' ? 'மூடு' : 'Close') : (lang === 'ta' ? 'திருத்து' : 'Edit')}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMoreDetails(true)}
                className="text-[11px] text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-bold px-2.5 py-1.5 rounded-xl border border-slate-300 transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                title="Full Officer & Ward Details"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">{lang === 'ta' ? 'விவரங்கள்' : 'Details'}</span>
              </button>
            </div>
          </div>

          {/* Body: Read-only summary or Editable Inputs */}
          {!isEditingInline ? (
            <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">
                    {isPushCart ? `${formData.streetName}, Door #${formData.doorNo}` : formData.streetName}
                  </h4>
                  {isPushCart && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-300">
                      Door #{formData.doorNo}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 font-semibold flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formData.householderName}</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono text-slate-700">{formData.householderContact}</span>
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  {lang === 'ta' ? 'அதிகாரிகள்:' : 'Officers:'} SI {formData.siName} ({formData.siContact}) • Driver {formData.driverWorkerName}
                </p>
              </div>
            </div>
          ) : (
            /* INLINE EDIT FORM */
            <div className="bg-amber-50/70 border-2 border-amber-300 rounded-2xl p-3.5 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-amber-900 font-extrabold text-[11px] border-b border-amber-200/80 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5 text-amber-700" />
                  {lang === 'ta'
                    ? (isPushCart ? 'விவரங்களைத் திருத்துங்கள் (Edit Street & Household):' : 'தெரு விவரங்களைத் திருத்துங்கள் (Edit Street Details):')
                    : (isPushCart ? 'Edit Street & Household Details:' : 'Edit Street Details:')}
                </span>
                {isPushCart && (
                  <span className="text-[10px] text-amber-700 font-mono">
                    {formData.houseId}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">
                    {lang === 'ta' ? 'தெரு பெயர் (Street Name)' : 'Street Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.streetName}
                    onChange={(e) => setFormData({ ...formData, streetName: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Kamaraj Salai"
                  />
                </div>

                {isPushCart && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      {lang === 'ta' ? 'கதவு எண் (Door No)' : 'Door No'}
                    </label>
                    <input
                      type="text"
                      value={formData.doorNo}
                      onChange={(e) => setFormData({ ...formData, doorNo: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="e.g. 45 or 12A"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">
                    {lang === 'ta' ? 'குடியிருப்பாளர் பெயர்' : 'Resident Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.householderName}
                    onChange={(e) => setFormData({ ...formData, householderName: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Ramanathan"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">
                    {lang === 'ta' ? 'தொலைபேசி எண்' : 'Contact Phone'}
                  </label>
                  <input
                    type="text"
                    value={formData.householderContact}
                    onChange={(e) => setFormData({ ...formData, householderContact: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. 9840123456"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Zone</label>
                  <select
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
                  >
                    <option value="East Zone">{lang === 'ta' ? 'கிழக்கு மண்டலம் (East Zone)' : 'East Zone'}</option>
                    <option value="Central Zone">{lang === 'ta' ? 'மத்திய மண்டலம் (Central Zone)' : 'Central Zone'}</option>
                    <option value="West Zone">{lang === 'ta' ? 'மேற்கு மண்டலம் (West Zone)' : 'West Zone'}</option>
                    <option value="South Zone">{lang === 'ta' ? 'தெற்கு மண்டலம் (South Zone)' : 'South Zone'}</option>
                    <option value="North Zone">{lang === 'ta' ? 'வடக்கு மண்டலம் (North Zone)' : 'North Zone'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Ward</label>
                  <select
                    value={formData.ward}
                    onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
                  >
                    <option value="Ward 12">Ward 12</option>
                    <option value="Ward 14">Ward 14</option>
                    <option value="Ward 15">Ward 15</option>
                    <option value="Ward 18">Ward 18</option>
                    <option value="Ward 20">Ward 20</option>
                    <option value="Ward 24">Ward 24</option>
                  </select>
                </div>
              </div>

              {/* Inline Save / Cancel buttons */}
              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingInline(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition"
                >
                  {lang === 'ta' ? 'ரத்து' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingInline(false);
                    setEditToast(
                      lang === 'ta'
                        ? '✅ விவரங்கள் வெற்றிகரமாகப் புதுப்பிக்கப்பட்டன!'
                        : '✅ Household details updated successfully!'
                    );
                    setTimeout(() => setEditToast(null), 3500);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-[#1E7A38] hover:bg-[#166534] text-white text-xs font-black shadow-md flex items-center space-x-1.5 cursor-pointer transition active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{lang === 'ta' ? 'மாற்றங்களைச் சேமி' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PRIMARY SECTION: STATUS SELECTION & SUBMISSION */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border-2 border-emerald-500/40 shadow-md space-y-3.5">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>
                {isPushCart
                  ? (lang === 'ta' ? 'குப்பை சேகரிப்பு நிலை (தேர்வு செய்க)' : 'SELECT COLLECTION STATUS')
                  : (lang === 'ta' ? 'தெரு ஆய்வு நிலை (வாகனம்)' : 'STREET COVERAGE STATUS (VEHICLE)')}
              </span>
            </label>
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
              formData.coverageStatus === 'Covered'
                ? 'bg-emerald-100 text-[#1E7A38] border-emerald-300'
                : 'bg-rose-100 text-rose-800 border-rose-300'
            }`}>
              {formData.coverageStatus === 'Covered'
                ? (isPushCart 
                    ? (lang === 'ta' ? 'சேகரித்தது' : 'Collected') 
                    : (lang === 'ta' ? 'மூடப்பட்டது' : 'Covered'))
                : (isPushCart 
                    ? (lang === 'ta' ? 'சேகரிக்காதவை' : 'Not Collected') 
                    : (lang === 'ta' ? 'மூடப்படாதவை' : 'Not Covered'))}
            </span>
          </div>

          {/* ================================================================= */}
          {/* 1. PUSH CART MODE: TWO INTERACTIVE OPTIONS (COLLECTED / NOT COLLECTED) */}
          {/* ================================================================= */}
          {isPushCart ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                
                {/* Option 1: COLLECTED (சேகரித்தது) */}
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, coverageStatus: 'Covered' }));
                    playChimeTone('success');
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden ${
                    formData.coverageStatus === 'Covered'
                      ? 'bg-[#1E7A38] text-white border-[#166534] shadow-lg scale-[1.02] ring-2 ring-emerald-500/50'
                      : 'bg-slate-50 hover:bg-emerald-50/60 text-slate-700 border-slate-200 hover:border-emerald-300 opacity-80'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-xs ${
                    formData.coverageStatus === 'Covered' ? 'bg-white text-[#1E7A38]' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-black tracking-tight leading-tight block">
                    {lang === 'ta' ? 'சேகரித்தது' : 'COLLECTED'}
                  </span>
                  <span className={`text-[10px] font-bold mt-0.5 ${
                    formData.coverageStatus === 'Covered' ? 'text-emerald-100' : 'text-slate-500'
                  }`}>
                    {lang === 'ta' ? 'குப்பை வாங்கப்பட்டது' : 'Waste Collected'}
                  </span>
                  {formData.coverageStatus === 'Covered' && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
                  )}
                </button>

                {/* Option 2: NOT COLLECTED (சேகரிக்காதவை) */}
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, coverageStatus: 'Not Covered' }));
                    playChimeTone('warning');
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden ${
                    formData.coverageStatus === 'Not Covered'
                      ? 'bg-[#D93025] text-white border-rose-700 shadow-lg scale-[1.02] ring-2 ring-rose-500/50'
                      : 'bg-slate-50 hover:bg-rose-50/60 text-slate-700 border-slate-200 hover:border-rose-300 opacity-80'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-xs ${
                    formData.coverageStatus === 'Not Covered' ? 'bg-white text-[#D93025]' : 'bg-rose-100 text-rose-700'
                  }`}>
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-black tracking-tight leading-tight block">
                    {lang === 'ta' ? 'சேகரிக்காதவை' : 'NOT COLLECTED'}
                  </span>
                  <span className={`text-[10px] font-bold mt-0.5 ${
                    formData.coverageStatus === 'Not Covered' ? 'text-rose-100' : 'text-slate-500'
                  }`}>
                    {lang === 'ta' ? 'குப்பை வரவில்லை' : 'Pending / Missed'}
                  </span>
                  {formData.coverageStatus === 'Not Covered' && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-300 animate-ping" />
                  )}
                </button>
              </div>

              {/* REASON SELECTOR IF NOT COLLECTED IS CHOSEN */}
              {formData.coverageStatus === 'Not Covered' && (
                <div className="bg-rose-50/80 border border-rose-200 p-3.5 rounded-2xl space-y-2.5 animate-fadeIn">
                  <label className="block text-[11px] font-black text-rose-900 uppercase tracking-wide flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>{lang === 'ta' ? 'சேகரிக்காததற்கான காரணம் (தேர்வு செய்க):' : 'Reason for Not Collected (Required):'}</span>
                  </label>
                  
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'House Locked', en: 'House Locked', ta: 'வீடு பூட்டப்பட்டுள்ளது' },
                      { id: 'Door Closed', en: 'Door Closed / No Response', ta: 'கதவு மூடப்பட்டுள்ளது' },
                      { id: 'Waste Not Separated', en: 'Not Segregated', ta: 'தரம் பிரிக்கப்படவில்லை' },
                      { id: 'Refused', en: 'Refused to Give', ta: 'குப்பை கொடுக்க மறுப்பு' },
                      { id: 'Vacant House', en: 'Vacant House', ta: 'காலியான வீடு' },
                      { id: 'Other', en: 'Other Reason', ta: 'இதர காரணம்' }
                    ].map((reasonItem) => (
                      <button
                        key={reasonItem.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, notCoveredReason: reasonItem.id as NotCoveredReason }))}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-left transition-all border cursor-pointer ${
                          formData.notCoveredReason === reasonItem.id
                            ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                            : 'bg-white text-slate-800 border-rose-200 hover:bg-rose-100/60'
                        }`}
                      >
                        {lang === 'ta' ? reasonItem.ta : reasonItem.en}
                      </button>
                    ))}
                  </div>

                  {/* Optional Remarks input */}
                  <div className="pt-1">
                    <input
                      type="text"
                      value={formData.remarks}
                      onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                      placeholder={lang === 'ta' ? 'கூடுதல் குறிப்பு (விரும்பினால்)...' : 'Add remarks/notes (optional)...'}
                      className="w-full bg-white border border-rose-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ================================================================= */
            /* 2. VEHICLE MODE (TATA ACE / BOV / OBL-PVT): 5-POINT SCAN STATUS */
            /* ================================================================= */
            <div className="space-y-3">
              {/* Checkpoints Header & Grid */}
              <div className="bg-[#F8FAFC] rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5 font-extrabold text-slate-800">
                    <QrCode className="w-4 h-4 text-[#1E7A38]" />
                    <span>
                      {lang === 'ta'
                        ? `தெருவின் 5 QR சோதனைப் புள்ளிகள் (${completedScansCount}/5 முடிந்தது)`
                        : `5 Street QR Checkpoints (${completedScansCount}/5 Scanned)`}
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {lang === 'ta' ? 'மாற்ற தொடவும்' : 'Tap to toggle'}
                  </span>
                </div>

                {/* 5 Scan Cards in Form */}
                <div className="grid grid-cols-5 gap-2">
                  {streetScans.map((scan) => {
                    const isDone = scan.isScanned;
                    return (
                      <button
                        key={scan.id}
                        type="button"
                        onClick={() => handleToggleFormScanPoint(scan.id)}
                        className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl border-2 transition-all duration-150 cursor-pointer active:scale-95 text-center ${
                          isDone
                            ? 'bg-[#ECFDF5] border-[#10B981] text-slate-900 shadow-2xs hover:bg-[#D1FAE5]'
                            : 'bg-[#FFF1F2] border-[#FDA4AF] text-[#991B1B] hover:bg-[#FFE4E6]'
                        }`}
                        title={isDone ? `${scan.label}: Done (${scan.scannedAt || 'Scanned'})` : `${scan.label}: Pending (Tap to scan)`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black mb-1 shadow-2xs ${
                          isDone
                            ? 'bg-[#1E7A38] text-white ring-2 ring-emerald-200'
                            : 'bg-[#D93025] text-white ring-2 ring-rose-200'
                        }`}>
                          {isDone ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : (
                            <X className="w-3.5 h-3.5 stroke-[3]" />
                          )}
                        </div>
                        <span className="text-[10.5px] font-black truncate w-full leading-tight text-slate-900">
                          {lang === 'ta' ? scan.taLabel : scan.label}
                        </span>
                        <span className={`text-[9px] font-bold mt-0.5 leading-tight ${
                          isDone ? 'text-emerald-700 font-mono' : 'text-rose-600'
                        }`}>
                          {isDone ? (scan.scannedAt || (lang === 'ta' ? 'சரி ✓' : 'Done ✓')) : (lang === 'ta' ? 'தவறு X' : 'Pending X')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Outcome Banner: 5/5 -> Green Covered, 4/5 -> RedOrange Partially Covered, <=3 -> Red Not Covered */}
              <div className={`p-3.5 sm:p-4 rounded-2xl border-2 shadow-sm flex items-center justify-between gap-3 ${
                completedScansCount === 5
                  ? 'bg-[#1E7A38] text-white border-[#166534]'
                  : completedScansCount === 4
                  ? 'bg-[#FFF7ED] text-[#9A3412] border-[#FDBA74]'
                  : 'bg-[#FFF1F2] text-[#991B1B] border-[#FECDD3]'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs ${
                    completedScansCount === 5
                      ? 'bg-white text-[#1E7A38]'
                      : completedScansCount === 4
                      ? 'bg-[#EA580C] text-white'
                      : 'bg-[#D93025] text-white'
                  }`}>
                    {completedScansCount === 5 ? (
                      <CheckCircle2 className="w-6 h-6 text-[#1E7A38]" />
                    ) : completedScansCount === 4 ? (
                      <AlertTriangle className="w-6 h-6 text-white" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm sm:text-base font-black tracking-wide block">
                      {completedScansCount === 5
                        ? (lang === 'ta' ? 'மூடப்பட்டது (COVERED - 5/5)' : 'COVERED (5/5 COMPLETED)')
                        : completedScansCount === 4
                        ? (lang === 'ta' ? 'பகுதி மூடப்பட்டது (PARTIALLY COVERED - 4/5)' : 'PARTIALLY COVERED (4/5 CHECKPOINTS)')
                        : (lang === 'ta' ? `மூடப்படாதவை (NOT COVERED - ${completedScansCount}/5)` : `NOT COVERED (${completedScansCount}/5 CHECKPOINTS)`)}
                    </span>
                    <span className={`text-[11px] font-bold block ${
                      completedScansCount === 5 
                        ? 'text-emerald-100' 
                        : completedScansCount === 4 
                        ? 'text-[#C2410C]' 
                        : 'text-rose-700'
                    }`}>
                      {completedScansCount === 5
                        ? (lang === 'ta' ? 'அனைத்து 5 QR புள்ளிகளும் ஸ்கேன் செய்யப்பட்டது • தெரு மூடப்பட்டது ✓' : 'All 5 QR checkpoints scanned • Street 100% Covered ✓')
                        : completedScansCount === 4
                        ? (lang === 'ta' ? '4 புள்ளிகள் ஸ்கேன் முடிந்தது • பகுதி மூடப்பட்டது ⚡ (இன்னும் 1 புள்ளி விடுபட்டுள்ளது)' : '4 checkpoints scanned • Partially Covered ⚡ (1 more checkpoint required for 100% Covered)')
                        : (lang === 'ta' 
                            ? `3 அல்லது அதற்கும் குறைவான புள்ளிகள் • மூடப்படவில்லை ⚠ (${5 - completedScansCount} புள்ளிகள் விடுபட்டுள்ளன)` 
                            : `3 or fewer checkpoints scanned • Not Covered ⚠ (${5 - completedScansCount} checkpoint(s) pending)`)}
                    </span>
                  </div>
                </div>

                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  completedScansCount === 5 
                    ? 'bg-emerald-300 animate-ping mr-1' 
                    : completedScansCount === 4 
                    ? 'bg-orange-500 animate-pulse mr-1' 
                    : 'bg-rose-400'
                }`} />
              </div>
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON - DYNAMIC BASED ON SELECTION */}
        <div className="pt-2">
          <button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            disabled={isSubmitting}
            className={`w-full text-white font-black py-4 px-4 rounded-2xl text-sm sm:text-base transition shadow-xl flex items-center justify-center space-x-2 border active:scale-98 cursor-pointer disabled:opacity-60 ${
              isPushCart
                ? (formData.coverageStatus === 'Not Covered'
                    ? 'bg-[#D93025] hover:bg-[#B31D12] active:bg-[#8E170E] border-rose-500/40 ring-2 ring-rose-500/30'
                    : 'bg-[#1E7A38] hover:bg-[#166534] active:bg-[#113B22] border-emerald-500/40 ring-2 ring-emerald-500/30')
                : (completedScansCount === 5
                    ? 'bg-[#1E7A38] hover:bg-[#166534] active:bg-[#113B22] border-emerald-500/40 ring-2 ring-emerald-500/30'
                    : completedScansCount === 4
                    ? 'bg-[#EA580C] hover:bg-[#C2410C] active:bg-[#9A3412] border-orange-500/40 ring-2 ring-orange-500/30'
                    : 'bg-[#D93025] hover:bg-[#B31D12] active:bg-[#8E170E] border-rose-500/40 ring-2 ring-rose-500/30')
            }`}
          >
            {isSubmitting ? (
              <RefreshCw className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
            <span className="font-black text-white">
              {isSubmitting
                ? (lang === 'ta' ? 'சமர்ப்பிக்கப்படுகிறது...' : 'Submitting Status...')
                : isPushCart
                ? (formData.coverageStatus === 'Covered'
                    ? (lang === 'ta' ? '✅ குப்பை சேகரித்த நிலையைச் சமர்ப்பி' : '✅ Submit Collected Status')
                    : (lang === 'ta' ? '❌ சேகரிக்காத நிலையைச் சமர்ப்பி' : '❌ Submit Not Collected Status'))
                : (completedScansCount === 5
                    ? (lang === 'ta' ? '🚚 தெரு மூடப்பட்ட நிலையைச் சமர்ப்பி (Submit Covered - 5/5)' : '🚚 Submit Street Covered Status (5/5 Done)')
                    : completedScansCount === 4
                    ? (lang === 'ta' ? '⚡ பகுதி மூடப்பட்ட நிலையைச் சமர்ப்பி (Submit Partially Covered - 4/5)' : '⚡ Submit Partially Covered Status (4/5 Done)')
                    : (lang === 'ta' ? `⚠️ மூடப்படாத நிலையைச் சமர்ப்பி (Submit Not Covered - ${completedScansCount}/5)` : `⚠️ Submit Not Covered Status (${completedScansCount}/5 Done)`))}
            </span>
          </button>
        </div>

      </form>

      {/* SLIDE-OVER / MODAL DRAWER FOR THREE-DOTS (Advanced Household & Officer Details) */}
      {showMoreDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-scaleIn">
            
            {/* Modal Header */}
            <div className="bg-[#1E7A38] text-white p-4 flex items-center justify-between border-b border-emerald-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-white/20">
                  <Pencil className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <span>{lang === 'ta' ? '✏️ விவரங்களைத் திருத்து (Household & Officer Edit)' : '✏️ Edit Household & Officer Details'}</span>
                  </h3>
                  <p className="text-[10px] text-emerald-200 font-semibold">
                    {formData.houseId} • {formData.streetName} • {formData.ward}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreDetails(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content Form Fields */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs text-slate-800">
              
              {/* SECTION 1: ZONE & WARD */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-1.5 text-[#1E7A38] font-black text-[11px] uppercase">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{lang === 'ta' ? 'மண்டலம் & வார்டு' : 'Zone & Ward'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Zone</label>
                    <select
                      value={formData.zone}
                      onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    >
                      <option value="East Zone">{lang === 'ta' ? 'கிழக்கு மண்டலம் (East Zone)' : 'East Zone'}</option>
                      <option value="Central Zone">{lang === 'ta' ? 'மத்திய மண்டலம் (Central Zone)' : 'Central Zone'}</option>
                      <option value="West Zone">{lang === 'ta' ? 'மேற்கு மண்டலம் (West Zone)' : 'West Zone'}</option>
                      <option value="South Zone">{lang === 'ta' ? 'தெற்கு மண்டலம் (South Zone)' : 'South Zone'}</option>
                      <option value="North Zone">{lang === 'ta' ? 'வடக்கு மண்டலம் (North Zone)' : 'North Zone'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Ward</label>
                    <select
                      value={formData.ward}
                      onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    >
                      <option value="Ward 12">Ward 12</option>
                      <option value="Ward 15">Ward 15</option>
                      <option value="Ward 18">Ward 18</option>
                      <option value="Ward 20">Ward 20</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: SANITARY INSPECTOR */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-1.5 text-[#1E7A38] font-black text-[11px] uppercase">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Sanitary Inspector (SI)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">SI Name</label>
                    <input
                      type="text"
                      value={formData.siName}
                      onChange={(e) => setFormData({ ...formData, siName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">SI Contact</label>
                    <input
                      type="text"
                      value={formData.siContact}
                      onChange={(e) => setFormData({ ...formData, siContact: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: SUPERVISORS */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-1.5 text-[#1E7A38] font-black text-[11px] uppercase">
                  <User className="w-3.5 h-3.5" />
                  <span>Supervisors (SS & CSS)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">SS Name</label>
                    <input
                      type="text"
                      value={formData.ssName}
                      onChange={(e) => setFormData({ ...formData, ssName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">CSS Name</label>
                    <input
                      type="text"
                      value={formData.cssName}
                      onChange={(e) => setFormData({ ...formData, cssName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: DRIVER DETAILS */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-1.5 text-[#1E7A38] font-black text-[11px] uppercase">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Driver & Vehicle</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Driver Name</label>
                    <input
                      type="text"
                      value={formData.driverWorkerName}
                      onChange={(e) => setFormData({ ...formData, driverWorkerName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Driver Contact</label>
                    <input
                      type="text"
                      value={formData.driverWorkerContact}
                      onChange={(e) => setFormData({ ...formData, driverWorkerContact: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: HOUSEHOLDER & LOCATION */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-1.5 text-[#1E7A38] font-black text-[11px] uppercase">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Householder Info & Address</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Householder</label>
                    <input
                      type="text"
                      value={formData.householderName}
                      onChange={(e) => setFormData({ ...formData, householderName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.householderContact}
                      onChange={(e) => setFormData({ ...formData, householderContact: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
                {isPushCart ? (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">{lang === 'ta' ? 'தெரு' : 'Street'}</label>
                      <input
                        type="text"
                        value={formData.streetName}
                        onChange={(e) => setFormData({ ...formData, streetName: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">{lang === 'ta' ? 'கதவு எண்' : 'Door No'}</label>
                      <input
                        type="text"
                        value={formData.doorNo}
                        onChange={(e) => setFormData({ ...formData, doorNo: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">{lang === 'ta' ? 'தெரு பெயர்' : 'Street Name'}</label>
                    <input
                      type="text"
                      value={formData.streetName}
                      onChange={(e) => setFormData({ ...formData, streetName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    />
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-medium">
                {lang === 'ta' ? 'மாற்றங்கள் உடனடியாகப் பயன்படுத்தப்படும்' : 'Changes apply immediately to this entry'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowMoreDetails(false);
                  setEditToast(
                    lang === 'ta'
                      ? '✅ அனைத்து விவரங்களும் வெற்றிகரமாகப் புதுப்பிக்கப்பட்டன!'
                      : '✅ All officer and household details updated successfully!'
                  );
                  setTimeout(() => setEditToast(null), 3500);
                }}
                className="bg-[#1E7A38] hover:bg-[#166534] text-white font-black text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-md flex items-center space-x-1.5 active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{lang === 'ta' ? 'மாற்றங்களைச் சேமித்து மூடு' : 'Save & Apply Changes'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
