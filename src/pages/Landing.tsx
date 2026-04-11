import { useRef, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
  { icon: ClipboardList, title: "Registre sua carreira", desc: "Acompanhe cada temporada, clube gerenciado e conquistas do seu Modo Carreira ao longo dos anos." },
  { icon: BarChart2, title: "Estatísticas completas", desc: "Gols, assistências, partidas e cartões documentados por jogador e consolidados por temporada." },
  { icon: Trophy, title: "Sala de troféus", desc: "Guarde cada título conquistado, com clube e temporada registrados na sua galeria pessoal." },
];

const steps = [
  { num: "01", title: "Crie um Save", desc: "Dê um nome à carreira, escolha o clube e defina o orçamento inicial." },
  { num: "02", title: "Monte o elenco", desc: "Adicione jogadores com posição, overall, salário e valor de mercado." },
  { num: "03", title: "Registre a temporada", desc: "Atualize estatísticas de jogadores e do clube ao longo dos jogos." },
  { num: "04", title: "Avance e conquiste", desc: "Finalize temporadas, registre transferências e acumule títulos." },
];

const hubFeatures = [
  { icon: Users, label: "Elenco completo", desc: "Cada jogador, cada posição, cada contrato em um lugar só." },
  { icon: Repeat2, label: "Transferências", desc: "Entradas, saídas, valores e destinos documentados por janela." },
  { icon: TrendingUp, label: "Evolução por temporada", desc: "Veja como seu clube e seus jogadores cresceram ao longo do tempo." },
  { icon: LayoutDashboard, label: "Dashboard centralizado", desc: "Visão geral do save ativo com os dados mais importantes." },
  { icon: Star, label: "Múltiplos saves", desc: "Gerencie várias carreiras simultâneas sem misturar os dados." },
  { icon: Shield, label: "Sessão segura", desc: "Seus saves ficam na nuvem, acessíveis em qualquer dispositivo." },
];

const marqueeItems = [
  "Elenco", "Temporadas", "Troféus", "Transferências", "Estatísticas",
  "Saves", "Clubes", "OVR", "Orçamento", "Histórico", "Campo", "Dashboard",
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Shield size={16} />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">FC 26 Hub</span>
        </div>

        <nav className="flex items-center gap-1">
          <Link to="/pricing" className="rounded-xl px-4 py-2 font-display text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
            Planos
          </Link>
          {isAuthenticated ? (
            <Link to="/app" className="landing-btn-primary ml-2 flex items-center gap-2 rounded-xl bg-primary px-5 py-2 font-display text-sm font-bold text-primary-foreground">
              Ir para o Hub <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="rounded-xl px-4 py-2 font-display text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
                Entrar
              </Link>
              <Link to="/register" className="landing-btn-primary flex items-center gap-2 rounded-xl bg-primary px-5 py-2 font-display text-sm font-bold text-primary-foreground">
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

// ─── Hero Mockup ─────────────────────────────────────────────────────────────

function HeroDashboardMockup() {
  return (
    <div className="landing-mockup relative mx-auto w-full max-w-sm" style={{ animation: "mockup-float 4s ease-in-out infinite" }}>
      <div className="absolute -inset-6 rounded-3xl bg-primary/6 blur-3xl" />
      <div className="absolute -inset-2 rounded-2xl bg-primary/4 blur-xl" />

      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
        {/* Scan line */}
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-2xl">
          <div style={{ animation: "scan-line 3s linear infinite" }} className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>

        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-border/50 bg-card/80 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-destructive opacity-70" />
            <div className="h-2 w-2 rounded-full bg-warning opacity-70" />
            <div className="h-2 w-2 rounded-full bg-primary opacity-70" style={{ animation: "pulse-glow 2s ease-in-out infinite" }} />
          </div>
          <span className="font-display text-xs font-semibold text-muted-foreground">Real Madrid · 26/27</span>
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
            <Shield size={10} className="text-primary" />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-border/50 bg-background/40">
          {[{ label: "Gols", value: "87" }, { label: "Vitórias", value: "29" }, { label: "Títulos", value: "4" }].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center py-4">
              <span className="stat-highlight text-2xl">{value}</span>
              <span className="mt-0.5 font-body text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Player list */}
        <div className="space-y-1 p-4">
          {[{ name: "Vinicius Jr.", pos: "EA", ovr: 91 }, { name: "Bellingham", pos: "MC", ovr: 89 }, { name: "Mbappé", pos: "PD", ovr: 91 }].map((p) => (
            <div key={p.name} className="flex items-center justify-between rounded-xl bg-background/50 px-3 py-2.5">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 font-display text-xs font-bold text-primary">{p.pos}</div>
                <span className="font-body text-sm font-medium">{p.name}</span>
              </div>
              <span className="font-display text-sm font-bold text-primary">{p.ovr}</span>
            </div>
          ))}
          <div className="pt-1 text-center font-body text-[11px] text-muted-foreground/60">+ 22 jogadores</div>
        </div>

        {/* Trophy bar */}
        <div className="flex items-center gap-2 border-t border-border/50 bg-background/30 px-4 py-3">
          <Trophy size={12} className="text-gold" />
          <span className="font-display text-xs font-semibold text-muted-foreground">La Liga · UCL · Copa del Rey · Supercopa</span>
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
        {val.toLocaleString("pt-BR")}<span className="text-primary">{suffix}</span>
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
          <StatItem target={1200} suffix="+" label="Saves criados" active={visible} />
          <div className="hidden h-full w-px bg-border/50 sm:block" />
          <StatItem target={40} suffix="+" label="Temporadas em média" active={visible} />
          <div className="hidden h-full w-px bg-border/50 sm:block" />
          <StatItem target={100} suffix="%" label="Gratuito para começar" active={visible} />
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
                FC 26 Career Hub
              </div>

              <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Sua carreira.
                <br />
                <span className="text-glow-primary text-primary" style={{ animation: "text-glow-pulse 3s ease-in-out infinite" }}>Seu legado.</span>
              </h1>

              <p className="max-w-lg font-body text-lg leading-relaxed text-muted-foreground">
                Organize cada save do Modo Carreira: clube, elenco, temporadas, transferências e títulos — tudo em um hub só para você.
              </p>

              <div className="flex flex-wrap gap-3">
                {isAuthenticated ? (
                  <Link to="/app" className="landing-btn-primary group flex items-center gap-2 rounded-2xl bg-primary px-7 py-3.5 font-display text-base font-bold text-primary-foreground">
                    Ir para o Hub <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="landing-btn-primary group flex items-center gap-2 rounded-2xl bg-primary px-7 py-3.5 font-display text-base font-bold text-primary-foreground">
                      Criar conta grátis <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                    <Link to="/login" className="landing-btn-secondary flex items-center gap-2 rounded-2xl border border-border px-7 py-3.5 font-display text-base font-semibold text-foreground/80 transition-colors hover:border-primary/40 hover:text-foreground">
                      Já tenho conta
                    </Link>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2">
                {["Grátis para começar", "Sem instalação", "Dados na nuvem"].map((item) => (
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
            <p className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">O que você ganha</p>
            <h2 className="font-display text-4xl font-bold sm:text-5xl">Por que usar o FC 26 Hub?</h2>
            <p className="mx-auto mt-4 max-w-xl font-body text-base text-muted-foreground">
              Feito para quem leva o Modo Carreira a sério. Nada se perde, tudo fica registrado.
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
            <p className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-accent">Simples assim</p>
            <h2 className="font-display text-4xl font-bold sm:text-5xl">Como funciona</h2>
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
            <p className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">Tudo incluído</p>
            <h2 className="font-display text-4xl font-bold sm:text-5xl">Um hub completo</h2>
            <p className="mx-auto mt-4 max-w-xl font-body text-base text-muted-foreground">
              Cada área do seu Modo Carreira tem uma seção dedicada dentro do hub.
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
            <p className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">Planos</p>
            <h2 className="font-display text-4xl font-bold sm:text-5xl">Comece grátis, evolua depois.</h2>
            <p className="mx-auto mt-4 max-w-lg font-body text-base text-muted-foreground">
              Tudo que você precisa para registrar sua carreira está no plano gratuito. Quando quiser mais, é só evoluir.
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
                <span className="font-display text-3xl font-bold">Grátis</span>
                <span className="ml-1.5 font-body text-xs text-muted-foreground">para sempre</span>
              </div>
              <ul className="mb-6 flex-1 space-y-2.5">
                {["1 save simultâneo", "Elenco completo", "Estatísticas por temporada", "Histórico de troféus"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check size={13} className="shrink-0 text-primary" />
                    <span className="font-body text-sm text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="landing-btn-secondary flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 font-display text-sm font-semibold text-foreground/80 transition-colors hover:border-primary/40">
                Começar grátis
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
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-display text-xs font-bold text-primary" style={{ animation: "pulse-glow 2.5s ease-in-out infinite" }}>Popular</span>
              </div>
              <div className="mb-5 border-b border-border/50 pb-5">
                <span className="font-display text-3xl font-bold">R$ 9</span>
                <span className="ml-1.5 font-body text-xs text-muted-foreground">por mês</span>
              </div>
              <ul className="mb-6 flex-1 space-y-2.5">
                {["3 saves simultâneos", "Elenco completo", "Estatísticas por temporada", "Histórico de troféus", "Transferências ilimitadas"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check size={13} className="shrink-0 text-primary" />
                    <span className="font-body text-sm text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="landing-btn-primary flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-sm font-bold text-primary-foreground">
                Assinar Pro
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
                <span className="ml-1.5 font-body text-xs text-muted-foreground">por mês</span>
              </div>
              <ul className="mb-6 flex-1 space-y-2.5">
                {["Saves ilimitados", "Todos os recursos Pro", "Exportação de dados", "Suporte prioritário", "Funcionalidades futuras"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check size={13} className="shrink-0 text-accent" />
                    <span className="font-body text-sm text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="landing-btn-primary flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-display text-sm font-bold text-accent-foreground">
                Assinar Premium
              </Link>
            </div>
          </div>

          <Reveal delay={300} className="mt-8 text-center">
            <Link to="/pricing" className="inline-flex items-center gap-1.5 font-body text-sm text-muted-foreground transition-colors hover:text-foreground">
              Ver comparativo completo de planos <ArrowRight size={13} />
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
              <p className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">Comece agora</p>
              <h2 className="font-display text-4xl font-bold sm:text-5xl lg:text-6xl">
                Sua carreira merece
                <br />
                <span className="text-glow-primary text-primary" style={{ animation: "text-glow-pulse 3s ease-in-out infinite" }}>
                  ser registrada.
                </span>
              </h2>
              <p className="mx-auto mt-6 max-w-lg font-body text-base leading-relaxed text-muted-foreground">
                Crie sua conta em segundos e comece a montar o histórico completo da sua carreira no EA FC 26.
              </p>

              <div className="mt-10 flex flex-wrap justify-center gap-4">
                {isAuthenticated ? (
                  <Link to="/app" className="landing-btn-primary group flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-display text-base font-bold text-primary-foreground">
                    Ir para o Hub <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="landing-btn-primary group flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-display text-base font-bold text-primary-foreground">
                      Criar conta grátis <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                    <Link to="/login" className="landing-btn-secondary rounded-2xl border border-border px-8 py-4 font-display text-base font-semibold text-foreground/70 transition-colors hover:border-primary/40 hover:text-foreground">
                      Já tenho conta
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
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary"><Shield size={12} /></div>
            <span className="font-display text-sm font-semibold text-muted-foreground">FC 26 Career Hub</span>
          </div>
          <p className="font-body text-xs text-muted-foreground/60">Não afiliado à EA Sports. Feito para fãs de Modo Carreira.</p>
          <div className="flex gap-4">
            <Link to="/login" className="font-body text-xs text-muted-foreground transition-colors hover:text-foreground">Entrar</Link>
            <Link to="/register" className="font-body text-xs text-muted-foreground transition-colors hover:text-foreground">Criar conta</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
