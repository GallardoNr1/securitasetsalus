# SecuritasEtSalus

Escuela de formación profesional en cerrajería y seguridad para Latinoamérica. Imparte cursos presenciales y emite diplomas verificables.

> **Relación con Clavero:** SecuritasEtSalus (SES) es una empresa **independiente** de ClaveroCerrajero. SES forma; Clavero certifica. Un diploma de SES es uno de los inputs que Clavero acepta para emitir su Certificado Profesional, pero ambas plataformas operan por separado, con dominios distintos, bases de datos distintas y responsabilidad legal separada.

## Documentación

| Documento | Descripción |
|---|---|
| [docs/project-brief.md](docs/project-brief.md) | Qué es SES, lógica de negocio, flujos principales |
| [docs/stack.md](docs/stack.md) | Stack tecnológico completo con justificación de cada elección |
| [docs/infrastructure.md](docs/infrastructure.md) | Hosting, base de datos, almacenamiento, pagos, emails |
| [docs/phases.md](docs/phases.md) | Fases de desarrollo detalladas con tareas y entregables |
| [docs/design-system.md](docs/design-system.md) | Design system: tokens, componentes, reglas de uso |
| [docs/rules.md](docs/rules.md) | Reglas del proyecto — nomenclatura, git, calidad, seguridad |
| [docs/deployment.md](docs/deployment.md) | Dominio, DNS, Vercel, env vars en producción |
| [docs/integration-clavero.md](docs/integration-clavero.md) | Contrato de verificación de diplomas SES ↔ Clavero |
| [docs/course-catalog.md](docs/course-catalog.md) | **Catálogo oficial de cursos** con códigos de skill Clavero (referencia para Fase 3) |
| [docs/decisions-pending.md](docs/decisions-pending.md) | 18 decisiones planteadas al inicio (17 cerradas) |

## Regla principal

> **Después de cada fase, documentar en `docs/phases/phase-X-done.md` qué se construyó, qué decisiones se tomaron y qué problemas se resolvieron. Sin esta documentación, la fase no se considera cerrada.**

## Setup local

**Requisitos:** Node.js ≥ 20, npm ≥ 10.

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env.local

# 3. Generar cliente de Prisma
npm run prisma:generate

# 4. Arrancar servidor de desarrollo
npm run dev
# → http://localhost:3000
```

## Estado actual

Documentación inicial. Sin código todavía. Ver [docs/phases.md](docs/phases.md) para el plan.
