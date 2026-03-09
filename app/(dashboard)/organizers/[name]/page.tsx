import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrganizerByName } from "@/lib/dashboard-queries";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, MapPin } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  sport: "Sport",
  kultur: "Kultur",
  business: "Business",
  bildung: "Bildung",
  oeffentlicher_sektor: "Öffentlicher Sektor",
  community: "Community",
  other: "Sonstige",
  unknown: "Unbekannt",
};

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ name: string }> };

export default async function OrganizerDetailPage({ params }: Props) {
  const { name } = await params;
  const organizerName = decodeURIComponent(name);
  const { organizer, events } = await getOrganizerByName(organizerName);

  if (!organizer && (!events || events.length === 0)) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/organizers"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Organizers
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight mt-2 flex items-center gap-2">
          <Building2 className="h-8 w-8 text-muted-foreground" />
          {organizerName}
        </h1>
        {organizer && (
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {organizer.website && (
              <a
                href={organizer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {organizer.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {organizer.contact_email && (
              <span>{organizer.contact_email}</span>
            )}
            {organizer.linkedin_url && (
              <a
                href={organizer.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                LinkedIn
              </a>
            )}
          </div>
        )}
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Events ({events?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!events || events.length === 0 ? (
            <p className="text-muted-foreground text-sm p-6">Keine Events für diesen Organizer.</p>
          ) : (
            <div className="overflow-x-auto rounded-b-2xl border-t border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left font-medium p-3">Event</th>
                    <th className="text-left font-medium p-3">Datum</th>
                    <th className="text-left font-medium p-3">Stadt</th>
                    <th className="text-left font-medium p-3">Kategorie</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                    >
                      <td className="p-3 font-medium">
                        <Link
                          href={`/events?highlight=${e.id}`}
                          className="text-primary hover:underline"
                        >
                          {e.event_name}
                        </Link>
                      </td>
                      <td className="p-3 text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(e.event_date)}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {e.city ? (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {e.city}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORY_LABELS[e.event_category ?? "unknown"] ?? e.event_category ?? "—"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
