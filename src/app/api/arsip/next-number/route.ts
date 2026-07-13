import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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
    const { count: total, error: countError } = await supabase
      .from("ArsipDokumen")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Supabase count error:", countError);
      return NextResponse.json(
        { error: "Gagal menghasilkan nomor dokumen" },
        { status: 500 }
      );
    }

    // Get the last sub-sequence for this category+year
    const { data: lastDocs, error: lastError } = await supabase
      .from("ArsipDokumen")
      .select("nomorDokumen")
      .eq("kategori", kategori)
      .ilike("nomorDokumen", `%/${kode}/${tahun}/%`)
      .order("nomorDokumen", { ascending: false })
      .limit(1);

    if (lastError) {
      console.error("Supabase last doc error:", lastError);
      return NextResponse.json(
        { error: "Gagal menghasilkan nomor dokumen" },
        { status: 500 }
      );
    }

    let catYearSeq = 1;
    if (lastDocs && lastDocs.length > 0) {
      // Extract the last number after the last slash
      const parts = lastDocs[0].nomorDokumen.split("/");
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        catYearSeq = lastNum + 1;
      }
    }

    const globalSeq = (total ?? 0) + 1;
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