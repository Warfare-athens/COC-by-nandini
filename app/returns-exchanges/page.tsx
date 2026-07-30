import type { Metadata } from "next";
import CustomerPage, { customerPageStyles as styles } from "@/app/components/CustomerPage";

export const metadata: Metadata = { title: "Returns and Exchanges", description: "Read the Carnival of Clothes seven-day returns and exchanges policy, eligibility conditions and request process.", alternates: { canonical: "/returns-exchanges" } };

export default function ReturnsPage() {
  return <CustomerPage eyebrow="SHOP WITH CLARITY" title="Returns & exchanges" intro="If something is not right, contact us within seven calendar days of delivery so we can review your request.">
    <section><h2>Eligibility</h2><ul><li>The item must be unused, unworn, unwashed and in its original condition.</li><li>All tags, packaging and accessories supplied with the item must be intact.</li><li>Share the order number and clear photographs when requesting a return or exchange.</li><li>The request must be raised within seven calendar days of recorded delivery.</li></ul></section>
    <section><h2>Items that cannot be returned</h2><p>For hygiene and fairness, worn, altered, washed, damaged or tagless products cannot be accepted. Accessories intended for pierced use, personalised items, final-sale items and products damaged through improper care are also excluded unless they arrived defective or incorrect.</p></section>
    <section><h2>How to request</h2><ol><li>Message <a href="https://wa.me/919662143635">+91 96621 43635 on WhatsApp</a> with your order number.</li><li>Tell us whether you prefer a return or size exchange and explain the reason.</li><li>Wait for confirmation and return instructions before sending the item.</li><li>Pack the approved item securely and hand it to the arranged courier or use the provided return instructions.</li></ol></section>
    <section className={styles.grid}><div className={styles.card}><h3>Refunds</h3><p>Approved refunds are initiated to the original payment method after inspection. Banks and payment providers may require 5–10 business days to reflect the amount.</p></div><div className={styles.card}><h3>Exchanges</h3><p>Size exchanges depend on stock availability. If the requested size is unavailable, we will discuss the available resolution with you.</p></div></section>
    <section className={styles.note}><p>Received an incorrect, damaged or defective product? Contact us within 48 hours of delivery with unboxing and product photographs so we can prioritise the issue.</p></section>
  </CustomerPage>;
}
