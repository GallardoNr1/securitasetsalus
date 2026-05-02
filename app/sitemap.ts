import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { listPublishedCourses } from '@/lib/queries/courses';

const SITE_URL = env.NEXT_PUBLIC_APP_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${SITE_URL}/courses`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/verify`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/legal/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/legal/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  // Cursos publicados desde BD. Si la BD falla (ej. en build sin
  // DATABASE_URL), seguimos sirviendo el sitemap estático.
  let courseRoutes: MetadataRoute.Sitemap = [];
  try {
    const courses = await listPublishedCourses();
    courseRoutes = courses.map((course) => ({
      url: `${SITE_URL}/courses/${course.slug}`,
      lastModified: course.publishedAt ?? course.createdAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  } catch (err) {
    logger.warn('sitemap: no se pudieron cargar cursos de BD', { err });
  }

  return [...staticRoutes, ...courseRoutes];
}
