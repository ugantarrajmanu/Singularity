import { AdditiveBlending, Color, LineBasicMaterial, MeshStandardMaterial } from "three";
import { PALETTE } from "@/constants/theme";

/** Shared, reused materials for region geometry (roadmap §18: reuse materials). */
export const glassMaterial = new MeshStandardMaterial({
  color: new Color(PALETTE.deepSpace),
  emissive: new Color(PALETTE.violet),
  emissiveIntensity: 0.12,
  metalness: 0.75,
  roughness: 0.22,
  transparent: true,
  opacity: 0.6,
});

export const edgeMaterial = new LineBasicMaterial({
  color: new Color(PALETTE.softPurple),
  transparent: true,
  opacity: 0.75,
  blending: AdditiveBlending,
  depthWrite: false,
});

export const dimEdgeMaterial = new LineBasicMaterial({
  color: new Color(PALETTE.violet),
  transparent: true,
  opacity: 0.35,
  blending: AdditiveBlending,
  depthWrite: false,
});

export const glowMaterial = new MeshStandardMaterial({
  color: new Color(PALETTE.lavender),
  emissive: new Color(PALETTE.softPurple),
  emissiveIntensity: 2.2,
  toneMapped: false,
});
