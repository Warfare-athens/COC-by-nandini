import "server-only";
import { cookies } from "next/headers";
import { adminTimeCookie, defaultAdminDays, parseAdminDays } from "./admin-time";

export async function getAdminDays(days?: string) {
  return parseAdminDays(days) ?? parseAdminDays((await cookies()).get(adminTimeCookie)?.value) ?? defaultAdminDays;
}
