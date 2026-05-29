import type ReactMarkdown from "react-markdown";

// Colors match graph edge colors: amber=room, blue=tag, green=note, teal=date, violet=type
const TOKEN_CLASS: Record<string, string> = {
  "@": "text-amber-600 dark:text-amber-400",
  "#": "text-blue-600 dark:text-blue-400",
  "^": "text-emerald-600 dark:text-emerald-400",
  ">": "text-teal-600 dark:text-teal-400",
  "!": "text-violet-600 dark:text-violet-400",
};

// (?<!\w) prevents matching tokens embedded in words (e.g. x^2 or user@host)
const TOKEN_PATTERN = /(?<!\w)([#@^][\w-]+|!\w+|>\d{4}-\d{2}-\d{2})/g;

function highlightTokensInText(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const i = match.index!;
    if (i > last) parts.push(text.slice(last, i));
    const cls = TOKEN_CLASS[match[0][0]];
    if (cls) {
      parts.push(
        <code key={key++} className={`${cls} bg-transparent font-mono text-[0.83em] font-semibold`}>
          {match[0]}
        </code>,
      );
    } else {
      parts.push(match[0]);
    }
    last = i + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  if (parts.length === 0) return text;
  if (parts.length === 1) return parts[0];
  return <>{parts}</>;
}

function processChildren(children: React.ReactNode): React.ReactNode {
  if (typeof children === "string") return highlightTokensInText(children);
  if (Array.isArray(children)) {
    return children.map((child) => (typeof child === "string" ? highlightTokensInText(child) : child));
  }
  return children;
}

/** ReactMarkdown `components` map that colorizes token syntax in rendered preview. */
export const TOKEN_PREVIEW_COMPONENTS: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  p: ({ children }) => <p>{processChildren(children)}</p>,
  li: ({ children, ...props }) => <li {...props}>{processChildren(children)}</li>,
};
