/**
 * Datos mock de cursos para Fase 1 (catálogo público).
 *
 * En Fase 3 estos datos se reemplazan por queries reales a Prisma
 * (`db.course.findMany({ where: { status: 'PUBLISHED' } })`). El shape
 * coincide con `Course` + `CourseSession` + `User (instructor)` para que
 * la migración sea solo cambiar la fuente, no los componentes.
 */

export type MockCourse = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullSyllabus: string; // Markdown
  durationHours: number;
  price: number; // CLP
  currency: 'CLP';
  capacity: number;
  enrolledCount: number;
  region: 'CL';
  subdivision: string;
  venueName: string;
  venueAddress: string;
  hasEvaluation: boolean;
  senceEligible: boolean;
  eligibleForClaveroProfessionalCert: boolean;
  publishedAt: Date;
  instructor: {
    name: string;
    bio: string;
  };
  sessions: {
    sessionNumber: number;
    startsAt: Date;
    endsAt: Date;
  }[];
  category: 'cerrajeria' | 'control-accesos' | 'seguridad-fisica' | 'automotriz';
};

const today = new Date('2026-04-28');
function daysFromNow(d: number, h = 9, m = 0): Date {
  const date = new Date(today);
  date.setDate(date.getDate() + d);
  date.setHours(h, m, 0, 0);
  return date;
}

export const MOCK_COURSES: MockCourse[] = [
  {
    id: 'c-residencial-basico',
    title: 'Cerrajería Residencial — Nivel Básico',
    slug: 'cerrajeria-residencial-basico',
    shortDescription:
      'Fundamentos del oficio: tipos de cerraduras, herramientas, apertura básica y reparaciones habituales en hogares.',
    fullSyllabus: `## Objetivos
Al finalizar el curso el alumno será capaz de identificar los tipos de cerradura más comunes en cerrajería residencial chilena, ejecutar reparaciones básicas y realizar aperturas no destructivas en escenarios estándar.

## Contenido
1. Introducción al oficio y normativa nacional
2. Anatomía de cerraduras de pomo, embutir y sobreponer
3. Herramientas básicas: ganzúas, tensores, extractores
4. Técnicas de apertura: raking, single pin picking
5. Diagnóstico y reparación de cerraduras dañadas
6. Buenas prácticas, ética profesional y código deontológico

## Materiales incluidos
- Set de práctica con 3 cerraduras de distinto nivel.
- Manual impreso de referencia rápida.
- Acceso al cuestionario de evaluación.`,
    durationHours: 24,
    price: 180000,
    currency: 'CLP',
    capacity: 12,
    enrolledCount: 7,
    region: 'CL',
    subdivision: 'CL-RM',
    venueName: 'Sede Santiago Centro',
    venueAddress: 'Av. Libertador Bernardo O’Higgins 1234, Santiago',
    hasEvaluation: true,
    senceEligible: true,
    eligibleForClaveroProfessionalCert: true,
    publishedAt: daysFromNow(-15),
    instructor: {
      name: 'Andrea Salazar Rivas',
      bio: 'Cerrajera con 12 años de experiencia, especializada en cerrajería residencial y peritajes para compañías de seguros.',
    },
    sessions: [
      { sessionNumber: 1, startsAt: daysFromNow(14, 9), endsAt: daysFromNow(14, 17) },
      { sessionNumber: 2, startsAt: daysFromNow(15, 9), endsAt: daysFromNow(15, 17) },
      { sessionNumber: 3, startsAt: daysFromNow(16, 9), endsAt: daysFromNow(16, 17) },
    ],
    category: 'cerrajeria',
  },
  {
    id: 'c-automotriz-intermedio',
    title: 'Cerrajería Automotriz — Llaves y Sistemas Modernos',
    slug: 'cerrajeria-automotriz-intermedio',
    shortDescription:
      'Apertura de vehículos sin llave, copiado de llaves transponder y diagnóstico básico de sistemas keyless.',
    fullSyllabus: `## Objetivos
Capacitar al alumno para resolver el 80% de los casos automotrices habituales: aperturas, copia de llaves transponder y diagnóstico de fallos en sistemas modernos.

## Contenido
1. Tipos de cerradura automotriz por marca y año
2. Herramientas: cuñas neumáticas, varillas, bypass tools
3. Llaves transponder: codificación y programación
4. Sistemas keyless y troubleshooting
5. Casos prácticos guiados sobre vehículos reales
6. Aspectos legales y autorización del propietario

## Requisitos previos
Recomendable haber cursado "Cerrajería Residencial — Nivel Básico" o experiencia equivalente.`,
    durationHours: 32,
    price: 280000,
    currency: 'CLP',
    capacity: 8,
    enrolledCount: 5,
    region: 'CL',
    subdivision: 'CL-RM',
    venueName: 'Taller SES Maipú',
    venueAddress: 'Av. Pajaritos 4500, Maipú',
    hasEvaluation: true,
    senceEligible: true,
    eligibleForClaveroProfessionalCert: true,
    publishedAt: daysFromNow(-10),
    instructor: {
      name: 'Rodrigo Fuentes Pérez',
      bio: 'Especialista automotriz con 15 años en talleres de cerrajería de vehículos europeos y asiáticos.',
    },
    sessions: [
      { sessionNumber: 1, startsAt: daysFromNow(28, 9), endsAt: daysFromNow(28, 17) },
      { sessionNumber: 2, startsAt: daysFromNow(29, 9), endsAt: daysFromNow(29, 17) },
      { sessionNumber: 3, startsAt: daysFromNow(30, 9), endsAt: daysFromNow(30, 17) },
      { sessionNumber: 4, startsAt: daysFromNow(31, 9), endsAt: daysFromNow(31, 17) },
    ],
    category: 'automotriz',
  },
  {
    id: 'c-control-accesos',
    title: 'Control de Accesos Electrónico para Edificios',
    slug: 'control-accesos-edificios',
    shortDescription:
      'Instalación, configuración y mantenimiento de cerraduras electrónicas, lectores RFID y sistemas centralizados.',
    fullSyllabus: `## Objetivos
Habilitar al alumno para instalar y mantener sistemas de control de acceso en edificios residenciales y comerciales pequeños.

## Contenido
1. Tecnologías RFID, NFC, biométricas y QR
2. Cableado y alimentación
3. Software de gestión: usuarios, horarios, logs
4. Integración con porteros automáticos
5. Mantenimiento y resolución de averías
6. Aspectos de privacidad y normativa de datos`,
    durationHours: 20,
    price: 220000,
    currency: 'CLP',
    capacity: 10,
    enrolledCount: 3,
    region: 'CL',
    subdivision: 'CL-VS',
    venueName: 'Centro de Formación Viña del Mar',
    venueAddress: 'Calle Valparaíso 567, Viña del Mar',
    hasEvaluation: true,
    senceEligible: false,
    eligibleForClaveroProfessionalCert: true,
    publishedAt: daysFromNow(-5),
    instructor: {
      name: 'Ignacio Cárdenas López',
      bio: 'Ingeniero electrónico con 8 años especializado en control de accesos para retail y residencial.',
    },
    sessions: [
      { sessionNumber: 1, startsAt: daysFromNow(40, 9), endsAt: daysFromNow(40, 18) },
      { sessionNumber: 2, startsAt: daysFromNow(41, 9), endsAt: daysFromNow(41, 18) },
      { sessionNumber: 3, startsAt: daysFromNow(42, 9), endsAt: daysFromNow(42, 14) },
    ],
    category: 'control-accesos',
  },
  {
    id: 'c-amaestramiento',
    title: 'Sistemas de Amaestramiento y Llave Maestra',
    slug: 'sistemas-amaestramiento',
    shortDescription:
      'Diseño y ejecución de sistemas de amaestramiento para empresas, hoteles y comunidades. Curso especializado.',
    fullSyllabus: `## Objetivos
Curso especializado para cerrajeros con experiencia previa. Al finalizar, el alumno podrá diseñar y ejecutar sistemas de amaestramiento de complejidad media-alta.

## Contenido
1. Conceptos: cilindros, niveles jerárquicos, llave maestra
2. Diseño matricial: planificación de un sistema completo
3. Cálculo de combinaciones y compatibilidad
4. Ejecución: tarjetas de combinación y montaje
5. Documentación entregable al cliente
6. Mantenimiento y ampliación de sistemas existentes

## Requisitos previos
Experiencia previa en cerrajería residencial o industrial.`,
    durationHours: 40,
    price: 380000,
    currency: 'CLP',
    capacity: 6,
    enrolledCount: 2,
    region: 'CL',
    subdivision: 'CL-RM',
    venueName: 'Sede Santiago Centro',
    venueAddress: 'Av. Libertador Bernardo O’Higgins 1234, Santiago',
    hasEvaluation: true,
    senceEligible: true,
    eligibleForClaveroProfessionalCert: true,
    publishedAt: daysFromNow(-2),
    instructor: {
      name: 'Andrea Salazar Rivas',
      bio: 'Cerrajera con 12 años de experiencia, especializada en cerrajería residencial y peritajes para compañías de seguros.',
    },
    sessions: [
      { sessionNumber: 1, startsAt: daysFromNow(60, 9), endsAt: daysFromNow(60, 18) },
      { sessionNumber: 2, startsAt: daysFromNow(61, 9), endsAt: daysFromNow(61, 18) },
      { sessionNumber: 3, startsAt: daysFromNow(62, 9), endsAt: daysFromNow(62, 18) },
      { sessionNumber: 4, startsAt: daysFromNow(63, 9), endsAt: daysFromNow(63, 18) },
      { sessionNumber: 5, startsAt: daysFromNow(64, 9), endsAt: daysFromNow(64, 14) },
    ],
    category: 'cerrajeria',
  },
];

export const COURSE_CATEGORIES: Record<MockCourse['category'], string> = {
  cerrajeria: 'Cerrajería',
  'control-accesos': 'Control de accesos',
  'seguridad-fisica': 'Seguridad física',
  automotriz: 'Automotriz',
};

export function getCourseBySlug(slug: string): MockCourse | undefined {
  return MOCK_COURSES.find((c) => c.slug === slug);
}

export function getPublishedCourses(filters?: {
  category?: MockCourse['category'];
  subdivision?: string;
}): MockCourse[] {
  return MOCK_COURSES.filter((c) => {
    if (filters?.category && c.category !== filters.category) return false;
    if (filters?.subdivision && c.subdivision !== filters.subdivision) return false;
    return true;
  });
}
