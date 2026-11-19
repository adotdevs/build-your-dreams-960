import { NextResponse } from "next/server";
import { ensureSetup, getSessionPayload } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSetup();
    const payload = await getSessionPayload();
    return NextResponse.json({ data: payload });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database unavailable";
    return NextResponse.json({ data: { session: null, user: null }, error: { message } });
  }
}
