export function canResetClientPassword(
  role: string | null,
  callerCompany: string | null,
  targetCompany: string | null,
  targetRoles: string[],
): boolean {
  if (!targetRoles.includes("client") || targetRoles.some((value) => value !== "client")) return false;
  if (role === "platform_owner" || role === "super_admin") return true;
  return role === "company_admin" && Boolean(callerCompany) && callerCompany === targetCompany;
}