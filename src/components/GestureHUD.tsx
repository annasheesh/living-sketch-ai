import React from 'react';
import { HandTrackingState, AppSettings } from '../types';
import { Hand, Sparkles, Move, Pause, Flame } from 'lucide-react';

interface GestureHUDProps {
  trackingState: HandTrackingState | null;
  settings: AppSettings;
  onToggleAirDrawing: () => void;
}

export const GestureHUD: React.FC<GestureHUDProps> = ({
  trackingState,
  settings,
  onToggleAirDrawing
}) => {
  const isHandDetected = trackingState?.isHandDetected ?? false;
  const gesture = trackingState?.gesture ?? 'none';
  const isDrawing = trackingState?.isDrawing ?? false;

  const getGestureDetails = () => {
    if (!isHandDetected) {
      return {
        icon: Hand,
        text: 'Searching for hand...',
        color: 'text-slate-400',
        bg: 'bg-slate-900/60 border-slate-700/40'
      };
    }

    if (isDrawing) {
      return {
        icon: Flame,
        text: 'Drawing in Air',
        color: 'text-emerald-400',
        bg: 'bg-emerald-950/80 border-emerald-500/50 shadow-emerald-500/20'
      };
    }

    switch (gesture) {
      case 'open_palm':
        return {
          icon: Hand,
          text: 'Open Palm (Hover)',
          color: 'text-sky-400',
          bg: 'bg-sky-950/80 border-sky-500/50'
        };
      case 'pinch':
        return {
          icon: Move,
          text: 'Pinch (Grab & Drag)',
          color: 'text-rose-400',
          bg: 'bg-rose-950/80 border-rose-500/50 shadow-rose-500/20'
        };
      case 'fist':
        return {
          icon: Pause,
          text: 'Fist (Paused)',
          color: 'text-amber-400',
          bg: 'bg-amber-950/80 border-amber-500/50'
        };
      case 'pointing':
      default:
        return {
          icon: Sparkles,
          text: 'Point to Draw',
          color: 'text-cyan-400',
          bg: 'bg-cyan-950/80 border-cyan-500/50'
        };
    }
  };

  const details = getGestureDetails();
  const IconComponent = details.icon;

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
      {/* Air Drawing Master Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleAirDrawing}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl backdrop-blur-xl border font-semibold text-xs transition-all shadow-lg cursor-pointer ${
            settings.airDrawingEnabled
              ? 'bg-gradient-to-r from-cyan-500/90 to-blue-600/90 text-white border-cyan-400/50 shadow-cyan-500/25'
              : 'bg-slate-900/80 text-slate-400 border-slate-700/60 hover:text-white'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              settings.airDrawingEnabled ? 'bg-cyan-300 animate-ping' : 'bg-slate-500'
            }`}
          />
          AIR DRAWING: {settings.airDrawingEnabled ? 'ON' : 'OFF'}
        </button>

        {/* Real-time Gesture State Badge */}
        {settings.airDrawingEnabled && (
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-xl border text-xs font-medium transition-all shadow-md ${details.bg}`}
          >
            <IconComponent className={`w-3.5 h-3.5 ${details.color} animate-pulse`} />
            <span className={details.color}>{details.text}</span>
          </div>
        )}
      </div>

      {/* Mini Gestures Cheatsheet Quick Reference */}
      {settings.airDrawingEnabled && isHandDetected && (
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-950/70 backdrop-blur-md border border-slate-800/60 text-[11px] text-slate-400">
          <span>☝️ Point = Draw</span>
          <span className="text-slate-600">•</span>
          <span>✋ Palm = Move Cursor</span>
          <span className="text-slate-600">•</span>
          <span>🤏 Pinch = Drag Sketch</span>
          <span className="text-slate-600">•</span>
          <span>✊ Fist = Pause</span>
        </div>
      )}
    </div>
  );
};
