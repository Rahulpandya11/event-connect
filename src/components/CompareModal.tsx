import React from 'react';
import { Proposal } from '../types';
import { X, CheckCircle2, Star, Sparkles, BarChart2 } from 'lucide-react';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposals: Proposal[];
  onShortlist: (id: string) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  proposals,
  onShortlist
}) => {
  if (!isOpen || proposals.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white border border-[#E2DDD3] rounded-xl shadow-2xl p-6 my-8 text-[#1F2923]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#5A6B5D] hover:text-[#11361E] p-1.5 rounded-md bg-[#FAF8F5] border border-[#E2DDD3]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 mb-6 border-b border-[#E2DDD3] pb-4">
          <BarChart2 className="w-5 h-5 text-[#11361E]" />
          <h3 className="text-xl font-serif italic font-bold text-[#11361E]">Side-by-Side Blind Bidding Comparison</h3>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-${proposals.length} gap-4`}>
          {proposals.map((prop, idx) => (
            <div key={prop.id} className="p-5 bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl space-y-4">
              <div className="border-b border-[#E2DDD3] pb-3 flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#11361E]">
                    Option {idx + 1}
                  </span>
                  <h4 className="font-serif italic font-bold text-base text-[#11361E]">
                    {prop.isRevealed ? prop.providerInfo?.businessName : prop.anonymizedLabel || `Provider ${idx + 1}`}
                  </h4>
                  <div className="flex items-center space-x-1 text-xs text-[#11361E] mt-1">
                    <Star className="w-3.5 h-3.5 fill-[#11361E]" />
                    <span className="font-semibold">{prop.providerInfo?.avgRating?.toFixed(1) || '4.8'}★ ({prop.providerInfo?.totalReviews || 12} reviews)</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-[#11361E]">₹{prop.totalPrice.toLocaleString()}</div>
                  <div className="text-[10px] font-bold text-[#11361E] bg-[#E8F0EA] px-2 py-0.5 rounded border border-[#11361E]/30 inline-block mt-1">
                    {prop.matchScore}% Match
                  </div>
                </div>
              </div>

              {/* Plan Summary */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5A6B5D] block mb-1">Plan Overview</span>
                <p className="text-xs text-[#1F2923] leading-relaxed bg-white p-3 rounded-lg border border-[#E2DDD3]">
                  {prop.planText}
                </p>
              </div>

              {/* Itemized Breakdown */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5A6B5D] block mb-1">Line Items</span>
                <div className="space-y-1 text-xs bg-white p-3 rounded-lg border border-[#E2DDD3]">
                  {prop.itemizedPrices && Object.entries(prop.itemizedPrices).map(([item, price]) => (
                    <div key={item} className="flex justify-between text-[#5A6B5D]">
                      <span>{item}</span>
                      <span className="font-semibold text-[#1F2923]">₹{Number(price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  onShortlist(prop.id);
                  onClose();
                }}
                className="w-full py-2.5 rounded-md bg-[#11361E] hover:bg-[#0B2414] text-white font-semibold text-xs transition shadow-sm"
              >
                Shortlist Option {idx + 1}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
