import { NextResponse } from "next/server";
import { runAdmin } from "@/server/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await runAdmin(String(body.action || ""), body.data || {});
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database unavailable";
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}
