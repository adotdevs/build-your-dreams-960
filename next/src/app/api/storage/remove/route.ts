import { NextResponse } from "next/server";
import { removeFiles } from "@/server/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await removeFiles(String(body.bucket || ""), Array.isArray(body.paths) ? body.paths.map(String) : []);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to remove file";
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}
