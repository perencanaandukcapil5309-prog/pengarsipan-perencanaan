import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const allDocs = await db.arsipDokumen.findMany({
      select: { tanggalArsip: true, kategori: true },
      orderBy: { tanggalArsip: "asc" },
    });

    // Group by month
    const monthlyMap: Record<string, Record<string, number>> = {};

    for (const doc of allDocs) {
      const date = new Date(doc.tanggalArsip);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap[key]) monthlyMap[key] = { Kependudukan: 0, Kepegawaian: 0, SIAK: 0, Umum: 0 };
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