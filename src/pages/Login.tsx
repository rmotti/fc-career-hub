import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, Trophy, ArrowLeft, BarChart2, Calendar, Shield } from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/shared/ui/Logo";
import { useAuth } from "@/features/auth/model/useAuth";
import { extractErrorMessage } from "@/shared/api/client";
import type React from "react";

// ─── Decorative left panel ───────────────────────────────────────────────────

const mockSaves = [
  { club: "Real Madrid", season: "26/27", trophies: 4, ovr: 84 },
  { club: "Bayern Munich", season: "25/26", trophies: 2, ovr: 82 },
  { club: "Arsenal", season: "24/25", trophies: 1, ovr: 79 },
];

function LeftPanel() {
  const { t } = useTranslation();

  return (
    <div className="hidden lg:flex lg:w-[52%] flex-col justify-between relative overflow-hidden border-r border-border/30 p-12">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] bg-accent/5 blur-3xl" />
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

      {/* Headline + cards */}
      <div className="relative space-y-8">
        <div className="space-y-3">
          <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">{t("auth.login.welcomeBack")}</p>
          <h1 className="font-display text-5xl font-bold leading-[1.08] tracking-tight">
            Your saves<br />
            <span className="text-glow-primary text-primary">are waiting.</span>
          </h1>
          <p className="max-w-sm font-body text-base leading-relaxed text-muted-foreground">
            {t("auth.login.subheadline")}
          </p>
        </div>

        {/* Mini save list */}
        <div className="space-y-2.5">
          {mockSaves.map((save, i) => (
            <div
              key={save.club}
              className="flex items-center gap-3.5 rounded-2xl border border-border/50 bg-card/40 px-4 py-3 backdrop-blur-sm"
              style={{ animationDelay: `${i * 60 + 300}ms` }}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Shield size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-sm font-bold leading-none">{save.club}</div>
                <div className="mt-0.5 flex items-center gap-1.5 font-body text-xs text-muted-foreground">
                  <Calendar size={10} />
                  <span>{t("auth.login.season", { season: save.season })}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-right">
                <div className="flex items-center gap-1">
                  <BarChart2 size={11} className="text-accent" />
                  <span className="font-display text-xs font-bold text-accent">{save.ovr}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy size={11} className="text-gold" />
                  <span className="font-display text-xs font-bold text-gold">{save.trophies}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust badges */}
      <div className="relative flex flex-wrap gap-2">
        {[t("auth.login.trustBadges.cloud"), t("auth.login.trustBadges.secure"), t("auth.login.trustBadges.free")].map((label) => (
          <span
            key={label}
            className="rounded-full border border-border/50 bg-background/40 px-3 py-1.5 font-body text-xs text-muted-foreground backdrop-blur"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { from?: string } | null)?.from ?? "/app";
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await signIn({ email, password });
      navigate(returnTo, { replace: true });
      toast.success(t("auth.login.success"));
    } catch (error: any) {
      const status = error?.status || error?.response?.status;
      const message =
        status === 401
          ? t("auth.login.wrongCredentials")
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
            <h2 className="font-display text-3xl font-bold">{t("auth.login.title")}</h2>
            <p className="mt-1.5 font-body text-sm leading-relaxed text-muted-foreground">
              {t("auth.login.subtitle")}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("auth.login.email")}
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
                {t("auth.login.password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.login.passwordPlaceholder")}
                className="auth-input w-full rounded-xl border border-border bg-card/40 px-4 py-3 font-body text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="landing-btn-primary mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-display text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
              {t("auth.login.submit")}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <span className="font-body text-xs text-muted-foreground/50">{t("auth.login.or")}</span>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          {/* Footer */}
          <p className="text-center font-body text-sm text-muted-foreground">
            {t("auth.login.noAccount")}{" "}
            <Link to="/register" className="font-semibold text-primary transition-opacity hover:opacity-80">
              {t("auth.login.createFree")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
