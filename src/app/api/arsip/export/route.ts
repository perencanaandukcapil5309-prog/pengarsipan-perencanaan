import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const kategori = searchParams.get("kategori") || "";

    let query = supabase
      .from("ArsipDokumen")
      .select("*")
      .order("createdAt", { ascending: false });

    if (search) {
      query = query.or(`nomorDokumen.ilike.%${search}%,namaDokumen.ilike.%${search}%`);
    }

    if (kategori) {
      query = query.eq("kategori", kategori);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error exporting CSV:", error);
      return NextResponse.json(
        { error: "Gagal mengekspor data" },
        { status: 500 }
      );
    }

    const header = "Nomor Dokumen,Nama Dokumen,Kategori,Tanggal Arsip,Link Drive";
    const rows = (data ?? []).map((d) => {
      const tanggal = new Date(d.tanggalArsip).toLocaleDateString("id-ID");
      return [
        `"${d.nomorDokumen}"`,
        `"${d.namaDokumen}"`,
        d.kategori,
        tanggal,
        d.driveWebViewLink,
      ].join(",");
    });

    const csv = [header, ...rows].join("\n");
    const filename = `arsip_dokumen_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting CSV:", error);
    return NextResponse.json(
      { error: "Gagal mengekspor data" },
      { status: 500 }
    );
  }
}