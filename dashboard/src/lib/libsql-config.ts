import path from "path";

// Resolves libSQL connection config for both local dev (a `file:` URL pointing at
// dev.db) and Turso (a `libsql://` URL plus auth token).
//
// The two environments want opposite precedence:
//   - On Vercel the hosted database is the only writable one. A stray .env in the
//     upload would otherwise point DATABASE_URL at a bundled dev.db, which lives
//     on a read-only filesystem and fails every write with SQLITE_READONLY.
//   - Locally DATABASE_URL must win, because `vercel env pull` writes Turso
//     credentials into .env.local and Next loads that above .env — without this
//     local dev would silently read and write the hosted demo database.
export function libsqlConfig(): { url: string; authToken?: string } {
  const onVercel = Boolean(process.env.VERCEL);

  const raw = onVercel
    ? process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? "file:./dev.db"
    : process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL ?? "file:./dev.db";

  const authToken =
    process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN;

  if (raw.startsWith("file:")) {
    if (onVercel) {
      throw new Error(
        "libsqlConfig resolved to a local file on Vercel; TURSO_DATABASE_URL is not set for this environment."
      );
    }
    const filePath = raw.slice(5);
    const resolved = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);
    return { url: `file:${resolved}` };
  }

  return authToken ? { url: raw, authToken } : { url: raw };
}
