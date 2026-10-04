export interface ColorDefinition {
  name: string;
  hex: string;
  border?: string;
  isLight?: boolean;
}

export const POPULAR_PRODUCT_COLORS: ColorDefinition[] = [
  { name: "Black", hex: "#1c1c1c" },
  { name: "White", hex: "#ffffff", border: "#dcd2c9", isLight: true },
  { name: "Ivory", hex: "#fdfbf7", border: "#e5d9cd", isLight: true },
  { name: "Beige", hex: "#e5d4c0" },
  { name: "Blush Pink", hex: "#f4c2c2" },
  { name: "Dusty Pink", hex: "#d8a499" },
  { name: "Hot Pink", hex: "#e91e63" },
  { name: "Wine", hex: "#722f37" },
  { name: "Burgundy", hex: "#6b1724" },
  { name: "Maroon", hex: "#581822" },
  { name: "Red", hex: "#c41e3a" },
  { name: "Rust", hex: "#b7410e" },
  { name: "Orange", hex: "#e65100" },
  { name: "Mustard", hex: "#e5a93c" },
  { name: "Yellow", hex: "#fbc02d" },
  { name: "Sage Green", hex: "#9caf88" },
  { name: "Olive Green", hex: "#556b2f" },
  { name: "Emerald Green", hex: "#0b6641" },
  { name: "Bottle Green", hex: "#004225" },
  { name: "Pista Green", hex: "#93c572" },
  { name: "Sky Blue", hex: "#87ceeb" },
  { name: "Powder Blue", hex: "#b0e0e6" },
  { name: "Navy Blue", hex: "#0a1931" },
  { name: "Royal Blue", hex: "#4169e1" },
  { name: "Teal", hex: "#008080" },
  { name: "Lavender", hex: "#b57edc" },
  { name: "Purple", hex: "#6a0dad" },
  { name: "Lilac", hex: "#c8a2c8" },
  { name: "Brown", hex: "#5c3a21" },
  { name: "Grey", hex: "#757575" },
  { name: "Gold", hex: "#d4af37" },
  { name: "Multi", hex: "linear-gradient(135deg, #f4c2c2, #87ceeb, #fbc02d, #9caf88)" },
];

export const COLOR_SWATCH_MAP: Record<string, { bg: string; border?: string; isLight?: boolean }> = {
  black: { bg: "#1c1c1c" },
  noir: { bg: "#1c1c1c" },
  white: { bg: "#ffffff", border: "#dcd2c9", isLight: true },
  ivory: { bg: "#fdfbf7", border: "#e5d9cd", isLight: true },
  cream: { bg: "#fffdd0", border: "#e0d8b0", isLight: true },
  beige: { bg: "#e5d4c0" },
  tan: { bg: "#d2b48c" },
  pink: { bg: "#f4a6b8" },
  "blush pink": { bg: "#f4c2c2" },
  "dusty pink": { bg: "#d8a499" },
  "hot pink": { bg: "#e91e63" },
  rose: { bg: "#c26d78" },
  "dusty rose": { bg: "#ba7a84" },
  red: { bg: "#c41e3a" },
  crimson: { bg: "#dc143c" },
  wine: { bg: "#722f37" },
  burgundy: { bg: "#6b1724" },
  maroon: { bg: "#581822" },
  blue: { bg: "#2563eb" },
  "sky blue": { bg: "#87ceeb" },
  "powder blue": { bg: "#b0e0e6" },
  sky: { bg: "#87ceeb" },
  navy: { bg: "#0a1931" },
  "navy blue": { bg: "#0a1931" },
  "royal blue": { bg: "#4169e1" },
  green: { bg: "#2d7a46" },
  emerald: { bg: "#0b6641" },
  "emerald green": { bg: "#0b6641" },
  sage: { bg: "#9caf88" },
  "sage green": { bg: "#9caf88" },
  olive: { bg: "#556b2f" },
  "olive green": { bg: "#556b2f" },
  "bottle green": { bg: "#004225" },
  pista: { bg: "#93c572" },
  "pista green": { bg: "#93c572" },
  teal: { bg: "#008080" },
  yellow: { bg: "#fbc02d" },
  mustard: { bg: "#e5a93c" },
  orange: { bg: "#e65100" },
  rust: { bg: "#b7410e" },
  purple: { bg: "#6a0dad" },
  lavender: { bg: "#b57edc" },
  lilac: { bg: "#c8a2c8" },
  brown: { bg: "#5c3a21" },
  chocolate: { bg: "#3e2723" },
  grey: { bg: "#757575" },
  gray: { bg: "#757575" },
  silver: { bg: "#c0c0c0", border: "#999999" },
  gold: { bg: "#d4af37" },
  multi: { bg: "linear-gradient(135deg, #f4c2c2, #87ceeb, #fbc02d, #9caf88)" },
  multicolor: { bg: "linear-gradient(135deg, #f4c2c2, #87ceeb, #fbc02d, #9caf88)" },
  printed: { bg: "linear-gradient(135deg, #bb7068, #e8cdbc, #3a2926)" },
};

/**
 * Returns a swatch configuration (background color/gradient and optional border) for any color name.
 */
export function getColorSwatch(colorName: string): { bg: string; border?: string; isLight?: boolean } {
  if (!colorName) return { bg: "#dfcfc6" };
  const lower = colorName.trim().toLowerCase();
  if (COLOR_SWATCH_MAP[lower]) return COLOR_SWATCH_MAP[lower];

  // Look for partial matches (e.g. "Deep Wine Red" -> "wine" or "red")
  for (const [key, swatch] of Object.entries(COLOR_SWATCH_MAP)) {
    if (lower.includes(key)) {
      return swatch;
    }
  }

  // Graceful fallback for unknown colors
  return { bg: "#dfcfc6" };
}

/**
 * Automatically detects probable color names from a product title or text.
 * E.g. "Burgundy Grace Kaftan Dress" -> ["Burgundy"]
 * E.g. "Ivory Polka Lace Dress" -> ["Ivory"]
 * E.g. "Blush Pink Embroidered Kurti" -> ["Blush Pink"]
 */
export function detectColorFromName(title: string): string[] {
  if (!title) return [];
  const lower = title.toLowerCase();

  const colorCandidates = [
    "Blush Pink",
    "Dusty Pink",
    "Hot Pink",
    "Emerald Green",
    "Bottle Green",
    "Sage Green",
    "Olive Green",
    "Pista Green",
    "Navy Blue",
    "Royal Blue",
    "Sky Blue",
    "Powder Blue",
    "Burgundy",
    "Wine",
    "Maroon",
    "Ivory",
    "White",
    "Noir",
    "Black",
    "Rust",
    "Mustard",
    "Lavender",
    "Lilac",
    "Purple",
    "Orange",
    "Yellow",
    "Beige",
    "Brown",
    "Teal",
    "Pink",
    "Red",
    "Blue",
    "Green",
    "Gold",
    "Sky",
  ];

  const found: string[] = [];
  for (const candidate of colorCandidates) {
    const pattern = new RegExp(`\\b${candidate.toLowerCase()}\\b`, "i");
    if (pattern.test(lower)) {
      // Map "Noir" to "Black / Noir" or keep Noir
      const mapped = candidate === "Noir" ? "Noir" : candidate === "Sky" ? "Sky Blue" : candidate;
      if (!found.includes(mapped)) {
        found.push(mapped);
      }
    }
  }

  return found.length > 0 ? found : [];
}

/**
 * Extracts and de-duplicates all color names declared across tags and variant records.
 */
export function extractProductColors(
  tags?: string[] | null,
  variants?: { color?: string | null }[] | null
): string[] {
  const fromTags = (tags || [])
    .filter((tag) => typeof tag === "string" && tag.startsWith("color:"))
    .map((tag) => tag.slice(6).trim())
    .filter(Boolean);

  const fromVariants = (variants || [])
    .map((v) => (v.color ? v.color.trim() : ""))
    .filter(Boolean);

  const set = new Set<string>();
  for (const c of [...fromTags, ...fromVariants]) {
    if (c) {
      // Normalize casing nicely (e.g. "blush pink" -> "Blush Pink")
      const normalized = c.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      set.add(normalized);
    }
  }

  return Array.from(set);
}
