'use client';

import React, { useState, useTransition } from 'react';
import { Profile, Skill, Interest, WorkStyle, ProjectType } from '@/types';
import { updateProfileAction } from '@/actions/profile';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { ChipInput } from '@/components/profile/ChipInput';
import { User, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getProjectTypeLabel, getWorkStyleLabel } from '@/lib/utils/labels';
import { AvatarUpload } from '@/components/avatar-upload';

interface ProfileEditFormProps {
  initialProfile: Profile;
  availableSkills: Skill[];
  availableInterests: Interest[];
}

const COMMON_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full-stack Developer',
  'UI/UX Designer',
  'Product Manager',
  'Data Scientist',
  'ML Engineer',
  'Mobile Developer',
  'Business / Pitch Lead',
];

const PROJECT_TYPES: ProjectType[] = [
  'Course Project',
  'Competition',
  'Hackathon',
  'Innovation',
  'Startup',
  'Other',
];

const WORK_STYLES: WorkStyle[] = ['Online', 'On-site', 'Hybrid'];

export function ProfileEditForm({
  initialProfile,
  availableSkills,
  availableInterests,
}: ProfileEditFormProps) {
  const t = useTranslations('profileEdit');
  const tCommon = useTranslations('common');

  const [fullName, setFullName] = useState(initialProfile.full_name || '');
  const [university, setUniversity] = useState(initialProfile.university || '');
  const [major, setMajor] = useState(initialProfile.major || '');
  const [bio, setBio] = useState(initialProfile.bio || '');
  const [workStyle, setWorkStyle] = useState<WorkStyle>(
    initialProfile.work_style || 'Hybrid'
  );
  const [availability, setAvailability] = useState(
    initialProfile.availability || ''
  );

  const [skills, setSkills] = useState<string[]>(
    initialProfile.skills?.map((s) => s.name) || []
  );
  const [interests, setInterests] = useState<string[]>(
    initialProfile.interests?.map((i) => i.name) || []
  );
  const [preferredRoles, setPreferredRoles] = useState<string[]>(
    initialProfile.preferred_roles || []
  );
  const [preferredTypes, setPreferredTypes] = useState<string[]>(
    initialProfile.preferred_project_types || []
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    initialProfile.avatar_url || null
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleProjectType = (type: string) => {
    if (preferredTypes.includes(type)) {
      setPreferredTypes(preferredTypes.filter((t) => t !== type));
    } else {
      setPreferredTypes([...preferredTypes, type]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateProfileAction({
        fullName,
        university,
        major,
        bio,
        avatarUrl: avatarUrl !== null ? avatarUrl : '',
        workStyle,
        availability,
        preferredRoles,
        preferredProjectTypes: preferredTypes,
        skillNames: skills,
        interestNames: interests,
      });

      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <Card className="bg-white border-[#E2E8F0] space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#F1F5F9]">
          <User className="w-5 h-5 text-[#7CA5B8]" />
          <h2 className="text-base font-semibold text-[#0F172A]">
            {t('personalSection')}
          </h2>
        </div>

        <AvatarUpload
          userId={initialProfile.id}
          fullName={fullName}
          avatarUrl={avatarUrl}
          onChange={setAvatarUrl}
          onUploadingChange={setIsUploadingAvatar}
          disabled={isPending}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('fullName')}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={isPending}
          />
          <Input
            label={t('university')}
            value={university}
            placeholder={t('universityPlaceholder')}
            onChange={(e) => setUniversity(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('major')}
            value={major}
            placeholder={t('majorPlaceholder')}
            onChange={(e) => setMajor(e.target.value)}
            disabled={isPending}
          />
          <Input
            label={t('availability')}
            value={availability}
            placeholder={t('availabilityPlaceholder')}
            onChange={(e) => setAvailability(e.target.value)}
            disabled={isPending}
          />
        </div>

        <Textarea
          label={t('bio')}
          value={bio}
          rows={3}
          placeholder={t('bioPlaceholder')}
          onChange={(e) => setBio(e.target.value)}
          disabled={isPending}
        />

        <div>
          <label className="block text-xs font-semibold text-[#0F172A] mb-2 tracking-wide">
            {t('workStyle')}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {WORK_STYLES.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setWorkStyle(style)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  workStyle === style
                    ? 'bg-[#D4E6F1] text-[#0B3B4B] border-[#BEE3F8] ring-2 ring-[#D4E6F1]'
                    : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#FAF9F6]'
                }`}
              >
                {getWorkStyleLabel(tCommon, style)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Skills & Roles */}
      <Card className="bg-white border-[#E2E8F0] space-y-6">
        <div className="pb-2 border-b border-[#F1F5F9]">
          <h2 className="text-base font-semibold text-[#0F172A]">
            {t('skillsSection')}
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            {t('skillsSubtitle')}
          </p>
        </div>

        <ChipInput
          label={t('skillsLabel')}
          helperText={t('skillsHelper')}
          values={skills}
          onChange={setSkills}
          suggestions={availableSkills.map((s) => s.name)}
          variant="blue"
        />

        <ChipInput
          label={t('rolesLabel')}
          helperText={t('rolesHelper')}
          values={preferredRoles}
          onChange={setPreferredRoles}
          suggestions={COMMON_ROLES}
          variant="lavender"
        />

        <ChipInput
          label={t('interestsLabel')}
          helperText={t('interestsHelper')}
          values={interests}
          onChange={setInterests}
          suggestions={availableInterests.map((i) => i.name)}
          variant="pink"
        />

        <div>
          <label className="block text-xs font-semibold text-[#0F172A] mb-2 tracking-wide">
            {t('typesLabel')}
          </label>
          <div className="flex flex-wrap gap-2">
            {PROJECT_TYPES.map((type) => {
              const selected = preferredTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleProjectType(type)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    selected
                      ? 'bg-[#FEF9C3] text-[#713F12] border-[#FEF08A] ring-1 ring-[#FEF08A]'
                      : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-[#F1F5F9]'
                  }`}
                >
                  {selected && <Check className="w-3 text-[#713F12]" />}
                  {getProjectTypeLabel(tCommon, type)}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isPending || isUploadingAvatar}
          className="shadow-sm cursor-pointer"
        >
          {isPending ? t('savingButton') : t('saveButton')}
        </Button>
      </div>
    </form>
  );
}
