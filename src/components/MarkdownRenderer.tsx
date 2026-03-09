import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Convert obsidian highlights ==text== to <mark>
  const processed = content.replace(/==(.+?)==/g, "<mark>$1</mark>");

  return (
    <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none
      prose-headings:font-serif prose-headings:text-foreground
      prose-p:text-foreground/90 prose-p:leading-relaxed
      prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
      prose-strong:text-foreground
      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
      prose-li:text-foreground/90
      [&_mark]:bg-primary/20 [&_mark]:px-1 [&_mark]:rounded-sm [&_mark]:text-foreground
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {processed}
      </ReactMarkdown>
    </div>
  );
}
