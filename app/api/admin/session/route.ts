import { NextResponse } from "next/server";
import { clearAdminCookie, setAdminCookie, validAdminKey } from "@/lib/admin-auth";
import { commerceConfigured, getSupabaseAdmin } from "@/db";

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function clientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function blocked(address: string) {
  const now = Date.now();
  const current = attempts.get(address);
  if (!current || current.resetAt <= now) {
    attempts.set(address, { count: 0, resetAt: now + WINDOW_MS });
    return false;
  }
  return current.count >= MAX_ATTEMPTS;
}

function recordFailure(address: string) {
  const current = attempts.get(address) || { count: 0, resetAt: Date.now() + WINDOW_MS };
  attempts.set(address, { ...current, count: current.count + 1 });
}

export async function POST(request: Request) {
  const address = clientAddress(request);
  if (blocked(address)) return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  let key = "";
  try {
    const body = await request.json();
    key = String(body?.key || "");
  } catch {
    return NextResponse.json({ error: "Enter your admin access key." }, { status: 400 });
  }
  if (!validAdminKey(key)) {
    recordFailure(address);
    return NextResponse.json({ error: "Incorrect admin access key." }, { status: 401 });
  }
  attempts.delete(address);
  await setAdminCookie();
  if (commerceConfigured()) {
    await getSupabaseAdmin().from("audit_logs").insert({ actor: "admin", action: "session.login", entity_type: "admin_session", metadata: { userAgent: request.headers.get("user-agent"), forwardedFor: address } });
  }
  return NextResponse.json({ ok: true });
}
export async function DELETE() {
  await clearAdminCookie();
  if (commerceConfigured()) {
    await getSupabaseAdmin().from("audit_logs").insert({ actor: "admin", action: "session.logout", entity_type: "admin_session" });
  }
  return NextResponse.json({ ok: true });
}
