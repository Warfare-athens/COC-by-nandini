"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLiveRefresh() {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") router.refresh(); };
    const timer = window.setInterval(refresh, 4_000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [router]);
  return <span className="admin-live-indicator"><i/>Live</span>;
}
