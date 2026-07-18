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
  shortDescription: z.string().min(20).max(180),
  description: z.string().min(80).max(2500),
  category: z.enum(["Top Wear", "Bottom Wear", "Indian", "Korean", "Dresses", "Co-ord Sets", "Accessories"]),
  subcategory: z.enum(["", "Shirts", "T-shirts", "Crop Tops", "Tank Tops", "Bodysuits", "Jeans", "Trousers", "Cargo Pants", "Palazzo Pants", "Skirts", "Shorts", "Kurtis", "Kurta Sets", "Sarees", "Lehenga Sets", "Anarkali Suits", "Dupattas", "Korean Tops", "Korean Dresses", "Korean Co-ords", "Oversized Shirts", "Pleated Skirts", "Handbags", "Jewellery", "Sunglasses", "Belts", "Hair Accessories", "Scarves"]),
  occasions: z.array(z.enum(["Everyday", "Party Wear"])).min(1).max(2),
  tags: z.array(z.string()).min(3).max(12),
  colors: z.array(z.string()).max(8),
  suggestedSizes: z.array(z.string()).max(10),
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

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "Add GEMINI_API_KEY to enable AI product creation." }, { status: 503 });
  try {
    const input = requestSchema.parse(await request.json());
    const images = await Promise.all(input.imageUrls.map(imagePart));
    const prompt = `You are the visual catalog specialist for Carnival of Clothes, an Indian women's fashion store. Inspect the images as the primary evidence and use the supplied name as supporting context. Classify only within this fixed taxonomy: Top Wear > Shirts/T-shirts/Crop Tops/Tank Tops/Bodysuits; Bottom Wear > Jeans/Trousers/Cargo Pants/Palazzo Pants/Skirts/Shorts; Indian > Kurtis/Kurta Sets/Sarees/Lehenga Sets/Anarkali Suits/Dupattas; Korean > Korean Tops/Korean Dresses/Korean Co-ords/Oversized Shirts/Pleated Skirts; Dresses (no subcategory); Co-ord Sets (no subcategory); Accessories > Handbags/Jewellery/Sunglasses/Belts/Hair Accessories/Scarves. Never invent a category. Identify garment construction visually even when its type is missing from the name—for example a visually identifiable kurti belongs to Indian > Kurtis. Also suggest Everyday, Party Wear, or both as occasions. Do not invent fabric composition, technical, sustainability, or care claims. Price: INR ${input.priceInr}. Product name: ${input.name}. Return polished Indian-English copy, SEO, alt text, and sensible sizes. Plain text, not markdown.`;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }, ...images] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: z.toJSONSchema(generatedProductSchema),
        maxOutputTokens: 3500,
        httpOptions: { timeout: 75_000 },
        abortSignal: AbortSignal.timeout(80_000),
      },
    });
    const raw = JSON.parse(response.text || "{}") as Record<string, unknown>;
    const trimText = (key: string, maximum: number) => {
      if (typeof raw[key] === "string") raw[key] = raw[key].slice(0, maximum).trim();
    };
    trimText("shortDescription", 180);
    trimText("description", 2500);
    trimText("material", 120);
    trimText("careInstructions", 500);
    trimText("styleNotes", 500);
    trimText("seoTitle", 70);
    trimText("seoDescription", 170);
    for (const [key, maximum] of [["tags", 12], ["colors", 8], ["suggestedSizes", 10], ["searchKeywords", 20], ["imageAltTexts", 5]] as const) {
      if (Array.isArray(raw[key])) raw[key] = raw[key].slice(0, maximum);
    }
    const generated = generatedProductSchema.parse(raw);
    return NextResponse.json({ product: generated });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? `AI returned an invalid ${error.issues[0]?.path.join(".") || "product field"}. Please generate again.`
      : error instanceof Error ? error.message : "AI generation failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
