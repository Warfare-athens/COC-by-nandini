"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Command, ExternalLink, LogOut, Menu, Search, UserRound, X } from "lucide-react";
import { adminNavigation, currentAdminNavigation, isAdminNavigationActive } from "@/app/components/admin-navigation";
import AdminResponsiveTables from "@/app/components/AdminResponsiveTables";

const RAIL_KEY = "coc-admin-rail-expanded";

function focusableElements(container: HTMLElement | null) {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'));
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [railExpanded, setRailExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [query, setQuery] = useState("");
  const drawerRef = useRef<HTMLElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const page = currentAdminNavigation(pathname);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setRailExpanded(window.localStorage.getItem(RAIL_KEY) === "true"));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => { setMobileOpen(false); setPaletteOpen(false); setAccountOpen(false); setQuery(""); });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPaletteOpen(true); return; }
      if (event.key === "Escape") {
        if (paletteOpen) setPaletteOpen(false);
        else if (mobileOpen) { setMobileOpen(false); menuButtonRef.current?.focus(); }
        else setAccountOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, paletteOpen]);

  useEffect(() => {
    if (!mobileOpen && !paletteOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const container = paletteOpen ? paletteRef.current : drawerRef.current;
    const elements = focusableElements(container);
    (paletteOpen ? searchRef.current : elements[0])?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const current = focusableElements(container);
      if (!current.length) return;
      const first = current[0]; const last = current[current.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", trap); };
  }, [mobileOpen, paletteOpen]);

  const filteredNavigation = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return adminNavigation;
    return adminNavigation.filter((item) => [item.label, item.href, ...(item.aliases ?? [])].some((value) => value.toLowerCase().includes(needle)));
  }, [query]);

  const toggleRail = () => {
    if (window.matchMedia("(max-width: 1100px)").matches) { setMobileOpen((open) => !open); return; }
    setRailExpanded((expanded) => { window.localStorage.setItem(RAIL_KEY, String(!expanded)); return !expanded; });
  };
  const logout = async () => {
    setLoggingOut(true);
    try { await fetch("/api/admin/session", { method: "DELETE" }); }
    finally { window.location.assign("/admin/access"); }
  };
  const goTo = (href: string) => { setPaletteOpen(false); router.push(href); };

  return <div className={`admin-root ${railExpanded ? "admin-rail-is-expanded" : "admin-rail-is-collapsed"}`}>
    <aside ref={drawerRef} className={`admin-rail ${mobileOpen ? "is-mobile-open" : ""}`} id="admin-navigation" aria-label="Admin navigation">
      <div className="admin-rail-head">
        <a href="/admin" className="admin-brand" aria-label="Carnival of Clothes admin overview"><span className="admin-brand-mark">C</span><span className="admin-brand-copy"><strong>Carnival of Clothes</strong><small>Store control</small></span></a>
        <button className="admin-mobile-close" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={20} /></button>
      </div>
      <nav className="admin-nav">{adminNavigation.map((item) => {
        const Icon = item.icon; const active = isAdminNavigationActive(pathname, item.href);
        return <a className={active ? "active" : ""} href={item.href} key={item.href} title={!railExpanded ? item.label : undefined} aria-current={active ? "page" : undefined}><Icon size={20} strokeWidth={1.8} aria-hidden="true" /><span>{item.label}</span><span className="admin-nav-tooltip" role="tooltip">{item.label}</span></a>;
      })}</nav>
      <div className="admin-rail-foot"><button type="button" onClick={() => setRailExpanded((expanded) => { window.localStorage.setItem(RAIL_KEY, String(!expanded)); return !expanded; })} aria-label={railExpanded ? "Collapse navigation" : "Expand navigation"}>{railExpanded ? <ChevronsLeft size={19} /> : <ChevronsRight size={19} />}<span>{railExpanded ? "Collapse menu" : "Expand menu"}</span></button></div>
    </aside>
    {mobileOpen && <button className="admin-drawer-overlay" type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <div className="admin-workspace">
      <header className="admin-topbar">
        <div className="admin-topbar-leading"><button ref={menuButtonRef} className="admin-icon-button" type="button" onClick={toggleRail} aria-label="Toggle navigation" aria-controls="admin-navigation" aria-expanded={mobileOpen || railExpanded}><Menu size={21} /></button><div className="admin-current-page"><small>Store control</small><strong>{page.label}</strong></div></div>
        <div className="admin-topbar-actions">
          <button className="admin-command-button" type="button" onClick={() => setPaletteOpen(true)} aria-haspopup="dialog" aria-label="Open quick navigation"><Search size={17} /><span>Quick navigation</span><kbd>⌘ K</kbd></button>
          <a className="admin-storefront-button" href="/" target="_blank" rel="noopener noreferrer" aria-label="Open storefront in a new tab"><ExternalLink size={17} /><span>Storefront</span></a>
          <div className="admin-account"><button className="admin-account-button" type="button" onClick={() => setAccountOpen((open) => !open)} aria-label="Open account menu" aria-expanded={accountOpen} aria-haspopup="menu"><UserRound size={18} /><span>Admin</span></button>{accountOpen && <div className="admin-account-menu" role="menu"><a href="/" target="_blank" rel="noopener noreferrer" role="menuitem"><ExternalLink size={17} />View storefront</a><button type="button" onClick={logout} disabled={loggingOut} role="menuitem"><LogOut size={17} />{loggingOut ? "Logging out…" : "Log out"}</button></div>}</div>
        </div>
      </header>
      <main className="admin-main" id="admin-main-content"><AdminResponsiveTables />{children}</main>
    </div>
    {paletteOpen && <div className="admin-dialog-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPaletteOpen(false); }}><div className="admin-command-palette" ref={paletteRef} role="dialog" aria-modal="true" aria-label="Quick navigation"><div className="admin-command-search"><Search size={20} /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search admin pages…" aria-label="Search admin pages" /><button type="button" onClick={() => setPaletteOpen(false)} aria-label="Close quick navigation"><X size={18} /></button></div><div className="admin-command-results">{filteredNavigation.map((item) => { const Icon = item.icon; return <button type="button" key={item.href} onClick={() => goTo(item.href)}><Icon size={19} /><span><strong>{item.label}</strong><small>{item.href}</small></span><Command size={15} aria-hidden="true" /></button>; })}{!filteredNavigation.length && <p>No admin pages match “{query}”.</p>}</div></div></div>}
  </div>;
}
