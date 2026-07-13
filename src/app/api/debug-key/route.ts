import { NextResponse } from "next/server";

export async function GET() {
  const b64 = process.env.GOOGLE_PRIVATE_KEY_B64;
  const test = process.env.TEST_VAR;
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  return NextResponse.json({
    testVar: test || "NOT SET",
    b64Set: !!b64,
    b64Length: b64?.length || 0,
    b64First20: b64?.substring(0, 20) || "N/A",
    supabaseSet: !!supabase,
    supabaseLength: supabase?.length || 0,
    email: process.env.GOOGLE_CLIENT_EMAIL,
    folder: process.env.GOOGLE_DRIVE_FOLDER_ID,
  });
}
