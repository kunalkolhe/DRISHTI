"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/app/actions/auth";
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
  const qrCodeId = formData.get("qrCodeId") as string;
  const severity = formData.get("severity") as string;
  const description = formData.get("description") as string;
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

    // 3. Save files securely
    const photoUrl = await saveFileLocally(photoFile);
    const voiceNoteUrl = await saveFileLocally(voiceFile);

    if (!photoUrl && !voiceNoteUrl) {
      return { success: false, error: "You must provide either a photo or a voice note." };
    }

    // 4. Create the complaint
    const complaint = await prisma.complaint.create({
      data: {
        assetId: asset ? asset.id : null,
        citizenId: session.id,
        severity: severity || "MEDIUM",
        description: description || null,
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
    
    return { success: true, complaint };
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
