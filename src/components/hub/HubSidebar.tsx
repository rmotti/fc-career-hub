import {
  LayoutDashboard, Users, BarChart3, History,
  ArrowLeftRight, RefreshCw, LogOut, CalendarPlus
} from "lucide-react";

export type HubScreen = "dashboard" | "squad" | "stats" | "history" | "transfers" | "changeClub";

interface HubSidebarProps {
  active: HubScreen;
  onNavigate: (screen: HubScreen) => void;
  onNewSeason: () => void;
  onExitSave: () => void;
}

const navItems: { id: HubScreen; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
  { id: "squad", label: "Elenco", icon: Users },
  { id: "stats", label: "Estatísticas", icon: BarChart3 },
  { id: "history", label: "História", icon: History },
  { id: "transfers", label: "Transferências", icon: ArrowLeftRight },
  { id: "changeClub", label: "Mudar de Clube", icon: RefreshCw },
];

const HubSidebar = ({ active, onNavigate, onNewSeason, onExitSave }: HubSidebarProps) => {
  return (
    <aside className="w-60 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-5 border-b border-sidebar-border">
        <h2 className="font-display text-xl font-bold text-primary tracking-wider">FC 26</h2>
        <p className="text-xs text-muted-foreground mt-1">MODO CARREIRA</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-1">
        <button
          onClick={onNewSeason}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-primary hover:bg-primary/10 transition-all"
        >
          <CalendarPlus size={18} />
          <span>Nova Temporada</span>
        </button>
        <button
          onClick={onExitSave}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut size={18} />
          <span>Sair do Save</span>
        </button>
      </div>
    </aside>
  );
};

export default HubSidebar;
