import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  MapPin,
  Camera,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Layers,
  Activity,
  Zap,
  Navigation,
  Compass,
  Scan,
  Menu,
  X,
  Eye,
  Check,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { analyticsApi } from '../../api/analyticsApi';

export const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalReports: 142,
    verifiedCount: 118,
    pendingCount: 24,
    avgTimeHours: '3.2h',
  });

  useEffect(() => {
    analyticsApi
      .getSummary()
      .then((res) => {
        const overall = res?.data?.overall;
        if (overall) {
          setStats((prev) => ({
            ...prev,
            totalReports: overall.totalReports || prev.totalReports,
            verifiedCount: overall.verifiedCount || prev.verifiedCount,
            pendingCount: overall.openCount || prev.pendingCount,
          }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F6EF] text-[#171717] font-sans selection:bg-[#284D32] selection:text-white flex flex-col">
      
      {/* ========================================================= */}
      {/* 1. MINIMAL HORIZONTAL NAVIGATION BAR                      */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 bg-[#F8F6EF]/90 backdrop-blur-md border-b border-[#E9E6DD] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Left: RoadWatch Brand Identity */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#17351F] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 fill-white/20" />
            </div>
            <span className="text-lg font-black tracking-tight text-[#171717]">
              ROAD<span className="text-[#F97316]">WATCH</span>
            </span>
          </Link>

          {/* Center: Editorial Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-wide text-slate-700">
            <a href="#features" className="hover:text-[#17351F] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#17351F] transition-colors">
              How It Works
            </a>
            <a href="#ai-detection" className="hover:text-[#17351F] transition-colors">
              AI Detection
            </a>
            <a href="#road-map" className="hover:text-[#17351F] transition-colors">
              Road Map
            </a>
            <a href="#stats" className="hover:text-[#17351F] transition-colors">
              Impact
            </a>
          </nav>

          {/* Right: Auth Controls */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="text-xs font-bold text-[#171717] hover:text-[#284D32] px-3.5 py-2 transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="text-xs font-semibold text-white bg-[#17351F] hover:bg-[#284D32] px-5 py-2.5 rounded-full shadow-xs transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-black rounded-lg"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#F8F6EF] border-b border-[#E9E6DD] px-6 py-6 space-y-4 animate-fadeIn">
            <nav className="flex flex-col space-y-3 text-sm font-semibold text-slate-800">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[#17351F]"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[#17351F]"
              >
                How It Works
              </a>
              <a
                href="#ai-detection"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[#17351F]"
              >
                AI Detection
              </a>
              <a
                href="#road-map"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[#17351F]"
              >
                Road Map
              </a>
            </nav>
            <div className="pt-4 border-t border-[#E9E6DD] flex items-center gap-3">
              <Link
                to="/login"
                className="flex-1 text-center py-2.5 text-xs font-bold text-slate-800 border border-slate-300 rounded-full"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="flex-1 text-center py-2.5 text-xs font-bold text-white bg-[#17351F] rounded-full shadow-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* 2. HERO SECTION WITH EDITORIAL SERIF TYPOGRAPHY           */}
      {/* ========================================================= */}
      <section className="relative pt-16 sm:pt-24 pb-32 sm:pb-44 overflow-hidden">
        
        {/* Centered Hero Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-20 space-y-6">
          
          {/* Small Announcement Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#17351F]/5 border border-[#17351F]/15 text-[#17351F] text-xs font-semibold tracking-wider uppercase shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#17351F] animate-pulse" />
            <span>NEW | AI-POWERED ROAD INTELLIGENCE</span>
          </div>

          {/* Main Large Editorial Serif Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif text-[#171717] tracking-tight leading-[1.08] max-w-4xl mx-auto">
            We Build Smarter Roads.{' '}
            <span className="italic font-serif text-[#17351F] block sm:inline">
              Safer Journeys with AI.
            </span>
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            An intelligent road monitoring platform that detects potholes, maps road damage,
            and helps maintenance teams build safer roads through computer vision.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 text-xs sm:text-sm font-semibold text-white bg-[#17351F] hover:bg-[#284D32] rounded-full shadow-lg shadow-[#17351F]/15 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/citizen/nearby"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-xs sm:text-sm font-semibold text-[#171717] bg-white hover:bg-slate-50 border border-[#DCD7CD] rounded-full shadow-xs transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <MapPin className="w-4 h-4 text-[#F97316]" />
              <span>Explore Live Map</span>
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. ROLLING GREEN HILLS & NATURAL SCENIC LANDSCAPE         */}
        {/* ========================================================= */}
        <div className="absolute inset-x-0 bottom-0 h-96 sm:h-[500px] pointer-events-none z-10 overflow-hidden">
          
          {/* Realistic Rolling Green Hills Photography with Natural Atmosphere */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=2000&auto=format&fit=crop&q=85"
              alt="Rolling Green Hills Landscape"
              className="w-full h-full object-cover object-bottom"
            />
            
            {/* Top Atmospheric Gradient fading smoothly from warm cream (#F8F6EF) into landscape */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#F8F6EF] via-[#F8F6EF]/70 to-transparent" />
            
            {/* Soft Sunrise Ambient Glow in the Sky Center */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[760px] h-[320px] bg-gradient-to-b from-[#FFF5E0]/60 via-[#FCE3B8]/30 to-transparent rounded-full blur-3xl" />
            
            {/* Deep Green Foreground Gradient behind the Floating Dashboard */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#122A19]/80 via-[#17351F]/40 to-transparent" />
          </div>

          {/* Organic Scenic Silhouette Edge for seamless depth */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#F8F6EF] to-transparent z-10" />
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. FLOATING PRODUCT DASHBOARD SHOWCASE                    */}
      {/* ========================================================= */}
      <section className="relative z-30 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 sm:-mt-32">
        <div className="rounded-[28px] sm:rounded-[36px] p-2.5 sm:p-3 bg-white/40 backdrop-blur-md border border-white/80 shadow-[0_30px_90px_rgba(23,53,31,0.22)]">
          
          {/* Main Dashboard Window Frame */}
          <div className="bg-white rounded-[22px] sm:rounded-[30px] border border-slate-200/90 overflow-hidden shadow-xs">
            
            {/* Window Topbar */}
            <div className="px-5 py-3.5 bg-[#FAF8F5] border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-400" />
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <span className="text-[11px] font-mono text-slate-400 hidden sm:inline ml-2">
                  roadwatch.app/admin/dashboard
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE DISPATCH ENGINE
                </span>
                <span className="text-xs font-semibold text-slate-500 hidden md:inline">
                  YOLOv8 Active
                </span>
              </div>
            </div>

            {/* Dashboard Inner Canvas */}
            <div className="p-5 sm:p-8 bg-[#FAF8F5]/60 space-y-6">
              
              {/* Dashboard Metric Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>Potholes Detected</span>
                    <Scan className="w-4 h-4 text-[#F97316]" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                    {stats.totalReports}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                    ↑ 14% this month
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>Repairs Verified</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">
                    {stats.verifiedCount}
                  </p>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1">
                    100% QA inspected
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>Active Queue</span>
                    <Activity className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2">
                    {stats.pendingCount}
                  </p>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1">
                    Field crews in transit
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>Avg Resolution</span>
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#17351F] mt-2">
                    {stats.avgTimeHours}
                  </p>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1">
                    Turnaround time
                  </p>
                </div>
              </div>

              {/* Dashboard Dual Panel: AI Camera Feed + GIS Radar Map */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Left Panel: Real-Time AI Camera Detection */}
                <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-[#F97316]" />
                      <span className="text-xs font-bold text-slate-900">
                        Autonomous Computer Vision Scanner
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      98.4% CONFIDENCE
                    </span>
                  </div>

                  {/* Road Camera Frame with Simulated YOLO Bounding Box */}
                  <div className="relative h-60 sm:h-72 w-full rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=900&auto=format&fit=crop"
                      alt="AI Detection Camera"
                      className="w-full h-full object-cover opacity-85"
                    />

                    {/* AI Scanning Line Animation */}
                    <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#F97316] to-transparent shadow-[0_0_15px_#F97316] animate-ai-scan pointer-events-none" />

                    {/* YOLO Bounding Box Overlay */}
                    <div className="absolute top-1/3 left-1/3 w-44 h-32 border-2 border-[#F97316] bg-[#F97316]/10 rounded-lg backdrop-blur-2xs pointer-events-none animate-pulse">
                      <span className="absolute -top-3 left-0 bg-[#F97316] text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm shadow-xs">
                        POTHOLE // 98.4%
                      </span>
                      <span className="absolute -bottom-3 right-0 bg-black/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-sm">
                        SEVERITY: CRITICAL
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-xs px-3 py-1.5 rounded-lg text-white font-mono text-[10px] space-y-0.5">
                      <p>LAT: 30.2672° N • LON: 97.7431° W</p>
                      <p className="text-emerald-400">STATUS: AGGREGATED TO CORRIDOR NORTH</p>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Interactive GIS Overview Card */}
                <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#0A84FF]" />
                        <span className="text-xs font-bold text-slate-900">
                          GIS Live Radar Overview
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Sector 04 Grid
                      </span>
                    </div>

                    {/* Stylized Road Network Preview */}
                    <div className="mt-3 relative h-48 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <img
                        src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&auto=format&fit=crop"
                        alt="Map Network"
                        className="w-full h-full object-cover opacity-60"
                      />

                      {/* Floating Road Incident Markers */}
                      <div className="absolute top-10 left-16 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full shadow-md border border-slate-200 text-[10px] font-bold text-slate-800">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span>Pothole #42</span>
                      </div>

                      <div className="absolute bottom-12 right-12 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full shadow-md border border-slate-200 text-[10px] font-bold text-slate-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Fixed #18</span>
                      </div>

                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0A84FF] text-white p-2 rounded-full shadow-lg shadow-blue-500/40">
                        <Navigation className="w-4 h-4 fill-white" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Corridor Dispatch</p>
                      <p className="text-[11px] text-slate-400">Crew deployed 4.2 km away</p>
                    </div>
                    <Link
                      to="/citizen/nearby"
                      className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-[#17351F] transition-colors"
                    >
                      View Map →
                    </Link>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. IMPACT & STATISTICS SECTION                            */}
      {/* ========================================================= */}
      <section id="stats" className="py-24 sm:py-32 bg-[#F8F6EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif text-[#171717] tracking-tight">
              Measurable Impact on Every Mile
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Live statistics collected autonomously by RoadWatch AI and citizen reporters.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-8 rounded-2xl bg-white border border-[#E5E1D6] shadow-xs space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Reports
              </span>
              <p className="text-4xl sm:text-5xl font-serif font-bold text-[#171717]">
                {stats.totalReports}+
              </p>
              <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                Potholes & road damage detected citywide.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-[#E5E1D6] shadow-xs space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Repairs Verified
              </span>
              <p className="text-4xl sm:text-5xl font-serif font-bold text-[#17351F]">
                {stats.verifiedCount}+
              </p>
              <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                Repairs verified with before/after photos.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-[#E5E1D6] shadow-xs space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Queue
              </span>
              <p className="text-4xl sm:text-5xl font-serif font-bold text-[#F97316]">
                {stats.pendingCount}
              </p>
              <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                Assigned work orders currently in field.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-[#E5E1D6] shadow-xs space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Avg Resolution Time
              </span>
              <p className="text-4xl sm:text-5xl font-serif font-bold text-[#171717]">
                {stats.avgTimeHours}
              </p>
              <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                Rapid turnaround from report to patch.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. HOW ROADWATCH WORKS (4 STEPS)                          */}
      {/* ========================================================= */}
      <section id="how-it-works" className="py-24 sm:py-32 bg-[#FAF8F5] border-y border-[#E9E6DD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#17351F] bg-[#17351F]/5 px-3 py-1 rounded-full">
              Streamlined Process
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#171717] tracking-tight">
              How RoadWatch Operates
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              From the initial citizen snap to the verified hot-mix asphalt roll.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5E1D6] shadow-xs space-y-4 relative group hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 rounded-xl bg-[#F8F6EF] text-[#17351F] font-serif font-bold text-lg flex items-center justify-center border border-[#E5E1D6]">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Report a Pothole
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Citizens snap a photo and pin the GPS location in seconds. Zero friction,
                instant submission.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5E1D6] shadow-xs space-y-4 relative group hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 rounded-xl bg-[#F8F6EF] text-[#17351F] font-serif font-bold text-lg flex items-center justify-center border border-[#E5E1D6]">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900">
                AI Detection & YOLO
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Computer vision models classify severity, pothole diameter, and depth with
                over 98% accuracy.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5E1D6] shadow-xs space-y-4 relative group hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 rounded-xl bg-[#F8F6EF] text-[#17351F] font-serif font-bold text-lg flex items-center justify-center border border-[#E5E1D6]">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Location & Verification
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated geospatial deduplication clusters duplicate submissions and alerts
                the nearest maintenance crew.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5E1D6] shadow-xs space-y-4 relative group hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 rounded-xl bg-[#F8F6EF] text-[#17351F] font-serif font-bold text-lg flex items-center justify-center border border-[#E5E1D6]">
                04
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Maintenance & Proof
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Crews repair the road and submit before/after photo evidence for administrator
                and citizen verification.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. AI DETECTION SHOWCASE                                  */}
      {/* ========================================================= */}
      <section id="ai-detection" className="py-24 sm:py-32 bg-[#F8F6EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#F97316] bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                Computer Vision Model
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif text-[#171717] tracking-tight leading-tight">
                Intelligence That Sees Every Road.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Our YOLO deep learning model is trained on multi-national road damage datasets
                covering over 20,000 km of diverse asphalt conditions, categorizing four distinct
                hazard types in under 20 milliseconds.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#E5E1D6]">
                  <CheckCircle2 className="w-5 h-5 text-[#17351F]" />
                  <span className="text-xs font-bold text-slate-800">
                    Real-time inference at 60 FPS on mobile & field cameras
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#E5E1D6]">
                  <CheckCircle2 className="w-5 h-5 text-[#17351F]" />
                  <span className="text-xs font-bold text-slate-800">
                    Categorizes Potholes, Alligator Cracks, Transverse & Longitudinal Wear
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#E5E1D6]">
                  <CheckCircle2 className="w-5 h-5 text-[#17351F]" />
                  <span className="text-xs font-bold text-slate-800">
                    Confidence-scored triage eliminating false positives
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/citizen/report"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#17351F] hover:text-[#284D32] group"
                >
                  <span>Test AI Pothole Detection with your photo</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Right Visual Image with YOLO Bounding Boxes */}
            <div className="lg:col-span-7 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-950">
                <img
                  src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1100&auto=format&fit=crop"
                  alt="Road Damage Detection"
                  className="w-full h-[420px] object-cover opacity-85"
                />

                {/* Primary Bounding Box */}
                <div className="absolute top-28 left-24 w-52 h-40 border-2 border-[#F97316] bg-[#F97316]/10 rounded-lg">
                  <span className="absolute -top-3 left-0 bg-[#F97316] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-sm">
                    POTHOLE // 98.7% CONFIDENCE
                  </span>
                  <span className="absolute -bottom-3 right-0 bg-black/80 text-white text-[10px] font-mono px-2 py-0.5 rounded">
                    SEVERITY: CRITICAL
                  </span>
                </div>

                {/* Secondary Bounding Box */}
                <div className="absolute bottom-16 right-20 w-44 h-24 border-2 border-emerald-400 bg-emerald-400/10 rounded-lg">
                  <span className="absolute -top-3 left-0 bg-emerald-500 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-sm">
                    ASPHALT CRACK // 94.2%
                  </span>
                </div>

                {/* Bottom Model Telemetry */}
                <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 flex items-center justify-between text-white text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>YOLOv8 ENGINE ACTIVE</span>
                  </div>
                  <span>INFERENCE: 18ms</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. LIVE ROAD MONITORING SECTION                           */}
      {/* ========================================================= */}
      <section id="road-map" className="py-24 sm:py-32 bg-[#FAF8F5] border-t border-[#E9E6DD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          
          <div className="max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0A84FF] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Interactive GIS Platform
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#171717] tracking-tight">
              Every Road. Every Report. One Intelligent Map.
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Explore municipal sectors, view live pothole markers, and track repair crews
              with turn-by-turn precision.
            </p>
          </div>

          {/* Interactive Map Visual Card */}
          <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-white p-3">
            <div className="relative h-96 sm:h-[460px] rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&auto=format&fit=crop"
                alt="Live Road Monitoring Map"
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-3xs" />

              {/* Centered CTA Card */}
              <div className="relative z-10 bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xl max-w-md text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0A84FF] flex items-center justify-center mx-auto">
                  <Navigation className="w-6 h-6 fill-[#0A84FF]/20" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Real-Time GIS Satellite Dispatch
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  OpenStreetMap vector layers, browser GPS auto-follow, and color-coded pothole severity indicators.
                </p>
                <Link
                  to="/citizen/nearby"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-white bg-[#17351F] hover:bg-[#284D32] shadow-md transition-all"
                >
                  <MapPin className="w-4 h-4 text-[#F97316]" />
                  <span>Launch Live Radar Map</span>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 9. PREMIUM FOOTER                                         */}
      {/* ========================================================= */}
      <footer className="bg-[#17351F] text-slate-300 py-16 border-t border-[#1E3F27]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Brand Info */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white text-[#17351F] flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4 fill-[#17351F]/30" />
                </div>
                <span className="text-lg font-black tracking-tight text-white">
                  ROAD<span className="text-[#F97316]">WATCH</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
                AI-powered road monitoring and pothole detection platform designed to accelerate
                municipal maintenance and ensure safer journeys for every citizen.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                Platform
              </p>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/citizen/report" className="hover:text-white transition-colors">
                    Report a Pothole
                  </Link>
                </li>
                <li>
                  <Link to="/citizen/nearby" className="hover:text-white transition-colors">
                    Live Road Map
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Sign In to Portal
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors">
                    Citizen Registration
                  </Link>
                </li>
              </ul>
            </div>

            {/* Dispatch & Operations */}
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                Operations
              </p>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/admin/dashboard" className="hover:text-white transition-colors">
                    Admin Command Center
                  </Link>
                </li>
                <li>
                  <Link to="/maintenance/tasks" className="hover:text-white transition-colors">
                    Field Crew Work Orders
                  </Link>
                </li>
                <li>
                  <Link to="/admin/map" className="hover:text-white transition-colors">
                    GIS Radar Map
                  </Link>
                </li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <p>© 2026 RoadWatch AI. Built with MERN Stack & YOLO Object Detection.</p>
            <div className="flex items-center gap-4">
              <Link to="/login" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link to="/login" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};
