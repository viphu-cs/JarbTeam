'use client';

import React, { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { validateImageFile } from '@/lib/supabase/storage';
import { AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  isUploading?: boolean;
  progress?: number;
  error?: string | null;
  onErrorChange?: (error: string | null) => void;
  children: (props: {
    isDragging: boolean;
    openFileDialog: () => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
  }) => React.ReactNode;
  className?: string;
  accept?: string;
}

export function ImageUpload({
  onFileSelect,
  disabled = false,
  isUploading = false,
  progress = 0,
  error,
  onErrorChange,
  children,
  className = '',
  accept = 'image/jpeg,image/png,image/webp',
}: ImageUploadProps) {
  const t = useTranslations('imageUpload');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    onErrorChange?.(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      if (validation.errorKey === 'fileTooLarge') {
        onErrorChange?.(t('fileTooLarge') + ' (' + t('maxSize') + ')');
      } else if (validation.errorKey === 'unsupportedFormat') {
        onErrorChange?.(t('unsupportedFormat'));
      } else {
        onErrorChange?.(t('uploadFailed'));
      }
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
    // reset input value so re-selecting same file works
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="w-full"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {children({ isDragging, openFileDialog, fileInputRef })}
      </div>

      {/* Progress Bar */}
      {isUploading && (
        <div className="w-full space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>{t('uploading')}</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#FAF9F6] rounded-full overflow-hidden border border-[#E2E8F0]">
            <div
              className="h-full bg-[#7CA5B8] rounded-full transition-all duration-300"
              style={{ width: `${Math.max(5, progress)}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
