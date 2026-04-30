import { ChevronLeft, X } from "lucide-react";
import type { TooltipRenderProps } from "react-joyride";

const getStepLabel = (index: number, size: number) => `${index + 1}/${size}`;

const TutorialTooltip = ({
  backProps,
  closeProps,
  index,
  isLastStep,
  primaryProps,
  size,
  skipProps,
  step,
  tooltipProps,
}: TooltipRenderProps) => {
  const progress = size > 0 ? ((index + 1) / size) * 100 : 0;

  return (
    <section
      {...tooltipProps}
      className="relative max-h-[calc(100dvh-1.5rem)] w-[min(360px,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-border bg-card text-left text-foreground shadow-[0_24px_80px_hsl(220_20%_3%/0.68)] sm:max-h-[min(86vh,420px)] sm:w-[min(360px,calc(100vw-2rem))]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-[hsl(var(--gold))]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--primary)/0.10),transparent_36%),linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface)))]" />

      <div className="relative p-4 sm:p-5">
        <header className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-sm border border-primary/25 bg-primary/10 px-2 py-0.5 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                Tutorial
              </span>
              <span className="font-display text-xs font-bold text-muted-foreground">{getStepLabel(index, size)}</span>
            </div>
            {step.title && <h3 className="font-display text-xl font-bold leading-tight text-foreground sm:text-2xl sm:leading-none">{step.title}</h3>}
          </div>

          <button
            {...closeProps}
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Fechar tutorial"
            title="Fechar tutorial"
          >
            <X size={16} />
          </button>
        </header>

        <div className="max-h-[32dvh] overflow-y-auto pr-1 text-sm leading-6 text-muted-foreground sm:max-h-32">{step.content}</div>

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary shadow-[0_0_14px_hsl(var(--primary)/0.55)] transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <footer className="mt-5 flex items-center justify-between gap-3">
          <button
            {...skipProps}
            type="button"
            className="rounded-md px-1 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            Pular
          </button>

          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                {...backProps}
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background/55 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                aria-label="Voltar"
                title="Voltar"
              >
                <ChevronLeft size={17} />
              </button>
            )}
            <button
              {...primaryProps}
              type="button"
              className="rounded-md bg-primary px-4 py-2.5 font-display text-sm font-bold text-primary-foreground shadow-[0_0_22px_hsl(var(--primary)/0.22)] transition-[opacity,transform] hover:opacity-90 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {isLastStep ? "Concluir" : "Próximo"}
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
};

export default TutorialTooltip;
