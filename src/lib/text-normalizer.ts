/**
 * 日本語テキスト正規化ユーティリティ
 * OCRで読み取ったテキストの全角/半角変換、和暦変換、OCR誤読補正を行う
 */

// 全角数字→半角数字
const FULLWIDTH_DIGITS: Record<string, string> = {
  "０": "0", "１": "1", "２": "2", "３": "3", "４": "4",
  "５": "5", "６": "6", "７": "7", "８": "8", "９": "9",
};

// 全角英字→半角英字
const FULLWIDTH_ALPHA: Record<string, string> = {
  "Ａ": "A", "Ｂ": "B", "Ｃ": "C", "Ｄ": "D", "Ｅ": "E",
  "Ｆ": "F", "Ｇ": "G", "Ｈ": "H", "Ｉ": "I", "Ｊ": "J",
  "Ｋ": "K", "Ｌ": "L", "Ｍ": "M", "Ｎ": "N", "Ｏ": "O",
  "Ｐ": "P", "Ｑ": "Q", "Ｒ": "R", "Ｓ": "S", "Ｔ": "T",
  "Ｕ": "U", "Ｖ": "V", "Ｗ": "W", "Ｘ": "X", "Ｙ": "Y", "Ｚ": "Z",
  "ａ": "a", "ｂ": "b", "ｃ": "c", "ｄ": "d", "ｅ": "e",
  "ｆ": "f", "ｇ": "g", "ｈ": "h", "ｉ": "i", "ｊ": "j",
  "ｋ": "k", "ｌ": "l", "ｍ": "m", "ｎ": "n", "ｏ": "o",
  "ｐ": "p", "ｑ": "q", "ｒ": "r", "ｓ": "s", "ｔ": "t",
  "ｕ": "u", "ｖ": "v", "ｗ": "w", "ｘ": "x", "ｙ": "y", "ｚ": "z",
};

// 全角記号→半角記号
const FULLWIDTH_SYMBOLS: Record<string, string> = {
  "．": ".", "，": ",", "：": ":", "；": ";",
  "／": "/", "（": "(", "）": ")", "　": " ",
  "－": "-", "＋": "+", "＝": "=", "＊": "*",
  "＃": "#", "＠": "@", "％": "%", "＆": "&",
  "￥": "¥",
};

// 和暦の元号と開始年のマッピング
const ERA_MAP: Record<string, number> = {
  "令和": 2018,   // 令和1年 = 2019年 → baseYear = 2018
  "平成": 1988,   // 平成1年 = 1989年
  "昭和": 1925,   // 昭和1年 = 1926年
  "大正": 1911,   // 大正1年 = 1912年
  "明治": 1867,   // 明治1年 = 1868年
};

// 和暦の略称マッピング
const ERA_ABBREV_MAP: Record<string, string> = {
  "R": "令和",
  "H": "平成",
  "S": "昭和",
  "T": "大正",
  "M": "明治",
};

// OCRでよくある誤読パターン（漢字・カタカナ）
const OCR_MISREAD_MAP: Record<string, string> = {
  // 口（くち）→ ロ（カタカナ ro）は文脈依存のため、特定のパターンでのみ置換
  // ー（長音）→ 一（いち）の誤読
  // "一": "ー", // これは逆方向の誤読。文脈次第なのでここでは扱わない
};

/**
 * 日本語テキストを正規化する
 * - 全角数字・英字・記号を半角に変換
 * - 空白を正規化
 */
export function normalizeJapaneseText(text: string): string {
  if (!text) return "";

  let normalized = text;

  // 全角数字→半角数字
  for (const [full, half] of Object.entries(FULLWIDTH_DIGITS)) {
    normalized = normalized.replaceAll(full, half);
  }

  // 全角英字→半角英字
  for (const [full, half] of Object.entries(FULLWIDTH_ALPHA)) {
    normalized = normalized.replaceAll(full, half);
  }

  // 全角記号→半角記号
  for (const [full, half] of Object.entries(FULLWIDTH_SYMBOLS)) {
    normalized = normalized.replaceAll(full, half);
  }

  // 連続空白を1つに
  normalized = normalized.replace(/[ \t]+/g, " ");

  // 行頭・行末の空白を除去
  normalized = normalized
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  // 連続改行を2つまでに
  normalized = normalized.replace(/\n{3,}/g, "\n\n");

  return normalized;
}

/**
 * 和暦を西暦に変換する
 * 例: 令和6年1月15日 → 2024年1月15日
 *     R6.1.15 → 2024.1.15
 *     令和六年 → 2024年 (漢数字にも対応)
 */
export function convertWareki(text: string): string {
  if (!text) return "";

  let result = text;

  // 漢数字を半角数字に変換（和暦の年の部分で使われることがある）
  result = convertKansuji(result);

  // 正式な和暦パターン: 令和6年1月15日
  for (const [era, baseYear] of Object.entries(ERA_MAP)) {
    const pattern = new RegExp(`${era}(\\d{1,2})年`, "g");
    result = result.replace(pattern, (_match, yearStr) => {
      const year = baseYear + parseInt(yearStr, 10);
      return `${year}年`;
    });

    // 元年パターン: 令和元年
    const gannenPattern = new RegExp(`${era}元年`, "g");
    result = result.replace(gannenPattern, () => {
      return `${baseYear + 1}年`;
    });
  }

  // 略称パターン: R6.1.15, H31.4.30
  for (const [abbrev, era] of Object.entries(ERA_ABBREV_MAP)) {
    const baseYear = ERA_MAP[era];
    const pattern = new RegExp(`${abbrev}(\\d{1,2})[./](\\d{1,2})[./](\\d{1,2})`, "g");
    result = result.replace(pattern, (_match, yearStr, month, day) => {
      const year = baseYear + parseInt(yearStr, 10);
      return `${year}/${month}/${day}`;
    });

    // 略称で年のみ: R6 → 2024
    const yearOnlyPattern = new RegExp(`${abbrev}(\\d{1,2})年`, "g");
    result = result.replace(yearOnlyPattern, (_match, yearStr) => {
      const year = baseYear + parseInt(yearStr, 10);
      return `${year}年`;
    });
  }

  return result;
}

/**
 * 漢数字を算用数字に変換する（簡易版）
 * 一〜九、十、百、千 程度を扱う（年号や数量で使われる範囲）
 */
function convertKansuji(text: string): string {
  const kansujiMap: Record<string, number> = {
    "〇": 0, "零": 0,
    "一": 1, "壱": 1,
    "二": 2, "弐": 2,
    "三": 3, "参": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "七": 7,
    "八": 8,
    "九": 9,
  };

  // 年の漢数字パターン（例：六年 → 6年、三十一年 → 31年）
  // 十の位を含むパターン
  let result = text.replace(
    /([一二三四五六七八九壱弐参])?十([一二三四五六七八九壱弐参])?年/g,
    (_match, tens, ones) => {
      const t = tens ? kansujiMap[tens] || 0 : 1;
      const o = ones ? kansujiMap[ones] || 0 : 0;
      return `${t * 10 + o}年`;
    }
  );

  // 一桁の漢数字年パターン（例：六年 → 6年）
  result = result.replace(
    /([一二三四五六七八九壱弐参〇零])年/g,
    (_match, k) => {
      return `${kansujiMap[k] || 0}年`;
    }
  );

  // 月日の漢数字（十の位含む）
  result = result.replace(
    /([一二三四五六七八九])?十([一二三四五六七八九])?月/g,
    (_match, tens, ones) => {
      const t = tens ? kansujiMap[tens] || 0 : 1;
      const o = ones ? kansujiMap[ones] || 0 : 0;
      return `${t * 10 + o}月`;
    }
  );

  result = result.replace(
    /([一二三四五六七八九])月/g,
    (_match, k) => `${kansujiMap[k] || 0}月`
  );

  result = result.replace(
    /([一二三四五六七八九])?十([一二三四五六七八九])?日/g,
    (_match, tens, ones) => {
      const t = tens ? kansujiMap[tens] || 0 : 1;
      const o = ones ? kansujiMap[ones] || 0 : 0;
      return `${t * 10 + o}日`;
    }
  );

  result = result.replace(
    /([一二三四五六七八九])日/g,
    (_match, k) => `${kansujiMap[k] || 0}日`
  );

  return result;
}

/**
 * テキストから数値を抽出する
 * カンマ区切り、小数点、全角数字に対応
 */
export function extractNumbers(text: string): number[] {
  if (!text) return [];

  // まず全角数字を半角に変換
  const normalized = normalizeJapaneseText(text);

  // 数値パターン: カンマ区切り、小数点を含む数値
  const pattern = /[-]?[\d,]+\.?\d*/g;
  const matches = normalized.match(pattern);

  if (!matches) return [];

  return matches
    .map((m) => {
      // カンマを除去してパース
      const cleaned = m.replace(/,/g, "");
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    })
    .filter((n): n is number => n !== null);
}

/**
 * カタカナをひらがなに変換する
 */
export function katakanaToHiragana(text: string): string {
  return text.replace(/[\u30A1-\u30F6]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0x60);
  });
}

/**
 * ひらがなをカタカナに変換する
 */
export function hiraganaToKatakana(text: string): string {
  return text.replace(/[\u3041-\u3096]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) + 0x60);
  });
}

/**
 * 日付文字列をYYYY-MM-DD形式に正規化する
 * 様々な日本語日付フォーマットに対応
 */
export function normalizeDateString(text: string): string | null {
  if (!text) return null;

  // まず和暦を西暦に変換
  let normalized = normalizeJapaneseText(convertWareki(text));

  // YYYY年MM月DD日 パターン
  let match = normalized.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (match) {
    const [, y, m, d] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // YYYY/MM/DD パターン
  match = normalized.match(/(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return null;
}
