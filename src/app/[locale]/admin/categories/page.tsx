'use client';

import { useState } from 'react';
import {
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HomeIcon from '@mui/icons-material/Home';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import SpaIcon from '@mui/icons-material/Spa';
import EmojiFoodBeverageIcon from '@mui/icons-material/EmojiFoodBeverage';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PsychologyIcon from '@mui/icons-material/Psychology';
import BoltIcon from '@mui/icons-material/Bolt';
import CategoryIcon from '@mui/icons-material/Category';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { DICTIONARY } from '@/lib/i18n';
import { useApp } from '@/lib/store';
import { Category } from '@/types/database';

const AVAILABLE_ICONS = [
  { value: 'Home', label: 'Accueil / Home', icon: <HomeIcon fontSize="small" sx={{ color: '#587C64' }} /> },
  { value: 'SelfImprovement', label: 'Développement personnel / Slow living', icon: <SelfImprovementIcon fontSize="small" sx={{ color: '#C88A79' }} /> },
  { value: 'Spa', label: 'Résilience, épreuves & paix intérieure', icon: <SpaIcon fontSize="small" sx={{ color: '#587C64' }} /> },
  { value: 'EmojiFoodBeverage', label: 'Vie saine & alimentation', icon: <EmojiFoodBeverageIcon fontSize="small" sx={{ color: '#C88A79' }} /> },
  { value: 'MenuBook', label: 'Avant-propos / Foreword', icon: <MenuBookIcon fontSize="small" sx={{ color: '#587C64' }} /> },
  { value: 'Psychology', label: 'Psychologie & mental', icon: <PsychologyIcon fontSize="small" sx={{ color: '#C88A79' }} /> },
  { value: 'Bolt', label: 'Énergie & motivation', icon: <BoltIcon fontSize="small" sx={{ color: '#E09F3E' }} /> },
  { value: 'Category', label: 'Général / Thématique', icon: <CategoryIcon fontSize="small" sx={{ color: '#8C7A70' }} /> },
];

export default function AdminCategoriesPage() {
  const { categories, createCategory, updateCategory, deleteCategory, locale } = useApp();
  const t = DICTIONARY[locale]?.admin || DICTIONARY.en.admin;

  const [modalOpen, setModalOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<Category | null>(null);

  // Form State
  const [nameEn, setNameEn] = useState('');
  const [nameFr, setNameFr] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('Spa');

  const handleOpenCreate = () => {
    setEditCat(null);
    setNameEn('');
    setNameFr('');
    setSlug('');
    setIcon('Spa');
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditCat(cat);
    setNameEn(cat.name_en);
    setNameFr(cat.name_fr);
    setSlug(cat.slug);
    setIcon(cat.icon || 'Spa');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim()) return;

    const payload = {
      name_en: nameEn.trim(),
      name_fr: nameFr.trim() || nameEn.trim(),
      slug: slug.trim() || nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      icon: icon || 'Spa',
    };

    if (editCat) {
      updateCategory(editCat.id, payload);
    } else {
      createCategory(payload);
    }

    setModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmCat) {
      deleteCategory(deleteConfirmCat.id);
      setDeleteConfirmCat(null);
    }
  };

  const renderCategoryIcon = (iconName?: string | null) => {
    const item = AVAILABLE_ICONS.find(i => i.value === iconName);
    return item ? item.icon : <SpaIcon fontSize="small" sx={{ color: '#587C64' }} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Typography variant="h4" className="font-serif font-bold text-earth-900 text-xl sm:text-2xl md:text-3xl leading-snug">
            {t.categories}
          </Typography>
          <Typography variant="body2" className="text-earth-600">
            {t.categoriesDesc}
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{
            bgcolor: '#C88A79',
            color: '#FFFFFF',
            fontWeight: 700,
            borderRadius: 3,
            px: 3,
            py: 1,
            textTransform: 'none',
            boxShadow: '0 4px 14px rgba(200, 138, 121, 0.35)',
            '&:hover': { bgcolor: '#A66E5E' },
          }}
        >
          {t.addCategory}
        </Button>
      </div>

      {/* Categories Table */}
      <Box className="p-6 rounded-3xl bg-white border border-cream-200 shadow-sm">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="font-bold">{t.categoryNameEn}</TableCell>
                <TableCell className="font-bold">{t.categoryNameFr}</TableCell>
                <TableCell className="font-bold">{t.slug}</TableCell>
                <TableCell className="font-bold">Icône</TableCell>
                <TableCell className="font-bold text-right">{t.actions}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map(cat => (
                <TableRow key={cat.id} hover>
                  <TableCell className="font-serif font-semibold text-earth-900">{cat.name_en}</TableCell>
                  <TableCell>{cat.name_fr}</TableCell>
                  <TableCell className="text-earth-500 font-mono text-xs">{cat.slug}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <div className="w-7 h-7 rounded-lg bg-cream-100 flex items-center justify-center">
                        {renderCategoryIcon(cat.icon)}
                      </div>
                      <Typography variant="caption" className="text-earth-600 font-mono text-xs">
                        {cat.icon || 'Spa'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell className="text-right">
                    <IconButton onClick={() => handleOpenEdit(cat)} size="small" aria-label="edit category">
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => setDeleteConfirmCat(cat)}
                      size="small"
                      color="error"
                      aria-label="delete category"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Delete Confirmation Pop Confirm Dialog */}
      <Dialog
        open={Boolean(deleteConfirmCat)}
        onClose={() => setDeleteConfirmCat(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              p: 1.5,
              border: '1px solid #E8E2DA',
              boxShadow: '0 16px 40px rgba(92, 68, 56, 0.16)',
            },
          },
        }}
      >
        <DialogTitle className="flex items-center gap-2 font-serif font-bold text-earth-900 pb-2">
          <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <WarningAmberIcon fontSize="small" />
          </div>
          <span>{locale === 'fr' ? 'Supprimer la catégorie ?' : 'Delete Category?'}</span>
        </DialogTitle>
        <DialogContent className="pt-2">
          <Typography variant="body2" className="text-earth-600">
            {locale === 'fr'
              ? `Êtes-vous certain de vouloir supprimer la catégorie "${deleteConfirmCat?.name_fr || deleteConfirmCat?.name_en}" ? Cette action est irréversible.`
              : `Are you sure you want to delete the category "${deleteConfirmCat?.name_en}"? This action cannot be undone.`}
          </Typography>
        </DialogContent>
        <DialogActions className="p-3 pt-2 gap-2">
          <Button onClick={() => setDeleteConfirmCat(null)} sx={{ color: '#5C4438' }}>
            {t.cancel}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            sx={{
              borderRadius: 3,
              fontWeight: 600,
              bgcolor: '#D32F2F',
              '&:hover': { bgcolor: '#B71C1C' },
            }}
          >
            {locale === 'fr' ? 'Supprimer' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Redesigned Edit / Create Modal Dialog */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '24px',
              border: '1px solid #E8E2DA',
              boxShadow: '0 24px 60px -8px rgba(92, 68, 56, 0.22)',
              overflow: 'hidden',
              bgcolor: '#FFFFFF',
            },
          },
        }}
      >
        <form onSubmit={handleSave}>
          {/* Header */}
          <Box sx={{ px: 3.5, pt: 3, pb: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'between', borderBottom: '1px solid #F0ECE6' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              <div className="w-11 h-11 rounded-2xl bg-sage-50 text-sage-700 flex items-center justify-center border border-sage-200 shrink-0">
                <CategoryIcon fontSize="small" />
              </div>
              <div>
                <Typography variant="h6" className="font-serif font-bold text-earth-900 leading-tight">
                  {editCat ? t.editCategory : t.addCategory}
                </Typography>
                <Typography variant="caption" className="text-earth-500 block text-xs mt-0.5">
                  {locale === 'fr'
                    ? 'Renseignez les détails bilingues, le lien URL et l’icône.'
                    : 'Fill in the bilingual titles, URL slug, and display icon.'}
                </Typography>
              </div>
            </Box>
            <IconButton onClick={() => setModalOpen(false)} size="small" sx={{ color: '#8C7A70', ml: 1 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Form Content with Dedicated Spacing & No Overlap */}
          <DialogContent sx={{ px: 3.5, py: 3.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              {/* Field 1: English Category Name */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#3E2E25', fontSize: '0.875rem' }}>
                    {t.categoryNameEn} <span style={{ color: '#C88A79' }}>*</span>
                  </Typography>
                  <span className="px-2 py-0.5 rounded-md bg-cream-100 text-earth-600 font-mono text-[11px] font-semibold border border-cream-200">
                    EN
                  </span>
                </Box>
                <TextField
                  fullWidth
                  value={nameEn}
                  onChange={e => setNameEn(e.target.value)}
                  placeholder="e.g. Slow Living & Well-being"
                  required
                  slotProps={{
                    input: {
                      sx: {
                        borderRadius: '12px',
                        bgcolor: '#FAF8F5',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E8E2DA' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#C88A79' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#C88A79', borderWidth: '2px' },
                      },
                    },
                  }}
                />
              </Box>

              {/* Field 2: French Category Name */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#3E2E25', fontSize: '0.875rem' }}>
                    {t.categoryNameFr} <span style={{ color: '#C88A79' }}>*</span>
                  </Typography>
                  <span className="px-2 py-0.5 rounded-md bg-sage-50 text-sage-700 font-mono text-[11px] font-semibold border border-sage-200">
                    FR
                  </span>
                </Box>
                <TextField
                  fullWidth
                  value={nameFr}
                  onChange={e => setNameFr(e.target.value)}
                  placeholder="ex: Développement personnel & Slow-living"
                  required
                  slotProps={{
                    input: {
                      sx: {
                        borderRadius: '12px',
                        bgcolor: '#FAF8F5',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E8E2DA' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#C88A79' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#C88A79', borderWidth: '2px' },
                      },
                    },
                  }}
                />
              </Box>

              {/* Field 3: URL Slug */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#3E2E25', fontSize: '0.875rem' }}>
                    {t.slug}
                  </Typography>
                  <span className="text-earth-400 text-xs">
                    {locale === 'fr' ? 'Optionnel' : 'Optional'}
                  </span>
                </Box>
                <TextField
                  fullWidth
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  placeholder="ex: slow-living"
                  helperText={
                    locale === 'fr'
                      ? 'Généré automatiquement à partir du nom si laissé vide.'
                      : 'Auto-generated from title if left empty.'
                  }
                  slotProps={{
                    input: {
                      sx: {
                        borderRadius: '12px',
                        bgcolor: '#FAF8F5',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E8E2DA' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#C88A79' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#C88A79', borderWidth: '2px' },
                      },
                    },
                  }}
                />
              </Box>

              {/* Field 4: Thematic Icon Picker */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#3E2E25', fontSize: '0.875rem', mb: 1 }}>
                  {locale === 'fr' ? 'Icône thématique' : 'Category Icon'}
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                  slotProps={{
                    select: {
                      renderValue: selected => {
                        const opt = AVAILABLE_ICONS.find(i => i.value === selected);
                        return (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <div className="w-6 h-6 rounded-md bg-cream-100 flex items-center justify-center shrink-0">
                              {opt ? opt.icon : <SpaIcon fontSize="small" sx={{ color: '#587C64' }} />}
                            </div>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#2C1810' }}>
                              {opt ? opt.label : (selected as string)}
                            </Typography>
                          </Box>
                        );
                      },
                    },
                    input: {
                      sx: {
                        borderRadius: '12px',
                        bgcolor: '#FAF8F5',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E8E2DA' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#C88A79' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#C88A79', borderWidth: '2px' },
                      },
                    },
                  }}
                >
                  {AVAILABLE_ICONS.map(option => (
                    <MenuItem key={option.value} value={option.value} sx={{ py: 1.5, px: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                        <div className="w-8 h-8 rounded-lg bg-cream-100 flex items-center justify-center shrink-0">
                          {option.icon}
                        </div>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#3E2E25' }}>
                          {option.label}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
          </DialogContent>

          {/* Footer Actions */}
          <DialogActions sx={{ px: 3.5, py: 2.5, borderTop: '1px solid #F0ECE6', gap: 1.5 }}>
            <Button
              onClick={() => setModalOpen(false)}
              sx={{
                color: '#5C4438',
                borderRadius: '12px',
                px: 3,
                py: 1.1,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: '#F5EFEB' },
              }}
            >
              {t.cancel}
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<CheckIcon />}
              sx={{
                bgcolor: '#C88A79',
                color: '#FFFFFF',
                borderRadius: '12px',
                px: 3.5,
                py: 1.1,
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(200, 138, 121, 0.35)',
                '&:hover': {
                  bgcolor: '#A66E5E',
                  boxShadow: '0 6px 18px rgba(200, 138, 121, 0.45)',
                },
              }}
            >
              {t.save}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}
