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
import { SREE_NAGAR_SCAN_ROUTE, MAGESHWARI_NAGAR_SCAN_ROUTE, THIYAGIKUMAR_STREET_SCAN_ROUTE, MGR_VEEDHI_SCAN_ROUTE, KALYANAM_SUNDHARAM_STREET_SCAN_ROUTE, PONNI_NAGAR_SCAN_ROUTE, PONNI_NAGAR_2_SCAN_ROUTE, KANDHASAMY_LAYOUT_SCAN_ROUTE, LAKSHMI_MILLS_SIGNAL_SCAN_ROUTE, MARIYAMMAN_KOVIL_STREET_SCAN_ROUTE, KK_NAGAR_SCAN_ROUTE, RANGANATHAN_KOVIL_STREET_SCAN_ROUTE, BAJANA_KOVIL_VEEDHI_SCAN_ROUTE, BAARI_NAGAR_VEEDHI_CUT_ROAD_SCAN_ROUTE, RAMASAMY_KOONARCUT_ROAD_SCAN_ROUTE, MADHURA_ENCLAVE_SCAN_ROUTE, SENTHOORA_PURAM_SCAN_ROUTE, MEENAKSHI_NAGAR_SCAN_ROUTE, VISAGA_GARDEN_SCAN_ROUTE, MARUTHI_ENVUE_SCAN_ROUTE, PALANI_AANDAVAR_KOVIL_VEEDHI_SCAN_ROUTE, KGK_MAIN_ROAD_SCAN_ROUTE, NAGAMMA_NAYAGAR_VEEDHI_SCAN_ROUTE, ALAGAACHI_THOTTAM_SCAN_ROUTE, MUTHUSAMY_SERKAI_VEEDHI_SCAN_ROUTE } from './SWMSStreetScanQRCard';

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
  assignedVehicleId = 'v-obl-pvt',
  onBackToScanner,
  onSubmitSuccess
}) => {
  const [formData, setFormData] = useState<{
    houseId: string;
    zone: string;
    ward: string;
    vehicleType: string;
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
    ward: 'Ward 24',
    vehicleType: 'TATA ACE',
    siName: 'S.R.GERALD SATHIYA PUNITHAN',
    siContact: '9442504589',
    ssName: 'vibin',
    ssContact: '9442504589',
    cssName: 'vengatesh',
    driverWorkerName: 'murali',
    driverWorkerContact: '9677971375',
    householderName: 'murali (140 Households)',
    householderContact: '9677971375',
    streetName: 'sree nagar',
    doorNo: assignedVehicleId === 'v-push-cart' ? '' : '45',
    coverageStatus: 'Not Covered' as CoverageStatus,
    notCoveredReason: 'Other' as NotCoveredReason,
    remarks: ''
  });

  const isPushCart = assignedVehicleId === 'v-push-cart' || 
                     formData?.vehicleType === 'PUSH CART' || 
                     formData?.vehicleType === 'BOV' ||
                     (formData?.vehicleType && formData.vehicleType.toUpperCase().includes('PUSH'));

  // Helper to format exact real-time live scan timestamp (e.g. "11:32 AM" or "01:27 PM")
  const getLiveScanTimeStr = (): string => {
    const d = new Date();
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const hrStr = hours < 10 ? `0${hours}` : `${hours}`;
    return `${hrStr}:${minStr} ${ampm}`;
  };

  // Helper to check if a timestamp string is from an old legacy mock test run (e.g. 01:24 PM)
  const isLegacyMockTime = (t?: string): boolean => {
    if (!t) return false;
    return t.includes('01:24') || t.includes('01:27') || t.includes('01:28') || t.includes('1:24') || t.includes('1:27') || t.includes('1:28');
  };

  // Automatically fetch & parse scanned QR code details (e.g. QR 1: Sree Nagar or QR 2: Mageshwari Nagar)
  useEffect(() => {
    if (!scannedHouseId) return;
    let parsed: any = null;
    try {
      parsed = JSON.parse(scannedHouseId);
    } catch {
      const lower = scannedHouseId.toLowerCase().trim();
      if (lower.includes('ccmc-qr25') || lower.includes('qr25') || lower.includes('muthusamy') || lower.includes('serkai') || lower.includes('sathya') || lower.includes('tn66po982') || lower.includes('msv-025')) {
        parsed = MUTHUSAMY_SERKAI_VEEDHI_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr24') || lower.includes('qr24') || lower.includes('alagaachi') || lower.includes('thottam') || lower.includes('magendran') || lower.includes('pushcart10') || lower.includes('at-024')) {
        parsed = ALAGAACHI_THOTTAM_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr23') || lower.includes('qr23') || lower.includes('nagamma') || lower.includes('nayagar') || lower.includes('chellamuthu') || lower.includes('pushcart9') || lower.includes('nnv-023')) {
        parsed = NAGAMMA_NAYAGAR_VEEDHI_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr22') || lower.includes('qr22') || lower.includes('kgk') || lower.includes('selvaraj') || lower.includes('9361613970') || lower.includes('tn66aq1153') || lower.includes('kmr-022')) {
        parsed = KGK_MAIN_ROAD_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr21') || lower.includes('qr21') || lower.includes('palani') || lower.includes('aandavar') || lower.includes('karthik') || lower.includes('9080463024') || lower.includes('tn66am0219') || lower.includes('pakv-021')) {
        parsed = PALANI_AANDAVAR_KOVIL_VEEDHI_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr20') || lower.includes('qr20') || lower.includes('maruthi') || lower.includes('envue') || lower.includes('paneerselvam') || lower.includes('9894051660') || lower.includes('tn66ap0965') || lower.includes('mev-020')) {
        parsed = MARUTHI_ENVUE_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr19') || lower.includes('qr19') || lower.includes('visaga') || lower.includes('latha') || lower.includes('8148654687') || lower.includes('pushcart8') || lower.includes('vg-019')) {
        parsed = VISAGA_GARDEN_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr18') || lower.includes('qr18') || lower.includes('meenakshi') || lower.includes('muthulakshmi') || lower.includes('9786741096') || lower.includes('pushcart7') || lower.includes('mn-018')) {
        parsed = MEENAKSHI_NAGAR_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr17') || lower.includes('qr17') || lower.includes('senthoora') || lower.includes('mani') || lower.includes('9566421341') || lower.includes('sp-017')) {
        parsed = SENTHOORA_PURAM_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr16') || lower.includes('qr16') || lower.includes('madhura') || lower.includes('arunachalam') || lower.includes('7317634144') || lower.includes('tn66ac1906') || lower.includes('me-016')) {
        parsed = MADHURA_ENCLAVE_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr15') || lower.includes('qr15') || lower.includes('ramasamy') || lower.includes('koonarcut') || lower.includes('ramkumar') || lower.includes('7317634144') || lower.includes('tn66ap1181') || lower.includes('rkc-015')) {
        parsed = RAMASAMY_KOONARCUT_ROAD_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr14') || lower.includes('qr14') || lower.includes('baari') || lower.includes('maragadham') || lower.includes('9047038346') || lower.includes('pushcart6') || lower.includes('bn-014')) {
        parsed = BAARI_NAGAR_VEEDHI_CUT_ROAD_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr13') || lower.includes('qr13') || lower.includes('bajana') || lower.includes('jothi') || lower.includes('pushcart5') || lower.includes('bk-013')) {
        parsed = BAJANA_KOVIL_VEEDHI_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr12') || lower.includes('qr12') || lower.includes('ranganathan') || lower.includes('senraj') || lower.includes('8489034317') || lower.includes('tn66ac9176') || lower.includes('rk-012')) {
        parsed = RANGANATHAN_KOVIL_STREET_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr11') || lower.includes('qr11') || lower.includes('kk nagar') || lower.includes('saravana') || lower.includes('9750545466') || lower.includes('tn66aq1287') || lower.includes('kk-011')) {
        parsed = KK_NAGAR_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr10') || lower.includes('qr10') || lower.includes('mariyamman') || lower.includes('kovil') || lower.includes('udhayakumar') || lower.includes('8056960451') || lower.includes('tn66aq0794') || lower.includes('mk-010')) {
        parsed = MARIYAMMAN_KOVIL_STREET_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr9') || lower.includes('qr9') || lower.includes('lakshmi') || lower.includes('mills') || lower.includes('vadivukarasi') || lower.includes('7667769132') || lower.includes('pushcart4') || lower.includes('lm-009')) {
        parsed = LAKSHMI_MILLS_SIGNAL_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr8') || lower.includes('qr8') || lower.includes('kandhasamy') || lower.includes('palanisamy') || lower.includes('9677966465') || lower.includes('pushcart3') || lower.includes('kl-008')) {
        parsed = KANDHASAMY_LAYOUT_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr7') || lower.includes('qr7') || lower.includes('gokula') || lower.includes('9751099379') || lower.includes('tn66aq1114') || lower.includes('pn-007')) {
        parsed = PONNI_NAGAR_2_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr6') || lower.includes('qr6') || lower.includes('ponni') || lower.includes('surya') || lower.includes('8870418209') || lower.includes('tn66ad8373') || lower.includes('pn-006')) {
        parsed = PONNI_NAGAR_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr5') || lower.includes('qr5') || lower.includes('kalyanam') || lower.includes('sundharam') || lower.includes('anadhan') || lower.includes('8098347628') || lower.includes('ks-005')) {
        parsed = KALYANAM_SUNDHARAM_STREET_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr4') || lower.includes('qr4') || lower.includes('mgr') || lower.includes('priya') || lower.includes('7397587127') || lower.includes('mv-004')) {
        parsed = MGR_VEEDHI_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr3') || lower.includes('qr3') || lower.includes('thiyagikumar') || lower.includes('susila') || lower.includes('9790598785') || lower.includes('ts-003')) {
        parsed = THIYAGIKUMAR_STREET_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr2') || lower.includes('qr2') || lower.includes('mageshwari') || lower.includes('yogaraj') || lower.includes('tn66ad6465') || lower.includes('mn-002')) {
        parsed = MAGESHWARI_NAGAR_SCAN_ROUTE;
      } else if (lower.includes('ccmc-qr1') || lower.includes('qr1') || lower.includes('sree') || lower.includes('murali') || lower.includes('tn66ae6121') || lower.includes('sn-001')) {
        parsed = SREE_NAGAR_SCAN_ROUTE;
      }
    }

    if (parsed && typeof parsed === 'object') {
      const zoneName = parsed.zone ? (parsed.zone.toString().toUpperCase().includes('EAST') ? 'East Zone' : parsed.zone.toString().toUpperCase().includes('CENTRAL') ? 'Central Zone' : parsed.zone) : 'East Zone';
      const wardName = parsed.wardNo ? (parsed.wardNo.toString().startsWith('Ward') ? parsed.wardNo : `Ward ${parsed.wardNo}`) : 'Ward 24';

      setFormData(prev => ({
        ...prev,
        streetName: parsed.streetName || 'sree nagar',
        ward: wardName,
        zone: zoneName,
        vehicleType: parsed.vehicleType || 'TATA ACE',
        siName: parsed.siName || 'S.R.GERALD SATHIYA PUNITHAN',
        siContact: parsed.siContact || '9442504589',
        ssName: parsed.ssName || 'vibin',
        ssContact: parsed.ssContact || '9442504589',
        cssName: parsed.cssName || 'vengatesh',
        driverWorkerName: parsed.workerName || 'murali',
        driverWorkerContact: parsed.workerContact || '9677971375',
        householderName: `${parsed.workerName || 'Worker'} (${parsed.households || 30} Households)`,
        householderContact: parsed.workerContact || '9677971375',
      }));

      const targetStreetName = parsed.streetName || 'sree nagar';

      // Parse specific checkpoint point from QR string (e.g. CCMC-QR21-P3 -> Point 3)
      const lowerCode = scannedHouseId.toLowerCase();
      let targetPoint: number | null = null;
      const match = lowerCode.match(/(?:-|_|\b)p([1-5])(?:\b|_|\.|$)/);
      if (match) {
        targetPoint = parseInt(match[1], 10);
      } else if (lowerCode.includes('-p5') || lowerCode.includes('p5')) targetPoint = 5;
      else if (lowerCode.includes('-p4') || lowerCode.includes('p4')) targetPoint = 4;
      else if (lowerCode.includes('-p3') || lowerCode.includes('p3')) targetPoint = 3;
      else if (lowerCode.includes('-p2') || lowerCode.includes('p2')) targetPoint = 2;
      else if (lowerCode.includes('-p1') || lowerCode.includes('p1')) targetPoint = 1;
      else targetPoint = 1; // Default to point 1 when scanning base QR code

      const SCAN_KEY = 'ccmc_street_5scans';
      let baseScans: StreetScanPoint[] = [
        { id: 1, label: 'Scan 1', taLabel: 'ஸ்கேன் 1', locationName: 'Point 1 QR', taLocationName: 'புள்ளி 1 QR', isScanned: false },
        { id: 2, label: 'Scan 2', taLabel: 'ஸ்கேன் 2', locationName: 'Point 2 QR', taLocationName: 'புள்ளி 2 QR', isScanned: false },
        { id: 3, label: 'Scan 3', taLabel: 'ஸ்கேன் 3', locationName: 'Point 3 QR', taLocationName: 'புள்ளி 3 QR', isScanned: false },
        { id: 4, label: 'Scan 4', taLabel: 'ஸ்கேன் 4', locationName: 'Point 4 QR', taLocationName: 'புள்ளி 4 QR', isScanned: false },
        { id: 5, label: 'Scan 5', taLabel: 'ஸ்கேன் 5', locationName: 'Point 5 QR', taLocationName: 'புள்ளி 5 QR', isScanned: false },
      ];

      try {
        const raw = localStorage.getItem(SCAN_KEY);
        if (raw) {
          const obj = JSON.parse(raw);
          if (obj[targetStreetName] && Array.isArray(obj[targetStreetName])) {
            // Clean legacy mock test timestamps (e.g. 01:24 PM)
            baseScans = obj[targetStreetName].map((sc: StreetScanPoint) => {
              if (isLegacyMockTime(sc.scannedAt)) {
                return { ...sc, isScanned: false, scannedAt: undefined };
              }
              return sc;
            });
          }
        }
      } catch (e) { /* ignore */ }

      // Update scan states: mark ONLY the actually scanned targetPoint with real live timestamp
      const liveTime = getLiveScanTimeStr();
      const updatedScans = baseScans.map(sc => {
        if (targetPoint && sc.id === targetPoint) {
          return {
            ...sc,
            isScanned: true,
            scannedAt: liveTime
          };
        }
        return sc;
      });

      try {
        const raw = localStorage.getItem(SCAN_KEY);
        const obj = raw ? JSON.parse(raw) : {};
        obj[targetStreetName] = updatedScans;
        localStorage.setItem(SCAN_KEY, JSON.stringify(obj));
      } catch (e) { /* ignore */ }

      setStreetScans(updatedScans);
    }
  }, [scannedHouseId]);

  // 5 Scan Checkpoints State for Vehicle Mode (Scans 1 to 5 updated one by one per scanned QR checkpoint)
  const [streetScans, setStreetScans] = useState<StreetScanPoint[]>(() => [
    { id: 1, label: 'Scan 1', taLabel: 'ஸ்கேன் 1', locationName: 'Point 1 QR', taLocationName: 'புள்ளி 1 QR', isScanned: false },
    { id: 2, label: 'Scan 2', taLabel: 'ஸ்கேன் 2', locationName: 'Point 2 QR', taLocationName: 'புள்ளி 2 QR', isScanned: false },
    { id: 3, label: 'Scan 3', taLabel: 'ஸ்கேன் 3', locationName: 'Point 3 QR', taLocationName: 'புள்ளி 3 QR', isScanned: false },
    { id: 4, label: 'Scan 4', taLabel: 'ஸ்கேன் 4', locationName: 'Point 4 QR', taLocationName: 'புள்ளி 4 QR', isScanned: false },
    { id: 5, label: 'Scan 5', taLabel: 'ஸ்கேன் 5', locationName: 'Point 5 QR', taLocationName: 'புள்ளி 5 QR', isScanned: false },
  ]);

  // Compute vehicle coverage state
  const completedScansCount = streetScans.filter(s => s.isScanned).length;

  // Reset all 5 checkpoints to Pending X
  const handleResetAllScans = () => {
    const freshScans: StreetScanPoint[] = [
      { id: 1, label: 'Scan 1', taLabel: 'ஸ்கேன் 1', locationName: 'Point 1 QR', taLocationName: 'புள்ளி 1 QR', isScanned: false },
      { id: 2, label: 'Scan 2', taLabel: 'ஸ்கேன் 2', locationName: 'Point 2 QR', taLocationName: 'புள்ளி 2 QR', isScanned: false },
      { id: 3, label: 'Scan 3', taLabel: 'ஸ்கேன் 3', locationName: 'Point 3 QR', taLocationName: 'புள்ளி 3 QR', isScanned: false },
      { id: 4, label: 'Scan 4', taLabel: 'ஸ்கேன் 4', locationName: 'Point 4 QR', taLocationName: 'புள்ளி 4 QR', isScanned: false },
      { id: 5, label: 'Scan 5', taLabel: 'ஸ்கேன் 5', locationName: 'Point 5 QR', taLocationName: 'புள்ளி 5 QR', isScanned: false },
    ];
    setStreetScans(freshScans);
    if (formData.streetName) {
      try {
        const SCAN_KEY = 'ccmc_street_5scans';
        const raw = localStorage.getItem(SCAN_KEY);
        const obj = raw ? JSON.parse(raw) : {};
        obj[formData.streetName] = freshScans;
        localStorage.setItem(SCAN_KEY, JSON.stringify(obj));
      } catch (e) { /* ignore */ }
    }
  };

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

  // Sync streetScans to localStorage whenever updated
  useEffect(() => {
    if (!formData.streetName) return;
    try {
      const SCAN_KEY = 'ccmc_street_5scans';
      const raw = localStorage.getItem(SCAN_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      obj[formData.streetName] = streetScans;
      localStorage.setItem(SCAN_KEY, JSON.stringify(obj));
    } catch (e) { /* ignore */ }
  }, [streetScans, formData.streetName]);

  const [scanWarnMsg, setScanWarnMsg] = useState<string | null>(null);

  const handleToggleFormScanPoint = (scanId: number) => {
    const liveTime = getLiveScanTimeStr();
    setStreetScans(prev => {
      const updated = prev.map(sc => {
        if (sc.id === scanId) {
          const nextState = !sc.isScanned;
          playChimeTone(nextState ? 'success' : 'warning');
          return {
            ...sc,
            isScanned: nextState,
            scannedAt: nextState ? liveTime : undefined
          };
        }
        return sc;
      });
      return updated;
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [editToast, setEditToast] = useState<string | null>(null);

  // Scan-lock: check if this houseId has already been submitted
  const SCAN_LOCK_KEY = 'ccmc_scanned_addresses';
  const getScanLocked = (hId: string) => {
    try {
      const raw = localStorage.getItem(SCAN_LOCK_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return obj[hId] || null;
    } catch { return null; }
  };
  const [scanLockedData, setScanLockedData] = useState<any>(() => getScanLocked(cleanHouseId(scannedHouseId)));
  const isAlreadyScanned = false; // allow viewing live page

  // GPS Telemetry
  const [gpsLat, setGpsLat] = useState<number>(11.01684);
  const [gpsLng, setGpsLng] = useState<number>(76.95582);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(3.2);
  const [gpsLocationName, setGpsLocationName] = useState<string>('Kamaraj Salai, Coimbatore');
  const [gpsStatus, setGpsStatus] = useState<'acquiring' | 'locked' | 'live'>('locked');

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

    let finalCoverageStatus: CoverageStatus = formData.coverageStatus;
    if (!isPushCart) {
      if (completedScansCount === 5) {
        finalCoverageStatus = 'Covered';
      } else if (completedScansCount === 4) {
        finalCoverageStatus = 'Partially Covered';
      } else {
        finalCoverageStatus = 'Not Covered';
      }
    }

    let finalDoorNo = formData.doorNo ? formData.doorNo.trim() : '';
    if (!finalDoorNo) {
      if (isPushCart) {
        finalDoorNo = lang === 'ta' ? 'விருப்பத்திற்குரியது (Pushcart)' : 'Optional (Pushcart)';
      } else {
        finalDoorNo = "45";
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
      householderName: formData.householderName || "Ramanathan",
      householderContact: formData.householderContact || "9840123456",
      streetName: formData.streetName || "Kamaraj Salai",
      doorNo: finalDoorNo,
      coverageStatus: finalCoverageStatus,
      notCoveredReason: finalCoverageStatus === 'Not Covered' ? 'Other' : undefined,
      remarks: formData.remarks || `${completedScansCount}/5 QR Checkpoints Scanned (${finalCoverageStatus})`,
      latitude: gpsLat,
      longitude: gpsLng,
      gpsCoordinates: `${gpsLat.toFixed(5)}° N, ${gpsLng.toFixed(5)}° E`,
      locationName: gpsLocationName,
      gpsAccuracy: gpsAccuracy,
      gpsTimestamp: timestampStr,
      assignedVehicleId: assignedVehicleId || 'v-tata-ace',
      vehicleNo: formData.vehicleType ? (assignedVehicleId || 'TN66AD6465') : 'TN66AD6465',
      vehicleType: formData.vehicleType || 'TATA ACE',
      completedScansCount: completedScansCount,
      streetScans: streetScans,
      submittedAt: timestampStr
    };

    onSubmitSuccess(fallbackRecord, finalCoverageStatus);
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 w-full relative font-sans">
      
      {/* ── TOP GREEN CCMC HEADER (Image 1 Exact Layout) ── */}
      <div className="bg-[#044D29] px-3 sm:px-4 py-2 border-b border-[#033A1F] sticky top-0 z-30 shadow-md text-white">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Back button + CM Stalin + CCMC Emblem + Titles */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onBackToScanner}
              className="w-8 h-8 rounded-full bg-[#02381C] hover:bg-[#012713] text-white flex items-center justify-center border border-emerald-600/40 shadow-xs cursor-pointer active:scale-95 flex-shrink-0"
              title="Back to Scanner"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>

            {/* CM Stalin Photo */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-amber-400 bg-amber-500/20 shadow-xs flex-shrink-0 flex items-center justify-center">
              <img
                src={cmPhoto}
                alt="Hon'ble Chief Minister"
                referrerPolicy="no-referrer"
                onError={(e) => { if (e.currentTarget.src !== cmFallbackPhoto) e.currentTarget.src = cmFallbackPhoto; }}
                className="w-full h-full object-cover object-top scale-110"
              />
            </div>

            {/* CCMC Emblem */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-amber-400 bg-white p-0.5 shadow-xs flex-shrink-0 flex items-center justify-center">
              <img
                src={ccmcLogo}
                alt="Coimbatore City Municipal Corporation Emblem"
                referrerPolicy="no-referrer"
                onError={(e) => { if (e.currentTarget.src !== ccmcFallbackLogo) e.currentTarget.src = ccmcFallbackLogo; }}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Municipal Title */}
            <div className="min-w-0 flex flex-col justify-center leading-none">
              <div className="text-[12px] sm:text-sm font-black tracking-tight text-[#FFEB3B] truncate leading-tight drop-shadow-xs">
                Coimbatore City
              </div>
              <div className="text-[11px] sm:text-xs font-black tracking-tight text-[#FFEB3B] truncate leading-tight mt-0.5 drop-shadow-xs">
                Municipal Corporation
              </div>
              <div className="text-[10px] sm:text-[11px] font-black tracking-wider text-[#00E5FF] uppercase leading-tight mt-0.5 drop-shadow-xs">
                SANITARY FIELD WORKER
              </div>
            </div>
          </div>

          {/* Right: Language Pill */}
          <div className="bg-[#02381C] border border-emerald-600/40 rounded-full p-0.5 flex items-center shadow-xs flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                if (onSetLanguage) onSetLanguage('ta');
                else if (lang !== 'ta' && onToggleLang) onToggleLang();
              }}
              className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                lang === 'ta'
                  ? 'bg-[#FF9E00] text-slate-950 shadow-xs'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
              }`}
            >
              <Globe className={`w-3 h-3 ${lang === 'ta' ? 'text-slate-950' : 'text-emerald-300'}`} />
              <span>தமிழ்</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (onSetLanguage) onSetLanguage('en');
                else if (lang !== 'en' && onToggleLang) onToggleLang();
              }}
              className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black transition-all cursor-pointer ${
                lang === 'en'
                  ? 'bg-[#FF9E00] text-slate-950 shadow-xs'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
              }`}
            >
              <span>English</span>
            </button>
          </div>
        </div>

        {/* Subheader Pill Bar (Field Officer | KAMARAJ SALAI | ICCC Live) */}
        <div className="mt-2 pt-1.5 border-t border-emerald-800/60 flex items-center justify-between gap-1.5 text-[11px] font-bold">
          <div className="bg-[#02381C] text-white px-3 py-0.5 rounded-full border border-emerald-600/40 flex items-center gap-1.5 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Field Officer: Karthik Muthusamy</span>
          </div>

          <div className="bg-white text-[#044D29] px-4 py-0.5 rounded-full shadow-sm font-black text-xs uppercase tracking-wider font-mono mx-auto flex-shrink-0">
            {formData.streetName || 'KAMARAJ SALAI'}
          </div>

          <div className="bg-[#02381C] text-white px-3 py-0.5 rounded-full border border-emerald-600/40 flex items-center gap-1.5 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>ICCC Live</span>
          </div>
        </div>
      </div>

      {/* Main Form Area */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 text-xs text-slate-800 pb-28">
        
        {/* Toast feedback */}
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

        {/* FIRST CARD: Location & Resident Summary */}
        <div className="bg-white p-4 rounded-3xl border-2 border-emerald-300 shadow-sm space-y-3">
          {/* Header row with badges & action buttons */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 text-[#00875A] flex items-center justify-center font-black text-sm flex-shrink-0">
                <MapPin className="w-4 h-4 text-[#00875A]" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="bg-[#00875A] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-2xs uppercase">
                  {formData.vehicleType || 'TATA ACE'}
                </span>
                <span className="bg-[#8B5CF6] text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                  {formData.zone || 'East Zone'}
                </span>
                <span className="bg-[#FEF08A] text-slate-900 border border-amber-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                  {formData.ward || 'Ward 12'}
                </span>
              </div>
            </div>

            {/* Action buttons: Edit & Details */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowMoreDetails(true)}
                className="bg-[#00875A] hover:bg-[#00704A] text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition active:scale-95"
              >
                <Pencil className="w-3.5 h-3.5 text-white" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMoreDetails(true)}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-2xs flex items-center space-x-1.5 cursor-pointer transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
                <span>Details</span>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {formData.streetName || 'Kamaraj Salai'}
              </h3>
              {formData.doorNo && !formData.doorNo.toLowerCase().includes('optional') && !formData.doorNo.includes('விருப்பத்திற்குரியது') ? (
                <span className="text-xs font-mono font-extrabold text-[#044D29] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  Door #{formData.doorNo}
                </span>
              ) : isPushCart ? (
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/80">
                  {lang === 'ta' ? 'கதவு எண்: விருப்பத்திற்குரியது (Pushcart)' : 'Door No: Optional (Pushcart)'}
                </span>
              ) : null}
            </div>
            <p className="text-xs text-slate-600 font-medium flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>{formData.householderName || 'Ramanathan'}</span>
              <span className="text-slate-400">•</span>
              <span className="font-mono text-slate-700">{formData.householderContact || '9840123456'}</span>
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Officers: SI {formData.siName || 'K. Rajan'} ({formData.siContact || '9876543210'}) • Driver {formData.driverWorkerName || 'P. Murugan'}
            </p>
          </div>
        </div>

        {/* SECOND CARD: STREET COVERAGE STATUS (VEHICLE / PUSHCART) */}
        {isPushCart ? (
          <div className="bg-white p-4 rounded-3xl border-2 border-emerald-300 shadow-sm space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                  {lang === 'ta' ? 'சேகரிப்பு நிலை (புஷ்கார்ட்)' : 'COVERAGE STATUS (PUSHCART)'}
                </h4>
              </div>
              <span className={`text-xs font-black px-3 py-1 rounded-full border ${
                formData.coverageStatus === 'Covered'
                  ? 'bg-emerald-100 text-[#00875A] border-emerald-300'
                  : 'bg-[#FFEAEA] text-[#DC2626] border-red-200'
              }`}>
                {formData.coverageStatus === 'Covered'
                  ? (lang === 'ta' ? 'சேகரிக்கப்பட்டது ✓' : 'Covered ✓')
                  : (lang === 'ta' ? 'சேகரிக்கப்படவில்லை ✕' : 'Not Covered ✕')}
              </span>
            </div>

            {/* Subheader Instruction */}
            <div className="border-t border-slate-100 pt-2 text-xs font-bold text-slate-600 flex items-center justify-between">
              <span>{lang === 'ta' ? 'புஷ்கார்ட் குப்பை சேகரிப்பு நிலையைத் தேர்ந்தெடுக்கவும்:' : 'Select Pushcart Waste Collection Status:'}</span>
              <span className="text-[11px] text-slate-400 font-mono">Tap option</span>
            </div>

            {/* Covered / Not Covered Cards Selection */}
            <div className="grid grid-cols-2 gap-3">
              {/* Option 1: Covered */}
              <button
                type="button"
                onClick={() => {
                  playChimeTone('success');
                  setFormData(prev => ({ ...prev, coverageStatus: 'Covered', notCoveredReason: undefined }));
                }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition active:scale-95 cursor-pointer text-center ${
                  formData.coverageStatus === 'Covered'
                    ? 'bg-[#E6F4EA] border-[#00D084] text-[#00875A] shadow-sm ring-2 ring-[#00D084]/40'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-emerald-50/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1.5 font-black text-white ${
                  formData.coverageStatus === 'Covered' ? 'bg-[#00A86B]' : 'bg-slate-400'
                }`}>
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <span className="text-sm font-black leading-tight">
                  {lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'Covered'}
                </span>
                <span className="text-[11px] font-bold text-emerald-700 mt-0.5">
                  100% {lang === 'ta' ? 'நிறைவு' : 'Completed'}
                </span>
              </button>

              {/* Option 2: Not Covered */}
              <button
                type="button"
                onClick={() => {
                  playChimeTone('warning');
                  setFormData(prev => ({ ...prev, coverageStatus: 'Not Covered', notCoveredReason: 'Other' as NotCoveredReason }));
                }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition active:scale-95 cursor-pointer text-center ${
                  formData.coverageStatus === 'Not Covered'
                    ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B] shadow-sm ring-2 ring-[#EF4444]/40'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-rose-50/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1.5 font-black text-white ${
                  formData.coverageStatus === 'Not Covered' ? 'bg-[#EF4444]' : 'bg-slate-400'
                }`}>
                  <X className="w-6 h-6 stroke-[3]" />
                </div>
                <span className="text-sm font-black leading-tight">
                  {lang === 'ta' ? 'சேகரிக்கப்படவில்லை' : 'Not Covered'}
                </span>
                <span className="text-[11px] font-bold text-rose-700 mt-0.5">
                  0% {lang === 'ta' ? 'விடுபட்டது' : 'Missed'}
                </span>
              </button>
            </div>

            {/* Reason selector if Not Covered */}
            {formData.coverageStatus === 'Not Covered' && (
              <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-3 space-y-2 animate-fadeIn">
                <label className="block text-[11px] font-black text-rose-900">
                  {lang === 'ta' ? 'சேகரிக்கப்படாததற்கான காரணம்:' : 'Reason for Not Covered:'}
                </label>
                <select
                  value={formData.notCoveredReason || 'Other'}
                  onChange={(e) => setFormData({ ...formData, notCoveredReason: e.target.value as NotCoveredReason })}
                  className="w-full bg-white border border-rose-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="Door Closed">{lang === 'ta' ? 'வீடு பூட்டப்பட்டுள்ளது (Door Closed)' : 'House Closed / Lockout'}</option>
                  <option value="Segregation Issue">{lang === 'ta' ? 'கழிவு பிரிக்கப்படவில்லை (Segregation Issue)' : 'Unsegregated Waste Refusal'}</option>
                  <option value="Road Block">{lang === 'ta' ? 'பாதை அடைப்பு (Road Block)' : 'Narrow Lane / Obstacle'}</option>
                  <option value="Other">{lang === 'ta' ? 'மற்ற காரணங்கள் (Other Reason)' : 'Other Reason'}</option>
                </select>
                <input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder={lang === 'ta' ? 'கூடுதல் விவரங்கள் / குறிப்பு உள்ளிடவும்...' : 'Enter additional remarks / details...'}
                  className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                />
              </div>
            )}

            {/* Bottom Alert Banner for Pushcart */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
              formData.coverageStatus === 'Covered'
                ? 'bg-emerald-50 border-emerald-200 text-[#00875A]'
                : 'bg-[#FFEAEA] border-[#FCA5A5] text-[#991B1B]'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-black text-white ${
                  formData.coverageStatus === 'Covered' ? 'bg-[#00A86B]' : 'bg-[#DC2626]'
                }`}>
                  {formData.coverageStatus === 'Covered' ? '✓' : '!'}
                </div>
                <div>
                  <h5 className="text-sm font-black leading-tight">
                    {formData.coverageStatus === 'Covered'
                      ? (lang === 'ta' ? 'தெரு சேகரிக்கப்பட்டது (Covered)' : 'STREET COVERED (PUSHCART)')
                      : (lang === 'ta' ? 'சேகரிக்கப்படவில்லை (Not Covered)' : 'NOT COVERED (PUSHCART)')}
                  </h5>
                  <p className="text-xs font-semibold opacity-90 mt-0.5">
                    {formData.coverageStatus === 'Covered'
                      ? (lang === 'ta' ? 'புஷ்கார்ட் மூலம் அனைத்துக் குப்பைகளும் சேகரிக்கப்பட்டது ✓' : 'Pushcart door-to-door collection complete ✓')
                      : (lang === 'ta' ? 'குப்பை சேகரிப்பு விடுபட்டது ⚠️' : 'Waste collection incomplete or missed ⚠️')}
                  </p>
                </div>
              </div>

              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                formData.coverageStatus === 'Covered' ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
              }`} />
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-3xl border-2 border-emerald-300 shadow-sm space-y-3.5">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                  STREET COVERAGE STATUS (VEHICLE)
                </h4>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                completedScansCount === 5
                  ? 'bg-emerald-100 text-[#00875A] border-emerald-300'
                  : completedScansCount === 4
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-[#FFEAEA] text-[#DC2626] border-red-200'
              }`}>
                {completedScansCount === 5 ? 'Covered' : completedScansCount === 4 ? 'Partially Covered' : 'Not Covered'}
              </span>
            </div>

            {/* Subheader */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
              <div className="flex items-center space-x-1.5 text-xs font-black text-slate-800">
                <QrCode className="w-4 h-4 text-[#00875A]" />
                <span>5 Street QR Checkpoints ({completedScansCount}/5 Scanned)</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleResetAllScans()}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-0.5 rounded-lg border border-rose-200 transition cursor-pointer"
                  title="Reset all 5 checkpoints to Pending X"
                >
                  Reset Scans
                </button>
                <span className="text-[11px] text-slate-400 font-mono">Tap to toggle</span>
              </div>
            </div>

            {/* 5 Checkpoints Grid */}
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {streetScans.map((scan) => {
                const isDone = scan.isScanned;
                return (
                  <div
                    key={scan.id}
                    onClick={() => handleToggleFormScanPoint(scan.id)}
                    className={`flex flex-col items-center justify-center py-3 px-1 rounded-2xl border-2 text-center select-none cursor-pointer transition active:scale-95 ${
                      isDone
                        ? 'bg-[#E6F4EA] border-[#00D084] text-slate-900 shadow-2xs'
                        : 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
                    }`}
                    title={`Tap to toggle Scan ${scan.id}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black mb-1 shadow-2xs ${
                      isDone
                        ? 'bg-[#00A86B] text-white'
                        : 'bg-[#EF4444] text-white'
                    }`}>
                      {isDone ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <X className="w-4 h-4 stroke-[3]" />
                      )}
                    </div>
                    <span className="text-xs font-black truncate w-full leading-tight text-slate-900">
                      Scan {scan.id}
                    </span>
                    <span className={`text-[11px] font-bold mt-0.5 leading-tight ${
                      isDone ? 'text-[#00A86B] font-mono' : 'text-[#DC2626]'
                    }`}>
                      {isDone ? (scan.scannedAt || 'Done ✓') : 'Pending X'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Alert Banner inside Second Card */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
              completedScansCount === 5
                ? 'bg-emerald-50 border-emerald-200 text-[#00875A]'
                : completedScansCount === 4
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-[#FFEAEA] border-[#FCA5A5] text-[#991B1B]'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-black text-white ${
                  completedScansCount === 5
                    ? 'bg-[#00A86B]'
                    : completedScansCount === 4
                    ? 'bg-amber-600'
                    : 'bg-[#DC2626]'
                }`}>
                  {completedScansCount === 5 ? '✓' : '!'}
                </div>
                <div>
                  <h5 className="text-sm font-black leading-tight text-[#C53030]">
                    {completedScansCount === 5
                      ? 'STREET COVERED (5/5 CHECKPOINTS)'
                      : completedScansCount === 4
                      ? 'PARTIALLY COVERED (4/5 CHECKPOINTS)'
                      : `NOT COVERED (${completedScansCount}/5 CHECKPOINTS)`}
                  </h5>
                  <p className="text-xs font-semibold text-[#991B1B] mt-0.5">
                    {completedScansCount === 5
                      ? 'All 5 checkpoints scanned • 100% Covered ✓'
                      : `${5 - completedScansCount} or fewer checkpoints scanned • Not Covered ⚠️ (${5 - completedScansCount} checkpoint(s) pending)`}
                  </p>
                </div>
              </div>

              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                completedScansCount === 5 ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
              }`} />
            </div>
          </div>
        )}

        {/* STICKY BOTTOM BUTTON (Image 2 Exact Layout) */}
        <div className="pt-2 sticky bottom-0 z-30 pb-3 bg-white/90 backdrop-blur-xs">
          <button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            disabled={isSubmitting}
            className={`w-full text-white font-black py-4 px-4 rounded-2xl text-sm sm:text-base transition shadow-xl flex items-center justify-center space-x-2 border active:scale-98 cursor-pointer disabled:opacity-60 ${
              (isPushCart ? formData.coverageStatus === 'Covered' : completedScansCount === 5)
                ? 'bg-[#00875A] hover:bg-[#00704A] border-emerald-500/40'
                : 'bg-[#B91C1C] hover:bg-[#991B1B] border-red-500/40'
            }`}
          >
            {isSubmitting ? (
              <RefreshCw className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white transform rotate-45" />
            )}
            <span className="font-black text-white text-base">
              {isSubmitting
                ? (lang === 'ta' ? 'சமர்ப்பிக்கப்படுகிறது...' : 'Submitting Status...')
                : isPushCart
                ? formData.coverageStatus === 'Covered'
                  ? (lang === 'ta' ? 'சேகரிக்கப்பட்டது நிலை சமர்ப்பி (Submit Covered)' : 'Submit Covered Status (Pushcart)')
                  : (lang === 'ta' ? '⚠️ சேகரிக்கப்படவில்லை நிலை சமர்ப்பி' : '⚠️ Submit Not Covered Status (Pushcart)')
                : completedScansCount === 5
                ? 'Submit Street Covered Status (5/5 Done)'
                : `⚠️ Submit Not Covered Status (${completedScansCount}/5 Done)`}
            </span>
          </button>
        </div>

      </form>

      {/* EDIT HOUSEHOLD & OFFICER DETAILS MODAL (Image 3 & Image 4 Exact Layout) */}
      {showMoreDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border-2 border-emerald-500 rounded-[28px] max-w-[640px] w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-scaleIn">

            {/* Modal Header */}
            <div className="bg-[#166534] text-white px-4 py-3 flex items-center justify-between border-b border-emerald-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Pencil className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">
                    ✏️ Edit Household &amp; Officer Details
                  </h3>
                  <p className="text-xs font-semibold text-emerald-100 truncate mt-0.5 font-mono">
                    {formData.houseId || 'HID100101'} • {formData.streetName || 'Kamaraj Salai'} • {formData.ward || 'Ward 12'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreDetails(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: 5 Editable Card Sections */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs text-slate-800 bg-[#F4F6F5]">

              {/* 1. ZONE & WARD */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center space-x-1.5 text-[#166534] font-black text-xs uppercase tracking-wider">
                  <Building2 className="w-4 h-4" />
                  <span>ZONE &amp; WARD</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Zone</label>
                    <select
                      value={formData.zone}
                      onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="East Zone">East Zone</option>
                      <option value="Central Zone">Central Zone</option>
                      <option value="West Zone">West Zone</option>
                      <option value="North Zone">North Zone</option>
                      <option value="South Zone">South Zone</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Ward</label>
                    <select
                      value={formData.ward}
                      onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
              </div>

              {/* 2. SANITARY INSPECTOR (SI) */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center space-x-1.5 text-[#166534] font-black text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>SANITARY INSPECTOR (SI)</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">SI Name</label>
                    <input
                      type="text"
                      value={formData.siName}
                      onChange={(e) => setFormData({ ...formData, siName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="K. Rajan"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">SI Contact</label>
                    <input
                      type="text"
                      value={formData.siContact}
                      onChange={(e) => setFormData({ ...formData, siContact: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="9876543210"
                    />
                  </div>
                </div>
              </div>

              {/* 3. SUPERVISORS (SS & CSS) */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center space-x-1.5 text-[#166534] font-black text-xs uppercase tracking-wider">
                  <User className="w-4 h-4" />
                  <span>SUPERVISORS (SS &amp; CSS)</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">SS Name</label>
                    <input
                      type="text"
                      value={formData.ssName}
                      onChange={(e) => setFormData({ ...formData, ssName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="M. Selvam"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">CSS Name</label>
                    <input
                      type="text"
                      value={formData.cssName}
                      onChange={(e) => setFormData({ ...formData, cssName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="S. Kumar"
                    />
                  </div>
                </div>
              </div>

              {/* 4. DRIVER & VEHICLE */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center space-x-1.5 text-[#166534] font-black text-xs uppercase tracking-wider">
                  <Truck className="w-4 h-4" />
                  <span>DRIVER &amp; VEHICLE</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Vehicle Type</label>
                    <select
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
                    >
                      <option value="TATA ACE">TATA ACE</option>
                      <option value="PUSH CART">PUSH CART</option>
                      <option value="BOV">BOV</option>
                      <option value="COMPACTOR">COMPACTOR</option>
                      <option value="OBL PRIVATE">OBL PRIVATE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Driver Name</label>
                    <input
                      type="text"
                      value={formData.driverWorkerName}
                      onChange={(e) => setFormData({ ...formData, driverWorkerName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="P. Murugan"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Driver Contact</label>
                    <input
                      type="text"
                      value={formData.driverWorkerContact}
                      onChange={(e) => setFormData({ ...formData, driverWorkerContact: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="9876543212"
                    />
                  </div>
                </div>
              </div>

              {/* 5. HOUSEHOLDER INFO & ADDRESS */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center space-x-1.5 text-[#166534] font-black text-xs uppercase tracking-wider">
                  <MapPin className="w-4 h-4" />
                  <span>HOUSEHOLDER INFO &amp; ADDRESS</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Householder</label>
                    <input
                      type="text"
                      value={formData.householderName}
                      onChange={(e) => setFormData({ ...formData, householderName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="Ramanathan"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.householderContact}
                      onChange={(e) => setFormData({ ...formData, householderContact: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="9840123456"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Street Name</label>
                    <input
                      type="text"
                      value={formData.streetName}
                      onChange={(e) => setFormData({ ...formData, streetName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="Kamaraj Salai"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {lang === 'ta' ? 'கதவு எண் (Door No)' : 'Door No'}{' '}
                      {isPushCart ? (
                        <span className="text-amber-600 font-extrabold">
                          ({lang === 'ta' ? 'விருப்பத்திற்குரியது - Pushcart' : 'Optional - Pushcart'})
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">
                          ({lang === 'ta' ? 'கட்டாயம்' : 'Required'})
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={formData.doorNo}
                      onChange={(e) => setFormData({ ...formData, doorNo: e.target.value })}
                      className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-bold text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                        isPushCart ? 'border-amber-300 focus:ring-amber-500' : 'border-slate-300'
                      }`}
                      placeholder={
                        isPushCart
                          ? (lang === 'ta' ? 'விருப்பத்திற்குரியது (Pushcart)...' : 'Optional for Pushcart...')
                          : 'e.g. 45 or 12A'
                      }
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 italic">Changes apply immediately to this entry</span>
              <button
                type="button"
                onClick={() => {
                  setShowMoreDetails(false);
                  setEditToast('✅ Changes saved successfully!');
                  setTimeout(() => setEditToast(null), 3500);
                }}
                className="bg-[#166534] hover:bg-[#113B22] text-white font-black text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-md flex items-center gap-1.5 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save &amp; Apply Changes</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};



