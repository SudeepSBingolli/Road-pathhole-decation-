import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { HardHat, ShieldCheck, Zap, Activity } from 'lucide-react';
import { ThemeToggle } from '../components/shared/ThemeToggle';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left Civic Hero Section (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 text-white overflow-hidden p-12 flex-col justify-between">
        {/* Ambient Gradient Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-600/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e40af_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />

        {/* Top Header */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <div className="h-11 w-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-glow-primary">
              <HardHat className="h-6 w-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight">RoadWatch</span>
              <p className="text-xs text-blue-200/70 font-medium">Civic Infrastructure Platform</p>
            </div>
          </Link>
        </div>

        {/* Hero Narrative */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-300 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            Next-Gen Urban Road Maintenance
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            Empowering citizens and municipal crews to fix road hazards faster.
          </h2>

          <p className="text-slate-300 text-sm leading-relaxed">
            Report potholes in seconds with precision GPS, track repairs in real-time,
            and inspect before/after verification logs directly from your phone.
          </p>

          {/* Civic Tech Feature Highlights */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="h-8 w-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2">
                <Zap className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold">25m Proximity Merge</h4>
              <p className="text-xs text-slate-400 mt-1">
                Auto-combines nearby complaints to dynamically escalate urgency.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold">Photo Verification</h4>
              <p className="text-xs text-slate-400 mt-1">
                Side-by-side photographic audits before complaints are closed.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Trust Quote */}
        <div className="relative z-10 text-xs text-slate-400 border-t border-white/10 pt-4 flex items-center justify-between">
          <span>Trusted by city councils & public works departments</span>
          <span className="font-mono">v2.0 • Civic Edition</span>
        </div>
      </div>

      {/* Right Form Card Side */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 py-10 relative">
        <div className="absolute top-6 right-6 flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
