import { getDb } from "@/server/mongo";
import { createSession, ensureSetup, publicUser } from "@/server/auth";
import { jsonWithSession } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await ensureSetup();
    const body = await request.json();
    const db = await getDb();
    const row = await db.collection("reset_tokens").findOne({ token: String(body.token || "") });
    if (!row || String(row.expiresAt) < new Date().toISOString()) {
      return jsonWithSession({ data: { session: null }, error: { message: "Invalid or expired reset link" } });
    }
    const user = await db.collection("users").findOne({ id: row.userId });
    if (!user) return jsonWithSession({ data: { session: null }, error: { message: "User not found" } });
    await db.collection("reset_tokens").deleteOne({ token: row.token });
    const token = await createSession(String(user.id));
    const pub = publicUser(user as unknown as { id: string; email: string; metadata?: Record<string, unknown> });
    return jsonWithSession({ data: { session: { user: pub } }, error: null }, token);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database unavailable";
    return jsonWithSession({ data: { session: null }, error: { message } });
  }
}
