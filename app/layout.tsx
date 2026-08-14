import React from 'react';
import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#050505',
};

export const metadata: Metadata = {
  title: 'AZPHUR INC. | Global Energy & Infrastructure Exchange',
  description: 'AZPHUR is the advanced transactional platform connecting global B2B markets. We specialize in solar installation projects, EV mobility networks, electric vehicle charging infrastructure, and secure enterprise supply chain logistics across international nodes.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AZPHUR INC.',
  },
  openGraph: {
    title: 'AZPHUR INC. | Global Energy & Infrastructure Exchange',
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
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          .quad-card-premium {
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          .quad-card-premium:hover, 
          .quad-card-premium:active {
            border-color: #38bdf8 !important;
            box-shadow: 0 0 30px rgba(56, 189, 248, 0.75), inset 0 0 20px rgba(56, 189, 248, 0.3) !important;
            transform: translateY(-3px);
          }
          .quad-card-premium.card-m5:hover, 
          .quad-card-premium.card-m5:active {
            border-color: #60a5fa !important;
            box-shadow: 0 0 30px rgba(96, 165, 250, 0.75), inset 0 0 20px rgba(96, 165, 250, 0.3) !important;
          }
          .quad-card-premium.card-driver:hover, 
          .quad-card-premium.card-driver:active {
            border-color: #34d399 !important;
            box-shadow: 0 0 30px rgba(52, 211, 153, 0.75), inset 0 0 20px rgba(52, 211, 153, 0.3) !important;
          }
          .quad-card-premium:hover h3, 
          .quad-card-premium:active h3 {
            text-shadow: 0 0 18px rgba(255, 255, 255, 0.95), 0 2px 10px rgba(0,0,0,0.95) !important;
          }
        `}} />
      </head>
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