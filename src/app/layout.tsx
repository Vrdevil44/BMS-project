import './globals.css';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'] });

const SITE_URL = 'https://vrdevil44.github.io/BMS-project/';
const OG_IMAGE = `${SITE_URL}og-image.png`;
const DESCRIPTION =
  'A small-business invoicing app: customers, invoices with line items, a live revenue dashboard, and PDF export. Fully client-side demo — your data stays in your browser.';

export const metadata = {
  title: 'BMS — Business Management System',
  description: DESCRIPTION,
  openGraph: {
    title: 'BMS — Business Management System',
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: 'BMS',
    type: 'website',
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BMS — Business Management System',
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <div className="font-sans bg-gray-100 text-gray-800 min-h-screen">
      {children}
    </div>
  );
}

export default RootLayout;
