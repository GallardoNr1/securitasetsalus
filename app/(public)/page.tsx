import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { CourseCard } from '@/components/features/CourseCard';
import { getPublishedCourses } from '@/lib/mock/courses';
import styles from './page.module.scss';

export default function HomePage() {
  const featuredCourses = getPublishedCourses().slice(0, 3);

  return (
    <main>
      {/* ---------- Hero ---------- */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>Escuela de cerrajería profesional</span>
            <h1 className={styles.heroTitle}>
              Formación rigurosa para los <em>profesionales</em> de la cerrajería en Chile
            </h1>
            <p className={styles.heroLead}>
              Cursos presenciales con instructores con experiencia real en el oficio. Diplomas
              verificables por QR y reconocimiento profesional avalado por OTEC SENCE.
            </p>
            <div className={styles.heroActions}>
              <Button href="/cursos" variant="primary" size="lg">
                Ver cursos disponibles
              </Button>
              <Button href="#como-funciona" variant="outline" size="lg">
                Cómo funciona
              </Button>
            </div>
          </div>
          <div className={styles.heroVisual} aria-hidden>
            <Image
              src="/brand/logo-seal.png"
              alt=""
              width={420}
              height={420}
              priority
              className={styles.heroSeal}
            />
          </div>
        </div>
      </section>

      {/* ---------- Cómo funciona ---------- */}
      <section id="como-funciona" className={styles.section}>
        <div className={styles.sectionInner}>
          <header className={styles.sectionHeader}>
            <span className={styles.eyebrow}>Cómo funciona</span>
            <h2>Tres pasos para certificarte</h2>
            <p>
              Desde la inscripción hasta el diploma. Sin papeleo innecesario, sin trámites
              opacos: solo formación seria que se traduce en un documento que vale.
            </p>
          </header>

          <ol className={styles.steps}>
            <li>
              <span className={styles.stepNumber}>01</span>
              <h3>Elige tu curso</h3>
              <p>
                Explora el catálogo con cursos por categoría, sede y fecha. Inscríbete pagando
                directamente desde la web — sin intermediarios.
              </p>
            </li>
            <li>
              <span className={styles.stepNumber}>02</span>
              <h3>Asiste y aprueba</h3>
              <p>
                Cursos 100% presenciales en sedes acreditadas. Asistencia, examen y evaluación
                cualitativa son requisitos para obtener el diploma.
              </p>
            </li>
            <li>
              <span className={styles.stepNumber}>03</span>
              <h3>Recibe tu diploma verificable</h3>
              <p>
                Diploma PDF con código único y QR público. Cualquiera puede comprobar su
                validez. Reconocido por ClaveroCerrajero como input para certificación profesional.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* ---------- Cursos destacados ---------- */}
      <section className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <header className={styles.sectionHeader}>
            <span className={styles.eyebrow}>Próximos cursos</span>
            <h2>Empieza con uno de estos</h2>
            <p>
              Nuestros cursos más demandados, con cupos limitados para garantizar atención
              personalizada del instructor.
            </p>
          </header>

          <div className={styles.coursesGrid}>
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          <div className={styles.sectionFooter}>
            <Button href="/cursos" variant="primary" size="md">
              Ver todos los cursos
            </Button>
          </div>
        </div>
      </section>

      {/* ---------- Por qué SES ---------- */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <header className={styles.sectionHeader}>
            <span className={styles.eyebrow}>Por qué SecuritasEtSalus</span>
            <h2>Una escuela seria, no un cursillo cualquiera</h2>
          </header>

          <div className={styles.featuresGrid}>
            <article className={styles.feature}>
              <h3>Instructores con oficio</h3>
              <p>
                Todos nuestros profesores son cerrajeros en activo con más de 10 años de
                experiencia. Aprendes del oficio real, no de manuales teóricos.
              </p>
            </article>
            <article className={styles.feature}>
              <h3>Diplomas verificables</h3>
              <p>
                Cada diploma lleva un código único y QR público. Cualquier cliente o autoridad
                puede comprobar su autenticidad en segundos.
              </p>
            </article>
            <article className={styles.feature}>
              <h3>Franquicia SENCE disponible</h3>
              <p>
                Cursos elegibles para franquicia tributaria SENCE: tu empleador puede deducir
                el coste y tú no pagas nada de tu bolsillo.
              </p>
            </article>
            <article className={styles.feature}>
              <h3>Sin grupos masificados</h3>
              <p>
                Cupos limitados (6 a 12 alumnos por curso) para que el instructor pueda
                acompañarte caso por caso.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ---------- CTA final ---------- */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <h2>¿Listo para empezar?</h2>
          <p>Explora nuestro catálogo y reserva tu cupo en el próximo curso.</p>
          <Link href="/cursos" className={styles.ctaButton}>
            Ver catálogo de cursos
          </Link>
        </div>
      </section>
    </main>
  );
}
