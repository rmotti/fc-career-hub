import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Check, ArrowLeft, Trophy, Users, TrendingUp, Repeat2 } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { toast } from "sonner";
import { useAuth } from "@/contexts/useAuth";
import { extractErrorMessage } from "@/services/api";

// ─── Decorative left panel ───────────────────────────────────────────────────

const perks = [
  { icon: Users, label: "Elenco completo", desc: "Cada jogador com posição, OVR, salário e valor." },
  { icon: TrendingUp, label: "Estatísticas por temporada", desc: "Gols, assists e desempenho consolidados." },
  { icon: Repeat2, label: "Transferências documentadas", desc: "Entradas, saídas e empréstimos registrados." },
  { icon: Trophy, label: "Sala de troféus", desc: "Cada título com clube e ano da conquista." },
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
          <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-accent">Comece agora, é grátis</p>
          <h1 className="font-display text-5xl font-bold leading-[1.08] tracking-tight">
            Crie seu hub.<br />
            <span className="text-glow-primary text-primary">Registre tudo.</span>
          </h1>
          <p className="max-w-sm font-body text-base leading-relaxed text-muted-foreground">
            Um hub completo para acompanhar cada detalhe do seu Modo Carreira no FC.
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-3">
          {perks.map(({ icon: Icon, label, desc }, i) => (
            <div
              key={label}
              className="flex items-start gap-3.5 rounded-2xl border border-border/50 bg-card/40 px-4 py-3.5 backdrop-blur-sm"
              style={{ animationDelay: `${i * 60 + 200}ms` }}
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
                <Icon size={14} />
              </div>
              <div>
                <div className="font-display text-sm font-bold leading-none">{label}</div>
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
          Plano <strong className="text-foreground">FREE</strong> para começar, sem cartão de crédito.{" "}
          <Link to="/pricing" className="font-semibold text-primary hover:underline">
            Ver todos os planos →
          </Link>
        </p>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Register() {
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
      toast.success("Conta criada com sucesso!");
    } catch (error) {
      toast.error(extractErrorMessage(error), { duration: 5000 });
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
            Início
          </Link>
        </div>

        <div className="auth-form-card w-full max-w-sm space-y-8">
          {/* Back link — desktop */}
          <Link
            to="/"
            className="hidden items-center gap-1.5 font-body text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground lg:flex"
          >
            <ArrowLeft size={12} />
            Voltar ao início
          </Link>

          {/* Header */}
          <div>
            <h2 className="font-display text-3xl font-bold">Criar conta</h2>
            <p className="mt-1.5 font-body text-sm leading-relaxed text-muted-foreground">
              Cadastre-se e comece a registrar sua carreira agora.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="João Silva"
                className="auth-input w-full rounded-xl border border-border bg-card/40 px-4 py-3 font-body text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                E-mail
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
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
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
              Criar e entrar
            </button>

            <p className="text-center font-body text-xs leading-relaxed text-muted-foreground/60">
              Ao criar uma conta você concorda com os termos de uso do serviço.
            </p>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <span className="font-body text-xs text-muted-foreground/50">ou</span>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          {/* Footer */}
          <p className="text-center font-body text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="font-semibold text-primary transition-opacity hover:opacity-80">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
