import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const VALID_SORT_FIELDS = ["createdAt", "tanggalArsip", "nomorDokumen", "namaDokumen", "kategori"];
const VALID_SORT_ORDERS = ["asc", "desc"];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const kategori = searchParams.get("kategori") || "";
    const tanggalDari = searchParams.get("tanggalDari") || "";
    const tanggalSampai = searchParams.get("tanggalSampai") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    if (!VALID_SORT_FIELDS.includes(sortBy)) {
      return NextResponse.json(
        { error: "Field sort tidak valid" },
        { status: 400 }
      );
    }

    if (!VALID_SORT_ORDERS.includes(sortOrder)) {
      return NextResponse.json(
        { error: "Urutan sort tidak valid" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {};
    const andConditions: Record<string, unknown>[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { nomorDokumen: { contains: search } },
          { namaDokumen: { contains: search } },
        ],
      });
    }

    if (kategori) {
      andConditions.push({ kategori });
    }

    if (tanggalDari) {
      andConditions.push({
        tanggalArsip: { gte: new Date(tanggalDari) },
      });
    }

    if (tanggalSampai) {
      andConditions.push({
        tanggalArsip: { lte: new Date(tanggalSampai + "T23:59:59.999Z") },
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [data, total] = await Promise.all([
      db.arsipDokumen.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
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
      sortBy,
      sortOrder,
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
    const tanggalArsipRaw = formData.get("tanggalArsip") as string | null;

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

    const existing = await db.arsipDokumen.findUnique({
      where: { nomorDokumen },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Nomor dokumen '${nomorDokumen}' sudah terdaftar. Gunakan nomor yang berbeda.` },
        { status: 409 }
      );
    }

    const validKategori = ["Kependudukan", "Kepegawaian", "SIAK", "Umum"];
    if (!validKategori.includes(kategori)) {
      return NextResponse.json(
        { error: "Kategori tidak valid" },
        { status: 400 }
      );
    }

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

    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 25MB" },
        { status: 400 }
      );
    }

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

    const tanggalArsip = tanggalArsipRaw ? new Date(tanggalArsipRaw) : new Date();

    const arsip = await db.arsipDokumen.create({
      data: {
        nomorDokumen,
        namaDokumen,
        kategori,
        tanggalArsip,
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

    try {
      const { deleteFileFromDrive } = await import("@/lib/google-drive");
      await deleteFileFromDrive(arsip.driveFileId);
    } catch (driveError) {
      console.error("Google Drive delete error:", driveError);
    }

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