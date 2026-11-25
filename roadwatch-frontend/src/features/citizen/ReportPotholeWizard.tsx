import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  MapPin,
  Navigation,
  Sparkles,
  Users
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ImageUploader } from '../../components/shared/ImageUploader';
import { MapView } from '../../components/shared/MapView';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { PriorityBadge } from '../../components/shared/PriorityBadge';
import { reportWizardSchema, ReportWizardFormData } from '../../lib/schemas';
import { useCreateReportMutation } from '../../api/mutations';
import { DEFAULT_MAP_CENTER, PRESET_AREAS } from '../../lib/constants';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, label: 'Photos', icon: Camera },
  { id: 2, label: 'Location', icon: MapPin },
  { id: 3, label: 'Details', icon: FileText },
  { id: 4, label: 'Review', icon: CheckCircle2 }
];

export const ReportPotholeWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [images, setImages] = useState<File[]>([]);
  const [markerPosition, setMarkerPosition] = useState<[number, number]>(DEFAULT_MAP_CENTER);
  const [isLocating, setIsLocating] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  const createReportMutation = useCreateReportMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ReportWizardFormData>({
    resolver: zodResolver(reportWizardSchema),
    defaultValues: {
      description: '',
      address: '',
      area: PRESET_AREAS[0],
      latitude: DEFAULT_MAP_CENTER[0],
      longitude: DEFAULT_MAP_CENTER[1]
    }
  });

  const formValues = watch();

  // GPS auto-detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation Not Supported', {
        description: 'Your browser does not support GPS location lookup.'
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMarkerPosition([lat, lng]);
        setValue('latitude', lat, { shouldValidate: true });
        setValue('longitude', lng, { shouldValidate: true });
        setIsLocating(false);
        toast.success('Location Pinpointed', {
          description: `GPS coordinates locked: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`
        });
      },
      (err) => {
        setIsLocating(false);
        toast.error('GPS Lookup Failed', {
          description: err.message || 'Could not fetch current coordinates.'
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePositionChange = (pos: [number, number]) => {
    setMarkerPosition(pos);
    setValue('latitude', pos[0], { shouldValidate: true });
    setValue('longitude', pos[1], { shouldValidate: true });
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (images.length === 0) {
        toast.error('Photo Required', {
          description: 'Please upload at least 1 photo of the pothole or road hazard.'
        });
        return false;
      }
      return true;
    }
    if (currentStep === 2) {
      if (!formValues.address || formValues.address.trim().length < 3) {
        toast.error('Address Required', {
          description: 'Please provide a street address or nearby landmark.'
        });
        return false;
      }
      return true;
    }
    if (currentStep === 3) {
      if (!formValues.description || formValues.description.trim().length < 10) {
        toast.error('Description Required', {
          description: 'Please describe the road hazard (minimum 10 characters).'
        });
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (values: ReportWizardFormData) => {
    const formData = new FormData();
    formData.append('description', values.description);
    formData.append('address', values.address);
    formData.append('area', values.area);
    formData.append('latitude', values.latitude.toString());
    formData.append('longitude', values.longitude.toString());

    images.forEach((file) => {
      formData.append('images', file);
    });

    try {
      const res = await createReportMutation.mutateAsync(formData);
      setSubmissionResult(res);

      // Trigger Confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // Error handled by mutation
    }
  };

  // SUCCESS SCREEN
  if (submissionResult) {
    const isDuplicate = submissionResult.isDuplicate;
    const reportData = submissionResult.data;

    return (
      <div className="max-w-2xl mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-border shadow-soft-lg rounded-3xl overflow-hidden text-center p-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-6">
              <Sparkles className="h-10 w-10 animate-bounce" />
            </div>

            {isDuplicate ? (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 px-3.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                  <Users className="h-3.5 w-3.5" />
                  Community Voice Merged
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  Already Reported — We Added Your Voice!
                </h2>

                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  A matching complaint was already filed within 25 meters. Your report
                  has been merged with master ticket{' '}
                  <strong className="text-foreground font-mono">{reportData.complaintId}</strong>,
                  bumping its priority to{' '}
                  <PriorityBadge priority={reportData.priority} size="sm" />!
                </p>

                <div className="mt-6 rounded-2xl bg-muted/40 p-4 border border-border/80 text-left space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Total Citizen Reports:</span>
                    <span className="font-bold font-mono text-foreground">
                      {reportData.complaintCount} citizens affected
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Current Status:</span>
                    <StatusBadge status={reportData.status} size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium text-foreground truncate max-w-[200px]">
                      {reportData.address}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  Report Filed Successfully!
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Thank you for keeping our city safe. Your complaint has been submitted
                  to municipal dispatch with tracking ID:
                </p>

                <div className="py-4">
                  <span className="inline-block px-6 py-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-mono text-xl sm:text-2xl font-extrabold tracking-wider">
                    {reportData.complaintId}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setSubmissionResult(null);
                  setCurrentStep(1);
                  setImages([]);
                }}
                className="rounded-xl"
              >
                Report Another Hazard
              </Button>
              <Button
                onClick={() => (window.location.href = '/my-complaints')}
                className="rounded-xl shadow-soft"
              >
                View My Complaints
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Report Road Damage"
        subtitle="Submit photographic evidence and GPS location to trigger municipal repair dispatch."
        breadcrumbs={[
          { label: 'Citizen', href: '/my-complaints' },
          { label: 'Report Pothole' }
        ]}
      />

      {/* Wizard Progress Stepper */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const isDone = s.id < currentStep;
          const isCurrent = s.id === currentStep;

          return (
            <div
              key={s.id}
              className={`flex flex-col sm:flex-row items-center gap-2 p-3 rounded-2xl border transition-all text-center sm:text-left ${
                isCurrent
                  ? 'border-primary bg-primary/5 text-primary shadow-sm font-bold'
                  : isDone
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                  : 'border-border bg-card text-muted-foreground opacity-60'
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : s.id}
              </div>
              <span className="text-xs font-semibold">{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Step Container */}
      <Card className="border-border shadow-soft rounded-3xl overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {/* STEP 1: PHOTOS */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      Upload Damage Photos
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Clear photos allow automated severity calculation and team dispatching.
                    </p>
                  </div>

                  <ImageUploader
                    files={images}
                    onChange={setImages}
                    maxImages={3}
                  />
                </motion.div>
              )}

              {/* STEP 2: LOCATION */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        Pinpoint Location
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Drag the pin to the exact pothole spot on the street.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDetectGPS}
                      disabled={isLocating}
                      className="rounded-xl flex items-center gap-1.5"
                    >
                      {isLocating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      ) : (
                        <Navigation className="h-3.5 w-3.5 text-primary" />
                      )}
                      GPS Locate Me
                    </Button>
                  </div>

                  {/* Interactive Map Picker */}
                  <MapView
                    interactivePicker={true}
                    pickerPosition={markerPosition}
                    onPickerPositionChange={handlePositionChange}
                    className="h-72"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Street Address / Landmark</Label>
                      <Input
                        id="address"
                        placeholder="e.g. 502 E 7th St, near Metro stop"
                        {...register('address')}
                        className="rounded-xl"
                      />
                      {errors.address && (
                        <p className="text-xs text-destructive">{errors.address.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="area">City District / Area</Label>
                      <Select
                        defaultValue={formValues.area}
                        onValueChange={(val) => setValue('area', val)}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select Area" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRESET_AREAS.map((a) => (
                            <SelectItem key={a} value={a}>
                              {a}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: DETAILS */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Hazard Details</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Help repair teams understand the road defect dimensions and hazards.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Hazard Description</Label>
                    <Textarea
                      id="description"
                      rows={4}
                      placeholder="e.g., Deep pothole in right lane causing vehicular swerving. Approximately 2 feet wide and 4 inches deep."
                      {...register('description')}
                      className="rounded-2xl"
                    />
                    {errors.description && (
                      <p className="text-xs text-destructive">
                        {errors.description.message}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 4: REVIEW & SUBMIT */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Review & Submit</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Confirm complaint parameters before dispatching to city maintenance.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Area:</span>
                      <span className="text-xs font-bold text-foreground">{formValues.area}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Address:</span>
                      <span className="text-xs font-medium text-foreground">{formValues.address}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Coordinates:</span>
                      <span className="font-mono text-xs text-foreground">
                        {markerPosition[0].toFixed(4)}, {markerPosition[1].toFixed(4)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-border">
                      <span className="text-xs font-semibold text-muted-foreground block mb-1">
                        Description:
                      </span>
                      <p className="text-xs text-foreground/90 bg-card p-3 rounded-xl border border-border/60">
                        {formValues.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border">
                      <span className="text-xs font-semibold text-muted-foreground block mb-2">
                        Attached Photos ({images.length}):
                      </span>
                      <div className="flex gap-2">
                        {images.map((file, i) => (
                          <div
                            key={i}
                            className="h-16 w-16 rounded-xl overflow-hidden border border-border bg-slate-900"
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt="Thumbnail"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stepper Navigation Buttons */}
            <div className="mt-8 flex items-center justify-between pt-4 border-t border-border">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="rounded-xl flex items-center gap-1.5"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  Next Step
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={createReportMutation.isPending}
                  className="rounded-xl px-6 font-bold shadow-glow-primary"
                >
                  {createReportMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting Report...
                    </span>
                  ) : (
                    'Submit Pothole Report'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};
