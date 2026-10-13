import React from 'react';
import { LivingEntity, AnimationType, AIEffectType } from '../types';
import { X, Play, Pause, Trash2, Sparkles, Feather, Heart, Move, Wand2, Zap } from 'lucide-react';

interface CreationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entities: LivingEntity[];
  selectedEntityId: string | null;
  onSelectEntity: (id: string) => void;
  onTogglePauseEntity: (id: string) => void;
  onDeleteEntity: (id: string) => void;
  onUpdateEntity: (id: string, updates: Partial<LivingEntity>) => void;
}

export const CreationsDrawer: React.FC<CreationsDrawerProps> = ({
  isOpen,
  onClose,
  entities,
  selectedEntityId,
  onSelectEntity,
  onTogglePauseEntity,
  onDeleteEntity,
  onUpdateEntity
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-20 right-4 z-40 w-80 max-h-[75vh] flex flex-col rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 shadow-2xl text-white pointer-events-auto overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h4 className="font-bold text-sm font-['Outfit']">Living Creations ({entities.length})</h4>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
        {entities.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No living creations yet! Draw something on the mirror and click{' '}
            <span className="text-cyan-300 font-semibold">"Bring My Drawing to Life"</span>.
          </div>
        ) : (
          entities.map(e => {
            const isSelected = e.id === selectedEntityId;
            return (
              <div
                key={e.id}
                onClick={() => onSelectEntity(e.id)}
                className={`p-3 rounded-2xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500/60 shadow-md'
                    : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-bold text-xs text-white truncate max-w-[140px]">
                    {e.name}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={ev => {
                        ev.stopPropagation();
                        onTogglePauseEntity(e.id);
                      }}
                      className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                    >
                      {e.isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={ev => {
                        ev.stopPropagation();
                        onDeleteEntity(e.id);
                      }}
                      className="p-1 rounded text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="capitalize">{e.animationType.replace('_', ' ')}</span>
                  {e.aiEffect !== 'none' && (
                    <span className="text-indigo-300 text-[10px] bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-500/30">
                      {e.aiEffect.replace('_', ' ')}
                    </span>
                  )}
                </div>

                {/* Quick Animation Type Selector if selected */}
                {isSelected && (
                  <div className="mt-2 pt-2 border-t border-slate-700/60 flex flex-col gap-2">
                    <div className="text-[10px] text-slate-400">Animation Style:</div>
                    <div className="grid grid-cols-3 gap-1">
                      {(['wings_flap', 'hover', 'bouncing', 'heartbeat', 'orbit', 'follow_hand'] as AnimationType[]).map(type => (
                        <button
                          key={type}
                          onClick={ev => {
                            ev.stopPropagation();
                            onUpdateEntity(e.id, { animationType: type });
                          }}
                          className={`px-1.5 py-1 rounded text-[10px] font-medium truncate transition cursor-pointer ${
                            e.animationType === type
                              ? 'bg-cyan-500 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {type.replace('_', ' ')}
                        </button>
                      ))}
                    </div>

                    <div className="text-[10px] text-cyan-300 mt-1">
                      💡 Tip: Use <b>Pinch gesture</b> to grab & reposition on your reflection!
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
