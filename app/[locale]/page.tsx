import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import {
  FolderPlus,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export const revalidate = 60;

export default async function HomePage() {
  const t = await getTranslations('home');
  const supabase = await createClient();

  // Fetch count of open projects
  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open');

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col justify-center max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20">
      {/* Minimal Academic Hero */}
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-4">
        <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-[#0F172A] leading-snug sm:leading-tight">
          {t('titleLine1')}
          <br />
          <span className="text-[#3b6475]">{t('titleLine2')}</span>
        </h1>

        <p className="text-sm sm:text-base text-[#64748B] max-w-lg mx-auto">
          {t('subtitle')}
        </p>

        {projectCount !== null && projectCount > 0 && (
          <p className="text-xs text-[#64748B] pt-1">
            {t('activeProjectsCount', { count: projectCount })}
          </p>
        )}
      </div>

      {/* The Two Major Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto w-full">
        {/* ACTION 1: CREATE PROJECT */}
        <div className="rounded-[28px] p-7 sm:p-8 bg-gradient-to-br from-[#E8F1F5] to-[#D4E6F1] border border-[#BEE3F8] shadow-[0_4px_24px_rgba(124,165,184,0.12)] flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/90 text-[#0B3B4B] flex items-center justify-center border border-[#BEE3F8] shadow-xs">
              <FolderPlus className="w-6 h-6 text-[#3b6475]" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#3b6475]">
                {t('createTag')}
              </span>
              <h2 className="text-2xl font-bold text-[#0F172A] mt-1">
                {t('createTitle')}
              </h2>
            </div>

            <p className="text-sm text-[#334155] leading-relaxed whitespace-pre-line">
              {t('createDesc')}
            </p>
          </div>

          <div className="mt-8 pt-4">
            <Link href="/projects/create" className="block">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                className="bg-white hover:bg-[#FAF9F6] text-[#0F172A] border-white/80 shadow-xs font-semibold"
              >
                <span>{t('createButton')}</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* ACTION 2: JOIN PROJECT */}
        <div className="rounded-[28px] p-7 sm:p-8 bg-gradient-to-br from-[#EDE9FE] to-[#E0E7FF] border border-[#DDD6FE] shadow-[0_4px_24px_rgba(167,139,250,0.12)] flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/90 text-[#3F1E8C] flex items-center justify-center border border-[#DDD6FE] shadow-xs">
              <Compass className="w-6 h-6 text-[#674bb5]" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#674bb5]">
                {t('joinTag')}
              </span>
              <h2 className="text-2xl font-bold text-[#0F172A] mt-1">
                {t('joinTitle')}
              </h2>
            </div>

            <p className="text-sm text-[#334155] leading-relaxed whitespace-pre-line">
              {t('joinDesc')}
            </p>
          </div>

          <div className="mt-8 pt-4">
            <Link href="/projects" className="block">
              <Button
                variant="accent"
                size="lg"
                fullWidth
                className="bg-white hover:bg-[#FAF9F6] text-[#0F172A] border-white/80 shadow-xs font-semibold"
              >
                <span>{t('joinButton')}</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
