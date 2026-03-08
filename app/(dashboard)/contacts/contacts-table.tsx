"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ContactRow } from "@/lib/dashboard-queries";

export function ContactsTable({ contacts }: { contacts: ContactRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value == null || value === "") next.delete(key);
      else next.set(key, value);
      router.push(`/contacts?${next.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <Card className="rounded-2xl">
      <CardHeader className="border-b border-border">
        <div className="flex flex-wrap items-center gap-4">
          <Select
            value={searchParams.get("email") === "1" ? "1" : "all"}
            onValueChange={(v) => updateFilter("email", v === "all" ? undefined : v)}
          >
            <SelectTrigger className="w-[160px] rounded-xl">
              <SelectValue placeholder="Email" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any</SelectItem>
              <SelectItem value="1">Email available</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={searchParams.get("linkedin") === "1" ? "1" : "all"}
            onValueChange={(v) => updateFilter("linkedin", v === "all" ? undefined : v)}
          >
            <SelectTrigger className="w-[160px] rounded-xl">
              <SelectValue placeholder="LinkedIn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any</SelectItem>
              <SelectItem value="1">LinkedIn available</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={searchParams.get("confidence") ?? "all"}
            onValueChange={(v) => updateFilter("confidence", v === "all" ? undefined : v)}
          >
            <SelectTrigger className="w-[160px] rounded-xl">
              <SelectValue placeholder="Confidence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any</SelectItem>
              <SelectItem value="0.5">0.5+</SelectItem>
              <SelectItem value="0.7">0.7+</SelectItem>
              <SelectItem value="0.9">0.9+</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={searchParams.get("role") ?? "all"}
            onValueChange={(v) => updateFilter("role", v === "all" ? undefined : v)}
          >
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any role</SelectItem>
              <SelectItem value="events">Events</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="partnership">Partnership</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => router.push("/contacts")}
          >
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[60vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-card border-b border-border">
              <tr>
                <th className="text-left font-medium p-3">Organizer</th>
                <th className="text-left font-medium p-3">Website</th>
                <th className="text-left font-medium p-3">Contact email</th>
                <th className="text-left font-medium p-3">LinkedIn</th>
                <th className="text-left font-medium p-3">Contact name</th>
                <th className="text-left font-medium p-3">Role</th>
                <th className="text-right font-medium p-3">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((row, i) => (
                <tr
                  key={`${row.organizer_name}-${row.contact_name ?? ""}-${i}`}
                  className="border-b border-border/50 hover:bg-muted/20"
                >
                  <td className="p-3 font-medium">{row.organizer_name}</td>
                  <td className="p-3 text-muted-foreground max-w-[140px] truncate">
                    {row.website ?? "—"}
                  </td>
                  <td className="p-3 text-muted-foreground max-w-[160px] truncate">
                    {row.contact_email ?? "—"}
                  </td>
                  <td className="p-3">
                    {row.linkedin_url ? (
                      <a
                        href={row.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Link
                      </a>
                    ) : "—"}
                  </td>
                  <td className="p-3">{row.contact_name ?? "—"}</td>
                  <td className="p-3">{row.contact_role ?? "—"}</td>
                  <td className="p-3 text-right">
                    {row.confidence_score != null
                      ? (row.confidence_score * 100).toFixed(0) + "%"
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
