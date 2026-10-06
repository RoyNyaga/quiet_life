'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Typography, TextField, Button, Snackbar, Alert } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useApp } from '@/lib/store';
import { getLocalizedField, DICTIONARY } from '@/lib/i18n';

export function Footer() {
  const { locale, categories, subscribeNewsletter } = useApp();
  const t = DICTIONARY[locale];
  const [email, setEmail] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    const ok = subscribeNewsletter(email.trim());
    if (ok) {
      setToastMsg('Thank you for subscribing to Quiet Life!');
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#FAF7F2] border-t border-cream-200 mt-20 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand Column */}
        <div className="md:col-span-1 space-y-4">
          <Link href={`/${locale}`} className="flex items-center gap-2.5 text-earth-900 group inline-flex">
            <div className="w-9 h-9 rounded-xl bg-white/80 border border-cream-200 flex items-center justify-center p-1 shadow-xs transition-transform duration-200 group-hover:scale-105">
              <Image
                src="/logo-icon.png"
                alt="Quiet Life Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="font-sans font-bold text-lg tracking-tight leading-none flex items-center gap-1">
                <span className="text-[#A87462]">Quiet</span>
                <span className="text-[#60866E]">Life</span>
              </div>
              <Typography variant="caption" className="font-sans text-earth-500 text-[9px] tracking-widest uppercase block mt-0.5">
                Mindful Living
              </Typography>
            </div>
          </Link>
          <Typography variant="body2" className="text-earth-600 leading-relaxed">
            A serene space dedicated to mindfulness, health, personal development, motivation, and conscious quality of life.
          </Typography>
        </div>

        {/* Quick Links */}
        <div>
          <Typography variant="subtitle1" className="font-serif font-bold text-earth-900 mb-3">
            Navigation
          </Typography>
          <ul className="space-y-2 text-sm text-earth-700">
            <li>
              <Link href="/" className="hover:text-terracotta-600 transition-colors">
                {t.nav.home}
              </Link>
            </li>
            <li>
              <Link href="/articles" className="hover:text-terracotta-600 transition-colors">
                {t.nav.articles}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-terracotta-600 transition-colors">
                {t.nav.contact}
              </Link>
            </li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <Typography variant="subtitle1" className="font-serif font-bold text-earth-900 mb-3">
            Topics
          </Typography>
          <ul className="space-y-2 text-sm text-earth-700">
            {categories.slice(0, 4).map(cat => (
              <li key={cat.id}>
                <Link href={`/articles?category=${cat.slug}`} className="hover:text-terracotta-600 transition-colors">
                  {getLocalizedField(cat, 'name', locale)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter Column */}
        <div className="space-y-3">
          <Typography variant="subtitle1" className="font-serif font-bold text-earth-900">
            {t.home.subscribeTitle}
          </Typography>
          <Typography variant="caption" className="text-earth-600 block leading-normal">
            {t.home.subscribeSubtitle}
          </Typography>
          <form onSubmit={handleSubscribe} className="space-y-2">
            <TextField
              fullWidth
              size="small"
              placeholder={t.home.emailPlaceholder}
              value={email}
              onChange={e => setEmail(e.target.value)}
              sx={{ bgcolor: '#FFFFFF', borderRadius: 2 }}
            />
            <Button fullWidth variant="contained" type="submit" endIcon={<SendIcon />} sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' } }}>
              {t.home.subscribeButton}
            </Button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-12 pt-6 border-t border-cream-200 text-center text-xs text-earth-500">
        &copy; {new Date().getFullYear()} Quiet Life. All rights reserved. Mindful Living Platform.
      </div>

      <Snackbar open={Boolean(toastMsg)} autoHideDuration={4000} onClose={() => setToastMsg('')}>
        <Alert severity="success" sx={{ width: '100%' }}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </footer>
  );
}
