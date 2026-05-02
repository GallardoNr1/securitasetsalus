/**
 * Captura de screenshots de cada bloque de las landings vía Playwright.
 * Reutilizado por `generate.ts` (HTML) y `generate-docx.ts` (Word/Docs).
 */

import { chromium, type Page } from '@playwright/test';
import type { Landing } from './data';

export async function waitForDev(maxWaitMs = 90_000): Promise<void> {
  const start = Date.now();
  let attempts = 0;
  while (Date.now() - start < maxWaitMs) {
    attempts++;
    try {
      const res = await fetch('http://localhost:3000', {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok || res.status === 307 || res.status === 308) {
        console.log(`✓ Dev server listo (intento ${attempts})`);
        return;
      }
    } catch {
      // server aún no escucha
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error('Dev server no respondió en 90s. ¿Está corriendo `npm run dev`?');
}

async function captureBlock(page: Page, selector: string): Promise<Buffer | null> {
  const locator = page.locator(selector).first();
  try {
    await locator.waitFor({ state: 'visible', timeout: 5000 });
    await locator.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    return await locator.screenshot({ type: 'png' });
  } catch (err) {
    console.warn(`  ⚠ no pude capturar "${selector}":`, (err as Error).message);
    return null;
  }
}

/**
 * Captura todos los bloques de una landing. Devuelve un Map indexado por
 * el `selector` (que es la clave estable entre data.ts y los renderers).
 */
async function captureLanding(
  page: Page,
  landing: Landing,
): Promise<Map<string, Buffer | null>> {
  console.log(`\n→ Capturando landing ${landing.path}…`);
  await page.goto(`http://localhost:3000${landing.path}`, {
    waitUntil: 'networkidle',
    timeout: 30_000,
  });
  await page.waitForTimeout(800);

  const captures = new Map<string, Buffer | null>();
  for (const block of landing.blocks) {
    process.stdout.write(`  · ${block.label}… `);
    const buf = await captureBlock(page, block.selector);
    captures.set(block.selector, buf);
    console.log(buf ? '✓' : '∅');
  }
  return captures;
}

/**
 * Lanza chromium headless 1440x900 y captura todas las landings.
 * Devuelve mapa landing.path → (selector → Buffer|null).
 */
export async function captureAll(
  landings: Landing[],
): Promise<Map<string, Map<string, Buffer | null>>> {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const all = new Map<string, Map<string, Buffer | null>>();
  for (const landing of landings) {
    all.set(landing.path, await captureLanding(page, landing));
  }

  await browser.close();
  return all;
}

/**
 * Lee el header de un PNG y devuelve sus dimensiones en píxeles.
 * Bytes 16-19 = width (uint32 BE), bytes 20-23 = height.
 */
export function pngDimensions(buf: Buffer): { width: number; height: number } {
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}
