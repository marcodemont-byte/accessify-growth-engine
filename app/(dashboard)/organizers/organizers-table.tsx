"use client";

import { useState, useCallback, Fragment } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { OrganizerContact } from "@/lib/dashboard-queries";
import type { EventLead } from "@/lib/dashboard-queries";
import { formatDate } from "@/lib/utils";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";

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

type Row = OrganizerContact & { event_count: number };

export function OrganizersTable({ organizers }: { organizers: Row[] }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<{
    organizer: Row;
    events: EventLead[];
  } | null>(null);
  const [expandedName, setExpandedName] = useState<string | null>(null);
  const [eventsCache, setEventsCache] = useState<Record<string, EventLead[]>>({});
  const [loadingName, setLoadingName] = useState<string | null>(null);

  const toggleExpand = useCallback(
    async (e: React.MouseEvent, org: Row) => {
      e.stopPropagation();
      const name = org.organizer_name;
      if (expandedName === name) {
        setExpandedName(null);
        return;
      }
      setExpandedName(name);
      if (eventsCache[name]) return;
      setLoadingName(name);
      try {
        const res = await fetch(`/api/organizers/${encodeURIComponent(name)}`);
        const data = res.ok ? await res.json() : { events: [] };
        const events = (data.events ?? []) as EventLead[];
        setEventsCache((prev) => ({ ...prev, [name]: events }));
      } finally {
        setLoadingName(null);
      }
    },
    [expandedName, eventsCache]
  );

  function openDetail(org: Row) {
    const name = org.organizer_name;
    const cached = eventsCache[name];
    if (cached) {
      setSelected({ organizer: org, events: cached });
      setSheetOpen(true);
      return;
    }
    setSelected({ organizer: org, events: [] });
    setSheetOpen(true);
    fetch(`/api/organizers/${encodeURIComponent(name)}`)
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data) => {
        const events = (data.events ?? []) as EventLead[];
        setEventsCache((prev) => ({ ...prev, [name]: events }));
        setSelected((s) => (s ? { ...s, events } : null));
      });
  }

  return (
    <>
      <Card className="rounded-2xl">
        <CardContent className="p-0">
          <ScrollArea className="h-[70vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card border-b border-border">
                <tr>
                  <th className="text-left font-medium p-3 w-10" />
                  <th className="text-left font-medium p-3">Organizer</th>
                  <th className="text-left font-medium p-3">Website</th>
                  <th className="text-right font-medium p-3">Events</th>
                  <th className="text-left font-medium p-3">Email</th>
                  <th className="text-left font-medium p-3">LinkedIn</th>
                  <th className="text-left font-medium p-3">Coverage</th>
                </tr>
              </thead>
              <tbody>
                {organizers.map((org) => {
                  const isExpanded = expandedName === org.organizer_name;
                  const events = eventsCache[org.organizer_name];
                  const loading = loadingName === org.organizer_name;
                  return (
                    <Fragment key={org.id}>
                      <tr
                        onClick={() => openDetail(org)}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                      >
                        <td className="p-3 w-10" onClick={(e) => toggleExpand(e, org)}>
                          <button
                            type="button"
                            className="p-0.5 rounded hover:bg-muted/50 inline-flex items-center justify-center"
                            aria-label={isExpanded ? "Zuklappen" : "Events anzeigen"}
                          >
                            {loading ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </td>
                        <td className="p-3 font-medium">
                          <Link
                            href={`/organizers/${encodeURIComponent(org.organizer_name)}`}
                            className="text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {org.organizer_name}
                          </Link>
                        </td>
                        <td className="p-3 text-muted-foreground max-w-[180px] truncate">
                          {org.website ? (
                            <a
                              href={org.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {org.website.replace(/^https?:\/\//, "")}
                            </a>
                          ) : "—"}
                        </td>
                        <td className="p-3 text-right tabular-nums">{org.event_count}</td>
                        <td className="p-3 text-muted-foreground max-w-[160px] truncate">
                          {org.contact_email ?? "—"}
                        </td>
                        <td className="p-3">
                          {org.linkedin_url ? (
                            <a
                              href={org.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Link
                            </a>
                          ) : "—"}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              org.contact_email || org.linkedin_url
                                ? "success"
                                : "warning"
                            }
                          >
                            {org.contact_email && org.linkedin_url
                              ? "Full"
                              : org.contact_email || org.linkedin_url
                                ? "Partial"
                                : "None"}
                          </Badge>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${org.id}-exp`} className="bg-muted/10">
                          <td colSpan={7} className="p-0 align-top">
                            <div className="px-4 pb-3 pt-0">
                              {loading ? (
                                <div className="flex items-center gap-2 text-muted-foreground text-sm py-3">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Events laden…
                                </div>
                              ) : events && events.length > 0 ? (
                                <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                                  <thead>
                                    <tr className="bg-muted/30 border-b border-border">
                                      <th className="text-left font-medium p-2 pl-4">Event</th>
                                      <th className="text-left font-medium p-2">Datum</th>
                                      <th className="text-left font-medium p-2">Stadt</th>
                                      <th className="text-left font-medium p-2">Kategorie</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {events.map((e) => (
                                      <tr
                                        key={e.id}
                                        className="border-b border-border/50 last:border-0 hover:bg-muted/20"
                                      >
                                        <td className="p-2 pl-4 font-medium">
                                          <Link
                                            href={`/events?highlight=${e.id}`}
                                            className="text-primary hover:underline"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {e.event_name}
                                          </Link>
                                        </td>
                                        <td className="p-2 text-muted-foreground">
                                          {formatDate(e.event_date)}
                                        </td>
                                        <td className="p-2 text-muted-foreground">
                                          {e.city ?? "—"}
                                        </td>
                                        <td className="p-2">
                                          <Badge variant="secondary" className="text-xs">
                                            {CATEGORY_LABELS[e.event_category ?? "unknown"] ??
                                              e.event_category ??
                                              "—"}
                                          </Badge>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p className="text-muted-foreground text-sm py-3">
                                  Keine Events für diesen Organizer.
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          title={selected?.organizer.organizer_name ?? "Organizer"}
          className="overflow-y-auto"
        >
          {selected && (
            <div className="space-y-6 text-sm">
              <div>
                <span className="text-muted-foreground">Website</span>
                <p className="mt-1">
                  {selected.organizer.website ? (
                    <a
                      href={selected.organizer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {selected.organizer.website}
                    </a>
                  ) : "—"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">LinkedIn</span>
                <p className="mt-1">
                  {selected.organizer.linkedin_url ? (
                    <a
                      href={selected.organizer.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {selected.organizer.linkedin_url}
                    </a>
                  ) : "—"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Contact email</span>
                <p className="mt-1">{selected.organizer.contact_email ?? "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Related events</span>
                <ul className="mt-2 space-y-1.5">
                  {selected.events.length === 0 ? (
                    <li className="text-muted-foreground">No events</li>
                  ) : (
                    selected.events.map((e) => (
                      <li key={e.id} className="flex justify-between gap-2">
                        <Link
                          href={`/events?highlight=${e.id}`}
                          className="text-primary hover:underline"
                        >
                          {e.event_name}
                        </Link>
                        <span className="text-muted-foreground shrink-0">
                          {formatDate(e.event_date)}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
                {selected.events.length > 0 && (
                  <Link
                    href={`/organizers/${encodeURIComponent(selected.organizer.organizer_name)}`}
                    className="mt-2 inline-block text-primary hover:underline text-xs font-medium"
                  >
                    Alle Events anzeigen →
                  </Link>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
