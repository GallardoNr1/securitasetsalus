/**
 * Seed de datos de desarrollo (idempotente).
 *
 * Crea un curso demo con:
 *  - 1 instructor (`instructor.demo@securitasetsalus.cl` / Instructor123!)
 *  - 1 curso PUBLISHED ("Aperturas Básicas — Demo") con 3 sesiones
 *  - 4 alumnos verificados (`alumno1..4.demo@securitasetsalus.cl` / Alumno123!)
 *  - 4 enrollments con status CONFIRMED — listos para pasar lista
 *
 * Pensado para probar el flujo de Fase 5a sin tener Stripe operativo.
 *
 * Ejecutar: `npm run prisma:seed:dev`
 *
 * Re-ejecutarlo no duplica nada — todos los upserts son por email/slug.
 */

import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL no está definida.');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const COURSE_SLUG = 'aperturas-basicas-demo';

const STUDENTS = [
  { email: 'alumno1.demo@securitasetsalus.cl', name: 'Carla Pérez' },
  { email: 'alumno2.demo@securitasetsalus.cl', name: 'Diego Soto' },
  { email: 'alumno3.demo@securitasetsalus.cl', name: 'Marcela Rojas' },
  { email: 'alumno4.demo@securitasetsalus.cl', name: 'Joaquín Valdés' },
];

async function main() {
  // 1. Instructor demo
  const instructorPassword = await bcrypt.hash('Instructor123!', 12);
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor.demo@securitasetsalus.cl' },
    update: { passwordHash: instructorPassword, role: 'INSTRUCTOR' },
    create: {
      email: 'instructor.demo@securitasetsalus.cl',
      name: 'Roberto Demo',
      passwordHash: instructorPassword,
      role: 'INSTRUCTOR',
      region: 'CL',
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`✅ Instructor: ${instructor.email}`);

  // 2. Curso demo con 3 sesiones (próxima semana, mismo horario)
  // Calculamos las fechas dinámicamente desde "hoy" para que las sesiones
  // siempre caigan en el futuro inmediato.
  const today = new Date();
  today.setHours(10, 0, 0, 0);
  const session1Start = new Date(today);
  session1Start.setDate(session1Start.getDate() + 7);
  const session1End = new Date(session1Start);
  session1End.setHours(14, 0, 0, 0);

  const session2Start = new Date(session1Start);
  session2Start.setDate(session2Start.getDate() + 1);
  const session2End = new Date(session2Start);
  session2End.setHours(14, 0, 0, 0);

  const session3Start = new Date(session1Start);
  session3Start.setDate(session3Start.getDate() + 2);
  const session3End = new Date(session3Start);
  session3End.setHours(14, 0, 0, 0);

  const course = await prisma.course.upsert({
    where: { slug: COURSE_SLUG },
    update: {
      instructorId: instructor.id,
      status: 'PUBLISHED',
    },
    create: {
      title: 'Aperturas Básicas — Demo',
      slug: COURSE_SLUG,
      shortDescription: 'Curso demo para probar el flujo de asistencia (Fase 5a).',
      fullSyllabus:
        '## Contenido\n\n1. Identificación de cerraduras residenciales.\n2. Apertura básica con ganzúas.\n3. Apertura con bumping y técnicas de impresión.\n\nEste es un curso de prueba interno — no aparece en producción real.',
      durationHours: 12,
      price: 250000,
      currency: 'CLP',
      capacity: 10,
      region: 'CL',
      subdivision: 'RM',
      venueName: 'Sede Demo SES',
      venueAddress: 'Av. Ejemplo 123, Santiago',
      status: 'PUBLISHED',
      hasEvaluation: true,
      senceEligible: false,
      claveroSkillCode: 'AB',
      includedKit:
        'Set básico de ganzúas + tensor + manual impreso. Se entrega al inicio del curso.',
      instructorId: instructor.id,
      publishedAt: new Date(),
    },
  });
  console.log(`✅ Curso: ${course.title} (slug=${course.slug})`);

  // Sesiones — borramos las anteriores y recreamos para que las fechas siempre
  // estén "next week" relativo a hoy, sin dejar sesiones huérfanas viejas.
  await prisma.courseSession.deleteMany({ where: { courseId: course.id } });
  await prisma.courseSession.createMany({
    data: [
      { courseId: course.id, sessionNumber: 1, startsAt: session1Start, endsAt: session1End },
      { courseId: course.id, sessionNumber: 2, startsAt: session2Start, endsAt: session2End },
      { courseId: course.id, sessionNumber: 3, startsAt: session3Start, endsAt: session3End },
    ],
  });
  console.log(`✅ 3 sesiones creadas (${session1Start.toLocaleDateString('es-CL')} – ${session3Start.toLocaleDateString('es-CL')})`);

  // 3. Alumnos demo
  const studentPassword = await bcrypt.hash('Alumno123!', 12);
  const students = await Promise.all(
    STUDENTS.map((s) =>
      prisma.user.upsert({
        where: { email: s.email },
        update: { passwordHash: studentPassword, role: 'STUDENT' },
        create: {
          email: s.email,
          name: s.name,
          passwordHash: studentPassword,
          role: 'STUDENT',
          region: 'CL',
          emailVerifiedAt: new Date(),
        },
      }),
    ),
  );
  console.log(`✅ ${students.length} alumnos demo`);

  // 4. Enrollments CONFIRMED (idempotente vía la unique [userId, courseId]).
  for (const student of students) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: student.id, courseId: course.id } },
      update: { status: 'CONFIRMED' },
      create: {
        userId: student.id,
        courseId: course.id,
        status: 'CONFIRMED',
        paidAt: new Date(),
      },
    });
  }
  console.log(`✅ ${students.length} enrollments CONFIRMED`);

  console.log('\n🎉 Datos demo listos para probar /instructor/courses.');
  console.log('\nCredenciales demo:');
  console.log('  Instructor → instructor.demo@securitasetsalus.cl / Instructor123!');
  console.log('  Alumnos    → alumno1..4.demo@securitasetsalus.cl / Alumno123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
