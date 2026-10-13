"use client";

import * as React from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { HardcoverCasing } from "./HardcoverCasing";
import { PaperBlock } from "./PaperBlock";
import { CurlingPageLeaf } from "./CurlingPageLeaf";
import {
  createPageCanvasTexture,
  createHardcoverTexture,
  createPaperEdgesTexture,
} from "./pageTexture";
import { BookPage } from "../usePagePaginator";
import { ReaderSettings, HighlightRow } from "@/types/books";

interface BookScene3DProps {
  pages: BookPage[];
  pageNumber: number;
  totalPages: number;
  bookTitle: string;
  chapterTitle: string;
  chapterNumber: number;
  settings: ReaderSettings;
  highlights: HighlightRow[];
  isTurning: boolean;
  turnDirection: "next" | "prev" | null;
  coverState: "closed" | "opening" | "open" | "closing";
  authorName?: string;
  prefersReducedMotion?: boolean;
  onPageTurnComplete?: () => void;
}

export function BookScene3D({
  pages,
  pageNumber,
  totalPages,
  bookTitle,
  chapterTitle,
  chapterNumber,
  settings,
  highlights,
  isTurning,
  turnDirection,
  coverState,
  authorName,
  prefersReducedMotion = false,
  onPageTurnComplete,
}: BookScene3DProps) {
  // 3D Physical Scale
  const pageWidth = 2.38;
  const pageHeight = 3.34;
  const bookThickness = 0.28;

  // Spreads: Left is odd (1, 3, 5...), Right is even (2, 4, 6...)
  const effectiveLeftPageNum =
    pageNumber % 2 === 0 ? Math.max(1, pageNumber - 1) : pageNumber;
  const effectiveRightPageNum = effectiveLeftPageNum + 1;

  // Turn progress interpolation state (0.0 -> 1.0)
  const [turnProgress, setTurnProgress] = React.useState<number>(0);
  const turnStartTimeRef = React.useRef<number | null>(null);

  // Gutter curved geometry for static open left & right pages
  const leftPageGeom = React.useMemo(() => {
    const geom = new THREE.PlaneGeometry(pageWidth, pageHeight, 24, 12);
    // Dip vertices slightly near x = 0 towards spine gutter
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const normalizedU = (x + pageWidth / 2) / pageWidth; // 0 at outer, 1 at spine
      // Gentle curve down into gutter
      const gutterDip = -Math.pow(normalizedU, 3) * 0.005;
      pos.setZ(i, gutterDip);
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();
    return geom;
  }, [pageWidth, pageHeight]);

  const rightPageGeom = React.useMemo(() => {
    const geom = new THREE.PlaneGeometry(pageWidth, pageHeight, 24, 12);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const normalizedU = 1 - (x + pageWidth / 2) / pageWidth; // 1 at spine, 0 at outer
      const gutterDip = -Math.pow(normalizedU, 3) * 0.005;
      pos.setZ(i, gutterDip);
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();
    return geom;
  }, [pageWidth, pageHeight]);

  // Generate textures for current and adjacent pages
  const leftPageTexture = React.useMemo(() => {
    return createPageCanvasTexture({
      pageData: pages[effectiveLeftPageNum - 1] || null,
      displayPageNum: effectiveLeftPageNum,
      totalPages,
      bookTitle,
      chapterTitle,
      chapterNumber,
      settings,
      highlights,
      side: "left",
      isFirstPageOfChapter: effectiveLeftPageNum === 1,
    });
  }, [
    pages,
    effectiveLeftPageNum,
    totalPages,
    bookTitle,
    chapterTitle,
    chapterNumber,
    settings,
    highlights,
  ]);

  const rightPageTexture = React.useMemo(() => {
    return createPageCanvasTexture({
      pageData: pages[effectiveRightPageNum - 1] || null,
      displayPageNum: effectiveRightPageNum,
      totalPages,
      bookTitle,
      chapterTitle,
      chapterNumber,
      settings,
      highlights,
      side: "right",
    });
  }, [
    pages,
    effectiveRightPageNum,
    totalPages,
    bookTitle,
    chapterTitle,
    chapterNumber,
    settings,
    highlights,
  ]);

  // Next and Prev textures for turning leaf
  const nextLeftPageNum = effectiveLeftPageNum + 2;
  const nextRightPageNum = effectiveRightPageNum + 2;
  const prevLeftPageNum = Math.max(1, effectiveLeftPageNum - 2);
  const prevRightPageNum = effectiveLeftPageNum - 1;

  const nextLeftTexture = React.useMemo(() => {
    return createPageCanvasTexture({
      pageData: pages[nextLeftPageNum - 1] || null,
      displayPageNum: nextLeftPageNum,
      totalPages,
      bookTitle,
      chapterTitle,
      chapterNumber,
      settings,
      highlights,
      side: "left",
    });
  }, [pages, nextLeftPageNum, totalPages, bookTitle, chapterTitle, chapterNumber, settings, highlights]);

  const nextRightTexture = React.useMemo(() => {
    return createPageCanvasTexture({
      pageData: pages[nextRightPageNum - 1] || null,
      displayPageNum: nextRightPageNum,
      totalPages,
      bookTitle,
      chapterTitle,
      chapterNumber,
      settings,
      highlights,
      side: "right",
    });
  }, [pages, nextRightPageNum, totalPages, bookTitle, chapterTitle, chapterNumber, settings, highlights]);

  const prevRightTexture = React.useMemo(() => {
    return createPageCanvasTexture({
      pageData: pages[prevRightPageNum - 1] || null,
      displayPageNum: prevRightPageNum,
      totalPages,
      bookTitle,
      chapterTitle,
      chapterNumber,
      settings,
      highlights,
      side: "right",
    });
  }, [pages, prevRightPageNum, totalPages, bookTitle, chapterTitle, chapterNumber, settings, highlights]);

  const prevLeftTexture = React.useMemo(() => {
    return createPageCanvasTexture({
      pageData: pages[prevLeftPageNum - 1] || null,
      displayPageNum: prevLeftPageNum,
      totalPages,
      bookTitle,
      chapterTitle,
      chapterNumber,
      settings,
      highlights,
      side: "left",
      isFirstPageOfChapter: prevLeftPageNum === 1,
    });
  }, [pages, prevLeftPageNum, totalPages, bookTitle, chapterTitle, chapterNumber, settings, highlights]);

  // Hardcover Artwork & Paper Edges textures
  const coverTexture = React.useMemo(() => {
    return createHardcoverTexture({
      title: bookTitle,
      author: authorName,
      chapterNumber,
      theme: settings.theme,
      isBack: false,
    });
  }, [bookTitle, authorName, chapterNumber, settings.theme]);

  const backCoverTexture = React.useMemo(() => {
    return createHardcoverTexture({
      title: bookTitle,
      chapterNumber,
      theme: settings.theme,
      isBack: true,
    });
  }, [bookTitle, chapterNumber, settings.theme]);

  const paperEdgesTexture = React.useMemo(() => {
    return createPaperEdgesTexture(settings.theme);
  }, [settings.theme]);

  // Turn animation driver
  React.useEffect(() => {
    if (isTurning) {
      turnStartTimeRef.current = performance.now();
      setTurnProgress(0);
    } else {
      turnStartTimeRef.current = null;
      setTurnProgress(0);
    }
  }, [isTurning]);

  useFrame(() => {
    if (!isTurning || turnStartTimeRef.current === null) return;

    const duration = prefersReducedMotion ? 180 : 540;
    const elapsed = performance.now() - turnStartTimeRef.current;
    const p = Math.min(1, elapsed / duration);
    setTurnProgress(p);

    if (p >= 1 && onPageTurnComplete) {
      onPageTurnComplete();
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. LIGHTING RIG */}
      <ambientLight color="#fff7ed" intensity={0.7} />
      {/* Warm key directional light casting soft contact shadows */}
      <directionalLight
        position={[4, 6, 6]}
        color="#fffbeb"
        intensity={1.25}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={15}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0005}
      />
      {/* Cool subtle fill light */}
      <directionalLight position={[-4, 3, 3]} color="#e0f2fe" intensity={0.4} />
      {/* Bottom rim light */}
      <pointLight position={[0, -4, 2]} intensity={0.2} color="#fef3c7" />

      {/* 2. CONTACT SHADOW FLOOR (Desk surface underneath the book) */}
      <mesh position={[0, 0, -bookThickness - 0.05]} receiveShadow>
        <planeGeometry args={[14, 10]} />
        <shadowMaterial opacity={settings.theme === "dark" ? 0.6 : 0.28} />
      </mesh>

      {/* 3. HARDCOVER CASING */}
      <HardcoverCasing
        pageWidth={pageWidth}
        pageHeight={pageHeight}
        bookThickness={bookThickness}
        coverTexture={coverTexture}
        backCoverTexture={backCoverTexture}
        theme={settings.theme}
        coverState={coverState}
      />

      {/* 4. PAPER BLOCK (Layered thickness with stacked page edge texture) */}
      <PaperBlock
        pageWidth={pageWidth}
        pageHeight={pageHeight}
        totalThickness={bookThickness}
        currentPage={pageNumber}
        totalPages={totalPages}
        paperEdgesTexture={paperEdgesTexture}
        theme={settings.theme}
      />

      {/* 5. STATIC OPEN SPREAD (Visible when book is open) */}
      {coverState === "open" && (
        <group position={[0, 0, 0.015]}>
          {/* Base Left Page */}
          <mesh
            position={[-pageWidth / 2, 0, 0]}
            geometry={leftPageGeom}
            receiveShadow
          >
            <meshStandardMaterial
              map={isTurning && turnDirection === "prev" ? prevLeftTexture : leftPageTexture}
              roughness={0.75}
              metalness={0.02}
            />
          </mesh>

          {/* Base Right Page */}
          <mesh
            position={[pageWidth / 2, 0, 0]}
            geometry={rightPageGeom}
            receiveShadow
          >
            <meshStandardMaterial
              map={isTurning && turnDirection === "next" ? nextRightTexture : rightPageTexture}
              roughness={0.75}
              metalness={0.02}
            />
          </mesh>
        </group>
      )}

      {/* 7. DYNAMIC CURLING PAGE LEAF (Active exclusively during page turn) */}
      {isTurning && coverState === "open" && (
        <CurlingPageLeaf
          width={pageWidth}
          height={pageHeight}
          progress={turnProgress}
          direction={turnDirection || "next"}
          frontTexture={turnDirection === "next" ? rightPageTexture : leftPageTexture}
          backTexture={turnDirection === "next" ? nextLeftTexture : prevRightTexture}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
    </group>
  );
}
