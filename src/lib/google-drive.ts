import { join } from "path";

// ─── Local storage path ─────────────────────────────────────
const LOCAL_UPLOAD_DIR = join(process.cwd(), "uploads");

// ─── Detect if Google Drive is available ────────────────────
function isGoogleDriveConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY
  );
}

// ─── Local fallback upload ──────────────────────────────────
async function uploadToLocal(
  fileBuffer: Buffer,
  fileName: string
): Promise<{ fileId: string; webViewLink: string }> {
  const { writeFile, mkdir } = await import("fs/promises");
  const { existsSync } = await import("fs");

  if (!existsSync(LOCAL_UPLOAD_DIR)) {
    await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  }

  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${fileName}`;
  const filePath = join(LOCAL_UPLOAD_DIR, uniqueName);

  await writeFile(filePath, fileBuffer);

  return {
    fileId: `local:${uniqueName}`,
    webViewLink: "",
  };
}

// ─── Google Drive upload ────────────────────────────────────
async function uploadToGoogleDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ fileId: string; webViewLink: string }> {
  const { google } = await import("googleapis");
  const { Readable } = await import("stream");

  const privateKey = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  const drive = google.drive({ version: "v3", auth });

  const fileMetadata: Record<string, string> = {
    name: fileName,
  };

  const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (driveFolderId) {
    fileMetadata.parents = [driveFolderId];
  }

  const bufferStream = new Readable();
  bufferStream.push(fileBuffer);
  bufferStream.push(null);

  const result = await drive.files.create({
    requestBody: fileMetadata,
    media: { mimeType, body: bufferStream },
    fields: "id, webViewLink",
  });

  if (!result.data.id || !result.data.webViewLink) {
    throw new Error("Google Drive upload returned incomplete data");
  }

  await drive.permissions.create({
    fileId: result.data.id,
    requestBody: { role: "reader", type: "anyone" },
  });

  return {
    fileId: result.data.id,
    webViewLink: result.data.webViewLink,
  };
}

// ─── Public upload function (auto Google Drive → local fallback) ──
export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ fileId: string; webViewLink: string; storageMode: string }> {
  if (isGoogleDriveConfigured()) {
    try {
      const result = await uploadToGoogleDrive(fileBuffer, fileName, mimeType);
      return { ...result, storageMode: "google-drive" };
    } catch (driveError) {
      console.error("Google Drive upload failed, falling back to local storage:", driveError);
      const localResult = await uploadToLocal(fileBuffer, fileName);
      return { ...localResult, storageMode: "local-fallback" };
    }
  }

  const localResult = await uploadToLocal(fileBuffer, fileName);
  return { ...localResult, storageMode: "local" };
}

// ─── Public delete function ──────────────────────────────────
export async function deleteFileFromDrive(fileId: string): Promise<void> {
  if (fileId.startsWith("local:")) {
    const fileName = fileId.replace("local:", "");
    const filePath = join(LOCAL_UPLOAD_DIR, fileName);
    try {
      const { existsSync } = await import("fs");
      const { unlink } = await import("fs/promises");
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (err) {
      console.error("Failed to delete local file:", err);
    }
    return;
  }

  if (isGoogleDriveConfigured()) {
    try {
      const { google } = await import("googleapis");
      const privateKey = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n");

      const auth = new google.auth.JWT({
        email: process.env.GOOGLE_CLIENT_EMAIL,
        key: privateKey,
        scopes: ["https://www.googleapis.com/auth/drive"],
      });

      const drive = google.drive({ version: "v3", auth });
      await drive.files.delete({ fileId });
    } catch (err) {
      console.error("Google Drive delete failed:", err);
    }
  }
}

// ─── Helper: serve local file as buffer ──────────────────────
export async function getLocalFileBuffer(fileId: string): Promise<Buffer | null> {
  if (!fileId.startsWith("local:")) return null;
  const fileName = fileId.replace("local:", "");
  const filePath = join(LOCAL_UPLOAD_DIR, fileName);
  try {
    const { existsSync } = await import("fs");
    const { readFile } = await import("fs/promises");
    if (existsSync(filePath)) {
      return await readFile(filePath);
    }
  } catch {
    // ignore
  }
  return null;
}

// ─── Helper: check if file is stored locally ─────────────────
export function isLocalFile(fileId: string): boolean {
  return fileId.startsWith("local:");
}