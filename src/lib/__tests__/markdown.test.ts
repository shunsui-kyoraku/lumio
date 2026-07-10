import { describe, it, expect } from "vitest";
import { renderMarkdown, escapeHtml, extractWikiLinks } from "../markdown";

describe("XSS safety", () => {
  it("escapes script tags", () => {
    const html = renderMarkdown(`<script>alert(1)</script>`);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes img onerror payloads", () => {
    const html = renderMarkdown(`<img src=x onerror=alert(1)>`);
    expect(html).not.toContain("<img");
  });

  it("rejects javascript: URLs in links (no anchor is rendered)", () => {
    const html = renderMarkdown(`[click](javascript:alert(1))`);
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("href");
  });

  it("rejects data: URLs in links", () => {
    const html = renderMarkdown(`[x](data:text/html,<script>alert(1)</script>)`);
    expect(html).not.toContain('href="data:');
  });

  it("rejects URLs containing quotes (no anchor is rendered)", () => {
    const html = renderMarkdown(`[x](https://a.com/"onmouseover="alert(1))`);
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("href");
  });

  it("HTML inside emphasis stays escaped text, never becomes a tag", () => {
    const html = renderMarkdown(`**<b onclick="x">bold</b>**`);
    expect(html).not.toContain("<b ");
    expect(html).toContain("&lt;b onclick=&quot;x&quot;&gt;");
  });

  it("escapeHtml covers all dangerous characters", () => {
    expect(escapeHtml(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&#39;");
  });
});

describe("markdown rendering", () => {
  it("renders headings", () => {
    expect(renderMarkdown("# Title")).toContain("<h1>Title</h1>");
    expect(renderMarkdown("## Sub")).toContain("<h2>Sub</h2>");
  });

  it("renders bold, italic and inline code", () => {
    const html = renderMarkdown("**bold** *ital* `code`");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>ital</em>");
    expect(html).toContain("<code>code</code>");
  });

  it("renders safe http links with rel=noopener", () => {
    const html = renderMarkdown("[site](https://example.com/page)");
    expect(html).toContain('href="https://example.com/page"');
    expect(html).toContain('rel="noopener noreferrer nofollow"');
  });

  it("renders lists", () => {
    const html = renderMarkdown("- one\n- two");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>one</li>");
  });

  it("renders fenced code blocks without formatting inside", () => {
    const html = renderMarkdown("```\n**not bold**\n```");
    expect(html).toContain("<pre><code>");
    expect(html).toContain("**not bold**");
  });

  it("renders wiki links as spans with data-title", () => {
    const html = renderMarkdown("See [[My Note]]");
    expect(html).toContain('class="wikilink"');
    expect(html).toContain('data-title="My Note"');
  });
});

describe("wiki link extraction", () => {
  it("extracts unique titles", () => {
    expect(extractWikiLinks("a [[One]] b [[Two]] c [[One]]")).toEqual(["One", "Two"]);
  });
  it("returns empty for plain text", () => {
    expect(extractWikiLinks("nothing here")).toEqual([]);
  });
});
