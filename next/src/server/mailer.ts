import nodemailer from "nodemailer";
import { getPlatformSettings, isSmtpConfigured, type SmtpSettings } from "./platform-settings";

function buildTransporter(smtp: SmtpSettings) {
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.user
      ? {
          user: smtp.user,
          pass: smtp.pass,
        }
      : undefined,
  });
}

function formatFrom(smtp: SmtpSettings) {
  const name = smtp.fromName || "Cryptogen";
  return `"${name.replace(/"/g, "")}" <${smtp.fromEmail}>`;
}

export async function sendMail(
  options: { to: string; subject: string; html: string; text: string },
  overrideSmtp?: Partial<SmtpSettings>,
) {
  const settings = await getPlatformSettings();
  const smtp: SmtpSettings = {
    ...settings.smtp,
    ...(overrideSmtp || {}),
    pass:
      overrideSmtp && typeof overrideSmtp.pass === "string" && overrideSmtp.pass.length > 0
        ? overrideSmtp.pass
        : settings.smtp.pass,
  };

  if (!isSmtpConfigured(smtp)) {
    throw new Error("SMTP is not configured. Please set SMTP Host, Port, and From Email in Platform Settings.");
  }

  const transporter = buildTransporter(smtp);
  await transporter.sendMail({
    from: formatFrom(smtp),
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

export async function sendVerificationEmail(params: {
  to: string;
  firstName?: string | null;
  verifyUrl: string;
}) {
  const greeting = params.firstName ? `Hi ${params.firstName},` : "Hello,";
  const subject = "Verify your Cryptogen email address";
  const text = `${greeting}\n\nPlease verify your email address by opening this link:\n${params.verifyUrl}\n\nIf you did not create an account, you can safely ignore this email.`;
  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111827;">
      <h2 style="margin: 0 0 16px; font-size: 26px; font-weight: 700; letter-spacing: -0.02em;">cryptogen<span style="color: #EA5228;">.</span></h2>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">${greeting}</p>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
        Please confirm your email address to activate your account by clicking the button below:
      </p>
      <p style="margin: 0 0 24px;">
        <a href="${params.verifyUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
          Verify Email Address
        </a>
      </p>
      <p style="margin: 0 0 12px; font-size: 13px; color: #6b7280; word-break: break-all;">
        Or copy and paste this link into your browser:<br />
        <a href="${params.verifyUrl}" style="color: #2563eb;">${params.verifyUrl}</a>
      </p>
      <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">
        If you did not sign up for Cryptogen, please ignore this email.
      </p>
    </div>
  `;

  await sendMail({ to: params.to, subject, html, text });
}

export async function sendPasswordResetEmail(params: { to: string; resetUrl: string }) {
  const subject = "Reset your Cryptogen password";
  const text = `You requested a password reset for your Cryptogen account.\n\nOpen this link to choose a new password:\n${params.resetUrl}\n\nThis link expires in 1 hour.`;
  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111827;">
      <h2 style="margin: 0 0 16px; font-size: 26px; font-weight: 700; letter-spacing: -0.02em;">cryptogen<span style="color: #EA5228;">.</span></h2>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">
        You requested a password reset for your account. Click the button below to set a new password:
      </p>
      <p style="margin: 0 0 24px;">
        <a href="${params.resetUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
          Reset Password
        </a>
      </p>
      <p style="margin: 0 0 12px; font-size: 13px; color: #6b7280; word-break: break-all;">
        Or copy and paste this link into your browser:<br />
        <a href="${params.resetUrl}" style="color: #2563eb;">${params.resetUrl}</a>
      </p>
      <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">
        This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.
      </p>
    </div>
  `;

  await sendMail({ to: params.to, subject, html, text });
}

export async function sendTestEmail(to: string, overrideSmtp?: Partial<SmtpSettings>) {
  const subject = "Cryptogen SMTP Test Email";
  const text = "This is a test email from Cryptogen Platform Settings confirming that your SMTP configuration is working.";
  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111827;">
      <h2 style="margin: 0 0 16px; font-size: 26px; font-weight: 700; letter-spacing: -0.02em;">cryptogen<span style="color: #EA5228;">.</span></h2>
      <p style="margin: 0; font-size: 15px; line-height: 1.6;">
        Your SMTP configuration is working properly. Emails from Cryptogen can now be delivered.
      </p>
    </div>
  `;

  await sendMail({ to, subject, html, text }, overrideSmtp);
}
