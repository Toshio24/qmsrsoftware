"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/server/db";
import { hashPassword } from "@/lib/auth/password";
import { requireRole } from "@/lib/auth/session";
import { createUserSchema } from "@/lib/validation/user";
import { UserRole, AuditAction } from "@/generated/prisma/enums";
import { writeAuditLog } from "@/lib/server/audit";

export type CreateUserState = { error?: string; success?: boolean };

export async function createUserAction(
  _prevState: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  const admin = await requireRole([UserRole.ADMIN]);

  const parsed = createUserSchema.safeParse({
    username: formData.get("username"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    role: formData.get("role"),
    temporaryPassword: formData.get("temporaryPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await db.user.findFirst({
    where: {
      OR: [{ username: parsed.data.username }, { email: parsed.data.email }],
    },
  });
  if (existing) return { error: "Username or email already in use." };

  const passwordHash = await hashPassword(parsed.data.temporaryPassword);
  await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        username: parsed.data.username,
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        role: parsed.data.role,
        passwordHash,
        forcePasswordReset: true,
      },
    });
    await writeAuditLog(tx, {
      entityType: "User",
      entityId: created.id,
      action: AuditAction.CREATE,
      actor: admin,
      afterState: { username: created.username, role: created.role },
    });
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function toggleUserActiveAction(formData: FormData) {
  const admin = await requireRole([UserRole.ADMIN]);
  const userId = formData.get("userId") as string;

  await db.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    await tx.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });
    await writeAuditLog(tx, {
      entityType: "User",
      entityId: userId,
      action: AuditAction.UPDATE,
      actor: admin,
      beforeState: { isActive: user.isActive },
      afterState: { isActive: !user.isActive },
    });
  });

  revalidatePath("/admin/users");
}

export async function updateUserRoleAction(formData: FormData) {
  const admin = await requireRole([UserRole.ADMIN]);
  const userId = formData.get("userId") as string;
  const role = formData.get("role") as string;
  if (!Object.values(UserRole).includes(role as UserRole)) return;

  await db.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    await tx.user.update({ where: { id: userId }, data: { role: role as UserRole } });
    await writeAuditLog(tx, {
      entityType: "User",
      entityId: userId,
      action: AuditAction.USER_ROLE_CHANGE,
      actor: admin,
      beforeState: { role: user.role },
      afterState: { role },
    });
  });

  revalidatePath("/admin/users");
}

export async function forcePasswordResetAction(formData: FormData) {
  const admin = await requireRole([UserRole.ADMIN]);
  const userId = formData.get("userId") as string;

  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { forcePasswordReset: true } });
    await writeAuditLog(tx, {
      entityType: "User",
      entityId: userId,
      action: AuditAction.UPDATE,
      actor: admin,
      afterState: { forcePasswordReset: true },
      reasonForChange: "Admin forced password reset",
    });
  });

  revalidatePath("/admin/users");
}

export type DeleteUserState = { error?: string };

export async function deleteUserAction(
  _prevState: DeleteUserState,
  formData: FormData
): Promise<DeleteUserState> {
  const admin = await requireRole([UserRole.ADMIN]);
  const userId = formData.get("userId") as string;

  if (userId === admin.id) {
    return { error: "You can't delete your own account." };
  }

  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.isActive) {
    return { error: "Deactivate this user before deleting them." };
  }

  try {
    await db.$transaction(async (tx) => {
      await writeAuditLog(tx, {
        entityType: "User",
        entityId: userId,
        action: AuditAction.DELETE,
        actor: admin,
        beforeState: { username: user.username, role: user.role },
        reasonForChange: "Admin deleted deactivated user",
      });
      await tx.session.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });
  } catch (err) {
    const code = (err as { code?: string } | null)?.code;
    if (code === "P2003") {
      return {
        error:
          "This user has trace items, signatures, links, or other activity on record and can't be permanently deleted — that history has to stay traceable. Leave them deactivated instead.",
      };
    }
    throw err;
  }

  revalidatePath("/admin/users");
  return {};
}

export async function unlockAccountAction(formData: FormData) {
  const admin = await requireRole([UserRole.ADMIN]);
  const userId = formData.get("userId") as string;

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { lockedUntil: null, failedLoginCount: 0 },
    });
    await writeAuditLog(tx, {
      entityType: "User",
      entityId: userId,
      action: AuditAction.UPDATE,
      actor: admin,
      afterState: { lockedUntil: null, failedLoginCount: 0 },
      reasonForChange: "Admin unlocked account",
    });
  });

  revalidatePath("/admin/users");
}
