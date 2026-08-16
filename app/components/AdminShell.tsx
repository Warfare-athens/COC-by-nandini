"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useState } from "react";

const primary = [
  ["Overview", "/admin"], ["AI Visibility", "/admin/ai-visibility"],
  ["Catalog", "/admin/products"], ["Content", "/admin/content"],
  ["Images", "/admin/images"], ["Reviews", "/admin/reviews"],
  ["Templates", "/admin/templates"], ["Partnerships", "/admin/partnerships"],
] as const;
const sales = [
  ["Orders", "/admin/orders"], ["Invoice Engine", "/admin/invoices"],
  ["Tracking", "/admin/tracking"], ["Stock Requests", "/admin/stock-requests"],
  ["Checkouts", "/admin/checkouts"], ["Cart Leads", "/admin/cart-leads"],
  ["Coupon Leads", "/admin/coupon-leads"],
] as const;
const manage = [
  ["Feedback", "/admin/feedback"], ["Customers", "/admin/customers"],
  ["Login Activity", "/admin/login-activity"], ["Settings", "/admin/settings"],
  ["Data Export", "/admin/data-export"],
] as const;

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const navLink = ([label, href]: readonly [string, string]) => {
    const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
    return <a className={active ? "active" : ""} href={href} key={href}><span>{label}</span></a>;
  };
  const logout = async () => {
    setLoggingOut(true);
    await fetch("/api/admin/session", { method: "DELETE" });
    window.location.assign("/admin/access");
  };
  return <div className="admin-root"><div className="admin-shell"><aside className="admin-sidebar">
    <a href="/admin" className="admin-brand">Carnival of Clothes<small>STORE CONTROL</small></a>
    <nav className="admin-nav" aria-label="Admin navigation">
      <div className="admin-nav-group">{primary.map(navLink)}</div>
      <small className="admin-nav-label">Sales</small><div className="admin-nav-group">{sales.map(navLink)}</div>
      <small className="admin-nav-label">Manage</small><div className="admin-nav-group">{manage.map(navLink)}</div>
    </nav>
    <div className="admin-sidebar-foot"><a href="/" target="_blank" rel="noopener noreferrer">View storefront ↗</a><button type="button" onClick={logout} disabled={loggingOut}>{loggingOut ? "Logging out…" : "Log out"}</button></div>
  </aside><main className="admin-main">{children}</main></div></div>;
}
