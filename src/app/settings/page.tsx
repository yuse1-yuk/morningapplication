import { Suspense } from "react";

import { NavBar } from "@/components/nav";
import { NewsKeywordsForm } from "@/components/news-keywords-form";
import { LogoutButton } from "@/components/logout-button";
import { LogoutNotice } from "@/components/logout-notice";

export default function SettingsPage() {
  return (
    <div className="min-h-screen text-white">
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6 sm:px-6 sm:py-8">
        <NavBar />
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.24em] text-white/70">
            Settings
          </p>
          <h1 className="text-3xl font-semibold">キーワードと連携設定</h1>
          <p className="text-sm text-white/70">
            ニュース検索のキーワードを管理できます。Googleカレンダーの連携はホーム画面から行えます。
          </p>
        </header>
        <Suspense fallback={null}>
          <LogoutNotice />
        </Suspense>
        <NewsKeywordsForm />
        <div className="flex justify-end">
          <LogoutButton />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
          <p className="font-semibold text-white">環境変数（サーバー再起動後に反映）</p>
          <ul className="mt-2 space-y-1">
            <li>WEATHER_DEFAULT_LAT / WEATHER_DEFAULT_LON: 位置情報が拒否された場合の緯度・経度（未設定なら東京周辺）。</li>
            <li>NEWS_API_KEY: NewsAPI のキー（任意：フォールバック用）。</li>
            <li>GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI: カレンダー用OAuth。</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
