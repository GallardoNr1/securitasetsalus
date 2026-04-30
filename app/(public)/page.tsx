import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { CourseCard } from '@/components/features/CourseCard';
import { FloatingHeader } from '@/components/features/FloatingHeader';
import { listPublishedCourses } from '@/lib/queries/courses';
import styles from './page.module.scss';

export default async function HomePage() {
  const allPublished = await listPublishedCourses();
  const featuredCourses = allPublished.slice(0, 3);
  const nextCourse = featuredCourses[0];

  // Datos para la card "Próximo curso" del hero. Si no hay cursos
  // publicados, dejamos un placeholder neutral.
  const nextSession = nextCourse?.sessions[0];
  const nextSessionDates = nextSession
    ? buildShortDates(nextSession.startsAt)
    : { day1: '—', day2: '—', day3: '—', month: '' };

  return (
    <>
      <FloatingHeader />

      <main>
        {/* ---------- Hero v3 ---------- */}
        <section className={styles.hero}>
          {/* Patrón de cuadrícula sutil de fondo */}
          <svg className={styles.heroGrid} aria-hidden>
            <defs>
              <pattern
                id="herogrid"
                width={48}
                height={48}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M48 0H0V48"
                  fill="none"
                  stroke="rgba(44,95,74,0.06)"
                  strokeWidth={1}
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#herogrid)" />
          </svg>

          <div className={styles.heroInner}>
            <div className={styles.heroContent}>
              {/* Status pill — cohorte abierta */}
              <div className={styles.statusPill}>
                <span className={styles.statusDot} aria-hidden />
                <span className={styles.statusText}>
                  Cohorte de mayo · cupos abiertos
                </span>
                <span className={styles.statusBadge}>6 / 10</span>
              </div>

              <h1 className={styles.heroTitle}>
                La escuela de
                <br />
                <span className={styles.titleHighlight}>
                  <span className={styles.titleHighlightText}>cerrajería</span>
                  <span className={styles.titleHighlightBg} aria-hidden />
                </span>
                <br />
                <span className={styles.titleItalic}>
                  que se toma en serio el oficio.
                </span>
              </h1>

              <p className={styles.heroLead}>
                Cursos presenciales con cohortes de diez, instructores con
                experiencia real en taller, y un diploma con QR firmado que se
                sostiene fuera del aula.
              </p>

              <div className={styles.heroActions}>
                <Link href="/courses" className={styles.heroPrimary}>
                  Ver cursos disponibles
                  <span className={styles.heroPrimaryIcon} aria-hidden>
                    <ArrowIcon />
                  </span>
                </Link>
                <Link href="/verify" className={styles.heroSecondary}>
                  <QrIcon />
                  Verificar diploma
                </Link>
              </div>

              {/* Stats de confianza */}
              <div className={styles.trust}>
                <div className={styles.trustItem}>
                  <span className={styles.trustNumber}>
                    96<span className={styles.trustNumberAccent}>%</span>
                  </span>
                  <span className={styles.trustLabel}>
                    aprobaron al
                    <br />
                    primer intento
                  </span>
                </div>
                <span className={styles.trustDivider} aria-hidden />
                <div className={styles.trustItem}>
                  <span className={styles.trustNumber}>10</span>
                  <span className={styles.trustLabel}>
                    cohortes
                    <br />
                    graduadas
                  </span>
                </div>
                <span className={styles.trustDivider} aria-hidden />
                <div className={styles.trustItem}>
                  <span className={styles.trustNumber}>OTEC</span>
                  <span className={styles.trustLabel}>
                    SENCE — en
                    <br />
                    acreditación
                  </span>
                </div>
              </div>
            </div>

            {/* Lado derecho: sello + tarjetas flotantes */}
            <div className={styles.heroVisual} aria-hidden>
              <div className={styles.heroSealWrap}>
                <Image
                  src="/brand/logo-seal.png"
                  alt=""
                  width={400}
                  height={400}
                  priority
                  className={styles.heroSeal}
                />
              </div>

              {/* Card 1: próximo curso */}
              <div className={styles.floatCard1}>
                <div className={styles.floatCardHeader}>
                  <div className={styles.floatCardIconLight}>
                    <CalendarIcon />
                  </div>
                  <div>
                    <div className={styles.floatCardEyebrow}>Próximo curso</div>
                    <div className={styles.floatCardTitle}>
                      {nextCourse?.title ?? 'Aperturas Básicas'}
                    </div>
                  </div>
                </div>
                <div className={styles.floatCardDays}>
                  <DayPill day={nextSessionDates.day1} month={nextSessionDates.month} />
                  <DayPill day={nextSessionDates.day2} month={nextSessionDates.month} />
                  <DayPill day={nextSessionDates.day3} month={nextSessionDates.month} />
                </div>
              </div>

              {/* Card 2: diploma verificado */}
              <div className={styles.floatCard2}>
                <div className={styles.floatCardHeader}>
                  <div className={styles.floatCardIconDark}>
                    <ShieldIcon />
                  </div>
                  <div>
                    <div className={styles.floatCardEyebrowDark}>
                      Diploma verificado
                    </div>
                    <div className={styles.floatCardTitleDark}>Carla Pérez</div>
                  </div>
                </div>
                <div className={styles.diplomaCode}>SES-7YZS-ESUB</div>
                <div className={styles.diplomaStatus}>✓ Auténtico · ✓ Vigente</div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Cómo funciona (sin tocar) ---------- */}
        <section id="como-funciona" className={styles.section}>
          <div className={styles.sectionInner}>
            <header className={styles.sectionHeader}>
              <span className={styles.eyebrow}>Cómo funciona</span>
              <h2>Tres pasos para certificarte</h2>
              <p>
                Desde la inscripción hasta el diploma. Sin papeleo innecesario, sin
                trámites opacos: solo formación seria que se traduce en un documento
                que vale.
              </p>
            </header>

            <ol className={styles.stepper} aria-label="Pasos para certificarte">
              <li className={styles.step}>
                <div className={styles.stepCircle} aria-hidden>
                  <span className={styles.stepNumber}>1</span>
                </div>
                <h3>Elige tu curso</h3>
                <p>
                  Explora el catálogo con cursos por categoría, sede y fecha.
                  Inscríbete pagando directamente desde la web — sin intermediarios.
                </p>
              </li>
              <li className={styles.step}>
                <div className={styles.stepCircle} aria-hidden>
                  <span className={styles.stepNumber}>2</span>
                </div>
                <h3>Asiste y aprueba</h3>
                <p>
                  Cursos 100% presenciales en sedes acreditadas. Asistencia, examen y
                  evaluación cualitativa son requisitos para obtener el diploma.
                </p>
              </li>
              <li className={styles.step}>
                <div className={styles.stepCircle} aria-hidden>
                  <span className={styles.stepNumber}>3</span>
                </div>
                <h3>Recibe tu diploma verificable</h3>
                <p>
                  Diploma PDF con código único y QR público. Cualquiera puede
                  comprobar su validez. Reconocido por ClaveroCerrajero como input
                  para certificación profesional.
                </p>
              </li>
            </ol>
          </div>
        </section>

        {/* ---------- Cursos destacados ---------- */}
        {featuredCourses.length > 0 ? (
          <section className={styles.sectionAlt}>
            <div className={styles.sectionInner}>
              <header className={styles.sectionHeader}>
                <span className={styles.eyebrow}>Próximos cursos</span>
                <h2>Empieza con uno de estos</h2>
                <p>
                  Nuestros cursos más demandados, con cupos limitados para garantizar
                  atención personalizada del instructor.
                </p>
              </header>

              <div className={styles.coursesGrid}>
                {featuredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>

              <div className={styles.sectionFooter}>
                <Button href="/courses" variant="primary" size="md">
                  Ver todos los cursos
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {/* ---------- Por qué SES — bento ---------- */}
        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <header className={`${styles.sectionHeader} ${styles.bentoHeader}`}>
              <span className={styles.eyebrow}>Por qué SES</span>
              <h2 className={styles.bentoH2}>
                Una escuela seria,
                <br />
                <span className={styles.bentoH2Italic}>no un cursillo cualquiera.</span>
              </h2>
            </header>

            <div className={styles.bento}>
              {/* Card grande — instructor con oficio */}
              <article className={`${styles.bentoCard} ${styles.bentoMain}`}>
                <Image
                  src="/brand/logo-seal.png"
                  alt=""
                  width={320}
                  height={320}
                  aria-hidden
                  className={styles.bentoMainSeal}
                />
                <span className={styles.bentoMainEyebrow}>El instructor que conoces</span>
                <h3 className={styles.bentoMainTitle}>
                  Cada cohorte la enseña alguien que vive del{' '}
                  <span className={styles.bentoMainItalic}>oficio.</span>
                </h3>
                <p className={styles.bentoMainBody}>
                  Mínimo 10 años de taller — cerrajeros en activo, no aulas teóricas.
                  Instructor en franquicia comercial: gente que abre cerraduras toda la
                  semana.
                </p>
              </article>

              {/* QR firmado — top right */}
              <article className={`${styles.bentoCard} ${styles.bentoSmall} ${styles.bentoQr}`}>
                <div className={styles.bentoSmallIcon} aria-hidden>
                  <QrIcon />
                </div>
                <h3 className={styles.bentoSmallTitle}>QR firmado</h3>
                <p className={styles.bentoSmallBody}>
                  Cada diploma con código único, verificable en cualquier dispositivo.
                </p>
              </article>

              {/* Franquicia SENCE — middle right (cream) */}
              <article className={`${styles.bentoCard} ${styles.bentoCream} ${styles.bentoSence}`}>
                <div className={styles.bentoCreamIcon} aria-hidden>
                  <BadgeIcon />
                </div>
                <h3 className={styles.bentoCreamTitle}>Franquicia SENCE</h3>
                <p className={styles.bentoCreamBody}>
                  Cursos elegibles vía OTEC — tu empleador deduce el coste.
                </p>
              </article>

              {/* Cohortes de diez — bottom left */}
              <article className={`${styles.bentoCard} ${styles.bentoSmall} ${styles.bentoCohortes}`}>
                <div className={styles.bentoSmallIcon} aria-hidden>
                  <UsersIcon />
                </div>
                <h3 className={styles.bentoSmallTitle}>Cohortes de diez</h3>
                <p className={styles.bentoSmallBody}>
                  Cupos limitados, atención uno-a-uno garantizada.
                </p>
              </article>

              {/* Mapeo Clavero — bottom wide (dark) */}
              <article className={`${styles.bentoCard} ${styles.bentoDark} ${styles.bentoClavero}`}>
                <div className={styles.bentoDarkIcon} aria-hidden>
                  <MapIcon />
                </div>
                <div className={styles.bentoDarkContent}>
                  <h3 className={styles.bentoDarkTitle}>Mapeo automático a Clavero</h3>
                  <p className={styles.bentoDarkBody}>
                    Cada diploma SES se mapea a una skill del registro Clavero.
                  </p>
                </div>
                <Link href="/courses" className={styles.bentoDarkLink}>
                  Saber más
                  <ArrowIcon />
                </Link>
              </article>
            </div>

            {/* CTA card — próxima cohorte */}
            {nextCourse && nextSession ? (
              <div className={styles.cohorteCta}>
                <Image
                  src="/brand/logo-seal.png"
                  alt=""
                  width={320}
                  height={320}
                  aria-hidden
                  className={styles.cohorteCtaSeal}
                />
                <div className={styles.cohorteCtaLeft}>
                  <span className={styles.cohorteCtaEyebrow}>Próxima cohorte</span>
                  <h3 className={styles.cohorteCtaTitle}>
                    Tu próxima cohorte arranca el{' '}
                    <span className={styles.cohorteCtaItalic}>
                      {formatCohorteDate(nextSession.startsAt)}.
                    </span>
                  </h3>
                  <p className={styles.cohorteCtaBody}>
                    Cohorte de {nextCourse.title}
                    {nextCourse.venueName ? ` en ${nextCourse.venueName}` : ''}, paga con
                    Stripe si vas por tu cuenta o vía SENCE si pagas a través de empresa.
                  </p>
                </div>
                <div className={styles.cohorteCtaRight}>
                  <Link
                    href={{ pathname: `/courses/${nextCourse.slug}` }}
                    className={styles.cohorteCtaPrimary}
                  >
                    Inscríbete a pagar
                    <ArrowIcon />
                  </Link>
                  <Link href="/courses" className={styles.cohorteCtaSecondary}>
                    Ver el catálogo completo
                    <ArrowIcon />
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* ---------- CTA final ---------- */}
        <section className={styles.cta}>
          <div className={styles.ctaInner}>
            <h2>¿Listo para empezar?</h2>
            <p>Explora nuestro catálogo y reserva tu cupo en el próximo curso.</p>
            <Link href="/courses" className={styles.ctaButton}>
              Ver catálogo de cursos
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

// ---------- Helpers ----------

function buildShortDates(d: Date) {
  const day1 = d.getDate();
  const day2 = day1 + 1;
  const day3 = day1 + 2;
  const monthNames = [
    'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
    'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC',
  ];
  return {
    day1: String(day1),
    day2: String(day2),
    day3: String(day3),
    month: monthNames[d.getMonth()] ?? '',
  };
}

// "6 de mayo" — formato corto para el título de la CTA card.
function formatCohorteDate(d: Date) {
  const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  return `${d.getDate()} de ${monthNames[d.getMonth()] ?? ''}`;
}

function DayPill({ day, month }: { day: string; month: string }) {
  return (
    <div className={styles.dayPill}>
      <div className={styles.dayPillDay}>{day}</div>
      <div className={styles.dayPillMonth}>{month}</div>
    </div>
  );
}

// ---------- SVG icons inline ----------

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x={3} y={3} width={7} height={7} />
      <rect x={14} y={3} width={7} height={7} />
      <rect x={3} y={14} width={7} height={7} />
      <path d="M14 14h3v3h-3zM20 14v3M14 20h3" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x={3} y={5} width={18} height={16} rx={2} />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M9 12l2 2 4-5" />
    </svg>
  );
}

function BadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.5 2.5L18 4l1 3.5L21.5 10 20 13l1.5 3-3 1.5L18 20l-3.5-.5L12 22l-2.5-2.5L6 20l-1-3.5L2.5 14 4 11 2.5 8l3-1.5L6 4l3.5.5z" />
      <path d="M9 12l2 2 4-5" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx={9} cy={7} r={4} />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={12} cy={10} r={3} />
      <path d="M12 21s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z" />
    </svg>
  );
}
