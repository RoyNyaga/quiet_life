'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Box,
  Dialog,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useApp } from '@/lib/store';
import { MarkdownRenderer } from '@/components/article/MarkdownRenderer';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { MarkdownEditor } from '@/components/admin/MarkdownEditor';
import { PostStatus } from '@/types/database';
import { getLocalizedField, DICTIONARY } from '@/lib/i18n';

function PostEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { posts, categories, tags, createPost, updatePost, locale } = useApp();
  const t = DICTIONARY[locale]?.admin || DICTIONARY.en.admin;

  const [activeLangTab, setActiveLangTab] = useState<0 | 1>(0);

  // Form Fields
  const [titleEn, setTitleEn] = useState('');
  const [titleFr, setTitleFr] = useState('');
  const [slug, setSlug] = useState('');
  const [excerptEn, setExcerptEn] = useState('');
  const [excerptFr, setExcerptFr] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [contentFr, setContentFr] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [readTime, setReadTime] = useState(5);
  const [status, setStatus] = useState<PostStatus>('published');
  const [slugSourceLocale, setSlugSourceLocale] = useState<'en' | 'fr'>('en');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLocale, setPreviewLocale] = useState<'en' | 'fr'>('en');

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  useEffect(() => {
    if (editId) {
      const existing = posts.find(p => p.id === editId);
      if (existing) {
        setTitleEn(existing.title_en);
        setTitleFr(existing.title_fr || '');
        setSlug(existing.slug);
        setExcerptEn(existing.excerpt_en || '');
        setExcerptFr(existing.excerpt_fr || '');
        setContentEn(existing.content_markdown_en);
        setContentFr(existing.content_markdown_fr || '');
        if (existing.category_id) setCategoryId(existing.category_id);
        if (existing.cover_image_url) setCoverImageUrl(existing.cover_image_url);
        setReadTime(existing.read_time_minutes || 5);
        setStatus(existing.status);
        if (existing.slug_source_locale) {
          setSlugSourceLocale(existing.slug_source_locale as 'en' | 'fr');
        }
        if (existing.post_tags && existing.post_tags.length > 0) {
          setSelectedTagIds(existing.post_tags.map(pt => pt.tags?.id).filter(Boolean) as string[]);
        }
      }
    }
  }, [editId, posts]);

  const handleTitleEnChange = (val: string) => {
    setTitleEn(val);
    if (!editId && slugSourceLocale === 'en') {
      setSlug(slugify(val));
    }
  };

  const handleTitleFrChange = (val: string) => {
    setTitleFr(val);
    if (!editId && slugSourceLocale === 'fr') {
      setSlug(slugify(val));
    }
  };

  const handleSlugSourceToggle = (useFrench: boolean) => {
    const newSource: 'en' | 'fr' = useFrench ? 'fr' : 'en';
    setSlugSourceLocale(newSource);
    const targetTitle = useFrench ? titleFr : titleEn;
    if (targetTitle) {
      setSlug(slugify(targetTitle));
    }
  };

  const handleTagsChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedTagIds(typeof value === 'string' ? value.split(',') : value);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!titleEn.trim() || !contentEn.trim()) {
      alert('Please provide at least an English title and markdown content.');
      return;
    }

    const assignedTags = tags
      .filter(t => selectedTagIds.includes(t.id))
      .map(t => ({ tags: t }));

    const postPayload = {
      title_en: titleEn,
      title_fr: titleFr,
      slug: slug || `article-${Date.now()}`,
      slug_source_locale: slugSourceLocale,
      excerpt_en: excerptEn,
      excerpt_fr: excerptFr,
      content_markdown_en: contentEn,
      content_markdown_fr: contentFr,
      category_id: categoryId,
      cover_image_url: coverImageUrl || null,
      read_time_minutes: readTime || 5,
      status,
      post_tags: assignedTags,
    };

    if (editId) {
      updatePost(editId, postPayload);
    } else {
      createPost(postPayload);
    }

    router.push(`/${locale}/admin/posts`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href={`/${locale}/admin/posts`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-earth-500 hover:text-terracotta-600 transition-colors mb-1"
          >
            <ArrowBackIcon fontSize="inherit" /> {t.backToArticles}
          </Link>
          <Typography variant="h4" className="font-serif font-bold text-earth-900 text-xl sm:text-2xl md:text-3xl leading-snug">
            {editId ? t.editPost : t.createPost}
          </Typography>
          <Typography variant="body2" className="text-earth-600">
            {t.editorSubtitle}
          </Typography>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={() => {
              setPreviewLocale(activeLangTab === 1 ? 'fr' : (locale === 'fr' ? 'fr' : 'en'));
              setPreviewOpen(true);
            }}
            sx={{ color: '#5C4438', borderColor: '#E8E2DA', textTransform: 'none', fontWeight: 600 }}
          >
            {t.previewDraft}
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{
              bgcolor: '#C88A79',
              '&:hover': { bgcolor: '#A66E5E' },
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
          >
            {editId ? t.updateArticle : t.saveAndPublish}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Cover Image Uploader & Compressor */}
        <Box className="p-6 rounded-3xl bg-white border border-cream-200 shadow-sm">
          <ImageUploader
            label="Article Cover Image"
            value={coverImageUrl}
            onChange={url => setCoverImageUrl(url)}
            aspectRatio="16:9"
            folder="covers"
            helperText="Upload a high-resolution cover photo. You can crop it to 16:9 and it will automatically compress to WebP before storing."
          />
        </Box>

        {/* Core Metadata Grid */}
        <Box className="p-6 rounded-3xl bg-white border border-cream-200 shadow-sm space-y-6">
          {/* Section heading */}
          <div className="flex items-center gap-3 pb-1 border-b border-cream-200">
            <div className="w-1 h-6 rounded-full bg-terracotta-400" />
            <Typography variant="h6" className="font-serif font-bold text-earth-900 text-base sm:text-lg">
              {locale === 'fr' ? 'Paramètres & Taxonomie' : 'Article Settings & Taxonomy'}
            </Typography>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormControl fullWidth>
              <InputLabel>{t.category}</InputLabel>
              <Select
                value={categoryId}
                label={t.category}
                onChange={e => setCategoryId(e.target.value)}
              >
                {categories.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {getLocalizedField(cat, 'name', locale)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>{t.status}</InputLabel>
              <Select
                value={status}
                label={t.status}
                onChange={e => setStatus(e.target.value as PostStatus)}
              >
                <MenuItem value="published">{t.published}</MenuItem>
                <MenuItem value="draft">{locale === 'fr' ? 'Brouillon (Non listé)' : 'Draft (Unlisted)'}</MenuItem>
                <MenuItem value="archived">{t.archived}</MenuItem>
              </Select>
            </FormControl>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            <div>
              <TextField
                fullWidth
                label={t.slug}
                value={slug}
                onChange={e => setSlug(e.target.value)}
                helperText={
                  slugSourceLocale === 'fr'
                    ? (locale === 'fr' ? 'Généré depuis le titre français' : 'Generated from French title')
                    : (locale === 'fr' ? 'Généré depuis le titre anglais' : 'Generated from English title')
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={slugSourceLocale === 'fr'}
                    onChange={e => handleSlugSourceToggle(e.target.checked)}
                    size="small"
                    sx={{
                      color: '#C88A79',
                      '&.Mui-checked': { color: '#C88A79' },
                    }}
                  />
                }
                label={
                  <Typography variant="caption" className="font-semibold text-earth-800">
                    {locale === 'fr' ? 'Utiliser le titre français pour le slug' : 'Use French title to generate URL slug'}
                  </Typography>
                }
                className="mt-1 ml-0"
              />
            </div>
            <TextField
              fullWidth
              type="number"
              label={locale === 'fr' ? 'Temps de lecture (min)' : 'Read Time (Minutes)'}
              value={readTime}
              onChange={e => setReadTime(Math.max(1, Number(e.target.value)))}
              helperText={locale === 'fr' ? 'Calculé automatiquement' : 'Auto-calculated from content'}
            />
            <FormControl fullWidth>
              <InputLabel>{t.tags}</InputLabel>
              <Select
                multiple
                value={selectedTagIds}
                onChange={handleTagsChange}
                input={<OutlinedInput label={t.tags} />}
                renderValue={selected => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map(tagId => {
                      const tag = tags.find(tg => tg.id === tagId);
                      return (
                        <Chip
                          key={tagId}
                          label={tag ? getLocalizedField(tag, 'name', locale) : tagId}
                          size="small"
                          sx={{ bgcolor: '#F0EAE1', color: '#5C4438', height: 22, fontSize: '0.7rem' }}
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {tags.map(tag => (
                  <MenuItem key={tag.id} value={tag.id}>
                    {getLocalizedField(tag, 'name', locale)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </Box>

        {/* Localized Content Section */}
        <Box className="p-6 rounded-3xl bg-white border border-cream-200 shadow-sm space-y-6">
          {/* Section heading */}
          <div className="flex items-center gap-3 pb-1 border-b border-cream-200">
            <div className="w-1 h-6 rounded-full bg-sage-400" style={{ backgroundColor: '#749D81' }} />
            <Typography variant="h6" className="font-serif font-bold text-earth-900 text-base sm:text-lg">
              {locale === 'fr' ? 'Contenu de l\'Article' : 'Article Content'}
            </Typography>
          </div>

          <div className="border-b border-cream-200">
            <Tabs
              value={activeLangTab}
              onChange={(_, val) => setActiveLangTab(val)}
              textColor="primary"
              indicatorColor="primary"
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                },
              }}
            >
              <Tab label={locale === 'fr' ? 'Anglais (Défaut)' : 'English (Default)'} />
              <Tab label={locale === 'fr' ? 'Traduction Française (Optionnel)' : 'French Translation (Optional)'} />
            </Tabs>
          </div>

          {activeLangTab === 0 ? (
            <div className="space-y-6 pt-1">
              <TextField
                fullWidth
                label={t.titleEn}
                value={titleEn}
                onChange={e => handleTitleEnChange(e.target.value)}
                placeholder="e.g. The Art of Unhurried Mornings"
                required
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label={t.excerptEn}
                value={excerptEn}
                onChange={e => setExcerptEn(e.target.value)}
                placeholder="A brief summary for previews and social share cards..."
              />
              <div className="space-y-2">
                <Typography variant="subtitle2" className="font-semibold text-earth-700">
                  {t.contentEn}
                </Typography>
                <MarkdownEditor
                  value={contentEn}
                  onChange={setContentEn}
                  minHeight="420px"
                  onSyncReadTime={mins => setReadTime(mins)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6 pt-1">
              <TextField
                fullWidth
                label={t.titleFr}
                value={titleFr}
                onChange={e => handleTitleFrChange(e.target.value)}
                placeholder="e.g. L'art des matins paisibles"
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label={t.excerptFr}
                value={excerptFr}
                onChange={e => setExcerptFr(e.target.value)}
                placeholder="Un bref résumé pour les aperçus et réseaux sociaux..."
              />
              <div className="space-y-2">
                <Typography variant="subtitle2" className="font-semibold text-earth-700">
                  {t.contentFr}
                </Typography>
                <MarkdownEditor
                  value={contentFr}
                  onChange={setContentFr}
                  minHeight="420px"
                />
              </div>
            </div>
          )}
        </Box>
      </form>

      {/* Live Draft Preview Modal */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              p: { xs: 2.5, sm: 4 },
              borderRadius: 4,
              bgcolor: '#FAF8F5',
              border: '1px solid #EAE3DA',
              maxHeight: '90vh',
            },
          },
        }}
      >
        {(() => {
          const isFr = previewLocale === 'fr';
          const displayTitle = isFr ? (titleFr || titleEn) : titleEn;
          const displayExcerpt = isFr ? (excerptFr || excerptEn) : excerptEn;
          const displayContent = isFr ? contentFr : contentEn;

          return (
            <div className="space-y-6">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cream-200 pb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <Typography variant="caption" className="text-terracotta-600 font-bold uppercase tracking-wider">
                    {t.publicDraftPreview}
                  </Typography>

                  {/* Language Switcher */}
                  <div className="inline-flex rounded-xl p-1 bg-cream-100 border border-cream-200">
                    <button
                      type="button"
                      onClick={() => setPreviewLocale('en')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        !isFr
                          ? 'bg-white text-earth-900 shadow-xs'
                          : 'text-earth-600 hover:text-earth-900'
                      }`}
                    >
                      🇬🇧 English
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewLocale('fr')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isFr
                          ? 'bg-white text-earth-900 shadow-xs'
                          : 'text-earth-600 hover:text-earth-900'
                      }`}
                    >
                      🇫🇷 Français
                    </button>
                  </div>
                </div>

                <Chip
                  label={`${readTime} ${t.readingTime || 'min read'}`}
                  size="small"
                  sx={{ bgcolor: '#EFEBE6', color: '#5C4438', fontWeight: 600 }}
                />
              </div>

              {/* Article Title - Reduced Size & Proportional */}
              <Typography
                variant="h4"
                className="font-serif font-bold text-earth-900 leading-snug"
                sx={{
                  fontSize: { xs: '1.4rem', sm: '1.85rem' },
                  lineHeight: 1.3,
                  mt: 1,
                }}
              >
                {displayTitle || t.untitledArticle}
              </Typography>

              {/* Cover Image with Generous Margin */}
              {coverImageUrl && (
                <Box sx={{ mt: 3.5, mb: 4.5 }}>
                  <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden shadow-md">
                    <img src={coverImageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                </Box>
              )}

              {/* Description / Excerpt with Generous Margin */}
              {displayExcerpt && (
                <Box sx={{ mt: 3.5, mb: 4.5 }}>
                  <Typography
                    variant="subtitle1"
                    className="text-earth-700 italic border-l-4 border-terracotta-400 pl-4 py-1 leading-relaxed text-base sm:text-lg"
                  >
                    {displayExcerpt}
                  </Typography>
                </Box>
              )}

              {/* Body Content with Generous Margin */}
              <Box sx={{ mt: 4.5, mb: 3 }}>
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-cream-200 shadow-xs">
                  <MarkdownRenderer
                    content={displayContent || `*${t.noContentYet}*`}
                  />
                </div>
              </Box>

              {/* Close Button */}
              <Button
                variant="outlined"
                onClick={() => setPreviewOpen(false)}
                fullWidth
                sx={{
                  color: '#5C4438',
                  borderColor: '#E8E2DA',
                  borderRadius: 3,
                  py: 1.2,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { borderColor: '#C88A79', bgcolor: '#F5EFEB' },
                }}
              >
                {t.closePreview}
              </Button>
            </div>
          );
        })()}
      </Dialog>
    </div>
  );
}

export default function PostEditorPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-earth-600">Loading editor...</div>}>
      <PostEditorContent />
    </Suspense>
  );
}
