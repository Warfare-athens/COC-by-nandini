import type { LucideIcon } from "lucide-react";
import {
  Activity, BadgePercent, Boxes, ClipboardCheck, FileText, GalleryHorizontalEnd,
  Handshake, Image, LayoutDashboard, LogIn, MessageSquare, PackageSearch,
  ReceiptText, Settings, ShoppingBag, ShoppingCart, Sparkles, Star, Store, Truck, Users,
} from "lucide-react";

export type AdminNavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  aliases?: string[];
};

export const adminNavigation: AdminNavigationItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, aliases: ["dashboard", "command center", "analytics"] },
  { label: "AI Visibility", href: "/admin/ai-visibility", icon: Sparkles, aliases: ["seo", "aeo", "search"] },
  { label: "Products", href: "/admin/products", icon: ShoppingBag, aliases: ["catalog", "inventory"] },
  { label: "Content", href: "/admin/content", icon: FileText, aliases: ["blogs", "journal"] },
  { label: "Images", href: "/admin/images", icon: Image, aliases: ["media", "library"] },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Templates", href: "/admin/templates", icon: GalleryHorizontalEnd },
  { label: "Partnerships", href: "/admin/partnerships", icon: Handshake },
  { label: "Orders", href: "/admin/orders", icon: Boxes },
  { label: "Invoices", href: "/admin/invoices", icon: ReceiptText, aliases: ["invoice engine"] },
  { label: "Tracking", href: "/admin/tracking", icon: Truck, aliases: ["shipping"] },
  { label: "Stock Requests", href: "/admin/stock-requests", icon: PackageSearch, aliases: ["restock"] },
  { label: "Checkouts", href: "/admin/checkouts", icon: ClipboardCheck },
  { label: "Cart Leads", href: "/admin/cart-leads", icon: ShoppingCart, aliases: ["abandoned carts"] },
  { label: "Coupons", href: "/admin/coupon-leads", icon: BadgePercent, aliases: ["coupon leads", "discounts"] },
  { label: "Feedback", href: "/admin/feedback", icon: MessageSquare },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Login Activity", href: "/admin/login-activity", icon: LogIn, aliases: ["sessions", "logins"] },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Data Export", href: "/admin/data-export", icon: Activity, aliases: ["download", "csv"] },
];

export function isAdminNavigationActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function currentAdminNavigation(pathname: string) {
  return adminNavigation.find((item) => isAdminNavigationActive(pathname, item.href)) ?? {
    label: "Admin", href: "/admin", icon: Store,
  };
}
