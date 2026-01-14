module.exports = {
  apps: [
    {
      name: 'emp-watcher-bot',         // 應用程式名稱
      script: './index.js',            // 啟動腳本
      instances: 1,                    // 執行實體數量
      autorestart: true,               // 程式崩潰時自動重啟
      watch: false,                    // 是否監控檔案變動後重啟 (監控爬蟲建議關閉，避免衝突)
      max_memory_restart: '300M',      // 超過 300MB 記憶體自動重啟 (OCR 較耗內存，可保護伺服器)
      exp_backoff_restart_delay: 100,  // 重啟延遲
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/err.log',    // 錯誤日誌路徑
      out_file: './logs/out.log',      // 一般輸出日誌路徑
      merge_logs: true,                // 合併多個實體的日誌
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};