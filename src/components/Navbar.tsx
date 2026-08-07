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
  PlusCircle,
  CheckCircle2,
  Clock,
  Layers,
  ChevronDown
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
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E2DDD3] text-[#1F2923]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#E8F0EA] border border-[#11361E]/30 p-0.5 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-[#11361E]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif italic font-bold text-xl tracking-tight text-[#11361E]">EventConnect</span>
              <span className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded bg-[#E8F0EA] text-[#11361E] border border-[#11361E]/20">
                Blind Bidding
              </span>
            </div>
            <p className="text-[11px] text-[#5A6B5D] uppercase tracking-wider hidden sm:block">Premium Event Marketplace</p>
          </div>
        </div>

        {/* Location Scope Indicator */}
        <div className="hidden md:flex items-center space-x-2 bg-white px-3 py-1.5 rounded-md border border-[#E2DDD3] text-xs text-[#5A6B5D]">
          <MapPin className="w-3.5 h-3.5 text-[#11361E]" />
          <span>Launch Region: <strong className="text-[#1F2923]">Surat, Gujarat, India</strong></span>
        </div>

        {/* Right Nav Actions */}
        <div className="flex items-center space-x-3">
          {user ? (
            <>
              {/* Account Role Badge */}
              <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-md border border-[#E2DDD3] text-xs font-medium text-[#1F2923]">
                {user.role === 'client' && (
                  <>
                    <UserIcon className="w-3.5 h-3.5 text-[#11361E]" />
                    <span className="text-[#11361E] font-semibold">Client Account</span>
                  </>
                )}
                {user.role === 'provider' && (
                  <>
                    <Briefcase className="w-3.5 h-3.5 text-[#11361E]" />
                    <span className="text-[#11361E] font-semibold">Provider Account</span>
                  </>
                )}
                {user.role === 'admin' && (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span className="text-rose-700 font-semibold">Admin Portal</span>
                  </>
                )}
              </div>

              {/* Quick Action Button */}
              {activeRole === 'client' && onOpenPostRequirement && (
                <button
                  onClick={onOpenPostRequirement}
                  className="bg-[#11361E] hover:bg-[#0B2414] text-white font-semibold px-3.5 py-1.5 rounded-md text-xs flex items-center space-x-1.5 transition shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
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
                  className="relative p-2 rounded-md bg-white hover:bg-[#F5F2EB] text-[#5A6B5D] hover:text-[#11361E] border border-[#E2DDD3] transition"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#11361E] text-white font-bold text-[10px] rounded-full flex items-center justify-center">
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
                  className="p-2 rounded-md bg-white hover:bg-rose-50 hover:text-rose-600 text-[#5A6B5D] border border-[#E2DDD3] transition"
                >
                  <LogOut className="w-4 h-4" />
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
