/**
 * Paragraph-aware chunking. Documents are split on blank lines, then greedily
 * packed into ~chunkChars-sized windows so each chunk stays a coherent unit
 * (a rent-roll table block, a covenant clause) for clean citations.
 */
export function chunkText(text: string, chunkChars = 700): string[] {
  const paras = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let buf = "";
  for (const p of paras) {
    if (buf && buf.length + p.length + 2 > chunkChars) {
      chunks.push(buf);
      buf = p;
    } else {
      buf = buf ? `${buf}\n\n${p}` : p;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}
