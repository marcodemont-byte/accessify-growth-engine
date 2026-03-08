import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { DashboardContentGuard } from "@/components/dashboard-content-guard";
import { ErrorBoundary } from "@/components/error-boundary";

export const dynamic = "force-dynamic";

function TopbarFallback() {
  return (
    <header className="flex h-14 shrink-0 items-center border-b border-border bg-background/95 px-6">
      <span className="text-sm text-muted-foreground">Menü</span>
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ErrorBoundary title="Sidebar" fallback={<aside className="w-56 border-r border-border bg-card/50" />}>
        <Sidebar />
      </ErrorBoundary>
      <div className="flex flex-1 flex-col overflow-hidden">
        <ErrorBoundary title="Topbar" fallback={<TopbarFallback />}>
          <Topbar />
        </ErrorBoundary>
        <main className="flex-1 overflow-auto p-6">
          <DashboardContentGuard>{children}</DashboardContentGuard>
        </main>
      </div>
    </div>
  );
}
