import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AuthPageLayout from "@/components/AuthPageLayout";
import AuthHubShowcase from "@/components/AuthHubShowcase";
import { useAuth } from "@/contexts/AuthContext";
import { extractErrorMessage } from "@/services/api";

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
      navigate("/", { replace: true });
      toast.success("Conta criada com sucesso!");
    } catch (error) {
      toast.error(extractErrorMessage(error), { duration: 5000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPageLayout
      title="Criar conta"
      description="Cadastre-se para ter seus saves vinculados ao seu usuário e protegidos por sessão."
      footerText="Já tem conta?"
      footerLinkLabel="Fazer login"
      footerLinkTo="/login"
      bottomContent={<AuthHubShowcase />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Nome
          </label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="João Silva"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="joao@email.com"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Crie uma senha"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            required
            minLength={8}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-display text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          Criar e entrar
        </button>
      </form>
    </AuthPageLayout>
  );
}
