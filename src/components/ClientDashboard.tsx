import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RequirementGroup, Requirement, Proposal, ChatThread } from '../types';
import { ProposalCard } from './ProposalCard';
import { CompareModal } from './CompareModal';
import { ChatThreadView } from './ChatThread';
import { PreShortlistQAModal } from './PreShortlistQA';
import { EditRequirementModal } from './EditRequirementModal';
import {
  Calendar,
  Layers,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  Clock,
  Plus,
  Star,
  Layers3,
  X,
  Filter,
  Edit3,
  Trash2,
  History,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ClientDashboardProps {
  onOpenPostWizard: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ onOpenPostWizard }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'postings' | 'negotiations' | 'bookings'>('postings');
  const [groups, setGroups] = useState<RequirementGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Posting Modal State
  const [editingGroup, setEditingGroup] = useState<RequirementGroup | null>(null);
  const [expandedHistoryGroupIds, setExpandedHistoryGroupIds] = useState<string[]>([]);

  // Active Selected Requirement for Proposals View
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [showAllProposals, setShowAllProposals] = useState(false);

  // Compare Modal State
  const [comparedProposals, setComparedProposals] = useState<Proposal[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Pre-Shortlist Q&A Modal State
  const [qaProposal, setQaProposal] = useState<Proposal | null>(null);

  // Active Chat State
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);

  // Bookings State
  const [bookings, setBookings] = useState<any[]>([]);

  // Review Modal State
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const loadGroups = async () => {
    try {
      const data = await api.getMyRequirementGroups();
      setGroups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadChats = async () => {
    try {
      const threads = await api.getChatThreads();
      setChatThreads(threads);
      if (threads.length > 0 && !activeThread) {
        setActiveThread(threads[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadBookings = async () => {
    try {
      const data = await api.getBookings();
      setBookings(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      loadGroups();
      loadChats();
      loadBookings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSelectRequirement = async (req: Requirement) => {
    setSelectedReq(req);
    try {
      const data = await api.getRequirementDetails(req.id);
      setProposals(data.proposals);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShortlist = async (id: string) => {
    try {
      await api.shortlistProposal(id);
      if (selectedReq) handleSelectRequirement(selectedReq);
      loadChats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.rejectProposal(id);
      if (selectedReq) handleSelectRequirement(selectedReq);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptProposal = async (id: string) => {
    try {
      await api.acceptProposal(id);
      if (selectedReq) handleSelectRequirement(selectedReq);
      loadBookings();
      loadGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCompare = (prop: Proposal) => {
    if (comparedProposals.some(p => p.id === prop.id)) {
      setComparedProposals(comparedProposals.filter(p => p.id !== prop.id));
    } else {
      if (comparedProposals.length >= 3) {
        alert('You can compare a maximum of 3 proposals side-by-side.');
        return;
      }
      setComparedProposals([...comparedProposals, prop]);
    }
  };

  const handleDeleteGroup = async (groupId: string, eventType: string) => {
    if (confirm(`Are you sure you want to delete the posting for "${eventType}"? All linked proposals will be withdrawn.`)) {
      try {
        await api.deleteRequirementGroup(groupId);
        if (selectedReq && groups.some(g => g.id === groupId && g.requirements?.some((r: any) => r.id === selectedReq.id))) {
          setSelectedReq(null);
          setProposals([]);
        }
        loadGroups();
      } catch (err: any) {
        alert(err.message || 'Failed to delete requirement posting');
      }
    }
  };

  const handleDeleteRequirement = async (reqId: string, category: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete the "${category}" requirement item?`)) {
      try {
        await api.deleteRequirement(reqId);
        if (selectedReq?.id === reqId) {
          setSelectedReq(null);
          setProposals([]);
        }
        loadGroups();
      } catch (err: any) {
        alert(err.message || 'Failed to delete requirement');
      }
    }
  };

  const toggleHistoryGroup = (groupId: string) => {
    if (expandedHistoryGroupIds.includes(groupId)) {
      setExpandedHistoryGroupIds(expandedHistoryGroupIds.filter(id => id !== groupId));
    } else {
      setExpandedHistoryGroupIds([...expandedHistoryGroupIds, groupId]);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewBookingId) return;
    try {
      await api.submitReview(reviewBookingId, reviewRating, reviewComment);
      setReviewBookingId(null);
      setReviewComment('');
      loadBookings();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter top 10 proposals default vs show all
  const displayedProposals = showAllProposals ? proposals : proposals.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Dashboard Top Tabs Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E2DDD3] shadow-sm">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('postings')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition flex items-center space-x-2 ${
              activeTab === 'postings'
                ? 'bg-[#11361E] text-white shadow-sm'
                : 'text-[#5A6B5D] hover:text-[#11361E] bg-[#FAF8F5] border border-[#E2DDD3]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>My Postings & Proposals</span>
          </button>

          <button
            onClick={() => { setActiveTab('negotiations'); loadChats(); }}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition flex items-center space-x-2 ${
              activeTab === 'negotiations'
                ? 'bg-[#11361E] text-white shadow-sm'
                : 'text-[#5A6B5D] hover:text-[#11361E] bg-[#FAF8F5] border border-[#E2DDD3]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Active Negotiations ({chatThreads.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('bookings'); loadBookings(); }}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition flex items-center space-x-2 ${
              activeTab === 'bookings'
                ? 'bg-[#11361E] text-white shadow-sm'
                : 'text-[#5A6B5D] hover:text-[#11361E] bg-[#FAF8F5] border border-[#E2DDD3]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmed Bookings ({bookings.length})</span>
          </button>
        </div>

        <button
          onClick={onOpenPostWizard}
          className="px-4 py-2 rounded-md bg-[#11361E] hover:bg-[#0B2414] text-white font-semibold text-xs flex items-center space-x-1.5 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Requirement</span>
        </button>
      </div>

      {/* TAB 1: POSTINGS & PROPOSALS */}
      {activeTab === 'postings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Requirement Groups List */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs font-serif italic font-semibold text-[#5A6B5D] uppercase tracking-wider flex items-center space-x-1.5">
              <span>Your Posted Requirements</span>
              <span className="text-xs text-[#11361E]">({groups.length})</span>
            </h3>

            {loading ? (
              <div className="text-xs text-[#5A6B5D] py-8 text-center">Loading requirement groups...</div>
            ) : groups.length === 0 ? (
              <div className="p-6 bg-white rounded-xl border border-[#E2DDD3] text-center space-y-3 shadow-sm">
                <p className="text-xs text-[#5A6B5D]">No requirements posted yet. Get competing proposals for your wedding or event!</p>
                <button
                  onClick={onOpenPostWizard}
                  className="px-4 py-2 rounded-md bg-[#11361E] hover:bg-[#0B2414] text-white font-semibold text-xs transition shadow-sm"
                >
                  Post First Requirement
                </button>
              </div>
            ) : (
              groups.map(grp => {
                const historyList = grp.editHistory || [];
                const isHistoryExpanded = expandedHistoryGroupIds.includes(grp.id);

                return (
                  <div key={grp.id} className="p-4 bg-white border border-[#E2DDD3] rounded-xl space-y-3 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                            grp.bundleMode === 'bundled'
                              ? 'bg-[#E8F0EA] text-[#11361E] border-[#11361E]/30'
                              : 'bg-[#FAF8F5] text-[#5A6B5D] border-[#E2DDD3]'
                          }`}>
                            {grp.bundleMode === 'bundled' ? 'Bundled Full Package' : 'Split Specialist Group'}
                          </span>

                          {/* Posting Edit History Badge */}
                          {historyList.length > 0 && (
                            <button
                              onClick={() => toggleHistoryGroup(grp.id)}
                              className="text-[10px] font-semibold text-[#11361E] bg-[#E8F0EA] px-2 py-0.5 rounded border border-[#11361E]/30 flex items-center space-x-1 hover:bg-[#FAF8F5] transition"
                            >
                              <History className="w-3 h-3 text-[#11361E]" />
                              <span>{historyList.length} Revisions</span>
                            </button>
                          )}
                        </div>

                        <h4 className="font-serif italic font-bold text-base text-[#11361E] mt-1">{grp.eventType}</h4>
                        <p className="text-xs text-[#5A6B5D]">{grp.city} • {grp.eventDate} ({grp.guestCount} guests)</p>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="text-xs text-[#5A6B5D]">
                          Budget: <span className="font-semibold text-[#11361E]">{grp.budgetMax ? `₹${grp.budgetMax.toLocaleString('en-IN')}` : 'Flexible'}</span>
                        </div>

                        {/* Action Buttons: Edit & Delete Posting */}
                        <div className="flex items-center justify-end space-x-1 pt-1">
                          <button
                            onClick={() => setEditingGroup(grp)}
                            title="Edit Requirement Posting"
                            className="p-1.5 rounded-md bg-[#FAF8F5] hover:bg-[#F5F2EB] text-[#11361E] border border-[#E2DDD3] transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(grp.id, grp.eventType)}
                            title="Delete Requirement Posting"
                            className="p-1.5 rounded-md bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Revision History Dropdown */}
                    {isHistoryExpanded && historyList.length > 0 && (
                      <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#11361E]/30 text-xs space-y-2">
                        <div className="text-[11px] font-semibold text-[#11361E] uppercase tracking-wider flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Posting Change History</span>
                        </div>
                        <div className="space-y-1.5 pl-2 border-l border-[#E2DDD3]">
                          {historyList.map(h => (
                            <div key={h.id} className="text-[11px] text-[#5A6B5D]">
                              <div className="text-[#8C9B8F] text-[10px]">
                                {new Date(h.editedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                              </div>
                              <div className="text-[#1F2923] font-medium">{h.summary}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sub-Requirements List */}
                    <div className="space-y-2 pt-2 border-t border-[#E2DDD3]">
                      {grp.requirements?.map((req: any) => (
                        <div
                          key={req.id}
                          onClick={() => handleSelectRequirement(req)}
                          className={`p-3 rounded-md border text-xs cursor-pointer transition flex items-center justify-between ${
                            selectedReq?.id === req.id
                              ? 'bg-[#E8F0EA]/70 border-[#11361E] text-[#1F2923] font-medium'
                              : 'bg-[#FAF8F5] border-[#E2DDD3] text-[#5A6B5D] hover:border-[#11361E]/30'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-[#11361E]">{req.category}</div>
                            <div className="text-[11px] text-[#5A6B5D]">
                              Deadline: {req.proposalDeadline}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded bg-white border border-[#E2DDD3] text-[#11361E] font-semibold text-[11px]">
                              {req.proposalsCount || 0} proposals
                            </span>
                            <button
                              onClick={(e) => handleDeleteRequirement(req.id, req.category, e)}
                              title="Delete requirement item"
                              className="p-1 rounded text-[#5A6B5D] hover:text-rose-600 hover:bg-rose-50 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Proposals View for Selected Requirement */}
          <div className="lg:col-span-7 space-y-4">
            {selectedReq ? (
              <div className="space-y-4">
                <div className="p-4 bg-white border border-[#E2DDD3] rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
                  <div>
                    <h3 className="font-serif italic font-bold text-base text-[#11361E]">
                      Proposals for {selectedReq.category}
                    </h3>
                    <p className="text-xs text-[#5A6B5D]">
                      Blind bidding active. Provider identities are hidden until you shortlist.
                    </p>
                  </div>

                  {comparedProposals.length > 0 && (
                    <button
                      onClick={() => setShowCompareModal(true)}
                      className="px-3.5 py-1.5 rounded-md bg-[#11361E] hover:bg-[#0B2414] text-white font-semibold text-xs flex items-center space-x-1 transition shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Compare Selected ({comparedProposals.length})</span>
                    </button>
                  )}
                </div>

                {proposals.length === 0 ? (
                  <div className="p-8 bg-white rounded-xl border border-[#E2DDD3] text-center text-xs text-[#5A6B5D] shadow-sm">
                    Awaiting verified provider proposals...
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayedProposals.map((prop, idx) => (
                      <ProposalCard
                        key={prop.id}
                        proposal={prop}
                        rank={idx + 1}
                        onShortlist={handleShortlist}
                        onReject={handleReject}
                        onAskQuestion={p => setQaProposal(p)}
                        onToggleCompare={handleToggleCompare}
                        isCompared={comparedProposals.some(p => p.id === prop.id)}
                        isClientView={true}
                      />
                    ))}

                    {proposals.length > 10 && !showAllProposals && (
                      <div className="text-center pt-2">
                        <button
                          onClick={() => setShowAllProposals(true)}
                          className="px-4 py-2 rounded-md bg-white hover:bg-[#FAF8F5] border border-[#E2DDD3] text-[#11361E] text-xs font-semibold transition"
                        >
                          Show All {proposals.length} Proposals
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 bg-white rounded-xl border border-[#E2DDD3] text-center text-[#5A6B5D] text-xs shadow-sm">
                Select a requirement on the left to view blind competing proposals.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE NEGOTIATIONS (CHAT) */}
      {activeTab === 'negotiations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-xs font-serif italic text-[#5A6B5D] uppercase tracking-wider mb-2 font-semibold">Shortlisted Threads</h3>
            {chatThreads.map(thread => (
              <div
                key={thread.id}
                onClick={() => setActiveThread(thread)}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  activeThread?.id === thread.id
                    ? 'bg-white border-[#11361E] text-[#1F2923] ring-1 ring-[#11361E]/20 shadow-sm'
                    : 'bg-white border-[#E2DDD3] text-[#5A6B5D] hover:border-[#11361E]/30'
                }`}
              >
                <div className="font-serif italic font-bold text-sm text-[#11361E]">{thread.providerBusinessName}</div>
                <div className="text-xs text-[#11361E] font-medium">{thread.eventType} • {thread.requirementCategory}</div>
                <p className="text-[11px] text-[#5A6B5D] truncate mt-1">{thread.lastMessage || 'Shortlisted!'}</p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-8">
            {activeThread ? (
              <ChatThreadView
                thread={activeThread}
                onAcceptQuote={async (revisedPrice) => {
                  await handleAcceptProposal(activeThread.proposalId);
                }}
              />
            ) : (
              <div className="p-12 bg-white rounded-xl border border-[#E2DDD3] text-center text-[#5A6B5D] text-xs shadow-sm">
                Select a shortlisted thread to chat or accept a revised quote.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <h3 className="text-sm font-serif italic text-[#5A6B5D] uppercase tracking-wider font-semibold">Confirmed Event Bookings</h3>

          {bookings.map((book) => (
            <div key={book.id} className="p-5 bg-white border border-[#E2DDD3] rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div>
                <span className="text-[10px] uppercase font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  Confirmed Agreement
                </span>
                <h4 className="font-serif italic font-bold text-base text-[#11361E] mt-1">{book.providerBusinessName}</h4>
                <p className="text-xs text-[#5A6B5D]">{book.eventType} ({book.category}) • Event Date: {book.eventDate}</p>
              </div>

              <div className="text-right">
                <div className="text-xl font-bold text-[#11361E]">₹{book.finalPrice.toLocaleString('en-IN')}</div>
                {!book.hasReview ? (
                  <button
                    onClick={() => setReviewBookingId(book.id)}
                    className="mt-1 px-3 py-1 rounded bg-[#11361E] hover:bg-[#0B2414] text-white font-semibold text-xs transition shadow-sm"
                  >
                    Leave Review & Rating
                  </button>
                ) : (
                  <span className="text-xs text-emerald-700 font-semibold flex items-center space-x-1 mt-1 justify-end">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Review Submitted</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Requirement Modal */}
      {editingGroup && (
        <EditRequirementModal
          isOpen={!!editingGroup}
          onClose={() => setEditingGroup(null)}
          group={editingGroup}
          onSuccess={() => {
            loadGroups();
            if (selectedReq) handleSelectRequirement(selectedReq);
          }}
        />
      )}

      {/* Compare Modal */}
      <CompareModal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        proposals={comparedProposals}
        onShortlist={handleShortlist}
      />

      {/* Pre-Shortlist QA Modal */}
      {qaProposal && (
        <PreShortlistQAModal
          isOpen={!!qaProposal}
          onClose={() => setQaProposal(null)}
          proposal={qaProposal}
          isClient={true}
        />
      )}

      {/* Review Modal */}
      {reviewBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-[#E2DDD3] rounded-xl p-6 text-[#1F2923] space-y-4 shadow-xl">
            <h4 className="font-serif italic font-bold text-base text-[#11361E]">Rate & Review Provider</h4>

            <div>
              <label className="block text-xs font-semibold text-[#5A6B5D] mb-1">Star Rating (1 - 5)</label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className={`p-1 ${star <= reviewRating ? 'text-[#11361E]' : 'text-[#E2DDD3]'}`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A6B5D] mb-1">Review Comment</label>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="How was their punctuality, quality, and coordination?"
                className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md p-3 text-xs text-[#1F2923] placeholder-[#8C9B8F] focus:outline-none focus:border-[#11361E]"
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setReviewBookingId(null)}
                className="flex-1 py-2 bg-[#FAF8F5] border border-[#E2DDD3] text-[#5A6B5D] hover:text-[#11361E] text-xs font-semibold rounded-md transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                className="flex-1 py-2 bg-[#11361E] hover:bg-[#0B2414] text-white text-xs font-semibold rounded-md transition shadow-sm"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
