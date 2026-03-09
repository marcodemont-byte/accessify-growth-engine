import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type OrganizerPayload = {
  type: "organizer";
  organizer_name: string;
  contact_email?: string | null;
  linkedin_url?: string | null;
  website?: string | null;
  contact_name?: string | null;
  contact_role?: string | null;
};

type PersonPayload = {
  type: "person";
  organizer_name: string;
  full_name?: string | null;
  role?: string | null;
  email?: string | null;
  linkedin_url?: string | null;
};

type Payload = OrganizerPayload | PersonPayload;

function isOrganizer(p: Payload): p is OrganizerPayload {
  return p.type === "organizer";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const p = body as Payload;
  if (!p || typeof p.type !== "string" || typeof p.organizer_name !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid type / organizer_name" },
      { status: 400 }
    );
  }

  const organizerName = p.organizer_name.trim();
  if (!organizerName) {
    return NextResponse.json(
      { error: "organizer_name is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  if (isOrganizer(p)) {
    const { error } = await supabase.from("organizer_contacts").upsert(
      {
        organizer_name: organizerName,
        website: (p.website?.trim() as string) || null,
        contact_email: p.contact_email?.trim() || null,
        linkedin_url: p.linkedin_url?.trim() || null,
        contact_name: p.contact_name?.trim() || null,
        contact_role: p.contact_role?.trim() || null,
        source: "manual",
      },
      { onConflict: "organizer_name" }
    );
    if (error) {
      console.error("organizer_contacts insert/update failed:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, type: "organizer" });
  }

  // person
  const email = (p as PersonPayload).email?.trim() || null;
  const { error } = await supabase.from("contact_people").insert({
    organizer_name: organizerName,
    full_name: (p as PersonPayload).full_name?.trim() || null,
    role: (p as PersonPayload).role?.trim() || null,
    email,
    linkedin_url: (p as PersonPayload).linkedin_url?.trim() || null,
    source: "manual",
    confidence_score: 1,
  });
  if (error) {
    console.error("contact_people insert failed:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, type: "person" });
}
