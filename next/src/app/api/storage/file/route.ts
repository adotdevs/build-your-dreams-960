import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { readSignedFile } from "@/server/storage";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".gif": "image/gif",
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const bucket = url.searchParams.get("bucket") || "";
    const filePath = url.searchParams.get("path") || "";
    const exp = url.searchParams.get("exp") || "";
    const sig = url.searchParams.get("sig") || "";
    const file = await readSignedFile(bucket, filePath, exp, sig);
    if (!file) return new NextResponse("Not found", { status: 404 });
    const bytes = await readFile(file.full);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": TYPES[path.extname(file.full).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
