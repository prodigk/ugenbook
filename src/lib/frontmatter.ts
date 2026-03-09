import type { Book, BookCategory } from "@/types/book";

interface FrontmatterResult {
  data: Record<string, unknown>;
  content: string;
}

export function parseFrontmatter(raw: string): FrontmatterResult {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const yamlBlock = match[1];
  const content = match[2];
  const data: Record<string, unknown> = {};

  for (const line of yamlBlock.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value: unknown = line.slice(colonIdx + 1).trim();

    // Handle arrays like [tag1, tag2]
    if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""));
    }
    // Remove surrounding quotes
    if (typeof value === "string") {
      value = (value as string).replace(/^["']|["']$/g, "");
    }

    data[key] = value;
  }

  return { data, content };
}

function inferCategory(tags: string[]): BookCategory {
  const tagStr = tags.join(" ").toLowerCase();
  if (tagStr.includes("경제") || tagStr.includes("금융") || tagStr.includes("투자") || tagStr.includes("부")) return "경제";
  if (tagStr.includes("인문")) return "인문";
  if (tagStr.includes("사회") || tagStr.includes("정치")) return "사회과학";
  if (tagStr.includes("커리어") || tagStr.includes("직장") || tagStr.includes("일")) return "커리어";
  if (tagStr.includes("철학")) return "철학";
  if (tagStr.includes("자기계발") || tagStr.includes("성장")) return "자기계발";
  if (tagStr.includes("문학") || tagStr.includes("소설")) return "문학";
  if (tagStr.includes("과학")) return "과학";
  return "기타";
}

export function mdToBook(fileName: string, raw: string): Book {
  const { data, content } = parseFrontmatter(raw);

  const tags = Array.isArray(data.tags)
    ? (data.tags as string[])
    : typeof data.tags === "string"
    ? [data.tags]
    : [];

  const title =
    (data.title as string) ||
    (data.bookname as string) ||
    fileName.replace(/^@_/, "").replace(/\.md$/, "").replace(/_/g, " ");

  const author = (data.author as string) || (data.bookauthor as string) || "미상";
  const bookcover = (data.bookcover as string) || "";
  const status = (data.status as string) === "완료" ? "완료" : "작성중";
  const category = (data.category as BookCategory) || inferCategory(tags);

  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    title,
    author,
    bookcover,
    tags,
    category,
    status: status as Book["status"],
    markdown: content,
    fileName,
    createdAt: now,
    updatedAt: now,
  };
}
