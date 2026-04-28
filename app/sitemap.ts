import type { MetadataRoute } from 'next';
import { listPublishedCourses } from '@/lib/queries/courses';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ses.agsint.cl';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${SITE_URL}/cursos`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/verify`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Cursos publicados desde BD. En entornos sin DATABASE_URL configurada
  // fallamos silenciosamente a la lista vacía — el sitemap sigue válido.
  let courseRoutes: MetadataRoute.Sitemap = [];
  try {
    const courses = await listPublishedCourses();
    courseRoutes = courses.map((course) => ({
      url: `${SITE_URL}/cursos/${course.slug}`,
      lastModified: course.publishedAt ?? course.createdAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  } catch (err) {
    console.warn('[sitemap] no se pudieron cargar cursos de BD', err);
  }

  return [...staticRoutes, ...courseRoutes];
}
