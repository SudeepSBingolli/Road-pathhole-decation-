import React, { useState, useEffect, useCallback } from 'react';
import { repairApi } from '../../api/repairApi';
import { useSocket } from '../../hooks/useSocket';
import { BeforeAfterViewer } from '../../components/common/BeforeAfterViewer';
import { CardSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  ShieldCheck,
  Check,
  X,
  Clock,
  Wrench,
  AlertCircle,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const RepairVerification = () => {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [filter, setFilter] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'

  const { subscribe } = useSocket();

  const fetchRepairs = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await repairApi.listRepairs(params);
      setRepairs(res?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load repair submissions');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRepairs();
  }, [fetchRepairs]);

  // Live Socket update when new repairs arrive
  useEffect(() => {
    const unsub = subscribe('repair:submitted', () => {
      fetchRepairs();
    });

    return () => {
      if (unsub) unsub();
    };
  }, [subscribe, fetchRepairs]);

  const handleVerify = async (repairId, status) => {
    setSubmittingId(repairId);
    try {
      await repairApi.verifyRepair(repairId, {
        status,
        remarks: remarks[repairId] || `Quality verification ${status} by inspector`,
      });
      toast.success(
        status === 'approved'
          ? 'Repair verified and closed successfully!'
          : 'Repair rejected. Rework requested from crew.'
      );
      fetchRepairs();
    } catch (err) {
      toast.error(err.message || 'Failed to verify repair');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-serif text-slate-900 tracking-tight">
              Repair Quality & Photographic Verification
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0A84FF] border border-blue-200">
              QA AUDIT
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Audit before & after photographic evidence, check asphalt compaction quality, and verify or request rework.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold bg-white text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF6B1A] shadow-xs cursor-pointer"
          >
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved & Closed</option>
            <option value="rejected">Rejected (Rework)</option>
            <option value="all">All Submissions</option>
          </select>

          <button
            type="button"
            onClick={fetchRepairs}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200 rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Refresh submissions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0A84FF]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <CardSkeleton count={3} />
      ) : repairs.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Verification queue is clear"
          description={`There are currently no repair submissions matching status '${filter}'.`}
        />
      ) : (
        <div className="space-y-6">
          {repairs.map((repair) => {
            const report = repair.report || {};
            const team = repair.team || {};
            const submittedBy = repair.submittedBy || {};
            const isPending = repair.verification?.status === 'pending';
            const isApproved = repair.verification?.status === 'approved';
            const isRejected = repair.verification?.status === 'rejected';

            return (
              <div
                key={repair._id}
                className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-[0_2px_14px_rgba(0,0,0,0.03)] p-6 space-y-6"
              >
                {/* Header Information */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-900">
                        {report.complaintId || 'Report'}
                      </span>
                      {isPending && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Pending Approval
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Approved & Fixed
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Rejected for Rework
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#FF6B1A]" />
                      {report.address} ({report.area})
                    </p>
                  </div>

                  <div className="text-right text-xs">
                    <p className="font-semibold text-slate-800">Team: {team.name}</p>
                    <p className="text-slate-400">
                      Completed by {submittedBy.name} &bull; {repair.timeTakenHours} hrs
                    </p>
                  </div>
                </div>

                {/* Side-by-side Evidence Viewer */}
                <BeforeAfterViewer
                  beforeImages={repair.beforeImages}
                  afterImages={repair.afterImages}
                />

                {/* Work Notes & Materials */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="font-bold uppercase text-[10px] text-slate-500">
                      Crew Work Notes
                    </span>
                    <p className="text-slate-800 leading-relaxed">
                      {repair.notes || 'No extra notes provided.'}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="font-bold uppercase text-[10px] text-slate-500">
                      Materials Applied
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {repair.materialsUsed && repair.materialsUsed.length > 0 ? (
                        repair.materialsUsed.map((m, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 text-[11px] font-medium"
                          >
                            {m}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">Standard Asphalt Cold-Mix</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Approval or Rejection Actions */}
                {isPending && (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <label className="block text-xs font-bold uppercase text-slate-700">
                      Verification Remarks / Quality Audit Notes
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={remarks[repair._id] || ''}
                        onChange={(e) =>
                          setRemarks((prev) => ({ ...prev, [repair._id]: e.target.value }))
                        }
                        placeholder="e.g. Surface level smooth, compaction adequate. Approved."
                        className="flex-1 px-3.5 py-2 text-xs bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#FF6B1A]"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={submittingId === repair._id}
                          onClick={() => handleVerify(repair._id, 'approved')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Close</span>
                        </button>
                        <button
                          type="button"
                          disabled={submittingId === repair._id}
                          onClick={() => handleVerify(repair._id, 'rejected')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject Rework</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
