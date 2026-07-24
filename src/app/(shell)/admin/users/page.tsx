import { db } from "@/lib/server/db";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/generated/prisma/enums";
import { CreateUserForm } from "./create-user-form";
import { RoleSelectForm } from "./role-select-form";
import {
  forcePasswordResetAction,
  toggleUserActiveAction,
  unlockAccountAction,
} from "./actions";

export default async function AdminUsersPage() {
  const currentUser = await requireRole([UserRole.ADMIN]);

  const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Create accounts, assign roles, force password resets, and unlock accounts
          after too many failed logins.
        </p>
      </div>

      <CreateUserForm />

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
            <tr>
              <th className="px-3 py-2">Username</th>
              <th className="px-3 py-2">Full name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isLocked = !!user.lockedUntil && user.lockedUntil > new Date();
              return (
                <tr
                  key={user.id}
                  className="border-b border-neutral-100 last:border-0 dark:border-neutral-900"
                >
                  <td className="px-3 py-2 font-medium">{user.username}</td>
                  <td className="px-3 py-2">{user.fullName}</td>
                  <td className="px-3 py-2 text-neutral-500">{user.email}</td>
                  <td className="px-3 py-2">
                    <RoleSelectForm
                      userId={user.id}
                      currentRole={user.role}
                      disabled={user.id === currentUser.id}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={
                          user.isActive
                            ? "text-xs text-green-600"
                            : "text-xs text-neutral-400"
                        }
                      >
                        {user.isActive ? "Active" : "Deactivated"}
                      </span>
                      {isLocked && (
                        <span className="text-xs text-red-600">Locked</span>
                      )}
                      {user.forcePasswordReset && (
                        <span className="text-xs text-amber-600">
                          Password reset pending
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <form action={toggleUserActiveAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <button
                          type="submit"
                          disabled={user.id === currentUser.id}
                          className="text-xs text-neutral-600 underline-offset-2 hover:underline disabled:opacity-40 dark:text-neutral-400"
                        >
                          {user.isActive ? "Deactivate" : "Reactivate"}
                        </button>
                      </form>
                      <form action={forcePasswordResetAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <button
                          type="submit"
                          className="text-xs text-neutral-600 underline-offset-2 hover:underline dark:text-neutral-400"
                        >
                          Force reset
                        </button>
                      </form>
                      {isLocked && (
                        <form action={unlockAccountAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <button
                            type="submit"
                            className="text-xs text-neutral-600 underline-offset-2 hover:underline dark:text-neutral-400"
                          >
                            Unlock
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
