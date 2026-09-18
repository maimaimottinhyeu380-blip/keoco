import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Check, ShieldAlert, Sparkles } from 'lucide-react';
import { TeamData, TeamColor } from '../types';
import { TEAM_COLORS, TEAM_MASCOTS } from '../data/gameData';
import { soundManager } from '../utils/audio';

interface TeamSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamA: TeamData;
  teamB: TeamData;
  targetTeamId: 'teamA' | 'teamB' | 'both';
  onUpdateTeam: (teamId: 'teamA' | 'teamB', name: string, color: TeamColor, mascot: string) => void;
}

export const TeamSetupModal: React.FC<TeamSetupModalProps> = ({
  isOpen,
  onClose,
  teamA,
  teamB,
  targetTeamId,
  onUpdateTeam,
}) => {
  const [activeTeamTab, setActiveTeamTab] = useState<'teamA' | 'teamB'>(
    targetTeamId === 'teamB' ? 'teamB' : 'teamA'
  );

  // Local state for editing
  const [nameA, setNameA] = useState(teamA.name);
  const [colorA, setColorA] = useState<TeamColor>(teamA.color);
  const [mascotA, setMascotA] = useState(teamA.mascot);

  const [nameB, setNameB] = useState(teamB.name);
  const [colorB, setColorB] = useState<TeamColor>(teamB.color);
  const [mascotB, setMascotB] = useState(teamB.mascot);

  // Sync with props when opened
  React.useEffect(() => {
    if (isOpen) {
      setNameA(teamA.name);
      setColorA(teamA.color);
      setMascotA(teamA.mascot);

      setNameB(teamB.name);
      setColorB(teamB.color);
      setMascotB(teamB.mascot);

      if (targetTeamId === 'teamB') {
        setActiveTeamTab('teamB');
      } else {
        setActiveTeamTab('teamA');
      }
    }
  }, [isOpen, teamA, teamB, targetTeamId]);

  if (!isOpen) return null;

  const isSameColor = colorA.id === colorB.id;

  const handleSave = () => {
    soundManager.playClick();
    onUpdateTeam('teamA', nameA, colorA, mascotA);
    onUpdateTeam('teamB', nameB, colorB, mascotB);
    onClose();
  };

  const isEditingA = activeTeamTab === 'teamA';
  const currentColor = isEditingA ? colorA : colorB;
  const currentName = isEditingA ? nameA : nameB;
  const currentMascot = isEditingA ? mascotA : mascotB;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎨</span>
            <h2 className="text-lg font-bold text-white">Tùy Chọn Màu Sắc & Đội Thi Đấu</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning if same color */}
        {isSameColor && (
          <div className="bg-amber-950/60 border-b border-amber-500/40 px-6 py-2 flex items-center gap-2 text-xs text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Hai đội đang chọn cùng một màu. Hãy chọn 2 màu khác nhau để dễ phân biệt trên sân kéo co nhé!</span>
          </div>
        )}

        {/* Team Selector Tabs */}
        <div className="flex border-b border-stone-800 bg-stone-950/40">
          <button
            type="button"
            onClick={() => setActiveTeamTab('teamA')}
            className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeTeamTab === 'teamA'
                ? 'border-white text-white bg-stone-800/40'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: colorA.hex }} />
            <span>Đội 1: {nameA}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTeamTab('teamB')}
            className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeTeamTab === 'teamB'
                ? 'border-white text-white bg-stone-800/40'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: colorB.hex }} />
            <span>Đội 2: {nameB}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Team Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-300">Tên Đội:</label>
            <input
              type="text"
              value={currentName}
              onChange={(e) => {
                if (isEditingA) setNameA(e.target.value);
                else setNameB(e.target.value);
              }}
              placeholder="Nhập tên đội..."
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-stone-400"
            />
          </div>

          {/* Color Palette Choice */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
              <span>Màu Sắc Đại Diện:</span>
              <span className="text-xs font-bold" style={{ color: currentColor.hex }}>
                {currentColor.name}
              </span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5">
              {TEAM_COLORS.map((c) => {
                const isSelected = currentColor.id === c.id;
                const isUsedByOther = (isEditingA ? colorB.id : colorA.id) === c.id;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      if (isEditingA) setColorA(c);
                      else setColorB(c);
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all relative ${
                      isSelected
                        ? 'border-white ring-2 ring-white/50 bg-stone-800'
                        : 'border-stone-800 bg-stone-950 hover:bg-stone-800/80'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full shadow flex items-center justify-center"
                      style={{ backgroundColor: c.hex }}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                    </div>
                    <span className="text-[11px] font-medium text-stone-300 text-center leading-tight">
                      {c.name}
                    </span>
                    {isUsedByOther && (
                      <span className="absolute top-1 right-1 text-[9px] bg-stone-800 text-stone-400 px-1 rounded">
                        Đội kia
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mascot / Avatar Choice */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-300">
              Biểu Tượng / Linh Vật:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {TEAM_MASCOTS.map((m) => {
                const isSelected = currentMascot === m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      if (isEditingA) setMascotA(m.icon);
                      else setMascotB(m.icon);
                    }}
                    className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'border-white bg-stone-800 text-white'
                        : 'border-stone-800 bg-stone-950 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <span className="text-2xl">{m.icon}</span>
                    <span className="text-xs font-medium truncate">{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-stone-950 border-t border-stone-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-stone-400 hover:text-white text-sm font-semibold transition-colors"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow-md transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Áp Dụng Cho Hai Đội</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
