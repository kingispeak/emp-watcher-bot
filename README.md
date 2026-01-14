# EMP Watcher Bot 🚀

[![Node.js CI](https://github.com/kingispeak/emp-watcher-bot/actions/workflows/node.js.yml/badge.svg)](https://github.com/kingispeak/emp-watcher-bot/actions/workflows/node.js.yml)

這是一個基於 Node.js 開發的自動化網頁監控工具。它能定時掃描目標網頁的名單圖片，當偵測到變動時，透過 **Sharp** 強化影像品質，並使用 **Tesseract.js** 進行 OCR 文字辨識，最後將結果推送到 **Telegram** 與 **LINE**。

---

## 🌟 核心功能

- **自動監控**：使用 `node-cron` 實現定時抓取（預設每 10 分鐘）。
- **變動偵測**：透過 MD5 Hash 比對圖片內容，僅在內容更新時觸發辨識。
- **影像強化**：利用 `sharp` 進行二值化、灰階及放大處理，大幅提升文字辨識準確度。
- **OCR 辨識**：自動辨識圖片內的繁體中文名單。
- **多平台通知**：整合 Telegram Bot API 與 LINE Messaging API (直接透過 Axios 調用)。
- **穩健運行**：搭配 PM2 進行行程管理，支援當機自動重啟與日誌紀錄。
- **品質保證**：內建 Jest 單元測試與 GitHub Actions CI 流程。

---

## 🛠 技術棧

- **Runtime**: Node.js
- **Scraping**: Axios, Cheerio
- **Image Process**: Sharp
- **OCR Engine**: Tesseract.js
- **Process Manager**: PM2
- **Testing**: Jest
- **CI/CD**: GitHub Actions

---

## 🚀 快速開始

### 1. 安裝環境
確保你的環境已安裝 Node.js (v18+) 與 npm。

```bash
# 下載專案
git clone <your-repo-url>
cd emp-watcher-bot

# 安裝必要套件
npm install
```

### 2. 環境變數設定
在根目錄複製 `cp .env.example .env` 檔案，並填入相關資訊（請勿將此檔案上傳至 GitHub）：

```env
# 監控目標網址
TARGET_URL=https://example.com
CRON_SCHEDULE="*/10 * * * *"

# Telegram
TG_TOKEN=your_bot_token
TG_CHAT_ID=your_chat_id

# LINE
LINE_ACCESS_TOKEN=your_channel_access_token
LINE_USER_ID=your_user_id
```

### 3. 執行指令說明

- `npm run dev` 開發模式執行 (於終端機顯示日誌)
- `npm run test` npm test 執行單元測試 (Jest)
- `npm run start` 啟動 PM2 背景服務
- `npm run status` 查看服務運行狀態
- `npm run logs` 查看即時輸出日誌
- `npm run restart` 重新啟動服務
- `npm run stop` 停止 PM2 服務
- `npm run delete` 從 PM2 清單中移除專案

### 4. 專案結構

```
├── __tests__/           # 單元測試案例 (Jest)
├── downloads/           # 暫存原始圖片與處理後的圖片 (已由 git 忽略)
├── logs/                # PM2 運行日誌檔案 (已由 git 忽略)
├── .env                 # 敏感環境變數 (已由 git 忽略)
├── .gitignore           # Git 忽略清單
├── config.js            # 環境變數與設定管理中心
├── utils.js             # 影像處理、Hash 與 OCR 清洗工具函數
├── notifier.js          # Telegram 與 LINE API 發送邏輯
├── index.js             # 程式主入口：負責排程與監控流程
├── ecosystem.config.js  # PM2 設定檔
└── last_hash.txt        # 紀錄上次比對的圖片 Hash
```

### 5. 自動化測試與 CI

本專案針對文字清洗邏輯與 Hash 計算編寫了單元測試，並透過 GitHub Actions 確保每次提交的代碼品質。

```bash
npm test
```

### 6. 維護與調優

- 二值化閾值：若 OCR 辨識結果不理想（字太細或太粗），請調整 `utils.js` 中的 `.threshold(160)`，數值範圍為 0-255。
- 記憶體管理：由於 OCR 辨識較耗 CPU 與記憶體，PM2 設定檔中已加入 `max_memory_restart: '300M'` 以確保系統穩定。
- 訊息切分：`notifier.js` 已內建自動切分邏輯，若辨識文字過長會拆分成多則訊息發送，避免觸發平台 API 的長度限制。