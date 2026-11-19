import { describe, expect, test } from "bun:test";
import { canResetClientPassword } from "./client-password-policy";

describe("client password reset permissions", () => {
  test("company admins can reset their company's clients", () => {
    expect(canResetClientPassword("company_admin", "coinly", "coinly", ["client"])).toBe(true);
  });
  test("company admins cannot reset another company's clients", () => {
    expect(canResetClientPassword("company_admin", "coinly", "other", ["client"])).toBe(false);
  });
  test("agents cannot reset clients", () => {
    expect(canResetClientPassword("admin", "coinly", "coinly", ["client"])).toBe(false);
  });
  test("clients cannot reset other clients", () => {
    expect(canResetClientPassword("client", "coinly", "coinly", ["client"])).toBe(false);
  });
  test("platform administrators can reset clients", () => {
    for (const role of ["super_admin", "platform_owner"]) {
      expect(canResetClientPassword(role, null, "coinly", ["client"])).toBe(true);
    }
  });
  test("the client reset cannot reset privileged accounts", () => {
    expect(canResetClientPassword("platform_owner", null, "coinly", ["client", "company_admin"])).toBe(false);
    expect(canResetClientPassword("company_admin", "coinly", "coinly", ["admin"])).toBe(false);
  });
  test("missing roles or company membership deny access", () => {
    expect(canResetClientPassword(null, "coinly", "coinly", ["client"])).toBe(false);
    expect(canResetClientPassword("company_admin", null, null, ["client"])).toBe(false);
    expect(canResetClientPassword("platform_owner", null, null, [])).toBe(false);
  });
});