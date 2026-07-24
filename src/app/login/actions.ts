"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/server/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/auth";
import { LOGIN_LOCKOUT_MINUTES, LOGIN_LOCKOUT_THRESHOLD } from "@/lib/auth/constants";
import { writeAuditLog } from "@/lib/server/audit";
import { AuditAction } from "@/generated/prisma/enums";

export type LoginState = { error?: string };

const GENERIC_ERROR = "Invalid username or password.";

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { username, password } = parsed.data;

  const user = await db.user.findUnique({ where: { username } });
  if (!user || !user.isActive) {
    await writeAuditLog(db, {
      entityType: "User",
      entityId: user?.id ?? "unknown",
      action: AuditAction.LOGIN_FAILED,
      actor: null,
      actorUsernameOverride: username,
      reasonForChange: user ? "Account inactive" : "Unknown username",
    });
    return { error: GENERIC_ERROR };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await writeAuditLog(db, {
      entityType: "User",
      entityId: user.id,
      action: AuditAction.LOGIN_FAILED,
      actor: user,
      reasonForChange: "Account locked",
    });
    return {
      error: `Account locked until ${user.lockedUntil.toLocaleTimeString()}. Contact an admin to unlock sooner.`,
    };
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    const failedLoginCount = user.failedLoginCount + 1;
    const lockedUntil =
      failedLoginCount >= LOGIN_LOCKOUT_THRESHOLD
        ? new Date(Date.now() + LOGIN_LOCKOUT_MINUTES * 60_000)
        : null;
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { failedLoginCount, lockedUntil },
      });
      await writeAuditLog(tx, {
        entityType: "User",
        entityId: user.id,
        action: AuditAction.LOGIN_FAILED,
        actor: user,
        reasonForChange: lockedUntil ? "Wrong password — account now locked" : "Wrong password",
      });
    });
    return { error: GENERIC_ERROR };
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
    await writeAuditLog(tx, {
      entityType: "User",
      entityId: user.id,
      action: AuditAction.LOGIN,
      actor: user,
    });
  });

  await createSession(user.id);

  redirect(user.forcePasswordReset ? "/change-password" : "/dashboard");
}
