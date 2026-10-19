import * as THREE from 'three';
import { FinishPalette } from './calibreLogic';

/**
 * Generates a high-resolution procedural horological chapter ring & astronomical dial texture.
 */
export function createChapterDialTexture(
  palette: FinishPalette,
  maxAnisotropy: number,
  isHeadless: boolean
): THREE.CanvasTexture {
  const size = isHeadless ? 512 : 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;
  const rMax = size * 0.48;

  // Deep radial background
  const grad = ctx.createRadialGradient(cx, cy, rMax * 0.05, cx, cy, rMax);
  grad.addColorStop(0, palette.dialBgHex);
  grad.addColorStop(0.72, palette.dialBgHex);
  grad.addColorStop(1, '#05070b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Concentric guilloché rings
  ctx.strokeStyle = palette.dialAccentHex;
  ctx.globalAlpha = 0.16;
  ctx.lineWidth = 1.2;
  for (let r = rMax * 0.18; r <= rMax * 0.72; r += rMax * 0.025) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Outer chapter ring border tracks
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = palette.dialInkHex;
  ctx.lineWidth = size * 0.003;
  [0.96, 0.84, 0.74].forEach((ratio) => {
    ctx.beginPath();
    ctx.arc(cx, cy, rMax * ratio, 0, Math.PI * 2);
    ctx.stroke();
  });

  // 60 minute ticks and 12 Roman numerals
  const romans = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  ctx.fillStyle = palette.dialInkHex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const isMajor = i % 5 === 0;
    const innerR = rMax * (isMajor ? 0.85 : 0.9);
    const outerR = rMax * 0.955;

    ctx.strokeStyle = isMajor ? palette.dialAccentHex : palette.dialInkHex;
    ctx.lineWidth = isMajor ? size * 0.0045 : size * 0.002;
    ctx.globalAlpha = isMajor ? 0.95 : 0.55;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
    ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
    ctx.stroke();

    if (isMajor) {
      const hourIndex = i / 5;
      const textR = rMax * 0.79;
      ctx.save();
      ctx.translate(cx + Math.cos(angle) * textR, cy + Math.sin(angle) * textR);
      ctx.rotate(angle + Math.PI / 2);
      ctx.globalAlpha = 0.95;
      ctx.font = `600 ${Math.round(size * 0.036)}px "Cormorant Garamond", Georgia, serif`;
      ctx.fillText(romans[hourIndex], 0, 0);
      ctx.restore();
    }
  }

  // Astronomical degree markings on inner track
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = palette.dialAccentHex;
  ctx.lineWidth = size * 0.0015;
  for (let deg = 0; deg < 72; deg++) {
    const angle = (deg / 72) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * (rMax * 0.7), cy + Math.sin(angle) * (rMax * 0.7));
    ctx.lineTo(cx + Math.cos(angle) * (rMax * 0.735), cy + Math.sin(angle) * (rMax * 0.735));
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates a linear/circular brushed metallic micro-relief bump & roughness map (NoColorSpace).
 */
export function createBrushedMetalBumpTexture(
  maxAnisotropy: number,
  isHeadless: boolean
): THREE.CanvasTexture {
  const size = isHeadless ? 256 : 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Subtle Côtes de Genève stripes + fine grain
  for (let y = 0; y < size; y += 2) {
    const wave = Math.sin((y / size) * Math.PI * 16) * 18;
    const noise = ((y * 73) % 19) - 9;
    const val = Math.max(0, Math.min(255, Math.round(128 + wave + noise)));
    ctx.fillStyle = `rgb(${val},${val},${val})`;
    ctx.fillRect(0, y, size, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates a soft radial contact shadow texture to ground the plinth flush on the floor plane.
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;

  const grad = ctx.createRadialGradient(half, half, half * 0.15, half, half, half * 0.96);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.42)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
