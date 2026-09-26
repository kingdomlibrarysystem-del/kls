import type { ReactNode } from "react";
import type { NavItem } from "./nav-data";

/**
 * One flattened sidebar destination, produced from the nested nav data so the
 * search box can rank and render every page — top-level links and sub-items —
 * in a single flat list.
 */
export interface NavSearchEntry {
  icon: ReactNode;
  label: string;
  href: string;
  /** Enclosing top-level section label; empty for a top-level link. */
  section: string;
  /** True when the entry is a top-level link rather than a nested sub-item. */
  topLevel: boolean;
}

/** Flattens the nested nav groups into the searchable entry list. */
export function flattenNav(groups: NavItem[][]): NavSearchEntry[] {
  const out: NavSearchEntry[] = [];
  for (const group of groups) {
    for (const item of group) {
      if (item.subItems?.length) {
        for (const sub of item.subItems) {
          out.push({ icon: sub.icon, label: sub.label, href: sub.href, section: item.label, topLevel: false });
        }
      } else if (item.href) {
        out.push({ icon: item.icon, label: item.label, href: item.href, section: "", topLevel: true });
      }
    }
  }
  return out;
}

/** Free-text aliases so a plain-English query ("pay", "hair", "staff") finds the right page. */
const ALIASES: Record<string, string[]> = {
  ai: ["bot", "assistant", "tools"],
  map: ["location", "where", "directions", "find"],
  library: ["books", "book", "inventory", "catalog", "read"],
  borrow: ["lend", "checkout", "loan", "issue", "return"],
  reserve: ["reserve", "hold", "bookmark", "request"],
  sale: ["sales", "rent", "rentals", "buy", "purchase", "order", "cart", "payment"],
  course: ["courses", "class", "classes", "training", "learn", "study", "program"],
  lesson: ["lessons", "chapter", "module", "content"],
  quiz: ["quizzes", "exam", "exams", "test", "assessment", "quiz"],
  enroll: ["enrollment", "enrolment", "register", "registration", "students", "signup"],
  certificate: ["certificates", "award", "awards", "diploma", "badge"],
  session: ["live", "class", "meeting", "scheduled"],
  submit: ["submission", "submissions", "publish", "contribute", "upload"],
  review: ["queue", "approve", "moderation", "pending"],
  paper: ["papers", "research", "publication", "publications", "journal", "thesis"],
  project: ["projects", "research"],
  repository: ["archive", "library", "storage", "files"],
  collaboration: ["collaborate", "team", "partners", "shared"],
  health: ["medical", "doctor", "patient", "wellness"],
  checkup: ["checkup", "appointment", "appointments", "visit", "consultation", "exam"],
  record: ["records", "history", "chart", "charts", "file"],
  immunization: ["vaccine", "vaccines", "vaccination", "injection", "shots"],
  clinic: ["clinics", "hospital", "provider", "doctors", "center"],
  beauty: ["hair", "salon", "grooming", "spa", "cosmetic"],
  service: ["services", "offer", "offerings", "treatment"],
  counselor: ["counseling", "counselling", "counsellor", "therapy", "therapist", "mental", "psychology", "advice"],
  rehab: ["rehabilitation", "recovery", "physical", "physio", "restore", "addiction"],
  intake: ["intake", "admission", "enroll", "registration", "admit"],
  group: ["groups", "community", "circle", "peer"],
  news: ["news", "newspaper", "paper", "article", "articles", "bulletin", "press", "media"],
  edition: ["editions", "issue", "issues", "publish", "publication"],
  subscriber: ["subscribers", "subscriber", "mailing", "email"],
  category: ["categories", "category", "tags", "topics", "genres"],
  donation: ["donations", "donate", "giving", "gift", "contribute", "support", "charity", "pledge"],
  campaign: ["campaigns", "fundraiser", "drive", "appeal"],
  receipt: ["receipts", "history", "transactions", "gifts", "given"],
  report: ["reports", "analytics", "statistics", "stats", "data", "insights", "performance", "metrics"],
  role: ["roles", "permissions", "access", "staff", "admin", "privileges"],
  notification: ["notifications", "alerts", "bell", "reminder", "updates"],
  message: ["messages", "inbox", "chat", "mailbox", "conversation"],
  invitation: ["invitations", "invite", "invites"],
  setting: ["settings", "config", "configuration", "options", "preferences", "setup"],
  audit: ["audit", "log", "logs", "history", "activity", "trail", "compliance"],
  download: ["download", "downloads", "export", "files", "software", "install"],
  member: ["members", "user", "users", "people", "patrons", "subscribers", "accounts"],
  profile: ["profile", "account", "me", "myself"],
  progress: ["progress", "tracking", "status", "advancement"],
  health_system: ["clinic", "hospital"],
};

/** Generic words that carry no meaning for a search. */
const NOISE = new Set(["the", "and", "for", "my", "of", "to", "a"]);

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length || !b.length) return Math.max(a.length, b.length);
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= b.length; j += 1) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = row;
  }
  return prev[b.length];
}

/** True when every character of `query` appears in order in `text` ("bk inv" → "book inventory"). */
function isSubsequence(query: string, text: string): boolean {
  let i = 0;
  for (const char of text) {
    if (char === query[i]) i += 1;
    if (i === query.length) return true;
  }
  return query.length === 0;
}

/** Typo tolerance: how many single edits still land on the same word. */
function editBudget(word: string): number {
  if (word.length <= 3) return 0;
  if (word.length <= 6) return 1;
  return 2;
}

/** Every word interchangeable with `term` — the key itself plus its aliases. */
function relatedTerms(term: string): string[] {
  const out = new Set([term]);
  for (const [key, aliases] of Object.entries(ALIASES)) {
    if (key === term || aliases.includes(term)) {
      out.add(key);
      for (const alias of aliases) out.add(alias);
    }
  }
  return [...out];
}

/**
 * True when a query word means the same thing as a word on the page, so
 * "books" reaches Book Inventory and "staff" reaches Roles & Permissions.
 */
function matchesAlias(query: string, tokens: string[]): boolean {
  for (const word of query.split(" ")) {
    if (!word) continue;
    for (const term of relatedTerms(word)) {
      if (tokens.some((token) => token === term || (token.length > 3 && token.startsWith(term)))) return true;
    }
  }
  return false;
}

function entryTokens(entry: NavSearchEntry): string[] {
  const raw = `${entry.label} ${entry.section} ${entry.href}`.toLowerCase();
  return raw.split(/[^a-z0-9]+/).filter((word) => word.length > 1 && !NOISE.has(word));
}

/**
 * Relevance score for one entry. Higher is better; 0 means "not related".
 * Tiers, strongest first: exact label, label prefix, word prefix, label
 * substring, href/alias, section, typed-out subsequence, single typos. The
 * loose tiers are what make the search relational — "bludges" still lands on
 * "Book Inventory" and "paper" on the Research section.
 */
export function scoreEntry(entry: NavSearchEntry, rawQuery: string): number {
  const query = normalize(rawQuery);
  if (!query) return 0;

  const label = normalize(entry.label);
  const section = normalize(entry.section);
  const hrefTokens = entry.href.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const labelWords = label.split(" ").filter((word) => word.length > 1 && !NOISE.has(word));

  if (label === query) return 120;
  if (label.startsWith(query)) return 100;
  if (labelWords.some((word) => word.startsWith(query))) return 85;
  if (label.includes(query)) return 70;
  if (hrefTokens.some((token) => token.startsWith(query))) return 60;
  if (matchesAlias(query, entryTokens(entry))) return 50;
  if (section && (section === query || section.startsWith(query) || section.includes(query))) return 40;
  if (isSubsequence(query.replace(/ /g, ""), label.replace(/ /g, ""))) return 30;

  const candidates = [...labelWords, ...hrefTokens, ...(section ? section.split(" ") : [])];
  for (const word of candidates) {
    if (Math.abs(word.length - query.length) > editBudget(word)) continue;
    const distance = levenshtein(query, word);
    if (distance <= editBudget(word)) return 22 - distance * 4;
  }
  return 0;
}

/** A search hit plus the score that produced it. */
export interface NavSearchHit extends NavSearchEntry {
  score: number;
}

export interface NavSearchOptions {
  /** Cap on returned hits; the sidebar only has room for a screenful. */
  limit?: number;
}

/**
 * Ranks nav entries against a query. Never returns an empty list for a
 * non-empty query: when nothing scores, it falls back to the closest entries
 * by edit distance so the search always relates to something that exists.
 */
export function searchNav(
  entries: NavSearchEntry[],
  rawQuery: string,
  { limit = 12 }: NavSearchOptions = {},
): NavSearchHit[] {
  if (!rawQuery.trim()) return entries.map((entry) => ({ ...entry, score: 0 }));

  const scored: NavSearchHit[] = [];
  for (const entry of entries) {
    const score = scoreEntry(entry, rawQuery);
    if (score > 0) scored.push({ ...entry, score });
  }

  if (scored.length) {
    return scored
      .sort((a, b) => b.score - a.score || a.label.length - b.label.length || a.label.localeCompare(b.label))
      .slice(0, limit);
  }

  // Nothing matched: rank everything by how near the query is to its label so
  // the user still gets the closest pages instead of a dead end.
  const query = normalize(rawQuery);
  const fallback = entries
    .map((entry) => {
      const label = normalize(entry.label);
      const words = label.split(" ").filter((word) => word.length > 1);
      const distance = Math.min(levenshtein(query, label), ...words.map((word) => levenshtein(query, word)));
      return { entry, distance };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, Math.min(limit, 6))
    .map(({ entry, distance }) => ({ ...entry, score: -distance }));

  return fallback.length ? fallback : entries.slice(0, limit).map((entry) => ({ ...entry, score: 0 }));
}

/** Splits a label around the literal query for match highlighting. */
export function highlightParts(label: string, rawQuery: string): { text: string; match: boolean }[] {
  const query = rawQuery.trim();
  if (!query) return [{ text: label, match: false }];
  const needle = query.toLowerCase();
  const haystack = label.toLowerCase();
  const parts: { text: string; match: boolean }[] = [];
  let cursor = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    if (index > cursor) parts.push({ text: label.slice(cursor, index), match: false });
    parts.push({ text: label.slice(index, index + needle.length), match: true });
    cursor = index + needle.length;
    index = haystack.indexOf(needle, cursor);
  }
  if (cursor < label.length) parts.push({ text: label.slice(cursor), match: false });
  return parts;
}
