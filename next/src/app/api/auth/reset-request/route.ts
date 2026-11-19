import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/server/mongo";
import { ensureSetup } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await ensureSetup();
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const db = await getDb();
    const user = await db.collection("users").findOne({ email });
    if (user) {
      const token = randomUUID();
      await db.collection("reset_tokens").insertOne({
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });
    }
    return NextResponse.json({ data: {}, error: null });
  } catch {
    return NextResponse.json({ data: {}, error: null });
  }
}
