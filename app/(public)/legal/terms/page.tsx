import type { Metadata } from 'next';
import styles from '../legal.module.scss';

export const metadata: Metadata = {
  title: 'Términos y condiciones',
  description: 'Términos y condiciones de uso de la plataforma SecuritasEtSalus.',
};

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <article className={styles.article}>
        <header>
          <span className={styles.eyebrow}>Legal</span>
          <h1>Términos y condiciones</h1>
          <p className={styles.lead}>
            Versión preliminar — pendiente de revisión legal con la SpA chilena en
            constitución.
          </p>
        </header>

        <section>
          <h2>1. Sobre SecuritasEtSalus</h2>
          <p>
            SecuritasEtSalus (en adelante «SES») es una empresa chilena dedicada a la
            formación profesional en cerrajería y seguridad. Sus servicios consisten en cursos
            presenciales y emisión de diplomas formativos verificables.
          </p>
        </section>

        <section>
          <h2>2. Inscripción y pago</h2>
          <p>
            Para inscribirse a un curso es necesario crear una cuenta verificada y completar
            el pago a través de la pasarela. La inscripción queda confirmada cuando se recibe
            la confirmación de pago.
          </p>
        </section>

        <section>
          <h2>3. Política de cancelación</h2>
          <p>
            Las cancelaciones realizadas con suficiente antelación dan derecho a un reembolso
            parcial o total según la siguiente tabla, calculada sobre el primer día del curso:
          </p>
          <ul>
            <li>≥ 28 días de antelación: reembolso del 100%.</li>
            <li>Entre 28 y 14 días: reembolso del 75%.</li>
            <li>Entre 14 y 4 días: reembolso del 50%.</li>
            <li>Entre 96 y 48 horas: reembolso del 25%.</li>
            <li>Menos de 48 horas o no presentación: sin reembolso.</li>
          </ul>
          <p>
            Si SES cancela el curso por cualquier motivo, el alumno recibe el 100% del
            reembolso o crédito íntegro para otro curso a su elección.
          </p>
        </section>

        <section>
          <h2>4. Diplomas</h2>
          <p>
            Los diplomas SES acreditan que su titular ha completado el curso correspondiente
            cumpliendo todos los requisitos académicos. Son documentos privados del alumno,
            no caducan y pueden verificarse públicamente mediante el código QR incluido.
          </p>
          <p>
            SES se reserva el derecho de revocar un diploma en caso de fraude académico
            comprobado o error material en su emisión, notificándolo al alumno.
          </p>
        </section>

        <section>
          <h2>5. Limitación de responsabilidad</h2>
          <p>
            SES imparte formación pero no garantiza el desempeño profesional posterior del
            alumno ni los servicios que éste preste a terceros. La responsabilidad de SES se
            limita al precio del curso pagado.
          </p>
        </section>

        <section>
          <h2>6. Modificaciones</h2>
          <p>
            SES se reserva el derecho de modificar estos términos. Los cambios serán
            notificados por correo a los usuarios registrados con al menos 30 días de
            antelación a su entrada en vigor.
          </p>
        </section>
      </article>
    </main>
  );
}
