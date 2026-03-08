"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function DashboardPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-3 text-center max-w-md">
        <AlertCircle className="h-10 w-10 text-amber-500" />
        <h2 className="text-lg font-semibold text-foreground">
          Seite konnte nicht geladen werden
        </h2>
        <p className="text-sm text-muted-foreground">
          Bitte erneut versuchen oder zum Dashboard wechseln.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <RefreshCw className="h-4 w-4" />
          Erneut versuchen
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Zum Dashboard
        </Link>
      </div>
    </div>
  );
}
