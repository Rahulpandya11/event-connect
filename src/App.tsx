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
  ArrowRight,
  Plus
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

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1F2923] flex flex-col selection:bg-[#11361E] selection:text-white">
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
          <div className="relative p-8 md:p-12 rounded-2xl bg-white border border-[#E2DDD3] overflow-hidden shadow-sm">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-[#E8F0EA] border border-[#11361E]/30 text-[#11361E] text-[11px] font-medium tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#11361E]" />
                <span>Surat, Gujarat's Premier Event Bidding Engine</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-serif text-[#11361E] leading-tight">
                Blind Reverse Bidding for <span className="italic text-[#11361E]">Weddings & Major Events</span>
              </h1>

              <p className="text-sm sm:text-base text-[#5A6B5D] leading-relaxed">
                Post your event requirements once. Verified photographers, caterers, decorators, and full-service planners submit competing blind proposals. Compare on price & plan quality alone — identities reveal on shortlist!
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => handleOpenAuth('signup', 'client')}
                  className="px-6 py-3 rounded-md bg-[#11361E] hover:bg-[#0B2414] text-white font-semibold text-xs sm:text-sm flex items-center space-x-2 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Post Event Requirement</span>
                </button>

                <button
                  onClick={() => handleOpenAuth('signup', 'provider')}
                  className="px-6 py-3 rounded-md bg-[#F0ECE3] hover:bg-[#E5E0D5] text-[#11361E] font-medium text-xs sm:text-sm border border-[#D8D2C6] flex items-center space-x-2 transition"
                >
                  <Briefcase className="w-4 h-4 text-[#11361E]" />
                  <span>Apply as Verified Provider</span>
                </button>

                <button
                  onClick={() => handleOpenAuth('login', 'client')}
                  className="px-6 py-3 rounded-md bg-white hover:bg-[#FAF8F5] text-[#11361E] font-medium text-xs sm:text-sm border border-[#11361E]/40 flex items-center space-x-2 transition"
                >
                  <Lock className="w-4 h-4 text-[#11361E]" />
                  <span>Log In / Demo Accounts</span>
                </button>
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
      <footer className="bg-[#F5F2EB] border-t border-[#E2DDD3] py-6 text-center text-xs text-[#5A6B5D]">
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
