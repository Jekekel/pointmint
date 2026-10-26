// §39 Multilingual / real-time translation — Worker-side helper (shared by web + MCP).
// Phase 1: pluggable provider via env.TRANSLATE_PROVIDER. Default "stub" needs no paid key.
// When no key / stub: store preference, return honest unavailable chrome; never invent translations.
// No secrets in this file. Put keys with: wrangler secret put TRANSLATE_API_KEY

function rid(prefix) {
  const a = new Uint8Array(9); crypto.getRandomValues(a);
  return prefix + '_' + [...a].map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Common BCP-47 tags offered in the dashboard. */
export const LANGUAGE_OPTIONS = [
  { tag: 'en', label: 'English' },
  { tag: 'es', label: 'Español' },
  { tag: 'fr', label: 'Français' },
  { tag: 'de', label: 'Deutsch' },
  { tag: 'pt', label: 'Português' },
  { tag: 'it', label: 'Italiano' },
  { tag: 'ja', label: '日本語' },
  { tag: 'ko', label: '한국어' },
  { tag: 'zh', label: '中文' },
  { tag: 'zh-Hans', label: '简体中文' },
  { tag: 'zh-Hant', label: '繁體中文' },
  { tag: 'ar', label: 'العربية' },
  { tag: 'hi', label: 'हिन्दी' },
  { tag: 'he', label: 'עברית' },
  { tag: 'ru', label: 'Русский' },
  { tag: 'nl', label: 'Nederlands' },
  { tag: 'pl', label: 'Polski' },
  { tag: 'tr', label: 'Türkçe' },
  { tag: 'vi', label: 'Tiếng Việt' },
  { tag: 'th', label: 'ไทย' },
  { tag: 'id', label: 'Bahasa Indonesia' },
];

const TAG_RE = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,3}$/;

export function normalizeLang(tag, fallback = 'en') {
  if (typeof tag !== 'string') return fallback;
  const t = tag.trim().replace(/_/g, '-');
  if (!TAG_RE.test(t) || t.length > 16) return fallback;
  // Canonicalize common case: language lower, region upper when 2-letter
  const parts = t.split('-');
  parts[0] = parts[0].toLowerCase();
  if (parts[1] && parts[1].length === 2) parts[1] = parts[1].toUpperCase();
  else if (parts[1]) parts[1] = parts[1][0].toUpperCase() + parts[1].slice(1);
  return parts.join('-');
}

export function langLabel(tag) {
  const n = normalizeLang(tag, '');
  const hit = LANGUAGE_OPTIONS.find(o => o.tag.toLowerCase() === n.toLowerCase() || o.tag.split('-')[0] === n.split('-')[0]);
  return hit ? hit.label : n || 'Unknown';
}

export function sameLanguage(a, b) {
  const x = normalizeLang(a, ''), y = normalizeLang(b, '');
  if (!x || !y) return false;
  if (x.toLowerCase() === y.toLowerCase()) return true;
  return x.split('-')[0].toLowerCase() === y.split('-')[0].toLowerCase();
}

/** Heuristic script sniff (not a full detector). Enough for UI hints before a provider exists. */
export function sniffLanguage(text) {
  const s = String(text || '').slice(0, 400);
  if (!s.trim()) return null;
  if (/[\u3040-\u30ff\u31f0-\u31ff]/.test(s)) return 'ja';
  if (/[\uac00-\ud7af]/.test(s)) return 'ko';
  if (/[\u4e00-\u9fff]/.test(s)) return 'zh';
  if (/[\u0600-\u06ff]/.test(s)) return 'ar';
  if (/[\u0590-\u05ff]/.test(s)) return 'he';
  if (/[\u0400-\u04ff]/.test(s)) return 'ru';
  if (/[\u0900-\u097f]/.test(s)) return 'hi';
  if (/[\u0e00-\u0e7f]/.test(s)) return 'th';
  // Latin-heavy → leave unknown; provider or preference decides
  return null;
}

/**
 * Translate text. Provider interface:
 *   env.TRANSLATE_PROVIDER = stub | workers_ai | http (future)
 *   env.TRANSLATE_API_KEY  = secret (optional; never commit)
 * Stub / missing key → { status: 'unavailable' } — UI shows honest chrome.
 */
export async function translateText(env, { text, sourceLang = null, targetLang }) {
  const target = normalizeLang(targetLang, 'en');
  const source = sourceLang ? normalizeLang(sourceLang, null) : sniffLanguage(text);
  const body = String(text || '').slice(0, 4000);
  const provider = String(env.TRANSLATE_PROVIDER || 'stub').toLowerCase();

  if (!body) return { status: 'ready', provider, source_lang: source, target_lang: target, translated_body: '', translating: false };

  if (source && sameLanguage(source, target)) {
    return { status: 'ready', provider, source_lang: source, target_lang: target, translated_body: body, translating: false, skipped: true };
  }

  if (provider === 'stub' || !env.TRANSLATE_API_KEY) {
    return {
      status: 'unavailable',
      provider: provider === 'stub' ? 'stub' : provider,
      source_lang: source,
      target_lang: target,
      translated_body: '',
      translating: false,
      reason: 'no_provider_key',
      note: 'Translation pending — set TRANSLATE_PROVIDER and TRANSLATE_API_KEY (wrangler secret) to enable.',
    };
  }

  // Future providers plug in here. Until implemented, stay honest.
  return {
    status: 'unavailable',
    provider,
    source_lang: source,
    target_lang: target,
    translated_body: '',
    translating: false,
    reason: 'provider_not_wired',
    note: `Provider "${provider}" is configured but not wired in this build. Falling back to original.`,
  };
}

/** Attach translation fields to a pubMessage for the viewer's preferred language. */
export async function attachMessageTranslation(env, msg, viewerLang) {
  const target = normalizeLang(viewerLang || 'en', 'en');
  const source = sniffLanguage(msg.body);
  const base = {
    preferred_language: target,
    source_language: source,
    translation: null,
    translation_status: 'not_needed',
    show_original: false,
  };

  if (!msg.body || (source && sameLanguage(source, target))) {
    return { ...msg, ...base };
  }

  // Only attempt when we sniffed a different script/lang, or viewer is non-English and source unknown
  const shouldTry = (source && !sameLanguage(source, target)) || (!source && target.split('-')[0] !== 'en' && /[^\x00-\x7F]/.test(msg.body));
  if (!shouldTry) return { ...msg, ...base };

  // Cache lookup
  let row = null;
  try {
    row = await env.DB.prepare(
      'SELECT status, source_lang, translated_body, provider FROM message_translations WHERE message_id = ? AND target_lang = ?'
    ).bind(msg.id, target).first();
  } catch { /* table may not exist yet during local boot */ }

  if (row && row.status === 'ready' && row.translated_body) {
    return {
      ...msg,
      body_display: row.translated_body,
      body_original: msg.body,
      preferred_language: target,
      source_language: row.source_lang || source,
      translation: { status: 'ready', provider: row.provider, target_lang: target, source_lang: row.source_lang || source },
      translation_status: 'ready',
      show_original: true,
    };
  }

  const result = await translateText(env, { text: msg.body, sourceLang: source, targetLang: target });

  // Persist cache row (best-effort; stub → unavailable so UI can say so once)
  try {
    const id = rid('mtr');
    await env.DB.prepare(
      `INSERT INTO message_translations (id, message_id, target_lang, source_lang, translated_body, provider, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(message_id, target_lang) DO UPDATE SET
         source_lang = excluded.source_lang,
         translated_body = excluded.translated_body,
         provider = excluded.provider,
         status = excluded.status`
    ).bind(id, msg.id, target, result.source_lang, result.translated_body || '', result.provider, result.status).run();
  } catch { /* ignore cache write failures */ }

  if (result.status === 'ready' && result.translated_body && !result.skipped) {
    return {
      ...msg,
      body_display: result.translated_body,
      body_original: msg.body,
      preferred_language: target,
      source_language: result.source_lang || source,
      translation: { status: 'ready', provider: result.provider, target_lang: target, source_lang: result.source_lang || source },
      translation_status: 'ready',
      show_original: true,
    };
  }

  return {
    ...msg,
    preferred_language: target,
    source_language: result.source_lang || source,
    translation: {
      status: result.status,
      provider: result.provider,
      target_lang: target,
      source_lang: result.source_lang || source,
      note: result.note || null,
      translating: !!result.translating,
    },
    translation_status: result.status === 'unavailable' ? 'unavailable' : (result.translating ? 'translating' : result.status),
    show_original: false,
  };
}

export async function preferredLanguageFor(env, humanId) {
  if (!humanId) return 'en';
  try {
    const h = await env.DB.prepare('SELECT preferred_language FROM humans WHERE id = ?').bind(humanId).first();
    return normalizeLang(h && h.preferred_language, 'en');
  } catch {
    return 'en';
  }
}
