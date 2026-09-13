"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, verifySessionToken } from "@/lib/session";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit";

const SESSION_COOKIE = "session";
const WEEK_SECONDS = 60 * 60 * 24 * 7;

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const mobileNumber = formData.get("mobileNumber") as string;
  const password = formData.get("password") as string;

  if (!name || !mobileNumber || !password) {
    return { success: false, error: "Missing required fields." };
  }
  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { mobileNumber },
          { email: email || undefined }
        ]
      }
    });

    if (existingUser) {
      return { success: false, error: "An account with this mobile number or email already exists." };
    }

    // Hash the password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Self-service signup is CITIZEN-only, full stop. It used to accept a
    // client-supplied `role` field — including "ADMIN" — so anyone could
    // register themselves as an administrator. Field-worker and admin
    // accounts must be provisioned separately (seed script or an
    // authenticated admin action), never chosen by the person signing up.
    await prisma.user.create({
      data: {
        name,
        email: email || null,
        mobileNumber,
        passwordHash,
        role: "CITIZEN",
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "Internal server error during registration." };
  }
}

export async function loginUser(formData: FormData) {
  const identifier = ((formData.get("identifier") as string) || "").trim(); // email or mobile
  const password = formData.get("password") as string;

  if (!identifier || !password) {
    return { success: false, error: "Missing credentials." };
  }

  // Throttle by the identifier being attempted, not by IP (this app has no
  // IP available at the server-action layer) — 5 tries per 10 minutes.
  const rlKey = `login:${identifier.toLowerCase()}`;
  const rl = checkRateLimit(rlKey, 5, 10 * 60 * 1000);
  if (!rl.allowed) {
    const mins = Math.ceil(rl.retryAfterMs / 60000);
    return { success: false, error: `Too many attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` };
  }

  try {
    // Find user by email OR mobile number
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { mobileNumber: identifier },
          { email: identifier }
        ]
      }
    });

    if (!user) {
      return { success: false, error: "Invalid credentials." };
    }

    // Compare passwords
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return { success: false, error: "Invalid credentials." };
    }

    resetRateLimit(rlKey);

    // Signed, expiring session token — see src/lib/session.ts for why this
    // replaced storing the raw user id in the cookie.
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, createSessionToken(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: WEEK_SECONDS,
      path: "/",
    });
    // Clean up the old unsigned cookie name if it's still hanging around
    // from before this change.
    cookieStore.delete("session_user_id");

    return { success: true, user: { id: user.id, name: user.name, role: user.role } };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Internal server error during login." };
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete("session_user_id");
  redirect("/login");
}

export async function getSession() {
  const cookieStore = await cookies();
  const userId = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  if (userId == null) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    });
    return user;
  } catch {
    return null;
  }
}
