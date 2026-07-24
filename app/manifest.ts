import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Azphur Power Platform',
    short_name: 'Azphur',
    description: 'Azphur Solar & Power Management Platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/launchericon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/launchericon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}