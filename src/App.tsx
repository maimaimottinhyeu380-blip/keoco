import React, { useState } from 'react';
import { Header, MainTab } from './components/Header';
import { TugOfWarArena } from './components/TugOfWarArena';
import { TeamQuizBoard } from './components/TeamQuizBoard';
import { TeamSetupModal } from './components/TeamSetupModal';
import { VictoryModal } from './components/VictoryModal';
import { QuestionManager } from './components/QuestionManager';
import { TeamData, TeamColor, Question, GameSettings } from './types';
import {
  TEAM_COLORS,
  TEAM_MASCOTS,
  INITIAL_QUESTIONS_A,
  INITIAL_QUESTIONS_B,
} from './data/gameData';
import { soundManager } from './utils/audio';

export default function App() {
  // Main Tab: 'arena' (Thi đấu kéo co) or 'questions' (Quản lý câu hỏi)
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('arena');

  // Game Settings
  const [settings, setSettings] = useState<GameSettings>({
    maxDistance: 100, // win threshold at -100 (Team A) or +100 (Team B)
    stepPerCorrect: 20, // rope movement per correct answer
    penaltyPerWrong: 8, // slight slippage per wrong answer
    timeLimit: 0,
    soundEnabled: true,
    gameMode: 'simultaneous',
  });

  // Team A State (Left)
  const [teamA, setTeamA] = useState<TeamData>({
    id: 'teamA',
    name: 'Đội Đỏ Chiến Binh',
    color: TEAM_COLORS[0], // Red
    mascot: TEAM_MASCOTS[0].icon, // Lion
    questions: [...INITIAL_QUESTIONS_A],
    currentQuestionIndex: 0,
    score: 0,
    correctAnswersCount: 0,
    wrongAnswersCount: 0,
    streak: 0,
    lastAction: null,
    answeredHistory: Array(INITIAL_QUESTIONS_A.length).fill(null),
    isFinished: false,
  });

  // Team B State (Right)
  const [teamB, setTeamB] = useState<TeamData>({
    id: 'teamB',
    name: 'Đội Xanh Sấm Sét',
    color: TEAM_COLORS[1], // Blue
    mascot: TEAM_MASCOTS[1].icon, // Tiger
    questions: [...INITIAL_QUESTIONS_B],
    currentQuestionIndex: 0,
    score: 0,
    correctAnswersCount: 0,
    wrongAnswersCount: 0,
    streak: 0,
    lastAction: null,
    answeredHistory: Array(INITIAL_QUESTIONS_B.length).fill(null),
    isFinished: false,
  });

  // Arena rope displacement: negative is toward Team A (left), positive toward Team B (right)
  const [ropePosition, setRopePosition] = useState<number>(0);
  const [winner, setWinner] = useState<'teamA' | 'teamB' | null>(null);
  const [lastPullTeam, setLastPullTeam] = useState<'teamA' | 'teamB' | null>(null);
  const [turn, setTurn] = useState<'teamA' | 'teamB'>('teamA');

  // Modal controls
  const [isTeamSetupOpen, setIsTeamSetupOpen] = useState(false);
  const [targetSetupTeam, setTargetSetupTeam] = useState<'teamA' | 'teamB' | 'both'>('both');

  // Handle player answering the current question (shifts rope, plays sounds, updates stats)
  const handleAnswer = (teamId: 'teamA' | 'teamB', optionIndex: number) => {
    if (winner) return;

    const isTeamA = teamId === 'teamA';
    const currentTeam = isTeamA ? teamA : teamB;
    const currentQIndex = currentTeam.currentQuestionIndex;
    const currentQ = currentTeam.questions[currentQIndex];
    if (!currentQ) return;

    const isCorrect = optionIndex === currentQ.correctIndex;

    if (isCorrect) {
      // Correct answer! Pull rope toward this team
      soundManager.playPull();
      setLastPullTeam(teamId);

      // Shift rope: Team A pulls negative, Team B pulls positive
      const shift = isTeamA ? -settings.stepPerCorrect : settings.stepPerCorrect;
      setRopePosition((prev) => {
        const next = prev + shift;
        // Check immediate rope threshold victory
        if (next <= -settings.maxDistance) {
          setTimeout(() => {
            soundManager.playVictory();
            setWinner('teamA');
          }, 300);
          return -settings.maxDistance;
        } else if (next >= settings.maxDistance) {
          setTimeout(() => {
            soundManager.playVictory();
            setWinner('teamB');
          }, 300);
          return settings.maxDistance;
        }
        return next;
      });

      // Update team stats (does not change currentQuestionIndex until user proceeds)
      const updateFn = (prev: TeamData): TeamData => {
        const nextHistory = [...prev.answeredHistory];
        nextHistory[currentQIndex] = 'correct';
        return {
          ...prev,
          score: prev.score + settings.stepPerCorrect,
          correctAnswersCount: prev.correctAnswersCount + 1,
          streak: prev.streak + 1,
          lastAction: 'correct',
          answeredHistory: nextHistory,
        };
      };

      if (isTeamA) setTeamA(updateFn);
      else setTeamB(updateFn);

      // Clear pull animation indicator after delay
      setTimeout(() => setLastPullTeam(null), 700);
    } else {
      // Wrong answer! Rope slips slightly in favor of the other team
      const penaltyShift = isTeamA ? settings.penaltyPerWrong : -settings.penaltyPerWrong;
      setRopePosition((prev) => {
        const next = Math.max(-settings.maxDistance, Math.min(settings.maxDistance, prev + penaltyShift));
        return next;
      });

      const updateFn = (prev: TeamData): TeamData => {
        const nextHistory = [...prev.answeredHistory];
        nextHistory[currentQIndex] = 'wrong';
        return {
          ...prev,
          wrongAnswersCount: prev.wrongAnswersCount + 1,
          streak: 0,
          lastAction: 'wrong',
          answeredHistory: nextHistory,
        };
      };

      if (isTeamA) setTeamA(updateFn);
      else setTeamB(updateFn);
    }
  };

  // Move to next question sequentially after answering
  const handleNextQuestion = (teamId: 'teamA' | 'teamB') => {
    if (winner) return;

    const isTeamA = teamId === 'teamA';
    const currentTeam = isTeamA ? teamA : teamB;
    const nextIndex = currentTeam.currentQuestionIndex + 1;

    if (nextIndex < currentTeam.questions.length) {
      if (isTeamA) {
        setTeamA((prev) => ({
          ...prev,
          currentQuestionIndex: nextIndex,
          lastAction: null,
        }));
      } else {
        setTeamB((prev) => ({
          ...prev,
          currentQuestionIndex: nextIndex,
          lastAction: null,
        }));
      }
    } else {
      // Team has completed all 10 questions!
      const finishFn = (prev: TeamData): TeamData => ({
        ...prev,
        isFinished: true,
        lastAction: null,
      });

      if (isTeamA) setTeamA(finishFn);
      else setTeamB(finishFn);

      // "Bên nào về trước là thắng":
      // If team finishes 10 questions and holds the advantage (rope on their side):
      setTimeout(() => {
        checkFinishVictory(teamId);
      }, 350);
    }

    // Switch turn if in turn-based mode
    if (settings.gameMode === 'turn_based') {
      setTurn((prev) => (prev === 'teamA' ? 'teamB' : 'teamA'));
    }
  };

  // Evaluate victory condition when a team finishes or both finish
  const checkFinishVictory = (justFinishedTeamId: 'teamA' | 'teamB') => {
    if (winner) return;

    const isTeamA = justFinishedTeamId === 'teamA';
    // If the team finished 10 questions and has pulled the rope to their side:
    if (isTeamA && ropePosition < 0) {
      soundManager.playVictory();
      setWinner('teamA');
      return;
    }
    if (!isTeamA && ropePosition > 0) {
      soundManager.playVictory();
      setWinner('teamB');
      return;
    }

    // If both teams have finished:
    const otherTeam = isTeamA ? teamB : teamA;
    if (otherTeam.isFinished) {
      soundManager.playVictory();
      if (ropePosition < 0) setWinner('teamA');
      else if (ropePosition > 0) setWinner('teamB');
      else {
        // Tie breaker by correct count
        if (teamA.correctAnswersCount > teamB.correctAnswersCount) setWinner('teamA');
        else if (teamB.correctAnswersCount > teamA.correctAnswersCount) setWinner('teamB');
        else setWinner(isTeamA ? 'teamA' : 'teamB');
      }
    }
  };

  // Question editing / fill-in handlers
  const handleUpdateQuestion = (teamId: 'teamA' | 'teamB', updatedQuestion: Question) => {
    if (teamId === 'teamA') {
      setTeamA((prev) => ({
        ...prev,
        questions: prev.questions.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q)),
      }));
    } else {
      setTeamB((prev) => ({
        ...prev,
        questions: prev.questions.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q)),
      }));
    }
  };

  const handleAddQuestion = (teamId: 'teamA' | 'teamB', newQuestion: Question) => {
    if (teamId === 'teamA') {
      setTeamA((prev) => ({
        ...prev,
        questions: [...prev.questions, newQuestion],
        answeredHistory: [...prev.answeredHistory, null],
        currentQuestionIndex: prev.questions.length,
      }));
    } else {
      setTeamB((prev) => ({
        ...prev,
        questions: [...prev.questions, newQuestion],
        answeredHistory: [...prev.answeredHistory, null],
        currentQuestionIndex: prev.questions.length,
      }));
    }
  };

  const handleAddQuestionFromManager = (
    target: 'teamA' | 'teamB' | 'both',
    newQuestion: Question
  ) => {
    if (target === 'teamA' || target === 'both') {
      setTeamA((prev) => ({
        ...prev,
        questions: [...prev.questions, newQuestion],
        answeredHistory: [...prev.answeredHistory, null],
      }));
    }
    if (target === 'teamB' || target === 'both') {
      const qB =
        target === 'both'
          ? { ...newQuestion, id: `${newQuestion.id}_b` }
          : newQuestion;
      setTeamB((prev) => ({
        ...prev,
        questions: [...prev.questions, qB],
        answeredHistory: [...prev.answeredHistory, null],
      }));
    }
  };

  const handleDeleteQuestion = (teamId: 'teamA' | 'teamB', questionId: string) => {
    if (teamId === 'teamA') {
      setTeamA((prev) => {
        const nextQ = prev.questions.filter((q) => q.id !== questionId);
        return {
          ...prev,
          questions: nextQ,
          currentQuestionIndex: Math.min(prev.currentQuestionIndex, Math.max(0, nextQ.length - 1)),
          answeredHistory: prev.answeredHistory.slice(0, nextQ.length),
        };
      });
    } else {
      setTeamB((prev) => {
        const nextQ = prev.questions.filter((q) => q.id !== questionId);
        return {
          ...prev,
          questions: nextQ,
          currentQuestionIndex: Math.min(prev.currentQuestionIndex, Math.max(0, nextQ.length - 1)),
          answeredHistory: prev.answeredHistory.slice(0, nextQ.length),
        };
      });
    }
  };

  const handleLoadPreset = (teamId: 'teamA' | 'teamB', questions: Question[]) => {
    if (teamId === 'teamA') {
      setTeamA((prev) => ({
        ...prev,
        questions: [...questions],
        currentQuestionIndex: 0,
        answeredHistory: Array(questions.length).fill(null),
        isFinished: false,
      }));
    } else {
      setTeamB((prev) => ({
        ...prev,
        questions: [...questions],
        currentQuestionIndex: 0,
        answeredHistory: Array(questions.length).fill(null),
        isFinished: false,
      }));
    }
  };

  const handleUpdateTeam = (
    teamId: 'teamA' | 'teamB',
    name: string,
    color: TeamColor,
    mascot: string
  ) => {
    if (teamId === 'teamA') {
      setTeamA((prev) => ({ ...prev, name, color, mascot }));
    } else {
      setTeamB((prev) => ({ ...prev, name, color, mascot }));
    }
  };

  const handleOpenColorPicker = (teamId: 'teamA' | 'teamB') => {
    setTargetSetupTeam(teamId);
    setIsTeamSetupOpen(true);
  };

  const handleResetGame = () => {
    setRopePosition(0);
    setWinner(null);
    setLastPullTeam(null);
    setTeamA((prev) => ({
      ...prev,
      score: 0,
      correctAnswersCount: 0,
      wrongAnswersCount: 0,
      streak: 0,
      currentQuestionIndex: 0,
      lastAction: null,
      answeredHistory: Array(prev.questions.length).fill(null),
      isFinished: false,
    }));
    setTeamB((prev) => ({
      ...prev,
      score: 0,
      correctAnswersCount: 0,
      wrongAnswersCount: 0,
      streak: 0,
      currentQuestionIndex: 0,
      lastAction: null,
      answeredHistory: Array(prev.questions.length).fill(null),
      isFinished: false,
    }));
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col selection:bg-amber-500 selection:text-stone-950">
      {/* App Header */}
      <Header
        activeTab={activeMainTab}
        onTabChange={setActiveMainTab}
        teamACount={teamA.questions.length}
        teamBCount={teamB.questions.length}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
        onOpenTeamSetup={() => {
          setTargetSetupTeam('both');
          setIsTeamSetupOpen(true);
        }}
        onResetGame={handleResetGame}
      />

      {/* Main Content: Question Manager OR Tug-of-War Arena */}
      {activeMainTab === 'questions' ? (
        <main className="flex-1 w-full flex flex-col py-2">
          <QuestionManager
            teamA={teamA}
            teamB={teamB}
            onAddQuestion={handleAddQuestionFromManager}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onLoadPreset={handleLoadPreset}
            onSwitchToArena={() => setActiveMainTab('arena')}
          />
        </main>
      ) : (
        /* Main Game Container: Questions on both sides and Tug-of-War in the middle - strictly on ONE horizontal row */
        <main className="flex-1 max-w-[1880px] w-full mx-auto p-2 sm:p-3 lg:p-4 overflow-x-auto">
          <div className="flex flex-row items-stretch justify-center gap-2.5 sm:gap-3.5 lg:gap-4 min-w-[760px] 2xl:min-w-0 w-full">
            {/* Team A Quiz Board (Left Side) */}
            <section
              aria-label="Bảng câu hỏi Đội A"
              className="w-[260px] sm:w-[290px] md:w-[320px] lg:w-[350px] xl:w-[370px] shrink-0 flex flex-col"
            >
              <TeamQuizBoard
                team={teamA}
                onAnswer={handleAnswer}
                onNextQuestion={handleNextQuestion}
                onUpdateQuestion={handleUpdateQuestion}
                onAddQuestion={handleAddQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onLoadPreset={handleLoadPreset}
                onOpenColorPicker={handleOpenColorPicker}
                disabled={Boolean(winner)}
                isTurn={settings.gameMode === 'simultaneous' || turn === 'teamA'}
              />
            </section>

            {/* Center: Tug-of-War Stadium Arena (In the Middle) */}
            <section
              aria-label="Sân thi đấu kéo co ở giữa"
              className="flex-1 min-w-[280px] sm:min-w-[340px] md:min-w-[380px] flex flex-col"
            >
              <TugOfWarArena
                teamA={teamA}
                teamB={teamB}
                ropePosition={ropePosition}
                maxDistance={settings.maxDistance}
                winner={winner}
                lastPullTeam={lastPullTeam}
              />
            </section>

            {/* Team B Quiz Board (Right Side) */}
            <section
              aria-label="Bảng câu hỏi Đội B"
              className="w-[260px] sm:w-[290px] md:w-[320px] lg:w-[350px] xl:w-[370px] shrink-0 flex flex-col"
            >
              <TeamQuizBoard
                team={teamB}
                onAnswer={handleAnswer}
                onNextQuestion={handleNextQuestion}
                onUpdateQuestion={handleUpdateQuestion}
                onAddQuestion={handleAddQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onLoadPreset={handleLoadPreset}
                onOpenColorPicker={handleOpenColorPicker}
                disabled={Boolean(winner)}
                isTurn={settings.gameMode === 'simultaneous' || turn === 'teamB'}
              />
            </section>
          </div>
        </main>
      )}

      {/* Team Color & Profile Setup Modal */}
      <TeamSetupModal
        isOpen={isTeamSetupOpen}
        onClose={() => setIsTeamSetupOpen(false)}
        teamA={teamA}
        teamB={teamB}
        targetTeamId={targetSetupTeam}
        onUpdateTeam={handleUpdateTeam}
      />

      {/* Victory Celebration Modal */}
      <VictoryModal
        winner={winner}
        teamA={teamA}
        teamB={teamB}
        onRematch={handleResetGame}
        onContinue={() => setWinner(null)}
      />
    </div>
  );
}
