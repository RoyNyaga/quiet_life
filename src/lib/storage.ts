import { createClient } from './supabase/client';

export interface CompressionResult {
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
  width: number;
  height: number;
}

/**
 * Compresses an image element or blob to WebP using HTML5 Canvas.
 * Automatically scales down if dimensions exceed maxWidth / maxHeight.
 */
export async function compressImage(
  imageSource: HTMLImageElement | HTMLCanvasElement | File | Blob,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0 to 1, default 0.82
    mimeType?: string; // default 'image/webp'
  } = {}
): Promise<CompressionResult> {
  const { maxWidth = 1600, maxHeight = 1600, quality = 0.82, mimeType = 'image/webp' } = options;

  let sourceCanvas: HTMLCanvasElement | null = null;
  let img: HTMLImageElement | null = null;
  let originalSize = 0;

  if (imageSource instanceof HTMLImageElement) {
    img = imageSource;
  } else if (typeof HTMLCanvasElement !== 'undefined' && imageSource instanceof HTMLCanvasElement) {
    sourceCanvas = imageSource;
  } else {
    const fileOrBlob = imageSource as File | Blob;
    originalSize = fileOrBlob.size;
    img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = reject;
      element.src = URL.createObjectURL(fileOrBlob);
    });
  }

  // Calculate target dimensions keeping aspect ratio
  const srcWidth = sourceCanvas ? sourceCanvas.width : (img?.naturalWidth || img?.width || maxWidth);
  const srcHeight = sourceCanvas ? sourceCanvas.height : (img?.naturalHeight || img?.height || maxHeight);

  let targetWidth = srcWidth;
  let targetHeight = srcHeight;

  if (targetWidth > maxWidth || targetHeight > maxHeight) {
    const widthRatio = maxWidth / targetWidth;
    const heightRatio = maxHeight / targetHeight;
    const scale = Math.min(widthRatio, heightRatio);
    targetWidth = Math.round(targetWidth * scale);
    targetHeight = Math.round(targetHeight * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Use high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (sourceCanvas) {
    ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
  } else if (img) {
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  }

  // Convert to target mimeType with fallback to JPEG if WebP is unsupported
  let blob: Blob | null = null;
  try {
    blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mimeType, quality));
  } catch {
    blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
  }

  if (!blob) {
    blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  }

  if (!blob) {
    throw new Error('Failed to compress image to Blob');
  }

  const dataUrl = canvas.toDataURL(mimeType, quality);
  const compressedSize = blob.size;
  const reductionPercentage = originalSize > 0
    ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
    : 0;

  return {
    blob,
    dataUrl,
    originalSize,
    compressedSize,
    reductionPercentage,
    width: targetWidth,
    height: targetHeight,
  };
}

/**
 * Format bytes to readable string (e.g. 84 KB, 1.2 MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Uploads an image to the Supabase 'blog-images' bucket (or fallback to local /api/upload).
 * @param file The image blob or file to upload.
 * @param folder 'covers' | 'body'
 */
export async function uploadBlogImage(
  file: Blob | File,
  folder: 'covers' | 'body' = 'covers'
): Promise<string> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const filename = `${timestamp}-${random}.webp`;
  const storagePath = `${folder}/${filename}`;

  // 1. Attempt Supabase Storage upload if client is available
  try {
    const supabase = createClient();
    if (supabase) {
      const { data, error } = await supabase.storage
        .from('blog-images')
        .upload(storagePath, file, {
          contentType: 'image/webp',
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(storagePath);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      } else if (error) {
        console.warn('Supabase storage upload returned error, trying local fallback:', error.message);
      }
    }
  } catch (err) {
    console.warn('Supabase upload exception, falling back to local /api/upload:', err);
  }

  // 2. Fallback to /api/upload route handler
  const formData = new FormData();
  formData.append('file', file, filename);
  formData.append('folder', folder);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Upload failed: ${res.status} ${errText}`);
  }

  const result = await res.json();
  return result.url;
}

/**
 * Uploads a profile avatar image to the Supabase 'avatars' bucket (or fallback to local /api/upload).
 */
export async function uploadAvatarImage(
  file: Blob | File,
  userId?: string
): Promise<string> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const filename = `${userId || 'avatar'}-${timestamp}-${random}.webp`;
  const storagePath = filename;

  try {
    const supabase = createClient();
    if (supabase) {
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(storagePath, file, {
          contentType: 'image/webp',
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(storagePath);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      } else if (error) {
        console.warn('Supabase avatar storage error, trying fallback:', error.message);
      }
    }
  } catch (err) {
    console.warn('Supabase avatar exception, using /api/upload:', err);
  }

  const formData = new FormData();
  formData.append('file', file, filename);
  formData.append('folder', 'avatars');

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Avatar upload failed: ${res.status} ${errText}`);
  }

  const result = await res.json();
  return result.url;
}

