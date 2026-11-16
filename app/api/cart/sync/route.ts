import { NextResponse } from "next/server";
import { z } from "zod";
import { commerceConfigured, getSupabaseAdmin } from "@/db";
import { attributionSchema, cartApiError, cartLineSchema, resolveCartLines } from "@/lib/commerce-cart";

const schema = z.object({
  anonymousToken: z.string().uuid(),
  revision: z.number().int().nonnegative().default(0),
  items: z.array(cartLineSchema).max(30),
  attribution: attributionSchema.optional(),
});

export async function POST(request: Request) {
  if (!commerceConfigured()) return NextResponse.json({ ok: false }, { status: 503 });
  try {
    const input = schema.parse(await request.json());
    const lines = await resolveCartLines(input.items);
    const items = lines.flatMap(({ item, product, variant }) => product ? [{
      product_id: product.id,
      variant_id: variant?.id || null,
      quantity: item.quantity,
    }] : []);
    const { data, error } = await getSupabaseAdmin().rpc("track_cart", {
      p_token: input.anonymousToken,
      p_cart_revision: input.revision,
      p_items: items,
      p_attribution: input.attribution || {},
    });
    if (error) throw error;
    return NextResponse.json({ ...data, unmatchedItems: input.items.length - items.length });
  } catch (error) {
    return NextResponse.json({ error: cartApiError(error, "Unable to sync cart") }, { status: error instanceof z.ZodError ? 400 : 503 });
  }
}
