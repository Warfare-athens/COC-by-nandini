import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const cookieName = "coc-admin";
const signature = () => createHmac("sha256", process.env.ADMIN_COOKIE_SECRET || "unconfigured").update(process.env.ADMIN_ACCESS_KEY || "unconfigured").digest("hex");

export function validAdminKey(value: string) {
  const expected = Buffer.from(process.env.ADMIN_ACCESS_KEY || "");
  const received = Buffer.from(value || "");
  return expected.length > 10 && expected.length === received.length && timingSafeEqual(expected, received);
}

export async function isAdmin() {
  const value = (await cookies()).get(cookieName)?.value || "";
  const expected = signature();
  return value.length === expected.length && timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/access");
}

export async function setAdminCookie() {
  (await cookies()).set(cookieName, signature(), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/admin", maxAge: 60 * 60 * 8 });
}

export async function clearAdminCookie() { (await cookies()).delete(cookieName); }
