import { NextResponse } from "next/server";

export async function GET() {
  const b64 = process.env.GOOGLE_PRIVATE_KEY_B64;
  if (!b64) return NextResponse.json({ error: "GOOGLE_PRIVATE_KEY_B64 not set" });
  
  const decoded = Buffer.from(b64, 'base64').toString('utf-8');
  const lines = decoded.split('\n');
  
  return NextResponse.json({
    b64Length: b64.length,
    decodedLength: decoded.length,
    lineCount: lines.length,
    firstLine: lines[0]?.substring(0, 30),
    lastLine: lines[lines.length - 1]?.substring(0, 30),
    hasLiteralBackslashN: decoded.includes('\\n'),
    hasRealNewline: decoded.includes('\n'),
    firstBytes: Array.from(decoded.slice(0, 20)).map(c => c.charCodeAt(0)),
    email: process.env.GOOGLE_CLIENT_EMAIL,
    folder: process.env.GOOGLE_DRIVE_FOLDER_ID,
  });
}
