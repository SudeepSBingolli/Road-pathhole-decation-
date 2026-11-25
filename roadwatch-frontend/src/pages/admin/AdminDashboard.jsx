import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { analyticsApi } from '../../api/analyticsApi';
import { reportApi } from '../../api/reportApi';
import { teamApi } from '../../api/teamApi';
import { useSocket } from '../../hooks/useSocket';
import { PotholeMap } from '../../components/map/PotholeMap';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { Timeline } from '../../components/common/Timeline';
import { Modal } from '../../components/common/Modal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  TrendingUp,
  RefreshCw,
  Compass,
  Activity,
  Wrench,
  Search,
  Filter,
  Eye,
  Send,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Radio,
  Navigation,
  Shield,
  Layers,
  ArrowUpRight,
  Check,
  MoreHorizontal,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const AdminDashboard = () => {
  const { user } = useAuth();

  // State for metrics & data
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [teamStats, setTeamStats] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Incident Table state
  const [tableSearch, setTableSearch] = useState('');
  const [tableStatus, setTableStatus] = useState('');
  const [tablePriority, setTablePriority] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const [tableTotal, setTableTotal] = useState(0);
  const [tablePages, setTablePages] = useState(1);
  const [loadingTable, setLoadingTable] = useState(false);

  // Modal state
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalMode, setModalMode] = useState('details'); // 'details' | 'assign'
  const [assignTeamId, setAssignTeamId] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const { subscribe } = useSocket();

  // 1. Fetch Overview & Analytics Metrics
  const fetchDashboardData = async () => {
    try {
      const [sumRes, trendRes, teamRes, hotRes, teamListRes] = await Promise.all([
        analyticsApi.getSummary(),
        analyticsApi.getTrends(12),
        analyticsApi.getTeamPerformance(),
        analyticsApi.getHotspots(),
        teamApi.listTeams(),
      ]);

      setSummary(sumRes?.data || null);
      setTrends(trendRes?.data || []);
      setTeamStats(teamRes?.data || []);
      setHotspots(hotRes?.data?.byArea || []);
      setTeams(teamListRes?.data || []);
      if (teamListRes?.data?.length > 0) {
        setAssignTeamId(teamListRes.data[0]._id);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching admin analytics:', err);
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Incident Reports (for Map & Table)
  const fetchReports = useCallback(async () => {
    setLoadingTable(true);
    try {
      const params = {
        page: tablePage,
        limit: 10,
        search: tableSearch || undefined,
        status: tableStatus || undefined,
        priority: tablePriority || undefined,
      };

      const res = await reportApi.listReports(params);
      setAllReports(res?.data || []);
      setTableTotal(res?.total || 0);
      setTablePages(res?.pages || 1);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoadingTable(false);
    }
  }, [tablePage, tableSearch, tableStatus, tablePriority]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Live Socket updates: auto refresh
  useEffect(() => {
    const unsub1 = subscribe('report:new', () => {
      fetchDashboardData();
      fetchReports();
      toast('Live update: New road incident reported', { icon: '📡' });
    });
    const unsub2 = subscribe('report:statusChanged', () => {
      fetchDashboardData();
      fetchReports();
    });
    const unsub3 = subscribe('repair:submitted', () => {
      fetchDashboardData();
      fetchReports();
      toast('Live update: Repair finished by crew', { icon: '🔧' });
    });
    const unsub4 = subscribe('repair:verified', () => {
      fetchDashboardData();
      fetchReports();
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, [subscribe, fetchReports]);

  // Calculations for KPI Cards
  const overall = summary?.overall || {
    totalReports: 124,
    openCount: 28,
    overdueCount: 4,
    verifiedCount: 86,
    totalComplaints: 142,
  };
  const statusCounts = summary?.byStatus || {};

  // Light-theme Chart Colors matching the reference screenshot
  const chartTextColor = '#94A3B8';
  const chartGridColor = '#F1F5F9';

  // 1. Team Activity Line Chart (Card 1)
  const teamActivityData = {
    labels: ['Mon', 'Jun', 'Sep', 'Nov'],
    datasets: [
      {
        data: [20, 60, 25, 78],
        borderColor: '#20C997',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 180);
          gradient.addColorStop(0, 'rgba(32, 201, 151, 0.25)');
          gradient.addColorStop(1, 'rgba(32, 201, 151, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
      },
    ],
  };

  // 2. Sales / Damage Overview Donut Chart (Card 2)
  const salesOverviewData = {
    labels: ['Potholes', 'Asphalt Cracks', 'Surface Erosion', 'Structural'],
    datasets: [
      {
        data: [42, 28, 18, 12],
        backgroundColor: ['#0A84FF', '#FFB800', '#00D2D3', '#FF4757'],
        borderWidth: 0,
        cutout: '68%',
      },
    ],
  };

  // 3. Bar Chart (Card 4: Monthly Comparisons)
  const monthlyBarData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr'],
    datasets: [
      {
        label: 'Detected',
        data: [38, 26, 34, 30],
        backgroundColor: '#0A84FF',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
      {
        label: 'Resolved',
        data: [22, 35, 45, 44],
        backgroundColor: '#FF9F43',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
    ],
  };

  // 4. User Growth Area Chart (Card 5)
  const userGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        data: [24, 60, 55, 95, 140],
        borderColor: '#FF5722',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 180);
          gradient.addColorStop(0, 'rgba(255, 87, 34, 0.35)');
          gradient.addColorStop(1, 'rgba(255, 159, 67, 0.05)');
          return gradient;
        },
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 0,
      },
    ],
  };

  // Modal Action: Submit Team Assignment
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReport || !assignTeamId || !assignDueDate) {
      toast.error('Please select both a team and a due date');
      return;
    }

    setSubmittingAction(true);
    try {
      await reportApi.assignTeam(selectedReport._id, {
        teamId: assignTeamId,
        dueDate: assignDueDate,
        note: assignNote || 'Assigned via RoadGuard dispatch',
      });
      toast.success(`Task assigned to maintenance team!`);
      setSelectedReport(null);
      fetchDashboardData();
      fetchReports();
    } catch (err) {
      toast.error(err.message || 'Failed to assign team');
    } finally {
      setSubmittingAction(false);
    }
  };

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="space-y-6 select-none font-sans">
      
      {/* ========================================================= */}
      {/* 1. DASHBOARD GREETING & HEADER (Reference 1)              */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-slate-900 tracking-tight">
            Welcome, <span className="italic text-slate-700">{user?.name ? user.name.split(' ')[0] : 'Alex'}</span>!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time road monitoring, automated AI detection, and crew dispatch overview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-xs text-xs font-semibold text-slate-600">
            <span>{currentDateStr}</span>
          </div>

          <div className="w-9 h-9 rounded-full bg-blue-100 text-[#0A84FF] font-bold text-xs flex items-center justify-center border border-blue-200 shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>

          <button
            type="button"
            onClick={() => {
              fetchDashboardData();
              fetchReports();
              toast.success('Dashboard refreshed');
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0A84FF]' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. THE 6 SIGNATURE ANALYTICAL CARDS (Reference 1 3x2 Grid)*/}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* CARD 1: Team Activity (Line Chart) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Team Activity</span>
              <button className="text-slate-400 hover:text-slate-600 p-1">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1 mb-2">
              {overall.totalReports || 124}
            </p>
          </div>
          <div className="h-44 w-full">
            <Line
              data={teamActivityData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: chartTextColor, font: { size: 10 } },
                  },
                  y: {
                    min: 0,
                    max: 80,
                    ticks: { stepSize: 20, color: chartTextColor, font: { size: 10 } },
                    grid: { color: chartGridColor },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* CARD 2: Sales Overview / Damage Overview (Donut Chart) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Sales Overview</span>
              <button className="text-slate-400 hover:text-slate-600 p-1">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1 mb-2">
              $24.5K
            </p>
          </div>
          <div className="h-44 w-full flex items-center justify-center relative">
            <Doughnut
              data={salesOverviewData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </div>

        {/* CARD 3: Project Status (Status Dot Breakdown) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Project Status</span>
              <button className="text-slate-400 hover:text-slate-600 p-1">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1 mb-4">
              31.7%
            </p>
          </div>
          <div className="space-y-3 pb-2 text-xs font-medium text-slate-700">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0A84FF] shrink-0" />
              <span>Project Completed</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFB800] shrink-0" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00D2D3] shrink-0" />
              <span>On Hold</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF4757] shrink-0" />
              <span>Overdue</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFA502] shrink-0" />
              <span>Not Started</span>
            </div>
          </div>
        </div>

        {/* CARD 4: Bar Chart (Grouped Bars) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Bar Chart</span>
              <button className="text-slate-400 hover:text-slate-600 p-1">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1 mb-2">
              3,080
            </p>
          </div>
          <div className="h-44 w-full">
            <Bar
              data={monthlyBarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: chartTextColor, font: { size: 10 } },
                  },
                  y: {
                    min: 0,
                    max: 50,
                    ticks: { stepSize: 10, color: chartTextColor, font: { size: 10 } },
                    grid: { color: chartGridColor },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* CARD 5: User Growth (Warm Orange Area Chart) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">User Growth</span>
              <button className="text-slate-400 hover:text-slate-600 p-1">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1 mb-2">
              334
            </p>
          </div>
          <div className="h-44 w-full">
            <Line
              data={userGrowthData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: chartTextColor, font: { size: 10 } },
                  },
                  y: {
                    min: 0,
                    max: 150,
                    ticks: { stepSize: 30, color: chartTextColor, font: { size: 10 } },
                    grid: { color: chartGridColor },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* CARD 6: Task Completion (Progress Meters) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Task Completion</span>
              <button className="text-slate-400 hover:text-slate-600 p-1">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            <div className="h-4" />
          </div>

          <div className="space-y-3.5 pb-1">
            {/* 100% Completed */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-slate-700">Completed</span>
                </div>
                <span className="font-bold text-slate-900">100%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#0A84FF] rounded-full w-full" />
              </div>
            </div>

            {/* 65% In Review */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#0A84FF] flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-slate-700">In Review</span>
                </div>
                <span className="font-bold text-slate-900">65%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#0A84FF] rounded-full w-[65%]" />
              </div>
            </div>

            {/* 30% Pending */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-slate-700">Pending</span>
                </div>
                <span className="font-bold text-slate-900">30%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-300 rounded-full w-[30%]" />
              </div>
            </div>

            {/* 12% In Progress */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-slate-700">In Progress</span>
                </div>
                <span className="font-bold text-slate-900">12%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#0A84FF] rounded-full w-[12%]" />
              </div>
            </div>

            {/* 0% Not Started */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-slate-700">Not Started</span>
                </div>
                <span className="font-bold text-slate-900">0%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-200 rounded-full w-0" />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 3. LIVE ROAD MONITORING MAP SECTION                       */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_14px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#0A84FF] animate-ping" />
            <h2 className="text-xl font-serif text-slate-900 tracking-tight">
              Live Road Monitoring Map
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Click any GPS waypoint to inspect pothole photograph and dispatch crew
          </span>
        </div>

        <PotholeMap
          center={{ lat: 30.2672, lng: -97.7431 }}
          zoom={13}
          potholes={allReports}
          height="h-[520px]"
          interactiveFilters={true}
          actionButtonLabel="Inspect & Dispatch"
          onActionButtonClick={(pothole) => {
            setSelectedReport(pothole);
            setModalMode('assign');
          }}
          onSelectPothole={(pothole) => {
            setSelectedReport(pothole);
            setModalMode('details');
          }}
          onRefreshData={() => {
            fetchDashboardData();
            fetchReports();
          }}
        />
      </div>

      {/* ========================================================= */}
      {/* 4. INCIDENT MANAGEMENT & DISPATCH QUEUE TABLE             */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_14px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Table Header & Interactive Filters */}
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-serif text-slate-900 tracking-tight flex items-center gap-2">
              <span>Incident Management & Dispatch Queue</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#0A84FF] border border-blue-100">
                {tableTotal} Records
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live complaint feed with location coordinates, severity classification, and crew assignment.
            </p>
          </div>

          {/* Table Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setTablePage(1);
                }}
                placeholder="Search ID, street, area..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A84FF]"
              />
            </div>

            {/* Status Filter */}
            <select
              value={tableStatus}
              onChange={(e) => {
                setTableStatus(e.target.value);
                setTablePage(1);
              }}
              className="px-3 py-1.5 text-xs bg-slate-50 text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A84FF] cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="assigned">Assigned</option>
              <option value="in-progress">In Progress</option>
              <option value="repair-completed">Repair Completed</option>
              <option value="verified">Verified</option>
              <option value="duplicate">Duplicate</option>
            </select>

            {/* Priority Filter */}
            <select
              value={tablePriority}
              onChange={(e) => {
                setTablePriority(e.target.value);
                setTablePage(1);
              }}
              className="px-3 py-1.5 text-xs bg-slate-50 text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A84FF] cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">Report ID</th>
                <th className="px-5 py-3.5">Issue & Photo</th>
                <th className="px-5 py-3.5">Location & Sector</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Assigned Crew</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingTable ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#0A84FF]" />
                      <span>Loading records...</span>
                    </div>
                  </td>
                </tr>
              ) : allReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No incident reports match current filter criteria.
                  </td>
                </tr>
              ) : (
                allReports.map((report) => {
                  const thumbnail =
                    report.images?.[0]?.url ||
                    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=120';
                  const reportedAt = new Date(report.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={report._id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedReport(report);
                        setModalMode('details');
                      }}
                    >
                      {/* 1. Report ID */}
                      <td className="px-5 py-3.5 font-mono font-bold text-[#0A84FF]">
                        {report.complaintId}
                      </td>

                      {/* 2. Issue & Thumbnail */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={thumbnail}
                            alt="Damage"
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div className="max-w-xs truncate">
                            <p className="font-semibold text-slate-900 truncate">
                              {report.description}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              {report.complaintCount || 1} report(s)
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Location & Area */}
                      <td className="px-5 py-3.5">
                        <p className="text-slate-800 font-medium truncate max-w-[200px]">
                          {report.address}
                        </p>
                        <p className="text-[10px] text-[#0A84FF]">
                          {report.area}
                        </p>
                      </td>

                      {/* 4. Reported Date */}
                      <td className="px-5 py-3.5 text-slate-500">
                        {reportedAt}
                      </td>

                      {/* 5. Priority Badge */}
                      <td className="px-5 py-3.5">
                        <PriorityBadge priority={report.priority} size="xs" />
                      </td>

                      {/* 6. Assigned Crew */}
                      <td className="px-5 py-3.5">
                        {report.assignedTeam ? (
                          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <Wrench className="w-3 h-3 text-[#FF6B1A]" />
                            {report.assignedTeam.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* 7. Status Badge */}
                      <td className="px-5 py-3.5">
                        <StatusBadge status={report.status} size="xs" />
                      </td>

                      {/* 8. Actions */}
                      <td className="px-5 py-3.5 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReport(report);
                            setModalMode('details');
                          }}
                          title="Inspect Details"
                          className="p-1.5 text-slate-400 hover:text-[#0A84FF] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReport(report);
                            setModalMode('assign');
                          }}
                          title="Dispatch Crew"
                          className="p-1.5 text-[#0A84FF] hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Showing {allReports.length} of {tableTotal} records
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={tablePage <= 1}
              onClick={() => setTablePage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-700">
              Page {tablePage} of {tablePages}
            </span>
            <button
              type="button"
              disabled={tablePage >= tablePages}
              onClick={() => setTablePage((p) => Math.min(tablePages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. ACTIVE MAINTENANCE TEAMS                               */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_14px_rgba(0,0,0,0.03)] space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#FF6B1A]" />
            <span>Active Maintenance Crews & Readiness</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational capacity and field readiness across municipal zones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div
              key={team._id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{team.name}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-[#0A84FF]">
                      {team.area}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {team.members?.length || team.memberCount || 0} active field technicians
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0A84FF] flex items-center justify-center font-bold text-xs">
                  <Users className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Operational Readiness</span>
                  <span className="text-emerald-600">85% Ready</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#0A84FF] to-emerald-500 rounded-full w-[85%]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. INTERACTIVE MODAL: DETAILS & CREW ASSIGNMENT           */}
      {/* ========================================================= */}
      {selectedReport && (
        <Modal
          isOpen={Boolean(selectedReport)}
          onClose={() => setSelectedReport(null)}
          title={
            modalMode === 'assign'
              ? `Dispatch Crew — ${selectedReport.complaintId}`
              : `Incident Details — ${selectedReport.complaintId}`
          }
          maxWidth="max-w-2xl"
        >
          {modalMode === 'details' ? (
            <div className="space-y-5">
              {/* Image Preview Banner */}
              {selectedReport.images && selectedReport.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedReport.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative h-44 rounded-xl overflow-hidden bg-slate-100 border border-slate-200"
                    >
                      <img
                        src={img.url}
                        alt="Road damage"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Status & Priority Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={selectedReport.priority} size="sm" />
                  <StatusBadge status={selectedReport.status} size="sm" />
                </div>
                <div className="text-xs font-semibold text-slate-600">
                  Aggregated Reports: {selectedReport.complaintCount || 1}
                </div>
              </div>

              {/* Geo Details */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <p className="font-bold text-slate-900">{selectedReport.description}</p>
                <p className="text-slate-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0A84FF]" />
                  {selectedReport.address} ({selectedReport.area})
                </p>
                {selectedReport.location?.coordinates && (
                  <p className="text-[11px] font-mono text-[#0A84FF]">
                    Coordinates: {selectedReport.location.coordinates[1]}° N, {selectedReport.location.coordinates[0]}° W
                  </p>
                )}
              </div>

              {/* Assigned Team info */}
              {selectedReport.assignedTeam && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#0A84FF] font-semibold">
                    <Wrench className="w-4 h-4" />
                    <span>Assigned to {selectedReport.assignedTeam.name}</span>
                  </div>
                  {selectedReport.dueDate && (
                    <span className="text-[11px] text-slate-500 font-mono">
                      Due: {new Date(selectedReport.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}

              {/* Status History Timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-800 tracking-wider mb-3">
                  Incident Timeline
                </h4>
                <Timeline history={selectedReport.statusHistory} />
              </div>

              {/* Footer action button */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode('assign')}
                  className="flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold text-white bg-[#0A84FF] hover:bg-blue-600 transition-all cursor-pointer shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch or Reassign Crew</span>
                </button>
              </div>
            </div>
          ) : (
            /* Assign Crew Form */
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Select Maintenance Team
                </label>
                <select
                  required
                  value={assignTeamId}
                  onChange={(e) => setAssignTeamId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A84FF] cursor-pointer"
                >
                  {teams.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.area}) — {t.members?.length || 0} Technicians
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Assigned Due Date
                </label>
                <input
                  type="date"
                  required
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A84FF] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Dispatch Instructions / Notes
                </label>
                <textarea
                  rows={3}
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  placeholder="e.g. High traffic area. Fill with cold mix asphalt."
                  className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A84FF]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMode('details')}
                  className="py-2 px-3.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingAction}
                  className="flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold text-white bg-[#0A84FF] hover:bg-blue-600 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{submittingAction ? 'Dispatching...' : 'Confirm Dispatch'}</span>
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};
