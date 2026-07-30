import type { Metadata } from "next";
import CustomerPage from "@/app/components/CustomerPage";

export const metadata: Metadata = { title: "Terms and Conditions", description: "Terms governing the use of Carnival of Clothes and purchases from the online store.", alternates: { canonical: "/terms-conditions" } };

export default function TermsPage() {
  return <CustomerPage eyebrow="STORE TERMS" title="Terms & conditions" intro="These terms govern use of the Carnival of Clothes website and orders placed with Carnival of Clothes by Nandini. Last updated 30 July 2026.">
    <section><h2>Using the website</h2><p>By using this website or placing an order, you agree to these terms and confirm that information supplied by you is accurate. You must not misuse the website, interfere with its operation, attempt unauthorised access or use its content unlawfully.</p></section>
    <section><h2>Products and presentation</h2><p>We aim to describe and photograph products accurately. Screen settings, lighting and handmade or textile variations may cause minor differences in colour or appearance. Measurements are approximate and should be considered with the relevant size information.</p></section>
    <section><h2>Prices, availability and orders</h2><p>Prices are displayed in Indian rupees and may change without notice. An order is subject to payment authorisation, stock availability and acceptance. We may cancel or limit an order affected by an obvious pricing error, suspected misuse, unavailable inventory or an undeliverable address; any eligible payment already received will be refunded.</p></section>
    <section><h2>Payments, delivery and returns</h2><p>Available payment methods are shown during checkout. Delivery estimates are not guaranteed and are subject to courier conditions. Shipping and return eligibility are governed by our <a href="/shipping-delivery">Shipping & Delivery</a> and <a href="/returns-exchanges">Returns & Exchanges</a> pages.</p></section>
    <section><h2>Intellectual property</h2><p>The Carnival of Clothes name, branding, website design, copy, photographs and other original material may not be copied, republished or commercially exploited without written permission, except where rights belong to an identified third party.</p></section>
    <section><h2>Liability and governing law</h2><p>To the extent permitted by law, Carnival of Clothes is not responsible for indirect losses or events outside reasonable control. Nothing in these terms limits rights that cannot legally be excluded. These terms are governed by the laws of India, with disputes subject to the appropriate courts in Ahmedabad, Gujarat.</p></section>
    <section><h2>Contact</h2><p>Questions about these terms can be raised through our <a href="/contact">contact page</a>.</p></section>
  </CustomerPage>;
}
