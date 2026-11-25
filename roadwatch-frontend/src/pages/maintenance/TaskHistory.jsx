import React, { useState, useEffect } from 'react';
import { repairApi } from '../../api/repairApi';
import { useAuth } from '../../hooks/useAuth';
import { BeforeAfterViewer } from '../../components/common/BeforeAfterViewer';
import { CardSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { CheckCircle2, XCircle, Clock, MapPin, RefreshCw, History } from 'lucide-react';
import toast from 'react-hot-toast';

export const TaskHistory = () => {
  const { user } = useAuth();
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = user?.team ? { teamId: user.team } : {};
      const res = await repairApi.listRepairs(params);
      setRepairs(res?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load completed task history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user?.team]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-serif text-slate-900 tracking-tight">
              Completed Work Orders History
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0A84FF] border border-blue-200">
              ARCHIVE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Archive of repairs submitted by your team and supervisor verification verdicts.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0A84FF]' : ''}`} />
          <span>Refresh History</span>
        </button>
      </div>

      {/* List */}
      {loading ? (
        <CardSkeleton count={3} />
      ) : repairs.length === 0 ? (
        <EmptyState
          icon={History}
          title="No completed repairs recorded"
          description="Repairs submitted by your crew will appear here once finished."
        />
      ) : (
        <div className="space-y-6">
          {repairs.map((repair) => {
            const report = repair.report || {};
            const verification = repair.verification || {};
            const isApproved = verification.status === 'approved';
            const isRejected = verification.status === 'rejected';

            return (
              <div
                key={repair._id}
                className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)] space-y-5"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {report.complaintId || 'Task'}
                      </span>
                      {isApproved && (
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified & Approved
                        </span>
                      )}
                      {isRejected && (
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" /> Rework Requested
                        </span>
                      )}
                      {!isApproved && !isRejected && (
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5" /> Pending Verification
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#FF6B1A]" />
                      {report.address} ({report.area})
                    </p>
                  </div>

                  <span className="text-xs text-slate-400">
                    Completed: {new Date(repair.completedAt).toLocaleDateString()} &bull;{' '}
                    {repair.timeTakenHours} hrs
                  </span>
                </div>

                {/* Proof */}
                <BeforeAfterViewer
                  beforeImages={repair.beforeImages}
                  afterImages={repair.afterImages}
                />

                {/* Supervisor Notes if any */}
                {verification.remarks && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                      isApproved
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <p className="font-bold uppercase tracking-wider text-[10px]">
                      Supervisor Inspection Audit:
                    </p>
                    <p className="leading-relaxed text-slate-800">{verification.remarks}</p>
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
