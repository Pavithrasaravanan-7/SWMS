import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Zap, 
  ZapOff, 
  QrCode, 
  ArrowLeft, 
  CheckCircle2, 
  SwitchCamera, 
  RefreshCw, 
  Sparkles, 
  Volume2, 
  VolumeX,
  Navigation,
  MapPin,
  Globe
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { cmPhoto, cmFallbackPhoto, ccmcLogo, ccmcFallbackLogo } from '../constants/branding';
import { ICCCLiveBadge } from './ICCCLiveBadge';

interface SWMSScannerViewProps {
  lang?: 'en' | 'ta';
  onSetLanguage?: (lang: 'en' | 'ta') => void;
  onToggleLang?: () => void;
  onScanComplete: (houseId: string) => void;
  onBackToDashboard?: () => void;
}

// Play pleasant PhonePe / GPay style scan chime using Web Audio API
const playGPayChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc1.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
    gain1.gain.setValueAtTime(0.25, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.18);

    // Tone 2 (Higher success ping)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1760, ctx.currentTime + 0.08); // A6
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.28);
  } catch (e) {
    console.warn('Audio feedback error:', e);
  }
};

export const SWMSScannerView: React.FC<SWMSScannerViewProps> = ({
  lang = 'en',
  onSetLanguage,
  onToggleLang,
  onScanComplete,
  onBackToDashboard
}) => {
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSuccessFlash, setIsSuccessFlash] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'gpay-style-qr-reader';

  // Helper to extract clean House ID from QR payload
  const parseHouseId = (raw: string): string => {
    let text = raw.trim();
    // Handle URL payloads like https://ccmc-qr-swm.onrender.com/form/ST1HOU10
    if (text.includes('/')) {
      const parts = text.split('/');
      text = parts[parts.length - 1].trim();
      if (text.includes('?')) {
        text = text.split('?')[0].trim();
      }
    }
    // If format is like HID100101 or ST1HOU10
    if (text.startsWith('HID') || text.startsWith('ST')) return text;
    // If format is like SBM:Z1:W01:str-01:45:SBM-Z1-W01-STR01-D045
    const parts = text.split(':');
    if (parts.length >= 5) {
      const doorNo = parts[4];
      return `HID100${String(doorNo).padStart(3, '0')}`;
    }
    // If contains HID or HOU inside text
    const match = text.match(/(HID\d+|ST\d+HOU\d+|HOU\d+)/i);
    if (match) return match[0].toUpperCase();
    // Default fallback to text or generate formatted ID
    if (/^\d+$/.test(text)) {
      return `HID100${String(text).padStart(3, '0')}`;
    }
    return text || 'HID100101';
  };

  // Trigger successful scan action
  const handleDecodedCode = (decodedText: string) => {
    if (isSuccessFlash) return; // avoid duplicate triggers
    setIsSuccessFlash(true);
    const houseId = parseHouseId(decodedText);
    setScannedResult(houseId);

    // Audio & Haptic feedback (PhonePe / GPay vibe)
    if (soundEnabled) {
      playGPayChime();
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([60, 40, 60]);
    }

    // Stop scanner and transition directly to Household Form View
    setTimeout(() => {
      stopCamera();
      onScanComplete(houseId);
    }, 350);
  };

  // Start Camera with resilient multi-stage fallback for mobile Android & iOS browsers
  const startCamera = async (facing: 'environment' | 'user' = 'environment') => {
    setCameraError(null);
    setIsCameraActive(false);

    try {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          await scannerRef.current.clear();
        } catch {
          // ignore
        }
      }

      // Check if browser has mediaDevices support
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported on this browser or context.');
      }

      const html5QrCode = new Html5Qrcode(readerElementId);
      scannerRef.current = html5QrCode;

      // Dynamic qrbox to prevent crashes on smaller mobile screens
      const dynamicQrBox = (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const edgeSize = Math.max(140, Math.floor(minEdge * 0.72));
        return { width: edgeSize, height: edgeSize };
      };

      const qrConfig = {
        fps: 15,
        qrbox: dynamicQrBox,
        disableFlip: facing === 'environment'
      };

      // Stage 1: Enumerate device cameras to select the optimal back camera
      let cameras: Array<{ id: string; label: string }> = [];
      try {
        cameras = await Html5Qrcode.getCameras();
      } catch (e) {
        console.warn('getCameras enumeration error:', e);
      }

      if (cameras && cameras.length > 0) {
        let chosenCamera = cameras[0];
        if (facing === 'environment') {
          const backCam = cameras.find((c) =>
            c.label.toLowerCase().includes('back') ||
            c.label.toLowerCase().includes('rear') ||
            c.label.toLowerCase().includes('environment') ||
            c.label.toLowerCase().includes('0')
          );
          // On mobile phones, if no specific label matched, the last camera in the list is usually the primary rear sensor
          chosenCamera = backCam || cameras[cameras.length - 1];
        } else {
          const frontCam = cameras.find((c) =>
            c.label.toLowerCase().includes('front') ||
            c.label.toLowerCase().includes('user')
          );
          chosenCamera = frontCam || cameras[0];
        }

        try {
          await html5QrCode.start(
            chosenCamera.id,
            qrConfig,
            (decodedText) => handleDecodedCode(decodedText),
            () => {}
          );
          setIsCameraActive(true);
          return;
        } catch (err1) {
          console.warn('Failed to start with enumerated camera ID, trying facingMode constraint:', err1);
        }
      }

      // Stage 2: Direct facingMode constraint
      try {
        await html5QrCode.start(
          { facingMode: facing },
          qrConfig,
          (decodedText) => handleDecodedCode(decodedText),
          () => {}
        );
        setIsCameraActive(true);
        return;
      } catch (err2) {
        console.warn('Direct facingMode failed, trying facingMode ideal fallback:', err2);
      }

      // Stage 3: Flexible facingMode ideal constraint
      try {
        await html5QrCode.start(
          { facingMode: { ideal: facing } },
          qrConfig,
          (decodedText) => handleDecodedCode(decodedText),
          () => {}
        );
        setIsCameraActive(true);
        return;
      } catch (err3) {
        console.warn('facingMode ideal failed, trying other available cameras:', err3);
      }

      // Stage 4: Try each camera in device list
      if (cameras && cameras.length > 0) {
        for (const cam of cameras) {
          try {
            await html5QrCode.start(
              cam.id,
              qrConfig,
              (decodedText) => handleDecodedCode(decodedText),
              () => {}
            );
            setIsCameraActive(true);
            return;
          } catch {
            // continue loop
          }
        }
      }

      throw new Error('All live camera stream attempts failed on this device.');
    } catch (err: unknown) {
      console.warn('Camera auto-start error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission')) {
        setCameraError(
          lang === 'ta'
            ? 'கேமரா அனுமதி தேவைப்படுகிறது. பிரவுசரில் கேமரா அனுமதியை வழங்கவும் அல்லது கீழே உள்ள "போன் கேமரா மூலம் படம் எடு" பொத்தானை அழுத்தவும்.'
            : 'Camera permission is required. Please allow camera access in browser settings, or tap "Take Photo with Phone Camera" below.'
        );
      } else {
        setCameraError(
          lang === 'ta'
            ? 'நேரடி கேமரா ஸ்ட்ரீம் துவங்க முடியவில்லை. உங்கள் போன் கேமரா மூலம் படம் எடுக்க கீழே உள்ள "போன் கேமராவைத் திற" பொத்தானை அழுத்தவும்.'
            : 'Live camera stream is unavailable in this view. Use the "Take Photo with Phone Camera" button below to capture the QR instantly.'
        );
      }
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch {
        // ignore
      }
    }
    setIsCameraActive(false);
  };

  // Auto start camera on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startCamera(cameraFacing);
    }, 200);

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [cameraFacing]);

  // Toggle Torch/Flashlight
  const toggleFlashlight = async () => {
    if (!scannerRef.current || !isCameraActive) return;
    try {
      const videoElem = document.querySelector(`#${readerElementId} video`) as HTMLVideoElement | null;
      if (videoElem && videoElem.srcObject) {
        const stream = videoElem.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.() as { torch?: boolean } | undefined;
        if (capabilities && 'torch' in capabilities) {
          const nextState = !flashlightOn;
          await track.applyConstraints({
            advanced: [{ torch: nextState } as unknown as MediaTrackConstraintSet]
          });
          setFlashlightOn(nextState);
          return;
        }
      }
      setFlashlightOn(!flashlightOn);
    } catch (e) {
      console.warn('Torch not supported on this device:', e);
      setFlashlightOn(!flashlightOn);
    }
  };

  // Flip Camera
  const handleFlipCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-[560px] bg-white text-slate-900 rounded-none overflow-hidden w-full relative">
      {/* Top Header - CCMC Municipal Green with 1st CM Photo Full Height */}
      <div className="bg-[#1E7A38] pl-2 sm:pl-3 lg:pl-4 pr-3.5 sm:pr-4 lg:pr-6 py-2 lg:py-2.5 flex items-center justify-between border-b border-[#166534] shadow-md text-white sticky top-0 z-30 min-h-[56px] lg:min-h-[62px]">
        <div className="flex items-center space-x-2">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="w-8 h-8 bg-[#166534] hover:bg-[#113B22] active:scale-95 text-white rounded-full transition flex items-center justify-center border border-emerald-500/30 shadow-xs cursor-pointer flex-shrink-0"
              title="Back to Dashboard / முதன்மைப் பக்கத்திற்குச் செல்"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
          )}

          {/* 1st: Hon'ble CM Portrait - Full Height rectangular frame */}
          <div 
            className="h-10 w-9 sm:w-10 flex-shrink-0 overflow-hidden border-r-2 border-amber-400 shadow-xs bg-emerald-950 -my-1.5 relative"
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
          <div className="relative flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-full border-2 border-amber-400 shadow-xs overflow-hidden">
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

          {/* Municipal Title - Responsive, Crisp Multi-line Format (Matching Image 1) */}
          <div className="min-w-0 flex flex-col justify-center">
            {/* Line 1: Coimbatore City */}
            <div className="text-[12px] sm:text-sm lg:text-base font-black tracking-tight text-white leading-tight whitespace-nowrap drop-shadow-xs">
              Coimbatore City
            </div>
            {/* Line 2: Municipal Corporation */}
            <div className="text-[11px] sm:text-xs lg:text-[14px] font-black tracking-tight text-amber-300 leading-tight whitespace-nowrap drop-shadow-xs">
              Municipal Corporation
            </div>
            {/* Line 3: Sanitary Field Worker */}
            <div className="text-[9px] sm:text-[10.5px] lg:text-xs font-black tracking-wider text-cyan-300 uppercase leading-tight mt-0.5 whitespace-nowrap drop-shadow-xs">
              {lang === 'ta' ? 'க்யூஆர் ஸ்கேனர்' : 'SANITARY FIELD WORKER'}
            </div>
          </div>
        </div>

        {/* Header Controls: Language Selector, Sound & Flashlight */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
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

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#166534] hover:bg-[#113B22] text-white flex items-center justify-center transition active:scale-95 border border-emerald-500/30 cursor-pointer"
            title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          <button
            onClick={toggleFlashlight}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition flex items-center justify-center border border-emerald-500/30 shadow-xs cursor-pointer active:scale-95 ${
              flashlightOn ? 'bg-amber-400 text-slate-950 shadow-md font-bold' : 'bg-[#166534] hover:bg-[#113B22] text-white'
            }`}
            title="Toggle Flashlight / டார்ச்"
          >
            {flashlightOn ? <Zap className="w-3.5 h-3.5 fill-current" /> : <ZapOff className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Operational Status Sub-Bar: Hidden on mobile & tablet view (< lg), visible only on large desktop */}
      <div className="hidden lg:flex bg-[#113B22] px-2.5 py-1.5 sm:px-4 items-center justify-between text-[9px] sm:text-xs text-emerald-100 font-medium border-t border-emerald-700/50">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex items-center gap-1 bg-[#0A2E17] border border-emerald-400/50 rounded-full px-2 py-0.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
            <span className="text-amber-300 font-black text-[9px] sm:text-[10px] whitespace-nowrap">
              {lang === 'ta' ? 'கள அதிகாரி' : 'Field Officer'}:
            </span>
            <span className="text-white font-bold text-[9px] sm:text-[10px] truncate max-w-[110px] sm:max-w-[180px]">
              Karthik Muthusamy
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <ICCCLiveBadge lang={lang} />
        </div>
      </div>

      {/* Google Pay / PhonePe / Emerald Reticle Camera Stage */}
      <div className="relative flex-1 bg-slate-900 flex flex-col items-center justify-center overflow-hidden min-h-[380px] select-none">
        
        {/* Real-time HTML5 Camera video container */}
        <div 
          id={readerElementId} 
          className="absolute inset-0 w-full h-full object-cover flex items-center justify-center [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
        />

        {/* Translucent Dark Overlay with Emerald Cutout Frame */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between py-5 px-4 z-10">
          
          {/* Top Instruction Pill & GPS Status HUD */}
          <div className="flex flex-col items-center space-y-1.5 max-w-full">
            <div className="bg-white/95 backdrop-blur-md border border-[#1E7A38] shadow-md px-4 py-1.5 rounded-full flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E7A38] animate-ping" />
              <span className="text-xs sm:text-sm font-black tracking-wide text-[#1E7A38]">
                {lang === 'ta' ? 'கதவு QR ஐ கட்டத்தில் வைக்கவும் (Align Door QR)' : 'Align Door QR Code within frame'}
              </span>
            </div>

            <div className="bg-black/60 backdrop-blur-md border border-emerald-400/30 px-3 py-1 rounded-full flex items-center space-x-2 text-[10px] text-emerald-200">
              <Navigation className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span className="font-mono font-bold">11.0168° N, 76.9558° E</span>
              <span className="text-white/40">•</span>
              <span className="font-medium truncate max-w-[140px] sm:max-w-[200px]">Gandhipuram, Ward 12</span>
            </div>
          </div>

          {/* Center Target Box */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            
            {/* 4 Glowing Corner Markers in Municipal Green */}
            <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-[#1E7A38] rounded-tl-2xl shadow-[0_0_15px_#1E7A38]" />
            <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-[#1E7A38] rounded-tr-2xl shadow-[0_0_15px_#1E7A38]" />
            <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-[#1E7A38] rounded-bl-2xl shadow-[0_0_15px_#1E7A38]" />
            <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-[#1E7A38] rounded-br-2xl shadow-[0_0_15px_#1E7A38]" />

            {/* Glowing Laser Scan Line Animation */}
            <div className="absolute left-1 right-1 h-1 bg-[#1E7A38] shadow-[0_0_16px_#1E7A38] animate-[scan_2s_ease-in-out_infinite] z-10" />

            {/* Green QR Center Reticle Target */}
            <div className="w-16 h-16 rounded-full border-2 border-[#1E7A38] bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center shadow-md">
              <div className="relative flex flex-col items-center justify-center">
                <QrCode className="w-7 h-7 text-[#1E7A38]" />
                <span className="text-[8px] font-black text-[#1E7A38] tracking-widest leading-none mt-0.5">QR</span>
              </div>
            </div>

            {/* Success Flash on Detection */}
            {isSuccessFlash && (
              <div className="absolute inset-0 bg-[#1E7A38]/50 rounded-2xl flex flex-col items-center justify-center backdrop-blur-xs transition animate-pulse z-20 shadow-lg">
                <div className="w-16 h-16 rounded-full bg-white text-[#1E7A38] flex items-center justify-center shadow-lg scale-110 transform transition">
                  <CheckCircle2 className="w-10 h-10 text-[#1E7A38] font-black" />
                </div>
                <span className="text-sm font-black text-[#1E7A38] mt-2 bg-white border border-[#1E7A38] px-4 py-1.5 rounded-full shadow-md">
                  {scannedResult || 'QR Scanned!'}
                </span>
              </div>
            )}
          </div>

          {/* Bottom Scanner Toolbar inside Camera View (Clean Minimal Flip Camera Button) */}
          <div className="flex items-center justify-center gap-2 pointer-events-auto z-20 px-2 max-w-full">
            {/* Flip Camera Button */}
            <button
              onClick={handleFlipCamera}
              className="bg-white/90 hover:bg-white border border-slate-200 hover:border-[#1E7A38] shadow-md px-4 py-1.5 sm:py-2 rounded-full transition-all duration-200 active:scale-95 cursor-pointer flex items-center space-x-1.5 text-slate-800 hover:text-[#1E7A38] group backdrop-blur-xs"
              title="Flip Camera / கேமராவை மாற்று"
            >
              <SwitchCamera className="w-3.5 h-3.5 text-[#1E7A38] group-hover:scale-110 transition-transform" />
              <span className="text-[11px] sm:text-xs font-black">
                {cameraFacing === 'environment' ? 'Rear' : 'Front'}
              </span>
            </button>
          </div>
        </div>

        {/* Camera Permission / Error Fallback Screen (Clean White Background) */}
        {cameraError && (
          <div className="absolute inset-0 bg-white z-20 flex flex-col items-center justify-center p-5 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#1E7A38] flex items-center justify-center border-2 border-[#1E7A38] shadow-md">
              <Camera className="w-7 h-7 text-[#1E7A38]" />
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              {lang === 'ta' ? 'கேமரா அனுமதி மற்றும் நிலை' : 'Camera Access Status'}
            </h3>
            <p className="text-xs text-slate-600 max-w-sm leading-relaxed font-medium">
              {cameraError}
            </p>
            <div className="pt-1 w-full max-w-xs">
              <button
                onClick={() => startCamera(cameraFacing)}
                className="w-full bg-[#1E7A38] hover:bg-[#166534] text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-white" />
                <span>{lang === 'ta' ? 'கேமராவை மீண்டும் தொடங்கு' : 'Start Camera'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


