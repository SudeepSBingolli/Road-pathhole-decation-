import React, { useState, useEffect, useCallback } from 'react';
import { taskApi } from '../../api/taskApi';
import { useSocket } from '../../hooks/useSocket';
import { PotholeMap } from '../../components/map/PotholeMap';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { Modal } from '../../components/common/Modal';
import { CardSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Wrench,
  Navigation,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Camera,
  Upload,
  X,
  Play,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Complete Repair Modal
  const [repairModalReport, setRepairModalReport] = useState(null);
  const [beforeImages, setBeforeImages] = useState([]);
  const [beforePreviews, setBeforePreviews] = useState([]);
  const [afterImages, setAfterImages] = useState([]);
  const [afterPreviews, setAfterPreviews] = useState([]);
  const [repairNotes, setRepairNotes] = useState('');
  const [timeTakenHours, setTimeTakenHours] = useState('2.0');
  const [materialsUsed, setMaterialsUsed] = useState('Asphalt Cold Patch (40kg), Bitumen Emulsion (5L)');
  const [submittingRepair, setSubmittingRepair] = useState(false);

  const { subscribe } = useSocket();

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await taskApi.getMyTasks();
      setTasks(res?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load team tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Live Socket updates: new task assigned or status changed
  useEffect(() => {
    const unsub1 = subscribe('task:assigned', () => fetchTasks());
    const unsub2 = subscribe('report:statusChanged', () => fetchTasks());

    return () => {
      unsub1();
      unsub2();
    };
  }, [subscribe, fetchTasks]);

  // Start Task (Transition to 'in-progress')
  const handleStartTask = async (reportId) => {
    try {
      await taskApi.updateStatus(reportId, {
        status: 'in-progress',
        note: 'Maintenance crew arrived on site and commenced repair work',
      });
      toast.success("Task started! Status is now 'in-progress'.");
      fetchTasks();
    } catch (err) {
      toast.error(err.message || 'Could not start task');
    }
  };

  // Open Repair Submission Modal
  const handleOpenRepairModal = (report) => {
    setRepairModalReport(report);
    setBeforeImages([]);
    setBeforePreviews([]);
    setAfterImages([]);
    setAfterPreviews([]);
    setRepairNotes('');
    setTimeTakenHours('2.0');
  };

  const handleBeforeImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    setBeforeImages((prev) => [...prev, ...files].slice(0, 3));
    const previews = files.map((f) => URL.createObjectURL(f));
    setBeforePreviews((prev) => [...prev, ...previews].slice(0, 3));
  };

  const handleAfterImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    setAfterImages((prev) => [...prev, ...files].slice(0, 3));
    const previews = files.map((f) => URL.createObjectURL(f));
    setAfterPreviews((prev) => [...prev, ...previews].slice(0, 3));
  };

  const handleSubmitRepair = async (e) => {
    e.preventDefault();
    if (beforeImages.length === 0 || afterImages.length === 0) {
      toast.error('Please upload at least one Before and one After photo as proof');
      return;
    }

    setSubmittingRepair(true);
    try {
      const formData = new FormData();
      formData.append('notes', repairNotes);
      formData.append('timeTakenHours', timeTakenHours);
      formData.append('materialsUsed', materialsUsed);
      beforeImages.forEach((img) => formData.append('beforePhotos', img));
      afterImages.forEach((img) => formData.append('afterPhotos', img));

      await taskApi.submitRepair(repairModalReport._id, formData);
      toast.success('Repair proof uploaded! Task flagged as repair-completed.');
      setRepairModalReport(null);
      fetchTasks();
    } catch (err) {
      toast.error(err.message || 'Failed to submit repair');
    } finally {
      setSubmittingRepair(false);
    }
  };

  // Automatically focus on active task location if available
  const activeTaskCoords = tasks[0]?.location?.coordinates;
  const initialMapCenter = activeTaskCoords
    ? { lat: activeTaskCoords[1], lng: activeTaskCoords[0] }
    : undefined;

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-serif text-slate-900 tracking-tight">
              Assigned Field Work Orders
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0A84FF] border border-blue-200">
              {tasks.length} ACTIVE ORDERS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Turn-by-turn navigation, live location tracking, and repair proof submission.
          </p>
        </div>
      </div>

      {/* Map View of Assigned Tasks */}
      {tasks.length > 0 && (
        <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-md">
          <PotholeMap
            center={initialMapCenter}
            potholes={tasks}
            height="h-72 sm:h-96"
            actionButtonLabel="Start / Repair"
            onActionButtonClick={(p) => {
              if (p.status === 'in-progress') handleOpenRepairModal(p);
              else handleStartTask(p._id);
            }}
            onRefreshData={fetchTasks}
          />
        </div>
      )}

      {/* Task Cards List */}
      {loading ? (
        <CardSkeleton count={3} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No pending tasks assigned"
          description="Your team has cleared all current dispatch orders. Outstanding work will show up here in real time."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.map((task) => {
            const coords = task.location?.coordinates || [0, 0];
            const lat = coords[1];
            const lng = coords[0];
            const isOverdue = task.isOverdue;
            const isInProgress = task.status === 'in-progress';
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

            return (
              <div
                key={task._id}
                className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                  isOverdue
                    ? 'border-red-400 ring-2 ring-red-100'
                    : 'border-slate-200 hover:border-blue-400'
                }`}
              >
                {/* Top Info */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-[#0A84FF]">
                      {task.complaintId}
                    </span>
                    <div className="flex gap-1.5">
                      <PriorityBadge priority={task.priority} size="xs" />
                      <StatusBadge status={task.status} size="xs" />
                    </div>
                  </div>

                  {isOverdue && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-200">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Task is Overdue! Immediate Action Required
                    </div>
                  )}

                  <p className="text-xs text-slate-800 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {task.description}
                  </p>

                  <div className="text-xs text-slate-500 space-y-1 pt-1 font-sans">
                    <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#FF6B1A] shrink-0" />
                      {task.address} ({task.area})
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      Due by: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  {/* Google Maps Directions */}
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5 text-[#0A84FF]" />
                    Turn-by-Turn GPS Directions
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  {/* Accept & Start or Complete Button */}
                  {!isInProgress ? (
                    <button
                      type="button"
                      onClick={() => handleStartTask(task._id)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold text-white bg-gradient-to-r from-[#FF6B1A] to-[#FF8A00] hover:from-[#FF7A26] hover:to-[#FF9514] rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Accept & Start Work
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenRepairModal(task)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Submit Completed Repair
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Complete Repair Modal */}
      <Modal
        isOpen={Boolean(repairModalReport)}
        onClose={() => setRepairModalReport(null)}
        title={`Submit Repair Proof — ${repairModalReport?.complaintId || ''}`}
        maxWidth="max-w-xl"
      >
        {repairModalReport && (
          <form onSubmit={handleSubmitRepair} className="space-y-4">
            <p className="text-xs text-slate-500">
              Upload before & after photo evidence, record asphalt materials used, and log crew hours.
            </p>

            {/* Before Photos */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-rose-600 mb-1.5">
                Before Photos (Max 3)
              </label>
              <div className="flex gap-2">
                <label className="flex items-center justify-center w-20 h-20 border-2 border-dashed border-rose-300 rounded-xl cursor-pointer bg-rose-50/50 hover:bg-rose-50 text-rose-600 transition-colors">
                  <Camera className="w-5 h-5" />
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleBeforeImageChange}
                    className="hidden"
                  />
                </label>
                {beforePreviews.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt="Before"
                    className="w-20 h-20 object-cover rounded-xl border border-rose-200"
                  />
                ))}
              </div>
            </div>

            {/* After Photos */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1.5">
                After Photos (Max 3)
              </label>
              <div className="flex gap-2">
                <label className="flex items-center justify-center w-20 h-20 border-2 border-dashed border-emerald-300 rounded-xl cursor-pointer bg-emerald-50/50 hover:bg-emerald-50 text-emerald-600 transition-colors">
                  <Camera className="w-5 h-5" />
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleAfterImageChange}
                    className="hidden"
                  />
                </label>
                {afterPreviews.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt="After"
                    className="w-20 h-20 object-cover rounded-xl border border-emerald-200"
                  />
                ))}
              </div>
            </div>

            {/* Hours Taken */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Time Taken (Hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={timeTakenHours}
                  onChange={(e) => setTimeTakenHours(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A84FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Materials Used
                </label>
                <input
                  type="text"
                  required
                  value={materialsUsed}
                  onChange={(e) => setMaterialsUsed(e.target.value)}
                  placeholder="e.g. Hot mix asphalt, sealant"
                  className="w-full px-3 py-2 text-xs bg-slate-50 text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A84FF]"
                />
              </div>
            </div>

            {/* Work Notes */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Repair Notes
              </label>
              <textarea
                rows={2}
                required
                value={repairNotes}
                onChange={(e) => setRepairNotes(e.target.value)}
                placeholder="Excavated loose road debris, applied tack coat, filled with asphalt mix and compacted flat..."
                className="w-full px-3 py-2 text-xs bg-slate-50 text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A84FF]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRepairModalReport(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingRepair}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {submittingRepair ? 'Uploading Proof...' : 'Submit Completed Repair'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
