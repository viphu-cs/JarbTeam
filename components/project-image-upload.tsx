'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ImageUpload } from '@/components/image-upload';
import { uploadProjectImage, deleteProjectImage } from '@/lib/supabase/storage';
import { Image as ImageIcon, UploadCloud, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ProjectImageUploadProps {
  projectId: string;
  imageUrl?: string | null;
  onChange: (url: string | null) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  disabled?: boolean;
}

export function ProjectImageUpload({
  projectId,
  imageUrl,
  onChange,
  onUploadingChange,
  disabled = false,
}: ProjectImageUploadProps) {
  const t = useTranslations('imageUpload');
  const [currentUrl, setCurrentUrl] = useState<string | null>(imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUrl(imageUrl || null);
  }, [imageUrl]);

  const handleFileSelect = async (file: File) => {
    if (!projectId) return;

    setError(null);
    setIsUploading(true);
    setProgress(0);
    onUploadingChange?.(true);

    // Create temporary local preview
    const tempPreview = URL.createObjectURL(file);
    setCurrentUrl(tempPreview);

    try {
      const result = await uploadProjectImage(projectId, file, (percent) => {
        setProgress(percent);
      });

      if (result.error) {
        // Revert to previous URL on error
        setCurrentUrl(imageUrl || null);
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
      setCurrentUrl(imageUrl || null);
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
      await deleteProjectImage(projectId);
      setCurrentUrl(null);
      onChange(null);
    } catch {
      setError(t('uploadFailed'));
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-[#0F172A] tracking-wide">
          {t('projectImage')}
        </label>
        <span className="text-[11px] text-[#64748B]">
          {t('projectImageHelper')}
        </span>
      </div>

      <ImageUpload
        onFileSelect={handleFileSelect}
        disabled={disabled}
        isUploading={isUploading}
        progress={progress}
        error={error}
        onErrorChange={setError}
      >
        {({ isDragging, openFileDialog }) => (
          <div>
            {currentUrl ? (
              /* Preview State */
              <div className="space-y-3">
                <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-xs bg-[#FAF9F6]">
                  <Image
                    src={currentUrl}
                    alt="Project Cover Preview"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 800px"
                    unoptimized={currentUrl.startsWith('blob:')}
                  />

                  {isUploading && (
                    <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                      <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin mb-2" />
                      <span className="text-xs font-semibold">{progress}%</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={openFileDialog}
                    disabled={disabled || isUploading}
                    className="cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-[#7CA5B8]" />
                    {t('changeImage')}
                  </Button>

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
                </div>
              </div>
            ) : (
              /* Upload Placeholder State (Matching UX diagram) */
              <div
                onClick={openFileDialog}
                className={`relative w-full aspect-[16/9] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer ${
                  isDragging
                    ? 'border-[#7CA5B8] bg-[#E8F1F5]/60 scale-[0.99]'
                    : 'border-[#CBD5E1] bg-[#FAF9F6] hover:bg-white hover:border-[#7CA5B8]'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-center text-[#7CA5B8] mb-3 transition-transform group-hover:scale-105">
                  {isDragging ? (
                    <UploadCloud className="w-6 h-6 animate-bounce" />
                  ) : (
                    <ImageIcon className="w-6 h-6" />
                  )}
                </div>

                <h4 className="text-sm font-bold text-[#0F172A]">
                  + {t('uploadImage')}
                </h4>
                <p className="text-xs text-[#64748B] mt-1">
                  {t('dragAndDrop')}
                </p>
                <p className="text-[11px] text-[#94A3B8] mt-2 font-medium">
                  {t('unsupportedFormat')} • {t('maxSize')}
                </p>
              </div>
            )}
          </div>
        )}
      </ImageUpload>
    </div>
  );
}
