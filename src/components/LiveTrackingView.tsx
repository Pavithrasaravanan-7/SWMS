import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Truck,
  User,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Compass,
  Layers,
  Filter,
  Play,
  Pause,
  RotateCcw,
  Navigation,
  Phone,
  Battery,
  Fuel,
  Maximize2,
  Eye,
  Activity,
  MapPin,
  Search,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Route,
  Crosshair,
  Sparkles,
  Zap,
} from 'lucide-react';
import { LiveVehicle, LiveCollector, StreetSegment, ZoneName } from '../types';
import { liveGpsIcon, liveGpsFallbackIcon } from '../constants/branding';

const LIVE_GPS_ICON_URL = liveGpsIcon;
import {
  INITIAL_LIVE_VEHICLES,
  INITIAL_LIVE_COLLECTORS,
  INITIAL_STREET_SEGMENTS,
} from '../data/liveTrackingData';

interface LiveTrackingViewProps {
  onDispatchWorker?: (info: string) => void;
}

export const LiveTrackingView: React.FC<LiveTrackingViewProps> = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // State
  const [vehicles, setVehicles] = useState<LiveVehicle[]>(INITIAL_LIVE_VEHICLES);
  const [collectors, setCollectors] = useState<LiveCollector[]>(INITIAL_LIVE_COLLECTORS);
  const [streets, setStreets] = useState<StreetSegment[]>(INITIAL_STREET_SEGMENTS);

  // Filters & Controls
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'vehicles' | 'collectors' | 'streets'>('vehicles');

  // Layer Toggles
  const [showVehicles, setShowVehicles] = useState<boolean>(true);
  const [showCollectors, setShowCollectors] = useState<boolean>(false);
  const [showCompletedStreets, setShowCompletedStreets] = useState<boolean>(true);
  const [showPendingStreets, setShowPendingStreets] = useState<boolean>(true);
  const [showTravelledRoutes, setShowTravelledRoutes] = useState<boolean>(true);
  const [isOverlayDropdownOpen, setIsOverlayDropdownOpen] = useState<boolean>(false);

  // Dedicated Vehicle Search & Selection
  const [vehicleSearchInput, setVehicleSearchInput] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [movementSpeedMultiplier, setMovementSpeedMultiplier] = useState<number>(1);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [mapLayerType, setMapLayerType] = useState<'google_streets' | 'carto_voyager' | 'google_satellite' | 'esri_streets' | 'osm'>('google_streets');

  // Selected Entity for Detail Drawer
  const [selectedVehicle, setSelectedVehicle] = useState<LiveVehicle | null>(null);
  const [selectedCollector, setSelectedCollector] = useState<LiveCollector | null>(null);
  const [selectedStreet, setSelectedStreet] = useState<StreetSegment | null>(null);
  const [isStreetListDrawerOpen, setIsStreetListDrawerOpen] = useState<boolean>(false);
  const [streetFilterTab, setStreetFilterTab] = useState<'All' | 'Completed' | 'In Progress' | 'Pending'>('All');

  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Quick Zoom to Street Level helper
  const handleZoomToStreetLevel = () => {
    if (mapInstanceRef.current) {
      if (selectedVehicle) {
        mapInstanceRef.current.setView(selectedVehicle.currentPos, 18, { animate: true, duration: 1 });
      } else {
        mapInstanceRef.current.setZoom(18, { animate: true });
      }
    }
  };

  // Fly Map directly to specific street coordinates
  const handleFocusStreet = (coords: [number, number][]) => {
    if (mapInstanceRef.current && coords.length > 0) {
      mapInstanceRef.current.flyTo(coords[0], 18, { animate: true, duration: 1.2 });
    }
  };

  // Initialize Map with Deep Zoom (Up to Level 22)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [11.0168, 76.9558], // Central Coimbatore
        zoom: 15,
        minZoom: 10,
        maxZoom: 22, // Ultra Deep Zoom: view individual streets, alleys, and building blocks
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Default to Google Maps Ultra HD Streets (scale=2 with crystal sharp typography)
      const defaultTile = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&hl=en&gl=IN&scale=2&x={x}&y={y}&z={z}', {
        maxZoom: 22,
        maxNativeZoom: 20,
        subdomains: ['0', '1', '2', '3'],
        tileSize: 256,
        detectRetina: true,
        attribution: '&copy; Google Maps Ultra HD (Street & Lane Detail)',
      }).addTo(map);

      tileLayerRef.current = defaultTile;

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;

      // Invalidate size on initial mount and multiple sequential intervals
      const t1 = setTimeout(() => map.invalidateSize(), 50);
      const t2 = setTimeout(() => map.invalidateSize(), 200);
      const t3 = setTimeout(() => map.invalidateSize(), 600);
      const t4 = setTimeout(() => map.invalidateSize(), 1200);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          layerGroupRef.current = null;
          tileLayerRef.current = null;
        }
      };
    }
  }, []);

  // Update Tile Layer dynamically with Ultra High Resolution / Minute Detail Tile Sets
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    let newTileLayer: L.TileLayer;
    if (mapLayerType === 'google_streets') {
      newTileLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&hl=en&gl=IN&scale=2&x={x}&y={y}&z={z}', {
        maxZoom: 22,
        maxNativeZoom: 20,
        subdomains: ['0', '1', '2', '3'],
        tileSize: 256,
        detectRetina: true,
        attribution: '&copy; Google Maps Ultra-HD Streets & Lanes',
      });
    } else if (mapLayerType === 'carto_voyager') {
      newTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png', {
        maxZoom: 22,
        maxNativeZoom: 20,
        subdomains: ['a', 'b', 'c', 'd'],
        tileSize: 512,
        zoomOffset: -1,
        detectRetina: true,
        attribution: '&copy; CARTO Voyager HD (Minute Street & Colony Outlines)',
      });
    } else if (mapLayerType === 'esri_streets') {
      newTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 22,
        maxNativeZoom: 19,
        detectRetina: true,
        attribution: '&copy; Esri World Street Map (Detailed Crosscuts & Boundaries)',
      });
    } else if (mapLayerType === 'google_satellite') {
      newTileLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&hl=en&gl=IN&scale=2&x={x}&y={y}&z={z}', {
        maxZoom: 22,
        maxNativeZoom: 20,
        subdomains: ['0', '1', '2', '3'],
        tileSize: 256,
        detectRetina: true,
        attribution: '&copy; Google Maps Satellite & Street Hybrid Ultra-HD',
      });
    } else {
      newTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 22,
        maxNativeZoom: 19,
        detectRetina: true,
        attribution: '&copy; OpenStreetMap Humanitarian High-Contrast Streets',
      });
    }

    newTileLayer.addTo(mapInstanceRef.current);
    tileLayerRef.current = newTileLayer;

    // Bring vector markers back to front
    if (layerGroupRef.current && mapInstanceRef.current.hasLayer(layerGroupRef.current)) {
      (layerGroupRef.current as any).bringToFront?.();
    }
  }, [mapLayerType]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(handleResize, 300);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Live GPS Simulation Interval for active vehicle movement traversing assigned streets
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setVehicles((prevVehicles) => {
        const updated = prevVehicles.map((veh) => {
          if (veh.status === 'Idling' || veh.status === 'Maintenance') {
            return veh;
          }

          // If vehicle has structured assigned streets, smoothly traverse them street by street!
          if (veh.assignedRouteStreets && veh.assignedRouteStreets.length > 0) {
            const streetsCopy = veh.assignedRouteStreets.map((s) => ({ ...s }));
            
            // Find the current In Progress street, or activate the first Pending street
            let activeIdx = streetsCopy.findIndex((s) => s.status === 'In Progress');
            if (activeIdx === -1) {
              activeIdx = streetsCopy.findIndex((s) => s.status === 'Pending');
              if (activeIdx !== -1) {
                streetsCopy[activeIdx].status = 'In Progress';
                streetsCopy[activeIdx].collectedHouseholds = 1;
              }
            }

            if (activeIdx !== -1) {
              const activeStreet = streetsCopy[activeIdx];
              const totalHouses = activeStreet.households || 40;
              const stepHouses = Math.max(1, Math.round(2 * movementSpeedMultiplier));
              const newCollected = Math.min(totalHouses, (activeStreet.collectedHouseholds || 0) + stepHouses);
              activeStreet.collectedHouseholds = newCollected;

              // Calculate interpolated position along street coordinates
              const coords = activeStreet.coordinates;
              let newPos: [number, number] = veh.currentPos;
              if (coords.length > 0) {
                const fraction = totalHouses > 0 ? newCollected / totalHouses : 1;
                const segmentCount = coords.length - 1;
                if (segmentCount <= 0) {
                  newPos = coords[0];
                } else {
                  const segProgress = fraction * segmentCount;
                  const segIdx = Math.min(Math.floor(segProgress), segmentCount - 1);
                  const subFrac = segProgress - segIdx;
                  const p1 = coords[segIdx];
                  const p2 = coords[segIdx + 1];
                  newPos = [
                    p1[0] + (p2[0] - p1[0]) * subFrac,
                    p1[1] + (p2[1] - p1[1]) * subFrac,
                  ];
                }
              }

              // Check if street has reached 100% door collection completion
              let completedCount = streetsCopy.filter((s) => s.status === 'Completed').length;
              let nextStreetName = activeStreet.name;

              if (newCollected >= totalHouses) {
                activeStreet.status = 'Completed';
                completedCount += 1;
                // Move to next pending street
                const nextIdx = streetsCopy.findIndex((s) => s.status === 'Pending');
                if (nextIdx !== -1) {
                  streetsCopy[nextIdx].status = 'In Progress';
                  streetsCopy[nextIdx].collectedHouseholds = 1;
                  nextStreetName = streetsCopy[nextIdx].name;
                }
              }

              const pendingCount = streetsCopy.filter((s) => s.status === 'Pending').length;
              const coveragePct = Math.round((completedCount / streetsCopy.length) * 100);
              const newDistance = +(veh.distanceCoveredKm + 0.03 * movementSpeedMultiplier).toFixed(2);
              const newSpeed = Math.max(12, Math.min(32, veh.speedKmH + Math.floor(Math.random() * 5 - 2)));

              const coveredList = streetsCopy
                .filter((s) => s.status === 'Completed')
                .map((s) => `${s.name} (100% Done)`);
              const pendingList = streetsCopy
                .filter((s) => s.status === 'Pending' || s.status === 'In Progress')
                .map((s) => (s.status === 'In Progress' ? `${s.name} (⚡ Active)` : `${s.name} (⏳ Scheduled)`));

              return {
                ...veh,
                currentPos: newPos,
                speedKmH: newSpeed,
                distanceCoveredKm: newDistance,
                currentStreetName: nextStreetName,
                assignedRouteStreets: streetsCopy,
                completedStreetsCount: completedCount,
                pendingStreetsCount: pendingCount,
                routeCoveragePercentage: coveragePct,
                routeStatus: pendingCount === 0 ? 'Completed' : 'In Progress',
                coveredStreetsList: coveredList,
                pendingStreetsList: pendingList,
                travelledPath: [...veh.travelledPath, newPos],
                lastPingTime: 'Live (Just now)',
              };
            }
          }

          // Fallback micro movement simulation along trajectory
          const stepSize = 0.00035 * movementSpeedMultiplier;
          const deltaLat = (Math.random() - 0.42) * stepSize;
          const deltaLng = (Math.random() - 0.42) * stepSize;
          const newPos: [number, number] = [
            veh.currentPos[0] + deltaLat,
            veh.currentPos[1] + deltaLng,
          ];
          const newSpeed = Math.max(10, Math.min(36, veh.speedKmH + Math.floor(Math.random() * 5 - 2)));
          const newDistance = +(veh.distanceCoveredKm + 0.02 * movementSpeedMultiplier).toFixed(2);

          return {
            ...veh,
            currentPos: newPos,
            speedKmH: newSpeed,
            distanceCoveredKm: newDistance,
            travelledPath: [...veh.travelledPath, newPos],
            lastPingTime: 'Live (Just now)',
          };
        });

        // Automatically synchronize the currently searched vehicle if active
        if (selectedVehicle) {
          const matched = updated.find((v) => v.id === selectedVehicle.id);
          if (matched) {
            setSelectedVehicle(matched);
          }
        }

        return updated;
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [isSimulating, movementSpeedMultiplier, selectedVehicle?.id]);

  // Manually advance vehicle to next street immediately
  const handleAdvanceToNextStreet = (vehId: string) => {
    setVehicles((prev) => {
      const updated = prev.map((veh) => {
        if (veh.id !== vehId || !veh.assignedRouteStreets) return veh;
        const streetsCopy = veh.assignedRouteStreets.map((s) => ({ ...s }));
        const activeIdx = streetsCopy.findIndex((s) => s.status === 'In Progress');
        if (activeIdx !== -1) {
          streetsCopy[activeIdx].status = 'Completed';
          streetsCopy[activeIdx].collectedHouseholds = streetsCopy[activeIdx].households;
        }
        const nextIdx = streetsCopy.findIndex((s) => s.status === 'Pending');
        let newCurrentStreet = veh.currentStreetName;
        let newPos = veh.currentPos;
        if (nextIdx !== -1) {
          streetsCopy[nextIdx].status = 'In Progress';
          streetsCopy[nextIdx].collectedHouseholds = 1;
          newCurrentStreet = streetsCopy[nextIdx].name;
          if (streetsCopy[nextIdx].coordinates.length > 0) {
            newPos = streetsCopy[nextIdx].coordinates[0];
          }
        }
        const completedCount = streetsCopy.filter((s) => s.status === 'Completed').length;
        const pendingCount = streetsCopy.filter((s) => s.status === 'Pending').length;
        const coveragePct = Math.round((completedCount / streetsCopy.length) * 100);

        return {
          ...veh,
          currentPos: newPos,
          currentStreetName: newCurrentStreet,
          assignedRouteStreets: streetsCopy,
          completedStreetsCount: completedCount,
          pendingStreetsCount: pendingCount,
          routeCoveragePercentage: coveragePct,
          routeStatus: pendingCount === 0 ? 'Completed' : 'In Progress',
          travelledPath: [...veh.travelledPath, newPos],
          lastPingTime: 'Live (Manual Step)',
        };
      });
      if (selectedVehicle && selectedVehicle.id === vehId) {
        const matched = updated.find((v) => v.id === vehId);
        if (matched) setSelectedVehicle(matched);
      }
      return updated;
    });
  };

  // Helper to extract vehicle number last digits (e.g., '4812' from 'TN 37 CZ 4812' or '102' from 'CCMC-PC-102')
  const getVehicleLastDigits = (vehicleNo: string): string => {
    const match = vehicleNo.match(/\d+$/);
    if (match) return match[0];
    const allDigits = vehicleNo.replace(/\D/g, '');
    return allDigits.length >= 4 ? allDigits.slice(-4) : allDigits;
  };

  const matchesVehicleQuery = (vehicle: LiveVehicle, rawQuery: string): boolean => {
    if (!rawQuery || !rawQuery.trim()) return false;
    const q = rawQuery.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    const vNo = vehicle.vehicleNo.toLowerCase();
    const vDigits = vehicle.vehicleNo.replace(/\D/g, '');
    const lastDigits = getVehicleLastDigits(vehicle.vehicleNo);

    // Exact 4-digit / last-digit match (e.g., typing '4812', '9011', '1109', '5510', '8830', '102')
    if (qDigits.length >= 2) {
      if (lastDigits === qDigits || vDigits.endsWith(qDigits) || vDigits.includes(qDigits)) {
        return true;
      }
    }

    // Substring match across vehicle registration, ward, driver, vehicle type, and zone
    if (
      vNo.includes(q) ||
      vehicle.ward.toLowerCase().includes(q) ||
      vehicle.driverName.toLowerCase().includes(q) ||
      vehicle.type.toLowerCase().includes(q) ||
      vehicle.zone.toLowerCase().includes(q)
    ) {
      return true;
    }

    return false;
  };

  // Filtered data based on Zone, Vehicle Type & Search
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchZone = selectedZone === 'All' || v.zone === selectedZone;
      const matchType = selectedVehicleType === 'All' || v.type === selectedVehicleType;
      const matchSearch = !searchQuery.trim() || matchesVehicleQuery(v, searchQuery);
      return matchZone && matchType && matchSearch;
    });
  }, [vehicles, selectedZone, selectedVehicleType, searchQuery]);

  // Search suggestions for vehicle search bar (sorted by 4-digit relevance)
  const vehicleSearchSuggestions = useMemo(() => {
    if (!vehicleSearchInput.trim()) return [];
    const query = vehicleSearchInput.trim().toLowerCase();
    const qDigits = query.replace(/\D/g, '');

    return [...vehicles]
      .filter((v) => matchesVehicleQuery(v, query))
      .sort((a, b) => {
        // Prioritize exact 4-digit suffix matches
        const aLast4 = getVehicleLastDigits(a.vehicleNo);
        const bLast4 = getVehicleLastDigits(b.vehicleNo);
        if (qDigits && aLast4 === qDigits && bLast4 !== qDigits) return -1;
        if (qDigits && bLast4 === qDigits && aLast4 !== qDigits) return 1;
        return 0;
      });
  }, [vehicles, vehicleSearchInput]);

  const filteredCollectors = useMemo(() => {
    return collectors.filter((c) => {
      const matchZone = selectedZone === 'All' || c.zone === selectedZone;
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.ward.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.assignedVehicleNo.toLowerCase().includes(searchQuery.toLowerCase());
      return matchZone && matchSearch;
    });
  }, [collectors, selectedZone, searchQuery]);

  const filteredStreets = useMemo(() => {
    return streets.filter((s) => {
      const matchZone = selectedZone === 'All' || s.zone === selectedZone;
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.ward.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.assignedWorker.toLowerCase().includes(searchQuery.toLowerCase());
      return matchZone && matchSearch;
    });
  }, [streets, selectedZone, searchQuery]);

  // Render Map Layers & Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    const group = layerGroupRef.current;
    group.clearLayers();

    // If NO vehicle is searched or selected, keep GPS map completely clean and empty
    if (!selectedVehicle && !showCollectors) {
      return;
    }

    // 1. Render All Route Streets for the searched / selected vehicle
    if (selectedVehicle) {
      const veh = selectedVehicle;
      const assignedStreets = veh.assignedRouteStreets && veh.assignedRouteStreets.length > 0
        ? veh.assignedRouteStreets
        : filteredStreets
            .filter((s) => s.ward === veh.ward || s.assignedVehicle === veh.vehicleNo)
            .map((s) => ({
              id: s.id,
              name: s.name,
              status: s.status as 'Completed' | 'In Progress' | 'Pending',
              households: s.totalHouseholds,
              collectedHouseholds: s.collectedHouseholds,
              coordinates: s.coordinates,
              notes: s.pendingReason || 'Ward route pass',
            }));

      assignedStreets.forEach((street, idx) => {
        const isCompleted = street.status === 'Completed';
        const isInProgress = street.status === 'In Progress';
        const isPending = street.status === 'Pending';

        if (isCompleted && showCompletedStreets) {
          // Soft glowing halo behind completed street
          const halo = L.polyline(street.coordinates, {
            color: '#10B981',
            weight: 12,
            opacity: 0.3,
            lineCap: 'round',
            lineJoin: 'round',
          });
          group.addLayer(halo);

          // Main solid emerald green completed street line
          const polyline = L.polyline(street.coordinates, {
            color: '#059669',
            weight: 6,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round',
          });

          polyline.bindTooltip(`
            <div class="p-2 font-sans text-xs">
              <div class="flex items-center gap-1 font-bold text-emerald-900">
                <span>✅ Street ${idx + 1}: ${street.name}</span>
              </div>
              <div class="text-[11px] text-emerald-800 font-semibold mt-0.5">
                • Status: 100% Completed (${street.households || street.collectedHouseholds} Houses Serviced)
              </div>
              <div class="text-[10px] text-gray-500 mt-0.5">
                Vehicle: ${veh.vehicleNo} (${veh.ward})
              </div>
            </div>
          `, { direction: 'top', sticky: true, className: 'shadow-md rounded-lg border border-emerald-300' });

          group.addLayer(polyline);

          // Small Checkpoint Pin at Street Start
          if (street.coordinates.length > 0) {
            const pin = L.circleMarker(street.coordinates[0], {
              radius: 4.5,
              fillColor: '#059669',
              color: '#FFFFFF',
              weight: 1.5,
              fillOpacity: 1,
            }).bindTooltip(`✓ ${street.name}`, { direction: 'top' });
            group.addLayer(pin);
          }
        } else if (isInProgress && showPendingStreets) {
          // Glowing Animated Halo for In-Progress Street
          const halo = L.polyline(street.coordinates, {
            color: '#38BDF8',
            weight: 16,
            opacity: 0.45,
            lineCap: 'round',
            lineJoin: 'round',
          });
          group.addLayer(halo);

          // Main Vibrant Sky-Blue Polyline
          const polyline = L.polyline(street.coordinates, {
            color: '#0284C7',
            weight: 7,
            opacity: 1,
            lineCap: 'round',
            lineJoin: 'round',
          });

          polyline.bindTooltip(`
            <div class="p-2 font-sans text-xs">
              <div class="flex items-center gap-1 font-black text-sky-900">
                <span class="w-2 h-2 rounded-full bg-sky-500 animate-ping"></span>
                <span>⚡ Active Street: ${street.name}</span>
              </div>
              <div class="text-[11px] text-sky-800 font-bold mt-0.5">
                • Door-to-Door Progress: ${street.collectedHouseholds || 0}/${street.households} Houses (${Math.round(((street.collectedHouseholds || 1) / (street.households || 1)) * 100)}%)
              </div>
              <div class="text-[10px] text-sky-700 mt-0.5">
                Vehicle currently driving inside this street
              </div>
            </div>
          `, { direction: 'top', sticky: true, className: 'shadow-xl rounded-lg border-2 border-sky-400' });

          group.addLayer(polyline);

          // Waypoints along in-progress street
          street.coordinates.forEach((coord, ptIdx) => {
            const dot = L.circleMarker(coord, {
              radius: 4,
              fillColor: '#0284C7',
              color: '#FFFFFF',
              weight: 1.5,
              fillOpacity: 1,
            }).bindTooltip(`📍 ${street.name} Waypoint ${ptIdx + 1}`, { direction: 'top' });
            group.addLayer(dot);
          });
        } else if (isPending && showPendingStreets) {
          // Dashed High-Contrast Amber Line for Upcoming Scheduled Streets
          const polyline = L.polyline(street.coordinates, {
            color: '#D97706',
            weight: 5,
            opacity: 0.85,
            dashArray: '8, 8',
            lineCap: 'round',
            lineJoin: 'round',
          });

          polyline.bindTooltip(`
            <div class="p-2 font-sans text-xs">
              <div class="flex items-center gap-1 font-bold text-amber-900">
                <span>⏳ Scheduled Next: ${street.name}</span>
              </div>
              <div class="text-[11px] text-amber-800 font-semibold mt-0.5">
                • Target: ${street.households} Households
              </div>
              <div class="text-[10px] text-gray-600 mt-0.5">
                Route Order: Street #${idx + 1}
              </div>
            </div>
          `, { direction: 'top', sticky: true, className: 'shadow-md rounded-lg border border-amber-300' });

          group.addLayer(polyline);

          // Entrance junction marker
          if (street.coordinates.length > 0) {
            const junction = L.circleMarker(street.coordinates[0], {
              radius: 4,
              fillColor: '#D97706',
              color: '#FFFFFF',
              weight: 1.5,
              fillOpacity: 0.9,
            }).bindTooltip(`⏳ Entrance: ${street.name}`, { direction: 'top' });
            group.addLayer(junction);
          }
        }
      });
    }

    // 2. Render Travelled Routes (GREEN COLOR DOTTED LINES) — ONLY for the searched / selected vehicle
    if (showTravelledRoutes && selectedVehicle) {
      const veh = selectedVehicle;

      if (veh.travelledPath.length > 1) {
        // Soft glowing halo behind the green dotted line
        const glowPolyline = L.polyline(veh.travelledPath, {
          color: '#10B981',
          weight: 12,
          opacity: 0.35,
          lineCap: 'round',
        });
        group.addLayer(glowPolyline);

        // Main Green Color Dotted Polyline
        const routePolyline = L.polyline(veh.travelledPath, {
          color: '#059669', // Vibrant Emerald Green
          weight: 6,
          opacity: 1,
          dashArray: '10, 12', // Explicit Green Dotted Trail Style
          lineCap: 'round',
          lineJoin: 'round',
        });

        // Hover Tooltip on Green Dotted Line
        routePolyline.bindTooltip(`
          <div class="p-2 font-sans text-xs">
            <div class="font-black text-emerald-800 flex items-center gap-1">
              <span>🟢 ${veh.vehicleNo} Traversed Route</span>
            </div>
            <div class="text-[11px] text-gray-700 font-semibold mt-0.5">
              • ${veh.distanceCoveredKm} km covered | ${veh.completedStreetsCount} streets done
            </div>
            <div class="text-[10px] text-emerald-700 font-bold mt-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              👆 Touch / Click to inspect full movement details
            </div>
          </div>
        `, { direction: 'top', sticky: true, className: 'shadow-lg rounded-xl border border-emerald-300' });

        // Click / Touch on route opens details modal
        routePolyline.on('click', () => {
          setSelectedVehicle(veh);
          setIsDetailModalOpen(true);
          setSelectedCollector(null);
          setSelectedStreet(null);
        });

        group.addLayer(routePolyline);

        // Start Depot Pin (Green Flag / Pin)
        const startPin = L.circleMarker(veh.travelledPath[0], {
          radius: 7,
          fillColor: '#047857',
          color: '#FFFFFF',
          weight: 2.5,
          opacity: 1,
          fillOpacity: 1,
        }).bindTooltip(`🚩 Depot Start: ${veh.vehicleNo}`, {
          direction: 'top',
          permanent: true,
          className: 'bg-emerald-900 text-white font-bold px-2 py-0.5 rounded shadow text-[10px]',
        });
        group.addLayer(startPin);

        // Intermediate Route Waypoints
        if (veh.travelledPath.length > 2) {
          veh.travelledPath.slice(1, -1).forEach((coord, idx) => {
            const waypointMarker = L.circleMarker(coord, {
              radius: 4,
              fillColor: '#10B981',
              color: '#FFFFFF',
              weight: 1.5,
              opacity: 1,
              fillOpacity: 1,
            }).bindTooltip(`📍 Waypoint ${idx + 1}`, { direction: 'top' });
            group.addLayer(waypointMarker);
          });
        }
      }
    }

    // 4. Render Live Vehicle Movement Marker — ONLY for the searched / selected vehicle
    if (showVehicles && selectedVehicle) {
      const veh = selectedVehicle;

      // Visual characteristics based on Vehicle Type
      let typeColorClass = 'bg-[#1E7A38]';
      let ringColorClass = 'ring-emerald-400';
      let pulseColorClass = 'bg-emerald-400/50';
      let typeLabel = veh.type;
      
      // Prominent Solid Truck SVG Icon
      const truckSvg = `
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
        </svg>
      `;
      let iconSvg = truckSvg;

      if (veh.type === 'BOV') {
        typeColorClass = 'bg-[#1E7A38]';
        ringColorClass = 'ring-emerald-400';
        pulseColorClass = 'bg-emerald-400/50';
        typeLabel = '🚚 BOV Sanitation Vehicle';
        iconSvg = truckSvg;
      } else if (veh.type === 'Tata Ace') {
        typeColorClass = 'bg-sky-800';
        ringColorClass = 'ring-sky-400';
        pulseColorClass = 'bg-sky-500/40';
        typeLabel = '🚚 Tata Ace Tipper';
        iconSvg = truckSvg;
      } else {
        // Push Cart / Trike
        typeColorClass = 'bg-emerald-800';
        ringColorClass = 'ring-emerald-300';
        pulseColorClass = 'bg-emerald-500/40';
        typeLabel = '🚚 Sanitation Cart';
        iconSvg = truckSvg;
      }

      const isRouteCompleted = veh.routeStatus === 'Completed' || veh.pendingStreetsCount === 0;
      const totalAssignedStreets = (veh.completedStreetsCount || 0) + (veh.pendingStreetsCount || 0);
      const coveragePct =
        veh.routeCoveragePercentage ||
        (totalAssignedStreets > 0
          ? Math.round(((veh.completedStreetsCount || 0) / totalAssignedStreets) * 100)
          : 100);

      const iconHtml = `
        <div class="relative flex flex-col items-center justify-center cursor-pointer group">
          <!-- Animated Active Moving Radar Pulse Ring -->
          <div class="absolute -inset-3.5 rounded-full ${pulseColorClass} animate-ping opacity-75 pointer-events-none"></div>
          <div class="absolute -inset-1.5 rounded-full bg-emerald-400/30 animate-pulse pointer-events-none"></div>

          <div class="w-11 h-11 rounded-full ${typeColorClass} ring-4 ${ringColorClass} border-2 border-white shadow-2xl flex items-center justify-center text-white transition-transform scale-110 z-10">
            ${iconSvg}
          </div>
          
          <!-- Live Vehicle Number & Speed Moving Badge -->
          <div class="mt-1.5 bg-gray-950/95 text-white text-[10px] px-2.5 py-1 rounded-lg shadow-xl border border-emerald-400/50 whitespace-nowrap pointer-events-none flex flex-col items-center z-20">
            <div class="flex items-center gap-1 font-black text-amber-300">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>${veh.vehicleNo}</span>
              <span class="text-white/60">•</span>
              <span class="text-white">${veh.ward}</span>
            </div>
            <div class="text-[9px] font-bold flex items-center gap-1 text-emerald-300">
              <span>⚡ Touch to view live details: ${veh.speedKmH} km/h</span>
            </div>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-vehicle-marker',
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      const marker = L.marker(veh.currentPos, { icon: customIcon });

      // Live Moving Details Card (Attached directly to moving vehicle marker)
      marker.bindTooltip(`
        <div class="p-3 font-sans min-w-[250px] max-w-[280px] text-xs text-gray-900 bg-white rounded-2xl shadow-2xl border-2 border-emerald-500 overflow-hidden pointer-events-auto">
          <div class="flex items-center justify-between gap-1 pb-1.5 border-b border-gray-200 mb-1.5">
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <strong class="text-amber-600 font-black text-sm tracking-tight">${veh.vehicleNo}</strong>
            </div>
            <span class="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-md border border-emerald-300">${veh.type}</span>
          </div>
          <div class="space-y-1.5 text-gray-700 text-[11px]">
            <div class="flex justify-between items-center">
              <span class="text-gray-500 font-medium">📍 Ward / Zone:</span>
              <strong class="text-gray-900 font-bold">${veh.ward} (${veh.zone})</strong>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-500 font-medium">⚡ Live Speed:</span>
              <strong class="text-emerald-700 font-black bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">${veh.speedKmH} km/h</strong>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-500 font-medium">🛣️ Traversed Path:</span>
              <strong class="text-emerald-800 font-bold">${veh.distanceCoveredKm} km</strong>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-500 font-medium">✓ Streets Done:</span>
              <strong class="text-emerald-900 font-black">${veh.completedStreetsCount} / ${(veh.completedStreetsCount || 0) + (veh.pendingStreetsCount || 0)} (${veh.routeCoveragePercentage || 78}%)</strong>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-500 font-medium">👤 Driver:</span>
              <strong class="text-gray-900 font-semibold">${veh.driverName}</strong>
            </div>
          </div>
          <div class="mt-2 text-center bg-[#1E7A38] hover:bg-[#166534] text-white text-[10px] font-extrabold py-1.5 rounded-xl shadow-sm cursor-pointer transition-all flex items-center justify-center gap-1">
            <span>👆 Touch / Click to inspect all details</span>
          </div>
        </div>
      `, {
        direction: 'top',
        offset: [0, -28],
        className: 'custom-vehicle-hover-tooltip',
        permanent: true,
        interactive: true,
      });

      // Click / Touch on moving vehicle marker opens the detail modal
      marker.on('click', () => {
        setSelectedVehicle(veh);
        setIsDetailModalOpen(true);
        setSelectedCollector(null);
        setSelectedStreet(null);
      });

      const coveredStreetsHtml =
        veh.coveredStreetsList && veh.coveredStreetsList.length > 0
          ? veh.coveredStreetsList
              .map(
                (s) =>
                  `<li class="flex items-start gap-1 text-[10px] text-emerald-800"><span class="text-emerald-600 font-bold">✓</span> ${s}</li>`
              )
              .join('')
          : `<li class="text-[10px] text-gray-500">${veh.completedStreetsCount} streets completed</li>`;

      const pendingStreetsHtml =
        veh.pendingStreetsList && veh.pendingStreetsList.length > 0
          ? veh.pendingStreetsList
              .map(
                (s) =>
                  `<li class="flex items-start gap-1 text-[10px] text-rose-800"><span class="text-rose-600 font-bold">⏳</span> ${s}</li>`
              )
              .join('')
          : `<li class="text-[10px] text-emerald-700 font-bold">✓ All assigned streets covered!</li>`;

      marker.bindPopup(`
        <div class="p-3.5 font-sans min-w-[270px] max-w-[310px]">
          <!-- Header: Vehicle No & Status -->
          <div class="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-100">
            <div>
              <span class="text-xs font-black px-2 py-0.5 rounded-md ${
                veh.type === 'BOV'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : veh.type === 'Tata Ace'
                  ? 'bg-sky-100 text-sky-900 border border-sky-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }">
                ${veh.vehicleNo}
              </span>
              <span class="text-[11px] font-bold text-gray-700 ml-1.5">${veh.type}</span>
            </div>
            <span class="text-[10px] font-black px-2 py-0.5 rounded-full ${
              isRouteCompleted
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-blue-100 text-blue-800 border border-blue-300'
            }">${isRouteCompleted ? '✓ Route Completed' : '⚡ Live Moving'}</span>
          </div>

          <!-- Ward & Zone info -->
          <div class="bg-gray-50 p-2 rounded-xl mb-2.5 border border-gray-200/70">
            <div class="text-xs font-bold text-gray-900 flex items-center justify-between">
              <span>📍 Ward: <strong class="text-emerald-800 font-black">${veh.ward}</strong></span>
              <span class="text-gray-600">${veh.zone}</span>
            </div>
            <div class="text-[11px] text-gray-600 mt-0.5 flex items-center justify-between">
              <span>Driver: <strong class="text-gray-900">${veh.driverName}</strong></span>
              <span class="font-bold text-emerald-700">${veh.speedKmH} km/h</span>
            </div>
          </div>

          <!-- Route Coverage Section -->
          <div class="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200 mb-2.5">
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="font-bold text-emerald-950">Route Covered Status:</span>
              <span class="font-extrabold text-emerald-800">${veh.completedStreetsCount}/${totalAssignedStreets} Streets (${coveragePct}%)</span>
            </div>
            <div class="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-2">
              <div 
                class="h-full ${isRouteCompleted ? 'bg-emerald-600' : 'bg-[#1E7A38]'} rounded-full transition-all"
                style="width: ${coveragePct}%"
              ></div>
            </div>

            <!-- Covered Streets List -->
            <div class="mb-2">
              <span class="text-[10px] font-black text-emerald-900 uppercase tracking-wider block mb-0.5">
                ✓ Covered Streets (Green Trail):
              </span>
              <ul class="space-y-0.5 max-h-20 overflow-y-auto bg-white p-1.5 rounded-lg border border-emerald-200/80">
                ${coveredStreetsHtml}
              </ul>
            </div>

            <!-- Pending Streets List -->
            <div>
              <span class="text-[10px] font-black text-rose-900 uppercase tracking-wider block mb-0.5">
                ⏳ Pending Streets (${veh.pendingStreetsCount}):
              </span>
              <ul class="space-y-0.5 max-h-16 overflow-y-auto bg-white p-1.5 rounded-lg border border-rose-200/80">
                ${pendingStreetsHtml}
              </ul>
            </div>
          </div>

          <!-- Telemetry Metrics Grid -->
          <div class="grid grid-cols-2 gap-1.5 text-xs bg-gray-50 p-2 rounded-lg border border-gray-100 mb-2">
            <div>
              <span class="text-gray-500 block text-[10px]">Traversed Path:</span>
              <span class="font-bold text-gray-900">${veh.distanceCoveredKm} km</span>
            </div>
            <div>
              <span class="text-gray-500 block text-[10px]">Live Speed:</span>
              <span class="font-bold text-emerald-700">${veh.speedKmH} km/h</span>
            </div>
          </div>

          <div class="text-[10px] text-gray-500 text-right">
            GPS Ping: <strong class="text-emerald-700">${veh.lastPingTime}</strong>
          </div>
        </div>
      `);

      group.addLayer(marker);
    }

    // 5. Render Collectors (On Foot) — Only if toggled
    if (showCollectors) {
      filteredCollectors.forEach((col) => {
        const isSelected = selectedCollector?.id === col.id;
        const iconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="w-8 h-8 rounded-full ${
              isSelected ? 'bg-amber-600 ring-4 ring-amber-300' : 'bg-amber-500'
            } border-2 border-white shadow-md flex items-center justify-center text-white transition-transform group-hover:scale-110">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div class="absolute -bottom-5 bg-gray-900/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-none">
              ${col.name.split(' ')[0]} (${col.completedHouses}/${col.totalHouses})
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-collector-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker(col.currentPos, { icon: customIcon });

        marker.bindPopup(`
          <div class="p-3 font-sans min-w-[210px]">
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <span class="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                Sanitation Worker
              </span>
              <span class="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                ${col.status}
              </span>
            </div>
            <h4 class="font-bold text-gray-900 text-sm">${col.name}</h4>
            <p class="text-xs text-gray-500 mb-2">${col.ward} • ${col.zone}</p>
            
            <div class="bg-gray-50 p-2 rounded-lg text-xs space-y-1.5 border border-gray-100 mb-2">
              <div class="flex justify-between">
                <span class="text-gray-500">Houses Covered:</span>
                <span class="font-bold text-emerald-700">${col.completedHouses} / ${col.totalHouses} (${Math.round(
          (col.completedHouses / col.totalHouses) * 100
        )}%)</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Assigned Truck:</span>
                <span class="font-semibold text-gray-800">${col.assignedVehicleNo}</span>
              </div>
            </div>
          </div>
        `);

        marker.on('click', () => {
          setSelectedCollector(col);
          setSelectedVehicle(null);
          setSelectedStreet(null);
        });

        group.addLayer(marker);
      });
    }
  }, [
    filteredStreets,
    filteredCollectors,
    showVehicles,
    showCollectors,
    showCompletedStreets,
    showPendingStreets,
    showTravelledRoutes,
    selectedVehicle,
    selectedCollector,
  ]);

  // Center map on specific location
  const focusOnCoordinates = (coords: [number, number], zoom = 15) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(coords, zoom, {
        duration: 1.2,
      });
    }
  };

  // Reset to full city bounds
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([11.0168, 76.9558], 13, { duration: 1 });
    }
    setSelectedVehicle(null);
    setSelectedCollector(null);
    setSelectedStreet(null);
  };

  // Select vehicle specifically by Vehicle No to inspect its green dotted traversed route
  const handleSelectVehicleByNo = (vehIdOrNo: string) => {
    if (!vehIdOrNo || vehIdOrNo === 'ALL') {
      setSelectedVehicle(null);
      setSelectedCollector(null);
      setSelectedStreet(null);
      handleResetView();
      return;
    }
    const target = vehicles.find((v) => v.id === vehIdOrNo || v.vehicleNo === vehIdOrNo);
    if (target) {
      setSelectedVehicle(target);
      setSelectedCollector(null);
      setSelectedStreet(null);
      setShowTravelledRoutes(true);
      setShowVehicles(true);

      // Auto-fit map view to include the entire traversed route path
      if (mapInstanceRef.current && target.travelledPath.length > 0) {
        const bounds = L.latLngBounds(target.travelledPath);
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [70, 70],
          maxZoom: 16,
          animate: true,
          duration: 1.2,
        });
      } else {
        focusOnCoordinates(target.currentPos, 16);
      }
    }
  };

  const handlePrevVehicle = () => {
    const list = filteredVehicles.length > 0 ? filteredVehicles : vehicles;
    const currentIndex = list.findIndex((v) => v.id === selectedVehicle?.id);
    if (currentIndex <= 0) {
      handleSelectVehicleByNo(list[list.length - 1].id);
    } else {
      handleSelectVehicleByNo(list[currentIndex - 1].id);
    }
  };

  const handleNextVehicle = () => {
    const list = filteredVehicles.length > 0 ? filteredVehicles : vehicles;
    const currentIndex = list.findIndex((v) => v.id === selectedVehicle?.id);
    if (currentIndex === -1 || currentIndex >= list.length - 1) {
      handleSelectVehicleByNo(list[0].id);
    } else {
      handleSelectVehicleByNo(list[currentIndex + 1].id);
    }
  };

  const handleFitCurrentVehicleRoute = () => {
    if (selectedVehicle && mapInstanceRef.current && selectedVehicle.travelledPath.length > 0) {
      const bounds = L.latLngBounds(selectedVehicle.travelledPath);
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [70, 70],
        maxZoom: 16,
        animate: true,
        duration: 1.2,
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Telemetry Header */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-white p-0.5 flex-shrink-0 shadow-sm flex items-center justify-center">
            <img
              src={LIVE_GPS_ICON_URL}
              alt="Live GPS Tracking"
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (e.currentTarget.src !== liveGpsFallbackIcon) {
                  e.currentTarget.src = liveGpsFallbackIcon;
                }
              }}
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                Live Collection GPS Tracking
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                Live Telemetry Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              Real-time geospatial monitoring of waste collection vehicles, field collectors, completed vs. pending streets, and traversed GPS routes.
            </p>
          </div>
        </div>

        {/* Center & Map Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Simulation Play/Pause */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
              isSimulating
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
            }`}
            title={isSimulating ? 'Pause Live GPS Simulation' : 'Resume Live GPS Simulation'}
          >
            {isSimulating ? (
              <>
                <Pause className="w-3.5 h-3.5 text-emerald-700" />
                <span>Simulating GPS</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-amber-700" />
                <span>Simulation Paused</span>
              </>
            )}
          </button>

          <button
            onClick={handleResetView}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all shadow-2xs cursor-pointer"
            title="Reset Map to City View"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-600" />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      {/* 🔍 Prominent Vehicle Search Bar (Styled with CCMC Header Color Theme #1E7A38) */}
      <div className="bg-[#1E7A38] text-white rounded-2xl p-4 sm:p-5 border border-[#166534] shadow-md relative overflow-hidden">
        {/* Subtle background highlight */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-2">
          {selectedVehicle && (
            <div className="flex items-center justify-end">
              <button
                onClick={() => {
                  setVehicleSearchInput('');
                  handleSelectVehicleByNo('ALL');
                }}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#166534] hover:bg-[#113B22] text-emerald-100 hover:text-white rounded-xl text-xs font-bold border border-emerald-400/30 transition-all cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear / Hide Vehicle</span>
              </button>
            </div>
          )}

          {/* Search Bar Input & Autocomplete Dropdown */}
          <div className="relative">
            <div className="relative flex items-center">
              <div className="absolute left-3.5 pointer-events-none text-emerald-300 flex items-center">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={vehicleSearchInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setVehicleSearchInput(val);
                  setIsSearchFocused(true);
                  if (!val.trim()) {
                    setSelectedVehicle(null);
                  } else {
                    const q = val.trim().toLowerCase();
                    const qDigits = q.replace(/\D/g, '');
                    
                    // Match by full vehicle number OR exact 4-digit / last digit suffix
                    const exact = vehicles.find((v) => {
                      const vNo = v.vehicleNo.toLowerCase();
                      const last4 = getVehicleLastDigits(v.vehicleNo);
                      const vDigits = v.vehicleNo.replace(/\D/g, '');
                      return (
                        vNo === q ||
                        (qDigits.length >= 3 && (last4 === qDigits || vDigits.endsWith(qDigits)))
                      );
                    });

                    if (exact) {
                      handleSelectVehicleByNo(exact.id);
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (vehicleSearchSuggestions.length > 0) {
                      const top = vehicleSearchSuggestions[0];
                      setVehicleSearchInput(top.vehicleNo);
                      setIsSearchFocused(false);
                      handleSelectVehicleByNo(top.id);
                    }
                  }
                }}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Type Last 4 Digits (e.g. 4812, 9011, 1109, 5510, 8830, 102) or Vehicle No..."
                className="w-full bg-[#166534] text-white font-bold text-sm sm:text-base py-3 pl-11 pr-24 rounded-xl border border-emerald-400/40 focus:border-amber-300 focus:ring-4 focus:ring-emerald-400/20 shadow-inner placeholder:text-emerald-100/60 outline-hidden transition-all"
              />

              {/* Clear button inside input */}
              {vehicleSearchInput && (
                <button
                  onClick={() => {
                    setVehicleSearchInput('');
                    handleSelectVehicleByNo('ALL');
                  }}
                  className="absolute right-3 p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  title="Clear Search"
                >
                  ✕ Clear
                </button>
              )}
            </div>

            {/* Quick 4-Digit Filter Pills */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-bold text-emerald-200/90 whitespace-nowrap flex items-center gap-1">
                ⚡ 4-Digit Filter:
              </span>
              {vehicles.map((v) => {
                const last4 = getVehicleLastDigits(v.vehicleNo);
                const isSelected = selectedVehicle?.id === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => {
                      setVehicleSearchInput(last4);
                      setIsSearchFocused(false);
                      handleSelectVehicleByNo(v.id);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-black text-xs transition-all whitespace-nowrap cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md scale-105 ring-2 ring-amber-300/60'
                        : 'bg-[#166534] text-emerald-100 hover:text-white hover:bg-[#1E7A38] border-emerald-500/40'
                    }`}
                    title={`Click to track ${v.vehicleNo} (${v.ward})`}
                  >
                    {last4} <span className="text-[9px] font-medium opacity-80">({v.ward})</span>
                  </button>
                );
              })}
            </div>

            {/* Live Autocomplete Suggestions Popup */}
            {isSearchFocused && vehicleSearchSuggestions.length > 0 && (
              <div 
                className="absolute left-0 right-0 top-full mt-2 bg-[#113B22] text-white rounded-xl border-2 border-emerald-400/50 shadow-2xl z-50 max-h-72 overflow-y-auto p-1.5 space-y-1"
                onMouseLeave={() => setIsSearchFocused(false)}
              >
                <div className="px-3 py-1.5 text-[11px] font-black text-emerald-300 uppercase tracking-wider flex items-center justify-between border-b border-[#166534]">
                  <span>Found {vehicleSearchSuggestions.length} Matching Vehicles (Last 4 Digits & Details)</span>
                  <span className="text-emerald-200/70 text-[10px] lowercase">Click to track GPS & route</span>
                </div>
                {vehicleSearchSuggestions.map((veh) => {
                  const last4 = getVehicleLastDigits(veh.vehicleNo);
                  return (
                    <div
                      key={veh.id}
                      onClick={() => {
                        setVehicleSearchInput(veh.vehicleNo);
                        setIsSearchFocused(false);
                        handleSelectVehicleByNo(veh.id);
                      }}
                      className="p-2.5 rounded-lg hover:bg-[#1E7A38] border border-transparent hover:border-emerald-400/40 flex items-center justify-between gap-3 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg text-white font-bold text-xs flex items-center justify-center ${
                          veh.type === 'BOV' ? 'bg-[#1E7A38] border border-emerald-400/40' : veh.type === 'Tata Ace' ? 'bg-sky-800' : 'bg-emerald-900'
                        }`}>
                          🚚
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-amber-300 group-hover:text-amber-200 text-sm">
                              {veh.vehicleNo}
                            </span>
                            <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded shadow-2xs">
                              {last4}
                            </span>
                            <span className="text-[11px] font-bold text-white/90 bg-white/10 px-1.5 py-0.5 rounded">
                              {veh.ward}
                            </span>
                            <span className="text-[10px] text-emerald-300 font-semibold">{veh.zone}</span>
                          </div>
                          <div className="text-xs text-emerald-100/90 flex items-center gap-2 mt-0.5">
                            <span>Driver: <strong className="text-white">{veh.driverName}</strong></span>
                            <span>•</span>
                            <span className="text-emerald-200 font-bold">{veh.completedStreetsCount} streets covered</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-bold text-emerald-200 bg-[#113B22] px-2 py-1 rounded border border-emerald-600/40 group-hover:bg-[#1E7A38] group-hover:text-white transition-all">
                          Track Route →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Vehicle Active Banner Strip */}
          {selectedVehicle && (
            <div className="pt-2 border-t border-[#166534] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-amber-400/30">
                  🟢 Currently Tracking: {selectedVehicle.vehicleNo}
                </span>
                <span className="text-white font-semibold">
                  📍 {selectedVehicle.ward} ({selectedVehicle.zone})
                </span>
                <span className="text-emerald-300">•</span>
                <span className="text-emerald-100 font-bold flex items-center gap-1.5">
                  <span className="inline-block w-4 h-0.5 border-b-2 border-dashed border-emerald-400"></span>
                  Green Dotted Route: <strong>{selectedVehicle.distanceCoveredKm} km</strong>
                </span>
                <span className="text-emerald-300">•</span>
                <span className="text-white font-medium">
                  Driver: <strong>{selectedVehicle.driverName}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleFitCurrentVehicleRoute}
                  className="px-2.5 py-1 bg-[#166534] hover:bg-[#113B22] text-white rounded-lg font-bold text-[11px] flex items-center gap-1 border border-emerald-400/30 shadow-sm transition-all cursor-pointer"
                >
                  <Crosshair className="w-3 h-3" />
                  <span>Fit Route</span>
                </button>
                <span className="text-[11px] font-bold text-emerald-100 bg-[#166534] px-2.5 py-1 rounded-lg border border-emerald-400/30">
                  ✓ Route: {selectedVehicle.completedStreetsCount} / {(selectedVehicle.completedStreetsCount || 0) + (selectedVehicle.pendingStreetsCount || 0)} Streets ({selectedVehicle.routeCoveragePercentage || 78}%)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Full-Width Live Tracking Map Canvas */}
      <div className="w-full flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative min-h-[550px] lg:min-h-[700px]">
        {/* Map Layer Toolbar */}
          <div className="bg-white/95 backdrop-blur-md px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2 z-10">
            {/* Zone & Vehicle Type Selectors */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-gray-500" /> Zone:
                </span>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="text-xs font-bold bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                >
                  <option value="All">All Zones</option>
                  <option value="North Zone">North Zone</option>
                  <option value="Central Zone">Central Zone</option>
                  <option value="South Zone">South Zone</option>
                  <option value="West Zone">West Zone</option>
                  <option value="East Zone">East Zone</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-gray-500" /> Type:
                </span>
                <select
                  value={selectedVehicleType}
                  onChange={(e) => setSelectedVehicleType(e.target.value)}
                  className="text-xs font-bold bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                >
                  <option value="All">All Types (BOV, Tata Ace, Push Cart)</option>
                  <option value="BOV">⚡ BOV (Battery Operated Vehicle)</option>
                  <option value="Tata Ace">🚚 Tata Ace (Light Waste Carrier)</option>
                  <option value="Push Cart">🛒 Push Cart (Door-to-Door Manual)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Leaflet Map Canvas with Floating Map Style Switcher */}
          <div className="relative w-full flex-1 min-h-[520px] h-[580px] lg:h-[650px] z-0 bg-slate-100 overflow-hidden">
            <div 
              ref={mapContainerRef} 
              className="w-full h-full relative z-0" 
              style={{ minHeight: '520px', width: '100%', height: '100%' }} 
            />

            {/* Floating Top-Right Map Style Selector (Dropdown) */}
            <div className="absolute top-3 right-3 z-20 pointer-events-auto">
              <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-gray-200/90 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <select
                  id="map-layer-dropdown"
                  value={mapLayerType}
                  onChange={(e) => setMapLayerType(e.target.value as any)}
                  className="bg-transparent text-xs font-black text-slate-800 border-none outline-none cursor-pointer py-0.5 pr-2 focus:ring-0"
                  title="Select Map Layer Style"
                >
                  <option value="google_streets">🗺️ Google Ultra-HD</option>
                  <option value="carto_voyager">🏙️ CARTO Crisp Streets</option>
                  <option value="google_satellite">🛰️ Satellite HD</option>
                  <option value="esri_streets">📍 Esri Streets</option>
                  <option value="osm">🌍 OSM</option>
                </select>
              </div>
            </div>

            {/* 🛣️ Dynamic Street Navigation & Traversal HUD (Visible when vehicle is tracked) */}
            {selectedVehicle && (
              <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-auto max-w-2xl mx-auto">
                <div className="bg-slate-950/90 backdrop-blur-md text-white p-3.5 rounded-2xl border-2 border-emerald-500/70 shadow-2xl space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span className="text-xs font-black text-amber-300">
                        {selectedVehicle.vehicleNo}
                      </span>
                      <span className="text-xs text-white/70">•</span>
                      <span className="text-xs font-bold text-emerald-300">
                        📍 {selectedVehicle.currentStreetName || 'Active Street Route'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAdvanceToNextStreet(selectedVehicle.id)}
                        className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-black flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                        title="Simulate Vehicle Entering Next Street"
                      >
                        <span>⚡ அடுத்த தெரு (Next Street)</span>
                      </button>
                      <button
                        onClick={() => setIsStreetListDrawerOpen(true)}
                        className="px-2.5 py-1 bg-[#166534] hover:bg-[#1E7A38] text-emerald-200 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 border border-emerald-400/40 shadow-sm transition-all cursor-pointer"
                        title="View Complete Street Itinerary"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>தெருக்கள் பட்டியல் ({selectedVehicle.completedStreetsCount}/{(selectedVehicle.completedStreetsCount || 0) + (selectedVehicle.pendingStreetsCount || 0)})</span>
                      </button>
                    </div>
                  </div>

                  {/* Route Legend Indicator */}
                  <div className="flex items-center justify-between gap-3 text-[11px] pt-1.5 border-t border-white/10 flex-wrap">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                        <span className="w-3 h-1 bg-emerald-500 rounded-sm"></span> ✅ Done
                      </span>
                      <span className="flex items-center gap-1 text-sky-300 font-semibold">
                        <span className="w-3 h-1 bg-sky-500 rounded-sm"></span> ⚡ Driving Inside
                      </span>
                      <span className="flex items-center gap-1 text-amber-300 font-semibold">
                        <span className="w-3 h-0.5 border-b-2 border-dashed border-amber-400"></span> ⏳ Scheduled
                      </span>
                    </div>
                    <div className="text-[10px] text-white/80 font-medium">
                      Driver: <strong className="text-white">{selectedVehicle.driverName}</strong> | Speed: <strong className="text-emerald-400">{selectedVehicle.speedKmH} km/h</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 📋 Complete Street Route Itinerary Modal Drawer */}
            {isStreetListDrawerOpen && selectedVehicle && (
              <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-500/80 max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
                  {/* Modal Header */}
                  <div className="bg-[#1E7A38] text-white p-4 flex items-center justify-between border-b border-[#166534]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🛣️</span>
                        <h3 className="font-black text-amber-300 text-base">
                          {selectedVehicle.vehicleNo} - அனைத்து தெருக்கள் வழித்தடம் (Assigned Streets)
                        </h3>
                      </div>
                      <p className="text-xs text-emerald-100/90 mt-0.5 font-medium">
                        {selectedVehicle.ward} ({selectedVehicle.zone}) • Driver: {selectedVehicle.driverName}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsStreetListDrawerOpen(false)}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-black text-sm flex items-center justify-center transition-all cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Filter Tabs */}
                  <div className="bg-emerald-50/60 p-3 border-b border-emerald-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      {(['All', 'Completed', 'In Progress', 'Pending'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setStreetFilterTab(tab)}
                          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                            streetFilterTab === tab
                              ? 'bg-[#1E7A38] text-white shadow-sm'
                              : 'bg-white text-gray-700 hover:bg-emerald-100/60 border border-gray-200'
                          }`}
                        >
                          {tab === 'All' ? 'அனைத்தும் (All)' : tab === 'Completed' ? '✅ Completed' : tab === 'In Progress' ? '⚡ In Progress' : '⏳ Scheduled'}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handleAdvanceToNextStreet(selectedVehicle.id)}
                      className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-black text-xs shadow-sm transition-all cursor-pointer"
                    >
                      ⚡ Advance Vehicle Here
                    </button>
                  </div>

                  {/* Street List Body */}
                  <div className="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-gray-100">
                    {(selectedVehicle.assignedRouteStreets || [])
                      .filter((s) => streetFilterTab === 'All' || s.status === streetFilterTab)
                      .map((street, idx) => {
                        const isDone = street.status === 'Completed';
                        const isActive = street.status === 'In Progress';
                        const isPend = street.status === 'Pending';

                        return (
                          <div
                            key={street.id || idx}
                            className={`pt-2.5 first:pt-0 flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                              isActive
                                ? 'bg-sky-50/80 border-sky-300 ring-2 ring-sky-300/50'
                                : isDone
                                ? 'bg-emerald-50/50 border-emerald-200'
                                : 'bg-gray-50/60 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center ${
                                isActive
                                  ? 'bg-sky-600 text-white animate-pulse'
                                  : isDone
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-amber-500 text-white'
                              }`}>
                                {idx + 1}
                              </span>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-gray-900 text-sm">{street.name}</h4>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                    isActive
                                      ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                      : isDone
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                                  }`}>
                                    {isActive ? '⚡ In Progress' : isDone ? '✓ Completed' : '⏳ Scheduled'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {street.notes || 'Ward door-to-door sanitation sweep'} • <strong>{street.collectedHouseholds || (isDone ? street.households : 0)}/{street.households} Houses</strong>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => {
                                  if (street.coordinates && street.coordinates.length > 0) {
                                    handleFocusStreet(street.coordinates);
                                    setIsStreetListDrawerOpen(false);
                                  }
                                }}
                                className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                🎯 Focus
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}


        </div>
      </div>

      {/* 🚀 Interactive Vehicle Movement Details Modal (Triggered by touching moving vehicle) */}
      {isDetailModalOpen && selectedVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-500/80 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#1E7A38] text-white p-5 flex items-center justify-between relative border-b border-[#166534]">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg ${
                  selectedVehicle.type === 'Tata Ace'
                    ? 'bg-sky-700 ring-2 ring-sky-400'
                    : 'bg-[#166534] ring-2 ring-emerald-400'
                }`}>
                  🚚
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-amber-300 tracking-tight">
                      {selectedVehicle.vehicleNo}
                    </h3>
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-[#166534] text-emerald-200 border border-emerald-400/40">
                      {selectedVehicle.type}
                    </span>
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 animate-pulse">
                      ⚡ Moving: {selectedVehicle.speedKmH} km/h
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/90 mt-0.5 font-semibold">
                    📍 {selectedVehicle.ward} • {selectedVehicle.zone} • Route Trajectory Inspector
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#166534] hover:bg-[#113B22] text-emerald-100 hover:text-white flex items-center justify-center font-bold text-sm transition-all cursor-pointer border border-emerald-400/30"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Telemetry Metrics 4-Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-800 block">Live Pace</span>
                  <div className="text-base font-black text-emerald-950 flex items-center gap-1 mt-0.5">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>{selectedVehicle.speedKmH} km/h</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">GPS Active</span>
                </div>

                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-800 block">Traversed Path</span>
                  <div className="text-base font-black text-emerald-950 flex items-center gap-1 mt-0.5">
                    <Route className="w-4 h-4 text-emerald-600" />
                    <span>{selectedVehicle.distanceCoveredKm} km</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">Green Dotted Trail</span>
                </div>

                <div className="bg-sky-50 p-3 rounded-2xl border border-sky-200">
                  <span className="text-[11px] font-bold text-sky-800 block">Payload Fill</span>
                  <div className="text-base font-black text-sky-950 flex items-center gap-1 mt-0.5">
                    <Truck className="w-4 h-4 text-sky-600" />
                    <span>{selectedVehicle.payloadPercent}%</span>
                  </div>
                  <span className="text-[10px] text-sky-700 font-medium">Waste Capacity</span>
                </div>

                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-800 block">Battery / Fuel</span>
                  <div className="text-base font-black text-amber-950 flex items-center gap-1 mt-0.5">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span>{selectedVehicle.batteryLevel || 84}%</span>
                  </div>
                  <span className="text-[10px] text-amber-700 font-medium">Optimal Status</span>
                </div>
              </div>

              {/* Traversed Route Section (Green Dotted Line info) */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="font-black text-sm text-emerald-300">
                      Traversed Green Dotted Route
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-600/50">
                    {selectedVehicle.completedStreetsCount} / {(selectedVehicle.completedStreetsCount || 0) + (selectedVehicle.pendingStreetsCount || 0)} Streets ({selectedVehicle.routeCoveragePercentage || 78}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-emerald-700/50">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                    style={{ width: `${selectedVehicle.routeCoveragePercentage || 78}%` }}
                  />
                </div>

                {/* Streets Covered vs Pending Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                  {/* Covered Streets */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-emerald-800/80">
                    <span className="font-extrabold text-emerald-400 text-[11px] uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Covered Streets ({selectedVehicle.coveredStreetsList?.length || selectedVehicle.completedStreetsCount}):
                    </span>
                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      {selectedVehicle.coveredStreetsList?.map((st, idx) => (
                        <div key={idx} className="flex items-center justify-between text-gray-200 bg-emerald-950/40 px-2 py-1 rounded text-[11px]">
                          <span>✓ {st}</span>
                          <span className="text-[10px] text-emerald-400 font-semibold">Done</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pending Streets */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-rose-800/80">
                    <span className="font-extrabold text-rose-400 text-[11px] uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-rose-400" />
                      Remaining Next ({selectedVehicle.pendingStreetsList?.length || selectedVehicle.pendingStreetsCount}):
                    </span>
                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      {selectedVehicle.pendingStreetsList?.map((st, idx) => (
                        <div key={idx} className="flex items-center justify-between text-gray-200 bg-rose-950/40 px-2 py-1 rounded text-[11px]">
                          <span>⏳ {st}</span>
                          <span className="text-[10px] text-rose-400 font-semibold">Next</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Driver & Sanitation Crew Card */}
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-black text-base">
                    👤
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Assigned Driver & Crew</span>
                    <h4 className="text-sm font-extrabold text-gray-900">{selectedVehicle.driverName}</h4>
                    <span className="text-[11px] text-emerald-800 font-bold">Tel: {selectedVehicle.driverPhone}</span>
                  </div>
                </div>

                <a
                  href={`tel:${selectedVehicle.driverPhone}`}
                  className="px-3.5 py-2 bg-[#1E7A38] hover:bg-[#166534] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Driver</span>
                </a>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="bg-gray-100 p-4 border-t border-gray-200 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleFitCurrentVehicleRoute();
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Fit Trajectory on Map</span>
              </button>

              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  focusOnCoordinates(selectedVehicle.currentPos, 16);
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>Center Live Pin</span>
              </button>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
