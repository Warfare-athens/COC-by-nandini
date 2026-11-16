"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { showGlobalStatus } from "../global-status";
import UniversalSelect from "./UniversalSelect";
import { adminTimeCookie, parseAdminDays } from "@/lib/admin-time";

export default function AdminDashboardControls({ days }: { days: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const query = useSearchParams();
  const [selectedDays, setSelectedDays] = useState(days);
  const [refreshing, setRefreshing] = useState(false);

  const changeWindow = (value: string) => {
    setSelectedDays(parseAdminDays(value) ?? days);
    document.cookie = `${adminTimeCookie}=${value}; path=/admin; max-age=31536000; SameSite=Lax`;
    const params = new URLSearchParams(query.toString());
    params.set("days", value);
    router.replace(`${pathname}?${params}`);
  };

  const refresh = () => {
    setRefreshing(true);
    showGlobalStatus("Refreshing live data", "loading");
    router.refresh();
    window.setTimeout(() => {
      setRefreshing(false);
      showGlobalStatus("Live data refreshed", "success", 1400);
    }, 700);
  };

  return (
    <div className="command-controls">
      <label>
        <UniversalSelect controlSize="compact" fluid={false} value={parseAdminDays(query.get("days") || undefined) ?? selectedDays} onChange={(event) => changeWindow(event.target.value)} aria-label="Admin date range">
          <option value="1">Today</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </UniversalSelect>
      </label>
      <button type="button" onClick={refresh} className={refreshing ? "is-refreshing" : ""} aria-label="Refresh dashboard">↻</button>
    </div>
  );
}
