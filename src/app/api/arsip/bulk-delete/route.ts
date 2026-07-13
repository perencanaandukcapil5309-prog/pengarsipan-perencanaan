import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "ids harus berupa array string yang tidak kosong" },
        { status: 400 }
      );
    }

    if (!ids.every((id: unknown) => typeof id === "string")) {
      return NextResponse.json(
        { error: "Setiap id harus berupa string" },
        { status: 400 }
      );
    }

    const { deleteFileFromDrive } = await import("@/lib/google-drive");

    let deletedCount = 0;

    for (const id of ids) {
      try {
        const { data: arsip, error: findError } = await supabase
          .from("ArsipDokumen")
          .select("*")
          .eq("id", id)
          .single();

        if (findError || !arsip) {
          console.warn(`Arsip dengan id '${id}' tidak ditemukan, dilewati.`);
          continue;
        }

        try {
          await deleteFileFromDrive(arsip.driveFileId);
        } catch (driveError) {
          console.error(
            `Gagal menghapus file dari Google Drive untuk id '${id}':`,
            driveError
          );
        }

        const { error: deleteError } = await supabase
          .from("ArsipDokumen")
          .delete()
          .eq("id", id);

        if (deleteError) {
          console.error(`Gagal menghapus arsip dengan id '${id}':`, deleteError);
        } else {
          deletedCount++;
        }
      } catch (error) {
        console.error(`Gagal menghapus arsip dengan id '${id}':`, error);
      }
    }

    await logActivity("BULK_DELETE", `${deletedCount} arsip`, `Penghapusan massal ${ids.length} item`);

    return NextResponse.json({
      message: `${deletedCount} arsip berhasil dihapus`,
      deletedCount,
    });
  } catch (error) {
    console.error("Error bulk deleting arsip:", error);
    return NextResponse.json(
      { error: "Gagal menghapus arsip secara massal" },
      { status: 500 }
    );
  }
}