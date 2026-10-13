import React, { useState } from 'react';
import { AnimationType, AIEffectType, Stroke } from '../types';
import { Sparkles, Wand2, Heart, Feather, Move, Zap, Play } from 'lucide-react';

interface LivingSketchModalProps {
  isOpen: boolean;
  onClose: () => void;
  strokesCount: number;
  onConfirmAnimate: (config: {
    name: string;
    animationType: AnimationType;
    speed: number;
    aiEffect: AIEffectType;
    aiPrompt: string;
    clearCanvas: boolean;
  }) => void;
}

const ANIMATION_TYPES: Array<{
  type: AnimationType;
  title: string;
  desc: string;
  icon: React.FC<{ className?: string }>;
}> = [
  {
    type: 'wings_flap',
    title: 'Wings Flapping',
    desc: 'Flaps wings back and forth in 3D perspective',
    icon: Feather
  },
  {
    type: 'hover',
    title: 'Float & Hover',
    desc: 'Gentle buoyancy and breathing scale',
    icon: Sparkles
  },
  {
    type: 'bouncing',
    title: 'Bouncy Jiggle',
    desc: 'Playful squash and stretch spring jumps',
    icon: Move
  },
  {
    type: 'heartbeat',
    title: 'Heartbeat Pulse',
    desc: 'Rhythmic double-pulse expansion & glow',
    icon: Heart
  },
  {
    type: 'orbit',
    title: 'Orbit & Wander',
    desc: 'Drifts and weaves smoothly around reflection',
    icon: Wand2
  },
  {
    type: 'follow_hand',
    title: 'Companion Pet',
    desc: 'Follows your hand or sits on your shoulder',
    icon: Zap
  }
];

const AI_AURA_OPTIONS: Array<{ type: AIEffectType; label: string; icon: string }> = [
  { type: 'sparkle_dust', label: 'Sparkle Dust', icon: '✨' },
  { type: 'neon_aura', label: 'Neon Aura', icon: '🔮' },
  { type: 'fire_flame', label: 'Fire Flame', icon: '🔥' },
  { type: 'rainbow_trail', label: 'Rainbow Trail', icon: '🌈' },
  { type: 'electric', label: 'Electric Sparks', icon: '⚡' },
  { type: 'none', label: 'None (Clean)', icon: '🚫' }
];

const PROMPT_SUGGESTIONS = [
  '🪽 Majestic angel wings on my back',
  '👑 Glowing celestial crown above head',
  '💖 Radiant beating heart beside cheek',
  '🐱 Cute animated pet on my shoulder',
  '🔥 Burning flame aura'
];

export const LivingSketchModal: React.FC<LivingSketchModalProps> = ({
  isOpen,
  onClose,
  strokesCount,
  onConfirmAnimate
}) => {
  const [name, setName] = useState('My Living Sketch');
  const [animationType, setAnimationType] = useState<AnimationType>('hover');
  const [speed, setSpeed] = useState(1.0);
  const [aiEffect, setAiEffect] = useState<AIEffectType>('sparkle_dust');
  const [aiPrompt, setAiPrompt] = useState('');
  const [clearCanvas, setClearCanvas] = useState(true);

  if (!isOpen) return null;

  const handleApply = () => {
    onConfirmAnimate({
      name: name.trim() || 'Living Creation',
      animationType,
      speed,
      aiEffect,
      aiPrompt,
      clearCanvas
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md pointer-events-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900/95 border border-cyan-500/30 p-6 text-white shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-['Outfit'] bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 bg-clip-text text-transparent">
              Bring My Drawing To Life!
            </h3>
            <p className="text-xs text-slate-400">
              Transform your {strokesCount} sketch stroke{strokesCount !== 1 ? 's' : ''} into an independently animated character
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 py-4">
          {/* Creation Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Character Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Angel Wings, Shoulder Dragon, Mystic Sigil"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Procedural Animation Behaviors */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Procedural Animation Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ANIMATION_TYPES.map(item => {
                const Icon = item.icon;
                const isSelected = animationType === item.type;
                return (
                  <button
                    key={item.type}
                    onClick={() => setAnimationType(item.type)}
                    className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400/80 text-white shadow-md shadow-cyan-500/10'
                        : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isSelected ? 'bg-cyan-500 text-white' : 'bg-slate-700/60 text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">{item.title}</div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Magic Auras */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              AI Magic Aura & Particle Stream
            </label>
            <div className="grid grid-cols-3 gap-2">
              {AI_AURA_OPTIONS.map(opt => {
                const isSelected = aiEffect === opt.type;
                return (
                  <button
                    key={opt.type}
                    onClick={() => setAiEffect(opt.type)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200'
                        : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Prompt Enhancement */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
              <span>AI Prompt (Optional Enhancement)</span>
              <span className="text-[10px] text-cyan-400">Quick suggestions below</span>
            </label>
            <input
              type="text"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="e.g. Glowing holographic wings that react to light"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm focus:border-cyan-400 focus:outline-none mb-2"
            />
            <div className="flex flex-wrap gap-1.5">
              {PROMPT_SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setAiPrompt(s)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Animation Speed Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Animation Speed</span>
              <span className="font-mono text-cyan-400">{speed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="2.5"
              step="0.1"
              value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />
          </div>

          {/* Clear Canvas for next drawing option */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="clearCanvas"
              checked={clearCanvas}
              onChange={e => setClearCanvas(e.target.checked)}
              className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
            />
            <label htmlFor="clearCanvas" className="text-xs text-slate-300 cursor-pointer">
              Clear canvas so I can immediately draw another creation over my reflection
            </label>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            Animate Now!
          </button>
        </div>
      </div>
    </div>
  );
};
