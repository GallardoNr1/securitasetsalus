import QRCode from 'qrcode';

/**
 * Genera un data URL PNG del QR para una URL dada. Lo usamos tanto en el
 * PDF del diploma (embebido) como en la vista de `/diploma` (preview).
 *
 * Opciones:
 * - errorCorrectionLevel: 'M' aguanta ~15% de daño — suficiente para
 *   diplomas impresos sin ser excesivo.
 * - margin: 1 — el propio diploma ya tiene márgenes; el QR necesita al
 *   menos 1 módulo de quiet zone para escanearse fiable.
 * - color negro sobre blanco para máxima legibilidad de escáneres.
 */
export function generateQRDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 320,
    color: { dark: '#1a140d', light: '#ffffff' },
  });
}

/** Variante buffer para respuestas binarias si alguna vez la necesitamos. */
export function generateQRBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 320,
    color: { dark: '#1a140d', light: '#ffffff' },
  });
}
