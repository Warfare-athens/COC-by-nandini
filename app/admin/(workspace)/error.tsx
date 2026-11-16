"use client";

import { AlertTriangle, RotateCw } from "lucide-react";

export default function AdminWorkspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="admin-route-error" role="alert"><span><AlertTriangle size={25} /></span><h1>Couldn’t load this page</h1><button className="admin-button" type="button" onClick={reset}><RotateCw size={16} />Try again</button></div>;
}
