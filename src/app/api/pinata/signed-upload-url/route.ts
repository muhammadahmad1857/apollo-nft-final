import { NextResponse } from "next/server";

export async function POST() {
  // Auth is handled server-side by /api/pinata/tus proxy.
  // The client never sees PINATA_JWT.
  return NextResponse.json({
    data: {
      url: "/api/pinata/tus",
      token: "",
    },
  });
}
