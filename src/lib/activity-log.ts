import { db } from "@/lib/db";

export async function logActivity(action: string, target: string, detail: string, kategori: string = "") {
  try {
    await db.activityLog.create({
      data: { action, target, detail, kategori },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}