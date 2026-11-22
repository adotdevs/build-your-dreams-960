import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/server/mongo";
import { ensureSetup } from "@/server/auth";
import { getPlatformSettings, isSmtpConfigured, resolveAppBaseUrl } from "@/server/platform-settings";
import { sendPasswordResetEmail } from "@/server/mailer";

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
      const settings = await getPlatformSettings();
      if (isSmtpConfigured(settings.smtp)) {
        const origin = request.headers.get("origin") || new URL(request.url).origin;
        const baseUrl = resolveAppBaseUrl(origin, settings.smtp.appUrl);
        const redirectBase =
          typeof body.redirectTo === "string" && body.redirectTo.trim()
            ? body.redirectTo.trim()
            : `${baseUrl}/reset-password`;
        const sep = redirectBase.includes("?") ? "&" : "?";
        const resetUrl = `${redirectBase}${sep}token=${encodeURIComponent(token)}&type=recovery`;
        await sendPasswordResetEmail({ to: String(user.email), resetUrl });
      }
    }
    return NextResponse.json({ data: {}, error: null });
  } catch {
    return NextResponse.json({ data: {}, error: null });
  }
}
