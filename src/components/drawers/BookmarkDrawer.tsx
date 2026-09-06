'use client';

import { useState } from 'react';
import { Drawer, Typography, IconButton, Button, TextField, Checkbox, List, ListItem, Divider, Box, Snackbar, Alert } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import AddIcon from '@mui/icons-material/Add';
import { motion } from 'framer-motion';
import { useApp } from '@/lib/store';
import { Post } from '@/types/database';
import { DICTIONARY } from '@/lib/i18n';

interface BookmarkDrawerProps {
  open: boolean;
  onClose: () => void;
  targetPost: Post | null;
}

export function BookmarkDrawer({ open, onClose, targetPost }: BookmarkDrawerProps) {
  const { locale, readingLists, readingListItems, createReadingList, toggleSavedToReadingList } = useApp();
  const t = DICTIONARY[locale];
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleToggleItem = (listId: string) => {
    if (!targetPost) return;
    toggleSavedToReadingList(listId, targetPost.id);
    const isSaved = readingListItems.some(i => i.list_id === listId && i.post_id === targetPost.id);
    setToastMsg(isSaved ? 'Removed from reading list' : 'Saved to reading list!');
  };

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const created = createReadingList(newListName.trim());
    if (targetPost) {
      toggleSavedToReadingList(created.id, targetPost.id);
    }
    setNewListName('');
    setIsCreating(false);
    setToastMsg('Created new list and saved article!');
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 400 }, p: 3, background: '#FDFBF7' } } }}
    >
      <Box className="flex items-center justify-between pb-4 border-b border-cream-200">
        <div className="flex items-center gap-2">
          <BookmarkIcon sx={{ color: '#C88A79' }} />
          <Typography variant="h6" className="font-serif font-bold text-earth-800">
            {t.lists.title}
          </Typography>
        </div>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {targetPost && (
        <Box className="my-4 p-3 bg-white rounded-xl border border-cream-200 flex items-center gap-3">
          <img src={targetPost.cover_image_url || ''} alt="" className="w-14 h-14 rounded-lg object-cover" />
          <div className="overflow-hidden">
            <Typography variant="caption" className="text-earth-500 block">
              Article to save:
            </Typography>
            <Typography variant="body2" className="font-serif font-semibold text-earth-900 truncate">
              {targetPost.title_en}
            </Typography>
          </div>
        </Box>
      )}

      <Box className="flex-1 overflow-y-auto my-4">
        <List className="p-0">
          {readingLists.map(list => {
            const isSaved = targetPost ? readingListItems.some(i => i.list_id === list.id && i.post_id === targetPost.id) : false;
            const itemCount = readingListItems.filter(i => i.list_id === list.id).length;

            return (
              <ListItem key={list.id} className="p-0 mb-2">
                <motion.div whileHover={{ scale: 1.01 }} className="w-full">
                  <div
                    onClick={() => handleToggleItem(list.id)}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
                      isSaved ? 'bg-amber-50/60 border-terracotta-400' : 'bg-white border-cream-200 hover:border-terracotta-200'
                    }`}
                  >
                    <div>
                      <Typography variant="body1" className="font-serif font-medium text-earth-900">
                        {list.name}
                      </Typography>
                      <Typography variant="caption" className="text-earth-500">
                        {itemCount} articles
                      </Typography>
                    </div>
                    {targetPost && <Checkbox checked={isSaved} sx={{ color: '#C88A79', '&.Mui-checked': { color: '#C88A79' } }} />}
                  </div>
                </motion.div>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Divider className="my-2" />

      {isCreating ? (
        <form onSubmit={handleCreateList} className="mt-2 space-y-3">
          <TextField
            fullWidth
            size="small"
            label={t.lists.listName}
            value={newListName}
            onChange={e => setNewListName(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <Button fullWidth variant="contained" size="small" type="submit" sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' } }}>
              Save
            </Button>
            <Button fullWidth variant="outlined" size="small" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          fullWidth
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setIsCreating(true)}
          sx={{ borderColor: '#C88A79', color: '#C88A79', '&:hover': { borderColor: '#A66E5E', bgcolor: 'rgba(200,138,121,0.05)' } }}
        >
          {t.lists.createList}
        </Button>
      )}

      <Snackbar open={Boolean(toastMsg)} autoHideDuration={3000} onClose={() => setToastMsg('')}>
        <Alert severity="success" sx={{ width: '100%' }}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </Drawer>
  );
}
