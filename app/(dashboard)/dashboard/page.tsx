import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getDashboardStats,
  getEventsByCountry,
  getTopUpcomingOpportunities,
  getEventLeadsDebug,
} from "@/lib/dashboard-queries";
import { formatDate } from "@/lib/utils";
import { DashboardCharts } from "./dashboard-charts";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  Calendar,
  Building2,
  Mail,
  Linkedin,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function DashboardLoadFallback({ message }: { message: string }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">{message}</p>
      </div>
      <Card className="rounded-2xl border-amber-500/50 bg-amber-500/5">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
          <AlertCircle className="h-10 w-10 text-amber-500" />
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Die Daten konnten nicht geladen werden. Die App läuft weiter; Sie können die Seite
            aktualisieren oder zu anderen Bereichen wechseln.
          </p>
          <Link
            href="/dashboard"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Seite aktualisieren
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

const DEFAULT_STATS = {
  totalEvents: 0,
  totalOrganizers: 0,
  organizersWithEmail: 0,
  organizersWithLinkedIn: 0,
  eventsWithoutCoverage: 0,
  upcoming90: 0,
  needCoverage: 0,
};

const DEFAULT_BY_COUNTRY = [
  { country: "CH", count: 0 },
  { country: "DE", count: 0 },
  { country: "AT", count: 0 },
  { country: "Other", count: 0 },
];

type DebugData = {
  rawCount: number | null;
  countError: { message: string; code?: string; details?: unknown } | null;
  sampleError: { message: string; code?: string } | null;
  sampleRows: unknown[];
};

const DEFAULT_DEBUG: DebugData = {
  rawCount: null,
  countError: null,
  sampleError: null,
  sampleRows: [],
};

export default async function DashboardPage() {
  let results: PromiseSettledResult<unknown>[];
  try {
    results = await Promise.allSettled([
      getDashboardStats(),
      getEventsByCountry(),
      getTopUpcomingOpportunities(10),
      getEventLeadsDebug(),
    ]);
  } catch (err) {
    console.error("Dashboard data load failed:", err);
    return <DashboardLoadFallback message="Event discovery and lead coverage at a glance" />;
  }

  try {
  const rawStats = results[0].status === "fulfilled" ? results[0].value : null;
  const stats =
    rawStats &&
    typeof rawStats === "object" &&
    "totalEvents" in rawStats &&
    "totalOrganizers" in rawStats
      ? (rawStats as typeof DEFAULT_STATS)
      : DEFAULT_STATS;

  const byCountry =
    results[1].status === "fulfilled" && Array.isArray(results[1].value)
      ? results[1].value
      : DEFAULT_BY_COUNTRY;
  const opportunities =
    results[2].status === "fulfilled" && Array.isArray(results[2].value)
      ? results[2].value
      : [];
  const debug: DebugData =
    results[3].status === "fulfilled" &&
    results[3].value != null &&
    typeof results[3].value === "object" &&
    "rawCount" in (results[3].value as object)
      ? (results[3].value as DebugData)
      : DEFAULT_DEBUG;

  const safeStats = {
    totalEvents: Number(stats?.totalEvents) || 0,
    totalOrganizers: Number(stats?.totalOrganizers) || 0,
    organizersWithEmail: Number(stats?.organizersWithEmail) || 0,
    organizersWithLinkedIn: Number(stats?.organizersWithLinkedIn) || 0,
    eventsWithoutCoverage: Number(stats?.eventsWithoutCoverage) || 0,
    upcoming90: Number(stats?.upcoming90) || 0,
    needCoverage: Number((stats as { needCoverage?: number } | null)?.needCoverage) || 0,
  };

  const kpis = [
    { label: "Total Events", value: safeStats.totalEvents, icon: Calendar },
    { label: "Total Organizers", value: safeStats.totalOrganizers, icon: Building2 },
    { label: "Organizers with Email", value: safeStats.organizersWithEmail, icon: Mail },
    { label: "Organizers with LinkedIn", value: safeStats.organizersWithLinkedIn, icon: Linkedin },
    {
      label: "Brauchen Coverage",
      value: safeStats.needCoverage,
      icon: AlertCircle,
    },
    {
      label: "Events without contact coverage",
      value: safeStats.eventsWithoutCoverage,
      icon: AlertCircle,
    },
    {
      label: "Upcoming events (90 days)",
      value: safeStats.upcoming90,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Event discovery and lead coverage at a glance
        </p>
      </div>

      <ErrorBoundary title="KPIs">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ErrorBoundary>

      <ErrorBoundary title="Charts">
        <DashboardCharts byCountry={byCountry} />
      </ErrorBoundary>

      <ErrorBoundary title="Top upcoming opportunities">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Top upcoming opportunities</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sorted by event date and lead score
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left font-medium p-3">Event</th>
                    <th className="text-left font-medium p-3">Date</th>
                    <th className="text-left font-medium p-3">City</th>
                    <th className="text-left font-medium p-3">Organizer</th>
                    <th className="text-left font-medium p-3">Contact coverage</th>
                    <th className="text-right font-medium p-3">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(opportunities) ? opportunities : []).map((row, idx) => {
                    const id = row?.id ?? idx;
                    const eventName = row?.event_name ?? "—";
                    const eventDate = row?.event_date ?? null;
                    const city = row?.city ?? "—";
                    const organizerName = row?.organizer_name ?? "—";
                    const contactCoverage = row?.contact_coverage ?? "None";
                    const leadScore = row?.lead_score;
                    return (
                  <tr
                    key={id}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-3 font-medium">
                      <Link
                        href={`/events?highlight=${id}`}
                        className="text-primary hover:underline"
                      >
                        {eventName}
                      </Link>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {formatDate(eventDate)}
                    </td>
                    <td className="p-3">{city}</td>
                    <td className="p-3">{organizerName}</td>
                    <td className="p-3">
                      <Badge
                        variant={
                          contactCoverage === "None" ? "warning" : "success"
                        }
                      >
                        {contactCoverage}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      {leadScore != null ? leadScore : "—"}
                    </td>
                  </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </ErrorBoundary>

      <ErrorBoundary title="Debug">
        <Card className="rounded-2xl border-amber-500/50 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-base text-amber-600 dark:text-amber-400">
            Debug: event_leads (temporary)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Raw Supabase response from same server client used by dashboard widgets.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <span className="font-medium text-muted-foreground">Raw event count from Supabase:</span>
            <span className="ml-2 font-mono font-bold">
              {debug?.rawCount != null ? String(debug.rawCount) : "null"}
            </span>
          </div>
          {debug?.countError && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3">
              <span className="font-medium text-red-600 dark:text-red-400">Count query error:</span>
              <pre className="mt-1 overflow-auto text-xs">
                {JSON.stringify(debug?.countError, null, 2)}
              </pre>
            </div>
          )}
          {debug?.sampleError && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3">
              <span className="font-medium text-red-600 dark:text-red-400">Sample query error:</span>
              <pre className="mt-1 overflow-auto text-xs">
                {JSON.stringify(debug?.sampleError, null, 2)}
              </pre>
            </div>
          )}
          <div>
            <span className="font-medium text-muted-foreground">Sample rows (event_leads, first 5):</span>
            <pre className="mt-1 max-h-48 overflow-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs">
              {Array.isArray(debug?.sampleRows) && debug.sampleRows.length > 0
                ? JSON.stringify(debug.sampleRows, null, 2)
                : "[] (no rows returned)"}
            </pre>
          </div>
        </CardContent>
      </Card>
      </ErrorBoundary>
    </div>
  );
  } catch (err) {
    console.error("Dashboard render failed:", err);
    return <DashboardLoadFallback message="Event discovery and lead coverage at a glance" />;
  }
}
