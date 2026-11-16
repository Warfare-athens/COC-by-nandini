import "server-only";
import { z } from "zod";
import { getSupabaseAdmin } from "@/db";

export const cartLineSchema = z.object({
  productId: z.string().max(100).optional(),
  name: z.string().trim().min(1).max(300),
  size: z.string().trim().min(1).max(100),
  color: z.string().trim().max(100).optional(),
  quantity: z.number().int().min(1).max(20),
});

export const attributionSchema = z.object({
  source: z.string().trim().max(200).optional(),
  medium: z.string().trim().max(100).optional(),
  campaign: z.string().trim().max(200).optional(),
  landing_page: z.string().trim().max(500).optional(),
  landingPage: z.string().trim().max(500).optional(),
  referrer: z.string().trim().max(500).optional(),
  device: z.enum(["mobile", "tablet", "desktop"]).optional(),
}).transform(({ landingPage, landing_page, ...fields }) => ({
  ...fields,
  landing_page: landing_page || landingPage || undefined,
  referrer: fields.referrer || undefined,
}));

type CartLine = z.infer<typeof cartLineSchema>;
const key = (value: string | null | undefined) => value?.trim().toLowerCase() || "";
const uuid = z.string().uuid();
const productFields = "id,name,hero_image_url,price_inr,product_variants(id,sku,title,size,color,image_url,price_inr,inventory_quantity,is_active)";

export async function resolveCartLines(lines: CartLine[]) {
  if (!lines.length) return [];
  const supabase = getSupabaseAdmin();
  const ids = [...new Set(lines.flatMap((item) => item.productId && uuid.safeParse(item.productId).success ? [item.productId] : []))];
  const names = [...new Set(lines.filter((item) => !item.productId || !ids.includes(item.productId)).map((item) => item.name))];
  const [known, legacy] = await Promise.all([
    ids.length ? supabase.from("products").select(productFields).eq("status", "active").in("id", ids) : { data: [], error: null },
    names.length ? supabase.from("products").select(productFields).eq("status", "active").in("name", names) : { data: [], error: null },
  ]);
  if (known.error || legacy.error) throw new Error("Could not load the store catalog.");
  const byId = new Map((known.data || []).map((product) => [product.id, product]));
  const byName = Map.groupBy(legacy.data || [], (product) => product.name);
  return lines.map((item) => {
    const matches = byName.get(item.name);
    const product = item.productId && ids.includes(item.productId) ? byId.get(item.productId) : matches?.length === 1 ? matches[0] : undefined;
    const variants = (product?.product_variants || []).filter((variant) => variant.is_active);
    const sized = variants.filter((variant) => key(variant.size || variant.title) === key(item.size));
    const options = sized.length ? sized : variants.length === 1 && !variants[0].size ? variants : [];
    const variant = options.find((entry) => key(entry.color) === key(item.color)) ||
      options.find((entry) => !entry.color) || (!item.color && options.length === 1 ? options[0] : undefined);
    return { item, product, variant };
  });
}

export function cartApiError(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return fallback;
}
