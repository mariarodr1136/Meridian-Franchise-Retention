import { createClient, type Client } from "@libsql/client";
import { libsqlConfig } from "@/lib/libsql-config";

const g = globalThis as unknown as { ftsDb: Client | undefined; ftsReady: Promise<void> | undefined };

function getDb(): Client {
  if (!g.ftsDb) g.ftsDb = createClient(libsqlConfig());
  return g.ftsDb;
}

// The virtual table lives in the database itself, so this runs once per client
// rather than once per request.
function ensureTable(): Promise<void> {
  if (!g.ftsReady) {
    g.ftsReady = getDb()
      .execute(`
        CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
          type,
          entity_id,
          studio_id,
          title,
          body,
          tokenize='unicode61'
        )
      `)
      .then(() => undefined);
  }
  return g.ftsReady;
}

export interface SearchResult {
  type: "studio" | "review" | "instructor";
  entityId: string;
  studioId: string;
  title: string;
  body: string;
  rank: number;
}

export async function ftsCount(): Promise<number> {
  await ensureTable();
  const rs = await getDb().execute("SELECT COUNT(*) as n FROM search_fts");
  return Number(rs.rows[0].n);
}

export async function buildSearchIndex(data: {
  studios: { id: string; name: string; city: string; state: string | null; region: string; franchiseeName: string }[];
  reviews: { id: string; studioId: string; author: string; source: string; body: string }[];
  instructors: { id: string; studioId: string; name: string; role: string }[];
}) {
  await ensureTable();
  const db = getDb();

  const rows: [string, string, string, string, string][] = [
    ...data.studios.map((s): [string, string, string, string, string] => [
      "studio", s.id, s.id,
      `${s.name} ${s.city}`,
      `${s.franchiseeName} ${s.state ?? ""} ${s.region}`,
    ]),
    ...data.reviews.map((r): [string, string, string, string, string] => [
      "review", r.id, r.studioId,
      `${r.author} · ${r.source}`,
      r.body,
    ]),
    ...data.instructors.map((i): [string, string, string, string, string] => [
      "instructor", i.id, i.studioId,
      i.name,
      i.role,
    ]),
  ];

  const sql = "INSERT INTO search_fts(type, entity_id, studio_id, title, body) VALUES (?, ?, ?, ?, ?)";

  // Batched rather than one round trip per row — over a network connection the
  // per-statement latency dominates on a full rebuild.
  const CHUNK = 500;
  await db.batch([{ sql: "DELETE FROM search_fts", args: [] }], "write");
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db.batch(
      rows.slice(i, i + CHUNK).map((args) => ({ sql, args })),
      "write"
    );
  }

  return rows.length;
}

export async function ftsSearch(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  await ensureTable();
  try {
    // Escape special FTS5 chars, append * for prefix matching
    const safe = query.replace(/['"*^]/g, " ").trim();
    if (!safe) return [];
    const rs = await getDb().execute({
      sql: `
        SELECT type, entity_id, studio_id, title, body, rank
        FROM search_fts
        WHERE search_fts MATCH ?
        ORDER BY rank
        LIMIT 12
      `,
      args: [`${safe}*`],
    });

    return rs.rows.map((r) => ({
      type: r.type as "studio" | "review" | "instructor",
      entityId: r.entity_id as string,
      studioId: r.studio_id as string,
      title: r.title as string,
      body: r.body as string,
      rank: Number(r.rank),
    }));
  } catch {
    return [];
  }
}
