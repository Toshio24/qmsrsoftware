import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/server/db";
import { UserRole } from "@/generated/prisma/enums";
import {
  SESSION_ABSOLUTE_HOURS,
  SESSION_COOKIE_NAME,
  SESSION_IDLE_TIMEOUT_MINUTES,
} from "./constants";

export type SessionUser = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  forcePasswordReset: boolean;
};

async function findValidSession(sessionId: string) {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });
  if (!session) return null;

  const now = new Date();
  const idleDeadline = new Date(
    session.lastActivityAt.getTime() + SESSION_IDLE_TIMEOUT_MINUTES * 60_000
  );
  const expired = now > session.expiresAt || now > idleDeadline;
  if (expired || !session.user.isActive) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  await db.session.update({
    where: { id: session.id },
    data: { lastActivityAt: now },
  });

  return session;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const session = await findValidSession(sessionId);
  if (!session) return null;

  const { user } = session;
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    forcePasswordReset: user.forcePasswordReset,
  };
}

export async function createSession(userId: string, ipAddress?: string) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_HOURS * 60 * 60_000);

  const session = await db.session.create({
    data: { userId, expiresAt, ipAddress, lastActivityAt: now },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (sessionId) {
    await db.session.delete({ where: { id: sessionId } }).catch(() => {});
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/** Redirects to /login if there is no valid session. Use in Server Components/Actions. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

/** Redirects to /dashboard if the current user's role isn't in `roles`. */
export async function requireRole(roles: UserRole[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}
