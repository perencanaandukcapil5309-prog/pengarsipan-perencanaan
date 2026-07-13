import { GDRIVE_PRIVATE_KEY_B64 } from "./gdrive-credentials";

const GDRIVE_EMAIL = "bot-pengarsipan@arsip-digital-perencanaan.iam.gserviceaccount.com";
const GDRIVE_FOLDER_ID = "1H3NG0Oq_LX7cQEuNWMwf6c8ZYaoxGg5i";

// ─── Detect if Google Drive is available ────────────────────
function isGoogleDriveConfigured(): boolean {
  return !!GDRIVE_PRIVATE_KEY_B64;
}

// ─── Get access token via JWT ──────────────────────────────
async function getAccessToken(): Promise<string> {
  const { GoogleAuth } = await import("google-auth-library");
  const privateKey = Buffer.from(GDRIVE_PRIVATE_KEY_B64, "base64").toString("utf-8");

  const auth = new GoogleAuth({
    credentials: {
      client_email: GDRIVE_EMAIL,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token!;
}

// ─── Upload file to Google Drive using direct HTTP ─────────
async function uploadToGoogleDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ fileId: string; webViewLink: string }> {
  const token = await getAccessToken();

  const metadata: Record<string, string> = {
    name: fileName,
  };
  if (GDRIVE_FOLDER_ID) {
    metadata.parents = GDRIVE_FOLDER_ID;
  }

  // Step 1: Initiate resumable upload session
  const initRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!initRes.ok) {
    const errText = await initRes.text();
    console.error("Drive init upload failed:", initRes.status, errText);
    throw new Error(`Google Drive upload initiation failed (${initRes.status}): ${errText}`);
  }

  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) {
    throw new Error("Google Drive did not return an upload URL");
  }

  // Step 2: Upload the file content
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": mimeType,
      "Content-Range": `bytes 0-${fileBuffer.length - 1}/${fileBuffer.length}`,
    },
    body: fileBuffer,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    console.error("Drive upload failed:", uploadRes.status, errText);
    throw new Error(`Google Drive file upload failed (${uploadRes.status}): ${errText}`);
  }

  const result = await uploadRes.json();
  const fileId = result.id;
  const webViewLink = result.webViewLink;

  if (!fileId || !webViewLink) {
    throw new Error("Google Drive upload returned incomplete data");
  }

  // Step 3: Make file publicly readable
  try {
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "reader", type: "anyone" }),
      }
    );
  } catch (permErr) {
    console.error("Failed to set public permission (non-fatal):", permErr);
  }

  return { fileId, webViewLink };
}

// ─── Public upload function (Google Drive only) ──
export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ fileId: string; webViewLink: string; storageMode: string }> {
  if (!isGoogleDriveConfigured()) {
    throw new Error("Google Drive is not configured. Set GDRIVE_PRIVATE_KEY_B64.");
  }

  const result = await uploadToGoogleDrive(fileBuffer, fileName, mimeType);
  return { ...result, storageMode: "google-drive" };
}

// ─── Public delete function ──────────────────────────────────
export async function deleteFileFromDrive(fileId: string): Promise<void> {
  if (!isGoogleDriveConfigured()) return;

  try {
    const token = await getAccessToken();
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok && res.status !== 404) {
      console.error("Google Drive delete failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Google Drive delete failed:", err);
  }
}