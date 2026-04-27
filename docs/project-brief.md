# SecuritasEtSalus — Documento de Proyecto

## ¿Qué es SecuritasEtSalus?

**SecuritasEtSalus** (en adelante, SES) es una **escuela de formación profesional** especializada en cerrajería, control de accesos y seguridad física, dirigida al mercado latinoamericano.

SES imparte cursos presenciales con instructores cualificados, evalúa la competencia del alumno y emite un **diploma verificable** con código único y QR que acredita la formación recibida.

**Relación con Clavero:** SES y ClaveroCerrajero son **dos empresas distintas con responsabilidades distintas**. SES forma; Clavero certifica idoneidad profesional. Un diploma de SES no convierte a un alumno en cerrajero certificado — sólo acredita que aprobó un curso. Si ese alumno quiere aparecer en el directorio público de cerrajeros profesionales, debe tramitar su Certificado Profesional aparte en Clavero, que validará el diploma SES junto con otros requisitos (antecedentes, seguro, código ético, pago, etc.).

Esta separación protege a ambas marcas: SES gana o pierde según la calidad de su formación, Clavero según la confianza que infunde el registro. No hay conflicto de intereses entre formar y certificar.

**Modelo de ingresos:**
- Pago directo del alumno por cada curso al inscribirse (Stripe Checkout).
- SES se registra como **OTEC SENCE** desde el inicio. Esto permite que cursos elegibles puedan acogerse a la franquicia tributaria SENCE (descuento para alumnos cuyo empleador la aplique). Implica recolección de datos extra al checkout (RUT del alumno, datos del empleador si corresponde) y cumplimiento de requisitos administrativos del SENCE.
- A futuro: paquetes de cursos, descuentos por volumen, becas SENCE.

**Estructura societaria:** SpA chilena nueva, separada de Clavero. RUT propio para Stripe live, facturación SENCE y T&C.

---

## Lógica de negocio

- SES publica un **catálogo público** de cursos abiertos con descripción, temario, fechas, sede, cupos y precio.
- Cualquier persona interesada puede **inscribirse y pagar** desde el sitio sin intervención del admin (a diferencia de Clavero, donde el admin inscribe).
- Tras pagar, el alumno queda inscrito automáticamente en el curso y recibe un email de confirmación con los datos prácticos (sede, fechas, qué llevar).
- Los cursos son **100% presenciales**. El sistema no aloja contenido en vídeo ni LMS — solo gestiona inscripción, asistencia, evaluación y emisión de diploma.
- Un curso puede tener **una o varias sesiones** (un curso de 3 días = 3 sesiones). El instructor marca asistencia **por sesión**.
- Para emitir el diploma se requieren **cuatro condiciones** (cualquiera que falle bloquea la emisión):
  - **100% de asistencia** a las sesiones (criterio estricto — el alumno que falta a una sesión no obtiene diploma).
  - Aprobar la **evaluación final** si el curso la lleva. La evaluación es **configurable por curso**: el admin marca al crear el curso si lleva evaluación o no, con `true` por defecto. Cursos sin evaluación se diploman solo con asistencia (+ las dos siguientes).
  - El alumno ha completado el **cuestionario de evaluación del curso y del instructor** (alumno → curso/instructor) — requisito de la normatividad de calidad OTEC SENCE.
  - El instructor ha completado la **evaluación del alumno** (instructor → alumno) en función de los resultados escritos — requisito SENCE.
  - *[PENDIENTE G19: el formato exacto de los cuestionarios, anonimato, plazos y modelo de datos están sin definir hasta que el cofundador profundice en la normatividad SENCE. Ver [decisions-pending.md](decisions-pending.md#g19--evaluaciones-cruzadas-detalle).]*
- Cuando el instructor marca el curso como cerrado y registra los resultados, el sistema **emite automáticamente el diploma** a los alumnos que cumplen los requisitos: PDF con QR único, almacenado en R2, enviado por email y descargable desde el área del alumno.
- El diploma **no caduca** y no aparece en ningún directorio público — es un documento privado que el alumno usa donde le convenga (CV, requisito de Clavero, requisito de cliente final, etc.).
- SES expone un **endpoint público de verificación** `/api/diplomas/[code]/verify` (similar al de Clavero) que cualquiera (incluido el sistema de Clavero) puede consultar para validar si un código de diploma es legítimo.

---

## Roles del sistema

```ts
enum Role {
  SUPER_ADMIN     // Acceso total — equipo SES
  INSTRUCTOR      // Imparte cursos y registra asistencia/evaluaciones
  STUDENT         // Alumno inscrito en cursos
}
// REGION_ADMIN se introduce más adelante cuando SES escale fuera de Chile.
// El campo `region` ya está en el modelo, pero solo el SUPER_ADMIN gestiona regiones por ahora.
```

A diferencia de Clavero, **no existe `GOV_VIEWER`**: SES no entrega registros al gobierno, eso es competencia de Clavero.

---

## Modelo de base de datos (simplificado)

```prisma
User
  id, name, email, passwordHash, role, region, emailVerifiedAt, createdAt

Course
  id, title, slug, description, fullSyllabus, durationHours, price, currency,
  region, venueAddress, capacity, status, instructorId,
  hasEvaluation,                       // por defecto true
  senceEligible,                       // afecto a franquicia SENCE
  eligibleForClaveroProfessionalCert,  // input válido para certificación Clavero
  publishedAt, createdAt

CourseSession
  id, courseId, sessionNumber, startsAt, endsAt, location

Enrollment
  id, userId, courseId, status, paidAt, stripePaymentId, finalGrade,
  senceUsed,         // marca si se aplicó franquicia SENCE
  employerRut,       // RUT empleador si aplicó franquicia
  enrolledAt

Attendance
  id, enrollmentId, sessionId, attended, markedById, markedAt

Diploma
  id, userId, courseId, code, issuedAt, pdfKey, status

Payment
  id, userId, enrollmentId, stripePaymentId, amount, currency, paidAt

// PENDIENTE G19 — pendiente de definir formato exacto:
// CourseEvaluation       → marca si el alumno completó el cuestionario obligatorio
// CourseEvaluationResponse → respuestas anónimas (alumno valora curso e instructor)
// StudentEvaluation      → evaluación cualitativa del instructor a cada alumno
```

**Diferencias clave frente al modelo de Clavero:**
- `Course` añade `slug`, `fullSyllabus`, `durationHours`, `price`, `capacity`, `venueAddress`, `publishedAt`, más tres flags propios de SES: `hasEvaluation`, `senceEligible`, `eligibleForClaveroProfessionalCert`.
- Aparece `CourseSession` y `Attendance` (Clavero solo tiene `Enrollment.attended` global).
- `Enrollment` tiene `paidAt`, `stripePaymentId`, `finalGrade`, `senceUsed`, `employerRut` (en Clavero el pago va por aparte y no hay nota ni datos SENCE).
- `Diploma` no tiene `expiresAt` ni `status` con caducidad — sólo `ACTIVE` o `REVOKED` (revocación es manual y rara, p. ej. fraude académico).
- **Naming:** SES emite **Diplomas** (acreditan formación, no caducan). Clavero emite **Certificados Profesionales** (acreditan idoneidad, caducan anuales). Mantener esta distinción rigurosamente en código y UI.

---

## Estados del diploma

```ts
enum DiplomaStatus {
  ACTIVE    // Vigente — el caso normal
  REVOKED   // Revocado manualmente por SES (fraude académico, error en emisión)
}
```

El diploma **no caduca** porque acredita un hecho histórico: "esta persona aprobó este curso en esta fecha". La caducidad pertenece al certificado profesional de Clavero, no al diploma formativo.

---

## Estados de la inscripción

```ts
enum EnrollmentStatus {
  PENDING_PAYMENT     // Creada pero el pago aún no se ha confirmado
  CONFIRMED           // Pagada — el alumno ya está inscrito al curso
  CANCELLED           // Cancelada por el alumno o por SES (con/sin reembolso)
  PENDING_EVALUATION  // Curso terminado, asistencia OK, examen OK, pero falta
                      //   alguna evaluación (G19) — el diploma se emite cuando
                      //   las cuatro condiciones estén cumplidas
  COMPLETED           // Todas las condiciones cumplidas → diploma emitido
  FAILED              // El curso terminó y el alumno no cumple requisitos
                      //   irrecuperables (asistencia < 100% o examen suspendido)
}
```

---

## Rutas

### Públicas
```
/                        Landing — propuesta de valor de SES
/cursos                  Catálogo público con filtros (región, fecha, tema)
/cursos/[slug]           Detalle de un curso + botón "Inscribirme y pagar"
/verify/[code]           Verificación pública de un diploma por QR
/login                   Autenticación
/register                Registro de alumno
/forgot-password         Recuperación de contraseña
/legal/terms             Términos y condiciones
/legal/privacy           Política de privacidad
```

### Alumno (autenticado)
```
/dashboard               Resumen: cursos en curso, próximas sesiones, diplomas
/mis-cursos              Historial de inscripciones (todas las status)
/mis-diplomas            Listado de diplomas emitidos con descarga PDF
/profile                 Datos personales editables
/billing                 Historial de pagos
```

### Instructor
```
/instructor              Dashboard del instructor
/instructor/cursos       Cursos asignados
/instructor/cursos/[id]/asistencia    Marcar asistencia por sesión
/instructor/cursos/[id]/evaluacion    Registrar nota final + cierre del curso
```

### Administración (SUPER_ADMIN / REGION_ADMIN)
```
/admin                   Dashboard global + métricas
/admin/cursos            CRUD de cursos
/admin/cursos/new        Crear curso (con sesiones múltiples)
/admin/cursos/[id]       Editar curso, ver inscritos, asignar instructor
/admin/usuarios          CRUD de usuarios
/admin/inscripciones     Listado de todas las inscripciones con filtros
/admin/diplomas          Listado de diplomas + revocación manual
/admin/pagos             Resumen de pagos
```

### API
```
POST   /api/auth/[...nextauth]
GET    /api/cursos                            # Listado público
GET    /api/cursos/[slug]                     # Detalle público
POST   /api/enrollments/checkout              # Crea Stripe Checkout Session
POST   /api/payments/webhook                  # Stripe webhook (confirma inscripción)
GET    /api/diplomas/[code]/verify            # Endpoint público — Clavero lo consume
POST   /api/instructor/attendance             # Instructor marca asistencia
POST   /api/instructor/courses/[id]/close     # Cierra curso y emite diplomas
```

---

## Flujos principales

### Inscripción de un alumno (flujo principal)
```
Alumno entra en /cursos → ve catálogo
→ Abre /cursos/[slug] → ve temario, fechas, sede, precio
→ Pulsa "Inscribirme y pagar"
→ Si no está logueado: /login o /register (con email verification)
→ Una vez logueado, vuelve al curso → confirma inscripción
→ POST /api/enrollments/checkout → Stripe Checkout Session
→ Pago en Stripe (tarjeta)
→ Webhook /api/payments/webhook recibe checkout.session.completed
→ Se crea Enrollment con status=CONFIRMED, paidAt, stripePaymentId
→ Email automático: "Confirmación de inscripción + datos prácticos"
→ El alumno aparece en /mis-cursos
```

### Impartición y diploma
```
Llega el día del curso
→ Instructor entra en /instructor/cursos/[id]/asistencia
→ Marca asistencia de cada alumno por sesión
→ Última sesión:
   - Alumno completa cuestionario "evaluación del curso + instructor" (requisito SENCE)
   - Instructor entra en /instructor/cursos/[id]/evaluacion
     - Registra nota final del examen de cada alumno
     - Completa la evaluación cualitativa de cada alumno (requisito SENCE)
→ Instructor pulsa "Cerrar curso"
→ Sistema evalúa cada Enrollment:
  - asistencia 100%
  - Y (no hasEvaluation O nota_final >= aprobado)
  - Y evaluación alumno → curso/instructor completada
  - Y evaluación instructor → alumno completada
  → status=COMPLETED + emite Diploma
  En caso contrario → status=FAILED (con failedReason indicando qué faltó)
→ Emails automáticos:
  - "Tu diploma está listo" / "No has alcanzado los requisitos: <motivo>"
  - Si falta evaluación del alumno: "Tienes pendiente completar el cuestionario para
    recibir el diploma" (con link al formulario)
```

*[PENDIENTE G19: el plazo y el formato exacto de los cuestionarios están sin definir. Mientras tanto el flujo lo mantenemos descrito como aspiracional — la implementación final puede ajustar tiempos según la normatividad SENCE.]*

### Verificación pública de un diploma
```
Cualquiera escanea el QR → /verify/[code]
→ Muestra: nombre alumno, curso, fecha emisión, estado (ACTIVE/REVOKED), instructor

Llamada programática (Clavero u otra plataforma):
GET /api/diplomas/[code]/verify
→ JSON: { ok, diploma: { studentName, courseTitle, courseHours, issuedAt, status, schoolName: "SecuritasEtSalus" } }
```

### Cancelación / reembolso

Política escalonada por días de antelación al primer día del curso:

| Antelación | Reembolso |
|---|---|
| ≥ 28 días | 100% |
| 28 – 14 días | 75% |
| 14 – 4 días | 50% |
| 96 – 48 h | 25% |
| < 48 h o no asiste | 0% |

Cuando es **SES** quien cancela el curso (cupo insuficiente, indisponibilidad del instructor, fuerza mayor), el alumno recibe **siempre el 100%** del reembolso o crédito para otro curso, a su elección.

---

## Soporte multirregión

**Arranque: solo Chile.** En Fase 0 SES opera únicamente con cursos en territorio chileno. El campo `region` (ISO 3166-2) está en el modelo desde el día uno para no tener que migrar después, pero todos los cursos arrancan con `region` chilena. El rol `REGION_ADMIN` no se implementa aún — el `SUPER_ADMIN` gestiona todo. Cuando SES escale a otros países LATAM, se introduce `REGION_ADMIN` igual que en Clavero.

**Multi-currency preparado:** la columna `Course.currency` existe desde el inicio con `'CLP'` por defecto. Stripe Checkout usa `price_data` dinámico, lo que ya soporta cualquier moneda sin cambios de código. El día que entre otro país basta con crear cursos con otra `currency`.

---

## Notas importantes

- Los cursos son **100% presenciales**. La plataforma no aloja vídeo ni LMS.
- Material post-curso (PDF de apuntes, recursos descargables) se almacena en R2 y se entrega vía URLs firmadas a los inscritos.
- Diplomas son archivos PDF con QR integrado, almacenados en R2 y servidos con URLs firmadas (15 min).
- El webhook de Stripe en `/api/payments/webhook` es **idempotente** (mismo patrón que Clavero) — un mismo `stripePaymentId` no genera doble inscripción.
- El código (variables, rutas, funciones) se escribe **en inglés**. La interfaz de usuario se presenta **en español**.
- SES es **autofinanciada** y se constituye como **SpA chilena nueva**, separada legalmente de ClaveroCerrajero. Capital social inicial y reparto societario *[PENDIENTE: confirmar valores específicos]*.

---

## Identidad de marca

- **Nombre:** SecuritasEtSalus *(latín: "seguridad y bienestar")*
- **Posicionamiento:** Escuela técnica seria, formación rigurosa, instructores con experiencia real en el oficio.
- **Tono:** Profesional pero accesible, didáctico, no corporativo.
- **Paleta:** verdes institucionales derivados del logo. Color de marca `#2c5f4a`. Detalle completo en [design-system.md](design-system.md#paleta-de-colores).
- **Tipografía:** Display: **Fraunces**. Body: **Inter**. Mono: **JetBrains Mono**.
- **Logo:** escudo con águila protegiendo a dos polluelos — iconografía del nombre "Securitas et Salus" (seguridad y bienestar). Dos versiones: emblema simple (escudo) y sello completo (escudo en círculo con texto "SECURITAS · ET · SALUS" y rama de laurel).

---

## Roadmap sugerido (resumen — ver [phases.md](phases.md) para detalle)

1. Setup técnico (Next.js + Prisma + Auth)
2. Landing institucional
3. Auth + roles
4. CRUD de cursos con sesiones múltiples (admin/instructor)
5. Catálogo público + auto-inscripción con Stripe
6. Asistencia + evaluación + emisión automática de diplomas
7. Verificación pública del diploma + endpoint para Clavero
8. Emails transaccionales
9. Tests + auditoría + lanzamiento
