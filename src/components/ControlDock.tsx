import React from 'react';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';
import {
  AssemblySpec,
  BeatFrequencyVph,
  CALIBRE_ASSEMBLIES,
  CAMERA_PRESETS,
  CameraPresetId,
  FINISH_PALETTES,
  FinishPresetId,
  LIGHTING_CONFIGS,
  LightingPresetId
} from '../horology/calibreLogic';

export type DockTabId = 'explode' | 'finishes' | 'kinematics' | 'cameras';

export interface ControlDockProps {
  activeTab: DockTabId;
  onSelectTab: (tab: DockTabId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  explodedTarget: number;
  onChangeExploded: (val: number) => void;
  finishId: FinishPresetId;
  onChangeFinish: (id: FinishPresetId) => void;
  lightingId: LightingPresetId;
  onChangeLighting: (id: LightingPresetId) => void;
  cameraPresetId: CameraPresetId;
  onSelectCameraPreset: (id: CameraPresetId) => void;
  vph: BeatFrequencyVph;
  onChangeVph: (vph: BeatFrequencyVph) => void;
  timeScale: number;
  onChangeTimeScale: (scale: number) => void;
  selectedAssembly: number | null;
  onSelectAssembly: (index: number | null) => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onResetAll: () => void;
  telemetry: {
    simTime: number;
    cageRpm: number;
    balanceAngleDeg: number;
  };
}

export const ControlDock: React.FC<ControlDockProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  explodedTarget,
  onChangeExploded,
  finishId,
  onChangeFinish,
  lightingId,
  onChangeLighting,
  cameraPresetId,
  onSelectCameraPreset,
  vph,
  onChangeVph,
  timeScale,
  onChangeTimeScale,
  selectedAssembly,
  onSelectAssembly,
  audioEnabled,
  onToggleAudio,
  onResetAll,
  telemetry
}) => {
  const activeAssembly: AssemblySpec | null =
    selectedAssembly !== null ? CALIBRE_ASSEMBLIES[selectedAssembly] ?? null : null;

  const currentPalette = FINISH_PALETTES[finishId];
  const frequencyHz = (vph / 7200).toFixed(1);

  return (
    <>
      {/* Top-Left Minimal Spec & Telemetry Badge (Solid/RGBA surface, zero backdrop-filter, zero pulsing dots) */}
      <header className="pointer-events-auto fixed top-3 left-3 right-3 z-20 flex flex-wrap items-start justify-between gap-2 md:left-6 md:right-6 md:top-5">
        <div
          data-testid="spec-badge"
          className="max-w-md rounded-xl border border-slate-800/90 bg-[#0d111a]/95 px-3.5 py-2.5 shadow-lg md:px-4 md:py-3"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="font-display text-lg font-bold tracking-wide text-slate-100 md:text-2xl whitespace-nowrap">
              Chronos Astralis
            </h1>
            <span className="font-mono-tabular text-[11px] text-amber-300/90 md:text-xs whitespace-nowrap">
              Calibre CA-01 · {frequencyHz} Hz
            </span>
          </div>

          <p className="mt-0.5 text-[11px] text-slate-400 md:text-xs">
            <span>Co-Axial Tourbillon &amp; Orrery</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span>{currentPalette.label}</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span className="font-mono-tabular">
              Explode {Math.round(explodedTarget * 100)}%
            </span>
          </p>

          {activeAssembly ? (
            <div
              data-testid="selected-assembly-panel"
              className="mt-2 border-t border-slate-800/90 pt-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-amber-200">
                  {activeAssembly.name}
                </p>
                <button
                  type="button"
                  onClick={() => onSelectAssembly(null)}
                  className="rounded px-2 py-0.5 text-[11px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  Clear Focus
                </button>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">
                <span>{activeAssembly.materialSummary}</span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span className="font-mono-tabular">{activeAssembly.gearRatio}</span>
              </p>
              <p className="hidden sm:block mt-1 text-xs leading-relaxed text-slate-300">
                {activeAssembly.description}
              </p>
            </div>
          ) : (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 border-t border-slate-800/80 pt-1.5 text-[11px] text-slate-400 font-mono-tabular">
              <span>Elapsed: {telemetry.simTime.toFixed(1)}s</span>
              <span aria-hidden="true">·</span>
              <span>Carriage: {telemetry.cageRpm.toFixed(1)} RPM</span>
              <span aria-hidden="true">·</span>
              <span>Balance: {telemetry.balanceAngleDeg}°</span>
            </div>
          )}
        </div>

        {/* Top-Right Quick Actions (Single-line controls, no clutter) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChangeExploded(explodedTarget > 0.5 ? 0 : 1)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0d111a]/95 px-3 py-1.5 md:px-3.5 md:py-2 text-xs font-medium text-slate-200 hover:border-amber-400/50 hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Layers className="h-3.5 w-3.5 text-amber-300" />
            <span>{explodedTarget > 0.5 ? 'Assemble Calibre' : 'Explode Calibre'}</span>
          </button>

          <button
            type="button"
            onClick={onResetAll}
            aria-label="Reset View and Calibre"
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0d111a]/95 px-2.5 py-1.5 md:px-3 md:py-2 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* Unified Bottom-Center Collapsible Control Dock (Zero Viewport Occlusion in Center) */}
      <aside
        aria-label="Calibre Interactive Controls"
        className="pointer-events-auto fixed bottom-3 left-1/2 z-20 w-[95vw] max-w-[920px] -translate-x-1/2 md:bottom-4"
      >
        {/* Collapse / Expand Toggle Tab */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={!isCollapsed}
            className="flex items-center gap-1.5 rounded-t-lg border border-b-0 border-slate-800 bg-[#0d111a]/95 px-3.5 py-1 text-xs font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            {isCollapsed ? (
              <>
                <ChevronUp className="h-3.5 w-3.5 text-amber-300" />
                <span>Show Controls (H)</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5 text-amber-300" />
                <span>Hide Controls (H)</span>
              </>
            )}
          </button>
        </div>

        {/* Main Dock Body */}
        {!isCollapsed && (
          <div
            data-testid="control-dock-panel"
            className="rounded-xl border border-slate-800/95 bg-[#0d111a]/95 p-2.5 shadow-2xl md:p-3.5"
          >
            {/* Segmented Mode Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/90 pb-2">
              <div
                role="tablist"
                aria-label="Control categories"
                className="grid w-full grid-cols-2 gap-1 rounded-lg bg-[#141a28] p-1 sm:flex sm:w-auto sm:items-center"
              >
                {(
                  [
                    { id: 'explode', label: 'Exploded & Layers' },
                    { id: 'finishes', label: 'Finishes & Studio' },
                    { id: 'kinematics', label: 'Escapement & Time' },
                    { id: 'cameras', label: 'Camera Angles' }
                  ] as const
                ).map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      type="button"
                      aria-selected={active}
                      onClick={() => onSelectTab(tab.id)}
                      className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-amber-400/90 text-slate-950 font-semibold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Direct Quick Controls Always Accessible on Right */}
              <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
                <span>Drag to Orbit · Scroll to Zoom · Click Part to Inspect</span>
              </div>
            </div>

            {/* Tab Content Area */}
            <div className="pt-3">
              {activeTab === 'explode' && (
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  {/* Exploded Slider */}
                  <div className="flex flex-1 items-center gap-3">
                    <label
                      htmlFor="exploded-slider"
                      className="text-xs font-medium text-slate-300 whitespace-nowrap shrink-0"
                    >
                      Axial Separation
                    </label>
                    <input
                      id="exploded-slider"
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={Math.round(explodedTarget * 100)}
                      onChange={(e) => onChangeExploded(Number(e.target.value) / 100)}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-amber-400"
                    />
                    <span className="w-11 text-right font-mono-tabular text-xs font-semibold text-amber-300 shrink-0">
                      {Math.round(explodedTarget * 100)}%
                    </span>
                  </div>

                  {/* 6 Mechanical Layer Selector Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {CALIBRE_ASSEMBLIES.map((asm) => {
                      const isSelected = selectedAssembly === asm.index;
                      const shortLabels = [
                        '01 Plinth',
                        '02 Mainplate',
                        '03 Gear Train',
                        '04 Tourbillon',
                        '05 Orrery',
                        '06 Sapphire'
                      ];
                      return (
                        <button
                          key={asm.id}
                          type="button"
                          onClick={() =>
                            onSelectAssembly(isSelected ? null : asm.index)
                          }
                          className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                            isSelected
                              ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                              : 'border-slate-800 bg-[#141a28] text-slate-300 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          {shortLabels[asm.index]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'finishes' && (
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  {/* Metallurgy Swatches */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-xs font-medium text-slate-400 whitespace-nowrap">
                      Metallurgy:
                    </span>
                    {(Object.keys(FINISH_PALETTES) as FinishPresetId[]).map((id) => {
                      const pal = FINISH_PALETTES[id];
                      const active = finishId === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => onChangeFinish(id)}
                          className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                            active
                              ? 'border-amber-400 bg-amber-400/15 text-white'
                              : 'border-slate-800 bg-[#141a28] text-slate-300 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className="h-2.5 w-2.5 rounded-full border border-white/30"
                            style={{ backgroundColor: pal.swatchCss }}
                          />
                          <span>{pal.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Studio Lighting Rig Presets */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-xs font-medium text-slate-400 whitespace-nowrap">
                      Lighting:
                    </span>
                    {(Object.keys(LIGHTING_CONFIGS) as LightingPresetId[]).map((id) => {
                      const lCfg = LIGHTING_CONFIGS[id];
                      const active = lightingId === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => onChangeLighting(id)}
                          className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                            active
                              ? 'border-amber-400 bg-amber-400/15 text-amber-200'
                              : 'border-slate-800 bg-[#141a28] text-slate-300 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <Sparkles className="h-3 w-3 text-amber-300" />
                          <span>{lCfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'kinematics' && (
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  {/* Beat Frequency Selector */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-xs font-medium text-slate-400 whitespace-nowrap">
                      Escapement Beat:
                    </span>
                    {([18000, 21600, 28800, 36000] as BeatFrequencyVph[]).map((freq) => {
                      const active = vph === freq;
                      return (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => onChangeVph(freq)}
                          className={`rounded-md border px-2.5 py-1.5 font-mono-tabular text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                            active
                              ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                              : 'border-slate-800 bg-[#141a28] text-slate-300 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          {freq.toLocaleString()} vph
                        </button>
                      );
                    })}
                  </div>

                  {/* Time Multiplier & Acoustic Tick Toggle */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-xs font-medium text-slate-400 whitespace-nowrap">
                      Speed:
                    </span>
                    {[
                      { scale: 0, label: 'Pause' },
                      { scale: 1, label: '1× Real' },
                      { scale: 10, label: '10× Drive' },
                      { scale: 60, label: '60× Orbit' }
                    ].map((item) => {
                      const active = timeScale === item.scale;
                      return (
                        <button
                          key={item.scale}
                          type="button"
                          onClick={() => onChangeTimeScale(item.scale)}
                          className={`flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                            active
                              ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                              : 'border-slate-800 bg-[#141a28] text-slate-300 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          {item.scale === 0 ? (
                            <Pause className="h-3 w-3" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                          <span>{item.label}</span>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={onToggleAudio}
                      aria-pressed={audioEnabled}
                      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        audioEnabled
                          ? 'border-emerald-400/70 bg-emerald-500/20 text-emerald-200'
                          : 'border-slate-800 bg-[#141a28] text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {audioEnabled ? (
                        <Volume2 className="h-3.5 w-3.5 text-emerald-300" />
                      ) : (
                        <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                      )}
                      <span>{audioEnabled ? 'Acoustic On' : 'Acoustic Mute'}</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'cameras' && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-xs font-medium text-slate-400 whitespace-nowrap">
                      Optical Framing:
                    </span>
                    {(Object.keys(CAMERA_PRESETS) as CameraPresetId[]).map((id) => {
                      const cam = CAMERA_PRESETS[id];
                      const active = cameraPresetId === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => onSelectCameraPreset(id)}
                          className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                            active
                              ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                              : 'border-slate-800 bg-[#141a28] text-slate-300 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <Camera className="h-3.5 w-3.5 text-amber-300" />
                          <span>{cam.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <span className="text-xs text-slate-400">
                    Smooth exponential camera damping enabled
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
