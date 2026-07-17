import type { ReactNode } from "react";

export default function AdminShell({ children }: { children: ReactNode }) {
  return <div className="admin-root"><div className="admin-shell"><aside className="admin-sidebar"><a href="/admin" className="admin-brand">Carnival of Clothes<small>STORE CONTROL</small></a><nav className="admin-nav"><a href="/admin">Overview</a><a href="/admin/products">Products</a><a href="/admin/orders">Orders</a><a href="/admin/settings">Store settings</a><a href="/shop">View storefront</a></nav></aside><main className="admin-main">{children}</main></div></div>;
}
