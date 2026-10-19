import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CALIBRE_ASSEMBLIES,
  computeLayerY,
  computeEscapementHz,
  computeCalibreKinematics,
  dampValue
} from './calibreLogic.ts';

test('CALIBRE_ASSEMBLIES defines 6 hierarchical mechanical layers with composite parts', () => {
  assert.equal(CALIBRE_ASSEMBLIES.length, 6);
  for (const assembly of CALIBRE_ASSEMBLIES) {
    assert.ok(assembly.partCount >= 4 && assembly.partCount <= 12);
  }
});

test('computeLayerY returns 0 when collapsed and monotonically increasing offsets when exploded', () => {
  for (let i = 0; i < CALIBRE_ASSEMBLIES.length; i++) {
    assert.equal(computeLayerY(i, 0), 0);
  }

  const explodedYs = CALIBRE_ASSEMBLIES.map((_, idx) => computeLayerY(idx, 1));
  for (let i = 1; i < explodedYs.length; i++) {
    assert.ok(
      explodedYs[i] > explodedYs[i - 1],
      `Expected layer ${i} (${explodedYs[i]}) > layer ${i - 1} (${explodedYs[i - 1]})`
    );
  }
});

test('computeEscapementHz converts vph to accurate ticks per second and oscillation Hz', () => {
  const b28800 = computeEscapementHz(28800);
  assert.equal(b28800.ticksPerSecond, 8);
  assert.equal(b28800.oscillationHz, 4);

  const b18000 = computeEscapementHz(18000);
  assert.equal(b18000.ticksPerSecond, 5);
  assert.equal(b18000.oscillationHz, 2.5);
});

test('computeCalibreKinematics maintains accurate 60-second tourbillon revolution and Keplerian ratios', () => {
  const stateAtZero = computeCalibreKinematics(0, 28800);
  assert.equal(stateAtZero.tourbillonCageAngle, 0);
  assert.equal(stateAtZero.earthOrbitAngle, 0);

  const stateAt60s = computeCalibreKinematics(60, 28800);
  assert.ok(Math.abs(stateAt60s.tourbillonCageAngle - Math.PI * 2) < 1e-6);
  assert.ok(stateAt60s.mercuryOrbitAngle > stateAt60s.venusOrbitAngle);
  assert.ok(stateAt60s.venusOrbitAngle > stateAt60s.earthOrbitAngle);
});

test('dampValue smoothly interpolates toward target without overshooting', () => {
  const next = dampValue(0, 10, 8, 0.016);
  assert.ok(next > 0 && next < 10);
  assert.equal(dampValue(5, 10, 8, 0), 5);
});
