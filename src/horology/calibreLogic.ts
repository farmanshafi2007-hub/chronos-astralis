export type FinishPresetId = 'rose-gold' | 'titanium-blued' | 'platinum-emerald' | 'vintage-brass';
export type LightingPresetId = 'atelier-warm' | 'observatory-twilight' | 'museum-contrast';
export type CameraPresetId = 'overview' | 'tourbillon-macro' | 'orrery-zenith' | 'gear-profile';
export type BeatFrequencyVph = 18000 | 21600 | 28800 | 36000;

export interface AssemblySpec {
  id: string;
  index: number;
  name: string;
  subtitle: string;
  partCount: number;
  baseY: number;
  explodedOffset: number;
  gearRatio: string;
  materialSummary: string;
  description: string;
}

export const CALIBRE_ASSEMBLIES: AssemblySpec[] = [
  {
    id: 'plinth-dial',
    index: 0,
    name: '01. Architectural Plinth & Chapter Ring',
    subtitle: 'Stepped Base · Engraved Horological Chapter Ring',
    partCount: 6,
    baseY: 0,
    explodedOffset: 0.0,
    gearRatio: 'Fixed Datum (1 : 1)',
    materialSummary: 'Turned Obsidian Alloy & Satin Chapter Track',
    description:
      'Lathe-turned multi-stepped foundation anchored flush to the studio horizon with an engraved 60-minute chapter ring and radial guilloché center.'
  },
  {
    id: 'mainplate-bridges',
    index: 1,
    name: '02. Skeletonized Mainplate & Pillars',
    subtitle: 'Structural Chassis · 4 Fluted Columns · 24 Perimeter Screws',
    partCount: 8,
    baseY: 0,
    explodedOffset: 0.34,
    gearRatio: 'Structural Frame',
    materialSummary: 'Anisotropic Brushed Metal & Heat-Blued Fasteners',
    description:
      'CNC-beveled openworked mainplate supporting the gear train arbor bearings, flanked by four lathe-turned fluted architectural columns.'
  },
  {
    id: 'gear-train',
    index: 2,
    name: '03. Involute Gear Train & Ruby Bearings',
    subtitle: 'Mainspring Barrel · Center, Third & Fourth Wheels',
    partCount: 11,
    baseY: 0,
    explodedOffset: 0.72,
    gearRatio: '1 : 8 : 60 : 360',
    materialSummary: 'Mirror-Polished Brass Teeth & Synthetic Corundum Rubies',
    description:
      'Four meshing involute gear assemblies transferring torque from the mainspring barrel to the escapement with synthetic ruby jewel bearings.'
  },
  {
    id: 'tourbillon-cage',
    index: 3,
    name: '04. Co-Axial Tourbillon & Hairspring',
    subtitle: 'One-Minute Carriage · Helical Balance Spring · Escapement',
    partCount: 9,
    baseY: 0,
    explodedOffset: 1.12,
    gearRatio: '60s Carriage · Harmonic Oscillator',
    materialSummary: 'Lightweight Titanium Bridge, Gold Timing Weights & Steel Spring',
    description:
      'Rotating tourbillon cage averaging out positional gravity errors, housing a breathing helical hairspring and weighted balance wheel.'
  },
  {
    id: 'celestial-orrery',
    index: 4,
    name: '05. Armillary Sphere & Tellurion Orrery',
    subtitle: 'Meridian Rings · Sol, Terra, Luna & Inner Planets',
    partCount: 10,
    baseY: 0,
    explodedOffset: 1.56,
    gearRatio: '365.25 : 29.53 : 87.97 Synodic',
    materialSummary: 'Spun Gold Sol, Lapis Terra, Silver Luna & Graduated Rings',
    description:
      'Keplerian planetary mechanism coupling Earth axial inclination, lunar nodal orbit, Mercury, and Venus inside twin graduated armillary rings.'
  },
  {
    id: 'sapphire-cloche',
    index: 5,
    name: '06. Optical Sapphire Dome & Bezel Crown',
    subtitle: 'Anti-Reflective Crystal Cloche · Knurled Upper Bezel',
    partCount: 4,
    baseY: 0,
    explodedOffset: 2.08,
    gearRatio: 'Hermetic Enclosure (IOR 1.77)',
    materialSummary: 'Optical Corundum Crystal & Beveled Retention Ring',
    description:
      'High-transmission hemispherical sapphire dome with physical refraction and a chamfered upper bezel ring protecting the celestial mechanics.'
  }
];

export interface FinishPalette {
  id: FinishPresetId;
  label: string;
  shortDesc: string;
  primaryMetalHex: number;
  secondaryMetalHex: number;
  accentMetalHex: number;
  baseChassisHex: number;
  dialBgHex: string;
  dialInkHex: string;
  dialAccentHex: string;
  swatchCss: string;
}

export const FINISH_PALETTES: Record<FinishPresetId, FinishPalette> = {
  'rose-gold': {
    id: 'rose-gold',
    label: '18k Rose Gold',
    shortDesc: 'Warm 5N Rose Gold · Obsidian Chassis',
    primaryMetalHex: 0xe6a88a,
    secondaryMetalHex: 0xc9cbd4,
    accentMetalHex: 0x3b82f6,
    baseChassisHex: 0x181b24,
    dialBgHex: '#10131a',
    dialInkHex: '#f3d5c3',
    dialAccentHex: '#e6a88a',
    swatchCss: '#e6a88a'
  },
  'titanium-blued': {
    id: 'titanium-blued',
    label: 'Grade 5 Titanium',
    shortDesc: 'Brushed Rhodium · Heat-Blued Steel',
    primaryMetalHex: 0xd0d7e2,
    secondaryMetalHex: 0x94a3b8,
    accentMetalHex: 0x2563eb,
    baseChassisHex: 0x111827,
    dialBgHex: '#0d1422',
    dialInkHex: '#e2e8f0',
    dialAccentHex: '#60a5fa',
    swatchCss: '#93c5fd'
  },
  'platinum-emerald': {
    id: 'platinum-emerald',
    label: '950 Platinum',
    shortDesc: 'Silvered Platinum · British Racing Green',
    primaryMetalHex: 0xe5e7eb,
    secondaryMetalHex: 0xd4af37,
    accentMetalHex: 0x10b981,
    baseChassisHex: 0x0c211b,
    dialBgHex: '#091c16',
    dialInkHex: '#ecfdf5',
    dialAccentHex: '#34d399',
    swatchCss: '#34d399'
  },
  'vintage-brass': {
    id: 'vintage-brass',
    label: 'Observatory Brass',
    shortDesc: 'Gilded Admiralty Brass · Lapis Enamel',
    primaryMetalHex: 0xdfb15b,
    secondaryMetalHex: 0xb87333,
    accentMetalHex: 0x60a5fa,
    baseChassisHex: 0x171f36,
    dialBgHex: '#11192e',
    dialInkHex: '#fef3c7',
    dialAccentHex: '#f59e0b',
    swatchCss: '#dfb15b'
  }
};

export interface LightingConfig {
  id: LightingPresetId;
  label: string;
  backgroundHex: number;
  fogHex: number;
  fogDensity: number;
  keyColorHex: number;
  keyIntensity: number;
  hemiSkyHex: number;
  hemiGroundHex: number;
  hemiIntensity: number;
  rimColorHex: number;
  rimIntensity: number;
  exposure: number;
}

export const LIGHTING_CONFIGS: Record<LightingPresetId, LightingConfig> = {
  'atelier-warm': {
    id: 'atelier-warm',
    label: 'Atelier Warm',
    backgroundHex: 0x0b0d13,
    fogHex: 0x0b0d13,
    fogDensity: 0.032,
    keyColorHex: 0xfff0dd,
    keyIntensity: 2.8,
    hemiSkyHex: 0x7aa2f7,
    hemiGroundHex: 0x1f1916,
    hemiIntensity: 0.85,
    rimColorHex: 0x93c5fd,
    rimIntensity: 1.7,
    exposure: 1.12
  },
  'observatory-twilight': {
    id: 'observatory-twilight',
    label: 'Observatory Dome',
    backgroundHex: 0x070b16,
    fogHex: 0x070b16,
    fogDensity: 0.035,
    keyColorHex: 0xfde68a,
    keyIntensity: 2.5,
    hemiSkyHex: 0x38bdf8,
    hemiGroundHex: 0x0f172a,
    hemiIntensity: 1.0,
    rimColorHex: 0x60a5fa,
    rimIntensity: 2.2,
    exposure: 1.15
  },
  'museum-contrast': {
    id: 'museum-contrast',
    label: 'Museum Spotlight',
    backgroundHex: 0x09090b,
    fogHex: 0x09090b,
    fogDensity: 0.04,
    keyColorHex: 0xffedd5,
    keyIntensity: 3.4,
    hemiSkyHex: 0x94a3b8,
    hemiGroundHex: 0x18181b,
    hemiIntensity: 0.55,
    rimColorHex: 0xfca5a5,
    rimIntensity: 1.4,
    exposure: 1.08
  }
};

export interface CameraPreset {
  id: CameraPresetId;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
}

export const CAMERA_PRESETS: Record<CameraPresetId, CameraPreset> = {
  overview: {
    id: 'overview',
    label: '3/4 Atelier View',
    position: [5.4, 4.3, 6.2],
    target: [0, 0.9, 0]
  },
  'tourbillon-macro': {
    id: 'tourbillon-macro',
    label: 'Tourbillon Macro',
    position: [2.35, 2.2, 2.75],
    target: [0, 0.85, 0]
  },
  'orrery-zenith': {
    id: 'orrery-zenith',
    label: 'Celestial Zenith',
    position: [0.01, 7.6, 2.2],
    target: [0, 1.0, 0]
  },
  'gear-profile': {
    id: 'gear-profile',
    label: 'Elevation Profile',
    position: [6.8, 1.45, 0.4],
    target: [0, 1.05, 0]
  }
};

export interface CalibreKinematicsState {
  mainspringAngle: number;
  centerWheelAngle: number;
  thirdWheelAngle: number;
  fourthWheelAngle: number;
  tourbillonCageAngle: number;
  balanceWheelAngle: number;
  hairspringScale: number;
  escapementAngle: number;
  mercuryOrbitAngle: number;
  venusOrbitAngle: number;
  earthOrbitAngle: number;
  earthSpinAngle: number;
  moonOrbitAngle: number;
  armillaryOuterAngle: number;
  armillaryInnerAngle: number;
}

/**
 * Exponential damping helper (frame-rate independent).
 */
export function dampValue(current: number, target: number, lambda: number, dt: number): number {
  if (dt <= 0) return current;
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/**
 * Computes vertical Y position for a given assembly index and exploded factor [0..1].
 */
export function computeLayerY(assemblyIndex: number, explodedFactor: number): number {
  const clamped = Math.max(0, Math.min(1, explodedFactor));
  const spec = CALIBRE_ASSEMBLIES[assemblyIndex];
  if (!spec) return 0;
  return spec.baseY + spec.explodedOffset * clamped;
}

/**
 * Computes oscillations per second (Hz) from vibrations per hour (vph).
 * Note: 1 vibration = 1 half-oscillation (tick or tock).
 * Beats per second = vph / 3600. Full harmonic cycles (Hz) = vph / 7200.
 */
export function computeEscapementHz(vph: BeatFrequencyVph): {
  ticksPerSecond: number;
  oscillationHz: number;
} {
  const ticksPerSecond = vph / 3600;
  const oscillationHz = vph / 7200;
  return { ticksPerSecond, oscillationHz };
}

/**
 * Pure kinematic calculation for the entire horological movement & celestial orrery at simulation time t (seconds).
 */
export function computeCalibreKinematics(
  simTimeSeconds: number,
  vph: BeatFrequencyVph
): CalibreKinematicsState {
  const { oscillationHz, ticksPerSecond } = computeEscapementHz(vph);

  // Tourbillon cage completes 1 full revolution every 60 sim seconds (2*PI / 60 rad/s)
  const tourbillonCageAngle = (simTimeSeconds * (Math.PI * 2)) / 60;

  // Balance wheel harmonic oscillation (+/- 1.35 radians at oscillationHz)
  const phase = simTimeSeconds * oscillationHz * Math.PI * 2;
  const balanceWheelAngle = Math.sin(phase) * 1.35;
  const hairspringScale = 1 + Math.sin(phase) * 0.085;

  // Quantized / stepped escapement wheel progression
  const totalTicks = simTimeSeconds * ticksPerSecond;
  const discreteTick = Math.floor(totalTicks) + Math.pow(totalTicks % 1, 3);
  const escapementAngle = -(discreteTick * ((Math.PI * 2) / 30));

  // Gear train meshing ratios relative to tourbillon / fourth wheel
  const fourthWheelAngle = -tourbillonCageAngle;
  const thirdWheelAngle = fourthWheelAngle / 3.5;
  const centerWheelAngle = -thirdWheelAngle / 4.0;
  const mainspringAngle = centerWheelAngle / 3.0;

  // Celestial Orrery orbital angles (scaled so 1x real-time is visibly graceful and 10x/60x is dramatic)
  const baseOrbitalRate = 0.22; // rad/s for Earth at 1x
  const earthOrbitAngle = simTimeSeconds * baseOrbitalRate;
  const venusOrbitAngle = earthOrbitAngle * (365.25 / 224.7);
  const mercuryOrbitAngle = earthOrbitAngle * (365.25 / 87.97);
  const moonOrbitAngle = earthOrbitAngle * 12.368;
  const earthSpinAngle = simTimeSeconds * 2.4;

  const armillaryOuterAngle = simTimeSeconds * 0.06;
  const armillaryInnerAngle = -simTimeSeconds * 0.09;

  return {
    mainspringAngle,
    centerWheelAngle,
    thirdWheelAngle,
    fourthWheelAngle,
    tourbillonCageAngle,
    balanceWheelAngle,
    hairspringScale,
    escapementAngle,
    mercuryOrbitAngle,
    venusOrbitAngle,
    earthOrbitAngle,
    earthSpinAngle,
    moonOrbitAngle,
    armillaryOuterAngle,
    armillaryInnerAngle
  };
}
