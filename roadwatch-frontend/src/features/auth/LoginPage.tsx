import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { loginSchema, LoginFormData } from '../../lib/schemas';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  Wrench,
  User as UserIcon,
  Loader2,
  Navigation,
  MapPin,
  Radio,
  AlertTriangle,
  Zap,
  ArrowRight
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState<string | null>(null);

  // Parallax mouse position
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMotionChange);
    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (prefersReducedMotion) return;
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX - innerWidth / 2) / (innerWidth / 2);
    const y = (e.clientY - innerHeight / 2) / (innerHeight / 2);
    setParallax({ x, y });
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (values: LoginFormData) => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.post('/api/auth/login', values);
      const user = data.data?.user || data.user;
      const token = data.data?.token || data.token;
      login(token, user);
      toast.success(`Access Granted. Welcome back, ${user.name}!`);

      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'maintenance') {
        navigate('/maintenance/tasks');
      } else {
        navigate('/report');
      }
    } catch (err: any) {
      toast.error('Authentication Rejected', {
        description: err.response?.data?.message || 'Invalid email or password.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setTestAccount = (email: string, pass: string, role: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
    setSelectedDemoRole(role);
    toast.info(`Selected ${role.toUpperCase()} Demo Profile`);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full overflow-x-hidden bg-[#040C14] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 select-none"
    >
      {/* 1. SATELLITE/GPS CITY MAP BACKGROUND */}
      <div
        className="fixed inset-0 bg-cover bg-center transition-transform duration-500 ease-out will-change-transform"
        style={{
          backgroundImage: "url('/futuristic-map-bg.jpg')",
          transform: prefersReducedMotion
            ? 'scale(1.02)'
            : `scale(1.06) translate3d(${parallax.x * -10}px, ${parallax.y * -10}px, 0)`,
        }}
      />

      {/* Atmospheric Overlays */}
      <div className="fixed inset-0 bg-radial-gradient from-transparent via-[#061423]/75 to-[#030910]/95 pointer-events-none" />
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.07]"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 217, 255, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 217, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Dynamic Radar and Sweeper */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-700 ease-out"
        style={{
          transform: prefersReducedMotion
            ? 'translate(-50%, -50%)'
            : `translate(calc(-50% + ${parallax.x * 20}px), calc(-50% + ${parallax.y * 20}px))`,
        }}
      >
        <div className="absolute -inset-32 rounded-full border border-cyan-400/30 animate-radar-pulse" />
        <div className="absolute -inset-56 rounded-full border border-blue-500/20 animate-radar-pulse" style={{ animationDelay: '1.2s' }} />
        <div className="absolute -inset-44 rounded-full overflow-hidden animate-radar-sweep pointer-events-none opacity-40">
          <div className="w-1/2 h-1/2 bg-gradient-to-br from-cyan-400/30 to-transparent transform origin-bottom-right" />
        </div>
      </div>

      {/* Corner Telemetry */}
      <div className="fixed top-6 left-6 hidden sm:flex items-center gap-3 z-10 text-[11px] font-mono text-cyan-400/90 bg-[#071726]/60 border border-cyan-500/25 px-3.5 py-1.5 rounded-xl backdrop-blur-md shadow-lg shadow-black/50">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>GRID SYS // ONLINE</span>
        <span className="text-cyan-600">|</span>
        <span className="text-slate-300">LAT: 30.2672° N</span>
        <span className="text-slate-300">LON: 97.7431° W</span>
      </div>

      <div className="fixed top-6 right-6 hidden sm:flex items-center gap-2.5 z-10 text-[11px] font-mono text-cyan-400/90 bg-[#071726]/60 border border-cyan-500/25 px-3.5 py-1.5 rounded-xl backdrop-blur-md shadow-lg shadow-black/50">
        <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span>SAT-LINK CONNECTED</span>
        <span className="text-emerald-400 font-bold">99.8% TELEMETRY</span>
      </div>

      {/* Login Card Container */}
      <div className="relative z-20 w-full max-w-[460px] mx-auto">
        {/* Branding */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex flex-col items-center group transition-transform duration-300 hover:scale-105">
            <div className="relative mb-3 flex items-center justify-center">
              <div className="absolute -inset-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-teal-300 opacity-60 blur-md group-hover:opacity-90 transition-opacity" />
              <div className="relative w-14 h-14 rounded-2xl bg-[#081827] border-2 border-cyan-400/80 flex items-center justify-center shadow-[0_0_25px_rgba(0,217,255,0.4)]">
                <Navigation className="w-7 h-7 text-cyan-300 fill-cyan-400/20 transform -rotate-45" />
              </div>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-1.5 drop-shadow-[0_0_15px_rgba(0,217,255,0.3)]">
              <span>Road</span>
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Watch
              </span>
            </h1>
            <p className="mt-1 text-xs font-mono font-bold tracking-[0.22em] text-cyan-300/80 uppercase">
              Smarter Roads. Safer Journeys.
            </p>
          </Link>
        </div>

        {/* Futuristic Glass Card */}
        <div
          className="relative p-6 sm:p-8 rounded-[22px] border transition-all duration-300"
          style={{
            backgroundColor: 'rgba(8, 22, 35, 0.78)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            boxShadow:
              '0 0 50px rgba(0, 217, 255, 0.18), 0 20px 60px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
          }}
        >
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400/60 rounded-tl-sm pointer-events-none" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400/60 rounded-tr-sm pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400/60 rounded-bl-sm pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400/60 rounded-br-sm pointer-events-none" />

          <div className="text-center mb-6">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Welcome Back</h2>
            <p className="mt-1 text-xs text-slate-300">Sign in to access your RoadWatch account.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300/90 mb-1.5 flex items-center justify-between">
                <span>Email Address</span>
                <span className="text-[10px] text-slate-400 font-normal">Civic / Staff ID</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-cyan-400/80" />
                </div>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="name@roadwatch.org"
                  className="w-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 bg-[#071624]/80 border border-cyan-500/30 rounded-xl focus:outline-hidden focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all duration-200"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300/90">
                  Password
                </label>
                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info('Demo mode: Please choose a 1-click account below.');
                  }}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 underline-offset-2 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-cyan-400/80" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 text-sm text-white placeholder-slate-400 bg-[#071624]/80 border border-cyan-500/30 rounded-xl focus:outline-hidden focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-cyan-500/40 bg-[#071624] text-cyan-500 focus:ring-cyan-400/30 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-slate-300 group-hover:text-white transition-colors">
                  Remember this terminal
                </span>
              </label>
              <span className="text-[10px] font-mono text-cyan-400/70 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                TLS 1.3 SECURE
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative mt-3 group flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl text-sm font-black tracking-wide text-[#04121E] uppercase transition-all duration-200 disabled:opacity-50 overflow-hidden cursor-pointer"
              style={{
                background: 'linear-gradient(90deg, #00D9FF 0%, #287BFF 50%, #00F0FF 100%)',
                boxShadow: '0 0 25px rgba(0, 217, 255, 0.45), 0 4px 15px rgba(0, 0, 0, 0.4)',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#04121E]" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-[#04121E] fill-[#04121E]" />
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-[#04121E] group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* One Click Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-cyan-500/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300/80">
                ⚡ One-Click Demo Profiles
              </span>
              <span className="text-[10px] text-slate-400">Click to fill</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setTestAccount('admin@roadwatch.org', 'AdminPassword123!', 'admin')}
                className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-200 group cursor-pointer ${
                  selectedDemoRole === 'admin'
                    ? 'bg-purple-950/60 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.35)] scale-[1.02]'
                    : 'bg-[#081522]/90 border-purple-500/30 hover:border-purple-400/70 hover:bg-purple-950/30'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400/50 flex items-center justify-center mb-1">
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <span className="text-[11px] font-bold text-white">Admin</span>
                <span className="text-[9px] font-mono text-purple-400/80">Oversight</span>
              </button>

              <button
                type="button"
                onClick={() => setTestAccount('john.maint@roadwatch.org', 'MaintPassword123!', 'maintenance')}
                className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-200 group cursor-pointer ${
                  selectedDemoRole === 'maintenance'
                    ? 'bg-amber-950/60 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-[1.02]'
                    : 'bg-[#081522]/90 border-amber-500/30 hover:border-amber-400/70 hover:bg-amber-950/30'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mb-1">
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="text-[11px] font-bold text-white">Tech Crew</span>
                <span className="text-[9px] font-mono text-amber-400/80">Field Rep</span>
              </button>

              <button
                type="button"
                onClick={() => setTestAccount('alice.citizen@gmail.com', 'CitizenPassword123!', 'citizen')}
                className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-200 group cursor-pointer ${
                  selectedDemoRole === 'citizen'
                    ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] scale-[1.02]'
                    : 'bg-[#081522]/90 border-cyan-500/30 hover:border-cyan-400/70 hover:bg-cyan-950/30'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center mb-1">
                  <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <span className="text-[11px] font-bold text-white">Citizen</span>
                <span className="text-[9px] font-mono text-cyan-400/80">Public</span>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-300">
            <span>Don't have an account? </span>
            <Link to="/register" className="font-bold text-cyan-400 hover:text-cyan-300 underline-offset-4 hover:underline">
              Register Citizen Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
