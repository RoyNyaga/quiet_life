'use client';

import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import ChecklistIcon from '@mui/icons-material/Checklist';
import CodeIcon from '@mui/icons-material/Code';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import TableChartIcon from '@mui/icons-material/TableChart';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import VerticalSplitIcon from '@mui/icons-material/VerticalSplit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { MarkdownRenderer } from '@/components/article/MarkdownRenderer';
import { compressImage, uploadBlogImage } from '@/lib/storage';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  minHeight?: string;
  onSyncReadTime?: (minutes: number) => void;
}

export function MarkdownEditor({
  value,
  onChange,
  label = 'Markdown Content',
  minHeight = '360px',
  onSyncReadTime,
}: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<'write' | 'split' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Link Dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Image Dialog state
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageAlt, setImageAlt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageTab, setImageTab] = useState<0 | 1>(0); // 0: Upload file, 1: External URL
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const inlineFileInputRef = useRef<HTMLInputElement | null>(null);

  // Statistics
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));

  // Helper to wrap or insert text around current selection in textarea
  const insertFormatting = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    const replacement = selectedText
      ? `${prefix}${selectedText}${suffix}`
      : `${prefix}${defaultPlaceholder}${suffix}`;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    // Restore cursor position / selection
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      } else {
        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length + defaultPlaceholder.length
        );
      }
    }, 0);
  };

  // Helper for block-level elements (headings, quotes, lists)
  // Helper for block-level elements (headings, quotes, lists)
  const insertBlockPrefix = (prefix: string, placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.substring(0, start);
    const after = value.substring(end);
    const selectedText = value.substring(start, end);

    // Ensure a space exists after prefix (e.g. '# ' not '#', '1. ' not '1.')
    const formattedPrefix = prefix.endsWith(' ') ? prefix : `${prefix} `;

    // Ensure block-level elements have a blank line before them if preceded by text
    let prepend = '';
    if (before.length > 0) {
      if (before.endsWith('\n\n')) {
        prepend = formattedPrefix;
      } else if (before.endsWith('\n')) {
        prepend = `\n${formattedPrefix}`;
      } else {
        prepend = `\n\n${formattedPrefix}`;
      }
    } else {
      prepend = formattedPrefix;
    }

    const textToInsert = selectedText || placeholder;
    const replacement = `${prepend}${textToInsert}\n`;

    const newValue = before + replacement + after;
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prepend.length,
        start + prepend.length + textToInsert.length
      );
    }, 0);
  };

  // Keyboard shortcut listener
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        insertFormatting('**', '**', 'bold text');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        insertFormatting('*', '*', 'italic text');
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        openLinkDialog();
      }
    }
  };

  // Link dialog handlers
  const openLinkDialog = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.substring(start, end);
      setLinkText(selected || '');
    }
    setLinkUrl('');
    setLinkDialogOpen(true);
  };

  const handleApplyLink = () => {
    if (!linkUrl.trim()) return;
    const label = linkText.trim() || linkUrl.trim();
    insertFormatting(`[${label}](${linkUrl})`);
    setLinkDialogOpen(false);
  };

  // Image dialog handlers
  const openImageDialog = () => {
    setImageAlt('');
    setImageUrl('');
    setUploadError(null);
    setImageDialogOpen(true);
  };

  const handleApplyImageUrl = () => {
    if (!imageUrl.trim()) return;
    const alt = imageAlt.trim() || 'Article illustration';
    insertFormatting(`\n![${alt}](${imageUrl})\n`);
    setImageDialogOpen(false);
  };

  const handleUploadInlineImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose a valid image file');
      return;
    }

    setIsUploadingImage(true);
    setUploadError(null);

    try {
      // 1. Compress image for body insertion (max width 1200px)
      const compressed = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.82,
        mimeType: 'image/webp',
      });

      // 2. Upload directly to blog-images/body/
      const uploadedUrl = await uploadBlogImage(compressed.blob, 'body');

      const alt = imageAlt.trim() || file.name.replace(/\.[^/.]+$/, '');
      insertFormatting(`\n![${alt}](${uploadedUrl})\n`);
      setImageDialogOpen(false);
    } catch (err: any) {
      console.error('Error uploading inline body image:', err);
      setUploadError(err.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Drag & drop or clipboard paste directly onto the textarea
  const handleDropImage = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0].type.startsWith('image/')) {
      e.preventDefault();
      await handleUploadInlineImage(files[0]);
    }
  };

  const handlePasteImage = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          await handleUploadInlineImage(file);
          break;
        }
      }
    }
  };

  return (
    <Box className="rounded-2xl border border-cream-200 bg-white overflow-hidden shadow-xs space-y-0">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-2 bg-cream-50/80 border-b border-cream-200">
        {/* Formatting Buttons */}
        <div className="flex flex-wrap items-center gap-0.5">
          {/* Headings */}
          <Tooltip title="Heading 1 (#)">
            <Button
              size="small"
              onClick={() => insertBlockPrefix('#', 'Heading 1')}
              sx={{ minWidth: 28, px: 0.8, py: 0.4, fontWeight: 700, color: '#5C4438' }}
            >
              H1
            </Button>
          </Tooltip>
          <Tooltip title="Heading 2 (##)">
            <Button
              size="small"
              onClick={() => insertBlockPrefix('##', 'Heading 2')}
              sx={{ minWidth: 28, px: 0.8, py: 0.4, fontWeight: 700, color: '#5C4438' }}
            >
              H2
            </Button>
          </Tooltip>
          <Tooltip title="Heading 3 (###)">
            <Button
              size="small"
              onClick={() => insertBlockPrefix('###', 'Heading 3')}
              sx={{ minWidth: 28, px: 0.8, py: 0.4, fontWeight: 700, color: '#5C4438' }}
            >
              H3
            </Button>
          </Tooltip>

          <Divider orientation="vertical" flexItem className="mx-1 h-5 my-auto" />

          {/* Text Style */}
          <Tooltip title="Bold (Ctrl+B)">
            <IconButton size="small" onClick={() => insertFormatting('**', '**', 'bold text')} sx={{ color: '#5C4438' }}>
              <FormatBoldIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Italic (Ctrl+I)">
            <IconButton size="small" onClick={() => insertFormatting('*', '*', 'italic text')} sx={{ color: '#5C4438' }}>
              <FormatItalicIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Strikethrough (~~)">
            <IconButton size="small" onClick={() => insertFormatting('~~', '~~', 'strikethrough')} sx={{ color: '#5C4438' }}>
              <StrikethroughSIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem className="mx-1 h-5 my-auto" />

          {/* Blocks */}
          <Tooltip title="Blockquote (>)">
            <IconButton size="small" onClick={() => insertBlockPrefix('>', 'Inspiring quote')} sx={{ color: '#5C4438' }}>
              <FormatQuoteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Bullet List (-)">
            <IconButton size="small" onClick={() => insertBlockPrefix('-', 'List item')} sx={{ color: '#5C4438' }}>
              <FormatListBulletedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Numbered List (1.)">
            <IconButton size="small" onClick={() => insertBlockPrefix('1.', 'First step')} sx={{ color: '#5C4438' }}>
              <FormatListNumberedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Checklist Task (- [ ])">
            <IconButton size="small" onClick={() => insertBlockPrefix('- [ ]', 'Task item')} sx={{ color: '#5C4438' }}>
              <ChecklistIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem className="mx-1 h-5 my-auto" />

          {/* Code */}
          <Tooltip title="Inline Code (`)">
            <IconButton size="small" onClick={() => insertFormatting('`', '`', 'code')} sx={{ color: '#5C4438' }}>
              <CodeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Code Block (```)">
            <IconButton size="small" onClick={() => insertFormatting('\n```javascript\n', '\n```\n', '// write code here')} sx={{ color: '#5C4438' }}>
              <IntegrationInstructionsIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem className="mx-1 h-5 my-auto" />

          {/* Media & Links */}
          <Tooltip title="Insert Link (Ctrl+K)">
            <IconButton size="small" onClick={openLinkDialog} sx={{ color: '#C88A79' }}>
              <InsertLinkIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Insert Image / Upload to blog-images">
            <IconButton size="small" onClick={openImageDialog} sx={{ color: '#C88A79' }}>
              <AddPhotoAlternateIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Insert Table">
            <IconButton
              size="small"
              onClick={() => insertFormatting('\n| Feature | Description |\n| --- | --- |\n| Point 1 | Mindfulness practice |\n| Point 2 | Daily reflection |\n')}
              sx={{ color: '#5C4438' }}
            >
              <TableChartIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Horizontal Divider (---)">
            <IconButton size="small" onClick={() => insertFormatting('\n---\n')} sx={{ color: '#5C4438' }}>
              <HorizontalRuleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-cream-200">
          <Tooltip title="Write Only">
            <Button
              size="small"
              onClick={() => setViewMode('write')}
              startIcon={<ViewAgendaIcon fontSize="small" />}
              sx={{
                fontSize: '0.75rem',
                py: 0.3,
                px: 1,
                bgcolor: viewMode === 'write' ? '#C88A79' : 'transparent',
                color: viewMode === 'write' ? '#FFFFFF' : '#735E52',
                '&:hover': { bgcolor: viewMode === 'write' ? '#A66E5E' : '#F5EFE6' },
              }}
            >
              Write
            </Button>
          </Tooltip>
          <Tooltip title="Split Side-by-Side">
            <Button
              size="small"
              onClick={() => setViewMode('split')}
              startIcon={<VerticalSplitIcon fontSize="small" />}
              sx={{
                fontSize: '0.75rem',
                py: 0.3,
                px: 1,
                bgcolor: viewMode === 'split' ? '#C88A79' : 'transparent',
                color: viewMode === 'split' ? '#FFFFFF' : '#735E52',
                '&:hover': { bgcolor: viewMode === 'split' ? '#A66E5E' : '#F5EFE6' },
              }}
            >
              Split
            </Button>
          </Tooltip>
          <Tooltip title="Live Preview">
            <Button
              size="small"
              onClick={() => setViewMode('preview')}
              startIcon={<VisibilityIcon fontSize="small" />}
              sx={{
                fontSize: '0.75rem',
                py: 0.3,
                px: 1,
                bgcolor: viewMode === 'preview' ? '#C88A79' : 'transparent',
                color: viewMode === 'preview' ? '#FFFFFF' : '#735E52',
                '&:hover': { bgcolor: viewMode === 'preview' ? '#A66E5E' : '#F5EFE6' },
              }}
            >
              Preview
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="relative">
        {viewMode === 'write' && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onDrop={handleDropImage}
            onPaste={handlePasteImage}
            placeholder="Write your mindful article here using Markdown or toolbar controls..."
            className="w-full p-5 font-mono text-sm leading-relaxed text-earth-900 bg-white resize-y outline-none border-0 focus:ring-0 focus:outline-none"
            style={{ minHeight }}
          />
        )}

        {viewMode === 'split' && (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-cream-200" style={{ minHeight }}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={e => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onDrop={handleDropImage}
              onPaste={handlePasteImage}
              placeholder="Write your mindful article here..."
              className="w-full h-full p-5 font-mono text-sm leading-relaxed text-earth-900 bg-white resize-none outline-none border-0 focus:ring-0 focus:outline-none"
            />
            <div className="p-6 bg-cream-50/40 overflow-y-auto max-h-[600px]">
              <MarkdownRenderer content={value || '*Live preview appears here as you write...*'} />
            </div>
          </div>
        )}

        {viewMode === 'preview' && (
          <div className="p-8 bg-cream-50/40 overflow-y-auto" style={{ minHeight }}>
            <MarkdownRenderer content={value || '*No content written yet.*'} />
          </div>
        )}
      </div>

      {/* Editorial Footer Status Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-cream-50/60 border-t border-cream-200 text-xs text-earth-500">
        <div className="flex items-center gap-4">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} characters</span>
          <span>•</span>
          <span className="flex items-center gap-1 font-medium text-earth-700">
            <AccessTimeIcon fontSize="inherit" /> ~{estimatedReadTime} min read
          </span>
        </div>

        {onSyncReadTime && (
          <Button
            size="small"
            onClick={() => onSyncReadTime(estimatedReadTime)}
            sx={{
              py: 0.2,
              px: 1,
              fontSize: '0.72rem',
              color: '#C88A79',
              fontWeight: 600,
              textTransform: 'none',
            }}
          >
            Apply to Read Time ({estimatedReadTime}m)
          </Button>
        )}
      </div>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="font-serif font-bold text-earth-900 pb-2">Insert Link</DialogTitle>
        <DialogContent className="space-y-4 pt-2">
          <TextField
            fullWidth
            size="small"
            label="Link Text"
            placeholder="e.g. Daily Meditation Guide"
            value={linkText}
            onChange={e => setLinkText(e.target.value)}
          />
          <TextField
            fullWidth
            size="small"
            label="URL"
            placeholder="https://..."
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleApplyLink}
            disabled={!linkUrl.trim()}
            sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' } }}
          >
            Insert Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onClose={() => setImageDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="font-serif font-bold text-earth-900 pb-2 flex items-center justify-between">
          <span>Insert Body Image</span>
        </DialogTitle>
        <DialogContent className="space-y-4 pt-2">
          <Tabs value={imageTab} onChange={(_, val) => setImageTab(val)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Upload to blog-images" />
            <Tab label="Image URL" />
          </Tabs>

          <TextField
            fullWidth
            size="small"
            label="Image Caption / Alt Text (Optional)"
            placeholder="Describe the image..."
            value={imageAlt}
            onChange={e => setImageAlt(e.target.value)}
          />

          {imageTab === 0 ? (
            <div className="space-y-3">
              <input
                ref={inlineFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadInlineImage(file);
                }}
              />
              <div
                onClick={() => inlineFileInputRef.current?.click()}
                className="cursor-pointer rounded-2xl border-2 border-dashed border-cream-300 p-6 text-center hover:bg-cream-50 hover:border-terracotta-400 transition-all"
              >
                {isUploadingImage ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <CircularProgress size={28} sx={{ color: '#C88A79' }} />
                    <Typography variant="body2" className="text-earth-600">
                      Compressing & uploading to blog-images...
                    </Typography>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto w-10 h-10 rounded-xl bg-terracotta-100 flex items-center justify-center text-terracotta-700 mb-2">
                      <CloudUploadIcon fontSize="small" />
                    </div>
                    <Typography variant="body2" className="font-bold text-earth-800">
                      Click to choose image file
                    </Typography>
                    <Typography variant="caption" className="text-earth-500">
                      Compresses to WebP and uploads to the Supabase blog-images bucket
                    </Typography>
                  </>
                )}
              </div>
            </div>
          ) : (
            <TextField
              fullWidth
              size="small"
              label="Image URL"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              autoFocus
            />
          )}

          {uploadError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs">
              {uploadError}
            </div>
          )}
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setImageDialogOpen(false)}>Cancel</Button>
          {imageTab === 1 && (
            <Button
              variant="contained"
              onClick={handleApplyImageUrl}
              disabled={!imageUrl.trim()}
              sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' } }}
            >
              Insert Image
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
