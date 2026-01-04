import { NextRequest, NextResponse } from "next/server";

import { createOAuthClient, parseTokens } from "@/lib/google";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/?calendarAuth=missing", origin));
  }

  try {
    const client = createOAuthClient();
    const { tokens } = await client.getToken(code);

    const existing = parseTokens(request.cookies.get("g_tokens")?.value) ?? {};
    const merged = { ...existing, ...tokens };

    const response = NextResponse.redirect(new URL("/", origin));
    response.cookies.set({
      name: "g_tokens",
      value: JSON.stringify(merged),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL("/?calendarAuth=failed", origin));
  }
}
