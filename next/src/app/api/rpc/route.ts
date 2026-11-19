import { NextResponse } from "next/server";
import { runRpc } from "@/server/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await runRpc(String(body.name || ""), body.args || {});
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database unavailable";
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}
