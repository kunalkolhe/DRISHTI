"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";

const COOKIE = "worker_area";
const ONE_YEAR = 60 * 60 * 24 * 365;

/** The area a field worker is allocated to — matched against complaint addresses. */
export async function getWorkerArea(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE)?.value?.trim() || null;
}

export async function setWorkerArea(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "FIELD_WORKER") return;

  const area = ((formData.get("area") as string) || "").trim();
  const store = await cookies();

  if (area) {
    store.set(COOKIE, area, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: ONE_YEAR,
    });
  } else {
    store.delete(COOKIE);
  }

  // Mirror onto the User row too — the cookie is per-browser, but "new
  // complaint in your area" notifications are created from a server action
  // with no access to this worker's cookie jar, so they need it in the DB.
  try {
    await prisma.user.update({ where: { id: session.id }, data: { area: area || null } });
  } catch (e) {
    console.error("Failed to persist worker area:", e);
  }

  revalidatePath("/worker");
}
