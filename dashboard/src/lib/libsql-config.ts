import path from "path";

// Resolves libSQL connection config for both local dev (a `file:` URL pointing at
// dev.db) and Turso (a `libsql://` URL plus auth token injected by Vercel).
//
// DATABASE_URL is checked first so a local .env keeps pointing at dev.db even
// though `vercel env pull` writes Turso credentials into .env.local, which Next
// loads at higher precedence. On Vercel only the TURSO_* vars are set.
export function libsqlConfig(): { url: string; authToken?: string } {
  const raw =
    process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL ?? "file:./dev.db";
  const authToken =
    process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN;

  if (raw.startsWith("file:")) {
    const filePath = raw.slice(5);
    const resolved = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);
    return { url: `file:${resolved}` };
  }

  return authToken ? { url: raw, authToken } : { url: raw };
}
