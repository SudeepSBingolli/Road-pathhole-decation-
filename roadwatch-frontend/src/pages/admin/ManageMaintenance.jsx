import React, { useState, useEffect } from 'react';
import { teamApi } from '../../api/teamApi';
import { authApi } from '../../api/authApi';
import { Modal } from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/Skeleton';
import { UserPlus, Wrench, Mail, Phone, ShieldCheck, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export const ManageMaintenance = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // New staff modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    teamId: '',
  });
  const [creating, setCreating] = useState(false);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await teamApi.listTeams();
      setTeams(res?.data || []);
      if (res?.data?.length > 0 && !formData.teamId) {
        setFormData((prev) => ({ ...prev, teamId: res.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load maintenance teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await authApi.createMaintenance(formData);
      toast.success(`Staff account created for ${formData.name}!`);
      setModalOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        teamId: teams[0]?._id || '',
      });
      fetchTeams();
    } catch (err) {
      toast.error(err.message || 'Failed to create staff account');
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
              Manage Technical Staff & Crews
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0A84FF] border border-blue-200">
              ROSTER
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Provision technician accounts, assign regional teams, and view active field personnel.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B1A] hover:bg-[#e05a10] text-white rounded-xl text-xs font-bold shadow-xs transition-all self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision Technician</span>
        </button>
      </div>

      {/* Teams and Members List */}
      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {teams.map((team) => (
            <div
              key={team._id}
              className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_14px_rgba(0,0,0,0.03)] p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-orange-50 rounded-xl text-[#FF6B1A] border border-orange-100">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{team.name}</h3>
                    <p className="text-xs text-[#FF6B1A] font-semibold">Operating Sector: {team.area}</p>
                  </div>
                </div>

                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                  {team.members?.length || 0} Technician(s)
                </span>
              </div>

              {/* Members */}
              <div className="space-y-2">
                {team.members && team.members.length > 0 ? (
                  team.members.map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs hover:border-slate-300 transition-colors"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{member.name}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-[#FF6B1A]" /> {member.email}
                          </span>
                          {member.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-emerald-600" /> {member.phone}
                            </span>
                          )}
                        </p>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ACTIVE
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic p-3 text-center bg-slate-50 rounded-xl">
                    No technicians assigned to this team yet.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Provision Maintenance Technician"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Marcus Miller (Asphalt Specialist)"
              className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#FF6B1A]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="tech@roadwatch.org"
              className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#FF6B1A]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Temporary Password
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#FF6B1A]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Contact Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1-512-555-0144"
              className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#FF6B1A]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Assign to Squad / Team
            </label>
            <select
              name="teamId"
              value={formData.teamId}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#FF6B1A] cursor-pointer"
            >
              {teams.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.area})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-2.5 bg-[#FF6B1A] hover:bg-[#e05a10] text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            {creating ? 'Provisioning...' : 'Confirm Provisioning'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
