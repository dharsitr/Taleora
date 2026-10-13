"use client";

import * as React from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface HardcoverCasingProps {
  pageWidth: number;
  pageHeight: number;
  bookThickness: number;
  coverTexture: THREE.CanvasTexture;
  backCoverTexture: THREE.CanvasTexture;
  theme: string;
  coverState: "closed" | "opening" | "open" | "closing";
  onOpenBook?: () => void;
}

export function HardcoverCasing({
  pageWidth,
  pageHeight,
  bookThickness,
  coverTexture,
  backCoverTexture,
  theme,
  coverState,
}: HardcoverCasingProps) {
  const frontCoverGroupRef = React.useRef<THREE.Group>(null);
  const openProgressRef = React.useRef<number>(coverState === "closed" ? 0 : 1);

  const overhang = 0.08;
  const coverWidth = pageWidth + overhang;
  const coverHeight = pageHeight + overhang * 2;
  const boardThickness = 0.04;

  // Leather spine & board rim colors
  const rimColor =
    theme === "sepia"
      ? "#2e1b12"
      : theme === "dark"
      ? "#0a0d12"
      : "#1c1410";

  const spineRadius = (bookThickness + boardThickness * 2) / 2;

  useFrame((_, delta) => {
    let target = 1; // open
    if (coverState === "closed") {
      target = 0;
    } else if (coverState === "closing") {
      target = 0;
    } else if (coverState === "opening") {
      target = 1;
    } else if (coverState === "open") {
      target = 1;
    }

    // Smooth spring-damped interpolation for authentic heavy hardcover swing
    const speed = 4.2;
    openProgressRef.current = THREE.MathUtils.damp(
      openProgressRef.current,
      target,
      speed,
      delta
    );

    if (frontCoverGroupRef.current) {
      // Rotate around spine hinge from 0 (closed over right) to -PI (open to left)
      const currentAngle = -(openProgressRef.current * Math.PI);
      frontCoverGroupRef.current.rotation.y = currentAngle;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. BACK COVER BOARD (Permanently rests flat on table underneath the book) */}
      <group position={[0, 0, -bookThickness / 2 - boardThickness / 2]}>
        <mesh position={[coverWidth / 2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[coverWidth, coverHeight, boardThickness]} />
          <meshStandardMaterial
            color={rimColor}
            roughness={0.7}
            metalness={0.15}
          />
        </mesh>
        {/* Back Cover Artwork / Foil Emblem on under face */}
        <mesh
          position={[coverWidth / 2, 0, -boardThickness / 2 - 0.001]}
          rotation={[0, Math.PI, 0]}
        >
          <planeGeometry args={[coverWidth, coverHeight]} />
          <meshStandardMaterial
            map={backCoverTexture}
            roughness={0.65}
            metalness={0.2}
          />
        </mesh>
      </group>

      {/* 2. CURVED LEATHER SPINE (Hinged codex spine along x = 0) */}
      <group position={[-0.01, 0, 0]}>
        {/* Rounded spine casing */}
        <mesh position={[-spineRadius * 0.4, 0, -0.01]} rotation={[0, 0, 0]} castShadow>
          <cylinderGeometry
            args={[
              spineRadius,
              spineRadius,
              coverHeight,
              24,
              1,
              false,
              Math.PI * 0.5,
              Math.PI
            ]}
          />
          <meshStandardMaterial
            color={rimColor}
            roughness={0.65}
            metalness={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Decorative Gold Spine Ribs (Raised bands / hubbed spine) */}
        {[-0.6, -0.3, 0, 0.3, 0.6].map((offset, idx) => (
          <mesh
            key={idx}
            position={[-spineRadius * 0.45, offset * (coverHeight * 0.45), -0.01]}
            rotation={[0, 0, 0]}
          >
            <cylinderGeometry
              args={[
                spineRadius + 0.008,
                spineRadius + 0.008,
                0.03,
                16,
                1,
                false,
                Math.PI * 0.5,
                Math.PI
              ]}
            />
            <meshStandardMaterial
              color="#d4af37"
              roughness={0.4}
              metalness={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}

        {/* Headband & Tailband (woven silk binding bands at top and bottom of spine) */}
        {[-1, 1].map((sign, idx) => (
          <mesh
            key={idx}
            position={[-0.02, sign * (coverHeight * 0.48), 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.025, 0.025, 0.06, 12]} />
            <meshStandardMaterial color="#b45309" roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* 3. FRONT COVER BOARD (Swings open/shut around x = 0) */}
      <group
        ref={frontCoverGroupRef}
        position={[0, 0, bookThickness / 2 + boardThickness / 2]}
      >
        {/* Outer Front Cover Artwork Face */}
        <mesh
          position={[coverWidth / 2, 0, boardThickness / 2 + 0.001]}
          castShadow
          receiveShadow
        >
          <planeGeometry args={[coverWidth, coverHeight]} />
          <meshStandardMaterial
            map={coverTexture}
            roughness={0.6}
            metalness={0.2}
          />
        </mesh>

        {/* Front Board Core Body */}
        <mesh position={[coverWidth / 2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[coverWidth, coverHeight, boardThickness]} />
          <meshStandardMaterial
            color={rimColor}
            roughness={0.7}
            metalness={0.15}
          />
        </mesh>

        {/* Inner Endpaper Face (Paste-down endpaper shown when book is opened) */}
        <mesh
          position={[coverWidth / 2, 0, -boardThickness / 2 - 0.001]}
          rotation={[0, Math.PI, 0]}
        >
          <planeGeometry args={[coverWidth, coverHeight]} />
          <meshStandardMaterial
            color={theme === "dark" ? "#161b22" : theme === "sepia" ? "#ebd8be" : "#f4ede2"}
            roughness={0.9}
            metalness={0.0}
          />
        </mesh>
      </group>
    </group>
  );
}
