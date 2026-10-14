'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Drawer, Typography, IconButton, Button, TextField, Checkbox, List, ListItem, Divider, Box, Snackbar, Alert, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { motion } from 'framer-motion';
import { useApp } from '@/lib/store';
import {
  useReadingLists,
  useReadingListItems,
  useCreateReadingList,
  useToggleReadingListItem,
} from '@/features/readingLists';
import { Post } from '@/types/database';
import { DICTIONARY, getLocalizedField } from '@/lib/i18n';

interface BookmarkDrawerProps {
  open: boolean;
  onClose: () => void;
  targetPost?: Post | null;
}

export function BookmarkDrawer({ open, onClose, targetPost }: BookmarkDrawerProps) {
  const router = useRouter();
  const { locale, user } = useApp();
  const { data: readingLists = [] } = useReadingLists(user?.id);
  const { data: readingListItems = [] } = useReadingListItems(user?.id);
  const createListMutation = useCreateReadingList(user?.id);
  const toggleItemMutation = useToggleReadingListItem(user?.id);
  const t = DICTIONARY[locale];
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Unauthenticated users cannot view or interact with the reading list drawer
  if (!user) {
    return null;
  }

  const handleToggleItem = (listId: string) => {
    if (!targetPost) return;
    const isSaved = readingListItems.some(i => i.list_id === listId && i.post_id === targetPost.id);
    toggleItemMutation.mutate({ listId, postId: targetPost.id, isSaved });
    setToastMsg(isSaved ? t.lists.removedToast : t.lists.savedToast);
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const name = newListName.trim();
    setIsCreating(true);
    try {
      const created = await createListMutation.mutateAsync({ name, is_private: true });
      if (targetPost && created) {
        toggleItemMutation.mutate({ listId: created.id, postId: targetPost.id, isSaved: false });
      }
      setNewListName('');
    } finally {
      setIsCreating(false);
    }
  };

  const handleNavigateToList = (listId: string) => {
    onClose();
    router.push(`/${locale}/reading-lists/${listId}`);
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
              {t.lists.articleToSave}
            </Typography>
            <Typography variant="body2" className="font-serif font-semibold text-earth-900 truncate">
              {getLocalizedField(targetPost, 'title', locale)}
            </Typography>
          </div>
        </Box>
      )}

      <Box className="flex-1 overflow-y-auto my-4">
        {readingLists.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Typography variant="body2" className="text-earth-500 italic mb-2">
              {t.lists.empty}
            </Typography>
            <Typography variant="caption" className="text-earth-400 block">
              {locale === 'fr' ? 'Créez votre première collection ci-dessous.' : 'Create your first mindful collection below.'}
            </Typography>
          </div>
        ) : (
          <List className="p-0">
            {readingLists.map(list => {
              const isSaved = targetPost ? readingListItems.some(i => i.list_id === list.id && i.post_id === targetPost.id) : false;
              const itemCount = readingListItems.filter(i => i.list_id === list.id).length;

              return (
                <ListItem key={list.id} className="p-0 mb-2">
                  <motion.div whileHover={{ scale: 1.01 }} className="w-full">
                    <div
                      onClick={() => {
                        if (targetPost) {
                          handleToggleItem(list.id);
                        } else {
                          handleNavigateToList(list.id);
                        }
                      }}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
                        isSaved ? 'bg-amber-50/60 border-terracotta-400' : 'bg-white border-cream-200 hover:border-terracotta-200'
                      }`}
                    >
                      <div className="flex-1 mr-2 overflow-hidden">
                        <Typography variant="body1" className="font-serif font-medium text-earth-900 truncate">
                          {list.name}
                        </Typography>
                        <Typography variant="caption" className="text-earth-500">
                          {itemCount} {t.lists.articlesCount}
                        </Typography>
                      </div>

                      {targetPost ? (
                        <div className="flex items-center gap-1">
                          <Tooltip title={locale === 'fr' ? 'Voir la collection' : 'View collection'}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigateToList(list.id);
                              }}
                              sx={{ color: '#8C776D', '&:hover': { color: '#C88A79' } }}
                            >
                              <OpenInNewRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Checkbox checked={isSaved} sx={{ color: '#C88A79', '&.Mui-checked': { color: '#C88A79' } }} />
                        </div>
                      ) : (
                        <ArrowForwardRoundedIcon sx={{ color: '#C88A79', fontSize: 20 }} />
                      )}
                    </div>
                  </motion.div>
                </ListItem>
              );
            })}
          </List>
        )}
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
              {t.lists.save}
            </Button>
            <Button fullWidth variant="outlined" size="small" onClick={() => setIsCreating(false)}>
              {t.lists.cancel}
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
