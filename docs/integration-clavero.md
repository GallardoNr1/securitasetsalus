# Integración SES ↔ Clavero

Este documento define el **contrato técnico** entre SecuritasEtSalus (SES) y ClaveroCerrajero. Es la única superficie de comunicación entre ambas plataformas.

> **Principio:** SES y Clavero son sistemas independientes. No comparten BD, ni cuenta de usuarios, ni autenticación. La única comunicación es **HTTP público sobre TLS**, y siempre la inicia Clavero (consumidor) hacia SES (proveedor).

---

## Por qué este contrato existe

Cuando un cerrajero quiere obtener su Certificado Profesional en Clavero, debe demostrar que tiene formación. Una de las opciones aceptadas es presentar un diploma de SES (la otra es un diploma OTEC SENCE externo, que se verifica de otra manera).

El cerrajero introduce el código del diploma SES en su solicitud de certificación en Clavero. Clavero llama a un endpoint público de SES para validar:

1. Que el código corresponde a un diploma real.
2. Que el diploma sigue activo (no revocado).
3. Que el alumno del diploma coincide razonablemente con el usuario de Clavero (cross-check de nombre/email).
4. Qué curso acredita (para mapear el diploma a las skills certificables en Clavero).

---

## Endpoint: `GET /api/diplomas/[code]/verify`

**Hosteado por:** SES.
**Consumido por:** cualquiera. Clavero es el consumidor previsto, pero el endpoint es público (igual que `/verify/[code]` en el navegador).

### Request

```http
GET /api/diplomas/ABC123XYZ/verify HTTP/1.1
Host: ses.agsint.cl
Accept: application/json
```

Sin autenticación. CORS abierto (`Access-Control-Allow-Origin: *`).

### Response — diploma válido

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: public, max-age=60, s-maxage=300
```

```json
{
  "ok": true,
  "diploma": {
    "code": "ABC123XYZ",
    "studentName": "Juan Pérez González",
    "studentEmail": "j***@gmail.com",
    "courseTitle": "Cerrajería Residencial — Nivel Básico",
    "courseSlug": "cerrajeria-residencial-basico",
    "courseHours": 24,
    "issuedAt": "2026-03-15T00:00:00.000Z",
    "status": "ACTIVE",
    "schoolName": "SecuritasEtSalus",
    "schoolDomain": "ses.agsint.cl",
    "instructorName": "Andrea Salazar",
    "region": "CL-RM",
    "eligibleForClaveroProfessionalCert": true
  }
}
```

**Importante:** `eligibleForClaveroProfessionalCert` se incluye **siempre** en la respuesta. Si es `false`, Clavero rechaza el diploma como input para certificación profesional aunque el resto sea válido. El diploma sigue siendo verificable públicamente (acredita la formación recibida), pero no se acepta como prueba de competencia técnica para certificación de cerrajero.

### Response — diploma revocado

```json
{
  "ok": true,
  "diploma": {
    "code": "ABC123XYZ",
    "status": "REVOKED",
    "revokedAt": "2026-03-20T00:00:00.000Z",
    "revocationReason": "academic_fraud"
  }
}
```

Aun siendo `ok: true` (la consulta funcionó), Clavero debe rechazar este diploma por estar `REVOKED`.

### Response — código no encontrado

```http
HTTP/1.1 404 Not Found
```

```json
{
  "ok": false,
  "error": "DIPLOMA_NOT_FOUND"
}
```

### Response — rate limit excedido

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```

```json
{
  "ok": false,
  "error": "RATE_LIMITED"
}
```

---

## Privacidad de datos en la respuesta

El endpoint devuelve **datos no sensibles**, suficientes para validar el diploma sin exponer información personal:

- ✅ `studentName` completo (es público — aparece en el PDF del diploma).
- ✅ `studentEmail` **enmascarado** (`j***@gmail.com`) — útil para que Clavero confirme coincidencia razonable con su usuario, sin exponer email completo.
- ✅ Datos del curso (título, horas, fechas).
- ✅ Datos del instructor (nombre).
- ❌ **No** se expone: dirección, teléfono, fecha nacimiento, foto, notas de evaluación, asistencia detallada por sesión, ni email completo.

---

## Caché y rate limiting

- **Cache hint:** `Cache-Control: public, max-age=60, s-maxage=300`. Vercel Edge cachea 5 min, navegadores 1 min.
- **Rate limiting:** 60 requests/minuto por IP. Excederlo devuelve 429.
- Clavero implementa **caché en su lado** (BD o memoria) por código de diploma con TTL 24h para evitar consultas repetidas.

---

## Flujo completo desde Clavero

```
Cerrajero en Clavero → /onboarding/certificate → "Adjuntar diploma SES"
  ↓
Introduce código del diploma SES (en el PDF que tiene)
  ↓
Clavero backend → fetch('https://ses.agsint.cl/api/diplomas/<code>/verify')
  ↓
Si ok=true y status=ACTIVE:
  - Cross-check: studentName ≈ user.name del cerrajero en Clavero
    (matching aproximado — al menos coincide el primer apellido)
  - Cross-check: studentEmail enmascarado coincide con primera letra + dominio
    del email del cerrajero en Clavero
  - Mapeo: courseSlug → skills de Clavero (tabla de mapeo en BD de Clavero)
  - Marca el requisito "formación" como cumplido en CertificationApplication
  - Guarda referencia: { source: "SES", code, verifiedAt }
Si ok=false o status=REVOKED:
  - Marca el requisito como no cumplido
  - Muestra error al cerrajero con el motivo
```

---

## Filtrado de cursos elegibles + mapeo a skills

El catálogo de SES contiene cursos heterogéneos: algunos son de cerrajería profesional aplicable a la certificación de Clavero, otros son formación genérica en seguridad o talleres puntuales que no aplican. Para gestionar esto:

### En SES — flag por curso

Cada `Course` en SES lleva un campo:

```ts
eligibleForClaveroProfessionalCert: boolean  // default false
```

El admin de SES marca este flag al crear o editar el curso. Solo los cursos con el flag en `true` se exponen en el endpoint de verificación con un atributo adicional `eligibleForClaveroProfessionalCert: true` en la respuesta JSON. Los cursos con el flag en `false` siguen siendo verificables públicamente (el diploma sigue siendo legítimo) pero no son input válido para Clavero.

### En Clavero — mapeo a skills

Cuando un cerrajero presenta un diploma SES, Clavero:

1. Llama al endpoint público de verificación.
2. Comprueba que `diploma.eligibleForClaveroProfessionalCert === true`.
3. Busca en su tabla local `SesCoursesMap` qué skills habilita ese `courseSlug`. Si el curso no está mapeado, **un SUPER_ADMIN de Clavero debe configurarlo una sola vez**:

```ts
// En BD de Clavero
SesCoursesMap {
  sesCourseSlug          String   @unique   // "cerrajeria-residencial-basico"
  enablesSkillCodes      String[]           // ["RESIDENTIAL_REPAIR", "KEY_COPYING"]
  minDurationHours       Int                // 24
  mappedAt               DateTime
  mappedBy               String              // userId del SUPER_ADMIN que mapeó
}
```

**Razonamiento del diseño:**

- SES tiene control sobre **qué cursos son elegibles** (no todos lo son — auto-control).
- Clavero tiene control sobre **qué skills habilita cada curso elegible** (no se auto-mapea — Clavero decide qué competencias acredita ese curso para su certificación).
- Un curso elegible nuevo en SES no se auto-acepta en Clavero hasta que un admin de Clavero lo mapee. Pero ese mapeo es **una sola vez por curso**, no por diploma.

---

## Versionado del contrato

El endpoint **no lleva versión en la URL** por ahora (es v1 implícita). Si en el futuro hay cambios incompatibles:

- Añadir nueva versión: `/api/diplomas/[code]/verify/v2`.
- Mantener v1 funcionando durante al menos 6 meses tras anunciar deprecación.
- Comunicar a Clavero el cambio con antelación (al ser un único consumidor conocido, esto es trivial).

---

## Posibles extensiones futuras

### Webhook outbound (SES notifica a Clavero)

**Decisión:** no se implementa en MVP. Razones:

- Los diplomas SES **no caducan** (acreditan un hecho histórico — la formación). La revocación solo ocurre por fraude académico u error en emisión, situaciones raras.
- Clavero **re-consulta el endpoint público** cada vez que el cerrajero renueva su Certificado Profesional anual, así que detecta una revocación con un máximo de 12 meses de retraso.
- Implementar webhook bidireccional añade complejidad significativa: secret compartido, firma HMAC, retry logic, deduplicación, alta operacional para mantener el contrato.

Si en el futuro se necesita reactividad inmediata (p. ej. un caso de fraude que requiera revocar el certificado profesional en horas), se puede añadir entonces.

### Endpoint de listado por usuario

`GET /api/users/[email]/diplomas` — devolvería todos los diplomas asociados a ese email (con autenticación cruzada). Útil si un cerrajero quiere "importar" todos sus diplomas SES de golpe a Clavero.

**Decisión:** no se implementa en MVP. El cerrajero introduce el código de cada diploma manualmente — fricción aceptable porque normalmente solo tendrá 1-2 diplomas SES relevantes para certificación. Se añade si el feedback de los primeros usuarios indica que es necesario.

---

## Resumen del contrato

| Punto | Valor |
|---|---|
| Quién hostea | SES |
| Quién consume | Clavero (y verificadores humanos vía navegador) |
| Endpoint | `GET https://<ses-dominio>/api/diplomas/[code]/verify` |
| Auth | Ninguna (público) |
| Rate limit | 60 req/min por IP |
| Cache | Edge 5 min, navegador 1 min |
| Privacidad | Email enmascarado, sin datos sensibles |
| Versionado | v1 implícita, futura `/v2` si rompe compatibilidad |
| Webhook revocación | No (los diplomas SES no caducan; Clavero re-consulta al renovar) |
| Filtro de elegibilidad | Flag `eligibleForClaveroProfessionalCert` por curso en SES + mapeo `cursoSES → skills` manual en Clavero |
