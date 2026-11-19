import { NextResponse } from "next/server";
import { saveUpload } from "@/server/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const bucket = String(form.get("bucket") || "");
    const filePath = String(form.get("path") || "");
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ data: null, error: { message: "File is required" } }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const result = await saveUpload(bucket, filePath, bytes, form.get("upsert") === "1");
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}
