/**
 * OCR解析結果パーサー
 * OCRで読み取ったテキストから発注書・納品書・請求書の構造化データを抽出する
 */

import {
  normalizeJapaneseText,
  convertWareki,
  extractNumbers,
  normalizeDateString,
} from "./text-normalizer";

// ======== 型定義 ========

/** 解析済み発注データ */
export interface ParsedOrderData {
  /** 書類種別 */
  documentType: "ORDER" | "DELIVERY_NOTE" | "INVOICE" | "UNKNOWN";
  /** 発注元（買い手）会社名 */
  buyerName?: string;
  /** 受注先（売り手・供給元）会社名 */
  supplierName?: string;
  /** 伝票番号 */
  documentNumber?: string;
  /** 発注日 (YYYY-MM-DD) */
  orderDate?: string;
  /** 納品日 (YYYY-MM-DD) */
  deliveryDate?: string;
  /** 明細行 */
  items: ParsedLineItem[];
  /** 小計 */
  subtotal?: number;
  /** 消費税額 */
  tax?: number;
  /** 合計金額（税込） */
  totalAmount?: number;
  /** 税率 */
  taxRate?: number;
  /** 備考 */
  notes?: string;
  /** 解析信頼度 (0-1) */
  confidence: number;
}

/** 解析済み明細行 */
export interface ParsedLineItem {
  /** 商品名 */
  productName: string;
  /** 数量 */
  quantity?: number;
  /** 単位 (kg, 個, ケース, パック, 本 等) */
  unit?: string;
  /** 単価 */
  unitPrice?: number;
  /** 金額 */
  amount?: number;
  /** 行の解析信頼度 (0-1) */
  confidence: number;
}

// ======== 書類種別判定 ========

/** 書類種別のキーワードとスコア */
const DOCUMENT_TYPE_KEYWORDS: Record<
  ParsedOrderData["documentType"],
  { keywords: string[]; weight: number }
> = {
  ORDER: {
    keywords: ["発注書", "注文書", "発注", "ご注文", "御注文", "purchase order"],
    weight: 1,
  },
  DELIVERY_NOTE: {
    keywords: ["納品書", "納品", "納入", "配送", "delivery note", "出荷"],
    weight: 1,
  },
  INVOICE: {
    keywords: ["請求書", "御請求", "ご請求", "請求", "invoice"],
    weight: 1,
  },
  UNKNOWN: { keywords: [], weight: 0 },
};

function detectDocumentType(
  text: string
): { type: ParsedOrderData["documentType"]; confidence: number } {
  const normalizedText = text.toLowerCase();
  let bestType: ParsedOrderData["documentType"] = "UNKNOWN";
  let bestScore = 0;

  for (const [type, { keywords }] of Object.entries(DOCUMENT_TYPE_KEYWORDS)) {
    if (type === "UNKNOWN") continue;
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        // キーワードがテキストの先頭に近いほど高スコア
        const index = normalizedText.indexOf(keyword);
        const positionScore = Math.max(0, 1 - index / 200); // 先頭200文字以内で高スコア
        const score = 0.7 + positionScore * 0.3;
        if (score > bestScore) {
          bestScore = score;
          bestType = type as ParsedOrderData["documentType"];
        }
      }
    }
  }

  return { type: bestType, confidence: bestScore };
}

// ======== 会社名抽出 ========

function extractCompanyNames(
  text: string
): { buyerName?: string; supplierName?: string } {
  const lines = text.split("\n");
  let buyerName: string | undefined;
  let supplierName: string | undefined;

  for (const line of lines) {
    const trimmed = line.trim();

    // 「〇〇 御中」パターン → 宛先 = 発注先（supplierの場合もあるが、
    // 発注書では通常発注先に「御中」をつけるので supplier として扱う）
    // ただし発注書の場合、御中は受注側（supplier）宛て
    const onchu = trimmed.match(/(.+?)[\s　]*御中/);
    if (onchu) {
      const name = cleanCompanyName(onchu[1]);
      if (name) {
        // 発注書では「御中」は受注側（supplier）宛て
        supplierName = supplierName || name;
        continue;
      }
    }

    // 「〇〇 様」パターン → 宛先
    const sama = trimmed.match(/(.+?)[\s　]*様$/);
    if (sama && !sama[1].match(/担当|ご担当/)) {
      const name = cleanCompanyName(sama[1]);
      if (name) {
        supplierName = supplierName || name;
        continue;
      }
    }

    // 株式会社パターンで差出人を探す
    // 「発注元」「FROM」「差出人」等のラベルの後
    const fromPattern = trimmed.match(
      /(?:発注元|差出人|FROM|from)[：:\s]*(.+)/
    );
    if (fromPattern) {
      const name = cleanCompanyName(fromPattern[1]);
      if (name) {
        buyerName = name;
        continue;
      }
    }

    // 「発注先」「宛先」「TO」等のラベルの後
    const toPattern = trimmed.match(
      /(?:発注先|宛先|TO|to|お届け先)[：:\s]*(.+)/
    );
    if (toPattern) {
      const name = cleanCompanyName(toPattern[1]);
      if (name) {
        supplierName = supplierName || name;
        continue;
      }
    }
  }

  return { buyerName, supplierName };
}

function cleanCompanyName(raw: string): string | undefined {
  if (!raw) return undefined;

  let name = raw.trim();

  // 「御中」「様」「殿」を除去
  name = name.replace(/[\s　]*(御中|様|殿)$/, "").trim();

  // 会社名として妥当かチェック（最低2文字以上）
  if (name.length < 2) return undefined;

  // 「株式会社」「（株）」「(株)」「有限会社」等が含まれていれば信頼度が高い
  return name;
}

// ======== 日付抽出 ========

function extractDates(
  text: string
): { orderDate?: string; deliveryDate?: string } {
  const normalized = normalizeJapaneseText(convertWareki(text));
  const lines = normalized.split("\n");

  let orderDate: string | undefined;
  let deliveryDate: string | undefined;

  for (const line of lines) {
    const trimmed = line.trim();

    // 発注日・注文日
    if (
      trimmed.match(/(?:発注日|注文日|日付|date)[：:\s]*/i) &&
      !trimmed.match(/納品|配達|配送|お届け/)
    ) {
      const date = normalizeDateString(trimmed);
      if (date) {
        orderDate = orderDate || date;
      }
    }

    // 納品日・配達日
    if (trimmed.match(/(?:納品日|配達日|配送日|お届け日|納入日|希望日)[：:\s]*/)) {
      const date = normalizeDateString(trimmed);
      if (date) {
        deliveryDate = deliveryDate || date;
      }
    }
  }

  // 日付が見つからなかった場合、テキスト全体から日付パターンを探す
  if (!orderDate) {
    const dateMatch = normalized.match(
      /(\d{4})[年/.-](\d{1,2})[月/.-](\d{1,2})[日]?/
    );
    if (dateMatch) {
      const [, y, m, d] = dateMatch;
      orderDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }

  return { orderDate, deliveryDate };
}

// ======== 伝票番号抽出 ========

function extractDocumentNumber(text: string): string | undefined {
  const normalized = normalizeJapaneseText(text);
  const lines = normalized.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // 「No.」「番号」「伝票番号」パターン
    const patterns = [
      /(?:No\.|NO\.|no\.)[：:\s]*([A-Za-z0-9-]+)/i,
      /(?:伝票番号|注文番号|発注番号|請求番号)[：:\s]*([A-Za-z0-9-]+)/,
      /(?:伝票No|注文No|発注No)[.．]?[：:\s]*([A-Za-z0-9-]+)/,
    ];

    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
  }

  return undefined;
}

// ======== 明細行抽出 ========

/** 日本語の単位パターン */
const UNIT_PATTERNS = [
  "kg", "g", "mg", "t",
  "L", "l", "ml", "mL",
  "個", "本", "枚", "袋", "箱", "缶", "瓶",
  "ケース", "カートン", "パック", "パレット",
  "束", "玉", "丁", "切", "尾", "匹", "杯",
  "cs", "CT", "P",
];

const UNIT_REGEX = new RegExp(
  `(\\d+(?:\\.\\d+)?)\\s*(${UNIT_PATTERNS.join("|")})`,
  "i"
);

function extractLineItems(text: string): ParsedLineItem[] {
  const normalized = normalizeJapaneseText(text);
  const lines = normalized.split("\n");
  const items: ParsedLineItem[] = [];

  // 明細行のヘッダーを見つけて、その後の行を解析する
  let inItemSection = false;
  let headerIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // ヘッダー行の検出
    if (
      line.match(/(?:品名|商品名|品目|名称)/) &&
      line.match(/(?:数量|個数|数)/) &&
      (line.match(/(?:単価|価格)/) || line.match(/(?:金額|合計)/))
    ) {
      inItemSection = true;
      headerIndex = i;
      continue;
    }

    // 明細セクション終了の検出
    if (
      inItemSection &&
      (line.match(/^(?:小計|合計|消費税|税込|税抜|備考|以上)/) ||
        line === "" ||
        line.match(/^[-=]+$/))
    ) {
      // 空行の場合、次の行もチェック
      if (line === "" && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (
          nextLine.match(/^(?:小計|合計|消費税|税込|税抜|備考|以上)/) ||
          nextLine === ""
        ) {
          inItemSection = false;
          continue;
        }
        // 空行の後にまだ明細がある可能性
        continue;
      }
      if (line !== "") {
        inItemSection = false;
      }
      continue;
    }

    if (inItemSection && line.length > 0) {
      const item = parseLineItem(line);
      if (item) {
        items.push(item);
      }
    }
  }

  // ヘッダーが見つからなかった場合、数値パターンから明細行を推定する
  if (items.length === 0) {
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // 商品名 + 数量 + 金額のパターンを探す
      const item = parseLineItemFallback(trimmed);
      if (item) {
        items.push(item);
      }
    }
  }

  return items;
}

/**
 * 明細行を解析する（ヘッダーがある場合）
 * 典型的なフォーマット: 商品名 数量 単位 単価 金額
 */
function parseLineItem(line: string): ParsedLineItem | null {
  if (!line || line.length < 3) return null;

  // タブ区切りまたはスペース区切りを試みる
  let parts: string[];

  if (line.includes("\t")) {
    parts = line.split("\t").map((p) => p.trim()).filter(Boolean);
  } else {
    // スペースで区切る（ただし日本語テキスト内のスペースを考慮）
    parts = splitLineIntoParts(line);
  }

  if (parts.length < 2) return null;

  // 最初の部分が商品名（数字で始まらないもの）
  let productName = "";
  let numericParts: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    // 数値（カンマ含む）か単位の場合は数量情報
    if (part.match(/^[\d,]+\.?\d*$/) || part.match(UNIT_REGEX)) {
      numericParts = parts.slice(i);
      break;
    }
    productName += (productName ? " " : "") + part;
  }

  if (!productName) return null;

  // 数値パーツから数量・単価・金額を抽出
  const numbers = numericParts
    .map((p) => {
      const cleaned = p.replace(/,/g, "").replace(/[^\d.-]/g, "");
      return cleaned ? parseFloat(cleaned) : null;
    })
    .filter((n): n is number => n !== null && !isNaN(n));

  // 単位の抽出
  const unitMatch = numericParts.join(" ").match(UNIT_REGEX);
  const unit = unitMatch ? unitMatch[2] : undefined;

  let quantity: number | undefined;
  let unitPrice: number | undefined;
  let amount: number | undefined;

  if (numbers.length >= 3) {
    // 数量, 単価, 金額
    quantity = numbers[0];
    unitPrice = numbers[1];
    amount = numbers[2];
  } else if (numbers.length === 2) {
    // 数量と金額、または単価と金額
    if (numbers[0] < numbers[1]) {
      quantity = numbers[0];
      amount = numbers[1];
      if (quantity > 0) {
        unitPrice = Math.round(amount / quantity);
      }
    } else {
      unitPrice = numbers[0];
      amount = numbers[1];
    }
  } else if (numbers.length === 1) {
    // 金額のみ、または数量のみ
    if (numbers[0] > 100) {
      amount = numbers[0];
    } else {
      quantity = numbers[0];
    }
  }

  // 信頼度の計算
  let confidence = 0.3; // ベーススコア
  if (productName.length >= 2) confidence += 0.1;
  if (quantity !== undefined) confidence += 0.15;
  if (unitPrice !== undefined) confidence += 0.15;
  if (amount !== undefined) confidence += 0.15;
  if (unit) confidence += 0.1;
  // 金額の整合性チェック
  if (
    quantity !== undefined &&
    unitPrice !== undefined &&
    amount !== undefined
  ) {
    const expectedAmount = quantity * unitPrice;
    if (Math.abs(expectedAmount - amount) / amount < 0.01) {
      confidence += 0.15;
    }
  }

  return {
    productName: productName.trim(),
    quantity,
    unit,
    unitPrice,
    amount,
    confidence: Math.min(confidence, 1),
  };
}

/**
 * 行をパーツに分割する（スペース区切り、ただし日本語テキスト内のスペースは考慮）
 */
function splitLineIntoParts(line: string): string[] {
  // 2つ以上のスペースで分割
  const parts = line.split(/\s{2,}/);
  if (parts.length >= 3) return parts.filter(Boolean);

  // 1つのスペースで分割（ただし数字と日本語の境界も考慮）
  return line.split(/\s+/).filter(Boolean);
}

/**
 * ヘッダーなしのフォールバック解析
 * 行に商品名と数量・金額が含まれている場合に抽出を試みる
 */
function parseLineItemFallback(line: string): ParsedLineItem | null {
  // 行に数値が2つ以上含まれ、かつ日本語テキストが含まれる場合
  const numbers = extractNumbers(line);
  if (numbers.length < 1) return null;

  // 日本語テキスト部分を抽出
  const textPart = line
    .replace(/[\d,]+\.?\d*/g, "")
    .replace(/[¥\\]/g, "")
    .trim();

  // 単位パターンを除去して商品名を抽出
  const unitMatch = textPart.match(
    new RegExp(`(${UNIT_PATTERNS.join("|")})`, "i")
  );
  let productName = textPart;
  if (unitMatch) {
    productName = textPart.replace(unitMatch[0], "").trim();
  }

  // 商品名が短すぎる場合や、小計・合計行の場合はスキップ
  if (productName.length < 2) return null;
  if (productName.match(/^(?:小計|合計|消費税|税|値引|割引|送料)/)) return null;

  let quantity: number | undefined;
  let unitPrice: number | undefined;
  let amount: number | undefined;

  if (numbers.length >= 3) {
    quantity = numbers[0];
    unitPrice = numbers[1];
    amount = numbers[2];
  } else if (numbers.length === 2) {
    quantity = numbers[0];
    amount = numbers[1];
  } else if (numbers.length === 1) {
    amount = numbers[0];
  }

  return {
    productName,
    quantity,
    unit: unitMatch ? unitMatch[1] : undefined,
    unitPrice,
    amount,
    confidence: 0.3, // フォールバック解析は信頼度が低い
  };
}

// ======== 合計・税金抽出 ========

function extractTotals(
  text: string
): {
  subtotal?: number;
  tax?: number;
  totalAmount?: number;
  taxRate?: number;
} {
  const normalized = normalizeJapaneseText(text);
  const lines = normalized.split("\n");

  let subtotal: number | undefined;
  let tax: number | undefined;
  let totalAmount: number | undefined;
  let taxRate: number | undefined;

  for (const line of lines) {
    const trimmed = line.trim();

    // 小計
    if (trimmed.match(/小計/) && !trimmed.match(/税/)) {
      const numbers = extractNumbers(trimmed);
      if (numbers.length > 0) {
        subtotal = numbers[numbers.length - 1]; // 最後の数値が金額
      }
    }

    // 消費税
    if (trimmed.match(/消費税|税額/)) {
      const numbers = extractNumbers(trimmed);
      if (numbers.length > 0) {
        // 税率と税額を区別
        for (const n of numbers) {
          if (n === 8 || n === 10) {
            taxRate = n;
          } else if (n > 10) {
            tax = n;
          }
        }
      }
    }

    // 軽減税率
    if (trimmed.match(/軽減税率/)) {
      const numbers = extractNumbers(trimmed);
      for (const n of numbers) {
        if (n === 8) {
          taxRate = 8;
        }
      }
    }

    // 合計（税込合計を優先）
    if (trimmed.match(/税込[合計|金額]|(?:合計金額)|(?:お支払[い]?)/)) {
      const numbers = extractNumbers(trimmed);
      if (numbers.length > 0) {
        totalAmount = numbers[numbers.length - 1];
      }
    } else if (trimmed.match(/^合計/) && !trimmed.match(/小計/)) {
      const numbers = extractNumbers(trimmed);
      if (numbers.length > 0) {
        // すでに税込合計が見つかっていなければセット
        totalAmount = totalAmount || numbers[numbers.length - 1];
      }
    }

    // 「御見積金額」「ご請求金額」
    if (trimmed.match(/(?:御|ご)(?:見積|請求)金額/)) {
      const numbers = extractNumbers(trimmed);
      if (numbers.length > 0) {
        totalAmount = totalAmount || numbers[numbers.length - 1];
      }
    }
  }

  return { subtotal, tax, totalAmount, taxRate };
}

// ======== 備考抽出 ========

function extractNotes(text: string): string | undefined {
  const normalized = normalizeJapaneseText(text);
  const lines = normalized.split("\n");

  let inNotes = false;
  const noteLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.match(/^(?:備考|メモ|連絡事項|注意事項|特記事項)[：:\s]*/)) {
      inNotes = true;
      const content = trimmed.replace(
        /^(?:備考|メモ|連絡事項|注意事項|特記事項)[：:\s]*/,
        ""
      );
      if (content) noteLines.push(content);
      continue;
    }

    if (inNotes) {
      if (trimmed === "" || trimmed.match(/^[-=]+$/)) {
        break;
      }
      noteLines.push(trimmed);
    }
  }

  return noteLines.length > 0 ? noteLines.join("\n") : undefined;
}

// ======== メイン解析関数 ========

/**
 * OCRで読み取ったテキストを解析し、構造化された発注データに変換する
 * @param rawText OCRの生テキスト
 * @returns 解析済み発注データ
 */
export function parseOrderDocument(rawText: string): ParsedOrderData {
  if (!rawText || rawText.trim().length === 0) {
    return {
      documentType: "UNKNOWN",
      items: [],
      confidence: 0,
    };
  }

  // テキストの正規化
  const normalizedText = normalizeJapaneseText(rawText);

  // 各要素の抽出
  const { type: documentType, confidence: typeConfidence } =
    detectDocumentType(normalizedText);
  const { buyerName, supplierName } = extractCompanyNames(normalizedText);
  const documentNumber = extractDocumentNumber(normalizedText);
  const { orderDate, deliveryDate } = extractDates(normalizedText);
  const items = extractLineItems(normalizedText);
  const { subtotal, tax, totalAmount, taxRate } =
    extractTotals(normalizedText);
  const notes = extractNotes(normalizedText);

  // 全体の信頼度を計算
  let confidence = 0;
  let factors = 0;

  // 書類種別の信頼度
  confidence += typeConfidence * 0.2;
  factors += 0.2;

  // 会社名が見つかったか
  if (buyerName || supplierName) {
    confidence += 0.15;
  }
  factors += 0.15;

  // 日付が見つかったか
  if (orderDate) {
    confidence += 0.1;
  }
  factors += 0.1;

  // 明細行の信頼度
  if (items.length > 0) {
    const avgItemConfidence =
      items.reduce((sum, item) => sum + item.confidence, 0) / items.length;
    confidence += avgItemConfidence * 0.3;
  }
  factors += 0.3;

  // 合計金額が見つかったか
  if (totalAmount !== undefined) {
    confidence += 0.15;

    // 明細行の合計と一致するかチェック
    if (items.length > 0) {
      const itemsTotal = items.reduce(
        (sum, item) => sum + (item.amount || 0),
        0
      );
      if (itemsTotal > 0 && Math.abs(itemsTotal - totalAmount) / totalAmount < 0.1) {
        confidence += 0.1;
      }
    }
  }
  factors += 0.25;

  // 正規化（0-1の範囲に）
  const normalizedConfidence = Math.min(confidence / factors, 1);

  return {
    documentType,
    buyerName,
    supplierName,
    documentNumber,
    orderDate,
    deliveryDate,
    items,
    subtotal,
    tax,
    totalAmount,
    taxRate,
    notes,
    confidence: Math.round(normalizedConfidence * 100) / 100,
  };
}
