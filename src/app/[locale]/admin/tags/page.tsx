'use client';

import { useState } from 'react';
import { Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Box, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DICTIONARY } from '@/lib/i18n';
import { useApp } from '@/lib/store';
import { Tag } from '@/types/database';

export default function AdminTagsPage() {
  const { tags, createTag, updateTag, deleteTag, locale } = useApp();
  const t = DICTIONARY[locale]?.admin || DICTIONARY.en.admin;

  const [modalOpen, setModalOpen] = useState(false);
  const [editTag, setEditTag] = useState<Tag | null>(null);

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
                    <IconButton onClick={() => handleOpenEdit(tag)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => deleteTag(tag.id)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Modal Dialog */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4, p: 2 } } }}>
        <form onSubmit={handleSave}>
          <DialogTitle className="font-serif font-bold text-earth-900">{editTag ? t.editTag : t.addTag}</DialogTitle>
          <DialogContent className="space-y-4 pt-2">
            <TextField fullWidth label={t.tagNameEn} value={nameEn} onChange={e => setNameEn(e.target.value)} required />
            <TextField fullWidth label={t.tagNameFr} value={nameFr} onChange={e => setNameFr(e.target.value)} required />
          </DialogContent>
          <DialogActions className="p-4">
            <Button onClick={() => setModalOpen(false)}>{t.cancel}</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' } }}>
              {t.save}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}
