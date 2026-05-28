export interface TableBlock {
  start: number;
  end: number;
  text: string;
}

export function formatTableMarkdown(source: string) {
  const trimmed = source.trim();
  if (!trimmed) return null;

  const parsedRows = trimmed
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ raw: line, cells: parseTableRow(line) }));

  const rows = parsedRows
    .filter(({ raw, cells }) => !isSeparatorLine(raw) && !isSeparatorRow(cells))
    .map(({ cells }) => cells);

  if (rows.length === 0) return null;

  const maxCols = Math.max(...rows.map((row) => row.length));
  if (maxCols < 2) return null;

  const normalized = rows.map((row) => {
    const filled = [...row];
    while (filled.length < maxCols) filled.push("");
    return filled;
  });

  const header = normalized[0].map((cell, idx) => cell || `Column ${idx + 1}`);
  const body = normalized.slice(1);

  const colWidths = header.map((cell, colIdx) => {
    const bodyWidth = Math.max(0, ...body.map((row) => row[colIdx].length));
    return Math.max(cell.length, bodyWidth, 3);
  });

  const formatRow = (row: string[]) =>
    `| ${row.map((cell, idx) => cell.padEnd(colWidths[idx], " ")).join(" | ")} |`;
  const separator = `| ${colWidths.map((w) => "-".repeat(w)).join(" | ")} |`;

  const lines = [formatRow(header), separator, ...body.map((row) => formatRow(row))];
  return lines.join("\n");
}

export function findTableBlockAtCursor(value: string, cursorPos: number): TableBlock | null {
  const lines = value.split("\n");
  let currentLine = 0;
  let offset = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const lineLength = lines[i].length;
    if (cursorPos <= offset + lineLength) {
      currentLine = i;
      break;
    }
    offset += lineLength + 1;
    currentLine = i;
  }

  if (!isTableLikeLine(lines[currentLine])) return null;

  let startLine = currentLine;
  let endLine = currentLine;
  while (startLine > 0 && isTableLikeLine(lines[startLine - 1])) startLine -= 1;
  while (endLine < lines.length - 1 && isTableLikeLine(lines[endLine + 1])) endLine += 1;

  if (endLine - startLine < 1) return null;

  const start = lines.slice(0, startLine).reduce((acc, line) => acc + line.length + 1, 0);
  const text = lines.slice(startLine, endLine + 1).join("\n");
  const end = start + text.length;

  return { start, end, text };
}

export function formatAllMarkdownTables(markdown: string) {
  const trailingNewline = markdown.endsWith("\n");
  const lines = markdown.split("\n");
  const out: string[] = [];

  let i = 0;
  while (i < lines.length) {
    if (!isTableLikeLine(lines[i])) {
      out.push(lines[i]);
      i += 1;
      continue;
    }

    let j = i;
    while (j < lines.length && isTableLikeLine(lines[j])) j += 1;
    const blockLines = lines.slice(i, j);

    if (blockLines.length < 2) {
      out.push(...blockLines);
      i = j;
      continue;
    }

    const formatted = formatTableMarkdown(blockLines.join("\n"));
    out.push(...(formatted ? formatted.split("\n") : blockLines));
    i = j;
  }

  const result = out.join("\n");
  return trailingNewline && !result.endsWith("\n") ? `${result}\n` : result;
}

function parseTableRow(line: string) {
  const bare = line.replace(/^\||\|$/g, "").trim();
  if (bare.includes("|")) {
    return bare.split("|").map((cell) => cell.trim());
  }
  if (bare.includes("\t")) {
    return bare.split("\t").map((cell) => cell.trim());
  }
  if (bare.includes(",")) {
    return bare.split(",").map((cell) => cell.trim());
  }
  return [bare];
}

function isSeparatorCell(cell: string) {
  return /^:?-{3,}:?$/.test(cell.trim());
}

function isSeparatorLine(line: string) {
  const raw = line.trim();
  if (!raw.includes("|")) return false;
  const bare = raw.replace(/^\||\|$/g, "").trim();
  return /^:?-{3,}:?(\s*\|\s*:?-{3,}:?)+/.test(bare);
}

function isSeparatorRow(row: string[]) {
  if (row.length <= 1) return false;
  if (row.every((cell) => isSeparatorCell(cell))) return true;

  // Treat malformed markdown separator rows as separators too, e.g. "|---|-----| asd"
  return row.length >= 2 && isSeparatorCell(row[0]) && isSeparatorCell(row[1]);
}

function isTableLikeLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return trimmed.includes("|");
}
