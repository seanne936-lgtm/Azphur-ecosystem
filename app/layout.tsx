import React from 'react';
import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#050505',
};

export const metadata: Metadata = {
  title: 'AZPHUR | Global Energy & Infrastructure Exchange',
  description: 'AZPHUR is the advanced transactional platform connecting global B2B markets. We specialize in solar installation projects, EV mobility networks, electric vehicle charging infrastructure, and secure enterprise supply chain logistics across international nodes.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AZPHUR',
  },
  openGraph: {
    title: 'AZPHUR | Global Energy & Infrastructure Exchange',
    description: 'AZPHUR is the advanced transactional platform connecting global B2B markets. We specialize in solar installation projects, EV mobility networks, electric vehicle charging infrastructure, and secure enterprise supply chain logistics across international nodes.',
    url: 'https://azphur.com',
    siteName: 'AZPHUR',
    images: [
      {
        url: 'https://azphur.com/logo-azphur.avif',
        width: 800,
        height: 600,
        alt: 'AZPHUR Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body style={{ 
        margin: 0, 
        padding: 0,
        backgroundColor: '#050505', 
        color: '#ffffff', 
        fontFamily: 'sans-serif',
        boxSizing: 'border-box'
      }}>
        {children}
      </body>
    </html>
  );
}