import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID wajib disertakan" }, { status: 400 });
    }

    const { data: arsip, error } = await supabase
      .from("ArsipDokumen")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !arsip) {
      return NextResponse.json({ error: "Arsip tidak ditemukan" }, { status: 404 });
    }

    // Only redirect to Google Drive link
    if (arsip.driveWebViewLink) {
      return NextResponse.redirect(arsip.driveWebViewLink);
    }
    return NextResponse.json({ error: "Link dokumen tidak tersedia" }, { status: 404 });
  } catch (error) {
    console.error("Error serving file:", error);
    return NextResponse.json({ error: "Gagal mengambil file" }, { status: 500 });
  }
}