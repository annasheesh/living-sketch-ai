import React, { useRef, useEffect, useCallback } from 'react';
import { StrokeManager } from '../engine/drawing/StrokeManager';
import { BrushRenderer } from '../engine/drawing/BrushRenderer';
import { AnimationEngine } from '../engine/animation/AnimationEngine';
import { ParticleSystem } from '../engine/particles/ParticleSystem';
import { HandTrackingState, AppSettings, LivingEntity } from '../types';
import { SoundEffects } from '../engine/audio/SoundEffects';

interface DrawingCanvasProps {
  strokeManager: StrokeManager;
  animationEngine: AnimationEngine;
  particleSystem: ParticleSystem;
  trackingState: HandTrackingState | null;
  settings: AppSettings;
  onStrokeCompleted: () => void;
  onEntityGrabbed?: (entity: LivingEntity | null) => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  strokeManager,
  animationEngine,
  particleSystem,
  trackingState,
  settings,
  onStrokeCompleted,
  onEntityGrabbed
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isMouseDownRef = useRef(false);
  const wasDrawingRef = useRef(false);
  const wasPinchingRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);

  // Resize canvas to match display size & DPR
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Handle Air Drawing state changes from HandTracker
  useEffect(() => {
    if (!settings.airDrawingEnabled || !trackingState) return;

    const { isHandDetected, cursor, isDrawing, isPinching, pinchCenter, gesture } = trackingState;

    // 1. Handle Closed Fist: pause animations
    if (gesture === 'fist') {
      animationEngine.setGlobalPaused(true);
    }

    // 2. Handle Pinch Gesture: grab and drag animated sketch
    if (isPinching && pinchCenter) {
      if (!wasPinchingRef.current) {
        // Pinch started
        const grabbed = animationEngine.handlePinchStart(pinchCenter.x, pinchCenter.y);
        if (grabbed) {
          SoundEffects.playGrab();
          if (onEntityGrabbed) onEntityGrabbed(grabbed);
        }
        wasPinchingRef.current = true;
      } else {
        // Continue dragging
        animationEngine.handlePinchMove(pinchCenter.x, pinchCenter.y);
      }
    } else if (wasPinchingRef.current) {
      // Pinch ended
      animationEngine.handlePinchEnd();
      wasPinchingRef.current = false;
      if (onEntityGrabbed) onEntityGrabbed(null);
    }

    // 3. Handle Air Drawing
    if (isHandDetected && cursor) {
      // Fingertip particle trail
      particleSystem.emitFingertipTrail(
        cursor.x,
        cursor.y,
        settings.brushColor,
        isDrawing
      );

      if (isDrawing) {
        if (!wasDrawingRef.current) {
          // Begin new stroke
          strokeManager.beginStroke(
            cursor,
            settings.brushColor,
            settings.brushSize,
            settings.brushType
          );
          wasDrawingRef.current = true;
        } else {
          // Append point
          strokeManager.addPoint(cursor);
        }
      } else if (wasDrawingRef.current) {
        // Stop drawing stroke
        const completed = strokeManager.endStroke();
        wasDrawingRef.current = false;
        if (completed) onStrokeCompleted();
      }
    } else if (wasDrawingRef.current) {
      // Hand lost while drawing: cleanly end stroke
      const completed = strokeManager.endStroke();
      wasDrawingRef.current = false;
      if (completed) onStrokeCompleted();
    }
  }, [
    trackingState,
    settings.airDrawingEnabled,
    settings.brushColor,
    settings.brushSize,
    settings.brushType,
    strokeManager,
    animationEngine,
    particleSystem,
    onStrokeCompleted,
    onEntityGrabbed
  ]);

  // Main 60fps render loop
  useEffect(() => {
    let active = true;

    const render = (time: number) => {
      if (!active) return;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          ctx.save();
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          // Clear transparent canvas
          ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

          // 1. Update Particles & Animations
          particleSystem.update();
          animationEngine.update(time, trackingState?.cursor || null);

          // 2. Render Existing Static Drawing Strokes (Layer 2)
          BrushRenderer.renderStrokes(ctx, strokeManager.getStrokes(), settings.glowStrength);

          // 3. Render Active Stroke currently being drawn
          const activeStroke = strokeManager.getActiveStroke();
          if (activeStroke) {
            BrushRenderer.renderSingleStroke(ctx, activeStroke, settings.glowStrength);
          }

          // 4. Render Animated Sketches / Living Entities (Layer 4)
          animationEngine.render(ctx, settings.glowStrength);

          // 5. Render Magic Particles & Sparkle Trails (Layer 5)
          particleSystem.render(ctx);

          // 6. Render Hand-Tracking Cursor & Gesture Feedback (Layer 3)
          if (settings.airDrawingEnabled && trackingState?.isHandDetected && trackingState.cursor) {
            renderFingertipCursor(ctx, trackingState, settings);
          }

          ctx.restore();
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [strokeManager, animationEngine, particleSystem, trackingState, settings]);

  /**
   * Render glowing fingertip cursor with halo, gesture tag, and drawing indicator
   */
  const renderFingertipCursor = (
    ctx: CanvasRenderingContext2D,
    state: HandTrackingState,
    settings: AppSettings
  ) => {
    if (!state.cursor) return;
    const { x, y } = state.cursor;
    const isDrawing = state.isDrawing;
    const isPinching = state.isPinching;
    const gesture = state.gesture;
    const cursorColor = isDrawing ? settings.brushColor : '#38BDF8';

    ctx.save();

    // Outer pulsating halo
    const pulse = Math.sin(performance.now() * 0.008) * 4;
    const outerRadius = Math.max(12, settings.brushSize * 0.9 + 6 + (isDrawing ? pulse : 0));

    ctx.beginPath();
    ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = cursorColor;
    ctx.lineWidth = isDrawing ? 2.5 : 1.5;
    ctx.shadowColor = cursorColor;
    ctx.shadowBlur = isDrawing ? 16 : 8;
    ctx.stroke();

    // Inner bright dot
    ctx.beginPath();
    ctx.arc(x, y, Math.max(3, settings.brushSize * 0.35), 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 6;
    ctx.fill();

    // Pinch target ring if pinching
    if (isPinching && state.pinchCenter) {
      ctx.beginPath();
      ctx.arc(state.pinchCenter.x, state.pinchCenter.y, 16, 0, Math.PI * 2);
      ctx.strokeStyle = '#F43F5E';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Gesture indicator tag
    if (settings.showGestureHUD) {
      let label = 'Hovering';
      let tagBg = 'rgba(15, 23, 42, 0.75)';
      let tagBorder = 'rgba(56, 189, 248, 0.4)';

      if (isDrawing) {
        label = '✏️ Air Drawing';
        tagBg = 'rgba(6, 78, 59, 0.85)';
        tagBorder = 'rgba(52, 211, 153, 0.7)';
      } else if (isPinching) {
        label = '🤏 Pinch (Grab)';
        tagBg = 'rgba(136, 19, 55, 0.85)';
        tagBorder = 'rgba(251, 113, 133, 0.7)';
      } else if (gesture === 'open_palm') {
        label = '✋ Open Palm';
      } else if (gesture === 'fist') {
        label = '✊ Fist (Paused)';
        tagBg = 'rgba(120, 53, 15, 0.85)';
        tagBorder = 'rgba(251, 191, 36, 0.7)';
      }

      ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
      const textWidth = ctx.measureText(label).width;
      const tagWidth = textWidth + 16;
      const tagHeight = 22;
      const tagX = x + 18;
      const tagY = y - 12;

      ctx.fillStyle = tagBg;
      ctx.strokeStyle = tagBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(tagX, tagY, tagWidth, tagHeight, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, tagX + 8, tagY + tagHeight / 2);
    }

    ctx.restore();
  };

  // Mouse & Touch Fallback Drawing Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only enable mouse drawing if air drawing is off or user clicks directly
    const rect = e.currentTarget.getBoundingClientRect();
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    // Check if user clicked an animated entity to grab
    const grabbed = animationEngine.handlePinchStart(pt.x, pt.y);
    if (grabbed) {
      SoundEffects.playGrab();
      if (onEntityGrabbed) onEntityGrabbed(grabbed);
      isMouseDownRef.current = true;
      return;
    }

    strokeManager.beginStroke(pt, settings.brushColor, settings.brushSize, settings.brushType);
    isMouseDownRef.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMouseDownRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    // If an entity was grabbed, drag it
    if (animationEngine.getSelectedEntity()?.isGrabbed) {
      animationEngine.handlePinchMove(pt.x, pt.y);
    } else {
      strokeManager.addPoint(pt);
      particleSystem.emitFingertipTrail(pt.x, pt.y, settings.brushColor, true);
    }
  };

  const handleMouseUp = () => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    animationEngine.handlePinchEnd();
    if (onEntityGrabbed) onEntityGrabbed(null);

    const completed = strokeManager.endStroke();
    if (completed) onStrokeCompleted();
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="absolute inset-0 w-full h-full z-10 cursor-crosshair touch-none select-none"
    />
  );
};
