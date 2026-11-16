import type { ReactNode } from "react";
import { AlertCircle, Inbox, Search } from "lucide-react";

export function AdminPageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return <>
    <h1 className="sr-only">{title}</h1>
    {actions && <div className="admin-page-tools">{actions}</div>}
  </>;
}

export function AdminStatCard({ label, value, note, tone = "default", icon }: { label: string; value: ReactNode; note?: ReactNode; tone?: "default" | "success" | "warning" | "danger"; icon?: ReactNode }) {
  return <article className={`admin-stat-card is-${tone}`}><div className="admin-stat-label"><span>{label}</span>{icon}</div><strong>{value}</strong>{note && <small>{note}</small>}</article>;
}

export function AdminPanel({ title, description, actions, children, className = "" }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`admin-panel ${className}`.trim()}>{(title || actions) && <div className="admin-panel-head"><div>{title && <h2>{title}</h2>}{description && <p>{description}</p>}</div>{actions}</div>}{children}</section>;
}

export function AdminDataTable({ columns, children, className = "", dateFiltered }: { columns: ReactNode[]; children: ReactNode; className?: string; dateFiltered?: boolean }) {
  return <div className="admin-table-wrap"><table className={`admin-table ${className}`.trim()} data-admin-date-filtered={dateFiltered || undefined}><thead><tr>{columns.map((column, index) => <th key={index} scope="col">{column}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}

export function AdminCustomerLines({ name, email, phone, address, status }: { name?: unknown; email?: unknown; phone?: unknown; address: Record<string, unknown>; status?: ReactNode }) {
  const line = (...values: unknown[]) => values.filter(Boolean).map(String).join(", ");
  const addressLines = [line(address.line1), line(address.line2), line(address.city, address.state, address.postal_code), line(address.country)].filter(Boolean);
  return <div className="admin-customer-lines">
    {Boolean(name) && <strong>{String(name)}</strong>}
    {Boolean(email) && <span>{String(email)}</span>}
    {Boolean(phone) && <span>{String(phone)}</span>}
    {addressLines.length > 0 && <address>{addressLines.map((value, index) => <div key={index}>{value}</div>)}</address>}
    {status && <div className="admin-commerce-actions">{status}</div>}
  </div>;
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
