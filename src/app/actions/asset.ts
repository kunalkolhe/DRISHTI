"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "./auth";
import {
  maintenanceDaysFor,
  departmentFor,
  warrantyOptionByValue,
  prettyCategory,
  assetIssueCategory,
} from "@/lib/assetTypes";
import { extractAssetCode } from "@/lib/qr";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// Save file to local public/uploads directory (Mocking S3/MinIO)
async function saveFileLocally(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const filename = `${uniquePrefix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
  
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadDir, { recursive: true });
  
  const filepath = path.join(uploadDir, filename);
  await fs.writeFile(filepath, buffer);
  
  return `/uploads/${filename}`;
}

export type AssetLookup = {
  qrCodeId: string;
  category: string;
  categoryLabel: string;
  issueCategory: string;
  department: string;
  area: string | null;
  gpsLat: number;
  gpsLon: number;
  photoUrl: string | null;
};

/**
 * Public lookup used by the citizen "Report an issue" form. When a QR is
 * scanned (or arrives as ?asset=...), we return the asset's registered
 * details so the form can auto-fill — the citizen shouldn't have to re-enter
 * what the field worker already recorded when tagging the asset.
 */
export async function lookupAsset(
  rawCode: string,
): Promise<{ ok: true; asset: AssetLookup } | { ok: false; error: string }> {
  const code = extractAssetCode((rawCode || "").trim());
  if (!code) return { ok: false, error: "No asset code given." };

  try {
    const asset = await prisma.asset.findUnique({
      where: { qrCodeId: code },
      select: {
        qrCodeId: true,
        category: true,
        department: true,
        area: true,
        gpsLat: true,
        gpsLon: true,
        photoUrl: true,
      },
    });
    if (!asset) return { ok: false, error: `No asset is registered against ${code}.` };

    return {
      ok: true,
      asset: {
        qrCodeId: asset.qrCodeId,
        category: asset.category,
        categoryLabel: prettyCategory(asset.category),
        issueCategory: assetIssueCategory(asset.category),
        department: asset.department,
        area: asset.area,
        gpsLat: asset.gpsLat,
        gpsLon: asset.gpsLon,
        photoUrl: asset.photoUrl,
      },
    };
  } catch (error) {
    console.error("lookupAsset error:", error);
    return { ok: false, error: "Could not look up that asset." };
  }
}

export async function createAsset(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'FIELD_WORKER') {
    return { success: false, error: "Unauthorized" };
  }

  const rawCategory = ((formData.get("category") as string) || "").trim();
  const customCategory = ((formData.get("customCategory") as string) || "").trim();
  const category = rawCategory === "OTHER" || rawCategory === ""
    ? (customCategory || "OTHER")
    : rawCategory;

  const departmentInput = ((formData.get("department") as string) || "").trim();
  const department = departmentInput || departmentFor(category);
  const area = ((formData.get("area") as string) || "").trim() || null;

  const gpsLat = parseFloat(formData.get("gpsLat") as string);
  const gpsLon = parseFloat(formData.get("gpsLon") as string);
  const warrantyValue = (formData.get("warranty") as string) || "none";
  const replacementCostRaw = (formData.get("replacementCost") as string) || "";
  const photo = formData.get("photo") as File;

  if (!category || !department || isNaN(gpsLat) || isNaN(gpsLon) || !photo || photo.size === 0) {
    return { success: false, error: "Please choose a category, tag GPS and add an installation photo." };
  }

  try {
    const photoUrl = await saveFileLocally(photo);

    const qrCodeId = "DRISHTI-" + crypto.randomBytes(4).toString('hex').toUpperCase();
    const intervalDays = maintenanceDaysFor(category);
    const installDate = new Date();

    // Warranty / AMC — a duration picked from the dropdown
    const w = warrantyOptionByValue(warrantyValue);
    let warrantyExpiry: Date | null = null;
    let warrantyStatus: string | null = null;
    if (w && w.days > 0) {
      warrantyExpiry = new Date(installDate.getTime() + w.days * 86400000);
      warrantyStatus = `${w.label} AMC / warranty — valid till ${warrantyExpiry.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
    }

    const replacementCost = replacementCostRaw ? parseFloat(replacementCostRaw) : null;

    const asset = await prisma.asset.create({
      data: {
        qrCodeId,
        category,
        department,
        area,
        gpsLat,
        gpsLon,
        warrantyStatus,
        warrantyExpiry,
        replacementCost: replacementCost && !isNaN(replacementCost) ? replacementCost : null,
        photoUrl,
        maintenanceIntervalDays: intervalDays,
        installDate,
        lastMaintenanceDate: installDate,
      }
    });

    return { success: true, asset, categoryLabel: prettyCategory(category) };
  } catch (error) {
    console.error("Asset creation error:", error);
    return { success: false, error: "Failed to create asset. Please try again." };
  }
}

export async function logMaintenance(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'FIELD_WORKER') {
    return { success: false, error: "Unauthorized" };
  }

  const assetId = parseInt(formData.get("assetId") as string);
  const notes = ((formData.get("notes") as string) || "").trim() || null;
  const costRaw = (formData.get("repairCost") as string) || "";
  const photo = formData.get("photo") as File;

  if (isNaN(assetId) || !photo || photo.size === 0) {
    return { success: false, error: "A proof photo of the completed service is required." };
  }

  try {
    const photoUrl = await saveFileLocally(photo);
    const cost = costRaw ? parseFloat(costRaw) : null;

    // Run in transaction: Create service history AND update asset's lastMaintenanceDate
    await prisma.$transaction([
      prisma.serviceHistory.create({
        data: {
          assetId,
          workerId: session.id,
          repairPhotoUrl: photoUrl,
          repairCost: cost && !isNaN(cost) ? cost : null,
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
  } catch (error) {
    console.error("Maintenance log error:", error);
    return { success: false, error: "Failed to log maintenance." };
  }
}
