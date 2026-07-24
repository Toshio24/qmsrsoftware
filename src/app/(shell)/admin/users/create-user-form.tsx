"use client";

import { useActionState } from "react";
import { createUserAction, type CreateUserState } from "./actions";
import { UserRole } from "@/generated/prisma/enums";

const initialState: CreateUserState = {};

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUserAction, initialState);

  return (
    <form
      action={formAction}
      key={state.success ? "reset" : "form"}
      className="grid max-w-3xl grid-cols-1 gap-3 rounded-lg border border-neutral-200 p-4 sm:grid-cols-2 dark:border-neutral-800"
    >
      <div>
        <label htmlFor="username" className="text-sm font-medium">
          Username
        </label>
        <input
          id="username"
          name="username"
          required
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>
      <div>
        <label htmlFor="fullName" className="text-sm font-medium">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          required
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>
      <div>
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>
      <div>
        <label htmlFor="role" className="text-sm font-medium">
          Role
        </label>
        <select
          id="role"
          name="role"
          required
          defaultValue={UserRole.AUTHOR}
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          {Object.values(UserRole).map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="temporaryPassword" className="text-sm font-medium">
          Temporary password
        </label>
        <input
          id="temporaryPassword"
          name="temporaryPassword"
          type="text"
          required
          minLength={10}
          placeholder="Share this with the user out of band"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <p className="mt-1 text-xs text-neutral-500">
          The user will be forced to change this on first login.
        </p>
      </div>

      {state.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-green-600 sm:col-span-2">User created.</p>
      )}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {pending ? "Creating…" : "Create user"}
        </button>
      </div>
    </form>
  );
}
