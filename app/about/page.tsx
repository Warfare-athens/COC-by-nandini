import type { Metadata } from "next";
import CustomerPage, { customerPageStyles as styles } from "@/app/components/CustomerPage";

export const metadata: Metadata = { title: "About Carnival of Clothes by Nandini", description: "Meet Carnival of Clothes by Nandini, an Ahmedabad-based women’s fashion store curating expressive everyday and occasion clothing.", alternates: { canonical: "/about" } };

export default function AboutPage() {
  return <CustomerPage eyebrow="OUR STORY" title="Fashion with a sense of celebration" intro="Carnival of Clothes by Nandini is an Ahmedabad-based women’s fashion destination created for wardrobes that feel expressive, wearable and unmistakably personal.">
    <section><h2>Curated in Ahmedabad</h2><p>We bring together dresses, co-ord sets, Indian wear, Korean-inspired styles, party wear and accessories for women who enjoy dressing with confidence. Each edit is selected to help you move easily between everyday plans and meaningful occasions.</p></section>
    <section className={styles.grid}><div className={styles.card}><h3>Thoughtful selection</h3><p>We focus on versatile silhouettes, memorable details and pieces you can style beyond a single occasion.</p></div><div className={styles.card}><h3>Personal service</h3><p>Need help choosing a size or outfit? Speak directly with us on WhatsApp for practical, human guidance.</p></div><div className={styles.card}><h3>Made for real wardrobes</h3><p>Our collections balance current ideas with clothing that remains useful after the trend cycle moves on.</p></div><div className={styles.card}><h3>Growing with our customers</h3><p>Every review, question and repeat order helps shape what Carnival of Clothes becomes next.</p></div></section>
    <section className={styles.contactCard}><h2>Meet your next favourite outfit</h2><p>Explore our <a href="/shop">complete collection</a>, discover our <a href="/collections/korean-clothing">Korean clothing edit</a>, or visit the guide to <a href="/ahmedabad">shopping Carnival of Clothes in Ahmedabad</a>.</p></section>
  </CustomerPage>;
}
