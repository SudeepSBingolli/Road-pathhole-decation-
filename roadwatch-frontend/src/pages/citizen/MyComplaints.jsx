import React, { useState, useEffect } from 'react';
import { reportApi } from '../../api/reportApi';
import { repairApi } from '../../api/repairApi';
import { useSocket } from '../../hooks/useSocket';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { Timeline } from '../../components/common/Timeline';
import { Drawer } from '../../components/common/Drawer';
import { CardSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { BeforeAfterViewer } from '../../components/common/BeforeAfterViewer';
import {
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  Users,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [associatedRepair, setAssociatedRepair] = useState(null);
  const [loadingRepair, setLoadingRepair] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const { subscribe } = useSocket();

  const fetchComplaints = async () => {
    try {
      const res = await reportApi.listReports({ myReports: 'true', limit: 50 });
      setComplaints(res?.data || []);
    } catch (err) {
      console.error('Failed to fetch user complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Live Socket update without refreshing
  useEffect(() => {
    const unsub = subscribe('report:statusChanged', (updatedReport) => {
      setComplaints((prev) =>
        prev.map((c) => (c._id === updatedReport._id ? { ...c, ...updatedReport } : c))
      );
      if (selectedReport?._id === updatedReport._id) {
        setSelectedReport((prev) => ({ ...prev, ...updatedReport }));
      }
    });

    return () => {
      if (unsub) unsub();
    };
  }, [subscribe, selectedReport]);

  const handleOpenReport = async (report) => {
    setSelectedReport(report);
    setAssociatedRepair(null);

    if (report.status === 'repair-completed' || report.status === 'verified') {
      setLoadingRepair(true);
      try {
        const res = await repairApi.getRepairByReport(report._id);
        setAssociatedRepair(res?.data || null);
      } catch (err) {
        console.debug('No repair found:', err);
      } finally {
        setLoadingRepair(false);
      }
    }
  };

  const filteredComplaints = complaints.filter((item) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') {
      return ['submitted', 'under-review', 'assigned', 'in-progress'].includes(item.status);
    }
    if (statusFilter === 'completed') {
      return ['repair-completed', 'verified'].includes(item.status);
    }
    return item.status === statusFilter;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-serif text-slate-900 tracking-tight">
              My Submitted Incidents
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0A84FF] border border-blue-200">
              {complaints.length} SUBMITTED
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Track real-time maintenance status, crew assignments, and repair evidence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold bg-white text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF6B1A] shadow-xs cursor-pointer"
          >
            <option value="all">All Complaints ({complaints.length})</option>
            <option value="active">Active In-Progress</option>
            <option value="completed">Completed & Verified</option>
            <option value="duplicate">Duplicates</option>
          </select>

          <Link
            to="/citizen/report"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF6B1A] hover:bg-[#e05a10] text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Report</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : filteredComplaints.length === 0 ? (
        <EmptyState
          title="No complaints found"
          description={
            statusFilter === 'all'
              ? "You haven't reported any road damage yet."
              : `No complaints found with status '${statusFilter}'.`
          }
          actionText="Report a Pothole"
          actionLink="/citizen/report"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredComplaints.map((item) => {
            const thumbnail =
              item.images?.[0]?.url ||
              'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800';

            return (
              <div
                key={item._id}
                onClick={() => handleOpenReport(item)}
                className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-[0_2px_14px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group flex flex-col"
              >
                {/* Photo Thumbnail */}
                <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
                  <img
                    src={thumbnail}
                    alt={item.complaintId}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <PriorityBadge priority={item.priority} size="xs" />
                  </div>
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={item.status} size="xs" />
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800">
                        {item.complaintId}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-900 line-clamp-1">
                      {item.description}
                    </p>

                    <p className="text-xs text-slate-500 line-clamp-1 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#FF6B1A] shrink-0" />
                      {item.address} ({item.area})
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {item.complaintCount} community report(s)
                    </span>
                    <span className="font-bold text-[#FF6B1A] group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-[11px]">
                      View Timeline <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Complaint Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        title={`Incident Details — ${selectedReport?.complaintId || ''}`}
      >
        {selectedReport && (
          <div className="space-y-6">
            {/* Status & Priority header */}
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  Status
                </p>
                <StatusBadge status={selectedReport.status} size="md" />
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  Priority
                </p>
                <PriorityBadge priority={selectedReport.priority} size="md" />
              </div>
            </div>

            {/* Photos */}
            {selectedReport.images && selectedReport.images.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Reported Photographs
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedReport.images.map((img, idx) => (
                    <a
                      key={idx}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 block group"
                    >
                      <img
                        src={img.url}
                        alt="Pothole"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Address & Description */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Hazard Location & Street
              </h4>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1 text-xs">
                <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#FF6B1A]" />
                  {selectedReport.address}
                </p>
                <p className="text-slate-500 pl-5.5">Operating Area: {selectedReport.area}</p>
              </div>

              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pt-2">
                Citizen Notes
              </h4>
              <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                {selectedReport.description}
              </p>
            </div>

            {/* Repair Evidence (Before / After) if fixed */}
            {loadingRepair ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Scanning repair logs...
              </div>
            ) : associatedRepair ? (
              <BeforeAfterViewer
                beforeImages={associatedRepair.beforeImages}
                afterImages={associatedRepair.afterImages}
              />
            ) : null}

            {/* Status History Timeline */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Resolution Timeline
              </h4>
              <Timeline history={selectedReport.statusHistory} />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
