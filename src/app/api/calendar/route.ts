import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

import { createOAuthClient, parseTokens } from "@/lib/google";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const rawTokens = request.cookies.get("g_tokens")?.value;
  const tokens = parseTokens(rawTokens);

  if (!tokens) {
    console.warn("Calendar: missing or invalid g_tokens cookie");
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  try {
    const client = createOAuthClient();
    client.setCredentials(tokens);

    const calendar = google.calendar({ version: "v3", auth: client });
    // Use JST boundaries regardless of server timezone to avoid "no events" issues.
    const { timeMin, timeMax } = getTodayWindowInJst();

    const { data } = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      timeZone: "Asia/Tokyo",
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 15,
    });

    const events =
      data.items?.map((item) => ({
        id: item.id ?? `${item.start?.date ?? item.start?.dateTime}-${item.summary}`,
        summary: item.summary ?? "（無題）",
        start: item.start?.dateTime ?? item.start?.date ?? "",
        end: item.end?.dateTime ?? item.end?.date ?? "",
        allDay: Boolean(item.start?.date),
        location: item.location ?? undefined,
      })) ?? [];

    return NextResponse.json({ events });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "カレンダーの取得に失敗しました" },
      { status: 500 }
    );
  }
}

function getTodayWindowInJst() {
  const now = new Date();
  const today = getJstYmd(now);
  const tomorrow = getJstYmd(new Date(now.getTime() + 24 * 60 * 60 * 1000));

  // RFC3339 with timezone offset (+09:00). Note: timeMax is exclusive.
  return {
    timeMin: `${today.y}-${today.m}-${today.d}T00:00:00+09:00`,
    timeMax: `${tomorrow.y}-${tomorrow.m}-${tomorrow.d}T00:00:00+09:00`,
  };
}

function getJstYmd(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return { y, m, d };
}
