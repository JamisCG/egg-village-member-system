# 蛋匠村智慧會員系統 V3

## 內容
- React + Vite
- LINE LIFF Login
- 會員資料表單
- Cloudflare Worker API
- Cloudflare D1 資料庫
- 行為事件追蹤
- 購物車／優惠券／集點／蛋知識入口預留

## GitHub 上傳
將解壓後所有檔案與資料夾直接上傳至：
`JamisCG/egg-village-member-system`

根目錄應看到：
- package.json
- vite.config.js
- wrangler.jsonc
- index.html
- README.md
- src
- worker
- migrations
- public

## Cloudflare 部署
組建命令：
`npm run deploy`

## 必要環境變數
在 Cloudflare Worker 的「設定 → 變數與祕密」新增：
- `LINE_LOGIN_CHANNEL_ID`：LINE Login Channel ID
- 建議之後再新增管理後台金鑰

## D1
1. 建立 D1，名稱：`egg-village-db`
2. 複製 Database ID
3. 編輯 `wrangler.jsonc`，取消 d1_databases 註解並貼上 ID
4. 在 D1 SQL Console 執行 `migrations/0001_initial.sql`

## LINE Developers
Endpoint URL 設為 Cloudflare 部署網址。
LIFF Scope：
- profile
- openid
- chat_message.write

LIFF URL：
`https://liff.line.me/2010756755-A26rfpUz`
