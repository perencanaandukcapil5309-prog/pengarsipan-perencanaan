import { GDRIVE_PRIVATE_KEY_B64 } from "./gdrive-credentials";

const GDRIVE_EMAIL = "bot-pengarsipan@arsip-digital-perencanaan.iam.gserviceaccount.com";
const GDRIVE_FOLDER_ID = "1H3NG0Oq_LX7cQEuNWMwf6c8ZYaoxGg5i";

// ─── Detect if Google Drive is available ────────────────────
function isGoogleDriveConfigured(): boolean {
  return !!GDRIVE_PRIVATE_KEY_B64;
}

// ─── Google Drive upload ────────────────────────────────────
async function uploadToGoogleDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ fileId: string; webViewLink: string }> {
  const { google } = await import("googleapis");
  const { Readable } = await import("stream");

  const privateKey = Buffer.from(GDRIVE_PRIVATE_KEY_B64, 'base64').toString('utf-8');

  const auth = new google.auth.JWT({
    email: GDRIVE_EMAIL,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  const drive = google.drive({ version: "v3", auth });

  const fileMetadata: Record<string, string> = {
    name: fileName,
  };

  // Only set parent if folder ID is configured and valid
  // Service accounts need the folder to be shared with them
  if (GDRIVE_FOLDER_ID && process.env.USE_DRIVE_FOLDER === 'true') {
    fileMetadata.parents = [GDRIVE_FOLDER_ID];
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

// ─── Public upload function (Google Drive only) ──
export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ fileId: string; webViewLink: string; storageMode: string }> {
  if (!isGoogleDriveConfigured()) {
    throw new Error("Google Drive is not configured.");
  }

  const result = await uploadToGoogleDrive(fileBuffer, fileName, mimeType);
  return { ...result, storageMode: "google-drive" };
}

// ─── Public delete function ──────────────────────────────────
export async function deleteFileFromDrive(fileId: string): Promise<void> {
  if (isGoogleDriveConfigured()) {
    try {
      const { google } = await import("googleapis");
      const privateKey = Buffer.from(GDRIVE_PRIVATE_KEY_B64, 'base64').toString('utf-8');

      const auth = new google.auth.JWT({
        email: GDRIVE_EMAIL,
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