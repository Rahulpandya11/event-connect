import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Requirement, Proposal, ChatThread, ProviderProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { ChatThreadView } from './ChatThread';
import { PreShortlistQAModal } from './PreShortlistQA';
import { EditProposalModal } from './EditProposalModal';
import { ProposalCard } from './ProposalCard';
import {
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Plus,
  MessageSquare,
  Sparkles,
  FileText,
  Building,
  Star,
  X,
  Edit3,
  Trash2,
  History
} from 'lucide-react';

export const ProviderDashboard: React.FC = () => {
  const { user, providerProfile, refreshMe } = useAuth();
  const [activeTab, setActiveTab] = useState<'open_reqs' | 'my_proposals' | 'chats'>('open_reqs');
  const [openReqs, setOpenReqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Proposal Edit Modal State
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);

  // Proposal Submission Modal State
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [totalPrice, setTotalPrice] = useState<number>(35000);
  const [itemizedPrices, setItemizedPrices] = useState<{ name: string; price: number }[]>([
    { name: 'Core Service Delivery', price: 25000 },
    { name: 'Setup & Equipment', price: 10000 }
  ]);
  const [planText, setPlanText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Pre-Shortlist Q&A Modal State
  const [qaProposal, setQaProposal] = useState<Proposal | null>(null);

  // Chat Threads
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);

  // Verification Submission Modal State
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [vBusinessName, setVBusinessName] = useState('');
  const [vCategory, setVCategory] = useState('Photography');
  const [vYearsExperience, setVYearsExperience] = useState(3);
  const [vStartingPriceRange, setVStartingPriceRange] = useState('₹50,000 - ₹2,00,000');
  const [vDescription, setVDescription] = useState('');
  const [vDocName, setVDocName] = useState('Business_GST_Registration.pdf');
  const [vSubmitting, setVSubmitting] = useState(false);
  const [vSuccess, setVSuccess] = useState('');

  const isVerified = providerProfile?.verificationStatus === 'verified';

  useEffect(() => {
    if (providerProfile) {
      setVBusinessName(providerProfile.businessName || '');
      setVCategory(providerProfile.category || 'Photography');
      setVYearsExperience(providerProfile.yearsExperience || 3);
      setVStartingPriceRange(providerProfile.startingPriceRange || '₹50,000 - ₹2,00,000');
      setVDescription(providerProfile.description || '');
    }
  }, [providerProfile]);

  const handleOpenVerificationModal = () => {
    if (providerProfile) {
      setVBusinessName(providerProfile.businessName || '');
      setVCategory(providerProfile.category || 'Photography');
      setVYearsExperience(providerProfile.yearsExperience || 3);
      setVStartingPriceRange(providerProfile.startingPriceRange || '₹50,000 - ₹2,00,000');
      setVDescription(providerProfile.description || '');
    }
    setError('');
    setVSuccess('');
    setShowVerificationModal(true);
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setVSubmitting(true);
    setVSuccess('');
    setError('');

    try {
      await api.submitProviderVerification({
        businessName: vBusinessName,
        category: vCategory,
        yearsExperience: Number(vYearsExperience),
        startingPriceRange: vStartingPriceRange,
        description: vDescription,
        serviceCity: providerProfile?.serviceCity || 'Surat, Gujarat, India',
        verificationDocuments: [vDocName]
      });
      await refreshMe();
      setVSuccess('Details submitted successfully! Admin will see this request in their portal.');
      setTimeout(() => {
        setShowVerificationModal(false);
        setVSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit verification details');
    } finally {
      setVSubmitting(false);
    }
  };

  const loadOpenReqs = async () => {
    try {
      const data = await api.getOpenRequirements();
      setOpenReqs(data);
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
      if (threads.length > 0 && !activeThread) setActiveThread(threads[0]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      loadOpenReqs();
      loadChats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleDeleteProposal = async (proposalId: string) => {
    if (confirm('Are you sure you want to withdraw/delete this proposal? The client will be notified.')) {
      try {
        await api.deleteProposal(proposalId);
        loadOpenReqs();
      } catch (err: any) {
        alert(err.message || 'Failed to withdraw proposal');
      }
    }
  };

  const handleOpenSubmitModal = (req: any) => {
    if (req.myProposal) {
      setEditingProposal(req.myProposal);
      return;
    }
    setSelectedReq(req);
    setError('');
    setTotalPrice(35000);
    setPlanText(`Our team at ${providerProfile?.businessName} specializes in ${req.category}. We bring top equipment and guaranteed execution for your event.`);
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    setError('');
    setSubmitting(true);

    const itemizedObj: Record<string, number> = {};
    itemizedPrices.forEach(i => {
      if (i.name) itemizedObj[i.name] = Number(i.price);
    });

    try {
      await api.submitProposal({
        requirementId: selectedReq.id,
        totalPrice: Number(totalPrice),
        itemizedPrices: itemizedObj,
        planText
      });
      setSelectedReq(null);
      loadOpenReqs();
    } catch (err: any) {
      setError(err.message || 'Failed to submit proposal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Provider Header Profile Summary */}
      <div className="lux-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-serif italic font-bold text-[#11361E]">{providerProfile?.businessName || 'Provider Studio'}</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-[#E8F0EA] text-[#11361E] border border-[#11361E]/30">
              {providerProfile?.category}
            </span>
          </div>
          <p className="text-xs text-[#5A6B5D] mt-1">
            Service City: {providerProfile?.serviceCity} • Starting Range: {providerProfile?.startingPriceRange}
          </p>
        </div>

        {/* Verification Status Badge */}
        <div>
          {isVerified ? (
            <div className="px-3 py-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Verified Account (Bidding Enabled)</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-md bg-[#FAF8F5] border border-[#E2DDD3] text-[#11361E] text-xs font-semibold flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-[#11361E]" />
              <span>Pending Admin Verification</span>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Pending Verification Banner */}
      {!isVerified && (
        <div className="p-4 rounded-xl bg-[#E8F0EA]/70 border border-[#11361E]/30 text-[#1F2923] text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start space-x-3 max-w-2xl">
            <AlertTriangle className="w-5 h-5 text-[#11361E] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-serif italic font-bold text-[#11361E] text-sm">Account Pending Admin Verification</h4>
              <p className="mt-0.5 text-[#5A6B5D]">
                Your onboarding credentials are queued for platform administrator review. Proposal bidding activates once approved. Submit or update your business details anytime to send directly to the Admin Portal.
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenVerificationModal}
            className="px-4 py-2 bg-[#11361E] hover:bg-[#0B2414] text-white font-semibold text-xs rounded-md shadow-sm transition shrink-0"
          >
            Submit / Update Verification Details
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-transparent pb-2">
        <button
          onClick={() => setActiveTab('open_reqs')}
          className={`px-4 py-2 rounded-md text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'open_reqs'
              ? 'lux-cta'
              : 'lux-ghost'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Matching Open Requirements ({openReqs.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('chats'); loadChats(); }}
          className={`px-4 py-2 rounded-md text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'chats'
              ? 'lux-cta'
              : 'lux-ghost'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Active Chats & Shortlists ({chatThreads.length})</span>
        </button>
      </div>

      {/* TAB 1: BROWSE MATCHING OPEN REQUIREMENTS */}
      {activeTab === 'open_reqs' && (
        <div className="space-y-4">
          <p className="text-xs text-[#5A6B5D]">
            Requirements matched strictly to your category (<strong>{providerProfile?.category}</strong>) and city. Blind bidding keeps proposals unbiased.
          </p>

          {loading ? (
            <div className="text-xs text-[#5A6B5D] py-8 text-center">Loading open requirements...</div>
          ) : openReqs.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-[#E2DDD3] text-center text-xs text-[#5A6B5D] shadow-sm">
              No matching open requirements found in {providerProfile?.serviceCity} right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {openReqs.map(req => (
                  <div key={req.id} className="p-5 lux-card space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FAF8F5] text-[#5A6B5D] border border-[#E2DDD3]">
                          {req.category}
                        </span>
                        <h4 className="font-serif italic font-bold text-base text-[#11361E] mt-1">{req.group?.eventType}</h4>
                        <p className="text-xs text-[#5A6B5D]">{req.group?.city} • {req.group?.eventDate} ({req.group?.guestCount} guests)</p>
                      </div>

                      <div className="text-right text-xs">
                        <div className="text-[#5A6B5D] text-[11px]">Bidding Deadline</div>
                        <div className="font-semibold text-[#11361E] flex items-center justify-end space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{req.proposalDeadline}</span>
                        </div>
                      </div>
                    </div>

                    {req.group?.notes && (
                      <p className="text-xs text-[#5A6B5D] bg-[#FAF8F5] p-2.5 rounded-md border border-[#E2DDD3] mt-3 italic">
                        "{req.group.notes}"
                      </p>
                    )}

                    {/* Sub-form details */}
                    {req.services && req.services.length > 0 && (
                      <div className="mt-3 p-3 bg-[#FAF8F5] rounded-md border border-[#E2DDD3] text-xs space-y-1">
                        <div className="font-semibold text-[#11361E] text-[11px]">Client Sub-Form Requirements:</div>
                        {req.services.map((svc: any) => (
                          <div key={svc.id} className="text-[#5A6B5D]">
                            {svc.serviceType}: {JSON.stringify(svc.details)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#E2DDD3] space-y-2">
                    {req.hasSubmittedProposal && req.myProposal ? (
                      <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#E2DDD3] text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-800 flex items-center space-x-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            <span>Submitted: ₹{req.myProposal.totalPrice.toLocaleString('en-IN')}</span>
                          </span>

                          {req.myProposal.priceHistory && req.myProposal.priceHistory.length > 0 && (
                            <span className="text-[10px] text-[#11361E] bg-[#E8F0EA] px-2 py-0.5 rounded border border-[#11361E]/30 flex items-center space-x-1 font-semibold">
                              <History className="w-3 h-3 text-[#11361E]" />
                              <span>{req.myProposal.priceHistory.length} Price Revisions</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-end space-x-2 pt-1 border-t border-[#E2DDD3]">
                          <button
                            onClick={() => setEditingProposal(req.myProposal)}
                            className="px-3 py-1 rounded-md text-xs font-semibold lux-cta flex items-center space-x-1 gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Proposal & Price</span>
                          </button>
                            <button
                              onClick={() => handleDeleteProposal(req.myProposal.id)}
                              className="px-3 py-1 rounded-md text-xs font-semibold bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 transition flex items-center space-x-1"
                            >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Withdraw</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-[#5A6B5D]">No proposal submitted yet</div>
                        <button
                          onClick={() => handleOpenSubmitModal(req)}
                          disabled={!isVerified}
                          className={`px-4 py-2 rounded-md text-xs font-semibold transition shadow-sm ${
                            isVerified
                              ? 'lux-cta'
                              : 'lux-ghost cursor-not-allowed'
                          }`}
                        >
                          Submit Blind Proposal
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE CHATS */}
      {activeTab === 'chats' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-xs font-serif italic text-[#5A6B5D] uppercase tracking-wider mb-2 font-semibold">Shortlisted Client Threads</h3>
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
                <div className="font-serif italic font-bold text-sm text-[#11361E]">{thread.clientName}</div>
                <div className="text-xs text-[#11361E] font-medium">{thread.eventType} • {thread.requirementCategory}</div>
                <p className="text-[11px] text-[#5A6B5D] truncate mt-1">{thread.lastMessage || 'Shortlisted!'}</p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-8">
            {activeThread ? (
              <ChatThreadView thread={activeThread} />
            ) : (
              <div className="p-12 bg-white rounded-xl border border-[#E2DDD3] text-center text-[#5A6B5D] text-xs shadow-sm">
                Select a client thread to chat or submit a revised quote.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBMIT PROPOSAL MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-[#E2DDD3] rounded-xl p-6 text-[#1F2923] space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#E2DDD3] pb-3">
              <div>
                <h4 className="font-serif italic font-bold text-base text-[#11361E]">
                  Submit Blind Proposal: {selectedReq.group?.eventType}
                </h4>
                <p className="text-xs text-[#5A6B5D]">Category: {selectedReq.category}</p>
              </div>
              <button onClick={() => setSelectedReq(null)} className="text-[#5A6B5D] hover:text-[#11361E]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#11361E] mb-1">
                  Total Quoted Price (₹)
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  step={50}
                  value={totalPrice}
                  onChange={e => setTotalPrice(Number(e.target.value))}
                  className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2.5 text-sm text-[#1F2923] font-semibold focus:outline-none focus:border-[#11361E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A6B5D] mb-1">
                  Itemized Line-Item Breakdown
                </label>
                <div className="space-y-2">
                  {itemizedPrices.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Line item description"
                        value={item.name}
                        onChange={e => {
                          const updated = [...itemizedPrices];
                          updated[idx].name = e.target.value;
                          setItemizedPrices(updated);
                        }}
                        className="flex-1 bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3 py-1.5 text-xs text-[#1F2923] placeholder-[#8C9B8F] focus:outline-none focus:border-[#11361E]"
                      />
                      <input
                        type="number"
                        placeholder="Amount (₹)"
                        value={item.price}
                        onChange={e => {
                          const updated = [...itemizedPrices];
                          updated[idx].price = Number(e.target.value);
                          setItemizedPrices(updated);
                        }}
                        className="w-28 bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3 py-1.5 text-xs text-[#1F2923] placeholder-[#8C9B8F] focus:outline-none focus:border-[#11361E]"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setItemizedPrices([...itemizedPrices, { name: '', price: 0 }])}
                    className="text-xs text-[#11361E] font-semibold hover:underline"
                  >
                    + Add Line Item
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A6B5D] mb-1">
                  Written Plan & Pitch Summary
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail your equipment, schedule, execution plan, and value proposition..."
                  value={planText}
                  onChange={e => setPlanText(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md p-3 text-xs text-[#1F2923] placeholder-[#8C9B8F] focus:outline-none focus:border-[#11361E]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-[#11361E] hover:bg-[#0B2414] text-white font-semibold text-xs rounded-md transition shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Blind Proposal'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Verification Submission Modal for Admin Portal */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-[#E2DDD3] rounded-xl shadow-2xl p-6 my-8 text-[#1F2923]">
            <button
              onClick={() => setShowVerificationModal(false)}
              className="absolute top-4 right-4 text-[#5A6B5D] hover:text-[#11361E] p-1.5 rounded-md bg-[#FAF8F5] border border-[#E2DDD3]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-[#11361E] mb-4">
              <Building className="w-5 h-5" />
              <h3 className="text-lg font-serif italic font-bold text-[#11361E]">
                Submit Onboarding Details for Admin Verification
              </h3>
            </div>
            <p className="text-xs text-[#5A6B5D] mb-5">
              Submit your business credentials and verification documents. This will update your profile and dispatch an instant review ticket to the Admin Portal verification queue.
            </p>

            {vSuccess && (
              <div className="mb-4 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{vSuccess}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitVerification} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#5A6B5D] mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Surat Elite Wedding Decorators"
                  value={vBusinessName}
                  onChange={e => setVBusinessName(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] placeholder-[#8C9B8F] focus:outline-none focus:border-[#11361E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A6B5D] mb-1">Service Category</label>
                  <input
                    type="text"
                    required
                    value={vCategory}
                    onChange={e => setVCategory(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6B5D] mb-1">Years Experience</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={vYearsExperience}
                    onChange={e => setVYearsExperience(Number(e.target.value))}
                    className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A6B5D] mb-1">Starting Price Range</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ₹50,000 - ₹2,00,000"
                  value={vStartingPriceRange}
                  onChange={e => setVStartingPriceRange(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] placeholder-[#8C9B8F] focus:outline-none focus:border-[#11361E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A6B5D] mb-1">Business Overview / Experience Summary</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your event portfolio, past weddings handled in Surat, and team expertise..."
                  value={vDescription}
                  onChange={e => setVDescription(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md p-3 text-xs text-[#1F2923] placeholder-[#8C9B8F] focus:outline-none focus:border-[#11361E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A6B5D] mb-1">Verification Document / License Name</label>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[#11361E] shrink-0" />
                  <input
                    type="text"
                    required
                    value={vDocName}
                    onChange={e => setVDocName(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
                  />
                </div>
                <p className="text-[10px] text-[#5A6B5D] mt-1">Submit GST registration, business license, or identity proof name for admin validation.</p>
              </div>

              <button
                type="submit"
                disabled={vSubmitting}
                className="w-full py-2.5 bg-[#11361E] hover:bg-[#0B2414] text-white font-semibold text-xs rounded-md transition shadow-sm disabled:opacity-50"
              >
                {vSubmitting ? 'Sending to Admin Portal...' : 'Send Details for Admin Verification'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Proposal Modal */}
      {editingProposal && (
        <EditProposalModal
          isOpen={!!editingProposal}
          onClose={() => setEditingProposal(null)}
          proposal={editingProposal}
          onSuccess={() => {
            loadOpenReqs();
          }}
        />
      )}
    </div>
  );
};
