"use client";

import { UserRole } from "@/generated/prisma/enums";
import { updateUserRoleAction } from "./actions";

export function RoleSelectForm({
  userId,
  currentRole,
  disabled,
}: {
  userId: string;
  currentRole: UserRole;
  disabled?: boolean;
}) {
  return (
    <form action={updateUserRoleAction}>
      <input type="hidden" name="userId" value={userId} />
      <select
        name="role"
        defaultValue={currentRole}
        disabled={disabled}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
      >
        {Object.values(UserRole).map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
    </form>
  );
}
