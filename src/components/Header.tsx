import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Palette,
  RotateCcw,
  HelpCircle,
  Swords,
  FileQuestion,
  Users,
  Bot,
  Cpu,
} from 'lucide-react';
import { GameSettings, OpponentMode, BotDifficulty } from '../types';
import { soundManager } from '../utils/audio';

export type MainTab = 'arena' | 'questions';

interface HeaderProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onOpenTeamSetup: () => void;
  onResetGame: () => void;
  onSelectOpponentMode: (mode: OpponentMode) => void;
  onSelectBotDifficulty: (difficulty: BotDifficulty) => void;
  teamACount?: number;
  teamBCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  settings,
  onUpdateSettings,
  onOpenTeamSetup,
  onResetGame,
  onSelectOpponentMode,
  onSelectBotDifficulty,
  teamACount = 10,
  teamBCount = 10,
}) => {
  const [showHelp, setShowHelp] = useState(false);

  const toggleSound = () => {
    const next = !settings.soundEnabled;
    soundManager.setEnabled(next);
    onUpdateSettings({ soundEnabled: next });
    if (next) soundManager.playClick();
  };

  return (
    <header className="w-full bg-stone-900/95 border-b border-stone-800 backdrop-blur px-3 sm:px-5 py-2 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
        {/* Brand & Title */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
            <Swords className="w-4 h-4 text-stone-950" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1.5">
              <span>KÉO CO TRẮC NGHIỆM</span>
            </h1>
            <p className="text-[10px] text-stone-400 hidden xl:block">
              Đấu trí 2 đội • Trả lời đúng để dồn lực kéo dây
            </p>
          </div>
        </div>

        {/* Game Mode Selector: 2 Người (PVP) vs Chơi với Máy (VS BOT) */}
        <div className="flex items-center gap-1.5 bg-stone-950/80 p-1 rounded-xl border border-stone-800 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              onSelectOpponentMode('pvp');
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              settings.opponentMode === 'pvp'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Chế độ 2 người chơi thi đấu trực tiếp"
          >
            <Users className="w-3.5 h-3.5" />
            <span>2 Người</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              onSelectOpponentMode('vs_bot');
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              settings.opponentMode === 'vs_bot'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Chế độ 1 người thi đấu với Máy (AI)"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Đấu Với Máy</span>
          </button>

          {/* Bot Difficulty Selector when vs_bot is active */}
          {settings.opponentMode === 'vs_bot' && (
            <div className="flex items-center gap-0.5 pl-1 border-l border-stone-800 text-[11px]">
              {(['easy', 'medium', 'hard'] as BotDifficulty[]).map((diff) => {
                const label = diff === 'easy' ? 'Dễ' : diff === 'hard' ? 'Khó' : 'Vừa';
                const isSelected = settings.botDifficulty === diff;
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      onSelectBotDifficulty(diff);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      isSelected
                        ? diff === 'easy'
                          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50'
                          : diff === 'hard'
                          ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50'
                          : 'bg-amber-500/25 text-amber-300 border border-amber-500/50'
                        : 'text-stone-500 hover:text-stone-300'
                    }`}
                    title={`Mức độ máy: ${label}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation Tabs (Thi Đấu vs Quản Lý Câu Hỏi) */}
        <div className="flex items-center bg-stone-950/80 p-1 rounded-xl border border-stone-800 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              onTabChange('arena');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'arena'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Thi Đấu</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              onTabChange('questions');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'questions'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileQuestion className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quản Lý Câu Hỏi</span>
            <span className="sm:hidden">Câu Hỏi</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold hidden md:inline-block ${
                activeTab === 'questions'
                  ? 'bg-stone-950/30 text-stone-950'
                  : 'bg-stone-800 text-stone-400'
              }`}
            >
              {teamACount + teamBCount}
            </span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Team Color Setup */}
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              onOpenTeamSetup();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-all border border-stone-700/80 cursor-pointer"
            title="Đổi màu sắc và linh vật hai đội"
          >
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Màu 2 Đội</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className={`p-1.5 sm:p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              settings.soundEnabled
                ? 'bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700'
                : 'bg-stone-900 border-stone-800 text-stone-500 hover:text-stone-300'
            }`}
            title={settings.soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Reset Arena / Center Rope Button */}
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              onResetGame();
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700/80 transition-all cursor-pointer"
            title="Đặt lại trận đấu về vạch số 0"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Help Popover Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="p-1.5 sm:p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700/80 transition-all cursor-pointer"
              title="Hướng dẫn luật chơi"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {showHelp && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl p-4 z-50 text-xs text-stone-300 space-y-2.5">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <span className="font-bold text-white text-sm">Luật Chơi & Chế Độ</span>
                  <button
                    type="button"
                    onClick={() => setShowHelp(false)}
                    className="text-stone-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <p>
                  👥 <b>Chế độ 2 người</b>: Hai người thi đấu song song trên cùng một màn hình.
                </p>
                <p>
                  🤖 <b>Chế độ chơi với Máy</b>: Bạn điều khiển Đội A, Máy (AI) tự động đọc câu hỏi và suy nghĩ để thi đấu với bạn! Bạn có thể chỉnh mức độ Dễ, Vừa hoặc Khó.
                </p>
                <p>
                  ⏰ <b>Thời gian 10s & Phạt 5s</b>: Mỗi câu hỏi có đúng 10s để trả lời, nếu quá 10s sẽ bị tính sai và phải đợi phạt 5s mới được sang câu mới.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
