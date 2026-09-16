'use client';

import React, { useState, useTransition } from 'react';
import { ProjectType, WorkStyle, Skill } from '@/types';
import { createProjectAction } from '@/actions/projects';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { ChipInput } from '@/components/profile/ChipInput';
import { FolderPlus, Users, ArrowRight } from 'lucide-react';

interface CreateProjectFormProps {
  availableSkills: Skill[];
}

const PROJECT_TYPES: ProjectType[] = [
  'Course Project',
  'Competition',
  'Hackathon',
  'Innovation',
  'Startup',
  'Other',
];

const WORK_STYLES: WorkStyle[] = ['Online', 'On-site', 'Hybrid'];

const COMMON_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full-stack Developer',
  'UI/UX Designer',
  'Product Manager',
  'Data Scientist',
  'Mobile Developer',
  'Hardware Engineer',
  'Researcher',
  'Presenter / Pitch Lead',
];

export function CreateProjectForm({ availableSkills }: CreateProjectFormProps) {
  const [name, setName] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('Course Project');
  const [description, setDescription] = useState('');
  const [teamSize, setTeamSize] = useState<number>(4);
  const [workStyle, setWorkStyle] = useState<WorkStyle>('Hybrid');
  const [duration, setDuration] = useState('');
  const [deadline, setDeadline] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [requiredRoles, setRequiredRoles] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a project name.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a project description.');
      return;
    }

    startTransition(async () => {
      const result = await createProjectAction({
        name,
        projectType,
        description,
        teamSize,
        workStyle,
        duration,
        deadline: deadline || undefined,
        requiredSkills,
        requiredRoles,
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

      {/* Main Details */}
      <Card className="bg-white border-[#E2E8F0] space-y-5 shadow-xs">
        <div className="flex items-center gap-2 pb-2 border-b border-[#F1F5F9]">
          <FolderPlus className="w-5 h-5 text-[#7CA5B8]" />
          <h2 className="text-base font-semibold text-[#0F172A]">
            Project Overview
          </h2>
        </div>

        <Input
          label="Project Name"
          placeholder="e.g. AI-Powered Campus Shuttle Tracker"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isPending}
        />

        <div>
          <label className="block text-xs font-semibold text-[#0F172A] mb-2 tracking-wide">
            Project Type
          </label>
          <div className="flex flex-wrap gap-2">
            {PROJECT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setProjectType(type)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                  projectType === type
                    ? 'bg-[#D4E6F1] text-[#0B3B4B] border-[#BEE3F8] ring-2 ring-[#D4E6F1]'
                    : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#FAF9F6]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <Textarea
          label="Description"
          placeholder="Explain the problem you're solving, project goals, tech expectations, and what teammates will be doing..."
          value={description}
          rows={4}
          onChange={(e) => setDescription(e.target.value)}
          required
          disabled={isPending}
        />
      </Card>

      {/* Team & Logistics */}
      <Card className="bg-white border-[#E2E8F0] space-y-5 shadow-xs">
        <div className="flex items-center gap-2 pb-2 border-b border-[#F1F5F9]">
          <Users className="w-5 h-5 text-[#A78BFA]" />
          <h2 className="text-base font-semibold text-[#0F172A]">
            Team Logistics & Requirements
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Target Team Size"
            type="number"
            min={2}
            max={12}
            value={teamSize}
            onChange={(e) => setTeamSize(parseInt(e.target.value) || 4)}
            helperText="Total members including you."
            required
            disabled={isPending}
          />

          <Input
            label="Duration"
            placeholder="e.g. 1 semester, 48 hours"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            disabled={isPending}
          />

          <Input
            label="Application Deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#0F172A] mb-2 tracking-wide">
            Work Style
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
                {style}
              </button>
            ))}
          </div>
        </div>

        <ChipInput
          label="Required Skills"
          helperText="Select or type the skills and technologies your project needs."
          values={requiredSkills}
          onChange={setRequiredSkills}
          suggestions={availableSkills.map((s) => s.name)}
          variant="blue"
        />

        <ChipInput
          label="Required Roles"
          helperText="Specify the roles you are recruiting for (e.g. Frontend Dev, UI Designer)."
          values={requiredRoles}
          onChange={setRequiredRoles}
          suggestions={COMMON_ROLES}
          variant="lavender"
        />
      </Card>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isPending}
          className="shadow-sm"
        >
          {isPending ? 'Publishing Project...' : 'Publish Project'}
          {!isPending && <ArrowRight className="w-4 h-4 ml-1" />}
        </Button>
      </div>
    </form>
  );
}
