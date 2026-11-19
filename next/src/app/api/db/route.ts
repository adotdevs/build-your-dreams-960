import { NextResponse } from "next/server";
import { runQuery, type QueryBody } from "@/server/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QueryBody;
    const result = await runQuery(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database unavailable";
    return NextResponse.json({ data: null, error: { message }, count: null }, { status: 500 });
  }
}
