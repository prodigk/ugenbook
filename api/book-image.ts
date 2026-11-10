import type { IncomingMessage, ServerResponse } from "node:http";
import { isValidBookId, loadBookPreview, publicImageUrl } from "../server/bookPreview.js";
import { renderShareImage } from "../server/shareImage.js";

type Request = IncomingMessage & { query?: Record<string, string | string[] | undefined> };
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;

async function downloadCover(source: string): Promise<Buffer> {
  let currentUrl = source;
  for (let redirects = 0; redirects < 4; redirects++) {
    const upstream = await fetch(currentUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });
    if (upstream.status >= 300 && upstream.status < 400) {
      const location = upstream.headers.get("location");
      const nextUrl = location && publicImageUrl(new URL(location, currentUrl).href);
      if (!nextUrl) throw new Error("Invalid cover redirect");
      currentUrl = nextUrl;
      continue;
    }
    if (!upstream.ok || !upstream.body) throw new Error(`Cover returned ${upstream.status}`);
    const contentType = upstream.headers.get("content-type");
    if (contentType && !contentType.startsWith("image/")) throw new Error("Cover is not an image");
    if (Number(upstream.headers.get("content-length")) > MAX_SOURCE_BYTES) throw new Error("Cover is too large");

    const reader = upstream.body.getReader();
    const chunks: Buffer[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_SOURCE_BYTES) {
        await reader.cancel();
        throw new Error("Cover is too large");
      }
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks);
  }
  throw new Error("Too many cover redirects");
}

export default async function handler(request: Request, response: ServerResponse): Promise<void> {
  const queryId = request.query?.id;
  const id = Array.isArray(queryId) ? queryId[0] : queryId;
  if (!isValidBookId(id)) {
    response.statusCode = 404;
    response.end();
    return;
  }

  let source: string | null = null;
  try {
    const book = await loadBookPreview(id);
    source = publicImageUrl(book?.bookcover ?? null);
    if (!source) {
      response.statusCode = 404;
      response.end();
      return;
    }

    const image = await renderShareImage(await downloadCover(source));
    response.statusCode = 200;
    response.setHeader("Content-Type", "image/jpeg");
    response.setHeader("Cache-Control", "public, max-age=0, s-maxage=300");
    response.end(image);
  } catch (error) {
    console.error("Book share image failed", error);
    if (source) {
      response.statusCode = 302;
      response.setHeader("Location", source);
    } else {
      response.statusCode = 500;
    }
    response.end();
  }
}
