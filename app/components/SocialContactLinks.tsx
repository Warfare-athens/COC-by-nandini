import styles from "./SocialContactLinks.module.css";

export const instagramUrl = "https://www.instagram.com/carnivalofclothes/";
export const whatsappUrl = "https://wa.me/919662143635";

export default function SocialContactLinks() {
  return (
    <aside className={styles.floating} aria-label="Contact Carnival of Clothes">
      <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Follow Carnival of Clothes on Instagram" title="Instagram">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      </a>
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Chat with Carnival of Clothes on WhatsApp at +91 96621 43635" title="WhatsApp: +91 96621 43635">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.4-4.7a8.5 8.5 0 1 1 16.1-4.2Z" />
          <path d="M8.2 7.6c.3-.3.6-.3.8 0l1 2c.1.3.1.5-.1.7l-.7.7c.7 1.5 1.8 2.6 3.4 3.3l.7-.8c.2-.2.5-.3.7-.1l2 1c.3.1.3.5.1.8-.5.8-1.4 1.3-2.3 1.2-3.4-.4-6.4-3.3-6.9-6.7-.1-.8.5-1.6 1.3-2.1Z" />
        </svg>
      </a>
    </aside>
  );
}
