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

    // 追加: ユーザー情報を取得し、メールアドレスを保存
    let userEmail: string | undefined;
    // 1) id_token から email を取り出す（最速）
    if (!userEmail && tokens.id_token) {
      userEmail = extractEmailFromIdToken(tokens.id_token);
    }
    // 2) access_token で userinfo API を呼ぶ（fallback）
    if (!userEmail && tokens.access_token) {
      try {
        const userInfoRes = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          }
        );
        if (userInfoRes.ok) {
          const profile = await userInfoRes.json();
          userEmail = profile?.email;
        } else {
          console.error("Failed to fetch userinfo", await userInfoRes.text());
        }
      } catch (err) {
        console.error("userinfo error", err);
      }
    }

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
    if (userEmail) {
      response.cookies.set({
        name: "g_user_email",
        value: userEmail,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL("/?calendarAuth=failed", origin));
  }
}

function extractEmailFromIdToken(idToken: string): string | undefined {
  try {
    const [, payload] = idToken.split(".");
    if (!payload) return undefined;
    const json = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    );
    return json?.email as string | undefined;
  } catch (err) {
    console.error("id_token decode error", err);
    return undefined;
  }
}
