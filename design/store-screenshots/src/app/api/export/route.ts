import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Saves an exported bundle to exports/<name>.zip beside the project file.
export async function POST(req: Request) {
  const name = path.basename(new URL(req.url).searchParams.get("name") || "export.zip");
  if (!name.endsWith(".zip")) return NextResponse.json({ ok: false }, { status: 400 });
  const dir = path.join(process.cwd(), "exports");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), Buffer.from(await req.arrayBuffer()));
  return NextResponse.json({ ok: true });
}
