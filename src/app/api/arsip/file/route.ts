import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getLocalFileBuffer, isLocalFile } from "@/lib/google-drive";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID wajib disertakan" }, { status: 400 });
    }

    const arsip = await db.arsipDokumen.findUnique({ where: { id } });

    if (!arsip) {
      return NextResponse.json({ error: "Arsip tidak ditemukan" }, { status: 404 });
    }

    // For Google Drive files, redirect to the Drive link
    if (!isLocalFile(arsip.driveFileId)) {
      if (arsip.driveWebViewLink) {
        return NextResponse.redirect(arsip.driveWebViewLink);
      }
      return NextResponse.json({ error: "Link dokumen tidak tersedia" }, { status: 404 });
    }

    // For local files, serve the file directly
    const buffer = await getLocalFileBuffer(arsip.driveFileId);
    if (!buffer) {
      return NextResponse.json({ error: "File tidak ditemukan di penyimpanan lokal" }, { status: 404 });
    }

    // Determine content type from file extension
    const ext = arsip.driveFileId.split(".").pop()?.toLowerCase();
    const mimeMap: Record<string, string> = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };
    const contentType = ext ? mimeMap[ext] || "application/octet-stream" : "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${arsip.namaDokumen}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return NextResponse.json({ error: "Gagal mengambil file" }, { status: 500 });
  }
}