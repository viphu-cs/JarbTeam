'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ImageUpload } from '@/components/image-upload';
import { uploadAvatar, deleteAvatar, getInitials } from '@/lib/supabase/storage';
import { Camera, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AvatarUploadProps {
  userId: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  onChange: (url: string | null) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  disabled?: boolean;
}

export function AvatarUpload({
  userId,
  fullName,
  avatarUrl,
  onChange,
  onUploadingChange,
  disabled = false,
}: AvatarUploadProps) {
  const t = useTranslations('imageUpload');
  const [currentUrl, setCurrentUrl] = useState<string | null>(avatarUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUrl(avatarUrl || null);
  }, [avatarUrl]);

  const handleFileSelect = async (file: File) => {
    if (!userId) {
      setError(t('notAuthenticated'));
      return;
    }

    setError(null);
    setIsUploading(true);
    setProgress(0);
    onUploadingChange?.(true);

    // Create temporary local preview
    const tempPreview = URL.createObjectURL(file);
    setCurrentUrl(tempPreview);

    try {
      const result = await uploadAvatar(userId, file, (percent) => {
        setProgress(percent);
      });

      if (result.error) {
        // Revert to previous URL on error
        setCurrentUrl(avatarUrl || null);
        if (result.error === 'unsupportedFormat') {
          setError(t('unsupportedFormat'));
        } else if (result.error === 'fileTooLarge') {
          setError(t('fileTooLarge') + ' (' + t('maxSize') + ')');
        } else {
          setError(t('uploadFailed'));
        }
      } else if (result.url) {
        setCurrentUrl(result.url);
        onChange(result.url);
      }
    } catch {
      setCurrentUrl(avatarUrl || null);
      setError(t('uploadFailed'));
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
      URL.revokeObjectURL(tempPreview);
    }
  };

  const handleRemove = async () => {
    if (disabled || isUploading) return;
    setError(null);
    setIsUploading(true);
    onUploadingChange?.(true);

    try {
      await deleteAvatar(userId);
      setCurrentUrl(null);
      onChange(null);
    } catch {
      setError(t('uploadFailed'));
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
    }
  };

  const initials = getInitials(fullName);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[#FAF9F6] border border-[#E2E8F0]">
      {/* Circular Avatar Display */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden shrink-0 border-2 border-[#BEE3F8] shadow-xs bg-[#D4E6F1]">
        {currentUrl ? (
          <Image
            src={currentUrl}
            alt={fullName || 'Avatar'}
            fill
            className="object-cover rounded-full"
            sizes="(max-width: 640px) 96px, 112px"
            unoptimized={currentUrl.startsWith('blob:')}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-[#0B3B4B] select-none">
            {initials}
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Control Actions & Info */}
      <div className="flex-1 text-center sm:text-left space-y-2">
        <div>
          <h3 className="text-sm font-bold text-[#0F172A]">
            {fullName || t('chooseImage')}
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            {t('unsupportedFormat')} • {t('maxSize')}
          </p>
        </div>

        <ImageUpload
          onFileSelect={handleFileSelect}
          disabled={disabled}
          isUploading={isUploading}
          progress={progress}
          error={error}
          onErrorChange={setError}
        >
          {({ openFileDialog }) => (
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={openFileDialog}
                disabled={disabled || isUploading}
                className="cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 mr-1.5 text-[#7CA5B8]" />
                {currentUrl ? t('changePhoto') : t('uploadImage')}
              </Button>

              {currentUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  disabled={disabled || isUploading}
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  {t('removeImage')}
                </Button>
              )}
            </div>
          )}
        </ImageUpload>
      </div>
    </div>
  );
}
