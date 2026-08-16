"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@kodan/ui/lib/utils";

import { AppSidebar, type SidebarUser } from "@/components/app-sidebar";
import { APP_ROUTE_PREFIXES } from "@/components/app-route-prefixes";

export function AppShell({ children, user }: { children: ReactNode; user: SidebarUser | null }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopViewport, setDesktopViewport] = useState(false);
  const mobileSidebarRef = useRef<HTMLDivElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const restoreMobileFocusRef = useRef(false);
  const isAppRoute = APP_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateViewport = () => setDesktopViewport(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    if (!mobileSidebarOpen || desktopViewport) return;

    restoreMobileFocusRef.current = true;
    const sidebar = mobileSidebarRef.current;
    const getFocusableElements = () => Array.from(
      sidebar?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [],
    );
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileSidebarOpen(false);
        return;
      }

      if (event.key !== "Tab") return;
      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);
      if (!firstElement || !lastElement) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    window.requestAnimationFrame(() => sidebar?.querySelector<HTMLElement>('[data-sidebar-close="true"]')?.focus());

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [desktopViewport, mobileSidebarOpen]);

  useEffect(() => {
    if (mobileSidebarOpen || !restoreMobileFocusRef.current) return;

    restoreMobileFocusRef.current = false;
    const animationFrame = window.requestAnimationFrame(() => mobileTriggerRef.current?.focus());
    return () => window.cancelAnimationFrame(animationFrame);
  }, [mobileSidebarOpen]);

  if (!isAppRoute) return <>{children}</>;

  return (
    <div data-kodan-shell="true" className="flex h-svh overflow-hidden bg-[var(--profile-bg)] text-[var(--profile-text-primary)]">
      <div
        ref={mobileSidebarRef}
        role={!desktopViewport && mobileSidebarOpen ? "dialog" : undefined}
        aria-modal={!desktopViewport && mobileSidebarOpen ? true : undefined}
        aria-label={!desktopViewport && mobileSidebarOpen ? "Navegação principal" : undefined}
        inert={!desktopViewport && !mobileSidebarOpen ? true : undefined}
        className={cn("fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:relative lg:translate-x-0", mobileSidebarOpen ? "translate-x-0" : "-translate-x-full")}
      >
        <AppSidebar collapsed={sidebarCollapsed} mobileOpen={mobileSidebarOpen} pathname={pathname} user={user} onCloseMobile={() => setMobileSidebarOpen(false)} onToggle={() => setSidebarCollapsed((value) => !value)} />
      </div>
      {mobileSidebarOpen ? <button type="button" onClick={() => setMobileSidebarOpen(false)} aria-label="Fechar navegação" className="fixed inset-0 z-40 bg-black/60 lg:hidden" /> : null}
      {!mobileSidebarOpen ? <button ref={mobileTriggerRef} type="button" onClick={() => setMobileSidebarOpen(true)} aria-label="Abrir navegação" className="fixed left-3 top-3 z-30 grid size-11 place-items-center rounded-xl border border-[color:var(--profile-border)] bg-[var(--profile-surface)] text-[var(--profile-text-secondary)] lg:hidden"><Menu className="size-5" /></button> : null}
      <main className="h-svh min-w-0 flex-1 overflow-y-auto overscroll-contain">{children}</main>
    </div>
  );
}
