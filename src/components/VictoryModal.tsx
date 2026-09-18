import React from 'react';
import { motion } from 'motion/react';
import { Trophy, RotateCcw, Award, Flame, CheckCircle, XCircle } from 'lucide-react';
import { TeamData } from '../types';
import { soundManager } from '../utils/audio';

interface VictoryModalProps {
  winner: 'teamA' | 'teamB' | null;
  teamA: TeamData;
  teamB: TeamData;
  onRematch: () => void;
  onContinue: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  winner,
  teamA,
  teamB,
  onRematch,
  onContinue,
}) => {
  if (!winner) return null;

  const winTeam = winner === 'teamA' ? teamA : teamB;
  const loseTeam = winner === 'teamA' ? teamB : teamA;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85 }}
        className="w-full max-w-lg bg-stone-900 border-2 rounded-3xl shadow-2xl overflow-hidden text-center p-6 sm:p-8 relative"
        style={{ borderColor: winTeam.color.hex }}
      >
        {/* Background glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: winTeam.color.hex }}
        />

        {/* Trophy Icon */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-xl border-2 border-white/20 mb-4"
          style={{ backgroundColor: winTeam.color.hex }}
        >
          <Trophy className="w-10 h-10 text-white drop-shadow-md" />
        </motion.div>

        {/* Victory Announcement */}
        <span className="text-xs uppercase tracking-widest font-black text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/30">
          🎉 CHIẾN THẮNG TUYỆT ĐỐI!
        </span>

        <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 mb-1">
          {winTeam.name} {winTeam.mascot}
        </h2>
        <p className="text-sm text-stone-300 mb-6">
          Đã kéo ngã đối thủ với lực kéo và phản xạ trắc nghiệm xuất sắc!
        </p>

        {/* Two teams stats comparison */}
        <div className="grid grid-cols-2 gap-3 bg-stone-950/70 p-4 rounded-2xl border border-stone-800 mb-6 text-left">
          {/* Winner Stats */}
          <div className="space-y-2 border-r border-stone-800 pr-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{winTeam.mascot}</span>
              <span className="text-xs font-bold text-white truncate">{winTeam.name}</span>
              <Award className="w-4 h-4 text-amber-400 ml-auto shrink-0" />
            </div>
            <div className="text-xs space-y-1 text-stone-300">
              <div className="flex justify-between">
                <span>Điểm kéo:</span>
                <b className="text-white font-mono">{winTeam.score}</b>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Trả lời đúng:</span>
                <b className="font-mono">{winTeam.correctAnswersCount}</b>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Trả lời sai:</span>
                <b className="font-mono">{winTeam.wrongAnswersCount}</b>
              </div>
            </div>
          </div>

          {/* Runner Up Stats */}
          <div className="space-y-2 pl-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{loseTeam.mascot}</span>
              <span className="text-xs font-bold text-stone-400 truncate">{loseTeam.name}</span>
            </div>
            <div className="text-xs space-y-1 text-stone-400">
              <div className="flex justify-between">
                <span>Điểm kéo:</span>
                <b className="text-stone-300 font-mono">{loseTeam.score}</b>
              </div>
              <div className="flex justify-between text-emerald-400/80">
                <span>Trả lời đúng:</span>
                <b className="font-mono">{loseTeam.correctAnswersCount}</b>
              </div>
              <div className="flex justify-between text-rose-400/80">
                <span>Trả lời sai:</span>
                <b className="font-mono">{loseTeam.wrongAnswersCount}</b>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              soundManager.playWhistle();
              onRematch();
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Đấu Lại Trận Mới</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              onContinue();
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-bold text-sm transition-all"
          >
            Tiếp Tục Kéo Tự Do
          </button>
        </div>
      </motion.div>
    </div>
  );
};
