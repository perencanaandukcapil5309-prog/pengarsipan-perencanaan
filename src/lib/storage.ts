import { supabase } from "@/lib/supabase";

const BUCKET_NAME = "arsip-files";

// ─── Ensure the storage bucket exists ─────────────────────
async function ensureBucket(): Promise<boolean> {
  try {
    // Try to get the bucket
    const { error } = await supabase.storage.getBucket(BUCKET_NAME);

    if (error && (error.message.includes("not found") || error.message.includes("Could not find"))) {
      // Create the bucket if it doesn't exist
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
      });
      if (createError) {
        console.error("Failed to create storage bucket:", createError);
        return false;
      }
      console.log("Created Supabase Storage bucket:", BUCKET_NAME);
    } else if (error) {
      console.error("Storage bucket check error:", error);
      // If we can't check, assume it exists and try upload anyway
    }

    return true;
  } catch (err) {
    console.error("ensureBucket error:", err);
    return true; // Assume it exists
  }
}

// ─── Upload file to Supabase Storage ──────────────────────
export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ fileId: string; webViewLink: string; storageMode: string }> {
  const bucketReady = await ensureBucket();
  if (!bucketReady) {
    throw new Error("Gagal menyiapkan penyimpanan. Periksa konfigurasi Supabase Storage.");
  }

  // Generate unique file path to avoid collisions
  const timestamp = Date.now();
  const ext = fileName.split(".").pop() || "bin";
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${timestamp}-${sanitizedName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    console.error("Supabase Storage upload error:", error);
    throw new Error(`Gagal mengunggah file ke storage: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  const publicUrl = urlData.publicUrl;

  return {
    fileId: data.path, // Use storage path as the fileId
    webViewLink: publicUrl,
    storageMode: "supabase-storage",
  };
}

// ─── Delete file from storage ─────────────────────────────
// Handles both Supabase Storage paths and legacy Google Drive file IDs
export async function deleteFile(fileId: string): Promise<void> {
  if (!fileId) return;

  // If it looks like a Supabase Storage path (contains dash-number pattern or slash)
  if (fileId.includes("/") || /^\d+-/.test(fileId)) {
    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([fileId]);

      if (error) {
        console.error("Supabase Storage delete error:", error);
      }
    } catch (err) {
      console.error("Storage delete failed:", err);
    }
  } else {
    // Legacy Google Drive file - try to delete from Google Drive
    try {
      const { deleteFileFromDrive } = await import("@/lib/google-drive");
      await deleteFileFromDrive(fileId);
    } catch (driveErr) {
      console.error("Google Drive delete failed (legacy file):", driveErr);
    }
  }
}