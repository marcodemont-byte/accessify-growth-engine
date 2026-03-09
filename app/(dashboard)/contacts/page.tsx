import { getContactsCombined, getOrganizerNames } from "@/lib/dashboard-queries";
import { ContactsTable } from "./contacts-table";
import { AddContactForm } from "./add-contact-form";

export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const hasEmail = searchParams.email === "1" ? true : undefined;
  const hasLinkedIn = searchParams.linkedin === "1" ? true : undefined;
  const minConfidence =
    typeof searchParams.confidence === "string"
      ? parseFloat(searchParams.confidence)
      : undefined;
  const role = typeof searchParams.role === "string" ? searchParams.role : undefined;

  const [contacts, organizerNames] = await Promise.all([
    getContactsCombined({ hasEmail, hasLinkedIn, minConfidence, role }),
    getOrganizerNames(),
  ]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground mt-1">
            Company and person-level contacts from organizer_contacts and contact_people
          </p>
        </div>
        <AddContactForm organizerNames={organizerNames} />
      </div>
      <ContactsTable contacts={contacts} />
    </div>
  );
}
