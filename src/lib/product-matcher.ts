/**
 * 商品マッチングライブラリ
 * OCR解析結果の明細行と、データベース上の商品マスタをファジーマッチングで突合する
 */

import { prisma } from "./prisma";
import {
  normalizeJapaneseText,
  katakanaToHiragana,
} from "./text-normalizer";
import type { ParsedLineItem } from "./ocr-parser";

// ======== 型定義 ========

/** マッチング結果 */
export interface MatchedItem {
  /** 元の解析済み明細行 */
  parsedItem: ParsedLineItem;
  /** マッチした商品マスタ */
  matchedProduct?: {
    id: string;
    name: string;
    code: string;
    price: number;
  };
  /** マッチング信頼度 (0-1) */
  matchConfidence: number;
  /** 完全一致かどうか */
  isExactMatch: boolean;
}

/** データベースから取得した商品情報 */
interface ProductRecord {
  id: string;
  name: string;
  code: string;
  price: number;
  /** 正規化済みの商品名（検索用） */
  normalizedName: string;
  /** ひらがな化した商品名（検索用） */
  hiraganaName: string;
}

// ======== テキスト正規化（マッチング用） ========

/**
 * マッチング用にテキストを正規化する
 * - 全角→半角変換
 * - カタカナ→ひらがな変換
 * - 空白除去
 * - 記号除去
 */
function normalizeForMatching(text: string): string {
  let normalized = normalizeJapaneseText(text);

  // 不要な記号を除去
  normalized = normalized.replace(/[()（）「」『』【】\[\]{}・、。,.!！?？#＃]/g, "");

  // スペース除去
  normalized = normalized.replace(/\s+/g, "");

  // 小文字化
  normalized = normalized.toLowerCase();

  return normalized;
}

/**
 * 2つの文字列の類似度を計算する（レーベンシュタイン距離ベース）
 * @returns 0-1の類似度スコア（1が完全一致）
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;

  const len1 = str1.length;
  const len2 = str2.length;

  // レーベンシュタイン距離の計算（DP）
  const matrix: number[][] = Array.from({ length: len1 + 1 }, () =>
    Array(len2 + 1).fill(0)
  );

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // 削除
        matrix[i][j - 1] + 1,     // 挿入
        matrix[i - 1][j - 1] + cost // 置換
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);

  return 1 - distance / maxLen;
}

/**
 * 部分一致のスコアを計算する
 * 一方の文字列が他方に含まれている場合にスコアを付与
 */
function calculateContainmentScore(query: string, target: string): number {
  if (target.includes(query)) {
    // queryがtargetに完全に含まれている
    return query.length / target.length;
  }
  if (query.includes(target)) {
    // targetがqueryに完全に含まれている
    return target.length / query.length;
  }
  return 0;
}

/**
 * N-gramベースの類似度を計算する
 */
function calculateNgramSimilarity(str1: string, str2: string, n: number = 2): number {
  if (str1.length < n || str2.length < n) {
    return calculateSimilarity(str1, str2);
  }

  const ngrams1 = new Set<string>();
  const ngrams2 = new Set<string>();

  for (let i = 0; i <= str1.length - n; i++) {
    ngrams1.add(str1.substring(i, i + n));
  }
  for (let i = 0; i <= str2.length - n; i++) {
    ngrams2.add(str2.substring(i, i + n));
  }

  let intersection = 0;
  ngrams1.forEach((gram) => {
    if (ngrams2.has(gram)) intersection++;
  });

  const union = ngrams1.size + ngrams2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * 総合的なマッチングスコアを計算する
 */
function calculateMatchScore(
  parsedName: string,
  product: ProductRecord
): { score: number; isExact: boolean } {
  const normalizedQuery = normalizeForMatching(parsedName);
  const normalizedTarget = product.normalizedName;
  const hiraganaQuery = katakanaToHiragana(normalizedQuery);
  const hiraganaTarget = product.hiraganaName;

  // 完全一致チェック
  if (
    normalizedQuery === normalizedTarget ||
    hiraganaQuery === hiraganaTarget
  ) {
    return { score: 1.0, isExact: true };
  }

  // 商品コードとの完全一致
  if (
    normalizedQuery === product.code.toLowerCase() ||
    parsedName.trim() === product.code
  ) {
    return { score: 0.95, isExact: true };
  }

  // 各種スコアを計算
  const levenshteinScore = calculateSimilarity(
    normalizedQuery,
    normalizedTarget
  );
  const hiraganaLevenshteinScore = calculateSimilarity(
    hiraganaQuery,
    hiraganaTarget
  );
  const containmentScore = calculateContainmentScore(
    normalizedQuery,
    normalizedTarget
  );
  const hiraganaContainmentScore = calculateContainmentScore(
    hiraganaQuery,
    hiraganaTarget
  );
  const ngramScore = calculateNgramSimilarity(normalizedQuery, normalizedTarget);
  const hiraganaNgramScore = calculateNgramSimilarity(
    hiraganaQuery,
    hiraganaTarget
  );

  // 最も高いスコアを採用（異なるマッチング手法の最大値）
  const bestLevenshtein = Math.max(levenshteinScore, hiraganaLevenshteinScore);
  const bestContainment = Math.max(containmentScore, hiraganaContainmentScore);
  const bestNgram = Math.max(ngramScore, hiraganaNgramScore);

  // 重み付き合計（包含スコアがある場合はボーナス）
  let score = bestLevenshtein * 0.4 + bestNgram * 0.4 + bestContainment * 0.2;

  // 包含スコアが高い場合はボーナス（略称や部分一致に強くする）
  if (bestContainment > 0.7) {
    score = Math.max(score, bestContainment * 0.9);
  }

  return { score, isExact: false };
}

// ======== メイン関数 ========

/**
 * 解析済み明細行を商品マスタとマッチングする
 * @param parsedItems 解析済み明細行の配列
 * @param companyId マッチング対象の会社ID
 * @returns マッチング結果の配列
 */
export async function matchProducts(
  parsedItems: ParsedLineItem[],
  companyId: string
): Promise<MatchedItem[]> {
  if (parsedItems.length === 0) return [];

  // 指定会社の商品マスタを取得
  const products = await prisma.product.findMany({
    where: {
      companyId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      code: true,
      price: true,
    },
  });

  // 商品マスタを正規化して検索用データを準備
  const productRecords: ProductRecord[] = products.map((p) => {
    const normalizedName = normalizeForMatching(p.name);
    return {
      id: p.id,
      name: p.name,
      code: p.code,
      price: Number(p.price),
      normalizedName,
      hiraganaName: katakanaToHiragana(normalizedName),
    };
  });

  // 各明細行に対してベストマッチを探す
  return parsedItems.map((parsedItem) => {
    if (!parsedItem.productName || productRecords.length === 0) {
      return {
        parsedItem,
        matchConfidence: 0,
        isExactMatch: false,
      };
    }

    let bestMatch: ProductRecord | undefined;
    let bestScore = 0;
    let isExact = false;

    for (const product of productRecords) {
      const { score, isExact: exact } = calculateMatchScore(
        parsedItem.productName,
        product
      );
      if (score > bestScore) {
        bestScore = score;
        bestMatch = product;
        isExact = exact;
      }
    }

    // 閾値以下のマッチは無視
    const MATCH_THRESHOLD = 0.3;
    if (bestScore < MATCH_THRESHOLD || !bestMatch) {
      return {
        parsedItem,
        matchConfidence: 0,
        isExactMatch: false,
      };
    }

    return {
      parsedItem,
      matchedProduct: {
        id: bestMatch.id,
        name: bestMatch.name,
        code: bestMatch.code,
        price: bestMatch.price,
      },
      matchConfidence: Math.round(bestScore * 100) / 100,
      isExactMatch: isExact,
    };
  });
}

/**
 * 会社IDなしで全商品からマッチングする（会社が特定できない場合のフォールバック）
 */
export async function matchProductsGlobal(
  parsedItems: ParsedLineItem[]
): Promise<MatchedItem[]> {
  if (parsedItems.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      code: true,
      price: true,
    },
  });

  const productRecords: ProductRecord[] = products.map((p) => {
    const normalizedName = normalizeForMatching(p.name);
    return {
      id: p.id,
      name: p.name,
      code: p.code,
      price: Number(p.price),
      normalizedName,
      hiraganaName: katakanaToHiragana(normalizedName),
    };
  });

  return parsedItems.map((parsedItem) => {
    if (!parsedItem.productName || productRecords.length === 0) {
      return {
        parsedItem,
        matchConfidence: 0,
        isExactMatch: false,
      };
    }

    let bestMatch: ProductRecord | undefined;
    let bestScore = 0;
    let isExact = false;

    for (const product of productRecords) {
      const { score, isExact: exact } = calculateMatchScore(
        parsedItem.productName,
        product
      );
      if (score > bestScore) {
        bestScore = score;
        bestMatch = product;
        isExact = exact;
      }
    }

    const MATCH_THRESHOLD = 0.3;
    if (bestScore < MATCH_THRESHOLD || !bestMatch) {
      return {
        parsedItem,
        matchConfidence: 0,
        isExactMatch: false,
      };
    }

    return {
      parsedItem,
      matchedProduct: {
        id: bestMatch.id,
        name: bestMatch.name,
        code: bestMatch.code,
        price: bestMatch.price,
      },
      matchConfidence: Math.round(bestScore * 100) / 100,
      isExactMatch: isExact,
    };
  });
}
