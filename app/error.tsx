"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background font-sans antialiased flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <AlertCircle className="h-12 w-12 text-amber-500" />
        <h1 className="text-xl font-semibold text-foreground">
          Etwas ist schiefgelaufen
        </h1>
        <p className="text-sm text-muted-foreground">
          Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder wechseln Sie zur Anmeldung.
        </p>
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
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Zur Anmeldung
          </Link>
        </div>
      </div>
    </div>
  );
}
