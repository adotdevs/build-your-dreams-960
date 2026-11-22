import { signUp } from "@/server/store";
import { jsonWithSession } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const origin = request.headers.get("origin") || new URL(request.url).origin;
    const result = await signUp(String(body.email || ""), String(body.password || ""), body.metadata, origin);
    return jsonWithSession({ data: result.data, error: result.error }, result.token);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database unavailable";
    return jsonWithSession({ data: { user: null, session: null }, error: { message } });
  }
}
