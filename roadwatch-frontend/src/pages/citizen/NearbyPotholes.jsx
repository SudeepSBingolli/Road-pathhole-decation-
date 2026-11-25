import React, { useState, useEffect, useCallback } from 'react';
import { reportApi } from '../../api/reportApi';
import { useGeolocation } from '../../hooks/useGeolocation';
import { PotholeMap } from '../../components/map/PotholeMap';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { MapPin, Sliders, Navigation, RefreshCw, ThumbsUp } from 'lucide-react';
import toast from 'react-hot-toast';

export const NearbyPotholes = () => {
  const { coordinates, loading: geoLoading, getLocation } = useGeolocation();
  const [radiusMeters, setRadiusMeters] = useState(5000);
  const [potholes, setPotholes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNearby = useCallback(async () => {
    if (!coordinates.lat || !coordinates.lng) return;
    setLoading(true);
    try {
      const res = await reportApi.getNearby({
        lat: coordinates.lat,
        lng: coordinates.lng,
        radius: radiusMeters,
      });
      setPotholes(res?.data || []);
    } catch (err) {
      console.error('Failed to fetch nearby potholes:', err);
      toast.error('Failed to load nearby potholes');
    } finally {
      setLoading(false);
    }
  }, [coordinates.lat, coordinates.lng, radiusMeters]);

  useEffect(() => {
    fetchNearby();
  }, [fetchNearby]);

  // Handle "I'm affected too" action
  const handleUpvote = async (potholeId) => {
    const pothole = potholes.find((p) => p._id === potholeId);
    if (!pothole) return;

    try {
      const formData = new FormData();
      formData.append('description', `Affected citizen endorsement for ${pothole.complaintId}`);
      formData.append('address', pothole.address);
      formData.append('area', pothole.area);
      formData.append('latitude', pothole.location.coordinates[1].toString());
      formData.append('longitude', pothole.location.coordinates[0].toString());

      const res = await reportApi.createReport(formData);

      toast.success(
        `Endorsement logged! Total reports for ${pothole.complaintId} increased to ${
          res.data?.parentReport?.complaintCount || (pothole.complaintCount || 1) + 1
        }`
      );

      fetchNearby();
    } catch (err) {
      toast.error(err.message || 'Could not record upvote');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-serif text-slate-900 tracking-tight">
              Community Hazards Near You
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0A84FF] border border-blue-200">
              {potholes.length} DETECTED
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Explore live potholes surrounding your GPS location, endorse hazards, and track municipal repairs.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchNearby}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0A84FF]' : ''}`} />
          <span>Refresh Radar</span>
        </button>
      </div>

      {/* Radius Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-[#0A84FF] rounded-xl border border-blue-100">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-slate-800">
              Search Radius: {(radiusMeters / 1000).toFixed(1)} km
            </label>
            <p className="text-[11px] text-slate-500">
              Displaying hazards within radius of active terminal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-1 max-w-xs">
          <input
            type="range"
            min="500"
            max="15000"
            step="500"
            value={radiusMeters}
            onChange={(e) => setRadiusMeters(Number(e.target.value))}
            className="w-full accent-[#0A84FF] cursor-pointer"
          />
        </div>

        <button
          type="button"
          onClick={getLocation}
          disabled={geoLoading}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-[#0A84FF] hover:bg-blue-600 rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
          <span>Recenter GPS</span>
        </button>
      </div>

      {/* Map */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-md">
        <PotholeMap
          center={coordinates}
          zoom={14}
          potholes={potholes}
          radiusMeters={radiusMeters}
          height="h-[650px]"
          onUpvote={handleUpvote}
          onRefreshData={fetchNearby}
        />
      </div>
    </div>
  );
};
