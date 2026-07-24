"use client";

import { useActionState } from "react";
import { deleteUserAction, type DeleteUserState } from "./actions";

const initialState: DeleteUserState = {};

export function DeleteUserForm({ userId, username }: { userId: string; username: string }) {
  const [state, formAction, pending] = useActionState(deleteUserAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`Permanently delete ${username}? This can't be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-red-600 underline-offset-2 hover:underline disabled:opacity-40"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {state.error && <p className="mt-1 max-w-xs text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
