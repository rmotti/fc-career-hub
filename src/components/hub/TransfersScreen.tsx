import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, DollarSign } from "lucide-react";
import type { SaveData } from "@/data/mockData";

interface Props {
  save: SaveData;
}

const TransfersScreen = ({ save }: Props) => {
  const [tab, setTab] = useState<"current" | "history">("current");

  const currentYear = save.year;
  const currentTransfers = save.transfers.filter(t => t.year >= currentYear - 1);
  const pastTransfers = save.transfers.filter(t => t.year < currentYear - 1);

  const purchases = currentTransfers.filter(t => t.type === "compra");
  const sales = currentTransfers.filter(t => t.type === "venda");

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Transferências</h2>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["current", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "current" ? "Janela Atual" : "Histórico"}
          </button>
        ))}
      </div>

      {tab === "current" ? (
        <div className="space-y-6">
          {/* Budget */}
          <div className="card-gamer p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Orçamento Disponível</p>
              <p className="text-xl font-display font-bold text-primary">{save.budget}</p>
            </div>
          </div>

          {/* Purchases */}
          <div className="card-gamer p-5">
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
              <ArrowDownLeft size={16} className="text-primary" /> Contratações
            </h3>
            {purchases.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma contratação recente.</p>
            ) : (
              <div className="space-y-2">
                {purchases.map((t) => (
                  <div key={t.id} className="flex items-center justify-between bg-muted/30 rounded-md px-3 py-2">
                    <div>
                      <p className="font-medium text-sm">{t.playerName}</p>
                      <p className="text-xs text-muted-foreground">De: {t.from}</p>
                    </div>
                    <span className="font-display font-bold text-primary text-sm">{t.fee}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sales */}
          <div className="card-gamer p-5">
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
              <ArrowUpRight size={16} className="text-accent" /> Vendas
            </h3>
            {sales.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma venda recente.</p>
            ) : (
              <div className="space-y-2">
                {sales.map((t) => (
                  <div key={t.id} className="flex items-center justify-between bg-muted/30 rounded-md px-3 py-2">
                    <div>
                      <p className="font-medium text-sm">{t.playerName}</p>
                      <p className="text-xs text-muted-foreground">Para: {t.to}</p>
                    </div>
                    <span className="font-display font-bold text-accent text-sm">{t.fee}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card-gamer p-5">
          <h3 className="font-display font-semibold mb-4">Histórico Completo</h3>
          {save.transfers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem transferências registradas.</p>
          ) : (
            <div className="space-y-2">
              {[...save.transfers].sort((a, b) => b.year - a.year).map((t) => (
                <div key={t.id} className="flex items-center justify-between bg-muted/30 rounded-md px-3 py-2">
                  <div className="flex items-center gap-3">
                    {t.type === "compra" ? (
                      <ArrowDownLeft size={14} className="text-primary" />
                    ) : (
                      <ArrowUpRight size={14} className="text-accent" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{t.playerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.type === "compra" ? `De: ${t.from}` : `Para: ${t.to}`} — {t.year}
                      </p>
                    </div>
                  </div>
                  <span className={`font-display font-bold text-sm ${t.type === "compra" ? "text-primary" : "text-accent"}`}>
                    {t.fee}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransfersScreen;
