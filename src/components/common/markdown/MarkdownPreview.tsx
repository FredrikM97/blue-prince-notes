import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TOKEN_PREVIEW_COMPONENTS } from "@/components/common/markdown/MarkdownTokenPreview";

/** Renders markdown body content with GFM and token color highlighting. */
export function MarkdownPreview({ children }: { children: string }) {
  if (!children.trim()) return null;
  return (
    <div className="markdown-preview-surface prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={TOKEN_PREVIEW_COMPONENTS}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
