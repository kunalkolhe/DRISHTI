"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession } from "@/app/actions/auth";

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

  revalidatePath("/worker");
}
