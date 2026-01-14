const { cleanOCRText, getHash } = require('../utils');

describe('Utils 模組測試', () => {
    
    test('cleanOCRText 應該正確清理文字並過濾掉短字元', () => {
        const rawText = "  王小明 \n \n 李小華  \n A \n";
        const result = cleanOCRText(rawText);
        // 預期結果：頭尾去空白、過濾長度<=1的字、合併為換行字串
        expect(result).toBe("王小明\n李小華");
    });

    test('getHash 對於相同的內容應該產生相同的 MD5', () => {
        const buffer = Buffer.from('test-data');
        const hash1 = getHash(buffer);
        const hash2 = getHash(buffer);
        expect(hash1).toBe(hash2);
        expect(hash1).toHaveLength(32); // MD5 長度固定為 32 位
    });
});