import type { Metadata } from "next";
import CustomerPage, { customerPageStyles as styles } from "@/app/components/CustomerPage";

export const metadata: Metadata = { title: "Contact Carnival of Clothes", description: "Contact Carnival of Clothes by Nandini in Ahmedabad for product, sizing, order and delivery assistance.", alternates: { canonical: "/contact" } };

export default function ContactPage() {
  return <CustomerPage eyebrow="WE ARE HERE TO HELP" title="Contact Carnival of Clothes" intro="Questions about an outfit, size, order or delivery? Reach our Ahmedabad team through the channel that suits you.">
    <section className={styles.grid}><div className={styles.contactCard}><h2>WhatsApp</h2><p>For product advice, sizing help and order support.</p><p><a href="https://wa.me/919662143635" target="_blank" rel="noopener noreferrer">Message +91 96621 43635 →</a></p></div><div className={styles.contactCard}><h2>Instagram</h2><p>Follow new arrivals, styling inspiration and collection updates.</p><p><a href="https://www.instagram.com/carnivalofclothes/" target="_blank" rel="noopener noreferrer">@carnivalofclothes →</a></p></div></section>
    <section><h2>Before contacting us</h2><ul><li>For an existing order, keep your Carnival order number and checkout email ready.</li><li>For sizing advice, share the product name and your bust, waist and hip measurements.</li><li>For returns, contact us within seven calendar days of delivery and include clear product photographs.</li></ul></section>
    <section className={styles.note}><h3>Order tracking</h3><p>You can also check fulfilment updates at any time using our <a href="/track-order">order tracking page</a>.</p></section>
  </CustomerPage>;
}
