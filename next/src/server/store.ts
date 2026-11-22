import { randomBytes, randomUUID } from "crypto";
import type { Db } from "mongodb";
import { getDb } from "./mongo";
import { type Actor, checkPassword, createSession, ensureSetup, getActor, hashPassword, publicUser } from "./auth";
import { canResetClientPassword } from "@/lib/client-password-policy";
import { getPlatformSettings, isSmtpConfigured, resolveAppBaseUrl } from "./platform-settings";
import { sendVerificationEmail } from "./mailer";

type Filter = { field: string; op: string; value: unknown };
type Order = { field: string; ascending?: boolean };

export type QueryBody = {
  table: string;
  op: "select" | "insert" | "update" | "delete" | "upsert";
  columns?: string;
  count?: string | null;
  head?: boolean;
  filters?: Filter[];
  order?: Order[];
  limit?: number | null;
  mode?: "single" | "maybe" | null;
  payload?: unknown;
  onConflict?: string | null;
  returning?: boolean;
};

const SECURE_PROFILE_FIELDS = [
  "id", "email", "first_name", "last_name", "phone", "address", "city", "postal_code", "country",
  "nationality", "kyc_status", "available_balance", "blocked_balance", "agent_id", "company_id",
  "created_at", "updated_at",
];

const ADMIN_ROLES = new Set(["admin", "super_admin", "platform_owner", "company_admin"]);
const OWNER_ROLES = new Set(["platform_owner", "super_admin"]);

function fail(message: string) {
  return { data: null, error: { message }, count: null };
}

function ok(data: unknown, count: number | null = null) {
  return { data, error: null, count };
}

function clean(doc: Record<string, unknown> | null) {
  if (!doc) return null;
  const copy = { ...doc };
  delete copy._id;
  delete copy.passwordHash;
  return copy;
}

function project(doc: Record<string, unknown>, columns?: string) {
  const base = clean(doc) as Record<string, unknown>;
  if (!columns || columns.trim() === "*") return base;
  const fields = columns.split(",").map((part) => part.trim()).filter(Boolean);
  const out: Record<string, unknown> = {};
  for (const field of fields) out[field] = base[field];
  return out;
}

function mongoFilter(filters: Filter[] = []) {
  const query: Record<string, unknown> = {};
  for (const filter of filters) {
    if (filter.op === "eq" || filter.op === "is") query[filter.field] = filter.value;
    else if (filter.op === "neq") query[filter.field] = { $ne: filter.value };
    else if (filter.op === "in") query[filter.field] = { $in: Array.isArray(filter.value) ? filter.value : [] };
    else if (filter.op === "gt") query[filter.field] = { $gt: filter.value };
    else if (filter.op === "gte") query[filter.field] = { $gte: filter.value };
    else if (filter.op === "lt") query[filter.field] = { $lt: filter.value };
    else if (filter.op === "lte") query[filter.field] = { $lte: filter.value };
  }
  return query;
}

function collectionName(table: string) {
  return table === "profiles_secure" ? "profiles" : table;
}

async function nextSeq(db: Db) {
  await db.collection("counters").updateOne(
    { _id: "events" } as never,
    { $inc: { seq: 1 } },
    { upsert: true },
  );
  const row = await db.collection("counters").findOne({ _id: "events" } as never);
  return Number(row?.seq || Date.now());
}

async function publish(db: Db, table: string, type: string, doc: Record<string, unknown> | null, oldDoc?: Record<string, unknown> | null) {
  const seq = await nextSeq(db);
  await db.collection("events").insertOne({
    seq,
    table,
    type,
    new: doc ? clean(doc) : null,
    old: oldDoc ? clean(oldDoc) : null,
    at: new Date().toISOString(),
  });
}

async function accessSet(db: Db, actor: Actor | null): Promise<"ALL" | Set<string>> {
  if (!actor) return new Set();
  if (OWNER_ROLES.has(actor.role)) return "ALL";
  if (actor.role === "company_admin" && actor.companyId) {
    const rows = await db.collection("profiles").find({ company_id: actor.companyId }).project({ id: 1 }).toArray();
    return new Set(rows.map((row) => String(row.id)));
  }
  if (actor.role === "admin") {
    const rows = await db.collection("profiles").find({ agent_id: actor.id }).project({ id: 1 }).toArray();
    return new Set(rows.map((row) => String(row.id)));
  }
  return new Set();
}

function canSeeUser(actor: Actor | null, userId: unknown, access: "ALL" | Set<string>) {
  if (!actor || userId == null) return false;
  if (String(userId) === actor.id) return true;
  if (access === "ALL") return true;
  return access.has(String(userId));
}

async function ticketUserId(db: Db, ticketId: unknown) {
  if (!ticketId) return null;
  const ticket = await db.collection("support_tickets").findOne({ id: ticketId });
  return ticket?.user_id ?? null;
}

async function allowed(
  db: Db,
  actor: Actor | null,
  table: string,
  op: string,
  doc: Record<string, unknown>,
  access: "ALL" | Set<string>,
  system = false,
) {
  if (system) return true;
  if (!actor) return false;
  const admin = ADMIN_ROLES.has(actor.role);
  const owner = OWNER_ROLES.has(actor.role);

  if (table === "profiles" || table === "profiles_secure") {
    if (op === "insert") return doc.id === actor.id || admin;
    return canSeeUser(actor, doc.id, access);
  }
  if (table === "companies") {
    if (op === "select") return admin || doc.id === actor.companyId;
    if (op === "update") return owner || (actor.role === "company_admin" && doc.id === actor.companyId);
    return owner;
  }
  if (table === "user_roles") {
    if (op === "select") return admin || doc.user_id === actor.id;
    return owner || actor.role === "company_admin";
  }
  if (table === "agent_permissions") {
    if (op === "select") return admin || doc.agent_id === actor.id;
    return owner || actor.role === "company_admin";
  }
  if (table === "login_attempts") return admin || op === "insert";
  if (table === "support_messages") {
    const ownerId = await ticketUserId(db, doc.ticket_id);
    const seesTicket = canSeeUser(actor, ownerId, access);
    if (op === "insert") return doc.sender_id === actor.id && seesTicket;
    return seesTicket;
  }

  const userId = doc.user_id;
  const sees = canSeeUser(actor, userId, access);
  if (table === "transactions" || table === "wallet_addresses" || table === "client_deposit_info") {
    if (op === "select") return sees;
    return admin && sees;
  }
  if (table === "required_actions") {
    if (op === "select" || op === "update") return sees;
    return admin && sees;
  }
  if (table === "activity_logs") {
    if (op === "select") return sees;
    if (op === "insert") return doc.user_id === actor.id || admin;
    return admin && sees;
  }
  if (table === "bank_accounts" || table === "support_tickets") return sees;
  return admin;
}

function sortRows(rows: Record<string, unknown>[], order: Order[] = []) {
  if (!order.length) return rows;
  return [...rows].sort((a, b) => {
    for (const item of order) {
      const left = a[item.field] as string | number | null | undefined;
      const right = b[item.field] as string | number | null | undefined;
      if (left === right) continue;
      if (left == null) return item.ascending === false ? 1 : -1;
      if (right == null) return item.ascending === false ? -1 : 1;
      const cmp = left > right ? 1 : -1;
      return item.ascending === false ? -cmp : cmp;
    }
    return 0;
  });
}

function stamp(table: string, doc: Record<string, unknown>, isNew: boolean) {
  const now = new Date().toISOString();
  if (isNew && doc.created_at == null && table !== "login_attempts") doc.created_at = now;
  if (isNew && table === "login_attempts" && doc.attempted_at == null) doc.attempted_at = now;
  if (doc.updated_at == null && !["login_attempts", "support_messages", "transactions", "activity_logs", "user_roles"].includes(table)) {
    doc.updated_at = now;
  }
  if (!doc.id) doc.id = randomUUID();
  return doc;
}

export async function runQuery(body: QueryBody, systemActor?: Actor | null, system = false) {
  await ensureSetup();
  const db = await getDb();
  const actor = system ? systemActor || null : await getActor();
  const table = body.table;
  const name = collectionName(table);
  const access = await accessSet(db, actor);
  const filters = body.filters || [];
  const query = mongoFilter(filters);

  const visible = async (doc: Record<string, unknown>, op: string) =>
    allowed(db, actor, table, op, doc, access, system);

  if (body.op === "select") {
    const found = await db.collection(name).find(query).toArray();
    let rows = [] as Record<string, unknown>[];
    for (const doc of found) {
      if (await visible(doc as Record<string, unknown>, "select")) rows.push(doc as Record<string, unknown>);
    }
    if (table === "profiles_secure") {
      rows = rows.map((doc) => {
        const limited: Record<string, unknown> = {};
        for (const field of SECURE_PROFILE_FIELDS) limited[field] = doc[field];
        return limited;
      });
    }
    rows = sortRows(rows, body.order);
    if (body.limit) rows = rows.slice(0, body.limit);
    const count = body.count ? rows.length : null;
    if (body.head) return ok(null, count);
    const data = rows.map((doc) => project(doc, body.columns));
    if (body.mode === "single") {
      if (data.length !== 1) return fail("JSON object requested, multiple (or no) rows returned");
      return ok(data[0], count);
    }
    if (body.mode === "maybe") {
      if (data.length > 1) return fail("JSON object requested, multiple (or no) rows returned");
      return ok(data[0] ?? null, count);
    }
    return ok(data, count);
  }

  if (body.op === "insert") {
    const incoming = Array.isArray(body.payload) ? body.payload : [body.payload];
    const saved: Record<string, unknown>[] = [];
    for (const item of incoming) {
      const doc = stamp(name, { ...(item as Record<string, unknown>) }, true);
      if (!(await visible(doc, "insert"))) return fail("Not authorized");
      try {
        await db.collection(name).insertOne(doc);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Insert failed";
        if (/duplicate|E11000/i.test(message)) return fail("duplicate key value violates unique constraint");
        return fail(message);
      }
      saved.push(doc);
      await publish(db, name, "INSERT", doc);
    }
    if (!body.returning) return ok(null);
    const data = saved.map((doc) => project(doc, body.columns));
    if (body.mode === "single" || body.mode === "maybe") return ok(data[0] ?? null);
    return ok(data);
  }

  if (body.op === "update" || body.op === "delete") {
    const found = await db.collection(name).find(query).toArray();
    if (!found.length) return ok(body.returning ? [] : null);
    const allowedDocs: Record<string, unknown>[] = [];
    for (const doc of found) {
      if (await visible(doc as Record<string, unknown>, body.op)) allowedDocs.push(doc as Record<string, unknown>);
    }
    if (!allowedDocs.length) return fail("Not authorized");
    const ids = allowedDocs.map((doc) => doc.id);
    if (body.op === "delete") {
      await db.collection(name).deleteMany({ id: { $in: ids } });
      for (const doc of allowedDocs) await publish(db, name, "DELETE", null, doc);
      return ok(null);
    }
    const patch = { ...(body.payload as Record<string, unknown>), updated_at: new Date().toISOString() };
    await db.collection(name).updateMany({ id: { $in: ids } }, { $set: patch });
    const updated = allowedDocs.map((doc) => ({ ...doc, ...patch }));
    for (const doc of updated) await publish(db, name, "UPDATE", doc);
    if (!body.returning) return ok(null);
    const data = updated.map((doc) => project(doc, body.columns));
    if (body.mode === "single" || body.mode === "maybe") return ok(data[0] ?? null);
    return ok(data);
  }

  if (body.op === "upsert") {
    const rows = Array.isArray(body.payload) ? body.payload : [body.payload];
    const keys = (body.onConflict || "id").split(",").map((key) => key.trim()).filter(Boolean);
    for (const item of rows) {
      const doc = stamp(name, { ...(item as Record<string, unknown>) }, true);
      if (!(await visible(doc, "insert"))) return fail("Not authorized");
      const match: Record<string, unknown> = {};
      for (const key of keys) match[key] = doc[key];
      const existing = await db.collection(name).findOne(match);
      if (existing) {
        await db.collection(name).updateOne(match, { $set: { ...doc, id: existing.id, updated_at: new Date().toISOString() } });
      } else {
        await db.collection(name).insertOne(doc);
      }
      await publish(db, name, existing ? "UPDATE" : "INSERT", doc);
    }
    return ok(null);
  }

  return fail("Unsupported operation");
}

async function adjustBalance(db: Db, userId: string, availableDelta: number, blockedDelta: number) {
  const profile = await db.collection("profiles").findOne({ id: userId });
  if (!profile) throw new Error("Profile not found");
  const available = Number(profile.available_balance || 0) + availableDelta;
  const blocked = Number(profile.blocked_balance || 0) + blockedDelta;
  await db.collection("profiles").updateOne(
    { id: userId },
    { $set: { available_balance: available, blocked_balance: blocked, updated_at: new Date().toISOString() } },
  );
}

export async function runRpc(name: string, args: Record<string, unknown>) {
  await ensureSetup();
  const db = await getDb();
  const actor = await getActor();

  if (name === "check_rate_limit") {
    const email = String(args.p_email || "").toLowerCase();
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const attempts = await db.collection("login_attempts").find({ email, success: false, attempted_at: { $gt: since } }).toArray();
    if (attempts.length >= 5) {
      const last = attempts.map((row) => String(row.attempted_at)).sort().at(-1) || new Date().toISOString();
      const retry = Math.max(0, Math.ceil((new Date(last).getTime() + 15 * 60 * 1000 - Date.now()) / 1000));
      return ok({ allowed: false, attempts: attempts.length, retry_after_seconds: retry });
    }
    return ok({ allowed: true, attempts: attempts.length, retry_after_seconds: 0 });
  }

  if (name === "record_login_attempt") {
    await db.collection("login_attempts").insertOne({
      id: randomUUID(),
      email: String(args.p_email || "").toLowerCase(),
      success: Boolean(args.p_success),
      attempted_at: new Date().toISOString(),
    });
    return ok(null);
  }

  if (name === "validate_company_crypto_code") {
    const code = String(args.p_crypto_id_code || "").toUpperCase();
    const rows = await db.collection("companies").find({ status: { $ne: "paused" } }).toArray();
    const match = rows.find((row) => String(row.crypto_id_code || "").toUpperCase() === code);
    return ok(match ? [{ id: match.id, name: match.name }] : []);
  }

  if (!actor) return fail("Not authenticated");

  if (name === "insert_activity_log") {
    const profile = await db.collection("profiles").findOne({ id: args.p_user_id || actor.id });
    const doc = {
      id: randomUUID(),
      user_id: args.p_user_id || actor.id,
      type: args.p_type,
      title: args.p_title,
      description: args.p_description ?? null,
      metadata: args.p_metadata ?? null,
      ip_address: args.p_ip_address ?? null,
      user_agent: args.p_user_agent ?? null,
      company_id: profile?.company_id ?? actor.companyId,
      created_at: new Date().toISOString(),
    };
    await db.collection("activity_logs").insertOne(doc);
    await publish(db, "activity_logs", "INSERT", doc);
    return ok(doc.id);
  }

  if (name === "process_withdrawal_request") {
    const amount = Number(args.p_amount);
    if (!amount || amount <= 0) return fail("Invalid amount");
    const profile = await db.collection("profiles").findOne({ id: actor.id });
    if (!profile) return fail("Profile not found");
    if (Number(profile.available_balance || 0) < amount) return fail("Insufficient balance");
    await adjustBalance(db, actor.id, -amount, amount);
    const doc = {
      id: randomUUID(),
      user_id: actor.id,
      type: "withdrawal_request",
      amount,
      currency: "EUR",
      description: args.p_description ?? null,
      company_id: profile.company_id ?? null,
      created_at: new Date().toISOString(),
    };
    await db.collection("transactions").insertOne(doc);
    await publish(db, "transactions", "INSERT", doc);
    return ok(doc.id);
  }

  if (name === "process_balance_transaction") {
    const userId = String(args.p_user_id || "");
    const access = await accessSet(db, actor);
    if (!ADMIN_ROLES.has(actor.role) || !canSeeUser(actor, userId, access)) return fail("Not authorized");
    const amount = Number(args.p_amount);
    const type = String(args.p_transaction_type || "");
    if (["deposit", "credit", "recovery", "available_add"].includes(type)) await adjustBalance(db, userId, amount, 0);
    else if (["withdrawal", "debit", "fee", "available_remove"].includes(type)) await adjustBalance(db, userId, -amount, 0);
    else if (type === "blocked_add") await adjustBalance(db, userId, 0, amount);
    else if (type === "blocked_remove") await adjustBalance(db, userId, 0, -amount);
    else if (type === "block") await adjustBalance(db, userId, -amount, amount);
    else if (type === "unblock") await adjustBalance(db, userId, amount, -amount);
    else return fail(`Unknown transaction type: ${type}`);
    const profile = await db.collection("profiles").findOne({ id: userId });
    const doc = {
      id: randomUUID(),
      user_id: userId,
      admin_id: args.p_admin_id || actor.id,
      type,
      amount,
      crypto_symbol: args.p_crypto_symbol ?? null,
      crypto_amount: args.p_crypto_amount ?? null,
      description: args.p_description ?? null,
      company_id: args.p_company_id || profile?.company_id || null,
      currency: "EUR",
      created_at: new Date().toISOString(),
    };
    await db.collection("transactions").insertOne(doc);
    await publish(db, "transactions", "INSERT", doc);
    const fresh = await db.collection("profiles").findOne({ id: userId });
    if (fresh) await publish(db, "profiles", "UPDATE", fresh as Record<string, unknown>);
    return ok(null);
  }

  if (name === "admin_delete_transaction") {
    if (!ADMIN_ROLES.has(actor.role)) return fail("Not authorized");
    const tx = await db.collection("transactions").findOne({ id: args.p_transaction_id });
    if (!tx) return fail("Transaction not found");
    const access = await accessSet(db, actor);
    if (!canSeeUser(actor, tx.user_id, access)) return fail("Not authorized");
    const amount = Number(tx.amount || 0);
    const type = String(tx.type);
    if (["deposit", "credit", "recovery", "available_add"].includes(type)) await adjustBalance(db, String(tx.user_id), -amount, 0);
    else if (["withdrawal", "debit", "fee", "available_remove"].includes(type)) await adjustBalance(db, String(tx.user_id), amount, 0);
    else if (type === "blocked_add") await adjustBalance(db, String(tx.user_id), 0, -amount);
    else if (type === "blocked_remove") await adjustBalance(db, String(tx.user_id), 0, amount);
    else if (type === "block") await adjustBalance(db, String(tx.user_id), amount, -amount);
    else if (type === "unblock") await adjustBalance(db, String(tx.user_id), -amount, amount);
    await db.collection("transactions").deleteOne({ id: tx.id });
    await publish(db, "transactions", "DELETE", null, tx as Record<string, unknown>);
    return ok(null);
  }

  return fail("Unknown function");
}

async function createAccount(input: {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
  role?: string;
  companyId?: string | null;
  emailVerified?: boolean;
}) {
  const db = await getDb();
  const email = input.email.trim().toLowerCase();
  const existing = await db.collection("users").findOne({ email });
  if (existing) return { error: "User already registered" };
  const id = randomUUID();
  const now = new Date().toISOString();
  let companyId = input.companyId ?? null;
  if (!companyId && input.metadata?.company_id) companyId = String(input.metadata.company_id);
  if (!companyId) {
    const company = await db.collection("companies").find({ status: { $ne: "paused" } }).sort({ created_at: 1 }).limit(1).next();
    companyId = company?.id ? String(company.id) : null;
  }
  const emailVerified = input.emailVerified !== false;
  await db.collection("users").insertOne({
    id,
    email,
    passwordHash: await hashPassword(input.password),
    metadata: input.metadata || {},
    email_verified: emailVerified,
    email_verified_at: emailVerified ? now : null,
    created_at: now,
  });
  const profile = {
    id,
    email,
    first_name: input.metadata?.first_name ?? null,
    last_name: input.metadata?.last_name ?? null,
    phone: input.metadata?.phone ?? null,
    kyc_status: "pending",
    available_balance: 0,
    blocked_balance: 0,
    company_id: companyId,
    agent_id: null,
    created_at: now,
    updated_at: now,
  };
  await db.collection("profiles").insertOne(profile);
  await db.collection("user_roles").insertOne({
    id: randomUUID(),
    user_id: id,
    role: input.role || "client",
    created_at: now,
  });
  await publish(db, "profiles", "INSERT", profile);
  const user = publicUser({ id, email, metadata: input.metadata });
  return { user, error: null as null };
}

async function issueAndSendVerificationEmail(params: {
  userId: string;
  email: string;
  firstName?: string | null;
  requestOrigin?: string | null;
}) {
  const db = await getDb();
  const settings = await getPlatformSettings();
  if (!isSmtpConfigured(settings.smtp)) {
    throw new Error("Email verification is enabled, but SMTP is not configured. Please contact the platform administrator.");
  }
  const token = randomBytes(32).toString("hex");
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await db.collection("email_verification_tokens").deleteMany({ userId: params.userId });
  await db.collection("email_verification_tokens").insertOne({
    token,
    userId: params.userId,
    email: params.email,
    expiresAt,
    created_at: now,
  });
  const baseUrl = resolveAppBaseUrl(params.requestOrigin, settings.smtp.appUrl);
  const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
  await sendVerificationEmail({
    to: params.email,
    firstName: params.firstName,
    verifyUrl,
  });
}

export async function signUp(
  email: string,
  password: string,
  metadata?: Record<string, unknown>,
  requestOrigin?: string | null,
) {
  await ensureSetup();
  const settings = await getPlatformSettings();
  const requireVerification = settings.emailVerificationRequired;

  if (requireVerification && !isSmtpConfigured(settings.smtp)) {
    return {
      token: null,
      data: { user: null, session: null },
      error: { message: "Email verification is enabled, but SMTP is not configured. Please contact the platform administrator." },
    };
  }

  const created = await createAccount({
    email,
    password,
    metadata,
    role: "client",
    emailVerified: !requireVerification,
  });
  if (created.error || !created.user) {
    return { token: null, data: { user: null, session: null }, error: { message: created.error || "Sign up failed" } };
  }

  if (requireVerification) {
    try {
      await issueAndSendVerificationEmail({
        userId: created.user.id,
        email: created.user.email,
        firstName: typeof metadata?.first_name === "string" ? metadata.first_name : null,
        requestOrigin,
      });
    } catch (error) {
      const db = await getDb();
      await db.collection("email_verification_tokens").deleteMany({ userId: created.user.id });
      await db.collection("user_roles").deleteMany({ user_id: created.user.id });
      await db.collection("profiles").deleteOne({ id: created.user.id });
      await db.collection("users").deleteOne({ id: created.user.id });
      const message = error instanceof Error ? error.message : "Failed to send verification email";
      return { token: null, data: { user: null, session: null }, error: { message } };
    }
    return {
      token: null,
      data: { user: created.user, session: null, requiresEmailVerification: true },
      error: null,
    };
  }

  const token = await createSession(created.user.id);
  return { token, data: { user: created.user, session: { user: created.user }, requiresEmailVerification: false }, error: null };
}

export async function signIn(email: string, password: string) {
  await ensureSetup();
  const db = await getDb();
  const user = await db.collection("users").findOne({ email: email.trim().toLowerCase() });
  if (!user || !(await checkPassword(password, String(user.passwordHash || "")))) {
    return { token: null, data: { user: null, session: null }, error: { message: "Invalid login credentials" } };
  }
  const settings = await getPlatformSettings();
  if (settings.emailVerificationRequired) {
    const role = await roleOf(db, String(user.id));
    const isAdminAccount = role ? ADMIN_ROLES.has(role) : false;
    if (!isAdminAccount && user.email_verified !== true) {
      return {
        token: null,
        data: { user: null, session: null, requiresEmailVerification: true, email: String(user.email) },
        error: { message: "Please verify your email address before signing in. Check your inbox for the verification link." },
      };
    }
  }
  const token = await createSession(String(user.id));
  const pub = publicUser(user as unknown as { id: string; email: string; metadata?: Record<string, unknown> });
  return { token, data: { user: pub, session: { user: pub } }, error: null };
}

export async function verifyEmailToken(token: string) {
  await ensureSetup();
  const cleaned = token.trim();
  if (!cleaned) {
    return { token: null, data: { verified: false, user: null, session: null }, error: { message: "Verification token is missing" } };
  }
  const db = await getDb();
  const record = await db.collection("email_verification_tokens").findOne({ token: cleaned });
  if (!record) {
    return { token: null, data: { verified: false, user: null, session: null }, error: { message: "Invalid or already used verification link" } };
  }
  if (String(record.expiresAt) < new Date().toISOString()) {
    await db.collection("email_verification_tokens").deleteOne({ token: cleaned });
    return { token: null, data: { verified: false, user: null, session: null }, error: { message: "This verification link has expired. Please request a new one." } };
  }
  const user = await db.collection("users").findOne({ id: record.userId });
  if (!user) {
    await db.collection("email_verification_tokens").deleteOne({ token: cleaned });
    return { token: null, data: { verified: false, user: null, session: null }, error: { message: "Account not found" } };
  }
  const now = new Date().toISOString();
  await db.collection("users").updateOne(
    { id: user.id },
    { $set: { email_verified: true, email_verified_at: now } },
  );
  await db.collection("email_verification_tokens").deleteMany({ userId: user.id });
  const sessionToken = await createSession(String(user.id));
  const pub = publicUser(user as unknown as { id: string; email: string; metadata?: Record<string, unknown> });
  return {
    token: sessionToken,
    data: { verified: true, user: pub, session: { user: pub } },
    error: null,
  };
}

export async function resendVerificationEmail(email: string, requestOrigin?: string | null) {
  await ensureSetup();
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { data: null, error: { message: "Email is required" } };
  }
  const settings = await getPlatformSettings();
  if (!isSmtpConfigured(settings.smtp)) {
    return { data: null, error: { message: "SMTP is not configured. Please contact the platform administrator." } };
  }
  const db = await getDb();
  const user = await db.collection("users").findOne({ email: normalized });
  if (!user || user.email_verified === true) {
    return { data: { sent: true }, error: null };
  }
  const metadata = (user.metadata as Record<string, unknown> | undefined) || {};
  await issueAndSendVerificationEmail({
    userId: String(user.id),
    email: String(user.email),
    firstName: typeof metadata.first_name === "string" ? metadata.first_name : null,
    requestOrigin,
  });
  return { data: { sent: true }, error: null };
}

export async function updatePassword(userId: string, password: string) {
  const db = await getDb();
  await db.collection("users").updateOne({ id: userId }, { $set: { passwordHash: await hashPassword(password) } });
}

async function roleOf(db: Db, userId: string) {
  const row = await db.collection("user_roles").findOne({ user_id: userId });
  return (row?.role as string) || null;
}

async function companyOf(db: Db, userId: string) {
  const row = await db.collection("profiles").findOne({ id: userId });
  return (row?.company_id as string) || null;
}

export async function runAdmin(action: string, data: Record<string, unknown>) {
  await ensureSetup();
  const actor = await getActor();
  if (!actor) return fail("Not authenticated");
  const db = await getDb();
  const role = actor.role;

  if (action === "createAgent") {
    if (!["super_admin", "platform_owner", "company_admin"].includes(role)) return fail("Only admins can create agents");
    if (!data.email || !data.password) return fail("Email and password are required");
    const companyId = role === "company_admin" ? actor.companyId : (data.company_id as string) || actor.companyId;
    const created = await createAccount({
      email: String(data.email),
      password: String(data.password),
      metadata: { first_name: data.first_name, last_name: data.last_name },
      role: "admin",
      companyId,
    });
    if (created.error || !created.user) return fail(created.error || "User creation failed");
    await db.collection("activity_logs").insertOne({
      id: randomUUID(),
      user_id: actor.id,
      type: "security",
      title: "New agent created",
      description: `Created agent ${data.first_name || ""} ${data.last_name || ""} (${data.email})`,
      metadata: { agent_id: created.user.id, agent_email: data.email },
      company_id: actor.companyId,
      created_at: new Date().toISOString(),
    });
    return ok({ id: created.user.id, email: created.user.email });
  }

  if (action === "createCompanyAdmin") {
    if (role !== "platform_owner") return fail("Only platform owners can create company admins");
    if (!data.username || !data.password || !data.company_id) return fail("Username, password and company_id are required");
    const email = `${String(data.username).toLowerCase().replace(/[^a-z0-9_-]/g, "")}@cryptogen.internal`;
    const created = await createAccount({
      email,
      password: String(data.password),
      metadata: { username: data.username, is_company_admin: true, company_id: data.company_id },
      role: "company_admin",
      companyId: String(data.company_id),
    });
    if (created.error || !created.user) return fail(created.error || "User creation failed");
    await db.collection("companies").updateOne(
      { id: data.company_id },
      { $set: { admin_user_id: created.user.id, admin_username: data.username, updated_at: new Date().toISOString() } },
    );
    return ok({ id: created.user.id, email: created.user.email });
  }

  if (action === "resetAdminPassword" || action === "resetClientPassword") {
    const password = String(data.new_password || "").trim();
    const userId = String(data.user_id || "");
    if (!userId || !password) return fail("user_id and new_password are required");
    if (action === "resetClientPassword") {
      if (password.length < 8) return fail("Use a password with at least 8 characters");
      if (!["platform_owner", "super_admin", "company_admin"].includes(role)) return fail("Only administrators can reset client passwords");
      const targetRoles = (await db.collection("user_roles").find({ user_id: userId }).toArray()).map((row) => String(row.role));
      const callerCompany = await companyOf(db, actor.id);
      const targetCompany = await companyOf(db, userId);
      if (!canResetClientPassword(role, callerCompany, targetCompany, targetRoles)) {
        return fail("You can only reset passwords for clients you manage");
      }
    } else {
      if (role !== "platform_owner" && role !== "company_admin") {
        return fail("Only platform owners and company admins can reset passwords");
      }
      if (role === "company_admin") {
        const adminCompany = await companyOf(db, actor.id);
        const targetCompany = await companyOf(db, userId);
        if (!adminCompany || adminCompany !== targetCompany) return fail("You can only reset passwords for agents in your company");
        if ((await roleOf(db, userId)) !== "admin") return fail("You can only reset passwords for agents");
      }
    }
    await updatePassword(userId, password);
    return ok({ success: true });
  }

  if (action === "deleteUser") {
    if (!["super_admin", "platform_owner", "company_admin"].includes(role)) return fail("Not authorized");
    const userId = String(data.user_id || "");
    if (!userId) return fail("user_id required");
    if (role === "company_admin") {
      const adminCompany = await companyOf(db, actor.id);
      const targetCompany = await companyOf(db, userId);
      if (!adminCompany || adminCompany !== targetCompany) return fail("You can only delete users in your company");
    }
    const tickets = await db.collection("support_tickets").find({ user_id: userId }).toArray();
    const ticketIds = tickets.map((ticket) => ticket.id);
    if (ticketIds.length) await db.collection("support_messages").deleteMany({ ticket_id: { $in: ticketIds } });
    await db.collection("support_messages").deleteMany({ sender_id: userId });
    await db.collection("support_tickets").deleteMany({ user_id: userId });
    for (const table of ["transactions", "required_actions", "wallet_addresses", "bank_accounts", "client_deposit_info", "activity_logs"]) {
      await db.collection(table).deleteMany({ user_id: userId });
    }
    await db.collection("agent_permissions").deleteMany({ agent_id: userId });
    await db.collection("profiles").updateMany({ agent_id: userId }, { $set: { agent_id: null } });
    await db.collection("user_roles").deleteMany({ user_id: userId });
    await db.collection("profiles").deleteOne({ id: userId });
    await db.collection("users").deleteOne({ id: userId });
    await db.collection("sessions").deleteMany({ userId });
    return ok({ success: true });
  }

  return fail("Unknown action");
}

export async function listEvents(since: number) {
  await ensureSetup();
  const actor = await getActor();
  if (!actor) return [];
  const db = await getDb();
  const events = await db.collection("events").find({ seq: { $gt: since } }).sort({ seq: 1 }).limit(100).toArray();
  return events.map((event) => ({
    seq: event.seq,
    table: event.table,
    type: event.type,
    new: event.new,
    old: event.old,
  }));
}
