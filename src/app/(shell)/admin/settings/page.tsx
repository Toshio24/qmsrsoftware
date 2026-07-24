import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/generated/prisma/enums";
import { PlaceholderPage } from "@/components/placeholder-page";
import {
  LOGIN_LOCKOUT_MINUTES,
  LOGIN_LOCKOUT_THRESHOLD,
  SESSION_ABSOLUTE_HOURS,
  SESSION_IDLE_TIMEOUT_MINUTES,
} from "@/lib/auth/constants";

export default async function AdminSettingsPage() {
  await requireRole([UserRole.ADMIN]);

  return (
    <div className="flex flex-col gap-6">
      <PlaceholderPage
        title="Settings"
        phase="a later hardening phase"
        description="Making these configurable in-app (rather than fixed constants) is deferred. Current values, set in lib/auth/constants.ts:"
      />
      <ul className="max-w-md list-disc pl-5 text-sm text-neutral-600 dark:text-neutral-400">
        <li>Session absolute lifetime: {SESSION_ABSOLUTE_HOURS} hours</li>
        <li>Session idle timeout: {SESSION_IDLE_TIMEOUT_MINUTES} minutes</li>
        <li>
          Account lockout: {LOGIN_LOCKOUT_THRESHOLD} failed attempts locks for{" "}
          {LOGIN_LOCKOUT_MINUTES} minutes
        </li>
      </ul>
    </div>
  );
}
