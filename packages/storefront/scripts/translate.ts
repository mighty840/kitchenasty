/**
 * Translation script using Ollama (OpenAI-compatible API).
 * Translates en.json into target locales using a local LLM.
 *
 * Usage: npx tsx scripts/translate.ts [--locales fr,de,it,pt,pl,ru] [--model llama3.1]
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = join(__dirname, '..', 'src', 'i18n', 'locales');

const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'llama3.1';

const LANGUAGE_NAMES: Record<string, string> = {
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  es: 'Spanish',
  ru: 'Russian',
  pl: 'Polish',
};

type TranslationObject = Record<string, string | TranslationObject>;

function flattenObject(obj: TranslationObject, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      result[fullKey] = value;
    } else {
      Object.assign(result, flattenObject(value, fullKey));
    }
  }
  return result;
}

function unflattenObject(flat: Record<string, string>): TranslationObject {
  const result: TranslationObject = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let current: TranslationObject = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]] || typeof current[parts[i]] === 'string') {
        current[parts[i]] = {};
      }
      current = current[parts[i]] as TranslationObject;
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

async function translateBatch(
  entries: [string, string][],
  targetLang: string,
): Promise<Record<string, string>> {
  const langName = LANGUAGE_NAMES[targetLang] || targetLang;

  const jsonBlock = JSON.stringify(Object.fromEntries(entries), null, 2);

  const prompt = `You are a professional translator for a restaurant ordering app called KitchenAsty. Translate the following JSON values from English to ${langName}. Keep all JSON keys exactly the same. Preserve any {{variables}} inside curly braces exactly as they are. Keep translations natural, concise, and appropriate for a food ordering UI. Return ONLY valid JSON, no explanation.

${jsonBlock}`;

  const res = await fetch(`${OLLAMA_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      stream: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const content = data.choices[0].message.content.trim();

  // Extract JSON from response (may be wrapped in markdown code block)
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
  const parsed = JSON.parse(jsonMatch[1]!.trim());

  return parsed;
}

async function translateLocale(targetLang: string) {
  const langName = LANGUAGE_NAMES[targetLang] || targetLang;
  console.log(`\nTranslating to ${langName} (${targetLang})...`);

  const enJson = JSON.parse(readFileSync(join(LOCALES_DIR, 'en.json'), 'utf-8'));
  const flat = flattenObject(enJson);
  const entries = Object.entries(flat);

  // Split into batches of ~40 keys to stay within context limits
  const BATCH_SIZE = 40;
  const translated: Record<string, string> = {};

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(entries.length / BATCH_SIZE);
    process.stdout.write(`  Batch ${batchNum}/${totalBatches}...`);

    const result = await translateBatch(batch, targetLang);
    Object.assign(translated, result);
    console.log(' done');
  }

  // Verify all keys are present
  const missingKeys = entries.filter(([key]) => !translated[key]);
  if (missingKeys.length > 0) {
    console.warn(`  Warning: ${missingKeys.length} keys missing, using English fallback`);
    for (const [key, value] of missingKeys) {
      translated[key] = value;
    }
  }

  const nested = unflattenObject(translated);
  const outPath = join(LOCALES_DIR, `${targetLang}.json`);
  writeFileSync(outPath, JSON.stringify(nested, null, 2) + '\n');
  console.log(`  Written to ${outPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  let locales = ['fr', 'de', 'it', 'pt', 'pl', 'ru'];

  const localeIdx = args.indexOf('--locales');
  if (localeIdx !== -1 && args[localeIdx + 1]) {
    locales = args[localeIdx + 1].split(',');
  }

  const modelIdx = args.indexOf('--model');
  if (modelIdx !== -1 && args[modelIdx + 1]) {
    process.env.OLLAMA_MODEL = args[modelIdx + 1];
  }

  console.log(`Using Ollama at ${OLLAMA_BASE} with model ${MODEL}`);
  console.log(`Target locales: ${locales.join(', ')}`);

  // Verify Ollama is accessible
  try {
    const health = await fetch(`${OLLAMA_BASE}/v1/models`);
    if (!health.ok) throw new Error(`Status ${health.status}`);
  } catch {
    console.error('Error: Cannot connect to Ollama. Make sure it is running.');
    process.exit(1);
  }

  for (const locale of locales) {
    await translateLocale(locale);
  }

  console.log('\nAll translations complete!');
}

main().catch((err) => {
  console.error('Translation failed:', err);
  process.exit(1);
});
