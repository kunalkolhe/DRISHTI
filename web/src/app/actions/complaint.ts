"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/app/actions/auth";
import { getDepartmentContact } from "@/lib/departments";
import { extractAssetCode } from "@/lib/qr";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

// Helper to save File to disk
async function saveFileLocally(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Create a unique filename
  const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  
  // Note: in a real production app, use MinIO or S3. 
  // For local development, saving to public/uploads
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const filepath = path.join(uploadDir, filename);
  
  // Ensure directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  fs.writeFileSync(filepath, buffer);
  
  return `/uploads/${filename}`;
}

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
    const photoUrl = await saveFileLocally(photoFile);
    const voiceNoteUrl = await saveFileLocally(voiceFile);

    if (!photoUrl && !voiceNoteUrl) {
      return { success: false, error: "You must provide either a photo or a voice note." };
    }

    // 4. Create the complaint
    // The schema has no dedicated category column yet, so keep the citizen's
    // chosen category on the record by tagging the description.
    const categoryLabel = category ? getDepartmentContact(category).label : null;
    const finalDescription =
      [categoryLabel ? `(${categoryLabel})` : null, description?.trim() || null]
        .filter(Boolean)
        .join(" ") || null;

    const complaint = await prisma.complaint.create({
      data: {
        assetId: asset ? asset.id : null,
        citizenId: session.id,
        severity: severity || "MEDIUM",
        description: finalDescription,
        address: address || null,
        gpsLat: gpsLat ? parseFloat(gpsLat) : null,
        gpsLon: gpsLon ? parseFloat(gpsLon) : null,
        originalPhotoUrl: photoUrl || "", // Schema requires this, we can relax it in future or default it
        voiceNoteUrl: voiceNoteUrl,
        status: "OPEN"
      }
    });

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
    const buffer = Buffer.from(await photo.arrayBuffer());
    const fileName = `${Date.now()}-${session.id}-repair.webp`;
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);
    const publicUrl = `uploads/${fileName}`;

    await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: "FIXED_PENDING_CONFIRMATION",
        repairPhotoUrl: publicUrl,
        workerNotes: notes,
        resolvedAt: new Date(),
        resolvedByWorkerId: session.id,
      }
    });

    revalidatePath("/worker");
    revalidatePath("/scorecard");
    revalidatePath("/admin");

    return { success: true };
  } catch (err) {
    console.error("Error resolving complaint:", err);
    return { success: false, error: "Server error resolving complaint." };
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

  await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      status: "REOPENED",
      reopenReason: (reason || "").trim() || null,
      reopenCount: { increment: 1 },
      resolvedAt: null,
      resolvedByWorkerId: null,
    },
  });

  revalidatePath("/my-reports");
  revalidatePath("/worker");
  revalidatePath("/scorecard");
  revalidatePath("/admin");
  return { success: true };
}
