require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

const config = {
    env,
    isProd: env === 'production',
    isDev: env === 'development',
    targetUrl: process.env.TARGET_URL,
    hashFile: './last_hash.txt',
    imageDir: './downloads',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
    tgToken: process.env.TG_TOKEN,
    tgChatId: process.env.TG_CHAT_ID,
    lineAccessToken: process.env.LINE_ACCESS_TOKEN,
    lineUserId: process.env.LINE_USER_ID,
    cronSchedule: process.env.CRON_SCHEDULE || '*/10 * * * *',
    subscribePassword: process.env.SUBSCRIBE_PASSWORD || '123456',
    usersFile: './users.json',
};

// 簡單的啟動檢查
for (const [key, value] of Object.entries(config)) {
    if (!value && key !== 'tgToken' && key !== 'lineAccessToken') {
        console.warn(`⚠️ 警告: 配置項 ${key} 似乎未設定。`);
    }
}

module.exports = config;