"use client";

import { AlertTriangle, RotateCw } from "lucide-react";

export default function AdminWorkspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="admin-route-error" role="alert"><span><AlertTriangle size={25} /></span><h1>We couldn’t load this admin page</h1><p>Your data has not been changed. Try loading the page again.</p><button className="admin-button" type="button" onClick={reset}><RotateCw size={16} />Try again</button></div>;
}
