import { NextRequest, NextResponse } from "next/server";

const cache = new Map<string, { city: string; state: string }>();

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ pin: string }> }
) {
  const { pin } = await context.params;
  const cleanPin = String(pin || "").trim();

  if (!/^\d{6}$/.test(cleanPin)) {
    return NextResponse.json(
      { success: false, error: "Invalid 6-digit PIN code" },
      { status: 400 }
    );
  }

  if (cache.has(cleanPin)) {
    return NextResponse.json({
      success: true,
      ...cache.get(cleanPin),
      cached: true,
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      signal: controller.signal,
      headers: { "User-Agent": "CarnivalOfClothes/1.0" },
      next: { revalidate: 86400 * 7 },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ success: false, error: "Lookup service unavailable" });
    }

    const data = await res.json();
    if (!Array.isArray(data) || !data[0] || data[0].Status !== "Success") {
      return NextResponse.json({ success: false, error: "Pincode not found" });
    }

    const postOffices = data[0].PostOffice;
    if (!Array.isArray(postOffices) || postOffices.length === 0) {
      return NextResponse.json({ success: false, error: "No post office data" });
    }

    const rawDistrict = postOffices[0].District || postOffices[0].Block || postOffices[0].Division || "";
    const cleanCity = rawDistrict.replace(/\s*\([A-Z]{2,}\)\s*/gi, "").trim();
    const cleanState = (postOffices[0].State || "").trim();

    if (!cleanCity && !cleanState) {
      return NextResponse.json({ success: false, error: "City/State details missing" });
    }

    const result = { city: cleanCity, state: cleanState };
    cache.set(cleanPin, result);

    return NextResponse.json({ success: true, ...result });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch postal details" });
  }
}
