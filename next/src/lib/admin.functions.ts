type Result<T> = { data: T | null; error: { message: string } | null };

async function callAdmin<T>(action: string, data: Record<string, unknown>): Promise<Result<T>> {
  const response = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action, data }),
  });
  return response.json();
}

function payload(input: { data?: Record<string, unknown> } | Record<string, unknown>) {
  if (input && typeof input === "object" && "data" in input && input.data) return input.data as Record<string, unknown>;
  return input as Record<string, unknown>;
}

export async function createAgent(input: { data: Record<string, unknown> }) {
  return callAdmin<{ id: string; email: string | undefined }>("createAgent", payload(input));
}

export async function createCompanyAdmin(input: { data: Record<string, unknown> }) {
  return callAdmin<{ id: string; email: string | undefined }>("createCompanyAdmin", payload(input));
}

export async function resetAdminPassword(input: { data: { user_id: string; new_password: string } }) {
  return callAdmin<{ success: true }>("resetAdminPassword", payload(input));
}

export async function resetClientPassword(input: { data: { user_id: string; new_password: string } }) {
  return callAdmin<{ success: true }>("resetClientPassword", payload(input));
}

export async function deleteUser(input: { data: { user_id: string } }) {
  return callAdmin<{ success: true }>("deleteUser", payload(input));
}
