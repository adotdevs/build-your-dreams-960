import { verifyEmailToken } from "@/server/store";
import { jsonWithSession } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await verifyEmailToken(String(body.token || ""));
    return jsonWithSession({ data: result.data, error: result.error }, result.token);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed";
    return jsonWithSession({ data: { verified: false, user: null, session: null }, error: { message } });
  }
}
