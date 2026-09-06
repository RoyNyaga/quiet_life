import { ReactNode } from 'react';
import { Providers } from '@/components/providers/Providers';
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/navigation/Footer';
import { Locale } from '@/types/database';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'fr' }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const currentLocale = (locale === 'fr' ? 'fr' : 'en') as Locale;

  return (
    <Providers initialLocale={currentLocale}>
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </Providers>
  );
}
