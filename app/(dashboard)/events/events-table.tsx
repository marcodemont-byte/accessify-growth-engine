"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/lib/utils";
import type { EventLeadWithPhase } from "@/lib/dashboard-queries";
import { EVENT_PHASE_LABELS } from "@/lib/event-phases";
import { EVENT_CATEGORIES } from "@/lib/event-categorization";
import { Search, Filter, X } from "lucide-react";

const COUNTRIES = ["AT", "CH", "DE"];
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
const STATUSES = [
  "new",
  "review",
  "enriched",
  "contacted",
  "follow-up",
  "meeting",
  "won",
  "lost",
];

const PHASE_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline" | "success" | "warning"> = {
  too_early: "secondary",
  prepare: "warning",
  active: "success",
  too_late: "outline",
  past: "secondary",
};

export function EventsTable({
  events,
  highlightId,
}: {
  events: EventLeadWithPhase[];
  highlightId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventLeadWithPhase | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v == null || v === "") next.delete(k);
        else next.set(k, v);
      });
      router.push(`/events?${next.toString()}`);
    },
    [router, searchParams]
  );

  const openDetail = (e: EventLeadWithPhase) => {
    setSelectedEvent(e);
    setSheetOpen(true);
  };

  const hasActiveFilters =
    searchParams.get("search") ||
    (searchParams.get("country") && searchParams.get("country") !== "all") ||
    (searchParams.get("status") && searchParams.get("status") !== "all") ||
    (searchParams.get("category") && searchParams.get("category") !== "all") ||
    (searchParams.get("minScore") && searchParams.get("minScore") !== "all");

  return (
    <>
      <Card className="rounded-2xl overflow-hidden shadow-panel border-border">
        <div className="bg-muted/30 border-b border-border px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters</span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-8 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={() => updateParams({})}
              >
                <X className="h-4 w-4 mr-1.5" />
                Clear all
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-end gap-5">
            <div className="flex-1 min-w-[240px] space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Events, organizers…"
                  defaultValue={searchParams.get("search") ?? ""}
                  className="pl-10 h-10 rounded-xl bg-background border-border"
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter") {
                      updateParams({ search: (ev.target as HTMLInputElement).value || undefined });
                    }
                  }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Country
              </label>
              <Select
                value={searchParams.get("country") ?? "all"}
                onValueChange={(v) => updateParams({ country: v === "all" ? undefined : v })}
              >
                <SelectTrigger className="w-[130px] h-10 rounded-xl bg-background border-border">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All countries</SelectItem>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </label>
              <Select
                value={searchParams.get("status") ?? "all"}
                onValueChange={(v) => updateParams({ status: v === "all" ? undefined : v })}
              >
                <SelectTrigger className="w-[140px] h-10 rounded-xl bg-background border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Category
              </label>
              <Select
                value={searchParams.get("category") ?? "all"}
                onValueChange={(v) => updateParams({ category: v === "all" ? undefined : v })}
              >
                <SelectTrigger className="w-[160px] h-10 rounded-xl bg-background border-border">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {EVENT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c] ?? c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Min score
              </label>
              <Select
                value={searchParams.get("minScore") ?? "all"}
                onValueChange={(v) => updateParams({ minScore: v === "all" ? undefined : v })}
              >
                <SelectTrigger className="w-[120px] h-10 rounded-xl bg-background border-border">
                  <SelectValue placeholder="Score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="50">50+</SelectItem>
                  <SelectItem value="70">70+</SelectItem>
                  <SelectItem value="85">85+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <CardContent className="p-0">
          <ScrollArea className="h-[62vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground py-4 pl-6 pr-4">Phase</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground py-4 px-4">Event</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground py-4 px-4">Date</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground py-4 px-4">Category</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground py-4 px-4">Country</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground py-4 px-4">City</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground py-4 px-4">Organizer</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground py-4 px-4">Website</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground py-4 px-4">Coverage</th>
                  <th className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground py-4 pr-6 pl-4">Score</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground py-4 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => {
                  const hasEmail = !!e.contact_email?.trim();
                  const hasLinkedIn = !!e.linkedin_url?.trim();
                  const coverageLevel = hasEmail && hasLinkedIn ? "full" : hasEmail || hasLinkedIn ? "partial" : "none";
                  const phaseLabel = EVENT_PHASE_LABELS[e.phase] ?? e.phase;
                  const phaseVariant = PHASE_BADGE_VARIANT[e.phase] ?? "secondary";
                  return (
                    <tr
                      key={e.id}
                      onClick={() => openDetail(e)}
                      className={`border-b border-border/50 hover:bg-muted/25 transition-colors cursor-pointer group ${
                        highlightId === e.id ? "bg-primary/10" : ""
                      }`}
                    >
                      <td className="py-4 pl-6 pr-4">
                        <Badge variant={phaseVariant} className="text-xs font-medium px-2.5 py-0.5 rounded-lg whitespace-nowrap">
                          {phaseLabel}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 font-medium text-foreground">{e.event_name}</td>
                      <td className="py-4 px-4 text-muted-foreground whitespace-nowrap">{formatDate(e.event_date)}</td>
                      <td className="py-4 px-4">
                        <Badge variant="secondary" className="text-xs font-medium px-2.5 py-0.5 rounded-lg">
                          {CATEGORY_LABELS[e.event_category ?? "unknown"] ?? e.event_category ?? "—"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">{e.country}</td>
                      <td className="py-4 px-4 text-muted-foreground">{e.city ?? "—"}</td>
                      <td className="py-4 px-4">{e.organizer_name}</td>
                      <td className="py-4 px-4 max-w-[160px]">
                        {e.organizer_website ? (
                          <a
                            href={e.organizer_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline truncate block"
                            onClick={(ev) => ev.stopPropagation()}
                          >
                            {e.organizer_website.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {hasEmail && (
                            <Badge variant="success" className="text-xs font-semibold px-2.5 py-0.5 rounded-md">
                              Email
                            </Badge>
                          )}
                          {hasLinkedIn && (
                            <Badge variant="success" className="text-xs font-semibold px-2.5 py-0.5 rounded-md">
                              LinkedIn
                            </Badge>
                          )}
                          {coverageLevel === "none" && (
                            <Badge variant="warning" className="text-xs font-semibold px-2.5 py-0.5 rounded-md">
                              No coverage
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4 pr-6 pl-4 text-right font-medium tabular-nums">{e.lead_score ?? "—"}</td>
                      <td className="py-4 px-4">
                        <Badge variant="secondary" className="font-medium px-2.5 py-0.5 rounded-lg capitalize">
                          {e.status ?? "new"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent title={selectedEvent?.event_name ?? "Event detail"} className="overflow-y-auto w-full max-w-lg">
          {selectedEvent && (
            <div className="space-y-5 text-sm mt-6">
              <div className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Phase</span>
                <p>
                  <Badge variant={PHASE_BADGE_VARIANT[selectedEvent.phase] ?? "secondary"} className="font-medium px-2.5 py-0.5 rounded-lg">
                    {EVENT_PHASE_LABELS[selectedEvent.phase] ?? selectedEvent.phase}
                  </Badge>
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Category</span>
                <p>
                  <Badge variant="secondary" className="font-medium px-2.5 py-0.5 rounded-lg">
                    {CATEGORY_LABELS[selectedEvent.event_category ?? "unknown"] ?? selectedEvent.event_category ?? "—"}
                  </Badge>
                  {selectedEvent.category_confidence != null && (
                    <span className="ml-2 text-muted-foreground text-xs">
                      ({Math.round(selectedEvent.category_confidence * 100)}%)
                    </span>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Organizer</span>
                <p className="font-medium text-foreground">{selectedEvent.organizer_name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</span>
                <p className="text-foreground">{formatDate(selectedEvent.event_date)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Country / City</span>
                <p className="text-foreground">{selectedEvent.country}{selectedEvent.city ? ` / ${selectedEvent.city}` : ""}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Website</span>
                <p className="text-foreground">
                  {selectedEvent.organizer_website ? (
                    <a
                      href={selectedEvent.organizer_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {selectedEvent.organizer_website}
                    </a>
                  ) : "—"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Contact email</span>
                <p className="text-foreground">{selectedEvent.contact_email ?? "—"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">LinkedIn</span>
                <p className="text-foreground">
                  {selectedEvent.linkedin_url ? (
                    <a
                      href={selectedEvent.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {selectedEvent.linkedin_url}
                    </a>
                  ) : "—"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lead score</span>
                <p className="text-foreground font-medium tabular-nums">{selectedEvent.lead_score ?? "—"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</span>
                <p><Badge variant="secondary" className="font-medium px-2.5 py-0.5 rounded-lg capitalize">{selectedEvent.status ?? "new"}</Badge></p>
              </div>
              {selectedEvent.notes && (
                <div className="space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Notes</span>
                  <p className="text-foreground whitespace-pre-wrap">{selectedEvent.notes}</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
