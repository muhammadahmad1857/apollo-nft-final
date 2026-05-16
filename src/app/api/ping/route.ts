import { NextResponse } from "next/server";

export async function HEAD() {
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
