"use client";

import * as React from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface CurlingPageLeafProps {
  width: number;
  height: number;
  progress: number; // 0.0 to 1.0
  direction: "next" | "prev";
  frontTexture: THREE.CanvasTexture;
  backTexture: THREE.CanvasTexture;
  prefersReducedMotion?: boolean;
}

/**
 * Realistic 3D turning leaf with authentic vertex curling, bending, and shadow casting.
 * Text is guaranteed never to appear reversed, mirrored, or flipped on either face.
 */
export function CurlingPageLeaf({
  width,
  height,
  progress,
  direction,
  frontTexture,
  backTexture,
  prefersReducedMotion = false,
}: CurlingPageLeafProps) {
  const frontMeshRef = React.useRef<THREE.Mesh>(null);
  const backMeshRef = React.useRef<THREE.Mesh>(null);

  // High-density plane geometry for smooth organic curvature
  const geometry = React.useMemo(() => {
    // 54 segments horizontally, 28 vertically
    const geom = new THREE.PlaneGeometry(width, height, 54, 28);
    // Align origin to spine (x = 0)
    if (direction === "next") {
      geom.translate(width / 2, 0, 0);
    } else {
      geom.translate(-width / 2, 0, 0);
    }
    return geom;
  }, [width, height, direction]);

  // Back face geometry with flipped UV.x so Verso text is NEVER mirrored
  const backGeometry = React.useMemo(() => {
    const geom = geometry.clone();
    const uvs = geom.attributes.uv;
    for (let i = 0; i < uvs.count; i++) {
      const u = uvs.getX(i);
      // Invert horizontal UV coordinate for the back face
      uvs.setX(i, 1.0 - u);
    }
    uvs.needsUpdate = true;
    return geom;
  }, [geometry]);

  // Custom vertex deformation applied each frame for silky-smooth 60fps page curl
  useFrame(() => {
    const t = Math.max(0, Math.min(1, progress));

    // Smooth cubic easing
    const smoothT = prefersReducedMotion
      ? t
      : t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const curlPeak = prefersReducedMotion ? 0 : Math.sin(t * Math.PI);

    [
      { mesh: frontMeshRef.current, isBack: false },
      { mesh: backMeshRef.current, isBack: true },
    ].forEach(({ mesh, isBack }) => {
      if (!mesh) return;

      const posAttr = mesh.geometry.attributes.position;
      const count = posAttr.count;

      for (let i = 0; i < count; i++) {
        // Retrieve original grid coordinates
        let origX = 0;
        let origY = 0;

        if (direction === "next") {
          origX = (i % 55) * (width / 54);
          origY = (Math.floor(i / 55) / 28 - 0.5) * height;
        } else {
          origX = -width + (i % 55) * (width / 54);
          origY = (Math.floor(i / 55) / 28 - 0.5) * height;
        }

        const normalizedU = Math.abs(origX) / width; // 0 at spine, 1 at outer edge
        const normalizedV = (origY + height * 0.5) / height; // 0 at bottom, 1 at top

        let newX = origX;
        let newY = origY;
        let newZ = isBack ? -0.002 : 0.002;

        if (direction === "next") {
          // Turning forward: right -> left (angle 0 -> -PI)
          const baseAngle = -smoothT * Math.PI;
          // Outer edge lags slightly in angle, creating natural flex
          const angleLag = curlPeak * normalizedU * 0.38 * Math.sin(normalizedU * Math.PI * 0.9);
          const currentAngle = baseAngle - angleLag;

          // Cylindrical arch height as page bends across the gutter
          const archHeight = curlPeak * Math.sin(normalizedU * Math.PI) * (width * 0.32);
          // Diagonal corner lift (thumb peeling page from bottom outer corner)
          const cornerLift = curlPeak * (1.0 - normalizedV) * normalizedU * (width * 0.14);

          const r = normalizedU * width;
          newX = r * Math.cos(currentAngle);
          newZ = -r * Math.sin(currentAngle) + archHeight + cornerLift * 0.5 + (isBack ? -0.002 : 0.002);
          newY = origY + cornerLift * 0.25;
        } else {
          // Turning backward: left -> right (angle -PI -> 0)
          const baseAngle = -Math.PI + smoothT * Math.PI;
          const angleLag = curlPeak * normalizedU * 0.38 * Math.sin(normalizedU * Math.PI * 0.9);
          const currentAngle = baseAngle + angleLag;

          const archHeight = curlPeak * Math.sin(normalizedU * Math.PI) * (width * 0.32);
          const cornerLift = curlPeak * (1.0 - normalizedV) * normalizedU * (width * 0.14);

          const r = normalizedU * width;
          newX = r * Math.cos(currentAngle);
          newZ = -r * Math.sin(currentAngle) + archHeight + cornerLift * 0.5 + (isBack ? -0.002 : 0.002);
          newY = origY + cornerLift * 0.25;
        }

        posAttr.setXYZ(i, newX, newY, newZ);
      }

      posAttr.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    });
  });

  return (
    <group position={[0, 0, 0.02]}>
      {/* Front Face (Recto): Current Turning Page */}
      <mesh
        ref={frontMeshRef}
        geometry={geometry}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          map={frontTexture}
          roughness={0.7}
          metalness={0.05}
          side={THREE.FrontSide}
          shadowSide={THREE.DoubleSide}
        />
      </mesh>

      {/* Back Face (Verso): Next Landing Page (Never Mirrored) */}
      <mesh
        ref={backMeshRef}
        geometry={backGeometry}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          map={backTexture}
          roughness={0.7}
          metalness={0.05}
          side={THREE.BackSide}
          shadowSide={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
