import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { createPriorityIcon, createUserPinIcon, createCrewPinIcon } from './LeafletMarkerFix';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { useSocket } from '../../hooks/useSocket';
import {
  ThumbsUp,
  ArrowRight,
  MapPin,
  Layers,
  Crosshair,
  Maximize2,
  Minimize2,
  Navigation,
  Compass,
  AlertTriangle,
  RefreshCw,
  Eye,
  CheckCircle2,
  Radio,
  Sliders,
  ShieldCheck,
  Wrench,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

// Helper component to bind Map instance and allow imperative controls
const MapController = ({
  center,
  zoom,
  deviceLocation,
  followUser,
  setMapInstance,
  potholes,
}) => {
  const map = useMap();
  const hasAutoCenteredOnUser = useRef(false);
  const hasAutoCenteredOnPotholes = useRef(false);

  useEffect(() => {
    setMapInstance(map);
  }, [map, setMapInstance]);

  // When device location is acquired for the first time, automatically fly/pan to it!
  useEffect(() => {
    if (deviceLocation && deviceLocation.lat && deviceLocation.lng && !hasAutoCenteredOnUser.current) {
      hasAutoCenteredOnUser.current = true;
      map.setView([deviceLocation.lat, deviceLocation.lng], 15, { animate: true });
    }
  }, [deviceLocation, map]);

  // If no device location yet, but potholes are loaded, center on the first pothole
  useEffect(() => {
    if (
      !hasAutoCenteredOnUser.current &&
      !hasAutoCenteredOnPotholes.current &&
      potholes &&
      potholes.length > 0
    ) {
      const firstValid = potholes.find(
        (p) => p.location?.coordinates && Array.isArray(p.location.coordinates)
      );
      if (firstValid) {
        hasAutoCenteredOnPotholes.current = true;
        const [lng, lat] = firstValid.location.coordinates;
        map.setView([lat, lng], zoom || 14, { animate: true });
      }
    }
  }, [potholes, zoom, map]);

  // Recenter when center prop updates manually
  useEffect(() => {
    if (center && center.lat && center.lng && !followUser && !hasAutoCenteredOnUser.current) {
      map.setView([center.lat, center.lng], zoom || map.getZoom(), { animate: true });
    }
  }, [center, zoom, followUser, map]);

  // Follow device GPS continuously if followUser toggle is active
  useEffect(() => {
    if (followUser && deviceLocation && deviceLocation.lat && deviceLocation.lng) {
      map.panTo([deviceLocation.lat, deviceLocation.lng], { animate: true });
    }
  }, [deviceLocation, followUser, map]);

  return null;
};

export const PotholeMap = ({
  center,
  zoom = 14,
  potholes = [],
  radiusMeters,
  onUpvote,
  onSelectPothole,
  actionButtonLabel,
  onActionButtonClick,
  height = 'h-[560px]',
  interactiveFilters = true,
  onRefreshData,
}) => {
  const [mapInstance, setMapInstance] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [tileLayerKey, setTileLayerKey] = useState('osm');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Retrieve cached device coords from sessionStorage if available
  const getCachedCoords = () => {
    try {
      const saved = sessionStorage.getItem('roadguard_device_coords');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lat && parsed.lng) return parsed;
      }
    } catch {}
    return null;
  };

  // Device Geolocation state
  const [deviceLocation, setDeviceLocation] = useState(getCachedCoords);
  const [isLocating, setIsLocating] = useState(false);
  const [followUser, setFollowUser] = useState(false);

  // Live real-time pothole markers and maintenance crews state
  const [livePotholes, setLivePotholes] = useState(potholes);
  const [crewLocations, setCrewLocations] = useState([]);

  const { subscribe, connected } = useSocket();

  // Sync internal potholes state when props change
  useEffect(() => {
    setLivePotholes(potholes);
  }, [potholes]);

  // Tile Providers (Standard OpenStreetMap with zero watermarks, plus Satellite & Topo)
  const tileProviders = {
    osm: {
      name: 'Roads & Streets',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    },
    satellite: {
      name: 'Satellite View',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
    },
    topo: {
      name: 'Topographic',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri',
    },
  };

  const updateLocation = useCallback((position, isManual = false) => {
    const { latitude, longitude, accuracy, heading, speed } = position.coords;
    const newCoords = {
      lat: Number(latitude.toFixed(6)),
      lng: Number(longitude.toFixed(6)),
      accuracy: Math.round(accuracy || 0),
      heading: heading || null,
      speed: speed || null,
      timestamp: position.timestamp,
    };

    setDeviceLocation(newCoords);
    setIsLocating(false);

    try {
      sessionStorage.setItem('roadguard_device_coords', JSON.stringify(newCoords));
    } catch {}

    if (isManual && mapInstance) {
      mapInstance.setView([newCoords.lat, newCoords.lng], 16, { animate: true });
      toast.success('Map centered on your current location', { id: 'gps-center' });
    }
  }, [mapInstance]);

  // Robust location acquisition: High accuracy with silent fallback to standard WiFi accuracy
  const requestLocation = useCallback((isManual = false) => {
    if (!navigator.geolocation) {
      if (isManual) toast.error('Geolocation is not supported by your browser');
      return;
    }

    if (isManual) setIsLocating(true);

    const tryStandardAccuracy = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => updateLocation(pos, isManual),
        (err) => {
          setIsLocating(false);
          if (isManual) {
            toast.error(
              err.code === err.PERMISSION_DENIED
                ? 'Location permission denied. Please allow GPS access in your browser settings.'
                : 'Unable to retrieve your location.',
              { id: 'gps-error' }
            );
          }
        },
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
      );
    };

    // First try high accuracy
    navigator.geolocation.getCurrentPosition(
      (pos) => updateLocation(pos, isManual),
      (err) => {
        // If high accuracy times out or is unavailable, silently try standard accuracy
        if (err.code === 3 || err.code === 2) {
          tryStandardAccuracy();
        } else {
          setIsLocating(false);
          if (isManual) {
            toast.error('Location access denied in browser settings.', { id: 'gps-error' });
          }
        }
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 30000 }
    );
  }, [updateLocation]);

  // Request location on mount
  useEffect(() => {
    requestLocation(false);
  }, [requestLocation]);

  // Background watchPosition for continuous tracking without noisy error toasts
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => updateLocation(pos, false),
      () => {}, // Silently ignore passive background timeouts
      { enableHighAccuracy: false, timeout: 25000, maximumAge: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [updateLocation]);

  // Center on device GPS on demand (when user clicks "My Location")
  const handleCenterOnMyLocation = () => {
    if (deviceLocation && mapInstance) {
      mapInstance.setView([deviceLocation.lat, deviceLocation.lng], 16, { animate: true });
      toast.success('Map centered on your current location', { id: 'gps-center' });
    }
    requestLocation(true);
  };

  // Toggle Fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => {
      const next = !prev;
      setTimeout(() => {
        if (mapInstance) mapInstance.invalidateSize();
      }, 200);
      return next;
    });
  };

  // Real-time Socket.IO monitoring
  useEffect(() => {
    const unsubNew = subscribe('report:new', (payload) => {
      if (payload && payload._id) {
        setLivePotholes((prev) => {
          if (prev.some((p) => p._id === payload._id)) return prev;
          return [payload, ...prev];
        });
        toast('New pothole hazard plotted on map', { icon: '📍' });
      }
    });

    const unsubStatus = subscribe('report:statusChanged', (payload) => {
      if (payload && payload._id) {
        setLivePotholes((prev) =>
          prev.map((p) => (p._id === payload._id ? { ...p, ...payload } : p))
        );
      }
    });

    const unsubRepaired = subscribe('repair:submitted', (payload) => {
      if (payload && payload.report) {
        const reportId = payload.report._id || payload.report;
        setLivePotholes((prev) =>
          prev.map((p) =>
            p._id === reportId ? { ...p, status: 'repair-completed' } : p
          )
        );
      }
    });

    const unsubVerified = subscribe('repair:verified', (payload) => {
      if (payload && payload.report) {
        const reportId = payload.report._id || payload.report;
        setLivePotholes((prev) =>
          prev.map((p) =>
            p._id === reportId ? { ...p, status: 'verified' } : p
          )
        );
      }
    });

    const unsubCrew = subscribe('team:location', (crewData) => {
      if (crewData && crewData.teamId && crewData.lat && crewData.lng) {
        setCrewLocations((prev) => {
          const filtered = prev.filter((c) => c.teamId !== crewData.teamId);
          return [...filtered, crewData];
        });
      }
    });

    return () => {
      unsubNew();
      unsubStatus();
      unsubRepaired();
      unsubVerified();
      unsubCrew();
    };
  }, [subscribe]);

  // Filtering logic
  const displayedPotholes = useMemo(() => {
    return livePotholes.filter((p) => {
      const coords = p.location?.coordinates;
      if (!coords || !Array.isArray(coords) || coords.length !== 2) return false;
      const [lng, lat] = coords;
      if (typeof lng !== 'number' || typeof lat !== 'number') return false;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;

      const isRepaired = p.status === 'repair-completed' || p.status === 'verified';

      if (filterSeverity === 'repaired') return isRepaired;
      if (filterSeverity === 'high') {
        return !isRepaired && (p.priority === 'critical' || p.priority === 'high');
      }
      if (filterSeverity === 'medium') {
        return !isRepaired && p.priority === 'medium';
      }
      if (filterSeverity === 'low') {
        return !isRepaired && p.priority === 'low';
      }
      return true;
    });
  }, [livePotholes, filterSeverity]);

  // Determine initial center
  const initialPos = useMemo(() => {
    if (deviceLocation) return [deviceLocation.lat, deviceLocation.lng];
    if (center && center.lat && center.lng) return [center.lat, center.lng];
    if (potholes.length > 0 && potholes[0]?.location?.coordinates) {
      return [potholes[0].location.coordinates[1], potholes[0].location.coordinates[0]];
    }
    return [12.9716, 77.5946]; // Modern neutral center
  }, [deviceLocation, center, potholes]);

  return (
    <div
      className={`relative w-full ${
        isFullscreen
          ? 'fixed inset-0 z-[9999] h-screen rounded-none bg-slate-900'
          : `${height} rounded-2xl`
      } overflow-hidden border border-slate-200/80 shadow-md bg-slate-100 flex flex-col font-sans transition-all duration-200`}
    >
      {/* Top Floating Controls & HUD Bar */}
      <div className="absolute top-3 inset-x-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Left: Telemetry & Live Marker Stats */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md text-xs pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="font-extrabold text-slate-800 tracking-tight">ROADGUARD LIVE MAP</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600 font-mono text-[11px]">
            {deviceLocation
              ? `${deviceLocation.lat.toFixed(4)}° N, ${Math.abs(deviceLocation.lng).toFixed(4)}° W`
              : `${initialPos[0].toFixed(4)}° N, ${Math.abs(initialPos[1]).toFixed(4)}° W`}
          </span>
          {deviceLocation && (
            <span className="hidden sm:inline-block text-[10px] text-blue-600 font-mono font-bold bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">
              ±{deviceLocation.accuracy}m
            </span>
          )}
          <span className="text-slate-300">|</span>
          <span className="text-[#FF6B1A] font-bold text-[11px]">
            {displayedPotholes.length} Hazards
          </span>
        </div>

        {/* Right: Map Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          
          {/* Severity & Status Filters */}
          {interactiveFilters && (
            <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md text-xs">
              <button
                type="button"
                onClick={() => setFilterSeverity('all')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  filterSeverity === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterSeverity('high')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  filterSeverity === 'high'
                    ? 'bg-red-500 text-white shadow-xs'
                    : 'text-red-600 hover:bg-red-50'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" /> High
              </button>
              <button
                type="button"
                onClick={() => setFilterSeverity('medium')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  filterSeverity === 'medium'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-orange-600 hover:bg-orange-50'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" /> Med
              </button>
              <button
                type="button"
                onClick={() => setFilterSeverity('low')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  filterSeverity === 'low'
                    ? 'bg-yellow-500 text-white shadow-xs'
                    : 'text-yellow-600 hover:bg-yellow-50'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" /> Low
              </button>
              <button
                type="button"
                onClick={() => setFilterSeverity('repaired')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  filterSeverity === 'repaired'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" /> Fixed
              </button>
            </div>
          )}

          {/* Layer Selector */}
          <div className="flex items-center rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md p-1">
            <button
              type="button"
              onClick={() =>
                setTileLayerKey((prev) => (prev === 'osm' ? 'satellite' : prev === 'satellite' ? 'topo' : 'osm'))
              }
              title={`Switch layer: Current is ${tileProviders[tileLayerKey].name}`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-[#0A84FF]" />
              <span className="text-[11px] hidden sm:inline">{tileProviders[tileLayerKey].name}</span>
            </button>
          </div>

          {/* Follow GPS Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !followUser;
              setFollowUser(next);
              if (next && deviceLocation && mapInstance) {
                mapInstance.panTo([deviceLocation.lat, deviceLocation.lng], { animate: true });
                toast.success('Auto-following device location', { id: 'gps-follow' });
              } else if (!next) {
                toast('Auto-follow paused', { id: 'gps-follow' });
              }
            }}
            title={followUser ? 'Disable follow location' : 'Enable follow location'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold shadow-md transition-all cursor-pointer ${
              followUser
                ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/25'
                : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Compass className={`w-3.5 h-3.5 ${followUser ? 'animate-spin' : ''}`} />
            <span className="text-[11px] hidden sm:inline">Follow GPS</span>
          </button>

          {/* "My Location" Button */}
          <button
            type="button"
            onClick={handleCenterOnMyLocation}
            disabled={isLocating}
            title="Center map on my location"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A84FF] hover:bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-60"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span className="text-[11px]">My Location</span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
            className="p-2 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-md transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <MapContainer
        center={initialPos}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0 font-sans"
      >
        <TileLayer
          key={tileLayerKey}
          attribution={tileProviders[tileLayerKey].attribution}
          url={tileProviders[tileLayerKey].url}
          maxZoom={19}
        />

        <MapController
          center={center}
          zoom={zoom}
          deviceLocation={deviceLocation}
          followUser={followUser}
          setMapInstance={setMapInstance}
          potholes={livePotholes}
        />

        {/* Optional Radius Circle */}
        {radiusMeters && (
          <Circle
            center={initialPos}
            radius={radiusMeters}
            pathOptions={{
              color: '#0A84FF',
              fillColor: '#0A84FF',
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: '4, 4',
            }}
          />
        )}

        {/* User Active GPS Location Marker */}
        {deviceLocation && (
          <>
            <Circle
              center={[deviceLocation.lat, deviceLocation.lng]}
              radius={Math.max(deviceLocation.accuracy || 15, 10)}
              pathOptions={{
                color: '#0A84FF',
                fillColor: '#0A84FF',
                fillOpacity: 0.12,
                weight: 1,
              }}
            />
            <Marker
              position={[deviceLocation.lat, deviceLocation.lng]}
              icon={createUserPinIcon(deviceLocation.heading)}
            >
              <Popup className="custom-light-popup">
                <div className="bg-white text-slate-800 p-3 rounded-xl border border-slate-200 shadow-xl min-w-[210px] text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-[#0A84FF]">
                    <Navigation className="w-4 h-4 fill-[#0A84FF]/20" />
                    <span>Your Current Location</span>
                  </div>
                  <p className="font-mono text-[11px] text-slate-600">
                    {deviceLocation.lat.toFixed(5)}° N, {Math.abs(deviceLocation.lng).toFixed(5)}° W
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>Accuracy: ±{deviceLocation.accuracy}m</span>
                    {deviceLocation.speed !== null && (
                      <span>Speed: {Math.round((deviceLocation.speed || 0) * 3.6)} km/h</span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Maintenance Team Field Vehicle Markers */}
        {crewLocations.map((crew) => (
          <Marker
            key={crew.teamId}
            position={[crew.lat, crew.lng]}
            icon={createCrewPinIcon(crew.teamName)}
          >
            <Popup className="custom-light-popup">
              <div className="bg-white text-slate-800 p-3 rounded-xl border border-slate-200 shadow-xl min-w-[200px] text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#FF8A00]">
                  <Wrench className="w-4 h-4" />
                  <span>Maintenance Team</span>
                </div>
                <p className="font-bold text-slate-900">{crew.teamName}</p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Sector: {crew.sector || 'Corridor North'}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Real MongoDB Pothole Markers */}
        {displayedPotholes.map((pothole) => {
          const coords = pothole.location?.coordinates;
          const pos = [coords[1], coords[0]];

          const thumbnail =
            pothole.images?.[0]?.url ||
            'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400';

          const formattedDate = new Date(pothole.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          return (
            <Marker
              key={pothole._id || pothole.complaintId}
              position={pos}
              icon={createPriorityIcon(pothole.priority, pothole.status, pothole.complaintCount)}
            >
              <Popup className="custom-light-popup">
                <div className="w-72 bg-white text-slate-800 p-3.5 rounded-2xl border border-slate-200 space-y-3 shadow-2xl">
                  {/* Photo Preview & Badges */}
                  <div className="relative h-32 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={thumbnail}
                      alt="Pothole Damage"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <PriorityBadge priority={pothole.priority} size="xs" />
                    </div>
                    <div className="absolute top-2 right-2">
                      <StatusBadge status={pothole.status} size="xs" />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono text-white">
                      AI CONFIDENCE: 98.4%
                    </div>
                  </div>

                  {/* Identification & Geo Details */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-900">
                      <span>{pothole.complaintId}</span>
                      <span className="text-slate-500 font-sans font-normal text-[11px]">
                        {pothole.area}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-900 mt-1 line-clamp-2">
                      {pothole.description}
                    </p>

                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#FF6B1A] shrink-0" />
                      <span>{pothole.address}</span>
                    </p>

                    <p className="text-[10px] font-mono text-blue-600 mt-1">
                      {coords[1].toFixed(5)}° N, {Math.abs(coords[0]).toFixed(5)}° W
                    </p>
                  </div>

                  {/* Date & Support */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>Logged: {formattedDate}</span>
                    <span>{pothole.complaintCount || 1} report(s)</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    {onUpvote && (
                      <button
                        type="button"
                        onClick={() => onUpvote(pothole._id)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>Upvote</span>
                      </button>
                    )}

                    {onActionButtonClick ? (
                      <button
                        type="button"
                        onClick={() => onActionButtonClick(pothole)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#FF6B1A] to-[#FF8A00] hover:from-[#FF7A26] hover:to-[#FF9514] shadow-xs transition-colors cursor-pointer"
                      >
                        <span>{actionButtonLabel || 'Dispatch'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : onSelectPothole ? (
                      <button
                        type="button"
                        onClick={() => onSelectPothole(pothole)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-[#0A84FF] hover:bg-blue-600 shadow-xs transition-colors cursor-pointer"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-3 inset-x-3 z-[1000] pointer-events-none flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md text-[11px] text-slate-600 font-medium pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>REAL-TIME SATELLITE DISPATCH</span>
          <span className="text-slate-300">|</span>
          <span className="text-[#0A84FF] font-semibold font-mono">
            LAYER: {tileProviders[tileLayerKey].name.toUpperCase()}
          </span>
        </div>

        {onRefreshData && (
          <button
            type="button"
            onClick={onRefreshData}
            title="Refresh Map Data"
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-md pointer-events-auto transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-[#0A84FF]" />
            <span className="text-[11px]">Refresh</span>
          </button>
        )}
      </div>
    </div>
  );
};
