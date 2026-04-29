# Fase 6 — Verificación pública del diploma + integración con Clavero

**Cierre:** 2026-04-29.
**Estado:** ✅ completada.

## Qué se construyó

### 1. Endpoint JSON público `GET /api/diplomas/[code]/verify`

Sin auth. CORS abierto (`*`). Sirve para que cualquier integración tercera (Clavero, empleadores, autoridades, aseguradoras) compruebe la autenticidad de un diploma SES.

**Validaciones:**

- Normaliza el código a mayúsculas y trim antes de validar.
- Regex estricta — solo charset del generador (sin 0/O/1/I/L). Rechaza inputs malformados con 400 antes de tocar BD.
- Códigos válidos pero no existentes → 404.
- Códigos `REVOKED` → 410 Gone (semántica HTTP correcta para "existió pero ya no es válido"), con motivo y fecha de revocación.
- Códigos `ACTIVE` → 200 con datos del diploma.

**Shape de la respuesta 200 (ACTIVE):**

```json
{
  "code": "SES-A4F2-9P3X",
  "status": "ACTIVE",
  "issuedAt": "2026-04-29T12:34:56.789Z",
  "course": {
    "title": "Aperturas Básicas — Demo",
    "slug": "aperturas-basicas-demo",
    "durationHours": 12,
    "venueName": "Sede Demo SES",
    "region": "CL",
    "subdivision": "RM",
    "claveroSkillCode": "AB",
    "claveroSkillSuffix": null
  },
  "user": {
    "name": "Carla Pérez"
  }
}
```

**Datos NO expuestos (decisión deliberada):**

- Email del alumno → privacidad. Solo nombre.
- `enrollmentId`, `userId`, `pdfKey` → IDs internos.
- Datos de pago, asistencia o evaluación → irrelevantes para verificación pública.

**Headers CORS:**

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
```

`OPTIONS` también responde para preflight de browsers.

**Rate limit:** ninguno explícito por ahora. Confiamos en:
- El espacio de combinaciones del código (~10^12 — no enumerable).
- Las protecciones por defecto de Vercel.
- Si vemos abuso real en logs, añadir `@upstash/ratelimit` por IP.

### 2. Página pública `/verify/[code]`

Reemplaza el placeholder de Fase 1. Ahora hace lookup real con la misma query que el endpoint JSON (`findDiplomaByCodePublic`).

**Cuatro estados de UI:**

1. **Formato inválido** (regex falla) → mensaje pedagógico explicando el formato correcto.
2. **No encontrado** → "este código no corresponde a ningún diploma".
3. **Revocado** → badge rojo + motivo + fecha de revocación.
4. **Activo** → tarjeta de diploma verificado con nombre del alumno, curso, duración, sede, región, skill Clavero asociado, y nota explicativa de la diferencia entre diploma SES y certificado profesional Clavero.

Todas las variantes incluyen botón "Verificar otro código" → `/verify` y link a inicio.

### 3. Query compartida `findDiplomaByCodePublic(code)`

Vive en `lib/queries/diplomas.ts`. La consumen los dos sitios anteriores. **Solo selecciona campos públicos** — defensa en profundidad para evitar que un cambio futuro accidentalmente exponga PII en el endpoint o la página.

### 4. Tests

`lib/diploma/code.test.ts` — 8 tests:
- Generador: produce códigos en formato correcto, sin caracteres ambiguos, con suficiente entropía (100 códigos sin colisiones).
- Regex: acepta códigos válidos, rechaza prefijos distintos a SES, rechaza longitudes incorrectas, rechaza minúsculas, rechaza chars ambiguos (0/O/1/I/L).

Total tests del repo: **53/53 verde** (antes 45).

## Decisiones tomadas

### El charset del generador y la regex deben coincidir
El generador usa 31 caracteres sin ambigüedad. La regex que valida en el endpoint y en la página usa **el mismo charset explícito** (no `[A-Z2-9]` que sería más permisivo). Esto evita falsos positivos a nivel de formato — si llega algo con `O` o `L`, no puede ser un código válido y rechazamos antes de tocar BD.

### REVOKED devuelve 410 Gone, no 200
Permite a integraciones tipo Clavero distinguir "diploma existe pero ya no acredita" sin tener que parsear el `status` del JSON. Más resistente a errores de implementación del cliente.

### CORS `*` (totalmente abierto)
Es **el caso de uso primario** — terceros consumiendo desde dominios que no controlamos. Y dado que el endpoint solo expone datos públicos por diseño, no hay riesgo asociado.

### Rate limit pospuesto
Implementar rate limit pre-launch sería over-engineering. Los códigos no son enumerables y no hay datos sensibles que vetar. Reactivo: si en logs aparecen patrones de abuso (alta frecuencia de 404 desde una IP), añadir entonces.

## Lo que NO está en Fase 6 (out of scope)

- **Logging de verificaciones** (quién consulta qué código). Útil para auditoría y para ver qué diplomas se consultan, pero no es bloqueante para el flujo Clavero. Si hace falta, modelo `DiplomaVerification` sencillo en una iteración futura.
- **Versioning del API** (`/api/v1/diplomas/...`). Mientras solo Clavero lo consume y los dos repos se desarrollan juntos, no hace falta.
- **Búsqueda por nombre** o por curso. La verificación pública requiere el código exacto — se hace a propósito para evitar fishing de identidad.

## Verificación

```
npm run typecheck   ✓ sin errores
npm run build       ✓ /api/diplomas/[code]/verify generada
npm test            ✓ 53/53 tests
```

**Smoke test manual:**

```bash
# Código válido (reemplazar por uno real del entorno)
curl -i https://securitasetsalus.cl/api/diplomas/SES-A4F2-9P3X/verify
# → 200 con JSON del diploma

# Formato inválido
curl -i https://securitasetsalus.cl/api/diplomas/foo-bar/verify
# → 400 { "error": "invalid_code_format" }

# No existe
curl -i https://securitasetsalus.cl/api/diplomas/SES-ZZZZ-2222/verify
# → 404 { "error": "not_found" }

# Browser
open https://securitasetsalus.cl/verify/SES-A4F2-9P3X
# → tarjeta de verificación
```

## Para Clavero

El contrato API queda fijado en este documento. Cuando Clavero implemente Fase 10c (cliente SES + verificador admin), puede consumir el endpoint sin más coordinación. Ver `docs/v2-refactor-plan.md` §6 en el repo Clavero para los detalles del lado consumidor.

## Próximos pasos

| Bloque | Estado | Bloqueado por |
|---|---|---|
| Fase 4 — Stripe | ⏸️ pausado | SpA chilena |
| Fase 7 — Más emails transaccionales | 🟢 lista | — |
| Limpieza menor (`@react-email/components` 1.x → 2.x) | 🟢 lista | — |
| Cleanup test fixtures eliminados | 🟢 lista | — |

Y en Clavero, **Fase 10b (demolition)** queda desbloqueada para arrancar.
