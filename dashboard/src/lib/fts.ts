import Database from "better-sqlite3";
import path from "path";

function getDbPath() {
  const raw = process.env.DATABASE_URL ?? "file:./dev.db";
  const filePath = raw.startsWith("file:") ? raw.slice(5) : raw;
  return path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
}

const g = globalThis as unknown as { ftsDb: Database.Database | undefined };

function getDb(): Database.Database {
  if (!g.ftsDb) {
    const db = new Database(getDbPath());
    db.pragma("busy_timeout = 5000");
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
        type,
        entity_id,
        studio_id,
        title,
        body,
        tokenize='unicode61'
      )
    `);
    g.ftsDb = db;
  }
  return g.ftsDb;
}

export interface SearchResult {
  type: "studio" | "review" | "instructor";
  entityId: string;
  studioId: string;
  title: string;
  body: string;
  rank: number;
}

export function ftsCount(): number {
  return (getDb().prepare("SELECT COUNT(*) as n FROM search_fts").get() as { n: number }).n;
}

export function buildSearchIndex(data: {
  studios: { id: string; name: string; city: string; state: string | null; region: string; franchiseeName: string }[];
  reviews: { id: string; studioId: string; author: string; source: string; body: string }[];
  instructors: { id: string; studioId: string; name: string; role: string }[];
}) {
  const db = getDb();
  db.prepare("DELETE FROM search_fts").run();

  const insert = db.prepare(
    "INSERT INTO search_fts(type, entity_id, studio_id, title, body) VALUES (?, ?, ?, ?, ?)"
  );

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

  db.transaction(() => { for (const row of rows) insert.run(...row); })();
  return rows.length;
}

export function ftsSearch(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const db = getDb();
  try {
    // Escape special FTS5 chars, append * for prefix matching
    const safe = query.replace(/['"*^]/g, " ").trim();
    if (!safe) return [];
    const rows = db.prepare(`
      SELECT type, entity_id, studio_id, title, body, rank
      FROM search_fts
      WHERE search_fts MATCH ?
      ORDER BY rank
      LIMIT 12
    `).all(`${safe}*`) as { type: string; entity_id: string; studio_id: string; title: string; body: string; rank: number }[];

    return rows.map((r) => ({
      type: r.type as "studio" | "review" | "instructor",
      entityId: r.entity_id,
      studioId: r.studio_id,
      title: r.title,
      body: r.body,
      rank: r.rank,
    }));
  } catch {
    return [];
  }
}
