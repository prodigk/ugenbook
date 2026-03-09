export type BookStatus = "작성중" | "완료";

export type BookCategory = 
  | "경제" 
  | "인문" 
  | "사회과학" 
  | "커리어" 
  | "철학" 
  | "자기계발" 
  | "문학" 
  | "과학" 
  | "기타";

export interface Book {
  id: string;
  title: string;
  author: string;
  bookcover: string;
  tags: string[];
  category: BookCategory;
  status: BookStatus;
  markdown: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublishRecord {
  id: string;
  bookId: string;
  platform: "naver" | "brunch";
  publishedAt: string;
  publishUrl?: string;
}

export type SortOption = "newest" | "author" | "title";
