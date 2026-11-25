import React, { useState } from 'react';
import { useTeamPerformance, useTeams, useMaintenanceUsers } from '../../api/queries';
import { useCreateMaintenanceUserMutation } from '../../api/mutations';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Award,
  CheckCircle,
  Clock,
  HardHat,
  MapPin,
  PlusCircle,
  RotateCcw,
  ShieldAlert,
  UserPlus,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

export const TeamsPerformancePage: React.FC = () => {
  const { data: teamPerf, isLoading: isPerfLoading } = useTeamPerformance();
  const { data: teams } = useTeams();
  const { data: maintenanceUsers, isLoading: isUsersLoading } = useMaintenanceUsers();
  const createUserMutation = useCreateMaintenanceUserMutation();

  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [teamId, setTeamId] = useState('');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Required Fields Missing', { description: 'Name, email, and password are required.' });
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        name,
        email,
        password,
        phone,
        teamId: teamId || undefined
      });
      setCreateUserOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setTeamId('');
    } catch {
      // error handled by mutation
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Crew Efficiency & Maintenance Staff"
        subtitle="Workforce telemetry, average repair duration, SLA adherence, and team roster management."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Teams & Staff' }]}
        actions={
          <Button
            onClick={() => setCreateUserOpen(true)}
            className="rounded-xl flex items-center gap-1.5 shadow-soft"
          >
            <UserPlus className="h-4 w-4" />
            Add Maintenance Staff
          </Button>
        }
      />

      {/* Leaderboard Cards */}
      <div>
        <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-500" />
          Team Performance Leaderboard
        </h3>

        {isPerfLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-48 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(teamPerf || []).map((team, idx) => (
              <Card
                key={team.teamId}
                className="rounded-3xl border-border shadow-soft relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

                <CardHeader className="p-6 pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-foreground">
                        {team.teamName}
                      </CardTitle>
                      <CardDescription className="text-xs flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-primary" />
                        Zone: {team.area} District
                      </CardDescription>
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary font-mono font-bold text-sm">
                      #{idx + 1}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-4">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-2xl bg-muted/40 p-3 border border-border/60">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                      <span className="text-xs text-muted-foreground block">Completed</span>
                      <strong className="text-lg font-mono text-foreground font-extrabold">
                        {team.completedCount}
                      </strong>
                    </div>

                    <div className="rounded-2xl bg-muted/40 p-3 border border-border/60">
                      <Clock className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                      <span className="text-xs text-muted-foreground block">Avg Time</span>
                      <strong className="text-lg font-mono text-foreground font-extrabold">
                        {team.averageHours}h
                      </strong>
                    </div>

                    <div className="rounded-2xl bg-muted/40 p-3 border border-border/60">
                      <ShieldAlert className="h-4 w-4 text-rose-500 mx-auto mb-1" />
                      <span className="text-xs text-muted-foreground block">Overdue</span>
                      <strong className="text-lg font-mono text-foreground font-extrabold">
                        {team.overdueCount}
                      </strong>
                    </div>

                    <div className="rounded-2xl bg-muted/40 p-3 border border-border/60">
                      <RotateCcw className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                      <span className="text-xs text-muted-foreground block">Rework</span>
                      <strong className="text-lg font-mono text-foreground font-extrabold">
                        {team.reworkRate}%
                      </strong>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Maintenance Staff Roster */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <HardHat className="h-4 w-4 text-primary" />
          Active Maintenance Personnel
        </h3>

        {isUsersLoading ? (
          <Skeleton className="h-48 rounded-3xl" />
        ) : (
          <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
            <div className="divide-y divide-border">
              {(maintenanceUsers || []).map((user) => (
                <div
                  key={user._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                      {user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{user.name}</p>
                      <p className="text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>
                      Crew: <strong className="text-foreground">{(user.team as any)?.name || 'General Field'}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Maintenance User Modal */}
      <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Maintenance Staff</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="mName">Full Name</Label>
              <Input
                id="mName"
                placeholder="e.g. Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mEmail">Official Email</Label>
              <Input
                id="mEmail"
                type="email"
                placeholder="alex.maint@roadwatch.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mPassword">Temporary Password</Label>
              <Input
                id="mPassword"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mPhone">Phone Number</Label>
              <Input
                id="mPhone"
                placeholder="(555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mTeam">Assign Team</Label>
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Choose maintenance crew" />
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

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setCreateUserOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createUserMutation.isPending}>
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
