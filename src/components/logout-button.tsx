import { logoutAction } from "@/lib/auth/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="text-sm text-neutral-500 underline-offset-2 hover:underline"
      >
        Log out
      </button>
    </form>
  );
}
