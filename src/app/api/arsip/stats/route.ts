import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Get total count
    const { count: total, error: countError } = await supabase
      .from("ArsipDokumen")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Supabase count error:", countError);
      return NextResponse.json(
        { error: "Gagal mengambil statistik" },
        { status: 500 }
      );
    }

    // Get all kategori values and count in JS
    const { data: allDocs, error: dataError } = await supabase
      .from("ArsipDokumen")
      .select("kategori");

    if (dataError) {
      console.error("Supabase select error:", dataError);
      return NextResponse.json(
        { error: "Gagal mengambil statistik" },
        { status: 500 }
      );
    }

    const stats: Record<string, number> = { total: total ?? 0 };

    if (allDocs) {
      for (const doc of allDocs) {
        const cat = doc.kategori;
        stats[cat] = (stats[cat] || 0) + 1;
      }
    }

    // Ensure all valid categories are present even if count is 0
    const categories = ["Renstra & Renja", "Laporan Kinerja", "Anggaran", "Tata Usaha", "Notulensi"];
    for (const cat of categories) {
      if (!(cat in stats)) stats[cat] = 0;
    }

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Gagal mengambil statistik" },
      { status: 500 }
    );
  }
}