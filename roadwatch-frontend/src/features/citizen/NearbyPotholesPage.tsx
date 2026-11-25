import React, { useState, useEffect } from 'react';
import { useNearbyReports } from '../../api/queries';
import { useUpvoteReportMutation } from '../../api/mutations';
import { Priority, Report } from '../../types';
import { DEFAULT_MAP_CENTER, PRIORITY_CONFIG } from '../../lib/constants';
import { MapView } from '../../components/shared/MapView';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { PriorityBadge } from '../../components/shared/PriorityBadge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../../components/ui/sheet';
import {
  Compass,
  Filter,
  List,
  Loader2,
  MapPin,
  Navigation,
  Sliders,
  ThumbsUp,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

export const NearbyPotholesPage: React.FC = () => {
  const [userLocation, setUserLocation] = useState<[number, number]>(DEFAULT_MAP_CENTER);
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'all'>('all');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  const { data: nearbyReports, isLoading } = useNearbyReports(
    userLocation[0],
    userLocation[1],
    radiusKm
  );

  const upvoteMutation = useUpvoteReportMutation();

  // Auto locate user on initial mount
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
        },
        { timeout: 7000 }
      );
    }
  }, []);

  const handleRecenterGPS = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation([lat, lng]);
        setIsLocating(false);
        toast.success('Centered to Your GPS');
      },
      (err) => {
        setIsLocating(false);
        toast.error('Location Error', { description: err.message });
      }
    );
  };

  const filteredReports = (nearbyReports || []).filter((r) => {
    if (selectedPriority === 'all') return true;
    return r.priority === selectedPriority;
  });

  return (
    <div className="relative h-[calc(100vh-8.5rem)] flex flex-col rounded-3xl overflow-hidden border border-border shadow-soft">
      {/* Full Height Map */}
      <div className="flex-1 w-full h-full">
        <MapView
          reports={filteredReports}
          center={userLocation}
          zoom={13}
          className="h-full rounded-none"
        />
      </div>

      {/* Floating Filter Panel (Desktop: Top-Right Glass Card) */}
      <div className="absolute top-4 right-4 z-20 hidden sm:block w-80">
        <Card className="glass-panel border-white/20 dark:border-white/10 shadow-soft-lg rounded-3xl">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-primary" />
                Radar & Proximity Filters
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRecenterGPS}
                disabled={isLocating}
                className="h-7 text-xs px-2 rounded-lg"
              >
                {isLocating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Navigation className="h-3.5 w-3.5 text-primary" />
                )}
                Locate
              </Button>
            </div>

            {/* Radius Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Search Radius:</span>
                <span className="font-bold font-mono text-primary">{radiusKm} km</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Priority Filter Chips */}
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Filter by Severity:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedPriority('all')}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                    selectedPriority === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  All ({nearbyReports?.length || 0})
                </button>
                {(['critical', 'high', 'medium', 'low'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPriority(p)}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                      selectedPriority === p
                        ? 'bg-foreground text-background shadow-sm'
                        : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Upvote Quick List Item */}
            <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
              Click any map pin to view complaint details and click <strong>"I'm affected too"</strong> to upvote urgency.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Bottom Action Bar on Mobile */}
      <div className="absolute bottom-4 left-4 right-4 z-20 sm:hidden flex gap-2">
        <Button
          onClick={handleRecenterGPS}
          disabled={isLocating}
          variant="secondary"
          className="flex-1 rounded-2xl glass-panel shadow-soft text-xs flex items-center justify-center gap-1.5"
        >
          <Navigation className="h-4 w-4 text-primary" />
          Locate Me
        </Button>

        <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
          <SheetTrigger asChild>
            <Button className="flex-1 rounded-2xl shadow-soft text-xs flex items-center justify-center gap-1.5">
              <List className="h-4 w-4" />
              Nearby List ({filteredReports.length})
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[75vh] p-4">
            <SheetHeader className="pb-3 border-b border-border">
              <SheetTitle className="text-base font-bold flex items-center justify-between">
                <span>Nearby Potholes ({filteredReports.length})</span>
                <span className="font-mono text-xs text-primary">{radiusKm} km radius</span>
              </SheetTitle>
            </SheetHeader>

            <div className="overflow-y-auto max-h-[60vh] divide-y divide-border py-2 space-y-2">
              {filteredReports.map((report) => (
                <div key={report._id} className="pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {report.complaintId}
                    </span>
                    <PriorityBadge priority={report.priority} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{report.address}</p>
                  <div className="flex items-center justify-between pt-1">
                    <StatusBadge status={report.status} size="sm" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => upvoteMutation.mutate(report._id)}
                      className="rounded-xl h-7 text-xs flex items-center gap-1"
                    >
                      <ThumbsUp className="h-3 w-3" />
                      Affected ({report.complaintCount})
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};
