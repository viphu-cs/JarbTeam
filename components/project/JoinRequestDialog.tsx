'use client';

import React, { useState, useTransition } from 'react';
import { submitJoinRequestAction } from '@/actions/requests';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Send, X, CheckCircle2 } from 'lucide-react';

interface JoinRequestDialogProps {
  projectId: string;
  projectName: string;
  requiredRoles: string[];
}

export function JoinRequestDialog({
  projectId,
  projectName,
  requiredRoles,
}: JoinRequestDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [requestedRole, setRequestedRole] = useState(
    requiredRoles[0] || 'Team Member'
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await submitJoinRequestAction(
        projectId,
        requestedRole,
        message
      );

      if (res?.error) {
        setError(res.error);
      } else {
        setSubmitted(true);
      }
    });
  };

  if (submitted) {
    return (
      <div className="p-4 rounded-2xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#14532D] flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <div className="text-xs">
          <strong className="block font-semibold">Join request sent!</strong>
          The project lead will review your request. You can track this under My Requests.
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <Button
        variant="primary"
        size="lg"
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto shadow-sm"
      >
        <Send className="w-4 h-4 mr-1.5" />
        Request to Join
      </Button>
    );
  }

  return (
    <div className="p-5 rounded-3xl bg-[#FAF9F6] border border-[#CBD5E1] space-y-4 text-left">
      <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
        <div>
          <h3 className="font-bold text-sm text-[#0F172A]">
            Request to Join &ldquo;{projectName}&rdquo;
          </h3>
          <p className="text-xs text-[#64748B]">
            Introduce yourself to the project owner.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-[#0F172A] mb-1">
            Role you want to take on
          </label>
          {requiredRoles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {requiredRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setRequestedRole(role)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    requestedRole === role
                      ? 'bg-[#EDE9FE] text-[#3F1E8C] border-[#E0E7FF]'
                      : 'bg-white text-[#475569] border-[#E2E8F0]'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          )}
          <Input
            value={requestedRole}
            placeholder="e.g. Frontend Developer, Researcher"
            onChange={(e) => setRequestedRole(e.target.value)}
            required
            disabled={isPending}
          />
        </div>

        <Textarea
          label="Message to Project Lead"
          placeholder="Briefly explain what you'd like to work on and why you're excited about this project..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          disabled={isPending}
        />

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isPending}
          >
            {isPending ? 'Sending...' : 'Send Request'}
          </Button>
        </div>
      </form>
    </div>
  );
}
