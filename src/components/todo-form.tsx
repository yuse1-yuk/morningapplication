/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { formatISO, addDays } from "date-fns";
import { useEffect, useState } from "react";

type Todo = { id: number; text: string; target_date: string };

export function TodoForm() {
  const [text, setText] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/todos", { cache: "no-store" });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setTodos(data.todos ?? []);
    } catch (err) {
      console.error(err);
      setError("タスクの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Compute default date on client to avoid SSR/CSR mismatch
    setTargetDate(formatISO(addDays(new Date(), 1), { representation: "date" }));
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, target_date: targetDate }),
      });
      if (!res.ok) throw new Error("failed");
      setText("");
      setMessage("保存しました");
      load();
    } catch (err) {
      console.error(err);
      setError("保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    await fetch(`/api/todos?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={submit}
        className="rounded-3xl border border-white/10 bg-white/10 p-5 text-white shadow-xl backdrop-blur-xl"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">明日のタスクを追加</h2>
          {message && <p className="text-xs text-emerald-200">{message}</p>}
          {error && <p className="text-xs text-red-200">{error}</p>}
        </div>
        <p className="text-sm text-white/70">デフォルトは翌日の日付です。</p>
        <div className="mt-3 space-y-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="タスク内容"
            className="w-full rounded-2xl border border-white/15 bg-white/10 p-3 text-sm text-white outline-none ring-2 ring-transparent focus:ring-white/30"
          />
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full rounded-2xl border border-white/15 bg-white/10 p-3 text-sm text-white outline-none ring-2 ring-transparent focus:ring-white/30"
          />
          <button
            type="submit"
            className="w-full rounded-2xl bg-white py-3 text-sm font-semibold text-slate-900 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            disabled={saving}
          >
            {saving ? "保存中..." : "追加"}
          </button>
        </div>
      </form>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-white shadow-xl backdrop-blur-xl">
        <h3 className="text-lg font-semibold">今日以降のタスク</h3>
        {loading && <p className="text-sm text-white/70">読み込み中...</p>}
        {!loading && todos.length === 0 && (
          <p className="text-sm text-white/70">登録されたタスクはありません。</p>
        )}
        {error && <p className="text-sm text-red-200 mt-2">{error}</p>}
        <ul className="mt-3 space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm"
            >
              <div>
                <p>{todo.text}</p>
                <p className="text-xs text-white/60">{todo.target_date}</p>
              </div>
              <button
                onClick={() => remove(todo.id)}
                className="text-[11px] text-white/60 hover:text-white"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
