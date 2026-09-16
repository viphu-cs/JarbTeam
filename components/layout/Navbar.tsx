import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { signOutAction } from '@/actions/auth';
import { Users, PlusCircle, Compass, FolderKanban, Inbox, UserCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { LanguageSwitcher } from '@/components/language-switcher';

export async function Navbar() {
  const t = await getTranslations('common');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-[#E2E8F0]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-2xl bg-[#D4E6F1] flex items-center justify-center text-[#0B3B4B] border border-[#BEE3F8] group-hover:bg-[#BEE3F8] transition-colors">
            <Users className="w-5 h-5 text-[#0B3B4B]" />
          </div>
          <span className="font-bold text-lg text-[#0F172A] tracking-tight">
            Jarb<span className="text-[#3b6475]">Team</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/projects"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F0F4F8] rounded-xl transition-all"
          >
            <Compass className="w-4 h-4 text-[#7CA5B8]" />
            {t('explore')}
          </Link>

          {user && (
            <>
              <Link
                href="/projects/create"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F0F4F8] rounded-xl transition-all"
              >
                <PlusCircle className="w-4 h-4 text-[#A78BFA]" />
                {t('createProject')}
              </Link>
              <Link
                href="/my-projects"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F0F4F8] rounded-xl transition-all"
              >
                <FolderKanban className="w-4 h-4 text-[#7CA5B8]" />
                {t('myProjects')}
              </Link>
              <Link
                href="/join-requests"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F0F4F8] rounded-xl transition-all"
              >
                <Inbox className="w-4 h-4 text-[#F472B6]" />
                {t('requests')}
              </Link>
            </>
          )}
        </nav>

        {/* User / Auth Actions & Language Switcher */}
        <div className="flex items-center gap-2.5">
          <LanguageSwitcher />

          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-1.5 bg-[#FAF9F6] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-2xl text-xs font-medium text-[#0F172A] transition-all"
              >
                <UserCircle className="w-4 h-4 text-[#7CA5B8]" />
                <span className="max-w-[100px] sm:max-w-[120px] truncate">
                  {profile?.full_name || t('profile')}
                </span>
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="text-xs font-medium text-[#64748B] hover:text-[#0F172A] px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  {t('logout')}
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs font-semibold text-[#334155] hover:text-[#0F172A] rounded-xl transition-colors"
              >
                {t('login')}
              </Link>
              <Link
                href="/signup"
                className="px-3.5 py-1.5 text-xs font-semibold bg-[#D4E6F1] text-[#0F172A] border border-[#BEE3F8] hover:bg-[#BEE3F8] rounded-xl transition-colors shadow-sm"
              >
                {t('signup')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
