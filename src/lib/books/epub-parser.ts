/**
 * Zero-Dependency EPUB & Markdown Parser for Taleora
 * Compatible with modern browser Web APIs and Node.js (Edge & Server).
 * Uses native DecompressionStream("deflate-raw") without external npm packages.
 */

export interface ParsedChapter {
  chapterNumber: number;
  title: string;
  slug: string;
  content: string;
  wordCount: number;
  estimatedReadMinutes: number;
}

export interface ParsedStoryBook {
  title: string;
  subtitle: string;
  authorName: string;
  description: string;
  coverDataUrl?: string | null;
  coverMimeType?: string | null;
  coverBytes?: Uint8Array | null;
  chapters: ParsedChapter[];
  totalWords: number;
  totalEstimatedMinutes: number;
}

/**
 * Clean HTML markup into beautiful, readable prose with paragraph spacing.
 */
export function cleanHtmlToProse(htmlStr: string): string {
  if (!htmlStr) return "";
  let text = htmlStr;
  text = text.replace(/<!--[\s\S]*?-->/g, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<script[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<head[\s\S]*?<\/head>/gi, "");
  text = text.replace(/<(p|div|br|h[1-6]|li|tr)[^>]*>/gi, "\n\n");
  text = text.replace(/<[^>]+>/g, "");
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "…");

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.join("\n\n");
}

/**
 * Generate a clean URL-friendly slug.
 */
export function slugifyText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Extract text from simple XML/HTML tag using regex.
 */
function extractTagContent(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(re);
  if (!m) return "";
  return cleanHtmlToProse(m[1]).trim();
}

/**
 * Lightweight ZIP extractor using native DecompressionStream.
 */
class SimpleZipReader {
  private view: DataView;
  private bytes: Uint8Array;

  constructor(arrayBuffer: ArrayBuffer) {
    this.bytes = new Uint8Array(arrayBuffer);
    this.view = new DataView(arrayBuffer);
  }

  async readEntries(): Promise<Map<string, { method: number; compressed: Uint8Array }>> {
    const entries = new Map<string, { method: number; compressed: Uint8Array }>();
    const totalBytes = this.bytes.length;

    // Find End of Central Directory (EOCD) signature 0x06054b50 from the end
    let eocdOffset = -1;
    for (let i = totalBytes - 22; i >= Math.max(0, totalBytes - 65558); i--) {
      if (this.view.getUint32(i, true) === 0x06054b50) {
        eocdOffset = i;
        break;
      }
    }

    if (eocdOffset !== -1) {
      // Read Central Directory
      const cdCount = this.view.getUint16(eocdOffset + 10, true);
      const cdOffset = this.view.getUint32(eocdOffset + 16, true);

      let offset = cdOffset;
      for (let i = 0; i < cdCount && offset < eocdOffset; i++) {
        if (this.view.getUint32(offset, true) !== 0x02014b50) break;
        const method = this.view.getUint16(offset + 10, true);
        const compSize = this.view.getUint32(offset + 20, true);
        const fnLen = this.view.getUint16(offset + 28, true);
        const extraLen = this.view.getUint16(offset + 30, true);
        const commentLen = this.view.getUint16(offset + 32, true);
        const localHeaderOffset = this.view.getUint32(offset + 42, true);

        const nameBytes = this.bytes.subarray(offset + 46, offset + 46 + fnLen);
        const filename = new TextDecoder().decode(nameBytes);

        // Resolve data from local header
        if (localHeaderOffset + 30 < totalBytes) {
          const localFnLen = this.view.getUint16(localHeaderOffset + 26, true);
          const localExtraLen = this.view.getUint16(localHeaderOffset + 28, true);
          const dataStart = localHeaderOffset + 30 + localFnLen + localExtraLen;
          const compressed = this.bytes.subarray(dataStart, dataStart + compSize);
          entries.set(filename, { method, compressed });
        }

        offset += 46 + fnLen + extraLen + commentLen;
      }
    } else {
      // Fallback: Scan Local File Headers (0x04034b50) sequentially
      let offset = 0;
      while (offset + 30 <= totalBytes) {
        if (this.view.getUint32(offset, true) !== 0x04034b50) break;
        const method = this.view.getUint16(offset + 8, true);
        const compSize = this.view.getUint32(offset + 18, true);
        const fnLen = this.view.getUint16(offset + 26, true);
        const extraLen = this.view.getUint16(offset + 28, true);

        const nameBytes = this.bytes.subarray(offset + 30, offset + 30 + fnLen);
        const filename = new TextDecoder().decode(nameBytes);
        const dataStart = offset + 30 + fnLen + extraLen;
        const compressed = this.bytes.subarray(dataStart, dataStart + compSize);

        entries.set(filename, { method, compressed });
        offset = dataStart + compSize;
      }
    }

    return entries;
  }

  async decompress(entry: { method: number; compressed: Uint8Array }): Promise<Uint8Array> {
    if (entry.method === 0) {
      return entry.compressed;
    }
    if (entry.method === 8) {
      // Deflate
      const ds = new DecompressionStream("deflate-raw");
      const writer = ds.writable.getWriter();
      writer.write(entry.compressed as unknown as BufferSource);
      writer.close();
      const arrayBuffer = await new Response(ds.readable).arrayBuffer();
      return new Uint8Array(arrayBuffer);
    }
    throw new Error(`Unsupported ZIP compression method: ${entry.method}`);
  }

  async getFileText(
    entries: Map<string, { method: number; compressed: Uint8Array }>,
    filename: string
  ): Promise<string | null> {
    const entry = entries.get(filename) || entries.get(filename.replace(/^\/+/, ""));
    if (!entry) return null;
    const decompressed = await this.decompress(entry);
    return new TextDecoder("utf-8").decode(decompressed);
  }

  async getFileBytes(
    entries: Map<string, { method: number; compressed: Uint8Array }>,
    filename: string
  ): Promise<Uint8Array | null> {
    const entry = entries.get(filename) || entries.get(filename.replace(/^\/+/, ""));
    if (!entry) return null;
    return await this.decompress(entry);
  }
}

/**
 * Parses an EPUB file buffer into a structured Taleora Story Book.
 */
export async function parseEpubBuffer(arrayBuffer: ArrayBuffer): Promise<ParsedStoryBook> {
  const zip = new SimpleZipReader(arrayBuffer);
  const entries = await zip.readEntries();

  // 1. Locate container.xml
  const containerXml = await zip.getFileText(entries, "META-INF/container.xml");
  if (!containerXml) {
    throw new Error("Invalid EPUB: META-INF/container.xml not found.");
  }

  const opfMatch = containerXml.match(/full-path=["']([^"']+)["']/i);
  if (!opfMatch) {
    throw new Error("Invalid EPUB: No OPF rootfile path found in container.xml.");
  }

  const opfPath = opfMatch[1].trim();
  const opfBaseDir = opfPath.includes("/") ? opfPath.substring(0, opfPath.lastIndexOf("/") + 1) : "";
  const opfXml = await zip.getFileText(entries, opfPath);

  if (!opfXml) {
    throw new Error(`Invalid EPUB: Rootfile not found at ${opfPath}`);
  }

  // 2. Extract Metadata
  const title =
    extractTagContent(opfXml, "dc:title") ||
    extractTagContent(opfXml, "title") ||
    "Untitled Story";

  const authorName =
    extractTagContent(opfXml, "dc:creator") ||
    extractTagContent(opfXml, "creator") ||
    "Independent Author";

  const description =
    extractTagContent(opfXml, "dc:description") ||
    extractTagContent(opfXml, "description") ||
    "";

  // 3. Extract Manifest Items & Spine
  const manifestMap = new Map<string, { href: string; mediaType: string; properties?: string }>();
  const itemRegex = /<item\s+[^>]*id=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*media-type=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(opfXml)) !== null) {
    const id = match[1];
    const href = match[2];
    const mediaType = match[3];
    manifestMap.set(id, { href, mediaType });
  }

  // Cover image extraction
  let coverDataUrl: string | null = null;
  let coverMimeType: string | null = null;
  let coverBytes: Uint8Array | null = null;

  // Search cover by id="cover" or properties="cover-image"
  let coverHref: string | null = null;
  for (const [id, item] of manifestMap.entries()) {
    if (
      id.toLowerCase().includes("cover") ||
      item.href.toLowerCase().includes("cover")
    ) {
      if (item.mediaType.startsWith("image/")) {
        coverHref = item.href;
        coverMimeType = item.mediaType;
        break;
      }
    }
  }

  if (coverHref) {
    const fullCoverPath = opfBaseDir + coverHref;
    const imgBytes = await zip.getFileBytes(entries, fullCoverPath);
    if (imgBytes && imgBytes.length > 0) {
      coverBytes = imgBytes;
      let binary = "";
      const len = imgBytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(imgBytes[i]);
      }
      const b64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(imgBytes).toString("base64");
      coverDataUrl = `data:${coverMimeType || "image/jpeg"};base64,${b64}`;
    }
  }

  // 4. Extract Spine and Read Chapters
  const spineItems: string[] = [];
  const itemrefRegex = /<itemref\s+[^>]*idref=["']([^"']+)["'][^>]*>/gi;
  while ((match = itemrefRegex.exec(opfXml)) !== null) {
    spineItems.push(match[1]);
  }

  const chapters: ParsedChapter[] = [];
  let chapterIndex = 1;

  for (const idref of spineItems) {
    const manifestItem = manifestMap.get(idref);
    if (!manifestItem) continue;

    const chapterPath = opfBaseDir + manifestItem.href;
    const chapterHtml = await zip.getFileText(entries, chapterPath);
    if (!chapterHtml) continue;

    const cleanText = cleanHtmlToProse(chapterHtml);
    if (cleanText.trim().length < 40) {
      // Skip empty covers, copyright notices, or table of contents pages with less than 40 chars
      continue;
    }

    // Detect Chapter Title
    const h1 = extractTagContent(chapterHtml, "h1");
    const h2 = extractTagContent(chapterHtml, "h2");
    const htmlTitle = extractTagContent(chapterHtml, "title");
    const detectedTitle =
      h1 ||
      h2 ||
      (htmlTitle && !htmlTitle.toLowerCase().includes("chapter") ? htmlTitle : "") ||
      `Chapter ${chapterIndex}`;

    const words = cleanText.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const estimatedReadMinutes = Math.max(1, Math.ceil(wordCount / 220));

    chapters.push({
      chapterNumber: chapterIndex,
      title: detectedTitle.length > 60 ? detectedTitle.slice(0, 57) + "…" : detectedTitle,
      slug: `chapter-${chapterIndex}-${slugifyText(detectedTitle).slice(0, 30)}`,
      content: cleanText,
      wordCount,
      estimatedReadMinutes,
    });

    chapterIndex++;
  }

  if (chapters.length === 0) {
    throw new Error("No readable chapter content found inside EPUB archive.");
  }

  const totalWords = chapters.reduce((sum, c) => sum + c.wordCount, 0);
  const totalEstimatedMinutes = chapters.reduce((sum, c) => sum + c.estimatedReadMinutes, 0);

  return {
    title,
    subtitle: `A novel by ${authorName}`,
    authorName,
    description,
    coverDataUrl,
    coverMimeType,
    coverBytes,
    chapters,
    totalWords,
    totalEstimatedMinutes,
  };
}

/**
 * Parses Markdown or Plain Text manuscripts.
 */
export function parseMarkdownManuscript(rawText: string, defaultTitle: string = "Imported Manuscript"): ParsedStoryBook {
  let text = rawText.trim();
  let title = defaultTitle;
  let authorName = "Author";
  let description = "";

  // Check frontmatter
  if (text.startsWith("---")) {
    const endFm = text.indexOf("---", 3);
    if (endFm !== -1) {
      const fmContent = text.slice(3, endFm);
      text = text.slice(endFm + 3).trim();

      const titleMatch = fmContent.match(/title:\s*["']?([^"'\n\r]+)["']?/i);
      if (titleMatch) title = titleMatch[1].trim();

      const authorMatch = fmContent.match(/author:\s*["']?([^"'\n\r]+)["']?/i);
      if (authorMatch) authorName = authorMatch[1].trim();

      const descMatch = fmContent.match(/description:\s*["']?([^"'\n\r]+)["']?/i);
      if (descMatch) description = descMatch[1].trim();
    }
  }

  // Split by Chapter headings
  const chapterRegex = /(?:^|\n)(#{1,2}\s+(?:Chapter|\d+|Act|Part)[\s\S]*?)(?=(?:\n#{1,2}\s+(?:Chapter|\d+|Act|Part))|$)/gi;
  const matches = [...text.matchAll(chapterRegex)];

  const chapters: ParsedChapter[] = [];

  if (matches.length > 0) {
    let chNum = 1;
    for (const m of matches) {
      const section = m[1].trim();
      const firstLineEnd = section.indexOf("\n");
      const heading = (firstLineEnd !== -1 ? section.slice(0, firstLineEnd) : section).replace(/^#+\s*/, "").trim();
      const body = firstLineEnd !== -1 ? section.slice(firstLineEnd).trim() : "";

      if (body.length < 20) continue;

      const words = body.split(/\s+/).filter(Boolean);
      const wordCount = words.length;

      chapters.push({
        chapterNumber: chNum,
        title: heading || `Chapter ${chNum}`,
        slug: `chapter-${chNum}-${slugifyText(heading).slice(0, 30)}`,
        content: body,
        wordCount,
        estimatedReadMinutes: Math.max(1, Math.ceil(wordCount / 220)),
      });
      chNum++;
    }
  }

  // If no chapter headers were matched, import as a single complete novella chapter
  if (chapters.length === 0) {
    const words = text.split(/\s+/).filter(Boolean);
    chapters.push({
      chapterNumber: 1,
      title: "Chapter 1",
      slug: "chapter-1-opening",
      content: text,
      wordCount: words.length,
      estimatedReadMinutes: Math.max(1, Math.ceil(words.length / 220)),
    });
  }

  const totalWords = chapters.reduce((sum, c) => sum + c.wordCount, 0);
  const totalEstimatedMinutes = chapters.reduce((sum, c) => sum + c.estimatedReadMinutes, 0);

  return {
    title,
    subtitle: `By ${authorName}`,
    authorName,
    description,
    chapters,
    totalWords,
    totalEstimatedMinutes,
  };
}
