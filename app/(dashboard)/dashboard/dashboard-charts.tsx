"use client";

import { useRef, useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/error-boundary";

type ByCountry = { country: string; count: number }[];
type Coverage = { name: string; value: number; fill: string }[];
type Timeline = { date: string; count: number }[];

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
const DACH_NAMES = ["Germany", "Austria", "Switzerland"];
const NAME_TO_CODE: Record<string, string> = {
  Germany: "DE",
  Austria: "AT",
  Switzerland: "CH",
};

function ChartPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex h-[220px] w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

function EventsByCountryMap({ byCountry }: { byCountry?: ByCountry | null }) {
  const safeData = Array.isArray(byCountry) ? byCountry : [];
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 340, height: 200 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect ?? {};
      if (width && height) setSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const getCount = (geo: { properties?: { name?: string } }) => {
    const code = geo.properties?.name && NAME_TO_CODE[geo.properties.name];
    return safeData.find((c) => c.country === code)?.count ?? 0;
  };

  return (
    <div ref={containerRef} className="h-full w-full min-h-[180px]">
      <ComposableMap
        width={size.width}
        height={size.height}
        projection="geoMercator"
        projectionConfig={{
          center: [10, 50],
          scale: Math.min(size.width, size.height) * 4.2,
        }}
      >
      <Geographies geography={GEO_URL}>
        {({ geographies }) => {
          const list = Array.isArray(geographies) ? geographies : [];
          const dach = list.filter((g) =>
            DACH_NAMES.includes(g?.properties?.name ?? "")
          );
          return dach.map((geo, i) => {
            try {
              const count = getCount(geo);
              const coords = geoCentroid(geo);
              const x = Number(coords?.[0]) || 0;
              const y = Number(coords?.[1]) || 0;
              return (
                <g key={geo?.rsmKey ?? `dach-${i}`}>
                  <Geography
                    geography={geo}
                    fill="hsl(var(--muted))"
                    stroke="hsl(var(--border))"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", fill: "hsl(var(--muted))" },
                      pressed: { outline: "none" },
                    }}
                  />
                  <Marker coordinates={[x, y]}>
                    <circle
                      r={Math.max(12, Math.min(28, 10 + count * 0.8))}
                      fill="hsl(162, 65%, 45%)"
                      fillOpacity={0.85}
                      stroke="hsl(var(--card))"
                      strokeWidth={2}
                    />
                    <text
                      textAnchor="middle"
                      y={4}
                      fill="hsl(var(--card))"
                      fontSize={11}
                      fontWeight={600}
                    >
                      {count}
                    </text>
                  </Marker>
                </g>
              );
            } catch {
              return null;
            }
          });
        }}
      </Geographies>
    </ComposableMap>
    </div>
  );
}

export function DashboardCharts({
  byCountry,
  coverage,
  timeline,
}: {
  byCountry?: ByCountry | null;
  coverage?: Coverage | null;
  timeline?: Timeline | null;
}) {
  const safeByCountry = Array.isArray(byCountry) ? byCountry : [];
  const safeCoverage = Array.isArray(coverage) ? coverage : [];
  const safeTimeline = Array.isArray(timeline) ? timeline : [];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <ErrorBoundary title="Events by country">
        <Card className="rounded-2xl lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Events by country</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full [&_svg]:max-h-full [&_svg]:w-auto">
              <EventsByCountryMap byCountry={safeByCountry} />
            </div>
          </CardContent>
        </Card>
      </ErrorBoundary>

      <ErrorBoundary title="Lead coverage status">
        <Card className="rounded-2xl lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Lead coverage status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              {safeCoverage.length === 0 ? (
                <ChartPlaceholder title="No coverage data" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={safeCoverage}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {safeCoverage.map((entry, i) => (
                        <Cell key={i} fill={entry?.fill ?? "hsl(var(--muted))"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </ErrorBoundary>

      <ErrorBoundary title="Upcoming events timeline">
        <Card className="rounded-2xl lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Upcoming events timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              {safeTimeline.length === 0 ? (
                <ChartPlaceholder title="No timeline data" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={safeTimeline.map((t) => ({
                      ...t,
                      date: typeof t?.date === "string" ? t.date.slice(5) : "",
                      count: Number(t?.count) || 0,
                    }))}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(162, 65%, 45%)"
                      strokeWidth={2}
                      dot={{ fill: "hsl(162, 65%, 45%)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </ErrorBoundary>
    </div>
  );
}
