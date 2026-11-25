import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NEC ASoE Exam Prep — Software Engineering MCQ Simulator',
    short_name: 'NEC Prep',
    description:
      'Complete Nepal Engineering Council Software Engineering (ASoE) exam app with 3,180 MCQs, 30 Mock Sets, 20 Practice Sets, and offline support.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0d1846',
    theme_color: '#0d1846',
    categories: ['education', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/logo.webp',
        sizes: '1024x1024',
        type: 'image/webp',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Mock & Practice Sets',
        short_name: 'Sets',
        url: '/sets',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Chapter Exam Builder',
        short_name: 'Builder',
        url: '/generator',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Exam Results',
        short_name: 'Results',
        url: '/results',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  };
}
