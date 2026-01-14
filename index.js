const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const cron = require('node-cron');
const { createWorker } = require('tesseract.js'); // 新增引用

const config = require('./config');
const { getHash, preprocessImage, runOCR } = require('./utils');
const { broadcast } = require('./notifier');

const apiClient = axios.create({ timeout: 20000 }); // 監控用的超時較長

fs.ensureDirSync(config.imageDir);

async function monitorTask() {
    console.log(`[${new Date().toLocaleString()}] 🔍 啟動網頁掃描...`);
    console.log(`🌍 執行環境: ${config.env.toUpperCase()}`); // 會顯示 DEVELOPMENT 或 PRODUCTION
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
            console.warn('⚠️ 找不到目標圖片。');
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
            worker = await createWorker('chi_tra');

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