export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";

const requestSchema = z.object({
  name: z.string().min(2),
  priceInr: z.number().int().positive(),
  imageUrls: z.array(z.string().url()).max(5).default([]),
});

const generatedProductSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  sku: z.string().min(3).max(32),
  shortDescription: z.string().min(20).max(100),
  description: z.string().min(80).max(2500),
  category: z.enum(["Top Wear", "Bottom Wear", "Indian", "Korean", "Dresses", "Co-ord Sets", "Accessories"]),
  subcategory: z.enum(["", "Shirts", "T-shirts", "Crop Tops", "Tank Tops", "Bodysuits", "Jeans", "Trousers", "Cargo Pants", "Palazzo Pants", "Skirts", "Shorts", "Kurtis", "Kurta Sets", "Sarees", "Lehenga Sets", "Anarkali Suits", "Dupattas", "Korean Tops", "Korean Dresses", "Korean Co-ords", "Oversized Shirts", "Pleated Skirts", "Handbags", "Jewellery", "Sunglasses", "Belts", "Hair Accessories", "Scarves"]),
  occasions: z.array(z.enum(["Everyday", "Party Wear"])).min(1).max(2),
  tags: z.array(z.string()).min(3).max(12),
  colors: z.array(z.string()).max(8),
  suggestedSizes: z.array(z.string()).max(12),
  material: z.string().max(120),
  careInstructions: z.string().max(500),
  styleNotes: z.string().max(500),
  seoTitle: z.string().min(20).max(70),
  seoDescription: z.string().min(50).max(170),
  searchKeywords: z.array(z.string()).min(3).max(20),
  imageAltTexts: z.array(z.string()).max(5),
});

async function imagePart(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error("Unable to read an uploaded image for AI analysis.");
  const mimeType = response.headers.get("content-type") || "image/jpeg";
  const data = Buffer.from(await response.arrayBuffer()).toString("base64");
  return { inlineData: { mimeType, data } };
}

function generateFallbackProduct(name: string, priceInr: number) {
  const cleanName = name.trim();
  const lower = cleanName.toLowerCase();

  // 1. URL slug
  const slug = lower
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `product-${Date.now().toString(36)}`;

  // 2. Base SKU
  const prefix = cleanName
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 4)
    .toUpperCase() || "PROD";
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const sku = `COC-${prefix}-${randomSuffix}`;

  // 3. Category & Subcategory heuristic based on taxonomy
  let category: "Top Wear" | "Bottom Wear" | "Indian" | "Korean" | "Dresses" | "Co-ord Sets" | "Accessories" = "Top Wear";
  let subcategory = "";

  if (/\b(dress|gown|maxi|midi)\b/.test(lower)) {
    category = "Dresses";
    subcategory = "";
  } else if (/\b(co-?ord|coord|set|suit)\b/.test(lower) && !/\b(kurta|anarkali|saree)\b/.test(lower)) {
    category = "Co-ord Sets";
    subcategory = "";
  } else if (/\b(kurti|kurta|saree|sari|lehenga|anarkali|dupatta|ethnic)\b/.test(lower)) {
    category = "Indian";
    if (lower.includes("kurti")) subcategory = "Kurtis";
    else if (lower.includes("kurta")) subcategory = "Kurta Sets";
    else if (lower.includes("saree") || lower.includes("sari")) subcategory = "Sarees";
    else if (lower.includes("lehenga")) subcategory = "Lehenga Sets";
    else if (lower.includes("anarkali")) subcategory = "Anarkali Suits";
    else if (lower.includes("dupatta")) subcategory = "Dupattas";
    else subcategory = "Kurtis";
  } else if (/\b(korean)\b/.test(lower)) {
    category = "Korean";
    if (lower.includes("dress")) subcategory = "Korean Dresses";
    else if (lower.includes("coord") || lower.includes("set")) subcategory = "Korean Co-ords";
    else if (lower.includes("skirt")) subcategory = "Pleated Skirts";
    else if (lower.includes("shirt")) subcategory = "Oversized Shirts";
    else subcategory = "Korean Tops";
  } else if (/\b(jean|denim|trouser|pant|cargo|palazzo|skirt|short)\b/.test(lower)) {
    category = "Bottom Wear";
    if (lower.includes("jean") || lower.includes("denim")) subcategory = "Jeans";
    else if (lower.includes("cargo")) subcategory = "Cargo Pants";
    else if (lower.includes("palazzo")) subcategory = "Palazzo Pants";
    else if (lower.includes("skirt")) subcategory = "Skirts";
    else if (lower.includes("short")) subcategory = "Shorts";
    else subcategory = "Trousers";
  } else if (/\b(top|shirt|t-?shirt|tee|crop|tank|bodysuit|blouse)\b/.test(lower)) {
    category = "Top Wear";
    if (lower.includes("t-shirt") || lower.includes("tee")) subcategory = "T-shirts";
    else if (lower.includes("crop")) subcategory = "Crop Tops";
    else if (lower.includes("tank")) subcategory = "Tank Tops";
    else if (lower.includes("bodysuit")) subcategory = "Bodysuits";
    else subcategory = "Shirts";
  } else if (/\b(bag|handbag|sunglass|glasses|jewel|earring|necklace|belt|scarf|hair)\b/.test(lower)) {
    category = "Accessories";
    if (lower.includes("sunglass") || lower.includes("glasses")) subcategory = "Sunglasses";
    else if (lower.includes("bag")) subcategory = "Handbags";
    else if (lower.includes("belt")) subcategory = "Belts";
    else if (lower.includes("scarf")) subcategory = "Scarves";
    else if (lower.includes("hair")) subcategory = "Hair Accessories";
    else subcategory = "Jewellery";
  }

  const isAccessory = category === "Accessories";
  const occasions: Array<"Everyday" | "Party Wear"> = /\b(party|festive|wedding|evening|night|velvet|silk|embroidered)\b/.test(lower)
    ? ["Party Wear"]
    : ["Everyday"];

  const suggestedSizes = isAccessory
    ? ["One Size"]
    : ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];

  const shortDescription = `${cleanName} — handcrafted elegance by Carnival of Clothes.`.slice(0, 100);
  const description = `Discover the ${cleanName} from Carnival of Clothes by Nandini. Designed for premium comfort and effortless style, this piece blends contemporary design with exquisite tailoring.\n\nCrafted with premium materials and finished with meticulous care at our Ahmedabad boutique studio.`;

  return {
    slug,
    sku,
    shortDescription,
    description,
    category,
    subcategory,
    occasions,
    tags: [category.toLowerCase(), "carnival-edit", "trending", "new-arrival"],
    colors: ["Multi"],
    suggestedSizes,
    material: "Premium Quality Fabric",
    careInstructions: "Dry clean or gentle hand wash in cold water with mild detergent. Do not bleach. Dry in shade.",
    styleNotes: "Style with complementary footwear and minimalist accessories for an effortless look.",
    seoTitle: `${cleanName} | Carnival of Clothes by Nandini`.slice(0, 70),
    seoDescription: `Shop the ${cleanName} online at Carnival of Clothes. Premium women's fashion curated in Ahmedabad with pan-India delivery.`.slice(0, 170),
    searchKeywords: [cleanName.toLowerCase(), category.toLowerCase(), "carnival of clothes", "women fashion", "buy online"],
    imageAltTexts: [cleanName],
  };
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let input: z.infer<typeof requestSchema>;
  try {
    input = requestSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ error: "Please enter product name and a valid price." }, { status: 400 });
  }

  // If Gemini key is not configured, gracefully return smart rule-based template
  if (!process.env.GEMINI_API_KEY) {
    const fallback = generateFallbackProduct(input.name, input.priceInr);
    return NextResponse.json({
      product: fallback,
      fallbackUsed: true,
      fallbackReason: "GEMINI_API_KEY is not set. Starter template auto-filled.",
    });
  }

  try {
    const images = await Promise.all(input.imageUrls.map(imagePart)).catch(() => []);
    const prompt = `You are the visual catalog specialist for Carnival of Clothes, an Indian women's fashion store. Inspect the images as the primary evidence and use the supplied name as supporting context. Classify only within this fixed taxonomy: Top Wear > Shirts/T-shirts/Crop Tops/Tank Tops/Bodysuits; Bottom Wear > Jeans/Trousers/Cargo Pants/Palazzo Pants/Skirts/Shorts; Indian > Kurtis/Kurta Sets/Sarees/Lehenga Sets/Anarkali Suits/Dupattas; Korean > Korean Tops/Korean Dresses/Korean Co-ords/Oversized Shirts/Pleated Skirts; Dresses (no subcategory); Co-ord Sets (no subcategory); Accessories > Handbags/Jewellery/Sunglasses/Belts/Hair Accessories/Scarves. Never invent a category. Identify garment construction visually even when its type is missing from the name—for example a visually identifiable kurti belongs to Indian > Kurtis. Also suggest Everyday, Party Wear, or both as occasions. Do not invent fabric composition, technical, sustainability, or care claims. Price: INR ${input.priceInr}. Product name: ${input.name}. For clothing/apparel, always return inclusive Indian sizes from XS to 4XL: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"] unless the product is an accessory (use ["One Size"]) or free size. Return polished Indian-English copy, SEO, alt text, and sensible sizes. Plain text, not markdown.`;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Try configured model, fallback to 3.8-flash, then 3.5-flash
    const modelsToTry = [
      process.env.GEMINI_MODEL,
      "gemini-3.8-flash",
      "gemini-3.5-flash",
    ].filter(Boolean) as string[];

    let responseText: string | null = null;
    let lastError: Error | null = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: prompt }, ...images] }],
          config: {
            responseMimeType: "application/json",
            responseSchema: z.toJSONSchema(generatedProductSchema),
            maxOutputTokens: 3500,
            httpOptions: { timeout: 45_000 },
            abortSignal: AbortSignal.timeout(50_000),
          },
        });
        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (modelErr) {
        lastError = modelErr instanceof Error ? modelErr : new Error(String(modelErr));
        console.warn(`Gemini model ${model} unavailable or rate-limited:`, lastError.message);
      }
    }

    // If Gemini was exhausted (429) or high demand (503) or failed, seamlessly use rule-based fallback
    if (!responseText) {
      console.warn("Gemini unavailable. Auto-generating smart rule-based fallback for product:", input.name);
      const fallback = generateFallbackProduct(input.name, input.priceInr);
      const isQuota = lastError?.message?.includes("quota") || lastError?.message?.includes("429");
      return NextResponse.json({
        product: fallback,
        fallbackUsed: true,
        fallbackReason: isQuota
          ? "Google Gemini free quota is exhausted. We've auto-filled a smart starter template based on your product name."
          : "Gemini AI is temporarily unavailable. We've auto-filled a smart starter template based on your product name.",
      });
    }

    const raw = JSON.parse(responseText) as Record<string, unknown>;
    const trimText = (key: string, maximum: number) => {
      if (typeof raw[key] === "string") raw[key] = raw[key].slice(0, maximum).trim();
    };
    trimText("shortDescription", 100);
    trimText("description", 2500);
    trimText("material", 120);
    trimText("careInstructions", 500);
    trimText("styleNotes", 500);
    trimText("seoTitle", 70);
    trimText("seoDescription", 170);

    // Ensure apparel products have the full inclusive sizing up to 4XL
    if (raw.category !== "Accessories") {
      const existing = Array.isArray(raw.suggestedSizes) ? raw.suggestedSizes : [];
      const hasGarmentSizes = existing.some((s) => typeof s === "string" && ["XS", "S", "M", "L", "XL"].includes(s.toUpperCase()));
      if (hasGarmentSizes || existing.length === 0) {
        raw.suggestedSizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];
      }
    }

    for (const [key, maximum] of [["tags", 12], ["colors", 8], ["suggestedSizes", 12], ["searchKeywords", 20], ["imageAltTexts", 5]] as const) {
      if (Array.isArray(raw[key])) raw[key] = raw[key].slice(0, maximum);
    }
    const generated = generatedProductSchema.parse(raw);
    return NextResponse.json({ product: generated, fallbackUsed: false });
  } catch (error) {
    // Ultimate safety: even if parsing fails, never block product creation
    console.warn("Gemini parse failed. Using rule-based template:", error);
    const fallback = generateFallbackProduct(input.name, input.priceInr);
    return NextResponse.json({
      product: fallback,
      fallbackUsed: true,
      fallbackReason: "AI formatting issue. We've auto-filled a smart starter template for you.",
    });
  }
}
