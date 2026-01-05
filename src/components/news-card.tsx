'use client';

import { useEffect, useState } from "react";

export function NewsCard() {
  const [articles, setArticles] = useState<
    Array<{
      title: string;
      url?: string;
      publishedAt?: string;
      sourceName?: string;
      sourceUrl?: string;
    }>
  >([]);
  const [note, setNote] = useState<string>("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [error, setError] = useState<string | null>(null);
  const [authNeeded, setAuthNeeded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/news", { cache: "no-store" });
        const data = await res.json();
        if (res.status === 401) {
          setAuthNeeded(true);
          setStatus("error");
          return;
        }
        if (!res.ok) throw new Error(data.error ?? "failed");
        setArticles(data.articles ?? []);
        setNote(data.note ?? "");
        setStatus("ready");
      } catch (err) {
        console.error(err);
        setError(
          "ニュースの取得に失敗しました。キーワード設定やAPIキーを確認してください。"
        );
        setStatus("error");
      }
    };
    load();
  }, []);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-4 text-white shadow-xl backdrop-blur-xl sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/60">
            News
          </p>
          <h3 className="text-lg font-semibold">話題のニュース</h3>
        </div>
      </div>
      {status === "loading" && <p className="text-sm text-white/70">読み込み中...</p>}
      {status === "error" && (
        <p className="text-sm text-red-100">
          {authNeeded
            ? "Google連携後にニュースとキーワードが表示されます。"
            : error}
        </p>
      )}
      {status === "ready" && (
        <>
          {note && (
            <p className="text-sm text-white/70">
              {note || "キーワードを設定してください。"}
            </p>
          )}
          <div className="mt-4 space-y-2">
            {articles.map((a, idx) => (
              <article
                key={`${idx}-${a.title}`}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/60">
                  <a
                    href={a.sourceUrl ?? a.url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-white/20 underline-offset-2 hover:text-white/80"
                  >
                    {a.sourceName ?? "情報源"}
                  </a>
                  {a.publishedAt && (
                    <span className="text-white/50">{formatJpDate(a.publishedAt)}</span>
                  )}
                </div>
                <a
                  href={a.url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm font-semibold leading-snug text-white/90 hover:text-white"
                >
                  {a.title}
                </a>
              </article>
            ))}
            {articles.length === 0 && (
              <p className="text-sm text-white/70">記事がありません。</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function formatJpDate(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
