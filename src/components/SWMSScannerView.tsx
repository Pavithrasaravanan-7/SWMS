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
  Globe,
  Play,
  Route
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { cmPhoto, cmFallbackPhoto, ccmcLogo, ccmcFallbackLogo } from '../constants/branding';
import { SREE_NAGAR_QR_PAYLOAD } from './SWMSStreetScanQRCard';

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

  // Start Camera with resilient multi-stage fallback for mobile & laptop webcams
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

      // Stage 1: Enumerate device cameras to select camera
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
          chosenCamera = backCam || cameras[cameras.length - 1] || cameras[0];
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
          console.warn('Failed to start with enumerated camera ID, trying fallback:', err1);
        }
      }

      // Stage 2: Laptop Webcam / Default video constraint (Works on all Laptops!)
      try {
        await html5QrCode.start(
          {},
          qrConfig,
          (decodedText) => handleDecodedCode(decodedText),
          () => {}
        );
        setIsCameraActive(true);
        return;
      } catch (errLaptop) {
        console.warn('Laptop default video start failed:', errLaptop);
      }

      // Stage 3: Direct facingMode constraint
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
        console.warn('Direct facingMode failed:', err2);
      }

      // Stage 4: Try any camera ID
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
            ? 'கேமரா அனுமதி தேவைப்படுகிறது. பிரவுசரில் கேமரா அனுமதியை வழங்கவும் அல்லது கீழே உள்ள "டெஸ்ட் ஸ்கேன்" பொத்தானைப் பயன்படுத்தவும்.'
            : 'Camera permission is required. Please allow camera access in browser settings, or click "Test Scan" below.'
        );
      } else {
        setCameraError(
          lang === 'ta'
            ? 'நேரடி கேமரா கிடைக்கவில்லை. சோதிக்க கீழே உள்ள "டெஸ்ட் ஸ்கேன்" பொத்தானைப் அழுத்தவும்.'
            : 'Live camera stream is unavailable. Click "Test Scan" below to simulate scanning.'
        );
      }
      setIsCameraActive(false);
      // Clean DOM container to remove injected raw html5qrcode SVGs/IMGs
      try {
        const container = document.getElementById(readerElementId);
        if (container) {
          Array.from(container.children).forEach(child => {
            if (child.tagName !== 'VIDEO') child.remove();
          });
        }
      } catch {}
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
    try {
      const container = document.getElementById(readerElementId);
      if (container) {
        Array.from(container.children).forEach(child => {
          if (child.tagName !== 'VIDEO') child.remove();
        });
      }
    } catch {}
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

  // Quick Laptop Test Scan Handler — simulates scanning a QR checkpoint id (e.g. E-SCAN1)
  const handleQuickTestScan = () => {
    const sampleIds = ['E-SCAN1', 'E-SCAN2', 'E-SCAN3', 'E-SCAN4', 'E-SCAN5'];
    const randomQrId = sampleIds[Math.floor(Math.random() * sampleIds.length)];
    handleDecodedCode(randomQrId);
  };

  // Sree Nagar Route Test Scan — simulates scanning the Sree Nagar QR card
  const handleSreeNagarScan = () => {
    handleDecodedCode(SREE_NAGAR_QR_PAYLOAD);
  };

  return (
    <div className="flex flex-col h-full min-h-screen w-full max-w-full bg-black text-white overflow-hidden relative select-none font-sans">
      <style>{`
        #${readerElementId} img,
        #${readerElementId} svg,
        #${readerElementId} canvas,
        #${readerElementId} button,
        #${readerElementId} span,
        #${readerElementId} a,
        #${readerElementId} [id*="__scan_region"] img,
        #${readerElementId} [id*="__scan_region"] svg,
        #${readerElementId} [id*="__dashboard"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          width: 0 !important;
          height: 0 !important;
          pointer-events: none !important;
        }
        #${readerElementId} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block !important;
        }
      `}</style>

      {/* ── 1. TOP BAR ── */}
      <div className="flex-shrink-0 z-30 flex items-center justify-between px-3 py-2 bg-[#121212] border-b border-white/10">
        {/* Back */}
        {onBackToDashboard ? (
          <button
            onClick={onBackToDashboard}
            className="w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center border border-white/20 cursor-pointer active:scale-95 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-9" />
        )}

        {/* Title */}
        <div className="flex-1 text-center">
          <div className="text-xs font-black text-white tracking-wider uppercase">
            {lang === 'ta' ? 'QR ஸ்கேனர்' : 'QR Scanner'}
          </div>
          <div className="text-[10px] text-emerald-400 font-bold tracking-wider">
            CCMC • SWMS
          </div>
        </div>

        {/* Sound + Flash controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center border border-white/20 cursor-pointer active:scale-95 transition"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-white/40" />}
          </button>
          <button
            onClick={toggleFlashlight}
            className={`w-9 h-9 rounded-full flex items-center justify-center border cursor-pointer active:scale-95 transition ${
              flashlightOn
                ? 'bg-amber-400 border-amber-300 text-black'
                : 'bg-white/10 border-white/20 text-white'
            }`}
          >
            {flashlightOn ? <Zap className="w-4 h-4 fill-current" /> : <Zap className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── 2. CAMERA VIEWPORT & OVERLAYS CONTAINER ── */}
      <div className="relative flex-1 w-full flex flex-col justify-between items-center overflow-hidden bg-black py-4 px-4 min-h-0">

        {/* Html5Qrcode video container — hide injected img/buttons to prevent raw camera-off icon bleed */}
        <div
          id={readerElementId}
          className="absolute inset-0 w-full h-full bg-black [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_img]:hidden! [&_button]:hidden! [&_a]:hidden! [&_span]:hidden!"
        />

        {/* Dark vignette overlay */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 60% at 50% 50%, transparent 0%, rgba(0,0,0,0.75) 100%)'
          }}
        />

        {/* Top Status Label / Scanned Result Badge */}
        <div className="z-20 flex flex-col items-center gap-1.5 min-w-0 pointer-events-none mb-2">
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black tracking-wide transition-all shadow-lg ${
            isSuccessFlash
              ? 'bg-[#1E7A38] text-white scale-105'
              : 'bg-white text-[#1E7A38] shadow-md'
          }`}>
            {isSuccessFlash ? (
              <><CheckCircle2 className="w-4 h-4" /> {lang === 'ta' ? 'ஸ்கேன் வெற்றி!' : 'Scan Successful!'}</>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0 animate-ping" />
                <span>{lang === 'ta' ? 'QR கோட்டை கட்டத்தில் வையுங்கள்' : 'Place QR code inside the frame'}</span>
              </>
            )}
          </div>

          {isSuccessFlash && scannedResult && (
            <div className="px-4 py-1.5 rounded-xl bg-black/90 border border-[#1E7A38] text-white shadow-xl">
              <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider text-center">{lang === 'ta' ? 'ஸ்கேன் செய்யப்பட்ட QR' : 'Scanned QR'}</div>
              <div className="text-xs sm:text-sm font-black font-mono tracking-widest text-center mt-0.5">{scannedResult}</div>
            </div>
          )}
        </div>

        {/* Center Square Viewfinder Window — compact sizing for clean spacing */}
        <div className="z-20 relative w-40 h-40 xs:w-48 xs:h-48 sm:w-64 sm:h-64 my-auto flex-shrink-0 pointer-events-none">
          {/* 4 corner L-brackets */}
          <span className="absolute top-0 left-0 w-7 sm:w-10 h-7 sm:h-10 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl drop-shadow-[0_0_8px_#10B981]" />
          <span className="absolute top-0 right-0 w-7 sm:w-10 h-7 sm:h-10 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl drop-shadow-[0_0_8px_#10B981]" />
          <span className="absolute bottom-0 left-0 w-7 sm:w-10 h-7 sm:h-10 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl drop-shadow-[0_0_8px_#10B981]" />
          <span className="absolute bottom-0 right-0 w-7 sm:w-10 h-7 sm:h-10 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl drop-shadow-[0_0_8px_#10B981]" />

          {/* Sleek laser scan beam */}
          {!isSuccessFlash && (
            <div className="absolute left-1 right-1 h-[2px] bg-emerald-400 shadow-[0_0_8px_#10B981] animate-[scan_2s_ease-in-out_infinite]" />
          )}

          {/* Success green fill overlay */}
          {isSuccessFlash && (
            <div className="absolute inset-0 rounded-2xl bg-emerald-600/40 flex items-center justify-center animate-pulse">
              <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-white flex items-center justify-center shadow-2xl">
                <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11 text-emerald-600" />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Hint */}
        {!isSuccessFlash && (
          <div className="z-20 text-[11px] text-white/80 font-semibold text-center px-3.5 bg-black/60 backdrop-blur-md py-1.5 rounded-full border border-white/15 pointer-events-none mt-2">
            {lang === 'ta'
              ? 'தானாக ஸ்கேன் ஆகும் — பட்டன் அழுத்த வேண்டாம்'
              : 'Auto-detects instantly • No button needed'}
          </div>
        )}

        {/* Camera error fallback overlay */}
        {cameraError && (
          <div className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center p-6 text-center gap-4">
            <div className="w-14 h-14 rounded-full border-2 border-[#1E7A38] bg-emerald-950 flex items-center justify-center">
              <Camera className="w-7 h-7 text-[#1E7A38]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white mb-1">
                {lang === 'ta' ? 'கேமரா கிடைக்கவில்லை' : 'Camera Not Available'}
              </h3>
              <p className="text-xs text-white/60 max-w-xs leading-relaxed">{cameraError}</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <button
                onClick={() => startCamera(cameraFacing)}
                className="w-full bg-[#1E7A38] hover:bg-[#166534] text-white font-black text-xs px-4 py-3 rounded-xl transition shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                {lang === 'ta' ? 'கேமரா திறக்க முயற்சி' : 'Retry Camera'}
              </button>
              <button
                onClick={handleSreeNagarScan}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-4 py-3 rounded-xl transition shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-amber-400"
              >
                <Route className="w-4 h-4" />
                {lang === 'ta' ? 'ஸ்ரீ நகர் ஸ்கேன் (சோதனை)' : 'Sree Nagar Test Scan'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. BOTTOM TOOLBAR ── */}
      <div className="flex-shrink-0 z-30 bg-[#121212] border-t border-white/10 py-3 px-4 flex items-center justify-center">
        {/* Flip camera button */}
        <button
          type="button"
          onClick={handleFlipCamera}
          className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition active:scale-95 cursor-pointer shadow-md"
        >
          <SwitchCamera className="w-4 h-4 text-emerald-400" />
          <span>
            {cameraFacing === 'environment'
              ? (lang === 'ta' ? 'முன் கேமரா' : 'Front Camera')
              : (lang === 'ta' ? 'பின் கேமரா' : 'Rear Camera')}
          </span>
        </button>
      </div>

    </div>
  );
};

export default SWMSScannerView;
