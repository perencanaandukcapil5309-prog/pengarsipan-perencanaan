// Legacy Google Drive support (kept for backward compatibility)
// New uploads use Supabase Storage (see storage.ts)

export async function deleteFileFromDrive(_fileId: string): Promise<void> {
  // Legacy Google Drive files can be managed directly in Google Drive
  console.log("Note: Legacy Google Drive file delete skipped. Manage in Google Drive directly.");
}