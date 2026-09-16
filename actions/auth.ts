'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export interface AuthActionResult {
  error?: string;
  success?: boolean;
}

async function getLocale(): Promise<string> {
  const cookieStore = await cookies();
  const loc = cookieStore.get('NEXT_LOCALE')?.value;
  return loc === 'en' || loc === 'th' ? loc : 'th';
}

export async function signUpAction(formData: FormData): Promise<AuthActionResult> {
  const fullName = formData.get('fullName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!fullName || !email || !password || !confirmPassword) {
    return { error: 'Please fill in all required fields.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If user is returned and session exists, ensure profile is initialized
  if (data.user) {
    const locale = await getLocale();
    await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      email: email,
      preferred_language: locale,
      updated_at: new Date().toISOString(),
    });
  }

  const locale = await getLocale();
  redirect(`/${locale}/profile/edit`);
}

export async function signInAction(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please enter your email and password.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const locale = await getLocale();
  redirect(`/${locale}`);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const locale = await getLocale();
  redirect(`/${locale}/login`);
}
