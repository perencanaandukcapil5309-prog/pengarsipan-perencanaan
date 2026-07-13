import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity-log";

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

    let query = supabase
      .from("ArsipDokumen")
      .select("*", { count: "exact" });

    if (search) {
      query = query.or(`nomorDokumen.ilike.%${search}%,namaDokumen.ilike.%${search}%`);
    }

    if (kategori) {
      query = query.eq("kategori", kategori);
    }

    if (tanggalDari) {
      query = query.gte("tanggalArsip", tanggalDari);
    }

    if (tanggalSampai) {
      query = query.lte("tanggalArsip", tanggalSampai);
    }

    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Supabase error fetching arsip:", error);
      return NextResponse.json(
        { error: "Gagal mengambil data arsip" },
        { status: 500 }
      );
    }

    const total = count ?? 0;

    return NextResponse.json({
      data: data ?? [],
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

    // Check duplicate
    const { data: existing } = await supabase
      .from("ArsipDokumen")
      .select("id")
      .eq("nomorDokumen", nomorDokumen)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: `Nomor dokumen '${nomorDokumen}' sudah terdaftar. Gunakan nomor yang berbeda.` },
        { status: 409 }
      );
    }

    const validKategori = ["Renstra & Renja", "Laporan Kinerja", "Anggaran", "Tata Usaha", "Notulensi"];
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

    // Vercel Hobby (free) plan: body size limit is 4.5MB.
    // We set 4MB to leave safe margin for form fields metadata.
    const MAX_SIZE = 4 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Ukuran file terlalu besar (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maksimal 4MB untuk kompatibilitas hosting.` },
        { status: 413 }
      );
    }

    const { uploadFileToDrive } = await import("@/lib/google-drive");
    const buffer = Buffer.from(await file.arrayBuffer());

    let driveResult;
    try {
      driveResult = await uploadFileToDrive(buffer, file.name, file.type);
    } catch (driveError) {
      console.error("Upload error:", driveError);
      const msg = driveError instanceof Error ? driveError.message : "";
      if (msg.includes("storage quota")) {
        return NextResponse.json(
          { error: "Service Account Google Drive tidak memiliki kuota penyimpanan. Solusi: Buat Shared Drive di Google Workspace Admin Console, lalu share ke bot-pengarsipan@arsip-digital-perencanaan.iam.gserviceaccount.com dengan akses Editor. Setelah itu, perbarui GOOGLE_DRIVE_FOLDER_ID dengan ID Shared Drive." },
          { status: 502 }
        );
      }
      return NextResponse.json(
        { error: `Gagal mengunggah file. ${msg ? `Detail: ${msg}` : "Periksa konfigurasi dan coba lagi."}` },
        { status: 502 }
      );
    }

    const tanggalArsip = tanggalArsipRaw
      ? tanggalArsipRaw.split("T")[0]
      : new Date().toISOString().split("T")[0];

    const { data: arsip, error: insertError } = await supabase
      .from("ArsipDokumen")
      .insert({
        id: crypto.randomUUID(),
        nomorDokumen,
        namaDokumen,
        kategori,
        tanggalArsip,
        driveFileId: driveResult.fileId,
        driveWebViewLink: driveResult.webViewLink,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json(
        { error: "Gagal menyimpan arsip" },
        { status: 500 }
      );
    }

    const storageNote = driveResult.storageMode === "google-drive"
      ? " (Google Drive)"
      : "";

    await logActivity("CREATE", namaDokumen, `Nomor: ${nomorDokumen}${storageNote}`, kategori);

    return NextResponse.json({ data: arsip, storageMode: driveResult.storageMode }, { status: 201 });
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

    const { data: arsip, error: findError } = await supabase
      .from("ArsipDokumen")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !arsip) {
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

    const { error: deleteError } = await supabase
      .from("ArsipDokumen")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      return NextResponse.json(
        { error: "Gagal menghapus arsip" },
        { status: 500 }
      );
    }

    await logActivity("DELETE", arsip.namaDokumen, `Nomor: ${arsip.nomorDokumen}`, arsip.kategori);

    return NextResponse.json({ message: "Arsip berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting arsip:", error);
    return NextResponse.json(
      { error: "Gagal menghapus arsip" },
      { status: 500 }
    );
  }
}