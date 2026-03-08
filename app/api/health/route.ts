import { NextResponse } from "next/server";

/**
 * GET /api/health — No Supabase or Apify required. Use to verify the app runs.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "accessify-growth-engine",
    version: "1.0",
    timestamp: new Date().toISOString(),
  });
}
