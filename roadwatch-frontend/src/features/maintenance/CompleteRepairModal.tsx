import React, { useState } from 'react';
import { useSubmitRepairMutation } from '../../api/mutations';
import { Report } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { ImageUploader } from '../../components/shared/ImageUploader';
import { toast } from 'sonner';
import { Camera, CheckCircle2, Loader2, Wrench } from 'lucide-react';

interface CompleteRepairModalProps {
  task: Report | null;
  onClose: () => void;
}

export const CompleteRepairModal: React.FC<CompleteRepairModalProps> = ({ task, onClose }) => {
  const [beforeImages, setBeforeImages] = useState<File[]>([]);
  const [afterImages, setAfterImages] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState('Hot-mix asphalt, bitumen tack coat, compactor');
  const [timeTakenHours, setTimeTakenHours] = useState('1.5');

  const submitRepairMutation = useSubmitRepairMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    if (afterImages.length === 0) {
      toast.error('After Photo Required', {
        description: 'Please upload at least 1 photo proving the road defect is remediated.'
      });
      return;
    }

    const formData = new FormData();
    formData.append('notes', notes || 'Remediation completed according to municipal road specs.');
    formData.append('materialsUsed', materialsUsed);
    formData.append('timeTakenHours', timeTakenHours);

    beforeImages.forEach((f) => formData.append('beforeImages', f));
    afterImages.forEach((f) => formData.append('afterImages', f));

    try {
      await submitRepairMutation.mutateAsync({
        taskId: task._id,
        formData
      });
      onClose();
    } catch {
      // error handled by mutation
    }
  };

  if (!task) return null;

  return (
    <Dialog open={Boolean(task)} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Complete Road Repair: {task.complaintId}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {/* Worksite location */}
          <div className="p-3 rounded-2xl bg-muted/40 border border-border">
            <span className="font-semibold text-muted-foreground block">Worksite Address:</span>
            <span className="text-foreground font-medium">{task.address}</span>
          </div>

          {/* After Photos (Required) */}
          <div className="space-y-1.5">
            <Label className="font-semibold text-foreground flex items-center gap-1.5">
              <Camera className="h-4 w-4 text-emerald-500" />
              After Repair Photos <span className="text-rose-500">*</span>
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Provide photographic proof of compacted, level road asphalt.
            </p>
            <ImageUploader files={afterImages} onChange={setAfterImages} maxImages={3} />
          </div>

          {/* Optional on-site Before Photos */}
          <div className="space-y-1.5 pt-2 border-t border-border">
            <Label className="font-semibold text-foreground">
              On-Site Before Photos (Optional if matching citizen photo)
            </Label>
            <ImageUploader files={beforeImages} onChange={setBeforeImages} maxImages={2} />
          </div>

          {/* Materials Used */}
          <div className="space-y-1.5 pt-2 border-t border-border">
            <Label htmlFor="materials">Materials & Equipment Utilized</Label>
            <Input
              id="materials"
              value={materialsUsed}
              onChange={(e) => setMaterialsUsed(e.target.value)}
              placeholder="e.g. Cold-mix asphalt, plate tamper, hot emulsion seal"
              className="rounded-xl text-xs"
              required
            />
          </div>

          {/* Labor Duration */}
          <div className="space-y-1.5">
            <Label htmlFor="hours">Labor Duration (Hours)</Label>
            <Input
              id="hours"
              type="number"
              step="0.25"
              min="0.25"
              value={timeTakenHours}
              onChange={(e) => setTimeTakenHours(e.target.value)}
              className="rounded-xl text-xs"
              required
            />
          </div>

          {/* Repair Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Technician Engineering Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Details regarding depth excavated, layers applied, and final grade..."
              className="rounded-2xl text-xs"
              required
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitRepairMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-soft"
            >
              {submitRepairMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting Audit...
                </span>
              ) : (
                'Submit Repair for Verification'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
