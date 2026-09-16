'use client';

import React, { useState, useTransition, Suspense } from 'react';
import { Link } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signInAction } from '@/actions/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { Users, ArrowRight } from 'lucide-react';

function LoginForm() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');

  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const errorMessage = formError || urlError;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await signInAction(formData);
      if (result?.error) {
        setFormError(result.error);
      }
    });
  }

  return (
    <Card className="bg-white shadow-[0_4px_20px_rgba(15,23,42,0.03)] border-[#E2E8F0]">
      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
          {errorMessage}
        </div>
      )}

      {/* Google OAuth Button */}
      <GoogleAuthButton onError={setFormError} />

      <div className="relative my-5 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E2E8F0]" />
        </div>
        <span className="relative bg-white px-3 text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">
          {t('orWithEmail')}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('universityEmail')}
          name="email"
          type="email"
          placeholder={t('emailPlaceholder')}
          required
          disabled={isPending}
        />

        <Input
          label={t('password')}
          name="password"
          type="password"
          placeholder={t('passwordPlaceholder')}
          required
          disabled={isPending}
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="md"
            disabled={isPending}
          >
            {isPending ? t('signingIn') : t('signIn')}
            {!isPending && <ArrowRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </form>

      <div className="mt-6 pt-5 border-t border-[#F1F5F9] text-center text-xs text-[#64748B]">
        {t('dontHaveAccount')}{' '}
        <Link
          href="/signup"
          className="font-semibold text-[#0B3B4B] hover:underline"
        >
          {t('createAccount')}
        </Link>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  const t = useTranslations('auth');

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#D4E6F1] text-[#0B3B4B] border border-[#BEE3F8] mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
            {t('welcomeBack')}
          </h1>
          <p className="mt-1.5 text-sm text-[#64748B]">
            {t('loginSubtitle')}
          </p>
        </div>

        <Suspense fallback={<Card className="p-8 text-center text-xs text-[#64748B]">Loading...</Card>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
