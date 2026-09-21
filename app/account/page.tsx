import type { Metadata } from "next";
import AccountClient from "./AccountClient";

export const metadata: Metadata = {
  title: "My Account & Orders | Carnival of Clothes",
  description: "View your order history, download tax invoices, track live courier delivery, and manage addresses on Carnival of Clothes.",
};

export default function AccountPage() {
  return <AccountClient />;
}
