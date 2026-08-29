"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const mobileNumber = formData.get("mobileNumber") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as any || "CITIZEN";

  if (!name || !mobileNumber || !password) {
    return { success: false, error: "Missing required fields." };
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

    // Create the user
    await prisma.user.create({
      data: {
        name,
        email: email || null,
        mobileNumber,
        passwordHash,
        role: role
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "Internal server error during registration." };
  }
}

export async function loginUser(formData: FormData) {
  const identifier = formData.get("identifier") as string; // email or mobile
  const password = formData.get("password") as string;

  if (!identifier || !password) {
    return { success: false, error: "Missing credentials." };
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

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("session_user_id", user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return { success: true, user: { id: user.id, name: user.name, role: user.role } };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Internal server error during login." };
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("session_user_id");
  redirect("/login");
}

export async function getSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_user_id")?.value;

  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { id: true, name: true, email: true, role: true }
    });
    return user;
  } catch (error) {
    return null;
  }
}
