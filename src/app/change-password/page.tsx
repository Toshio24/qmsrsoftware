import { requireUser } from "@/lib/auth/session";
import { ChangePasswordForm } from "./change-password-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function ChangePasswordPage() {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
        <h1 className="text-lg font-semibold">Change password</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {user.forcePasswordReset
            ? "A password change is required before you can continue."
            : `Signed in as ${user.username}.`}
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
