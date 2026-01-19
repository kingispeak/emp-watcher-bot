const crypto = require('crypto');
const sharp = require('sharp');
const { createWorker } = require('tesseract.js');

/**
 * 計算 MD5
 * @param {Buffer|string} data 
 */
const getHash = (data) => crypto.createHash('md5').update(data).digest('hex');

/**
 * 影像預處理
 */
const preprocessImage = async (buffer) => {
    return await sharp(buffer)
        .resize({ width: 2500, withoutEnlargement: false })
        .grayscale()
        .normalise()
        .sharpen()
        .toBuffer();
};

/**
 * 文字清洗邏輯
 */
const cleanOCRText = (text) => {
    if (!text) return '';
    return text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
};

/**
 * OCR 執行器 (修正為支援外部傳入 Worker)
 */
const runOCR = async (imageBuffer, worker) => {
    const { data: { text } } = await worker.recognize(imageBuffer);
    return cleanOCRText(text);
};

module.exports = { getHash, preprocessImage, cleanOCRText, runOCR };