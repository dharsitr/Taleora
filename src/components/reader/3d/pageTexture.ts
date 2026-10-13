"use client";

import * as THREE from "three";
import { BookPage } from "../usePagePaginator";
import { ReaderSettings, HighlightRow, HighlightColor } from "@/types/books";

export interface PageRenderContext {
  pageData: BookPage | null;
  displayPageNum: number;
  totalPages: number;
  bookTitle: string;
  chapterTitle: string;
  chapterNumber: number;
  settings: ReaderSettings;
  highlights: HighlightRow[];
  side: "left" | "right" | "single";
  isFirstPageOfChapter?: boolean;
}

function getHighlightBgColor(colorKey: HighlightColor | string, theme: string): string {
  switch (colorKey) {
    case "emerald":
      return theme === "dark" ? "rgba(16, 185, 129, 0.4)" : "rgba(52, 211, 153, 0.45)";
    case "sky":
      return theme === "dark" ? "rgba(14, 165, 233, 0.4)" : "rgba(56, 189, 248, 0.45)";
    case "rose":
      return theme === "dark" ? "rgba(244, 63, 94, 0.4)" : "rgba(251, 113, 133, 0.45)";
    case "violet":
      return theme === "dark" ? "rgba(139, 92, 246, 0.4)" : "rgba(167, 139, 250, 0.45)";
    case "amber":
    default:
      return theme === "dark" ? "rgba(245, 158, 11, 0.4)" : "rgba(251, 191, 36, 0.48)";
  }
}

/**
 * Renders a book page surface onto an HTML5 2D Canvas and returns a Three.js CanvasTexture.
 */
export function createPageCanvasTexture(ctx: PageRenderContext): THREE.CanvasTexture {
  const {
    pageData,
    displayPageNum,
    totalPages,
    bookTitle,
    chapterTitle,
    chapterNumber,
    settings,
    highlights,
    side,
    isFirstPageOfChapter,
  } = ctx;

  const width = 1024;
  const height = 1440;
  const paddingTop = 90;
  const paddingBottom = 80;

  if (typeof document === "undefined") {
    const dummy = new THREE.CanvasTexture({ width, height } as unknown as HTMLCanvasElement);
    dummy.generateMipmaps = true;
    dummy.minFilter = THREE.LinearMipmapLinearFilter;
    dummy.colorSpace = THREE.SRGBColorSpace;
    return dummy;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d");

  if (!g) {
    const dummy = new THREE.CanvasTexture(canvas);
    return dummy;
  }

  // 1. Color Palette according to Theme
  let bgColor = "#fbf9f5";
  let textColor = "#1e2430";
  let mutedColor = "#6b7280";
  let borderColor = "rgba(0, 0, 0, 0.08)";
  let accentColor = "#b45309"; // warm amber

  if (settings.theme === "sepia") {
    bgColor = "#f5eedb";
    textColor = "#3d2e1e";
    mutedColor = "#78624a";
    borderColor = "rgba(62, 46, 30, 0.12)";
    accentColor = "#92400e";
  } else if (settings.theme === "dark") {
    bgColor = "#13171f";
    textColor = "#e2e8f0";
    mutedColor = "#94a3b8";
    borderColor = "rgba(255, 255, 255, 0.1)";
    accentColor = "#f59e0b";
  }

  // Draw Page Paper Base
  g.fillStyle = bgColor;
  g.fillRect(0, 0, width, height);

  // Subtle natural paper grain / vignette along edges
  const paperGrad = g.createRadialGradient(
    width / 2,
    height / 2,
    width * 0.3,
    width / 2,
    height / 2,
    width * 0.75
  );
  paperGrad.addColorStop(0, "rgba(255, 255, 255, 0.04)");
  paperGrad.addColorStop(1, "rgba(0, 0, 0, 0.035)");
  g.fillStyle = paperGrad;
  g.fillRect(0, 0, width, height);

  // Gutter shadow on inner spine edge
  if (side === "left") {
    const gutter = g.createLinearGradient(width - 80, 0, width, 0);
    gutter.addColorStop(0, "rgba(0,0,0,0)");
    gutter.addColorStop(1, settings.theme === "dark" ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.12)");
    g.fillStyle = gutter;
    g.fillRect(width - 80, 0, 80, height);
  } else if (side === "right") {
    const gutter = g.createLinearGradient(0, 0, 80, 0);
    gutter.addColorStop(0, settings.theme === "dark" ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.12)");
    gutter.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gutter;
    g.fillRect(0, 0, 80, height);
  }

  // Typefaces
  const fontFamily =
    settings.fontFamily === "sans"
      ? "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      : settings.fontFamily === "mono"
      ? "'JetBrains Mono', 'Fira Code', monospace"
      : "'Cinzel Decorative', 'Baskerville', 'Georgia', serif";

  const marginLeft = side === "right" ? 108 : 84;
  const marginRight = side === "left" ? 108 : 84;

  // 2. Running Header
  g.save();
  g.fillStyle = mutedColor;
  g.font = `italic 22px ${fontFamily}`;
  g.textBaseline = "middle";

  if (side === "left") {
    g.textAlign = "left";
    const titleText = bookTitle.length > 36 ? bookTitle.slice(0, 34) + "…" : bookTitle;
    g.fillText(titleText, marginLeft, paddingTop);

    g.textAlign = "right";
    g.font = `600 20px ${fontFamily}`;
    g.fillText(`CH. ${chapterNumber}`, width - marginRight, paddingTop);
  } else {
    g.textAlign = "left";
    g.font = `600 20px ${fontFamily}`;
    g.fillText(`CHAPTER ${chapterNumber}`, marginLeft, paddingTop);

    g.textAlign = "right";
    g.font = `italic 22px ${fontFamily}`;
    const chTitleText = chapterTitle.length > 34 ? chapterTitle.slice(0, 32) + "…" : chapterTitle;
    g.fillText(chTitleText, width - marginRight, paddingTop);
  }

  // Header separator rule
  g.strokeStyle = borderColor;
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(marginLeft, paddingTop + 26);
  g.lineTo(width - marginRight, paddingTop + 26);
  g.stroke();
  g.restore();

  // 3. Body Text & Headings
  let cursorY = paddingTop + 64;

  // Chapter Opening Banner if Page 1
  if (isFirstPageOfChapter && displayPageNum === 1) {
    g.save();
    g.textAlign = "center";
    g.fillStyle = accentColor;
    g.font = `bold 20px ${fontFamily}`;
    g.fillText(`CHAPTER ${chapterNumber}`, width / 2, cursorY + 16);

    cursorY += 56;
    g.fillStyle = textColor;
    g.font = `bold 42px ${fontFamily}`;
    g.fillText(chapterTitle, width / 2, cursorY);

    cursorY += 46;
    g.fillStyle = mutedColor;
    g.font = `20px ${fontFamily}`;
    g.fillText("❦ · ❦ · ❦", width / 2, cursorY);

    cursorY += 36;
    g.strokeStyle = borderColor;
    g.beginPath();
    g.moveTo(width / 2 - 120, cursorY);
    g.lineTo(width / 2 + 120, cursorY);
    g.stroke();

    cursorY += 40;
    g.restore();
  }

  // Scaled Font Metrics for Content
  const baseFontSize = Math.round(settings.fontSize * 1.34); // balanced scale
  const lineHeight = Math.round(baseFontSize * settings.lineHeight * 0.94);
  const paragraphSpacing = Math.round(baseFontSize * 0.7);

  const footerSeparatorY = height - paddingBottom - 26;
  const maxContentY = footerSeparatorY - 20; // safety ceiling to keep text cleanly above footer

  if (pageData && pageData.chunks.length > 0) {
    for (const chunk of pageData.chunks) {
      if (cursorY + lineHeight > maxContentY) break;

      const pHighlights = highlights.filter((h) => h.paragraph_index === chunk.paragraphIndex);

      g.save();
      g.font = `normal ${baseFontSize}px ${fontFamily}`;
      g.fillStyle = textColor;
      g.textBaseline = "top";

      const showDropCap = Boolean(chunk.isDropCap && chunk.text.length > 0);
      let text = chunk.text;
      let startX = marginLeft + (chunk.isContinuedFromPrev || showDropCap ? 0 : 36);

      if (showDropCap) {
        const dropLetter = text.charAt(0);
        text = text.slice(1);

        // Draw decorative drop-cap
        g.font = `bold ${baseFontSize * 2.8}px ${fontFamily}`;
        g.fillStyle = accentColor;
        const dropMetrics = g.measureText(dropLetter);
        const dropWidth = dropMetrics.width + 12;
        g.fillText(dropLetter, marginLeft, cursorY - 2);

        startX = marginLeft + dropWidth;
      }

      // Word wrapping engine with highlight rects
      const words = text.split(" ");
      let currentLine = "";
      let lineX = startX;
      let lineY = cursorY;

      g.font = `normal ${baseFontSize}px ${fontFamily}`;
      g.fillStyle = textColor;

      for (let wIdx = 0; wIdx < words.length; wIdx++) {
        const testLine = currentLine.length > 0 ? `${currentLine} ${words[wIdx]}` : words[wIdx];
        const testWidth = g.measureText(testLine).width;

        if (lineX + testWidth > width - marginRight && currentLine.length > 0) {
          if (lineY + lineHeight > maxContentY) {
            currentLine = "";
            break;
          }

          // Check if current line contains highlights
          if (pHighlights.length > 0) {
            for (const h of pHighlights) {
              if (h.selected_text && currentLine.includes(h.selected_text.slice(0, 15))) {
                g.fillStyle = getHighlightBgColor(h.color, settings.theme);
                g.fillRect(lineX - 4, lineY - 2, g.measureText(currentLine).width + 8, lineHeight);
                g.fillStyle = textColor;
              }
            }
          }

          g.fillText(currentLine, lineX, lineY);
          currentLine = words[wIdx];
          lineY += lineHeight;
          lineX = marginLeft; // subsequent lines align to normal margin
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine.length > 0 && lineY + lineHeight <= maxContentY) {
        if (pHighlights.length > 0) {
          for (const h of pHighlights) {
            if (h.selected_text && currentLine.includes(h.selected_text.slice(0, 15))) {
              g.fillStyle = getHighlightBgColor(h.color, settings.theme);
              g.fillRect(lineX - 4, lineY - 2, g.measureText(currentLine).width + 8, lineHeight);
              g.fillStyle = textColor;
            }
          }
        }
        g.fillText(currentLine, lineX, lineY);
        lineY += lineHeight;
      }

      cursorY = lineY + paragraphSpacing;
      g.restore();
    }
  } else if (displayPageNum >= totalPages && totalPages > 0) {
    // End of chapter sign-off
    g.save();
    g.textAlign = "center";
    g.fillStyle = mutedColor;
    g.font = `italic 24px ${fontFamily}`;
    g.fillText(`End of Chapter ${chapterNumber}`, width / 2, height / 2 - 40);

    g.font = `24px ${fontFamily}`;
    g.fillText("❦ · ❦ · ❦", width / 2, height / 2 + 10);
    g.restore();
  }

  // 4. Running Footer
  const footerY = height - paddingBottom;
  g.save();
  g.strokeStyle = borderColor;
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(marginLeft, footerY - 26);
  g.lineTo(width - marginRight, footerY - 26);
  g.stroke();

  g.fillStyle = mutedColor;
  g.font = `500 20px ${fontFamily}`;
  g.textBaseline = "middle";

  const percent = Math.min(100, Math.round((displayPageNum / Math.max(1, totalPages)) * 100));

  if (side === "left") {
    g.textAlign = "left";
    g.fillText(`${displayPageNum}`, marginLeft, footerY);

    g.textAlign = "right";
    g.fillText(`${percent}%`, width - marginRight, footerY);
  } else {
    g.textAlign = "left";
    g.fillText(`${percent}%`, marginLeft, footerY);

    g.textAlign = "right";
    g.fillText(`${displayPageNum} / ${totalPages}`, width - marginRight, footerY);
  }
  g.restore();

  // Create Three.js CanvasTexture with high quality filtering
  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
}

/**
 * Creates a rich leather hardcover texture with embossed gold foil details.
 */
export function createHardcoverTexture({
  title,
  author,
  chapterNumber,
  theme,
  isBack = false,
  coverImageUrl,
}: {
  title: string;
  author?: string;
  chapterNumber: number;
  theme: string;
  isBack?: boolean;
  coverImageUrl?: string | null;
}): THREE.CanvasTexture {
  const width = 1024;
  const height = 1440;

  if (typeof document === "undefined") {
    const dummy = new THREE.CanvasTexture({ width, height } as unknown as HTMLCanvasElement);
    dummy.colorSpace = THREE.SRGBColorSpace;
    return dummy;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d");

  if (!g) return new THREE.CanvasTexture(canvas);

  // Leather Base Color
  const foilGoldGlow = "#fef08a";
  let baseColor = "#221915"; // rich dark chestnut
  let foilGold = "#d4af37"; // metallic gold

  if (theme === "sepia") {
    baseColor = "#2e1b12";
  } else if (theme === "dark") {
    baseColor = "#0d1117";
    foilGold = "#f59e0b";
  }

  g.fillStyle = baseColor;
  g.fillRect(0, 0, width, height);

  // Subtle leather marbling
  for (let i = 0; i < 400; i++) {
    const rx = Math.random() * width;
    const ry = Math.random() * height;
    const rrad = Math.random() * 40 + 10;
    g.fillStyle = Math.random() > 0.5 ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.02)";
    g.beginPath();
    g.arc(rx, ry, rrad, 0, Math.PI * 2);
    g.fill();
  }

  // Outer and Inner Embossed Gold Foil Filigree Borders
  g.strokeStyle = foilGold;
  g.lineWidth = 4;
  g.strokeRect(40, 40, width - 80, height - 80);

  g.lineWidth = 1.5;
  g.strokeRect(52, 52, width - 104, height - 104);

  // Corner Ornaments
  const corners = [
    [52, 52],
    [width - 52, 52],
    [52, height - 52],
    [width - 52, height - 52],
  ];
  for (const [cx, cy] of corners) {
    g.beginPath();
    g.arc(cx, cy, 14, 0, Math.PI * 2);
    g.fillStyle = foilGold;
    g.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  if (!isBack) {
    // If user attached a cover image, load and render it with realistic book finish
    if (coverImageUrl && coverImageUrl.trim().length > 0) {
      const img = new Image();
      img.crossOrigin = "anonymous";

      const renderCoverImage = (imageEl: HTMLImageElement) => {
        g.clearRect(0, 0, width, height);
        g.fillStyle = baseColor;
        g.fillRect(0, 0, width, height);

        // Aspect-ratio cover calculation
        const canvasAspect = width / height;
        const imgAspect = imageEl.naturalWidth / imageEl.naturalHeight;
        let sx = 0;
        let sy = 0;
        let sWidth = imageEl.naturalWidth;
        let sHeight = imageEl.naturalHeight;

        if (imgAspect > canvasAspect) {
          sWidth = imageEl.naturalHeight * canvasAspect;
          sx = (imageEl.naturalWidth - sWidth) / 2;
        } else {
          sHeight = imageEl.naturalWidth / canvasAspect;
          sy = (imageEl.naturalHeight - sHeight) / 2;
        }

        // Draw author's cover artwork
        g.drawImage(imageEl, sx, sy, sWidth, sHeight, 0, 0, width, height);

        // 1. Spine hinge groove shadow on left (gives realistic depth where cover joins the spine)
        const spineShadow = g.createLinearGradient(0, 0, 60, 0);
        spineShadow.addColorStop(0, "rgba(0, 0, 0, 0.6)");
        spineShadow.addColorStop(0.25, "rgba(0, 0, 0, 0.25)");
        spineShadow.addColorStop(0.7, "rgba(0, 0, 0, 0.08)");
        spineShadow.addColorStop(1, "rgba(0, 0, 0, 0)");
        g.fillStyle = spineShadow;
        g.fillRect(0, 0, 60, height);

        // 2. Right edge rim shadow & highlight
        const rightShadow = g.createLinearGradient(width - 32, 0, width, 0);
        rightShadow.addColorStop(0, "rgba(0, 0, 0, 0)");
        rightShadow.addColorStop(1, "rgba(0, 0, 0, 0.35)");
        g.fillStyle = rightShadow;
        g.fillRect(width - 32, 0, 32, height);

        // 3. Ambient top and bottom edge shadows
        const topShadow = g.createLinearGradient(0, 0, 0, 24);
        topShadow.addColorStop(0, "rgba(0, 0, 0, 0.3)");
        topShadow.addColorStop(1, "rgba(0, 0, 0, 0)");
        g.fillStyle = topShadow;
        g.fillRect(0, 0, width, 24);

        const bottomShadow = g.createLinearGradient(0, height - 24, 0, height);
        bottomShadow.addColorStop(0, "rgba(0, 0, 0, 0)");
        bottomShadow.addColorStop(1, "rgba(0, 0, 0, 0.35)");
        g.fillStyle = bottomShadow;
        g.fillRect(0, height - 24, width, 24);

        // 4. Subtle gilded foil border framing the artwork
        g.strokeStyle = "rgba(212, 175, 55, 0.35)";
        g.lineWidth = 3;
        g.strokeRect(36, 36, width - 72, height - 72);

        texture.needsUpdate = true;
      };

      img.onload = () => {
        renderCoverImage(img);
      };

      img.onerror = () => {
        // Fallback to Next.js image proxy if direct external fetch hit CORS
        if (coverImageUrl.startsWith("http") && !coverImageUrl.includes("/_next/image")) {
          const proxyImg = new Image();
          proxyImg.crossOrigin = "anonymous";
          proxyImg.onload = () => {
            renderCoverImage(proxyImg);
          };
          proxyImg.src = `/_next/image?url=${encodeURIComponent(coverImageUrl)}&w=1200&q=90`;
        }
      };

      img.src = coverImageUrl;
      if (img.complete && img.naturalWidth > 0) {
        renderCoverImage(img);
      }
    } else {
      // Default procedural title & foil embellishments when no cover image is provided
      g.textAlign = "center";
      g.textBaseline = "middle";

      // Top Emblem
      g.font = "bold 22px 'Cinzel Decorative', serif";
      g.fillStyle = foilGold;
      g.fillText("T A L E O R A   E D I T I O N", width / 2, 220);

      // Decorative fleurons
      g.font = "36px serif";
      g.fillText("❦ · ❦ · ❦", width / 2, 380);

      // Title (wrapped if needed)
      g.font = "bold 56px 'Cinzel Decorative', 'Georgia', serif";
      g.fillStyle = foilGoldGlow;
      g.shadowColor = "rgba(0, 0, 0, 0.7)";
      g.shadowBlur = 8;
      g.shadowOffsetY = 4;

      const words = title.split(" ");
      let line1 = "";
      let line2 = "";
      if (words.length > 3) {
        const mid = Math.ceil(words.length / 2);
        line1 = words.slice(0, mid).join(" ");
        line2 = words.slice(mid).join(" ");
        g.fillText(line1, width / 2, 540);
        g.fillText(line2, width / 2, 610);
      } else {
        g.fillText(title, width / 2, 560);
      }

      g.shadowColor = "transparent";

      // Author
      g.font = "italic 32px 'Georgia', serif";
      g.fillStyle = foilGold;
      g.fillText(`By ${author || "Author"}`, width / 2, 740);

      // Chapter Indicator
      g.font = "600 24px monospace";
      g.fillStyle = foilGold;
      g.fillText(`CHAPTER ${chapterNumber}`, width / 2, 860);

      // Bottom Filigree
      g.font = "28px serif";
      g.fillText("✦ · · · · ✦", width / 2, 1180);
    }
  } else {
    // Back Cover: Taleora Emblem
    g.textAlign = "center";
    g.fillStyle = foilGold;
    g.font = "28px serif";
    g.fillText("❦ · ❦ · ❦", width / 2, height / 2 - 40);
    g.font = "bold 26px 'Cinzel Decorative', serif";
    g.fillText("T A L E O R A", width / 2, height / 2 + 20);
    g.font = "16px monospace";
    g.fillText("ARCHIVE EDITION", width / 2, height / 2 + 60);
  }

  return texture;
}

/**
 * Creates procedural texture for the book's outer paper edges (stacked sheets).
 */
export function createPaperEdgesTexture(theme: string): THREE.CanvasTexture {
  if (typeof document === "undefined") {
    const dummy = new THREE.CanvasTexture({ width: 128, height: 512 } as unknown as HTMLCanvasElement);
    dummy.wrapS = THREE.RepeatWrapping;
    dummy.wrapT = THREE.RepeatWrapping;
    return dummy;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 512;
  const g = canvas.getContext("2d");
  if (!g) return new THREE.CanvasTexture(canvas);

  let base = "#f2ecdd";
  let darkLine = "#dfd6c0";
  if (theme === "sepia") {
    base = "#ebe0c6";
    darkLine = "#d2c39e";
  } else if (theme === "dark") {
    base = "#252b36";
    darkLine = "#181d26";
  }

  g.fillStyle = base;
  g.fillRect(0, 0, canvas.width, canvas.height);

  // Draw subtle fine stacked page lines
  for (let y = 0; y < canvas.height; y += 3) {
    g.fillStyle = darkLine;
    g.fillRect(0, y, canvas.width, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 4);
  texture.needsUpdate = true;
  return texture;
}
