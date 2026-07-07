import { Fragment, useState, useEffect, type ElementType, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, Users, BarChart3, History,
  ArrowLeftRight, RefreshCw, LogOut, CalendarPlus,
  ChevronsLeft, ChevronsRight, Menu, X, Shirt,
  Trophy, BriefcaseBusiness, Shield, Bot, Search, Folder, ListChecks, Sliders, Activity, Dna
} from "lucide-react";
import { LogoMark } from "@/shared/ui/Logo";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { canAccessChat } from "@/shared/config/plans";

interface HubSidebarProps {
  userName: string;
  userPlan: string;
  userRole: string;
  saveName: string;
  clubName: string;
  season: string;
  onNewSeason: () => void;
  onExitSave: () => void;
  onSignOut: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const HubSidebar = ({
  userName,
  userPlan,
  userRole,
  saveName,
  clubName,
  season,
  onNewSeason,
  onExitSave,
  onSignOut,
  collapsed,
  onToggleCollapse,
}: HubSidebarProps) => {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapseAnimating, setIsCollapseAnimating] = useState(false);
  const location = useLocation();
  const userInitial = userName.trim().charAt(0).toUpperCase() || "U";
  // Scout is free for everyone; only the AI coach (chatbot) stays behind PRO.
  const canUseChat = canAccessChat(userPlan, userRole);

  const navItems: { to: string; label: string; icon: ElementType }[] = [
    { to: "/dashboard", label: t("sidebar.nav.overview"), icon: LayoutDashboard },
    { to: "/squad", label: t("sidebar.nav.squad"), icon: Users },
    { to: "/field", label: t("sidebar.nav.lineup"), icon: Shirt },
    { to: "/transfers", label: t("sidebar.nav.transfers"), icon: ArrowLeftRight },
    { to: "/stats", label: t("sidebar.nav.stats"), icon: BarChart3 },
    { to: "/history", label: t("sidebar.nav.history"), icon: History },
  ];

  const careerItems: { type: "button" | "link"; label: string; description?: string; icon: ElementType; to?: string; onClick?: "newSeason" }[] = [
    { type: "button", label: t("sidebar.career.newSeason"), description: t("sidebar.career.newSeasonDesc"), icon: CalendarPlus, onClick: "newSeason" },
    { type: "link", label: t("sidebar.career.changeClub"), icon: RefreshCw, to: "/change-club" },
    { type: "link", label: t("sidebar.career.activity"), icon: Activity, to: "/activity" },
  ];

  const scoutItems: { to: string; label: string; icon: ElementType }[] = [
    // The AI coach is the only PRO-gated scout item; hide it for users without chat access.
    ...(canUseChat ? [{ to: "/scout/ia", label: t("sidebar.scout.aiCoach"), icon: Bot }] : []),
    { to: "/scout/filtros", label: t("sidebar.scout.searchPlayers"), icon: Search },
    { to: "/scout/consultas", label: t("sidebar.scout.savedQueries"), icon: Folder },
    { to: "/scout/shortlist", label: t("sidebar.scout.shortlist"), icon: ListChecks },
    { to: "/scout/dna", label: t("sidebar.scout.clubDna"), icon: Dna },
    { to: "/scout/playbooks", label: t("sidebar.scout.playbooks"), icon: Sliders },
  ];

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

  const navLinkClass = ({ isActive }: { isActive: boolean }, isCollapsed = collapsed) =>
    `group relative flex w-full min-w-0 items-center gap-3 rounded-md text-sm font-medium transition-all min-h-[42px] ${
      isCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
    } ${
      isActive
        ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.14)]"
        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    }`;

  const getActionButtonClass = (isCollapsed = collapsed) =>
    `group relative flex w-full min-w-0 items-center gap-3 rounded-md text-sm font-medium transition-all min-h-[42px] ${
      isCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
    } text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`;

  const getPrimaryActionButtonClass = (isCollapsed = collapsed) =>
    `group relative flex w-full min-w-0 items-center gap-3 rounded-md text-sm font-semibold transition-all min-h-[44px] ${
      isCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
    } bg-primary/10 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.18)] hover:bg-primary/15`;

  const getSectionTitleClass = (isCollapsed = collapsed) =>
    isCollapsed
      ? "sr-only"
      : "px-3 text-[10px] font-body font-semibold uppercase tracking-[0.22em] text-muted-foreground/70";

  const renderTooltip = (label: string, children: ReactNode, showTooltip = collapsed) => {
    if (!showTooltip) return children;

    return (
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="right" className="font-body text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  };

  const renderActiveMarker = () => (
    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary opacity-0 transition-opacity group-[.active]:opacity-100" />
  );

  const renderSidebarContent = (contentCollapsed: boolean, enableTourTargets = false) => {
    const collapsed = contentCollapsed;
    const actionButtonClass = getActionButtonClass(collapsed);
    const primaryActionButtonClass = getPrimaryActionButtonClass(collapsed);
    const sectionTitleClass = getSectionTitleClass(collapsed);
    const renderSidebarTooltip = (label: string, children: ReactNode) => renderTooltip(label, children, collapsed);

    return (
      <>
      <div className={`border-b border-sidebar-border bg-gradient-to-b from-primary/5 to-transparent ${collapsed ? "flex justify-center p-3" : "flex items-center gap-2.5 p-4"}`}>
        <LogoMark size={collapsed ? 30 : 28} />
        {!collapsed && (
          <div>
            <p className="font-display text-sm font-bold leading-none text-foreground">FC Career Hub</p>
            <p className="mt-0.5 font-body text-[10px] uppercase tracking-widest text-muted-foreground">{t("sidebar.careerMode")}</p>
          </div>
        )}
      </div>

      <div className={`border-b border-sidebar-border ${collapsed ? "px-2 py-3" : "px-3 py-3"}`}>
        {collapsed ? (
          renderSidebarTooltip(
            `${clubName} · ${season}`,
            <div className="flex justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/12 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.18)]">
                <Shield size={18} />
              </div>
            </div>
          )
        ) : (
          <div className="rounded-md border border-sidebar-border bg-sidebar-accent/45 p-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.18)]">
                <Trophy size={19} />
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold leading-5 text-foreground">{saveName}</p>
                <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <Shield size={13} className="shrink-0 text-primary/80" />
                  <span className="truncate font-medium text-sidebar-accent-foreground">{clubName}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-sidebar-border pt-2">
              <span className="text-[10px] font-body font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("sidebar.season")}</span>
              <span className="rounded-sm bg-primary/10 px-2 py-0.5 font-display text-xs font-bold text-primary">{season}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ScrollArea
          type="auto"
          className={`min-h-0 flex-1 basis-0 ${isCollapseAnimating ? "[&_[data-orientation=vertical]]:opacity-0" : ""}`}
          viewportClassName="overflow-x-hidden px-3 py-4 pr-4"
          scrollbars="vertical"
        >
          <section className="space-y-2 overflow-x-hidden">
            <p className={sectionTitleClass}>{t("sidebar.sections.main")}</p>
            <nav data-tour={enableTourTargets ? "hub-navigation" : undefined} className="space-y-1 overflow-x-hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Fragment key={item.to}>
                    {renderSidebarTooltip(
                      item.label,
                      <NavLink
                        to={item.to}
                        className={({ isActive }) => `${navLinkClass({ isActive }, collapsed)} ${isActive ? "active" : ""}`}
                      >
                        {renderActiveMarker()}
                        <Icon size={18} className="shrink-0" />
                        {!collapsed && <span className="min-w-0 truncate">{item.label}</span>}
                      </NavLink>
                    )}
                  </Fragment>
                );
              })}
            </nav>
          </section>

          <section className="mt-6 space-y-2 overflow-x-hidden border-t border-sidebar-border pt-4">
            <p className={sectionTitleClass}>{t("sidebar.sections.scout")}</p>
            <div className="space-y-1 overflow-x-hidden">
              {scoutItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Fragment key={item.to}>
                    {renderSidebarTooltip(
                      item.label,
                      <NavLink
                        to={item.to}
                        className={({ isActive }) => `${navLinkClass({ isActive }, collapsed)} ${isActive ? "active" : ""}`}
                      >
                        {renderActiveMarker()}
                        <Icon size={18} className="shrink-0" />
                        {!collapsed && <span className="min-w-0 truncate">{item.label}</span>}
                      </NavLink>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </section>

          <section className="mt-6 space-y-2 overflow-x-hidden border-t border-sidebar-border pt-4">
            <p className={sectionTitleClass}>{t("sidebar.sections.career")}</p>
            <div className="space-y-1 overflow-x-hidden">
              {careerItems.map((item) => {
                const Icon = item.icon;

                if (item.type === "link" && item.to) {
                  return (
                    <Fragment key={item.label}>
                      {renderSidebarTooltip(
                        item.label,
                          <NavLink
                            to={item.to}
                            className={({ isActive }) => `${navLinkClass({ isActive }, collapsed)} ${isActive ? "active" : ""}`}
                          >
                          {renderActiveMarker()}
                          <Icon size={18} className="shrink-0" />
                          {!collapsed && <span className="min-w-0 truncate">{item.label}</span>}
                        </NavLink>
                      )}
                    </Fragment>
                  );
                }

                return (
                  <Fragment key={item.label}>
                    {renderSidebarTooltip(
                      item.label,
                      <button
                        onClick={handleNewSeason}
                        data-tour={enableTourTargets ? "hub-new-season" : undefined}
                        className={primaryActionButtonClass}
                      >
                        <Icon size={18} className="shrink-0" />
                        {!collapsed && (
                          <span className="min-w-0 flex-1 text-left">
                            <span className="block truncate">{item.label}</span>
                            {item.description && <span className="block truncate text-[11px] font-normal text-primary/75">{item.description}</span>}
                          </span>
                        )}
                      </button>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </section>

          <section className="mt-6 space-y-2 overflow-x-hidden border-t border-sidebar-border pt-4">
            <p className={sectionTitleClass}>{t("sidebar.sections.workspace")}</p>
            <div className="space-y-1 overflow-x-hidden">
              {renderSidebarTooltip(
                t("sidebar.workspace.switchSave"),
                <button
                  onClick={handleExitSave}
                  className={actionButtonClass}
                >
                  <BriefcaseBusiness size={18} className="shrink-0" />
                  {!collapsed && <span className="min-w-0 truncate">{t("sidebar.workspace.switchSave")}</span>}
                </button>
              )}
            </div>
          </section>

          <section className="mt-6 space-y-2 overflow-x-hidden border-t border-sidebar-border pt-4">
            <p className={sectionTitleClass}>{t("sidebar.sections.account")}</p>
            {!collapsed && (
              <div className="mb-2 flex items-center gap-2 rounded-md px-3 py-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent font-display text-xs font-bold text-sidebar-accent-foreground">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-sidebar-accent-foreground">{userName}</p>
                  <p className="truncate text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{t("sidebar.plan", { plan: userPlan })}</p>
                </div>
              </div>
            )}
            {renderSidebarTooltip(
              t("sidebar.account.signOut"),
              <button
                onClick={handleSignOut}
                className={`flex w-full min-w-0 items-center gap-3 rounded-md text-sm font-medium text-destructive-text transition-all min-h-[42px] hover:bg-destructive/10 ${
                  collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
                }`}
              >
                <LogOut size={18} className="shrink-0" />
                {!collapsed && <span className="min-w-0 truncate">{t("sidebar.account.signOut")}</span>}
              </button>
            )}

            {renderSidebarTooltip(
              collapsed ? t("sidebar.account.expandMenu") : t("sidebar.account.collapseMenu"),
              <button
                onClick={handleToggleSidebar}
                className="hidden md:flex w-full min-w-0 items-center gap-3 overflow-x-hidden rounded-md px-2 py-2.5 text-sm font-medium text-muted-foreground transition-all min-h-[42px] hover:bg-sidebar-accent hover:text-primary"
              >
                {collapsed ? <ChevronsRight size={18} className="shrink-0" /> : <ChevronsLeft size={18} className="shrink-0" />}
                {!collapsed && <span className="min-w-0 flex-1 truncate text-left">{t("sidebar.account.collapse")}</span>}
              </button>
            )}
          </section>
        </ScrollArea>
      </div>
      </>
    );
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-md bg-card border border-border text-foreground hover:text-primary transition-colors"
        aria-label={t("sidebar.aria.openMenu")}
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
        className={`md:hidden fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh w-[min(15rem,calc(100vw-2rem))] flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transform transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3 right-3 p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t("sidebar.aria.closeMenu")}
        >
          <X size={18} />
        </button>
        {renderSidebarContent(false)}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden h-dvh shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transition-all duration-300 md:sticky md:top-0 md:flex ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {renderSidebarContent(collapsed, true)}
      </aside>
    </>
  );
};

export default HubSidebar;
