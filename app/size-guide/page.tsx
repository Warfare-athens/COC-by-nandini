import type { Metadata } from "next";
import CustomerPage, { customerPageStyles as styles } from "@/app/components/CustomerPage";

export const metadata: Metadata = { title: "Women’s Clothing Size Guide", description: "Use the Carnival of Clothes women’s size chart and measurement guide to choose your best fit.", alternates: { canonical: "/size-guide" } };

const sizes = [["XS","32","25","35"],["S","34","27","37"],["M","36","29","39"],["L","38","31","41"],["XL","40","33","43"],["XXL","42","35","45"]];

export default function SizeGuidePage() {
  return <CustomerPage eyebrow="FIND YOUR FIT" title="Women’s size guide" intro="Measure your body, compare the numbers below and check the individual product description for fit-specific guidance. Measurements are in inches.">
    <section><h2>Standard body measurements</h2><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Size</th><th>Bust</th><th>Waist</th><th>Hip</th></tr></thead><tbody>{sizes.map((row) => <tr key={row[0]}>{row.map((value) => <td key={value}>{value}</td>)}</tr>)}</tbody></table></div></section>
    <section className={styles.grid}><div className={styles.card}><h3>Bust</h3><p>Measure around the fullest part of your bust while keeping the tape level and comfortably relaxed.</p></div><div className={styles.card}><h3>Waist</h3><p>Measure around your natural waistline, usually the narrowest part of your torso.</p></div><div className={styles.card}><h3>Hip</h3><p>Stand with your feet together and measure around the fullest part of your hips and seat.</p></div><div className={styles.card}><h3>Between sizes?</h3><p>Choose based on the garment’s intended fit and your largest relevant measurement. For a relaxed fit, sizing up may be more comfortable.</p></div></section>
    <section><h2>Fit can vary by style</h2><p>This chart is a general guide. Fabric stretch, garment construction and intended silhouette can change how a piece fits. Product-specific measurements take priority when provided.</p></section>
    <section className={styles.note}><p>Still unsure? Send the product link and your bust, waist and hip measurements to us on <a href="https://wa.me/919662143635">WhatsApp</a> before ordering.</p></section>
  </CustomerPage>;
}
