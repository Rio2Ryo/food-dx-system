// 会計ソフト連携用エクスポートユーティリティ

type JournalLineData = {
  accountCode: string;
  accountName: string;
  debitAmount: string | number;
  creditAmount: string | number;
  taxCategory: string | null;
  description: string | null;
};

type JournalEntryData = {
  entryDate: string | Date;
  description: string;
  lines: JournalLineData[];
};

function formatDate(date: string | Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * 弥生会計CSV形式でエクスポート
 * 弥生会計のインポート仕様に準拠
 */
export function exportToYayoi(entries: JournalEntryData[]): string {
  const headers = [
    "識別フラグ",
    "伝票No.",
    "決算",
    "取引日付",
    "借方勘定科目",
    "借方補助科目",
    "借方部門",
    "借方税区分",
    "借方金額",
    "借方税金額",
    "貸方勘定科目",
    "貸方補助科目",
    "貸方部門",
    "貸方税区分",
    "貸方金額",
    "貸方税金額",
    "摘要",
    "番号",
    "期日",
    "タイプ",
    "生成元",
  ];

  const rows: string[] = [headers.map(escapeCsvField).join(",")];
  let slipNo = 1;

  for (const entry of entries) {
    const debitLines = entry.lines.filter((l) => Number(l.debitAmount) > 0);
    const creditLines = entry.lines.filter((l) => Number(l.creditAmount) > 0);

    // 借方と貸方をペアにして出力
    const maxLines = Math.max(debitLines.length, creditLines.length);
    for (let i = 0; i < maxLines; i++) {
      const debit = debitLines[i];
      const credit = creditLines[i];

      const row = [
        "2111", // 識別フラグ（仕訳データ）
        String(slipNo),
        "", // 決算
        formatDate(entry.entryDate),
        debit ? escapeCsvField(debit.accountName) : "",
        "", // 借方補助科目
        "", // 借方部門
        debit ? escapeCsvField(debit.taxCategory ?? "") : "",
        debit ? String(Math.round(Number(debit.debitAmount))) : "0",
        "0", // 借方税金額
        credit ? escapeCsvField(credit.accountName) : "",
        "", // 貸方補助科目
        "", // 貸方部門
        credit ? escapeCsvField(credit.taxCategory ?? "") : "",
        credit ? String(Math.round(Number(credit.creditAmount))) : "0",
        "0", // 貸方税金額
        escapeCsvField(
          debit?.description || credit?.description || entry.description
        ),
        "", // 番号
        "", // 期日
        "0", // タイプ
        "0", // 生成元
      ];
      rows.push(row.join(","));
    }
    slipNo++;
  }

  return rows.join("\r\n");
}

/**
 * freee CSV形式でエクスポート
 * freeeの汎用仕訳インポート形式に準拠
 */
export function exportToFreee(entries: JournalEntryData[]): string {
  const headers = [
    "取引日",
    "決算整理仕訳",
    "借方勘定科目",
    "借方補助科目",
    "借方税区分",
    "借方金額(税込)",
    "借方税額",
    "貸方勘定科目",
    "貸方補助科目",
    "貸方税区分",
    "貸方金額(税込)",
    "貸方税額",
    "摘要",
  ];

  const rows: string[] = [headers.map(escapeCsvField).join(",")];

  for (const entry of entries) {
    const debitLines = entry.lines.filter((l) => Number(l.debitAmount) > 0);
    const creditLines = entry.lines.filter((l) => Number(l.creditAmount) > 0);

    const maxLines = Math.max(debitLines.length, creditLines.length);
    for (let i = 0; i < maxLines; i++) {
      const debit = debitLines[i];
      const credit = creditLines[i];

      const row = [
        formatDate(entry.entryDate),
        "NO", // 決算整理仕訳
        debit ? escapeCsvField(debit.accountName) : "",
        "", // 借方補助科目
        debit ? escapeCsvField(debit.taxCategory ?? "対象外") : "",
        debit ? String(Math.round(Number(debit.debitAmount))) : "0",
        "0", // 借方税額
        credit ? escapeCsvField(credit.accountName) : "",
        "", // 貸方補助科目
        credit ? escapeCsvField(credit.taxCategory ?? "対象外") : "",
        credit ? String(Math.round(Number(credit.creditAmount))) : "0",
        "0", // 貸方税額
        escapeCsvField(
          debit?.description || credit?.description || entry.description
        ),
      ];
      rows.push(row.join(","));
    }
  }

  return rows.join("\r\n");
}

/**
 * マネーフォワード CSV形式でエクスポート
 */
export function exportToMoneyForward(entries: JournalEntryData[]): string {
  const headers = [
    "取引No",
    "取引日",
    "借方勘定科目",
    "借方補助科目",
    "借方税区分",
    "借方金額",
    "貸方勘定科目",
    "貸方補助科目",
    "貸方税区分",
    "貸方金額",
    "摘要",
  ];

  const rows: string[] = [headers.map(escapeCsvField).join(",")];
  let txNo = 1;

  for (const entry of entries) {
    const debitLines = entry.lines.filter((l) => Number(l.debitAmount) > 0);
    const creditLines = entry.lines.filter((l) => Number(l.creditAmount) > 0);

    const maxLines = Math.max(debitLines.length, creditLines.length);
    for (let i = 0; i < maxLines; i++) {
      const debit = debitLines[i];
      const credit = creditLines[i];

      const row = [
        String(txNo),
        formatDate(entry.entryDate),
        debit ? escapeCsvField(debit.accountName) : "",
        "", // 借方補助科目
        debit ? escapeCsvField(debit.taxCategory ?? "") : "",
        debit ? String(Math.round(Number(debit.debitAmount))) : "0",
        credit ? escapeCsvField(credit.accountName) : "",
        "", // 貸方補助科目
        credit ? escapeCsvField(credit.taxCategory ?? "") : "",
        credit ? String(Math.round(Number(credit.creditAmount))) : "0",
        escapeCsvField(
          debit?.description || credit?.description || entry.description
        ),
      ];
      rows.push(row.join(","));
    }
    txNo++;
  }

  return rows.join("\r\n");
}

/**
 * 汎用CSV形式でエクスポート
 */
export function exportToGenericCsv(entries: JournalEntryData[]): string {
  const headers = [
    "日付",
    "借方勘定科目コード",
    "借方勘定科目名",
    "借方金額",
    "貸方勘定科目コード",
    "貸方勘定科目名",
    "貸方金額",
    "税区分",
    "摘要",
  ];

  const rows: string[] = [headers.map(escapeCsvField).join(",")];

  for (const entry of entries) {
    const debitLines = entry.lines.filter((l) => Number(l.debitAmount) > 0);
    const creditLines = entry.lines.filter((l) => Number(l.creditAmount) > 0);

    const maxLines = Math.max(debitLines.length, creditLines.length);
    for (let i = 0; i < maxLines; i++) {
      const debit = debitLines[i];
      const credit = creditLines[i];

      const row = [
        formatDate(entry.entryDate),
        debit ? escapeCsvField(debit.accountCode) : "",
        debit ? escapeCsvField(debit.accountName) : "",
        debit ? String(Math.round(Number(debit.debitAmount))) : "0",
        credit ? escapeCsvField(credit.accountCode) : "",
        credit ? escapeCsvField(credit.accountName) : "",
        credit ? String(Math.round(Number(credit.creditAmount))) : "0",
        escapeCsvField(
          debit?.taxCategory || credit?.taxCategory || ""
        ),
        escapeCsvField(
          debit?.description || credit?.description || entry.description
        ),
      ];
      rows.push(row.join(","));
    }
  }

  return rows.join("\r\n");
}
