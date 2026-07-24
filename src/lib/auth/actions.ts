"use server";

import { redirect } from "next/navigation";
import { destroySession, getSession } from "./session";
import { writeAuditLog } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { AuditAction } from "@/generated/prisma/enums";

export async function logoutAction() {
  const user = await getSession();
  if (user) {
    await writeAuditLog(db, {
      entityType: "User",
      entityId: user.id,
      action: AuditAction.LOGOUT,
      actor: user,
    });
  }
  await destroySession();
  redirect("/login");
}
