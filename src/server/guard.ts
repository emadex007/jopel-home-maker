// Session check for server functions outside admin-api.ts (quotations, chat).
import { getCookie } from "@tanstack/react-start/server";
import { SESSION_COOKIE, getStaffByToken, type StaffUser } from "~/server/auth";

export async function requireStaff(): Promise<StaffUser> {
  const user = await getStaffByToken(getCookie(SESSION_COOKIE));
  if (!user) throw new Error("Your session has expired. Please log in again.");
  return user;
}
