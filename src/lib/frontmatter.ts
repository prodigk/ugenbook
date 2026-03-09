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

  const lines = yamlBlock.split("\n");
  let currentKey = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Array item (  - value)
    const arrayMatch = line.match(/^\s+-\s+(.+)$/);
    if (arrayMatch && currentKey) {
      if (!Array.isArray(data[currentKey])) {
        data[currentKey] = [];
      }
      (data[currentKey] as string[]).push(arrayMatch[1].trim().replace(/^["']|["']$/g, ""));
      continue;
    }

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value: unknown = line.slice(colonIdx + 1).trim();

    currentKey = key;

    // Empty value means next lines might be array items
    if (value === "") continue;

    // Handle inline arrays like [tag1, tag2]
    if (typeof value === "string" && (value as string).startsWith("[") && (value as string).endsWith("]")) {
      value = (value as string)
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

function inferCategory(title: string, tags: string[], content: string): BookCategory {
  const combined = [title, ...tags, content.slice(0, 500)].join(" ").toLowerCase();
  if (combined.includes("경제") || combined.includes("금융") || combined.includes("투자") || combined.includes("돈") || combined.includes("부자") || combined.includes("재테크")) return "경제";
  if (combined.includes("인문")) return "인문";
  if (combined.includes("사회") || combined.includes("정치")) return "사회과학";
  if (combined.includes("커리어") || combined.includes("직장") || combined.includes("취업") || combined.includes("이직")) return "커리어";
  if (combined.includes("철학")) return "철학";
  if (combined.includes("자기계발") || combined.includes("성장") || combined.includes("습관") || combined.includes("심리")) return "자기계발";
  if (combined.includes("문학") || combined.includes("소설") || combined.includes("시집") || combined.includes("에세이")) return "문학";
  if (combined.includes("과학") || combined.includes("물리") || combined.includes("생물")) return "과학";
  if (combined.includes("마케팅") || combined.includes("판매") || combined.includes("창업") || combined.includes("사업")) return "커리어";
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
    fileName
      .replace(/^@_?/, "")
      .replace(/\.md$/, "")
      .replace(/_/g, " ")
      .trim();

  // Strip leading '@' from title if present
  const cleanTitle = title.replace(/^@\s*/, "").trim();

  const author = (data.author as string) || (data.Author as string) || (data.bookauthor as string) || "미상";
  const bookcover = (data.bookcover as string) || "";
  const status = (data.status as string) === "완료" ? "완료" : "작성중";
  const category = (data.category as BookCategory) || inferCategory(cleanTitle, tags, content);

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
