import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

const SITE_URL = env.NEXT_PUBLIC_APP_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Bloqueamos áreas privadas y verificaciones individuales (las
        // /verify/[code] no se indexan: cada código es público pero no
        // queremos que aparezcan en buscadores).
        disallow: ['/dashboard', '/admin', '/instructor', '/api/', '/verify/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
