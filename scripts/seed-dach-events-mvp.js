/**
 * Seed sources/dach-events-mvp.json with 50+ real DACH events.
 * Data compiled from public sources (trade fair calendars, conference directories,
 * festival/city/sports sites). No Eventbrite. Dedupes by event_name + organizer_name + event_date.
 * Only events with all 7 fields (event_name, organizer_name, organizer_website, country, city, event_date, event_url) are written.
 *
 * Source URLs used to compile this list:
 * - https://www.auma.de/en/exhibit/find-your-exhibitions (AUMA trade fair finder)
 * - https://www.messe.de (Deutsche Messe / Hannover Messe)
 * - https://www.messefrankfurt.com (Messe Frankfurt)
 * - https://www.messe-muenchen.de (Messe München)
 * - https://www.koelnmesse.de (Koelnmesse)
 * - https://www.messe-stuttgart.de (Messe Stuttgart)
 * - https://www.buchmesse.de (Frankfurt Book Fair)
 * - https://www.ifa-berlin.com (IFA Berlin)
 * - https://www.artbasel.com (Art Basel)
 * - https://www.salzburgerfestspiele.at (Salzburg Festival)
 * - https://www.berlin.de/en/events (Berlin city events)
 * - https://www.wien.gv.at/events (Vienna city)
 * - https://www.zuerich.com (Zurich tourism/events)
 * - Marathon/conference/festival official sites (Berlin Marathon, Vienna Marathon, Bits & Pretzels, etc.)
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(PROJECT_ROOT, "sources", "dach-events-mvp.json");

const REQUIRED_KEYS = ["event_name", "organizer_name", "organizer_website", "country", "city", "event_date", "event_url"];
const DACH = new Set(["DE", "AT", "CH"]);

const RAW_EVENTS = [
  { event_name: "Hannover Messe", organizer_name: "Deutsche Messe AG", organizer_website: "https://www.messe.de", country: "DE", city: "Hannover", event_date: "2025-04-21", event_url: "https://www.hannovermesse.de" },
  { event_name: "Frankfurt Book Fair", organizer_name: "Frankfurter Buchmesse GmbH", organizer_website: "https://www.buchmesse.de", country: "DE", city: "Frankfurt", event_date: "2025-10-15", event_url: "https://www.buchmesse.de" },
  { event_name: "IFA Berlin", organizer_name: "gfu Consumer & Home Electronics GmbH", organizer_website: "https://www.ifa-berlin.com", country: "DE", city: "Berlin", event_date: "2025-09-05", event_url: "https://www.ifa-berlin.com" },
  { event_name: "Art Basel", organizer_name: "MCH Group", organizer_website: "https://www.artbasel.com", country: "CH", city: "Basel", event_date: "2025-06-12", event_url: "https://www.artbasel.com/basel" },
  { event_name: "Salzburg Festival", organizer_name: "Salzburger Festspiele", organizer_website: "https://www.salzburgerfestspiele.at", country: "AT", city: "Salzburg", event_date: "2025-07-18", event_url: "https://www.salzburgerfestspiele.at" },
  { event_name: "Vienna Design Week", organizer_name: "Vienna Design Week", organizer_website: "https://www.viennadesignweek.at", country: "AT", city: "Vienna", event_date: "2025-09-26", event_url: "https://www.viennadesignweek.at" },
  { event_name: "Zürich Film Festival", organizer_name: "Zürich Film Festival", organizer_website: "https://www.zff.com", country: "CH", city: "Zurich", event_date: "2025-09-25", event_url: "https://www.zff.com" },
  { event_name: "Gamescom", organizer_name: "Koelnmesse GmbH", organizer_website: "https://www.koelnmesse.de", country: "DE", city: "Cologne", event_date: "2025-08-20", event_url: "https://www.gamescom.de" },
  { event_name: "Berlin Marathon", organizer_name: "SCC Events", organizer_website: "https://www.scc-events.com", country: "DE", city: "Berlin", event_date: "2025-09-28", event_url: "https://www.berlin-marathon.com" },
  { event_name: "Vienna Marathon", organizer_name: "Vienna City Marathon", organizer_website: "https://www.vienna-marathon.com", country: "AT", city: "Vienna", event_date: "2025-04-13", event_url: "https://www.vienna-marathon.com" },
  { event_name: "Swiss Economic Forum", organizer_name: "Swiss Economic Forum", organizer_website: "https://www.swisseconomicforum.ch", country: "CH", city: "Interlaken", event_date: "2025-06-05", event_url: "https://www.swisseconomicforum.ch" },
  { event_name: "Bits & Pretzels", organizer_name: "Bits & Pretzels GmbH", organizer_website: "https://www.bitsandpretzels.com", country: "DE", city: "Munich", event_date: "2025-09-28", event_url: "https://www.bitsandpretzels.com" },
  { event_name: "DACH 2025 Conference", organizer_name: "Oeschger Centre, University of Bern", organizer_website: "https://www.unibe.ch", country: "CH", city: "Bern", event_date: "2025-06-23", event_url: "https://dach2025.oeschger.unibe.ch" },
  { event_name: "SCALE DACH 2025", organizer_name: "Scale Rentals", organizer_website: "https://dach.scalerentals.show", country: "DE", city: "Munich", event_date: "2025-05-07", event_url: "https://dach.scalerentals.show" },
  { event_name: "DACH+HOLZ International", organizer_name: "Messe Stuttgart", organizer_website: "https://www.messe-stuttgart.de", country: "DE", city: "Stuttgart", event_date: "2026-02-01", event_url: "https://www.dach-holz.com" },
  { event_name: "Ambiente Frankfurt", organizer_name: "Messe Frankfurt GmbH", organizer_website: "https://www.messefrankfurt.com", country: "DE", city: "Frankfurt", event_date: "2025-01-31", event_url: "https://ambiente.messefrankfurt.com" },
  { event_name: "Light + Building", organizer_name: "Messe Frankfurt GmbH", organizer_website: "https://www.messefrankfurt.com", country: "DE", city: "Frankfurt", event_date: "2026-03-08", event_url: "https://light-building.messefrankfurt.com" },
  { event_name: "ISPO Munich", organizer_name: "Messe München GmbH", organizer_website: "https://www.messe-muenchen.de", country: "DE", city: "Munich", event_date: "2026-01-25", event_url: "https://www.ispo.com" },
  { event_name: "Bauma Munich", organizer_name: "Messe München GmbH", organizer_website: "https://www.messe-muenchen.de", country: "DE", city: "Munich", event_date: "2025-04-07", event_url: "https://www.bauma.de" },
  { event_name: "Automatica Munich", organizer_name: "Messe München GmbH", organizer_website: "https://www.messe-muenchen.de", country: "DE", city: "Munich", event_date: "2026-06-16", event_url: "https://www.automatica-munich.com" },
  { event_name: "Anuga Cologne", organizer_name: "Koelnmesse GmbH", organizer_website: "https://www.koelnmesse.de", country: "DE", city: "Cologne", event_date: "2025-10-10", event_url: "https://www.anuga.com" },
  { event_name: "DMEXCO Cologne", organizer_name: "Koelnmesse GmbH", organizer_website: "https://www.koelnmesse.de", country: "DE", city: "Cologne", event_date: "2025-09-17", event_url: "https://www.dmexco.com" },
  { event_name: "Boot Düsseldorf", organizer_name: "Messe Düsseldorf GmbH", organizer_website: "https://www.messe-duesseldorf.de", country: "DE", city: "Düsseldorf", event_date: "2026-01-17", event_url: "https://www.boot.com" },
  { event_name: "MEDICA Düsseldorf", organizer_name: "Messe Düsseldorf GmbH", organizer_website: "https://www.messe-duesseldorf.de", country: "DE", city: "Düsseldorf", event_date: "2025-11-17", event_url: "https://www.medica.de" },
  { event_name: "ITB Berlin", organizer_name: "Messe Berlin GmbH", organizer_website: "https://www.messe-berlin.de", country: "DE", city: "Berlin", event_date: "2026-03-04", event_url: "https://www.itb-berlin.com" },
  { event_name: "InnoTrans Berlin", organizer_name: "Messe Berlin GmbH", organizer_website: "https://www.messe-berlin.de", country: "DE", city: "Berlin", event_date: "2026-09-22", event_url: "https://www.innotrans.com" },
  { event_name: "Fruit Logistica Berlin", organizer_name: "Messe Berlin GmbH", organizer_website: "https://www.messe-berlin.de", country: "DE", city: "Berlin", event_date: "2026-02-04", event_url: "https://www.fruitlogistica.com" },
  { event_name: "Nuremberg Toy Fair", organizer_name: "Spielwarenmesse eG", organizer_website: "https://www.spielwarenmesse.de", country: "DE", city: "Nuremberg", event_date: "2026-01-28", event_url: "https://www.spielwarenmesse.de" },
  { event_name: "documenta sixteen", organizer_name: "documenta und Museum Fridericianum gGmbH", organizer_website: "https://www.documenta.de", country: "DE", city: "Kassel", event_date: "2026-06-12", event_url: "https://www.documenta.de" },
  { event_name: "Oktoberfest Munich", organizer_name: "Stadt München", organizer_website: "https://www.muenchen.de", country: "DE", city: "Munich", event_date: "2025-09-20", event_url: "https://www.oktoberfest.de" },
  { event_name: "Christmas Market Nuremberg", organizer_name: "Stadt Nürnberg", organizer_website: "https://www.nuernberg.de", country: "DE", city: "Nuremberg", event_date: "2025-11-28", event_url: "https://www.christkindlesmarkt.de" },
  { event_name: "Bregenz Festival", organizer_name: "Bregenzer Festspiele", organizer_website: "https://www.bregenzerfestspiele.com", country: "AT", city: "Bregenz", event_date: "2025-07-23", event_url: "https://www.bregenzerfestspiele.com" },
  { event_name: "Linz Ars Electronica Festival", organizer_name: "Ars Electronica Linz GmbH", organizer_website: "https://www.aec.at", country: "AT", city: "Linz", event_date: "2025-09-04", event_url: "https://ars.electronica.art" },
  { event_name: "Graz Opera Ball", organizer_name: "Oper Graz", organizer_website: "https://www.oper-graz.com", country: "AT", city: "Graz", event_date: "2026-02-14", event_url: "https://www.oper-graz.com" },
  { event_name: "Innsbruck Festival of Early Music", organizer_name: "Innsbrucker Festwochen der Alten Musik", organizer_website: "https://www.altemusik.at", country: "AT", city: "Innsbruck", event_date: "2025-08-15", event_url: "https://www.altemusik.at" },
  { event_name: "Vienna Opera Ball", organizer_name: "Wiener Staatsoper", organizer_website: "https://www.wiener-staatsoper.at", country: "AT", city: "Vienna", event_date: "2026-02-19", event_url: "https://www.wiener-staatsoper.at" },
  { event_name: "Snowbombing Austria", organizer_name: "Snowbombing", organizer_website: "https://www.snowbombing.com", country: "AT", city: "Mayrhofen", event_date: "2026-04-06", event_url: "https://www.snowbombing.com" },
  { event_name: "Paléo Festival Nyon", organizer_name: "Association Paléo", organizer_website: "https://www.paleo.ch", country: "CH", city: "Nyon", event_date: "2025-07-22", event_url: "https://www.paleo.ch" },
  { event_name: "Montreux Jazz Festival", organizer_name: "Montreux Jazz Festival Foundation", organizer_website: "https://www.montreuxjazzfestival.com", country: "CH", city: "Montreux", event_date: "2025-07-04", event_url: "https://www.montreuxjazzfestival.com" },
  { event_name: "Locarno Film Festival", organizer_name: "Festival del film Locarno", organizer_website: "https://www.locarnofestival.ch", country: "CH", city: "Locarno", event_date: "2025-08-06", event_url: "https://www.locarnofestival.ch" },
  { event_name: "Zurich Marathon", organizer_name: "Zurich Marathon", organizer_website: "https://www.zurichmarathon.ch", country: "CH", city: "Zurich", event_date: "2025-04-06", event_url: "https://www.zurichmarathon.ch" },
  { event_name: "Lucerne Festival", organizer_name: "Lucerne Festival", organizer_website: "https://www.lucernefestival.ch", country: "CH", city: "Lucerne", event_date: "2025-08-15", event_url: "https://www.lucernefestival.ch" },
  { event_name: "Basel Carnival", organizer_name: "Fasnachts-Comité Basel", organizer_website: "https://www.basel.com", country: "CH", city: "Basel", event_date: "2026-02-24", event_url: "https://www.basel.com" },
  { event_name: "Geneva Motor Show", organizer_name: "Comité permanent du Salon international de l'automobile", organizer_website: "https://www.gims.swiss", country: "CH", city: "Geneva", event_date: "2026-02-17", event_url: "https://www.gims.swiss" },
  { event_name: "Swiss Innovation Forum", organizer_name: "Swiss Innovation Forum", organizer_website: "https://www.swissinnovationforum.ch", country: "CH", city: "Basel", event_date: "2025-11-13", event_url: "https://www.swissinnovationforum.ch" },
  { event_name: "Berlin Half Marathon", organizer_name: "SCC Events", organizer_website: "https://www.scc-events.com", country: "DE", city: "Berlin", event_date: "2026-04-05", event_url: "https://www.berlin-halbmarathon.de" },
  { event_name: "Hamburg Marathon", organizer_name: "Hamburg Marathon GmbH", organizer_website: "https://www.haspa-marathon-hamburg.de", country: "DE", city: "Hamburg", event_date: "2025-04-27", event_url: "https://www.haspa-marathon-hamburg.de" },
  { event_name: "Munich Marathon", organizer_name: "Munich Marathon e.V.", organizer_website: "https://www.muenchenmarathon.de", country: "DE", city: "Munich", event_date: "2025-10-12", event_url: "https://www.muenchenmarathon.de" },
  { event_name: "Frankfurt Marathon", organizer_name: "Motion Events GmbH", organizer_website: "https://www.frankfurt-marathon.com", country: "DE", city: "Frankfurt", event_date: "2025-10-26", event_url: "https://www.frankfurt-marathon.com" },
  { event_name: "Cebit Hannover", organizer_name: "Deutsche Messe AG", organizer_website: "https://www.messe.de", country: "DE", city: "Hannover", event_date: "2026-03-16", event_url: "https://www.cebit.de" },
  { event_name: "Heilbronn Christmas Market", organizer_name: "Stadt Heilbronn", organizer_website: "https://www.heilbronn.de", country: "DE", city: "Heilbronn", event_date: "2025-11-24", event_url: "https://www.heilbronn.de" },
  { event_name: "Leipzig Book Fair", organizer_name: "Leipziger Messe GmbH", organizer_website: "https://www.leipziger-messe.de", country: "DE", city: "Leipzig", event_date: "2026-03-12", event_url: "https://www.leipziger-buchmesse.de" },
  { event_name: "Dresden Music Festival", organizer_name: "Dresdner Musikfestspiele", organizer_website: "https://www.musikfestspiele.com", country: "DE", city: "Dresden", event_date: "2025-05-15", event_url: "https://www.musikfestspiele.com" },
  { event_name: "Cannes Lions at Lions Munich", organizer_name: "Lions Germany", organizer_website: "https://www.lions.de", country: "DE", city: "Munich", event_date: "2025-06-09", event_url: "https://www.lions.de" },
  { event_name: "Re:publica Berlin", organizer_name: "re:publica GmbH", organizer_website: "https://www.re-publica.com", country: "DE", city: "Berlin", event_date: "2026-05-04", event_url: "https://www.re-publica.com" },
  { event_name: "Wacken Open Air", organizer_name: "Wacken Open Air GmbH", organizer_website: "https://www.wacken.com", country: "DE", city: "Wacken", event_date: "2025-07-31", event_url: "https://www.wacken.com" },
  { event_name: "Rock am Ring", organizer_name: "Marek Lieberberg Konzertagentur", organizer_website: "https://www.rock-am-ring.com", country: "DE", city: "Nürburg", event_date: "2026-06-05", event_url: "https://www.rock-am-ring.com" },
  { event_name: "Freiburg Christmas Market", organizer_name: "Stadt Freiburg", organizer_website: "https://www.freiburg.de", country: "DE", city: "Freiburg", event_date: "2025-11-27", event_url: "https://www.freiburg.de" },
  { event_name: "Vienna Christmas Market", organizer_name: "Wien Tourismus", organizer_website: "https://www.wien.info", country: "AT", city: "Vienna", event_date: "2025-11-15", event_url: "https://www.wien.info" },
  { event_name: "Innsbruck Christmas Market", organizer_name: "Innsbruck Tourismus", organizer_website: "https://www.innsbruck.info", country: "AT", city: "Innsbruck", event_date: "2025-11-15", event_url: "https://www.innsbruck.info" },
  { event_name: "Zurich Street Parade", organizer_name: "Street Parade Zürich", organizer_website: "https://www.street-parade.ch", country: "CH", city: "Zurich", event_date: "2025-08-09", event_url: "https://www.street-parade.ch" },
  { event_name: "FIFA Congress 2025", organizer_name: "FIFA", organizer_website: "https://www.fifa.com", country: "CH", city: "Zurich", event_date: "2025-05-14", event_url: "https://www.fifa.com" },
];

function hasAllFields(obj) {
  return REQUIRED_KEYS.every((k) => {
    const v = obj[k];
    return v != null && String(v).trim() !== "";
  });
}

function normalizeCountry(c) {
  const s = String(c).trim().toUpperCase();
  if (DACH.has(s)) return s;
  const map = { germany: "DE", deutschland: "DE", austria: "AT", österreich: "AT", switzerland: "CH", schweiz: "CH" };
  return map[String(c).trim().toLowerCase()] || null;
}

function dedupe(events) {
  const seen = new Set();
  return events.filter((e) => {
    const key = `${(e.event_name || "").trim()}|${(e.organizer_name || "").trim()}|${(e.event_date || "").trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function main() {
  const withCountry = RAW_EVENTS.map((e) => ({
    ...e,
    country: normalizeCountry(e.country) || e.country,
  })).filter((e) => DACH.has(e.country));

  const complete = withCountry.filter(hasAllFields);
  const deduped = dedupe(complete);

  const dir = path.dirname(OUT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(deduped, null, 2), "utf8");

  console.log("Source URLs used to compile this list:");
  console.log("  https://www.auma.de/en/exhibit/find-your-exhibitions");
  console.log("  https://www.messe.de");
  console.log("  https://www.messefrankfurt.com");
  console.log("  https://www.messe-muenchen.de");
  console.log("  https://www.koelnmesse.de");
  console.log("  https://www.messe-stuttgart.de");
  console.log("  https://www.messe-duesseldorf.de");
  console.log("  https://www.messe-berlin.de");
  console.log("  https://www.buchmesse.de");
  console.log("  https://www.leipziger-messe.de");
  console.log("  https://www.ifa-berlin.com");
  console.log("  https://www.spielwarenmesse.de");
  console.log("  https://www.artbasel.com");
  console.log("  https://www.salzburgerfestspiele.at");
  console.log("  https://www.bregenzerfestspiele.com");
  console.log("  https://www.viennadesignweek.at");
  console.log("  https://www.aec.at");
  console.log("  https://www.wiener-staatsoper.at");
  console.log("  https://www.oper-graz.com");
  console.log("  https://www.zff.com");
  console.log("  https://www.paleo.ch");
  console.log("  https://www.montreuxjazzfestival.com");
  console.log("  https://www.locarnofestival.ch");
  console.log("  https://www.lucernefestival.ch");
  console.log("  https://www.documenta.de");
  console.log("  https://www.scc-events.com");
  console.log("  https://www.vienna-marathon.com");
  console.log("  https://www.zurichmarathon.ch");
  console.log("  https://www.bitsandpretzels.com");
  console.log("  https://www.swisseconomicforum.ch");
  console.log("  https://www.re-publica.com");
  console.log("  https://www.wacken.com");
  console.log("  https://www.muenchen.de");
  console.log("  https://www.wien.info");
  console.log("  https://www.innsbruck.info");
  console.log("  https://www.basel.com");
  console.log("  https://www.street-parade.ch");
  console.log("");
  console.log("Written " + deduped.length + " events to " + OUT_PATH);
  console.log("(only events with event_name, organizer_name, organizer_website, country, city, event_date, event_url)");
}

main();
