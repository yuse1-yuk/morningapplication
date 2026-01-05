import { formatISO, startOfToday, subDays } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

import { listKeywords } from "@/lib/db";

const NEWS_API_KEY = process.env.NEWS_API_KEY;

type Article = {
  title: string;
  description?: string;
  url?: string;
  publishedAt?: string;
  sourceName?: string;
  sourceUrl?: string;
};

export async function GET(request: NextRequest) {
  try {
    const userEmail = request.cookies.get("g_user_email")?.value;
    if (!userEmail) {
      return NextResponse.json(
        { error: "not_authenticated" },
        { status: 401 }
      );
    }

    const keywords = await listKeywords(userEmail);
    if (keywords.length === 0) {
      return NextResponse.json({
        articles: [],
        note: "キーワードが登録されていません。",
      });
    }

    const q = keywords.map((k) => k.keyword).join(" OR ");
    // Prefer Japanese sources via Google News RSS (no API key, JP-centric)
    const from = formatISO(subDays(startOfToday(), 7), { representation: "date" });
    const primaryUrl = buildGoogleNewsRssUrl(q);

    type NewsApiArticle = {
      source?: { id?: string | null; name?: string };
      title?: string;
      description?: string;
      url?: string;
      publishedAt?: string;
    };

    let articles = await fetchGoogleNewsRssArticles(primaryUrl);

    // Optional fallback to NewsAPI if RSS yields nothing and key is configured
    if (articles.length === 0 && NEWS_API_KEY) {
      const fallbackUrl = new URL("https://newsapi.org/v2/everything");
      fallbackUrl.searchParams.set("q", q);
      fallbackUrl.searchParams.set("language", "ja");
      fallbackUrl.searchParams.set("from", from);
      fallbackUrl.searchParams.set("sortBy", "publishedAt");
      fallbackUrl.searchParams.set("pageSize", "10");

      const res = await fetch(fallbackUrl.toString(), {
        headers: { "X-Api-Key": NEWS_API_KEY },
        next: { revalidate: 300 },
      });

      if (res.ok) {
        const json = await res.json();
        articles = (json.articles ?? []).map((a: NewsApiArticle) => ({
          title: a.title ?? "",
          description: a.description,
          url: a.url,
          publishedAt: a.publishedAt,
          sourceName: a.source?.name,
        }));
      } else {
        console.error("NewsAPI error", await res.text());
      }
    }

    const note = articles.length === 0 ? "記事がありません。" : undefined;
    return NextResponse.json({ articles, note });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "ニュースの処理に失敗しました" },
      { status: 500 }
    );
  }
}

function buildGoogleNewsRssUrl(query: string) {
  const url = new URL("https://news.google.com/rss/search");
  // JP sources + Japanese UI
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "ja");
  url.searchParams.set("gl", "JP");
  url.searchParams.set("ceid", "JP:ja");
  return url;
}

async function fetchGoogleNewsRssArticles(url: URL): Promise<Article[]> {
  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) {
    console.error("Google News RSS error", await res.text());
    return [];
  }

  const xml = await res.text();
  return parseRssItems(xml).slice(0, 10);
}

function parseRssItems(xml: string): Article[] {
  // Lightweight RSS parsing (Google News RSS is stable enough for this)
  const items: Article[] = [];
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

  for (const block of itemBlocks) {
    const title = decodeXmlText(extractTag(block, "title") ?? "").trim();
    const link = decodeXmlText(extractTag(block, "link") ?? "").trim();
    const publishedAt = decodeXmlText(extractTag(block, "pubDate") ?? "").trim();
    const descriptionRaw = decodeXmlText(
      extractTag(block, "description") ?? ""
    ).trim();
    const description = stripHtml(descriptionRaw).trim();
    const source = extractSource(block);

    if (!title) continue;
    items.push({
      title,
      url: link || undefined,
      publishedAt: publishedAt || undefined,
      description: description || undefined,
      sourceName: source?.name,
      sourceUrl: source?.url,
    });
  }

  return items;
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ");
}

function extractSource(xml: string): { name: string; url?: string } | null {
  // Google News RSS includes <source url="https://example.com">Publisher</source>
  const re = /<source\b([^>]*)>([\s\S]*?)<\/source>/i;
  const m = xml.match(re);
  if (!m) return null;

  const attrs = m[1] ?? "";
  const name = decodeXmlText(m[2] ?? "").trim();
  const urlMatch = attrs.match(/\burl="([^"]+)"/i);
  const url = urlMatch ? decodeXmlText(urlMatch[1]).trim() : undefined;

  if (!name) return null;
  return { name, url };
}

function extractTag(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(re);
  if (!m) return null;
  return m[1]
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .trim();
}

function decodeXmlText(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}
