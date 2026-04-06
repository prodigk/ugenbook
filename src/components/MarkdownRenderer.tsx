import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface MarkdownRendererProps {
  content: string;
}

function stripFrontmatter(raw: string): string {
  const match = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
  return match ? match[1] : raw;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Strip frontmatter if present, then convert obsidian highlights
  const body = stripFrontmatter(content);
  const processed = body.replace(/==(.+?)==/g, "<mark>$1</mark>");

  return (
    <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none
      prose-headings:font-serif prose-headings:text-foreground
      prose-p:text-foreground/90 prose-p:leading-relaxed
      prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
      prose-strong:[color:hsl(var(--md-bold))]
      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
      prose-li:text-foreground/90
      [&_mark]:bg-primary/20 [&_mark]:px-1 [&_mark]:rounded-sm [&_mark]:text-foreground
      [&_u]:[color:hsl(var(--md-underline))] [&_u]:decoration-[hsl(var(--md-underline))]
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {processed}
      </ReactMarkdown>
    </div>
  );
}
