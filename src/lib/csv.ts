function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(rows: Array<Record<string, unknown>>, headers: string[]): string {
  const headerLine = headers.map(escapeCell).join(',');
  const lines = rows.map((row) =>
    headers.map((h) => escapeCell(row[h])).join(',')
  );
  // BOM so Excel opens UTF-8 correctly.
  return '﻿' + [headerLine, ...lines].join('\r\n');
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
