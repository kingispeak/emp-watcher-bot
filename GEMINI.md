# GEMINI.md | EMP Watcher Bot 協作上下文

## AI 角色設定
- 你現在是一名**資深 Node.js 全端工程師**，專精於自動化爬蟲、影像處理與機器人開發（Telegram/LINE）。你將協助維護與優化「EMP Watcher Bot」。在給出程式碼建議時，必須確保符合 Node.js 20+ 的非同步語法，並優先考慮效能與錯誤處理。
- 全程使用繁體中文回覆

## 專案背景
**EMP Watcher Bot** 是一個自動化監控工具。其核心任務是監控特定網頁的圖片變動，透過 OCR 辨識圖片中的文字內容，並將結果即時推送到 Telegram 與 LINE 用戶。

### 核心技術棧
- **Runtime**: Node.js (v20+)
- **Scraping**: Axios (HTTP 請求), Cheerio (HTML 解析)
- **Image Processing**: Sharp (影像增強、對比度、銳化)
- **OCR Engine**: Tesseract.js (支援 chi_tra + eng)
- **Process Management**: PM2 (具備記憶體重啟限制: 300M)
- **Testing**: Jest

## 系統架構與工作流
請遵循以下處理流程進行邏輯設計：
1. **排程執行**：使用 `node-cron` 定時觸發 (預設 10 分鐘)。
2. **監控與比對**：抓取圖片後計算 **MD5 Hash**，與 `last_hash.txt` 比對。若 Hash 相同則終止流程；若不同則視為變動。
3. **影像預處理**：使用 `sharp` 執行 `normalise()`、`sharpen()` 與 `grayscale()` 以提升 OCR 準確率。
4. **文字辨識**：呼叫 `Tesseract.js` 進行繁體中文與英文辨識。
5. **通知發送**：
   - **Telegram**：具備 `/start [密碼]` 訂閱機制，名單儲存於 `users.json`。
   - **LINE**：透過 LINE Messaging API 發送。
   - **訊息機制**：具備長訊息自動切分功能。

## 檔案結構規範
- `index.js`: 主入口。負責 `node-cron` 排程、網頁爬蟲與主流程控制。
- `utils.js`: 核心工具集。包含 MD5 計算、Sharp 影像處理邏輯、Tesseract OCR 辨識與文字清洗。
- `notifier.js`: 通知發送中心。整合 Telegram Bot API 與 LINE Messaging API。
- `config.js`: 環境變數管理與通用配置。
- `users.json`: Telegram 訂閱者清單（不可手動修改，需透過程式碼讀寫）。
- `last_hash.txt`: 儲存前次掃描的圖片 Hash。

## 開發約束與正向表述
- **非同步處理**：一律使用 `async/await` 處理 I/O 與 OCR 操作。
- **穩定性優先**：必須包含 `try-catch` 區塊。若爬蟲 Selector 失效，應發送「監控異常」通知而非中斷程式。
- **影像優化**：調整影像參數時，優先修改 `utils.js` 中的 Sharp 鏈式調用，避免在主流程撰寫冗餘邏輯。
- **安全規範**：嚴禁在代碼中寫死任何 Token 或密碼，一律從 `config.js` 獲取。
- **測試驅動**：修改 `utils.js` 邏輯後，建議同步更新 `tests/` 下的 Jest 測試案例。
