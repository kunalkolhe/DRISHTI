"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/app/actions/auth";
import { getDepartmentContact } from "@/lib/departments";
import { extractAssetCode } from "@/lib/qr";
import { notify, notifyWorkersInArea } from "@/lib/notify";
import { saveUpload, saveUploadOrNull, UploadError } from "@/lib/upload";
import { analyzePhoto } from "@/lib/photoAuth";
import { findDuplicateOf } from "@/lib/duplicates";
import { revalidatePath } from "next/cache";

export async function createComplaint(formData: FormData) {
  const rawQr = formData.get("qrCodeId") as string;
  const qrCodeId = rawQr ? extractAssetCode(rawQr) : rawQr;
  const severity = formData.get("severity") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string | null;
  const address = formData.get("address") as string;
  const gpsLat = formData.get("gpsLat") as string;
  const gpsLon = formData.get("gpsLon") as string;
  
  const photoFile = formData.get("photo") as File | null;
  const voiceFile = formData.get("voice") as File | null;
  
  try {
    let asset = null;
    
    // 1. Find the asset by its QR Code (if provided)
    if (qrCodeId) {
      asset = await prisma.asset.findUnique({
        where: { qrCodeId }
      });

      if (!asset) {
        return { success: false, error: "Invalid QR Code. Asset not found." };
      }
    }

    // 2. Ensure user is logged in
    const session = await getSession();
    if (!session) {
      return { success: false, error: "You must be logged in to report an issue. Please login from the menu." };
    }

    const citizen = await prisma.user.findUnique({
      where: { id: session.id },
      select: { name: true, email: true, mobileNumber: true },
    });

    // 3. Save files securely
    let photoUrl: string | null;
    let voiceNoteUrl: string | null;
    try {
      photoUrl = await saveUploadOrNull(photoFile, "image");
      voiceNoteUrl = await saveUploadOrNull(voiceFile, "audio");
    } catch (e) {
      return { success: false, error: e instanceof UploadError ? e.message : "Could not save the upload." };
    }

    if (!photoUrl && !voiceNoteUrl) {
      return { success: false, error: "You must provide either a photo or a voice note." };
    }

    // 3b. Advisory EXIF check — does the photo's own GPS/timestamp back up
    // where and when the citizen says they captured it? Never blocks
    // submission; a missing/failed check just means nothing was flagged.
    let reportPhotoFlags: string[] = [];
    if (photoFile && photoFile.size > 0) {
      try {
        const buf = Buffer.from(await photoFile.arrayBuffer());
        reportPhotoFlags = (
          await analyzePhoto(buf, {
            lat: gpsLat ? parseFloat(gpsLat) : null,
            lon: gpsLon ? parseFloat(gpsLon) : null,
          })
        ).flags;
      } catch (e) {
        console.error("analyzePhoto (report) failed, non-fatal:", e);
      }
    }

    // 4. Create the complaint
    // The schema has no dedicated category column yet, so keep the citizen's
    // chosen category on the record by tagging the description.
    const categoryLabel = category ? getDepartmentContact(category).label : null;
    const finalDescription =
      [categoryLabel ? `(${categoryLabel})` : null, description?.trim() || null]
        .filter(Boolean)
        .join(" ") || null;

    // 4b. Is someone else already tracking this exact problem?
    const dupParsedLat = gpsLat ? parseFloat(gpsLat) : null;
    const dupParsedLon = gpsLon ? parseFloat(gpsLon) : null;
    let duplicateOf = null;
    try {
      duplicateOf = await findDuplicateOf({
        assetId: asset?.id ?? null,
        gpsLat: dupParsedLat,
        gpsLon: dupParsedLon,
        categoryLabel,
      });
    } catch (e) {
      console.error("findDuplicateOf failed, non-fatal:", e);
    }

    const complaint = await prisma.complaint.create({
      data: {
        assetId: asset ? asset.id : null,
        citizenId: session.id,
        severity: severity || "MEDIUM",
        description: finalDescription,
        address: address || null,
        gpsLat: dupParsedLat,
        gpsLon: dupParsedLon,
        originalPhotoUrl: photoUrl || "", // Schema requires this, we can relax it in future or default it
        voiceNoteUrl: voiceNoteUrl,
        reportPhotoFlags,
        duplicateOfId: duplicateOf?.id ?? null,
        status: "OPEN"
      }
    });

    if (duplicateOf) {
      // Someone's already on it — don't send the field team a second alert
      // for the same real-world problem, just tell this citizen they're
      // now tracking the existing report too.
      await notify(
        session.id,
        "COMPLAINT_LINKED_DUPLICATE",
        "Linked to an existing report",
        "This looks like the same issue someone already reported and it's being tracked. You'll get the same updates, and the team won't be asked to fix it twice.",
        { link: "/my-reports", complaintId: complaint.id },
      );
    } else {
      // Alert every field worker allocated to this address's area.
      await notifyWorkersInArea(
        address,
        "NEW_COMPLAINT_IN_AREA",
        "New complaint in your area",
        `${categoryLabel || "An issue"} reported${address ? ` at ${address}` : ""}.`,
        { link: "/worker", complaintId: complaint.id },
      );
    }

    // Revalidate paths
    revalidatePath("/admin/dashboard");
    revalidatePath("/report");

    return { success: true, complaint, citizen };
  } catch (error) {
    console.error("Failed to submit complaint:", error);
    return { success: false, error: "Server error while submitting complaint." };
  }
}

export async function resolveComplaint(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'FIELD_WORKER') {
    return { success: false, error: "Unauthorized. Only Field Workers can resolve issues." };
  }

  const complaintId = parseInt(formData.get("complaintId") as string);
  const photo = formData.get("photo") as File;
  const notes = formData.get("notes") as string;

  if (!complaintId || !photo || photo.size === 0) {
    return { success: false, error: "Missing repair photo or complaint ID." };
  }

  try {
    const existing = await prisma.complaint.findUnique({
      where: { id: complaintId },
      select: { gpsLat: true, gpsLon: true, duplicates: { select: { id: true, citizenId: true } } },
    });

    // Advisory EXIF check — does the repair photo's own GPS/timestamp back
    // up "I was actually at the site, just now"? Never blocks the resolve.
    let repairPhotoFlags: string[] = [];
    try {
      const buf = Buffer.from(await photo.arrayBuffer());
      repairPhotoFlags = (
        await analyzePhoto(buf, { lat: existing?.gpsLat, lon: existing?.gpsLon })
      ).flags;
    } catch (e) {
      console.error("analyzePhoto (repair) failed, non-fatal:", e);
    }

    const publicUrl = (await saveUpload(photo, "image")).replace(/^\//, "");

    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: "FIXED_PENDING_CONFIRMATION",
        repairPhotoUrl: publicUrl,
        repairPhotoFlags,
        workerNotes: notes,
        resolvedAt: new Date(),
        resolvedByWorkerId: session.id,
      }
    });

    await notify(
      updated.citizenId,
      "COMPLAINT_RESOLVED",
      "Your complaint has been fixed",
      "A field worker uploaded proof of the repair — please confirm it's actually fixed.",
      { link: "/my-reports", complaintId: updated.id },
    );

    // Fixing the primary fixes it for everyone who reported the same thing —
    // carry the same proof over to every linked duplicate and let each of
    // those citizens confirm/reject it independently, same as the original.
    if (existing?.duplicates?.length) {
      const duplicateIds = existing.duplicates.map((d) => d.id);
      await prisma.complaint.updateMany({
        where: { id: { in: duplicateIds } },
        data: {
          status: "FIXED_PENDING_CONFIRMATION",
          repairPhotoUrl: publicUrl,
          repairPhotoFlags,
          workerNotes: notes,
          resolvedAt: new Date(),
          resolvedByWorkerId: session.id,
        },
      });
      for (const dup of existing.duplicates) {
        await notify(
          dup.citizenId,
          "COMPLAINT_RESOLVED",
          "Your complaint has been fixed",
          "A field worker uploaded proof of the repair — please confirm it's actually fixed.",
          { link: "/my-reports", complaintId: dup.id },
        );
      }
    }

    revalidatePath("/worker");
    revalidatePath("/scorecard");
    revalidatePath("/admin");

    return { success: true, photoFlags: repairPhotoFlags };
  } catch (err) {
    console.error("Error resolving complaint:", err);
    return { success: false, error: err instanceof UploadError ? err.message : "Server error resolving complaint." };
  }
}

/** Shared guard: the complaint must belong to the signed-in citizen and be awaiting their word. */
async function loadPendingComplaint(complaintId: number) {
  const session = await getSession();
  if (!session) return { error: "Please log in to respond." as const };
  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint || complaint.citizenId !== session.id) return { error: "This is not your complaint." as const };
  if (complaint.status !== "FIXED_PENDING_CONFIRMATION") {
    return { error: "This complaint is not awaiting your confirmation." as const };
  }
  return { complaint };
}

/** Citizen confirms the repair is good → complaint is CLOSED. */
export async function confirmRepair(complaintId: number) {
  const res = await loadPendingComplaint(complaintId);
  if ("error" in res) return { success: false, error: res.error };

  await prisma.complaint.update({
    where: { id: complaintId },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  if (res.complaint.resolvedByWorkerId) {
    await notify(
      res.complaint.resolvedByWorkerId,
      "COMPLAINT_CONFIRMED",
      "Citizen confirmed your fix",
      "Nice work — the repair was confirmed and the complaint is now closed.",
      { link: "/worker?tab=completed", complaintId },
    );
  }

  revalidatePath("/my-reports");
  revalidatePath("/worker");
  revalidatePath("/scorecard");
  revalidatePath("/admin");
  return { success: true };
}

/** Citizen rejects the repair → complaint is REOPENED and goes back to the worker as priority. */
export async function rejectRepair(complaintId: number, reason: string) {
  const res = await loadPendingComplaint(complaintId);
  if ("error" in res) return { success: false, error: res.error };

  // A worker only ever sees the primary as a task — if this complaint is
  // itself a duplicate, "still not fixed" has to reopen the one job the
  // worker actually has (the primary), not just this citizen's own copy,
  // or the reopen would be invisible on the worker dashboard.
  const primaryId = res.complaint.duplicateOfId ?? complaintId;
  const group = await prisma.complaint.findMany({
    where: { OR: [{ id: primaryId }, { duplicateOfId: primaryId }] },
    select: { id: true, resolvedByWorkerId: true },
  });
  const previousWorkerId =
    group.find((c) => c.id === primaryId)?.resolvedByWorkerId ?? res.complaint.resolvedByWorkerId;
  const trimmedReason = (reason || "").trim();

  await prisma.complaint.updateMany({
    where: { id: { in: group.map((c) => c.id) } },
    data: {
      status: "REOPENED",
      reopenReason: trimmedReason || null,
      reopenCount: { increment: 1 },
      resolvedAt: null,
      resolvedByWorkerId: null,
    },
  });

  if (previousWorkerId) {
    await notify(
      previousWorkerId,
      "COMPLAINT_REOPENED",
      "Citizen says it's not fixed",
      trimmedReason ? `Reopened — reason given: ${trimmedReason}` : "Reopened — please recheck the repair.",
      { link: "/worker?tab=reopened", complaintId: primaryId },
    );
  }

  revalidatePath("/my-reports");
  revalidatePath("/worker");
  revalidatePath("/scorecard");
  revalidatePath("/admin");
  return { success: true };
}
