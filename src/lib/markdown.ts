/**
 * Minimal, XSS-safe markdown renderer.
 *
 * Strategy: HTML-escape EVERYTHING first, then re-introduce a small, known-safe
 * set of tags from markdown syntax. No raw HTML from user content can ever
 * survive the escape step, and link hrefs are restricted to http(s).
 *
 * Supported: # headings (1-3), **bold**, *italic*, `inline code`,
 * ``` code blocks ```, - lists, > quotes, [text](url), [[wiki links]].
 */

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeHref(url: string): string | null {
  const trimmed = url.trim();
  // Input reaches here already HTML-escaped, so quotes appear as entities.
  // Reject them outright: quotes are not valid URL characters, and dropping
  // such links entirely beats rendering a weird href.
  if (/&quot;|&#39;|&lt;|&gt;/.test(trimmed)) return null;
  if (/^https?:\/\/[^\s"'<>]+$/i.test(trimmed)) return trimmed;
  return null;
}

function renderInline(escaped: string): string {
  let out = escaped;

  // inline code first so other patterns don't fire inside it
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");

  // links: [text](url) — href validated, escaped text kept as-is
  out = out.replace(/\[([^\]\n]{1,200})\]\(([^)\s]{1,2000})\)/g, (m, text, url) => {
    const href = safeHref(url);
    if (!href) return m;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer nofollow">${text}</a>`;
  });

  // wiki links: [[Note title]]
  out = out.replace(
    /\[\[([^\]\n]{1,200})\]\]/g,
    `<span class="wikilink" data-title="$1">$1</span>`,
  );

  out = out.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");

  return out;
}

export function renderMarkdown(source: string): string {
  const escaped = escapeHtml(source);
  const lines = escaped.split("\n");
  const html: string[] = [];

  let inCode = false;
  let inList = false;
  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      closeList();
      html.push(inCode ? "</code></pre>" : "<pre><code>");
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      html.push(`${line}\n`);
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    const listItem = line.match(/^\s*[-*]\s+(.*)$/);
    if (listItem) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${renderInline(listItem[1])}</li>`);
      continue;
    }

    const quote = line.match(/^&gt;\s?(.*)$/);
    if (quote) {
      closeList();
      html.push(`<blockquote>${renderInline(quote[1])}</blockquote>`);
      continue;
    }

    closeList();
    if (line.trim() === "") continue;
    html.push(`<p>${renderInline(line)}</p>`);
  }

  if (inCode) html.push("</code></pre>");
  closeList();
  return html.join("");
}

/** Extract [[wiki link]] titles from raw markdown (for note linking). */
export function extractWikiLinks(source: string): string[] {
  const titles = new Set<string>();
  for (const m of source.matchAll(/\[\[([^\]\n]{1,200})\]\]/g)) {
    titles.add(m[1].trim());
  }
  return [...titles];
}
