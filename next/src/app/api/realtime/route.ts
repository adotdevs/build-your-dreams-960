import { NextResponse } from "next/server";
import { listEvents } from "@/server/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const since = Number(new URL(request.url).searchParams.get("since") || 0);
    const events = await listEvents(since);
    return NextResponse.json({ events });
  } catch {
    return NextResponse.json({ events: [] });
  }
}
