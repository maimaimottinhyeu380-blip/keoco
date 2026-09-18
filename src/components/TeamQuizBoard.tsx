import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Sparkles,
  Edit3,
  Play,
  Palette,
  Check,
  X,
  ArrowRight,
  Trophy,
  Timer,
  Clock,
  Hourglass,
  AlertTriangle,
  Bot,
} from 'lucide-react';
import { TeamData, Question } from '../types';
import { soundManager } from '../utils/audio';
import { PRESET_QUESTION_PACKS } from '../data/gameData';

const QUESTION_TIME_LIMIT = 10; // 10s để trả lời câu hỏi
const TIMEOUT_PENALTY_SECONDS = 5; // 5s phạt đợi nếu hết giờ

interface TeamQuizBoardProps {
  team: TeamData;
  onAnswer: (teamId: 'teamA' | 'teamB', optionIndex: number) => void;
  onNextQuestion: (teamId: 'teamA' | 'teamB') => void;
  onUpdateQuestion: (teamId: 'teamA' | 'teamB', updatedQuestion: Question) => void;
  onAddQuestion: (teamId: 'teamA' | 'teamB', newQuestion: Question) => void;
  onDeleteQuestion: (teamId: 'teamA' | 'teamB', questionId: string) => void;
  onLoadPreset: (teamId: 'teamA' | 'teamB', questions: Question[]) => void;
  onOpenColorPicker: (teamId: 'teamA' | 'teamB') => void;
  disabled: boolean;
  isTurn: boolean;
}

export const TeamQuizBoard: React.FC<TeamQuizBoardProps> = ({
  team,
  onAnswer,
  onNextQuestion,
  onUpdateQuestion,
  onAddQuestion,
  onDeleteQuestion,
  onLoadPreset,
  onOpenColorPicker,
  disabled,
  isTurn,
}) => {
  // Mode: 'play' (thi đấu) or 'edit' (soạn câu hỏi)
  const [activeTab, setActiveTab] = useState<'play' | 'edit'>('play');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answeredState, setAnsweredState] = useState<'idle' | 'correct' | 'wrong' | 'timeout'>('idle');
  const [timeLeft, setTimeLeft] = useState<number>(QUESTION_TIME_LIMIT);
  const [penaltyCountdown, setPenaltyCountdown] = useState<number | null>(null);
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);

  // Edit mode active question index
  const [activeEditIndex, setActiveEditIndex] = useState<number>(0);
  const [showPresetPicker, setShowPresetPicker] = useState(false);

  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const penaltyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoNextTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Current question for play mode
  const currentQ: Question = team.questions[team.currentQuestionIndex] || {
    id: `default_${team.id}`,
    question: 'Hãy nhập câu hỏi cho đội này!',
    options: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
    correctIndex: 0,
    explanation: '',
  };

  const safeOptions: [string, string, string, string] = [
    currentQ.options?.[0] || 'Đáp án A',
    currentQ.options?.[1] || 'Đáp án B',
    currentQ.options?.[2] || 'Đáp án C',
    currentQ.options?.[3] || 'Đáp án D',
  ];

  // Local draft for edit form
  const [editDraft, setEditDraft] = useState<Question>({ ...currentQ });

  // Reset all timers and state on question change or game reset
  useEffect(() => {
    setSelectedOption(null);
    setAnsweredState('idle');
    setTimeLeft(QUESTION_TIME_LIMIT);
    setPenaltyCountdown(null);
    setAutoAdvanceCountdown(null);

    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
    if (penaltyTimerRef.current) {
      clearInterval(penaltyTimerRef.current);
      penaltyTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (autoNextTimeoutRef.current) {
      clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = null;
    }
    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current);
      botTimerRef.current = null;
    }
  }, [team.currentQuestionIndex, team.score, team.isFinished]);

  // Keep edit draft in sync with activeEditIndex
  useEffect(() => {
    const qToEdit = team.questions[activeEditIndex];
    if (qToEdit) {
      setEditDraft({ ...qToEdit });
    }
  }, [activeEditIndex, team.questions]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
      if (penaltyTimerRef.current) clearInterval(penaltyTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, []);

  // 10-Second Question Countdown Timer
  useEffect(() => {
    if (
      disabled ||
      team.isFinished ||
      activeTab !== 'play' ||
      !isTurn ||
      answeredState !== 'idle'
    ) {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
        questionTimerRef.current = null;
      }
      return;
    }

    const startTime = Date.now();
    const startingRemaining = QUESTION_TIME_LIMIT;
    setTimeLeft(startingRemaining);

    questionTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, startingRemaining - elapsed);
      setTimeLeft(Math.round(remaining * 10) / 10);

      if (remaining <= 0) {
        if (questionTimerRef.current) {
          clearInterval(questionTimerRef.current);
          questionTimerRef.current = null;
        }
        handleQuestionTimeout();
      }
    }, 100);

    return () => {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
        questionTimerRef.current = null;
      }
    };
  }, [
    team.currentQuestionIndex,
    disabled,
    team.isFinished,
    activeTab,
    isTurn,
    answeredState,
  ]);

  // Bot Auto-Think & Answer
  useEffect(() => {
    if (
      !team.isBot ||
      disabled ||
      team.isFinished ||
      activeTab !== 'play' ||
      !isTurn ||
      answeredState !== 'idle' ||
      penaltyCountdown !== null
    ) {
      if (botTimerRef.current) {
        clearTimeout(botTimerRef.current);
        botTimerRef.current = null;
      }
      return;
    }

    const difficulty = team.botDifficulty || 'medium';

    // Thinking time in milliseconds:
    // Easy: 3.5s - 6.5s, 52% correct
    // Medium: 2.5s - 5.0s, 72% correct
    // Hard: 1.5s - 3.2s, 88% correct
    let minMs = 2500;
    let maxMs = 5000;
    let accuracy = 0.72;

    if (difficulty === 'easy') {
      minMs = 3500;
      maxMs = 6500;
      accuracy = 0.52;
    } else if (difficulty === 'hard') {
      minMs = 1500;
      maxMs = 3200;
      accuracy = 0.88;
    }

    const thinkMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

    botTimerRef.current = setTimeout(() => {
      const willBeCorrect = Math.random() < accuracy;
      let chosenIdx: number;

      if (willBeCorrect) {
        chosenIdx = currentQ.correctIndex;
      } else {
        const wrongIndices = [0, 1, 2, 3].filter((i) => i !== currentQ.correctIndex);
        chosenIdx = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
      }

      handleSelectOption(chosenIdx);
    }, thinkMs);

    return () => {
      if (botTimerRef.current) {
        clearTimeout(botTimerRef.current);
        botTimerRef.current = null;
      }
    };
  }, [
    team.isBot,
    team.botDifficulty,
    team.currentQuestionIndex,
    disabled,
    team.isFinished,
    activeTab,
    isTurn,
    answeredState,
    penaltyCountdown,
    currentQ.correctIndex,
  ]);

  // Handler when 10 seconds runs out without answering
  const handleQuestionTimeout = () => {
    if (disabled || team.isFinished || answeredState !== 'idle') return;

    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current);
      botTimerRef.current = null;
    }

    setAnsweredState('timeout');
    setTimeLeft(0);
    soundManager.playWrong();

    // Call onAnswer with -1 (marks as wrong answer, penalty rope pull, streak reset)
    onAnswer(team.id, -1);

    // Start 5-second mandatory waiting penalty
    setPenaltyCountdown(TIMEOUT_PENALTY_SECONDS);
    const penaltyStartTime = Date.now();

    if (penaltyTimerRef.current) clearInterval(penaltyTimerRef.current);
    penaltyTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - penaltyStartTime) / 1000;
      const remaining = Math.max(0, TIMEOUT_PENALTY_SECONDS - elapsed);
      const ceilRemaining = Math.ceil(remaining);
      setPenaltyCountdown(ceilRemaining);

      if (remaining <= 0) {
        if (penaltyTimerRef.current) {
          clearInterval(penaltyTimerRef.current);
          penaltyTimerRef.current = null;
        }
        proceedToNextQuestion();
      }
    }, 100);
  };

  const handleSelectOption = (idx: number) => {
    if (
      disabled ||
      answeredState !== 'idle' ||
      team.isFinished ||
      penaltyCountdown !== null
    )
      return;

    // Stop bot timer immediately
    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current);
      botTimerRef.current = null;
    }

    // Stop the 10s timer immediately
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }

    setSelectedOption(idx);
    const isCorrect = idx === currentQ.correctIndex;

    if (isCorrect) {
      setAnsweredState('correct');
      soundManager.playCorrect();
    } else {
      setAnsweredState('wrong');
      soundManager.playWrong();
    }

    onAnswer(team.id, idx);

    // Auto advance after 1.8s
    const durationSec = 1.8;
    setAutoAdvanceCountdown(durationSec);

    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);

    const startTime = Date.now();
    countdownTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, durationSec - elapsed);
      setAutoAdvanceCountdown(Math.round(remaining * 10) / 10);
      if (remaining <= 0 && countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    }, 100);

    autoNextTimeoutRef.current = setTimeout(() => {
      proceedToNextQuestion();
    }, durationSec * 1000);
  };

  const proceedToNextQuestion = () => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    if (penaltyTimerRef.current) clearInterval(penaltyTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);

    setSelectedOption(null);
    setAnsweredState('idle');
    setTimeLeft(QUESTION_TIME_LIMIT);
    setPenaltyCountdown(null);
    setAutoAdvanceCountdown(null);

    onNextQuestion(team.id);
  };

  const handleSaveDraft = () => {
    soundManager.playClick();
    onUpdateQuestion(team.id, editDraft);
  };

  const handleAddNewQuestion = () => {
    soundManager.playClick();
    const newId = `q_${Date.now()}`;
    const newQ: Question = {
      id: newId,
      question: 'Nội dung câu hỏi mới...',
      options: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
      correctIndex: 0,
      explanation: '',
    };
    onAddQuestion(team.id, newQ);
    setActiveEditIndex(team.questions.length);
  };

  const totalQuestions = team.questions.length;
  const isLastQuestion = team.currentQuestionIndex === totalQuestions - 1;

  return (
    <div
      className={`w-full h-full flex flex-col bg-stone-900 border rounded-2xl shadow-lg transition-all duration-300 ${
        isTurn ? 'ring-2 ring-offset-2 ring-offset-stone-950 border-stone-600' : 'border-stone-800'
      }`}
      style={{
        borderColor: isTurn ? team.color.hex : undefined,
      }}
    >
      {/* 1. Sleek Header: Team Info & Action */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-stone-800 bg-stone-950/40 rounded-t-2xl">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-lg shadow-sm border border-white/20 shrink-0"
            style={{ backgroundColor: team.color.hex }}
          >
            {team.mascot}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-stone-100 truncate">
                {team.name}
              </h3>
              {team.isBot ? (
                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-cyan-950/90 border border-cyan-500/60 text-cyan-300 font-bold">
                  <Bot className="w-3 h-3" />
                  <span>AI ({team.botDifficulty === 'easy' ? 'Dễ' : team.botDifficulty === 'hard' ? 'Khó' : 'Vừa'})</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenColorPicker(team.id)}
                  className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
                  title="Đổi màu sắc & linh vật"
                >
                  <Palette className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="text-xs text-stone-400 font-mono">
              Điểm: <span className="font-bold text-stone-200">{team.score}</span>
            </div>
          </div>
        </div>

        {/* Clean Mode Switcher (Thi Đấu / Soạn Hỏi) */}
        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            setActiveTab(activeTab === 'play' ? 'edit' : 'play');
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
        >
          {activeTab === 'play' ? (
            <>
              <Edit3 className="w-3.5 h-3.5 text-stone-400" />
              <span>Soạn hỏi</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Thi đấu</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Board Body */}
      <div className="p-4 flex flex-col justify-between gap-3 flex-1 min-h-[380px]">
        {activeTab === 'play' ? (
          team.isFinished ? (
            /* COMPLETED STATE */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-3 bg-stone-950/40 rounded-xl border border-stone-800">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md"
                style={{ backgroundColor: team.color.hex }}
              >
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-stone-100">
                  {team.name} Đã Hoàn Thành!
                </h4>
                <p className="text-xs text-stone-400 mt-1">
                  Đã trả lời xong {totalQuestions} câu hỏi.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono pt-1">
                <span className="text-emerald-400 font-bold">
                  ✓ {team.correctAnswersCount} đúng
                </span>
                <span className="text-rose-400 font-bold">
                  ✗ {team.wrongAnswersCount} sai
                </span>
              </div>
            </div>
          ) : (
            /* ACTIVE PLAY STATE */
            <div className="flex-1 flex flex-col justify-between gap-3">
              {/* Minimalist Progress Header: Step 1 to 10 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span className="font-bold text-stone-200">
                    Câu {team.currentQuestionIndex + 1} / {totalQuestions}
                  </span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-emerald-400 font-bold">
                      ✓ {team.correctAnswersCount}
                    </span>
                    <span className="text-rose-400 font-bold">
                      ✗ {team.wrongAnswersCount}
                    </span>
                  </div>
                </div>

                {/* Sleek Segmented Progress Bar */}
                <div className="flex items-center gap-1 w-full">
                  {team.questions.map((q, idx) => {
                    const status = team.answeredHistory?.[idx];
                    const isCurrent = idx === team.currentQuestionIndex;

                    let barColor = 'bg-stone-800';
                    if (status === 'correct') barColor = 'bg-emerald-500';
                    else if (status === 'wrong') barColor = 'bg-rose-500';
                    else if (isCurrent) barColor = 'bg-stone-300 ring-1 ring-white';

                    return (
                      <div
                        key={q.id || `seg-${idx}`}
                        className={`h-1.5 rounded-full flex-1 transition-all ${barColor}`}
                        title={`Câu ${idx + 1}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* 10s Countdown Timer Bar */}
              <div className="bg-stone-950/60 p-2 rounded-xl border border-stone-800/90 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Timer
                      className={`w-3.5 h-3.5 transition-colors ${
                        answeredState === 'timeout'
                          ? 'text-rose-500'
                          : timeLeft <= 3
                          ? 'text-rose-400 animate-pulse'
                          : timeLeft <= 5
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    />
                    <span className="text-[11px] text-stone-400">Thời gian trả lời:</span>
                    <span
                      className={`font-mono text-xs font-bold px-1.5 py-0.2 rounded border transition-colors ${
                        answeredState === 'timeout'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                          : timeLeft <= 3
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                          : timeLeft <= 5
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {answeredState === 'timeout' ? '0s' : `${Math.ceil(timeLeft)}s`}
                    </span>
                  </div>

                  {penaltyCountdown !== null ? (
                    <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1 bg-rose-950/80 border border-rose-700/80 px-2 py-0.5 rounded-lg animate-pulse">
                      <Hourglass className="w-3 h-3 text-rose-400" />
                      <span>Phạt đợi: {penaltyCountdown}s</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-500 font-medium hidden sm:inline-block">
                      10s / câu
                    </span>
                  )}
                </div>

                {/* Smooth 10s depletion bar */}
                <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                  <div
                    className={`h-full transition-all duration-150 rounded-full ${
                      answeredState === 'timeout'
                        ? 'bg-rose-600'
                        : timeLeft <= 3
                        ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                        : timeLeft <= 5
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, (timeLeft / QUESTION_TIME_LIMIT) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Timeout Warning Card (When 10s expired without answering) */}
              {answeredState === 'timeout' && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/70 text-rose-100 space-y-2 shadow-lg animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                      <div>
                        <p className="font-black text-xs text-rose-200 tracking-tight">
                          ⏰ HẾT THỜI GIAN (10s)! BỊ TÍNH LÀ SAI!
                        </p>
                        <p className="text-[11px] text-rose-300/95 mt-0.5">
                          Đang phạt đợi thêm{' '}
                          <span className="font-bold font-mono text-white text-xs underline">
                            {penaltyCountdown ?? 0}s
                          </span>{' '}
                          nữa mới được qua câu tiếp theo!
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-rose-900/90 border border-rose-500/60 flex items-center justify-center font-mono font-black text-sm text-white shrink-0 shadow">
                      {penaltyCountdown ?? 0}
                    </div>
                  </div>

                  {/* 5-second Penalty Bar */}
                  <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-rose-900">
                    <div
                      className="h-full bg-rose-400 transition-all duration-150 rounded-full"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            (((penaltyCountdown ?? 0)) / TIMEOUT_PENALTY_SECONDS) * 100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Bot Thinking Notification */}
              {team.isBot && answeredState === 'idle' && (
                <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 flex items-center justify-between text-xs shadow-sm animate-pulse">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold text-[11px] sm:text-xs">
                      Máy đang phân tích câu hỏi & suy nghĩ...
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-900/80 px-2 py-0.5 rounded border border-cyan-500/40 font-bold">
                    {team.botDifficulty === 'easy' ? 'Độ khó: Dễ' : team.botDifficulty === 'hard' ? 'Độ khó: Khó' : 'Độ khó: Vừa'}
                  </span>
                </div>
              )}

              {/* Clean Question Text Box */}
              <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-3.5 min-h-[75px] flex items-center shadow-inner">
                <p className="text-sm font-semibold text-stone-100 leading-snug">
                  {currentQ.question}
                </p>
              </div>

              {/* 4 Multiple Choice Option Cards (A, B, C, D) */}
              <div className="space-y-2">
                {safeOptions.map((opt, idx) => {
                  const letter = ['A', 'B', 'C', 'D'][idx];
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQ.correctIndex;

                  let cardStyle =
                    'bg-stone-800/80 hover:bg-stone-800 text-stone-200 border-stone-700/80 cursor-pointer';

                  if (answeredState === 'timeout') {
                    if (isCorrect) {
                      cardStyle =
                        'bg-emerald-950/70 text-emerald-200 border-emerald-500 font-bold';
                    } else {
                      cardStyle =
                        'opacity-25 bg-stone-900 text-stone-500 border-stone-800 cursor-not-allowed';
                    }
                  } else if (answeredState !== 'idle') {
                    if (isSelected && isCorrect) {
                      cardStyle = 'bg-emerald-600/90 text-white border-emerald-400 font-bold';
                    } else if (isSelected && !isCorrect) {
                      cardStyle = 'bg-rose-600/90 text-white border-rose-400 font-bold';
                    } else if (isCorrect) {
                      cardStyle = 'bg-emerald-950/70 text-emerald-200 border-emerald-500 font-bold';
                    } else {
                      cardStyle = 'opacity-30 bg-stone-900 text-stone-500 border-stone-800 cursor-not-allowed';
                    }
                  } else if (team.isBot) {
                    cardStyle = 'bg-stone-800/60 text-stone-300 border-stone-700/60 cursor-default';
                  }

                  return (
                    <button
                      key={`${currentQ.id}-opt-${idx}`}
                      type="button"
                      disabled={disabled || team.isBot || answeredState !== 'idle' || penaltyCountdown !== null}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${cardStyle}`}
                    >
                      <span
                        className="w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 shadow-sm"
                        style={{
                          backgroundColor: isSelected ? '#ffffff' : `${team.color.hex}22`,
                          color: isSelected ? team.color.hex : '#ffffff',
                        }}
                      >
                        {letter}
                      </span>
                      <span className="text-xs sm:text-sm font-medium flex-1 leading-snug">
                        {opt}
                      </span>
                      {isSelected && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                      )}
                      {isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-rose-200 shrink-0" />
                      )}
                      {answeredState === 'timeout' && isCorrect && (
                        <span className="text-[10px] uppercase font-bold text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-600">
                          Đáp án đúng
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback Prompt & Next Button */}
              {answeredState === 'timeout' ? (
                <div className="p-2.5 rounded-xl border border-rose-500/50 bg-rose-950/50 text-rose-200 flex items-center justify-between text-xs">
                  <span className="font-bold flex items-center gap-1.5 text-[11px] sm:text-xs">
                    <Hourglass className="w-3.5 h-3.5 animate-spin text-rose-400" />
                    <span>Đang phạt đợi: {penaltyCountdown ?? 0}s...</span>
                  </span>
                  <button
                    type="button"
                    disabled
                    className="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-400 font-bold flex items-center gap-1 cursor-not-allowed opacity-75 text-xs"
                  >
                    <span>Khóa {penaltyCountdown ?? 0}s</span>
                  </button>
                </div>
              ) : answeredState !== 'idle' ? (
                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                    answeredState === 'correct'
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                  }`}
                >
                  <span className="font-bold flex items-center gap-1.5">
                    {answeredState === 'correct' ? '✓ Đúng rồi! (+20)' : '✗ Chưa đúng!'}
                  </span>
                  <button
                    type="button"
                    onClick={proceedToNextQuestion}
                    className="px-2.5 py-1 rounded-lg bg-white text-stone-950 font-bold flex items-center gap-1 hover:bg-stone-200 transition-colors cursor-pointer"
                  >
                    <span>{isLastQuestion ? 'Hoàn thành' : 'Tiếp'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ) : team.isBot ? (
                <div className="text-[11px] text-cyan-400 text-center py-1 flex items-center justify-center gap-1.5 font-medium">
                  <Bot className="w-3.5 h-3.5 animate-pulse" />
                  <span>Máy tự động đưa ra quyết định sau vài giây suy nghĩ</span>
                </div>
              ) : (
                <div className="text-[11px] text-stone-500 text-center py-1 flex items-center justify-center gap-1.5">
                  <Clock className="w-3 h-3 text-amber-500/70" />
                  <span>Bạn có 10 giây để chọn đáp án đúng</span>
                </div>
              )}
            </div>
          )
        ) : (
          /* ================= EDIT & SOẠN CÂU HỎI MODE ================= */
          <div className="flex-1 flex flex-col justify-between gap-2.5 text-xs">
            {/* Question selector 1 to N */}
            <div className="flex items-center justify-between gap-1 pb-1 border-b border-stone-800">
              <div className="flex items-center gap-1 overflow-x-auto py-1">
                {team.questions.map((q, idx) => (
                  <button
                    key={q.id || `edit-sel-${idx}`}
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setActiveEditIndex(idx);
                      setEditDraft({ ...team.questions[idx] });
                    }}
                    className={`w-6 h-6 rounded-md font-mono font-bold text-xs shrink-0 transition-colors ${
                      activeEditIndex === idx
                        ? 'bg-stone-100 text-stone-950 shadow'
                        : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleAddNewQuestion}
                  className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-emerald-400 transition-colors"
                  title="Thêm câu hỏi"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                {team.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      onDeleteQuestion(team.id, team.questions[activeEditIndex]?.id);
                      setActiveEditIndex((prev) => Math.max(0, prev - 1));
                    }}
                    className="p-1 rounded bg-stone-800 hover:bg-rose-950 text-rose-400 transition-colors"
                    title="Xóa câu này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Edit inputs */}
            <div className="space-y-2">
              <div>
                <label className="text-stone-400 text-[11px] block mb-1">
                  Nội dung câu hỏi:
                </label>
                <textarea
                  rows={2}
                  value={editDraft.question}
                  onChange={(e) =>
                    setEditDraft({ ...editDraft, question: e.target.value })
                  }
                  placeholder="Nhập câu hỏi..."
                  className="w-full bg-stone-950 border border-stone-800 focus:border-stone-600 rounded-lg p-2 text-stone-200 placeholder-stone-600 resize-none outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-stone-400 text-[11px] block">
                  4 đáp án (click chữ cái để chọn đáp án đúng):
                </label>
                {editDraft.options.map((opt, idx) => {
                  const letter = ['A', 'B', 'C', 'D'][idx];
                  const isCorrect = editDraft.correctIndex === idx;

                  return (
                    <div
                      key={`edit-opt-${idx}`}
                      className={`flex items-center gap-2 p-1.5 rounded-lg border transition-colors ${
                        isCorrect
                          ? 'bg-emerald-950/40 border-emerald-500/80'
                          : 'bg-stone-950 border-stone-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          soundManager.playClick();
                          setEditDraft({ ...editDraft, correctIndex: idx });
                        }}
                        className={`w-6 h-6 rounded font-bold text-xs flex items-center justify-center shrink-0 ${
                          isCorrect
                            ? 'bg-emerald-500 text-white'
                            : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                        }`}
                        title="Đặt làm đáp án đúng"
                      >
                        {letter}
                      </button>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const next = [...editDraft.options] as [string, string, string, string];
                          next[idx] = e.target.value;
                          setEditDraft({ ...editDraft, options: next });
                        }}
                        placeholder={`Đáp án ${letter}...`}
                        className="w-full bg-transparent text-stone-100 placeholder-stone-600 outline-none text-xs"
                      />
                      {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mr-1" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Preset and Save actions */}
            <div className="pt-2 border-t border-stone-800 flex items-center justify-between gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPresetPicker(!showPresetPicker)}
                  className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center gap-1 font-medium transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Mẫu câu hỏi</span>
                </button>

                {showPresetPicker && (
                  <div className="absolute bottom-full left-0 mb-1.5 w-56 bg-stone-900 border border-stone-700 rounded-xl shadow-xl p-1.5 z-30 space-y-1">
                    {PRESET_QUESTION_PACKS.map((pack) => (
                      <button
                        key={pack.name}
                        type="button"
                        onClick={() => {
                          soundManager.playClick();
                          onLoadPreset(team.id, pack.questions);
                          setShowPresetPicker(false);
                        }}
                        className="w-full text-left p-1.5 rounded hover:bg-stone-800 text-xs text-stone-200 transition-colors"
                      >
                        <div className="font-bold text-stone-100">{pack.name}</div>
                        <div className="text-[10px] text-stone-400 truncate">{pack.description}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSaveDraft();
                    setActiveTab('play');
                  }}
                  className="px-2.5 py-1 rounded bg-white text-stone-950 font-bold hover:bg-stone-200 transition-colors"
                >
                  Đấu ngay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
