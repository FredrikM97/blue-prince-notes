import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders markdown body content with GFM (tables, strikethrough, etc). */
export function MarkdownPreview({ children }: { children: string }) {
  if (!children.trim()) return null;
  return (
    <div className="markdown-preview-surface prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
