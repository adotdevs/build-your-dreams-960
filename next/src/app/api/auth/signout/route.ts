import { getDb } from "@/server/mongo";
import { readSessionToken } from "@/server/auth";
import { jsonWithSession } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const token = await readSessionToken();
    if (token) {
      const db = await getDb();
      await db.collection("sessions").deleteOne({ token });
    }
  } catch {
    // Clearing the cookie still signs the browser out.
  }
  return jsonWithSession({ error: null }, null, true);
}
