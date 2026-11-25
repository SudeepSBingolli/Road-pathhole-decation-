import React, { useState, useEffect, useCallback } from 'react';
import { reportApi } from '../../api/reportApi';
import { teamApi } from '../../api/teamApi';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { Timeline } from '../../components/common/Timeline';
import { Modal } from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Search,
  Filter,
  Eye,
  Send,
  XCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  MapPin,
  Calendar,
  Wrench,
  ShieldAlert,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ComplaintsTable = () => {
  const [reports, setReports] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [area, setArea] = useState('');

  // Selected for Modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalTab, setModalTab] = useState('details'); // 'details' | 'assign' | 'priority' | 'actions'

  // Form states inside modal
  const [assignTeamId, setAssignTeamId] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [priorityNote, setPriorityNote] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 12,
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
        ...(area ? { area } : {}),
      };

      const res = await reportApi.listReports(params);
      setReports(res?.data || []);
      setTotal(res?.pagination?.total || 0);
      setPages(res?.pagination?.pages || 1);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load incident reports');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, priority, area]);

  const fetchTeams = async () => {
    try {
      const res = await teamApi.listTeams();
      setTeams(res?.data || []);
      if (res?.data?.length > 0) {
        setAssignTeamId(res.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    fetchTeams();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    setAssignDueDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const handleOpenModal = (report, tab = 'details') => {
    setSelectedReport(report);
    setModalTab(tab);
    setNewPriority(report.priority);
  };

  // 1. Assign Team
  const handleAssignTeam = async (e) => {
    e.preventDefault();
    if (!assignDueDate) {
      toast.error('Please specify a due date');
      return;
    }

    setSubmittingAction(true);
    try {
      await reportApi.assignTeam(selectedReport._id, {
        teamId: assignTeamId,
        dueDate: new Date(assignDueDate).toISOString(),
        note: assignNote || 'Assigned via Incident Management triage',
      });
      toast.success('Team successfully assigned');
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      toast.error(err.message || 'Failed to assign team');
    } finally {
      setSubmittingAction(false);
    }
  };

  // 2. Override Priority
  const handleSetPriority = async (e) => {
    e.preventDefault();
    setSubmittingAction(true);
    try {
      await reportApi.setPriority(selectedReport._id, {
        priority: newPriority,
        note: priorityNote || 'Priority manually adjusted by supervisor',
      });
      toast.success(`Priority updated to ${newPriority}`);
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      toast.error(err.message || 'Failed to update priority');
    } finally {
      setSubmittingAction(false);
    }
  };

  // 3. Reject
  const handleReject = async () => {
    if (!rejectNote) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setSubmittingAction(true);
    try {
      await reportApi.rejectReport(selectedReport._id, { reason: rejectNote });
      toast.success('Report marked as rejected');
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      toast.error(err.message || 'Failed to reject report');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-serif text-slate-900 tracking-tight">
              Incident Management & Triage
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0A84FF] border border-blue-200">
              {total} TOTAL
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Filter, prioritize, audit status history, and assign regional maintenance crews.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by ID, address, or keyword..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#FF6B1A] focus:ring-1 focus:ring-[#FF6B1A] transition-all"
          />
        </div>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-xs bg-slate-50 text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF6B1A] font-semibold cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="assigned">Assigned</option>
          <option value="in-progress">In Progress</option>
          <option value="repair-completed">Repair Completed</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="duplicate">Duplicate</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-xs bg-slate-50 text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF6B1A] font-semibold cursor-pointer"
        >
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Area Filter */}
        <select
          value={area}
          onChange={(e) => {
            setArea(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-xs bg-slate-50 text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF6B1A] font-semibold cursor-pointer"
        >
          <option value="">All Areas</option>
          <option value="Downtown">Downtown</option>
          <option value="North Ward">North Ward</option>
          <option value="South District">South District</option>
          <option value="East Sector">East Sector</option>
        </select>
      </div>

      {/* Data Table */}
      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : reports.length === 0 ? (
        <EmptyState
          title="No complaints match filters"
          description="Try broadening your search term or clearing one of the filters."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_14px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100 font-bold">
                <tr>
                  <th className="px-5 py-3">Complaint ID</th>
                  <th className="px-5 py-3">Address & Area</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Assigned Team</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {reports.map((report) => (
                  <tr key={report._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {report.complaintId}
                      {report.complaintCount > 1 && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-blue-50 text-[10px] text-[#0A84FF] border border-blue-100 font-sans">
                          {report.complaintCount}x
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="font-semibold text-slate-800 line-clamp-1">{report.address}</p>
                      <p className="text-[11px] text-slate-400">{report.area}</p>
                    </td>

                    <td className="px-5 py-3.5">
                      <PriorityBadge priority={report.priority} size="xs" />
                    </td>

                    <td className="px-5 py-3.5">
                      <StatusBadge status={report.status} size="xs" />
                    </td>

                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {report.assignedTeam?.name ? (
                        <span className="text-[#FF6B1A] flex items-center gap-1 font-semibold">
                          <Wrench className="w-3 h-3" />
                          {report.assignedTeam.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-slate-500">
                      {report.dueDate ? (
                        <span
                          className={
                            report.isOverdue ? 'text-rose-600 font-bold flex items-center gap-1' : ''
                          }
                        >
                          {new Date(report.dueDate).toLocaleDateString()}
                          {report.isOverdue && ' (Overdue)'}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(report)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#FF6B1A]" />
                        Triage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {reports.length} of {total} total records
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 disabled:opacity-40 hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-bold text-slate-800">
                {page} / {pages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 disabled:opacity-40 hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Triage & Management Modal */}
      <Modal
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        title={`Triage & Dispatch — ${selectedReport?.complaintId || ''}`}
        maxWidth="max-w-2xl"
      >
        {selectedReport && (
          <div className="space-y-5">
            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setModalTab('details')}
                className={`py-2 px-4 border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'details'
                    ? 'border-[#FF6B1A] text-[#FF6B1A]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Details & History
              </button>
              <button
                type="button"
                onClick={() => setModalTab('assign')}
                className={`py-2 px-4 border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'assign'
                    ? 'border-[#FF6B1A] text-[#FF6B1A]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Assign Team
              </button>
              <button
                type="button"
                onClick={() => setModalTab('priority')}
                className={`py-2 px-4 border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'priority'
                    ? 'border-[#FF6B1A] text-[#FF6B1A]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Override Priority
              </button>
              <button
                type="button"
                onClick={() => setModalTab('actions')}
                className={`py-2 px-4 border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'actions'
                    ? 'border-[#FF6B1A] text-[#FF6B1A]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Reject / Duplicate
              </button>
            </div>

            {/* TAB 1: Details & History */}
            {modalTab === 'details' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block font-bold uppercase text-[10px]">
                      Current Status
                    </span>
                    <StatusBadge status={selectedReport.status} />
                  </div>
                  <div>
                    <span className="text-slate-500 block font-bold uppercase text-[10px]">
                      Severity Priority
                    </span>
                    <PriorityBadge priority={selectedReport.priority} />
                  </div>
                  <div>
                    <span className="text-slate-500 block font-bold uppercase text-[10px]">
                      Complaints
                    </span>
                    <span className="font-bold text-[#FF6B1A]">
                      {selectedReport.complaintCount} report(s)
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <span className="font-bold uppercase text-[10px] text-slate-500">
                    Location & Description
                  </span>
                  <p className="font-semibold text-slate-900">{selectedReport.address}</p>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                    {selectedReport.description}
                  </p>
                </div>

                {selectedReport.images && selectedReport.images.length > 0 && (
                  <div>
                    <span className="font-bold uppercase text-[10px] text-slate-500 block mb-2">
                      Reported Photos
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedReport.images.map((img, idx) => (
                        <a
                          key={idx}
                          href={img.url}
                          target="_blank"
                          rel="noreferrer"
                          className="aspect-4/3 rounded-lg overflow-hidden border border-slate-200 block bg-slate-100"
                        >
                          <img
                            src={img.url}
                            alt="Pothole"
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <span className="font-bold uppercase text-[10px] text-slate-500 block mb-2">
                    Status History Timeline
                  </span>
                  <Timeline history={selectedReport.statusHistory} />
                </div>
              </div>
            )}

            {/* TAB 2: Assign Team */}
            {modalTab === 'assign' && (
              <form onSubmit={handleAssignTeam} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                    Select Maintenance Team
                  </label>
                  <select
                    value={assignTeamId}
                    onChange={(e) => setAssignTeamId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF6B1A] cursor-pointer"
                  >
                    {teams.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.area})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                    Completion Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF6B1A] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                    Instructions / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={assignNote}
                    onChange={(e) => setAssignNote(e.target.value)}
                    placeholder="e.g. Bring extra cold patch bags."
                    className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF6B1A]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingAction}
                  className="w-full py-2.5 bg-[#FF6B1A] hover:bg-[#e05a10] text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                >
                  {submittingAction ? 'Assigning...' : 'Confirm Team Assignment'}
                </button>
              </form>
            )}

            {/* TAB 3: Override Priority */}
            {modalTab === 'priority' && (
              <form onSubmit={handleSetPriority} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF6B1A] font-bold cursor-pointer"
                  >
                    <option value="low">Low (1-2 complaints)</option>
                    <option value="medium">Medium (3-5 complaints)</option>
                    <option value="high">High (6-9 complaints)</option>
                    <option value="critical">Critical (10+ complaints)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                    Audit Reason
                  </label>
                  <input
                    type="text"
                    required
                    value={priorityNote}
                    onChange={(e) => setPriorityNote(e.target.value)}
                    placeholder="e.g. High accident risk near school gate"
                    className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF6B1A]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingAction}
                  className="w-full py-2.5 bg-[#FF6B1A] hover:bg-[#e05a10] text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                >
                  {submittingAction ? 'Updating...' : 'Save Priority Override'}
                </button>
              </form>
            )}

            {/* TAB 4: Reject or Duplicate */}
            {modalTab === 'actions' && (
              <div className="space-y-4">
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                    Reject Complaint
                  </h4>
                  <p className="text-xs text-rose-600">
                    Reject invalid reports (e.g., private property, duplicate spam, or non-road damage).
                  </p>
                  <input
                    type="text"
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Reason for rejection..."
                    className="w-full px-3 py-2 text-xs bg-white text-slate-800 border border-rose-300 rounded-lg focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={submittingAction}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
