import React, { useState, useRef } from 'react';
import {
  SWMSHouseholdRecord,
  SWMSDashboardStats,
  CoverageStatus,
  SWMSAssignment,
  CheckpointResolveResponse,
} from '../types';
import { SWMSHouseholdFormView } from './SWMSHouseholdFormView';
import { SWMSScannerView } from './SWMSScannerView';
import { DustbinAnimationModal } from './DustbinAnimationModal';
import { SWMSStreetScanQRCard } from './SWMSStreetScanQRCard';
import { SWMSCollectionDashboardView, getVehicleRouteDetails } from './SWMSCollectionDashboardView';
import { SWMSCollectionFormView } from './SWMSCollectionFormView';
import { resolveCheckpoint, uploadScanPhoto } from '../api/client';
import {
  QrCode,
  MapPin,
  Truck,
  User,
  Phone,
  Shield,
  X,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Camera,
  ImagePlus,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface SWMSWorkerAppProps {
  stats: SWMSDashboardStats;
  records: SWMSHouseholdRecord[];
  lang: 'en' | 'ta';
  token?: string | null;
  assignment?: SWMSAssignment | null;
  assignedVehicleId?: string;
  onSetAssignedVehicle?: (vehicleId: string) => void;
  onSetLanguage?: (lang: 'en' | 'ta') => void;
  onOpenLanguageModal?: () => void;
  onOpenVehicleAssignment?: () => void;
  onRefreshData: () => void;
  onRecordCreated?: (newRecord: SWMSHouseholdRecord) => void;
  userName?: string;
  workerInfo?: any;
  onLogout?: () => void;
}

type WorkerTab = 'history' | 'scan' | 'form' | 'collectform' | 'routedetails' | 'qrcard';

export const SWMSWorkerApp: React.FC<SWMSWorkerAppProps> = ({
  stats,
  records,
  lang,
  token,
  assignment,
  assignedVehicleId = 'v-push-cart',
  onSetAssignedVehicle,
  onSetLanguage,
  onOpenLanguageModal,
  onOpenVehicleAssignment,
  onRefreshData,
  onRecordCreated,
  userName = 'Karthik Muthusamy',
  workerInfo,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<WorkerTab>('history');
  const [scannedHouseId, setScannedHouseId] = useState('HID100101');
  const [scannedRouteData, setScannedRouteData] = useState<Record<string, string> | null>(null);
  const [resolution, setResolution] = useState<CheckpointResolveResponse | null>(null);

  // Checkpoint resolution status (used as overlay over the scanner)
  const [scanBusy, setScanBusy] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Bump to force the dashboard to refetch after saves
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

  // Scan evidence photos (captured on the Route Details page after every scan)
  const [scanPhotos, setScanPhotos] = useState<{ id: string; dataUrl: string; status: 'uploading' | 'done' | 'error'; fileName?: string }[]>([]);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const compressImage = (file: File, maxSize = 900): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('Canvas not supported')); return; }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const uploadPhoto = async (id: string, dataUrl: string) => {
    if (!token) {
      setScanPhotos(prev => prev.map(p => (p.id === id ? { ...p, status: 'error' } : p)));
      return;
    }
    try {
      const res = await uploadScanPhoto(token, {
        routeId: scannedRouteData?.routeId,
        streetName: scannedRouteData?.streetName,
        photoBase64: dataUrl,
        contentType: 'image/jpeg',
      });
      if (res?.success && res.fileName) {
        setScanPhotos(prev => prev.map(p => (p.id === id ? { ...p, status: 'done', fileName: res.fileName } : p)));
      } else {
        setScanPhotos(prev => prev.map(p => (p.id === id ? { ...p, status: 'error' } : p)));
      }
    } catch {
      setScanPhotos(prev => prev.map(p => (p.id === id ? { ...p, status: 'error' } : p)));
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    for (const file of files) {
      let dataUrl = '';
      try {
        dataUrl = await compressImage(file);
      } catch {
        continue;
      }
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setScanPhotos(prev => [...prev, { id, dataUrl, status: 'uploading' }]);
      void uploadPhoto(id, dataUrl);
    }
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const removePhoto = (id: string) => setScanPhotos(prev => prev.filter(p => p.id !== id));

  // Animation Modal state (legacy household form flow)
  const [isAnimationOpen, setIsAnimationOpen] = useState(false);
  const [lastSubmittedRecord, setLastSubmittedRecord] = useState<SWMSHouseholdRecord | null>(null);
  const [submittedStatus, setSubmittedStatus] = useState<CoverageStatus>('Covered');

  const toggleLanguage = () => {
    if (onSetLanguage) {
      onSetLanguage(lang === 'en' ? 'ta' : 'en');
    }
  };

  // Handle Scan completion: validate vehicle match & route directly to Officer Scan Page
  const handleScanComplete = async (scannedText: string) => {
    setScanError(null);

    const assignedKey = assignment?.vehicleNumber || assignedVehicleId || userName || 'YOGARAJ';
    const assignedRoute = getVehicleRouteDetails(assignedKey);

    let scannedVehNo = '';
    let scannedStreetName = '';

    try {
      const parsed = JSON.parse(scannedText);
      if (parsed && (parsed.type === 'SWMS_STREET_SCAN' || parsed.vehicleNo || parsed.streetName)) {
        scannedVehNo = parsed.vehicleNo || '';
        scannedStreetName = parsed.streetName || '';

        const cleanAssignedVeh = (assignedRoute.vehicleNo || '').replace(/[\s\-_]/g, '').toUpperCase();
        const cleanScannedVeh = (scannedVehNo || '').replace(/[\s\-_]/g, '').toUpperCase();

        const cleanAssignedStreet = (assignedRoute.streetName || '').replace(/[\s\-_]/g, '').toUpperCase();
        const cleanScannedStreet = (scannedStreetName || '').replace(/[\s\-_]/g, '').toUpperCase();

        const isMatch = (cleanScannedVeh && cleanAssignedVeh.includes(cleanScannedVeh)) ||
                        (cleanScannedVeh && cleanScannedVeh.includes(cleanAssignedVeh)) ||
                        (cleanScannedStreet && cleanAssignedStreet.includes(cleanScannedStreet)) ||
                        (cleanScannedStreet && cleanScannedStreet.includes(cleanAssignedStreet));

        if (!isMatch) {
          // MISMATCH DETECTED!
          const errorMsg = lang === 'ta'
            ? `🚫 வாகன முரண்பாடு எச்சரிக்கை (QR Mismatch Alert)!\n\n• நீங்கள் ஒதுக்கப்பட்டுள்ள வாகனம்: ${assignedRoute.streetName} (${assignedRoute.vehicleNo})\n• நீங்கள் ஸ்கேன் செய்த QR: ${(scannedStreetName || 'வெவ்வேறு பகுதி').toUpperCase()} (${scannedVehNo || 'வெவ்வேறு வாகனம்'})\n\nதயவுசெய்து உங்கள் வாகனத்திற்குரிய (${assignedRoute.vehicleNo}) QR குறியீட்டை மட்டும் ஸ்கேன் செய்யவும்!`
            : `🚫 Vehicle QR Mismatch Alert!\n\n• Your Assigned Vehicle: ${assignedRoute.streetName} (${assignedRoute.vehicleNo})\n• Scanned QR: ${(scannedStreetName || 'Different Route').toUpperCase()} (${scannedVehNo || 'Different Vehicle'})\n\nPlease scan your assigned vehicle's (${assignedRoute.vehicleNo}) QR code only!`;

          setScanError(errorMsg);
          return;
        }

        setScannedRouteData(parsed);
        setActiveTab('routedetails');
        return;
      }
    } catch {
      // Not JSON format
    }

    // Check if raw text QR code contains a different vehicle registration or street name
    const cleanRawText = scannedText.replace(/[\s\-_]/g, '').toUpperCase();
    const cleanAssignedVeh = (assignedRoute.vehicleNo || '').replace(/[\s\-_]/g, '').toUpperCase();

    const otherRouteInfo = getVehicleRouteDetails(scannedText);
    const cleanOtherVeh = (otherRouteInfo.vehicleNo || '').replace(/[\s\-_]/g, '').toUpperCase();

    if (
      otherRouteInfo &&
      cleanOtherVeh !== cleanAssignedVeh &&
      (cleanRawText.includes('TN66') || cleanRawText.includes('PUSHCART') || cleanRawText.includes('AE6121') || cleanRawText.includes('AD6465'))
    ) {
      const errorMsg = lang === 'ta'
        ? `🚫 வாகன முரண்பாடு எச்சரிக்கை (QR Mismatch Alert)!\n\n• நீங்கள் ஒதுக்கப்பட்டுள்ள வாகனம்: ${assignedRoute.streetName} (${assignedRoute.vehicleNo})\n• நீங்கள் ஸ்கேன் செய்த QR: ${otherRouteInfo.streetName} (${otherRouteInfo.vehicleNo})\n\nதயவுசெய்து உங்கள் வாகனத்திற்குரிய (${assignedRoute.vehicleNo}) QR குறியீட்டை மட்டும் ஸ்கேன் செய்யவும்!`
        : `🚫 Vehicle QR Mismatch Alert!\n\n• Your Assigned Vehicle: ${assignedRoute.streetName} (${assignedRoute.vehicleNo})\n• Scanned QR: ${otherRouteInfo.streetName} (${otherRouteInfo.vehicleNo})\n\nPlease scan your assigned vehicle's (${assignedRoute.vehicleNo}) QR code only!`;

      setScanError(errorMsg);
      return;
    }

    const clean = scannedText.trim();
    setScannedHouseId(clean || 'HID100101');
    setActiveTab('form');
  };

  // Bottom SCAN button on the dashboard
  const handleOpenScanner = () => {
    setScanError(null);
    setActiveTab('scan');
  };

  // After a collection record is saved → refresh dashboard when the user returns
  const handleCollectionSaved = () => {
    setDashboardRefreshKey(k => k + 1);
  };

  // Handle legacy Form Submission Success → opens Modal & navigates back to front Area History View
  const handleFormSubmitSuccess = (newRecord: SWMSHouseholdRecord, status: CoverageStatus) => {
    setLastSubmittedRecord(newRecord);
    setSubmittedStatus(status);
    setIsAnimationOpen(true);

    if (onRecordCreated) {
      onRecordCreated(newRecord);
    }
    onRefreshData();
  };

  return (
    <div className="w-full flex-1 flex flex-col min-h-screen relative bg-white font-sans overflow-hidden">

      {/* App Main Content Stage */}
      <div className="flex-1 overflow-y-auto relative bg-white flex flex-col">

        {/* VIEW 1: FIELD COLLECTION DASHBOARD (LANDING) */}
        {activeTab === 'history' && (
          <SWMSCollectionDashboardView
            lang={lang}
            token={token ?? null}
            assignment={assignment}
            records={records}
            userName={userName}
            workerInfo={workerInfo}
            onLogout={onLogout}
            onOpenScanner={handleOpenScanner}
            onOpenStreetCoverageView={() => setActiveTab('form')}
            onToggleLang={toggleLanguage}
            onOpenVehicleAssignment={onOpenVehicleAssignment}
            refreshKey={dashboardRefreshKey}
          />
        )}

        {/* VIEW 2: SCANNER PAGE */}
        {activeTab === 'scan' && (
          <div className="flex-1 w-full h-full min-h-full flex flex-col overflow-hidden bg-black relative">
            <SWMSScannerView
              lang={lang}
              onSetLanguage={onSetLanguage}
              onToggleLang={toggleLanguage}
              onScanComplete={(text: string) => { void handleScanComplete(text); }}
              onBackToDashboard={() => setActiveTab('history')}
            />

            {/* ── RESOLUTION OVERLAY ── */}
            {scanBusy && (
              <div className="absolute inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-8 text-center gap-4">
                <Loader2 className="w-12 h-12 text-[#1E7A38] animate-spin" />
                <div className="text-sm font-black text-white">{lang === 'ta' ? 'சரிபார்க்கிறது...' : 'Resolving checkpoint...'}</div>
                <div className="text-[12px] text-emerald-300 font-mono">{lang === 'ta' ? 'பாதுகாப்பு & சோனை சரிபார்ப்பு' : 'Security & zone validation'}</div>
              </div>
            )}

            {scanError && !scanBusy && (
              <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 text-center gap-4 animate-in fade-in duration-200">
                <div className="w-16 h-16 rounded-full border-2 border-rose-500 bg-rose-950/80 flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-8 h-8 text-rose-400" />
                </div>
                <div className="max-w-md w-full bg-rose-950/60 border-2 border-rose-500/60 rounded-2xl p-5 shadow-2xl space-y-3">
                  <h3 className="text-base font-black text-rose-300 uppercase tracking-wide">
                    {lang === 'ta' ? '🚫 வாகன முரண்பாடு எச்சரிக்கை' : '🚫 Vehicle QR Mismatch Alert'}
                  </h3>
                  <div className="text-xs text-white/90 font-medium whitespace-pre-line text-left leading-relaxed bg-black/60 p-3.5 rounded-xl border border-rose-500/30 font-mono">
                    {scanError}
                  </div>
                </div>
                <div className="flex flex-col gap-2.5 w-full max-w-xs mt-2">
                  <button
                    onClick={() => setScanError(null)}
                    className="w-full flex items-center justify-center gap-2 bg-[#1E7A38] hover:bg-[#166534] text-white font-black text-xs px-4 py-3.5 rounded-xl transition shadow-lg active:scale-95 cursor-pointer border border-emerald-400"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {lang === 'ta' ? 'மீண்டும் ஸ்கேன் செய்யவும்' : 'Scan Assigned Vehicle Again'}
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs px-4 py-3 rounded-xl transition active:scale-95 cursor-pointer"
                  >
                    {lang === 'ta' ? 'டாஷ்போர்டு திரைக்கு செல்' : 'Back to Dashboard'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: POST-SCAN COLLECTION FORM (QR CHECKPOINT FLOW) */}
        {activeTab === 'collectform' && resolution && (
          <div className="flex-1 overflow-y-auto pb-28 h-full">
            <SWMSCollectionFormView
              lang={lang}
              token={token ?? null}
              resolution={resolution}
              onBack={() => setActiveTab('history')}
              onSaved={handleCollectionSaved}
              onNextScan={() => {
                setActiveTab('scan');
                setScanError(null);
              }}
            />
          </div>
        )}

        {/* VIEW 4: LEGACY HOUSEHOLD FORM ENTRY */}
        {activeTab === 'form' && (
          <div className="flex-1 overflow-y-auto pb-28 h-full">
            <SWMSHouseholdFormView
              scannedHouseId={scannedHouseId}
              lang={lang}
              onSetLanguage={onSetLanguage}
              onToggleLang={toggleLanguage}
              assignedVehicleId={assignedVehicleId}
              onBackToScanner={() => setActiveTab('scan')}
              onSubmitSuccess={handleFormSubmitSuccess}
            />
          </div>
        )}

        {/* VIEW 5: ROUTE DETAILS PANEL — shown after scanning a SWMS_STREET_SCAN QR */}
        {activeTab === 'routedetails' && scannedRouteData && (
          <div className="flex-1 overflow-y-auto pb-28">
            <div className="bg-[#1E7A38] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
              <button onClick={() => setActiveTab('history')} className="w-8 h-8 rounded-full bg-[#166534] hover:bg-[#113B22] flex items-center justify-center cursor-pointer border border-emerald-500/30">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="text-center">
                <div className="text-xs font-black tracking-wide">Route Details</div>
                <div className="text-[12px] text-emerald-200">{scannedRouteData.routeId}</div>
              </div>
              <button onClick={() => { setScannedRouteData(null); setActiveTab('history'); }} className="w-8 h-8 rounded-full bg-[#166534] hover:bg-[#113B22] flex items-center justify-center cursor-pointer border border-emerald-500/30">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 bg-white min-h-full">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#1E7A38] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[12px] font-black text-amber-700 uppercase tracking-wide">Street / Zone</div>
                  <div className="text-base font-black text-slate-900">{scannedRouteData.streetName}</div>
                  <div className="text-xs text-slate-500 font-mono">{scannedRouteData.zone} • Ward {scannedRouteData.wardNo}</div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                <Truck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[12px] font-black text-blue-700 uppercase tracking-wide">Vehicle</div>
                  <div className="text-sm font-black text-slate-900">{scannedRouteData.vehicleType}</div>
                  <div className="text-xs text-slate-500 font-mono">{scannedRouteData.vehicleNo}</div>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <User className="w-5 h-5 text-emerald-700 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-[12px] font-black text-emerald-700 uppercase tracking-wide">Sanitary Worker</div>
                  <div className="text-sm font-black text-slate-900">{scannedRouteData.workerName}</div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5"><Phone className="w-3 h-3" /><span className="font-mono">{scannedRouteData.workerContact}</span></div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-[12px] font-black text-slate-600 uppercase tracking-wide">
                  <Shield className="w-3.5 h-3.5" /> Supervisory Chain
                </div>
                {[
                  { role: lang === 'ta' ? 'சுகாதார ஆய்வாளர் (SI)' : 'Sanitary Inspector (SI)', name: scannedRouteData.siName, contact: scannedRouteData.siContact },
                  { role: lang === 'ta' ? 'சுகாதார மேற்பார்வையாளர் (SS)' : 'Sanitary Supervisor (SS)', name: scannedRouteData.ssName, contact: scannedRouteData.ssContact },
                  { role: lang === 'ta' ? 'தலைமை சுகாதார மேற்பார்வையாளர் (CSS)' : 'Chief Sanitary Supervisor (CSS)', name: scannedRouteData.cssName, contact: scannedRouteData.cssContact },
                ].map((entry) => (
                  <div key={entry.role} className="flex items-start justify-between gap-2 border-t border-slate-100 pt-2.5 first:border-0 first:pt-0">
                    <div>
                      <div className="text-sm font-black text-slate-800 leading-tight">{entry.name}</div>
                      <div className="text-[12px] text-slate-500 mt-0.5">{entry.role}</div>
                    </div>
                    <a href={`tel:${entry.contact}`} className="flex items-center gap-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-mono font-bold text-[11px] px-2.5 py-1 rounded-full transition cursor-pointer flex-shrink-0">
                      <Phone className="w-3 h-3" />{entry.contact}
                    </a>
                  </div>
                ))}
              </div>

              {/* ── PROOF PHOTOS (EVIDENCE) — captured after every scan ── */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 bg-sky-50 border-b border-sky-100 px-4 py-2.5">
                  <Camera className="w-4 h-4 text-sky-700" />
                  <span className="text-[11px] font-black uppercase tracking-wide text-sky-800">
                    {lang === 'ta' ? 'சான்று புகைப்படங்கள்' : 'Proof Photos (Evidence)'}
                  </span>
                  <span className="ml-auto text-[11px] font-black text-sky-700">
                    {scanPhotos.length} {lang === 'ta' ? 'புகைப்படம்' : 'photo(s)'}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={scanPhotos.some(p => p.status === 'uploading')}
                    className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl shadow-md active:scale-[0.98] transition cursor-pointer"
                  >
                    <ImagePlus className="w-4.5 h-4.5" />
                    {lang === 'ta' ? '📷 புகைப்படம் எடு / இணை' : '📷 Capture / Attach Photo'}
                  </button>
                  <p className="text-[11px] text-slate-400 font-semibold text-center">
                    {lang === 'ta' ? 'ஒவ்வொரு ஸ்கேனுக்கும் சேகரிப்பு ஆதார புகைப்படத்தை பதிவேற்றவும். புகைப்படங்கள் உடனே சேவையகத்தில் பதிவேற்றப்படும்.' : 'Take an evidence photo of the collection for this scan. Uploads to the server automatically.'}
                  </p>

                  {scanPhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2.5">
                      {scanPhotos.map(photo => (
                        <div key={photo.id} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-50">
                          <img src={photo.dataUrl} alt="scan evidence" className="w-full h-full object-cover" />
                          {photo.status === 'uploading' && (
                            <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1">
                              <Loader2 className="w-5 h-5 text-white animate-spin" />
                              <span className="text-[9px] font-black text-white uppercase">Uploading</span>
                            </div>
                          )}
                          {photo.status === 'done' && (
                            <div className="absolute inset-x-0 bottom-0 bg-black/55 flex items-center justify-center gap-1 py-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-[9px] font-black text-emerald-300 uppercase">Uploaded</span>
                            </div>
                          )}
                          {photo.status === 'error' && (
                            <div className="absolute inset-0 bg-black/65 flex items-center justify-center gap-1">
                              <XCircle className="w-4 h-4 text-rose-400" />
                              <span className="text-[9px] font-black text-rose-300 uppercase">Failed</span>
                            </div>
                          )}
                          <button
                            onClick={() => removePhoto(photo.id)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center cursor-pointer border border-white/20"
                            aria-label="Remove photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleOpenScanner}
                className="w-full flex items-center justify-center gap-2 bg-[#1E7A38] hover:bg-[#166534] text-white font-black py-3 rounded-2xl shadow-md active:scale-95 transition cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                {lang === 'ta' ? 'மீண்டும் ஸ்கேன் செய்' : 'Scan Next QR'}
              </button>
            </div>
          </div>
        )}

        {/* VIEW 6: QR CARD GENERATOR (Sree Nagar) */}
        {activeTab === 'qrcard' && (
          <div className="flex-1 overflow-y-auto pb-28">
            <div className="bg-[#1E7A38] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
              <button onClick={() => setActiveTab('history')} className="w-8 h-8 rounded-full bg-[#166534] flex items-center justify-center cursor-pointer border border-emerald-500/30">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="text-xs font-black tracking-wide">Sree Nagar QR Card</div>
              <div className="w-8" />
            </div>
            <SWMSStreetScanQRCard lang={lang} />
          </div>
        )}

      </div>

      {/* FLOATING SCAN BUTTON - SHOWN ONLY ON COLLECTION DASHBOARD (DISABLED: SWMSCollectionDashboardView renders its own; this caused a DOUBLED SCAN button) */}
      {false && activeTab === 'history' && (
        <div className="fixed bottom-4 left-0 right-0 z-40 flex items-center justify-center pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-full p-1.5 border border-emerald-300 shadow-2xl flex items-center justify-center">
            <button
              onClick={handleOpenScanner}
              className="flex items-center space-x-2 px-7 py-2.5 rounded-full transition transform active:scale-95 text-white font-black shadow-xl cursor-pointer bg-[#213B22] hover:bg-[#166534] hover:scale-105 ring-4 ring-emerald-500/20"
            >
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center border border-white/40">
                <QrCode className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs tracking-wider uppercase font-black">
                {lang === 'ta' ? 'ஸ்கேன்' : 'SCAN'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* DUSTBIN DROP & NOT COVERED ANIMATION MODAL (legacy household flow) */}
      <DustbinAnimationModal
        isOpen={isAnimationOpen}
        coverageStatus={submittedStatus}
        houseId={lastSubmittedRecord?.houseId || scannedHouseId}
        doorNo={lastSubmittedRecord?.doorNo || '45'}
        streetName={lastSubmittedRecord?.streetName || 'Kamaraj Salai'}
        gpsCoordinates={lastSubmittedRecord?.gpsCoordinates}
        locationName={lastSubmittedRecord?.locationName}
        latitude={lastSubmittedRecord?.latitude}
        longitude={lastSubmittedRecord?.longitude}
        ward={lastSubmittedRecord?.ward}
        lang={lang}
        assignedVehicleId={assignedVehicleId}
        onClose={() => {
          setIsAnimationOpen(false);
          setActiveTab('history');
        }}
        onNextScan={() => {
          setIsAnimationOpen(false);
          setActiveTab('scan');
        }}
      />

    </div>
  );
};