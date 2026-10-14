import { useMutation } from '@tanstack/react-query';
import { uploadBlogImage, uploadAvatarImage } from '@/lib/storage';

export function useUploadBlogImage() {
  return useMutation({
    mutationFn: ({ file, folder = 'covers' }: { file: Blob | File; folder?: 'covers' | 'body' }) =>
      uploadBlogImage(file, folder),
    meta: { successMessage: 'notifications.imageUploaded' },
  });
}

export function useUploadAvatar() {
  return useMutation({
    mutationFn: ({ file, userId }: { file: Blob | File; userId?: string }) =>
      uploadAvatarImage(file, userId),
    meta: { successMessage: 'notifications.imageUploaded' },
  });
}
