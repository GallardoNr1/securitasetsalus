'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label, ErrorMessage, Select, Textarea } from '@/components/ui/Input';
import {
  CLAVERO_SKILL_CODES,
  CLAVERO_SKILL_LABELS,
  CLAVERO_SKILL_SUFFIXES,
  type ClaveroSkillCode,
} from '@/lib/clavero-skills';
import {
  REGION_LABELS,
  SUPPORTED_REGIONS,
  getSubdivisions,
  type SupportedRegion,
} from '@/lib/regions';
import { useFormDirty, useIsDirty } from '@/lib/hooks/use-dirty';
import { createCourseAction, updateCourseAction } from './actions';
import styles from './CourseForm.module.scss';

type Mode = 'create' | 'edit';
type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED';

type SessionInput = {
  id?: string; // solo en edit
  startsAt: string; // ISO local datetime-local format
  endsAt: string;
  location: string;
};

export type CourseFormInitial = {
  title: string;
  slug: string;
  shortDescription: string;
  fullSyllabus: string;
  durationHours: number;
  price: number;
  currency: string;
  capacity: number;
  region: SupportedRegion;
  subdivision: string | null;
  venueName: string | null;
  venueAddress: string | null;
  status: CourseStatus;
  hasEvaluation: boolean;
  senceEligible: boolean;
  claveroSkillCode: ClaveroSkillCode | null;
  claveroSkillSuffix: string | null;
  prerequisiteSkillCodes: string[];
  includedKit: string | null;
  instructorId: string;
  sessions: SessionInput[];
};

type Instructor = { id: string; name: string; email: string };

type Props = {
  mode: Mode;
  /** Solo en edit. */
  courseId?: string;
  initial: CourseFormInitial;
  instructors: Instructor[];
  /** Si true, ocultar/deshabilitar precio + capacidad (curso con alumnos pagados). */
  locked?: boolean;
};

function emptySession(): SessionInput {
  return { startsAt: '', endsAt: '', location: '' };
}

export function CourseForm({ mode, courseId, initial, instructors, locked = false }: Props) {
  const router = useRouter();
  const [region, setRegion] = useState<SupportedRegion>(initial.region);
  const [sessions, setSessions] = useState<SessionInput[]>(
    initial.sessions.length > 0 ? initial.sessions : [emptySession()],
  );
  const [skillCode, setSkillCode] = useState<string>(initial.claveroSkillCode ?? '');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  // Dirty state — el botón Guardar/Crear se desactiva cuando el form
  // coincide con el snapshot inicial. Tras crear, redirigimos así que
  // no necesitamos resetear el snapshot. Tras editar sí.
  const formRef = useRef<HTMLFormElement>(null);
  const initialFormSnapshot: Record<string, string> = {
    title: initial.title,
    slug: initial.slug,
    shortDescription: initial.shortDescription,
    fullSyllabus: initial.fullSyllabus,
    durationHours: String(initial.durationHours),
    price: String(initial.price),
    currency: initial.currency,
    capacity: String(initial.capacity),
    region: initial.region,
    subdivision: initial.subdivision ?? '',
    venueName: initial.venueName ?? '',
    venueAddress: initial.venueAddress ?? '',
    instructorId: initial.instructorId,
    status: initial.status,
    hasEvaluation: initial.hasEvaluation ? 'on' : '',
    senceEligible: initial.senceEligible ? 'on' : '',
    claveroSkillCode: initial.claveroSkillCode ?? '',
    claveroSkillSuffix: initial.claveroSkillSuffix ?? '',
    includedKit: initial.includedKit ?? '',
  };
  const isFieldsDirty = useFormDirty(formRef, initialFormSnapshot);
  // Las sesiones viven en useState propio, así que las comparamos aparte.
  const isSessionsDirty = useIsDirty(initial.sessions, sessions);
  const isDirty = isFieldsDirty || isSessionsDirty;

  function fieldError(name: string): string | undefined {
    return fieldErrors[name];
  }

  function addSession() {
    setSessions((prev) => [...prev, emptySession()]);
  }

  function removeSession(idx: number) {
    setSessions((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateSession(idx: number, patch: Partial<SessionInput>) {
    setSessions((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      setFieldErrors({});

      // Inyecta sesiones en el formData con el patrón sessions[i][campo].
      sessions.forEach((s, i) => {
        formData.set(`sessions[${i}][startsAt]`, s.startsAt);
        formData.set(`sessions[${i}][endsAt]`, s.endsAt);
        formData.set(`sessions[${i}][location]`, s.location);
      });

      if (mode === 'create') {
        const result = await createCourseAction(formData);
        if (!result.ok) {
          setError(result.message);
          if (result.error === 'invalid' && result.fieldErrors) {
            setFieldErrors(result.fieldErrors);
          }
          return;
        }
        router.push(`/admin/cursos/${result.courseId}`);
        router.refresh();
        return;
      }

      if (!courseId) return;
      const result = await updateCourseAction(courseId, formData);
      if (!result.ok) {
        setError(result.message);
        if (result.error === 'invalid' && result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      router.refresh();
    });
  }

  const subdivisions = getSubdivisions(region);

  return (
    <form ref={formRef} action={handleSubmit} className={styles.form} noValidate>
      {error ? <div className={styles.error}>{error}</div> : null}
      {locked ? (
        <div className={styles.warn}>
          Este curso tiene alumnos con inscripción pagada. No puedes modificar precio, moneda
          ni reducir la capacidad.
        </div>
      ) : null}

      {/* ====== Información general ====== */}
      <fieldset className={styles.fieldset}>
        <legend>Información general</legend>

        <Field>
          <Label htmlFor="title" required>
            Título
          </Label>
          <Input
            id="title"
            name="title"
            defaultValue={initial.title}
            required
            error={Boolean(fieldError('title'))}
          />
          {fieldError('title') ? <ErrorMessage>{fieldError('title')}</ErrorMessage> : null}
        </Field>

        <Field>
          <Label htmlFor="slug" required>
            Slug
          </Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={initial.slug}
            required
            placeholder="cerrajeria-residencial-basico"
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            error={Boolean(fieldError('slug'))}
          />
          <p className={styles.hint}>
            URL pública del curso. Solo minúsculas, números y guiones.
          </p>
          {fieldError('slug') ? <ErrorMessage>{fieldError('slug')}</ErrorMessage> : null}
        </Field>

        <Field>
          <Label htmlFor="shortDescription" required>
            Descripción corta
          </Label>
          <Textarea
            id="shortDescription"
            name="shortDescription"
            defaultValue={initial.shortDescription}
            required
            rows={3}
            maxLength={280}
            error={Boolean(fieldError('shortDescription'))}
          />
          <p className={styles.hint}>Aparece en las cards del catálogo. Máximo 280 caracteres.</p>
          {fieldError('shortDescription') ? (
            <ErrorMessage>{fieldError('shortDescription')}</ErrorMessage>
          ) : null}
        </Field>

        <Field>
          <Label htmlFor="fullSyllabus" required>
            Temario completo (Markdown)
          </Label>
          <Textarea
            id="fullSyllabus"
            name="fullSyllabus"
            defaultValue={initial.fullSyllabus}
            required
            rows={12}
            error={Boolean(fieldError('fullSyllabus'))}
          />
          {fieldError('fullSyllabus') ? (
            <ErrorMessage>{fieldError('fullSyllabus')}</ErrorMessage>
          ) : null}
        </Field>

        <Field>
          <Label htmlFor="includedKit">Kit incluido (Markdown)</Label>
          <Textarea
            id="includedKit"
            name="includedKit"
            defaultValue={initial.includedKit ?? ''}
            rows={4}
            placeholder="- Máquina de llaves estándar&#10;- 100 llaves en bruto"
          />
          <p className={styles.hint}>
            Hardware o herramientas que se entregan al alumno. Opcional.
          </p>
        </Field>
      </fieldset>

      {/* ====== Logística ====== */}
      <fieldset className={styles.fieldset}>
        <legend>Logística y precio</legend>

        <div className={styles.row3}>
          <Field>
            <Label htmlFor="durationHours" required>
              Duración (horas)
            </Label>
            <Input
              id="durationHours"
              name="durationHours"
              type="number"
              min={1}
              max={500}
              defaultValue={initial.durationHours}
              required
              error={Boolean(fieldError('durationHours'))}
            />
            {fieldError('durationHours') ? (
              <ErrorMessage>{fieldError('durationHours')}</ErrorMessage>
            ) : null}
          </Field>

          <Field>
            <Label htmlFor="price" required>
              Precio
            </Label>
            <Input
              id="price"
              name="price"
              type="number"
              min={0}
              defaultValue={initial.price}
              required
              disabled={locked}
              error={Boolean(fieldError('price'))}
            />
            {fieldError('price') ? <ErrorMessage>{fieldError('price')}</ErrorMessage> : null}
          </Field>

          <Field>
            <Label htmlFor="currency" required>
              Moneda
            </Label>
            <Select
              id="currency"
              name="currency"
              defaultValue={initial.currency}
              required
              disabled={locked}
            >
              <option value="CLP">CLP — Peso chileno</option>
              <option value="USD">USD — Dólar</option>
              <option value="ARS">ARS — Peso argentino</option>
              <option value="MXN">MXN — Peso mexicano</option>
              <option value="COP">COP — Peso colombiano</option>
              <option value="PEN">PEN — Sol peruano</option>
            </Select>
          </Field>
        </div>

        <div className={styles.row3}>
          <Field>
            <Label htmlFor="capacity" required>
              Capacidad (cupos)
            </Label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              max={200}
              defaultValue={initial.capacity}
              required
              error={Boolean(fieldError('capacity'))}
            />
            {fieldError('capacity') ? (
              <ErrorMessage>{fieldError('capacity')}</ErrorMessage>
            ) : null}
          </Field>

          <Field>
            <Label htmlFor="region" required>
              País
            </Label>
            <Select
              id="region"
              name="region"
              required
              value={region}
              onChange={(e) => setRegion(e.target.value as SupportedRegion)}
            >
              {SUPPORTED_REGIONS.map((code) => (
                <option key={code} value={code}>
                  {REGION_LABELS[code]}
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            <Label htmlFor="subdivision">Región / Provincia</Label>
            <Select
              id="subdivision"
              name="subdivision"
              defaultValue={initial.subdivision ?? ''}
            >
              <option value="">Sin especificar</option>
              {subdivisions.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </Select>
            {fieldError('subdivision') ? (
              <ErrorMessage>{fieldError('subdivision')}</ErrorMessage>
            ) : null}
          </Field>
        </div>

        <div className={styles.row}>
          <Field>
            <Label htmlFor="venueName">Sede</Label>
            <Input
              id="venueName"
              name="venueName"
              defaultValue={initial.venueName ?? ''}
              placeholder="Sede Santiago Centro"
            />
          </Field>

          <Field>
            <Label htmlFor="venueAddress">Dirección</Label>
            <Input
              id="venueAddress"
              name="venueAddress"
              defaultValue={initial.venueAddress ?? ''}
              placeholder="Av. Libertador Bernardo O'Higgins 1234"
            />
          </Field>
        </div>
      </fieldset>

      {/* ====== Instructor ====== */}
      <fieldset className={styles.fieldset}>
        <legend>Instructor</legend>

        <Field>
          <Label htmlFor="instructorId" required>
            Asignar instructor
          </Label>
          <Select
            id="instructorId"
            name="instructorId"
            required
            defaultValue={initial.instructorId}
            error={Boolean(fieldError('instructorId'))}
          >
            <option value="">Selecciona un instructor</option>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.email})
              </option>
            ))}
          </Select>
          {instructors.length === 0 ? (
            <p className={styles.hint}>
              No hay instructores creados aún.{' '}
              <Link href="/admin/usuarios/new">Crea uno desde Usuarios</Link>.
            </p>
          ) : null}
          {fieldError('instructorId') ? (
            <ErrorMessage>{fieldError('instructorId')}</ErrorMessage>
          ) : null}
        </Field>
      </fieldset>

      {/* ====== Sesiones ====== */}
      <fieldset className={styles.fieldset}>
        <legend>Sesiones</legend>

        <p className={styles.hint}>
          Añade una fila por cada día/sesión del curso. Las sesiones se renumeran
          automáticamente al guardar.
        </p>

        {sessions.map((s, i) => (
          <div key={i} className={styles.sessionRow}>
            <span className={styles.sessionNumber}>Sesión {i + 1}</span>
            <Field>
              <Label htmlFor={`session-${i}-start`}>Inicio</Label>
              <Input
                id={`session-${i}-start`}
                type="datetime-local"
                value={s.startsAt}
                onChange={(e) => updateSession(i, { startsAt: e.target.value })}
                required
                error={Boolean(fieldError(`sessions.${i}.startsAt`))}
              />
              {fieldError(`sessions.${i}.startsAt`) ? (
                <ErrorMessage>{fieldError(`sessions.${i}.startsAt`)}</ErrorMessage>
              ) : null}
            </Field>
            <Field>
              <Label htmlFor={`session-${i}-end`}>Fin</Label>
              <Input
                id={`session-${i}-end`}
                type="datetime-local"
                value={s.endsAt}
                onChange={(e) => updateSession(i, { endsAt: e.target.value })}
                required
                error={Boolean(fieldError(`sessions.${i}.endsAt`))}
              />
              {fieldError(`sessions.${i}.endsAt`) ? (
                <ErrorMessage>{fieldError(`sessions.${i}.endsAt`)}</ErrorMessage>
              ) : null}
            </Field>
            <Field>
              <Label htmlFor={`session-${i}-location`}>Sala (opcional)</Label>
              <Input
                id={`session-${i}-location`}
                value={s.location}
                onChange={(e) => updateSession(i, { location: e.target.value })}
                placeholder="Sala A"
              />
            </Field>
            {sessions.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSession(i)}
                className={styles.removeSession}
              >
                Quitar
              </Button>
            ) : null}
          </div>
        ))}

        <Button type="button" variant="secondary" size="sm" onClick={addSession}>
          + Añadir sesión
        </Button>

        {fieldError('sessions') ? <ErrorMessage>{fieldError('sessions')}</ErrorMessage> : null}
      </fieldset>

      {/* ====== Flags pedagógicos y SENCE ====== */}
      <fieldset className={styles.fieldset}>
        <legend>Pedagogía y SENCE</legend>

        <label className={styles.checkbox}>
          <input type="checkbox" name="hasEvaluation" defaultChecked={initial.hasEvaluation} />
          <span>
            <strong>Lleva evaluación final.</strong> Si lo desactivas, el diploma se emite
            solo con asistencia 100%.
          </span>
        </label>

        <label className={styles.checkbox}>
          <input type="checkbox" name="senceEligible" defaultChecked={initial.senceEligible} />
          <span>
            <strong>Apto para franquicia SENCE.</strong> El alumno puede aplicar la
            franquicia tributaria de su empleador en el checkout.
          </span>
        </label>
      </fieldset>

      {/* ====== Mapeo a Clavero ====== */}
      <fieldset className={styles.fieldset}>
        <legend>Mapeo a Clavero</legend>

        <p className={styles.hint}>
          Si el diploma de este curso debe servir como input para certificación profesional
          en Clavero, asigna el código de skill correspondiente. Déjalo en blanco si el
          curso no aplica (formación general, etc.).
        </p>

        <div className={styles.row}>
          <Field>
            <Label htmlFor="claveroSkillCode">Código Clavero</Label>
            <Select
              id="claveroSkillCode"
              name="claveroSkillCode"
              value={skillCode}
              onChange={(e) => setSkillCode(e.target.value)}
            >
              <option value="">No aplica</option>
              {CLAVERO_SKILL_CODES.map((code) => (
                <option key={code} value={code}>
                  {CLAVERO_SKILL_LABELS[code]}
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            <Label htmlFor="claveroSkillSuffix">Sufijo (opcional)</Label>
            <Select
              id="claveroSkillSuffix"
              name="claveroSkillSuffix"
              defaultValue={initial.claveroSkillSuffix ?? ''}
              disabled={!skillCode}
            >
              <option value="">Ninguno</option>
              {CLAVERO_SKILL_SUFFIXES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            {fieldError('claveroSkillSuffix') ? (
              <ErrorMessage>{fieldError('claveroSkillSuffix')}</ErrorMessage>
            ) : null}
          </Field>
        </div>

        <div className={styles.checkboxGrid}>
          <p className={styles.checkboxGridLabel}>
            Prerrequisitos (skills que el alumno debe acreditar para inscribirse)
          </p>
          {CLAVERO_SKILL_CODES.map((code) => (
            <label key={code} className={styles.checkbox}>
              <input
                type="checkbox"
                name="prerequisiteSkillCodes"
                value={code}
                defaultChecked={initial.prerequisiteSkillCodes.includes(code)}
              />
              <span>{CLAVERO_SKILL_LABELS[code]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* ====== Estado y publicación ====== */}
      <fieldset className={styles.fieldset}>
        <legend>Estado</legend>

        <Field>
          <Label htmlFor="status" required>
            Estado del curso
          </Label>
          <Select id="status" name="status" defaultValue={initial.status} required>
            <option value="DRAFT">Borrador (no aparece en el catálogo público)</option>
            <option value="PUBLISHED">Publicado (visible y abierto a inscripciones)</option>
            <option value="CLOSED">Cerrado (curso ya impartido)</option>
            <option value="CANCELLED">Cancelado</option>
          </Select>
        </Field>
      </fieldset>

      <div className={styles.actions}>
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={pending}
          disabled={pending || !isDirty}
        >
          {mode === 'create' ? 'Crear curso' : 'Guardar cambios'}
        </Button>
        <Link href="/admin/cursos" className={styles.cancelLink}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
