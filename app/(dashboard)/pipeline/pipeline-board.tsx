"use client";

import { useEffect, useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { formatDate } from "@/lib/utils";
import type { EventLead } from "@/lib/dashboard-queries";

const COLUMNS = [
  "new",
  "review",
  "enriched",
  "contacted",
  "follow-up",
  "meeting",
  "won",
  "lost",
] as const;

export function PipelineBoard() {
  const [events, setEvents] = useState<EventLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((data) => {
        setEvents(data.events ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const byStatus = COLUMNS.reduce(
    (acc, col) => {
      acc[col] = events.filter((e) => (e.status ?? "new") === col);
      return acc;
    },
    {} as Record<string, EventLead[]>
  );

  async function handleDrop(eventId: string, newStatus: string) {
    const res = await fetch(`/api/events/${eventId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) return;
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, status: newStatus } : e))
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading pipeline…
      </div>
    );
  }

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-4 pb-4">
        {COLUMNS.map((status) => (
          <div
            key={status}
            className={`flex w-[280px] shrink-0 flex-col rounded-2xl border-2 border-dashed p-3 transition-colors ${
              dragOverColumn === status
                ? "border-primary bg-primary/5"
                : "border-border bg-card/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverColumn(status);
            }}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverColumn(null);
              const id = e.dataTransfer.getData("eventId");
              if (id) handleDrop(id, status);
            }}
          >
            <h3 className="mb-3 text-sm font-semibold capitalize text-muted-foreground">
              {status.replace("-", " ")}
            </h3>
            <div className="flex flex-1 flex-col gap-2">
              {byStatus[status]?.map((ev) => (
                <div
                  key={ev.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("eventId", ev.id);
                    setDraggedId(ev.id);
                  }}
                  onDragEnd={() => setDraggedId(null)}
                  className={`cursor-grab rounded-xl border border-border bg-card p-3 text-card-foreground shadow-panel active:cursor-grabbing ${
                    draggedId === ev.id ? "opacity-50" : ""
                  }`}
                >
                  <p className="font-medium leading-tight text-sm">{ev.event_name}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{ev.organizer_name}</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {formatDate(ev.event_date)} · {ev.city ?? "—"}
                  </p>
                  {ev.lead_score != null && (
                    <p className="text-xs mt-1">Score: {ev.lead_score}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
