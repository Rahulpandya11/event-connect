import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { RequirementWizard } from './components/RequirementWizard';
import { ClientDashboard } from './components/ClientDashboard';
import { ProviderDashboard } from './components/ProviderDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import {
  Sparkles,
  Lock,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Users,
  Briefcase,
  Star,
  Plus,
  Zap,
  Compass,
  Rocket
} from 'lucide-react';

function MainApp() {
  const { user, activeRole, switchRoleView } = useAuth();

  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authRole, setAuthRole] = useState<'client' | 'provider'>('client');

  // Requirement Wizard Modal State
  const [showWizard, setShowWizard] = useState(false);

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login', role: 'client' | 'provider' = 'client') => {
    setAuthMode(mode);
    setAuthRole(role);
    setShowAuthModal(true);
  };

  const roleHeadline = {
    client: 'Your event operation center is open',
    provider: 'Your bidding studio is ready',
    admin: 'Your platform command center is ready'
  }[activeRole ?? 'client'];

  const roleDescription = {
    client: 'Create requirements, review blind proposals, and shortlist winners without revealing identities too early.',
    provider: 'Browse fresh requirements, submit polished proposals, and stay close to active negotiations.',
    admin: 'Review verifications, tune match weights, and keep the marketplace healthy.'
  }[activeRole ?? 'client'];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAF8F5] text-[#1F2923] flex flex-col selection:bg-[#11361E] selection:text-white">
      {/* Premium Accent Bar */}
      <header className="w-full border-b border-[#E9E2D8]/80 bg-[linear-gradient(90deg,rgba(255,250,246,0.95),rgba(247,242,232,0.95))] py-1 shadow-[0_1px_0_rgba(17,54,30,0.04)]">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs text-[#6B6B6B]">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#11361E] px-2 py-0.5 text-[11px] font-semibold text-white">Premium</span>
            <span className="font-medium text-[#11361E]">Now with refined proposals, curated providers, and seamless shortlist decisions</span>
          </div>
          <div>
            <button onClick={() => handleOpenAuth('login', 'client')} className="text-xs font-medium text-[#11361E] underline decoration-[#11361E]/40 underline-offset-4">Quick demo</button>
          </div>
        </div>
      </header>

      {/* Top Sticky Navigation */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        onOpenPostRequirement={() => {
          if (!user) handleOpenAuth('signup', 'client');
          else setShowWizard(true);
        }}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Unauthenticated / Hero Showcase Banner */}
        {!user && (
          <div className="space-y-6">
            <div className="hero-shell glass-panel relative overflow-hidden rounded-[36px] border border-[#E2DDD3]/80 p-8 shadow-[0_24px_80px_rgba(17,54,30,0.12)] md:p-12">
              <div className="hero-ambient absolute inset-0" />
              <div className="mesh-sheen absolute inset-0 opacity-80" />
              <div className="floating-orb left-[-4rem] top-[-3rem]" />
              <div className="floating-orb bottom-[-5rem] right-[-3rem]" />
              <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div className="max-w-2xl space-y-5">
                  <div className="inline-flex items-center space-x-2 rounded-full border border-[#11361E]/20 bg-[#E8F0EA] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-[#11361E]">
                    <Sparkles className="h-3.5 w-3.5 text-[#11361E]" />
                    <span>Surat, Gujarat's Premier Event Bidding Engine</span>
                  </div>

                  <h1 className="max-w-3xl text-4xl font-serif leading-tight text-[#11361E] sm:text-5xl lg:text-6xl">
                    Blind reverse bidding for <span className="italic">weddings & major events</span>
                  </h1>

                  <p className="max-w-2xl text-sm leading-relaxed text-[#5A6B5D] sm:text-base">
                    Post your event requirements once. Verified photographers, caterers, decorators, and full-service planners submit competing blind proposals. Compare on price and plan quality alone — identities reveal only when it matters most.
                  </p>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => handleOpenAuth('signup', 'client')}
                      className="flex items-center space-x-2 rounded-full bg-[#11361E] px-6 py-3 text-xs font-semibold text-white shadow-[0_12px_36px_rgba(17,54,30,0.2)] transition hover:-translate-y-0.5 hover:bg-[#0B2414] sm:text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Post Event Requirement</span>
                    </button>

                    <button
                      onClick={() => handleOpenAuth('signup', 'provider')}
                      className="flex items-center space-x-2 rounded-full border border-[#D8D2C6] bg-[#F0ECE3] px-6 py-3 text-xs font-medium text-[#11361E] transition hover:-translate-y-0.5 hover:bg-[#E5E0D5] sm:text-sm"
                    >
                      <Briefcase className="h-4 w-4 text-[#11361E]" />
                      <span>Apply as Verified Provider</span>
                    </button>

                    <button
                      onClick={() => handleOpenAuth('login', 'client')}
                      className="flex items-center space-x-2 rounded-full border border-[#11361E]/40 bg-white px-6 py-3 text-xs font-medium text-[#11361E] transition hover:-translate-y-0.5 hover:bg-[#FAF8F5] sm:text-sm"
                    >
                      <Lock className="h-4 w-4 text-[#11361E]" />
                      <span>Log In / Demo Accounts</span>
                    </button>
                  </div>

                  <div className="grid gap-3 pt-2 sm:grid-cols-3">
                    {[
                      { label: 'Verified providers', value: '100+' },
                      { label: 'Blind rounds', value: '24/7' },
                      { label: 'Shortest shortlist', value: '< 48h' }
                    ].map((stat) => (
                      <div key={stat.label} className="surface-card rounded-2xl border border-[#E2DDD3]/80 bg-white/80 px-4 py-3 text-center shadow-sm">
                        <div className="text-xl font-semibold text-[#11361E]">{stat.value}</div>
                        <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[#5A6B5D]">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="surface-card rounded-[30px] border border-[#E2DDD3]/80 bg-[linear-gradient(135deg,rgba(247,242,232,0.98),rgba(242,236,225,0.96))] p-6 md:p-7">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5A6B5D]">Platform experience</p>
                      <h2 className="mt-2 text-xl font-serif text-[#11361E]">Designed to feel premium end-to-end</h2>
                    </div>
                    <div className="rounded-full bg-[#E8F0EA] p-2 text-[#11361E]">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {[
                      'One polished requirement intake instead of messy back-and-forth',
                      'Neutral scoring and side-by-side comparison for better decisions',
                      'Smart, role-aware dashboards that keep the work flowing'
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3 rounded-2xl border border-[#E2DDD3] bg-white/80 px-4 py-3 text-sm text-[#1F2923] shadow-sm">
                        <div className="mt-0.5 rounded-full bg-[#E8F0EA] p-1 text-[#11361E]">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                { title: 'Faster decisions', copy: 'Structured bidding keeps every round calm and clear.', icon: Zap },
                { title: 'Clearer trust', copy: 'Verified providers and clean summaries build confidence quickly.', icon: ShieldCheck },
                { title: 'Better discovery', copy: 'The right opportunities surface without noisy clutter.', icon: Compass }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="surface-card rounded-[24px] border border-[#E2DDD3]/80 bg-white/85 p-5 shadow-[0_12px_32px_rgba(17,54,30,0.05)]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8F0EA] text-[#11361E]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-semibold text-[#1F2923]">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#5A6B5D]">{item.copy}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="surface-card rounded-[28px] border border-[#E2DDD3]/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,248,245,0.95))] p-6 shadow-[0_16px_44px_rgba(17,54,30,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#E8F0EA] p-2 text-[#11361E]">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5A6B5D]">Why it feels elevated</p>
                    <h3 className="text-xl font-serif text-[#11361E]">Premium workflow, without the clutter</h3>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {[
                    { title: 'Blind bidding', copy: 'Keep the first round objective and let quality speak before identities do.', icon: Users },
                    { title: 'Transparent comparisons', copy: 'Evaluate plans and pricing side-by-side in one place.', icon: Star },
                    { title: 'Verified trust', copy: 'Provider credibility is front and center so clients can move with confidence.', icon: ShieldCheck },
                    { title: 'Real-time momentum', copy: 'Chat threads and proposal updates keep the negotiation alive.', icon: Briefcase }
                  ].map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <div key={feature.title} className="rounded-2xl border border-[#E2DDD3] bg-[#FAF8F5] p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#11361E] shadow-sm">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h4 className="mt-4 font-semibold text-[#1F2923]">{feature.title}</h4>
                        <p className="mt-2 text-sm leading-relaxed text-[#5A6B5D]">{feature.copy}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[28px] border border-[#11361E]/15 bg-gradient-to-br from-[#11361E] via-[#17472A] to-[#0B2414] p-6 text-white shadow-[0_18px_54px_rgba(17,54,30,0.22)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">How the flow works</p>
                <h3 className="mt-3 text-2xl font-serif">Three steps to a stronger shortlist</h3>
                <div className="mt-6 space-y-4">
                  {[
                    { title: '1. Post once', copy: 'Share your event brief, budget, and preferred service mix.' },
                    { title: '2. Receive tailored bids', copy: 'Providers respond with pricing and a plan — still blind at first.' },
                    { title: '3. Shortlist with confidence', copy: 'Compare, discuss, and move forward once the fit is obvious.' }
                  ].map((step) => (
                    <div key={step.title} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <div className="font-semibold">{step.title}</div>
                      <p className="mt-1 text-sm leading-relaxed text-emerald-50/90">{step.copy}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {user && (
          <div className="hero-shell relative overflow-hidden rounded-[36px] border border-white/15 bg-gradient-to-br from-[#11361E] via-[#17472A] to-[#0B2414] p-6 text-white shadow-[0_24px_80px_rgba(17,54,30,0.16)] md:p-8">
            <div className="hero-ambient absolute inset-0 opacity-40" />
            <div className="absolute inset-y-0 right-[-10%] hidden w-56 rounded-full bg-emerald-400/20 blur-[120px] lg:block" />
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-600">Welcome back</p>
                <h2 className="mt-2 text-2xl font-serif sm:text-3xl text-[#11361E]">{roleHeadline}</h2>
                <p className="mt-3 text-sm leading-relaxed text-emerald-900 sm:text-base">{roleDescription}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeRole !== 'client' && (
                  <button
                    onClick={() => switchRoleView('client')}
                    className="rounded-full border border-emerald/15 bg-emerald-100/50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-white/20"
                  >
                    Open client view
                  </button>
                )}
                {activeRole !== 'provider' && (
                  <button
                    onClick={() => switchRoleView('provider')}
                    className="rounded-full border border-emerald/15 bg-emerald/90 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-white/20"
                  >
                    Open provider view
                  </button>
                )}
              </div>
            </div>

            <div className="relative z-10 mt-6 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Live decisions', value: 'Real-time', icon: Sparkles },
                  { label: 'Trust layer', value: 'Verified', icon: ShieldCheck },
                  { label: 'Momentum', value: 'Fast follow-up', icon: Briefcase }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-500">
                        <Icon className="h-4 w-4 text-emerald-400" />
                        <span>{item.label}</span>
                      </div>
                      <div className="mt-2 text-xl font-semibold text-[#11361E]/80">{item.value}</div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-500">
                  <Rocket className="h-4 w-4 text-emerald-400" />
                  <span>What you can do next</span>
                </div>
                <div className="mt-3 space-y-2 text-sm text-[#11361E]/90">
                  <div className="rounded-2xl bg-white/10 px-3 py-2">⦿ Launch a new requirement or jump into a live negotiation.</div>
                  <div className="rounded-2xl bg-white/10 px-3 py-2">⦿ Review proposals side-by-side without the usual clutter.</div>
                  <div className="rounded-2xl bg-white/10 px-3 py-2">⦿ Stay on top of trust signals, messages, and bookings.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Views - Only rendered for authenticated users */}
        {user && activeRole === 'client' && (
          <ClientDashboard onOpenPostWizard={() => setShowWizard(true)} />
        )}

        {user && activeRole === 'provider' && (
          <ProviderDashboard />
        )}

        {user && activeRole === 'admin' && (
          <AdminDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2DDD3] bg-[linear-gradient(180deg,rgba(245,242,235,0.95),rgba(240,236,227,0.98))] py-6 text-center text-xs text-[#5A6B5D]">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#11361E]" />
            <span className="font-serif italic font-semibold text-[#11361E]">EventConnect</span>
            <span>— Single-Region Blind Bidding Event Marketplace</span>
          </div>
          <div className="text-[#5A6B5D]">
            Free Platform • No In-App Commission Model • Verified Providers
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
        initialRole={authRole}
      />

      {/* Requirement Wizard Modal */}
      <RequirementWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={() => {
          // Switch to client view
          switchRoleView('client');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

