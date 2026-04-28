import type { MetadataRoute } from 'next';
import { MOCK_COURSES } from '@/lib/mock/courses';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ses.agsint.cl';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${SITE_URL}/cursos`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/verify`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const courseRoutes: MetadataRoute.Sitemap = MOCK_COURSES.map((course) => ({
    url: `${SITE_URL}/cursos/${course.slug}`,
    lastModified: course.publishedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...courseRoutes];
}
