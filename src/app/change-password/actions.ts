"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/server/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { requireUser } from "@/lib/auth/session";
import { changePasswordSchema } from "@/lib/validation/auth";
import { writeAuditLog } from "@/lib/server/audit";
import { AuditAction } from "@/generated/prisma/enums";

export type ChangePasswordState = { error?: string };

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const sessionUser = await requireUser();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmNewPassword: formData.get("confirmNewPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await db.user.findUniqueOrThrow({ where: { id: sessionUser.id } });
  const valid = await verifyPassword(user.passwordHash, parsed.data.currentPassword);
  if (!valid) return { error: "Current password is incorrect." };

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash, forcePasswordReset: false },
    });
    await writeAuditLog(tx, {
      entityType: "User",
      entityId: user.id,
      action: AuditAction.PASSWORD_CHANGE,
      actor: sessionUser,
    });
  });

  redirect("/dashboard");
}
