import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [total, byKategori] = await Promise.all([
      db.arsipDokumen.count(),
      db.arsipDokumen.groupBy({
        by: ["kategori"],
        _count: { kategori: true },
      }),
    ]);

    const stats: Record<string, number> = { total };
    for (const item of byKategori) {
      stats[item.kategori] = item._count.kategori;
    }

    // Ensure all categories are present
    const categories = ["Kependudukan", "Kepegawaian", "SIAK", "Umum"];
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