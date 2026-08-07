import React, { useState } from 'react';
import { Proposal } from '../types';
import {
  Star,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Eye,
  Lock,
  Layers,
  BarChart2,
  ShieldCheck,
  UserCheck,
  History,
  Clock
} from 'lucide-react';

interface ProposalCardProps {
  proposal: Proposal;
  rank: number;
  onShortlist: (id: string) => void;
  onReject: (id: string) => void;
  onAskQuestion: (proposal: Proposal) => void;
  onToggleCompare: (proposal: Proposal) => void;
  isCompared: boolean;
  isClientView: boolean;
  onEditProposal?: (proposal: Proposal) => void;
  onDeleteProposal?: (id: string) => void;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  rank,
  onShortlist,
  onReject,
  onAskQuestion,
  onToggleCompare,
  isCompared,
  isClientView,
  onEditProposal,
  onDeleteProposal
}) => {
  const [showItemized, setShowItemized] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const provider = proposal.providerInfo;
  const isRevealed = proposal.isRevealed;
  const historyEntries = proposal.priceHistory || [];

  return (
    <div className={`relative p-5 rounded-xl border transition-all duration-200 ${
      proposal.status === 'shortlisted' || proposal.status === 'accepted'
        ? 'bg-white border-[#11361E] shadow-lg ring-1 ring-[#11361E]/20'
        : proposal.status === 'rejected'
        ? 'bg-[#FAF8F5]/60 border-[#E2DDD3] opacity-50'
        : 'bg-white border-[#E2DDD3] hover:border-[#11361E]/40 shadow-sm'
    }`}>
      {/* Top Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4 border-b border-[#E2DDD3] pb-3">
        <div className="flex items-center space-x-3">
          {/* Rank Badge */}
          <div className="w-8 h-8 rounded-md bg-[#FAF8F5] text-[#1F2923] font-semibold text-xs flex items-center justify-center border border-[#E2DDD3]">
            #{rank}
          </div>

          {/* Provider Identity Header (Anonymized vs Revealed) */}
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-serif italic font-bold text-base text-[#11361E]">
                {isRevealed ? provider?.businessName : proposal.anonymizedLabel || 'Anonymized Provider'}
              </h4>

              {isRevealed ? (
                <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                  <span>Identity Revealed</span>
                </span>
              ) : (
                <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded bg-[#FAF8F5] text-[#5A6B5D] border border-[#E2DDD3] flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-[#11361E]" />
                  <span>Blind Bidding Active</span>
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 mt-1 text-xs text-[#5A6B5D]">
              <span className="flex items-center space-x-1 text-[#11361E] font-semibold">
                <Star className="w-3.5 h-3.5 fill-[#11361E] text-[#11361E]" />
                <span>{provider?.avgRating ? provider.avgRating.toFixed(1) : '4.8'}★</span>
              </span>
              <span>•</span>
              <span>{provider?.totalReviews || 14} verified reviews</span>
              <span>•</span>
              <span>{provider?.yearsExperience || 5} yrs exp</span>
            </div>
          </div>
        </div>

        {/* Total Price & Match Score Badge */}
        <div className="text-right">
          <div className="text-xl font-bold text-[#11361E]">
            ₹{proposal.totalPrice.toLocaleString('en-IN')}
          </div>

          {/* System Match Score Pill */}
          <div className="inline-flex items-center space-x-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#E8F0EA] text-[#11361E] border border-[#11361E]/30 mt-1">
            <Sparkles className="w-3 h-3 text-[#11361E]" />
            <span>{proposal.matchScore}% Match Score</span>
          </div>
        </div>
      </div>

      {/* Plan Pitch Text */}
      <div className="mb-4">
        <h5 className="text-[11px] font-semibold uppercase tracking-wider text-[#5A6B5D] mb-1">Proposal Plan & Pitch</h5>
        <p className="text-xs text-[#1F2923] leading-relaxed bg-[#FAF8F5] p-3 rounded-lg border border-[#E2DDD3]">
          {proposal.planText}
        </p>
      </div>

      {/* Itemized Price Breakdown & History Section */}
      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => setShowItemized(!showItemized)}
            className="text-xs font-semibold text-[#11361E] hover:underline flex items-center space-x-1"
          >
            <span>{showItemized ? 'Hide' : 'View'} Itemized Breakdown</span>
            {showItemized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {historyEntries.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs font-semibold text-[#5A6B5D] hover:text-[#11361E] flex items-center space-x-1 bg-[#FAF8F5] px-2.5 py-1 rounded-md border border-[#E2DDD3] transition"
            >
              <History className="w-3.5 h-3.5 text-[#11361E]" />
              <span>Price Revision History ({historyEntries.length})</span>
              {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {showItemized && proposal.itemizedPrices && (
          <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#E2DDD3] text-xs space-y-1.5">
            {Object.entries(proposal.itemizedPrices).map(([item, price]) => (
              <div key={item} className="flex justify-between text-[#5A6B5D]">
                <span>{item}</span>
                <span className="font-semibold text-[#1F2923]">₹{Number(price).toLocaleString('en-IN')}</span>
              </div>
            ))}
            <div className="border-t border-[#E2DDD3] pt-1.5 mt-1.5 flex justify-between font-bold text-[#11361E]">
              <span>Total Quoted</span>
              <span>₹{proposal.totalPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}

        {showHistory && historyEntries.length > 0 && (
          <div className="p-3.5 bg-[#E8F0EA]/50 rounded-lg border border-[#11361E]/30 text-xs space-y-2.5">
            <div className="text-[11px] font-semibold text-[#11361E] uppercase tracking-wider flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Proposal Pricing & Revision History</span>
            </div>
            <div className="space-y-2 pl-2 border-l border-[#11361E]/30">
              {historyEntries.map(h => (
                <div key={h.id} className="relative pl-3 text-[11px]">
                  <div className="absolute -left-[13px] top-1 w-2 h-2 rounded-full bg-[#11361E]" />
                  <div className="text-[#5A6B5D] text-[10px]">
                    {new Date(h.editedAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </div>
                  <div className="text-[#1F2923] font-medium mt-0.5">{h.summary}</div>
                  {h.oldPrice && h.newPrice && (
                    <div className="text-[#5A6B5D] mt-0.5">
                      Price: <span className="line-through text-rose-600">₹{h.oldPrice.toLocaleString('en-IN')}</span> → <span className="text-emerald-700 font-semibold">₹{h.newPrice.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Revealed Portfolio Samples */}
      {isRevealed && provider?.portfolioImages && provider.portfolioImages.length > 0 && (
        <div className="mb-4">
          <h5 className="text-[11px] font-semibold uppercase tracking-wider text-[#5A6B5D] mb-2">Revealed Provider Portfolio</h5>
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {provider.portfolioImages.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt="Portfolio sample"
                className="w-20 h-20 object-cover rounded-lg border border-[#E2DDD3]"
              />
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {isClientView && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E2DDD3]">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleCompare(proposal)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition flex items-center space-x-1 ${
                isCompared
                  ? 'bg-[#11361E] text-white border-[#11361E]'
                  : 'bg-[#FAF8F5] text-[#5A6B5D] border-[#E2DDD3] hover:bg-[#F5F2EB]'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>{isCompared ? 'Added to Compare' : 'Compare'}</span>
            </button>

            {/* Pre-shortlist Q&A */}
            <button
              onClick={() => onAskQuestion(proposal)}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#FAF8F5] hover:bg-[#F5F2EB] text-[#11361E] border border-[#E2DDD3] transition flex items-center space-x-1"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#11361E]" />
              <span>Ask Question</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {proposal.status !== 'rejected' && proposal.status !== 'accepted' && (
              <button
                onClick={() => onReject(proposal.id)}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 transition flex items-center space-x-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            )}

            {proposal.status === 'submitted' && (
              <button
                onClick={() => onShortlist(proposal.id)}
                className="px-4 py-1.5 rounded-md text-xs font-semibold bg-[#11361E] hover:bg-[#0B2414] text-white shadow-sm transition flex items-center space-x-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>Shortlist & Reveal Identity</span>
              </button>
            )}

            {proposal.status === 'shortlisted' && (
              <span className="px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Shortlisted (Identity Unlocked)</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Provider Action Controls (When rendered in Provider View) */}
      {!isClientView && (onEditProposal || onDeleteProposal) && (
        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E2DDD3]">
          {onEditProposal && (
            <button
              onClick={() => onEditProposal(proposal)}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#FAF8F5] hover:bg-[#F5F2EB] text-[#11361E] border border-[#E2DDD3] transition flex items-center space-x-1"
            >
              <span>Edit Proposal & Price</span>
            </button>
          )}
          {onDeleteProposal && (
            <button
              onClick={() => onDeleteProposal(proposal.id)}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 transition flex items-center space-x-1"
            >
              <span>Withdraw / Delete</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
