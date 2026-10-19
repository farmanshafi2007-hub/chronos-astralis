import * as THREE from 'three';
import { FinishPalette } from './calibreLogic';
import {
  createBrushedMetalBumpTexture,
  createChapterDialTexture,
  createContactShadowTexture
} from './textures';

export interface CalibreSceneHandles {
  rootGroup: THREE.Group;
  assemblyGroups: THREE.Group[];
  interactableMeshes: THREE.Object3D[];
  // Animated sub-parts
  mainspringWheel: THREE.Object3D;
  centerWheel: THREE.Object3D;
  thirdWheel: THREE.Object3D;
  fourthWheel: THREE.Object3D;
  tourbillonCarriage: THREE.Group;
  balanceWheel: THREE.Object3D;
  hairspringMesh: THREE.Mesh;
  escapementWheel: THREE.Object3D;
  mercuryArm: THREE.Group;
  venusArm: THREE.Group;
  earthArm: THREE.Group;
  earthGlobeGroup: THREE.Group;
  moonArm: THREE.Group;
  armillaryOuterRing: THREE.Mesh;
  armillaryInnerRing: THREE.Mesh;
  // Dynamic material & texture update hook
  applyFinishPalette: (palette: FinishPalette) => void;
  setHighlightedAssembly: (assemblyIndex: number | null) => void;
  dispose: () => void;
}

/**
 * Helper to create a procedural involute-style spoked gear geometry using THREE.ExtrudeGeometry.
 */
function createInvoluteGearGeometry(
  outerRadius: number,
  innerRimRadius: number,
  hubRadius: number,
  teethCount: number,
  thickness: number,
  spokeCount: number
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const toothPitch = (Math.PI * 2) / teethCount;
  const addendum = outerRadius;
  const dedendum = outerRadius * 0.89;

  for (let i = 0; i < teethCount; i++) {
    const a0 = i * toothPitch;
    const a1 = a0 + toothPitch * 0.22;
    const a2 = a0 + toothPitch * 0.36;
    const a3 = a0 + toothPitch * 0.64;
    const a4 = a0 + toothPitch * 0.78;

    const p0x = Math.cos(a0) * dedendum;
    const p0y = Math.sin(a0) * dedendum;
    if (i === 0) {
      shape.moveTo(p0x, p0y);
    } else {
      shape.lineTo(p0x, p0y);
    }
    shape.lineTo(Math.cos(a1) * dedendum, Math.sin(a1) * dedendum);
    shape.lineTo(Math.cos(a2) * addendum, Math.sin(a2) * addendum);
    shape.lineTo(Math.cos(a3) * addendum, Math.sin(a3) * addendum);
    shape.lineTo(Math.cos(a4) * dedendum, Math.sin(a4) * dedendum);
  }
  shape.closePath();

  // Cut out openworked spoke windows between hubRadius and innerRimRadius
  if (spokeCount > 0 && innerRimRadius > hubRadius * 1.25) {
    const windowPitch = (Math.PI * 2) / spokeCount;
    const spokeHalfAngle = 0.14;
    for (let s = 0; s < spokeCount; s++) {
      const startA = s * windowPitch + spokeHalfAngle;
      const endA = (s + 1) * windowPitch - spokeHalfAngle;
      if (endA > startA) {
        const hole = new THREE.Path();
        const steps = 10;
        hole.moveTo(Math.cos(startA) * hubRadius, Math.sin(startA) * hubRadius);
        for (let k = 0; k <= steps; k++) {
          const a = startA + ((endA - startA) * k) / steps;
          hole.lineTo(Math.cos(a) * innerRimRadius, Math.sin(a) * innerRimRadius);
        }
        for (let k = steps; k >= 0; k--) {
          const a = startA + ((endA - startA) * k) / steps;
          hole.lineTo(Math.cos(a) * hubRadius, Math.sin(a) * hubRadius);
        }
        hole.closePath();
        shape.holes.push(hole);
      }
    }
  }

  // Central arbor pinhole
  const arborHole = new THREE.Path();
  arborHole.absarc(0, 0, hubRadius * 0.38, 0, Math.PI * 2, false);
  shape.holes.push(arborHole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: thickness * 0.16,
    bevelSize: thickness * 0.14,
    bevelSegments: 2,
    curveSegments: 16
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -thickness / 2, 0);
  return geo;
}

/**
 * Helper to create a helical balance hairspring geometry using THREE.TubeGeometry.
 */
function createHairspringGeometry(turns: number, innerR: number, outerR: number): THREE.TubeGeometry {
  const points: THREE.Vector3[] = [];
  const totalSteps = turns * 32;
  for (let i = 0; i <= totalSteps; i++) {
    const t = i / totalSteps;
    const angle = t * turns * Math.PI * 2;
    const r = innerR + (outerR - innerR) * t;
    const y = Math.sin(t * Math.PI) * 0.025;
    points.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, totalSteps, 0.011, 8, false);
}

/**
 * Builds the complete 6-layer composite 3D Horological Orrery & Tourbillon Calibre.
 */
export function buildCalibreSceneModel(
  initialPalette: FinishPalette,
  maxAnisotropy: number,
  isHeadless: boolean
): CalibreSceneHandles {
  const rootGroup = new THREE.Group();
  const assemblyGroups: THREE.Group[] = [];
  const interactableMeshes: THREE.Object3D[] = [];
  const geometriesToDispose: THREE.BufferGeometry[] = [];
  const materialsToDispose: THREE.Material[] = [];
  const texturesToDispose: THREE.Texture[] = [];

  const registerGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometriesToDispose.push(g);
    return g;
  };
  const registerMat = <T extends THREE.Material>(m: T): T => {
    materialsToDispose.push(m);
    return m;
  };

  const brushedBump = createBrushedMetalBumpTexture(maxAnisotropy, isHeadless);
  texturesToDispose.push(brushedBump);

  let currentDialTexture = createChapterDialTexture(initialPalette, maxAnisotropy, isHeadless);
  texturesToDispose.push(currentDialTexture);

  const shadowTexture = createContactShadowTexture();
  texturesToDispose.push(shadowTexture);

  // Shared PBR Materials with varied roughness (>= 0.25 contrast across adjacent parts)
  const primaryMetalMat = registerMat(
    new THREE.MeshPhysicalMaterial({
      color: initialPalette.primaryMetalHex,
      metalness: isHeadless ? 0.25 : 0.92,
      roughness: 0.18,
      anisotropy: isHeadless ? 0 : 0.75,
      clearcoat: isHeadless ? 0 : 0.35,
      clearcoatRoughness: 0.15,
      bumpMap: brushedBump,
      bumpScale: 0.008
    })
  );

  const secondaryMetalMat = registerMat(
    new THREE.MeshStandardMaterial({
      color: initialPalette.secondaryMetalHex,
      metalness: isHeadless ? 0.22 : 0.86,
      roughness: 0.44,
      bumpMap: brushedBump,
      bumpScale: 0.012
    })
  );

  const accentBluedMat = registerMat(
    new THREE.MeshPhysicalMaterial({
      color: initialPalette.accentMetalHex,
      metalness: isHeadless ? 0.25 : 0.9,
      roughness: 0.14,
      clearcoat: isHeadless ? 0 : 0.65,
      clearcoatRoughness: 0.1
    })
  );

  const matteChassisMat = registerMat(
    new THREE.MeshStandardMaterial({
      color: initialPalette.baseChassisHex,
      metalness: 0.35,
      roughness: 0.76,
      bumpMap: brushedBump,
      bumpScale: 0.015
    })
  );

  const rubyJewelMat = registerMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xe11d48,
      emissive: 0x4c0519,
      emissiveIntensity: 0.35,
      metalness: 0.05,
      roughness: 0.08,
      transmission: isHeadless ? 0 : 0.78,
      ior: 1.77,
      thickness: 0.35,
      clearcoat: 1.0
    })
  );

  const dialSurfaceMat = registerMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: currentDialTexture,
      metalness: 0.3,
      roughness: 0.42,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    })
  );

  const sapphireDomeMat = registerMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.05,
      transmission: isHeadless ? 0 : 0.92,
      transparent: true,
      opacity: isHeadless ? 0.24 : 1.0,
      ior: 1.77,
      thickness: 0.85,
      attenuationColor: new THREE.Color(0xe0f2fe),
      attenuationDistance: 4.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      depthWrite: false
    })
  );

  // Create the 6 assembly groups
  for (let i = 0; i < 6; i++) {
    const group = new THREE.Group();
    group.name = `assembly-${i}`;
    group.userData = { assemblyIndex: i };
    assemblyGroups.push(group);
    rootGroup.add(group);
  }

  // Helper to tag meshes for raycasting on layer 1
  const tagMeshForAssembly = (obj: THREE.Object3D, assemblyIndex: number, castShadow = true) => {
    obj.userData = { assemblyIndex };
    obj.layers.enable(1);
    if ((obj as THREE.Mesh).isMesh) {
      obj.castShadow = castShadow && !isHeadless;
      obj.receiveShadow = !isHeadless;
    }
    interactableMeshes.push(obj);
  };

  // ============================================================================
  // STUDIO HORIZON FLOOR & RADIAL CONTACT SHADOW (Grounded at Y = 0)
  // ============================================================================
  const studioFloorGeo = registerGeo(new THREE.CircleGeometry(28, 64));
  studioFloorGeo.rotateX(-Math.PI / 2);
  const studioFloorMat = registerMat(
    new THREE.MeshStandardMaterial({
      color: 0x0b0e15,
      roughness: 0.82,
      metalness: 0.15
    })
  );
  const studioFloor = new THREE.Mesh(studioFloorGeo, studioFloorMat);
  studioFloor.position.y = -0.02;
  studioFloor.receiveShadow = !isHeadless;
  rootGroup.add(studioFloor);

  // Engraved reference compass rings on floor (offset Y = -0.005 so no Z-fighting)
  const floorGridRingGeo = registerGeo(new THREE.RingGeometry(3.55, 3.6, 96));
  floorGridRingGeo.rotateX(-Math.PI / 2);
  const floorGridMat = registerMat(
    new THREE.MeshBasicMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    })
  );
  const floorGridRing = new THREE.Mesh(floorGridRingGeo, floorGridMat);
  floorGridRing.position.y = -0.005;
  rootGroup.add(floorGridRing);

  // Soft radial contact shadow disc at y = 0.005
  const contactShadowGeo = registerGeo(new THREE.PlaneGeometry(7.6, 7.6));
  contactShadowGeo.rotateX(-Math.PI / 2);
  const contactShadowMat = registerMat(
    new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.68,
      depthWrite: false
    })
  );
  const contactShadowMesh = new THREE.Mesh(contactShadowGeo, contactShadowMat);
  contactShadowMesh.position.y = 0.005;
  rootGroup.add(contactShadowMesh);

  // ============================================================================
  // LAYER 0: ARCHITECTURAL PLINTH & CHAPTER RING (6 parts, flush at y = 0)
  // ============================================================================
  const layer0 = assemblyGroups[0];

  // Part 1: Lathe-turned stepped architectural base plinth (bottom flush at y = 0)
  const plinthPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(3.15, 0),
    new THREE.Vector2(3.15, 0.12),
    new THREE.Vector2(2.98, 0.18),
    new THREE.Vector2(2.92, 0.34),
    new THREE.Vector2(2.74, 0.42),
    new THREE.Vector2(0, 0.42)
  ];
  const plinthGeo = registerGeo(new THREE.LatheGeometry(plinthPoints, 72));
  const plinthMesh = new THREE.Mesh(plinthGeo, matteChassisMat);
  tagMeshForAssembly(plinthMesh, 0);
  layer0.add(plinthMesh);

  // Part 2: Primary metallic lower trim bezel ring
  const lowerTrimGeo = registerGeo(new THREE.TorusGeometry(2.96, 0.045, 16, 72));
  lowerTrimGeo.rotateX(Math.PI / 2);
  const lowerTrimMesh = new THREE.Mesh(lowerTrimGeo, primaryMetalMat);
  lowerTrimMesh.position.y = 0.22;
  tagMeshForAssembly(lowerTrimMesh, 0);
  layer0.add(lowerTrimMesh);

  // Part 3: Chapter Ring Dial Disc (offset at y = 0.435 to prevent coplanar Z-fighting)
  const dialDiscGeo = registerGeo(new THREE.CylinderGeometry(2.68, 2.68, 0.03, 72));
  const dialDiscMesh = new THREE.Mesh(dialDiscGeo, dialSurfaceMat);
  dialDiscMesh.position.y = 0.435;
  tagMeshForAssembly(dialDiscMesh, 0, false);
  layer0.add(dialDiscMesh);

  // Part 4: Inner guilloché Gold/Metallic ring collar
  const innerCollarGeo = registerGeo(new THREE.RingGeometry(1.88, 2.02, 64));
  innerCollarGeo.rotateX(-Math.PI / 2);
  const innerCollarMesh = new THREE.Mesh(innerCollarGeo, primaryMetalMat);
  innerCollarMesh.position.y = 0.455;
  tagMeshForAssembly(innerCollarMesh, 0, false);
  layer0.add(innerCollarMesh);

  // Part 5 & 6: 4 Cardinal Chronometer Lug Brackets around plinth
  const lugGeo = registerGeo(new THREE.BoxGeometry(0.36, 0.26, 0.48));
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const lug = new THREE.Mesh(lugGeo, secondaryMetalMat);
    lug.position.set(Math.cos(a) * 2.98, 0.16, Math.sin(a) * 2.98);
    lug.rotation.y = -a;
    tagMeshForAssembly(lug, 0);
    layer0.add(lug);
  }

  // ============================================================================
  // LAYER 1: SKELETONIZED MAINPLATE, PILLARS & INSTANCED SCREWS (8+ parts)
  // ============================================================================
  const layer1 = assemblyGroups[1];

  // Part 1: Openworked Skeleton Mainplate Bridge (ExtrudeGeometry)
  const plateShape = new THREE.Shape();
  plateShape.absarc(0, 0, 2.38, 0, Math.PI * 2, false);
  for (let i = 0; i < 4; i++) {
    const aStart = (i * Math.PI) / 2 + 0.24;
    const aEnd = ((i + 1) * Math.PI) / 2 - 0.24;
    const cutout = new THREE.Path();
    cutout.absarc(0, 0, 1.92, aStart, aEnd, false);
    cutout.absarc(0, 0, 0.72, aEnd, aStart, true);
    cutout.closePath();
    plateShape.holes.push(cutout);
  }
  const mainplateGeo = registerGeo(
    new THREE.ExtrudeGeometry(plateShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.018,
      bevelSegments: 2,
      curveSegments: 32
    })
  );
  mainplateGeo.rotateX(-Math.PI / 2);
  const mainplateMesh = new THREE.Mesh(mainplateGeo, secondaryMetalMat);
  mainplateMesh.position.y = 0.56;
  tagMeshForAssembly(mainplateMesh, 1);
  layer1.add(mainplateMesh);

  // Part 2–5: Four Lathe-turned Architectural Columns supporting upper movement
  const pillarPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.16, 0),
    new THREE.Vector2(0.16, 0.08),
    new THREE.Vector2(0.105, 0.12),
    new THREE.Vector2(0.105, 0.72),
    new THREE.Vector2(0.16, 0.76),
    new THREE.Vector2(0.16, 0.84),
    new THREE.Vector2(0, 0.84)
  ];
  const pillarGeo = registerGeo(new THREE.LatheGeometry(pillarPoints, 24));
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const pillar = new THREE.Mesh(pillarGeo, primaryMetalMat);
    pillar.position.set(Math.cos(a) * 2.12, 0.46, Math.sin(a) * 2.12);
    tagMeshForAssembly(pillar, 1);
    layer1.add(pillar);
  }

  // Part 6: Transverse Gear Train Bridge
  const bridgeGeo = registerGeo(new THREE.BoxGeometry(3.4, 0.06, 0.42));
  const bridgeMesh = new THREE.Mesh(bridgeGeo, primaryMetalMat);
  bridgeMesh.position.set(0, 0.94, -0.65);
  tagMeshForAssembly(bridgeMesh, 1);
  layer1.add(bridgeMesh);

  // Part 7: InstancedMesh of 36 Heat-Blued Perimeter Screws (> 20 repeated items!)
  const screwGeo = registerGeo(new THREE.CylinderGeometry(0.042, 0.042, 0.05, 14));
  const screwCount = 36;
  const screwInstanced = new THREE.InstancedMesh(screwGeo, accentBluedMat, screwCount);
  const dummyMat4 = new THREE.Matrix4();
  const dummyPos = new THREE.Vector3();
  const dummyQuat = new THREE.Quaternion();
  const dummyScale = new THREE.Vector3();
  const dummyColor = new THREE.Color();

  for (let i = 0; i < screwCount; i++) {
    const ringIdx = i < 24 ? 0 : 1;
    const angle =
      ringIdx === 0 ? (i / 24) * Math.PI * 2 : ((i - 24) / 12) * Math.PI * 2 + 0.15;
    const radius = ringIdx === 0 ? 2.26 : 0.62;
    const yPos = ringIdx === 0 ? 0.66 : 0.66;
    dummyPos.set(Math.cos(angle) * radius, yPos, Math.sin(angle) * radius);
    dummyQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    const s = 0.92 + (i % 3) * 0.08;
    dummyScale.set(s, 1, s);
    dummyMat4.compose(dummyPos, dummyQuat, dummyScale);
    screwInstanced.setMatrixAt(i, dummyMat4);
    dummyColor.setHex(initialPalette.accentMetalHex).offsetHSL(0, 0, ((i % 5) - 2) * 0.03);
    screwInstanced.setColorAt(i, dummyColor);
  }
  screwInstanced.instanceMatrix.needsUpdate = true;
  if (screwInstanced.instanceColor) screwInstanced.instanceColor.needsUpdate = true;
  screwInstanced.computeBoundingSphere();
  tagMeshForAssembly(screwInstanced, 1, false);
  layer1.add(screwInstanced);

  // ============================================================================
  // LAYER 2: INVOLUTE GEAR TRAIN & SYNTHETIC RUBY BEARINGS (11 parts)
  // ============================================================================
  const layer2 = assemblyGroups[2];

  // Helper to assemble a complete gear wheel with arbor shaft + ruby jewel chaton
  const buildGearAssembly = (
    outerR: number,
    innerR: number,
    hubR: number,
    teeth: number,
    spokeCount: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number
  ): THREE.Group => {
    const gGroup = new THREE.Group();
    gGroup.position.set(x, y, z);

    const gearGeo = registerGeo(
      createInvoluteGearGeometry(outerR, innerR, hubR, teeth, 0.065, spokeCount)
    );
    const gearMesh = new THREE.Mesh(gearGeo, mat);
    tagMeshForAssembly(gearMesh, 2);
    gGroup.add(gearMesh);

    const arborGeo = registerGeo(new THREE.CylinderGeometry(0.055, 0.055, 0.36, 16));
    const arborMesh = new THREE.Mesh(arborGeo, secondaryMetalMat);
    tagMeshForAssembly(arborMesh, 2);
    gGroup.add(arborMesh);

    const jewelGeo = registerGeo(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 20));
    const jewelMesh = new THREE.Mesh(jewelGeo, rubyJewelMat);
    jewelMesh.position.y = 0.06;
    tagMeshForAssembly(jewelMesh, 2, false);
    gGroup.add(jewelMesh);

    layer2.add(gGroup);
    return gGroup;
  };

  const mainspringWheel = buildGearAssembly(
    0.86,
    0.68,
    0.24,
    36,
    6,
    primaryMetalMat,
    -0.88,
    0.76,
    -0.55
  );
  const centerWheel = buildGearAssembly(
    0.72,
    0.55,
    0.2,
    30,
    5,
    secondaryMetalMat,
    0.0,
    0.82,
    0.0
  );
  const thirdWheel = buildGearAssembly(
    0.58,
    0.42,
    0.16,
    24,
    5,
    primaryMetalMat,
    0.85,
    0.78,
    -0.48
  );
  const fourthWheel = buildGearAssembly(
    0.48,
    0.34,
    0.14,
    20,
    4,
    accentBluedMat,
    0.0,
    0.88,
    0.78
  );

  // ============================================================================
  // LAYER 3: CO-AXIAL TOURBILLON CAGE, BALANCE WHEEL & HAIRSPRING (9 parts)
  // ============================================================================
  const layer3 = assemblyGroups[3];
  const tourbillonCarriage = new THREE.Group();
  tourbillonCarriage.position.set(0, 1.12, 0.78);
  layer3.add(tourbillonCarriage);

  // Part 1 & 2: Tourbillon Upper & Lower Lyre Cage Rings
  const cageRingGeo = registerGeo(new THREE.TorusGeometry(0.56, 0.028, 14, 48));
  cageRingGeo.rotateX(Math.PI / 2);
  const lowerCageRing = new THREE.Mesh(cageRingGeo, secondaryMetalMat);
  lowerCageRing.position.y = -0.14;
  tagMeshForAssembly(lowerCageRing, 3);
  tourbillonCarriage.add(lowerCageRing);

  const upperCageRing = new THREE.Mesh(cageRingGeo, secondaryMetalMat);
  upperCageRing.position.y = 0.14;
  tagMeshForAssembly(upperCageRing, 3);
  tourbillonCarriage.add(upperCageRing);

  // Part 3, 4, 5: Three Curved Tourbillon Cage Stanchions
  const stanchionGeo = registerGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.28, 12));
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const post = new THREE.Mesh(stanchionGeo, primaryMetalMat);
    post.position.set(Math.cos(a) * 0.56, 0, Math.sin(a) * 0.56);
    tagMeshForAssembly(post, 3);
    tourbillonCarriage.add(post);
  }

  // Part 6: Harmonic Balance Wheel with Timing Poise Weights
  const balanceWheel = new THREE.Group();
  tourbillonCarriage.add(balanceWheel);

  const balanceRimGeo = registerGeo(new THREE.TorusGeometry(0.42, 0.024, 14, 48));
  balanceRimGeo.rotateX(Math.PI / 2);
  const balanceRim = new THREE.Mesh(balanceRimGeo, primaryMetalMat);
  tagMeshForAssembly(balanceRim, 3);
  balanceWheel.add(balanceRim);

  const crossBarGeo = registerGeo(new THREE.BoxGeometry(0.82, 0.022, 0.036));
  const crossBar = new THREE.Mesh(crossBarGeo, primaryMetalMat);
  tagMeshForAssembly(crossBar, 3);
  balanceWheel.add(crossBar);

  // Timing weights around balance wheel rim
  const weightGeo = registerGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.07, 10));
  weightGeo.rotateZ(Math.PI / 2);
  for (let w = 0; w < 8; w++) {
    const a = (w * Math.PI) / 4;
    const weight = new THREE.Mesh(weightGeo, accentBluedMat);
    weight.position.set(Math.cos(a) * 0.43, 0, Math.sin(a) * 0.43);
    weight.rotation.y = -a;
    tagMeshForAssembly(weight, 3, false);
    balanceWheel.add(weight);
  }

  // Part 7: Breathing Helical Hairspring (TubeGeometry)
  const hairspringGeo = registerGeo(createHairspringGeometry(4.5, 0.07, 0.31));
  const hairspringMesh = new THREE.Mesh(hairspringGeo, accentBluedMat);
  hairspringMesh.position.y = 0.045;
  tagMeshForAssembly(hairspringMesh, 3, false);
  tourbillonCarriage.add(hairspringMesh);

  // Part 8: Co-Axial Escapement Wheel inside Carriage
  const escapementGeo = registerGeo(
    createInvoluteGearGeometry(0.22, 0.15, 0.06, 15, 0.03, 3)
  );
  const escapementWheel = new THREE.Mesh(escapementGeo, rubyJewelMat);
  escapementWheel.position.set(0.24, -0.06, 0);
  tagMeshForAssembly(escapementWheel, 3, false);
  tourbillonCarriage.add(escapementWheel);

  // Part 9: Upper Tourbillon Bridge Bar & Ruby Capstone
  const tourbillonBridgeGeo = registerGeo(new THREE.BoxGeometry(1.48, 0.045, 0.14));
  const tourbillonBridge = new THREE.Mesh(tourbillonBridgeGeo, primaryMetalMat);
  tourbillonBridge.position.set(0, 1.3, 0.78);
  tagMeshForAssembly(tourbillonBridge, 3);
  layer3.add(tourbillonBridge);

  const capJewelGeo = registerGeo(new THREE.SphereGeometry(0.07, 20, 16));
  const capJewel = new THREE.Mesh(capJewelGeo, rubyJewelMat);
  capJewel.position.set(0, 1.33, 0.78);
  tagMeshForAssembly(capJewel, 3, false);
  layer3.add(capJewel);

  // ============================================================================
  // LAYER 4: ARMILLARY CELESTIAL RINGS & TELLURION ORRERY (10 parts)
  // ============================================================================
  const layer4 = assemblyGroups[4];
  const orreryCenterY = 1.68;

  // Part 1: Central Spun-Gold Sol with Corona Ring
  const solGroup = new THREE.Group();
  solGroup.position.set(0, orreryCenterY, 0);
  layer4.add(solGroup);

  const solSphereGeo = registerGeo(new THREE.SphereGeometry(0.28, 32, 24));
  const solMat = registerMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.45,
      metalness: 0.85,
      roughness: 0.16,
      clearcoat: 0.8
    })
  );
  const solMesh = new THREE.Mesh(solSphereGeo, solMat);
  tagMeshForAssembly(solMesh, 4);
  solGroup.add(solMesh);

  const solEquatorialRingGeo = registerGeo(new THREE.TorusGeometry(0.36, 0.016, 12, 48));
  solEquatorialRingGeo.rotateX(Math.PI / 3);
  const solRingMesh = new THREE.Mesh(solEquatorialRingGeo, primaryMetalMat);
  tagMeshForAssembly(solRingMesh, 4, false);
  solGroup.add(solRingMesh);

  // Central Vertical Celestial Spindle
  const spindleGeo = registerGeo(new THREE.CylinderGeometry(0.045, 0.06, 1.15, 20));
  const spindleMesh = new THREE.Mesh(spindleGeo, secondaryMetalMat);
  spindleMesh.position.set(0, orreryCenterY - 0.35, 0);
  tagMeshForAssembly(spindleMesh, 4);
  layer4.add(spindleMesh);

  // Part 2 & 3: Twin Graduated Armillary Meridian & Ecliptic Rings
  const outerArmillaryGeo = registerGeo(new THREE.TorusGeometry(2.05, 0.036, 16, 72));
  const armillaryOuterRing = new THREE.Mesh(outerArmillaryGeo, primaryMetalMat);
  armillaryOuterRing.position.set(0, orreryCenterY, 0);
  tagMeshForAssembly(armillaryOuterRing, 4);
  layer4.add(armillaryOuterRing);

  const innerArmillaryGeo = registerGeo(new THREE.TorusGeometry(1.88, 0.028, 16, 72));
  innerArmillaryGeo.rotateY(Math.PI / 2);
  const armillaryInnerRing = new THREE.Mesh(innerArmillaryGeo, secondaryMetalMat);
  armillaryInnerRing.position.set(0, orreryCenterY, 0);
  tagMeshForAssembly(armillaryInnerRing, 4);
  layer4.add(armillaryInnerRing);

  // Part 4: Horizontal Ecliptic Horizon Band
  const eclipticBandGeo = registerGeo(new THREE.TorusGeometry(2.12, 0.042, 16, 84));
  eclipticBandGeo.rotateX(Math.PI / 2);
  const eclipticBand = new THREE.Mesh(eclipticBandGeo, primaryMetalMat);
  eclipticBand.position.set(0, orreryCenterY, 0);
  tagMeshForAssembly(eclipticBand, 4);
  layer4.add(eclipticBand);

  // Part 5: Mercury Orbital Arm & Sphere
  const mercuryArm = new THREE.Group();
  mercuryArm.position.set(0, orreryCenterY - 0.18, 0);
  layer4.add(mercuryArm);

  const mercStrutGeo = registerGeo(new THREE.CylinderGeometry(0.016, 0.016, 0.72, 10));
  mercStrutGeo.rotateZ(Math.PI / 2);
  mercStrutGeo.translate(0.36, 0, 0);
  const mercStrut = new THREE.Mesh(mercStrutGeo, secondaryMetalMat);
  tagMeshForAssembly(mercStrut, 4);
  mercuryArm.add(mercStrut);

  const mercSphereGeo = registerGeo(new THREE.SphereGeometry(0.075, 20, 16));
  const mercSphere = new THREE.Mesh(mercSphereGeo, secondaryMetalMat);
  mercSphere.position.set(0.72, 0.12, 0);
  tagMeshForAssembly(mercSphere, 4);
  mercuryArm.add(mercSphere);

  // Part 6: Venus Orbital Arm & Sphere
  const venusArm = new THREE.Group();
  venusArm.position.set(0, orreryCenterY - 0.1, 0);
  layer4.add(venusArm);

  const venusStrutGeo = registerGeo(new THREE.CylinderGeometry(0.018, 0.018, 1.15, 10));
  venusStrutGeo.rotateZ(Math.PI / 2);
  venusStrutGeo.translate(0.575, 0, 0);
  const venusStrut = new THREE.Mesh(venusStrutGeo, primaryMetalMat);
  tagMeshForAssembly(venusStrut, 4);
  venusArm.add(venusStrut);

  const venusSphereGeo = registerGeo(new THREE.SphereGeometry(0.11, 24, 18));
  const venusSphere = new THREE.Mesh(venusSphereGeo, primaryMetalMat);
  venusSphere.position.set(1.15, 0.14, 0);
  tagMeshForAssembly(venusSphere, 4);
  venusArm.add(venusSphere);

  // Part 7–10: Tellurion Earth-Moon Sub-Assembly (Axial Tilt + Lunar Orbit)
  const earthArm = new THREE.Group();
  earthArm.position.set(0, orreryCenterY - 0.02, 0);
  layer4.add(earthArm);

  const earthStrutGeo = registerGeo(new THREE.CylinderGeometry(0.022, 0.022, 1.62, 12));
  earthStrutGeo.rotateZ(Math.PI / 2);
  earthStrutGeo.translate(0.81, 0, 0);
  const earthStrut = new THREE.Mesh(earthStrutGeo, primaryMetalMat);
  tagMeshForAssembly(earthStrut, 4);
  earthArm.add(earthStrut);

  const earthGlobeGroup = new THREE.Group();
  earthGlobeGroup.position.set(1.62, 0.16, 0);
  earthGlobeGroup.rotation.z = THREE.MathUtils.degToRad(23.44); // Real Earth axial obliquity
  earthArm.add(earthGlobeGroup);

  const earthGeo = registerGeo(new THREE.SphereGeometry(0.145, 28, 20));
  const earthMesh = new THREE.Mesh(earthGeo, accentBluedMat);
  tagMeshForAssembly(earthMesh, 4);
  earthGlobeGroup.add(earthMesh);

  const earthMeridianGeo = registerGeo(new THREE.TorusGeometry(0.18, 0.012, 10, 32));
  const earthMeridian = new THREE.Mesh(earthMeridianGeo, primaryMetalMat);
  tagMeshForAssembly(earthMeridian, 4, false);
  earthGlobeGroup.add(earthMeridian);

  const moonArm = new THREE.Group();
  moonArm.position.set(1.62, 0.16, 0);
  earthArm.add(moonArm);

  const moonTrackGeo = registerGeo(new THREE.TorusGeometry(0.32, 0.009, 8, 36));
  moonTrackGeo.rotateX(Math.PI / 2);
  const moonTrack = new THREE.Mesh(moonTrackGeo, secondaryMetalMat);
  tagMeshForAssembly(moonTrack, 4, false);
  moonArm.add(moonTrack);

  const moonGeo = registerGeo(new THREE.SphereGeometry(0.048, 16, 14));
  const moonMesh = new THREE.Mesh(moonGeo, secondaryMetalMat);
  moonMesh.position.set(0.32, 0.02, 0);
  tagMeshForAssembly(moonMesh, 4);
  moonArm.add(moonMesh);

  // ============================================================================
  // LAYER 5: OPTICAL SAPPHIRE CLOCHE DOME & BEZEL CROWN (4 parts)
  // ============================================================================
  const layer5 = assemblyGroups[5];

  // Part 1: Chamfered Upper Bezel Retention Ring
  const upperBezelGeo = registerGeo(new THREE.TorusGeometry(2.44, 0.075, 20, 72));
  upperBezelGeo.rotateX(Math.PI / 2);
  const upperBezelMesh = new THREE.Mesh(upperBezelGeo, primaryMetalMat);
  upperBezelMesh.position.y = 0.92;
  tagMeshForAssembly(upperBezelMesh, 5);
  layer5.add(upperBezelMesh);

  // Part 2: Secondary Inner Rehaut Ring
  const rehautGeo = registerGeo(new THREE.CylinderGeometry(2.42, 2.42, 0.12, 72, 1, true));
  const rehautMesh = new THREE.Mesh(rehautGeo, secondaryMetalMat);
  rehautMesh.position.y = 0.92;
  tagMeshForAssembly(rehautMesh, 5, false);
  layer5.add(rehautMesh);

  // Part 3: Hemispherical Sapphire Crystal Dome (`depthWrite: false`, `renderOrder: 10`)
  const domeGeo = registerGeo(
    new THREE.SphereGeometry(2.42, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.48)
  );
  const domeMesh = new THREE.Mesh(domeGeo, sapphireDomeMat);
  domeMesh.position.y = 0.92;
  domeMesh.renderOrder = 10;
  tagMeshForAssembly(domeMesh, 5, false);
  layer5.add(domeMesh);

  // Part 4: Zenith Finial Crown atop Sapphire Dome
  const finialRingGeo = registerGeo(new THREE.TorusGeometry(0.22, 0.026, 12, 32));
  finialRingGeo.rotateX(Math.PI / 2);
  const finialRing = new THREE.Mesh(finialRingGeo, primaryMetalMat);
  finialRing.position.y = 3.33;
  tagMeshForAssembly(finialRing, 5);
  layer5.add(finialRing);

  // ============================================================================
  // DYNAMIC FINISH & HIGHLIGHT CONTROLLERS
  // ============================================================================
  const applyFinishPalette = (palette: FinishPalette) => {
    primaryMetalMat.color.setHex(palette.primaryMetalHex);
    secondaryMetalMat.color.setHex(palette.secondaryMetalHex);
    accentBluedMat.color.setHex(palette.accentMetalHex);
    matteChassisMat.color.setHex(palette.baseChassisHex);

    const nextDialTex = createChapterDialTexture(palette, maxAnisotropy, isHeadless);
    texturesToDispose.push(nextDialTex);
    dialSurfaceMat.map = nextDialTex;
    dialSurfaceMat.needsUpdate = true;
  };

  const setHighlightedAssembly = (assemblyIndex: number | null) => {
    assemblyGroups.forEach((group, idx) => {
      const isSelected = assemblyIndex !== null && idx === assemblyIndex;
      group.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh && mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (mat.emissive && mat !== rubyJewelMat && mat !== solMat) {
            mat.emissive.setHex(isSelected ? 0x1e293b : 0x000000);
            mat.emissiveIntensity = isSelected ? 0.55 : 0.0;
          }
        }
      });
    });
  };

  const dispose = () => {
    geometriesToDispose.forEach((g) => g.dispose());
    materialsToDispose.forEach((m) => m.dispose());
    texturesToDispose.forEach((t) => t.dispose());
  };

  return {
    rootGroup,
    assemblyGroups,
    interactableMeshes,
    mainspringWheel,
    centerWheel,
    thirdWheel,
    fourthWheel,
    tourbillonCarriage,
    balanceWheel,
    hairspringMesh,
    escapementWheel,
    mercuryArm,
    venusArm,
    earthArm,
    earthGlobeGroup,
    moonArm,
    armillaryOuterRing,
    armillaryInnerRing,
    applyFinishPalette,
    setHighlightedAssembly,
    dispose
  };
}
