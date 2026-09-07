'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Slider,
  Typography,
  Chip,
  Box,
  CircularProgress,
  IconButton,
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CropIcon from '@mui/icons-material/Crop';
import { compressImage, formatFileSize, uploadBlogImage, uploadAvatarImage, CompressionResult } from '@/lib/storage';

export type AspectRatioType = '16:9' | '3:2' | '4:3' | '1:1';

interface ImageCropModalProps {
  open: boolean;
  onClose: () => void;
  imageSource: string | File | null;
  onCropComplete: (uploadedUrl: string, stats: CompressionResult) => void;
  defaultAspectRatio?: AspectRatioType;
  folder?: 'covers' | 'body' | 'avatars';
}

const ASPECT_RATIOS: { label: string; value: AspectRatioType; ratio: number }[] = [
  { label: '16:9 (Banner)', value: '16:9', ratio: 16 / 9 },
  { label: '3:2 (Editorial)', value: '3:2', ratio: 3 / 2 },
  { label: '4:3 (Classic)', value: '4:3', ratio: 4 / 3 },
  { label: '1:1 (Square)', value: '1:1', ratio: 1 / 1 },
];

export function ImageCropModal({
  open,
  onClose,
  imageSource,
  onCropComplete,
  defaultAspectRatio = '16:9',
  folder = 'covers',
}: ImageCropModalProps) {
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>(defaultAspectRatio);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [originalFileSize, setOriginalFileSize] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const currentRatioObj = ASPECT_RATIOS.find(r => r.value === aspectRatio) || ASPECT_RATIOS[0];
  const targetRatio = currentRatioObj.ratio;

  // Load image when imageSource changes or dialog opens
  useEffect(() => {
    if (!open || !imageSource) {
      setImgElement(null);
      return;
    }

    let src = '';
    if (imageSource instanceof File) {
      setOriginalFileSize(imageSource.size);
      src = URL.createObjectURL(imageSource);
    } else {
      src = imageSource;
      setOriginalFileSize(0);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImgElement(img);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setErrorMsg(null);
    };
    img.onerror = () => {
      setErrorMsg('Failed to load image for cropping.');
    };
    img.src = src;

    return () => {
      if (imageSource instanceof File && src) {
        URL.revokeObjectURL(src);
      }
    };
  }, [open, imageSource]);

  // Render crop preview on Canvas
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !imgElement) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerWidth = container.clientWidth || 600;
    const canvasWidth = containerWidth;
    const canvasHeight = Math.round(containerWidth / targetRatio);

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Compute base scale to cover viewport
    const imgRatio = imgElement.naturalWidth / imgElement.naturalHeight;
    let baseWidth = canvasWidth;
    let baseHeight = canvasHeight;

    if (imgRatio > targetRatio) {
      // Image is wider than container
      baseHeight = canvasHeight;
      baseWidth = canvasHeight * imgRatio;
    } else {
      // Image is taller than container
      baseWidth = canvasWidth;
      baseHeight = canvasWidth / imgRatio;
    }

    const scaledWidth = baseWidth * zoom;
    const scaledHeight = baseHeight * zoom;

    // Centered position + user offset
    const posX = (canvasWidth - scaledWidth) / 2 + offset.x;
    const posY = (canvasHeight - scaledHeight) / 2 + offset.y;

    ctx.drawImage(imgElement, posX, posY, scaledWidth, scaledHeight);

    // Draw subtle rule-of-thirds grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Vertical lines
    ctx.moveTo(canvasWidth / 3, 0);
    ctx.lineTo(canvasWidth / 3, canvasHeight);
    ctx.moveTo((canvasWidth * 2) / 3, 0);
    ctx.lineTo((canvasWidth * 2) / 3, canvasHeight);
    // Horizontal lines
    ctx.moveTo(0, canvasHeight / 3);
    ctx.lineTo(canvasWidth, canvasHeight / 3);
    ctx.moveTo(0, (canvasHeight * 2) / 3);
    ctx.lineTo(canvasWidth, (canvasHeight * 2) / 3);
    ctx.stroke();
  }, [imgElement, zoom, offset, targetRatio]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // Mouse / Touch handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch support for mobile / tablets
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Perform full-resolution crop, compress to WebP, and upload
  const handleApplyCrop = async () => {
    if (!imgElement) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // 1. Offscreen canvas at target output resolution (max 1600px width)
      const maxOutputWidth = folder === 'covers' ? 1600 : 1200;
      const outputWidth = Math.min(imgElement.naturalWidth, maxOutputWidth);
      const outputHeight = Math.round(outputWidth / targetRatio);

      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = outputWidth;
      offscreenCanvas.height = outputHeight;
      const offscreenCtx = offscreenCanvas.getContext('2d');

      if (!offscreenCtx) throw new Error('Offscreen canvas context failed');

      // Scale calculations from preview canvas to natural output
      const previewCanvas = canvasRef.current;
      const previewWidth = previewCanvas?.width || outputWidth;
      const previewScale = outputWidth / previewWidth;

      const imgRatio = imgElement.naturalWidth / imgElement.naturalHeight;
      let baseWidth = previewWidth;
      let baseHeight = previewCanvas?.height || outputHeight;

      if (imgRatio > targetRatio) {
        baseHeight = previewCanvas?.height || outputHeight;
        baseWidth = baseHeight * imgRatio;
      } else {
        baseWidth = previewWidth;
        baseHeight = previewWidth / imgRatio;
      }

      const scaledWidth = baseWidth * zoom * previewScale;
      const scaledHeight = baseHeight * zoom * previewScale;
      const posX = ((outputWidth - scaledWidth) / 2) + (offset.x * previewScale);
      const posY = ((outputHeight - scaledHeight) / 2) + (offset.y * previewScale);

      offscreenCtx.imageSmoothingEnabled = true;
      offscreenCtx.imageSmoothingQuality = 'high';
      offscreenCtx.drawImage(imgElement, posX, posY, scaledWidth, scaledHeight);

      // 2. Compress via canvas to WebP
      const compressed = await compressImage(offscreenCanvas, {
        maxWidth: maxOutputWidth,
        maxHeight: maxOutputWidth,
        quality: 0.82,
        mimeType: 'image/webp',
      });

      // Maintain original size context for stats
      if (originalFileSize > 0) {
        compressed.originalSize = originalFileSize;
        compressed.reductionPercentage = Math.max(
          0,
          Math.round(((originalFileSize - compressed.compressedSize) / originalFileSize) * 100)
        );
      }

      // 3. Upload to storage bucket (avatars or blog-images)
      let uploadedUrl = '';
      if (folder === 'avatars') {
        uploadedUrl = await uploadAvatarImage(compressed.blob);
      } else {
        uploadedUrl = await uploadBlogImage(compressed.blob, folder);
      }

      onCropComplete(uploadedUrl, compressed);
      onClose();
    } catch (err: any) {
      console.error('Error applying crop and upload:', err);
      setErrorMsg(err.message || 'Failed to crop and upload image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isProcessing ? undefined : onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
            bgcolor: '#FAF8F5',
            border: '1px solid #EAE3DA',
          },
        },
      }}
    >
      <DialogTitle className="flex items-center justify-between border-b border-cream-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-terracotta-100 text-terracotta-700">
            <CropIcon fontSize="small" />
          </div>
          <div>
            <Typography variant="h6" className="font-serif font-bold text-earth-900 leading-tight">
              Crop & Optimize Cover Image
            </Typography>
            <Typography variant="caption" className="text-earth-500">
              Pan & zoom to fit the frame. WebP compression will be applied automatically.
            </Typography>
          </div>
        </div>
        <IconButton onClick={onClose} disabled={isProcessing} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent className="p-6 space-y-5">
        {/* Aspect Ratio Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Typography variant="body2" className="font-medium text-earth-700">
            Target Aspect Ratio:
          </Typography>
          <div className="flex flex-wrap gap-2">
            {ASPECT_RATIOS.map(r => (
              <Chip
                key={r.value}
                label={r.label}
                clickable
                onClick={() => setAspectRatio(r.value)}
                sx={{
                  bgcolor: aspectRatio === r.value ? '#C88A79' : '#EFEBE6',
                  color: aspectRatio === r.value ? '#FFFFFF' : '#5C4438',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: aspectRatio === r.value ? '#A66E5E' : '#E4DDD4',
                  },
                }}
              />
            ))}
          </div>
        </div>

        {/* Interactive Crop Viewport */}
        <div
          ref={containerRef}
          className="relative w-full rounded-2xl overflow-hidden bg-earth-950 border-2 border-dashed border-earth-300 shadow-inner flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          <canvas ref={canvasRef} className="block w-full max-h-[460px]" />
          {!imgElement && !errorMsg && (
            <div className="absolute inset-0 flex items-center justify-center bg-cream-100">
              <CircularProgress size={32} sx={{ color: '#C88A79' }} />
            </div>
          )}
        </div>

        {/* Zoom & Adjustment Controls */}
        <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2 text-earth-600">
            <ZoomOutIcon fontSize="small" />
            <Typography variant="caption" className="font-bold">
              Zoom
            </Typography>
          </div>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.05}
            onChange={(_, val) => setZoom(val as number)}
            sx={{
              color: '#C88A79',
              '& .MuiSlider-thumb': {
                width: 18,
                height: 18,
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: '0 0 0 8px rgba(200, 138, 121, 0.16)',
                },
              },
            }}
          />
          <div className="flex items-center gap-2 text-earth-600">
            <ZoomInIcon fontSize="small" />
            <Typography variant="caption" className="w-12 text-center font-bold">
              {zoom.toFixed(2)}x
            </Typography>
            <IconButton onClick={handleReset} size="small" title="Reset Position & Zoom">
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <Box className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {errorMsg}
          </Box>
        )}
      </DialogContent>

      <DialogActions className="px-6 py-4 border-t border-cream-200 bg-white flex items-center justify-between">
        <div>
          {originalFileSize > 0 && (
            <Typography variant="caption" className="text-earth-500 font-medium">
              Source file: {formatFileSize(originalFileSize)}
            </Typography>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={onClose} disabled={isProcessing} sx={{ color: '#735E52' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleApplyCrop}
            disabled={isProcessing || !imgElement}
            startIcon={isProcessing ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
            sx={{
              bgcolor: '#C88A79',
              fontWeight: 600,
              '&:hover': { bgcolor: '#A66E5E' },
            }}
          >
            {isProcessing ? 'Compressing & Uploading...' : 'Apply & Upload'}
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  );
}
