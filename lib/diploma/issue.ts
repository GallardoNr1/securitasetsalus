import pLimit from 'p-limit';
import { db } from '@/lib/db';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { uploadBuffer, r2Keys, isBucketConfigured } from '@/lib/r2';
import { sendDiplomaIssuedEmail } from '@/lib/email/send';
import { generateDiplomaCode } from './code';
import { renderDiplomaPdf } from './pdf';

/**
 * Emite el diploma de un Enrollment que cumple los requisitos:
 *  - Enrollment.status === 'COMPLETED'
 *  - Course.hasEvaluation === true → Evaluation.passed === true
 *
 * Idempotente: si ya existe Diploma para ese Enrollment, lo devuelve sin
 * regenerar PDF ni enviar email duplicado. Esto permite que un instructor
 * pulse "Emitir diplomas" varias veces sin spam.
 *
 * Si R2 no está configurado, salta la subida del PDF (el Diploma se crea
 * con pdfKey=null y luego se regenera cuando se acceda). Esto mantiene
 * compatibilidad con entornos sin storage.
 *
 * Devuelve el Diploma creado/existente.
 */

type IssueResult =
  | { ok: true; diploma: { id: string; code: string }; alreadyExisted: boolean }
  | { ok: false; reason: 'enrollment-not-found' | 'not-eligible' | 'pdf-generation-failed' };

export async function issueDiplomaForEnrollment(enrollmentId: string): Promise<IssueResult> {
  const enrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      course: {
        select: {
          id: true,
          title: true,
          durationHours: true,
          venueName: true,
          hasEvaluation: true,
          instructor: { select: { name: true } },
        },
      },
      evaluation: { select: { finalGrade: true, passed: true } },
      diploma: { select: { id: true, code: true, pdfKey: true } },
    },
  });

  if (!enrollment) {
    return { ok: false, reason: 'enrollment-not-found' };
  }

  // Idempotencia: si ya existe diploma, devolverlo sin regenerar.
  if (enrollment.diploma) {
    return {
      ok: true,
      diploma: { id: enrollment.diploma.id, code: enrollment.diploma.code },
      alreadyExisted: true,
    };
  }

  // Verificar elegibilidad.
  if (enrollment.status !== 'COMPLETED') {
    return { ok: false, reason: 'not-eligible' };
  }
  if (enrollment.course.hasEvaluation && enrollment.evaluation?.passed !== true) {
    return { ok: false, reason: 'not-eligible' };
  }

  // Generar código único (con un retry simple por si chocara).
  let code = generateDiplomaCode();
  for (let i = 0; i < 3; i++) {
    const existing = await db.diploma.findUnique({ where: { code } });
    if (!existing) break;
    code = generateDiplomaCode();
  }

  // Generar PDF + subir a R2 (si está configurado). Si falla la generación
  // no creamos el Diploma — preferimos abortar a tener un registro huérfano.
  let pdfKey: string | null = null;
  if (isBucketConfigured('diplomas')) {
    try {
      const verifyUrl = `${env.NEXT_PUBLIC_APP_URL}/verify/${code}`;
      const pdfBuffer = await renderDiplomaPdf({
        studentName: enrollment.user.name ?? enrollment.user.email,
        courseTitle: enrollment.course.title,
        durationHours: enrollment.course.durationHours,
        finalGrade: enrollment.evaluation?.finalGrade ?? null,
        issuedAt: new Date(),
        code,
        verifyUrl,
        instructorName: enrollment.course.instructor.name ?? 'Instructor',
        venueName: enrollment.course.venueName,
      });
      pdfKey = r2Keys.diplomaPdf(enrollment.user.id, code);
      await uploadBuffer('diplomas', pdfKey, pdfBuffer, 'application/pdf');
    } catch (err) {
      logger.error('diploma issue: generación de PDF falló', err, {
        tags: { feature: 'diploma-issue', step: 'pdf-render' },
        enrollmentId,
      });
      return { ok: false, reason: 'pdf-generation-failed' };
    }
  }

  // Crear el Diploma en BD.
  const diploma = await db.diploma.create({
    data: {
      code,
      userId: enrollment.user.id,
      courseId: enrollment.course.id,
      enrollmentId: enrollment.id,
      pdfKey,
    },
    select: { id: true, code: true },
  });

  // Email best-effort — si falla, el diploma queda emitido igual y el
  // alumno puede acceder desde /my-courses.
  try {
    await sendDiplomaIssuedEmail({
      to: enrollment.user.email,
      name: enrollment.user.name ?? enrollment.user.email,
      courseTitle: enrollment.course.title,
      diplomaCode: code,
    });
  } catch (err) {
    logger.error('diploma issue: email DiplomaIssued no enviado (best-effort)', err, {
      tags: { feature: 'diploma-issue', step: 'email' },
      enrollmentId,
      diplomaCode: code,
    });
  }

  return { ok: true, diploma, alreadyExisted: false };
}

/**
 * Emite diplomas de todos los enrollments del curso que cumplan los
 * requisitos. Devuelve resumen con counters.
 *
 * Paraleliza con concurrencia 5 (Resend tiene rate limit de 10 req/s
 * en plan gratuito, R2 sin límite notable, render PDF es CPU local).
 * Para 12 alumnos: ~12s en serie → ~3s en paralelo.
 */
export async function issueDiplomasForCourse(courseId: string): Promise<{
  issued: number;
  alreadyHad: number;
  notEligible: number;
  failed: number;
}> {
  const enrollments = await db.enrollment.findMany({
    where: {
      courseId,
      status: 'COMPLETED',
      diploma: null, // optimización: solo procesamos los que no tienen diploma
    },
    select: { id: true },
  });

  const limit = pLimit(5);
  const results = await Promise.all(
    enrollments.map((e) => limit(() => issueDiplomaForEnrollment(e.id))),
  );

  let issued = 0;
  let alreadyHad = 0;
  let notEligible = 0;
  let failed = 0;

  for (const r of results) {
    if (r.ok) {
      if (r.alreadyExisted) alreadyHad++;
      else issued++;
    } else {
      if (r.reason === 'not-eligible') notEligible++;
      else failed++;
    }
  }

  return { issued, alreadyHad, notEligible, failed };
}
