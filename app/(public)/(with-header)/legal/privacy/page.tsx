import type { Metadata } from 'next';
import styles from '../legal.module.scss';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Cómo SecuritasEtSalus recopila, usa y protege los datos personales.',
};

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <article className={styles.article}>
        <header>
          <span className={styles.eyebrow}>Legal</span>
          <h1>Política de privacidad</h1>
          <p className={styles.lead}>
            Versión preliminar — pendiente de revisión legal con la SpA chilena en
            constitución.
          </p>
        </header>

        <section>
          <h2>1. Responsable del tratamiento</h2>
          <p>
            SecuritasEtSalus SpA, con domicilio en Santiago de Chile, es responsable del
            tratamiento de los datos personales recogidos a través de esta plataforma.
          </p>
        </section>

        <section>
          <h2>2. Datos que recopilamos</h2>
          <ul>
            <li>Datos de identificación: nombre completo, correo electrónico, teléfono.</li>
            <li>
              Datos para inscripción: RUT (cuando aplica franquicia SENCE), datos del
              empleador.
            </li>
            <li>Datos de pago: gestionados por Stripe — SES no almacena datos de tarjeta.</li>
            <li>Datos académicos: cursos en los que se inscribe, asistencia, evaluaciones.</li>
          </ul>
        </section>

        <section>
          <h2>3. Finalidades</h2>
          <ul>
            <li>Gestionar la inscripción a cursos y la emisión de diplomas.</li>
            <li>Comunicar información operativa (recordatorios, cambios de fechas).</li>
            <li>Cumplir las obligaciones administrativas con SENCE para cursos elegibles.</li>
            <li>Verificar públicamente la autenticidad de los diplomas emitidos.</li>
          </ul>
        </section>

        <section>
          <h2>4. Compartición de datos</h2>
          <p>
            SES no vende ni cede datos personales a terceros, salvo en los siguientes casos:
          </p>
          <ul>
            <li>SENCE: datos mínimos de cursos con franquicia tributaria.</li>
            <li>Stripe (procesador de pagos): datos necesarios para completar la transacción.</li>
            <li>Resend (proveedor de correo): correo electrónico para envío transaccional.</li>
            <li>Autoridades: cuando exista requerimiento legal válido.</li>
          </ul>
        </section>

        <section>
          <h2>5. Datos públicos del diploma</h2>
          <p>
            La verificación pública de un diploma muestra: nombre del alumno, curso, fecha de
            emisión, estado y nombre del instructor. No se exponen correo, teléfono ni
            cualquier otro dato personal sensible.
          </p>
        </section>

        <section>
          <h2>6. Tus derechos</h2>
          <p>
            Puedes solicitar el acceso, rectificación, supresión u oposición al tratamiento de
            tus datos escribiendo a{' '}
            <a href="mailto:contacto@ses.agsint.cl">contacto@ses.agsint.cl</a>.
          </p>
        </section>

        <section>
          <h2>7. Conservación</h2>
          <p>
            Los datos académicos se conservan indefinidamente para garantizar la verificación
            pública futura del diploma. Otros datos se conservan durante el tiempo necesario
            para las obligaciones legales aplicables (mínimo 6 años para datos contables).
          </p>
        </section>

        <section>
          <h2>8. Cookies</h2>
          <p>
            SecuritasEtSalus solo usa cookies <strong>estrictamente necesarias</strong> para
            que la plataforma funcione. No utilizamos cookies de analítica, de seguimiento
            publicitario ni de redes sociales. Por eso no encontrarás un diálogo de
            configuración con interruptores: no hay nada opcional que configurar.
          </p>
          <p>Las cookies que sí usamos son:</p>
          <ul>
            <li>
              <strong>Sesión de autenticación</strong> — cookie HTTP-only emitida por
              NextAuth cuando inicias sesión. Mantiene tu cuenta abierta entre páginas y
              caduca cuando cierras sesión o expira el token (30 días). Sin esta cookie no
              podrías acceder a tu panel.
            </li>
            <li>
              <strong>Stripe Checkout</strong> — cuando vas a pagar un curso, Stripe
              gestiona el formulario en su propio dominio (<code>checkout.stripe.com</code>)
              y usa sus cookies de seguridad y prevención de fraude. SecuritasEtSalus no
              tiene acceso a esas cookies.
            </li>
            <li>
              <strong>Preferencias mínimas</strong> — tu navegador puede guardar en{' '}
              <code>localStorage</code> el dismiss del aviso de cookies (para no volver a
              mostrarlo) y notas de revisión interna en algunos documentos. No es una cookie
              estrictamente, pero la mencionamos por transparencia.
            </li>
          </ul>
          <p>
            Si en el futuro añadimos analítica o publicidad, esta sección se actualizará y
            verás el banner pedirte consentimiento explícito antes de activar cualquier
            cookie no esencial.
          </p>
        </section>
      </article>
    </main>
  );
}
