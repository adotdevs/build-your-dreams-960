import { randomBytes, createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getDb } from "./mongo";

export const SESSION_COOKIE = "cryptogen_session";
const SESSION_DAYS = 14;

export type Actor = {
  id: string;
  email: string;
  role: string;
  companyId: string | null;
};

export type PublicUser = {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
};

function secret() {
  return process.env.AUTH_SECRET || "cryptogen-local-auth-secret";
}

export function signValue(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function checkPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function publicUser(user: { id: string; email: string; metadata?: Record<string, unknown> }): PublicUser {
  return {
    id: user.id,
    email: user.email,
    user_metadata: user.metadata || {},
  };
}

export async function createSession(userId: string) {
  const db = await getDb();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await db.collection("sessions").insertOne({ token, userId, expiresAt });
  return token;
}

export async function readSessionToken() {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value || null;
}

export async function userFromToken(token: string | null) {
  if (!token) return null;
  const db = await getDb();
  const session = await db.collection("sessions").findOne({ token });
  if (!session) return null;
  if (String(session.expiresAt) < new Date().toISOString()) {
    await db.collection("sessions").deleteOne({ token });
    return null;
  }
  const user = await db.collection("users").findOne({ id: session.userId });
  if (!user) return null;
  return publicUser(user as unknown as { id: string; email: string; metadata?: Record<string, unknown> });
}

export async function getActor(): Promise<Actor | null> {
  const token = await readSessionToken();
  const user = await userFromToken(token);
  if (!user) return null;
  const db = await getDb();
  const roleRow = await db.collection("user_roles").findOne({ user_id: user.id });
  const profile = await db.collection("profiles").findOne({ id: user.id });
  return {
    id: user.id,
    email: user.email,
    role: (roleRow?.role as string) || "client",
    companyId: (profile?.company_id as string) || null,
  };
}

export async function getSessionPayload() {
  const token = await readSessionToken();
  const user = await userFromToken(token);
  if (!user) return { session: null, user: null };
  return { session: { user }, user };
}

let setupPromise: Promise<void> | null = null;

export function ensureSetup() {
  if (!setupPromise) {
    setupPromise = setup().catch((error) => {
      setupPromise = null;
      throw error;
    });
  }
  return setupPromise;
}

async function setup() {
  const db = await getDb();
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("sessions").createIndex({ token: 1 }, { unique: true });
  await db.collection("companies").createIndex({ slug: 1 }, { unique: true });
  await db.collection("companies").createIndex({ crypto_id_code: 1 }, { unique: true });
  await db.collection("user_roles").createIndex({ user_id: 1, role: 1 }, { unique: true });
  await db.collection("profiles").createIndex({ company_id: 1 });
  await db.collection("profiles").createIndex({ agent_id: 1 });
  await db.collection("events").createIndex({ seq: 1 });
  await db.collection("email_verification_tokens").createIndex({ token: 1 }, { unique: true });
  await db.collection("email_verification_tokens").createIndex({ userId: 1 });

  const existing = await db.collection("users").countDocuments();
  if (existing > 0) return;

  const email = (process.env.SEED_OWNER_EMAIL || "owner@cryptogen.internal").toLowerCase();
  const password = process.env.SEED_OWNER_PASSWORD || "Owner12345!";
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.collection("users").insertOne({
    id,
    email,
    passwordHash: await hashPassword(password),
    metadata: { first_name: "Platform", last_name: "Owner" },
    email_verified: true,
    email_verified_at: now,
    created_at: now,
  });
  await db.collection("profiles").insertOne({
    id,
    email,
    first_name: "Platform",
    last_name: "Owner",
    kyc_status: "pending",
    available_balance: 0,
    blocked_balance: 0,
    company_id: null,
    agent_id: null,
    created_at: now,
    updated_at: now,
  });
  await db.collection("user_roles").insertOne({
    id: crypto.randomUUID(),
    user_id: id,
    role: "platform_owner",
    created_at: now,
  });
}

export { publicUser };
