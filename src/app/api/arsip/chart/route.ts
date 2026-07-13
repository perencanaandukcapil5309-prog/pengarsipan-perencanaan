import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const CATEGORIES = ["Renstra & Renja", "Laporan Kinerja", "Anggaran", "Tata Usaha", "Notulensi"];

export async function GET() {
  try {
    const { data: allDocs, error } = await supabase
      .from("ArsipDokumen")
      .select("tanggalArsip,kategori")
      .order("tanggalArsip", { ascending: true });

    if (error) {
      console.error("Supabase error fetching chart data:", error);
      return NextResponse.json(
        { error: "Gagal mengambil data grafik" },
        { status: 500 }
      );
    }

    // Group by month with correct categories
    const monthlyMap: Record<string, Record<string, number>> = {};

    for (const doc of allDocs ?? []) {
      const date = new Date(doc.tanggalArsip);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap[key]) {
        const catMap: Record<string, number> = {};
        for (const cat of CATEGORIES) {
          catMap[cat] = 0;
        }
        monthlyMap[key] = catMap;
      }
      if (doc.kategori in monthlyMap[key]) {
        monthlyMap[key][doc.kategori]++;
      }
    }

    const chartData = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, counts]) => ({
        month,
        ...counts,
      }));

    return NextResponse.json({ chartData });
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data grafik" },
      { status: 500 }
    );
  }
}