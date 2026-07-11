import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const kategori = searchParams.get("kategori") || "";

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

    const data = await db.arsipDokumen.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const header = "Nomor Dokumen,Nama Dokumen,Kategori,Tanggal Arsip,Link Drive";
    const rows = data.map((d) => {
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