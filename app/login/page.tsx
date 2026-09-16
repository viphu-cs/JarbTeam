'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { signInAction } from '@/actions/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Users, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await signInAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#D4E6F1] text-[#0B3B4B] border border-[#BEE3F8] mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
            Welcome Back
          </h1>
          <p className="mt-1.5 text-sm text-[#64748B]">
            Log in to continue collaborating on JarbTeam.
          </p>
        </div>

        <Card className="bg-white shadow-[0_4px_20px_rgba(15,23,42,0.03)] border-[#E2E8F0]">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="University Email"
              name="email"
              type="email"
              placeholder="student@university.edu"
              required
              disabled={isPending}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Enter your password"
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
                {isPending ? 'Signing in...' : 'Sign In'}
                {!isPending && <ArrowRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-[#F1F5F9] text-center text-xs text-[#64748B]">
            Don&apos;t have an account yet?{' '}
            <Link
              href="/signup"
              className="font-semibold text-[#0B3B4B] hover:underline"
            >
              Sign up
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
