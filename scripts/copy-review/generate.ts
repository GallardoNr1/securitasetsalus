/**
 * Genera `docs/copy-review.html` — un documento standalone para que un
 * revisor no técnico (cofounder, copywriter, stakeholder) revise todo
 * el copy de las landings públicas de SES.
 *
 * Uso:
 *   1. Levantar dev server: `npm run dev`
 *   2. En otra terminal: `npx tsx scripts/copy-review/generate.ts`
 *   3. Enviar `docs/copy-review.html` al revisor.
 *
 * El HTML es self-contained (capturas embebidas en base64) → un único
 * archivo que se abre en cualquier browser, no requiere servidor ni
 * dependencias. Las notas del revisor se guardan en localStorage del
 * propio archivo (cada vez que escribe, se persiste). Al final puede
 * imprimir a PDF con Cmd+P.
 *
 * Paleta SES: verde primario `$p-700` + crema accent `$a-300/400` +
 * neutrals desaturados con tinte verdoso. Tipografías: Fraunces para
 * display, Inter body, JetBrains Mono para mono.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { LANDINGS, type Landing } from './data';
import { captureAll, waitForDev } from './capture';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Renderiza **negrita** ligero como <strong>. */
function renderInline(s: string): string {
  return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function renderHtml(
  landings: Landing[],
  captures: Map<string, Map<string, Buffer | null>>,
): string {
  const totalBlocks = landings.reduce((n, l) => n + l.blocks.length, 0);

  const tocHtml = landings
    .map((l, li) => {
      const items = l.blocks
        .map((b, bi) => `<li><a href="#l${li}-b${bi}">${escapeHtml(b.label)}</a></li>`)
        .join('');
      return `<li class="toc-landing"><a href="#l${li}">${escapeHtml(l.name)}</a><ol>${items}</ol></li>`;
    })
    .join('');

  const landingsHtml = landings
    .map((l, li) => {
      const blocksHtml = l.blocks
        .map((b, bi) => {
          const blockId = `l${li}-b${bi}`;
          const buf = captures.get(l.path)?.get(b.selector) ?? null;
          const shotHtml = buf
            ? `<img src="data:image/png;base64,${buf.toString('base64')}" alt="Captura del bloque" loading="lazy">`
            : `<div class="shot-fallback">No se pudo capturar este bloque automáticamente. Mírelo en producción: <code>${escapeHtml(`https://securitasetsalus.cl${l.path}`)}</code></div>`;

          const itemsHtml = b.items
            .map(
              (it) => `
              <tr>
                <th scope="row">${escapeHtml(it.position)}</th>
                <td>${renderInline(it.text)}</td>
              </tr>`,
            )
            .join('');

          return `
          <article class="block" id="${blockId}">
            <header class="block-head">
              <p class="block-counter">Bloque ${bi + 1} de ${l.blocks.length} · ${escapeHtml(l.name)}</p>
              <h3>${escapeHtml(b.label)}</h3>
              ${b.purpose ? `<p class="block-purpose">${escapeHtml(b.purpose)}</p>` : ''}
            </header>
            <div class="block-grid">
              <div class="block-shot">${shotHtml}</div>
              <div class="block-copy">
                <table>
                  <thead>
                    <tr><th>Posición</th><th>Texto actual</th></tr>
                  </thead>
                  <tbody>${itemsHtml}</tbody>
                </table>
              </div>
            </div>
            <div class="block-notes">
              <label>
                <span>Tus notas / sugerencias para este bloque</span>
                <textarea data-block-id="${blockId}" rows="4" placeholder="Escribe aquí cualquier sugerencia. Se guarda automáticamente en este archivo."></textarea>
              </label>
            </div>
          </article>`;
        })
        .join('');

      return `
        <section class="landing" id="l${li}">
          <header class="landing-head">
            <p class="landing-counter">Landing ${li + 1} de ${landings.length}</p>
            <h2>${escapeHtml(l.name)}</h2>
            <p class="landing-audience"><strong>Audiencia:</strong> ${escapeHtml(l.audience)}</p>
          </header>
          ${blocksHtml}
        </section>`;
    })
    .join('');

  const generatedAt = new Date().toLocaleString('es-CL', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  return `<!doctype html>
<html lang="es-CL">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Revisión de copy — SecuritasEtSalus v2026.05</title>
  <style>
    :root {
      --paper: #fafaf7;
      --ink: #1a2622;
      --ink-soft: #2c3933;
      --muted: #4a5450;
      --line: #d8d4c5;
      --line-soft: #e8e5d8;
      --accent: #2c5f4a;
      --accent-deep: #143828;
      --accent-bg: rgba(44, 95, 74, 0.08);
      --gold: #c9a84c;
      --bg: #f5f3eb;
      --surface: #ffffff;
      --shadow: 0 1px 2px rgba(26, 38, 34, 0.04), 0 8px 24px rgba(26, 38, 34, 0.06);
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      font-size: 15px;
      line-height: 1.55;
      color: var(--ink);
      background: var(--bg);
    }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }

    .layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 40px;
      max-width: 1400px;
      margin: 0 auto;
      padding: 32px;
    }

    .doc-head {
      grid-column: 1 / -1;
      padding-bottom: 28px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--line);
    }
    .doc-eyebrow {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 11px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--accent);
      margin: 0 0 6px;
    }
    .doc-head h1 {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 38px;
      font-weight: 700;
      letter-spacing: -0.025em;
      line-height: 1.1;
      margin: 0 0 16px;
    }
    .doc-intro {
      font-size: 15.5px;
      max-width: 75ch;
      color: var(--ink-soft);
      margin: 0 0 12px;
    }
    .doc-meta {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 11px;
      color: var(--muted);
      margin: 0;
    }

    .toc {
      position: sticky;
      top: 32px;
      align-self: start;
      max-height: calc(100vh - 64px);
      overflow-y: auto;
      padding-right: 8px;
    }
    .toc-title {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 10.5px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--muted);
      margin: 0 0 14px;
    }
    .toc ol {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .toc-landing { margin-bottom: 18px; }
    .toc-landing > a {
      font-weight: 600;
      color: var(--ink);
      display: block;
      padding: 4px 0;
      border-bottom: 1px solid var(--line-soft);
      margin-bottom: 6px;
    }
    .toc-landing ol li {
      padding: 3px 0 3px 12px;
      font-size: 13px;
    }
    .toc-landing ol a {
      color: var(--ink-soft);
    }

    .landings { min-width: 0; }
    .landing {
      margin-bottom: 56px;
      scroll-margin-top: 24px;
    }
    .landing-head {
      padding-bottom: 14px;
      margin-bottom: 28px;
      border-bottom: 2px solid var(--ink);
    }
    .landing-counter {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 10.5px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--muted);
      margin: 0 0 4px;
    }
    .landing-head h2 {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 30px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0 0 8px;
    }
    .landing-audience {
      font-size: 14px;
      color: var(--ink-soft);
      margin: 0;
    }

    .block {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 20px 22px 22px;
      margin-bottom: 22px;
      box-shadow: var(--shadow);
      scroll-margin-top: 24px;
    }
    .block-head { margin-bottom: 16px; }
    .block-counter {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 10.5px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--muted);
      margin: 0 0 4px;
    }
    .block-head h3 {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 22px;
      font-weight: 600;
      letter-spacing: -0.015em;
      margin: 0 0 6px;
      color: var(--ink);
    }
    .block-purpose {
      font-size: 13.5px;
      color: var(--ink-soft);
      margin: 0;
      max-width: 80ch;
    }

    .block-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
      gap: 22px;
      align-items: start;
    }

    .block-shot {
      border: 1px solid var(--line);
      border-radius: 6px;
      overflow: hidden;
      background: var(--bg);
    }
    .block-shot img {
      display: block;
      width: 100%;
      height: auto;
    }
    .shot-fallback {
      padding: 32px 16px;
      font-size: 13px;
      color: var(--muted);
      text-align: center;
    }
    .shot-fallback code {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 12px;
      background: var(--accent-bg);
      color: var(--accent);
      padding: 2px 6px;
      border-radius: 3px;
    }

    .block-copy table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13.5px;
    }
    .block-copy thead th {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 10.5px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
      padding: 0 8px 8px;
      border-bottom: 1px solid var(--line);
      text-align: left;
    }
    .block-copy tbody th {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 11px;
      letter-spacing: 0.04em;
      color: var(--accent);
      text-align: left;
      padding: 8px 8px 8px 0;
      border-bottom: 1px solid var(--line-soft);
      vertical-align: top;
      width: 36%;
      font-weight: 500;
    }
    .block-copy tbody td {
      padding: 8px 0 8px 8px;
      border-bottom: 1px solid var(--line-soft);
      vertical-align: top;
      color: var(--ink);
    }
    .block-copy tbody tr:last-child th,
    .block-copy tbody tr:last-child td { border-bottom: none; }

    .block-notes {
      margin-top: 18px;
      border-top: 1px dashed var(--line);
      padding-top: 14px;
    }
    .block-notes label > span {
      display: block;
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 10.5px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 6px;
    }
    .block-notes textarea {
      display: block;
      width: 100%;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.5;
      padding: 10px 12px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--paper);
      color: var(--ink);
      resize: vertical;
      min-height: 70px;
    }
    .block-notes textarea:focus {
      outline: 2px solid var(--accent);
      outline-offset: -1px;
    }

    .savebar {
      position: fixed;
      bottom: 16px;
      right: 16px;
      background: var(--ink);
      color: var(--paper);
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 11px;
      letter-spacing: 0.04em;
      padding: 8px 14px;
      border-radius: 999px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 200ms ease;
      box-shadow: 0 8px 24px rgba(10, 18, 14, 0.25);
      z-index: 50;
    }
    .savebar.visible { opacity: 1; }

    @media (max-width: 1024px) {
      .layout { grid-template-columns: 1fr; }
      .toc { position: static; max-height: none; margin-bottom: 24px; }
      .block-grid { grid-template-columns: 1fr; }
    }

    @media print {
      body { background: white; }
      .layout { display: block; padding: 0; max-width: none; }
      .toc, .savebar { display: none; }
      .block { break-inside: avoid; box-shadow: none; border: 1px solid #ccc; }
      .landing { break-before: page; }
      .landing:first-child { break-before: auto; }
    }
  </style>
</head>
<body>
  <div class="layout">
    <header class="doc-head">
      <p class="doc-eyebrow">Documento de revisión</p>
      <h1>Revisión de copy — SecuritasEtSalus v2026.05</h1>
      <p class="doc-intro">
        Cuatro landings públicas (principal, catálogo, contacto, verificar diploma) con todos
        sus textos. Revisa cada bloque, compara con la captura real (columna izquierda), y
        deja tus sugerencias en el cuadro de notas de cada bloque. Las notas se guardan
        automáticamente en este archivo.
      </p>
      <p class="doc-meta">
        ${escapeHtml(`${landings.length} landings · ${totalBlocks} bloques · generado el ${generatedAt}`)}
      </p>
    </header>

    <aside class="toc" aria-label="Índice">
      <p class="toc-title">Índice</p>
      <ol>
        ${tocHtml}
      </ol>
    </aside>

    <main class="landings">
      ${landingsHtml}
    </main>
  </div>

  <div class="savebar" id="savebar">notas guardadas</div>

  <script>
    const STORAGE_KEY = 'ses-copy-review-notes-v1';
    const savebar = document.getElementById('savebar');
    let saveTimer = null;
    let savebarTimer = null;

    function loadNotes() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        for (const ta of document.querySelectorAll('textarea[data-block-id]')) {
          const id = ta.dataset.blockId;
          if (data[id]) ta.value = data[id];
        }
      } catch {}
    }

    function saveNotes() {
      const data = {};
      for (const ta of document.querySelectorAll('textarea[data-block-id]')) {
        const v = ta.value.trim();
        if (v) data[ta.dataset.blockId] = v;
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        savebar.classList.add('visible');
        clearTimeout(savebarTimer);
        savebarTimer = setTimeout(() => savebar.classList.remove('visible'), 1200);
      } catch {}
    }

    document.addEventListener('input', (e) => {
      if (!(e.target instanceof HTMLTextAreaElement)) return;
      if (!e.target.dataset.blockId) return;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveNotes, 400);
    });

    loadNotes();
  </script>
</body>
</html>`;
}

async function main() {
  console.log('Esperando dev server en http://localhost:3000…');
  await waitForDev();

  const captures = await captureAll(LANDINGS);

  const html = renderHtml(LANDINGS, captures);
  const outDir = join(process.cwd(), 'docs');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'copy-review.html');
  writeFileSync(outPath, html, 'utf8');

  const sizeMb = (Buffer.byteLength(html, 'utf8') / 1024 / 1024).toFixed(2);
  console.log(`\n✓ Generado ${outPath} (${sizeMb} MB)`);
  console.log('  Abrir con doble click o `start docs/copy-review.html`.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
