import React, { useState } from 'react';
import { usePendingVerifications } from '../../api/queries';
import { useVerifyRepairMutation } from '../../api/mutations';
import { Repair, Report } from '../../types';
import { PageHeader } from '../../components/shared/PageHeader';
import { BeforeAfterSlider } from '../../components/shared/BeforeAfterSlider';
import { EmptyState } from '../../components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Skeleton } from '../../components/ui/skeleton';
import { formatDateTime } from '../../lib/utils';
import {
  CheckCircle,
  Clock,
  HardHat,
  MapPin,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
  Wrench,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

export const RepairVerificationPage: React.FC = () => {
  const { data: pendingRepairs, isLoading } = usePendingVerifications();
  const verifyMutation = useVerifyRepairMutation();

  const [activeRepair, setActiveRepair] = useState<Repair | null>(null);
  const [actionType, setActionType] = useState<'approved' | 'rejected'>('approved');
  const [remarks, setRemarks] = useState('');

  const handleOpenAction = (repair: Repair, type: 'approved' | 'rejected') => {
    setActiveRepair(repair);
    setActionType(type);
    setRemarks('');
  };

  const handleConfirmVerification = async () => {
    if (!activeRepair) return;
    try {
      await verifyMutation.mutateAsync({
        repairId: activeRepair._id,
        status: actionType,
        remarks: remarks || (actionType === 'approved' ? 'Quality inspection passed. Remediated.' : 'Requires rework.')
      });
      setActiveRepair(null);
    } catch {
      // error handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repair Verification & Quality Audit"
        subtitle="Examine on-site before/after evidence, verify remediation materials, and approve ticket closure."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Verifications' }]}
      />

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-96 rounded-3xl" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!pendingRepairs || pendingRepairs.length === 0) && (
        <EmptyState
          title="All Repairs Audited"
          description="There are no pending maintenance submissions waiting for administrative verification right now."
          icon={CheckCircle}
        />
      )}

      {/* List of Pending Verifications */}
      {!isLoading && pendingRepairs && pendingRepairs.length > 0 && (
        <div className="space-y-8">
          {pendingRepairs.map((repair) => {
            const report = repair.report as Report;
            const beforeImg =
              repair.beforeImages?.[0]?.url || report?.images?.[0]?.url || '';
            const afterImg = repair.afterImages?.[0]?.url || '';

            return (
              <Card
                key={repair._id}
                className="rounded-3xl border-border shadow-soft overflow-hidden"
              >
                <CardHeader className="bg-muted/30 border-b border-border p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-extrabold text-foreground">
                          {report?.complaintId || 'Ticket'}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                          Pending Audit
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {report?.address || 'City road location'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleOpenAction(repair, 'rejected')}
                        className="rounded-xl flex items-center gap-1 text-xs"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                        Reject / Request Rework
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleOpenAction(repair, 'approved')}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 text-xs shadow-soft"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        Approve & Close
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Interactive Before/After Slider */}
                  <div>
                    <span className="text-xs font-bold text-muted-foreground block mb-2 uppercase tracking-wider">
                      Interactive Photo Slider (Drag Handle)
                    </span>
                    {beforeImg && afterImg ? (
                      <BeforeAfterSlider
                        beforeUrl={beforeImg}
                        afterUrl={afterImg}
                        className="rounded-2xl"
                      />
                    ) : (
                      <div className="aspect-[16/10] rounded-2xl bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">
                        Images missing from submission
                      </div>
                    )}
                  </div>

                  {/* Right: Technical Remediation Log */}
                  <div className="flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-2xl bg-muted/40 border border-border">
                          <span className="text-muted-foreground block mb-0.5">Time Taken:</span>
                          <span className="font-bold font-mono text-foreground text-sm">
                            {repair.timeTakenHours || 1} hours
                          </span>
                        </div>
                        <div className="p-3 rounded-2xl bg-muted/40 border border-border">
                          <span className="text-muted-foreground block mb-0.5">Submitted:</span>
                          <span className="font-mono text-foreground">
                            {formatDateTime(repair.completedAt)}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-2 text-xs">
                        <span className="font-semibold text-muted-foreground block">
                          Materials Used on Site:
                        </span>
                        <p className="font-medium text-foreground">
                          {repair.materialsUsed || 'Standard asphalt cold-mix & compactor'}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-2 text-xs">
                        <span className="font-semibold text-muted-foreground block">
                          Technician Repair Notes:
                        </span>
                        <p className="text-foreground/90 leading-relaxed">
                          {repair.notes || 'Hazard filled, leveled, and compacted to road grade.'}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      Approving closes the ticket and notifies the citizen. Rejecting routes
                      the ticket back to the crew's active Kanban board with your remarks.
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Approve / Reject Dialog */}
      <Dialog open={Boolean(activeRepair)} onOpenChange={() => setActiveRepair(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approved' ? 'Approve Repair Verification' : 'Reject & Order Rework'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <p className="text-muted-foreground">
              {actionType === 'approved'
                ? 'Confirm that photographic evidence validates road safety standards. The report will be permanently closed.'
                : 'Explain what defect or deficiency remains so the crew can perform immediate rework.'}
            </p>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Engineering Audit Remarks {actionType === 'rejected' && <span className="text-rose-500">*</span>}
              </label>
              <Textarea
                rows={3}
                placeholder={
                  actionType === 'approved'
                    ? 'e.g. Surface level smooth, proper asphalt seal confirmed.'
                    : 'e.g. Edge compaction insufficient. Water pooling risk.'
                }
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveRepair(null)}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'approved' ? 'default' : 'destructive'}
              onClick={handleConfirmVerification}
              disabled={verifyMutation.isPending}
            >
              {actionType === 'approved' ? 'Confirm Approval' : 'Submit Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
