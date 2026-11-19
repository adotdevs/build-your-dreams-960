import { NextResponse } from "next/server";
import { getActor } from "@/server/auth";
import { updatePassword } from "@/server/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ data: null, error: { message: "Not authenticated" } }, { status: 401 });
    const body = await request.json();
    const password = String(body.password || "");
    if (password.length < 6) return NextResponse.json({ data: null, error: { message: "Password should be at least 6 characters" } });
    await updatePassword(actor.id, password);
    return NextResponse.json({ data: { user: { id: actor.id, email: actor.email } }, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database unavailable";
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}
