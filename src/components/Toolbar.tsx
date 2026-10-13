import React from 'react';
import { AppSettings, LivingEntity } from '../types';
import {
  Undo2,
  Redo2,
  Trash2,
  Sparkles,
  Camera,
  Play,
  Pause,
  Sliders,
  Download,
  FlipHorizontal,
  Palette,
  Layers
} from 'lucide-react';

interface ToolbarProps {
  settings: AppSettings;
  canUndo: boolean;
  canRedo: boolean;
  hasStrokes: boolean;
  livingEntities: LivingEntity[];
  isPaused: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onBringToLife: () => void;
  onToggleMirror: () => void;
  onTogglePause: () => void;
  onOpenBrushPicker: () => void;
  isBrushPickerOpen: boolean;
  onOpenSettings: () => void;
  onOpenCreations: () => void;
  onTakeScreenshot: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  settings,
  canUndo,
  canRedo,
  hasStrokes,
  livingEntities,
  isPaused,
  onUndo,
  onRedo,
  onClear,
  onBringToLife,
  onToggleMirror,
  onTogglePause,
  onOpenBrushPicker,
  isBrushPickerOpen,
  onOpenSettings,
  onOpenCreations,
  onTakeScreenshot
}) => {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 md:gap-3 p-2 rounded-2xl bg-slate-900/85 backdrop-blur-2xl border border-slate-700/60 shadow-2xl shadow-black/80 pointer-events-auto">
      {/* Undo & Redo */}
      <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={`p-2.5 rounded-xl transition cursor-pointer ${
            canUndo ? 'text-slate-200 hover:bg-slate-800 hover:text-white' : 'text-slate-600 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className={`p-2.5 rounded-xl transition cursor-pointer ${
            canRedo ? 'text-slate-200 hover:bg-slate-800 hover:text-white' : 'text-slate-600 cursor-not-allowed'
          }`}
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Brush & Color Selector Button */}
      <button
        onClick={onOpenBrushPicker}
        title="Brush & Color Settings"
        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition border cursor-pointer ${
          isBrushPickerOpen
            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
            : 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700'
        }`}
      >
        <div
          className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
          style={{ backgroundColor: settings.brushColor }}
        />
        <span className="text-xs font-semibold hidden md:inline capitalize">{settings.brushType}</span>
        <Palette className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Clear Canvas */}
      <button
        onClick={onClear}
        disabled={!hasStrokes}
        title="Clear Drawing"
        className={`p-2.5 rounded-xl transition cursor-pointer ${
          hasStrokes ? 'text-rose-400 hover:bg-rose-500/20' : 'text-slate-600 cursor-not-allowed'
        }`}
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* CRITICAL FEATURE BUTTON: BRING MY DRAWING TO LIFE */}
      <button
        onClick={onBringToLife}
        disabled={!hasStrokes}
        title={hasStrokes ? 'Transform sketch into animated character' : 'Draw something on your reflection first!'}
        className={`relative group px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
          hasStrokes
            ? 'bg-gradient-to-r from-amber-400 via-pink-500 to-cyan-500 hover:from-amber-300 hover:to-cyan-400 text-white shadow-pink-500/30 animate-pulse'
            : 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed'
        }`}
      >
        <Sparkles className="w-4 h-4 fill-current" />
        <span className="font-['Outfit']">Bring My Drawing to Life</span>
      </button>

      {/* Living Creations Counter / Drawer */}
      {livingEntities.length > 0 && (
        <button
          onClick={onOpenCreations}
          title="Manage Living Creations"
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900 text-xs font-semibold transition cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{livingEntities.length}</span>
        </button>
      )}

      {/* Pause / Resume Animations */}
      {livingEntities.length > 0 && (
        <button
          onClick={onTogglePause}
          title={isPaused ? 'Resume Animations' : 'Pause Animations'}
          className={`p-2.5 rounded-xl transition cursor-pointer ${
            isPaused ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
        </button>
      )}

      {/* Mirror Mode Toggle */}
      <button
        onClick={onToggleMirror}
        title={`Mirror Feed: ${settings.mirrorMode ? 'ON' : 'OFF'}`}
        className={`p-2.5 rounded-xl transition border cursor-pointer ${
          settings.mirrorMode
            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
            : 'text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200'
        }`}
      >
        <FlipHorizontal className="w-4 h-4" />
      </button>

      {/* Screenshot / Export Creation */}
      <button
        onClick={onTakeScreenshot}
        title="Capture Reflection & Drawing Snapshot"
        className="p-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
      >
        <Download className="w-4 h-4" />
      </button>

      {/* Settings Modal */}
      <button
        onClick={onOpenSettings}
        title="Camera & App Settings"
        className="p-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
      >
        <Sliders className="w-4 h-4" />
      </button>
    </div>
  );
};
