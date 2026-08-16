import { NextResponse } from "next/server";
import { z } from "zod";
import { commerceConfigured, getSupabaseAdmin } from "@/db";

const schema = z.object({
  anonymousToken: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid().optional(),
    name: z.string().min(1),
    size: z.string().min(1),
    quantity: z.number().int().min(1).max(20),
  })).max(30),
});

export async function POST(request: Request) {
  if (!commerceConfigured()) return NextResponse.json({ ok: false }, { status: 503 });
  try {
    const input = schema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase.from("carts").select("status").eq("anonymous_token", input.anonymousToken).maybeSingle();
    const nextStatus = input.items.length ? (existing?.status === "checkout" ? "checkout" : "active") : "empty";
    const { data: cart, error: cartError } = await supabase.from("carts").upsert({
      anonymous_token: input.anonymousToken,
      status: nextStatus,
      last_activity_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    }, { onConflict: "anonymous_token" }).select("id").single();
    if (cartError) throw cartError;
    await supabase.from("cart_items").delete().eq("cart_id", cart.id);
    for (const item of input.items) {
      let query = supabase.from("products").select("id,product_variants(id,size,title)").eq("status", "active");
      query = item.productId ? query.eq("id", item.productId) : query.eq("name", item.name);
      const { data: product } = await query.maybeSingle();
      if (!product) continue;
      const variants = (product.product_variants || []) as { id: string; size: string | null; title: string }[];
      const variant = variants.find((entry) => (entry.size || entry.title) === item.size);
      await supabase.from("cart_items").insert({ cart_id: cart.id, product_id: product.id, variant_id: variant?.id || null, quantity: item.quantity });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to sync cart" }, { status: 400 });
  }
}
