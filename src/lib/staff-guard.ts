import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { isAdmin, isStaff, toUserRole, type UserRole } from "@/lib/permissions";
import { resolveActor } from "@/lib/session-actor";

export type StaffActor = { id: string; role: UserRole };

export async function requireSessionUser(): Promise<
  { ok: true; userId: string } | { ok: false; response: NextResponse }
> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, userId: session.user.id };
}

export async function requireStaffActor(): Promise<
  { ok: true; actor: StaffActor } | { ok: false; response: NextResponse }
> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  const actor = await resolveActor(session.user);
  if (!isStaff(actor.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, actor: { id: actor.id, role: toUserRole(actor.role) } };
}

export async function requireAdminActor(): Promise<
  { ok: true; actor: StaffActor } | { ok: false; response: NextResponse }
> {
  const staff = await requireStaffActor();
  if (!staff.ok) return staff;
  if (!isAdmin(staff.actor.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return staff;
}
