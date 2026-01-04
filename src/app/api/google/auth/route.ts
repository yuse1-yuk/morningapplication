import { NextRequest, NextResponse } from "next/server";

import { buildAuthUrl, parseTokens } from "@/lib/google";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
      console.error("Missing Google env vars:", {
        GOOGLE_CLIENT_ID: Boolean(process.env.GOOGLE_CLIENT_ID),
        GOOGLE_CLIENT_SECRET: Boolean(process.env.GOOGLE_CLIENT_SECRET),
        GOOGLE_REDIRECT_URI: Boolean(process.env.GOOGLE_REDIRECT_URI),
      });
    }

    const existingTokens = parseTokens(request.cookies.get("g_tokens")?.value);
    if (existingTokens) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const url = buildAuthUrl();
    return NextResponse.redirect(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "設定エラー";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
