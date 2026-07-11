import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const kategori = searchParams.get("kategori") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { nomorDokumen: { contains: search } },
        { namaDokumen: { contains: search } },
      ];
    }

    if (kategori) {
      where.kategori = kategori;
    }

    const [data, total] = await Promise.all([
      db.arsipDokumen.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.arsipDokumen.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching arsip:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data arsip" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const nomorDokumen = formData.get("nomorDokumen") as string;
    const namaDokumen = formData.get("namaDokumen") as string;
    const kategori = formData.get("kategori") as string;

    if (!file) {
      return NextResponse.json(
        { error: "File wajib diunggah" },
        { status: 400 }
      );
    }

    if (!nomorDokumen || !namaDokumen || !kategori) {
      return NextResponse.json(
        { error: "Nomor dokumen, nama dokumen, dan kategori wajib diisi" },
        { status: 400 }
      );
    }

    const validKategori = ["Kependudukan", "Kepegawaian", "SIAK", "Umum"];
    if (!validKategori.includes(kategori)) {
      return NextResponse.json(
        { error: "Kategori tidak valid" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedMimeTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/jpg",
    ];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipe file tidak didukung. Gunakan PDF atau gambar (JPEG, PNG, GIF, WebP)." },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 25MB" },
        { status: 400 }
      );
    }

    // Upload to Google Drive
    const { uploadFileToDrive } = await import("@/lib/google-drive");
    const buffer = Buffer.from(await file.arrayBuffer());

    let driveResult;
    try {
      driveResult = await uploadFileToDrive(buffer, file.name, file.type);
    } catch (driveError) {
      console.error("Google Drive upload error:", driveError);
      return NextResponse.json(
        { error: "Gagal mengunggah file ke Google Drive. Periksa konfigurasi Service Account." },
        { status: 500 }
      );
    }

    // Save to database
    const arsip = await db.arsipDokumen.create({
      data: {
        nomorDokumen,
        namaDokumen,
        kategori,
        driveFileId: driveResult.fileId,
        driveWebViewLink: driveResult.webViewLink,
      },
    });

    return NextResponse.json({ data: arsip }, { status: 201 });
  } catch (error) {
    console.error("Error creating arsip:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan arsip" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID arsip wajib disertakan" },
        { status: 400 }
      );
    }

    const arsip = await db.arsipDokumen.findUnique({ where: { id } });

    if (!arsip) {
      return NextResponse.json(
        { error: "Arsip tidak ditemukan" },
        { status: 404 }
      );
    }

    // Delete from Google Drive
    try {
      const { deleteFileFromDrive } = await import("@/lib/google-drive");
      await deleteFileFromDrive(arsip.driveFileId);
    } catch (driveError) {
      console.error("Google Drive delete error:", driveError);
      // Continue to delete from database even if Drive deletion fails
    }

    // Delete from database
    await db.arsipDokumen.delete({ where: { id } });

    return NextResponse.json({ message: "Arsip berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting arsip:", error);
    return NextResponse.json(
      { error: "Gagal menghapus arsip" },
      { status: 500 }
    );
  }
}