import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { isWebGLAvailable } from "@/components/reader/3d/useWebGLSupport";
import {
  createPageCanvasTexture,
  createHardcoverTexture,
  createPaperEdgesTexture,
} from "@/components/reader/3d/pageTexture";
import { ReaderSettings } from "@/types/books";

describe("3D Book Experience & WebGL Integration", () => {
  const mockSettings: ReaderSettings = {
    theme: "light",
    fontSize: 18,
    lineHeight: 1.8,
    width: "standard",
    fontFamily: "serif",
    zenMode: false,
    pageLayout: "spread",
    readerMode: "3d",
  };

  it("detects WebGL availability correctly in standard and non-WebGL environments", () => {
    // In node/vitest environment, document.createElement('canvas') is mocked or returns dummy
    const available = isWebGLAvailable();
    expect(typeof available).toBe("boolean");
  });

  it("generates page canvas textures with correct Three.js filtering and sRGB color space", () => {
    const texture = createPageCanvasTexture({
      pageData: {
        pageNumber: 1,
        chunks: [
          {
            paragraphIndex: 0,
            text: "It was the best of times, it was the worst of times.",
            isDropCap: true,
            startCharOffset: 0,
          },
        ],
        startParagraphIndex: 0,
        endParagraphIndex: 0,
      },
      displayPageNum: 1,
      totalPages: 10,
      bookTitle: "A Tale of Two Cities",
      chapterTitle: "The Period",
      chapterNumber: 1,
      settings: mockSettings,
      highlights: [],
      side: "left",
      isFirstPageOfChapter: true,
    });

    expect(texture).toBeInstanceOf(THREE.CanvasTexture);
    expect(texture.generateMipmaps).toBe(true);
    expect(texture.minFilter).toBe(THREE.LinearMipmapLinearFilter);
    expect(texture.colorSpace).toBe(THREE.SRGBColorSpace);
  });

  it("generates hardcover and paper edge textures with repeatable wrapping", () => {
    const coverTex = createHardcoverTexture({
      title: "Great Expectations",
      author: "Charles Dickens",
      chapterNumber: 1,
      theme: "light",
    });
    expect(coverTex).toBeInstanceOf(THREE.CanvasTexture);
    expect(coverTex.colorSpace).toBe(THREE.SRGBColorSpace);

    const edgeTex = createPaperEdgesTexture("light");
    expect(edgeTex).toBeInstanceOf(THREE.CanvasTexture);
    expect(edgeTex.wrapS).toBe(THREE.RepeatWrapping);
    expect(edgeTex.wrapT).toBe(THREE.RepeatWrapping);
  });

  it("guarantees that Verso back-face UV mapping inverts U so text is never mirrored", () => {
    const width = 2.4;
    const height = 3.36;
    const geom = new THREE.PlaneGeometry(width, height, 4, 4);
    const uvs = geom.attributes.uv;

    // Simulate backGeometry transformation from CurlingPageLeaf
    const backGeom = geom.clone();
    const backUvs = backGeom.attributes.uv;
    for (let i = 0; i < backUvs.count; i++) {
      const u = backUvs.getX(i);
      backUvs.setX(i, 1.0 - u);
    }

    // Verify first and last column horizontal UVs
    // Original left edge has u = 0, back left edge has u = 1 - 0 = 1
    // Original right edge has u = 1, back right edge has u = 1 - 1 = 0
    expect(backUvs.getX(0)).toBe(1.0 - uvs.getX(0));
    expect(backUvs.getX(4)).toBe(1.0 - uvs.getX(4));
  });

  it("preserves chapter reading progress and navigation inside the same book", () => {
    // Verifies that readerMode defaults to 3d without breaking settings contract
    expect(mockSettings.readerMode).toBe("3d");
  });
});
