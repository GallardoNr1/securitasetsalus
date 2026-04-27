# Decisiones del proyecto — SecuritasEtSalus

Estado de las 18 decisiones que se plantearon al cerrar la documentación inicial. La mayoría están resueltas el **2026-04-28**. Lo que sigue pendiente está marcado claramente abajo.

---

## ✅ Decisiones resueltas

| # | Decisión | Resolución |
|---|---|---|
| **A1** | Alcance geográfico | **Solo Chile en Fase 0.** El campo `region` queda en el modelo para escalar sin romper esquema. `REGION_ADMIN` no se implementa hasta hacer falta. |
| **A2** | OTEC SENCE | **Sí, registrar SES como OTEC SENCE desde el inicio.** Implica papeleo legal previo y datos extra al checkout (RUT del alumno, marcar curso como afecto a franquicia tributaria SENCE, datos de empleador si corresponde). Ver impacto en Fase 4. |
| **A3** | Estructura societaria | **SpA chilena nueva.** Empresa propia, separada de Clavero. Usar el RUT de la SpA en Stripe live, en facturación SENCE y en T&C. |
| **B4** | Umbral de asistencia | **100%** de asistencia para emitir diploma. Más estricto que Clavero. |
| **B5** | Evaluación final | **Configurable por curso, con `true` por defecto.** Al crear un curso, el admin puede desmarcar la evaluación, pero por defecto va activa. Los cursos con evaluación requieren nota mínima de aprobado. |
| **B6** | Política de cancelaciones | **Escalonada con plazos duplicados respecto a la propuesta original.** Tabla final: 100% si ≥28 días, 75% si 28-14 días, 50% si 14-4 días, 25% si 96-48h, 0% si <48h o no asiste. Más generosa que la propuesta inicial — refleja que los cursos presenciales se planifican con bastante antelación. |
| **C7** | Cuenta Stripe | **Cuenta Stripe propia para SES.** Separada de la de Clavero. Se crea con datos de la SpA chilena nueva. |
| **C8** | Moneda | **CLP nativo, con la arquitectura preparada para multi-currency.** Usar `price_data` dinámico en Stripe Checkout (que ya soporta `currency` por sesión sin cambios), y dejar `Course.currency` como columna desde el inicio (con valor por defecto `'CLP'`). El día que entre otro país, basta con crear cursos con otra `currency` sin tocar el código. |
| **D10** | Tipografía | **Display: Fraunces. Body: Inter. Mono: JetBrains Mono.** |
| **E12** | Dominio | **Empezar con `ses.agsint.cl`** y migrar al definitivo cuando la SpA esté constituida. Mismo patrón que Clavero. |
| **E14** | Magic Link | **Sí, añadir Magic Link como provider extra desde el inicio**, además de Credentials. Reduce fricción en alumnos que solo se inscriben a un curso puntual y no quieren recordar contraseña. |
| **F15** | Material de curso descargable | **Diferir** Fase 8 hasta que un instructor lo pida. El MVP no lo incluye. |
| **F16** | Webhook revocación SES → Clavero | **No implementar en MVP.** Contexto: los **diplomas SES no caducan**. La única revocación posible es por fraude académico u error en emisión, situaciones raras. Clavero re-consulta el endpoint público al renovar el certificado anual y se entera entonces. **Naming oficial confirmado:** SES emite "Diplomas". Clavero emite "Certificados Profesionales". Ya está aplicado en toda la documentación. |
| **F17** | Endpoint "todos mis diplomas SES" en bloque | **No en MVP.** Si Clavero lo necesita, se añade después. |
| **F18** | Auditoría de cursos SES por Clavero | **Auto-aceptar pero con flag explícito por curso.** Cada `Course` en SES lleva un campo `eligibleForClaveroProfessionalCert: boolean` que el admin de SES marca al crearlo. Solo los cursos con ese flag aparecen como input válido en Clavero. **Importante:** Clavero sigue manteniendo su propio mapeo `cursoSES → skillsClavero` (un admin de Clavero lo configura una vez por curso elegible), porque el catálogo de SES puede contener formación no relacionada con cerrajería profesional (seguridad genérica, divulgación, talleres puntuales). Ver detalle en [integration-clavero.md](integration-clavero.md). |

---

## ✅ Decisiones cerradas en segunda ronda (2026-04-28)

| # | Decisión | Resolución |
|---|---|---|
| **D9** | Paleta de colores | **Derivada del logo.** Verde institucional `#2c5f4a` (cuerpo del águila) como color de marca, escala completa de verdes hasta `#ecf3ee`, y crema `#c9b87a` extraído del fondo del sello como acento discreto. Detalle completo en [design-system.md](design-system.md#paleta-de-colores). |
| **D11** | Logo | **Recibido en dos versiones.** Versión emblema (escudo con águila protegiendo a polluelos) y versión sello completa (escudo dentro de círculo con texto "SECURITAS · ET · SALUS" y rama de laurel). Iconografía: águila como protección/seguridad, polluelos como alumnos en formación. Conecta directamente con el nombre "seguridad y bienestar". |
| **E13** | Región de Supabase | **`us-east-1` (Virginia)** — mejor latencia a LATAM (~80ms vs ~150ms desde eu-west-1). Decisión consciente de pagar deuda operativa (Clavero está en eu-west-1) a cambio de mejor experiencia de usuario para alumnos chilenos. |

---

## ⏳ Pendientes residuales

Solo quedan datos administrativos no técnicos:

| # | Decisión | Estado |
|---|---|---|
| **A3 detalle** | Capital social inicial de la SpA y reparto societario entre los cofundadores. | Trámite con notario, no afecta al código. |

---

## Cómo se aplicaron las respuestas

Todas las respuestas confirmadas se han propagado en la documentación: project-brief, stack, infrastructure, phases, design-system, deployment, integration-clavero. Cada documento dejó de tener marcadores `[PENDIENTE: ...]` excepto los puntos residuales listados arriba.
