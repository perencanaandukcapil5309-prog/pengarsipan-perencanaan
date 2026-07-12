import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const SAMPLE_DATA = [
  {
    nomorDokumen: "001/KEP/2024/001",
    namaDokumen: "Surat Keterangan Domisili - Ahmad Fauzi",
    kategori: "Kependudukan",
    tanggalArsip: new Date("2024-12-05"),
    driveFileId: "demo-kep-001",
    driveWebViewLink: "https://drive.google.com/file/d/demo-kep-001/view",
  },
  {
    nomorDokumen: "002/KEP/2024/002",
    namaDokumen: "Kartu Keluarga Digital - Siti Rahayu",
    kategori: "Kependudukan",
    tanggalArsip: new Date("2024-12-10"),
    driveFileId: "demo-kep-002",
    driveWebViewLink: "https://drive.google.com/file/d/demo-kep-002/view",
  },
  {
    nomorDokumen: "003/KEP/2024/003",
    namaDokumen: "Akta Kelahiran - Budi Santoso",
    kategori: "Kependudukan",
    tanggalArsip: new Date("2025-01-15"),
    driveFileId: "demo-kep-003",
    driveWebViewLink: "https://drive.google.com/file/d/demo-kep-003/view",
  },
  {
    nomorDokumen: "001/PEG/2024/001",
    namaDokumen: "Surat Keputusan Pengangkatan - Dewi Lestari",
    kategori: "Kepegawaian",
    tanggalArsip: new Date("2024-11-20"),
    driveFileId: "demo-peg-001",
    driveWebViewLink: "https://drive.google.com/file/d/demo-peg-001/view",
  },
  {
    nomorDokumen: "002/PEG/2024/002",
    namaDokumen: "SK Kenaikan Pangkat Periode Januari 2025",
    kategori: "Kepegawaian",
    tanggalArsip: new Date("2025-01-02"),
    driveFileId: "demo-peg-002",
    driveWebViewLink: "https://drive.google.com/file/d/demo-peg-002/view",
  },
  {
    nomorDokumen: "003/PEG/2025/001",
    namaDokumen: "Surat Izin Cuti Tahunan - Rahmat Hidayat",
    kategori: "Kepegawaian",
    tanggalArsip: new Date("2025-02-14"),
    driveFileId: "demo-peg-003",
    driveWebViewLink: "https://drive.google.com/file/d/demo-peg-003/view",
  },
  {
    nomorDokumen: "001/SIAK/2024/001",
    namaDokumen: "Izin Mendirikan Bangunan - CV Maju Bersama",
    kategori: "SIAK",
    tanggalArsip: new Date("2024-10-15"),
    driveFileId: "demo-siak-001",
    driveWebViewLink: "https://drive.google.com/file/d/demo-siak-001/view",
  },
  {
    nomorDokumen: "002/SIAK/2024/002",
    namaDokumen: "Surat Izin Usaha Perdagangan - Toko Sejahtera",
    kategori: "SIAK",
    tanggalArsip: new Date("2024-12-28"),
    driveFileId: "demo-siak-002",
    driveWebViewLink: "https://drive.google.com/file/d/demo-siak-002/view",
  },
  {
    nomorDokumen: "001/UM/2024/001",
    namaDokumen: "Surat Pemberitahuan Kegiatan Masyarakat",
    kategori: "Umum",
    tanggalArsip: new Date("2024-09-10"),
    driveFileId: "demo-um-001",
    driveWebViewLink: "https://drive.google.com/file/d/demo-um-001/view",
  },
  {
    nomorDokumen: "002/UM/2024/002",
    namaDokumen: "Laporan Pertanggungjawaban Kegiatan Qurban 1446 H",
    kategori: "Umum",
    tanggalArsip: new Date("2025-01-20"),
    driveFileId: "demo-um-002",
    driveWebViewLink: "https://drive.google.com/file/d/demo-um-002/view",
  },
  {
    nomorDokumen: "003/UM/2025/001",
    namaDokumen: "Notulensi Rapat Koordinasi Bulanan Maret 2025",
    kategori: "Umum",
    tanggalArsip: new Date("2025-03-05"),
    driveFileId: "demo-um-003",
    driveWebViewLink: "https://drive.google.com/file/d/demo-um-003/view",
  },
  {
    nomorDokumen: "004/KEP/2025/001",
    namaDokumen: "Surat Pindah Domisili - Andi Prasetyo",
    kategori: "Kependudukan",
    tanggalArsip: new Date("2025-03-12"),
    driveFileId: "demo-kep-004",
    driveWebViewLink: "https://drive.google.com/file/d/demo-kep-004/view",
  },
  {
    nomorDokumen: "003/SIAK/2025/001",
    namaDokumen: "NIB - PT Digital Nusantara Mandiri",
    kategori: "SIAK",
    tanggalArsip: new Date("2025-02-20"),
    driveFileId: "demo-siak-003",
    driveWebViewLink: "https://drive.google.com/file/d/demo-siak-003/view",
  },
  {
    nomorDokumen: "004/PEG/2025/001",
    namaDokumen: "SK Mutasi Pegawai - Lingkungan Dinas Pendidikan",
    kategori: "Kepegawaian",
    tanggalArsip: new Date("2025-03-01"),
    driveFileId: "demo-peg-004",
    driveWebViewLink: "https://drive.google.com/file/d/demo-peg-004/view",
  },
  {
    nomorDokumen: "005/KEP/2025/001",
    namaDokumen: "Surat Keterangan Tidak Mampu - Rina Wati",
    kategori: "Kependudukan",
    tanggalArsip: new Date("2025-03-18"),
    driveFileId: "demo-kep-005",
    driveWebViewLink: "https://drive.google.com/file/d/demo-kep-005/view",
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

    return NextResponse.json({
      message: `${result.count} sample documents seeded successfully.`,
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