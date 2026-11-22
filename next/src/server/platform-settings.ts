import { getDb } from "./mongo";

export type SmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  appUrl: string;
};

export type PlatformSettings = {
  emailVerificationRequired: boolean;
  smtp: SmtpSettings;
  updated_at: string | null;
};

export type PublicPlatformSettings = {
  emailVerificationRequired: boolean;
  smtp: Omit<SmtpSettings, "pass"> & { hasPass: boolean };
  updated_at: string | null;
};

const SETTINGS_ID = "global";

function envSmtpDefaults(): SmtpSettings {
  const port = Number(process.env.SMTP_PORT || 587);
  return {
    host: (process.env.SMTP_HOST || "").trim(),
    port: Number.isFinite(port) && port > 0 ? port : 587,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    user: (process.env.SMTP_USER || "").trim(),
    pass: process.env.SMTP_PASS || "",
    fromName: (process.env.SMTP_FROM_NAME || "Cryptogen").trim(),
    fromEmail: (process.env.SMTP_FROM_EMAIL || "").trim(),
    appUrl: (process.env.APP_URL || "").trim().replace(/\/+$/, ""),
  };
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const db = await getDb();
  const doc = await db.collection("platform_settings").findOne({ _id: SETTINGS_ID } as never);
  const envDefaults = envSmtpDefaults();
  const storedSmtp = (doc?.smtp as Partial<SmtpSettings> | undefined) || {};

  const port = Number(storedSmtp.port ?? envDefaults.port);

  return {
    emailVerificationRequired: Boolean(doc?.emailVerificationRequired ?? false),
    smtp: {
      host: String(storedSmtp.host ?? envDefaults.host).trim(),
      port: Number.isFinite(port) && port > 0 ? port : 587,
      secure: typeof storedSmtp.secure === "boolean" ? storedSmtp.secure : envDefaults.secure,
      user: String(storedSmtp.user ?? envDefaults.user).trim(),
      pass: typeof storedSmtp.pass === "string" && storedSmtp.pass.length > 0 ? storedSmtp.pass : envDefaults.pass,
      fromName: String(storedSmtp.fromName ?? envDefaults.fromName).trim() || "Cryptogen",
      fromEmail: String(storedSmtp.fromEmail ?? envDefaults.fromEmail).trim(),
      appUrl: String(storedSmtp.appUrl ?? envDefaults.appUrl).trim().replace(/\/+$/, ""),
    },
    updated_at: doc?.updated_at ? String(doc.updated_at) : null,
  };
}

export async function getPublicPlatformSettings(): Promise<PublicPlatformSettings> {
  const settings = await getPlatformSettings();
  const { pass, ...restSmtp } = settings.smtp;
  return {
    emailVerificationRequired: settings.emailVerificationRequired,
    smtp: {
      ...restSmtp,
      hasPass: Boolean(pass),
    },
    updated_at: settings.updated_at,
  };
}

export async function savePlatformSettings(input: {
  emailVerificationRequired?: boolean;
  smtp?: Partial<SmtpSettings> & { clearPass?: boolean };
}): Promise<PublicPlatformSettings> {
  const db = await getDb();
  const current = await getPlatformSettings();
  const incomingSmtp = input.smtp || {};

  const port = incomingSmtp.port !== undefined ? Number(incomingSmtp.port) : current.smtp.port;
  const nextPass = incomingSmtp.clearPass
    ? ""
    : typeof incomingSmtp.pass === "string" && incomingSmtp.pass.length > 0
      ? incomingSmtp.pass
      : current.smtp.pass;

  const nextDoc: PlatformSettings = {
    emailVerificationRequired:
      typeof input.emailVerificationRequired === "boolean"
        ? input.emailVerificationRequired
        : current.emailVerificationRequired,
    smtp: {
      host: incomingSmtp.host !== undefined ? String(incomingSmtp.host).trim() : current.smtp.host,
      port: Number.isFinite(port) && port > 0 ? port : 587,
      secure: typeof incomingSmtp.secure === "boolean" ? incomingSmtp.secure : current.smtp.secure,
      user: incomingSmtp.user !== undefined ? String(incomingSmtp.user).trim() : current.smtp.user,
      pass: nextPass,
      fromName:
        incomingSmtp.fromName !== undefined
          ? String(incomingSmtp.fromName).trim() || "Cryptogen"
          : current.smtp.fromName,
      fromEmail: incomingSmtp.fromEmail !== undefined ? String(incomingSmtp.fromEmail).trim() : current.smtp.fromEmail,
      appUrl:
        incomingSmtp.appUrl !== undefined
          ? String(incomingSmtp.appUrl).trim().replace(/\/+$/, "")
          : current.smtp.appUrl,
    },
    updated_at: new Date().toISOString(),
  };

  await db.collection("platform_settings").updateOne(
    { _id: SETTINGS_ID } as never,
    { $set: nextDoc },
    { upsert: true },
  );

  return getPublicPlatformSettings();
}

export function isSmtpConfigured(smtp: SmtpSettings): boolean {
  return Boolean(smtp.host && smtp.port > 0 && smtp.fromEmail);
}

export function resolveAppBaseUrl(requestOrigin?: string | null, configuredAppUrl?: string): string {
  if (configuredAppUrl && configuredAppUrl.trim()) {
    return configuredAppUrl.trim().replace(/\/+$/, "");
  }
  if (requestOrigin && requestOrigin.trim()) {
    return requestOrigin.trim().replace(/\/+$/, "");
  }
  if (process.env.APP_URL && process.env.APP_URL.trim()) {
    return process.env.APP_URL.trim().replace(/\/+$/, "");
  }
  return "http://localhost:3000";
}
