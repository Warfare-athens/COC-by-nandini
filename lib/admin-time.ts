export const adminTimeCookie = "coc-admin-days";
export const defaultAdminDays = 30;
export const adminDayOptions = [1, 7, 30, 90] as const;

export function parseAdminDays(value: string | undefined) {
  const days = Number(value);
  return adminDayOptions.find((option) => option === days);
}

export function adminRangeStart(days: number, now = new Date()) {
  // Calendar days follow the store's local time in India.
  const indiaOffset = 330 * 60_000;
  const local = new Date(now.getTime() + indiaOffset);
  const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - days + 1);
  return new Date(midnight - indiaOffset).toISOString();
}
