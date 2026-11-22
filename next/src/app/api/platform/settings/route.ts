import { NextResponse } from "next/server";
import { ensureSetup, getActor } from "@/server/auth";
import { getPublicPlatformSettings, savePlatformSettings } from "@/server/platform-settings";
import { sendTestEmail } from "@/server/mailer";

export const dynamic = "force-dynamic";

const OWNER_ROLES = new Set(["platform_owner", "super_admin"]);

async function requireOwner() {
  await ensureSetup();
  const actor = await getActor();
  if (!actor) return { actor: null, response: NextResponse.json({ data: null, error: { message: "Not authenticated" } }, { status: 401 }) };
  if (!OWNER_ROLES.has(actor.role)) {
    return { actor: null, response: NextResponse.json({ data: null, error: { message: "Only platform owners can manage platform settings" } }, { status: 403 }) };
  }
  return { actor, response: null };
}

export async function GET() {
  try {
    const auth = await requireOwner();
    if (auth.response) return auth.response;
    const data = await getPublicPlatformSettings();
    return NextResponse.json({ data, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load platform settings";
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireOwner();
    if (auth.response) return auth.response;
    const body = await request.json();
    const data = await savePlatformSettings({
      emailVerificationRequired:
        typeof body.emailVerificationRequired === "boolean" ? body.emailVerificationRequired : undefined,
      smtp: body.smtp && typeof body.smtp === "object" ? body.smtp : undefined,
    });
    return NextResponse.json({ data, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save platform settings";
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireOwner();
    if (auth.response) return auth.response;
    const body = await request.json();
    if (body.action === "test_smtp") {
      const to = String(body.to || auth.actor?.email || "").trim();
      if (!to) {
        return NextResponse.json({ data: null, error: { message: "Recipient email is required" } }, { status: 400 });
      }
      await sendTestEmail(to, body.smtp && typeof body.smtp === "object" ? body.smtp : undefined);
      return NextResponse.json({ data: { sent: true, to }, error: null });
    }
    return NextResponse.json({ data: null, error: { message: "Unknown action" } }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send test email";
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}
