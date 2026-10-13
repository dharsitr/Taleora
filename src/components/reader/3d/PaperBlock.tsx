"use client";

import * as React from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface PaperBlockProps {
  pageWidth: number;
  pageHeight: number;
  totalThickness: number;
  currentPage: number;
  totalPages: number;
  paperEdgesTexture: THREE.CanvasTexture;
  theme: string;
  coverState: "closed" | "opening" | "open" | "closing";
  openProgressRef: React.MutableRefObject<number>;
}

/**
 * 3D Paper Block representing stacked pages with authentic fore-edge grooved texture.
 * When closed: forms a single solid block encased inside the closed book.
 * When open: separates into left and right paper stacks supporting open pages.
 */
export function PaperBlock({
  pageWidth,
  pageHeight,
  totalThickness,
  currentPage,
  totalPages,
  paperEdgesTexture,
  theme,
  coverState,
  openProgressRef,
}: PaperBlockProps) {
  const leftGroupRef = React.useRef<THREE.Group>(null);
  const rightGroupRef = React.useRef<THREE.Group>(null);

  const fraction = Math.min(
    0.95,
    Math.max(0.05, totalPages > 0 ? currentPage / totalPages : 0.05)
  );

  const isInitiallyClosed = coverState === "closed";
  const initialLeftThickness = isInitiallyClosed
    ? 0.001
    : Math.max(0.02, totalThickness * fraction);
  const initialRightThickness = isInitiallyClosed
    ? totalThickness
    : Math.max(0.02, totalThickness * (1 - fraction));
  const initialRightZ = isInitiallyClosed ? 0 : -initialRightThickness / 2;

  useFrame(() => {
    const p = openProgressRef.current;

    // Left Paper Stack: only exists when the book is opening or open
    if (leftGroupRef.current) {
      if (p <= 0.01) {
        leftGroupRef.current.visible = false;
      } else {
        leftGroupRef.current.visible = true;
        const currentFraction = fraction * p;
        const leftThickness = Math.max(0.005, totalThickness * currentFraction);
        leftGroupRef.current.scale.set(1, 1, leftThickness);
        leftGroupRef.current.position.set(-pageWidth / 2, 0, -leftThickness / 2);
      }
    }

    // Right Paper Stack: full thickness centered at z = 0 when closed,
    // transitions down to -openRightThickness / 2 when open.
    if (rightGroupRef.current) {
      const openRightThickness = Math.max(0.02, totalThickness * (1 - fraction));
      const currentRightThickness = THREE.MathUtils.lerp(totalThickness, openRightThickness, p);
      const targetZ = THREE.MathUtils.lerp(0, -openRightThickness / 2, p);

      rightGroupRef.current.scale.set(1, 1, currentRightThickness);
      rightGroupRef.current.position.set(pageWidth / 2, 0, targetZ);
    }
  });

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
      <group
        ref={leftGroupRef}
        position={[-pageWidth / 2, 0, -initialLeftThickness / 2]}
        scale={[1, 1, initialLeftThickness]}
        visible={!isInitiallyClosed}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[pageWidth, pageHeight, 1]} />
          <meshStandardMaterial
            map={paperEdgesTexture}
            color={edgeColor}
            roughness={0.9}
            metalness={0.05}
          />
        </mesh>
      </group>

      {/* RIGHT PAPER STACK */}
      <group
        ref={rightGroupRef}
        position={[pageWidth / 2, 0, initialRightZ]}
        scale={[1, 1, initialRightThickness]}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[pageWidth, pageHeight, 1]} />
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
