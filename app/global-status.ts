export type GlobalStatusType = "loading" | "success" | "error" | "info";

export function showGlobalStatus(message: string, type: GlobalStatusType = "success", duration = 2400) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("coc-status", { detail: { message, type, duration } }));
}

export const showGlobalLoading = (message: string) => showGlobalStatus(message, "loading", 20_000);
export const hideGlobalStatus = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("coc-loader-hide"));
};
