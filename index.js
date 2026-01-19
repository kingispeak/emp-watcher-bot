const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const cron = require('node-cron');
const { createWorker } = require('tesseract.js'); // 新增引用
const { Telegraf } = require('telegraf'); // 新增：引入 Telegraf

const config = require('./config');
const { getHash, preprocessImage, runOCR } = require('./utils');
const { broadcast } = require('./notifier');

const apiClient = axios.create({ timeout: 20000 }); // 監控用的超時較長

fs.ensureDirSync(config.imageDir);

const bot = new Telegraf(config.tgToken);

bot.start(async (ctx) => {
    const chatId = ctx.chat.id;
    const messageText = ctx.message.text || ''; 
    const args = messageText.split(' ');
    const userEnteredPassword = args[1]; // 取得 /start 後面的參數

    // --- 密碼驗證 ---
    if (userEnteredPassword !== config.subscribePassword) {
        return ctx.reply(
            `⚠️ 驗證失敗！此機器人僅供授權用戶使用。\n\n` +
            `請向管理員索取密碼，並使用以下格式重新啟動：\n` +
            `<code>/start 你的密碼</code>`,
            { parse_mode: 'HTML' }
        );
    }

    // --- 執行訂閱 ---
    try {
        let users = [];
        if (await fs.exists(config.usersFile)) {
            try {
                users = await fs.readJson(config.usersFile);
            } catch (parseError) {
                // 如果檔案損壞或空白，重置為空陣列
                console.warn('⚠️ users.json 格式錯誤，已重置為空陣列');
                users = [];
            }
        }

        if (!Array.isArray(users)) users = []; // 確保 users 一定是陣列

        if (!users.includes(chatId)) {
            users.push(chatId);
            await fs.writeJson(config.usersFile, users);
            ctx.reply('🎉 驗證成功！你已加入訂閱名單。');
        } else {
            ctx.reply('你已經在訂閱名單中囉！');
        }
    } catch (err) {
        console.error('處理訂閱存檔失敗:', err);
        ctx.reply('❌ 系統錯誤，請聯絡管理員。');
    }
});

// 啟動機器人監聽 (背景執行)
bot.launch().then(() => {
    console.log('🤖 Telegram 機器人監聽服務已啟動');
});

// ==========================================
// 2. 爬蟲監控任務邏輯
// ==========================================
async function monitorTask() {
    console.log(`[${new Date().toLocaleString()}] 🔍 啟動網頁掃描...`);
    console.log(`🌍 執行環境: ${config.env.toUpperCase()}`);
    console.log(`⏰ 排程頻率: ${config.cronSchedule}`);
    console.log(`🎯 目標網址: ${config.targetUrl}`);
    let worker = null;

    try {
        const { data: html } = await apiClient.get(config.targetUrl, { 
            headers: { 'User-Agent': config.userAgent } 
        });
        const $ = cheerio.load(html);
        const imgElements = $('.product-tab-content img');
        
        if (imgElements.length === 0) {
            const warningMsg = '⚠️ 監控異常：找不到目標圖片，網站結構可能已變更。';
            console.warn(warningMsg);
            await broadcast(warningMsg);
            return;
        }

        // 下載圖片 (個別捕捉錯誤，避免一張掛掉全部掛掉)
        const imageInfos = [];
        for (let i = 0; i < imgElements.length; i++) {
            try {
                const relSrc = $(imgElements[i]).attr('src');
                const imgUrl = new URL(relSrc, config.targetUrl).href;
                const res = await apiClient.get(imgUrl, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(res.data);
                imageInfos.push({ index: i + 1, buffer, hash: getHash(buffer) });
            } catch (e) {
                console.error(`❌ 下載圖片 ${i+1} 失敗:`, e.message);
            }
        }

        if (imageInfos.length === 0) return;

        const combinedHash = getHash(imageInfos.map(img => img.hash).join(''));
        let lastHash = (await fs.exists(config.hashFile)) ? await fs.readFile(config.hashFile, 'utf8') : '';

        if (combinedHash !== lastHash) {
            console.log('🚀 偵測到內容變動！啟動辨識...');
            await fs.writeFile(config.hashFile, combinedHash);

            // 在此初始化一次 Worker
            worker = await createWorker('chi_tra+eng');

            let finalReport = `📢 【名單更新】\n時間：${new Date().toLocaleString()}\n\n`;
            
            for (const img of imageInfos) {
                const optimizedBuffer = await preprocessImage(img.buffer);
                const text = await runOCR(optimizedBuffer, worker);
                finalReport += `--- 圖片 ${img.index} ---\n${text || '(無內容)'}\n\n`;
            }

            await broadcast(finalReport);
        } else {
            console.log('😴 內容無變動。');
        }

    } catch (error) {
        console.error('❌ 監控任務失敗:', error.message);
    } finally {
        if (worker) await worker.terminate(); // 確保不論成功失敗都會關閉 Worker
    }
}

cron.schedule(config.cronSchedule, monitorTask);
monitorTask();

// 優雅停機處理 (PM2 停止時會觸發)
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));