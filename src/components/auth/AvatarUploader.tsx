'use client';

import { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Avatar,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CropIcon from '@mui/icons-material/Crop';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { ImageCropModal } from '@/components/admin/ImageCropModal';
import { formatFileSize, CompressionResult } from '@/lib/storage';

interface AvatarUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
}

export function AvatarUploader({
  value,
  onChange,
  label = 'Profile Photo',
  helperText = 'Upload a photo. It will be cropped to 1:1 square and compressed to WebP.',
}: AvatarUploaderProps) {
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [compressionStats, setCompressionStats] = useState<CompressionResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setPendingImage(file);
    setCropModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleCropComplete = (uploadedUrl: string, stats: CompressionResult) => {
    setCompressionStats(stats);
    onChange(uploadedUrl);
    setCropModalOpen(false);
  };

  const handleRemove = () => {
    onChange('');
    setCompressionStats(null);
  };

  const handleAdjustCrop = () => {
    if (value) {
      setPendingImage(value);
      setCropModalOpen(true);
    }
  };

  return (
    <Box className="flex flex-col items-center text-center space-y-4 py-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      {label && (
        <Typography variant="caption" className="font-bold text-earth-800 uppercase tracking-wider text-xs block">
          {label}
        </Typography>
      )}

      {/* Circular Avatar Dropzone */}
      <div
        className="relative group cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
      >
        <Avatar
          src={value || undefined}
          sx={{
            width: 124,
            height: 124,
            mx: 'auto',
            bgcolor: '#F3EFEA',
            color: '#7D6A5D',
            border: isDragOver
              ? '3px dashed #C88A79'
              : value
              ? '3px solid #C88A79'
              : '2px dashed #D9CFC4',
            boxShadow: value ? '0 8px 24px rgba(200, 138, 121, 0.22)' : '0 4px 12px rgba(61,46,38,0.06)',
            transition: 'all 0.2s ease-in-out',
            transform: isDragOver ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          {!value && <PhotoCameraIcon sx={{ fontSize: 44, color: '#A9998E' }} />}
        </Avatar>

        {/* Hover / Camera overlay */}
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white">
          <PhotoCameraIcon fontSize="small" />
          <Typography variant="caption" className="font-bold text-[10px] mt-0.5">
            {value ? 'Change' : 'Upload'}
          </Typography>
        </div>
      </div>

      {/* Helper text or Compression statistics */}
      <div className="space-y-1.5 max-w-sm">
        {compressionStats ? (
          <div className="flex items-center justify-center gap-1.5">
            <Chip
              icon={<CheckCircleIcon style={{ color: '#2E7D32' }} />}
              label={`WebP Compressed: ${formatFileSize(compressionStats.compressedSize)} (${compressionStats.reductionPercentage}% smaller)`}
              size="small"
              sx={{
                bgcolor: '#E8F5E9',
                color: '#1B5E20',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            />
          </div>
        ) : (
          <Typography variant="caption" className="text-earth-600 block leading-tight">
            {helperText}
          </Typography>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {!value ? (
          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              color: '#5C4438',
              borderColor: '#D4C7BA',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2.5,
              px: 2.5,
              '&:hover': {
                borderColor: '#C88A79',
                bgcolor: '#FAF7F4',
              },
            }}
          >
            Upload Photo
          </Button>
        ) : (
          <>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CropIcon />}
              onClick={handleAdjustCrop}
              sx={{
                color: '#5C4438',
                borderColor: '#E0D6CB',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                '&:hover': { borderColor: '#C88A79', bgcolor: '#FAF7F4' },
              }}
            >
              Adjust Crop
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CloudUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                color: '#5C4438',
                borderColor: '#E0D6CB',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                '&:hover': { borderColor: '#C88A79', bgcolor: '#FAF7F4' },
              }}
            >
              Change
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<DeleteOutlineRoundedIcon />}
              onClick={handleRemove}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
              }}
            >
              Remove
            </Button>
          </>
        )}
      </div>

      {/* 1:1 Image Crop & Optimize Modal */}
      <ImageCropModal
        open={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageSource={pendingImage}
        onCropComplete={handleCropComplete}
        defaultAspectRatio="1:1"
        lockAspectRatio={true}
        folder="avatars"
        title="Crop Profile Photo (1:1)"
      />
    </Box>
  );
}
