import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator
} from '../ui/command';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Compass,
  FileText,
  LogOut,
  Map,
  Moon,
  PlusCircle,
  Sun,
  Users,
  Wrench
} from 'lucide-react';

export const GlobalCommand: React.FC = () => {
  const navigate = useNavigate();
  const { commandPaletteOpen, setCommandPaletteOpen, toggleTheme, theme } = useUIStore();
  const { user, role, logout } = useAuthStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const runCommand = (command: () => void) => {
    setCommandPaletteOpen(false);
    command();
  };

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Type a command or search platform pages..." />
      <CommandList>
        <CommandEmpty>No matching results found.</CommandEmpty>

        {/* Citizen Routes */}
        {role === 'citizen' && (
          <CommandGroup heading="Citizen Actions">
            <CommandItem
              onSelect={() => runCommand(() => navigate('/report'))}
              className="gap-2.5"
            >
              <PlusCircle className="h-4 w-4 text-primary" />
              <span>Report a Pothole</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate('/my-complaints'))}
              className="gap-2.5"
            >
              <FileText className="h-4 w-4 text-primary" />
              <span>My Reported Complaints</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate('/nearby'))}
              className="gap-2.5"
            >
              <Compass className="h-4 w-4 text-primary" />
              <span>Explore Nearby Potholes</span>
            </CommandItem>
          </CommandGroup>
        )}

        {/* Admin Routes */}
        {role === 'admin' && (
          <CommandGroup heading="Admin Operations">
            <CommandItem
              onSelect={() => runCommand(() => navigate('/admin/dashboard'))}
              className="gap-2.5"
            >
              <BarChart3 className="h-4 w-4 text-primary" />
              <span>Analytics Overview</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate('/admin/map'))}
              className="gap-2.5"
            >
              <Map className="h-4 w-4 text-primary" />
              <span>Live Geographic Hazard Map</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate('/admin/complaints'))}
              className="gap-2.5"
            >
              <FileText className="h-4 w-4 text-primary" />
              <span>All Complaints Master Table</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate('/admin/verifications'))}
              className="gap-2.5"
            >
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Audit Repair Verifications</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate('/admin/teams'))}
              className="gap-2.5"
            >
              <Users className="h-4 w-4 text-primary" />
              <span>Team Performance & Maintenance Staff</span>
            </CommandItem>
          </CommandGroup>
        )}

        {/* Maintenance Routes */}
        {role === 'maintenance' && (
          <CommandGroup heading="Maintenance Operations">
            <CommandItem
              onSelect={() => runCommand(() => navigate('/maintenance/tasks'))}
              className="gap-2.5"
            >
              <Wrench className="h-4 w-4 text-primary" />
              <span>My Assigned Tasks (Kanban)</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate('/maintenance/history'))}
              className="gap-2.5"
            >
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Repair History & Logs</span>
            </CommandItem>
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Preferences & Session">
          <CommandItem
            onSelect={() => runCommand(toggleTheme)}
            className="gap-2.5"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
            <span>Toggle Theme ({theme === 'dark' ? 'Light Mode' : 'Dark Mode'})</span>
          </CommandItem>

          {user && (
            <CommandItem
              onSelect={() =>
                runCommand(() => {
                  logout();
                  navigate('/login');
                })
              }
              className="gap-2.5 text-rose-600 dark:text-rose-400"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out ({user.name})</span>
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
