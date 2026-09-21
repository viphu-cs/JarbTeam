'use client';

import React, { useState, useEffect } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { signOutAction } from '@/actions/auth';
import {
  Menu,
  X,
  Compass,
  PlusCircle,
  FolderKanban,
  Inbox,
  MessageSquare,
  User,
  Home,
  LogOut,
  LogIn,
  UserPlus2,
} from 'lucide-react';
import Image from 'next/image';
import { getInitials } from '@/lib/supabase/storage';
import { LanguageSwitcher } from '@/components/language-switcher';

interface MobileNavProps {
  user: boolean;
  profile: {
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
  hasUnreadMessages?: boolean;
}

export function MobileNav({ user, profile, hasUnreadMessages = false }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations('common');

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scrolling when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div className="md:hidden flex items-center gap-2">
      {/* Profile Avatar icon (if logged in) */}
      {user && (
        <Link
          href="/profile"
          className="relative w-8 h-8 rounded-full overflow-hidden border border-[#BEE3F8] shrink-0 focus:outline-none"
          aria-label={t('profile')}
        >
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt="Avatar"
              fill
              className="object-cover"
              sizes="32px"
            />
          ) : profile?.full_name ? (
            <div className="w-full h-full bg-[#D4E6F1] text-[#0B3B4B] flex items-center justify-center text-xs font-bold">
              {getInitials(profile.full_name)}
            </div>
          ) : (
            <div className="w-full h-full bg-[#F0F4F8] text-[#7CA5B8] flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          )}
        </Link>
      )}

      {/* Hamburger Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#FAF9F6] active:bg-[#F1F5F9] flex items-center justify-center text-[#0F172A] transition-colors relative cursor-pointer focus:outline-none"
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        {hasUnreadMessages && !isOpen && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F43F5E] ring-2 ring-white" />
        )}
      </button>

      {/* Mobile Drawer / Backdrop & Slide-down */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-16 bg-black/20 backdrop-blur-xs z-40 animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu Panel */}
          <div className="fixed inset-x-0 top-16 bg-white border-b border-[#E2E8F0] shadow-xl z-50 max-h-[calc(100vh-4rem)] overflow-y-auto animate-in slide-in-from-top-2 duration-150 p-4 space-y-4">
            {/* Primary Nav Links */}
            <nav className="space-y-1">
              <Link
                href="/"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#334155] hover:text-[#0F172A] hover:bg-[#F0F4F8] transition-colors"
              >
                <Home className="w-4 h-4 text-[#7CA5B8]" />
                <span>{t('home')}</span>
              </Link>

              <Link
                href="/projects"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#334155] hover:text-[#0F172A] hover:bg-[#F0F4F8] transition-colors"
              >
                <Compass className="w-4 h-4 text-[#7CA5B8]" />
                <span>{t('explore')}</span>
              </Link>

              {user ? (
                <>
                  <Link
                    href="/projects/create"
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#334155] hover:text-[#0F172A] hover:bg-[#F0F4F8] transition-colors"
                  >
                    <PlusCircle className="w-4 h-4 text-[#A78BFA]" />
                    <span>{t('createProject')}</span>
                  </Link>

                  <Link
                    href="/my-projects"
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#334155] hover:text-[#0F172A] hover:bg-[#F0F4F8] transition-colors"
                  >
                    <FolderKanban className="w-4 h-4 text-[#7CA5B8]" />
                    <span>{t('myProjects')}</span>
                  </Link>

                  <Link
                    href="/join-requests"
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#334155] hover:text-[#0F172A] hover:bg-[#F0F4F8] transition-colors"
                  >
                    <Inbox className="w-4 h-4 text-[#F472B6]" />
                    <span>{t('requests')}</span>
                  </Link>

                  <Link
                    href="/messages"
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#334155] hover:text-[#0F172A] hover:bg-[#F0F4F8] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-[#818CF8]" />
                      <span>{t('messages')}</span>
                    </div>
                    {hasUnreadMessages && (
                      <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
                    )}
                  </Link>

                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#334155] hover:text-[#0F172A] hover:bg-[#F0F4F8] transition-colors"
                  >
                    <User className="w-4 h-4 text-[#7CA5B8]" />
                    <span>{profile?.full_name || t('profile')}</span>
                  </Link>
                </>
              ) : (
                <div className="pt-2 grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-[#334155] bg-white border border-[#E2E8F0] hover:bg-[#FAF9F6] rounded-xl transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{t('login')}</span>
                  </Link>
                  <Link
                    href="/signup"
                    className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold bg-[#D4E6F1] text-[#0F172A] border border-[#BEE3F8] hover:bg-[#BEE3F8] rounded-xl transition-colors"
                  >
                    <UserPlus2 className="w-3.5 h-3.5" />
                    <span>{t('signup')}</span>
                  </Link>
                </div>
              )}
            </nav>

            {/* Divider & Utilities */}
            <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
              <span className="text-xs text-[#64748B] font-medium">
                Language
              </span>
              <LanguageSwitcher />
            </div>

            {/* Logout button (if logged in) */}
            {user && (
              <div className="pt-1 border-t border-[#F1F5F9]">
                <form action={signOutAction} className="w-full">
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('logout')}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
