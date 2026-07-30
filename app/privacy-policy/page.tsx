import type { Metadata } from "next";
import CustomerPage from "@/app/components/CustomerPage";

export const metadata: Metadata = { title: "Privacy Policy", description: "How Carnival of Clothes collects, uses, protects and shares customer information.", alternates: { canonical: "/privacy-policy" }, robots: { index: true, follow: true } };

export default function PrivacyPage() {
  return <CustomerPage eyebrow="YOUR INFORMATION" title="Privacy policy" intro="This policy explains how Carnival of Clothes by Nandini handles information when you browse, contact us or place an order. Last updated 30 July 2026.">
    <section><h2>Information we collect</h2><p>We may collect your name, email address, phone number, delivery and billing address, order details, customer-support messages, product preferences and technical information such as device, browser, IP address and website interactions.</p></section>
    <section><h2>How we use information</h2><ul><li>Process payments, orders, deliveries, returns and customer support.</li><li>Prevent fraud, protect the store and comply with legal obligations.</li><li>Improve products, website performance and the shopping experience.</li><li>Send service messages and, where permitted, relevant marketing communications.</li></ul></section>
    <section><h2>Payments and service providers</h2><p>Payment details are processed by authorised payment providers and are not stored by us as complete card or banking credentials. We may share necessary information with hosting, database, payment, email, image, analytics and delivery providers solely to operate the store.</p></section>
    <section><h2>Cookies and analytics</h2><p>Cookies and similar technologies may remember your cart, maintain security, measure website usage and improve functionality. You can restrict cookies through your browser, although parts of the store may then work differently.</p></section>
    <section><h2>Retention, security and your choices</h2><p>We retain information only for as long as reasonably required for orders, support, accounting, fraud prevention and legal compliance. Reasonable safeguards are used, but no internet transmission is completely risk-free. You may ask to access, correct or delete eligible personal information by contacting us.</p></section>
    <section><h2>Contact and updates</h2><p>Privacy questions can be sent through our <a href="/contact">contact page</a>. We may update this policy when our services or legal obligations change; the latest version will remain published here.</p></section>
  </CustomerPage>;
}
