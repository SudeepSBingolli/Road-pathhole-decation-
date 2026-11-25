import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState
} from '@tanstack/react-table';
import { useReports, useTeams } from '../../api/queries';
import { useAssignReportMutation, useUpdateReportStatusMutation } from '../../api/mutations';
import { Report, ReportStatus, Priority } from '../../types';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { PriorityBadge } from '../../components/shared/PriorityBadge';
import { Timeline } from '../../components/shared/Timeline';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import { Label } from '../../components/ui/label';
import { PRESET_AREAS, STATUS_CONFIG } from '../../lib/constants';
import { formatDate, formatDateTime } from '../../lib/utils';
import {
  ArrowUpDown,
  CheckCircle,
  Clock,
  Eye,
  FileSpreadsheet,
  Filter,
  MapPin,
  Search,
  Users,
  Wrench,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

export const ComplaintsTablePage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [assigningReport, setAssigningReport] = useState<Report | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const { data: reportsData, isLoading } = useReports({ limit: 150 });
  const { data: teams } = useTeams();
  const assignMutation = useAssignReportMutation();
  const updateStatusMutation = useUpdateReportStatusMutation();

  const reports = useMemo(() => reportsData?.data || [], [reportsData]);

  // Client-side filtering
  const filteredData = useMemo(() => {
    return reports.filter((item: Report) => {
      const matchSearch =
        !search ||
        item.complaintId.toLowerCase().includes(search.toLowerCase()) ||
        item.address.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchPriority = priorityFilter === 'all' || item.priority === priorityFilter;
      const matchArea = areaFilter === 'all' || item.area === areaFilter;

      return matchSearch && matchStatus && matchPriority && matchArea;
    });
  }, [reports, search, statusFilter, priorityFilter, areaFilter]);

  const handleInlinePriorityChange = (reportId: string, newPriority: Priority) => {
    updateStatusMutation.mutate({
      reportId,
      priority: newPriority,
      note: `Admin manually updated priority to ${newPriority}`
    });
  };

  const handleDispatch = async () => {
    if (!assigningReport || !selectedTeamId || !dueDate) {
      toast.error('Missing Parameters', { description: 'Choose team and date.' });
      return;
    }
    await assignMutation.mutateAsync({
      reportId: assigningReport._id,
      teamId: selectedTeamId,
      dueDate
    });
    setAssigningReport(null);
  };

  // Define Table Columns
  const columns = useMemo<ColumnDef<Report>[]>(
    () => [
      {
        accessorKey: 'complaintId',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-bold font-mono"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            ID
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-mono font-bold text-xs text-primary">
            {row.original.complaintId}
          </span>
        )
      },
      {
        id: 'thumbnail',
        header: 'Photo',
        cell: ({ row }) => {
          const img = row.original.images?.[0]?.url;
          return (
            <div className="h-10 w-12 rounded-lg bg-slate-900 overflow-hidden">
              {img ? (
                <img src={img} alt="Thumb" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground">
                  —
                </div>
              )}
            </div>
          );
        }
      },
      {
        accessorKey: 'address',
        header: 'Address / Area',
        cell: ({ row }) => (
          <div className="max-w-[200px]">
            <p className="truncate text-xs font-semibold text-foreground">
              {row.original.address}
            </p>
            <p className="text-[10px] text-muted-foreground">{row.original.area}</p>
          </div>
        )
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              defaultValue={row.original.priority}
              onValueChange={(val) =>
                handleInlinePriorityChange(row.original._id, val as Priority)
              }
            >
              <SelectTrigger className="h-7 w-28 text-xs rounded-lg border-0 bg-transparent p-0">
                <PriorityBadge priority={row.original.priority} size="sm" />
              </SelectTrigger>
              <SelectContent>
                {(['low', 'medium', 'high', 'critical'] as Priority[]).map((p) => (
                  <SelectItem key={p} value={p} className="text-xs capitalize">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
      },
      {
        accessorKey: 'complaintCount',
        header: 'Affected',
        cell: ({ row }) => (
          <span className="text-xs font-mono font-semibold text-foreground">
            {row.original.complaintCount || 1}
          </span>
        )
      },
      {
        accessorKey: 'assignedTeam',
        header: 'Assigned Crew',
        cell: ({ row }) => {
          const team = row.original.assignedTeam as any;
          return (
            <span className="text-xs text-muted-foreground font-medium">
              {team?.name || 'Unassigned'}
            </span>
          );
        }
      },
      {
        accessorKey: 'createdAt',
        header: 'Submitted',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-mono">
            {formatDate(row.original.createdAt)}
          </span>
        )
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const report = row.original;
          return (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedReport(report)}
                className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                title="View details"
              >
                <Eye className="h-4 w-4" />
              </Button>

              {report.status === 'submitted' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAssigningReport(report);
                    if (teams && teams.length > 0) setSelectedTeamId(teams[0]._id);
                  }}
                  className="h-8 text-xs rounded-lg px-2.5 font-medium"
                >
                  <Wrench className="h-3 w-3 mr-1 text-primary" />
                  Assign
                </Button>
              )}
            </div>
          );
        }
      }
    ],
    [teams]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 }
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Complaints Directory"
        subtitle="Manage, filter, triage, and dispatch citizen-reported road defects across city jurisdictions."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Complaints' }]}
      />

      {/* Filter and Search Bar */}
      <div className="rounded-3xl border border-border bg-card p-4 space-y-4 shadow-soft">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, street address, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 rounded-xl text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.keys(STATUS_CONFIG).map((s) => (
                  <SelectItem key={s} value={s} className="capitalize text-xs">
                    {STATUS_CONFIG[s as ReportStatus].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32 rounded-xl text-xs">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Area Filter */}
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-36 rounded-xl text-xs">
                <SelectValue placeholder="Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {PRESET_AREAS.map((a) => (
                  <SelectItem key={a} value={a} className="text-xs">
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* TanStack Table Container */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-bold text-foreground">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => setSelectedReport(row.original)}
                  className="cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-xs">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-28 text-center text-xs text-muted-foreground">
                  {isLoading ? 'Loading records...' : 'No complaints matched filter criteria.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Table Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1} ({filteredData.length} total)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-xl h-8 px-3 text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-xl h-8 px-3 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Row Inspection Details Sheet */}
      <Sheet open={Boolean(selectedReport)} onOpenChange={() => setSelectedReport(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          {selectedReport && (
            <div className="space-y-6 pb-8">
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <SheetTitle className="font-mono text-xl font-bold">
                    {selectedReport.complaintId}
                  </SheetTitle>
                  <PriorityBadge priority={selectedReport.priority} size="sm" />
                  <StatusBadge status={selectedReport.status} size="sm" />
                </div>
                <p className="text-xs text-muted-foreground">
                  District: {selectedReport.area} • Logged {formatDateTime(selectedReport.createdAt)}
                </p>
              </SheetHeader>

              {/* Photos */}
              {selectedReport.images && selectedReport.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedReport.images.map((img, i) => (
                    <div
                      key={i}
                      className="aspect-[16/10] rounded-2xl bg-slate-900 overflow-hidden border border-border"
                    >
                      <img src={img.url} alt="Photo" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Address & Meta */}
              <div className="rounded-2xl bg-muted/40 p-4 border border-border text-xs space-y-2">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{selectedReport.address}</span>
                </div>
                <p className="text-foreground/90 pt-2 border-t border-border/60">
                  {selectedReport.description}
                </p>
              </div>

              {/* Status Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Audit History
                </h4>
                <Timeline history={selectedReport.statusHistory} />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Assign Team Modal */}
      <Dialog open={Boolean(assigningReport)} onOpenChange={() => setAssigningReport(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Task to Maintenance Crew</DialogTitle>
          </DialogHeader>

          {assigningReport && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-2xl bg-muted/40 border border-border text-xs space-y-1">
                <p className="font-mono font-bold">{assigningReport.complaintId}</p>
                <p className="text-muted-foreground truncate">{assigningReport.address}</p>
              </div>

              <div className="space-y-2">
                <Label>Choose Maintenance Crew</Label>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {(teams || []).map((t) => (
                      <SelectItem key={t._id} value={t._id}>
                        {t.name} ({t.area})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssigningReport(null)}>
              Cancel
            </Button>
            <Button onClick={handleDispatch} disabled={assignMutation.isPending}>
              Assign & Dispatch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
