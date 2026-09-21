import Image from "next/image";
import type { InvoiceRow } from "@/lib/invoice";
import InvoiceActions from "./InvoiceActions";
import styles from "./InvoiceDocument.module.css";

const text = (value: unknown, fallback = "—") => value === null || value === undefined || value === "" ? fallback : String(value);
const money = (value: unknown) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const humanize = (value: unknown) => text(value).replaceAll("_", " ");

export default function InvoiceDocument({ order, backHref, backLabel }: { order: InvoiceRow; backHref: string; backLabel?: string }) {
  const address = (order.addresses || {}) as InvoiceRow;
  const items = (order.order_items || []) as InvoiceRow[];
  const invoiceNumber = `INV-${text(order.order_number)}`;
  const orderDate = new Date(text(order.placed_at)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <main className={styles.canvas} data-invoice-page>
      <InvoiceActions backHref={backHref} backLabel={backLabel} />
      <article className={styles.document} aria-label={`Invoice ${invoiceNumber}`}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <Image src="/favicon-logo.png" alt="Carnival of Clothes" width={64} height={64} priority />
            <div><h1>Carnival of Clothes</h1><p>by Nandini · Ahmedabad, Gujarat, India</p></div>
          </div>
          <div className={styles.contact}><b>carnivalofclothes.com</b><span>+91 96621 43635</span><span>Ahmedabad, Gujarat</span></div>
        </header>

        <section className={styles.title}>
          <div><small>ORDER INVOICE</small><h2>{invoiceNumber}</h2></div>
          <dl><dt>Order number</dt><dd>{text(order.order_number)}</dd><dt>Order date</dt><dd>{orderDate}</dd><dt>Payment</dt><dd>{humanize(order.payment_method)} · {humanize(order.payment_status)}</dd></dl>
        </section>

        <section className={styles.addresses}>
          <div><small>BILL TO</small><strong>{text(address.full_name)}</strong><p>{text(order.email)}<br />{text(order.phone)}</p></div>
          <div><small>SHIP TO</small><strong>{text(address.full_name)}</strong><p>{text(address.line1)}{address.line2 ? `, ${text(address.line2)}` : ""}<br />{text(address.city)}, {text(address.state)} {text(address.postal_code)}<br />{text(address.country)}</p></div>
        </section>

        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>Item</th><th>SKU</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
            <tbody>{items.map((item) => <tr key={text(item.id)}><td><b>{text(item.product_name)}</b><span>{text(item.variant_title, "")}</span></td><td>{text(item.sku)}</td><td>{text(item.quantity)}</td><td>{money(item.unit_price_inr)}</td><td>{money(item.total_inr)}</td></tr>)}</tbody>
          </table>
        </div>

        <section className={styles.summary}>
          <div><span>Subtotal</span><b>{money(order.subtotal_inr)}</b><span>Discount</span><b>− {money(order.discount_inr)}</b><span>Shipping</span><b>{Number(order.shipping_inr || 0) ? money(order.shipping_inr) : "Free"}</b>{Number(order.tax_inr || 0) > 0 && <><span>Tax</span><b>{money(order.tax_inr)}</b></>}<strong>Total</strong><strong>{money(order.total_inr)}</strong></div>
        </section>

        <footer className={styles.footer}><p>Thank you for shopping with Carnival of Clothes.</p><span>This is a computer-generated order invoice and does not require a signature.</span></footer>
      </article>
    </main>
  );
}
