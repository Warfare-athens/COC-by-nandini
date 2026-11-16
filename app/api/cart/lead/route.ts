import { NextResponse } from "next/server";
import { z } from "zod";
import { commerceConfigured, getSupabaseAdmin } from "@/db";
import { attributionSchema, cartApiError } from "@/lib/commerce-cart";

const field = z.string().trim().max(300).optional();
const schema = z.object({
  anonymousToken: z.string().uuid(),
  revision: z.number().int().nonnegative().default(0),
  fullName: field,
  email: z.string().trim().max(320).optional(),
  phone: z.string().trim().max(30).optional(),
  line1: field,
  line2: field,
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().max(100).optional(),
  paymentMethod: z.enum(["cod", "razorpay"]).optional(),
  lastField: z.string().max(40).optional(),
  attribution: attributionSchema.optional(),
});

export async function POST(request: Request) {
  if (!commerceConfigured()) return NextResponse.json({ error: "Cart tracking unavailable" }, { status: 503 });
  try {
    const { anonymousToken, revision, attribution, lastField, ...fields } = schema.parse(await request.json());
    const { fullName, postalCode, paymentMethod, ...rest } = fields;
    const profile = Object.fromEntries(Object.entries({
      ...rest, full_name: fullName, postal_code: postalCode, payment_method: paymentMethod,
    }).filter(([, value]) => value !== undefined).map(([key, value]) => [key, value || null]));
    const { data, error } = await getSupabaseAdmin().rpc("track_cart", {
      p_token: anonymousToken,
      p_lead_revision: revision,
      p_profile: profile,
      p_attribution: attribution || {},
      p_last_field: lastField || null,
    });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: cartApiError(error, "Unable to save checkout progress") }, { status: error instanceof z.ZodError ? 400 : 503 });
  }
}
