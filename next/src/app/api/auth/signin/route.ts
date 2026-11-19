import { signIn } from "@/server/store";
import { jsonWithSession } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await signIn(String(body.email || ""), String(body.password || ""));
    return jsonWithSession({ data: result.data, error: result.error }, result.token);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database unavailable";
    return jsonWithSession({ data: { user: null, session: null }, error: { message } });
  }
}
