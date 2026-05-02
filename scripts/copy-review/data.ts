/**
 * Catálogo de bloques de copy de las landings públicas de SES.
 *
 * Fuente de verdad para `generate.ts` (HTML) y `generate-docx.ts` (DOCX).
 * El copy se mantiene aquí literal — si cambia en el código, hay que
 * actualizar este archivo a mano antes de regenerar.
 *
 * Convenciones:
 *  - `text` admite **negrita** ligero (se renderiza como <strong>).
 *  - `selector` es Playwright. Si una sección se reordena en el futuro,
 *    el script avisa con warning y deja "Captura no disponible".
 *  - `position` describe el rol del texto en el bloque (Eyebrow,
 *    Título, etc.) en lenguaje humano para el revisor.
 */

export type CopyItem = {
  position: string;
  text: string;
};

export type Block = {
  selector: string;
  label: string;
  /** Razón de ser del bloque para que el revisor entienda el contexto. */
  purpose?: string;
  items: CopyItem[];
};

export type Landing = {
  path: string;
  name: string;
  audience: string;
  blocks: Block[];
};

export const LANDINGS: Landing[] = [
  {
    path: '/',
    name: 'Landing principal — /',
    audience:
      'Alumno potencial: cerrajero en activo o aspirante que quiere certificarse. Llega vía búsqueda orgánica, redes o Clavero. Decide en 30 segundos si esto va con él.',
    blocks: [
      {
        selector: 'main > section:nth-of-type(1)',
        label: 'Hero principal',
        purpose:
          'Primera impresión: dice qué es SES, a quién va dirigido y qué hace distinto. CTA primario al catálogo, secundario a verificación pública.',
        items: [
          { position: 'Status pill (eyebrow)', text: 'Cohorte de mayo · cupos abiertos' },
          { position: 'Status pill (badge)', text: '6 / 10' },
          {
            position: 'Título (línea 1)',
            text: 'La escuela de **cerrajería** que se toma en serio el oficio.',
          },
          {
            position: 'Subtítulo / lead',
            text: 'Cursos presenciales con cohortes de diez, instructores con experiencia real en taller, y un diploma con QR firmado que se sostiene fuera del aula.',
          },
          { position: 'Botón primario', text: 'Ver cursos disponibles →' },
          { position: 'Botón secundario', text: 'Verificar diploma' },
          { position: 'Stat 1 — número', text: '96%' },
          { position: 'Stat 1 — label', text: 'aprobaron al primer intento' },
          { position: 'Stat 2 — número', text: '10' },
          { position: 'Stat 2 — label', text: 'cohortes graduadas' },
          { position: 'Stat 3 — número', text: 'OTEC' },
          { position: 'Stat 3 — label', text: 'SENCE — en acreditación' },
          { position: 'Float card 1 — eyebrow', text: 'Próximo curso' },
          {
            position: 'Float card 1 — título',
            text: 'Aperturas Básicas (o el primero del catálogo)',
          },
          { position: 'Float card 2 — eyebrow', text: 'Diploma verificado' },
          { position: 'Float card 2 — nombre alumno (ejemplo)', text: 'Carla Pérez' },
          { position: 'Float card 2 — código (ejemplo)', text: 'SES-7YZS-ESUB' },
          { position: 'Float card 2 — estado', text: '✓ Auténtico · ✓ Vigente' },
        ],
      },
      {
        selector: '#como-funciona',
        label: 'Cómo funciona — tres pasos para certificarte',
        purpose:
          'Reduce fricción explicando el flujo extremo-a-extremo: catálogo → asistencia → diploma. Combate la objeción "¿qué papeleo me espera?".',
        items: [
          { position: 'Eyebrow', text: 'Cómo funciona' },
          { position: 'Título de sección', text: 'Tres pasos para certificarte' },
          {
            position: 'Subtítulo',
            text: 'Desde la inscripción hasta el diploma. Sin papeleo innecesario, sin trámites opacos: solo formación seria que se traduce en un documento que vale.',
          },
          { position: 'Paso 1 — título', text: 'Elige tu curso' },
          {
            position: 'Paso 1 — descripción',
            text: 'Explora el catálogo con cursos por categoría, sede y fecha. Inscríbete pagando directamente desde la web — sin intermediarios.',
          },
          { position: 'Paso 2 — título', text: 'Asiste y aprueba' },
          {
            position: 'Paso 2 — descripción',
            text: 'Cursos 100% presenciales en sedes acreditadas. Asistencia, examen y evaluación cualitativa son requisitos para obtener el diploma.',
          },
          { position: 'Paso 3 — título', text: 'Recibe tu diploma verificable' },
          {
            position: 'Paso 3 — descripción',
            text: 'Diploma PDF con código único y QR público. Cualquiera puede comprobar su validez. Reconocido por ClaveroCerrajero como input para certificación profesional.',
          },
        ],
      },
      {
        selector: 'main section:has(h2:has-text("Empieza con uno de estos"))',
        label: 'Cursos destacados',
        purpose:
          'Vitrina de los próximos cursos publicados. Si la BD tiene cursos seedeados, aparece esta sección; si no, se omite.',
        items: [
          { position: 'Eyebrow', text: 'Próximos cursos' },
          { position: 'Título de sección', text: 'Empieza con uno de estos' },
          {
            position: 'Subtítulo',
            text: 'Nuestros cursos más demandados, con cupos limitados para garantizar atención personalizada del instructor.',
          },
          {
            position: 'Card de curso — tag Clavero',
            text: 'AB / LE / V1 (código de skill Clavero)',
          },
          {
            position: 'Card de curso — tag SENCE',
            text: 'Franquicia SENCE',
          },
          { position: 'Card de curso — meta "Duración"', text: '24 h lectivas (ejemplo)' },
          { position: 'Card de curso — meta "Sede"', text: 'Santiago — Providencia (ejemplo)' },
          { position: 'Card de curso — meta "Inicio"', text: 'fecha del primer día (es-CL)' },
          { position: 'Card de curso — etiqueta de precio', text: 'Inscripción' },
          { position: 'Card de curso — cupos', text: '6 cupos disponibles / Último cupo / Curso lleno' },
          { position: 'Card de curso — CTA', text: 'Ver detalle →' },
          { position: 'Botón final de sección', text: 'Ver todos los cursos' },
        ],
      },
      {
        selector: 'main section:has(h2:has-text("Una escuela seria"))',
        label: 'Por qué SES — bento',
        purpose:
          'Diferenciación frente a cursos de fin de semana / online. Cinco tarjetas con los 5 puntos fuertes en formato bento (asimétrico).',
        items: [
          { position: 'Eyebrow', text: 'Por qué SES' },
          {
            position: 'Título de sección',
            text: 'Una escuela seria, *no un cursillo cualquiera.*',
          },
          { position: 'Card grande (verde) — eyebrow', text: 'El instructor que conoces' },
          {
            position: 'Card grande — título',
            text: 'Cada cohorte la enseña alguien que vive del **oficio.**',
          },
          {
            position: 'Card grande — body',
            text: 'Mínimo 10 años de taller — cerrajeros en activo, no aulas teóricas. Instructor en franquicia comercial: gente que abre cerraduras toda la semana.',
          },
          { position: 'Card "QR firmado" — título', text: 'QR firmado' },
          {
            position: 'Card "QR firmado" — body',
            text: 'Cada diploma con código único, verificable en cualquier dispositivo.',
          },
          { position: 'Card "SENCE" (crema) — título', text: 'Franquicia SENCE' },
          {
            position: 'Card "SENCE" — body',
            text: 'Cursos elegibles vía OTEC — tu empleador deduce el coste.',
          },
          { position: 'Card "Cohortes" — título', text: 'Cohortes de diez' },
          {
            position: 'Card "Cohortes" — body',
            text: 'Cupos limitados, atención uno-a-uno garantizada.',
          },
          { position: 'Card "Clavero" (oscura) — título', text: 'Mapeo automático a Clavero' },
          {
            position: 'Card "Clavero" — body',
            text: 'Cada diploma SES se mapea a una skill del registro Clavero.',
          },
          { position: 'Card "Clavero" — link', text: 'Saber más →' },
        ],
      },
      {
        selector: 'main section:has(h2:has-text("Una escuela seria"))',
        label: 'CTA cohorte (banner verde)',
        purpose:
          'Última oportunidad antes del CTA final: muestra una cohorte concreta con fecha y dos CTAs (pago directo + catálogo). Solo aparece si hay un próximo curso publicado.',
        items: [
          { position: 'Eyebrow', text: 'Próxima cohorte' },
          {
            position: 'Título',
            text: 'Tu próxima cohorte arranca el **6 de mayo.** (fecha dinámica)',
          },
          {
            position: 'Body',
            text: 'Cohorte de [Nombre del curso] en [sede], paga con Stripe si vas por tu cuenta o vía SENCE si pagas a través de empresa.',
          },
          { position: 'Botón primario', text: 'Inscríbete a pagar →' },
          { position: 'Botón secundario', text: 'Ver el catálogo completo →' },
        ],
      },
      {
        selector: 'main > section:last-of-type',
        label: 'CTA final',
        purpose: 'Cierre simple antes del footer. Una pregunta directa + botón único.',
        items: [
          { position: 'Título', text: '¿Listo para empezar?' },
          {
            position: 'Subtítulo',
            text: 'Explora nuestro catálogo y reserva tu cupo en el próximo curso.',
          },
          { position: 'Botón', text: 'Ver catálogo de cursos' },
        ],
      },
      {
        selector: 'footer',
        label: 'Footer global (común a todas las páginas)',
        purpose:
          'Aparece en TODAS las páginas. Cuatro columnas: marca + tagline, navegación, legal, contacto.',
        items: [
          { position: 'Marca — wordmark', text: 'SecuritasEtSalus' },
          { position: 'Marca — tagline', text: 'Escuela de cerrajería profesional' },
          {
            position: 'Marca — copy descriptivo',
            text: 'OTEC en proceso de acreditación SENCE. Formación rigurosa para profesionales de la cerrajería y la seguridad en Chile.',
          },
          { position: 'Columna "Sitio" — heading', text: 'Sitio' },
          { position: 'Columna "Sitio" — links', text: 'Catálogo de cursos · Cómo funciona · Iniciar sesión · Crear cuenta' },
          { position: 'Columna "Legal" — heading', text: 'Legal' },
          {
            position: 'Columna "Legal" — links',
            text: 'Términos y condiciones · Política de privacidad · Verificar diploma',
          },
          { position: 'Columna "Contacto" — heading', text: 'Contacto' },
          { position: 'Columna "Contacto" — email', text: 'contacto@ses.agsint.cl' },
          { position: 'Columna "Contacto" — ciudad', text: 'Santiago, Chile' },
          {
            position: 'Pie',
            text: '© [año actual] SecuritasEtSalus. Todos los derechos reservados.',
          },
        ],
      },
    ],
  },

  {
    path: '/courses',
    name: 'Catálogo — /courses',
    audience:
      'Alumno con intención de inscripción. Llega del CTA del hero o del header. Compara cursos disponibles, precio, sede.',
    blocks: [
      {
        selector: 'main > section:nth-of-type(1)',
        label: 'Hero del catálogo',
        purpose:
          'Pequeño hero introductorio. Dice qué es esta página y un conteo en directo de cursos disponibles. Muy minimalista.',
        items: [
          { position: 'Eyebrow', text: 'Catálogo' },
          { position: 'Título', text: 'Cursos *presenciales.*' },
          {
            position: 'Lead',
            text: 'Cohortes pequeñas, instructores con experiencia real, diplomas verificables. Inscríbete directamente desde la web.',
          },
          {
            position: 'Pill de conteo',
            text: '[N] cursos disponibles / [N] curso disponible',
          },
        ],
      },
      {
        selector: 'main > section:nth-of-type(2)',
        label: 'Listado de cursos / empty state',
        purpose:
          'Si hay cursos publicados, muestra grid de CourseCards. Si no hay ninguno, empty state con email de contacto.',
        items: [
          { position: 'Empty — título', text: 'Aún no hay cursos publicados' },
          {
            position: 'Empty — body',
            text: 'Estamos preparando los próximos cursos. Vuelve pronto o escríbenos a **dev@securitasetsalus.cl** si quieres que te avisemos cuando abramos inscripciones.',
          },
          { position: 'Empty — link de retorno', text: 'Volver al inicio' },
          {
            position: 'Card de curso (mismas piezas que en landing destacados)',
            text: 'Tag skill / SENCE · Título · Descripción corta · Duración · Sede · Inicio · Inscripción [precio] · cupos · Ver detalle →',
          },
        ],
      },
    ],
  },

  {
    path: '/contact',
    name: 'Contacto — /contact',
    audience:
      'Tres perfiles posibles: empresa que quiere inscribir equipo (vía SENCE), instructor que se postula, alumno con dudas. La página los segmenta con el dropdown del form y los emails laterales.',
    blocks: [
      {
        selector: 'main > section:nth-of-type(1)',
        label: 'Hero',
        purpose: 'Posicionamiento empático: invita a hablar antes de comprar.',
        items: [
          { position: 'Eyebrow', text: 'Contacto' },
          { position: 'Título', text: 'Hablemos de *tu cohorte.*' },
          {
            position: 'Lead',
            text: 'Si quieres inscribir a tu equipo, postular como instructor o tienes preguntas sobre franquicia SENCE, escríbenos. Respondemos en 24h hábiles.',
          },
        ],
      },
      {
        selector: 'main > section:nth-of-type(2)',
        label: 'Form + sidepanel de contacto',
        purpose:
          'Form a la izquierda con dropdown de motivo (segmenta al lead); sidepanel a la derecha con 4 cards: correo general, WhatsApp, cursos para empresas, sedes.',
        items: [
          { position: 'Form — eyebrow', text: 'Escríbenos' },
          { position: 'Form — título', text: 'Te respondemos en 24h hábiles.' },
          {
            position: 'Form — lead',
            text: 'Cuéntanos quién eres y qué necesitas. Si es un curso para empresa o un trámite SENCE, te derivamos al equipo correcto.',
          },
          {
            position: 'Form — labels (campos)',
            text: 'Nombre completo · Email · Teléfono (opcional) · Motivo · Mensaje',
          },
          {
            position: 'Form — opciones del dropdown "Motivo"',
            text: 'Inscribirme en un curso · Curso para mi empresa (SENCE) · Postularme como instructor · Otra consulta',
          },
          { position: 'Form — botón', text: 'Enviar mensaje' },
          {
            position: 'Form — nota de privacidad',
            text: 'Al enviar aceptas nuestra política de privacidad. No comparte tu correo con terceros.',
          },
          {
            position: 'Form — success (tras enviar)',
            text: 'Mensaje enviado. Te respondemos en menos de 24h hábiles al correo que indicaste. Si es urgente, escríbenos por WhatsApp en horario de oficina.',
          },
          { position: 'Card "Correo" — título', text: 'Correo' },
          {
            position: 'Card "Correo" — body',
            text: 'Para inscripciones, soporte general y prensa.',
          },
          { position: 'Card "Correo" — email', text: 'hola@securitasetsalus.cl' },
          { position: 'Card "WhatsApp" — título', text: 'WhatsApp' },
          {
            position: 'Card "WhatsApp" — body',
            text: 'De lunes a viernes, 09:00 – 18:00 (hora Chile).',
          },
          { position: 'Card "WhatsApp" — número', text: '+56 9 1234 5678' },
          { position: 'Card "Empresas" (oscura) — título', text: 'Cursos para empresas' },
          {
            position: 'Card "Empresas" — body',
            text: 'Cohortes cerradas en tu sede o en la nuestra, con franquicia SENCE gestionada por nuestra OTEC.',
          },
          { position: 'Card "Empresas" — email', text: 'empresas@securitasetsalus.cl' },
          { position: 'Card "Sedes" — eyebrow', text: 'Sedes' },
          { position: 'Card "Sedes" — título', text: 'Dónde se imparte el oficio.' },
          {
            position: 'Card "Sedes" — sede 1',
            text: '**Santiago — Providencia** · Av. Providencia 1234, oficina 502',
          },
          {
            position: 'Card "Sedes" — sede 2',
            text: '**Valparaíso — Almendral** · Av. Pedro Montt 567, taller',
          },
          {
            position: 'Card "Sedes" — sede 3',
            text: '**Concepción — Centro** · O\'Higgins 890, segundo piso',
          },
          {
            position: 'Card "Sedes" — nota',
            text: 'Las sedes activas dependen de la cohorte. Confirmar siempre en /courses.',
          },
        ],
      },
    ],
  },

  {
    path: '/verify',
    name: 'Verificar diploma — /verify',
    audience:
      'No es alumno: es un empleador, una autoridad, un cliente que recibió un diploma de un cerrajero y quiere comprobar su autenticidad. Muy task-oriented: introduce código → ver resultado.',
    blocks: [
      {
        selector: 'main > section:nth-of-type(1)',
        label: 'Hero con form de verificación',
        purpose:
          'Una sola tarea: pegar el código y verificar. Form prominente, hint del formato esperado.',
        items: [
          { position: 'Eyebrow', text: 'Verificación pública' },
          { position: 'Título', text: 'Verificar un *diploma SES.*' },
          {
            position: 'Lead',
            text: 'Introduce el código que aparece en el PDF del diploma o escanea el QR. La verificación es pública — cualquiera puede comprobar si un diploma de SecuritasEtSalus es legítimo.',
          },
          { position: 'Form — label', text: 'Código del diploma' },
          { position: 'Form — placeholder', text: 'SES-XXXX-XXXX' },
          { position: 'Form — botón', text: 'Verificar →' },
          {
            position: 'Form — hint',
            text: 'Formato: **SES-XXXX-XXXX** (4 caracteres, guión, 4 caracteres).',
          },
        ],
      },
      {
        selector: 'main > section:nth-of-type(2)',
        label: 'Sobre los diplomas SES (3 cards explicativas)',
        purpose:
          'Después del form, contexto sobre qué significa un diploma SES y qué NO acredita (deriva a Clavero). Tres mini-cards.',
        items: [
          { position: 'Título de sección', text: 'Sobre los diplomas SES' },
          { position: 'Card 1 — eyebrow', text: 'Formación' },
          { position: 'Card 1 — título', text: 'Cada diploma acredita un curso real.' },
          {
            position: 'Card 1 — body',
            text: 'Los diplomas de SecuritasEtSalus se emiten al cerrar un curso presencial con asistencia y evaluación. No caducan — acreditan que el titular completó esa formación en una fecha determinada.',
          },
          { position: 'Card 2 — eyebrow', text: 'Verificación' },
          { position: 'Card 2 — título', text: 'Código único y QR firmado.' },
          {
            position: 'Card 2 — body',
            text: 'Cada diploma lleva un código corto del tipo **SES-XXXX-XXXX** y un QR que apunta a esta misma página. El verificador puede ser cualquier persona — no requiere cuenta.',
          },
          { position: 'Card 3 — eyebrow', text: 'Idoneidad profesional' },
          { position: 'Card 3 — título', text: 'Para algo más, consulta Clavero.' },
          {
            position: 'Card 3 — body',
            text: 'Si necesitas comprobar la **idoneidad profesional íntegra** — compliance, seguro de RC, antecedentes — consulta el registro de **Clavero**. SES solo acredita la formación recibida.',
          },
        ],
      },
    ],
  },
];
