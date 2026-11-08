const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHORT_CODE_PATTERN = /^[A-Za-z0-9_-]{22}$/;

export function bookIdToShortCode(id: string): string {
  if (!UUID_PATTERN.test(id)) throw new Error("올바르지 않은 도서 ID입니다.");

  const hex = id.replace(/-/g, "");
  const bytes = hex.match(/.{2}/g)!.map((part) => String.fromCharCode(parseInt(part, 16)));
  return btoa(bytes.join("")).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function shortCodeToBookId(code: string): string | null {
  if (!SHORT_CODE_PATTERN.test(code)) return null;

  try {
    const binary = atob(code.replace(/-/g, "+").replace(/_/g, "/") + "==");
    if (binary.length !== 16) return null;
    const hex = Array.from(binary, (char) => char.charCodeAt(0).toString(16).padStart(2, "0")).join("");
    const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    return bookIdToShortCode(id) === code ? id : null;
  } catch {
    return null;
  }
}
