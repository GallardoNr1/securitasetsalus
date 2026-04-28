import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  type R2Bucket,
  isR2Available,
  isBucketConfigured,
  bucketName,
} from './r2-config';

/**
 * Cliente S3-compatible apuntando a Cloudflare R2.
 * Docs: https://developers.cloudflare.com/r2/api/s3/tokens/
 *
 * Los helpers de configuración (isR2Available, isBucketConfigured) viven en
 * lib/r2-config.ts SIN imports del SDK, para que componentes server que solo
 * los necesitan no arrastren todo el bundle del SDK a su chunk.
 */

export { type R2Bucket, isR2Available, isBucketConfigured };

let cachedClient: S3Client | null = null;

function getClient(): S3Client {
  if (!isR2Available()) {
    throw new Error('R2 no está configurado. Revisa las variables de entorno R2_*.');
  }
  if (cachedClient) return cachedClient;

  cachedClient = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
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
