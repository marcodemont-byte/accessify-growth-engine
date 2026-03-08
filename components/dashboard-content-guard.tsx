"use client";

import React from "react";
import Link from "next/link";
import { ErrorBoundary } from "@/components/error-boundary";

/**
 * Wraps dashboard main content so a render error never shows a blank page.
 * Shows a minimal fallback with link to refresh.
 */
export function DashboardContentGuard({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      title="Dashboard"
      fallback={
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
          <p className="text-sm text-muted-foreground text-center">
            Der Dashboard-Inhalt konnte nicht angezeigt werden.
          </p>
          <Link
            href="/dashboard"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Seite neu laden
          </Link>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
