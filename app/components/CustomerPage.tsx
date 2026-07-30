import type { ReactNode } from "react";
import Header from "./Header";
import styles from "./CustomerPage.module.css";

export const customerPageStyles = styles;

export default function CustomerPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return <main className={styles.page}>
    <Header />
    <header className={styles.hero}><span className={styles.eyebrow}>{eyebrow}</span><h1>{title}</h1><p>{intro}</p></header>
    <div className={styles.content}>{children}</div>
    <footer className={styles.footer}>
      <a href="/about">About</a><a href="/contact">Contact</a><a href="/shipping-delivery">Shipping</a><a href="/returns-exchanges">Returns</a><a href="/size-guide">Size guide</a><a href="/privacy-policy">Privacy</a><a href="/terms-conditions">Terms</a>
    </footer>
  </main>;
}
