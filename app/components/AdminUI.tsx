import type { ReactNode } from "react";
import { AlertCircle, Inbox, Search } from "lucide-react";

export function AdminBreadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return <nav className="admin-breadcrumbs" aria-label="Breadcrumb">{items.map((item, index) => <span key={`${item.label}-${index}`}>{index > 0 && <i aria-hidden="true">/</i>}{item.href ? <a href={item.href}>{item.label}</a> : <b aria-current="page">{item.label}</b>}</span>)}</nav>;
}

export function AdminPageHeader({ eyebrow, title, actions, children }: { eyebrow?: string; title: string; actions?: ReactNode; children?: ReactNode }) {
  return <header className="admin-page-header"><div>{eyebrow && <span className="admin-page-eyebrow">{eyebrow}</span>}<h1>{title}</h1>{children && <div className="admin-page-summary">{children}</div>}</div>{actions && <div className="admin-page-actions">{actions}</div>}</header>;
}

export function AdminStatCard({ label, value, note, tone = "default", icon }: { label: string; value: ReactNode; note?: ReactNode; tone?: "default" | "success" | "warning" | "danger"; icon?: ReactNode }) {
  return <article className={`admin-stat-card is-${tone}`}><div className="admin-stat-label"><span>{label}</span>{icon}</div><strong>{value}</strong>{note && <small>{note}</small>}</article>;
}

export function AdminPanel({ title, description, actions, children, className = "" }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`admin-panel ${className}`.trim()}>{(title || actions) && <div className="admin-panel-head"><div>{title && <h2>{title}</h2>}{description && <p>{description}</p>}</div>{actions}</div>}{children}</section>;
}

export function AdminDataTable({ columns, children, className = "" }: { columns: ReactNode[]; children: ReactNode; className?: string }) {
  return <div className="admin-table-wrap"><table className={`admin-table ${className}`.trim()}><thead><tr>{columns.map((column, index) => <th key={index}>{column}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}

export function AdminToolbar({ searchPlaceholder = "Search…", children }: { searchPlaceholder?: string; children?: ReactNode }) {
  return <div className="admin-toolbar"><label className="admin-search-field"><Search size={18} /><input type="search" name="q" placeholder={searchPlaceholder} /></label>{children && <div className="admin-toolbar-actions">{children}</div>}</div>;
}

export function AdminStatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  return <span className={`admin-status-badge is-${tone}`}>{children}</span>;
}

export function AdminEmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return <div className="admin-empty-state"><span><Inbox size={23} /></span><h3>{title}</h3>{children && <p>{children}</p>}{action}</div>;
}

export function AdminErrorState({ title = "Something went wrong", children }: { title?: string; children?: ReactNode }) {
  return <div className="admin-error-state" role="alert"><AlertCircle size={22} /><div><h3>{title}</h3>{children && <p>{children}</p>}</div></div>;
}

export function AdminFormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="admin-form-section"><div className="admin-form-section-head"><h2>{title}</h2>{description && <p>{description}</p>}</div><div className="admin-form-section-content">{children}</div></section>;
}

export function AdminStickyActions({ children }: { children: ReactNode }) {
  return <div className="admin-sticky-actions">{children}</div>;
}

export function AdminMobileCard({ title, meta, status, children, href }: { title: ReactNode; meta?: ReactNode; status?: ReactNode; children?: ReactNode; href?: string }) {
  const body = <><div className="admin-mobile-card-head"><strong>{title}</strong>{status}</div>{meta && <div className="admin-mobile-card-meta">{meta}</div>}{children && <div className="admin-mobile-card-body">{children}</div>}</>;
  return href ? <a className="admin-mobile-card" href={href}>{body}</a> : <article className="admin-mobile-card">{body}</article>;
}
