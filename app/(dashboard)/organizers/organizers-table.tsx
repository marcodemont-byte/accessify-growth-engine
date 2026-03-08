"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { OrganizerContact } from "@/lib/dashboard-queries";
import type { EventLead } from "@/lib/dashboard-queries";
import { formatDate } from "@/lib/utils";

type Row = OrganizerContact & { event_count: number };

export function OrganizersTable({ organizers }: { organizers: Row[] }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<{
    organizer: Row;
    events: EventLead[];
  } | null>(null);

  async function openDetail(org: Row) {
    const res = await fetch(`/api/organizers/${encodeURIComponent(org.organizer_name)}`);
    const data = res.ok ? await res.json() : { events: [] };
    setSelected({ organizer: org, events: data.events ?? [] });
    setSheetOpen(true);
  }

  return (
    <>
      <Card className="rounded-2xl">
        <CardContent className="p-0">
          <ScrollArea className="h-[70vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card border-b border-border">
                <tr>
                  <th className="text-left font-medium p-3">Organizer</th>
                  <th className="text-left font-medium p-3">Website</th>
                  <th className="text-right font-medium p-3">Events</th>
                  <th className="text-left font-medium p-3">Email</th>
                  <th className="text-left font-medium p-3">LinkedIn</th>
                  <th className="text-left font-medium p-3">Coverage</th>
                </tr>
              </thead>
              <tbody>
                {organizers.map((org) => (
                  <tr
                    key={org.id}
                    onClick={() => openDetail(org)}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                  >
                    <td className="p-3 font-medium">{org.organizer_name}</td>
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
                    <td className="p-3 text-right">{org.event_count}</td>
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
                ))}
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
                        <span>{e.event_name}</span>
                        <span className="text-muted-foreground shrink-0">
                          {formatDate(e.event_date)}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
