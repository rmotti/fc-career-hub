import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, Check, ArrowLeft, Trophy, Users, TrendingUp, Repeat2 } from "lucide-react";
import { LogoMark } from "@/shared/ui/Logo";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/model/useAuth";
import { extractErrorMessage } from "@/shared/api/client";
import type React from "react";

// ─── Decorative left panel ───────────────────────────────────────────────────

const perks = [
  { icon: Users, labelKey: "Squad management", desc: "Every player with position, OVR, salary and value." },
  { icon: TrendingUp, labelKey: "Season stats", desc: "Goals, assists and performance consolidated." },
  { icon: Repeat2, labelKey: "Transfer records", desc: "Arrivals, departures and loans documented." },
  { icon: Trophy, labelKey: "Trophy room", desc: "Every title with club and season won." },
];

function LeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-[52%] flex-col justify-between relative overflow-hidden border-r border-border/30 p-12">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 right-0 h-[450px] w-[450px] rounded-full bg-accent/6 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[350px] w-[350px] bg-primary/6 blur-3xl" />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(142 70% 49%) 1px, transparent 1px), linear-gradient(90deg, hsl(142 70% 49%) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      {/* Logo */}
      <div className="relative flex items-center gap-2.5">
        <LogoMark size={32} />
        <span className="font-display text-lg font-bold tracking-tight">FC Career Hub</span>
      </div>

      {/* Headline + perks */}
      <div className="relative space-y-8">
        <div className="space-y-3">
          <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-accent">Start now, it's free</p>
          <h1 className="font-display text-5xl font-bold leading-[1.08] tracking-tight">
            Build your hub.<br />
            <span className="text-glow-primary text-primary">Track everything.</span>
          </h1>
          <p className="max-w-sm font-body text-base leading-relaxed text-muted-foreground">
            A complete hub to track every detail of your Career Mode in FC.
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-3">
          {perks.map(({ icon: Icon, labelKey, desc }, i) => (
            <div
              key={labelKey}
              className="flex items-start gap-3.5 rounded-2xl border border-border/50 bg-card/40 px-4 py-3.5 backdrop-blur-sm"
              style={{ animationDelay: `${i * 60 + 200}ms` }}
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
                <Icon size={14} />
              </div>
              <div>
                <div className="font-display text-sm font-bold leading-none">{labelKey}</div>
                <div className="mt-0.5 font-body text-xs leading-relaxed text-muted-foreground">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plan mention */}
      <div className="relative flex items-center gap-2.5 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
        <Check size={14} className="shrink-0 text-primary" />
        <p className="font-body text-xs text-muted-foreground">
          <strong className="text-foreground">FREE</strong> plan to start, no credit card required.{" "}
          <Link to="/pricing" className="font-semibold text-primary hover:underline">
            See all plans →
          </Link>
        </p>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await signUp({ name, email, password });
      navigate("/app", { replace: true });
      toast.success("Account created successfully!");
    } catch (error: any) {
      const status = error?.status || error?.response?.status;
      const message =
        status === 409
          ? "This email is already registered. Try logging in."
          : extractErrorMessage(error);
      toast.error(message, { duration: 5000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page flex min-h-screen bg-background text-foreground">
      <LeftPanel />

      {/* Right panel: form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16">
        {/* Mobile logo */}
        <div className="mb-10 flex w-full max-w-sm items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <LogoMark size={28} />
            <span className="font-display text-base font-bold">FC Career Hub</span>
          </div>
          <Link to="/" className="flex items-center gap-1 font-body text-xs text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft size={12} />
            {t("auth.login.back")}
          </Link>
        </div>

        <div className="auth-form-card w-full max-w-sm space-y-8">
          {/* Back link — desktop */}
          <Link
            to="/"
            className="hidden items-center gap-1.5 font-body text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground lg:flex"
          >
            <ArrowLeft size={12} />
            {t("auth.login.backToHome")}
          </Link>

          {/* Header */}
          <div>
            <h2 className="font-display text-3xl font-bold">{t("auth.register.title")}</h2>
            <p className="mt-1.5 font-body text-sm leading-relaxed text-muted-foreground">
              {t("auth.register.subtitle")}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("auth.register.name")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("auth.register.namePlaceholder")}
                className="auth-input w-full rounded-xl border border-border bg-card/40 px-4 py-3 font-body text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("auth.register.email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao@email.com"
                className="auth-input w-full rounded-xl border border-border bg-card/40 px-4 py-3 font-body text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("auth.register.password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.register.passwordPlaceholder")}
                className="auth-input w-full rounded-xl border border-border bg-card/40 px-4 py-3 font-body text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="landing-btn-primary mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-display text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
              {t("auth.register.submit")}
            </button>

            <p className="text-center font-body text-xs leading-relaxed text-muted-foreground/60">
              By creating an account you agree to the service terms of use.
            </p>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <span className="font-body text-xs text-muted-foreground/50">{t("auth.register.or")}</span>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          {/* Footer */}
          <p className="text-center font-body text-sm text-muted-foreground">
            {t("auth.register.hasAccount")}{" "}
            <Link to="/login" className="font-semibold text-primary transition-opacity hover:opacity-80">
              {t("auth.register.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
