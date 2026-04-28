import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Cliente S3-compatible apuntando a Cloudflare R2.
 * Docs: https://developers.cloudflare.com/r2/api/s3/tokens/
 *
 * SES usa 3 buckets distintos (diplomas, materiales de curso, recibos).
 * El cliente S3 es uno solo (mismo accountId + credentials), pero las
 * operaciones reciben el bucket explícitamente.
 *
 * Si no hay credenciales configuradas, `isR2Available()` devuelve false.
 */

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

export type R2Bucket = 'diplomas' | 'materials' | 'receipts' | 'avatars';

const BUCKET_ENV_VARS: Record<R2Bucket, string | undefined> = {
  diplomas: process.env.R2_BUCKET_NAME_DIPLOMAS,
  materials: process.env.R2_BUCKET_NAME_MATERIALS,
  receipts: process.env.R2_BUCKET_NAME_RECEIPTS,
  avatars: process.env.R2_BUCKET_NAME_AVATARS,
};

/**
 * Devuelve true si el cliente S3 puede instanciarse (credenciales OK).
 * No exige que TODOS los buckets estén configurados — cada operación
 * comprueba el suyo en `bucketName()`. Esto permite arrancar avatares
 * sin tener configurados aún diplomas/materiales/recibos.
 */
export function isR2Available(): boolean {
  return Boolean(accountId && accessKeyId && secretAccessKey);
}

/** Comprueba si un bucket específico está configurado. */
export function isBucketConfigured(bucket: R2Bucket): boolean {
  return isR2Available() && Boolean(BUCKET_ENV_VARS[bucket]);
}

function bucketName(bucket: R2Bucket): string {
  const name = BUCKET_ENV_VARS[bucket];
  if (!name) {
    throw new Error(`Bucket R2 "${bucket}" no configurado. Revisa R2_BUCKET_NAME_${bucket.toUpperCase()}.`);
  }
  return name;
}

let cachedClient: S3Client | null = null;

function getClient(): S3Client {
  if (!isR2Available()) {
    throw new Error('R2 no está configurado. Revisa las variables de entorno R2_*.');
  }
  if (cachedClient) return cachedClient;

  cachedClient = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
  });
  return cachedClient;
}

/** Sube un buffer al bucket especificado bajo `key` y devuelve esa misma key. */
export async function uploadBuffer(
  bucket: R2Bucket,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: bucketName(bucket),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return key;
}

/**
 * URL firmada GET con expiración configurable.
 * - Diplomas: 15 min (default).
 * - Materiales: 24 h (más amable para alumnos que descargan varias veces).
 * - Recibos: 1 h.
 */
export async function getSignedDownloadUrl(
  bucket: R2Bucket,
  key: string,
  options: { expiresInSeconds?: number; filename?: string } = {},
): Promise<string> {
  const client = getClient();
  const { expiresInSeconds = 900, filename } = options;
  const command = new GetObjectCommand({
    Bucket: bucketName(bucket),
    Key: key,
    ...(filename ? { ResponseContentDisposition: `inline; filename="${filename}"` } : {}),
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function deleteObject(bucket: R2Bucket, key: string): Promise<void> {
  const client = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucketName(bucket),
      Key: key,
    }),
  );
}

/** Convenciones de keys por bucket. */
export const r2Keys = {
  diplomaPdf: (userId: string, diplomaId: string) => `${userId}/${diplomaId}.pdf`,
  courseMaterial: (courseId: string, filename: string) => `${courseId}/${filename}`,
  paymentReceipt: (userId: string, paymentId: string) => `${userId}/${paymentId}.pdf`,
  // Timestamp en la key para invalidar cache del navegador cuando el user
  // sube un avatar nuevo (la URL firmada cambia, el componente refresca).
  avatar: (userId: string, ext: string) => `${userId}/${Date.now()}.${ext}`,
};
