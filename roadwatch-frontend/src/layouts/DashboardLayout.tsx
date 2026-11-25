import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Compass,
  FileText,
  HardHat,
  Home,
  LogOut,
  Map,
  Menu,
  PlusCircle,
  Search,
  Shield,
  User as UserIcon,
  Users,
  Wrench
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { ThemeToggle } from '../components/shared/ThemeToggle';
import { GlobalCommand } from '../components/shared/GlobalCommand';
import { useNotifications } from '../api/queries';
import { useMarkNotificationReadMutation } from '../api/mutations';
import { formatRelativeTime } from '../lib/utils';

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, role, token, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, setCommandPaletteOpen, unreadCount, setUnreadCount, incrementUnreadCount } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch unread notifications
  const { data: notificationData } = useNotifications(false, 8);
  const markReadMutation = useMarkNotificationReadMutation();

  useEffect(() => {
    if (notificationData?.unreadCount !== undefined) {
      setUnreadCount(notificationData.unreadCount);
    }
  }, [notificationData, setUnreadCount]);

  // Socket.IO real-time connection
  useEffect(() => {
    if (!token) return;

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket: Socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      // connected
    });

    socket.on('report:new', (data) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['nearbyReports'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      incrementUnreadCount();
      toast.info('New Pothole Reported', {
        description: `${data.complaintId || 'Pothole'} reported in ${data.area || 'city area'}`
      });
    });

    socket.on('report:statusChanged', (data) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['myComplaints'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      incrementUnreadCount();
      toast.success('Complaint Status Updated', {
        description: `${data.complaintId}: status changed to ${data.status}`
      });
    });

    socket.on('task:assigned', (data) => {
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      incrementUnreadCount();
      toast.info('New Task Dispatched', {
        description: `Your team received a new repair task: ${data.complaintId}`
      });
    });

    socket.on('repair:submitted', (data) => {
      queryClient.invalidateQueries({ queryKey: ['pendingVerifications'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      incrementUnreadCount();
      toast.info('Repair Submitted for Audit', {
        description: `Team logged repair photos for ${data.complaintId}`
      });
    });

    socket.on('repair:verified', (data) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['myComplaints'] });
      queryClient.invalidateQueries({ queryKey: ['taskHistory'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      incrementUnreadCount();
      toast.success('Repair Verification Completed', {
        description: `Repair for ${data.complaintId} was verified & approved.`
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [token, queryClient, incrementUnreadCount]);

  // Role Navigation Links
  const getNavLinks = () => {
    if (role === 'admin') {
      return [
        { label: 'Overview', href: '/admin/dashboard', icon: BarChart3 },
        { label: 'Hazard Map', href: '/admin/map', icon: Map },
        { label: 'Complaints', href: '/admin/complaints', icon: FileText },
        { label: 'Verifications', href: '/admin/verifications', icon: CheckCircle },
        { label: 'Teams & Staff', href: '/admin/teams', icon: Users }
      ];
    }
    if (role === 'maintenance') {
      return [
        { label: 'My Tasks', href: '/maintenance/tasks', icon: Wrench },
        { label: 'Repair History', href: '/maintenance/history', icon: CheckCircle }
      ];
    }
    // Citizen (default)
    return [
      { label: 'Report Pothole', href: '/report', icon: PlusCircle },
      { label: 'My Complaints', href: '/my-complaints', icon: FileText },
      { label: 'Nearby Hazards', href: '/nearby', icon: Compass }
    ];
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      <GlobalCommand />

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-border bg-card/60 backdrop-blur-xl transition-all duration-300 sticky top-0 h-screen z-40 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow-primary">
              <HardHat className="h-5 w-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-foreground">
                  RoadWatch
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  {role} portal
                </span>
              </div>
            )}
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hidden lg:flex"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-border">
          <div
            className={`flex items-center gap-3 rounded-2xl p-2 bg-muted/30 border border-border/50 ${
              sidebarCollapsed ? 'justify-center p-1.5' : ''
            }`}
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-xs">
                {user?.name?.slice(0, 2).toUpperCase() || 'RW'}
              </AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-xs font-bold text-foreground">{user?.name}</p>
                <p className="truncate text-[10px] text-muted-foreground capitalize">{role}</p>
              </div>
            )}
            {!sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 sm:px-6 backdrop-blur-xl">
          {/* Mobile Brand / Menu Button */}
          <div className="flex items-center gap-3 md:hidden">
            {role === 'admin' ? (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader className="p-4 border-b border-border">
                    <SheetTitle className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                        <HardHat className="h-4 w-4" />
                      </div>
                      RoadWatch Admin
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="p-3 space-y-1">
                    {navLinks.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </SheetContent>
              </Sheet>
            ) : null}

            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
                <HardHat className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-sm tracking-tight">RoadWatch</span>
            </Link>
          </div>

          {/* Search Trigger (Ctrl+K Command Palette) */}
          <div className="flex-1 max-w-md hidden sm:block">
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="flex w-full items-center justify-between rounded-xl border border-input bg-muted/40 px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              <span className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 opacity-60" />
                <span>Search complaints, teams, or actions...</span>
              </span>
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground border border-border sm:inline-flex">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {/* Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground"
                  aria-label="Open notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-sm">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-2">
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-border">
                  <span className="text-xs font-bold text-foreground">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markReadMutation.mutate(undefined)}
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-border/50 py-1">
                  {notificationData?.notifications && notificationData.notifications.length > 0 ? (
                    notificationData.notifications.map((item) => (
                      <div
                        key={item._id}
                        className={`p-2.5 rounded-xl text-xs transition-colors ${
                          !item.isRead ? 'bg-primary/5 font-medium' : 'text-muted-foreground'
                        }`}
                      >
                        <p className="text-foreground">{item.message}</p>
                        <span className="text-[10px] text-muted-foreground mt-1 block">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      No notifications right now
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full p-0 h-9 w-9 ring-2 ring-primary/20">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                      {user?.name?.slice(0, 2).toUpperCase() || 'RW'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-xs font-bold truncate text-foreground">{user?.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCommandPaletteOpen(true)} className="gap-2">
                  <Search className="h-4 w-4" />
                  <span>Command Palette</span>
                  <span className="ml-auto text-[10px] font-mono text-muted-foreground">Ctrl+K</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="gap-2 text-rose-600 dark:text-rose-400 font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (for Citizen & Maintenance) */}
      {role !== 'admin' && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-card/90 px-2 backdrop-blur-xl md:hidden">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl py-1 px-3 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-primary font-bold' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
};
