import { BarChart2, ClipboardList, Trophy } from "lucide-react";

const featureCards = [
  {
    icon: ClipboardList,
    title: "Registre sua carreira",
    desc: "Acompanhe cada temporada, clube gerenciado e conquistas do seu Modo Carreira ao longo dos anos.",
  },
  {
    icon: BarChart2,
    title: "Estatísticas completas",
    desc: "Gols, assistências, partidas, cartões e muito mais documentados por jogador e consolidados por temporada.",
  },
  {
    icon: Trophy,
    title: "Histórico de troféus",
    desc: "Guarde cada título conquistado, com clube e temporada registrados na sua sala de troféus pessoal.",
  },
];

const steps = [
  { tag: "1", title: "Crie um Save", desc: "Dê um nome à sua carreira, escolha seu clube e defina o orçamento." },
  { tag: "2", title: "Monte seu elenco", desc: "Adicione jogadores com posição, overall, salário e valor de mercado." },
  { tag: "3", title: "Registre a temporada", desc: "Atualize estatísticas de jogadores e do time ao longo da temporada." },
  { tag: "4", title: "Avance e conquiste", desc: "Finalize temporadas, registre transferências e conquiste troféus." },
];

export default function AuthHubShowcase() {
  return (
    <div className="space-y-10">
      <section className="w-full space-y-8">
        <h2 className="font-display text-center text-3xl font-bold sm:text-4xl">O que e o FC Career Hub?</h2>
        <div className="grid grid-cols-1 gap-6 text-left md:grid-cols-3">
          {featureCards.map(({ icon: Icon, title, desc }) => (
            <article
              key={title}
              className="card-gamer min-h-[260px] rounded-2xl border-border/80 bg-card/70 p-7 shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_36px_rgba(34,197,94,0.08)]"
            >
              <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <Icon size={30} />
              </div>
              <h3 className="mb-4 font-display text-2xl font-bold leading-none sm:text-[2rem]">{title}</h3>
              <p className="max-w-[27ch] text-lg leading-relaxed text-muted-foreground sm:text-[1.05rem]">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="w-full rounded-[28px] border border-border/80 bg-card/25 px-6 py-10 sm:px-10 sm:py-14">
        <h2 className="mb-12 text-center font-display text-3xl font-bold sm:text-4xl">Como funciona</h2>

        <div className="relative grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-8">
          <div className="absolute left-[12%] right-[12%] top-7 hidden h-px bg-border/60 md:block" />

          {steps.map((step) => (
            <div key={step.tag} className="relative z-10 flex flex-col items-center text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary bg-card text-[2rem] font-display font-bold leading-none text-primary shadow-[0_0_22px_rgba(34,197,94,0.28)]">
                {step.tag}
              </div>
              <h4 className="mb-3 font-display text-xl font-bold sm:text-[1.9rem]">{step.title}</h4>
              <p className="max-w-[20ch] text-base leading-relaxed text-muted-foreground sm:text-[1.02rem]">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
