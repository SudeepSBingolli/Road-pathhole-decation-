import React, { useState } from 'react';
import { useMyComplaints } from '../../api/queries';
import { Report, ReportStatus } from '../../types';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { PriorityBadge } from '../../components/shared/PriorityBadge';
import { Timeline } from '../../components/shared/Timeline';
import { BeforeAfterSlider } from '../../components/shared/BeforeAfterSlider';
import { EmptyState } from '../../components/shared/EmptyState';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import { formatRelativeTime, formatDate } from '../../lib/utils';
import {
  Calendar,
  ChevronRight,
  Eye,
  FileQuestion,
  Grid,
  List as ListIcon,
  MapPin,
  PlusCircle,
  ThumbsUp,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FILTER_STATUSES: { label: string; value: ReportStatus | 'all' }[] = [
  { label: 'All Complaints', value: 'all' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Repair Completed', value: 'repair-completed' },
  { label: 'Verified & Closed', value: 'verified' }
];

export const MyComplaintsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: complaints, isLoading } = useMyComplaints();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const filteredReports = (complaints || []).filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Reported Complaints"
        subtitle="Track live municipal triage, crew dispatch status, and verified repair photos for your submitted road hazards."
        breadcrumbs={[
          { label: 'Citizen', href: '/my-complaints' },
          { label: 'My Complaints' }
        ]}
        actions={
          <Button
            onClick={() => navigate('/report')}
            className="rounded-xl flex items-center gap-1.5 shadow-soft"
          >
            <PlusCircle className="h-4 w-4" />
            Report New Hazard
          </Button>
        }
      />

      {/* Filter and View Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_STATUSES.map((filter) => {
            const isSelected = statusFilter === filter.value;
            return (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle (Grid vs List) */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl self-end sm:self-auto">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8 px-2.5 rounded-lg text-xs"
            title="Grid view"
          >
            <Grid className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8 px-2.5 rounded-lg text-xs"
            title="List view"
          >
            <ListIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-3xl" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredReports.length === 0 && (
        <EmptyState
          title="No Complaints Found"
          description={
            statusFilter === 'all'
              ? "You haven't submitted any pothole complaints yet. Help improve our streets by reporting road damage in your area."
              : `No complaints found with status "${statusFilter}".`
          }
          icon={FileQuestion}
          actionLabel="Report a Pothole"
          onAction={() => navigate('/report')}
        />
      )}

      {/* Complaints Grid View */}
      {!isLoading && viewMode === 'grid' && filteredReports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReports.map((report) => (
            <Card
              key={report._id}
              onClick={() => setSelectedReport(report)}
              className="group cursor-pointer hover:shadow-soft-lg hover:border-primary/40 transition-all rounded-3xl overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Image Thumbnail */}
                <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                  {report.images && report.images.length > 0 ? (
                    <img
                      src={report.images[0].url}
                      alt="Hazard"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                      No Photo Available
                    </div>
                  )}

                  <div className="absolute top-3 left-3">
                    <PriorityBadge priority={report.priority} size="sm" />
                  </div>

                  <div className="absolute top-3 right-3">
                    <StatusBadge status={report.status} size="sm" />
                  </div>

                  {report.complaintCount > 1 && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] text-white backdrop-blur-md">
                      <Users className="h-3 w-3" />
                      <span>{report.complaintCount} affected</span>
                    </div>
                  )}
                </div>

                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span className="font-bold text-foreground">{report.complaintId}</span>
                    <span>{formatRelativeTime(report.createdAt)}</span>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <span className="truncate-2-lines text-foreground/90 font-medium">
                      {report.address}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {report.description}
                  </p>
                </CardContent>
              </div>

              <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs font-semibold text-primary group-hover:underline">
                <span>View Full Timeline & Audits</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Complaints List View */}
      {!isLoading && viewMode === 'list' && filteredReports.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
          {filteredReports.map((report) => (
            <div
              key={report._id}
              onClick={() => setSelectedReport(report)}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 shrink-0 rounded-2xl bg-slate-900 overflow-hidden">
                  {report.images && report.images.length > 0 && (
                    <img
                      src={report.images[0].url}
                      alt="Thumbnail"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {report.complaintId}
                    </span>
                    <PriorityBadge priority={report.priority} size="sm" />
                    <StatusBadge status={report.status} size="sm" />
                  </div>
                  <p className="text-xs font-medium text-foreground truncate max-w-md">
                    {report.address}
                  </p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {report.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-auto text-xs text-muted-foreground">
                <span className="font-mono">{formatDate(report.createdAt)}</span>
                <Button variant="ghost" size="sm" className="rounded-xl h-8 px-2.5">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Sheet Drawer */}
      <Sheet open={Boolean(selectedReport)} onOpenChange={() => setSelectedReport(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          {selectedReport && (
            <div className="space-y-6 pb-8">
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <SheetTitle className="font-mono text-xl font-extrabold">
                    {selectedReport.complaintId}
                  </SheetTitle>
                  <PriorityBadge priority={selectedReport.priority} size="sm" />
                  <StatusBadge status={selectedReport.status} size="sm" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Reported on {formatDate(selectedReport.createdAt)} • {selectedReport.area}
                </p>
              </SheetHeader>

              {/* Photos Gallery */}
              {selectedReport.images && selectedReport.images.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Complaint Photos
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedReport.images.map((img, i) => (
                      <div
                        key={i}
                        className="aspect-[16/10] rounded-2xl overflow-hidden bg-slate-900 border border-border"
                      >
                        <img
                          src={img.url}
                          alt={`Report Photo ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Address & Coordinates */}
              <div className="rounded-2xl bg-muted/30 p-4 border border-border space-y-2 text-xs">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{selectedReport.address}</span>
                </div>
                <div className="text-muted-foreground pl-6 font-mono">
                  Coordinates: [{selectedReport.location.coordinates[1].toFixed(4)},{' '}
                  {selectedReport.location.coordinates[0].toFixed(4)}]
                </div>
                <p className="pt-2 text-foreground/90 border-t border-border/60">
                  {selectedReport.description}
                </p>
              </div>

              {/* Verified Repair Comparison Slider (if repaired) */}
              {(selectedReport.status === 'verified' ||
                selectedReport.status === 'repair-completed') &&
                selectedReport.images.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                      <span>Repair Audit Comparison</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        Verified
                      </span>
                    </h4>
                    <BeforeAfterSlider
                      beforeUrl={selectedReport.images[0].url}
                      afterUrl={
                        // Sample verified repair photo or original if demo
                        selectedReport.images[1]?.url || selectedReport.images[0].url
                      }
                    />
                  </div>
                )}

              {/* Vertical Animated Status Timeline */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Full Dispatch & Status Timeline
                </h4>
                <Timeline history={selectedReport.statusHistory} />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
