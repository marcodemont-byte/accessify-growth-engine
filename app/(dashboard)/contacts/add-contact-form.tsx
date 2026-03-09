"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";

function Label({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" {...props}>
      {children}
    </label>
  );
}

type AddContactFormProps = {
  organizerNames: string[];
};

export function AddContactForm({ organizerNames }: AddContactFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"organizer" | "person">("organizer");
  const [organizer_name, setOrganizerName] = useState("");
  const [website, setWebsite] = useState("");
  const [contact_email, setContactEmail] = useState("");
  const [linkedin_url, setLinkedinUrl] = useState("");
  const [contact_name, setContactName] = useState("");
  const [contact_role, setContactRole] = useState("");
  const [full_name, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");

  const resetForm = () => {
    setType("organizer");
    setOrganizerName("");
    setWebsite("");
    setContactEmail("");
    setLinkedinUrl("");
    setContactName("");
    setContactRole("");
    setFullName("");
    setRole("");
    setEmail("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const org = organizer_name.trim();
    if (!org) {
      setError("Organizer / Firma ist Pflicht.");
      return;
    }
    if (type === "organizer") {
      if (!contact_email.trim() && !linkedin_url.trim()) {
        setError("Bitte E-Mail oder LinkedIn angeben.");
        return;
      }
    } else {
      if (!email.trim() && !linkedin_url.trim()) {
        setError("Bitte E-Mail oder LinkedIn angeben.");
        return;
      }
    }
    setLoading(true);
    setError(null);
    try {
      const body =
        type === "organizer"
          ? {
              type: "organizer",
              organizer_name: org,
              website: website.trim() || null,
              contact_email: contact_email.trim() || null,
              linkedin_url: linkedin_url.trim() || null,
              contact_name: contact_name.trim() || null,
              contact_role: contact_role.trim() || null,
            }
          : {
              type: "person",
              organizer_name: org,
              full_name: full_name.trim() || null,
              role: role.trim() || null,
              email: email.trim() || null,
              linkedin_url: linkedin_url.trim() || null,
            };
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Speichern fehlgeschlagen.");
        return;
      }
      setOpen(false);
      resetForm();
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <SheetTrigger asChild>
        <Button className="rounded-xl" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Kontakt anlegen
        </Button>
      </SheetTrigger>
      <SheetContent side="right" title="Kontakt manuell anlegen" className="overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label>Typ</Label>
            <Select value={type} onValueChange={(v) => setType(v as "organizer" | "person")}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="organizer">Organizer / Firma</SelectItem>
                <SelectItem value="person">Person (Ansprechpartner)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="organizer_name">Organizer / Firma *</Label>
            <Input
              id="organizer_name"
              className="rounded-xl"
              value={organizer_name}
              onChange={(e) => setOrganizerName(e.target.value)}
              placeholder="z. B. Messe Berlin"
              list="organizer-list"
            />
            <datalist id="organizer-list">
              {organizerNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>
          {type === "organizer" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="website">Website (optional)</Label>
                <Input
                  id="website"
                  type="url"
                  className="rounded-xl"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">E-Mail * (oder LinkedIn)</Label>
                <Input
                  id="contact_email"
                  type="email"
                  className="rounded-xl"
                  value={contact_email}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="info@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org_linkedin">LinkedIn (optional)</Label>
                <Input
                  id="org_linkedin"
                  type="url"
                  className="rounded-xl"
                  value={linkedin_url}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/company/…"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_name">Kontaktperson (optional)</Label>
                <Input
                  id="contact_name"
                  className="rounded-xl"
                  value={contact_name}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_role">Rolle (optional)</Label>
                <Input
                  id="contact_role"
                  className="rounded-xl"
                  value={contact_role}
                  onChange={(e) => setContactRole(e.target.value)}
                  placeholder="z. B. Events"
                />
              </div>
            </>
          )}
          {type === "person" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="full_name">Name (optional)</Label>
                <Input
                  id="full_name"
                  className="rounded-xl"
                  value={full_name}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Vor- und Nachname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="person_role">Rolle (optional)</Label>
                <Input
                  id="person_role"
                  className="rounded-xl"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="z. B. Event Manager"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail * (oder LinkedIn)</Label>
                <Input
                  id="email"
                  type="email"
                  className="rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="person@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="person_linkedin">LinkedIn (optional)</Label>
                <Input
                  id="person_linkedin"
                  type="url"
                  className="rounded-xl"
                  value={linkedin_url}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/…"
                />
              </div>
            </>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="rounded-xl" disabled={loading}>
              {loading ? "Wird gespeichert…" : "Speichern"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setOpen(false)}
            >
              Abbrechen
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
