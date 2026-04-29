import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ArrowLeft, Compass } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { useAuth } from "@/contexts/useAuth";

export default function NotFound() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-foreground">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,_hsl(142_70%_49%_/_0.07),_transparent_65%)]" />
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(142 70% 49%) 1px, transparent 1px), linear-gradient(90deg, hsl(142 70% 49%) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md text-center" style={{ animation: "unauth-in 500ms cubic-bezier(0.23,1,0.32,1) both" }}>

        {/* Logo */}
        <Link to="/" className="mb-8 inline-flex items-center gap-2">
          <LogoMark size={28} />
          <span className="font-display text-sm font-bold text-muted-foreground">FC Career Hub</span>
        </Link>

        {/* Compass icon */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-accent/8 blur-xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-accent/25 bg-accent/6">
            <Compass size={32} className="text-accent" strokeWidth={1.5} style={{ animation: "compass-spin 6s ease-in-out infinite" }} />
          </div>
        </div>

        {/* Code */}
        <p
          className="mb-2 font-display text-7xl font-bold leading-none tracking-tight"
          style={{
            background: "linear-gradient(135deg, hsl(142 70% 49%) 0%, hsl(142 70% 49% / 0.4) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </p>

        {/* Headline */}
        <h1 className="mb-3 font-display text-2xl font-bold">Página não encontrada</h1>

        {/* Description */}
        <p className="mx-auto mb-2 max-w-sm font-body text-base leading-relaxed text-muted-foreground">
          A rota{" "}
          <code className="rounded bg-card/60 px-1.5 py-0.5 font-body text-sm text-muted-foreground">
            {location.pathname}
          </code>{" "}
          não existe.
        </p>
        <p className="mx-auto mb-8 max-w-sm font-body text-sm text-muted-foreground/60">
          Pode ter sido removida, renomeada ou nunca existiu.
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="landing-btn-primary group flex items-center justify-center gap-2 rounded-2xl bg-primary px-7 py-3.5 font-display text-sm font-bold text-primary-foreground"
          >
            Ir para o início
            <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          {isAuthenticated && (
            <Link
              to="/app"
              className="landing-btn-secondary flex items-center justify-center gap-2 rounded-2xl border border-border px-7 py-3.5 font-display text-sm font-semibold text-foreground/80 transition-colors hover:border-primary/40 hover:text-foreground"
            >
              Meus saves
            </Link>
          )}
        </div>

        {/* Back link */}
        <div className="mt-8">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 font-body text-xs text-muted-foreground/50 transition-colors hover:text-muted-foreground"
          >
            <ArrowLeft size={12} />
            Voltar à página anterior
          </button>
        </div>
      </div>
    </div>
  );
}
