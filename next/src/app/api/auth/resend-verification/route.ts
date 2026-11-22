import { NextResponse } from "next/server";
import { resendVerificationEmail } from "@/server/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const origin = request.headers.get("origin") || new URL(request.url).origin;
    const result = await resendVerificationEmail(String(body.email || ""), origin);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to resend verification email";
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}
