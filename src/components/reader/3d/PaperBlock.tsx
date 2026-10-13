"use client";

import * as React from "react";
import * as THREE from "three";

interface PaperBlockProps {
  pageWidth: number;
  pageHeight: number;
  totalThickness: number;
  currentPage: number;
  totalPages: number;
  paperEdgesTexture: THREE.CanvasTexture;
  theme: string;
}

/**
 * 3D Paper Block representing stacked pages with authentic fore-edge grooved texture
 * and dynamic thickness shifting as pages are turned.
 */
export function PaperBlock({
  pageWidth,
  pageHeight,
  totalThickness,
  currentPage,
  totalPages,
  paperEdgesTexture,
  theme,
}: PaperBlockProps) {
  // Reading fraction: 0.05 min to 0.95 max
  const fraction = Math.min(
    0.95,
    Math.max(0.05, totalPages > 0 ? currentPage / totalPages : 0.05)
  );

  const leftThickness = Math.max(0.02, totalThickness * fraction);
  const rightThickness = Math.max(0.02, totalThickness * (1 - fraction));

  // Paper edge tint
  const edgeColor =
    theme === "sepia"
      ? "#e8dcbe"
      : theme === "dark"
      ? "#1e2530"
      : "#f2ebdc";

  return (
    <group position={[0, 0, 0]}>
      {/* LEFT PAPER STACK */}
      <group position={[-pageWidth / 2, 0, -leftThickness / 2 - 0.005]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[pageWidth, pageHeight, leftThickness]} />
          <meshStandardMaterial
            map={paperEdgesTexture}
            color={edgeColor}
            roughness={0.9}
            metalness={0.05}
          />
        </mesh>
      </group>

      {/* RIGHT PAPER STACK */}
      <group position={[pageWidth / 2, 0, -rightThickness / 2 - 0.005]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[pageWidth, pageHeight, rightThickness]} />
          <meshStandardMaterial
            map={paperEdgesTexture}
            color={edgeColor}
            roughness={0.9}
            metalness={0.05}
          />
        </mesh>
      </group>
    </group>
  );
}
