import { getOrganizerContacts } from "@/lib/dashboard-queries";
import { OrganizersTable } from "./organizers-table";

export const dynamic = "force-dynamic";

export default async function OrganizersPage() {
  const organizers = await getOrganizerContacts();
  const withEventCounts = await Promise.all(
    organizers.map(async (org) => {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { count } = await supabase
        .from("event_leads")
        .select("id", { count: "exact", head: true })
        .eq("organizer_name", org.organizer_name);
      return { ...org, event_count: count ?? 0 };
    })
  );
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Organizers</h1>
        <p className="text-muted-foreground mt-1">
          Organizer contact data grouped by organization
        </p>
      </div>
      <OrganizersTable organizers={withEventCounts} />
    </div>
  );
}
