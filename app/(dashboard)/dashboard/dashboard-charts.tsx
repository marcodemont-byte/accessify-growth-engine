"use client";

import { useRef, useState, useEffect } from "react";
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

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
const DACH_NAMES = ["Germany", "Austria", "Switzerland"];
const NAME_TO_CODE: Record<string, string> = {
  Germany: "DE",
  Austria: "AT",
  Switzerland: "CH",
};

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

export function DashboardCharts({ byCountry }: { byCountry?: ByCountry | null }) {
  const safeByCountry = Array.isArray(byCountry) ? byCountry : [];

  return (
    <div className="grid gap-6 lg:grid-cols-1">
      <ErrorBoundary title="Events by country">
        <Card className="rounded-2xl">
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
    </div>
  );
}
