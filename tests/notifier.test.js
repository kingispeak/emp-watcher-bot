const { splitMessage } = require('../notifier');

describe('Notifier 模組 - splitMessage 測試', () => {
    
    test('短訊息不應被切分', () => {
        const text = "這是一則短訊息";
        const result = splitMessage(text, 100);
        expect(result).toHaveLength(1);
        expect(result[0]).toBe(text);
    });

    test('應在接近最大長度的換行符處切分', () => {
        // 設定每行 5 字，上限 12 字，預期在第二行後切分
        const text = "第一行內容\n第二行內容\n第三行內容";
        const result = splitMessage(text, 12);
        
        expect(result).toHaveLength(2);
        expect(result[0]).toBe("第一行內容\n第二行內容");
        expect(result[1]).toBe("第三行內容");
    });

    test('若單行長度超過 maxLength，應強行截斷 (保底機制)', () => {
        const text = "這是一行超級長長長長長長長長長長的文字";
        const result = splitMessage(text, 5);
        
        expect(result.length).toBeGreaterThan(1);
        expect(result[0]).toBe("這是一行超");
    });

    test('訊息剛好等於 maxLength 時不應多切一塊', () => {
        const text = "12345";
        const result = splitMessage(text, 5);
        expect(result).toHaveLength(1);
        expect(result[0]).toBe("12345");
    });

    test('處理空字串應回傳空陣列或空字串塊', () => {
        const result = splitMessage("", 10);
        expect(result).toEqual([]);
    });

    test('多張名單合併後的長訊息切分測試', () => {
        const text = "--- 圖片 1 ---\n張三\n李四\n--- 圖片 2 ---\n王五\n趙六";
        // 假設限制只能放下一張圖片的內容
        const result = splitMessage(text, 25);
        
        expect(result.length).toBe(2);
        expect(result[0]).toContain("圖片 1");
        expect(result[1]).toContain("圖片 2");
    });
});