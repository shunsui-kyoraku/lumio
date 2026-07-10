"use client";

import { useMemo } from "react";
import { renderMarkdown } from "@/lib/markdown";

/**
 * Renders user/AI markdown through our sanitizing renderer. The renderer
 * HTML-escapes ALL input before re-introducing a fixed set of safe tags, so
 * this dangerouslySetInnerHTML sink only ever receives sanitized output.
 */
export default function Markdown({ source, className = "" }: { source: string; className?: string }) {
  const html = useMemo(() => renderMarkdown(source), [source]);
  return <div className={`prose-st ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
