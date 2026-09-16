'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { signUpAction } from '@/actions/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { GraduationCap, ArrowRight } from 'lucide-react';

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await signUpAction(formData);
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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#EDE9FE] text-[#3F1E8C] border border-[#E0E7FF] mb-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
            Join JarbTeam
          </h1>
          <p className="mt-1.5 text-sm text-[#64748B]">
            Find project teammates across your university.
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
              label="Full Name"
              name="fullName"
              placeholder="e.g. Alex Chen"
              required
              disabled={isPending}
            />

            <Input
              label="University Email"
              name="email"
              type="email"
              placeholder="student@university.edu"
              helperText="Use your university academic email address."
              required
              disabled={isPending}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="At least 6 characters"
              required
              disabled={isPending}
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
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
                {isPending ? 'Creating account...' : 'Create Account'}
                {!isPending && <ArrowRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-[#F1F5F9] text-center text-xs text-[#64748B]">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-[#0B3B4B] hover:underline"
            >
              Log in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
