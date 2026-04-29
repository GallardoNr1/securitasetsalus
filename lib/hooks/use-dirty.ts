'use client';

import { useEffect, useMemo, useState, type RefObject } from 'react';

/**
 * Hook que decide si el formulario tiene cambios respecto a un snapshot inicial.
 *
 * Idea: cualquier botón de "Guardar" se desactiva cuando `isDirty === false`.
 * Así evitamos guardados redundantes y damos feedback visual claro: el botón
 * vuelve a quedar gris en cuanto guardas (porque actualizamos el snapshot).
 *
 * Comparación profunda vía JSON.stringify — adecuada para los payloads planos
 * que manejamos (strings, números, booleanos, arrays cortos, objetos llanos).
 *
 * @example controlado
 * const initial = { name: user.name };
 * const [values, setValues] = useState(initial);
 * const [saved, setSaved] = useState(initial);
 * const isDirty = useIsDirty(saved, values);
 * // tras guardar: setSaved(values);
 */
export function useIsDirty<T>(initial: T, current: T): boolean {
  return useMemo(() => {
    return JSON.stringify(initial) !== JSON.stringify(current);
  }, [initial, current]);
}

/**
 * Variante para forms con inputs uncontrolled (`defaultValue` + FormData).
 *
 * Lee el contenido del form en cada `input`/`change` y lo compara con el
 * snapshot inicial. Permite mantener forms simples (sin convertir cada input
 * a controlado) y aún así tener el botón Guardar desactivado por defecto.
 *
 * @example
 * const formRef = useRef<HTMLFormElement>(null);
 * const [savedSnapshot, setSavedSnapshot] = useState({ name: user.name, ... });
 * const isDirty = useFormDirty(formRef, savedSnapshot);
 * // tras guardar exitoso:
 * //   const fd = new FormData(formRef.current!);
 * //   setSavedSnapshot(Object.fromEntries(fd.entries()) as any);
 */
export function useFormDirty(
  formRef: RefObject<HTMLFormElement | null>,
  savedSnapshot: Record<string, string>,
): boolean {
  // Forzamos re-render en cada evento input/change del form.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const bump = () => setTick((t) => t + 1);
    form.addEventListener('input', bump);
    form.addEventListener('change', bump);
    return () => {
      form.removeEventListener('input', bump);
      form.removeEventListener('change', bump);
    };
  }, [formRef]);

  return useMemo(() => {
    void tick; // depende de tick para recomputarse en cada evento
    const form = formRef.current;
    if (!form) return false;
    const data = new FormData(form);
    // Cualquier campo cuyo valor difiera del snapshot lo marca dirty.
    for (const key of Object.keys(savedSnapshot)) {
      const current = data.get(key);
      const expected = savedSnapshot[key] ?? '';
      // FormData devuelve File para inputs file — los ignoramos aquí.
      if (typeof current !== 'string') continue;
      if (current !== expected) return true;
    }
    return false;
  }, [formRef, savedSnapshot, tick]);
}

/** Helper: serializa un form HTML a un Record<string, string> para comparar. */
export function snapshotForm(form: HTMLFormElement): Record<string, string> {
  const data = new FormData(form);
  const result: Record<string, string> = {};
  for (const [key, value] of data.entries()) {
    if (typeof value === 'string') result[key] = value;
  }
  return result;
}
