import React from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <head>
        <title>AZPHUR PLATFORM</title>
      </head>
      <body style={{ 
        margin: 0, 
        backgroundColor: '#050505', 
        color: 'white', 
        fontFamily: 'sans-serif' 
      }}>
        {children}
      </body>
    </html>
  );
}