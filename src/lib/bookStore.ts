import type { Book, PublishRecord } from "@/types/book";

const BOOKS_KEY = "book-archive-books";
const PUBLISH_KEY = "book-archive-publish";

export function getBooks(): Book[] {
  try {
    const raw = localStorage.getItem(BOOKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBooks(books: Book[]) {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

export function addOrUpdateBook(book: Book): Book[] {
  const books = getBooks();
  const existingIdx = books.findIndex((b) => b.fileName === book.fileName);
  if (existingIdx >= 0) {
    books[existingIdx] = { ...book, id: books[existingIdx].id, createdAt: books[existingIdx].createdAt };
  } else {
    books.push(book);
  }
  saveBooks(books);
  return books;
}

export function deleteBook(id: string): Book[] {
  const books = getBooks().filter((b) => b.id !== id);
  saveBooks(books);
  return books;
}

export function getPublishRecords(): PublishRecord[] {
  try {
    const raw = localStorage.getItem(PUBLISH_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addPublishRecord(record: PublishRecord) {
  const records = getPublishRecords();
  records.push(record);
  localStorage.setItem(PUBLISH_KEY, JSON.stringify(records));
}
