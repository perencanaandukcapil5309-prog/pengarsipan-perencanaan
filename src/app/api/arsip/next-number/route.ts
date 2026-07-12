import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const KODE_KATEGORI: Record<string, string> = {
  "Renstra & Renja": "RR",
  "Laporan Kinerja": "LK",
  Anggaran: "ANG",
  "Tata Usaha": "TU",
  Notulensi: "NT",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kategori = searchParams.get("kategori");

    if (!kategori || !KODE_KATEGORI[kategori]) {
      return NextResponse.json(
        { error: "Kategori tidak valid" },
        { status: 400 }
      );
    }

    const tahun = new Date().getFullYear();
    const kode = KODE_KATEGORI[kategori];

    // Get total count for global sequence
    const total = await db.arsipDokumen.count();

    // Get the last sub-sequence for this category+year
    const lastDoc = await db.arsipDokumen.findFirst({
      where: {
        kategori,
        nomorDokumen: { contains: `/${kode}/${tahun}/` },
      },
      orderBy: { nomorDokumen: "desc" },
      select: { nomorDokumen: true },
    });

    let catYearSeq = 1;
    if (lastDoc) {
      // Extract the last number after the last slash
      const parts = lastDoc.nomorDokumen.split("/");
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        catYearSeq = lastNum + 1;
      }
    }

    const globalSeq = total + 1;
    const nomorDokumen = `${String(globalSeq).padStart(3, "0")}/${kode}/${tahun}/${String(catYearSeq).padStart(3, "0")}`;

    return NextResponse.json({
      nomorDokumen,
      detail: {
        globalSeq,
        kode,
        tahun,
        catYearSeq,
      },
    });
  } catch (error) {
    console.error("Error generating next number:", error);
    return NextResponse.json(
      { error: "Gagal menghasilkan nomor dokumen" },
      { status: 500 }
    );
  }
}