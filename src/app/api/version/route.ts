import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    version: "v2-supabase-storage",
    timestamp: new Date().toISOString(),
    storage: "supabase-storage",
  });
}