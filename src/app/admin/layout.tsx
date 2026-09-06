'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, Button } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArticleIcon from '@mui/icons-material/Article';
import CategoryIcon from '@mui/icons-material/Category';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PeopleIcon from '@mui/icons-material/People';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SpaIcon from '@mui/icons-material/Spa';
import { useApp } from '@/lib/store';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useApp();

  // Protect Admin section
  if (!user || user.role !== 'admin') {
    return (
      <Box className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#FDFBF7]">
        <Typography variant="h4" className="font-serif font-bold text-earth-900 mb-2">
          Access Restricted
        </Typography>
        <Typography variant="body1" className="text-earth-600 mb-6 max-w-md">
          You must be logged in as an Administrator to access the Quiet Life Admin Portal.
        </Typography>
        <Button variant="contained" onClick={() => router.push('/')} sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' } }}>
          Return to Quiet Life Home
        </Button>
      </Box>
    );
  }

  const adminMenu = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <DashboardIcon /> },
    { label: 'Posts Management', href: '/admin/posts', icon: <ArticleIcon /> },
    { label: 'Categories', href: '/admin/categories', icon: <CategoryIcon /> },
    { label: 'Tags', href: '/admin/tags', icon: <LocalOfferIcon /> },
    { label: 'Users', href: '/admin/users', icon: <PeopleIcon /> },
    { label: 'Subscribers', href: '/admin/subscribers', icon: <MarkEmailReadIcon /> },
  ];

  return (
    <div className="min-h-screen bg-[#F8F5EE] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-cream-200 hidden md:flex flex-col justify-between p-4 sticky top-0 h-screen">
        <div className="space-y-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2 px-3 py-2 text-earth-900">
            <div className="w-9 h-9 rounded-xl bg-sage-100 flex items-center justify-center text-sage-700">
              <SpaIcon />
            </div>
            <div>
              <Typography variant="subtitle1" className="font-serif font-bold text-earth-900 leading-none">
                Quiet Life
              </Typography>
              <Typography variant="caption" className="text-sage-700 font-bold uppercase tracking-wider text-[10px]">
                Admin Portal
              </Typography>
            </div>
          </Link>

          <List className="space-y-1 p-0">
            {adminMenu.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <ListItem key={item.href} disablePadding>
                  <ListItemButton
                    component={Link}
                    href={item.href}
                    sx={{
                      borderRadius: 3,
                      bgcolor: isActive ? 'rgba(116,157,129,0.15)' : 'transparent',
                      color: isActive ? '#587C64' : '#5C4438',
                      fontWeight: isActive ? 700 : 500,
                      '&:hover': { bgcolor: 'rgba(116,157,129,0.1)' },
                    }}
                  >
                    <ListItemIcon sx={{ color: isActive ? '#587C64' : '#8C7A70', minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.label} slotProps={{ primary: { className: 'text-sm font-medium' } }} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </div>

        <div className="pt-4 border-t border-cream-200 space-y-3">
          <Link href="/">
            <Button fullWidth size="small" startIcon={<ArrowBackIcon />} sx={{ color: '#5C4438' }}>
              Back to Public Site
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
