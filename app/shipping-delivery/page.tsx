import type { Metadata } from "next";
import CustomerPage, { customerPageStyles as styles } from "@/app/components/CustomerPage";

export const metadata: Metadata = { title: "Shipping and Delivery", description: "Carnival of Clothes shipping charges, processing times, delivery estimates and tracking information for orders across India.", alternates: { canonical: "/shipping-delivery" } };

export default function ShippingPage() {
  return <CustomerPage eyebrow="ORDER JOURNEY" title="Shipping & delivery" intro="Clear delivery information for Carnival of Clothes orders shipped within India.">
    <section className={styles.grid}><div className={styles.card}><h3>Shipping charge</h3><p>₹149 for orders below ₹2,999.</p></div><div className={styles.card}><h3>Free shipping</h3><p>Automatically applied to orders of ₹2,999 or more.</p></div><div className={styles.card}><h3>Processing</h3><p>Orders are normally prepared within 1–3 business days.</p></div><div className={styles.card}><h3>Transit estimate</h3><p>Delivery generally takes 3–7 business days after dispatch.</p></div></section>
    <section><h2>Delivery information</h2><p>Delivery estimates begin after dispatch and may vary by PIN code, courier availability, public holidays, weather or other circumstances beyond our control. Please provide a complete address and reachable phone number at checkout.</p><p>Once tracking is available, use your order number and checkout email on the <a href="/track-order">Track Order</a> page.</p></section>
    <section><h2>Delays and unsuccessful delivery</h2><p>If a parcel is delayed beyond the expected window, contact us on WhatsApp. Courier partners may attempt delivery more than once. Additional shipping charges may apply when an order is returned because of an incorrect address, repeated unavailability or refusal to accept a confirmed order.</p></section>
    <section className={styles.note}><p>Need help before ordering? <a href="/contact">Contact Carnival of Clothes</a> with your PIN code and the product you are considering.</p></section>
  </CustomerPage>;
}
