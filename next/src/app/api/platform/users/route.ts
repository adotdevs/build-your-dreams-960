import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { ensureSetup, getActor, hashPassword } from "@/server/auth";
import { getDb } from "@/server/mongo";

export const dynamic = "force-dynamic";

const OWNER_ROLES = new Set(["platform_owner", "super_admin"]);
const VALID_ROLES = new Set(["client", "admin", "company_admin", "super_admin", "platform_owner"]);

async function requireOwner() {
  await ensureSetup();
  const actor = await getActor();
  if (!actor) {
    return { actor: null, response: NextResponse.json({ data: null, error: { message: "Not authenticated" } }, { status: 401 }) };
  }
  if (!OWNER_ROLES.has(actor.role)) {
    return {
      actor: null,
      response: NextResponse.json({ data: null, error: { message: "Only platform owners can manage all users" } }, { status: 403 }),
    };
  }
  return { actor, response: null };
}

export async function GET() {
  try {
    const auth = await requireOwner();
    if (auth.response) return auth.response;

    const db = await getDb();
    const [users, profiles, roles, companies] = await Promise.all([
      db.collection("users").find({}).toArray(),
      db.collection("profiles").find({}).toArray(),
      db.collection("user_roles").find({}).toArray(),
      db.collection("companies").find({}).toArray(),
    ]);

    const profileById = new Map<string, Record<string, unknown>>();
    for (const p of profiles) profileById.set(String(p.id), p as Record<string, unknown>);

    const roleByUserId = new Map<string, string>();
    for (const r of roles) roleByUserId.set(String(r.user_id), String(r.role));

    const companyById = new Map<string, Record<string, unknown>>();
    for (const c of companies) companyById.set(String(c.id), c as Record<string, unknown>);

    // Count clients assigned to each agent
    const clientCountByAgent = new Map<string, number>();
    for (const p of profiles) {
      if (p.agent_id) {
        const key = String(p.agent_id);
        clientCountByAgent.set(key, (clientCountByAgent.get(key) || 0) + 1);
      }
    }

    const directory = users.map((u) => {
      const id = String(u.id);
      const profile = profileById.get(id);
      const role = roleByUserId.get(id) || "client";
      const companyId = profile?.company_id ? String(profile.company_id) : null;
      const company = companyId ? companyById.get(companyId) : null;
      const agentId = profile?.agent_id ? String(profile.agent_id) : null;
      const agentProfile = agentId ? profileById.get(agentId) : null;
      const metadata = (u.metadata as Record<string, unknown> | undefined) || {};

      const firstName = String(profile?.first_name ?? metadata.first_name ?? "").trim();
      const lastName = String(profile?.last_name ?? metadata.last_name ?? "").trim();
      const agentName = agentProfile
        ? `${String(agentProfile.first_name || "").trim()} ${String(agentProfile.last_name || "").trim()}`.trim() ||
          String(agentProfile.email || "")
        : null;

      return {
        id,
        email: String(u.email || profile?.email || ""),
        first_name: firstName,
        last_name: lastName,
        phone: profile?.phone ? String(profile.phone) : "",
        role,
        company_id: companyId,
        company_name: company ? String(company.name || "") : null,
        agent_id: agentId,
        agent_name: agentName,
        agent_email: agentProfile?.email ? String(agentProfile.email) : null,
        assigned_clients_count: clientCountByAgent.get(id) || 0,
        kyc_status: String(profile?.kyc_status || "pending"),
        available_balance: Number(profile?.available_balance || 0),
        blocked_balance: Number(profile?.blocked_balance || 0),
        email_verified: u.email_verified !== false,
        created_at: String(u.created_at || profile?.created_at || ""),
      };
    });

    directory.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

    const companyOptions = companies
      .map((c) => ({
        id: String(c.id),
        name: String(c.name || ""),
        slug: String(c.slug || ""),
        status: String(c.status || "active"),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const agentOptions = directory
      .filter((u) => u.role === "admin" || u.role === "company_admin")
      .map((u) => ({
        id: u.id,
        name: `${u.first_name} ${u.last_name}`.trim() || u.email,
        email: u.email,
        role: u.role,
        company_id: u.company_id,
      }));

    return NextResponse.json({
      data: {
        users: directory,
        companies: companyOptions,
        agents: agentOptions,
      },
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load users";
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireOwner();
    if (auth.response) return auth.response;

    const body = await request.json();
    const userId = String(body.id || "").trim();
    if (!userId) {
      return NextResponse.json({ data: null, error: { message: "User id is required" } }, { status: 400 });
    }

    const db = await getDb();
    const existingUser = await db.collection("users").findOne({ id: userId });
    if (!existingUser) {
      return NextResponse.json({ data: null, error: { message: "User not found" } }, { status: 404 });
    }

    const now = new Date().toISOString();
    const userSet: Record<string, unknown> = {};
    const profileSet: Record<string, unknown> = { updated_at: now };

    if (typeof body.email === "string" && body.email.trim()) {
      const normalizedEmail = body.email.trim().toLowerCase();
      if (normalizedEmail !== String(existingUser.email || "").toLowerCase()) {
        const conflict = await db.collection("users").findOne({ email: normalizedEmail, id: { $ne: userId } });
        if (conflict) {
          return NextResponse.json({ data: null, error: { message: "That email is already in use by another account" } }, { status: 409 });
        }
        userSet.email = normalizedEmail;
        profileSet.email = normalizedEmail;
      }
    }

    if (typeof body.first_name === "string") {
      profileSet.first_name = body.first_name.trim() || null;
      userSet["metadata.first_name"] = body.first_name.trim() || null;
    }
    if (typeof body.last_name === "string") {
      profileSet.last_name = body.last_name.trim() || null;
      userSet["metadata.last_name"] = body.last_name.trim() || null;
    }
    if (typeof body.phone === "string") {
      profileSet.phone = body.phone.trim() || null;
    }
    if (body.company_id !== undefined) {
      profileSet.company_id = body.company_id ? String(body.company_id) : null;
    }
    if (body.agent_id !== undefined) {
      profileSet.agent_id = body.agent_id ? String(body.agent_id) : null;
    }
    if (typeof body.kyc_status === "string" && ["pending", "submitted", "approved", "rejected"].includes(body.kyc_status)) {
      profileSet.kyc_status = body.kyc_status;
    }
    if (typeof body.email_verified === "boolean") {
      userSet.email_verified = body.email_verified;
      userSet.email_verified_at = body.email_verified ? now : null;
    }
    if (typeof body.new_password === "string" && body.new_password.trim().length > 0) {
      if (body.new_password.trim().length < 6) {
        return NextResponse.json({ data: null, error: { message: "Password must be at least 6 characters" } }, { status: 400 });
      }
      userSet.passwordHash = await hashPassword(body.new_password.trim());
    }

    if (typeof body.role === "string" && VALID_ROLES.has(body.role)) {
      if (userId === auth.actor?.id && body.role !== "platform_owner") {
        return NextResponse.json(
          { data: null, error: { message: "You cannot downgrade your own Platform Owner role" } },
          { status: 400 },
        );
      }
      await db.collection("user_roles").deleteMany({ user_id: userId });
      await db.collection("user_roles").insertOne({
        id: randomUUID(),
        user_id: userId,
        role: body.role,
        created_at: now,
      });
    }

    if (Object.keys(userSet).length > 0) {
      await db.collection("users").updateOne({ id: userId }, { $set: userSet });
    }
    await db.collection("profiles").updateOne({ id: userId }, { $set: profileSet });

    return NextResponse.json({ data: { updated: true, id: userId }, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireOwner();
    if (auth.response) return auth.response;

    const body = await request.json();
    const userId = String(body.id || "").trim();
    if (!userId) {
      return NextResponse.json({ data: null, error: { message: "User id is required" } }, { status: 400 });
    }
    if (userId === auth.actor?.id) {
      return NextResponse.json({ data: null, error: { message: "You cannot delete your own account" } }, { status: 400 });
    }

    const db = await getDb();
    const tickets = await db.collection("support_tickets").find({ user_id: userId }).toArray();
    const ticketIds = tickets.map((t) => t.id);
    if (ticketIds.length) await db.collection("support_messages").deleteMany({ ticket_id: { $in: ticketIds } });
    await db.collection("support_messages").deleteMany({ sender_id: userId });
    await db.collection("support_tickets").deleteMany({ user_id: userId });

    for (const table of [
      "transactions",
      "required_actions",
      "wallet_addresses",
      "bank_accounts",
      "client_deposit_info",
      "activity_logs",
    ]) {
      await db.collection(table).deleteMany({ user_id: userId });
    }

    await db.collection("agent_permissions").deleteMany({ agent_id: userId });
    await db.collection("profiles").updateMany({ agent_id: userId }, { $set: { agent_id: null } });
    await db.collection("companies").updateMany({ admin_user_id: userId }, { $set: { admin_user_id: null } });
    await db.collection("user_roles").deleteMany({ user_id: userId });
    await db.collection("profiles").deleteOne({ id: userId });
    await db.collection("users").deleteOne({ id: userId });
    await db.collection("sessions").deleteMany({ userId });
    await db.collection("email_verification_tokens").deleteMany({ userId });
    await db.collection("reset_tokens").deleteMany({ userId });

    return NextResponse.json({ data: { deleted: true, id: userId }, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete user";
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}
