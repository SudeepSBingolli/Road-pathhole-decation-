import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutGrid,
  BarChart2,
  Map,
  ShieldCheck,
  Users,
  UserPlus,
  Wrench,
  History,
  FileText,
  X,
  Radio,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  HelpCircle,
  FolderKanban,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { role, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Session ended.');
    navigate('/login');
  };

  // Citizen Navigation
  const citizenGeneralNav = [
    { to: '/citizen/complaints', label: 'Overview', icon: LayoutGrid },
    { to: '/citizen/nearby', label: 'Live Road Map', icon: Map },
    { to: '/citizen/report', label: 'Report Pothole', icon: AlertTriangle },
  ];

  // Admin Navigation
  const adminGeneralNav = [
    { to: '/admin/dashboard', label: 'Overview', icon: LayoutGrid },
    { to: '/admin/map', label: 'Road Map', icon: Map },
    { to: '/admin/complaints', label: 'Incidents', icon: FolderKanban },
    { to: '/admin/verifications', label: 'Verifications', icon: ShieldCheck },
    { to: '/admin/teams', label: 'Maintenance Teams', icon: Users },
  ];

  // Maintenance Navigation
  const maintenanceGeneralNav = [
    { to: '/maintenance/tasks', label: 'Assigned Work', icon: Wrench },
    { to: '/maintenance/history', label: 'Repair History', icon: History },
  ];

  let generalNav = citizenGeneralNav;
  if (role === 'admin') generalNav = adminGeneralNav;
  if (role === 'maintenance') generalNav = maintenanceGeneralNav;

  const accountsNav = [
    ...(role === 'admin' ? [{ to: '/admin/maintenance', label: 'Users & Staff', icon: Users }] : []),
    { to: '/support', label: 'Support', icon: HelpCircle },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:sticky top-0 md:top-16 z-50 md:z-30 h-screen md:h-[calc(100vh-4rem)] bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isCollapsed ? 'md:w-20' : 'md:w-64'
        } ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}`}
      >
        <div>
          {/* Mobile Header / Brand */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 md:hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF6B1A] to-[#FF8A00] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                <Shield className="w-4 h-4 fill-white/20" />
              </div>
              <span className="font-extrabold text-sm tracking-tight text-slate-900">
                ROAD<span className="text-[#FF6B1A]">GUARD</span>
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links Group: GENERAL */}
          <div className="px-4 py-5 space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                GENERAL
              </div>
            )}

            {generalNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;

              return (
                <NavLink
                  key={item.to + item.label}
                  to={item.to}
                  onClick={() => {
                    if (window.innerWidth < 768) onClose();
                  }}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-[#EBF3FF] text-[#0A84FF] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-[#0A84FF]' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </div>

          {/* Navigation Links Group: ACCOUNTS */}
          <div className="px-4 py-2 space-y-1 border-t border-slate-100/80">
            {!isCollapsed && (
              <div className="px-3 pt-3 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                ACCOUNTS
              </div>
            )}

            {accountsNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;

              return (
                <NavLink
                  key={item.to + item.label}
                  to={item.to}
                  onClick={() => {
                    if (window.innerWidth < 768) onClose();
                  }}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-[#EBF3FF] text-[#0A84FF]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-[#0A84FF]' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Bottom User Area & Collapse Toggle */}
        <div className="p-3 border-t border-slate-100">
          {!isCollapsed ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0A84FF] font-bold text-xs flex items-center justify-center shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="overflow-hidden text-left">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase font-mono truncate">
                    {role}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Logout"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  title="Collapse sidebar"
                  className="hidden md:flex p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Expand sidebar"
                className="hidden md:flex p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
