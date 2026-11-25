import React, { useState } from 'react';
import { useReports, useTeams } from '../../api/queries';
import { useAssignReportMutation } from '../../api/mutations';
import { Report, Priority } from '../../types';
import { PageHeader } from '../../components/shared/PageHeader';
import { MapView } from '../../components/shared/MapView';
import { Card, CardContent } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { PRIORITY_CONFIG } from '../../lib/constants';
import { Layers, MapPin, Users, Wrench } from 'lucide-react';
import { toast } from 'sonner';

export const AdminMapPage: React.FC = () => {
  const { data: reportsData } = useReports({ limit: 100 });
  const { data: teams } = useTeams();
  const assignMutation = useAssignReportMutation();

  const [assigningReport, setAssigningReport] = useState<Report | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const reports = reportsData?.data || [];

  const handleDispatch = async () => {
    if (!assigningReport || !selectedTeamId || !dueDate) {
      toast.error('Missing Parameters', { description: 'Please choose a team and due date.' });
      return;
    }

    try {
      await assignMutation.mutateAsync({
        reportId: assigningReport._id,
        teamId: selectedTeamId,
        dueDate
      });
      setAssigningReport(null);
    } catch {
      // error handled by mutation
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Geographic Hazard Map"
        subtitle="Live geospatial distribution of all city road defects with automated priority color-coding."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Map View' }]}
      />

      <div className="relative h-[calc(100vh-14rem)] rounded-3xl overflow-hidden border border-border shadow-soft">
        <MapView
          reports={reports}
          zoom={12}
          onAssignReport={(report) => {
            setAssigningReport(report);
            if (teams && teams.length > 0) setSelectedTeamId(teams[0]._id);
          }}
          className="h-full rounded-none"
        />

        {/* Floating Priority Legend Card */}
        <div className="absolute bottom-6 right-6 z-20">
          <Card className="glass-panel border-white/20 dark:border-white/10 shadow-soft-lg rounded-2xl p-3">
            <span className="text-[11px] font-bold text-foreground block mb-2 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Priority Legend
            </span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              {(['critical', 'high', 'medium', 'low'] as Priority[]).map((p) => (
                <div key={p} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: PRIORITY_CONFIG[p].colorHex }}
                  />
                  <span className="capitalize text-muted-foreground font-medium">{p}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Team Assignment Dialog */}
      <Dialog open={Boolean(assigningReport)} onOpenChange={() => setAssigningReport(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Dispatch Maintenance Crew
            </DialogTitle>
          </DialogHeader>

          {assigningReport && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-2xl bg-muted/40 border border-border text-xs space-y-1">
                <div className="flex justify-between font-mono font-bold text-foreground">
                  <span>{assigningReport.complaintId}</span>
                  <span className="capitalize text-primary">{assigningReport.priority} Priority</span>
                </div>
                <p className="text-muted-foreground truncate">{assigningReport.address}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="team">Select Maintenance Team</Label>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Choose a repair crew" />
                  </SelectTrigger>
                  <SelectContent>
                    {(teams || []).map((t) => (
                      <SelectItem key={t._id} value={t._id}>
                        {t.name} ({t.area} Area)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Scheduled Due Date</Label>
                <Input
                  id="dueDate"
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
            <Button
              onClick={handleDispatch}
              disabled={assignMutation.isPending}
              className="shadow-soft"
            >
              Confirm Dispatch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
