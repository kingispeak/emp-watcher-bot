const axios = require('axios');
const fs = require('fs-extra'); // 引入檔案處理工具
const config = require('./config');

/**
 * 從 users.json 取得所有訂閱者名單
 * 如果檔案不存在，則回傳 .env 裡的預設 ID 作為保底
 */
async function getSubscribers() {
    try {
        if (await fs.exists(config.usersFile)) {
            try {
                const users = await fs.readJson(config.usersFile);
                if (Array.isArray(users)) {
                    if (!users.includes(config.tgChatId)) users.push(config.tgChatId);
                    return users;
                }
            } catch (e) {
                console.error('⚠️ users.json 解析失敗，改用預設 ID');
            }
        }
    } catch (err) {
        console.error('讀取訂閱清單失敗:', err);
    }
    return [config.tgChatId]; // 保底方案：發送給管理員
}

/**
 * 優化後的切分邏輯：優先按換行切分，單行超長則強行截斷
 */
function splitMessage(text, maxLength = 3800) {
    if (!text || text.length === 0) return []; // 修復空字串問題
    if (text.length <= maxLength) return [text];
    
    const chunks = [];
    const lines = text.split('\n');
    let currentChunk = '';

    for (const line of lines) {
        // 如果單行內容本身就超過限制 (極端情況)
        if (line.length > maxLength) {
            // 先把目前的緩存推入
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = '';

            // 強行將超長行切碎
            let longLine = line;
            while (longLine.length > maxLength) {
                chunks.push(longLine.substring(0, maxLength));
                longLine = longLine.substring(maxLength);
            }
            currentChunk = longLine + '\n';
            continue;
        }

        // 正常換行邏輯
        if ((currentChunk + line).length > maxLength) {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = line + '\n';
        } else {
            currentChunk += line + '\n';
        }
    }
    
    if (currentChunk.trim()) chunks.push(currentChunk.trim());
    return chunks;
}

// 建立 Axios 實例並設定超時
const apiClient = axios.create({ timeout: 15000 });

async function sendToTelegram(message) {
    if (!config.tgToken || config.tgToken.startsWith('YOUR_')) return;
    
    const subscribers = await getSubscribers();
    const url = `https://api.telegram.org/bot${config.tgToken}/sendMessage`;

    // 依序發送給每位訂閱者
    for (const chatId of subscribers) {
        try {
            await apiClient.post(url, {
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML' // 支援 HTML 格式
            });
            console.log(`✅ Telegram 訊息已送達至: ${chatId}`);
        } catch (error) {
            // 如果報錯顯示 User is deactivated 或 Bot was blocked，代表使用者已離開
            const errorMsg = error.response?.data?.description || error.message;
            console.error(`❌ Telegram 發送失敗 (${chatId}):`, errorMsg);
        }
    }
}

async function sendToLine(message) {
    if (!config.lineAccessToken || config.lineAccessToken.startsWith('YOUR_')) return;
    try {
        await apiClient.post('https://api.line.me/v2/bot/message/push', {
            to: config.lineUserId,
            messages: [{ type: 'text', text: message }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.lineAccessToken}`
            }
        });
        console.log('✅ LINE 訊息已送達');
    } catch (error) {
        console.error('❌ LINE 發送失敗:', error.response?.data || error.message);
    }
}

async function broadcast(message) {
    // 組合增強後的訊息
    const enhancedMessage = `
${message}

---
資料來源: ${config.targetUrl}
溫馨提醒：圖片內容由 OCR 技術自動辨識，可能存在部分誤差。
    `.trim();

    const chunks = splitMessage(enhancedMessage);
    for (const chunk of chunks) {
        if (config.isProd) {
            await Promise.allSettled([
                sendToTelegram(chunk),
                sendToLine(chunk)
            ]);
        } else {
            console.log(`🧪 [開發模式] 攔截通知:\n${chunk}`);
            // 開發模式下可能只發給 TG 方便測試，但不發給 LINE
            // await sendToTelegram(chunk); 
        }
    }    
}

module.exports = { broadcast, splitMessage, sendToTelegram };