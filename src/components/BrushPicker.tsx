import React from 'react';
import { BrushType, AppSettings } from '../types';
import { Sparkles, Sun, Flame, Feather, Circle } from 'lucide-react';

interface BrushPickerProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#00F0FF', // Cyber Cyan
  '#FF007F', // Neon Magenta
  '#FFE600', // Electric Gold
  '#00FF66', // Matrix Green
  '#B026FF', // Neon Violet
  '#FF6B00', // Solar Orange
  '#FFFFFF', // Pure White
  '#FF2A2A', // Crimson Red
];

const BRUSH_TYPES: Array<{ type: BrushType; label: string; icon: React.FC<{ className?: string }> }> = [
  { type: 'neon', label: 'Neon Glow', icon: Sun },
  { type: 'sparkle', label: 'Sparkle Star', icon: Sparkles },
  { type: 'rainbow', label: 'Rainbow Pulse', icon: Flame },
  { type: 'calligraphy', label: 'Calligraphy', icon: Feather },
  { type: 'solid', label: 'Solid Line', icon: Circle },
];

export const BrushPicker: React.FC<BrushPickerProps> = ({
  settings,
  onUpdateSettings,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-80 md:w-96 p-4 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/60 shadow-2xl text-white pointer-events-auto">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <h4 className="font-semibold text-sm tracking-wide font-['Outfit'] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Brush & Color Studio
        </h4>
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/80 cursor-pointer"
        >
          Done
        </button>
      </div>

      {/* Brush Styles */}
      <div className="mb-4">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Brush Style
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {BRUSH_TYPES.map(brush => {
            const Icon = brush.icon;
            const isSelected = settings.brushType === brush.type;
            return (
              <button
                key={brush.type}
                onClick={() => onUpdateSettings({ brushType: brush.type })}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{brush.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Vibrant Color Palette */}
      <div className="mb-4">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Neon Color
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map(color => {
            const isSelected = settings.brushColor.toLowerCase() === color.toLowerCase();
            return (
              <button
                key={color}
                onClick={() => onUpdateSettings({ brushColor: color })}
                style={{ backgroundColor: color }}
                className={`w-7 h-7 rounded-full transition-transform cursor-pointer relative ${
                  isSelected ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900 shadow-lg' : 'hover:scale-110 opacity-90'
                }`}
              />
            );
          })}
          {/* Custom Native Color Picker */}
          <label className="w-7 h-7 rounded-full border border-slate-600 flex items-center justify-center cursor-pointer hover:border-slate-400 bg-slate-800 relative overflow-hidden">
            <span className="text-xs">+</span>
            <input
              type="color"
              value={settings.brushColor}
              onChange={e => onUpdateSettings({ brushColor: e.target.value })}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>
      </div>

      {/* Brush Size Slider */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-300 mb-1">
          <span>Brush Size</span>
          <span className="font-mono text-cyan-400">{settings.brushSize}px</span>
        </div>
        <input
          type="range"
          min="2"
          max="36"
          value={settings.brushSize}
          onChange={e => onUpdateSettings({ brushSize: Number(e.target.value) })}
          className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
        />
      </div>

      {/* Glow Intensity Slider */}
      <div>
        <div className="flex justify-between text-xs text-slate-300 mb-1">
          <span>Neon Glow Intensity</span>
          <span className="font-mono text-cyan-400">{Math.round(settings.glowStrength * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.2"
          max="2.0"
          step="0.1"
          value={settings.glowStrength}
          onChange={e => onUpdateSettings({ glowStrength: Number(e.target.value) })}
          className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
        />
      </div>
    </div>
  );
};
