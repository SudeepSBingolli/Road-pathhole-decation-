import React from 'react';
import {
  useAnalyticsSummary,
  useMonthlyTrends,
  useHotspots,
  useTeamPerformance
} from '../../api/queries';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatCard } from '../../components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import {
  AlertCircle,
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  Clock,
  Flame,
  HardHat,
  MapPin,
  TrendingUp,
  Users
} from 'lucide-react';
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
  Filler
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { PRIORITY_CONFIG } from '../../lib/constants';

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

export const AdminDashboardPage: React.FC = () => {
  const { data: summary, isLoading: isSummaryLoading } = useAnalyticsSummary();
  const { data: trends, isLoading: isTrendsLoading } = useMonthlyTrends(12);
  const { data: hotspots, isLoading: isHotspotsLoading } = useHotspots();
  const { data: teamPerf, isLoading: isTeamPerfLoading } = useTeamPerformance();

  // 1. Doughnut Chart Data (Status distribution)
  const statusLabels = ['Submitted', 'In Progress', 'Repair Completed', 'Verified', 'Duplicate'];
  const statusValues = [
    summary?.byStatus?.submitted || 0,
    summary?.byStatus?.['in-progress'] || 0,
    summary?.byStatus?.['repair-completed'] || 0,
    summary?.byStatus?.verified || 0,
    summary?.byStatus?.duplicate || 0
  ];
  const doughnutData = {
    labels: statusLabels,
    datasets: [
      {
        data: statusValues,
        backgroundColor: ['#3b82f6', '#8b5cf6', '#14b8a6', '#10b981', '#64748b'],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  // 2. Line Chart Data (Monthly trend)
  const trendLabels = (trends || []).map((t) => t.month);
  const lineData = {
    labels: trendLabels.length > 0 ? trendLabels : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'New Reports',
        data: (trends || []).map((t) => t.count),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Repairs Completed',
        data: (trends || []).map((t) => t.completedCount || 0),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // 3. Priority Bar Chart Data
  const barData = {
    labels: ['Low', 'Medium', 'High', 'Critical'],
    datasets: [
      {
        label: 'Hazard Priority Count',
        data: [
          summary?.byPriority?.low || 0,
          summary?.byPriority?.medium || 0,
          summary?.byPriority?.high || 0,
          summary?.byPriority?.critical || 0
        ],
        backgroundColor: [
          PRIORITY_CONFIG.low.colorHex,
          PRIORITY_CONFIG.medium.colorHex,
          PRIORITY_CONFIG.high.colorHex,
          PRIORITY_CONFIG.critical.colorHex
        ],
        borderRadius: 8
      }
    ]
  };

  // 4. Team Performance Chart Data
  const teamBarData = {
    labels: (teamPerf || []).map((t) => t.teamName),
    datasets: [
      {
        label: 'Completed Repairs',
        data: (teamPerf || []).map((t) => t.completedCount),
        backgroundColor: '#10b981',
        borderRadius: 6
      },
      {
        label: 'Overdue Tickets',
        data: (teamPerf || []).map((t) => t.overdueCount),
        backgroundColor: '#ef4444',
        borderRadius: 6
      }
    ]
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Infrastructure Intelligence"
        subtitle="Live metrics, aggregation telemetry, and geospatial repair bottlenecks across Austin metropolitan districts."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Overview' }]}
      />

      {/* Bento Grid Top: 5 Animated Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {isSummaryLoading ? (
          [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-32 rounded-3xl" />)
        ) : (
          <>
            <StatCard
              title="Total Hazards"
              value={summary?.totalReports || 0}
              icon={BarChart2}
              trend={{ value: 12, isPositive: true }}
              accentColor="text-blue-500"
              delay={0}
            />
            <StatCard
              title="Triage Pending"
              value={summary?.pendingReports || 0}
              icon={Clock}
              trend={{ value: 4, isPositive: false }}
              accentColor="text-amber-500"
              delay={1}
            />
            <StatCard
              title="In Remediation"
              value={summary?.inProgressReports || 0}
              icon={HardHat}
              accentColor="text-purple-500"
              delay={2}
            />
            <StatCard
              title="Verified Fixed"
              value={summary?.completedReports || 0}
              icon={CheckCircle2}
              trend={{ value: 18, isPositive: true }}
              accentColor="text-emerald-500"
              delay={3}
            />
            <StatCard
              title="Overdue Tasks"
              value={summary?.overdueReports || 0}
              icon={AlertCircle}
              accentColor="text-rose-500"
              delay={4}
            />
          </>
        )}
      </div>

      {/* Bento Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Line Chart (Span 2 cols) */}
        <Card className="lg:col-span-2 rounded-3xl border-border shadow-soft p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              12-Month Incident vs. Resolution Trend
            </CardTitle>
            <CardDescription className="text-xs">
              Tracking new citizen complaints against successfully audited repairs.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-64 sm:h-72">
            {isTrendsLoading ? (
              <Skeleton className="w-full h-full rounded-2xl" />
            ) : (
              <Line
                data={lineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' as const } }
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Status Distribution Doughnut Chart */}
        <Card className="rounded-3xl border-border shadow-soft p-6 flex flex-col justify-between">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-bold">Lifecycle Status Distribution</CardTitle>
            <CardDescription className="text-xs">
              Live breakdown across all triage stages
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-56 flex items-center justify-center">
            {isSummaryLoading ? (
              <Skeleton className="w-48 h-48 rounded-full" />
            ) : (
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' as const } }
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bento Grid Bottom: Priority Bar & Hotspots List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Breakdown Bar Chart */}
        <Card className="rounded-3xl border-border shadow-soft p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-bold">Severity Breakdown</CardTitle>
            <CardDescription className="text-xs">
              Auto-escalated complaint volumes
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-60">
            {isSummaryLoading ? (
              <Skeleton className="w-full h-full rounded-2xl" />
            ) : (
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } }
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Team Performance Comparison Chart */}
        <Card className="rounded-3xl border-border shadow-soft p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-bold">Crew Workload Comparison</CardTitle>
            <CardDescription className="text-xs">
              Repairs completed vs. overdue by team
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-60">
            {isTeamPerfLoading ? (
              <Skeleton className="w-full h-full rounded-2xl" />
            ) : (
              <Bar
                data={teamBarData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' as const } }
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Hotspots List with Mini Progress Bars */}
        <Card className="rounded-3xl border-border shadow-soft p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Flame className="h-4 w-4 text-rose-500" />
              Regional Damage Hotspots
            </CardTitle>
            <CardDescription className="text-xs">
              Districts with highest hazard concentration
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {isHotspotsLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-10 rounded-xl" />)
            ) : (hotspots || []).length > 0 ? (
              hotspots!.slice(0, 5).map((hotspot) => {
                const maxCount = Math.max(...hotspots!.map((h) => h.count), 1);
                const pct = Math.round((hotspot.count / maxCount) * 100);

                return (
                  <div key={hotspot._id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {hotspot._id || 'District'}
                      </span>
                      <span className="font-mono text-muted-foreground">
                        <strong className="text-foreground">{hotspot.count}</strong> reports
                        {hotspot.criticalCount > 0 && (
                          <span className="text-rose-500 ml-1">({hotspot.criticalCount} crit)</span>
                        )}
                      </span>
                    </div>
                    {/* Mini Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-rose-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-muted-foreground py-8 text-center">
                No hotspot concentrations recorded yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
