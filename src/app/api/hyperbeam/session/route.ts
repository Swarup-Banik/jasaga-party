import { NextRequest, NextResponse } from "next/server";
import { getOrCreateHyperbeamSession } from "@/lib/hyperbeam";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const roomId = body.roomId;
    const startUrl = body.startUrl || process.env.NEXT_PUBLIC_DEFAULT_START_URL || "https://www.youtube.com";

    if (!roomId || typeof roomId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid roomId parameter" },
        { status: 400 }
      );
    }

    const sessionData = await getOrCreateHyperbeamSession(roomId, startUrl);
    return NextResponse.json(sessionData);
  } catch (err) {
    console.error("Session route handler error:", err);
    return NextResponse.json(
      { error: "Internal server error creating session" },
      { status: 500 }
    );
  }
}
