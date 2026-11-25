import React, { useState, useEffect } from 'react';
import { reportApi } from '../../api/reportApi';
import { teamApi } from '../../api/teamApi';
import { PotholeMap } from '../../components/map/PotholeMap';
import { Drawer } from '../../components/common/Drawer';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { Wrench, Calendar, MapPin, Send, RefreshCw, Compass, Radio } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminMapView = () => {
  const [reports, setReports] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  // Quick Assign form state
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [repRes, teamRes] = await Promise.all([
        reportApi.listReports({ limit: 150 }),
        teamApi.listTeams(),
      ]);
      setReports(repRes?.data || []);
      setTeams(teamRes?.data || []);
      if (teamRes?.data?.length > 0) {
        setSelectedTeamId(teamRes.data[0]._id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    setDueDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const handleQuickAssign = async (e) => {
    e.preventDefault();
    if (!selectedReport || !selectedTeamId || !dueDate) {
      toast.error('Please specify both team and due date');
      return;
    }

    setAssigning(true);
    try {
      await reportApi.assignTeam(selectedReport._id, {
        teamId: selectedTeamId,
        dueDate: new Date(dueDate).toISOString(),
        note: assignNote || 'Dispatched from live RoadGuard map',
      });

      toast.success(`Task assigned to team for ${selectedReport.complaintId}!`);
      setSelectedReport(null);
      setAssignNote('');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to assign team');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-serif text-slate-900 tracking-tight">
              Live Road Monitoring & Dispatch Map
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0A84FF] border border-blue-200">
              REAL-TIME GIS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Interactive geographic view of real pothole detections, current GPS position, and field maintenance dispatch.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0A84FF]' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Full-size Map Container */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-md">
        <PotholeMap
          potholes={reports}
          zoom={13}
          center={{ lat: 30.2672, lng: -97.7431 }}
          height="h-[720px]"
          actionButtonLabel="Dispatch Crew"
          onActionButtonClick={(pothole) => setSelectedReport(pothole)}
          onRefreshData={fetchData}
        />
      </div>

      {/* Quick Assign Drawer */}
      <Drawer
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        title={`Dispatch Crew — ${selectedReport?.complaintId || ''}`}
      >
        {selectedReport && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-900">
                  {selectedReport.complaintId}
                </span>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={selectedReport.priority} size="xs" />
                  <StatusBadge status={selectedReport.status} size="xs" />
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-800">{selectedReport.description}</p>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#FF6B1A] shrink-0" />
                {selectedReport.address} ({selectedReport.area})
              </p>
            </div>

            <form onSubmit={handleQuickAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Select Maintenance Team
                </label>
                <select
                  required
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A84FF] cursor-pointer"
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
                  Resolution Due Date
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A84FF] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Dispatch Instructions
                </label>
                <textarea
                  rows={3}
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  placeholder="e.g. Severe asphalt crack. Deploy asphalt patching and safety markers."
                  className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A84FF]"
                />
              </div>

              <button
                type="submit"
                disabled={assigning}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF6B1A] to-[#FF8A00] hover:from-[#FF7A26] hover:to-[#FF9514] transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{assigning ? 'Transmitting Dispatch...' : 'Confirm Dispatch'}</span>
              </button>
            </form>
          </div>
        )}
      </Drawer>
    </div>
  );
};
