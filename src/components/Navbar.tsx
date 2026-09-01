import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Bell,
  MapPin,
  User as UserIcon,
  LogOut,
  ShieldAlert,
  Briefcase,
  PlusCircle
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: (initialMode?: 'login' | 'signup', initialRole?: 'client' | 'provider') => void;
  onOpenPostRequirement?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onOpenPostRequirement }) => {
  const {
    user,
    providerProfile,
    activeRole,
    switchRoleView,
    logout,
    notifications,
    unreadNotifsCount,
    markNotifsRead
  } = useAuth();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#E2DDD3]/80 bg-[linear-gradient(90deg,rgba(250,248,245,0.96),rgba(247,242,232,0.95))] backdrop-blur-xl text-[#1F2923] shadow-[0_8px_24px_rgba(17,54,30,0.04)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#11361E]/25 bg-gradient-to-br from-[#E8F0EA] to-[#F7F2E8] shadow-[0_10px_22px_rgba(17,54,30,0.08)]">
            <Sparkles className="h-5 w-5 text-[#11361E]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif text-xl font-bold tracking-tight text-[#11361E]">EventConnect</span>
              
            </div>
            <p className="hidden text-[11px] uppercase tracking-[0.2em] text-[#5A6B5D] sm:block">Premium Event Marketplace</p>
          </div>
        </div>

        <div className="hidden items-center space-x-2 rounded-full border border-[#E2DDD3]/80 bg-white/80 px-3 py-1.5 text-xs text-[#5A6B5D] shadow-sm md:flex">
          <MapPin className="h-3.5 w-3.5 text-[#11361E]" />
          <span>
            Launch Region: <strong className="text-[#1F2923]">Surat, Gujarat, India</strong>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {user ? (
            <>
              {/* Account Role Badge */}
              <div className="surface-card flex items-center space-x-2 rounded-full border border-[#E2DDD3] bg-white/90 px-3 py-1.5 text-xs font-medium text-[#1F2923] shadow-sm">
                {user.role === 'client' && (
                  <>
                    <UserIcon className="h-3.5 w-3.5 text-[#11361E]" />
                    <span className="font-semibold text-[#11361E]">Client Account</span>
                  </>
                )}
                {user.role === 'provider' && (
                  <>
                    <Briefcase className="h-3.5 w-3.5 text-[#11361E]" />
                    <span className="font-semibold text-[#11361E]">Provider Account</span>
                  </>
                )}
                {user.role === 'admin' && (
                  <>
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                    <span className="font-semibold text-rose-700">Admin Portal</span>
                  </>
                )}
              </div>

              {/* Quick Action Button */}
              {activeRole === 'client' && onOpenPostRequirement && (
                <button
                  onClick={onOpenPostRequirement}
                  className="flex items-center space-x-1.5 rounded-full bg-[#11361E] px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_8px_22px_rgba(17,54,30,0.16)] transition hover:-translate-y-0.5 hover:bg-[#0B2414]"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Post Requirement</span>
                </button>
              )}

              {/* Notifications Popover */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifs(!showNotifs);
                    if (!showNotifs && unreadNotifsCount > 0) markNotifsRead();
                  }}
                  className="relative rounded-full border border-[#E2DDD3] bg-white/90 p-2 text-[#5A6B5D] transition hover:bg-[#F5F2EB] hover:text-[#11361E]"
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotifsCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#11361E] text-[10px] font-bold text-white">
                      {unreadNotifsCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E2DDD3] rounded-lg shadow-xl p-3 z-50 text-xs">
                    <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-2 mb-2">
                      <span className="font-semibold text-[#1F2923]">Notifications</span>
                      <button
                        onClick={markNotifsRead}
                        className="text-[11px] text-[#11361E] font-semibold hover:underline"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-[#5A6B5D] text-center py-4">No notifications yet.</p>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div
                            key={n.id}
                            className={`p-2 rounded border text-xs ${
                              n.isRead ? 'bg-[#FAF8F5] border-[#E2DDD3] text-[#5A6B5D]' : 'bg-[#E8F0EA]/60 border-[#11361E]/30 text-[#1F2923]'
                            }`}
                          >
                            <div className="font-semibold text-[#11361E] mb-0.5">{n.title}</div>
                            <p className="text-[11px] text-[#5A6B5D]">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile & Logout */}
              <div className="flex items-center space-x-2 pl-2 border-l border-[#E2DDD3]">
                <div className="text-right hidden lg:block">
                  <div className="text-xs font-semibold text-[#1F2923]">{user.name}</div>
                  <div className="text-[10px] text-[#5A6B5D] uppercase tracking-wider">{user.role}</div>
                </div>
                <button
                  onClick={logout}
                  title="Log Out"
                  className="rounded-full border border-[#E2DDD3] bg-white/90 p-2 text-[#5A6B5D] transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="text-xs font-medium text-[#11361E] hover:text-[#0B2414] px-3 py-1.5 rounded-md border border-[#E2DDD3] bg-white hover:bg-[#FAF8F5] transition"
              >
                Log In
              </button>
              <button
                onClick={() => onOpenAuth('signup', 'client')}
                className="text-xs font-semibold bg-[#11361E] hover:bg-[#0B2414] text-white px-3.5 py-1.5 rounded-md transition shadow-sm"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
