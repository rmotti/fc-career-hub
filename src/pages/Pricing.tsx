import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/model/useAuth";
import { LogoMark } from "@/shared/ui/Logo";
import {
  Shield,
  Check,
  ArrowRight,
  Zap,
  Star,
  Users,
  Trophy,
  BarChart2,
  Repeat2,
  LayoutDashboard,
  Infinity,
  HelpCircle,
} from "lucide-react";

// ─── Plan data ───────────────────────────────────────────────────────────────

const plans = [
  {
    id: "FREE",
    name: "Free",
    price: null,
    priceLabel: "Free",
    priceSub: "forever",
    description: "Perfect to start tracking your first career.",
    accent: "border-border/60",
    badge: null,
    cta: "Get started free",
    ctaStyle: "border border-border bg-card/50 text-foreground hover:border-primary/40 hover:bg-card",
    features: [
      { label: "1 simultaneous save", included: true },
      { label: "Full squad management", included: true },
      { label: "Season statistics", included: true },
      { label: "Trophy history", included: true },
      { label: "Unlimited transfers", included: true },
      { label: "Tactical lineup", included: true },
      { label: "Multiple saves", included: false },
      { label: "Data export", included: false },
      { label: "Priority support", included: false },
    ],
    icon: Zap,
    iconColor: "text-muted-foreground",
    iconBg: "bg-muted/30",
  },
  {
    id: "PRO",
    name: "Pro",
    price: "R$ 9",
    priceLabel: "R$ 9",
    priceSub: "per month",
    description: "For those managing multiple careers and wanting everything tracked.",
    accent: "border-primary/50 shadow-[0_0_40px_hsl(142_70%_49%_/_0.12)]",
    badge: "Most popular",
    cta: "Subscribe Pro",
    ctaStyle: "bg-primary text-primary-foreground hover:opacity-90",
    features: [
      { label: "3 simultaneous saves", included: true },
      { label: "Full squad management", included: true },
      { label: "Season statistics", included: true },
      { label: "Trophy history", included: true },
      { label: "Unlimited transfers", included: true },
      { label: "Tactical lineup", included: true },
      { label: "Multiple saves", included: true },
      { label: "Data export", included: false },
      { label: "Priority support", included: false },
    ],
    icon: Star,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    id: "PREMIUM",
    name: "Premium",
    price: "R$ 19",
    priceLabel: "R$ 19",
    priceSub: "per month",
    description: "Maximum control, unlimited saves and all future features.",
    accent: "border-accent/40 shadow-[0_0_40px_hsl(195_90%_50%_/_0.08)]",
    badge: null,
    cta: "Subscribe Premium",
    ctaStyle: "bg-accent text-accent-foreground hover:opacity-90",
    features: [
      { label: "Unlimited saves", included: true },
      { label: "Full squad management", included: true },
      { label: "Season statistics", included: true },
      { label: "Trophy history", included: true },
      { label: "Unlimited transfers", included: true },
      { label: "Tactical lineup", included: true },
      { label: "Multiple saves", included: true },
      { label: "Data export", included: true },
      { label: "Priority support", included: true },
    ],
    icon: Infinity,
    iconColor: "text-accent",
    iconBg: "bg-accent/10",
  },
];

const faq = [
  {
    q: "Can I start without paying anything?",
    a: "Yes. The Free plan is free forever and already includes 1 save with all the basic hub features.",
  },
  {
    q: "How does billing work?",
    a: "The Pro and Premium plans are still in development. When available, they will be billed monthly with cancellation at any time.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "Your saves and data remain intact. If you downgrade to Free, you'll continue accessing the first save normally.",
  },
  {
    q: "Do you plan more features?",
    a: "Yes. Data export, season comparisons and advanced performance analysis are on the roadmap for Pro and Premium users.",
  },
];

// ─── Comparison table features ───────────────────────────────────────────────

const comparisonRows = [
  { label: "Simultaneous saves", free: "1", pro: "3", premium: "Unlimited", icon: Users },
  { label: "Squad management", free: true, pro: true, premium: true, icon: Users },
  { label: "Season statistics", free: true, pro: true, premium: true, icon: BarChart2 },
  { label: "Trophy history", free: true, pro: true, premium: true, icon: Trophy },
  { label: "Transfers", free: true, pro: true, premium: true, icon: Repeat2 },
  { label: "Tactical lineup", free: true, pro: true, premium: true, icon: LayoutDashboard },
  { label: "Multiple saves", free: false, pro: true, premium: true, icon: Users },
  { label: "Data export", free: false, pro: false, premium: true, icon: BarChart2 },
  { label: "Priority support", free: false, pro: false, premium: true, icon: Shield },
];

// ─── Navbar ──────────────────────────────────────────────────────────────────

function Navbar({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <header className="landing-navbar fixed left-0 right-0 top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <LogoMark size={32} />
          <span className="font-display text-lg font-bold tracking-tight">FC Career Hub</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link to="/pricing" className="font-display text-sm font-semibold text-primary">
            Plans
          </Link>
          {isAuthenticated ? (
            <Link
              to="/app"
              className="landing-btn-primary flex items-center gap-2 rounded-xl bg-primary px-5 py-2 font-display text-sm font-bold text-primary-foreground"
            >
              Go to Hub
              <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="font-display text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="landing-btn-primary flex items-center gap-2 rounded-xl bg-primary px-5 py-2 font-display text-sm font-bold text-primary-foreground"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function CheckCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="font-display text-sm font-bold text-foreground">{value}</span>;
  }
  return value ? (
    <Check size={16} className="mx-auto text-primary" />
  ) : (
    <span className="font-body text-sm text-muted-foreground/40">—</span>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Pricing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar isAuthenticated={isAuthenticated} />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,_hsl(142_70%_49%_/_0.1),_transparent_60%)]" />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(142 70% 49%) 1px, transparent 1px), linear-gradient(90deg, hsl(142 70% 49%) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 font-display text-xs font-bold uppercase tracking-widest text-primary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Plans & pricing
          </div>
          <h1 className="font-display text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Simple and transparent.
            <br />
            <span className="text-glow-primary text-primary">Choose your plan.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl font-body text-lg leading-relaxed text-muted-foreground">
            Start free with 1 save and upgrade as your career grows. No commitment.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/8 px-4 py-2 font-body text-xs text-amber-400">
            <HelpCircle size={12} />
            Pro and Premium plans are in development. Everything below is a preview.
          </div>
        </div>
      </section>

      {/* ── PLAN CARDS ── */}
      <section className="pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.id}
                  className={`pricing-card relative flex flex-col overflow-hidden rounded-3xl border bg-card/50 p-8 transition-all duration-300 hover:-translate-y-1 ${plan.accent} ${plan.id === "PRO" ? "ring-1 ring-primary/20" : ""}`}
                >
                  {/* Popular badge */}
                  {plan.badge && (
                    <div className="absolute right-6 top-6 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-display text-xs font-bold text-primary">
                      {plan.badge}
                    </div>
                  )}

                  {/* Icon + name */}
                  <div className="mb-6">
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${plan.iconBg} ring-1 ring-border/50`}>
                      <Icon size={22} className={plan.iconColor} />
                    </div>
                    <h3 className="font-display text-2xl font-bold">{plan.name}</h3>
                    <p className="mt-1.5 font-body text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-8 border-b border-border/50 pb-6">
                    <div className="flex items-end gap-1.5">
                      <span className="font-display text-4xl font-bold leading-none">{plan.priceLabel}</span>
                      <span className="mb-1 font-body text-sm text-muted-foreground">{plan.priceSub}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="mb-8 flex-1 space-y-3">
                    {plan.features.map(({ label, included }) => (
                      <li key={label} className="flex items-center gap-3">
                        {included ? (
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                            <Check size={11} className="text-primary" />
                          </div>
                        ) : (
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted/30">
                            <span className="font-body text-xs leading-none text-muted-foreground/40">—</span>
                          </div>
                        )}
                        <span className={`font-body text-sm ${included ? "text-foreground" : "text-muted-foreground/50"}`}>
                          {label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isAuthenticated ? (
                    <Link
                      to="/app"
                      className={`landing-btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-display text-sm font-bold transition-all ${plan.ctaStyle}`}
                    >
                      Ir para o Hub
                      <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <Link
                      to="/register"
                      className={`landing-btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-display text-sm font-bold transition-all ${plan.ctaStyle}`}
                    >
                      {plan.cta}
                      <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-12 text-center">
            <p className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Full detail</p>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Compare plans</h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/60">
            {/* Header */}
            <div className="grid grid-cols-4 border-b border-border/60 bg-card/50">
              <div className="px-6 py-4 font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">Feature</div>
              {plans.map((p) => (
                <div key={p.id} className="px-4 py-4 text-center">
                  <span className={`font-display text-sm font-bold ${p.id === "PRO" ? "text-primary" : p.id === "PREMIUM" ? "text-accent" : "text-foreground"}`}>
                    {p.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Rows */}
            {comparisonRows.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-4 border-b border-border/40 last:border-0 ${i % 2 === 0 ? "bg-background/20" : ""}`}
              >
                <div className="flex items-center gap-2.5 px-6 py-4">
                  <row.icon size={13} className="shrink-0 text-muted-foreground/50" />
                  <span className="font-body text-sm text-muted-foreground">{row.label}</span>
                </div>
                <div className="flex items-center justify-center px-4 py-4">
                  <CheckCell value={row.free} />
                </div>
                <div className="flex items-center justify-center px-4 py-4">
                  <CheckCell value={row.pro} />
                </div>
                <div className="flex items-center justify-center px-4 py-4">
                  <CheckCell value={row.premium} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-12 text-center">
            <p className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">FAQ</p>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Frequently asked questions</h2>
          </div>

          <div className="space-y-3">
            {faq.map(({ q, a }) => (
              <div key={q} className="rounded-2xl border border-border/60 bg-card/40 px-6 py-5">
                <h4 className="mb-2 font-display text-base font-bold">{q}</h4>
                <p className="font-body text-sm leading-relaxed text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="pb-28 pt-4">
        <div className="mx-auto max-w-6xl px-6">
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card/50 px-8 py-16 text-center shadow-[0_0_60px_hsl(142_70%_49%_/_0.07)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(142_70%_49%_/_0.08),_transparent_65%)]" />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                Start free. No credit card.
              </h2>
              <p className="mx-auto mt-4 max-w-md font-body text-base text-muted-foreground">
                Create your account and set up your first save in under 2 minutes.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                {isAuthenticated ? (
                  <Link
                    to="/app"
                    className="landing-btn-primary group flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-display text-base font-bold text-primary-foreground"
                  >
                    Go to Hub
                    <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <Link
                    to="/register"
                    className="landing-btn-primary group flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-display text-base font-bold text-primary-foreground"
                  >
                    Create free account
                    <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                )}
                <Link
                  to="/"
                  className="landing-btn-secondary rounded-2xl border border-border px-8 py-4 font-display text-base font-semibold text-foreground/70 transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  See the product
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/40 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <Link to="/" className="flex items-center gap-2">
            <LogoMark size={22} />
            <span className="font-display text-sm font-semibold text-muted-foreground">FC Career Hub</span>
          </Link>
          <p className="font-body text-xs text-muted-foreground/60">
            Not affiliated with EA Sports. Made for Career Mode fans.
          </p>
          <div className="flex gap-4">
            <Link to="/login" className="font-body text-xs text-muted-foreground transition-colors hover:text-foreground">Sign in</Link>
            <Link to="/register" className="font-body text-xs text-muted-foreground transition-colors hover:text-foreground">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
