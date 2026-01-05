import { CalendarCard } from "@/components/calendar-card";
import { LiveClock } from "@/components/live-clock";
import { MemoCard } from "@/components/memo-card";
import { NavBar } from "@/components/nav";
import { NewsCard } from "@/components/news-card";
import { TodoCard } from "@/components/todo-card";
import { WeatherCard } from "@/components/weather-card";

const nudges = [
  "5分だけストレッチする",
  "朝の水分補給を忘れずに",
  "最重要タスクを1つだけ決める",
];

export default function Home() {
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6 sm:px-6 sm:py-8">
        <NavBar />
        <header className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.24em] text-white/70">
              StartAM
            </p>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              おはようございます
            </h1>
            <p className="text-sm text-white/70">
              天気と予定をワンビューで。家を出る前に迷わない朝を。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80">
              位置情報で天気を取得
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80">
              Googleカレンダー連携
            </span>
          </div>
        </header>

        <main className="grid gap-5 sm:gap-6 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-white/90 shadow-lg backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="space-y-2">
                <LiveClock />
                <p className="text-sm text-white/70">
                  今日をどう使うか、ここから決めましょう。
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 text-left sm:items-end sm:text-right">
                <span className="text-xs uppercase tracking-[0.2em] text-white/60">
                  朝のヒント
                </span>
                <ul className="space-y-1 text-sm text-white/80">
                  {nudges.map((tip) => (
                    <li key={tip} className="flex items-center gap-2">
                      <span className="text-white/60">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <WeatherCard />
            <TodoCard />
            <NewsCard />
          </div>

          <div className="flex flex-col gap-4">
            <CalendarCard />
            <MemoCard />
          </div>
        </main>
      </div>
    </div>
  );
}
