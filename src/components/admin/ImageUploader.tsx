'use client';

import { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CropIcon from '@mui/icons-material/Crop';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import PhotoSizeSelectActualIcon from '@mui/icons-material/PhotoSizeSelectActual';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { ImageCropModal, AspectRatioType } from './ImageCropModal';
import { formatFileSize, CompressionResult } from '@/lib/storage';

interface ImageUploaderProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  aspectRatio?: AspectRatioType;
  folder?: 'covers' | 'body' | 'avatars';
  helperText?: string;
}

export function ImageUploader({
  label = 'Article Cover Image',
  value,
  onChange,
  aspectRatio = '16:9',
  folder = 'covers',
  helperText = 'Upload a high-resolution image. It will be cropped to 16:9 and compressed to WebP for optimal page load speed.',
}: ImageUploaderProps) {
  const [tabIndex, setTabIndex] = useState<0 | 1>(0); // 0: Upload & Crop, 1: Paste URL
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [compressionStats, setCompressionStats] = useState<CompressionResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setPendingImageFile(file);
    setCropModalOpen(true);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // reset input so the same file can be chosen again if needed
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleCropComplete = (uploadedUrl: string, stats: CompressionResult) => {
    setCompressionStats(stats);
    onChange(uploadedUrl);
  };

  const handleRemove = () => {
    onChange('');
    setCompressionStats(null);
  };

  const handleEditCrop = () => {
    if (value) {
      setPendingImageFile(value);
      setCropModalOpen(true);
    }
  };

  return (
    <Box className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="subtitle2" className="font-serif font-bold text-earth-900">
            {label}
          </Typography>
          {helperText && (
            <Typography variant="caption" className="text-earth-500">
              {helperText}
            </Typography>
          )}
        </div>

        <Tabs
          value={tabIndex}
          onChange={(_, val) => setTabIndex(val)}
          sx={{
            minHeight: 32,
            '& .MuiTab-root': {
              minHeight: 32,
              py: 0.5,
              px: 1.5,
              fontSize: '0.75rem',
              fontWeight: 600,
            },
          }}
        >
          <Tab icon={<PhotoSizeSelectActualIcon fontSize="inherit" />} iconPosition="start" label="Upload & Crop" />
          <Tab icon={<LinkIcon fontSize="inherit" />} iconPosition="start" label="Paste URL" />
        </Tabs>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {tabIndex === 0 ? (
        value ? (
          /* Preview of selected cover image with always-visible controls */
          <div className="space-y-3">
            <div className="relative group rounded-2xl overflow-hidden border border-cream-200 bg-earth-900 shadow-sm">
              <div className={`relative ${aspectRatio === '1:1' ? 'aspect-square max-w-[280px] mx-auto' : 'aspect-video w-full'} overflow-hidden bg-earth-950`}>
                <img
                  src={value}
                  alt="Cover Preview"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                />

                {/* Floating Quick Action Badges (Always visible on top-right) */}
                <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<CloudUploadIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      bgcolor: 'rgba(200, 138, 121, 0.92)',
                      backdropFilter: 'blur(6px)',
                      color: '#FFFFFF',
                      '&:hover': { bgcolor: '#A66E5E' },
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      py: 0.5,
                      px: 1.5,
                    }}
                  >
                    Change Image
                  </Button>
                  <IconButton
                    size="small"
                    onClick={handleRemove}
                    sx={{
                      bgcolor: 'rgba(239, 68, 68, 0.9)',
                      backdropFilter: 'blur(6px)',
                      color: '#FFFFFF',
                      '&:hover': { bgcolor: '#DC2626' },
                      borderRadius: '8px',
                      p: 0.6,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                    title="Remove Image"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </div>

                {/* Hover Center Overlay for Desktop */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs">
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<CropIcon />}
                    onClick={handleEditCrop}
                    sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' }, fontWeight: 600, textTransform: 'none' }}
                  >
                    Adjust Crop
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CloudUploadIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ color: '#FFFFFF', borderColor: '#FFFFFF', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' }, textTransform: 'none' }}
                  >
                    Replace Image
                  </Button>
                </div>

                {/* Aspect Ratio & Compression Badges (Top-Left) */}
                <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 max-w-[calc(100%-180px)]">
                  <Chip
                    label={aspectRatio === '1:1' ? '1:1 Square' : aspectRatio === '4:3' ? '4:3 Standard' : '16:9 Banner'}
                    size="small"
                    sx={{ bgcolor: 'rgba(26, 18, 14, 0.75)', color: '#FFFFFF', backdropFilter: 'blur(4px)', fontWeight: 600, fontSize: '0.7rem' }}
                  />
                  {compressionStats && (
                    <Chip
                      icon={<CheckCircleIcon sx={{ color: '#FFFFFF !important', fontSize: '0.9rem' }} />}
                      label={`${formatFileSize(compressionStats.compressedSize)} · WebP (${compressionStats.reductionPercentage}% smaller)`}
                      size="small"
                      sx={{ bgcolor: '#749D81', color: '#FFFFFF', fontWeight: 600, fontSize: '0.7rem' }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Always-Visible Bottom Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-cream-50 border border-cream-200">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    bgcolor: '#C88A79',
                    '&:hover': { bgcolor: '#A66E5E' },
                    color: '#FFFFFF',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: '10px',
                    px: 2,
                  }}
                >
                  Change Image
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CropIcon />}
                  onClick={handleEditCrop}
                  sx={{
                    color: '#5C4438',
                    borderColor: '#D4C8BC',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: '10px',
                    '&:hover': { borderColor: '#A66E5E', bgcolor: '#F7F2EB' },
                  }}
                >
                  Adjust Crop
                </Button>
              </div>

              <Button
                variant="text"
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleRemove}
                sx={{
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' },
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          /* Empty Drag & Drop Dropzone */
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
              isDragOver
                ? 'border-terracotta-500 bg-terracotta-50/50'
                : 'border-cream-300 bg-cream-50/50 hover:bg-cream-100/50 hover:border-terracotta-400'
            }`}
          >
            <div className="mx-auto w-12 h-12 rounded-2xl bg-terracotta-100 flex items-center justify-center text-terracotta-700 mb-3 shadow-xs">
              <CloudUploadIcon />
            </div>
            <Typography variant="body2" className="font-bold text-earth-800">
              Click to choose cover image or drag & drop here
            </Typography>
            <Typography variant="caption" className="text-earth-500 block mt-1">
              Supports PNG, JPG, WebP, GIF (Max 15 MB). Automatically cropped to {aspectRatio} and compressed.
            </Typography>
          </div>
        )
      ) : (
        /* Fallback: Direct URL input with preview and clear action */
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TextField
              fullWidth
              size="small"
              placeholder="https://images.unsplash.com/photo-..."
              value={value}
              onChange={e => onChange(e.target.value)}
              helperText="Direct image URL from an external source or CDN"
            />
            {value && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={handleRemove}
                startIcon={<DeleteIcon />}
                sx={{ textTransform: 'none', fontWeight: 600, minWidth: '100px', height: '40px', mb: '22px' }}
              >
                Clear
              </Button>
            )}
          </div>
          {value && (
            <div className="rounded-xl overflow-hidden border border-cream-200 aspect-video max-h-48 bg-earth-950">
              <img src={value} alt="URL Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      )}

      {/* Image Crop Modal */}
      <ImageCropModal
        open={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageSource={pendingImageFile}
        onCropComplete={handleCropComplete}
        defaultAspectRatio={aspectRatio}
        folder={folder}
      />
    </Box>
  );
}
