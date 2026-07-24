"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";
import { ThemeToggle } from "@/components/theme-toggle";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>
      <form
        action={formAction}
        className="w-full max-w-sm rounded-lg border border-neutral-200 p-6 dark:border-neutral-800"
      >
        <h1 className="text-lg font-semibold">QMS Trace Matrix</h1>
        <p className="mt-1 text-sm text-neutral-500">Sign in to continue.</p>

        <div className="mt-4 flex flex-col gap-3">
          <div>
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              required
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
