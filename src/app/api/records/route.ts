import { NextResponse } from "next/server";
import { store } from "@/lib/db/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = store();
  const records = await s.listRecords();
  const withCounts = await Promise.all(
    records.map(async (d) => ({ ...d, chunks: await s.chunkCount(d.id) })),
  );
  return NextResponse.json({ records: withCounts });
}
