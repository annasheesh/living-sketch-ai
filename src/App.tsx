import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CameraMirror } from './components/CameraMirror';
import { DrawingCanvas } from './components/DrawingCanvas';
import { GestureHUD } from './components/GestureHUD';
import { Toolbar } from './components/Toolbar';
import { TopBar } from './components/TopBar';
import { BrushPicker } from './components/BrushPicker';
import { LivingSketchModal } from './components/LivingSketchModal';
import { SettingsModal } from './components/SettingsModal';
import { CreationsDrawer } from './components/CreationsDrawer';
import { ScreenshotModal } from './components/ScreenshotModal';
import { HelpModal } from './components/HelpModal';

import { HandTracker } from './engine/mediapipe/HandTracker';
import { StrokeManager } from './engine/drawing/StrokeManager';
import { ParticleSystem } from './engine/particles/ParticleSystem';
import { AnimationEngine } from './engine/animation/AnimationEngine';
import { SoundEffects } from './engine/audio/SoundEffects';
import { BrushRenderer } from './engine/drawing/BrushRenderer';
import {
  AppSettings,
  HandTrackingState,
  CameraDevice,
  LivingEntity,
  AnimationType,
  AIEffectType
} from './types';

export const App: React.FC = () => {
  // App Settings
  const [settings, setSettings] = useState<AppSettings>({
    mirrorMode: true,
    airDrawingEnabled: true,
    gestureDrawingMode: 'point_to_draw',
    brushColor: '#00F0FF', // Cyan default
    brushSize: 8,
    brushType: 'neon',
    smoothingFactor: 0.65,
    showLandmarkSkeleton: false,
    showGestureHUD: true,
    soundEffects: true,
    glowStrength: 1.0
  });

  // Camera & Tracking State
  const [cameraStatus, setCameraStatus] = useState<
    'idle' | 'initializing' | 'tracking' | 'hand-lost' | 'denied' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [trackingState, setTrackingState] = useState<HandTrackingState | null>(null);
  const [cameraDevices, setCameraDevices] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isSimulatedMirror, setIsSimulatedMirror] = useState(false);

  // Drawing & Entity State
  const [strokesVersion, setStrokesVersion] = useState(0);
  const [livingEntities, setLivingEntities] = useState<LivingEntity[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Modals & Panels
  const [isBrushPickerOpen, setIsBrushPickerOpen] = useState(false);
  const [isLivingModalOpen, setIsLivingModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreationsOpen, setIsCreationsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  // Engine singletons
  const strokeManagerRef = useRef<StrokeManager>(new StrokeManager());
  const particleSystemRef = useRef<ParticleSystem>(new ParticleSystem());
  const animationEngineRef = useRef<AnimationEngine>(
    new AnimationEngine(particleSystemRef.current)
  );
  const handTrackerRef = useRef<HandTracker | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Update sound effects mute state
  useEffect(() => {
    SoundEffects.isMuted = !settings.soundEffects;
  }, [settings.soundEffects]);

  // Update living entities count for toolbar
  const refreshEntities = useCallback(() => {
    setLivingEntities([...animationEngineRef.current.getEntities()]);
    setSelectedEntityId(animationEngineRef.current.getSelectedEntity()?.id || null);
    setIsPaused(animationEngineRef.current.isPaused());
  }, []);

  // Update strokes count trigger
  const handleStrokeCompleted = useCallback(() => {
    setStrokesVersion(v => v + 1);
  }, []);

  // Initialize and start HandTracker & Camera
  const startCamera = useCallback(async (cameraId?: string) => {
    setCameraStatus('initializing');
    setErrorMessage('');
    setIsSimulatedMirror(false);

    if (!handTrackerRef.current) {
      handTrackerRef.current = new HandTracker({
        mirrorMode: settings.mirrorMode,
        gestureDrawingMode: settings.gestureDrawingMode,
        smoothingFactor: settings.smoothingFactor,
        cameraId
      });

      handTrackerRef.current.onStatus((status, msg) => {
        setCameraStatus(status);
        if (msg) setErrorMessage(msg);
      });

      handTrackerRef.current.onState(state => {
        setTrackingState(state);
      });
    } else {
      handTrackerRef.current.updateConfig({
        mirrorMode: settings.mirrorMode,
        gestureDrawingMode: settings.gestureDrawingMode,
        smoothingFactor: settings.smoothingFactor,
        cameraId
      });
    }

    const success = await handTrackerRef.current.start(videoRef.current || undefined);
    if (success) {
      // Enumerate available cameras
      const devices = await HandTracker.getCameraDevices();
      setCameraDevices(devices);
      if (devices.length > 0 && !cameraId) {
        setSelectedCameraId(devices[0].deviceId);
      }
    }
  }, [settings.mirrorMode, settings.gestureDrawingMode, settings.smoothingFactor]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (handTrackerRef.current) {
      handTrackerRef.current.stop();
    }
    setCameraStatus('idle');
  }, []);

  // Mount effect: start camera automatically for instant mirror experience
  useEffect(() => {
    startCamera();

    return () => {
      if (handTrackerRef.current) {
        handTrackerRef.current.stop();
      }
    };
  }, []);

  // Sync settings updates to tracker
  const handleUpdateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      if (handTrackerRef.current) {
        handTrackerRef.current.updateConfig({
          mirrorMode: next.mirrorMode,
          gestureDrawingMode: next.gestureDrawingMode,
          smoothingFactor: next.smoothingFactor
        });
      }
      return next;
    });
  };

  // Switch camera device
  const handleSelectCamera = (deviceId: string) => {
    setSelectedCameraId(deviceId);
    if (handTrackerRef.current) {
      handTrackerRef.current.stop();
      startCamera(deviceId);
    }
  };

  // Undo / Redo / Clear
  const handleUndo = () => {
    if (strokeManagerRef.current.undo()) {
      setStrokesVersion(v => v + 1);
    }
  };

  const handleRedo = () => {
    if (strokeManagerRef.current.redo()) {
      setStrokesVersion(v => v + 1);
    }
  };

  const handleClear = () => {
    if (strokeManagerRef.current.clear()) {
      setStrokesVersion(v => v + 1);
    }
  };

  // Bring My Drawing to Life
  const handleOpenBringToLife = () => {
    const strokes = strokeManagerRef.current.getStrokes();
    if (strokes.length === 0) return;
    setIsLivingModalOpen(true);
  };

  const handleConfirmAnimate = (config: {
    name: string;
    animationType: AnimationType;
    speed: number;
    aiEffect: AIEffectType;
    aiPrompt: string;
    clearCanvas: boolean;
  }) => {
    const strokes = strokeManagerRef.current.getStrokes();
    if (strokes.length === 0) return;

    const bounds = StrokeManager.calculateBounds(strokes);
    if (!bounds) return;

    // Convert strokes into local strokes relative to center of mass
    const relativeStrokes = StrokeManager.normalizeStrokesToCenter(
      strokes,
      bounds.centerX,
      bounds.centerY
    );

    const newEntity: LivingEntity = {
      id: `entity_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: config.name,
      relativeStrokes,
      bounds,
      x: bounds.centerX,
      y: bounds.centerY,
      baseX: bounds.centerX,
      baseY: bounds.centerY,
      scale: 1.0,
      rotation: 0,
      vx: 0,
      vy: 0,
      animationType: config.animationType,
      animationSpeed: config.speed,
      isPaused: false,
      aiPrompt: config.aiPrompt,
      aiEffect: config.aiEffect,
      createdAt: Date.now()
    };

    animationEngineRef.current.addEntity(newEntity);
    SoundEffects.playBringToLife();

    if (config.clearCanvas) {
      strokeManagerRef.current.clear();
      setStrokesVersion(v => v + 1);
    }

    refreshEntities();
  };

  // Toggle Global Pause / Resume
  const handleTogglePause = () => {
    animationEngineRef.current.togglePause();
    refreshEntities();
  };

  // Screenshot / Snapshot export
  const handleTakeScreenshot = () => {
    const video = videoRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    // 1. Draw camera feed
    if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      ctx.save();
      if (settings.mirrorMode) {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }

      // Compute cover metrics
      const vWidth = video.videoWidth || 1280;
      const vHeight = video.videoHeight || 720;
      const scale = Math.max(width / vWidth, height / vHeight);
      const dw = vWidth * scale;
      const dh = vHeight * scale;
      const ox = (width - dw) / 2;
      const oy = (height - dh) / 2;

      ctx.drawImage(video, ox, oy, dw, dh);
      ctx.restore();
    } else {
      // Dark gradient background fallback
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Draw static strokes
    const strokes = strokeManagerRef.current.getStrokes();
    BrushRenderer.renderStrokes(ctx, strokes, settings.glowStrength);

    // 3. Draw animated entities
    animationEngineRef.current.render(ctx, settings.glowStrength);

    // 4. Draw watermark tag
    ctx.font = '600 13px "Outfit", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('✨ Living Sketch AI • Interactive Live Mirror', 24, height - 24);

    // Play sound and open modal
    SoundEffects.playShutter();
    setScreenshotUrl(offscreen.toDataURL('image/png'));
  };

  const hasStrokes = strokeManagerRef.current.getStrokes().length > 0;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* LAYER 1: Full-Screen Live Mirrored Webcam Feed */}
      <CameraMirror
        ref={videoRef}
        isMirrored={settings.mirrorMode}
        cameraStatus={cameraStatus}
        errorMessage={errorMessage}
        onRetry={() => startCamera(selectedCameraId)}
        onStartCamera={() => startCamera(selectedCameraId)}
        isSimulatedMirror={isSimulatedMirror}
        onToggleSimulatedMirror={() => setIsSimulatedMirror(true)}
      />

      {/* LAYER 2, 3, 4, 5: Transparent Canvas Overlay for Drawings, Cursor, Living Sketches, Particles */}
      <DrawingCanvas
        strokeManager={strokeManagerRef.current}
        animationEngine={animationEngineRef.current}
        particleSystem={particleSystemRef.current}
        trackingState={trackingState}
        settings={settings}
        onStrokeCompleted={handleStrokeCompleted}
        onEntityGrabbed={entity => setSelectedEntityId(entity?.id || null)}
      />

      {/* LAYER 6: Interface Controls & HUD */}
      {/* Top Bar with Live Mirror Status and Help */}
      <TopBar
        cameraStatus={cameraStatus}
        isMirrored={settings.mirrorMode}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Gesture Status HUD & Air Drawing Toggle */}
      <GestureHUD
        trackingState={trackingState}
        settings={settings}
        onToggleAirDrawing={() =>
          handleUpdateSettings({ airDrawingEnabled: !settings.airDrawingEnabled })
        }
      />

      {/* Bottom Main Floating Toolbar */}
      <Toolbar
        settings={settings}
        canUndo={strokeManagerRef.current.canUndo()}
        canRedo={strokeManagerRef.current.canRedo()}
        hasStrokes={hasStrokes}
        livingEntities={livingEntities}
        isPaused={isPaused}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onBringToLife={handleOpenBringToLife}
        onToggleMirror={() => handleUpdateSettings({ mirrorMode: !settings.mirrorMode })}
        onTogglePause={handleTogglePause}
        onOpenBrushPicker={() => setIsBrushPickerOpen(v => !v)}
        isBrushPickerOpen={isBrushPickerOpen}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCreations={() => setIsCreationsOpen(v => !v)}
        onTakeScreenshot={handleTakeScreenshot}
      />

      {/* Brush & Color Studio Flyout */}
      <BrushPicker
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        isOpen={isBrushPickerOpen}
        onClose={() => setIsBrushPickerOpen(false)}
      />

      {/* Bring My Drawing To Life Configuration Modal */}
      <LivingSketchModal
        isOpen={isLivingModalOpen}
        onClose={() => setIsLivingModalOpen(false)}
        strokesCount={strokeManagerRef.current.getStrokes().length}
        onConfirmAnimate={handleConfirmAnimate}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        cameraDevices={cameraDevices}
        selectedCameraId={selectedCameraId}
        onSelectCamera={handleSelectCamera}
        cameraStatus={cameraStatus}
        onStartCamera={() => startCamera(selectedCameraId)}
        onStopCamera={stopCamera}
        onClearAllEntities={() => {
          animationEngineRef.current.clearAll();
          refreshEntities();
        }}
      />

      {/* Living Creations Drawer */}
      <CreationsDrawer
        isOpen={isCreationsOpen}
        onClose={() => setIsCreationsOpen(false)}
        entities={livingEntities}
        selectedEntityId={selectedEntityId}
        onSelectEntity={id => {
          animationEngineRef.current.setSelectedEntityId(id);
          refreshEntities();
        }}
        onTogglePauseEntity={id => {
          animationEngineRef.current.togglePause(id);
          refreshEntities();
        }}
        onDeleteEntity={id => {
          animationEngineRef.current.removeEntity(id);
          refreshEntities();
        }}
        onUpdateEntity={(id, updates) => {
          const entity = animationEngineRef.current.getEntities().find(e => e.id === id);
          if (entity) {
            Object.assign(entity, updates);
            refreshEntities();
          }
        }}
      />

      {/* Screenshot Preview Modal */}
      <ScreenshotModal
        isOpen={screenshotUrl !== null}
        onClose={() => setScreenshotUrl(null)}
        imageUrl={screenshotUrl}
      />

      {/* How to Draw & Gestures Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};
