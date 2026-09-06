'use client';

import { useState } from 'react';
import { Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Box, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useApp } from '@/lib/store';
import { Category } from '@/types/database';

export default function AdminCategoriesPage() {
  const { categories, createCategory, updateCategory, deleteCategory } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);

  // Form State
  const [nameEn, setNameEn] = useState('');
  const [nameFr, setNameFr] = useState('');
  const [slug, setSlug] = useState('');

  const handleOpenCreate = () => {
    setEditCat(null);
    setNameEn('');
    setNameFr('');
    setSlug('');
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditCat(cat);
    setNameEn(cat.name_en);
    setNameFr(cat.name_fr);
    setSlug(cat.slug);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim()) return;

    if (editCat) {
      updateCategory(editCat.id, { name_en: nameEn, name_fr: nameFr, slug: slug || nameEn.toLowerCase().replace(/\s+/g, '-') });
    } else {
      createCategory({ name_en: nameEn, name_fr: nameFr, slug: slug || nameEn.toLowerCase().replace(/\s+/g, '-') });
    }

    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Typography variant="h4" className="font-serif font-bold text-earth-900">
            Categories Management
          </Typography>
          <Typography variant="body2" className="text-earth-600">
            Create, update, and organize publication categories.
          </Typography>
        </div>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' } }}>
          Add Category
        </Button>
      </div>

      <Box className="p-6 rounded-3xl bg-white border border-cream-200 shadow-sm">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="font-bold">Name (English)</TableCell>
                <TableCell className="font-bold">Name (French)</TableCell>
                <TableCell className="font-bold">Slug</TableCell>
                <TableCell className="font-bold text-right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map(cat => (
                <TableRow key={cat.id} hover>
                  <TableCell className="font-serif font-semibold text-earth-900">{cat.name_en}</TableCell>
                  <TableCell>{cat.name_fr}</TableCell>
                  <TableCell className="text-earth-500 font-mono text-xs">{cat.slug}</TableCell>
                  <TableCell className="text-right">
                    <IconButton onClick={() => handleOpenEdit(cat)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => deleteCategory(cat.id)} size="small" color="error">
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
          <DialogTitle className="font-serif font-bold text-earth-900">{editCat ? 'Edit Category' : 'Create Category'}</DialogTitle>
          <DialogContent className="space-y-4 pt-2">
            <TextField fullWidth label="Name (English)" value={nameEn} onChange={e => setNameEn(e.target.value)} required />
            <TextField fullWidth label="Name (French)" value={nameFr} onChange={e => setNameFr(e.target.value)} required />
            <TextField fullWidth label="URL Slug" value={slug} onChange={e => setSlug(e.target.value)} />
          </DialogContent>
          <DialogActions className="p-4">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' } }}>
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}
