import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Eye,
  EyeOff,
  Shield,
  Wrench,
  User,
  ArrowRight,
  Zap,
  Loader2,
  Scan,
  Compass
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedDemoRole, setSelectedDemoRole] = useState(null);

  // Parallax subtle interaction for 3D ribbon depth
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMotionChange);

    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  const handleMouseMove = (e) => {
    if (prefersReducedMotion) return;
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX - innerWidth / 2) / (innerWidth / 2);
    const y = (e.clientY - innerHeight / 2) / (innerHeight / 2);
    setParallax({ x, y });
  };

  const redirectAfterLogin = (role) => {
    const from = location.state?.from?.pathname;
    if (from) {
      navigate(from, { replace: true });
      return;
    }

    if (role === 'admin') navigate('/admin/dashboard', { replace: true });
    else if (role === 'maintenance') navigate('/maintenance/tasks', { replace: true });
    else navigate('/citizen/complaints', { replace: true });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const user = await login({ email, password });
      toast.success(`Access Granted. Welcome back, ${user.name}!`, {
        icon: '🛡️',
        style: {
          background: '#150A07',
          color: '#FF8A00',
          border: '1px solid rgba(255, 107, 26, 0.4)',
        },
      });
      redirectAfterLogin(user.role);
    } catch (err) {
      const msg = err.message || 'Authentication rejected. Verify credentials.';
      setErrorMsg(msg);
      toast.error(msg, {
        style: {
          background: '#1F0C08',
          color: '#FF6B6B',
          border: '1px solid rgba(255, 107, 107, 0.4)',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail, demoPassword, role) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setSelectedDemoRole(role);
    setErrorMsg('');
    toast(`Loaded ${role.toUpperCase()} Profile`, {
      icon: '⚡',
      duration: 2200,
      style: {
        background: '#1A0C08',
        color: '#FF8A00',
        border: '1px solid rgba(255, 138, 0, 0.35)',
      },
    });
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    toast('Demo mode: Choose one of the quick profiles below to sign in.', {
      icon: 'ℹ️',
      duration: 3500,
      style: {
        background: '#150A07',
        color: '#FFA24C',
        border: '1px solid rgba(255, 138, 0, 0.25)',
      },
    });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full overflow-hidden bg-gradient-to-tr from-[#A62700] via-[#E85507] to-[#FFA41B] flex items-center justify-center p-3 sm:p-6 lg:p-10 select-none"
    >
      {/* Outer ambient radiant background glows */}
      <div className="fixed inset-0 bg-radial-gradient from-transparent via-black/40 to-black/85 pointer-events-none" />

      {/* Main Centered Framed Container */}
      <div className="relative w-full max-w-[1180px] min-h-[660px] lg:h-[720px] bg-[#0E0604] rounded-[28px] sm:rounded-[36px] shadow-[0_30px_90px_rgba(0,0,0,0.92)] border border-black/40 ring-1 ring-white/10 flex flex-col lg:flex-row overflow-hidden z-10">
        
        {/* ========================================================= */}
        {/* LEFT SECTION: AUTHENTICATION PANEL (~40%)                 */}
        {/* ========================================================= */}
        <div className="w-full lg:w-[44%] xl:w-[40%] bg-[#100604] px-8 sm:px-12 py-9 sm:py-11 flex flex-col justify-between relative z-20 border-b lg:border-b-0 lg:border-r border-[#261510]">
          
          {/* Top Logo */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF8A00] to-[#E9430A] flex items-center justify-center shadow-[0_0_15px_rgba(255,107,26,0.5)]">
                <Shield className="w-4 h-4 text-white fill-white/20" />
              </div>
              <span className="text-lg font-black tracking-widest text-white">
                ROAD<span className="text-[#FF6B1A]">GUARD</span>
              </span>
            </div>

            {/* Main Editorial Headline */}
            <div className="mt-8 mb-2">
              <h1 className="text-3xl sm:text-[40px] font-serif text-white tracking-tight leading-[1.14]">
                Monitor Roads.<br />
                Detect Problems.<br />
                <span className="italic text-[#FF6B1A]">
                  Smarter.
                </span>
              </h1>
              <p className="mt-3.5 text-[#A69B96] text-xs sm:text-[13px] leading-relaxed max-w-[340px] font-sans">
                An intelligent AI-powered platform designed to detect road potholes,
                monitor road conditions, and simplify road maintenance — all in one place.
              </p>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="mt-4 p-2.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2 animate-fadeIn">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
              {/* Email Input */}
              <div>
                <input
                  type="email"
                  id="login-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@gmail.com"
                  autoComplete="email"
                  className="w-full bg-[#241815] border border-[#3A2420] hover:border-[#4E312B] focus:border-[#FF6B1A] focus:ring-1 focus:ring-[#FF6B1A] text-white placeholder-[#7A6A65] text-sm rounded-xl py-3 px-4 transition-all duration-200 outline-none"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-[#241815] border border-[#3A2420] hover:border-[#4E312B] focus:border-[#FF6B1A] focus:ring-1 focus:ring-[#FF6B1A] text-white placeholder-[#7A6A65] text-sm rounded-xl py-3 px-4 pr-11 transition-all duration-200 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A6A65] hover:text-[#FF8A00] transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-[#A69B96] hover:text-white transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#241815] border-[#3A2420] accent-[#FF6B1A] cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[#A69B96] hover:text-[#FF8A00] transition-colors"
                >
                  Forgot Password ?
                </button>
              </div>

              {/* Sign In CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-[#FF6B1A] to-[#FF8A00] hover:from-[#FF7A24] hover:to-[#FF981A] active:scale-[0.99] transition-all duration-300 shadow-[0_4px_20px_rgba(255,107,26,0.38)] hover:shadow-[0_6px_28px_rgba(255,107,26,0.6)] flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <p className="mt-4 text-xs text-[#A69B96]">
              Don't have an account ?{' '}
              <Link
                to="/register"
                className="text-[#FF6B1A] hover:text-[#FF8A00] font-semibold transition-colors hover:underline"
              >
                Sign Up
              </Link>
            </p>

            {/* Quick Demo Fill Profiles */}
            <div className="mt-5 pt-3.5 border-t border-[#24140F]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] tracking-wider uppercase text-[#85746E] font-semibold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#FF8A00]" /> One-Click Demo Profiles
                </span>
                <span className="text-[10px] text-[#7A6A65]">Click to fill</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    fillCredentials('admin@roadwatch.org', 'AdminPassword123!', 'admin')
                  }
                  className={`py-2 px-2.5 rounded-lg border text-left transition-all duration-200 cursor-pointer ${
                    selectedDemoRole === 'admin'
                      ? 'bg-[#2E120A] border-[#FF6B1A] text-white shadow-[0_0_12px_rgba(255,107,26,0.3)]'
                      : 'bg-[#1C0F0B] border-[#331C16] text-[#A69B96] hover:border-[#522920] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Shield className="w-3 h-3 text-[#FF8A00]" />
                    <span className="text-[11px] font-bold">Admin</span>
                  </div>
                  <p className="text-[9px] text-[#7A6A65]">Oversight</p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    fillCredentials('john.maint@roadwatch.org', 'MaintPassword123!', 'maintenance')
                  }
                  className={`py-2 px-2.5 rounded-lg border text-left transition-all duration-200 cursor-pointer ${
                    selectedDemoRole === 'maintenance'
                      ? 'bg-[#2E120A] border-[#FF6B1A] text-white shadow-[0_0_12px_rgba(255,107,26,0.3)]'
                      : 'bg-[#1C0F0B] border-[#331C16] text-[#A69B96] hover:border-[#522920] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Wrench className="w-3 h-3 text-[#FF8A00]" />
                    <span className="text-[11px] font-bold">Crew</span>
                  </div>
                  <p className="text-[9px] text-[#7A6A65]">Field Work</p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    fillCredentials('alice.citizen@gmail.com', 'CitizenPassword123!', 'citizen')
                  }
                  className={`py-2 px-2.5 rounded-lg border text-left transition-all duration-200 cursor-pointer ${
                    selectedDemoRole === 'citizen'
                      ? 'bg-[#2E120A] border-[#FF6B1A] text-white shadow-[0_0_12px_rgba(255,107,26,0.3)]'
                      : 'bg-[#1C0F0B] border-[#331C16] text-[#A69B96] hover:border-[#522920] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <User className="w-3 h-3 text-[#FF8A00]" />
                    <span className="text-[11px] font-bold">Citizen</span>
                  </div>
                  <p className="text-[9px] text-[#7A6A65]">Reporter</p>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Copyright */}
          <div className="pt-4 text-[11px] text-[#635550]">
            Copyright © 2026 RoadGuard AI. All rights reserved.
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT SECTION: 3D ABSTRACT ORANGE FLUID ART & AI VISION   */}
        {/* ========================================================= */}
        <div className="hidden lg:flex lg:w-[56%] xl:w-[60%] relative bg-[#070302] overflow-hidden items-center justify-center">
          
          {/* Subtle Ambient Radial Lighting Glows */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-gradient-to-tr from-[#E9430A]/20 via-[#FF6B1A]/15 to-transparent rounded-full blur-[110px] pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#FF8A00]/10 rounded-full blur-[90px] pointer-events-none" />

          {/* Subtle Technical Perspective Grid */}
          <div 
            className="absolute inset-0 opacity-[0.035] pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(255, 138, 0, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 138, 0, 0.4) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Master 3D Curved Tubular Ribbon Sculpture (Foodix Re-creation) */}
          <div
            className="relative w-full h-full flex items-center justify-center transition-transform duration-700 ease-out will-change-transform animate-ribbon-float"
            style={{
              transform: prefersReducedMotion
                ? 'none'
                : `translate3d(${parallax.x * 12}px, ${parallax.y * 12}px, 0)`,
            }}
          >
            <svg
              viewBox="0 0 800 800"
              className="w-[125%] h-[125%] max-w-none transform -translate-x-4 translate-y-2 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* 3D Deep Occlusion & Drop Shadow */}
                <filter id="ribbonShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="24" result="blur" />
                  <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.92 0"/>
                  <feOffset dx="16" dy="28" />
                  <feBlend in="SourceGraphic" in2="blur" mode="normal" />
                </filter>

                {/* Soft Edge Glow */}
                <filter id="neonOrangeGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="10" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Gradient: Primary 3D Illuminated Tube */}
                <linearGradient id="orange3DMain" x1="15%" y1="10%" x2="85%" y2="90%">
                  <stop offset="0%" stopColor="#FFA638" />
                  <stop offset="22%" stopColor="#FF6B1A" />
                  <stop offset="55%" stopColor="#D43E06" />
                  <stop offset="82%" stopColor="#801C00" />
                  <stop offset="100%" stopColor="#300800" />
                </linearGradient>

                {/* Gradient: Secondary Intersecting 3D Tube */}
                <linearGradient id="orange3DLoop" x1="80%" y1="10%" x2="20%" y2="90%">
                  <stop offset="0%" stopColor="#FFB347" />
                  <stop offset="30%" stopColor="#FF771C" />
                  <stop offset="65%" stopColor="#C93605" />
                  <stop offset="90%" stopColor="#6E1500" />
                  <stop offset="100%" stopColor="#240500" />
                </linearGradient>

                {/* Gradient: Glossy Specular Core Highlight */}
                <linearGradient id="specularGleam" x1="20%" y1="0%" x2="80%" y2="100%">
                  <stop offset="0%" stopColor="#FFF4E0" stopOpacity="0.8" />
                  <stop offset="30%" stopColor="#FFB870" stopOpacity="0.45" />
                  <stop offset="70%" stopColor="#FF6B1A" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#FF6B1A" stopOpacity="0" />
                </linearGradient>

                {/* Gradient: Ambient Background Rim Light */}
                <linearGradient id="ambientRim" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF8A00" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#9C2000" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* BACK GROUND RIBBON 1: Deep Arching Flow */}
              <path
                d="M 520 -80 C 650 150, 780 400, 720 700 C 680 880, 520 950, 360 850 C 220 760, 150 580, 240 400 C 310 260, 480 180, 540 320"
                fill="none"
                stroke="#1A0600"
                strokeWidth="110"
                strokeLinecap="round"
                filter="url(#ribbonShadow)"
              />
              <path
                d="M 520 -80 C 650 150, 780 400, 720 700 C 680 880, 520 950, 360 850 C 220 760, 150 580, 240 400 C 310 260, 480 180, 540 320"
                fill="none"
                stroke="url(#orange3DLoop)"
                strokeWidth="96"
                strokeLinecap="round"
              />
              <path
                d="M 520 -80 C 650 150, 780 400, 720 700 C 680 880, 520 950, 360 850 C 220 760, 150 580, 240 400 C 310 260, 480 180, 540 320"
                fill="none"
                stroke="url(#specularGleam)"
                strokeWidth="16"
                strokeLinecap="round"
                opacity="0.75"
              />

              {/* PRIMARY CENTRAL 3D S-CURVE RIBBON (Signature Foodix Loop) */}
              <path
                d="M 380 -50 C 280 80, 180 200, 240 360 C 310 540, 580 480, 620 320 C 660 160, 490 60, 340 180 C 180 300, 80 520, 220 720 C 310 840, 490 890, 640 820"
                fill="none"
                stroke="#120400"
                strokeWidth="126"
                strokeLinecap="round"
                filter="url(#ribbonShadow)"
              />
              <path
                d="M 380 -50 C 280 80, 180 200, 240 360 C 310 540, 580 480, 620 320 C 660 160, 490 60, 340 180 C 180 300, 80 520, 220 720 C 310 840, 490 890, 640 820"
                fill="none"
                stroke="url(#orange3DMain)"
                strokeWidth="108"
                strokeLinecap="round"
              />
              {/* Highlight Ridge for 3D Tubular Cylindrical Volume */}
              <path
                d="M 380 -50 C 280 80, 180 200, 240 360 C 310 540, 580 480, 620 320 C 660 160, 490 60, 340 180 C 180 300, 80 520, 220 720 C 310 840, 490 890, 640 820"
                fill="none"
                stroke="url(#specularGleam)"
                strokeWidth="20"
                strokeLinecap="round"
                opacity="0.85"
              />

              {/* FOREGROUND HIGHWAY RIBBON SWEEP (Right Bottom Flow) */}
              <path
                d="M 120 780 C 280 660, 500 620, 680 740 C 760 800, 840 880, 890 960"
                fill="none"
                stroke="#100300"
                strokeWidth="118"
                strokeLinecap="round"
                filter="url(#ribbonShadow)"
              />
              <path
                d="M 120 780 C 280 660, 500 620, 680 740 C 760 800, 840 880, 890 960"
                fill="none"
                stroke="url(#orange3DMain)"
                strokeWidth="98"
                strokeLinecap="round"
              />
              <path
                d="M 120 780 C 280 660, 500 620, 680 740 C 760 800, 840 880, 890 960"
                fill="none"
                stroke="url(#specularGleam)"
                strokeWidth="15"
                strokeLinecap="round"
                opacity="0.7"
              />
            </svg>
          </div>

          {/* ========================================================= */}
          {/* SUBTLE AI COMPUTER VISION DETECTION OVERLAYS              */}
          {/* ========================================================= */}
          
          {/* 1. Subtle Animated AI Scanning Line */}
          <div className="absolute inset-x-8 pointer-events-none animate-ai-scan">
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#FF8A00] to-transparent shadow-[0_0_12px_#FF8A00]" />
          </div>

          {/* 2. Minimalist AI Pothole Detection Bounding Box */}
          <div className="absolute top-28 right-16 pointer-events-none select-none">
            <div className="relative border border-[#FF6B1A]/80 bg-[#140804]/70 backdrop-blur-md px-3.5 py-2.5 rounded-lg shadow-[0_0_20px_rgba(255,107,26,0.25)]">
              {/* Corner AI brackets */}
              <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-[#FF8A00]" />
              <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-[#FF8A00]" />
              <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-[#FF8A00]" />
              <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-[#FF8A00]" />
              
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF6B1A] animate-ping" />
                <span className="text-[10px] font-mono font-bold tracking-wider text-[#FF8A00] uppercase">
                  POTHOLE DETECTED // 98.4%
                </span>
              </div>
              <p className="text-[10px] text-[#A69B96] font-mono mt-1">
                SEC-09 • LAT 30.2672° N
              </p>
            </div>
          </div>

          {/* 3. Subtle Telemetry Corner Readout */}
          <div className="absolute bottom-6 right-8 flex items-center gap-3 text-[10px] font-mono text-[#7A6A65] pointer-events-none">
            <span className="flex items-center gap-1.5">
              <Scan className="w-3.5 h-3.5 text-[#FF6B1A]" />
              <span>YOLOV8-ROADGUARD</span>
            </span>
            <span>•</span>
            <span className="text-[#A69B96]">60 FPS LIVE</span>
          </div>
        </div>

      </div>
    </div>
  );
};
