"use server";

import { prisma } from "@/lib/prisma";
import { AssetCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

export async function createAsset(formData: FormData) {
  // Extract values from the FormData
  const category = formData.get("category") as AssetCategory;
  const department = formData.get("department") as string;
  const gpsLat = parseFloat(formData.get("gpsLat") as string);
  const gpsLon = parseFloat(formData.get("gpsLon") as string);
  const warrantyStatus = formData.get("warrantyStatus") as string;
  const replacementCost = parseFloat(formData.get("replacementCost") as string);
  
  // Simulated QR Code Generation for Digital Twin
  const qrCodeId = `QR-${uuidv4().substring(0, 8).toUpperCase()}`;

  try {
    const asset = await prisma.asset.create({
      data: {
        qrCodeId,
        category,
        department,
        gpsLat,
        gpsLon,
        warrantyStatus: warrantyStatus || null,
        replacementCost: isNaN(replacementCost) ? null : replacementCost,
      },
    });

    // Revalidate the cache so the UI updates instantly
    revalidatePath("/admin/assets");
    
    return { success: true, asset };
  } catch (error) {
    console.error("Failed to create asset:", error);
    return { success: false, error: "Failed to create digital twin." };
  }
}
