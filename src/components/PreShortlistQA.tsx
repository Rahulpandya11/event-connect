import React, { useState, useEffect } from 'react';
import { Proposal, PreShortlistQuestion } from '../types';
import { api } from '../services/api';
import { X, HelpCircle, Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface PreShortlistQAModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal;
  isClient: boolean;
}

export const PreShortlistQAModal: React.FC<PreShortlistQAModalProps> = ({
  isOpen,
  onClose,
  proposal,
  isClient
}) => {
  const [questions, setQuestions] = useState<PreShortlistQuestion[]>([]);
  const [questionText, setQuestionText] = useState('');
  const [answerTexts, setAnswerTexts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadQuestions = async () => {
    try {
      const qList = await api.getQuestions(proposal.id);
      setQuestions(qList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadQuestions();
    }
  }, [isOpen, proposal.id]);

  if (!isOpen) return null;

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    setError('');

    try {
      await api.askQuestion(proposal.id, questionText);
      setQuestionText('');
      await loadQuestions();
    } catch (err: any) {
      setError(err.message || 'Failed to submit question');
    }
  };

  const handleAnswer = async (questionId: string) => {
    const text = answerTexts[questionId];
    if (!text || !text.trim()) return;

    try {
      await api.answerQuestion(questionId, text);
      await loadQuestions();
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white border border-[#E2DDD3] rounded-xl shadow-2xl p-6 text-[#1F2923]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#5A6B5D] hover:text-[#11361E] p-1.5 rounded-md bg-[#FAF8F5] border border-[#E2DDD3]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 mb-4">
          <HelpCircle className="w-5 h-5 text-[#11361E]" />
          <h3 className="text-lg font-serif italic font-bold text-[#11361E]">
            Anonymized Pre-Shortlist Q&A Exchange
          </h3>
        </div>

        <p className="text-xs text-[#5A6B5D] mb-4">
          Ask clarifying questions on {proposal.anonymizedLabel || 'this anonymized proposal'} before shortlisting or revealing identity.
        </p>

        {error && (
          <div className="mb-3 p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Existing Q&A List */}
        <div className="max-h-60 overflow-y-auto space-y-3 mb-4">
          {loading ? (
            <div className="text-xs text-[#5A6B5D] text-center py-4">Loading questions...</div>
          ) : questions.length === 0 ? (
            <div className="text-xs text-[#5A6B5D] text-center py-4">No questions asked yet on this proposal.</div>
          ) : (
            questions.map(q => (
              <div key={q.id} className="p-3 bg-[#FAF8F5] border border-[#E2DDD3] rounded-md space-y-2 text-xs">
                <div className="text-[#1F2923]">
                  <strong className="text-[#11361E]">Question:</strong> {q.questionText}
                </div>

                {q.answerText ? (
                  <div className="p-2 bg-white rounded border border-[#E2DDD3] text-[#5A6B5D]">
                    <strong className="text-[#11361E]">Answer:</strong> {q.answerText}
                  </div>
                ) : !isClient ? (
                  <div className="space-y-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="Type your answer to client..."
                      value={answerTexts[q.id] || ''}
                      onChange={e => setAnswerTexts({ ...answerTexts, [q.id]: e.target.value })}
                      className="w-full bg-white border border-[#E2DDD3] rounded p-2 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
                    />
                    <button
                      onClick={() => handleAnswer(q.id)}
                      className="px-3 py-1 bg-[#11361E] hover:bg-[#0B2414] text-white font-semibold rounded text-xs shadow-sm"
                    >
                      Submit Answer
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] text-[#11361E] italic">Awaiting provider response...</div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Ask Question Form (Client) */}
        {isClient && (
          <form onSubmit={handleAsk} className="space-y-2 border-t border-[#E2DDD3] pt-3">
            <input
              type="text"
              placeholder="Ask a clarifying question (e.g., 'Are travel costs included?')..."
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] placeholder-[#8C9B8F] focus:outline-none focus:border-[#11361E]"
            />
            <button
              type="submit"
              className="w-full py-2 bg-[#11361E] hover:bg-[#0B2414] text-white font-semibold text-xs rounded-md flex items-center justify-center space-x-1 transition shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Clarifying Question</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
