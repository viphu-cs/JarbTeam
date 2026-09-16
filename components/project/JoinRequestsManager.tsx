'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  acceptJoinRequestAction,
  rejectJoinRequestAction,
  cancelJoinRequestAction,
} from '@/actions/requests';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Inbox,
  Send,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  GraduationCap,
} from 'lucide-react';
import { JoinRequest } from '@/types';

interface JoinRequestsManagerProps {
  incomingRequests: JoinRequest[];
  sentRequests: JoinRequest[];
}

export function JoinRequestsManager({
  incomingRequests,
  sentRequests,
}: JoinRequestsManagerProps) {
  const [activeTab, setActiveTab] = useState<'incoming' | 'sent'>('incoming');
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const handleAccept = (requestId: string) => {
    setActionError(null);
    startTransition(async () => {
      const res = await acceptJoinRequestAction(requestId);
      if (res?.error) {
        setActionError(res.error);
      }
    });
  };

  const handleReject = (requestId: string) => {
    setActionError(null);
    startTransition(async () => {
      const res = await rejectJoinRequestAction(requestId);
      if (res?.error) {
        setActionError(res.error);
      }
    });
  };

  const handleCancel = (requestId: string) => {
    setActionError(null);
    startTransition(async () => {
      const res = await cancelJoinRequestAction(requestId);
      if (res?.error) {
        setActionError(res.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
          {actionError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white border border-[#E2E8F0] rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'incoming'
              ? 'bg-[#D4E6F1] text-[#0B3B4B] shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Incoming Requests ({incomingRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'sent'
              ? 'bg-[#D4E6F1] text-[#0B3B4B] shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>My Applications ({sentRequests.length})</span>
        </button>
      </div>

      {/* Tab 1: Incoming Requests for Project Owners */}
      {activeTab === 'incoming' && (
        <div className="space-y-4">
          {incomingRequests.length > 0 ? (
            incomingRequests.map((req) => (
              <Card
                key={req.id}
                className="bg-white border-[#E2E8F0] p-5 space-y-4 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#EDE9FE] text-[#3F1E8C] flex items-center justify-center font-bold text-sm border border-[#E0E7FF] shrink-0">
                      {req.profile?.full_name?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-[#0F172A]">
                          {req.profile?.full_name || 'Applicant'}
                        </h3>
                        <Badge variant="lavender" size="sm">
                          Role: {req.requested_role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#64748B] mt-0.5">
                        {req.profile?.university && (
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-[#7CA5B8]" />
                            {req.profile.university}
                          </span>
                        )}
                        <span>•</span>
                        <span>{req.profile?.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="blue" size="sm">
                      For: {req.project?.name}
                    </Badge>
                    <Badge
                      variant={
                        req.status === 'pending'
                          ? 'yellow'
                          : req.status === 'accepted'
                          ? 'green'
                          : 'gray'
                      }
                      size="sm"
                    >
                      {req.status}
                    </Badge>
                  </div>
                </div>

                {/* Message */}
                {req.message && (
                  <div className="p-3 bg-[#FAF9F6] rounded-xl text-xs text-[#334155] border border-[#E2E8F0]/60 leading-relaxed">
                    <strong className="block text-[#64748B] mb-1 font-semibold">
                      Applicant Message:
                    </strong>
                    {req.message}
                  </div>
                )}

                {/* Actions */}
                {req.status === 'pending' ? (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReject(req.id)}
                      disabled={isPending}
                      className="text-rose-600 hover:bg-rose-50"
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Decline
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAccept(req.id)}
                      disabled={isPending}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Accept to Team
                    </Button>
                  </div>
                ) : (
                  <div className="text-right text-xs font-medium text-[#64748B]">
                    Status: <span className="capitalize">{req.status}</span>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-[#E2E8F0]">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#E8F1F5] text-[#0B3B4B] mb-3">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A]">
                No incoming requests
              </h3>
              <p className="text-xs text-[#64748B] mt-1">
                When students apply to join your projects, their applications will show up here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Sent Requests */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          {sentRequests.length > 0 ? (
            sentRequests.map((req) => (
              <Card
                key={req.id}
                className="bg-white border-[#E2E8F0] p-5 space-y-3 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[#0F172A]">
                        {req.project?.name}
                      </h3>
                      <Badge variant="blue" size="sm">
                        {req.project?.project_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#64748B] mt-1">
                      Applied as: <strong>{req.requested_role}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        req.status === 'pending'
                          ? 'yellow'
                          : req.status === 'accepted'
                          ? 'green'
                          : 'pink'
                      }
                    >
                      {req.status === 'pending' && (
                        <Clock className="w-3 h-3 mr-1" />
                      )}
                      {req.status === 'accepted' && (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      )}
                      {req.status === 'rejected' && (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      <span className="capitalize">{req.status}</span>
                    </Badge>

                    <Link href={`/projects/${req.project_id}`}>
                      <Button variant="secondary" size="sm">
                        View Project
                      </Button>
                    </Link>

                    {req.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancel(req.id)}
                        disabled={isPending}
                        className="text-rose-600 hover:bg-rose-50"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                {req.message && (
                  <p className="text-xs text-[#475569] bg-[#FAF9F6] p-2.5 rounded-xl border border-[#F1F5F9]">
                    &ldquo;{req.message}&rdquo;
                  </p>
                )}
              </Card>
            ))
          ) : (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-[#E2E8F0]">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#EDE9FE] text-[#3F1E8C] mb-3">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A]">
                No submitted applications
              </h3>
              <p className="text-xs text-[#64748B] mt-1 mb-4">
                Explore projects and request to join teams that match your skills.
              </p>
              <Link href="/projects">
                <Button variant="primary" size="sm">
                  Explore Projects
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
