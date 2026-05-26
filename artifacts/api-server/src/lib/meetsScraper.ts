import { logger } from "./logger";

export interface ScrapedMeet {
  name: string;
  location: string;
  date: string;
  url: string;
}

interface Cache {
  meets: ScrapedMeet[];
  cachedAt: string;
  fetchedAt: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const SWIMCLOUD_URL =
  "https://www.swimcloud.com/results/?q=&country=US&state=NJ";

let cache: Cache | null = null;

/**
 * Parse meet entries from SwimCloud markdown text.
 * Each meet block looks like:
 *   **Meet Name**
 *   - Completed / Upcoming
 *   - May 23, 2026
 *   - City, NJ
 */
function parseMeets(markdown: string): ScrapedMeet[] {
  const meets: ScrapedMeet[] = [];

  // Match each meet block: **name** followed by status, date, location lines
  // and an href like (https://www.swimcloud.com/results/12345)
  const blockRe =
    /\*\*([^\*]+)\*\*\s*[\s\S]*?-\s*(Completed|Upcoming|Open)\s*[\s\S]*?-\s*([\w]+ \d{1,2},\s*\d{4})\s*[\s\S]*?-\s*([^\n\]]+)\]\(([^)]+)\)/g;

  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(markdown)) !== null) {
    const name = match[1].trim();
    const date = match[3].trim();
    const location = match[4].trim();
    const url = match[5].trim();

    // Keep only NJ meets
    if (!location.endsWith(", NJ") && !location.includes(", NJ,")) continue;

    meets.push({ name, location, date, url });
  }

  return meets;
}

export async function fetchNJMeets(): Promise<Cache> {
  const now = Date.now();

  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    logger.debug("meets cache hit");
    return cache;
  }

  logger.info("fetching NJ meets from SwimCloud");

  let meets: ScrapedMeet[] = [];

  try {
    const res = await fetch(SWIMCLOUD_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SwimTrackApp/1.0; +https://swimtrack.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      throw new Error(`SwimCloud returned ${res.status}`);
    }

    const html = await res.text();

    // Extract meet info from the HTML using simple patterns
    // SwimCloud meet cards: data-meet-id or link to /results/{id}
    const meetCardRe =
      /<a[^>]+href="(https:\/\/www\.swimcloud\.com\/results\/\d+)"[^>]*>[\s\S]*?<strong[^>]*>([^<]+)<\/strong>[\s\S]*?<li[^>]*>([^<]+)<\/li>[\s\S]*?<li[^>]*>([^<]+)<\/li>[\s\S]*?<li[^>]*>([^<]+)<\/li>/g;

    let m: RegExpExecArray | null;
    while ((m = meetCardRe.exec(html)) !== null) {
      const url = m[1];
      const name = m[2].trim();
      // m[3] = status, m[4] = date, m[5] = location
      const date = m[4].trim();
      const location = m[5].trim();
      if (location.includes(", NJ")) {
        meets.push({ name, location, date, url });
      }
    }

    // Fallback: simpler extraction from alt text / title patterns
    if (meets.length === 0) {
      const altRe =
        /href="(https:\/\/www\.swimcloud\.com\/results\/(\d+))"[\s\S]{0,400}?<strong[^>]*>([\s\S]*?)<\/strong>[\s\S]{0,200}?([A-Z][a-z]+ \d{1,2}, \d{4})[\s\S]{0,200}?([^<,\n]+, NJ[^<\n]*)/g;
      while ((m = altRe.exec(html)) !== null) {
        const url = m[1];
        const name = m[3].replace(/\s+/g, " ").trim();
        const date = m[4].trim();
        const location = m[5].trim();
        meets.push({ name, location, date, url });
      }
    }

    logger.info({ count: meets.length }, "parsed NJ meets");
  } catch (err) {
    logger.warn({ err }, "failed to fetch meets from SwimCloud");
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  meets = meets.filter((m) => {
    if (seen.has(m.url)) return false;
    seen.add(m.url);
    return true;
  });

  cache = {
    meets,
    cachedAt: new Date().toISOString(),
    fetchedAt: now,
  };

  return cache;
}
