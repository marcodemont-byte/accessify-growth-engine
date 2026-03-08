import { ApifyClient } from "apify-client";
import type { ApifyEventItem, NormalizedDiscovery } from "@/types/discovery";
import { normalizeEventbriteDataset } from "./normalizers";

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;

if (!APIFY_TOKEN) {
  console.warn("APIFY_API_TOKEN is not set. Discovery runs will fail.");
}

/**
 * Eventbrite scraper actor IDs that work with start URLs.
 * Using compumatic/eventbrite-scraper or similar; fallback to a well-known public actor.
 * Input: { startUrls: [{ url: "https://www.eventbrite.com/d/germany--berlin/" }], maxItems?: number }
 */
const EVENTBRITE_ACTOR_ID = process.env.APIFY_EVENTBRITE_ACTOR_ID ?? "compumatic/eventbrite-scraper";

/** DACH Eventbrite discovery URLs (events listing pages) */
const DACH_EVENTBRITE_URLS = [
  "https://www.eventbrite.com/d/germany--berlin/",
  "https://www.eventbrite.com/d/germany--munich/",
  "https://www.eventbrite.com/d/germany--frankfurt/",
  "https://www.eventbrite.com/d/germany--hamburg/",
  "https://www.eventbrite.com/d/germany--cologne/",
  "https://www.eventbrite.com/d/austria--vienna/",
  "https://www.eventbrite.com/d/austria--salzburg/",
  "https://www.eventbrite.com/d/switzerland--zurich/",
  "https://www.eventbrite.com/d/switzerland--geneva/",
  "https://www.eventbrite.com/d/switzerland--basel/",
];

export interface RunEventbriteInput {
  maxItems?: number;
  /** Override default DACH URLs */
  startUrls?: string[];
}

/**
 * Run Eventbrite scraper for DACH and return normalized discoveries.
 * Uses actor input: startUrls (Eventbrite search/list URLs).
 */
export async function runEventbriteScraper(
  input: RunEventbriteInput = {}
): Promise<{ items: ApifyEventItem[]; normalized: NormalizedDiscovery[] }> {
  const client = new ApifyClient({ token: APIFY_TOKEN });
  const startUrls =
    input.startUrls?.length ? input.startUrls : DACH_EVENTBRITE_URLS;
  const maxItems = input.maxItems ?? 100;

  const actorInput = {
    startUrls: startUrls.map((url) => ({ url })),
    maxItems,
  };

  const run = await client.actor(EVENTBRITE_ACTOR_ID).call(actorInput, {
    waitSecs: 300,
  });

  if (run.status !== "SUCCEEDED") {
    throw new Error(`Apify actor run failed: ${run.status}`);
  }

  const datasetId = run.defaultDatasetId;
  if (!datasetId) {
    throw new Error("No dataset from Apify run");
  }

  const { items } = await client.dataset(datasetId).listItems();
  const rawItems = (items ?? []) as ApifyEventItem[];
  const normalized = normalizeEventbriteDataset(
    rawItems,
    "eventbrite",
    true
  );

  return { items: rawItems, normalized };
}

/**
 * Run a generic Apify actor by ID with given input and normalize output with the provided normalizer.
 */
export async function runApifyActor<T = ApifyEventItem>(params: {
  actorId: string;
  input: Record<string, unknown>;
  normalizer: (items: T[]) => NormalizedDiscovery[];
  source: string;
}): Promise<{ items: T[]; normalized: NormalizedDiscovery[] }> {
  const client = new ApifyClient({ token: APIFY_TOKEN });
  const run = await client.actor(params.actorId).call(params.input, {
    waitSecs: 600,
  });

  if (run.status !== "SUCCEEDED") {
    throw new Error(`Apify actor run failed: ${run.status}`);
  }

  const datasetId = run.defaultDatasetId;
  if (!datasetId) throw new Error("No dataset from Apify run");

  const { items } = await client.dataset(datasetId).listItems();
  const rawItems = (items ?? []) as T[];
  const normalized = params.normalizer(rawItems);
  return { items: rawItems, normalized };
}

export { DACH_EVENTBRITE_URLS };
