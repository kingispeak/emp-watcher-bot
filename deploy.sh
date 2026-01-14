#!/bin/bash

# --- 設定變數 ---
PROJECT_DIR=$(pwd)
APP_NAME="emp-watcher-bot"

echo "------------------------------------------"
echo "🚀 開始執行自動化部署: $APP_NAME"
echo "------------------------------------------"

# 1. 進入專案目錄
cd $PROJECT_DIR

# 2. 從 GitHub 拉取最新代碼
echo "📥 [1/5] 正在從 GitHub 拉取最新代碼..."
git pull origin main

# 3. 載入 NVM 並切換到正確的 Node 版本
# (這是為了確保腳本執行時能抓到 nvm 指令)
echo "⚙️ [2/5] 正在切換 Node.js 環境..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20 --silent

# 4. 安裝套件
echo "📦 [3/5] 正在安裝/更新套件..."
# 使用 npm ci 比 npm install 更適合正式環境，它會根據 package-lock.json 精確安裝
npm install --production

# 5. 重啟 PM2 服務
echo "🔄 [4/5] 正在重啟 PM2 服務..."
# 使用我們在 package.json 設定好的 restart 指令
npm run restart

# 6. 狀態檢查
echo "✅ [5/5] 部署完成！目前的服務狀態："
echo "------------------------------------------"
npm run status

echo "💡 提示: 如果發現版本錯亂，請手動執行 'npm run pm2:kill' 後再執行此腳本。"