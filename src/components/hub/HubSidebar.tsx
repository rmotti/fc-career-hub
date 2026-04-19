import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, BarChart3, History,
  ArrowLeftRight, RefreshCw, LogOut, CalendarPlus,
  ChevronsLeft, ChevronsRight, Menu, X, Shirt
} from "lucide-react";
import { LogoMark } from "@/components/Logo";

interface HubSidebarProps {
  userName: string;
  userPlan: string;
  onNewSeason: () => void;
  onExitSave: () => void;
  onSignOut: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems: { to: string; label: string; icon: React.ElementType }[] = [
  { to: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
  { to: "/squad", label: "Elenco", icon: Users },
  { to: "/field", label: "Escalação", icon: Shirt },
  { to: "/stats", label: "Estatísticas", icon: BarChart3 },
  { to: "/transfers", label: "Transferências", icon: ArrowLeftRight },
  { to: "/history", label: "História", icon: History },
];

const adminItems: { type: "button" | "link"; label: string; icon: React.ElementType; to?: string; onClick?: "newSeason" | "exitSave" }[] = [
  { type: "button", label: "Nova Temporada", icon: CalendarPlus, onClick: "newSeason" },
  { type: "button", label: "Mudar Save", icon: ArrowLeftRight, onClick: "exitSave" },
  { type: "link", label: "Mudar de Clube", icon: RefreshCw, to: "/change-club" },
];

const HubSidebar = ({
  userName,
  userPlan,
  onNewSeason,
  onExitSave,
  onSignOut,
  collapsed,
  onToggleCollapse,
}: HubSidebarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapseAnimating, setIsCollapseAnimating] = useState(false);
  const location = useLocation();
  const userInitial = userName.trim().charAt(0).toUpperCase() || "U";

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isCollapseAnimating) return;

    const timer = window.setTimeout(() => {
      setIsCollapseAnimating(false);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [isCollapseAnimating]);

  const handleNewSeason = () => {
    onNewSeason();
    setMobileOpen(false);
  };

  const handleExitSave = () => {
    onExitSave();
    setMobileOpen(false);
  };

  const handleSignOut = () => {
    onSignOut();
    setMobileOpen(false);
  };

  const handleToggleSidebar = () => {
    setIsCollapseAnimating(true);
    onToggleCollapse();
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex w-full min-w-0 items-center gap-3 rounded-md text-sm font-medium transition-all min-h-[44px] ${
      collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
    } ${
      isActive
        ? "bg-primary/10 text-primary border border-primary/20"
        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    }`;

  const actionButtonClass =
    `flex w-full min-w-0 items-center gap-3 rounded-md text-sm font-medium transition-all min-h-[44px] ${
      collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
    } text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`;

  const sectionTitleClass = collapsed
    ? "sr-only"
    : "px-3 text-[11px] font-body font-semibold uppercase tracking-[0.2em] text-muted-foreground/70";

  const sidebarContent = (
    <>
      <div className={`border-b border-sidebar-border ${collapsed ? "flex justify-center p-3" : "flex items-center gap-2.5 p-4"}`}>
        <LogoMark size={collapsed ? 30 : 28} />
        {!collapsed && (
          <div>
            <p className="font-display text-sm font-bold leading-none text-foreground">FC 26 Hub</p>
            <p className="mt-0.5 font-body text-[10px] uppercase tracking-widest text-muted-foreground">Modo Carreira</p>
          </div>
        )}
      </div>

      <div className={`border-b border-sidebar-border ${collapsed ? "px-2 py-3" : "px-4 py-4"}`}>
        {collapsed ? (
          <div className="flex justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 font-display text-sm font-bold text-primary">
              {userInitial}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display text-sm font-bold text-primary">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold text-foreground">{userName}</p>
              <p className="mt-0.5 text-[11px] font-body uppercase tracking-[0.18em] text-muted-foreground">
                Plano {userPlan}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className={`min-h-0 flex-1 overflow-x-hidden px-3 py-4 ${isCollapseAnimating ? "overflow-y-hidden" : "overflow-y-auto"}`}>
          <section className="space-y-2 overflow-x-hidden">
            <p className={sectionTitleClass}>Principal</p>
            <nav className="space-y-1 overflow-x-hidden">
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
                      {!collapsed && <span className="min-w-0 truncate">{item.label}</span>}
                    </NavLink>
                  );
              })}
            </nav>
          </section>

          <section className="mt-6 space-y-2 overflow-x-hidden border-t border-sidebar-border pt-4">
            <p className={sectionTitleClass}>Administração</p>
            <div className="space-y-1 overflow-x-hidden">
              {adminItems.map((item) => {
                const Icon = item.icon;

                if (item.type === "link" && item.to) {
                  return (
                    <NavLink
                      key={item.label}
                      to={item.to}
                      title={collapsed ? item.label : undefined}
                      className={navLinkClass}
                    >
                      <Icon size={18} />
                      {!collapsed && <span className="min-w-0 truncate">{item.label}</span>}
                    </NavLink>
                  );
                }

                const onClick = item.onClick === "newSeason" ? handleNewSeason : handleExitSave;

                return (
                  <button
                    key={item.label}
                    onClick={onClick}
                    title={collapsed ? item.label : undefined}
                    className={actionButtonClass}
                  >
                    <Icon size={18} />
                    {!collapsed && <span className="min-w-0 truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="overflow-x-hidden border-t border-sidebar-border p-3">
          <section className="space-y-2 overflow-x-hidden">
            <p className={sectionTitleClass}>Conta</p>
            <button
              onClick={handleSignOut}
              title={collapsed ? "Sair da conta" : undefined}
              className={`flex w-full min-w-0 items-center gap-3 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-all min-h-[44px] ${
                collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
              }`}
            >
              <LogOut size={18} />
              {!collapsed && <span className="min-w-0 truncate">Sair da Conta</span>}
            </button>

            <button
              onClick={handleToggleSidebar}
              title={collapsed ? "Expandir menu" : "Recolher menu"}
              className="hidden md:flex w-full min-w-0 items-center gap-3 rounded-md text-sm font-medium text-muted-foreground hover:text-primary hover:bg-sidebar-accent transition-all min-h-[44px] justify-center overflow-x-hidden px-2 py-2.5"
            >
              {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
              {!collapsed && <span className="min-w-0 flex-1 truncate text-left">Recolher</span>}
            </button>
          </section>
        </div>
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
        className={`hidden md:flex md:sticky md:top-0 h-screen shrink-0 overflow-hidden flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default HubSidebar;
