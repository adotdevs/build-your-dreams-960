import { NextResponse } from "next/server";
import { signedUrl } from "@/server/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await signedUrl(String(body.bucket || ""), String(body.path || ""), Number(body.expiresIn || 3600));
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sign file";
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}
