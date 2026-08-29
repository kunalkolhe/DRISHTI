"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "./auth";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// Save file to local public/uploads directory (Mocking S3/MinIO)
async function saveFileLocally(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = file.name.split('.').pop();
  const filename = `${uniquePrefix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
  
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadDir, { recursive: true });
  
  const filepath = path.join(uploadDir, filename);
  await fs.writeFile(filepath, buffer);
  
  return `/uploads/${filename}`;
}

function getMaintenanceInterval(category: string): number {
  switch (category) {
    case 'SOLAR_LIGHT': return 180; // 6 months
    case 'STREETLIGHT': return 180; // 6 months
    case 'HANDPUMP': return 90;     // 3 months
    case 'CCTV': return 90;         // 3 months
    case 'OPEN_GYM': return 30;     // 1 month
    case 'PUBLIC_TOILET': return 7; // 1 week
    default: return 90;
  }
}

export async function createAsset(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'FIELD_WORKER') {
    return { success: false, error: "Unauthorized" };
  }

  const category = formData.get("category") as any;
  const department = formData.get("department") as string;
  const gpsLat = parseFloat(formData.get("gpsLat") as string);
  const gpsLon = parseFloat(formData.get("gpsLon") as string);
  const warrantyStatus = formData.get("warrantyStatus") as string;
  const photo = formData.get("photo") as File;

  if (!category || !department || isNaN(gpsLat) || isNaN(gpsLon) || !photo) {
    return { success: false, error: "Missing required fields or photo." };
  }

  try {
    const photoUrl = await saveFileLocally(photo);
    
    // Generate unique QR ID (e.g. DRISHTI-A1B2C3D4)
    const qrCodeId = "DRISHTI-" + crypto.randomBytes(4).toString('hex').toUpperCase();
    const intervalDays = getMaintenanceInterval(category);

    const asset = await prisma.asset.create({
      data: {
        qrCodeId,
        category,
        department,
        gpsLat,
        gpsLon,
        warrantyStatus,
        photoUrl,
        maintenanceIntervalDays: intervalDays,
        installDate: new Date(),
        lastMaintenanceDate: new Date(),
      }
    });

    return { success: true, asset };
  } catch (error: any) {
    console.error("Asset creation error:", error);
    return { success: false, error: "Failed to create asset." };
  }
}

export async function logMaintenance(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'FIELD_WORKER') {
    return { success: false, error: "Unauthorized" };
  }

  const assetId = parseInt(formData.get("assetId") as string);
  const notes = formData.get("notes") as string;
  const photo = formData.get("photo") as File;

  if (isNaN(assetId) || !photo) {
    return { success: false, error: "Missing required fields or photo." };
  }

  try {
    const photoUrl = await saveFileLocally(photo);

    // Run in transaction: Create service history AND update asset's lastMaintenanceDate
    await prisma.$transaction([
      prisma.serviceHistory.create({
        data: {
          assetId,
          workerId: session.id,
          repairPhotoUrl: photoUrl,
          notes,
          type: "MAINTENANCE"
        }
      }),
      prisma.asset.update({
        where: { id: assetId },
        data: {
          lastMaintenanceDate: new Date()
        }
      })
    ]);

    return { success: true };
  } catch (error: any) {
    console.error("Maintenance log error:", error);
    return { success: false, error: "Failed to log maintenance." };
  }
}
