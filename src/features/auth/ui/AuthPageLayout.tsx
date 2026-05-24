import { Link } from "react-router-dom";
import { Shield, Trophy } from "lucide-react";
import type { ReactNode } from "react";

interface AuthPageLayoutProps {
  title: string;
  description: string;
  footerText: string;
  footerLinkLabel: string;
  footerLinkTo: string;
  children: ReactNode;
  bottomContent?: ReactNode;
}

const highlights = [
  "Your saves are now isolated by account.",
  "User role and plan available globally.",
  "Session validated automatically on app open.",
];

export default function AuthPageLayout({
  title,
  description,
  footerText,
  footerLinkLabel,
  footerLinkTo,
  children,
  bottomContent,
}: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex min-h-screen flex-col justify-center gap-10 lg:translate-x-[-28px] lg:flex-row lg:items-stretch lg:gap-0">
          <section className="relative overflow-hidden rounded-3xl border border-border bg-card/50 p-8 lg:flex lg:w-[52%] lg:flex-col lg:justify-between lg:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.18),_transparent_55%)]" />
            <div className="relative">
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <Shield size={16} />
                FC Career Hub
              </div>
              <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
                Your career, your account, your history.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Sign in to continue recording seasons, squads, transfers and titles with a protected session.
              </p>
            </div>

            <div className="relative mt-10 grid gap-4 sm:grid-cols-3 lg:mt-0 lg:pt-12">
              {highlights.map((item) => (
                <div key={item} className="rounded-2xl border border-border bg-background/70 p-4 backdrop-blur">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Trophy size={18} />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-black/5 lg:ml-[10px] lg:w-[48%] lg:self-center lg:p-8">
            <div className="mb-6">
              <h2 className="font-display text-3xl font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>

            {children}

            <p className="mt-6 text-sm text-muted-foreground">
              {footerText}{" "}
              <Link to={footerLinkTo} className="font-semibold text-primary hover:underline">
                {footerLinkLabel}
              </Link>
            </p>
          </section>
        </div>
        {bottomContent ? <div className="mt-8 lg:translate-x-[-28px]">{bottomContent}</div> : null}
      </div>
    </div>
  );
}
