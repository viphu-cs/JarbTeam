'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getInitials } from '@/lib/supabase/storage';
import {
  StudentSearchResult,
  FriendItem,
  FriendRequestItem,
} from '@/types';
import {
  searchStudentsAction,
  sendFriendRequestAction,
  respondFriendRequestAction,
  cancelFriendRequestAction,
  getFriendRequestsAction,
  getMyFriendsAction,
} from '@/actions/friends';
import {
  Search,
  Users,
  UserPlus,
  Check,
  Clock,
  MessageSquare,
  X,
  GraduationCap,
  Inbox,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'search' | 'requests' | 'friends';
  pendingRequestsCount?: number;
}

export function FriendsModal({
  isOpen,
  onClose,
  initialTab = 'search',
}: FriendsModalProps) {
  const t = useTranslations('friends');
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'search' | 'requests' | 'friends'>(
    initialTab
  );

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Requests State
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestItem[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Friends State
  const [friendsList, setFriendsList] = useState<FriendItem[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  // Transition & Notification message
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Fetch requests & friends on modal open or tab change
  const fetchRequests = async () => {
    setIsLoadingRequests(true);
    const res = await getFriendRequestsAction();
    setIncomingRequests(res.incoming || []);
    setOutgoingRequests(res.outgoing || []);
    setIsLoadingRequests(false);
  };

  const fetchFriends = async () => {
    setIsLoadingFriends(true);
    const res = await getMyFriendsAction();
    setFriendsList(res.friends || []);
    setIsLoadingFriends(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
      if (activeTab === 'friends') {
        fetchFriends();
      }
    }
  }, [isOpen, activeTab]);

  // Handle Search
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchStudentsAction(searchQuery);
      setSearchResults(res.students || []);
      setIsSearching(false);
      setHasSearched(true);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  // Actions
  const handleSendRequest = (receiverId: string) => {
    startTransition(async () => {
      // Optimistic update
      setSearchResults((prev) =>
        prev.map((s) =>
          s.id === receiverId ? { ...s, friendship_status: 'pending_sent' } : s
        )
      );

      const res = await sendFriendRequestAction(receiverId);
      if (res.error) {
        setStatusMessage({ text: res.error, type: 'error' });
        // Rollback
        setSearchResults((prev) =>
          prev.map((s) =>
            s.id === receiverId ? { ...s, friendship_status: 'none' } : s
          )
        );
      } else {
        setStatusMessage({ text: t('requestSentSuccess'), type: 'success' });
        fetchRequests();
      }
    });
  };

  const handleRespondRequest = (requestId: string, action: 'accept' | 'decline') => {
    startTransition(async () => {
      const res = await respondFriendRequestAction(requestId, action);
      if (res.error) {
        setStatusMessage({ text: res.error, type: 'error' });
      } else {
        setStatusMessage({
          text: action === 'accept' ? t('requestAcceptedSuccess') : t('requestDeclinedSuccess'),
          type: 'success',
        });
        fetchRequests();
        fetchFriends();
        router.refresh();
      }
    });
  };

  const handleCancelRequest = (requestId: string) => {
    startTransition(async () => {
      const res = await cancelFriendRequestAction(requestId);
      if (res.error) {
        setStatusMessage({ text: res.error, type: 'error' });
      } else {
        setStatusMessage({ text: t('requestCancelledSuccess'), type: 'success' });
        fetchRequests();
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E8F1F5] text-[#0B3B4B] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">
                {t('modalTitle')}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-5 pt-3 border-b border-[#F1F5F9] bg-[#FAF9F6]/60 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('search')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'search'
                ? 'border-[#0B3B4B] text-[#0B3B4B]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>{t('searchTab')}</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'requests'
                ? 'border-[#0B3B4B] text-[#0B3B4B]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>{t('requestsTab')}</span>
            {incomingRequests.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#F43F5E] text-white text-[10px] flex items-center justify-center font-bold">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('friends');
              fetchFriends();
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'friends'
                ? 'border-[#0B3B4B] text-[#0B3B4B]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t('myFriendsTab')}</span>
            {friendsList.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#E8F1F5] text-[#0B3B4B] font-bold">
                {friendsList.length}
              </span>
            )}
          </button>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div
            className={`px-4 py-2 text-xs font-medium flex items-center justify-between shrink-0 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100'
                : 'bg-rose-50 text-rose-800 border-b border-rose-100'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-xs font-bold underline ml-2 cursor-pointer"
            >
              OK
            </button>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* TAB 1: Search Students */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#FAF9F6] border border-[#E2E8F0] focus:outline-none focus:border-[#7CA5B8] focus:ring-1 focus:ring-[#7CA5B8]/30 transition-all text-[#0F172A] placeholder:text-[#94A3B8]"
                  autoFocus
                />
              </div>

              {/* Student Results */}
              {isSearching ? (
                <div className="py-12 text-center text-xs text-[#94A3B8]">
                  <div className="w-6 h-6 border-2 border-[#0B3B4B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span>Searching students...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2.5">
                  {searchResults.map((student) => (
                    <div
                      key={student.id}
                      className="p-3 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all flex items-center justify-between gap-3 shadow-2xs"
                    >
                      {/* Avatar & Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#D4E6F1] text-[#0B3B4B] flex items-center justify-center font-bold text-xs border border-[#BEE3F8] shrink-0 shadow-2xs">
                          {student.avatar_url ? (
                            <Image
                              src={student.avatar_url}
                              alt={student.full_name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <span>{getInitials(student.full_name)}</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-[#0F172A] truncate">
                              {student.full_name}
                            </span>
                            {student.is_teammate && (
                              <span className="text-[10px] font-semibold text-[#0B3B4B] bg-[#E8F1F5] px-1.5 py-0.2 rounded-sm shrink-0">
                                {t('isTeammate')}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-[#64748B] mt-0.5 truncate">
                            {student.university && (
                              <span className="flex items-center gap-1 truncate">
                                <GraduationCap className="w-3 h-3 text-[#7CA5B8] shrink-0" />
                                <span>{student.university}</span>
                              </span>
                            )}
                            {student.university && student.major && <span>•</span>}
                            {student.major && <span className="truncate">{student.major}</span>}
                          </div>

                          {/* Skills */}
                          {student.skills && student.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {student.skills.slice(0, 3).map((skill) => (
                                <span
                                  key={skill}
                                  className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#F1F5F9] text-[#475569] font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                              {student.skills.length > 3 && (
                                <span className="text-[9px] text-[#94A3B8]">
                                  +{student.skills.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="shrink-0">
                        {student.friendship_status === 'none' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleSendRequest(student.id)}
                            className="text-xs cursor-pointer h-8 px-2.5"
                          >
                            <UserPlus className="w-3.5 h-3.5 mr-1" />
                            <span>{t('addFriend')}</span>
                          </Button>
                        ) : student.friendship_status === 'pending_sent' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#B45309] bg-[#FEF3C7] px-2.5 py-1.5 rounded-xl border border-[#FDE68A]">
                            <Clock className="w-3 h-3" />
                            <span>{t('pendingSent')}</span>
                          </span>
                        ) : student.friendship_status === 'pending_received' ? (
                          <Button
                            variant="accent"
                            size="sm"
                            disabled={isPending}
                            onClick={() => {
                              if (student.friendship_id) {
                                handleRespondRequest(student.friendship_id, 'accept');
                              }
                            }}
                            className="text-xs cursor-pointer h-8 px-2.5"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            <span>{t('accept')}</span>
                          </Button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#14532D] bg-[#DCFCE7] px-2.5 py-1.5 rounded-xl border border-[#BBF7D0]">
                            <Check className="w-3 h-3" />
                            <span>{t('friends')}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : hasSearched ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#F1F5F9] text-[#94A3B8] flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs font-bold text-[#0F172A]">
                    {t('noSearchResults')}
                  </h3>
                  <p className="text-[11px] text-[#64748B] mt-1 max-w-xs mx-auto">
                    {t('noSearchResultsDesc')}
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 2: Friend Requests */}
          {activeTab === 'requests' && (
            <div className="space-y-5">
              {/* Incoming Requests */}
              <div>
                <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Inbox className="w-3.5 h-3.5 text-[#0B3B4B]" />
                  <span>{t('incomingRequests', { count: incomingRequests.length })}</span>
                </h3>

                {isLoadingRequests ? (
                  <div className="py-6 text-center text-xs text-[#94A3B8]">
                    Loading requests...
                  </div>
                ) : incomingRequests.length > 0 ? (
                  <div className="space-y-2">
                    {incomingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#D4E6F1] text-[#0B3B4B] flex items-center justify-center font-bold text-xs border border-[#BEE3F8] shrink-0">
                            {req.profile?.avatar_url ? (
                              <Image
                                src={req.profile.avatar_url}
                                alt={req.profile.full_name || 'Student'}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            ) : (
                              <span>{getInitials(req.profile?.full_name)}</span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-[#0F172A] truncate">
                              {req.profile?.full_name || 'Student'}
                            </h4>
                            <div className="flex items-center gap-1 text-[11px] text-[#64748B] mt-0.5 truncate">
                              {req.profile?.university && (
                                <span className="truncate">{req.profile.university}</span>
                              )}
                              {req.profile?.university && req.profile?.major && <span>•</span>}
                              {req.profile?.major && <span>{req.profile.major}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleRespondRequest(req.id, 'accept')}
                            className="text-xs h-8 px-2.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            <span>{t('accept')}</span>
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleRespondRequest(req.id, 'decline')}
                            className="text-xs h-8 px-2 cursor-pointer text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            <span>{t('decline')}</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-[#F1F5F9] text-center">
                    <p className="text-xs text-[#64748B]">{t('noIncomingRequests')}</p>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">
                      {t('noIncomingRequestsDesc')}
                    </p>
                  </div>
                )}
              </div>

              {/* Sent / Outgoing Requests */}
              <div>
                <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>{t('outgoingRequests', { count: outgoingRequests.length })}</span>
                </h3>

                {outgoingRequests.length > 0 ? (
                  <div className="space-y-2">
                    {outgoingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-[#E8F1F5] text-[#0B3B4B] flex items-center justify-center font-bold text-xs shrink-0">
                            {req.profile?.avatar_url ? (
                              <Image
                                src={req.profile.avatar_url}
                                alt={req.profile.full_name || 'Student'}
                                fill
                                className="object-cover"
                                sizes="36px"
                              />
                            ) : (
                              <span>{getInitials(req.profile?.full_name)}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-[#0F172A] truncate">
                              {req.profile?.full_name || 'Student'}
                            </h4>
                            <span className="text-[10px] text-[#94A3B8]">
                              {req.profile?.university || 'Student'}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleCancelRequest(req.id)}
                          className="text-xs h-7 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        >
                          {t('cancel')}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#F1F5F9] text-center">
                    <p className="text-xs text-[#94A3B8]">{t('noOutgoingRequests')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: My Friends */}
          {activeTab === 'friends' && (
            <div>
              {isLoadingFriends ? (
                <div className="py-12 text-center text-xs text-[#94A3B8]">
                  Loading friends...
                </div>
              ) : friendsList.length > 0 ? (
                <div className="space-y-2">
                  {friendsList.map((friend) => (
                    <div
                      key={friend.friendship_id}
                      className="p-3 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#D4E6F1] text-[#0B3B4B] flex items-center justify-center font-bold text-xs border border-[#BEE3F8] shrink-0">
                          {friend.avatar_url ? (
                            <Image
                              src={friend.avatar_url}
                              alt={friend.full_name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <span>{getInitials(friend.full_name)}</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#0F172A] truncate">
                            {friend.full_name}
                          </h4>
                          <div className="flex items-center gap-1 text-[11px] text-[#64748B] mt-0.5 truncate">
                            {friend.university && <span>{friend.university}</span>}
                            {friend.university && friend.major && <span>•</span>}
                            {friend.major && <span>{friend.major}</span>}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          onClose();
                          router.push('/messages');
                        }}
                        className="text-xs h-8 px-2.5 cursor-pointer text-[#0B3B4B] hover:bg-[#E8F1F5]"
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1 text-[#7CA5B8]" />
                        <span>{t('message')}</span>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#E8F1F5] text-[#0B3B4B] flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-[#7CA5B8]" />
                  </div>
                  <h3 className="text-xs font-bold text-[#0F172A]">
                    {t('noFriendsYet')}
                  </h3>
                  <p className="text-[11px] text-[#64748B] mt-1 mb-4 max-w-xs mx-auto">
                    {t('noFriendsYetDesc')}
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveTab('search')}
                    className="cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    <span>{t('searchTab')}</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
