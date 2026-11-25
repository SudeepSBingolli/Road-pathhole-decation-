import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Report } from '../../types';
import { PRIORITY_CONFIG, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../../lib/constants';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { Button } from '../ui/button';
import { MapPin, Navigation } from 'lucide-react';

// Custom SVG icon generator for map markers with priority colors
const createCustomIcon = (colorHex: string, count: number = 1) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        position: relative;
        width: 34px;
        height: 34px;
        background-color: ${colorHex};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 10px rgba(0,0,0,0.35);
        border: 2px solid #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: #ffffff;
          font-weight: 700;
          font-size: 11px;
          font-family: sans-serif;
        ">${count > 1 ? count : ''}</span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32]
  });
};

// Map Recenter Helper Component
const RecenterMap: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom || map.getZoom());
  }, [center, zoom, map]);
  return null;
};

// Draggable Pin for Report Form
interface DraggableMarkerProps {
  position: [number, number];
  onPositionChange: (pos: [number, number]) => void;
}

const DraggableMarker: React.FC<DraggableMarkerProps> = ({ position, onPositionChange }) => {
  const markerRef = React.useRef<L.Marker>(null);

  const eventHandlers = React.useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          onPositionChange([latLng.lat, latLng.lng]);
        }
      }
    }),
    [onPositionChange]
  );

  useMapEvents({
    click(e) {
      onPositionChange([e.latlng.lat, e.latlng.lng]);
    }
  });

  const pinIcon = createCustomIcon('#1e40af');

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={pinIcon}
    >
      <Popup>
        <div className="text-xs p-1">
          <p className="font-semibold text-primary">Selected Hazard Location</p>
          <p className="text-muted-foreground mt-0.5">Drag pin to adjust exact pothole spot</p>
        </div>
      </Popup>
    </Marker>
  );
};

interface MapViewProps {
  reports?: Report[];
  center?: [number, number];
  zoom?: number;
  interactivePicker?: boolean;
  pickerPosition?: [number, number];
  onPickerPositionChange?: (pos: [number, number]) => void;
  onSelectReport?: (report: Report) => void;
  onAssignReport?: (report: Report) => void;
  className?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  reports = [],
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  interactivePicker = false,
  pickerPosition,
  onPickerPositionChange,
  onSelectReport,
  onAssignReport,
  className = 'h-[500px]'
}) => {
  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-border shadow-soft ${className}`}>
      <MapContainer
        center={pickerPosition || center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap center={pickerPosition || center} zoom={zoom} />

        {/* Draggable Mode for Reporting */}
        {interactivePicker && pickerPosition && onPickerPositionChange && (
          <DraggableMarker
            position={pickerPosition}
            onPositionChange={onPickerPositionChange}
          />
        )}

        {/* Render reports markers */}
        {!interactivePicker &&
          reports.map((report) => {
            const coords = report.location?.coordinates;
            if (!coords || coords.length < 2) return null;
            const [lng, lat] = coords;
            const priorityColor =
              PRIORITY_CONFIG[report.priority]?.colorHex || PRIORITY_CONFIG.low.colorHex;
            const icon = createCustomIcon(priorityColor, report.complaintCount);

            return (
              <Marker key={report._id} position={[lat, lng]} icon={icon}>
                <Popup className="roadwatch-popup">
                  <div className="w-56 p-1 space-y-2">
                    {report.images && report.images.length > 0 && (
                      <div className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-900">
                        <img
                          src={report.images[0].url}
                          alt="Pothole"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {report.complaintId}
                      </span>
                      <PriorityBadge priority={report.priority} size="sm" />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate">{report.address}</span>
                    </div>

                    <div className="pt-1 flex items-center justify-between gap-2 border-t border-border">
                      <StatusBadge status={report.status} size="sm" />

                      {onAssignReport && report.status === 'submitted' && (
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 text-xs px-2.5 rounded-lg"
                          onClick={() => onAssignReport(report)}
                        >
                          Assign
                        </Button>
                      )}

                      {onSelectReport && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2.5 rounded-lg"
                          onClick={() => onSelectReport(report)}
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
};
