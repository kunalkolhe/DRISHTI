"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/app/actions/auth";
import { saveUpload } from "@/lib/upload";
import { revalidatePath } from "next/cache";

export type ProfileResult = { ok: true } | { ok: false; error: string };

/** Update the signed-in worker's ID-card photo and/or department. */
export async function updateWorkerProfile(formData: FormData): Promise<ProfileResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in." };

  const department = ((formData.get("department") as string) || "").trim();
  const photo = formData.get("photo") as File | null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (department) data.department = department;

  if (photo && photo.size > 0) {
    if (!photo.type.startsWith("image/")) return { ok: false, error: "Upload an image file." };
    if (photo.size > 5 * 1024 * 1024) return { ok: false, error: "Photo must be under 5 MB." };
    data.photoUrl = await saveUpload(photo, "dp");
  }

  if (Object.keys(data).length === 0) return { ok: false, error: "Nothing to update." };

  try {
    await prisma.user.update({ where: { id: session.id }, data });
    revalidatePath("/worker");
    return { ok: true };
  } catch (e) {
    console.error("updateWorkerProfile failed:", e);
    return { ok: false, error: "Could not save your profile." };
  }
}
