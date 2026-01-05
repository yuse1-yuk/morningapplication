/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from "react";

type Keyword = { id: number; keyword: string };

export function NewsKeywordsForm() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    const res = await fetch("/api/keywords", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        setError("Google連携後に設定できます。");
        setKeywords([]);
        return;
      }
      setError("読み込みに失敗しました");
      return;
    }
    setKeywords(data.keywords ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessage(null);
    setError(null);
    const res = await fetch("/api/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: input }),
    });
    if (!res.ok) {
      setError(
        res.status === 401 ? "Google連携後に設定できます。" : "追加に失敗しました"
      );
      return;
    }
    setInput("");
    setMessage("追加しました");
    load();
  };

  const remove = async (id: number) => {
    setMessage(null);
    setError(null);
    await fetch(`/api/keywords?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-white shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">ニュース検索キーワード</h2>
        {message && <p className="text-xs text-emerald-200">{message}</p>}
        {error && <p className="text-xs text-red-200">{error}</p>}
      </div>
      <p className="text-sm text-white/70">Gemini要約の対象になる記事を絞り込みます。</p>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="例: AI, テクノロジー"
          className="flex-1 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none ring-2 ring-transparent focus:ring-white/30"
        />
        <button
          type="submit"
          className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          追加
        </button>
      </form>

      <ul className="mt-4 space-y-2">
        {keywords.map((k) => (
          <li
            key={k.id}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm"
          >
            <span>{k.keyword}</span>
            <button
              onClick={() => remove(k.id)}
              className="text-[11px] text-white/60 hover:text-white"
            >
              削除
            </button>
          </li>
        ))}
        {keywords.length === 0 && (
          <p className="text-sm text-white/70">キーワードがありません。</p>
        )}
      </ul>
    </div>
  );
}
