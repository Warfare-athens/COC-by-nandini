/**
 * Normalizes phone numbers for WhatsApp integration (defaults to India country code 91).
 */
export function normalizeWhatsAppPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;

  // 10 digits: standard Indian mobile number without country prefix (e.g. 9876543210)
  if (digits.length === 10) {
    return `91${digits}`;
  }

  // 11 digits starting with 0: (e.g. 09876543210)
  if (digits.length === 11 && digits.startsWith("0")) {
    return `91${digits.slice(1)}`;
  }

  // 12 digits starting with 91: already has country code (e.g. 919876543210)
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }

  // Fallback: if more than 10 digits, extract the last 10 digits as Indian mobile number
  if (digits.length > 10) {
    const last10 = digits.slice(-10);
    return `91${last10}`;
  }

  return null;
}

export interface CartRecoveryItem {
  name?: string | null;
  quantity?: number | null;
}

/**
 * Builds a polite, high-converting abandoned cart recovery message for Carnival of Clothes.
 */
export function buildCartRecoveryMessage({
  customerName,
  items,
  siteUrl,
}: {
  customerName?: string | null;
  items?: CartRecoveryItem[];
  siteUrl?: string;
}): string {
  const trimmedName = customerName?.trim();
  const firstName = trimmedName ? trimmedName.split(/\s+/)[0] : "there";

  const validItems = (items || [])
    .map((item) => item.name?.trim())
    .filter((name): name is string => Boolean(name && name !== "—" && name !== "No items"));

  let itemsPhrase = "items in your shopping bag";
  if (validItems.length === 1) {
    itemsPhrase = `"${validItems[0]}" in your shopping bag`;
  } else if (validItems.length === 2) {
    itemsPhrase = `"${validItems[0]}" and "${validItems[1]}" in your shopping bag`;
  } else if (validItems.length > 2) {
    const extraCount = validItems.length - 1;
    itemsPhrase = `"${validItems[0]}" and ${extraCount} other item${extraCount > 1 ? "s" : ""} in your shopping bag`;
  }

  const base = (siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://www.carnivalofclothes.com").replace(/\/$/, "");
  const checkoutUrl = `${base}/checkout`;

  return (
    `Hi ${firstName}! 👋\n\n` +
    `We noticed you left ${itemsPhrase} at Carnival of Clothes.\n\n` +
    `Would you like help completing your order? We offer complimentary express delivery across India! ✨\n\n` +
    `You can complete your order here:\n` +
    `${checkoutUrl}\n\n` +
    `Feel free to reply directly to this chat if you have any questions regarding sizing, custom alterations, or payment options.`
  );
}

/**
 * Generates the direct WhatsApp Click-to-Chat URL with pre-filled recovery message.
 */
export function buildWhatsAppRecoveryUrl({
  phone,
  customerName,
  items,
  siteUrl,
}: {
  phone?: string | null;
  customerName?: string | null;
  items?: CartRecoveryItem[];
  siteUrl?: string;
}): string | null {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (!normalizedPhone) return null;

  const message = buildCartRecoveryMessage({ customerName, items, siteUrl });
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
