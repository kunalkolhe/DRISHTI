"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/app/actions/auth";
import { saveUpload, UploadError } from "@/lib/upload";
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
    try {
      data.photoUrl = await saveUpload(photo, "image");
    } catch (e) {
      return { ok: false, error: e instanceof UploadError ? e.message : "Could not save the photo." };
    }
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
