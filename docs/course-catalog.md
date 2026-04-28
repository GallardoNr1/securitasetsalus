# Catálogo oficial de cursos — SecuritasEtSalus

Catálogo de referencia pasado por el cofundador el **2026-04-28**. Es la fuente de verdad para qué cursos imparte SES, qué incluye cada uno (formación + hardware) y qué código de competencia Clavero acredita cada uno.

> **Estado:** descrito como referencia. Se introducirá en BD durante **Fase 3** (CRUD admin). Hasta entonces, `lib/mock/courses.ts` mantiene cursos placeholder con valores inventados — **no usar el mock como guía oficial**.

## Sistema de codificación de skills (importante)

Cada curso emite un **código de skill Clavero** al diplomarse. Estos códigos son la fuente de verdad del catálogo de skills que Clavero v2 usará en su `Skill` enum/tabla:

| Código | Descripción | Se obtiene en |
|---|---|---|
| `LE` | Llaves estándar | Cerrajero Residencial Local Junior |
| `LP` | Llaves estándar y de puntos | Cerrajero Residencial Local Avanzado |
| `L3` | Llaves estándar y de puntos con precisión electrónica | Cerrajero Residencial Local Experto |
| `L3 e+` | Igual que `L3`, con acreditación de máquina electrónica avanzada (sufijo condicional) | Cerrajero Residencial Local Experto + acreditación máquina |
| `AB` | Aperturas básicas | Técnico Cerrajero Residencial Inicial |
| `AA` | Aperturas avanzadas | Técnico Cerrajero Residencial Avanzado |
| `AA+` | Aperturas avanzadas + asesor | Técnico Cerrajero Residencial Experto Institucional |
| `V1` | Llaves de vehículos | Cerrajero Automotriz Local |
| `V2` | Aperturas de vehículos | Cerrajero Automotriz – Aperturas |
| `M1` | Técnico instalador cerrajero (cerraduras EU-Perfil) | Módulo Instalador EU-Perfil |
| `M2` | Técnico instalador cerrajero (amaestramientos) | Módulo Amaestramientos |

**Notas sobre la taxonomía:**
- `L*` = Llaves. `A*` = Aperturas residenciales. `V*` = Vehículos. `M*` = Módulos add-on.
- El código `L3 e+` es un sufijo condicional — el código base es `L3`, y el `e+` solo se acredita si SES dispone de la máquina electrónica avanzada certificada.
- Las equivalencias entre estos códigos y las "habilidades catalogadas" del [Pivot v2 propuesto por el hermano](../../clavero/docs/...) (residencial, copia llaves, copia electrónica, automotriz taller, aperturas residenciales, aperturas automotrices, asesoría, amaestramientos, institucional, control accesos) se mapean **en Clavero**, no en SES. SES solo emite el código.

---

## 1. Cerrajería Residencial Local — Copiado mecánico de llaves

### 1.1 Cerrajero Residencial Local Junior (SENCE)
- **Skill emitido:** `LE` (Llaves estándar)
- **Duración:** 8 horas
- **Incluye:** Máquina de llaves estándar + 100 llaves en bruto más comunes
- **Objetivo:** Capacitar al participante para realizar el copiado correcto de llaves residenciales estándar en un local comercial, aplicando criterios técnicos, éticos y de atención básica al cliente.
- **Perfil del alumno:** Personas que desean iniciarse en la cerrajería residencial de local comercial o cerrajeros que buscan formalizar y estandarizar el copiado mecánico de llaves estándar.
- **Contenido:**
  1. Introducción al oficio de cerrajero y principios básicos de ética profesional.
  2. Funcionamiento de las llaves y cerraduras residenciales estándar.
  3. Uso, mantenimiento y calibración de máquinas de copiado mecánico.
  4. Gestión básica del negocio: atención al cliente, inventario y ventas.
  5. Seguridad básica en el local y recomendaciones responsables de productos.

### 1.2 Cerrajero Residencial Local Avanzado (SENCE)
- **Skill emitido:** `LP` (Llaves estándar y de puntos)
- **Duración:** 10 horas
- **Incluye:** Máquina de llaves de puntos + máquina estándar + 200 llaves
- **Prerrequisito:** conocimientos previos en copiado mecánico estándar (p. ej. Junior).
- **Objetivo:** Capacitar al participante para ampliar su alcance técnico al copiado de llaves de puntos y perfiles especiales, mejorando la gestión técnica y comercial del taller.
- **Contenido:**
  1. Todo lo anterior (Junior).
  2. Copiado de llaves de puntos y perfiles especiales.
  3. Diagnóstico y solución de problemas comunes en cerraduras residenciales.
  4. Estrategias de diferenciación y fidelización de clientes en el local.
  5. Gestión avanzada de insumos y servicios de taller.

---

## 2. Cerrajería Residencial Local — Copiado electrónico de llaves

### 2.1 Cerrajero Residencial Local Experto (SENCE)
- **Skill emitido:** `L3` (`L3 e+` si la sede acredita máquina electrónica avanzada)
- **Duración:** 16 horas
- **Incluye:** Máquina electrónica multipropósito + 500 llaves
- **Prerrequisito:** experiencia previa en copiado mecánico.
- **Objetivo:** Capacitar al cerrajero residencial para realizar copiado electrónico de llaves de alta precisión en local comercial.
- **Contenido:**
  1. Introducción al oficio y ética aplicada al copiado de alta precisión.
  2. Funcionamiento de llaves y cerraduras residenciales de alta seguridad.
  3. Uso, mantenimiento y calibración de máquinas electrónicas de copiado.
  4. Introducción a copiado y codificación electrónica de llaves de auto (visión superficial).
  5. Introducción a sistemas de control de acceso electrónicos (visión superficial).
  6. Reparación y mantenimiento básico en local comercial.
  7. Introducción a ventas y negociación: comunicación con el cliente (DISC + escucha activa).
  8. Gestión integral del negocio y asesoría básica en seguridad residencial.

---

## 3. Técnico Cerrajero Residencial (servicio en terreno)

### 3.1 Técnico Cerrajero Residencial Inicial (SENCE)
- **Skill emitido:** `AB` (Aperturas básicas)
- **Duración:** 8 horas
- **Incluye:** Herramientas básicas para aperturas
- **Objetivo:** Capacitar al participante para realizar aperturas residenciales básicas de forma segura, ética y documentada.
- **Contenido:**
  1. Introducción al oficio y ética profesional.
  2. Funcionamiento de llaves y cerraduras residenciales.
  3. Principios de apertura de puertas y cerraduras.
  4. Técnicas no destructivas y destructivas básicas.
  5. Seguridad personal y del cliente durante la intervención.
  6. Documentación y reporte básico de intervenciones.

### 3.2 Técnico Cerrajero Residencial Avanzado (SENCE)
- **Skill emitido:** `AA` (Aperturas avanzadas)
- **Duración:** 16 horas
- **Incluye:** Herramientas avanzadas + módulo de asesoría en seguridad
- **Prerrequisito:** experiencia en aperturas básicas (p. ej. Inicial).
- **Contenido:**
  1. Todo lo anterior (Inicial).
  2. Asesoría en seguridad residencial: diagnóstico de vulnerabilidades.
  3. Recomendación e instalación de dispositivos de seguridad (cerraduras, cerrojos, refuerzos, mirillas).
  4. Comunicación efectiva con el cliente: ventas y negociación (DISC + escucha activa).

---

## 4. Técnico Seguridad 360°

### 4.1 Técnico Cerrajero Residencial Experto Institucional (SENCE)
- **Skill emitido:** `AA+` (Aperturas avanzadas + asesor)
- **Duración:** 40 horas
- **Incluye:** Herramientas especializadas + módulo de control de accesos mecánicos y electrónicos
- **Prerrequisito:** haber completado los cursos residenciales avanzados (Experto + Avanzado).
- **Objetivo:** Integrar competencias avanzadas en cerrajería residencial, asesoría en seguridad, amaestramientos y control de accesos, orientadas a entornos institucionales y profesionales.
- **Contenido:**
  1. Cerrajero Residencial Local Experto (SENCE).
  2. Técnico Cerrajero Residencial Avanzado (SENCE).
  3. Amaestramientos y sistemas de combinación de cerraduras.
  4. Amaestramientos de cerraduras y sistemas de control de acceso electrónicos.
  5. Instalación y configuración de sistemas avanzados internacionales EU y SFIC (barras transversales, cilindros de alta seguridad, etc.).
  6. Certificación, estándares y normativas aplicables.

---

## 5. Módulos (add-ons)

> Los módulos no son cursos completos sino formaciones cortas de 4h que se acoplan a un curso base ya cursado.

### 5.1 Instalador de Cerraduras EU-Perfil
- **Skill emitido:** `M1` (Técnico instalador cerrajero)
- **Duración:** 4 horas
- **Incluye:** Herramientas para el cajeado
- **Objetivo:** Capacitar para instalar cerraduras EU-Perfil correctamente y conforme a normativa.
- **Contenido:**
  1. Prácticas de instalación de cerraduras EU-Perfil.
  2. Medidas y criterios técnicos de instalación.
  3. Normativas que regulan las cerraduras EU-Perfil.
  4. Instalación en puertas de madera y metal.

### 5.2 Amaestramientos y Sistemas de Combinación de Cerraduras
- **Skill emitido:** `M2` (Técnico instalador cerrajero)
- **Duración:** 4 horas
- **Incluye:** Herramientas básicas para manipular cilindros EU-Perfil
- **Prerrequisito:** conocimientos previos en instalación de cerraduras EU-Perfil (p. ej. M1).
- **Contenido:**
  1. Normativas aplicables a cerraduras y cilindros EU-Perfil.
  2. Medidas y criterios técnicos en amaestramientos.
  3. Lógica de cálculo de un amaestramiento.
  4. Limitaciones técnicas y marco de aplicación.
  5. Reparaciones y cambios de combinaciones.
  6. Administración y asesoramiento al cliente.

---

## 6. Cerrajería Automotriz

### 6.1 Cerrajero Automotriz Local (SENCE)
- **Skill emitido:** `V1` (Llaves de vehículos)
- **Duración:** 16 horas
- **Incluye:** Herramientas y dispositivos para copiado y codificación electrónica de llaves de vehículos
- **Objetivo:** Capacitar para generar y programar llaves automotrices en entorno de taller, aplicando criterios técnicos, legales y de seguridad.
- **Contenido:**
  1. Clasificación de llaves automotrices y evolución de los sistemas de seguridad vehicular.
  2. Funcionamiento básico de los sistemas de inmovilización: llave, BCM y ECU.
  3. Identificación correcta de llaves, blades, transponders, controles remotos y smart keys.
  4. Uso seguro y correcto de máquinas de corte automotriz y programadores electrónicos.
  5. Procedimientos de copiado mecánico y generación de llaves por código en banco.
  6. Programación de llaves electrónicas mediante diagnóstico (OBD).
  7. Diagnóstico y resolución de errores habituales en programación e inmovilización.
  8. Seguridad, legalidad y buenas prácticas en gestión de llaves y datos del vehículo.

### 6.2 Cerrajero Automotriz – Aperturas (SENCE)
- **Skill emitido:** `V2` (Aperturas de vehículos)
- **Duración:** 16 horas
- **Incluye:** Herramientas para la apertura de vehículos
- **Objetivo:** Capacitar para realizar aperturas automotrices de forma segura, legal y profesional.
- **Contenido:**
  1. Rol, responsabilidades y límites del técnico de aperturas automotrices.
  2. Tipos de cerraduras automotrices y particularidades de puertas, maleteros e ignición.
  3. Identificación y uso correcto de herramientas de apertura no destructiva.
  4. Técnicas de apertura no destructiva según tipo de vehículo y sistema de cierre.
  5. Criterios técnicos y éticos para técnicas destructivas controladas.
  6. Procedimientos de apertura en vehículos con cierre centralizado y sistemas electrónicos activos.
  7. Riesgos asociados a airbags, sistemas eléctricos y daños colaterales.
  8. Marco legal, verificación de legitimidad del servicio y documentación mínima del trabajo.

---

## Implicaciones para el modelo de datos (a aplicar en Fase 3)

Cuando llegue la Fase 3 (CRUD admin), el schema actual de `Course` necesitará ajustes basados en el catálogo oficial:

### Categorías

Las categorías actuales en `lib/mock/courses.ts` (`cerrajeria | control-accesos | seguridad-fisica | automotriz`) **no encajan** con la estructura oficial. Cuando reescribamos el catálogo en BD, considerar:

```ts
enum CourseTrack {
  RESIDENCIAL_LOCAL_MECANICO   // Sección 1 — local con copia mecánica
  RESIDENCIAL_LOCAL_ELECTRONICO // Sección 2 — local con máquina electrónica
  TECNICO_RESIDENCIAL          // Sección 3 — servicio en terreno
  TECNICO_360                  // Sección 4 — institucional integrador
  MODULO_ADDON                 // Sección 5 — add-ons cortos de 4h
  AUTOMOTRIZ                   // Sección 6
}

enum CourseLevel {
  JUNIOR        // o INICIAL en aperturas
  AVANZADO
  EXPERTO
  EXPERTO_INST  // Solo aplica al 4.1
  MODULO        // Para módulos add-on (sin nivel)
}
```

### Skill emitido (relación con Clavero)

El campo `eligibleForClaveroProfessionalCert: boolean` en `Course` **no es suficiente**: necesitamos saber **qué código** emite cada curso, no solo si emite alguno. Propongo añadir:

```prisma
model Course {
  // ...
  claveroSkillCode  String?  // 'LE' | 'LP' | 'L3' | 'AB' | 'AA' | 'AA+' | 'V1' | 'V2' | 'M1' | 'M2'
  claveroSkillSuffix String?  // 'e+' cuando la sede tiene máquina electrónica avanzada
}
```

Esto reemplaza al boolean actual: si `claveroSkillCode` es null, el curso no emite skill (no es input para certificación profesional Clavero); si tiene valor, sí lo es.

Y en la respuesta del endpoint público (`/api/diplomas/[code]/verify` — Fase 6), el `eligibleForClaveroProfessionalCert: true` se complementa con `claveroSkillCode: 'LE'` para que Clavero pueda mapearlo directamente al skill correspondiente.

### Prerrequisitos

Varios cursos requieren haber cursado uno previo (Avanzado tras Junior, Experto Institucional tras Experto + Avanzado). Considerar:

```prisma
model Course {
  // ...
  prerequisiteSkillCodes String[]  // p. ej. ['LE'] para el Avanzado
}
```

En Fase 3, al inscribirse un alumno, se valida que tenga los skills previos (consultando sus diplomas SES anteriores). En Fase 4 esto bloquea el checkout si falta requisito.

### Hardware incluido (kit del curso)

Todos los cursos del catálogo "incluyen" hardware/herramientas además de la formación. Esto afecta a:

- **Logística** — el admin necesita asegurarse de tener stock antes de publicar el curso. Considerar `Course.kitInventoryAvailable: Int` o similar para el control.
- **Pricing** — el precio del curso incluye el kit. Un alumno SENCE quizá quiere SOLO formación sin kit (porque la empresa ya le da herramientas) — futura decisión, no MVP.
- **Comunicación** — el listado público debe mostrar claramente lo que se entrega. La descripción ya lo incluye; añadir además un campo estructurado:

```prisma
model Course {
  // ...
  includedKit String?  // markdown list — "Máquina de llaves estándar + 100 llaves en bruto"
}
```

### Marca SENCE

**Todos** los cursos del catálogo oficial llevan "(SENCE)" en el nombre. En Fase 3, el admin marcará `senceEligible: true` para todos por defecto.

---

## Decisiones que quedan pendientes (no urgentes, pero apuntadas)

- **Precios oficiales por curso** — el catálogo describe contenido pero no precios. El cofundador los define cuando esté la SpA constituida y se haya cerrado la cuenta de Stripe. Mientras tanto los mock están con valores inventados solo a efectos de Fase 1.
- **Requisitos de máquina electrónica avanzada** para emitir `L3 e+` — pendiente confirmar qué máquina exactamente y cómo se acredita ante SENCE/Clavero.
- **Sedes y calendarios reales** — el catálogo no fija calendarios. En Fase 3 el admin crea cada `Course` con sus sesiones específicas en función de la disponibilidad del instructor y la sede.
- **Módulos add-on (M1, M2): ¿se inscriben sueltos o solo como paquete con curso base?** El catálogo los describe como acoplables a un curso base. En BD podrían ser cursos publicables independientes con prerrequisito explícito, o un sub-tipo "ampliación" que solo aparece dentro de la página de detalle del curso base.
- **Cursos integradores (Sección 4)** — el "Experto Institucional" "incluye" otros cursos. ¿Son una matrícula única que da acceso a todos los componentes, o se considera un macro-curso de 40h independiente que repite los contenidos? Probablemente lo segundo (40h directas) pero confirmar con el cofundador.
