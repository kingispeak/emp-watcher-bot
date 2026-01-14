const axios = require('axios');
const config = require('./config');

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
    try {
        await apiClient.post(`https://api.telegram.org/bot${config.tgToken}/sendMessage`, {
            chat_id: config.tgChatId,
            text: message
        });
        console.log('✅ Telegram 訊息已送達');
    } catch (error) {
        console.error('❌ Telegram 發送失敗:', error.response?.data || error.message);
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
    const chunks = splitMessage(message);
    for (const chunk of chunks) {
        if (config.isProd) {
            await Promise.allSettled([
                sendToTelegram(chunk),
                sendToLine(chunk)
            ]);
        } else {
            console.log(`🧪 [開發模式] 攔截通知，僅列印長度: ${chunk.length}`);
            // 開發模式下可能只發給 TG 方便測試，但不發給 LINE
            // await sendToTelegram(chunk); 
        }
    }    
}

module.exports = { broadcast, splitMessage };