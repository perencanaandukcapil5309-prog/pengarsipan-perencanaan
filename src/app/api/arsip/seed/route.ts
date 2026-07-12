import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity-log";

const SAMPLE_DATA = [
  // ── Renstra & Renja ──
  {
    nomorDokumen: "001/RR/2024/001",
    namaDokumen: "Rencana Strategis Dinas Dukcapil Kab. Ngada 2025-2029",
    kategori: "Renstra & Renja",
    tanggalArsip: new Date("2024-10-15"),
    driveFileId: "demo-rr-001",
    driveWebViewLink: "https://drive.google.com/file/d/demo-rr-001/view",
  },
  {
    nomorDokumen: "002/RR/2025/001",
    namaDokumen: "Rencana Kerja Tahunan Bagian Perencanaan Tahun 2025",
    kategori: "Renstra & Renja",
    tanggalArsip: new Date("2025-01-10"),
    driveFileId: "demo-rr-002",
    driveWebViewLink: "https://drive.google.com/file/d/demo-rr-002/view",
  },
  {
    nomorDokumen: "003/RR/2025/002",
    namaDokumen: "Rencana Aksi Program Percepatan Administrasi Kependudukan",
    kategori: "Renstra & Renja",
    tanggalArsip: new Date("2025-02-20"),
    driveFileId: "demo-rr-003",
    driveWebViewLink: "https://drive.google.com/file/d/demo-rr-003/view",
  },
  {
    nomorDokumen: "004/RR/2025/003",
    namaDokumen: "Review Renstra 2025 — Dokumen Evaluasi Tengah Tahun",
    kategori: "Renstra & Renja",
    tanggalArsip: new Date("2025-03-15"),
    driveFileId: "demo-rr-004",
    driveWebViewLink: "https://drive.google.com/file/d/demo-rr-004/view",
  },
  // ── Laporan Kinerja ──
  {
    nomorDokumen: "001/LK/2024/001",
    namaDokumen: "Laporan Kinerja Bagian Perencanaan Triwulan I 2024",
    kategori: "Laporan Kinerja",
    tanggalArsip: new Date("2024-04-10"),
    driveFileId: "demo-lk-001",
    driveWebViewLink: "https://drive.google.com/file/d/demo-lk-001/view",
  },
  {
    nomorDokumen: "002/LK/2024/002",
    namaDokumen: "Laporan Kinerja Bagian Perencanaan Triwulan III 2024",
    kategori: "Laporan Kinerja",
    tanggalArsip: new Date("2024-10-15"),
    driveFileId: "demo-lk-002",
    driveWebViewLink: "https://drive.google.com/file/d/demo-lk-002/view",
  },
  {
    nomorDokumen: "003/LK/2024/003",
    namaDokumen: "Laporan Capaian Kinerja Tahunan 2024",
    kategori: "Laporan Kinerja",
    tanggalArsip: new Date("2025-01-20"),
    driveFileId: "demo-lk-003",
    driveWebViewLink: "https://drive.google.com/file/d/demo-lk-003/view",
  },
  {
    nomorDokumen: "004/LK/2025/001",
    namaDokumen: "Laporan Kinerja Triwulan I 2025",
    kategori: "Laporan Kinerja",
    tanggalArsip: new Date("2025-04-08"),
    driveFileId: "demo-lk-004",
    driveWebViewLink: "https://drive.google.com/file/d/demo-lk-004/view",
  },
  // ── Anggaran ──
  {
    nomorDokumen: "001/ANG/2024/001",
    namaDokumen: "Rencana Kebutuhan Anggaran Bagian Perencanaan 2024",
    kategori: "Anggaran",
    tanggalArsip: new Date("2024-01-15"),
    driveFileId: "demo-ang-001",
    driveWebViewLink: "https://drive.google.com/file/d/demo-ang-001/view",
  },
  {
    nomorDokumen: "002/ANG/2024/002",
    namaDokumen: "Realisasi Anggaran Semester I 2024",
    kategori: "Anggaran",
    tanggalArsip: new Date("2024-07-20"),
    driveFileId: "demo-ang-002",
    driveWebViewLink: "https://drive.google.com/file/d/demo-ang-002/view",
  },
  {
    nomorDokumen: "003/ANG/2025/001",
    namaDokumen: "RKA Bagian Perencanaan Tahun 2025",
    kategori: "Anggaran",
    tanggalArsip: new Date("2024-11-05"),
    driveFileId: "demo-ang-003",
    driveWebViewLink: "https://drive.google.com/file/d/demo-ang-003/view",
  },
  {
    nomorDokumen: "004/ANG/2025/002",
    namaDokumen: "DPA SKPD Bagian Perencanaan Tahun Anggaran 2025",
    kategori: "Anggaran",
    tanggalArsip: new Date("2025-01-10"),
    driveFileId: "demo-ang-004",
    driveWebViewLink: "https://drive.google.com/file/d/demo-ang-004/view",
  },
  // ── Tata Usaha ──
  {
    nomorDokumen: "001/TU/2024/001",
    namaDokumen: "Surat Tugas Penyusunan Renstra 2025-2029",
    kategori: "Tata Usaha",
    tanggalArsip: new Date("2024-08-12"),
    driveFileId: "demo-tu-001",
    driveWebViewLink: "https://drive.google.com/file/d/demo-tu-001/view",
  },
  {
    nomorDokumen: "002/TU/2024/002",
    namaDokumen: "Berita Acara Serah Terima Dokumen Perencanaan",
    kategori: "Tata Usaha",
    tanggalArsip: new Date("2024-12-28"),
    driveFileId: "demo-tu-002",
    driveWebViewLink: "https://drive.google.com/file/d/demo-tu-002/view",
  },
  {
    nomorDokumen: "003/TU/2025/001",
    namaDokumen: "SK Pembentukan Tim Penyusun LKjip Tahun 2025",
    kategori: "Tata Usaha",
    tanggalArsip: new Date("2025-02-05"),
    driveFileId: "demo-tu-003",
    driveWebViewLink: "https://drive.google.com/file/d/demo-tu-003/view",
  },
  // ── Notulensi ──
  {
    nomorDokumen: "001/NT/2024/001",
    namaDokumen: "Notulensi Rapat Koordinasi Perencanaan Januari 2024",
    kategori: "Notulensi",
    tanggalArsip: new Date("2024-01-25"),
    driveFileId: "demo-nt-001",
    driveWebViewLink: "https://drive.google.com/file/d/demo-nt-001/view",
  },
  {
    nomorDokumen: "002/NT/2024/002",
    namaDokumen: "Notulensi Rapat Evaluasi Kinerja Semester II 2024",
    kategori: "Notulensi",
    tanggalArsip: new Date("2024-12-20"),
    driveFileId: "demo-nt-002",
    driveWebViewLink: "https://drive.google.com/file/d/demo-nt-002/view",
  },
  {
    nomorDokumen: "003/NT/2025/001",
    namaDokumen: "Notulensi Musrenbang Dukcapil Kab. Ngada 2025",
    kategori: "Notulensi",
    tanggalArsip: new Date("2025-03-10"),
    driveFileId: "demo-nt-003",
    driveWebViewLink: "https://drive.google.com/file/d/demo-nt-003/view",
  },
  {
    nomorDokumen: "004/NT/2025/002",
    namaDokumen: "Notulensi Rapat Pembahasan RKA 2025",
    kategori: "Notulensi",
    tanggalArsip: new Date("2025-02-18"),
    driveFileId: "demo-nt-004",
    driveWebViewLink: "https://drive.google.com/file/d/demo-nt-004/view",
  },
];

export async function POST() {
  try {
    const existingCount = await db.arsipDokumen.count();
    if (existingCount > 0) {
      return NextResponse.json({
        message: "Database already has data. Seed skipped.",
        count: existingCount,
      });
    }

    const result = await db.arsipDokumen.createMany({
      data: SAMPLE_DATA,
    });

    await logActivity(
      "IMPORT",
      `${result.count} dokumen seed`,
      "Data contoh Bagian Perencanaan Dukcapil Kab. Ngada",
    );

    return NextResponse.json({
      message: `${result.count} dokumen contoh berhasil ditambahkan.`,
      count: result.count,
    });
  } catch (error) {
    console.error("Error seeding data:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan data contoh" },
      { status: 500 }
    );
  }
}