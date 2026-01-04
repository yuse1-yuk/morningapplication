# Morning Brief
朝起きてすぐ、天気・今日のToDo・Googleカレンダー予定・ニュース(Gemini要約)をまとめて確認できるダッシュボード。Next.js + App Router + Tailwind v4 + SQLite (better-sqlite3)。

## 実行手順
1. 依存インストール: `npm install`
2. 環境変数: `.env.example` をコピーして `.env.local` を作成し、キーを埋める  
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI`: カレンダーOAuth  
   - `DATABASE_URL`（または `NEON_DATABASE_URL`）: Postgres の接続文字列  
   - `NEWS_API_KEY`: NewsAPI.org の API キー（任意：Google News RSSが0件のときのフォールバック）  
   - `WEATHER_DEFAULT_LAT` / `WEATHER_DEFAULT_LON`: 位置情報拒否時の緯度・経度（デフォルト東京）  
   - `NEXT_TELEMETRY_DISABLED=1`: Telemetry無効化（任意）
3. 起動: `npm run dev` → `http://localhost:3000`

## 画面
- `/` Home: 天気・今日のToDo・今日のGoogleカレンダー・Gemini要約付きニュース＋ローカルメモ  
- `/todo`: 「明日やること」を登録（target_date初期値は翌日）、今日以降の一覧/削除  
- `/settings`: ニュース用キーワードの追加/削除。環境変数のヒントも表示。

## 機能
- 天気: Geolocation API → `/api/weather` → Open-Meteo。拒否時は環境変数のデフォルト座標で取得。  
- ToDo: `/api/todos` でSQLite永続化（better-sqlite3）。Homeは今日のタスクのみ表示。  
- Googleカレンダー: `/api/google/auth` → OAuth 同意 → `g_tokens` Cookie に保存 → `/api/calendar` で当日予定を取得。未連携時はカード内に案内。  
- ニュース+Gemini: `/api/keywords` でキーワード管理 → `/api/news` が NewsAPI から記事取得 → Gemini API に投げて日本語箇条書き要約を生成。  
- メモ: ローカルストレージに保存（サーバー送信なし）。

## PWA
- `src/app/manifest.ts` / `public/sw.js` / 各アイコン同梱。  
- 開発時は `http://localhost:3000` をスマホで開き「ホーム画面に追加」でインストール可能（iOS Safari も可）。  
- 本番は HTTPS 配信してください。

## 外部APIキーのエラー表示
- APIキーやOAuth未設定時、各カード/エンドポイントでわかりやすいエラーメッセージを返します（例: カレンダー未連携、ニュースAPI未設定など）。
