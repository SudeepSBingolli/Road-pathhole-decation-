import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../api/analyticsApi';
import { teamApi } from '../../api/teamApi';
import { Modal } from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/Skeleton';
import { Users, Plus, Clock, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export const TeamsPerformance = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Team Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [area, setArea] = useState('Downtown');
  const [creating, setCreating] = useState(false);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getTeamPerformance();
      setTeams(res?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load team performance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await teamApi.createTeam({ name, area });
      toast.success(`Team '${name}' created!`);
      setModalOpen(false);
      setName('');
      fetchPerformance();
    } catch (err) {
      toast.error(err.message || 'Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-serif text-slate-900 tracking-tight">
              Maintenance Teams & Productivity Telemetry
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0A84FF] border border-blue-200">
              OPERATIONS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Monitor repair turnaround durations, overdue tickets, and supervisor rework rates.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B1A] hover:bg-[#e05a10] text-white rounded-xl text-xs font-bold shadow-xs transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Deploy New Crew</span>
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={7} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_14px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100 font-bold">
                <tr>
                  <th className="px-6 py-3.5">Team Name</th>
                  <th className="px-6 py-3.5">Assigned Area</th>
                  <th className="px-6 py-3.5">Total Assigned</th>
                  <th className="px-6 py-3.5">Completed & Approved</th>
                  <th className="px-6 py-3.5">Avg Repair Time</th>
                  <th className="px-6 py-3.5">Overdue Count</th>
                  <th className="px-6 py-3.5">Rework Rate (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {teams.map((t) => (
                  <tr key={t.teamId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#FF6B1A]" />
                      {t.teamName}
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-700">{t.area}</td>

                    <td className="px-6 py-4 font-semibold text-slate-800">{t.totalAssigned}</td>

                    <td className="px-6 py-4 font-bold text-emerald-600">
                      {t.completedRepairs}
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {t.avgTimeHours > 0 ? `${t.avgTimeHours} hrs` : '-'}
                    </td>

                    <td className="px-6 py-4 font-bold">
                      <span className={t.overdueTasks > 0 ? 'text-rose-600' : 'text-slate-400'}>
                        {t.overdueTasks}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`font-extrabold ${
                          t.reworkRatePercentage > 15
                            ? 'text-rose-600'
                            : t.reworkRatePercentage > 5
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {t.reworkRatePercentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Deploy New Maintenance Crew"
      >
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Team Identifier / Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. South Corridor Quick Response"
              className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#FF6B1A]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Operational Sector / Area
            </label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#FF6B1A] cursor-pointer"
            >
              <option value="Downtown">Downtown Sector</option>
              <option value="North Ward">North Ward</option>
              <option value="South District">South District</option>
              <option value="East Sector">East Sector</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-2.5 bg-[#FF6B1A] hover:bg-[#e05a10] text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            {creating ? 'Registering Team...' : 'Confirm Crew Deployment'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
