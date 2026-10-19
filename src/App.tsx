/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { ChronosViewport } from './components/ChronosViewport';
import { ControlDock, DockTabId } from './components/ControlDock';
import {
  BeatFrequencyVph,
  CameraPresetId,
  FinishPresetId,
  LightingPresetId
} from './horology/calibreLogic';

export default function App() {
  const [activeTab, setActiveTab] = useState<DockTabId>('explode');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [explodedTarget, setExplodedTarget] = useState(0);
  const [finishId, setFinishId] = useState<FinishPresetId>('rose-gold');
  const [lightingId, setLightingId] = useState<LightingPresetId>('atelier-warm');
  const [cameraPresetId, setCameraPresetId] = useState<CameraPresetId>('overview');
  const [cameraPresetTrigger, setCameraPresetTrigger] = useState(0);
  const [vph, setVph] = useState<BeatFrequencyVph>(28800);
  const [timeScale, setTimeScale] = useState<number>(1);
  const [selectedAssembly, setSelectedAssembly] = useState<number | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const [telemetry, setTelemetry] = useState({
    simTime: 0,
    cageRpm: 1.0,
    balanceAngleDeg: 0
  });

  const handleSelectCameraPreset = useCallback((id: CameraPresetId) => {
    setCameraPresetId(id);
    setCameraPresetTrigger((n) => n + 1);
  }, []);

  const handleResetAll = useCallback(() => {
    setExplodedTarget(0);
    setFinishId('rose-gold');
    setLightingId('atelier-warm');
    setCameraPresetId('overview');
    setCameraPresetTrigger((n) => n + 1);
    setVph(28800);
    setTimeScale(1);
    setSelectedAssembly(null);
  }, []);

  // Keyboard shortcut 'H' to toggle Zen / Cinema Mode Collapsible Dock
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setIsCollapsed((prev) => !prev);
      } else if (e.key === 'e' || e.key === 'E') {
        setExplodedTarget((prev) => (prev > 0.5 ? 0 : 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#0b0d13]">
      <ChronosViewport
        explodedTarget={explodedTarget}
        finishId={finishId}
        lightingId={lightingId}
        cameraPresetId={cameraPresetId}
        cameraPresetTrigger={cameraPresetTrigger}
        vph={vph}
        timeScale={timeScale}
        selectedAssembly={selectedAssembly}
        audioEnabled={audioEnabled}
        onSelectAssembly={setSelectedAssembly}
        onTelemetrySample={setTelemetry}
      />

      <ControlDock
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        explodedTarget={explodedTarget}
        onChangeExploded={setExplodedTarget}
        finishId={finishId}
        onChangeFinish={setFinishId}
        lightingId={lightingId}
        onChangeLighting={setLightingId}
        cameraPresetId={cameraPresetId}
        onSelectCameraPreset={handleSelectCameraPreset}
        vph={vph}
        onChangeVph={setVph}
        timeScale={timeScale}
        onChangeTimeScale={setTimeScale}
        selectedAssembly={selectedAssembly}
        onSelectAssembly={setSelectedAssembly}
        audioEnabled={audioEnabled}
        onToggleAudio={() => setAudioEnabled((prev) => !prev)}
        onResetAll={handleResetAll}
        telemetry={telemetry}
      />
    </main>
  );
}
