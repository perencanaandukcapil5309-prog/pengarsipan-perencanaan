import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: logs, error } = await supabase
      .from("ActivityLog")
      .select("*")
      .order("createdAt", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Supabase error fetching activity log:", error);
      return NextResponse.json(
        { error: "Gagal mengambil log aktivitas" },
        { status: 500 }
      );
    }

    return NextResponse.json({ logs: logs ?? [] });
  } catch (error) {
    console.error("Error fetching activity log:", error);
    return NextResponse.json(
      { error: "Gagal mengambil log aktivitas" },
      { status: 500 }
    );
  }
}