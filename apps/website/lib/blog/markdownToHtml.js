/**
 * Converts markdown-style text to safe HTML for blog content.
 * Handles **bold**, *italic*, bullet lists (- or *), numbered lists, and strips image syntax.
 */
export function markdownToHtml(text) {
  if (!text || typeof text !== 'string') return '';
  let html = text.replace(/\u2217/g, '*').replace(/\uFF0A/g, '*').replace(/\r\n?/g, '\n');
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '');
  html = html.replace(/\*\*([^*]+)\*\*/g, (_, g) => `<strong>${g}</strong>`);
  html = html.replace(/\*([^*]+)\*/g, (_, g) => `<em>${g}</em>`);
  const blocks = html.split(/\n\n+/);
  const result = blocks
    .map((block) => {
      const rawLines = block.split('\n').map((l) => l.replace(/\r$/, '').trim());
      const lines = rawLines.filter((l) => l !== '');
      if (lines.length === 0) return '';

      const first = lines[0];
      if (lines.length === 1 && first.startsWith('<em>') && first.endsWith('</em>')) {
        return `<p class="mb-4">${first}</p>`;
      }
      const orderedMatch = first.match(/^\d+\.\s+/);
      const unorderedMatch = first.match(/^[-*]\s+/);

      if (orderedMatch) {
        const listItems = lines
          .map((line) => line.replace(/^\d+\.\s+/, '').trim())
          .filter(Boolean)
          .map((line) => `<li>${line}</li>`)
          .join('');
        return `<ol class="list-decimal list-inside my-4 space-y-1">${listItems}</ol>`;
      }
      if (unorderedMatch) {
        const listItems = lines
          .map((line) => line.replace(/^[-*]\s+/, '').trim())
          .filter(Boolean)
          .map((line) => `<li>${line}</li>`)
          .join('');
        return `<ul class="list-disc list-inside my-4 space-y-1">${listItems}</ul>`;
      }

      return `<p class="mb-4">${lines.join(' ')}</p>`;
    })
    .filter(Boolean)
    .join('\n');
  return result.replace(/\*([^*]+)\*/g, (_, g) => `<em>${g}</em>`);
}
