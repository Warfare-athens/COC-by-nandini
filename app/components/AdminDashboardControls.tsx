"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { showGlobalStatus } from "../global-status";
import UniversalSelect from "./UniversalSelect";

export default function AdminDashboardControls({ days }: { days: number }) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const changeWindow = (value: string) => {
    showGlobalStatus("Updating dashboard", "loading");
    router.push(`/admin?days=${value}`);
    window.setTimeout(() => showGlobalStatus("Dashboard updated", "success", 1400), 650);
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
        <span>Window</span>
        <UniversalSelect controlSize="compact" fluid={false} value={days} onChange={(event) => changeWindow(event.target.value)} aria-label="Dashboard time window">
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
