import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Check,
  Search,
  Copy,
  RotateCcw,
  FileText,
  Sparkles,
  X,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Question, TeamData } from '../types';
import { PRESET_QUESTION_PACKS, INITIAL_QUESTIONS_A, INITIAL_QUESTIONS_B } from '../data/gameData';
import { soundManager } from '../utils/audio';

interface QuestionManagerProps {
  teamA: TeamData;
  teamB: TeamData;
  onAddQuestion: (target: 'teamA' | 'teamB' | 'both', newQuestion: Question) => void;
  onUpdateQuestion: (teamId: 'teamA' | 'teamB', updatedQuestion: Question) => void;
  onDeleteQuestion: (teamId: 'teamA' | 'teamB', questionId: string) => void;
  onLoadPreset: (teamId: 'teamA' | 'teamB', questions: Question[]) => void;
  onSwitchToArena: () => void;
}

interface QuestionFormData {
  id?: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  targetTeam: 'teamA' | 'teamB' | 'both';
}

const EMPTY_FORM: QuestionFormData = {
  question: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  explanation: '',
  targetTeam: 'both',
};

export const QuestionManager: React.FC<QuestionManagerProps> = ({
  teamA,
  teamB,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onLoadPreset,
  onSwitchToArena,
}) => {
  // Selected team tab in manager: 'teamA' or 'teamB'
  const [selectedTeam, setSelectedTeam] = useState<'teamA' | 'teamB'>('teamA');
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation state
  const [questionToDelete, setQuestionToDelete] = useState<{ id: string; text: string } | null>(null);

  // Preset selector modal
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const activeTeamData = selectedTeam === 'teamA' ? teamA : teamB;
  const otherTeamData = selectedTeam === 'teamA' ? teamB : teamA;

  // Filter questions based on search query
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return activeTeamData.questions;
    const q = searchQuery.toLowerCase().trim();
    return activeTeamData.questions.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.options.some((opt) => opt.toLowerCase().includes(q)) ||
        (item.explanation && item.explanation.toLowerCase().includes(q))
    );
  }, [activeTeamData.questions, searchQuery]);

  // Open modal to add a new question
  const handleOpenAddModal = () => {
    soundManager.playClick();
    setEditingQuestionId(null);
    setFormData({
      ...EMPTY_FORM,
      targetTeam: selectedTeam,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open modal to edit an existing question
  const handleOpenEditModal = (q: Question) => {
    soundManager.playClick();
    setEditingQuestionId(q.id);
    setFormData({
      id: q.id,
      question: q.question,
      options: [...q.options] as [string, string, string, string],
      correctIndex: q.correctIndex,
      explanation: q.explanation || '',
      targetTeam: selectedTeam,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  // Save Add or Edit question
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question.trim()) {
      setFormError('Vui lòng nhập nội dung câu hỏi!');
      return;
    }

    if (formData.options.some((opt) => !opt.trim())) {
      setFormError('Vui lòng điền đầy đủ cả 4 phương án A, B, C, D!');
      return;
    }

    soundManager.playClick();

    if (editingQuestionId) {
      // Edit mode: updates the question in the currently selected team
      const updatedQuestion: Question = {
        id: editingQuestionId,
        question: formData.question.trim(),
        options: formData.options.map((o) => o.trim()) as [string, string, string, string],
        correctIndex: formData.correctIndex,
        explanation: formData.explanation.trim() || undefined,
      };

      onUpdateQuestion(selectedTeam, updatedQuestion);
      showToast('Đã cập nhật câu hỏi thành công!');
    } else {
      // Add mode: can add to teamA, teamB, or both
      const newQuestion: Question = {
        id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        question: formData.question.trim(),
        options: formData.options.map((o) => o.trim()) as [string, string, string, string],
        correctIndex: formData.correctIndex,
        explanation: formData.explanation.trim() || undefined,
      };

      onAddQuestion(formData.targetTeam, newQuestion);
      showToast(
        formData.targetTeam === 'both'
          ? 'Đã thêm câu hỏi vào cả 2 đội!'
          : `Đã thêm câu hỏi vào ${formData.targetTeam === 'teamA' ? teamA.name : teamB.name}!`
      );
    }

    setIsFormOpen(false);
  };

  // Confirm delete question
  const handleConfirmDelete = () => {
    if (!questionToDelete) return;
    soundManager.playClick();

    if (activeTeamData.questions.length <= 1) {
      alert('Đội cần ít nhất 1 câu hỏi để có thể thi đấu!');
      setQuestionToDelete(null);
      return;
    }

    onDeleteQuestion(selectedTeam, questionToDelete.id);
    showToast('Đã xóa câu hỏi thành công!');
    setQuestionToDelete(null);
  };

  // Copy questions from current team to other team
  const handleCopyQuestionsToOtherTeam = () => {
    soundManager.playClick();
    const otherTeamId = selectedTeam === 'teamA' ? 'teamB' : 'teamA';
    const otherTeamName = selectedTeam === 'teamA' ? teamB.name : teamA.name;

    if (
      window.confirm(
        `Bạn có chắc chắn muốn sao chép toàn bộ ${activeTeamData.questions.length} câu hỏi của ${activeTeamData.name} sang ${otherTeamName}? (Bộ câu hỏi hiện tại của ${otherTeamName} sẽ được thay thế)`
      )
    ) {
      const clonedQuestions: Question[] = activeTeamData.questions.map((q) => ({
        ...q,
        id: `clone_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      }));
      onLoadPreset(otherTeamId, clonedQuestions);
      showToast(`Đã sao chép sang ${otherTeamName}!`);
    }
  };

  // Reset to default questions
  const handleResetToDefault = () => {
    soundManager.playClick();
    if (
      window.confirm(
        `Bạn có chắc chắn muốn khôi phục bộ 10 câu hỏi mặc định cho ${activeTeamData.name}?`
      )
    ) {
      const defaultQ = selectedTeam === 'teamA' ? INITIAL_QUESTIONS_A : INITIAL_QUESTIONS_B;
      onLoadPreset(selectedTeam, defaultQ);
      showToast(`Đã khôi phục câu hỏi mặc định cho ${activeTeamData.name}!`);
    }
  };

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl font-semibold text-sm animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner: Navigation & Title */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Quản Lý Bộ Câu Hỏi
              <span className="text-xs font-normal text-stone-400 bg-stone-800 px-2 py-0.5 rounded-md border border-stone-700">
                Thêm • Sửa • Xóa
              </span>
            </h2>
            <p className="text-xs text-stone-400">
              Tùy chỉnh danh sách câu hỏi trắc nghiệm cho Đội Đỏ và Đội Xanh khi thi đấu kéo co
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm câu hỏi mới</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPresetModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-all cursor-pointer"
            title="Chọn bộ câu hỏi có sẵn"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Gói câu hỏi mẫu</span>
          </button>

          <button
            type="button"
            onClick={onSwitchToArena}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-emerald-600 text-stone-200 hover:text-white text-xs font-bold border border-stone-700 hover:border-emerald-500 transition-all cursor-pointer ml-auto md:ml-0"
          >
            <span>Vào thi đấu</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Team Tabs & Quick Utilities */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Team Selector Switcher */}
        <div className="flex items-center gap-2 bg-stone-900/90 border border-stone-800 p-1.5 rounded-xl">
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setSelectedTeam('teamA');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedTeam === 'teamA'
                ? 'bg-stone-800 text-white shadow-sm border border-stone-700'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: teamA.color.hex }}
            />
            <span className="truncate max-w-[120px] sm:max-w-none">{teamA.name}</span>
            <span className="bg-stone-700 text-stone-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {teamA.questions.length} câu
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setSelectedTeam('teamB');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedTeam === 'teamB'
                ? 'bg-stone-800 text-white shadow-sm border border-stone-700'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: teamB.color.hex }}
            />
            <span className="truncate max-w-[120px] sm:max-w-none">{teamB.name}</span>
            <span className="bg-stone-700 text-stone-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {teamB.questions.length} câu
            </span>
          </button>
        </div>

        {/* Quick Utilities: Search & Clone */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm câu hỏi, đáp án..."
              className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-8 pr-8 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Copy to other team */}
          <button
            type="button"
            onClick={handleCopyQuestionsToOtherTeam}
            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition-all cursor-pointer"
            title={`Sao chép toàn bộ câu hỏi sang ${otherTeamData.name}`}
          >
            <Copy className="w-4 h-4" />
          </button>

          {/* Reset button */}
          <button
            type="button"
            onClick={handleResetToDefault}
            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition-all cursor-pointer"
            title="Khôi phục 10 câu hỏi mặc định"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 text-center space-y-3">
            <HelpCircle className="w-10 h-10 text-stone-600 mx-auto" />
            <div className="text-sm font-bold text-stone-300">Không tìm thấy câu hỏi nào</div>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {searchQuery
                ? `Không có câu hỏi nào khớp với từ khóa "${searchQuery}". Hãy thử tìm với từ khóa khác.`
                : 'Đội này chưa có câu hỏi nào. Hãy nhấn nút "+ Thêm câu hỏi mới" để tạo câu hỏi.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs text-stone-300 font-semibold"
              >
                Xóa tìm kiếm
              </button>
            )}
          </div>
        ) : (
          filteredQuestions.map((q, index) => {
            const originalIndex = activeTeamData.questions.findIndex((item) => item.id === q.id);
            const questionNumber = originalIndex >= 0 ? originalIndex + 1 : index + 1;

            return (
              <div
                key={q.id}
                className="bg-stone-900 border border-stone-800 hover:border-stone-700 rounded-2xl p-4 sm:p-5 transition-all shadow-sm flex flex-col gap-3.5 group"
              >
                {/* Question Header & Action buttons */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: activeTeamData.color.hex }}
                    >
                      {questionNumber}
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm sm:text-base text-stone-100 leading-snug">
                        {q.question}
                      </h4>
                      {q.explanation && (
                        <p className="text-[11px] text-stone-400 mt-1 italic">
                          💡 Giải thích: {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Edit & Delete Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(q)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-amber-500/20 text-stone-300 hover:text-amber-300 border border-stone-700 text-xs font-semibold transition-all cursor-pointer"
                      title="Sửa nội dung câu hỏi"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Sửa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuestionToDelete({ id: q.id, text: q.question })}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-red-500/20 text-stone-300 hover:text-red-400 border border-stone-700 text-xs font-semibold transition-all cursor-pointer"
                      title="Xóa câu hỏi này"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      <span className="hidden sm:inline">Xóa</span>
                    </button>
                  </div>
                </div>

                {/* 4 Choices Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-stone-800/80">
                  {q.options.map((opt, optIndex) => {
                    const isCorrect = optIndex === q.correctIndex;
                    const letter = String.fromCharCode(65 + optIndex);

                    return (
                      <div
                        key={optIndex}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all border ${
                          isCorrect
                            ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-semibold'
                            : 'bg-stone-950/50 border-stone-800/80 text-stone-300'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-500 text-stone-950'
                              : 'bg-stone-800 text-stone-400'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="truncate flex-1">{opt}</span>
                        {isCorrect && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">
                            <Check className="w-3 h-3" />
                            Đúng
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  {editingQuestionId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {editingQuestionId ? 'Chỉnh Sửa Câu Hỏi' : 'Thêm Câu Hỏi Mới'}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {editingQuestionId
                      ? `Đang sửa câu hỏi của ${activeTeamData.name}`
                      : 'Nhập nội dung câu hỏi và 4 phương án trả lời'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              {/* Target Team Selection (only when adding new) */}
              {!editingQuestionId && (
                <div>
                  <label className="block text-stone-300 font-semibold mb-1.5">
                    Thêm vào đội nào?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, targetTeam: 'teamA' })}
                      className={`p-2 rounded-xl border text-center font-bold transition-all ${
                        formData.targetTeam === 'teamA'
                          ? 'bg-red-500/20 border-red-500 text-red-300'
                          : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {teamA.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, targetTeam: 'teamB' })}
                      className={`p-2 rounded-xl border text-center font-bold transition-all ${
                        formData.targetTeam === 'teamB'
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                          : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {teamB.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, targetTeam: 'both' })}
                      className={`p-2 rounded-xl border text-center font-bold transition-all ${
                        formData.targetTeam === 'both'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      Cả 2 Đội
                    </button>
                  </div>
                </div>
              )}

              {/* Question Text */}
              <div>
                <label className="block text-stone-300 font-semibold mb-1.5">
                  Nội dung câu hỏi <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.question}
                  onChange={(e) => {
                    setFormData({ ...formData, question: e.target.value });
                    setFormError(null);
                  }}
                  placeholder="Ví dụ: Thủ đô của Việt Nam là thành phố nào?"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl p-3 text-stone-200 text-xs focus:outline-none focus:border-amber-500 placeholder-stone-500"
                />
              </div>

              {/* 4 Choices */}
              <div className="space-y-2">
                <label className="block text-stone-300 font-semibold">
                  4 Phương án lựa chọn & Chọn đáp án đúng <span className="text-red-400">*</span>
                </label>
                <p className="text-[11px] text-stone-400 mb-1">
                  Nhấp vào chữ [A], [B], [C], [D] để chọn phương án nào là đáp án ĐÚNG:
                </p>

                {formData.options.map((opt, index) => {
                  const letter = String.fromCharCode(65 + index);
                  const isCorrect = formData.correctIndex === index;

                  return (
                    <div key={index} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, correctIndex: index })}
                        className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                          isCorrect
                            ? 'bg-emerald-500 text-stone-950 shadow-md shadow-emerald-500/30'
                            : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200 border border-stone-700'
                        }`}
                        title={isCorrect ? 'Đáp án đúng' : 'Nhấn để chọn làm đáp án đúng'}
                      >
                        {isCorrect ? <Check className="w-4 h-4" /> : letter}
                      </button>

                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const nextOpts = [...formData.options] as [string, string, string, string];
                          nextOpts[index] = e.target.value;
                          setFormData({ ...formData, options: nextOpts });
                          setFormError(null);
                        }}
                        placeholder={`Nhập phương án ${letter}...`}
                        className={`flex-1 bg-stone-950 border rounded-xl px-3 py-2 text-stone-200 text-xs focus:outline-none ${
                          isCorrect
                            ? 'border-emerald-500/80 bg-emerald-950/20'
                            : 'border-stone-700 focus:border-amber-500'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Explanation (optional) */}
              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Giải thích đáp án (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="Ví dụ: Hà Nội là thủ đô của Việt Nam từ năm 1945..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-200 text-xs focus:outline-none focus:border-amber-500 placeholder-stone-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-md transition-all cursor-pointer"
                >
                  {editingQuestionId ? 'Lưu thay đổi' : 'Thêm câu hỏi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {questionToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Xác nhận xóa câu hỏi</h3>
            </div>

            <p className="text-xs text-stone-300">
              Bạn có chắc chắn muốn xóa câu hỏi này khỏi danh sách của{' '}
              <b className="text-white">{activeTeamData.name}</b>?
            </p>

            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-xs text-stone-300 italic">
              &quot;{questionToDelete.text}&quot;
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setQuestionToDelete(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRESETS PACK MODAL */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Nạp Gói Câu Hỏi Có Sẵn</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-400">
              Chọn bộ câu hỏi có sẵn để áp dụng cho{' '}
              <span className="font-bold text-white">{activeTeamData.name}</span>:
            </p>

            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {PRESET_QUESTION_PACKS.map((pack, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 hover:border-amber-500/60 transition-all flex items-center justify-between gap-3 group"
                >
                  <div>
                    <h4 className="font-bold text-xs text-stone-100 group-hover:text-amber-300">
                      {pack.name}
                    </h4>
                    <p className="text-[11px] text-stone-400">{pack.description}</p>
                    <span className="text-[10px] text-stone-500 font-mono mt-0.5 block">
                      {pack.questions.length} câu hỏi
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        onLoadPreset(selectedTeam, pack.questions);
                        showToast(`Đã nạp gói "${pack.name}" cho ${activeTeamData.name}!`);
                        setIsPresetModalOpen(false);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold"
                    >
                      Áp dụng
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        onLoadPreset('teamA', pack.questions);
                        onLoadPreset('teamB', pack.questions);
                        showToast(`Đã nạp gói "${pack.name}" cho CẢ 2 ĐỘI!`);
                        setIsPresetModalOpen(false);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold"
                      title="Áp dụng cùng bộ câu hỏi này cho cả 2 đội"
                    >
                      Cả 2 đội
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
