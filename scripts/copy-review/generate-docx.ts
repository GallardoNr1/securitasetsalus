/**
 * Genera `docs/copy-review.docx` — versión Word/Google Docs del review
 * de copy. Más adecuado para colaboración en tiempo real con un
 * cofounder no técnico:
 *
 *   1. Levantar dev server: `npm run dev`
 *   2. En otra terminal: `npx tsx scripts/copy-review/generate-docx.ts`
 *   3. Subir `docs/copy-review.docx` a Google Drive.
 *   4. Click derecho → "Abrir con Google Docs" (Drive lo convierte).
 *   5. Compartir con el revisor en modo "Comentar" (icono Compartir
 *      arriba a la derecha → añadir email → permiso "Comentar").
 *   6. Ambas partes ven los comentarios en tiempo real, responden,
 *      marcan como resueltos. Historial de cambios incluido.
 *
 * El layout intenta replicar el HTML lo mejor posible dentro de las
 * limitaciones de Word: capturas a ancho A4, tablas posición/texto
 * debajo, y un párrafo "Notas:" vacío con shading para que el revisor
 * lo llene si prefiere editar en lugar de comentar al margen.
 */

import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  PageBreak,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { LANDINGS, type Block, type CopyItem, type Landing } from './data';
import { captureAll, pngDimensions, waitForDev } from './capture';

// ---------------------------------------------------------------------
// Constantes de layout
// ---------------------------------------------------------------------
// Ancho útil de A4 con márgenes de 0.75" ≈ 643px. Lo dejamos en 600
// para margen visual de seguridad.
const IMAGE_WIDTH_PX = 600;

// Paleta SES en hex (sin '#'), reflejando los tokens del design system.
const COLOR_INK = '1a2622';
const COLOR_INK_SOFT = '2c3933';
const COLOR_MUTED = '4a5450';
const COLOR_ACCENT = '2c5f4a';
const COLOR_PAPER = 'fafaf7';

// ---------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------

type RunStyle = {
  bold?: boolean;
  italics?: boolean;
  color?: string;
  size?: number;
  font?: string;
};

/** Convierte texto con **negrita** en un array de TextRun. */
function inlineRuns(text: string, baseStyle: RunStyle = {}): TextRun[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts
    .filter((p) => p.length > 0)
    .map((p) => {
      const isBold = p.startsWith('**') && p.endsWith('**');
      return new TextRun({
        ...baseStyle,
        text: isBold ? p.slice(2, -2) : p,
        bold: isBold || baseStyle.bold,
      });
    });
}

function renderImage(buf: Buffer | null): Paragraph {
  if (!buf) {
    return new Paragraph({
      children: [
        new TextRun({
          text: '[Captura no disponible — ver bloque en producción]',
          italics: true,
          color: COLOR_MUTED,
        }),
      ],
      spacing: { before: 120, after: 120 },
    });
  }

  const { width, height } = pngDimensions(buf);
  const targetWidth = Math.min(IMAGE_WIDTH_PX, width);
  const targetHeight = Math.round((height / width) * targetWidth);

  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 240 },
    children: [
      new ImageRun({
        data: buf,
        transformation: { width: targetWidth, height: targetHeight },
        type: 'png',
      }),
    ],
  });
}

function renderCopyTable(items: CopyItem[]): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 36, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: COLOR_PAPER },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'POSICIÓN',
                bold: true,
                size: 16, // 8pt (size = half-points)
                color: COLOR_MUTED,
                font: 'Consolas',
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 64, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: COLOR_PAPER },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'TEXTO ACTUAL',
                bold: true,
                size: 16,
                color: COLOR_MUTED,
                font: 'Consolas',
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const itemRows = items.map(
    (it) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 36, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: it.position,
                    color: COLOR_ACCENT,
                    size: 20, // 10pt
                    font: 'Consolas',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 64, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: inlineRuns(it.text, { color: COLOR_INK, size: 22 }),
              }),
            ],
          }),
        ],
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...itemRows],
  });
}

function renderNotesArea(): Paragraph[] {
  return [
    new Paragraph({
      spacing: { before: 240, after: 60 },
      children: [
        new TextRun({
          text: 'NOTAS / SUGERENCIAS',
          bold: true,
          size: 16,
          color: COLOR_ACCENT,
          font: 'Consolas',
        }),
      ],
    }),
    // 4 líneas vacías con shading suave, simulan un campo de texto.
    ...Array.from(
      { length: 4 },
      () =>
        new Paragraph({
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: COLOR_PAPER },
          spacing: { before: 0, after: 0, line: 360 },
          children: [new TextRun({ text: ' ' })], // non-breaking space
        }),
    ),
  ];
}

function renderBlock(
  b: Block,
  index: number,
  total: number,
  landingName: string,
  buf: Buffer | null,
): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];

  // Block counter (eyebrow)
  out.push(
    new Paragraph({
      spacing: { before: 360, after: 60 },
      children: [
        new TextRun({
          text: `BLOQUE ${index + 1} DE ${total} · ${landingName.toUpperCase()}`,
          color: COLOR_MUTED,
          size: 16,
          font: 'Consolas',
        }),
      ],
    }),
  );

  // Block title (Heading 3)
  out.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 0, after: 120 },
      children: [new TextRun({ text: b.label, bold: true, size: 28, color: COLOR_INK })],
    }),
  );

  // Purpose (italic)
  if (b.purpose) {
    out.push(
      new Paragraph({
        spacing: { before: 0, after: 240 },
        children: [
          new TextRun({
            text: b.purpose,
            italics: true,
            color: COLOR_INK_SOFT,
            size: 21,
          }),
        ],
      }),
    );
  }

  // Image
  out.push(renderImage(buf));

  // Copy table
  out.push(renderCopyTable(b.items));

  // Notes area
  out.push(...renderNotesArea());

  return out;
}

function renderLanding(
  l: Landing,
  li: number,
  total: number,
  captures: Map<string, Buffer | null>,
): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];

  // Page break antes de cada landing (excepto la primera).
  if (li > 0) {
    out.push(new Paragraph({ children: [new PageBreak()] }));
  }

  // Landing counter
  out.push(
    new Paragraph({
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: `LANDING ${li + 1} DE ${total}`,
          color: COLOR_MUTED,
          size: 16,
          font: 'Consolas',
        }),
      ],
    }),
  );

  // Landing title (Heading 2) con border bottom.
  out.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 0, after: 120 },
      children: [new TextRun({ text: l.name, bold: true, size: 36, color: COLOR_INK })],
      border: {
        bottom: { color: COLOR_INK, space: 8, style: 'single', size: 12 },
      },
    }),
  );

  // Audience
  out.push(
    new Paragraph({
      spacing: { before: 120, after: 360 },
      children: [
        new TextRun({ text: 'Audiencia: ', bold: true, color: COLOR_INK, size: 22 }),
        new TextRun({ text: l.audience, color: COLOR_INK_SOFT, size: 22 }),
      ],
    }),
  );

  // Bloques
  for (const [bi, block] of l.blocks.entries()) {
    out.push(
      ...renderBlock(block, bi, l.blocks.length, l.name, captures.get(block.selector) ?? null),
    );
  }

  return out;
}

function buildDoc(captures: Map<string, Map<string, Buffer | null>>): Document {
  const totalBlocks = LANDINGS.reduce((n, l) => n + l.blocks.length, 0);
  const generatedAt = new Date().toLocaleString('es-CL', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const docHead: Paragraph[] = [
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'DOCUMENTO DE REVISIÓN',
          color: COLOR_ACCENT,
          size: 18,
          font: 'Consolas',
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 0, after: 240 },
      children: [
        new TextRun({
          text: 'Revisión de copy — SecuritasEtSalus v2026.05',
          bold: true,
          size: 48,
          color: COLOR_INK,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 120 },
      children: [
        new TextRun({
          text:
            'Cuatro landings públicas (principal, catálogo, contacto, verificar diploma) con ' +
            'todos sus textos. Revisa cada bloque, compara con la captura, y deja tus ' +
            'sugerencias en el bloque "Notas" o como comentario lateral.',
          color: COLOR_INK_SOFT,
          size: 22,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 480 },
      children: [
        new TextRun({
          text: `${LANDINGS.length} landings · ${totalBlocks} bloques · generado el ${generatedAt}`,
          color: COLOR_MUTED,
          size: 18,
          font: 'Consolas',
        }),
      ],
    }),
  ];

  const landingChildren = LANDINGS.flatMap((l, li) =>
    renderLanding(l, li, LANDINGS.length, captures.get(l.path) ?? new Map()),
  );

  return new Document({
    creator: 'SecuritasEtSalus',
    title: 'Revisión de copy — SecuritasEtSalus v2026.05',
    description: 'Documento generado para revisión colaborativa de copy de las landings públicas.',
    styles: {
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          run: { size: 48, bold: true, color: COLOR_INK, font: 'Calibri' },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          run: { size: 36, bold: true, color: COLOR_INK, font: 'Calibri' },
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          basedOn: 'Normal',
          run: { size: 28, bold: true, color: COLOR_INK, font: 'Calibri' },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }, // 0.75 inch
          },
        },
        children: [...docHead, ...landingChildren],
      },
    ],
  });
}

async function main() {
  console.log('Esperando dev server en http://localhost:3000…');
  await waitForDev();

  const captures = await captureAll(LANDINGS);

  console.log('\nGenerando documento .docx…');
  const doc = buildDoc(captures);
  const buffer = await Packer.toBuffer(doc);

  const outDir = join(process.cwd(), 'docs');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'copy-review.docx');
  writeFileSync(outPath, buffer);

  const sizeMb = (buffer.byteLength / 1024 / 1024).toFixed(2);
  console.log(`\n✓ Generado ${outPath} (${sizeMb} MB)`);
  console.log('\nPara colaborar con tu revisor:');
  console.log('  1. Sube el .docx a Google Drive');
  console.log('  2. Click derecho → Abrir con Google Docs');
  console.log('  3. Compartir → añadir email del revisor → permiso "Comentar"');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
