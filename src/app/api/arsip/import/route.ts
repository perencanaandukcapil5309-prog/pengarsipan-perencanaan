import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "File CSV wajib diunggah" },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Hanya file CSV yang didukung" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "File CSV kosong atau tidak memiliki data" },
        { status: 400 }
      );
    }

    // Parse header
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const requiredCols = ["nomordokumen", "namadokumen", "kategori", "drivefileid", "drivewebviewlink"];
    
    for (const col of requiredCols) {
      if (!header.includes(col)) {
        return NextResponse.json(
          { error: `Kolom wajib "${col}" tidak ditemukan di header CSV. Header yang diperlukan: nomorDokumen, namaDokumen, kategori, driveFileId, driveWebViewLink` },
          { status: 400 }
        );
      }
    }

    const idxNomor = header.indexOf("nomordokumen");
    const idxNama = header.indexOf("namadokumen");
    const idxKategori = header.indexOf("kategori");
    const idxDriveFileId = header.indexOf("drivefileid");
    const idxDriveLink = header.indexOf("drivewebviewlink");
    const idxTanggal = header.indexOf("tanggalarsip");

    const validKategori = ["Renstra & Renja", "Laporan Kinerja", "Anggaran", "Tata Usaha", "Notulensi"];

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length < requiredCols.length) {
        skipped++;
        errors.push(`Baris ${i + 1}: Format tidak valid`);
        continue;
      }

      const nomorDokumen = (cols[idxNomor] || "").trim();
      const namaDokumen = (cols[idxNama] || "").trim();
      const kategori = (cols[idxKategori] || "").trim();
      const driveFileId = (cols[idxDriveFileId] || "").trim();
      const driveWebViewLink = (cols[idxDriveLink] || "").trim();
      const tanggalArsipRaw = idxTanggal >= 0 ? (cols[idxTanggal] || "").trim() : "";

      if (!nomorDokumen || !namaDokumen || !kategori || !driveFileId || !driveWebViewLink) {
        skipped++;
        errors.push(`Baris ${i + 1}: Kolom wajib kosong`);
        continue;
      }

      if (!validKategori.includes(kategori)) {
        skipped++;
        errors.push(`Baris ${i + 1}: Kategori "${kategori}" tidak valid`);
        continue;
      }

      // Check duplicate
      const existing = await db.arsipDokumen.findUnique({
        where: { nomorDokumen },
      });

      if (existing) {
        skipped++;
        errors.push(`Baris ${i + 1}: Nomor "${nomorDokumen}" sudah ada`);
        continue;
      }

      const tanggalArsip = tanggalArsipRaw ? new Date(tanggalArsipRaw) : new Date();

      await db.arsipDokumen.create({
        data: {
          nomorDokumen,
          namaDokumen,
          kategori,
          tanggalArsip,
          driveFileId,
          driveWebViewLink,
        },
      });

      imported++;
    }

    await logActivity("IMPORT", `${imported} dokumen dari CSV`, `${imported} diimpor, ${skipped} dilewati`);

    return NextResponse.json({
      imported,
      skipped,
      errors: errors.slice(0, 10), // max 10 errors shown
      message: `Berhasil mengimpor ${imported} dokumen. ${skipped} dilewati.`,
    });
  } catch (error) {
    console.error("Error importing CSV:", error);
    return NextResponse.json(
      { error: "Gagal mengimpor CSV" },
      { status: 500 }
    );
  }
}

// Simple CSV line parser that handles quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}