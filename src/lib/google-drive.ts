// ─── Detect if Google Drive is available ────────────────────
function isGoogleDriveConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_EMAIL &&
    (process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY_B64)
  );
}

// ─── Google Drive upload ────────────────────────────────────
async function uploadToGoogleDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ fileId: string; webViewLink: string }> {
  const { google } = await import("googleapis");
  const { Readable } = await import("stream");

  let privateKey = process.env.GOOGLE_PRIVATE_KEY!;
  // Support base64-encoded key (set as GOOGLE_PRIVATE_KEY_B64)
  if (process.env.GOOGLE_PRIVATE_KEY_B64) {
    privateKey = Buffer.from(process.env.GOOGLE_PRIVATE_KEY_B64, 'base64').toString('utf-8');
  }
  privateKey = privateKey.replace(/\\n/g, "\n");

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

// ─── Public upload function (Google Drive only) ──
export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ fileId: string; webViewLink: string; storageMode: string }> {
  if (!isGoogleDriveConfigured()) {
    throw new Error("Google Drive is not configured. Set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY environment variables.");
  }

  const result = await uploadToGoogleDrive(fileBuffer, fileName, mimeType);
  return { ...result, storageMode: "google-drive" };
}

// ─── Public delete function ──────────────────────────────────
export async function deleteFileFromDrive(fileId: string): Promise<void> {
  if (isGoogleDriveConfigured()) {
    try {
      const { google } = await import("googleapis");
      let privateKey = process.env.GOOGLE_PRIVATE_KEY!;
      if (process.env.GOOGLE_PRIVATE_KEY_B64) {
        privateKey = Buffer.from(process.env.GOOGLE_PRIVATE_KEY_B64, 'base64').toString('utf-8');
      }
      privateKey = privateKey.replace(/\\n/g, "\n");

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