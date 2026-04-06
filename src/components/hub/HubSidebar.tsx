import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, BarChart3, History,
  ArrowLeftRight, RefreshCw, LogOut, CalendarPlus,
  ChevronsLeft, ChevronsRight, Menu, X
} from "lucide-react";

interface HubSidebarProps {
  onNewSeason: () => void;
  onExitSave: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems: { to: string; label: string; icon: React.ElementType }[] = [
  { to: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
  { to: "/squad", label: "Elenco", icon: Users },
  { to: "/stats", label: "Estatísticas", icon: BarChart3 },
  { to: "/history", label: "História", icon: History },
  { to: "/transfers", label: "Transferências", icon: ArrowLeftRight },
  { to: "/change-club", label: "Mudar de Clube", icon: RefreshCw },
];

const HubSidebar = ({ onNewSeason, onExitSave, collapsed, onToggleCollapse }: HubSidebarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleNewSeason = () => {
    onNewSeason();
    setMobileOpen(false);
  };

  const handleExitSave = () => {
    onExitSave();
    setMobileOpen(false);
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `w-full flex items-center gap-3 rounded-md text-sm font-medium transition-all min-h-[44px] ${
      collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
    } ${
      isActive
        ? "bg-primary/10 text-primary border border-primary/20"
        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    }`;

  const sidebarContent = (
    <>
      <div className={`border-b border-sidebar-border ${collapsed ? "p-3" : "p-5"}`}>
        <h2 className={`font-display font-bold text-primary tracking-wider ${collapsed ? "text-center text-sm" : "text-xl"}`}>
          {collapsed ? "FC" : "FC 26"}
        </h2>
        {!collapsed && <p className="text-xs text-muted-foreground mt-1">MODO CARREIRA</p>}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={navLinkClass}
            >
              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-1">
        <button
          onClick={handleNewSeason}
          title={collapsed ? "Nova Temporada" : undefined}
          className={`w-full flex items-center gap-3 rounded-md text-sm font-medium text-primary hover:bg-primary/10 transition-all min-h-[44px] ${
            collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
          }`}
        >
          <CalendarPlus size={18} />
          {!collapsed && <span>Nova Temporada</span>}
        </button>
        <button
          onClick={handleExitSave}
          title={collapsed ? "Sair do Save" : undefined}
          className={`w-full flex items-center gap-3 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-all min-h-[44px] ${
            collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
          }`}
        >
          <LogOut size={18} />
          {!collapsed && <span>Sair do Save</span>}
        </button>

        {/* Collapse toggle - desktop only */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          className="hidden md:flex w-full items-center gap-3 rounded-md text-sm font-medium text-muted-foreground hover:text-primary hover:bg-sidebar-accent transition-all min-h-[44px] justify-center px-2 py-2.5 mt-2"
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          {!collapsed && <span className="flex-1 text-left">Recolher</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-md bg-card border border-border text-foreground hover:text-primary transition-colors"
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-60 bg-sidebar border-r border-sidebar-border flex flex-col transform transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3 right-3 p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col min-h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default HubSidebar;
