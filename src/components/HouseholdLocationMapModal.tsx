import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  X,
  Navigation,
  Crosshair,
  Layers,
  ExternalLink,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Copy
} from 'lucide-react';

interface HouseholdLocationMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  lat: number;
  lng: number;
  accuracy?: number;
  houseId: string;
  doorNo?: string;
  streetName: string;
  ward: string;
  zone: string;
  residentName?: string;
  locationName?: string;
  lang?: 'en' | 'ta';
  onRefreshGps?: () => void;
  isRefreshingGps?: boolean;
}

export type MapLayerKey = 'hd_streets' | 'google_streets' | 'satellite' | 'osm';

export const HouseholdLocationMapModal: React.FC<HouseholdLocationMapModalProps> = ({
  isOpen,
  onClose,
  lat,
  lng,
  accuracy = 3.2,
  houseId,
  doorNo,
  streetName,
  ward,
  zone,
  residentName,
  locationName,
  lang = 'ta',
  onRefreshGps,
  isRefreshingGps = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);

  // Exact layer options requested by user
  const [selectedLayer, setSelectedLayer] = useState<MapLayerKey>('hd_streets');
  const [isCopied, setIsCopied] = useState(false);

  // Safe numerical coordinates (fallback to central Coimbatore if invalid)
  const safeLat = typeof lat === 'number' && !isNaN(lat) && lat !== 0 ? lat : 11.01684;
  const safeLng = typeof lng === 'number' && !isNaN(lng) && lng !== 0 ? lng : 76.95582;

  // Cleanup helper
  const cleanupMap = useCallback(() => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.stop();
        mapInstanceRef.current.remove();
      } catch (e) {
        console.warn('Map cleanup warning:', e);
      }
      mapInstanceRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
      currentTileLayerRef.current = null;
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!isOpen) {
      cleanupMap();
      return;
    }

    let isMounted = true;
    const timer = setTimeout(() => {
      if (!isMounted || !mapContainerRef.current) return;

      cleanupMap();

      try {
        const container = mapContainerRef.current;
        if (!container) return;

        const map = L.map(container, {
          center: [safeLat, safeLng],
          zoom: 18,
          minZoom: 9,
          maxZoom: 22,
          zoomControl: false,
          fadeAnimation: true,
          zoomAnimation: true,
        });

        // Add Selected Tile Layer
        const tileConfig = getLayerTileConfig(selectedLayer);
        const tileLayer = L.tileLayer(tileConfig.url, {
          ...tileConfig.options,
          attribution: '&copy; Map & Coimbatore Municipal SWMS',
        }).addTo(map);

        currentTileLayerRef.current = tileLayer;

        // Custom Green Municipal GPS Marker
        const customIcon = L.divIcon({
          className: 'swms-gps-pin-marker',
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none;">
              <!-- Radar Pulse Ring -->
              <div style="
                position: absolute;
                top: -6px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: rgba(34, 197, 94, 0.28);
                border: 2px solid #22c55e;
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                pointer-events: none;
              "></div>

              <!-- Main Pin Head -->
              <div style="
                width: 38px;
                height: 38px;
                border-radius: 50%;
                background: linear-gradient(135deg, #1E7A38 0%, #15803d 100%);
                border: 2.5px solid #ffffff;
                box-shadow: 0 6px 14px rgba(0,0,0,0.35);
                display: flex;
                align-items: center;
                justify-content: center;
                color: #ffffff;
                position: relative;
                z-index: 2;
              ">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>

              <!-- Pin Pointer Tip -->
              <div style="
                width: 0;
                height: 0;
                border-left: 5px solid transparent;
                border-right: 5px solid transparent;
                border-top: 7px solid #15803d;
                margin-top: -2px;
                position: relative;
                z-index: 1;
              "></div>

              <!-- Label Badge -->
              <div style="
                background: #0f172a;
                color: #ffffff;
                font-size: 10.5px;
                font-weight: 800;
                font-family: system-ui, -apple-system, sans-serif;
                padding: 3px 9px;
                border-radius: 9999px;
                margin-top: 3px;
                white-space: nowrap;
                border: 1.5px solid rgba(255,255,255,0.3);
                box-shadow: 0 3px 8px rgba(0,0,0,0.35);
                display: flex;
                align-items: center;
                gap: 4px;
              ">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: #4ade80;"></span>
                <span>${doorNo ? `Door #${doorNo}` : houseId}</span>
              </div>
            </div>
          `,
          iconSize: [44, 68],
          iconAnchor: [22, 44],
          popupAnchor: [0, -42],
        });

        const marker = L.marker([safeLat, safeLng], { icon: customIcon }).addTo(map);

        const popupContent = `
          <div style="padding: 4px; font-family: system-ui, -apple-system, sans-serif; min-width: 170px;">
            <div style="font-weight: 900; font-size: 13px; color: #1E7A38; margin-bottom: 2px;">
              ${houseId} ${doorNo ? `(Door ${doorNo})` : ''}
            </div>
            <div style="font-weight: 700; font-size: 11px; color: #1e293b; margin-bottom: 3px;">
              ${streetName}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-bottom: 5px;">
              ${ward} • ${zone}
            </div>
            <div style="font-family: monospace; font-size: 9.5px; background: #f1f5f9; padding: 3px 6px; border-radius: 6px; color: #0f172a; font-weight: 700;">
              📍 ${safeLat.toFixed(5)}°N, ${safeLng.toFixed(5)}°E
            </div>
          </div>
        `;
        marker.bindPopup(popupContent);
        markerRef.current = marker;

        // Accuracy Geofence Circle
        const accuracyCircle = L.circle([safeLat, safeLng], {
          radius: Math.max(accuracy, 12),
          color: '#16a34a',
          fillColor: '#22c55e',
          fillOpacity: 0.15,
          weight: 1.5,
          dashArray: '4, 4',
        }).addTo(map);
        circleRef.current = accuracyCircle;

        mapInstanceRef.current = map;

        // Multi-stage size recalculation for instantaneous display
        [50, 150, 300, 600, 1000].forEach((delay) => {
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize(true);
            }
          }, delay);
        });

      } catch (err) {
        console.error('Error initializing map:', err);
      }
    }, 60);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      cleanupMap();
    };
  }, [isOpen, safeLat, safeLng, accuracy, houseId, doorNo, streetName, ward, zone, cleanupMap]);

  // Handle Layer switch
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const tileConfig = getLayerTileConfig(selectedLayer);
    const newTileLayer = L.tileLayer(tileConfig.url, {
      ...tileConfig.options,
      attribution: '&copy; Map & Coimbatore Municipal SWMS',
    }).addTo(map);

    currentTileLayerRef.current = newTileLayer;
    map.invalidateSize(true);
  }, [selectedLayer]);

  // ResizeObserver on the container
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize(true);
      }
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCenterOnHouse = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([safeLat, safeLng], 19, {
        animate: true,
        duration: 1.2,
      });
      if (markerRef.current) {
        markerRef.current.openPopup();
      }
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleCopyCoords = () => {
    navigator.clipboard?.writeText(`${safeLat.toFixed(5)}, ${safeLng.toFixed(5)}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-emerald-300/80 flex flex-col max-h-[92vh]">
        
        {/* Header with Municipal Branding */}
        <div className="bg-[#1E7A38] text-white p-3.5 sm:p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Navigation className="w-4 h-4 text-emerald-200" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black text-white truncate">
                {lang === 'ta' ? '📍 நேரடி GPS வரைபடம் (Live Location Map)' : '📍 Live GPS Location Map'}
              </h3>
              <p className="text-[10px] text-emerald-200 font-mono truncate">
                {safeLat.toFixed(5)}° N, {safeLng.toFixed(5)}° E • {doorNo ? `Door #${doorNo}` : houseId}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={handleCenterOnHouse}
              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-xl text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer"
              title="Center Map on Household"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'ta' ? 'மையப்படுத்து' : 'Center'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
              title="Close Map"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* LAYER CONTROLS BAR: Exactly as requested with HD Streets, Google Streets, Satellite, OSM */}
        <div className="bg-[#f0fdf4]/80 px-3 py-2 border-b border-emerald-100 flex items-center justify-between gap-2 overflow-x-auto text-[11px] font-bold">
          
          <div className="flex items-center space-x-1.5 text-slate-700 flex-shrink-0">
            <Layers className="w-4 h-4 text-[#1E7A38]" />
            <span>Layer:</span>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            
            {/* 1. HD Streets */}
            <button
              type="button"
              onClick={() => setSelectedLayer('hd_streets')}
              className={`px-3 py-1.5 rounded-full transition cursor-pointer text-xs font-black whitespace-nowrap ${
                selectedLayer === 'hd_streets'
                  ? 'bg-[#1E7A38] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              HD Streets
            </button>

            {/* 2. Google Streets */}
            <button
              type="button"
              onClick={() => setSelectedLayer('google_streets')}
              className={`px-3 py-1.5 rounded-full transition cursor-pointer text-xs font-black whitespace-nowrap ${
                selectedLayer === 'google_streets'
                  ? 'bg-[#1E7A38] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Google Streets
            </button>

            {/* 3. Satellite */}
            <button
              type="button"
              onClick={() => setSelectedLayer('satellite')}
              className={`px-3 py-1.5 rounded-full transition cursor-pointer text-xs font-black whitespace-nowrap ${
                selectedLayer === 'satellite'
                  ? 'bg-[#1E7A38] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Satellite
            </button>

            {/* 4. OSM */}
            <button
              type="button"
              onClick={() => setSelectedLayer('osm')}
              className={`px-3 py-1.5 rounded-full transition cursor-pointer text-xs font-black whitespace-nowrap ${
                selectedLayer === 'osm'
                  ? 'bg-[#1E7A38] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              OSM
            </button>

          </div>
        </div>

        {/* MAP STAGE CONTAINER */}
        <div className="relative w-full h-[320px] bg-slate-100 overflow-hidden" style={{ minHeight: '320px', height: '320px' }}>
          
          <div
            ref={mapContainerRef}
            className="w-full h-full"
            style={{ height: '320px', width: '100%', position: 'absolute', top: 0, left: 0 }}
          />

          {/* Leaflet Controls (+ / - / Center) */}
          <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5 shadow-md">
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-8 h-8 bg-white/95 hover:bg-white text-slate-800 rounded-xl flex items-center justify-center font-black border border-slate-200 transition hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-8 h-8 bg-white/95 hover:bg-white text-slate-800 rounded-xl flex items-center justify-center font-black border border-slate-200 transition hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCenterOnHouse}
              className="w-8 h-8 bg-[#1E7A38] hover:bg-[#166534] text-white rounded-xl flex items-center justify-center font-black transition hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
              title="Center on House"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>

          {/* Floating Accuracy & Refresh HUD Badge */}
          <div className="absolute top-3 left-3 z-10 flex items-center space-x-1.5 bg-slate-950/85 backdrop-blur-md text-white px-2.5 py-1 rounded-xl border border-white/20 text-[10px] font-mono shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-emerald-300">Accuracy: ±{accuracy}m</span>
            {onRefreshGps && (
              <button
                type="button"
                onClick={onRefreshGps}
                disabled={isRefreshingGps}
                className="ml-1 pl-1.5 border-l border-white/20 text-emerald-300 hover:text-white cursor-pointer"
                title="Sync Real-time GPS"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshingGps ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          {/* Floating House ID & Door Badge */}
          <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-xl border border-emerald-400 shadow-md text-[10px] font-black text-slate-900 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#1E7A38]" />
            <span>{houseId}</span>
            {doorNo && <span className="text-emerald-700 font-bold">• Door #{doorNo}</span>}
          </div>
        </div>

        {/* Address and Geocoded Location Information */}
        <div className="p-3.5 sm:p-4 space-y-3 flex-1 overflow-y-auto bg-slate-50 border-t border-slate-200">
          
          <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                {lang === 'ta' ? 'புவிஇருப்பிட முகவரி (Geocoded Location)' : 'Geocoded Address'}
              </span>
              <button
                type="button"
                onClick={handleCopyCoords}
                className="text-[10px] font-bold text-[#1E7A38] hover:underline cursor-pointer flex items-center space-x-1"
              >
                <Copy className="w-3 h-3" />
                <span>{isCopied ? 'Copied!' : 'Copy Coords'}</span>
              </button>
            </div>
            
            <p className="text-xs font-bold text-slate-900 leading-snug">
              {locationName || `${doorNo ? `${doorNo}, ` : ''}${streetName}, ${ward}, ${zone}, Coimbatore - 641012`}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-[9px] text-slate-500 font-bold block">Ward & Zone</span>
                <span className="text-xs font-black text-slate-800">{ward} ({zone})</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-[9px] text-slate-500 font-bold block">GPS Coordinates</span>
                <span className="text-xs font-mono font-black text-emerald-700">
                  {safeLat.toFixed(4)}°N, {safeLng.toFixed(4)}°E
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Direct Google Maps & Close */}
          <div className="flex items-center gap-2 pt-1">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${safeLat},${safeLng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-3 bg-[#1E7A38] hover:bg-[#166534] active:bg-[#113B22] text-white rounded-xl font-black text-xs flex items-center justify-center space-x-2 shadow-md transition active:scale-95 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{lang === 'ta' ? 'Google Maps-ல் பார்க்கவும்' : 'Open in Google Maps'}</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs transition cursor-pointer active:scale-95 shadow-2xs"
            >
              {lang === 'ta' ? 'மூடு' : 'Close'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

function getLayerTileConfig(layer: MapLayerKey): { url: string; options: L.TileLayerOptions } {
  switch (layer) {
    case 'hd_streets':
      return {
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        options: {
          subdomains: ['a', 'b', 'c', 'd'],
          maxZoom: 20,
          maxNativeZoom: 19,
        },
      };
    case 'google_streets':
      return {
        url: 'https://mt{s}.google.com/vt/lyrs=m&hl=en&gl=IN&scale=2&x={x}&y={y}&z={z}',
        options: {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 22,
          maxNativeZoom: 20,
        },
      };
    case 'satellite':
      return {
        url: 'https://mt{s}.google.com/vt/lyrs=y&hl=en&gl=IN&scale=2&x={x}&y={y}&z={z}',
        options: {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 22,
          maxNativeZoom: 20,
        },
      };
    case 'osm':
    default:
      return {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: {
          subdomains: ['a', 'b', 'c'],
          maxZoom: 19,
          maxNativeZoom: 19,
        },
      };
  }
}
