/**
 * Helpers de configuración R2 que NO dependen del AWS SDK.
 *
 * Existe separado de `lib/r2.ts` porque importar el SDK en componentes server
 * que solo necesitan saber si R2 está configurado (p.ej. AppHeader para
 * decidir si pedir avatarKey) arrastra todo el bundle del SDK al chunk de la
 * ruta — y la versión actual del SDK tiene un bug ERR_REQUIRE_ESM con
 * @nodable/entities que rompe en serverless. Lectura de env vars únicamente.
 */

export type R2Bucket = 'diplomas' | 'materials' | 'receipts' | 'avatars';

const BUCKET_ENV_VARS: Record<R2Bucket, string | undefined> = {
  diplomas: process.env.R2_BUCKET_NAME_DIPLOMAS,
  materials: process.env.R2_BUCKET_NAME_MATERIALS,
  receipts: process.env.R2_BUCKET_NAME_RECEIPTS,
  avatars: process.env.R2_BUCKET_NAME_AVATARS,
};

export function isR2Available(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY,
  );
}

export function isBucketConfigured(bucket: R2Bucket): boolean {
  return isR2Available() && Boolean(BUCKET_ENV_VARS[bucket]);
}

export function bucketName(bucket: R2Bucket): string {
  const name = BUCKET_ENV_VARS[bucket];
  if (!name) {
    throw new Error(
      `Bucket R2 "${bucket}" no configurado. Revisa R2_BUCKET_NAME_${bucket.toUpperCase()}.`,
    );
  }
  return name;
}
