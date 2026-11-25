import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { reportApi } from '../../api/reportApi';
import { useGeolocation } from '../../hooks/useGeolocation';
import { MapPicker } from '../../components/map/MapPicker';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import {
  Camera,
  Upload,
  X,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ReportPothole = () => {
  const { coordinates, setCoordinates, loading: geoLoading, getLocation } = useGeolocation();
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('Downtown');
  const [submitting, setSubmitting] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState(null);

  const navigate = useNavigate();

  // Handle image file selection (up to 3)
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 3) {
      toast.error('You can upload a maximum of 3 photos');
      return;
    }

    const validFiles = [];
    const newPreviews = [];

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds the 5MB limit`);
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    setImages((prev) => [...prev, ...validFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (images.length === 0) {
      toast.error('Please upload at least one photo of the road damage');
      return;
    }

    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      toast.error('Please pin the hazard location on the map');
      return;
    }

    setSubmitting(true);
    setDuplicateResult(null);

    try {
      const formData = new FormData();
      formData.append('latitude', coordinates.lat);
      formData.append('longitude', coordinates.lng);
      formData.append('address', address);
      formData.append('area', area);
      formData.append('description', description);

      images.forEach((img) => {
        formData.append('images', img);
      });

      const res = await reportApi.createReport(formData);

      if (res.isDuplicate) {
        setDuplicateResult(res);
        toast.success(res.message, { icon: 'ℹ️' });
      } else {
        toast.success(`Complaint ${res.data.report.complaintId} created successfully!`);
        navigate('/citizen/complaints');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl sm:text-3xl font-serif text-slate-900 tracking-tight">
            Report Road Hazard & Pothole
          </h1>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0A84FF] border border-blue-200">
            CITIZEN REPORT
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Capture photos and set the pin on the map. Our 25-meter proximity detector will automatically
          group community reports to expedite road repair prioritization.
        </p>
      </div>

      {/* Duplicate Alert Banner if triggered */}
      {duplicateResult && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-900">
                Already Reported! Your Voice Was Added
              </h3>
              <p className="text-xs sm:text-sm text-amber-800 mt-1 leading-relaxed">
                An open complaint was already registered within 25 meters of your location:{' '}
                <strong className="text-slate-900 font-semibold">{duplicateResult.parentReport?.complaintId}</strong>.
                We have added your photo, recorded your citizen upvote, and recalculated its priority to{' '}
                <span className="font-extrabold uppercase text-rose-600">
                  {duplicateResult.parentReport?.priority}
                </span>{' '}
                ({duplicateResult.parentReport?.complaintCount} total reports).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60">
            <Link
              to="/citizen/complaints"
              className="inline-flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold text-white bg-[#0A84FF] hover:bg-blue-600 transition-all"
            >
              <span>View My Complaints</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Report Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Photos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold uppercase text-slate-800 flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#FF6B1A]" />
              <span>1. Upload Evidence Photos (Up to 3)</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">{images.length}/3 attached</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Upload Button */}
            {images.length < 3 && (
              <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-200 hover:border-[#FF6B1A] rounded-xl cursor-pointer bg-slate-50 hover:bg-orange-50/20 transition-all text-slate-400 hover:text-[#FF6B1A]">
                <Upload className="w-6 h-6 mb-1 text-slate-400 group-hover:text-[#FF6B1A]" />
                <span className="text-[11px] font-bold">Attach Image</span>
                <span className="text-[9px] text-slate-400">JPG/PNG &lt; 5MB</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}

            {/* Preview Thumbnails */}
            {previewUrls.map((url, idx) => (
              <div
                key={idx}
                className="relative h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group"
              >
                <img src={url} alt="Road damage preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full hover:bg-rose-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: Location Map */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold uppercase text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FF6B1A]" />
              <span>2. Drag Pin to Hazard Location</span>
            </h3>
            <span className="text-xs font-semibold text-emerald-600">GPS Active</span>
          </div>

          <MapPicker
            location={coordinates}
            onLocationChange={setCoordinates}
            onLocateMe={getLocation}
            isLocating={geoLoading}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Street Address / Landmark
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 400 Congress Ave, Near 5th Street"
                className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#FF6B1A] focus:ring-1 focus:ring-[#FF6B1A] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                District / Area
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#FF6B1A] focus:ring-1 focus:ring-[#FF6B1A] transition-all cursor-pointer"
              >
                <option value="Downtown">Downtown Sector</option>
                <option value="North Ward">North Ward</option>
                <option value="South District">South District</option>
                <option value="East Sector">East Sector</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Description & Submit */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold uppercase text-slate-800">
            3. Hazard Details & Notes
          </h3>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe pothole depth, traffic risk, lane obstruction, or any tyre damage..."
            className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#FF6B1A] focus:ring-1 focus:ring-[#FF6B1A] transition-all"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-6 rounded-xl text-sm font-bold text-white bg-[#FF6B1A] hover:bg-[#e05a10] transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            {submitting ? 'Transmitting Incident Report...' : 'Transmit Hazard Report'}
          </button>
        </div>
      </form>
    </div>
  );
};
