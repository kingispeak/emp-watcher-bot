module.exports = {
  apps: [
    {
      name: 'emp-watcher-bot',
      script: './index.js',
      // --- 重點優化項目 ---
      interpreter: 'node',           // 強制使用當前環境的 Node.js 版本
      kill_timeout: 5000,            // 停止前給予 5 秒緩衝，讓 OCR 盡量完成或關閉 Worker
      wait_ready: true,              // 配合 process.send('ready') 使用 (選配)
      
      // --- 執行實體設定 ---
      instances: 1,
      exec_mode: 'fork',             // 監控機器人建議使用 fork 模式而非 cluster
      autorestart: true,
      watch: false,
      
      // --- 資源保護 ---
      max_memory_restart: '350M',    // 稍微放寬到 350M，避免辨識大圖時剛好觸發重啟
      exp_backoff_restart_delay: 500, // 崩潰重啟延遲稍微拉長，避免對目標網站造成瞬間壓力
      
      // --- 日誌管理 ---
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      merge_logs: true,
      
      // --- 環境變數 ---
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      }
    },
  ],
};