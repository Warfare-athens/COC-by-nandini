"use client";

import { useState } from "react";
import type { AnalyticsTrendDay } from "@/lib/admin-analytics";

const metrics = { visitors: "Unique visitors", adds: "Add-to-cart actions", starts: "Checkout starts", orders: "Completed orders" } as const;
const keys = Object.keys(metrics) as Array<keyof typeof metrics>;
const dayLabel = (day: string) => new Date(day + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

export default function AdminAnalyticsTrend({ days }: { days: AnalyticsTrendDay[] }) {
  const [metric, setMetric] = useState<keyof typeof metrics>("visitors");
  const max = Math.max(1, ...days.map((day) => day[metric]));
  const [focusedDay, setFocusedDay] = useState<string>();
  const selected = days.find((day) => day.day === focusedDay) || days.at(-1);
  if (!days.length) return <div className="admin-empty">No daily activity yet.</div>;
  return <div className="admin-analytics-trend">
    <div className="admin-analytics-trend-controls" aria-label="Daily trend metric">
      {keys.map((key) => <button key={key} type="button" className={`admin-small-button ${metric === key ? "primary" : ""}`} aria-pressed={metric === key} onClick={() => setMetric(key)}>{metrics[key]}</button>)}
    </div>
    {selected && <p className="admin-analytics-selected" aria-live="polite"><strong>{selected[metric].toLocaleString("en-IN")}</strong> {metrics[metric].toLowerCase()} on {dayLabel(selected.day)}</p>}
    <div className="admin-analytics-bars" aria-label={`Daily ${metrics[metric].toLowerCase()}`}>
      {days.map((day) => <button key={day.day} type="button" className={selected?.day === day.day ? "is-selected" : ""} title={`${dayLabel(day.day)} · ${day[metric]}`}
        aria-label={`${dayLabel(day.day)}: ${day[metric]} ${metrics[metric].toLowerCase()}`}
        onFocus={() => setFocusedDay(day.day)} onClick={() => setFocusedDay(day.day)}>
        <span style={{ height: `${day[metric] / max * 100}%` }} />
      </button>)}
    </div>
    <div className="admin-analytics-axis"><span>{dayLabel(days[0].day)}</span>{days.length > 1 && <span>{dayLabel(days.at(-1)!.day)}</span>}</div>
  </div>;
}
