"use client";

import * as React from "react";
import * as THREE from "three";

interface RibbonBookmark3DProps {
  pageWidth: number;
  pageHeight: number;
}

export function RibbonBookmark3D({ pageWidth, pageHeight }: RibbonBookmark3DProps) {
  // Generate smooth 3D spline curve for the silk ribbon
  const ribbonMesh = React.useMemo(() => {
    const halfH = pageHeight * 0.5;
    const points = [
      new THREE.Vector3(0, halfH + 0.04, 0.04), // top spine anchor
      new THREE.Vector3(0.04, halfH * 0.7, 0.03),
      new THREE.Vector3(0.12, halfH * 0.2, 0.025),
      new THREE.Vector3(pageWidth * 0.22, -halfH * 0.4, 0.02),
      new THREE.Vector3(pageWidth * 0.32, -halfH - 0.08, 0.015), // hanging out bottom
      new THREE.Vector3(pageWidth * 0.36, -halfH - 0.28, -0.05),
    ];

    const curve = new THREE.CatmullRomCurve3(points);
    // Extrude a flat ribbon strip along the curve
    const shape = new THREE.Shape();
    const ribbonWidth = 0.07;
    const ribbonThick = 0.003;
    shape.moveTo(-ribbonWidth / 2, -ribbonThick / 2);
    shape.lineTo(ribbonWidth / 2, -ribbonThick / 2);
    shape.lineTo(ribbonWidth / 2, ribbonThick / 2);
    shape.lineTo(-ribbonWidth / 2, ribbonThick / 2);
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      extrudePath: curve,
      steps: 40,
      bevelEnabled: false,
    });

    return geometry;
  }, [pageWidth, pageHeight]);

  return (
    <mesh geometry={ribbonMesh} castShadow receiveShadow>
      <meshStandardMaterial
        color="#831843" // rich burgundy wine silk
        roughness={0.4}
        metalness={0.1}
      />
    </mesh>
  );
}
