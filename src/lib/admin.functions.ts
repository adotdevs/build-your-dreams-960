import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { canResetClientPassword } from "@/lib/client-password-policy";

type Result<T> = { data: T | null; error: { message: string } | null };

const fail = (message: string): Result<any> => ({ data: null, error: { message } });

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function getRole(admin: any, userId: string): Promise<string | null> {
  const { data } = await admin.from("user_roles").select("role").eq("user_id", userId).single();
  return data?.role ?? null;
}

async function getCompanyId(admin: any, userId: string): Promise<string | null> {
  const { data } = await admin.from("profiles").select("company_id").eq("id", userId).single();
  return data?.company_id ?? null;
}

export const createAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    company_id?: string | null;
  }) => d)
  .handler(async ({ data, context }): Promise<Result<{ id: string; email: string | undefined }>> => {
    const admin = await getAdmin();
    const role = await getRole(admin, (context as any).userId);

    if (!role || !["super_admin", "platform_owner", "company_admin"].includes(role)) {
      return fail("Only admins can create agents");
    }
    if (!data.email || !data.password) return fail("Email and password are required");

    let agentCompanyId: string | null = null;
    if (role === "company_admin") {
      agentCompanyId = await getCompanyId(admin, (context as any).userId);
    } else {
      agentCompanyId = data.company_id ?? (await getCompanyId(admin, (context as any).userId));
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { first_name: data.first_name, last_name: data.last_name },
    });

    if (createError) return fail(createError.message);
    if (!created?.user) return fail("User creation failed");

    await admin.from("user_roles").update({ role: "admin" }).eq("user_id", created.user.id);

    if (agentCompanyId) {
      await admin.from("profiles").update({ company_id: agentCompanyId }).eq("id", created.user.id);
    }

    await admin.rpc("insert_activity_log", {
      p_user_id: (context as any).userId,
      p_title: "New agent created",
      p_type: "security",
      p_description: `Created agent ${data.first_name || ""} ${data.last_name || ""} (${data.email})`,
      p_metadata: { agent_id: created.user.id, agent_email: data.email },
    });

    return { data: { id: created.user.id, email: created.user.email }, error: null };
  });

export const createCompanyAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    username: string;
    password: string;
    company_id: string;
    company_name?: string;
  }) => d)
  .handler(async ({ data, context }): Promise<Result<{ id: string; email: string | undefined }>> => {
    const admin = await getAdmin();
    const role = await getRole(admin, (context as any).userId);

    if (role !== "platform_owner") return fail("Only platform owners can create company admins");
    if (!data.username || !data.password || !data.company_id) {
      return fail("Username, password and company_id are required");
    }

    const internalEmail = `${data.username.toLowerCase().replace(/[^a-z0-9_-]/g, "")}@coinly.internal`;

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: internalEmail,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        username: data.username,
        is_company_admin: true,
        company_id: data.company_id,
      },
    });

    if (createError) return fail(createError.message);
    if (!created?.user) return fail("User creation failed");

    await admin.from("user_roles").update({ role: "company_admin" }).eq("user_id", created.user.id);
    await admin.from("profiles").update({ company_id: data.company_id }).eq("id", created.user.id);
    await admin
      .from("companies")
      .update({ admin_user_id: created.user.id, admin_username: data.username })
      .eq("id", data.company_id);

    return { data: { id: created.user.id, email: created.user.email }, error: null };
  });

export const resetAdminPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; new_password: string }) => d)
  .handler(async ({ data, context }): Promise<Result<{ success: true }>> => {
    const admin = await getAdmin();
    const role = await getRole(admin, (context as any).userId);

    const isPlatformOwner = role === "platform_owner";
    const isCompanyAdmin = role === "company_admin";

    if (!isPlatformOwner && !isCompanyAdmin) {
      return fail("Only platform owners and company admins can reset passwords");
    }

    const newPassword = typeof data.new_password === "string" ? data.new_password.trim() : "";
    if (!data.user_id || !newPassword) return fail("user_id and new_password are required");

    if (isCompanyAdmin) {
      const adminCompany = await getCompanyId(admin, (context as any).userId);
      const targetCompany = await getCompanyId(admin, data.user_id);

      if (!adminCompany || !targetCompany || adminCompany !== targetCompany) {
        return fail("You can only reset passwords for agents in your company");
      }
      if ((await getRole(admin, data.user_id)) !== "admin") {
        return fail("You can only reset passwords for agents");
      }
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(data.user_id, {
      password: newPassword,
    });
    if (updateError) return fail(updateError.message || "Failed to reset password");

    return { data: { success: true }, error: null };
  });

export const resetClientPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; new_password: string }) => d)
  .handler(async ({ data, context }): Promise<Result<{ success: true }>> => {
    const { supabase, userId } = context as any;
    const { data: callerRoles, error: roleError } = await supabase
      .from("user_roles").select("role").eq("user_id", userId);
    if (roleError) return fail("Unable to verify administrator access");
    const role = ["platform_owner", "super_admin", "company_admin"].find(
      (value) => callerRoles?.some((row) => row.role === value),
    );
    if (!role) return fail("Only administrators can reset client passwords");
    if (typeof data.user_id !== "string" || !data.user_id) return fail("Client is required");
    if (typeof data.new_password !== "string" || data.new_password.length < 8) {
      return fail("Use a password with at least 8 characters");
    }

    const [caller, target, targetRoles] = await Promise.all([
      supabase.from("profiles").select("company_id").eq("id", userId).single(),
      supabase.from("profiles").select("company_id").eq("id", data.user_id).single(),
      supabase.from("user_roles").select("role").eq("user_id", data.user_id),
    ]);
    if (caller.error || target.error || targetRoles.error || !canResetClientPassword(
      role, caller.data?.company_id ?? null, target.data?.company_id ?? null,
      (targetRoles.data ?? []).map((row) => row.role),
    )) return fail("You can only reset passwords for clients you manage");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      password: data.new_password,
    });
    if (error) return fail(error.message || "Failed to reset password");
    return { data: { success: true }, error: null };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string }) => d)
  .handler(async ({ data, context }): Promise<Result<{ success: true }>> => {
    const admin = await getAdmin();
    const role = await getRole(admin, (context as any).userId);

    if (!role || !["super_admin", "platform_owner", "company_admin"].includes(role)) {
      return fail("Not authorized");
    }
    if (!data.user_id) return fail("user_id required");

    if (role === "company_admin") {
      const adminCompany = await getCompanyId(admin, (context as any).userId);
      const targetCompany = await getCompanyId(admin, data.user_id);
      if (!adminCompany || adminCompany !== targetCompany) {
        return fail("You can only delete users in your company");
      }
    }

    // Remove application data first (no FK cascade from auth.users)
    const { data: tickets } = await admin
      .from("support_tickets")
      .select("id")
      .eq("user_id", data.user_id);
    const ticketIds = (tickets ?? []).map((t: any) => t.id);
    if (ticketIds.length) {
      await admin.from("support_messages").delete().in("ticket_id", ticketIds);
    }
    await admin.from("support_messages").delete().eq("sender_id", data.user_id);
    await admin.from("support_tickets").delete().eq("user_id", data.user_id);

    for (const table of [
      "transactions",
      "required_actions",
      "wallet_addresses",
      "bank_accounts",
      "client_deposit_info",
      "activity_logs",
    ]) {
      await admin.from(table as any).delete().eq("user_id", data.user_id);
    }
    await admin.from("agent_permissions").delete().eq("agent_id", data.user_id);
    await admin.from("profiles").update({ agent_id: null }).eq("agent_id", data.user_id);
    await admin.from("user_roles").delete().eq("user_id", data.user_id);

    const { error: profileError } = await admin.from("profiles").delete().eq("id", data.user_id);
    if (profileError) return fail(profileError.message);

    const { error } = await admin.auth.admin.deleteUser(data.user_id);
    if (error && !/not found/i.test(error.message)) return fail(error.message);

    return { data: { success: true }, error: null };
  });
