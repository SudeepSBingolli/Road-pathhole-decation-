import React, { useMemo, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { createUserPinIcon } from './LeafletMarkerFix';
import { Navigation, Compass } from 'lucide-react';

// Subcomponent to handle map click events
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect({
        lat: Number(e.latlng.lat.toFixed(6)),
        lng: Number(e.latlng.lng.toFixed(6)),
      });
    },
  });
  return null;
};

// Subcomponent to animate map center when coordinates change
const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
};

export const MapPicker = ({ location, onLocationChange, onLocateMe, isLocating }) => {
  const markerRef = useRef(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latlng = marker.getLatLng();
          onLocationChange({
            lat: Number(latlng.lat.toFixed(6)),
            lng: Number(latlng.lng.toFixed(6)),
          });
        }
      },
    }),
    [onLocationChange]
  );

  const centerPos = [location.lat || 30.2672, location.lng || -97.7431];

  return (
    <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-[rgba(130,190,230,0.2)] bg-[#071629] shadow-inner">
      <MapContainer
        center={centerPos}
        zoom={16}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap center={location} />
        <MapClickHandler onLocationSelect={onLocationChange} />

        <Marker
          draggable={true}
          eventHandlers={eventHandlers}
          position={centerPos}
          ref={markerRef}
          icon={createUserPinIcon()}
        />
      </MapContainer>

      {/* Floating GPS Reticle & Locate Me Control */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={onLocateMe}
          disabled={isLocating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-[#73D4FF] bg-[#08192B]/90 hover:bg-[#102944] border border-[rgba(130,190,230,0.25)] rounded-xl shadow-lg backdrop-blur-md transition-all cursor-pointer disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Acquiring GPS...' : 'Auto GPS'}</span>
        </button>
      </div>

      {/* Coordinate Readout Badge */}
      <div className="absolute bottom-3 left-3 z-10 bg-[#08192B]/90 border border-[rgba(130,190,230,0.2)] px-3 py-1.5 rounded-xl backdrop-blur-md text-[11px] font-mono text-[#73D4FF] shadow-lg pointer-events-none">
        <span className="text-[#35D6A0]">● PIN: </span>
        {location.lat?.toFixed(5)}° N, {Math.abs(location.lng || 0)?.toFixed(5)}° W
      </div>
    </div>
  );
};
