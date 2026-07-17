import { NextResponse } from "next/server";
import { clearAdminCookie, setAdminCookie, validAdminKey } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const { key } = await request.json();
  if (!validAdminKey(String(key || ""))) return NextResponse.json({ error: "Incorrect admin access key." }, { status: 401 });
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
export async function DELETE() { await clearAdminCookie(); return NextResponse.json({ ok: true }); }
