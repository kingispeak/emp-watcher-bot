# EMP Watcher Bot 🚀

[![Node.js CI](https://github.com/kingispeak/emp-watcher-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/kingispeak/emp-watcher-bot/actions/workflows/ci.yml)

這是一個基於 Node.js 開發的自動化網頁監控工具。它能定時掃描目標網頁的名單圖片，當偵測到變動時，透過 **Sharp** 強化影像品質，並使用 **Tesseract.js** 進行 OCR 文字辨識，最後將結果推送到 **Telegram** 與 **LINE**，**Telegram Bot** 整合了訂閱制廣播系統與密碼授權機制。

---

## 🌟 核心功能

- **自動監控**：使用 `node-cron` 實現定時抓取（預設每 10 分鐘）。
- **變動偵測**：透過 MD5 Hash 比對圖片內容，並加入 **URL 防快取機制**（Cache Busting），確保抓取最新狀態。
- **影像強化**：利用 `sharp` 進行自動對比度增強 (`normalise`)、銳化 (`sharpen`) 及灰階處理，大幅提升文字辨識準確度。
- **OCR 辨識**：支援 **繁體中文 (chi_tra)** 與 **英文 (eng)** 混合辨識。
- **異常告警**：若監控目標結構變更（如找不到圖片），將自動發送異常通知。
- **多平台通知**：整合 Telegram Bot API 與 LINE Messaging API。
- **穩健運行**：搭配 PM2 進行行程管理，支援當機自動重啟與日誌紀錄。
- **品質保證**：內建 Jest 單元測試與 GitHub Actions CI 流程。

---

## 🛠 技術棧

- **Runtime**: Node.js (>=20)
- **Scraping**: Axios, Cheerio
- **Image Process**: Sharp
- **OCR Engine**: Tesseract.js (Multi-language support)
- **Process Manager**: PM2
- **Testing**: Jest

---

## 🚀 快速開始

### 1. 安裝環境
確保你的環境已安裝 Node.js (>=20) 與 npm。

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
TG_CHAT_ID=your_chat_id # admin chat id
SUBSCRIBE_PASSWORD=your_secure_password # 訂閱授權密碼

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
- `npm run remote-deploy` 遠端伺服器部署 (需先設定 SSH)
- `./deploy.sh`	伺服器一鍵部署 (Pull + Install + Restart)

更多請參考 package.json 的 scripts 指令。

### 4. 專案結構

```
├── tests/               # 單元測試案例 (Jest)
├── downloads/           # 暫存原始圖片與處理後的圖片 (已由 git 忽略)
├── logs/                # PM2 運行日誌檔案 (已由 git 忽略)
├── .env                 # 敏感環境變數 (已由 git 忽略)
├── .gitignore           # Git 忽略清單
├── config.js            # 環境變數與設定管理中心
├── utils.js             # 影像處理、Hash 與 OCR 清洗工具函數
├── notifier.js          # Telegram 與 LINE API 發送邏輯
├── index.js             # 程式主入口：負責排程與監控流程
├── ecosystem.config.js  # PM2 設定檔
├── last_hash.txt        # 紀錄上次比對的圖片 Hash
└── users.json           # 紀錄 Telegram 訂閱者名單
```

### 5. 自動化測試與 CI

本專案針對文字清洗邏輯與 Hash 計算編寫了單元測試，並透過 GitHub Actions 確保每次提交的代碼品質。

```bash
npm test
```

### 6. 維護與調優

- **辨識率優化**：系統已採用自動對比度增強 (`normalise`) 與銳化 (`sharpen`)。若文字依然模糊，可嘗試在 `utils.js` 中調整 `.resize({ width: 2500 })` 的寬度參數。
- **異常監控**：若收到「⚠️ 監控異常」通知，通常代表目標網址的 CSS Selector (`.product-tab-content img`) 已失效，請更新 `index.js` 中的爬蟲邏輯。
- **記憶體管理**：由於 OCR 辨識較耗 CPU 與記憶體，PM2 設定檔中已加入 `max_memory_restart: '300M'` 以確保系統穩定。
- **訊息切分**：`notifier.js` 已內建自動切分邏輯，若辨識文字過長會拆分成多則訊息發送。

### 7.Telegram 訂閱方式

機器人具備身分驗證功能，使用者需透過以下方式完成訂閱：

手動訂閱：在對話框輸入 /start [密碼]（例如：/start 123456）。
自動連結：分享連結 https://t.me/YourBotName?start=密碼，使用者點擊「開始」即可自動完成驗證。
安全性與隱私：users.json 會記錄訂閱者的 Telegram ID，請勿將其上傳至公開倉庫。

註：訂閱名單儲存於 `users.json`，系統具備自動修復功能，若檔案損壞會自動重建。