// Vibecoding experiments home row — loads from Supabase REST (no build step).
// Requires js/supabase-config.js to be populated.

function vibecodingMustGetEnv() {
  return {
    url: window.SUPABASE_URL,
    key: window.SUPABASE_ANON_KEY,
    table: window.SUPABASE_VIBECODING_TABLE || 'vibecoding_experiments',
  };
}

function vibecodingSupabaseHeaders(key) {
  return {
    apikey: key,
    Authorization: 'Bearer ' + key,
    'Content-Type': 'application/json',
  };
}

function vibecodingResolveStorageUrl(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return window.resolveSupabaseStorageUrl ? window.resolveSupabaseStorageUrl(raw.trim()) : raw.trim();
}

function vibecodingEscapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function fetchVibecodingExperimentsFromNetwork(env) {
  const select = encodeURIComponent('id,title,status,hero_vid,sort_order');
  const endpoint =
    env.url +
    '/rest/v1/' +
    encodeURIComponent(env.table) +
    '?select=' +
    select +
    '&order=sort_order.asc.nullslast,created_at.desc';
  const res = await fetch(endpoint, { headers: vibecodingSupabaseHeaders(env.key) });
  if (!res.ok) throw new Error('Supabase vibecoding fetch failed: ' + res.status);
  return await res.json();
}

async function fetchVibecodingExperiments(env, options) {
  if (window.isSupabasePaused && window.isSupabasePaused()) {
    return window.SUPABASE_DEV_VIBECODING_EXPERIMENTS
      ? [...window.SUPABASE_DEV_VIBECODING_EXPERIMENTS]
      : [];
  }
  if (!window.fetchWithSupabaseCache) {
    return fetchVibecodingExperimentsFromNetwork(env);
  }
  return window.fetchWithSupabaseCache(
    'vibecoding:list',
    function () {
      return fetchVibecodingExperimentsFromNetwork(env);
    },
    options
  );
}

function renderVibecodingExperimentsRow(container, rows) {
  if (!rows || !rows.length) {
    container.innerHTML = '<p class="vibecoding-home__empty">No experiments yet.</p>';
    return;
  }

  const cards = rows
    .map(function (row) {
      const title = vibecodingEscapeHtml(row.title || 'Untitled experiment');
      const status = String(row.status || '').toLowerCase();
      const videoUrl = vibecodingResolveStorageUrl(row.hero_vid);
      const badge =
        status === 'building'
          ? '<span class="vibecoding-card__badge">coming soon</span>'
          : '';

      const media = videoUrl
        ? '<video class="vibecoding-card__media" src="' +
          vibecodingEscapeHtml(videoUrl) +
          '" autoplay muted loop playsinline preload="metadata" aria-label="' +
          title +
          ' preview"></video>'
        : '<span class="vibecoding-card__media vibecoding-card__media--fallback" aria-hidden="true"></span>';

      return (
        '<article class="vibecoding-card-home" data-stick-target>' +
        '<div class="vibecoding-card">' +
        badge +
        '<div class="vibecoding-card__frame">' +
        media +
        '</div>' +
        '</div>' +
        '<h3 class="vibecoding-card-home__title">' +
        title +
        '</h3>' +
        '</article>'
      );
    })
    .join('');

  container.innerHTML = cards;
}

async function initVibecodingExperiments() {
  const env = vibecodingMustGetEnv();
  const row = document.getElementById('vibecodingExperimentsRow');
  if (!row) return;

  if (!env.url || !env.key) {
    row.innerHTML = '<p class="vibecoding-home__empty">Supabase is not configured.</p>';
    return;
  }

  try {
    const rows = await fetchVibecodingExperiments(env, {
      onRevalidate: function (freshRows) {
        renderVibecodingExperimentsRow(row, freshRows);
      },
    });
    renderVibecodingExperimentsRow(row, rows);
  } catch (err) {
    console.error('[vibecoding]', err);
    row.innerHTML = '<p class="vibecoding-home__empty">Could not load experiments.</p>';
  }
}

initVibecodingExperiments();
