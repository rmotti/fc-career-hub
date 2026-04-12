import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Lock, ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/Logo";

export default function Unauthorized() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-foreground">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,_hsl(0_72%_51%_/_0.07),_transparent_65%)]" />
        <div className="absolute left-1/2 top-1/3 h-[400px] w-[600px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,_hsl(142_70%_49%_/_0.04),_transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
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
          <span className="font-display text-sm font-bold text-muted-foreground">FC 26 Hub</span>
        </Link>

        {/* Lock icon with glow ring */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-destructive/10 blur-xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-destructive/30 bg-destructive/8">
            <Lock size={32} className="text-destructive" strokeWidth={1.5} />
          </div>
        </div>

        {/* Code */}
        <p
          className="mb-2 font-display text-7xl font-bold leading-none tracking-tight"
          style={{
            background: "linear-gradient(135deg, hsl(0 72% 51%) 0%, hsl(0 72% 51% / 0.5) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          401
        </p>

        {/* Headline */}
        <h1 className="mb-3 font-display text-2xl font-bold">Acesso restrito</h1>

        {/* Description */}
        <p className="mx-auto mb-6 max-w-sm font-body text-base leading-relaxed text-muted-foreground">
          Esta área é exclusiva para usuários com sessão ativa.
          Faça login ou crie uma conta gratuita para continuar.
        </p>

        {/* Attempted route badge */}
        {from && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1.5">
            <span className="font-body text-xs text-muted-foreground/60">Rota solicitada:</span>
            <code className="font-body text-xs font-semibold text-muted-foreground">{from}</code>
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/login"
            state={{ from }}
            className="landing-btn-primary group flex items-center justify-center gap-2 rounded-2xl bg-primary px-7 py-3.5 font-display text-sm font-bold text-primary-foreground"
          >
            Fazer login
            <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <Link
            to="/register"
            className="landing-btn-secondary flex items-center justify-center gap-2 rounded-2xl border border-border px-7 py-3.5 font-display text-sm font-semibold text-foreground/80 transition-colors hover:border-primary/40 hover:text-foreground"
          >
            Criar conta grátis
          </Link>
        </div>

        {/* Back link */}
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 font-body text-xs text-muted-foreground/50 transition-colors hover:text-muted-foreground"
          >
            <ArrowLeft size={12} />
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
