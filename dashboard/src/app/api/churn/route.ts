import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  const filePath = join(process.cwd(), "predictions.json");
  const raw = readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);
  return Response.json(data);
}
