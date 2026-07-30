import React from 'react';
import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#050505',
};

export const metadata: Metadata = {
  title: 'AZPHUR PLATFORM',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AZPHUR',
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