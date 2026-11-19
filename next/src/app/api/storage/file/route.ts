import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { readSignedFile } from "@/server/storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const bucket = url.searchParams.get("bucket") || "";
    const filePath = url.searchParams.get("path") || "";
    const exp = url.searchParams.get("exp") || "";
    const sig = url.searchParams.get("sig") || "";
    const file = await readSignedFile(bucket, filePath, exp, sig);
    if (!file) return new NextResponse("Not found", { status: 404 });
    const body = "stream" in file && file.stream ? file.stream : await readFile(file.full);
    return new NextResponse(body, {
      headers: {
        "Content-Type": file.contentType,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
