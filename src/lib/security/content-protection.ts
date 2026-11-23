/**
 * Advanced content protection and digital watermarking utilities for Taleora.
 * Protects serialized fiction from unauthorized redistribution, automated scraping,
 * and intellectual property piracy.
 */

const ZW_ZERO = "\u200B"; // Zero-Width Space represents binary 0
const ZW_ONE = "\u200C";  // Zero-Width Non-Joiner represents binary 1
const ZW_DELIM = "\u200D"; // Zero-Width Joiner represents boundary delimiter

/**
 * Encodes a user identifier into an invisible zero-width unicode sequence.
 */
export function encodeWatermark(id: string): string {
  if (!id) return "";
  let binary = "";
  for (let i = 0; i < id.length; i++) {
    const binChar = id.charCodeAt(i).toString(2).padStart(8, "0");
    binary += binChar;
  }

  let encoded = ZW_DELIM;
  for (const bit of binary) {
    encoded += bit === "1" ? ZW_ONE : ZW_ZERO;
  }
  encoded += ZW_DELIM;

  return encoded;
}

/**
 * Extracts and decodes any hidden zero-width watermark sequence from suspected leaked text.
 */
export function extractContentWatermark(text: string): string | null {
  if (!text) return null;

  const match = text.match(new RegExp(`${ZW_DELIM}([\\u200B\\u200C]+)${ZW_DELIM}`));
  if (!match || !match[1]) return null;

  const rawBits = match[1];
  let binary = "";
  for (const char of rawBits) {
    if (char === ZW_ONE) binary += "1";
    else if (char === ZW_ZERO) binary += "0";
  }

  let decoded = "";
  for (let i = 0; i < binary.length; i += 8) {
    const byte = binary.slice(i, i + 8);
    if (byte.length === 8) {
      decoded += String.fromCharCode(parseInt(byte, 2));
    }
  }

  return decoded || null;
}

/**
 * Injects an invisible watermark into chapter content paragraphs.
 * Seamlessly integrates into paragraph ends without affecting visual rendering.
 */
export function injectContentWatermark(content: string, userId: string): string {
  if (!content || !userId) return content;
  const watermark = encodeWatermark(userId);

  // Inject at the end of the second paragraph if multi-paragraph, or at the end
  if (content.includes("\n\n")) {
    const parts = content.split("\n\n");
    if (parts.length > 1) {
      parts[1] = `${parts[1]}${watermark}`;
      return parts.join("\n\n");
    }
  }

  return `${content}${watermark}`;
}

/**
 * Returns security attributes and CSS classes to discourage casual text selection/copying
 * on protected serial chapters.
 */
export function getProtectedContentProps(isProtected = true) {
  if (!isProtected) return {};

  return {
    className: "select-text reader-protected-content",
    onContextMenu: (e: React.MouseEvent) => {
      // Optional right-click copy protection
      if (process.env.NODE_ENV === "production") {
        e.preventDefault();
      }
    },
    style: {
      WebkitTouchCallout: "none",
    } as React.CSSProperties,
  };
}
