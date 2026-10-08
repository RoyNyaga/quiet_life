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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import { DICTIONARY } from '@/lib/i18n';
import { useApp } from '@/lib/store';
import { Tag } from '@/types/database';

export default function AdminTagsPage() {
  const { tags, createTag, updateTag, deleteTag, locale } = useApp();
  const t = DICTIONARY[locale]?.admin || DICTIONARY.en.admin;

  const [modalOpen, setModalOpen] = useState(false);
  const [editTag, setEditTag] = useState<Tag | null>(null);
  const [deleteConfirmTag, setDeleteConfirmTag] = useState<Tag | null>(null);

  const [nameEn, setNameEn] = useState('');
  const [nameFr, setNameFr] = useState('');

  const handleOpenCreate = () => {
    setEditTag(null);
    setNameEn('');
    setNameFr('');
    setModalOpen(true);
  };

  const handleOpenEdit = (tag: Tag) => {
    setEditTag(tag);
    setNameEn(tag.name_en);
    setNameFr(tag.name_fr);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim()) return;

    if (editTag) {
      updateTag(editTag.id, { name_en: nameEn, name_fr: nameFr });
    } else {
      createTag({ name_en: nameEn, name_fr: nameFr, slug: nameEn.toLowerCase().replace(/\s+/g, '-') });
    }

    setModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmTag) {
      deleteTag(deleteConfirmTag.id);
      setDeleteConfirmTag(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Typography variant="h4" className="font-serif font-bold text-earth-900 text-xl sm:text-2xl md:text-3xl leading-snug">
            {t.tags}
          </Typography>
          <Typography variant="body2" className="text-earth-600">
            {t.tagsDesc}
          </Typography>
        </div>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' } }}>
          {t.addTag}
        </Button>
      </div>

      <Box className="p-6 rounded-3xl bg-white border border-cream-200 shadow-sm">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="font-bold">{t.tagNameEn}</TableCell>
                <TableCell className="font-bold">{t.tagNameFr}</TableCell>
                <TableCell className="font-bold">{t.slug}</TableCell>
                <TableCell className="font-bold text-right">{t.actions}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tags.map(tag => (
                <TableRow key={tag.id} hover>
                  <TableCell className="font-serif font-semibold text-earth-900">{tag.name_en}</TableCell>
                  <TableCell>{tag.name_fr}</TableCell>
                  <TableCell className="text-earth-500 font-mono text-xs">{tag.slug}</TableCell>
                  <TableCell className="text-right">
                    <IconButton onClick={() => handleOpenEdit(tag)} size="small" aria-label="edit tag">
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => setDeleteConfirmTag(tag)}
                      size="small"
                      color="error"
                      aria-label="delete tag"
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
        open={Boolean(deleteConfirmTag)}
        onClose={() => setDeleteConfirmTag(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              p: 1.5,
              border: '1px solid #E8E2DA',
              boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
            },
          },
        }}
      >
        <DialogTitle className="flex items-center gap-2 font-serif font-bold text-earth-900 pb-2">
          <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <WarningAmberIcon fontSize="small" />
          </div>
          <span>{locale === 'fr' ? 'Supprimer le tag ?' : 'Delete Tag?'}</span>
        </DialogTitle>
        <DialogContent className="pt-2">
          <Typography variant="body2" className="text-earth-600">
            {locale === 'fr'
              ? `Êtes-vous certain de vouloir supprimer le tag "${deleteConfirmTag?.name_fr || deleteConfirmTag?.name_en}" ? Cette action est irréversible.`
              : `Are you sure you want to delete the tag "${deleteConfirmTag?.name_en}"? This action cannot be undone.`}
          </Typography>
        </DialogContent>
        <DialogActions className="p-3 pt-2 gap-2">
          <Button onClick={() => setDeleteConfirmTag(null)} sx={{ color: '#5C4438' }}>
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

      {/* Redesigned Modal Dialog */}
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
          <Box sx={{ px: 3.5, pt: 3, pb: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F0ECE6' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              <div className="w-11 h-11 rounded-2xl bg-cream-100 text-earth-700 flex items-center justify-center border border-cream-200 shrink-0">
                <LocalOfferIcon fontSize="small" />
              </div>
              <div>
                <Typography variant="h6" className="font-serif font-bold text-earth-900 leading-tight">
                  {editTag ? t.editTag : t.addTag}
                </Typography>
                <Typography variant="caption" className="text-earth-500 block text-xs mt-0.5">
                  {locale === 'fr'
                    ? 'Renseignez les dénominations bilingues du tag.'
                    : 'Fill in the bilingual names for this tag.'}
                </Typography>
              </div>
            </Box>
            <IconButton onClick={() => setModalOpen(false)} size="small" sx={{ color: '#8C7A70', ml: 1 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Form Content */}
          <DialogContent sx={{ px: 3.5, py: 3.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              {/* English Tag Name */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#3E2E25', fontSize: '0.875rem' }}>
                    {t.tagNameEn} <span style={{ color: '#C88A79' }}>*</span>
                  </Typography>
                  <span className="px-2 py-0.5 rounded-md bg-cream-100 text-earth-600 font-mono text-[11px] font-semibold border border-cream-200">
                    EN
                  </span>
                </Box>
                <TextField
                  fullWidth
                  value={nameEn}
                  onChange={e => setNameEn(e.target.value)}
                  placeholder="e.g. Mindfulness"
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

              {/* French Tag Name */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#3E2E25', fontSize: '0.875rem' }}>
                    {t.tagNameFr} <span style={{ color: '#C88A79' }}>*</span>
                  </Typography>
                  <span className="px-2 py-0.5 rounded-md bg-sage-50 text-sage-700 font-mono text-[11px] font-semibold border border-sage-200">
                    FR
                  </span>
                </Box>
                <TextField
                  fullWidth
                  value={nameFr}
                  onChange={e => setNameFr(e.target.value)}
                  placeholder="ex: Pleine conscience"
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
