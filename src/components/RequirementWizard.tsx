import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ServiceCategory } from '../types';
import {
  X,
  Sparkles,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  CheckSquare,
  Layers,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Layers3,
  HelpCircle,
  FileText
} from 'lucide-react';

interface RequirementWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RequirementWizard: React.FC<RequirementWizardProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Basics
  const [eventType, setEventType] = useState('Wedding');
  const [eventDate, setEventDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [city, setCity] = useState('Surat, Gujarat, India');
  const [guestCount, setGuestCount] = useState(150);
  const [budgetMin, setBudgetMin] = useState(10000);
  const [budgetMax, setBudgetMax] = useState(18000);
  const [budgetHidden, setBudgetHidden] = useState(false);
  const [notes, setNotes] = useState('');
  const [referenceImages, setReferenceImages] = useState([
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'
  ]);

  // Step 2: Multi-select Services
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'Photography',
    'Catering',
    'Decoration/Flowers'
  ]);

  // Step 3: Per-service sub-form details
  const [serviceDetails, setServiceDetails] = useState<Record<string, any>>({
    Photography: { candid: true, traditional: true, photographers: 2, drone: true, album: true },
    Catering: { dietaryType: 'Veg & Non-Veg', cuisine: 'Continental & Italian', plateCount: 150, liveCounters: true },
    'Decoration/Flowers': { theme: 'Elegant Botanical', colorScheme: 'White & Emerald', stageDecor: true, floralArches: true }
  });

  // Step 4: Bundled vs Split decision
  const [bundleMode, setBundleMode] = useState<'bundled' | 'split'>('bundled');

  // Step 5: Deadline
  const [proposalDeadline, setProposalDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  if (!isOpen) return null;

  const ALL_SERVICES = [
    'Full Event Planning/Management',
    'Photography',
    'Videography',
    'Pre-wedding Shoot',
    'Decoration/Flowers',
    'Catering',
    'Venue',
    'DJ/Music',
    'Makeup & Styling',
    'Invitations',
    'Transportation'
  ];

  const toggleService = (svc: string) => {
    if (selectedServices.includes(svc)) {
      setSelectedServices(selectedServices.filter(s => s !== svc));
    } else {
      setSelectedServices([...selectedServices, svc]);
    }
  };

  const updateSubDetail = (svc: string, field: string, val: any) => {
    setServiceDetails(prev => ({
      ...prev,
      [svc]: {
        ...(prev[svc] || {}),
        [field]: val
      }
    }));
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('Authentication required. Please log in or sign up first to post requirements.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.createRequirement({
        eventType,
        eventDate,
        city,
        guestCount,
        budgetMin,
        budgetMax,
        budgetHidden,
        notes,
        bundleMode,
        selectedServices,
        serviceDetails,
        proposalDeadline,
        referenceImages
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create requirement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-[#E2DDD3] rounded-xl shadow-2xl p-6 my-8 text-[#1F2923]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#5A6B5D] hover:text-[#11361E] p-1.5 rounded-md bg-[#FAF8F5] border border-[#E2DDD3]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Wizard Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-[#5A6B5D] mb-2">
            <span className="font-semibold text-[#11361E]">Step {step} of 5</span>
            <span>
              {step === 1 && 'Event Basics'}
              {step === 2 && 'Select Required Services'}
              {step === 3 && 'Service Custom Details'}
              {step === 4 && 'Bundled vs Split Decision'}
              {step === 5 && 'Bidding Deadline & Review'}
            </span>
          </div>
          <div className="w-full bg-[#FAF8F5] h-1.5 rounded-full overflow-hidden border border-[#E2DDD3]">
            <div
              className="bg-[#11361E] h-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        {/* STEP 1: EVENT BASICS */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-serif italic font-bold text-[#11361E]">Event Overview & Basic Parameters</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A6B5D] mb-1">Event Type</label>
                <select
                  value={eventType}
                  onChange={e => setEventType(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
                >
                  <option value="Wedding">Wedding</option>
                  <option value="Engagement">Engagement / Sangeet</option>
                  <option value="Birthday">Birthday Celebration</option>
                  <option value="Corporate Event">Corporate Event / Gala</option>
                  <option value="Anniversary">Anniversary Party</option>
                  <option value="Baby Shower">Baby Shower</option>
                  <option value="Custom">Other Custom Event</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A6B5D] mb-1">Event Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A6B5D] mb-1">Target City / Region</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A6B5D] mb-1">Expected Guests / Plates</label>
                <input
                  type="number"
                  min={10}
                  value={guestCount}
                  onChange={e => setGuestCount(Number(e.target.value))}
                  className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-md bg-[#FAF8F5] border border-[#E2DDD3] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#11361E]">Target Budget Range (₹)</span>
                <label className="flex items-center space-x-2 text-xs text-[#5A6B5D]">
                  <input
                    type="checkbox"
                    checked={budgetHidden}
                    onChange={e => setBudgetHidden(e.target.checked)}
                    className="rounded bg-white border-[#E2DDD3] text-[#11361E]"
                  />
                  <span>Hide exact budget from providers</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#5A6B5D] mb-1">Min Budget (₹)</label>
                  <input
                    type="number"
                    step={500}
                    value={budgetMin}
                    onChange={e => setBudgetMin(Number(e.target.value))}
                    className="w-full bg-white border border-[#E2DDD3] rounded px-3 py-1.5 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#5A6B5D] mb-1">Max Budget (₹)</label>
                  <input
                    type="number"
                    step={500}
                    value={budgetMax}
                    onChange={e => setBudgetMax(Number(e.target.value))}
                    className="w-full bg-white border border-[#E2DDD3] rounded px-3 py-1.5 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A6B5D] mb-1">General Notes & Vision</label>
              <textarea
                rows={2}
                placeholder="Describe theme, vibe, timing, special requests..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] placeholder-[#8C9B8F] focus:outline-none focus:border-[#11361E]"
              />
            </div>
          </div>
        )}

        {/* STEP 2: MULTI-SELECT SERVICES */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-serif italic font-bold text-[#11361E]">Which services do you need for this event?</h3>
            <p className="text-xs text-[#5A6B5D]">Select all that apply. In step 4 you will choose whether to bundle or split these.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {ALL_SERVICES.map(svc => {
                const isSelected = selectedServices.includes(svc);
                return (
                  <button
                    key={svc}
                    type="button"
                    onClick={() => toggleService(svc)}
                    className={`p-3 rounded-md text-xs font-semibold text-left border transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#E8F0EA] border-[#11361E] text-[#11361E] shadow-sm'
                        : 'bg-[#FAF8F5] border-[#E2DDD3] text-[#5A6B5D] hover:border-[#11361E]/30'
                    }`}
                  >
                    <span>{svc}</span>
                    <CheckSquare className={`w-4 h-4 ${isSelected ? 'text-[#11361E]' : 'text-[#8C9B8F]'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: PER-SERVICE DETAIL SUB-FORMS */}
        {step === 3 && (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            <h3 className="text-lg font-serif italic font-bold text-[#11361E]">Specific Details for Selected Services</h3>
            <p className="text-xs text-[#5A6B5D]">Help providers submit precise, accurate quotes by specifying sub-requirements.</p>

            {selectedServices.map(svc => (
              <div key={svc} className="p-4 rounded-md bg-[#FAF8F5] border border-[#E2DDD3] space-y-3">
                <div className="font-semibold text-xs text-[#11361E] flex items-center justify-between">
                  <span>{svc} Sub-Requirements</span>
                  <span className="text-[10px] text-[#5A6B5D] uppercase tracking-wider">Custom Sub-form</span>
                </div>

                {svc === 'Photography' && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <label className="flex items-center space-x-2 text-[#5A6B5D]">
                      <input
                        type="checkbox"
                        checked={serviceDetails[svc]?.candid ?? true}
                        onChange={e => updateSubDetail(svc, 'candid', e.target.checked)}
                        className="rounded bg-white border-[#E2DDD3] text-[#11361E]"
                      />
                      <span>Candid Coverage</span>
                    </label>
                    <label className="flex items-center space-x-2 text-[#5A6B5D]">
                      <input
                        type="checkbox"
                        checked={serviceDetails[svc]?.drone ?? true}
                        onChange={e => updateSubDetail(svc, 'drone', e.target.checked)}
                        className="rounded bg-white border-[#E2DDD3] text-[#11361E]"
                      />
                      <span>Drone Aerial Photography</span>
                    </label>
                    <div>
                      <span className="block text-[11px] text-[#5A6B5D] mb-1">Photographer Count</span>
                      <input
                        type="number"
                        min={1}
                        value={serviceDetails[svc]?.photographers || 2}
                        onChange={e => updateSubDetail(svc, 'photographers', Number(e.target.value))}
                        className="w-full bg-white border border-[#E2DDD3] rounded p-1.5 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
                      />
                    </div>
                  </div>
                )}

                {svc === 'Catering' && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="block text-[11px] text-[#5A6B5D] mb-1">Dietary Preferences</span>
                      <select
                        value={serviceDetails[svc]?.dietaryType || 'Veg & Non-Veg'}
                        onChange={e => updateSubDetail(svc, 'dietaryType', e.target.value)}
                        className="w-full bg-white border border-[#E2DDD3] rounded p-1.5 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
                      >
                        <option value="Veg Only">Vegetarian Only</option>
                        <option value="Veg & Non-Veg">Veg & Non-Veg</option>
                        <option value="Vegan / Halal / Gluten-Free">Specialized Custom Menu</option>
                      </select>
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#5A6B5D] mb-1">Cuisine Style</span>
                      <input
                        type="text"
                        placeholder="e.g. Italian, Mexican, Asian Fusion"
                        value={serviceDetails[svc]?.cuisine || ''}
                        onChange={e => updateSubDetail(svc, 'cuisine', e.target.value)}
                        className="w-full bg-white border border-[#E2DDD3] rounded p-1.5 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
                      />
                    </div>
                  </div>
                )}

                {svc === 'Decoration/Flowers' && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="block text-[11px] text-[#5A6B5D] mb-1">Theme / Aesthetic</span>
                      <input
                        type="text"
                        placeholder="e.g. Royal Gold, Boho Woodland"
                        value={serviceDetails[svc]?.theme || ''}
                        onChange={e => updateSubDetail(svc, 'theme', e.target.value)}
                        className="w-full bg-white border border-[#E2DDD3] rounded p-1.5 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#5A6B5D] mb-1">Color Palette</span>
                      <input
                        type="text"
                        placeholder="e.g. Sage, Blush, Terracotta"
                        value={serviceDetails[svc]?.colorScheme || ''}
                        onChange={e => updateSubDetail(svc, 'colorScheme', e.target.value)}
                        className="w-full bg-white border border-[#E2DDD3] rounded p-1.5 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
                      />
                    </div>
                  </div>
                )}

                {/* Default fallback for other services */}
                {!['Photography', 'Catering', 'Decoration/Flowers'].includes(svc) && (
                  <div className="text-xs text-[#5A6B5D]">
                    <label className="block mb-1">Specific requirements for {svc}</label>
                    <input
                      type="text"
                      placeholder={`e.g. Specific requirements for ${svc}...`}
                      value={serviceDetails[svc]?.notes || ''}
                      onChange={e => updateSubDetail(svc, 'notes', e.target.value)}
                      className="w-full bg-white border border-[#E2DDD3] rounded p-1.5 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* STEP 4: BUNDLED VS SPLIT DECISION POINT */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-serif italic font-bold text-[#11361E] mb-1">Bundled vs. Split Requirement Flow</h3>
              <p className="text-xs text-[#11361E] font-medium bg-[#E8F0EA] p-2.5 rounded-md border border-[#11361E]/30">
                "Do you want one vendor to manage everything, or should each service go to specialists separately?"
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* OPTION A: BUNDLED */}
              <div
                onClick={() => setBundleMode('bundled')}
                className={`p-5 rounded-md border cursor-pointer transition relative ${
                  bundleMode === 'bundled'
                    ? 'bg-white border-[#11361E] text-[#1F2923] ring-1 ring-[#11361E]/20 shadow-md'
                    : 'bg-[#FAF8F5] border-[#E2DDD3] text-[#5A6B5D] hover:border-[#11361E]/30'
                }`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 rounded bg-[#E8F0EA] text-[#11361E] border border-[#11361E]/30">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif italic font-bold text-sm text-[#11361E]">Option A — Bundled ("Full Package")</h4>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#11361E]">
                      Single Turnkey Vendor
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#5A6B5D] leading-relaxed mb-3">
                  All selected services become <strong className="text-[#1F2923]">ONE single requirement</strong>.
                </p>

                <div className="p-2.5 rounded bg-[#FAF8F5] border border-[#E2DDD3] text-[11px] text-[#5A6B5D]">
                  ⚠️ <strong className="text-[#1F2923]">Enforced Rule:</strong> Only providers registered under <strong className="text-[#11361E]">"Full-Service Event Planning"</strong> can view and submit proposals for bundled packages.
                </div>
              </div>

              {/* OPTION B: SPLIT */}
              <div
                onClick={() => setBundleMode('split')}
                className={`p-5 rounded-md border cursor-pointer transition relative ${
                  bundleMode === 'split'
                    ? 'bg-white border-[#11361E] text-[#1F2923] ring-1 ring-[#11361E]/20 shadow-md'
                    : 'bg-[#FAF8F5] border-[#E2DDD3] text-[#5A6B5D] hover:border-[#11361E]/30'
                }`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 rounded bg-[#E8F0EA] text-[#11361E] border border-[#11361E]/30">
                    <Layers3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif italic font-bold text-sm text-[#11361E]">Option B — Split Requirements</h4>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#11361E]">
                      Specialist Per Service
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#5A6B5D] leading-relaxed mb-3">
                  System auto-generates a <strong className="text-[#1F2923]">separate requirement per service</strong> ({selectedServices.length} separate requirements).
                </p>

                <div className="p-2.5 rounded bg-[#FAF8F5] border border-[#E2DDD3] text-[11px] text-[#5A6B5D]">
                  ℹ️ Each requirement is visible only to specialized category vendors (e.g. photographers see photography; caterers see catering). Managed under one event group.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: DEADLINE & REVIEW */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-serif italic font-bold text-[#11361E]">Proposal Bidding Deadline & Final Review</h3>

            <div>
              <label className="block text-xs font-semibold text-[#11361E] mb-1">
                Custom Proposal Deadline (After this date, requirement auto-closes to new bids)
              </label>
              <input
                type="date"
                value={proposalDeadline}
                onChange={e => setProposalDeadline(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
              />
            </div>

            <div className="p-4 rounded-md bg-[#FAF8F5] border border-[#E2DDD3] space-y-2 text-xs">
              <div className="font-bold text-[#11361E] border-b border-[#E2DDD3] pb-2">Requirement Summary</div>
              <div className="flex justify-between">
                <span className="text-[#5A6B5D]">Event:</span>
                <span className="text-[#1F2923] font-medium">{eventType} on {eventDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6B5D]">Location & Guests:</span>
                <span className="text-[#1F2923] font-medium">{city} ({guestCount} guests)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6B5D]">Flow Strategy:</span>
                <span className="text-[#11361E] font-bold uppercase">{bundleMode} MODE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6B5D]">Selected Services:</span>
                <span className="text-[#1F2923] font-medium">{selectedServices.join(', ')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#E2DDD3]">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-md border border-[#E2DDD3] bg-[#FAF8F5] hover:bg-[#E8F0EA] text-[#5A6B5D] hover:text-[#11361E] text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 rounded-md bg-[#11361E] hover:bg-[#0B2414] text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 rounded-md bg-[#11361E] hover:bg-[#0B2414] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              {submitting ? 'Publishing Requirement...' : 'Publish Requirement for Bidding'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
