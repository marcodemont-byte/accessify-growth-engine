import { getEventLeadsSortedByPriority } from "@/lib/dashboard-queries";
import { EventsTable } from "./events-table";

export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function EventsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const country = typeof searchParams.country === "string" ? searchParams.country : undefined;
  const search = typeof searchParams.search === "string" ? searchParams.search : undefined;
  const status = typeof searchParams.status === "string" ? searchParams.status : undefined;
  const category = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const minScore =
    typeof searchParams.minScore === "string" ? parseInt(searchParams.minScore, 10) : undefined;
  const highlight = typeof searchParams.highlight === "string" ? searchParams.highlight : undefined;

  const events = await getEventLeadsSortedByPriority({ country, search, status, category, minScore });
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Events</h1>
        <p className="text-muted-foreground text-base">
          Event leads sorted by priority (Vorbereiten ohne Coverage → Aktionszone → Zu früh → Zu spät)
        </p>
      </div>
      <EventsTable events={events} highlightId={highlight} />
    </div>
  );
}
