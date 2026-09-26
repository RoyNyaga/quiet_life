'use client';

import { useState, useEffect } from 'react';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Avatar, Box } from '@mui/material';
import { DICTIONARY } from '@/lib/i18n';
import { useApp } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database';

export default function AdminUsersPage() {
  const { user, locale } = useApp();
  const t = DICTIONARY[locale]?.admin || DICTIONARY.en.admin;
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    const supabase = createClient();
    if (supabase) {
      supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setProfiles(data);
          }
        });
    }
  }, []);

  // Use fetched profiles or the currently active user
  const displayUsers = profiles.length > 0
    ? profiles
    : user
      ? [user]
      : [
          {
            id: 'admin-nyaga',
            full_name: 'Andre Roy Nyaga',
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            role: 'admin' as const,
            onboarding_completed: true,
            created_at: '2026-09-03T00:00:00Z',
            updated_at: '2026-09-03T00:00:00Z',
          },
        ];

  return (
    <div className="space-y-6">
      <div>
        <Typography variant="h4" className="font-serif font-bold text-earth-900 text-xl sm:text-2xl md:text-3xl leading-snug">
          {t.users}
        </Typography>
        <Typography variant="body2" className="text-earth-600">
          {t.usersDesc}
        </Typography>
      </div>

      <Box className="p-6 rounded-3xl bg-white border border-cream-200 shadow-sm">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="font-bold">{t.user}</TableCell>
                <TableCell className="font-bold">{t.role}</TableCell>
                <TableCell className="font-bold">{t.onboarding}</TableCell>
                <TableCell className="font-bold">{t.joinedDate}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayUsers.map(usr => (
                <TableRow key={usr.id} hover>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar src={usr.avatar_url || undefined} sx={{ bgcolor: '#C88A79', width: 36, height: 36 }}>
                        {usr.full_name?.charAt(0) || 'U'}
                      </Avatar>
                      <div>
                        <Typography variant="subtitle2" className="font-serif font-bold text-earth-900">
                          {usr.full_name}
                        </Typography>
                        <Typography variant="caption" className="text-earth-500">
                          {usr.id}
                        </Typography>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={usr.role === 'admin' ? t.adminRole : t.userRole}
                      size="small"
                      sx={{
                        bgcolor: usr.role === 'admin' ? 'rgba(200,138,121,0.15)' : 'rgba(116,157,129,0.15)',
                        color: usr.role === 'admin' ? '#A66E5E' : '#587C64',
                        fontWeight: 700,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={usr.onboarding_completed ? t.completed : t.pending}
                      size="small"
                      color={usr.onboarding_completed ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{new Date(usr.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </div>
  );
}
