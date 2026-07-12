import { google } from "googleapis";
import { Readable } from "stream";

function getAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY environment variables"
    );
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
}

export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ fileId: string; webViewLink: string }> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });

  const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  const fileMetadata: Record<string, string> = {
    name: fileName,
  };

  if (driveFolderId) {
    fileMetadata.parents = [driveFolderId];
  }

  const bufferStream = new Readable();
  bufferStream.push(fileBuffer);
  bufferStream.push(null);

  const result = await drive.files.create({
    requestBody: fileMetadata,
    media: {
      mimeType,
      body: bufferStream,
    },
    fields: "id, webViewLink",
  });

  if (!result.data.id || !result.data.webViewLink) {
    throw new Error("Failed to upload file to Google Drive");
  }

  // Make the file readable by anyone with the link
  await drive.permissions.create({
    fileId: result.data.id,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return {
    fileId: result.data.id,
    webViewLink: result.data.webViewLink,
  };
}

export async function deleteFileFromDrive(fileId: string): Promise<void> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });

  await drive.files.delete({
    fileId,
  });
}