import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {
  BeatFrequencyVph,
  CAMERA_PRESETS,
  CameraPresetId,
  computeCalibreKinematics,
  computeEscapementHz,
  computeLayerY,
  dampValue,
  FINISH_PALETTES,
  FinishPresetId,
  LIGHTING_CONFIGS,
  LightingPresetId
} from '../horology/calibreLogic';
import { buildCalibreSceneModel, CalibreSceneHandles } from '../horology/models';
import { EscapementAudioEngine } from '../horology/sound';

// Pre-allocated module-scope scratch objects (Zero GC in requestAnimationFrame)
const _targetCameraPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _pointerNdc = new THREE.Vector2();

export interface ChronosViewportProps {
  explodedTarget: number;
  finishId: FinishPresetId;
  lightingId: LightingPresetId;
  cameraPresetId: CameraPresetId;
  cameraPresetTrigger: number;
  vph: BeatFrequencyVph;
  timeScale: number;
  selectedAssembly: number | null;
  audioEnabled: boolean;
  onSelectAssembly: (index: number | null) => void;
  onTelemetrySample?: (sample: {
    simTime: number;
    cageRpm: number;
    balanceAngleDeg: number;
  }) => void;
}

export const ChronosViewport: React.FC<ChronosViewportProps> = ({
  explodedTarget,
  finishId,
  lightingId,
  cameraPresetId,
  cameraPresetTrigger,
  vph,
  timeScale,
  selectedAssembly,
  audioEnabled,
  onSelectAssembly,
  onTelemetrySample
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const [webglLost, setWebglLost] = useState(false);

  // Store mutable props in ref so React HUD state changes never re-create WebGLRenderer
  const stateRef = useRef({
    explodedTarget,
    explodedCurrent: explodedTarget,
    finishId,
    lightingId,
    cameraPresetId,
    vph,
    timeScale,
    selectedAssembly,
    audioEnabled,
    isCameraTransitioning: false,
    onSelectAssembly,
    onTelemetrySample
  });

  stateRef.current.explodedTarget = explodedTarget;
  stateRef.current.vph = vph;
  stateRef.current.timeScale = timeScale;
  stateRef.current.selectedAssembly = selectedAssembly;
  stateRef.current.audioEnabled = audioEnabled;
  stateRef.current.onSelectAssembly = onSelectAssembly;
  stateRef.current.onTelemetrySample = onTelemetrySample;

  const sceneHandlesRef = useRef<CalibreSceneHandles | null>(null);
  const lightingHandlesRef = useRef<{
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    keyLight: THREE.DirectionalLight;
    hemiLight: THREE.HemisphereLight;
    rimLight: THREE.DirectionalLight;
  } | null>(null);
  const audioEngineRef = useRef<EscapementAudioEngine | null>(null);

  const renderOnDemandRef = useRef<(() => void) | null>(null);

  // Trigger smooth camera preset glide whenever cameraPresetId or cameraPresetTrigger changes
  useEffect(() => {
    stateRef.current.cameraPresetId = cameraPresetId;
    stateRef.current.isCameraTransitioning = true;
    renderOnDemandRef.current?.();
  }, [cameraPresetId, cameraPresetTrigger]);

  // Apply finish palette updates immediately
  useEffect(() => {
    stateRef.current.finishId = finishId;
    if (sceneHandlesRef.current) {
      sceneHandlesRef.current.applyFinishPalette(FINISH_PALETTES[finishId]);
      renderOnDemandRef.current?.();
    }
  }, [finishId]);

  // Apply assembly highlight updates immediately
  useEffect(() => {
    if (sceneHandlesRef.current) {
      sceneHandlesRef.current.setHighlightedAssembly(selectedAssembly);
      renderOnDemandRef.current?.();
    }
  }, [selectedAssembly]);

  // Trigger on-demand render and smooth framing adjustment when explodedTarget, vph, or timeScale changes
  useEffect(() => {
    stateRef.current.isCameraTransitioning = true;
    renderOnDemandRef.current?.();
  }, [explodedTarget, vph, timeScale]);

  // Apply studio lighting & atmosphere updates immediately
  useEffect(() => {
    stateRef.current.lightingId = lightingId;
    const handles = lightingHandlesRef.current;
    if (!handles) return;
    const cfg = LIGHTING_CONFIGS[lightingId];
    handles.scene.background = new THREE.Color(cfg.backgroundHex);
    handles.scene.fog = new THREE.FogExp2(cfg.fogHex, cfg.fogDensity);
    handles.keyLight.color.setHex(cfg.keyColorHex);
    handles.keyLight.intensity = cfg.keyIntensity;
    handles.hemiLight.color.setHex(cfg.hemiSkyHex);
    handles.hemiLight.groundColor.setHex(cfg.hemiGroundHex);
    handles.hemiLight.intensity = cfg.hemiIntensity;
    handles.rimLight.color.setHex(cfg.rimColorHex);
    handles.rimLight.intensity = cfg.rimIntensity;
    handles.renderer.toneMappingExposure = cfg.exposure;
    renderOnDemandRef.current?.();
  }, [lightingId]);

  // Sync audio toggle
  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.toggle(audioEnabled);
    }
  }, [audioEnabled]);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const isHeadless =
      navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);

    // Initialize WebGLRenderer once
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isHeadless,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true
      });
    } catch {
      setWebglLost(true);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const initialLightCfg = LIGHTING_CONFIGS[stateRef.current.lightingId];
    renderer.toneMappingExposure = initialLightCfg.exposure;
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.domElement.setAttribute('data-testid', 'chronos-webgl-canvas');
    renderer.domElement.className = 'block w-full h-full outline-none cursor-grab active:cursor-grabbing';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglLost(true);
    };
    const onContextRestored = () => {
      setWebglLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    // Scene, Fog, and RoomEnvironment PMREM Studio Reflections
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(initialLightCfg.backgroundHex);
    scene.fog = new THREE.FogExp2(initialLightCfg.fogHex, initialLightCfg.fogDensity);

    let envTexture: THREE.Texture | null = null;
    if (!isHeadless) {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTexture;
      pmremGenerator.dispose();
    }

    // Camera & Damped OrbitControls
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    const initialCam = CAMERA_PRESETS[stateRef.current.cameraPresetId];
    camera.position.set(...initialCam.position);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...initialCam.target);
    controls.enableDamping = !isHeadless;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.9;
    controls.maxDistance = 15.5;
    controls.maxPolarAngle = Math.PI * 0.485; // Keep above studio floor horizon
    controls.update();

    const stopPresetTransition = () => {
      stateRef.current.isCameraTransitioning = false;
    };
    controls.addEventListener('start', stopPresetTransition);

    // Studio 3-Point Lighting + RectAreaLight Softboxes
    if (!isHeadless) {
      RectAreaLightUniformsLib.init();
    }

    const keyLight = new THREE.DirectionalLight(
      initialLightCfg.keyColorHex,
      isHeadless ? initialLightCfg.keyIntensity * 1.35 : initialLightCfg.keyIntensity
    );
    keyLight.position.set(5.5, 8.5, 4.5);
    keyLight.castShadow = !isHeadless;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    const d = 4.2;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 1.0;
    keyLight.shadow.camera.far = 18.0;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(
      initialLightCfg.hemiSkyHex,
      initialLightCfg.hemiGroundHex,
      isHeadless ? initialLightCfg.hemiIntensity * 1.6 : initialLightCfg.hemiIntensity
    );
    hemiLight.position.set(0, 12, 0);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(
      initialLightCfg.rimColorHex,
      isHeadless ? initialLightCfg.rimIntensity * 1.4 : initialLightCfg.rimIntensity
    );
    rimLight.position.set(-5.0, 4.2, -5.5);
    scene.add(rimLight);

    // Overhead & Side Studio Softboxes (RectAreaLight) for luxury bevel highlights
    if (!isHeadless) {
      const topSoftbox = new THREE.RectAreaLight(0xfff7ed, 3.2, 4.5, 4.5);
      topSoftbox.position.set(0, 6.5, 0);
      topSoftbox.lookAt(0, 1.0, 0);
      scene.add(topSoftbox);

      const sideSoftbox = new THREE.RectAreaLight(0xe0f2fe, 2.2, 3.0, 5.0);
      sideSoftbox.position.set(-4.2, 2.8, 3.2);
      sideSoftbox.lookAt(0, 1.0, 0);
      scene.add(sideSoftbox);
    }

    lightingHandlesRef.current = {
      scene,
      renderer,
      keyLight,
      hemiLight,
      rimLight
    };

    // Build Composite 6-Layer Horological Orrery & Tourbillon Model
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const calibreHandles = buildCalibreSceneModel(
      FINISH_PALETTES[stateRef.current.finishId],
      maxAniso,
      isHeadless
    );
    scene.add(calibreHandles.rootGroup);
    sceneHandlesRef.current = calibreHandles;

    // Pre-warm shaders
    renderer.compile(scene, camera);

    // Audio Synthesizer
    const audioEngine = new EscapementAudioEngine();
    audioEngine.toggle(stateRef.current.audioEnabled);
    audioEngineRef.current = audioEngine;

    // High-Performance Raycasting on Layer 1 (Click without drag to inspect assembly)
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (dx * dx + dy * dy > 36) return; // Ignore orbit drags

      const rect = renderer.domElement.getBoundingClientRect();
      _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(_pointerNdc, camera);
      const hits = raycaster.intersectObjects(calibreHandles.interactableMeshes, false);
      if (hits.length > 0) {
        const hitIndex = hits[0].object.userData?.assemblyIndex;
        if (typeof hitIndex === 'number') {
          stateRef.current.onSelectAssembly(hitIndex);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    let simTimeSeconds = 12.5;
    let lastTelemetryTime = 0;

    const applySceneStateAndRender = (dt: number, now: number) => {
      const st = stateRef.current;

      // 1. Exponential damping for Exploded View layer separation (instant settle in headless on-demand mode)
      st.explodedCurrent = isHeadless
        ? st.explodedTarget
        : dampValue(st.explodedCurrent, st.explodedTarget, 7.5, dt);
      for (let i = 0; i < calibreHandles.assemblyGroups.length; i++) {
        calibreHandles.assemblyGroups[i].position.y = computeLayerY(i, st.explodedCurrent);
      }

      // 2. Exponential damping for Camera Presets (with automatic exploded-stack framing compensation)
      if (st.isCameraTransitioning) {
        const preset = CAMERA_PRESETS[st.cameraPresetId];
        const exp = st.explodedCurrent;
        const distScale = 1 + exp * 0.24;
        _targetCameraPos.set(
          preset.position[0] * distScale,
          preset.position[1] * (1 + exp * 0.28),
          preset.position[2] * distScale
        );
        _targetLookAt.set(
          preset.target[0],
          preset.target[1] + exp * 0.65,
          preset.target[2]
        );

        if (isHeadless) {
          camera.position.copy(_targetCameraPos);
          controls.target.copy(_targetLookAt);
          st.isCameraTransitioning = false;
        } else {
          const alpha = 1 - Math.exp(-6.5 * dt);
          camera.position.lerp(_targetCameraPos, alpha);
          controls.target.lerp(_targetLookAt, alpha);

          if (
            camera.position.distanceToSquared(_targetCameraPos) < 0.0008 &&
            controls.target.distanceToSquared(_targetLookAt) < 0.0008
          ) {
            st.isCameraTransitioning = false;
          }
        }
      }

      controls.update();

      // 3. Advance Horological & Celestial Kinematics
      simTimeSeconds += dt * st.timeScale;
      const kin = computeCalibreKinematics(simTimeSeconds, st.vph);

      calibreHandles.mainspringWheel.rotation.y = kin.mainspringAngle;
      calibreHandles.centerWheel.rotation.y = kin.centerWheelAngle;
      calibreHandles.thirdWheel.rotation.y = kin.thirdWheelAngle;
      calibreHandles.fourthWheel.rotation.y = kin.fourthWheelAngle;

      calibreHandles.tourbillonCarriage.rotation.y = kin.tourbillonCageAngle;
      calibreHandles.balanceWheel.rotation.y = kin.balanceWheelAngle;
      calibreHandles.hairspringMesh.scale.set(
        kin.hairspringScale,
        1,
        kin.hairspringScale
      );
      calibreHandles.escapementWheel.rotation.y = kin.escapementAngle;

      calibreHandles.mercuryArm.rotation.y = kin.mercuryOrbitAngle;
      calibreHandles.venusArm.rotation.y = kin.venusOrbitAngle;
      calibreHandles.earthArm.rotation.y = kin.earthOrbitAngle;
      calibreHandles.earthGlobeGroup.rotation.y = kin.earthSpinAngle;
      calibreHandles.moonArm.rotation.y = kin.moonOrbitAngle;

      calibreHandles.armillaryOuterRing.rotation.y = kin.armillaryOuterAngle;
      calibreHandles.armillaryInnerRing.rotation.x = kin.armillaryInnerAngle;

      // 4. Acoustic Escapement Synthesis
      const { ticksPerSecond } = computeEscapementHz(st.vph);
      audioEngine.update(simTimeSeconds, ticksPerSecond, st.timeScale);

      // 5. Throttled Telemetry Callback
      if (st.onTelemetrySample && now - lastTelemetryTime > 250) {
        lastTelemetryTime = now;
        st.onTelemetrySample({
          simTime: simTimeSeconds,
          cageRpm: st.timeScale * 1.0,
          balanceAngleDeg: Math.round(THREE.MathUtils.radToDeg(kin.balanceWheelAngle))
        });
      }

      renderer.render(scene, camera);
    };

    renderOnDemandRef.current = () => {
      applySceneStateAndRender(0.05, performance.now());
    };

    // Responsive Resize Handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (isHeadless) {
        applySceneStateAndRender(0, performance.now());
      }
    };
    window.addEventListener('resize', onResize);

    if (isHeadless) {
      controls.addEventListener('change', () => {
        renderer.render(scene, camera);
      });
    }

    // Perform an immediate initial render
    applySceneStateAndRender(0.016, performance.now());

    // Continuous 60fps loop on GPU browsers; on-demand in headless CPU Chromium
    let rafId = 0;
    let lastFrameTime = performance.now();
    if (!isHeadless) {
      const animate = (now: number) => {
        rafId = requestAnimationFrame(animate);
        const rawDt = (now - lastFrameTime) / 1000;
        lastFrameTime = now;
        const dt = Math.min(rawDt, 0.1);
        applySceneStateAndRender(dt, now);
      };
      rafId = requestAnimationFrame(animate);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      renderOnDemandRef.current = null;
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      controls.dispose();
      audioEngine.dispose();
      envTexture?.dispose();
      calibreHandles.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-[#0b0d13]">
      {/* Dedicated isolated WebGL mount ref outside React HUD overlays */}
      <div ref={canvasMountRef} className="w-full h-full" />

      {webglLost && (
        <div
          role="alert"
          className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0b0d13] p-6 text-center"
        >
          <p className="font-display text-2xl font-semibold text-amber-200">
            Chronos Astralis — Optical Calibre Preview
          </p>
          <p className="mt-2 max-w-md text-sm text-slate-300">
            WebGL rendering context is currently paused or unavailable. Use the controls below to inspect mechanical specifications.
          </p>
        </div>
      )}
    </div>
  );
};
