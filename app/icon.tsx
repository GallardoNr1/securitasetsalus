import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// Favicon dinámico: monograma "S" en blanco sobre el verde marca.
// Cuando esté disponible un SVG vectorizado del logo-mark, sustituir por
// `app/icon.svg` (Next lo detecta automáticamente con prioridad sobre
// este icon.tsx).
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 22,
          background: '#2c5f4a',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fafaf7',
          fontFamily: 'serif',
          fontWeight: 700,
          borderRadius: 6,
        }}
      >
        S
      </div>
    ),
    { ...size },
  );
}
