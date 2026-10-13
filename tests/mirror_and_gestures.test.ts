import assert from 'node:assert/strict';
import test from 'node:test';

import { CoordinateMapper } from '../src/engine/mediapipe/coordinateMapper.ts';
import { GestureDetector } from '../src/engine/mediapipe/gestureDetector.ts';
import { PointSmoother, OneEuroFilter } from '../src/engine/mediapipe/smoothing.ts';
import { StrokeManager } from '../src/engine/drawing/StrokeManager.ts';
import { AnimationEngine } from '../src/engine/animation/AnimationEngine.ts';
import { ParticleSystem } from '../src/engine/particles/ParticleSystem.ts';
import type { Stroke, Landmark3D } from '../src/types/index.ts';

test('1. CoordinateMapper: aspect ratio and horizontal mirror transformations', () => {
  // Case A: 16:9 container, 16:9 video -> exact fit, no cropping
  const paramsMirrored = {
    containerWidth: 1920,
    containerHeight: 1080,
    videoWidth: 1280,
    videoHeight: 720,
    isMirrored: true
  };

  // Center point
  const centerScreen = CoordinateMapper.mapNormalizedToScreen(0.5, 0.5, paramsMirrored);
  assert.equal(centerScreen.x, 960);
  assert.equal(centerScreen.y, 540);

  // Mirrored point: camera left (x = 0.2) should map to screen right: (1 - 0.2) * 1920 = 1536
  const leftPoint = CoordinateMapper.mapNormalizedToScreen(0.2, 0.5, paramsMirrored);
  assert.equal(leftPoint.x, 1536);
  assert.equal(leftPoint.y, 540);

  // Unmirrored point
  const paramsUnmirrored = { ...paramsMirrored, isMirrored: false };
  const leftUnmirrored = CoordinateMapper.mapNormalizedToScreen(0.2, 0.5, paramsUnmirrored);
  assert.equal(leftUnmirrored.x, 384);

  // Case B: 16:9 container (1920x1080), 4:3 video (640x480) -> object-fit cover vertically cropped
  const paramsCover = {
    containerWidth: 1920,
    containerHeight: 1080,
    videoWidth: 640,
    videoHeight: 480,
    isMirrored: true
  };
  const coverMetrics = CoordinateMapper.computeCoverMetrics(1920, 1080, 640, 480);
  assert.equal(coverMetrics.displayedWidth, 1920);
  assert.equal(coverMetrics.displayedHeight, 1440);
  assert.equal(coverMetrics.offsetX, 0);
  assert.equal(coverMetrics.offsetY, -180); // (1080 - 1440) / 2

  const mappedCenter = CoordinateMapper.mapNormalizedToScreen(0.5, 0.5, paramsCover);
  assert.equal(mappedCenter.x, 960);
  assert.equal(mappedCenter.y, 540); // -180 + 0.5 * 1440 = 540

  // Inverse mapping verification
  const inverse = CoordinateMapper.mapScreenToNormalized(960, 540, paramsCover);
  assert.ok(Math.abs(inverse.nx - 0.5) < 0.001);
  assert.ok(Math.abs(inverse.ny - 0.5) < 0.001);
});

test('2. GestureDetector: natural air gestures detection', () => {
  const detector = new GestureDetector({ confirmationFrames: 1 });

  // Mock wrist and palm reference
  const wrist: Landmark3D = { x: 0.5, y: 0.8, z: 0 };
  const middleMcp: Landmark3D = { x: 0.5, y: 0.6, z: 0 }; // handScale = 0.2

  // Helper to build 21 landmarks
  const buildLandmarks = (fingerTips: {
    thumb: Landmark3D;
    index: Landmark3D;
    middle: Landmark3D;
    ring: Landmark3D;
    pinky: Landmark3D;
  }): Landmark3D[] => {
    const list: Landmark3D[] = new Array(21).fill(null).map(() => ({ x: 0.5, y: 0.7, z: 0 }));
    list[0] = wrist;
    list[2] = { x: 0.45, y: 0.7, z: 0 };
    list[4] = fingerTips.thumb;
    list[5] = { x: 0.48, y: 0.6, z: 0 };
    list[6] = { x: 0.48, y: 0.5, z: 0 };
    list[8] = fingerTips.index;
    list[9] = middleMcp;
    list[10] = { x: 0.5, y: 0.5, z: 0 };
    list[12] = fingerTips.middle;
    list[13] = { x: 0.52, y: 0.6, z: 0 };
    list[14] = { x: 0.52, y: 0.5, z: 0 };
    list[16] = fingerTips.ring;
    list[17] = { x: 0.55, y: 0.6, z: 0 };
    list[18] = { x: 0.55, y: 0.5, z: 0 };
    list[20] = fingerTips.pinky;
    return list;
  };

  // Test Case A: Index finger pointing alone (drawing active in 'point_to_draw' mode)
  const pointingLandmarks = buildLandmarks({
    thumb: { x: 0.45, y: 0.7, z: 0 },   // curled
    index: { x: 0.48, y: 0.35, z: 0 },  // extended high (dist = 0.45 > 1.35 * 0.2)
    middle: { x: 0.5, y: 0.65, z: 0 },  // curled
    ring: { x: 0.52, y: 0.65, z: 0 },   // curled
    pinky: { x: 0.55, y: 0.68, z: 0 }   // curled
  });

  const resPointing = detector.evaluate(pointingLandmarks, 'point_to_draw');
  assert.equal(resPointing.isDrawing, true);
  assert.equal(resPointing.gesture, 'drawing');

  // Test Case B: Open Palm (all fingers extended -> stops drawing, moves cursor)
  const openPalmLandmarks = buildLandmarks({
    thumb: { x: 0.35, y: 0.55, z: 0 },  // extended
    index: { x: 0.48, y: 0.35, z: 0 },  // extended
    middle: { x: 0.5, y: 0.32, z: 0 },  // extended
    ring: { x: 0.53, y: 0.35, z: 0 },   // extended
    pinky: { x: 0.56, y: 0.4, z: 0 }    // extended
  });

  const resPalm = detector.evaluate(openPalmLandmarks, 'point_to_draw');
  assert.equal(resPalm.isDrawing, false);
  assert.equal(resPalm.gesture, 'open_palm');

  // Test Case C: Pinch gesture (thumb tip touching index tip)
  const pinchLandmarks = buildLandmarks({
    thumb: { x: 0.48, y: 0.40, z: 0 }, // touching index
    index: { x: 0.485, y: 0.40, z: 0 }, // touching thumb
    middle: { x: 0.5, y: 0.65, z: 0 },
    ring: { x: 0.52, y: 0.65, z: 0 },
    pinky: { x: 0.55, y: 0.68, z: 0 }
  });

  const resPinch = detector.evaluate(pinchLandmarks, 'point_to_draw');
  assert.equal(resPinch.isPinching, true);
  assert.equal(resPinch.gesture, 'pinch');

  // Test Case D: Closed Fist (all fingers curled into ball)
  const fistLandmarks = buildLandmarks({
    thumb: { x: 0.47, y: 0.68, z: 0 },
    index: { x: 0.48, y: 0.67, z: 0 },
    middle: { x: 0.5, y: 0.66, z: 0 },
    ring: { x: 0.52, y: 0.67, z: 0 },
    pinky: { x: 0.54, y: 0.69, z: 0 }
  });

  const resFist = detector.evaluate(fistLandmarks, 'point_to_draw');
  assert.equal(resFist.isDrawing, false);
  assert.equal(resFist.gesture, 'fist');
});

test('3. PointSmoother and OneEuroFilter: reduces jitter without lag', () => {
  const smoother = new PointSmoother();
  smoother.setSensitivity(0.7);

  const t0 = 1000;
  const p0 = smoother.smooth(100, 100, t0);
  assert.equal(p0.x, 100);
  assert.equal(p0.y, 100);

  // Small jitter step (+2px)
  const pJitter = smoother.smooth(102, 101, t0 + 16);
  // Jitter should be heavily dampened
  assert.ok(pJitter.x < 101.5);
  assert.ok(pJitter.y < 100.8);

  // Large rapid movement (+200px)
  const pFast = smoother.smooth(300, 300, t0 + 32);
  // High speed should react responsively
  assert.ok(pFast.x > 180);
});

test('4. StrokeManager: history stack, bounding box, and center normalization', () => {
  const manager = new StrokeManager();
  assert.equal(manager.canUndo(), false);
  assert.equal(manager.canRedo(), false);

  // Begin and draw stroke 1 (e.g. wings left side)
  manager.beginStroke({ x: 200, y: 300 }, '#00F0FF', 8, 'neon');
  manager.addPoint({ x: 250, y: 250 });
  manager.addPoint({ x: 300, y: 200 });
  const stroke1 = manager.endStroke();
  assert.ok(stroke1 !== null);
  assert.equal(manager.getStrokes().length, 1);
  assert.equal(manager.canUndo(), true);

  // Begin and draw stroke 2 (wings right side)
  manager.beginStroke({ x: 400, y: 200 }, '#00F0FF', 8, 'neon');
  manager.addPoint({ x: 450, y: 250 });
  manager.addPoint({ x: 500, y: 300 });
  manager.endStroke();
  assert.equal(manager.getStrokes().length, 2);

  // Undo
  manager.undo();
  assert.equal(manager.getStrokes().length, 1);
  assert.equal(manager.canRedo(), true);

  // Redo
  manager.redo();
  assert.equal(manager.getStrokes().length, 2);

  // Calculate Bounds
  const bounds = StrokeManager.calculateBounds(manager.getStrokes());
  assert.ok(bounds !== null);
  assert.ok(bounds.width > 200);
  assert.ok(bounds.height > 80);
  assert.ok(bounds.centerX > 300 && bounds.centerX < 400);

  // Normalize to center
  const normalized = StrokeManager.normalizeStrokesToCenter(manager.getStrokes(), bounds.centerX, bounds.centerY);
  assert.equal(normalized.length, 2);
  // Point closest to center should have small relative coordinates
  const firstPt = normalized[0].points[0];
  assert.ok(Math.abs(firstPt.x) < 200);
});

test('5. AnimationEngine: procedural behaviors and pinch dragging', () => {
  const particles = new ParticleSystem();
  const engine = new AnimationEngine(particles);

  const strokes: Stroke[] = [
    {
      id: 's1',
      points: [{ x: -20, y: 0 }, { x: 20, y: 0 }],
      color: '#00F0FF',
      size: 6,
      brushType: 'neon',
      opacity: 1
    }
  ];

  engine.addEntity({
    id: 'ent1',
    name: 'Floating Wings',
    relativeStrokes: strokes,
    bounds: { minX: 180, minY: 280, maxX: 220, maxY: 320, width: 40, height: 40, centerX: 200, centerY: 300 },
    x: 200,
    y: 300,
    baseX: 200,
    baseY: 300,
    scale: 1,
    rotation: 0,
    vx: 0,
    vy: 0,
    animationType: 'wings_flap',
    animationSpeed: 1,
    isPaused: false,
    aiEffect: 'sparkle_dust',
    createdAt: 1000
  });

  assert.equal(engine.getEntities().length, 1);

  // Update animation at t = 2000
  engine.update(2000);
  const e = engine.getEntities()[0];
  // Wings flap modifies scale and y
  assert.ok(e.scale !== 1 || e.y !== 300);

  // Test Pinch Grab near (200, 300)
  const grabbed = engine.handlePinchStart(205, 302);
  assert.ok(grabbed !== null);
  assert.equal(grabbed.id, 'ent1');

  // Drag to user's shoulder at (600, 450)
  engine.handlePinchMove(600, 450);
  assert.equal(e.x, 600);
  assert.equal(e.y, 450);

  // Release pinch
  engine.handlePinchEnd();
  assert.equal(e.isGrabbed, false);

  // Test Pause
  engine.setGlobalPaused(true);
  assert.equal(engine.isPaused(), true);
  const pausedY = e.y;
  engine.update(5000);
  assert.equal(e.y, pausedY); // Paused, no movement
});
