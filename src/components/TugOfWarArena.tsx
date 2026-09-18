import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TeamData } from '../types';

interface TugOfWarArenaProps {
  teamA: TeamData;
  teamB: TeamData;
  ropePosition: number; // -100 (Team A wins) to +100 (Team B wins), 0 is center
  maxDistance: number;
  winner: 'teamA' | 'teamB' | null;
  lastPullTeam: 'teamA' | 'teamB' | null;
}

export const TugOfWarArena: React.FC<TugOfWarArenaProps> = ({
  teamA,
  teamB,
  ropePosition,
  maxDistance,
  winner,
  lastPullTeam,
}) => {
  // Convert position to percentage: -100 is max left, +100 is max right
  const normalizedPosition = Math.max(-100, Math.min(100, (ropePosition / maxDistance) * 100));
  // Pixel offset for rope ribbon
  const ribbonShiftPercent = normalizedPosition * 0.38;

  return (
    <div className="w-full h-full bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
      {/* 1. Clean Top Status Bar */}
      <div className="bg-stone-950/60 px-4 py-2.5 border-b border-stone-800 flex items-center justify-between text-xs shrink-0">
        {/* Team A quick info */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">{teamA.mascot}</span>
          <span className="font-bold uppercase tracking-wide truncate" style={{ color: teamA.color.hex }}>
            {teamA.name}
          </span>
          <span className="bg-stone-800 px-2 py-0.5 rounded-full font-mono font-bold text-stone-200">
            {teamA.score}
          </span>
        </div>

        {/* Center Tension Indicator */}
        <div className="px-2.5 py-1 rounded-full bg-stone-800/80 border border-stone-700/60 text-xs font-mono font-bold text-stone-300">
          {normalizedPosition === 0 ? (
            <span className="text-stone-300">Cân bằng</span>
          ) : normalizedPosition < 0 ? (
            <span style={{ color: teamA.color.hex }}>
              ◀ {teamA.name} dẫn +{Math.abs(Math.round(normalizedPosition))}%
            </span>
          ) : (
            <span style={{ color: teamB.color.hex }}>
              {teamB.name} dẫn +{Math.round(normalizedPosition)}% ▶
            </span>
          )}
        </div>

        {/* Team B quick info */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="bg-stone-800 px-2 py-0.5 rounded-full font-mono font-bold text-stone-200">
            {teamB.score}
          </span>
          <span className="font-bold uppercase tracking-wide truncate" style={{ color: teamB.color.hex }}>
            {teamB.name}
          </span>
          <span className="text-lg">{teamB.mascot}</span>
        </div>
      </div>

      {/* 2. Main Pitch Field */}
      <div className="relative flex-1 min-h-[280px] sm:min-h-[320px] w-full bg-gradient-to-b from-stone-900 to-stone-950 overflow-hidden flex flex-col justify-end pb-7">
        {/* Stadium turf floor line with chalk markings */}
        <div className="absolute inset-x-0 bottom-0 h-16 sm:h-18 bg-stone-950 border-t-2 border-stone-700/60">
          {/* Subtle line textures */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Left Win Limit Line */}
          <div className="absolute left-[16%] top-0 bottom-0 w-0.5 border-r-2 border-dashed border-red-500/70 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-red-400 rotate-90 whitespace-nowrap uppercase tracking-wider">
              Vạch Thắng A
            </span>
          </div>

          {/* Center Line */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-amber-400/90 flex flex-col items-center justify-center">
            <span className="text-[9px] font-bold text-amber-300 bg-stone-900 px-1 py-0.5 rounded border border-amber-500/40">
              Vạch Giữa
            </span>
          </div>

          {/* Right Win Limit Line */}
          <div className="absolute right-[16%] top-0 bottom-0 w-0.5 border-l-2 border-dashed border-blue-500/70 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-blue-400 -rotate-90 whitespace-nowrap uppercase tracking-wider">
              Vạch Thắng B
            </span>
          </div>
        </div>

        {/* Rope and Pulling Characters */}
        <div className="relative w-full h-44 sm:h-52 flex items-center justify-center">
          {/* THE ROPE */}
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-8 flex items-center z-10 pointer-events-none">
            <motion.div
              className="w-full h-3 rounded-full relative"
              style={{
                background: 'repeating-linear-gradient(45deg, #d97706, #d97706 10px, #b45309 10px, #b45309 20px)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
              }}
              animate={{
                y: lastPullTeam ? [0, -2, 2, 0] : 0,
              }}
              transition={{ duration: 0.25 }}
            >
              {/* Red ribbon in center of the rope */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center -ml-3"
                style={{ left: `calc(50% + ${ribbonShiftPercent}%)` }}
                animate={{
                  scale: lastPullTeam ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 0.25 }}
              >
                <div className="w-5 h-10 bg-red-600 rounded-b-md shadow-md border border-red-400 flex items-center justify-center relative">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-300" />
                  <div className="absolute -bottom-2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[8px] border-t-red-600" />
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* LEFT TEAM: TEAM A PLAYERS */}
          <motion.div
            className="absolute z-20 flex items-end gap-2 sm:gap-4 select-none"
            style={{ left: `calc(10% + ${ribbonShiftPercent * 0.7}%)` }}
            animate={{
              x: lastPullTeam === 'teamA' ? [-3, -12, -2] : teamA.lastAction === 'wrong' ? [3, -2, 0] : 0,
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 20 }}
          >
            {[1, 2, 3].map((playerIdx) => (
              <PlayerFigure
                key={`teamA-${playerIdx}`}
                team={teamA}
                position="left"
                playerIndex={playerIdx}
                isPulling={lastPullTeam === 'teamA'}
                isWinner={winner === 'teamA'}
                isLoser={winner === 'teamB'}
                stumble={teamA.lastAction === 'wrong'}
              />
            ))}

            {/* Float notification on pull */}
            <AnimatePresence>
              {lastPullTeam === 'teamA' && (
                <motion.div
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: -30 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-4 left-1/2 font-bold text-sm px-2 py-0.5 rounded-full shadow border border-white/20 whitespace-nowrap"
                  style={{
                    backgroundColor: teamA.color.hex,
                    color: '#ffffff',
                  }}
                >
                  +20 lực kéo!
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* RIGHT TEAM: TEAM B PLAYERS */}
          <motion.div
            className="absolute z-20 flex items-end gap-2 sm:gap-4 select-none"
            style={{ right: `calc(10% - ${ribbonShiftPercent * 0.7}%)` }}
            animate={{
              x: lastPullTeam === 'teamB' ? [3, 12, 2] : teamB.lastAction === 'wrong' ? [-3, 2, 0] : 0,
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 20 }}
          >
            {[1, 2, 3].map((playerIdx) => (
              <PlayerFigure
                key={`teamB-${playerIdx}`}
                team={teamB}
                position="right"
                playerIndex={playerIdx}
                isPulling={lastPullTeam === 'teamB'}
                isWinner={winner === 'teamB'}
                isLoser={winner === 'teamA'}
                stumble={teamB.lastAction === 'wrong'}
              />
            ))}

            {/* Float notification on pull */}
            <AnimatePresence>
              {lastPullTeam === 'teamB' && (
                <motion.div
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: -30 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-4 right-1/2 font-bold text-sm px-2 py-0.5 rounded-full shadow border border-white/20 whitespace-nowrap"
                  style={{
                    backgroundColor: teamB.color.hex,
                    color: '#ffffff',
                  }}
                >
                  +20 lực kéo!
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Clean Balance Meter Bar */}
        <div className="px-6 relative z-10 mt-1">
          <div className="w-full bg-stone-950 h-2.5 rounded-full overflow-hidden border border-stone-800 relative flex items-center">
            {/* Left side progress */}
            <div
              className="h-full transition-all duration-300 ease-out"
              style={{
                width: `${Math.max(0, -normalizedPosition)}%`,
                marginLeft: `${Math.max(0, 50 - Math.max(0, -normalizedPosition))}%`,
                backgroundColor: teamA.color.hex,
              }}
            />
            {/* Center tick */}
            <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-full bg-stone-400 z-10" />
            {/* Right side progress */}
            <div
              className="h-full transition-all duration-300 ease-out"
              style={{
                width: `${Math.max(0, normalizedPosition)}%`,
                marginLeft: '50%',
                backgroundColor: teamB.color.hex,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-mono">
            <span style={{ color: teamA.color.hex }}>◀ Vạch thắng {teamA.name}</span>
            <span className="text-stone-400">Vạch xuất phát 0</span>
            <span style={{ color: teamB.color.hex }}>Vạch thắng {teamB.name} ▶</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Animated Character Figure
interface PlayerFigureProps {
  team: TeamData;
  position: 'left' | 'right';
  playerIndex: number;
  isPulling: boolean;
  isWinner: boolean;
  isLoser: boolean;
  stumble: boolean;
}

const PlayerFigure: React.FC<PlayerFigureProps> = ({
  team,
  position,
  playerIndex,
  isPulling,
  isWinner,
  isLoser,
  stumble,
}) => {
  const leanAngle = position === 'left' ? -18 : 18;
  const pullingExtraAngle = position === 'left' ? -12 : 12;

  return (
    <motion.div
      className="flex flex-col items-center relative cursor-default"
      animate={{
        rotate: isWinner
          ? [0, -8, 8, 0]
          : isLoser
          ? position === 'left' ? 25 : -25
          : isPulling
          ? leanAngle + pullingExtraAngle
          : stumble
          ? position === 'left' ? 15 : -15
          : leanAngle,
        y: isWinner ? [0, -16, 0] : isPulling ? [0, 3, 0] : 0,
      }}
      transition={{
        rotate: { duration: 0.25 },
        y: isWinner ? { repeat: Infinity, duration: 0.6 } : { duration: 0.2 },
      }}
    >
      {/* Strain / Sweat Emoji */}
      {isPulling && (
        <span className="absolute -top-4 text-xs animate-bounce">
          💦
        </span>
      )}
      {stumble && (
        <span className="absolute -top-4 text-xs animate-pulse">
          😵
        </span>
      )}
      {isWinner && (
        <span className="absolute -top-5 text-sm animate-bounce">
          👑
        </span>
      )}

      {/* Mascot / Head */}
      <div
        className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-lg sm:text-xl shadow border-2 relative z-10"
        style={{
          backgroundColor: team.color.hex,
          borderColor: '#ffffff',
        }}
      >
        <span>{team.mascot}</span>
      </div>

      {/* Body */}
      <div
        className="w-6 h-8 sm:w-7 sm:h-9 rounded-md mt-[-4px] flex flex-col items-center justify-center text-white text-[9px] font-bold shadow"
        style={{ backgroundColor: team.color.hex }}
      >
        <span className="opacity-90">{playerIndex}</span>
        {/* Grip Gloves */}
        <div className="w-8 h-2.5 bg-amber-100 rounded-full border border-stone-800 shadow-sm mt-0.5" />
      </div>

      {/* Legs */}
      <div className="flex gap-1.5 -mt-0.5">
        <div className="w-2 h-5 bg-stone-800 rounded-b-sm transform -rotate-12 border-b-2 border-stone-400" />
        <div className="w-2 h-5 bg-stone-800 rounded-b-sm transform rotate-12 border-b-2 border-stone-400" />
      </div>
    </motion.div>
  );
};
