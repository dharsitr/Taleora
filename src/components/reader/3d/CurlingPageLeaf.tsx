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
 * Text is guaranteed never to appear reversed, mirrored, or inverted on either face.
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

  const gridX = 54;
  const gridY = 28;
  const stride = gridX + 1; // 55 vertices per row

  // High-density plane geometry for smooth organic curvature
  const geometry = React.useMemo(() => {
    const geom = new THREE.PlaneGeometry(width, height, gridX, gridY);
    // Align origin to spine (x = 0)
    if (direction === "next") {
      geom.translate(width / 2, 0, 0);
    } else {
      geom.translate(-width / 2, 0, 0);
    }
    return geom;
  }, [width, height, direction]);

  // Back face geometry: inverted UV.x and reversed winding so Verso text is right-reading
  const backGeometry = React.useMemo(() => {
    const geom = geometry.clone();

    // Invert horizontal UV coordinate for the back face
    const uvs = geom.attributes.uv;
    for (let i = 0; i < uvs.count; i++) {
      const u = uvs.getX(i);
      uvs.setX(i, 1.0 - u);
    }
    uvs.needsUpdate = true;

    // Flip triangle winding so the back face is front-facing when turned over
    const index = geom.index;
    if (index) {
      const arr = index.array;
      for (let i = 0; i < arr.length; i += 3) {
        const tmp = arr[i + 1];
        arr[i + 1] = arr[i + 2];
        arr[i + 2] = tmp;
      }
      index.needsUpdate = true;
    }

    geom.computeVertexNormals();
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
        const ix = i % stride;
        const iy = Math.floor(i / stride);

        // Three.js PlaneGeometry: iy = 0 is top (+height/2), iy = gridY is bottom (-height/2)
        const origY = (0.5 - iy / gridY) * height;
        const normalizedV = 1.0 - iy / gridY; // 0 at bottom, 1 at top

        let origX = 0;
        if (direction === "next") {
          origX = ix * (width / gridX);
        } else {
          origX = -width + ix * (width / gridX);
        }

        const normalizedU = Math.abs(origX) / width; // 0 at spine, 1 at outer edge

        let newX = origX;
        let newY = origY;

        if (direction === "next") {
          // Turning forward: right -> left (angle 0 -> -PI)
          const baseAngle = -smoothT * Math.PI;
          const angleLag = curlPeak * normalizedU * 0.38 * Math.sin(normalizedU * Math.PI * 0.9);
          const currentAngle = baseAngle - angleLag;

          // Cylindrical arch height as page bends across the gutter
          const archHeight = curlPeak * Math.sin(normalizedU * Math.PI) * (width * 0.32);
          // Diagonal corner lift (thumb peeling page from bottom outer corner)
          const cornerLift = curlPeak * (1.0 - normalizedV) * normalizedU * (width * 0.14);

          // Dynamic Z bias ensures the camera-facing side is always slightly in front
          const dynamicZBias = (isBack ? -1 : 1) * Math.cos(currentAngle) * 0.002;

          const r = normalizedU * width;
          newX = r * Math.cos(currentAngle);
          newZ = -r * Math.sin(currentAngle) + archHeight + cornerLift * 0.5 + dynamicZBias;
          newY = origY + cornerLift * 0.25;
        } else {
          // Turning backward: left -> right (angle -PI -> 0)
          const baseAngle = -Math.PI + smoothT * Math.PI;
          const angleLag = curlPeak * normalizedU * 0.38 * Math.sin(normalizedU * Math.PI * 0.9);
          const currentAngle = baseAngle + angleLag;

          const archHeight = curlPeak * Math.sin(normalizedU * Math.PI) * (width * 0.32);
          const cornerLift = curlPeak * (1.0 - normalizedV) * normalizedU * (width * 0.14);

          const dynamicZBias = (isBack ? 1 : -1) * Math.cos(currentAngle) * 0.002;

          const r = normalizedU * width;
          newX = r * Math.cos(currentAngle);
          newZ = -r * Math.sin(currentAngle) + archHeight + cornerLift * 0.5 + dynamicZBias;
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

      {/* Back Face (Verso): Next Landing Page (Never Inverted or Mirrored) */}
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
          side={THREE.FrontSide}
          shadowSide={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
