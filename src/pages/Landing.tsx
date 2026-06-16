import { useRef, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/model/useAuth";
import { LogoMark } from "@/shared/ui/Logo";
import {
  Trophy, BarChart2, ClipboardList, ArrowRight, Shield, Users,
  TrendingUp, Repeat2, LayoutDashboard, Star, Check, Zap, Infinity,
} from "lucide-react";

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, visible] as const;
}

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf: number;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return value;
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      setProgress(el.scrollHeight > el.clientHeight ? el.scrollTop / (el.scrollHeight - el.clientHeight) : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return progress;
}

// ─── TiltCard ────────────────────────────────────────────────────────────────

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg) translateY(-6px)`;
  }, []);

  const onLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = "";
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transition: "transform 250ms cubic-bezier(0.23,1,0.32,1)", transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}

// ─── Reveal wrapper ──────────────────────────────────────────────────────────

function Reveal({
  children,
  delay = 0,
  from = "bottom",
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  from?: "bottom" | "left" | "right";
  className?: string;
}) {
  const [ref, visible] = useInView();
  const translateMap = { bottom: "translateY(28px)", left: "translateX(-28px)", right: "translateX(28px)" };
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : translateMap[from],
        transition: `opacity 600ms cubic-bezier(0.23,1,0.32,1) ${delay}ms, transform 600ms cubic-bezier(0.23,1,0.32,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Static data ─────────────────────────────────────────────────────────────

const features = [
  { icon: ClipboardList, title: "Track your career", desc: "Follow every season, managed club and Career Mode achievement over the years." },
  { icon: BarChart2, title: "Complete statistics", desc: "Goals, assists, appearances and cards documented per player and consolidated per season." },
  { icon: Trophy, title: "Trophy room", desc: "Save every title won, with club and season recorded in your personal gallery." },
];

const steps = [
  { num: "01", title: "Create a Save", desc: "Name your career, choose your club and set the initial budget." },
  { num: "02", title: "Build the squad", desc: "Add players with position, overall, salary and market value." },
  { num: "03", title: "Track the season", desc: "Update player and club statistics throughout the matches." },
  { num: "04", title: "Advance and conquer", desc: "Finish seasons, record transfers and accumulate titles." },
];

const hubFeatures = [
  { icon: Users, label: "Full squad", desc: "Every player, every position, every contract in one place." },
  { icon: Repeat2, label: "Transfers", desc: "Ins, outs, fees and destinations documented by window." },
  { icon: TrendingUp, label: "Season growth", desc: "See how your club and players have grown over time." },
  { icon: LayoutDashboard, label: "Central dashboard", desc: "Overview of the active save with the most important data." },
  { icon: Star, label: "Multiple saves", desc: "Manage multiple simultaneous careers without mixing data." },
  { icon: Shield, label: "Secure session", desc: "Your saves are in the cloud, accessible on any device." },
];

const marqueeItems = [
  "Squad", "Seasons", "Trophies", "Transfers", "Stats",
  "Saves", "Clubs", "OVR", "Budget", "History", "Lineup", "Dashboard",
];

// ─── Navbar ──────────────────────────────────────────────────────────────────

function Navbar({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className="landing-navbar fixed left-0 right-0 top-0 z-50 transition-all duration-300"
      style={{
        borderBottom: scrolled ? "1px solid hsl(220 14% 18% / 0.8)" : "1px solid transparent",
        background: scrolled ? "hsl(220 20% 7% / 0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <LogoMark size={32} />
          <span className="font-display text-lg font-bold tracking-tight">FC Career Hub</span>
        </div>

        <nav className="flex items-center gap-1">
          {isAuthenticated ? (
            <Link to="/app" className="landing-btn-primary ml-2 flex items-center gap-2 rounded-xl bg-primary px-5 py-2 font-display text-sm font-bold text-primary-foreground">
              Go to Hub <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="rounded-xl px-4 py-2 font-display text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
                Sign in
              </Link>
              <Link to="/register" className="landing-btn-primary flex items-center gap-2 rounded-xl bg-primary px-5 py-2 font-display text-sm font-bold text-primary-foreground">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

// ─── Hero Mockup — Top Scorers ───────────────────────────────────────────────

const topScorers = [
  {
    rank: 1,
    name: "Vinicius Jr.",
    pos: "EA",
    goals: 184,
    matches: 231,
    clubs: ["Real Madrid", "Al-Hilal"],
    seasons: 6,
  },
  {
    rank: 2,
    name: "Mbappé",
    pos: "PD",
    goals: 156,
    matches: 198,
    clubs: ["Real Madrid"],
    seasons: 5,
  },
  {
    rank: 3,
    name: "Bellingham",
    pos: "MC",
    goals: 97,
    matches: 244,
    clubs: ["Real Madrid", "Man City"],
    seasons: 7,
  },
  {
    rank: 4,
    name: "Salah",
    pos: "PD",
    goals: 74,
    matches: 112,
    clubs: ["Liverpool"],
    seasons: 3,
  },
];

const rankColors = ["text-gold", "text-muted-foreground", "text-warning/70", "text-muted-foreground/50"];
const rankBg = ["bg-gold/10", "bg-muted/20", "bg-warning/8", "bg-muted/10"];

function HeroDashboardMockup() {
  return (
    <div className="landing-mockup relative mx-auto w-full max-w-sm" style={{ animation: "mockup-float 4s ease-in-out infinite" }}>
      {/* Outer glow layers */}
      <div className="absolute -inset-8 rounded-3xl bg-primary/5 blur-3xl" />
      <div className="absolute -inset-2 rounded-2xl bg-primary/4 blur-xl" />

      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
        {/* Scan line */}
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-2xl">
          <div style={{ animation: "scan-line 4s linear infinite" }} className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 bg-card/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-destructive opacity-70" />
            <div className="h-2 w-2 rounded-full bg-warning opacity-70" />
            <div className="h-2 w-2 rounded-full bg-primary opacity-70" style={{ animation: "pulse-glow 2s ease-in-out infinite" }} />
          </div>
          <div className="flex items-center gap-1.5">
            <BarChart2 size={10} className="text-primary" />
            <span className="font-display text-xs font-semibold text-muted-foreground">Top Scorers · Full career</span>
          </div>
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
            <Shield size={10} className="text-primary" />
          </div>
        </div>

        {/* Column labels */}
        <div className="grid grid-cols-[1.5rem_1fr_2.5rem_2.5rem] items-center gap-x-2 border-b border-border/30 bg-background/30 px-4 py-2">
          <span className="font-body text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50">#</span>
          <span className="font-body text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50">Player</span>
          <span className="text-center font-body text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50">Goals</span>
          <span className="text-center font-body text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50">MP</span>
        </div>

        {/* Scorer rows */}
        <div className="space-y-0.5 p-2">
          {topScorers.map((p, i) => (
            <div
              key={p.name}
              className="group grid grid-cols-[1.5rem_1fr_2.5rem_2.5rem] items-center gap-x-2 rounded-xl px-2 py-2.5 transition-colors hover:bg-background/50"
              style={{
                animation: `mockup-row-in 350ms cubic-bezier(0.23,1,0.32,1) ${i * 80 + 200}ms both`,
              }}
            >
              {/* Rank */}
              <div className={`flex h-5 w-5 items-center justify-center rounded-md font-display text-[10px] font-bold ${rankBg[i]} ${rankColors[i]}`}>
                {p.rank}
              </div>

              {/* Player info */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-sm font-bold leading-none truncate">{p.name}</span>
                  <span className="shrink-0 rounded px-1 py-0.5 font-display text-[9px] font-bold leading-none text-muted-foreground/60 bg-muted/30">{p.pos}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-1 overflow-hidden">
                  {p.clubs.map((club, ci) => (
                    <span key={club} className="flex items-center gap-1">
                      {ci > 0 && <span className="text-muted-foreground/30 text-[8px]">→</span>}
                      <span className="font-body text-[10px] leading-none text-muted-foreground/60 truncate">{club}</span>
                    </span>
                  ))}
                  <span className="ml-1 shrink-0 font-body text-[10px] leading-none text-muted-foreground/40">· {p.seasons}S</span>
                </div>
              </div>

              {/* Goals */}
              <div className="text-center">
                <span className="font-display text-sm font-bold text-primary">{p.goals}</span>
              </div>

              {/* Matches */}
              <div className="text-center">
                <span className="font-display text-xs font-semibold text-muted-foreground">{p.matches}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer summary */}
        <div className="flex items-center justify-between border-t border-border/40 bg-background/30 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <Trophy size={11} className="text-gold" />
            <span className="font-display text-[10px] font-semibold text-muted-foreground/70">7 seasons · 3 clubs</span>
          </div>
          <span className="font-body text-[10px] text-muted-foreground/40">+18 players</span>
        </div>
      </div>
    </div>
  );
}

// ─── Stats strip ─────────────────────────────────────────────────────────────

function StatItem({ target, suffix, label, active }: { target: number; suffix: string; label: string; active: boolean }) {
  const val = useCountUp(target, active, 1600);
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-display text-4xl font-bold leading-none text-foreground">
        {val.toLocaleString("en-US")}<span className="text-primary">{suffix}</span>
      </span>
      <span className="font-body text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

function StatsStrip() {
  const [ref, visible] = useInView(0.4);
  return (
    <div ref={ref} className="py-16">
      <div className="mx-auto max-w-4xl px-6">
        <div
          className="grid grid-cols-1 gap-10 rounded-3xl border border-border/50 bg-card/30 px-8 py-10 backdrop-blur-sm sm:grid-cols-3"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : "translateY(20px)",
            transition: "opacity 700ms cubic-bezier(0.23,1,0.32,1), transform 700ms cubic-bezier(0.23,1,0.32,1)",
          }}
        >
          <StatItem target={1200} suffix="+" label="Saves created" active={visible} />
          <div className="hidden h-full w-px bg-border/50 sm:block" />
          <StatItem target={40} suffix="+" label="Average seasons" active={visible} />
          <div className="hidden h-full w-px bg-border/50 sm:block" />
          <StatItem target={100} suffix="%" label="Free to start" active={visible} />
        </div>
      </div>
    </div>
  );
}

// ─── Marquee ─────────────────────────────────────────────────────────────────

function Marquee() {
  const items = [...marqueeItems, ...marqueeItems];
  return (
    <div className="relative overflow-hidden py-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
      <div className="flex" style={{ animation: "marquee 28s linear infinite" }}>
        {items.map((item, i) => (
          <span key={i} className="mx-4 shrink-0 rounded-full border border-border/50 bg-card/30 px-4 py-1.5 font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const scrollProgress = useScrollProgress();

  const [stepsRef, stepsVisible] = useInView(0.2);
  const [hubRef, hubVisible] = useInView(0.1);
  const [pricingRef, pricingVisible] = useInView(0.1);
  const [ctaRef, ctaVisible] = useInView(0.3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Scroll progress bar */}
      <div
        className="fixed top-0 left-0 z-[60] h-[2px] bg-primary transition-none"
        style={{ width: `${scrollProgress * 100}%`, boxShadow: "0 0 8px hsl(142 70% 49% / 0.8)" }}
      />

      <Navbar isAuthenticated={isAuthenticated} />

      {/* ── HERO ── */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
        {/* Floating orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[10%] top-[20%] h-64 w-64 rounded-full bg-primary/6 blur-3xl" style={{ animation: "orb-drift-1 12s ease-in-out infinite" }} />
          <div className="absolute right-[5%] top-[10%] h-80 w-80 rounded-full bg-accent/5 blur-3xl" style={{ animation: "orb-drift-2 15s ease-in-out infinite" }} />
          <div className="absolute bottom-[15%] left-[40%] h-48 w-48 rounded-full bg-primary/4 blur-3xl" style={{ animation: "orb-drift-3 10s ease-in-out infinite" }} />
          <div className="absolute right-[20%] top-[50%] h-32 w-32 rounded-full bg-accent/6 blur-2xl" style={{ animation: "orb-drift-1 8s ease-in-out infinite reverse" }} />
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.028]"
            style={{ backgroundImage: "linear-gradient(hsl(142 70% 49%) 1px, transparent 1px), linear-gradient(90deg, hsl(142 70% 49%) 1px, transparent 1px)", backgroundSize: "60px 60px" }}
          />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-6 py-20">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left: Copy */}
            <div className="landing-hero-text space-y-8">
              <div
                className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 font-display text-xs font-bold uppercase tracking-widest text-primary"
                style={{ animation: "shimmer 3s ease-in-out infinite" }}
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                FC Career Hub
              </div>

              <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Your career.
                <br />
                <span className="text-glow-primary text-primary" style={{ animation: "text-glow-pulse 3s ease-in-out infinite" }}>Your legacy.</span>
              </h1>

              <p className="max-w-lg font-body text-lg leading-relaxed text-muted-foreground">
                Organise every Career Mode save: club, squad, seasons, transfers and titles — all in one hub just for you.
              </p>

              <div className="flex flex-wrap gap-3">
                {isAuthenticated ? (
                  <Link to="/app" className="landing-btn-primary group flex items-center gap-2 rounded-2xl bg-primary px-7 py-3.5 font-display text-base font-bold text-primary-foreground">
                    Go to Hub <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="landing-btn-primary group flex items-center gap-2 rounded-2xl bg-primary px-7 py-3.5 font-display text-base font-bold text-primary-foreground">
                      Create free account <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                    <Link to="/login" className="landing-btn-secondary flex items-center gap-2 rounded-2xl border border-border px-7 py-3.5 font-display text-base font-semibold text-foreground/80 transition-colors hover:border-primary/40 hover:text-foreground">
                      Already have an account
                    </Link>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2">
                {["Free to start", "No installation", "Cloud data"].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <span className="font-body text-xs text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Mockup */}
            <div className="landing-hero-mockup hidden lg:block">
              <HeroDashboardMockup />
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2" style={{ animation: "bounce-hint 2s ease-in-out infinite" }}>
          <div className="flex h-9 w-5 items-start justify-center rounded-full border-2 border-border/50 pt-1.5">
            <div className="h-1.5 w-1 rounded-full bg-primary/60" style={{ animation: "scroll-dot 2s ease-in-out infinite" }} />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <StatsStrip />

      {/* ── MARQUEE ── */}
      <Marquee />

      {/* ── FEATURES ── */}
      <section className="relative py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_hsl(220_18%_10%_/_0.8),_transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <Reveal className="mb-16 text-center">
            <p className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">What you get</p>
            <h2 className="font-display text-4xl font-bold sm:text-5xl">Why use FC Career Hub?</h2>
            <p className="mx-auto mt-4 max-w-xl font-body text-base text-muted-foreground">
              Built for those who take Career Mode seriously. Nothing gets lost, everything is recorded.
            </p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 100}>
                <TiltCard className="landing-feature-card group relative h-full overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-7 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_20px_40px_rgba(34,197,94,0.1)]">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_hsl(142_70%_49%_/_0.06),_transparent_50%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  {/* Corner glow on hover */}
                  <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-primary/0 blur-xl transition-all duration-500 group-hover:bg-primary/15" />
                  <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10 transition-all duration-300 group-hover:bg-primary/15 group-hover:ring-primary/25">
                    <Icon size={26} />
                  </div>
                  <h3 className="relative mb-3 font-display text-xl font-bold">{title}</h3>
                  <p className="relative font-body text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mb-16 text-center">
            <p className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-accent">Simple as that</p>
            <h2 className="font-display text-4xl font-bold sm:text-5xl">How it works</h2>
          </Reveal>

          <div ref={stepsRef} className="relative grid gap-12 md:grid-cols-4 md:gap-6">
            {/* Animated connector line */}
            <div className="pointer-events-none absolute left-[15%] right-[15%] top-7 hidden overflow-hidden md:block">
              <div className="h-px bg-border/40 w-full" />
              <div
                className="absolute inset-0 h-px bg-gradient-to-r from-primary/60 to-accent/60"
                style={{
                  clipPath: stepsVisible ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
                  transition: "clip-path 1200ms cubic-bezier(0.23,1,0.32,1) 200ms",
                }}
              />
            </div>

            {steps.map((step, i) => (
              <div
                key={step.num}
                className="relative flex flex-col items-center text-center"
                style={{
                  opacity: stepsVisible ? 1 : 0,
                  transform: stepsVisible ? "none" : "translateY(24px)",
                  transition: `opacity 500ms cubic-bezier(0.23,1,0.32,1) ${200 + i * 120}ms, transform 500ms cubic-bezier(0.23,1,0.32,1) ${200 + i * 120}ms`,
                }}
              >
                <div
                  className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/60 bg-card font-display text-xl font-bold text-primary"
                  style={{
                    boxShadow: stepsVisible ? "0 0 24px hsl(142 70% 49% / 0.35)" : "none",
                    transition: `box-shadow 400ms ease-out ${400 + i * 120}ms`,
                    animation: stepsVisible ? `pulse-glow 3s ease-in-out ${i * 600}ms infinite` : "none",
                  }}
                >
                  {step.num}
                  <div className="absolute inset-0 rounded-full bg-primary/5" />
                </div>
                <h4 className="mb-2 font-display text-lg font-bold">{step.title}</h4>
                <p className="max-w-[18ch] font-body text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HUB FEATURES GRID ── */}
      <section className="py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mb-16 text-center">
            <p className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">Everything included</p>
            <h2 className="font-display text-4xl font-bold sm:text-5xl">A complete hub</h2>
            <p className="mx-auto mt-4 max-w-xl font-body text-base text-muted-foreground">
              Every area of your Career Mode has a dedicated section within the hub.
            </p>
          </Reveal>

          <div ref={hubRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hubFeatures.map(({ icon: Icon, label, desc }, i) => {
              const fromDir = i % 3 === 0 ? "translateX(-20px)" : i % 3 === 2 ? "translateX(20px)" : "translateY(20px)";
              return (
                <div
                  key={label}
                  className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-card/40 p-5 transition-all duration-200 hover:border-primary/30 hover:bg-card/70 hover:shadow-[0_8px_24px_rgba(34,197,94,0.06)]"
                  style={{
                    opacity: hubVisible ? 1 : 0,
                    transform: hubVisible ? "none" : fromDir,
                    transition: `opacity 500ms cubic-bezier(0.23,1,0.32,1) ${i * 70}ms, transform 500ms cubic-bezier(0.23,1,0.32,1) ${i * 70}ms`,
                  }}
                >
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:ring-primary/30 group-hover:scale-110">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 className="mb-1 font-display text-base font-bold">{label}</h4>
                    <p className="font-body text-sm leading-relaxed text-muted-foreground">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRICING PREVIEW ── */}
      <section className="py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mb-14 text-center">
            <p className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">Plans</p>
            <h2 className="font-display text-4xl font-bold sm:text-5xl">Start free, upgrade later.</h2>
            <p className="mx-auto mt-4 max-w-lg font-body text-base text-muted-foreground">
              Everything you need to track your career is in the free plan. When you want more, just upgrade.
            </p>
          </Reveal>

          <div ref={pricingRef} className="grid gap-5 lg:grid-cols-3">
            {/* FREE */}
            <div
              className="flex flex-col rounded-2xl border border-border/60 bg-card/40 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-border"
              style={{
                opacity: pricingVisible ? 1 : 0,
                transform: pricingVisible ? "none" : "translateY(32px)",
                transition: "opacity 550ms cubic-bezier(0.23,1,0.32,1) 0ms, transform 550ms cubic-bezier(0.23,1,0.32,1) 0ms",
              }}
            >
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/40"><Zap size={15} className="text-muted-foreground" /></div>
                <span className="font-display text-lg font-bold">Free</span>
              </div>
              <div className="mb-5 border-b border-border/50 pb-5">
                <span className="font-display text-3xl font-bold">Free</span>
                <span className="ml-1.5 font-body text-xs text-muted-foreground">forever</span>
              </div>
              <ul className="mb-6 flex-1 space-y-2.5">
                {["1 simultaneous save", "Full squad management", "Season statistics", "Trophy history"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check size={13} className="shrink-0 text-primary" />
                    <span className="font-body text-sm text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="landing-btn-secondary flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 font-display text-sm font-semibold text-foreground/80 transition-colors hover:border-primary/40">
                Get started free
              </Link>
            </div>

            {/* PRO */}
            <div
              className="relative flex flex-col rounded-2xl border border-primary/50 bg-card/50 p-7 ring-1 ring-primary/20 transition-all duration-300 hover:-translate-y-2"
              style={{
                boxShadow: pricingVisible ? "0 0 50px hsl(142 70% 49% / 0.15)" : "none",
                opacity: pricingVisible ? 1 : 0,
                transform: pricingVisible ? "none" : "translateY(32px)",
                transition: "opacity 550ms cubic-bezier(0.23,1,0.32,1) 100ms, transform 550ms cubic-bezier(0.23,1,0.32,1) 100ms, box-shadow 800ms ease-out 600ms",
              }}
            >
              <div className="pointer-events-none absolute -inset-px rounded-2xl" style={{ background: "linear-gradient(135deg, hsl(142 70% 49% / 0.06) 0%, transparent 50%)" }} />
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10"><Star size={15} className="text-primary" /></div>
                  <span className="font-display text-lg font-bold">Pro</span>
                </div>
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-display text-xs font-bold text-primary" style={{ animation: "pulse-glow 2.5s ease-in-out infinite" }}>Most popular</span>
              </div>
              <div className="mb-5 border-b border-border/50 pb-5">
                <span className="font-display text-3xl font-bold">R$ 9</span>
                <span className="ml-1.5 font-body text-xs text-muted-foreground">per month</span>
              </div>
              <ul className="mb-6 flex-1 space-y-2.5">
                {["3 simultaneous saves", "Full squad management", "Season statistics", "Trophy history", "Unlimited transfers"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check size={13} className="shrink-0 text-primary" />
                    <span className="font-body text-sm text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="landing-btn-primary flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-sm font-bold text-primary-foreground">
                Subscribe Pro
              </Link>
            </div>

            {/* PREMIUM */}
            <div
              className="flex flex-col rounded-2xl border border-accent/40 bg-card/40 p-7 transition-all duration-300 hover:-translate-y-1"
              style={{
                boxShadow: pricingVisible ? "0 0 35px hsl(195 90% 50% / 0.07)" : "none",
                opacity: pricingVisible ? 1 : 0,
                transform: pricingVisible ? "none" : "translateY(32px)",
                transition: "opacity 550ms cubic-bezier(0.23,1,0.32,1) 200ms, transform 550ms cubic-bezier(0.23,1,0.32,1) 200ms, box-shadow 800ms ease-out 600ms",
              }}
            >
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10"><Infinity size={15} className="text-accent" /></div>
                <span className="font-display text-lg font-bold">Premium</span>
              </div>
              <div className="mb-5 border-b border-border/50 pb-5">
                <span className="font-display text-3xl font-bold">R$ 19</span>
                <span className="ml-1.5 font-body text-xs text-muted-foreground">per month</span>
              </div>
              <ul className="mb-6 flex-1 space-y-2.5">
                {["Unlimited saves", "All Pro features", "Data export", "Priority support", "Future features"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check size={13} className="shrink-0 text-accent" />
                    <span className="font-body text-sm text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="landing-btn-primary flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-display text-sm font-bold text-accent-foreground">
                Subscribe Premium
              </Link>
            </div>
          </div>

          <Reveal delay={300} className="mt-8 text-center">
            <Link to="/pricing" className="inline-flex items-center gap-1.5 font-body text-sm text-muted-foreground transition-colors hover:text-foreground">
              See full plan comparison <ArrowRight size={13} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div
            ref={ctaRef}
            className="relative overflow-hidden rounded-3xl border px-8 py-20 text-center"
            style={{
              borderColor: ctaVisible ? "hsl(142 70% 49% / 0.3)" : "hsl(220 14% 18%)",
              boxShadow: ctaVisible ? "0 0 100px hsl(142 70% 49% / 0.12)" : "none",
              transition: "border-color 800ms ease-out, box-shadow 800ms ease-out",
            }}
          >
            {/* Breathing glow */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(ellipse at center, hsl(142 70% 49% / 0.09) 0%, transparent 65%)", animation: "cta-breathe 4s ease-in-out infinite" }}
            />
            {/* Corner decorations */}
            <div className="pointer-events-none absolute left-0 top-0 h-32 w-32 rounded-br-3xl bg-gradient-to-br from-primary/6 to-transparent" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-tl-3xl bg-gradient-to-tl from-accent/6 to-transparent" />

            <div
              className="relative"
              style={{
                opacity: ctaVisible ? 1 : 0,
                transform: ctaVisible ? "none" : "translateY(20px)",
                transition: "opacity 700ms cubic-bezier(0.23,1,0.32,1) 200ms, transform 700ms cubic-bezier(0.23,1,0.32,1) 200ms",
              }}
            >
              <p className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">Start now</p>
              <h2 className="font-display text-4xl font-bold sm:text-5xl lg:text-6xl">
                Your career deserves
                <br />
                <span className="text-glow-primary text-primary" style={{ animation: "text-glow-pulse 3s ease-in-out infinite" }}>
                  to be recorded.
                </span>
              </h2>
              <p className="mx-auto mt-6 max-w-lg font-body text-base leading-relaxed text-muted-foreground">
                Create your account in seconds and start building the complete history of your FC career.
              </p>

              <div className="mt-10 flex flex-wrap justify-center gap-4">
                {isAuthenticated ? (
                  <Link to="/app" className="landing-btn-primary group flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-display text-base font-bold text-primary-foreground">
                    Go to Hub <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="landing-btn-primary group flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-display text-base font-bold text-primary-foreground">
                      Create free account <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                    <Link to="/login" className="landing-btn-secondary rounded-2xl border border-border px-8 py-4 font-display text-base font-semibold text-foreground/70 transition-colors hover:border-primary/40 hover:text-foreground">
                      Already have an account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/40 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <LogoMark size={22} />
            <span className="font-display text-sm font-semibold text-muted-foreground">FC Career Hub</span>
          </div>
          <p className="font-body text-xs text-muted-foreground/60">Not affiliated with EA Sports. Made for Career Mode fans.</p>
          <div className="flex gap-4">
            <Link to="/login" className="font-body text-xs text-muted-foreground transition-colors hover:text-foreground">Sign in</Link>
            <Link to="/register" className="font-body text-xs text-muted-foreground transition-colors hover:text-foreground">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
