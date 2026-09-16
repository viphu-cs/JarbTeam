import { createClient } from '@/lib/supabase/client';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function getFileExtension(file: File): string {
  if (file.type === 'image/jpeg') return 'jpg';
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'jpeg' || ext === 'jpg') return 'jpg';
  if (ext === 'png') return 'png';
  if (ext === 'webp') return 'webp';
  return 'jpg';
}

export function validateImageFile(file: File): { valid: boolean; errorKey?: string } {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const isAllowedExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '');
  const isAllowedMime = ALLOWED_IMAGE_TYPES.includes(file.type);

  if (!isAllowedMime && !isAllowedExt) {
    return { valid: false, errorKey: 'unsupportedFormat' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, errorKey: 'fileTooLarge' };
  }

  return { valid: true };
}

export function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'U';
  const clean = name.trim();
  const parts = clean.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Upload an image file with byte-level progress reporting via XHR,
 * falling back to Supabase SDK if needed.
 */
async function uploadWithProgress(
  bucket: 'avatars' | 'projects',
  filePath: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Try XMLHttpRequest for real upload progress
  if (session?.access_token && supabaseUrl && typeof window !== 'undefined' && window.XMLHttpRequest) {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(100);
          const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
          // Add timestamp to bust browser cache on image replacements
          const urlWithCacheBuster = `${data.publicUrl}?t=${Date.now()}`;
          resolve({ url: urlWithCacheBuster });
        } else {
          let errMsg = 'uploadFailed';
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.message) errMsg = res.message;
          } catch {
            // keep default
          }
          resolve({ error: errMsg });
        }
      };

      xhr.onerror = () => {
        resolve({ error: 'uploadFailed' });
      };

      xhr.open('POST', uploadUrl);
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
      xhr.setRequestHeader('x-upsert', 'true');
      xhr.setRequestHeader('Content-Type', file.type || 'image/jpeg');
      xhr.send(file);
    });
  }

  // Fallback to Supabase JS client
  onProgress?.(25);
  const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
    upsert: true,
    contentType: file.type || 'image/jpeg',
  });

  if (uploadError) {
    return { error: uploadError.message || 'uploadFailed' };
  }

  onProgress?.(100);
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return { url: `${data.publicUrl}?t=${Date.now()}` };
}

/**
 * Upload profile avatar to `avatars/{userId}/profile.{ext}`
 */
export async function uploadAvatar(
  userId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url?: string; error?: string }> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { error: validation.errorKey };
  }

  const ext = getFileExtension(file);
  const filePath = `${userId}/profile.${ext}`;

  return uploadWithProgress('avatars', filePath, file, onProgress);
}

/**
 * Delete profile avatar from `avatars/{userId}/`
 */
export async function deleteAvatar(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: files, error: listError } = await supabase.storage.from('avatars').list(userId);

  if (listError) {
    return { success: false, error: listError.message };
  }

  if (files && files.length > 0) {
    const filePaths = files.map((f) => `${userId}/${f.name}`);
    const { error: removeError } = await supabase.storage.from('avatars').remove(filePaths);
    if (removeError) {
      return { success: false, error: removeError.message };
    }
  }

  return { success: true };
}

/**
 * Upload project image to `projects/{projectId}/cover.{ext}`
 */
export async function uploadProjectImage(
  projectId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url?: string; error?: string }> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { error: validation.errorKey };
  }

  const ext = getFileExtension(file);
  const filePath = `${projectId}/cover.${ext}`;

  return uploadWithProgress('projects', filePath, file, onProgress);
}

/**
 * Delete project image from `projects/{projectId}/`
 */
export async function deleteProjectImage(projectId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: files, error: listError } = await supabase.storage.from('projects').list(projectId);

  if (listError) {
    return { success: false, error: listError.message };
  }

  if (files && files.length > 0) {
    const filePaths = files.map((f) => `${projectId}/${f.name}`);
    const { error: removeError } = await supabase.storage.from('projects').remove(filePaths);
    if (removeError) {
      return { success: false, error: removeError.message };
    }
  }

  return { success: true };
}
