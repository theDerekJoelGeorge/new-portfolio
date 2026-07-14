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
  const select = encodeURIComponent('id,title,status,hero_vid,link,sort_order');
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

function buildVibecodingCardHtml(row, options) {
  const stickTarget = options && options.stickTarget;
  const pageLayout = options && options.pageLayout;
  const title = vibecodingEscapeHtml(row.title || 'Untitled experiment');
  const status = String(row.status || '').toLowerCase();
  const link = typeof row.link === 'string' ? row.link.trim() : '';
  const videoUrl = vibecodingResolveStorageUrl(row.hero_vid);
  const isDone = status === 'done' || status === 'built';
  const badge =
    status === 'building' ? '<span class="vibecoding-card__badge">coming soon</span>' : '';

  const media = videoUrl
    ? '<video class="vibecoding-card__media" src="' +
      vibecodingEscapeHtml(videoUrl) +
      '" autoplay muted loop playsinline preload="metadata" aria-label="' +
      title +
      ' preview"></video>'
    : '<span class="vibecoding-card__media vibecoding-card__media--fallback" aria-hidden="true"></span>';

  const articleClass = pageLayout
    ? 'vibecoding-card-home vibecoding-card-home--page'
    : 'vibecoding-card-home';
  const stickAttr = stickTarget ? ' data-stick-target' : '';
  const isLinked = Boolean(isDone && link);
  const tag = isLinked ? 'a' : 'article';
  const linkAttrs = isLinked
    ? ' href="' +
      vibecodingEscapeHtml(link) +
      '" target="_blank" rel="noopener noreferrer" aria-label="' +
      title +
      '"'
    : '';

  return (
    '<' +
    tag +
    ' class="' +
    articleClass +
    (isLinked ? ' vibecoding-card-home--linked' : '') +
    '"' +
    stickAttr +
    linkAttrs +
    '>' +
    '<div class="vibecoding-card">' +
    '<div class="vibecoding-card__frame">' +
    media +
    '</div>' +
    '</div>' +
    '<div class="vibecoding-card-home__meta">' +
    '<h3 class="vibecoding-card-home__title">' +
    title +
    '</h3>' +
    badge +
    '</div>' +
    '</' +
    tag +
    '>'
  );
}

function vibecodingRowsSignature(rows) {
  return JSON.stringify(
    (rows || []).map(function (row) {
      return {
        id: row.id,
        title: row.title,
        status: row.status,
        hero_vid: row.hero_vid,
        link: row.link,
        sort_order: row.sort_order,
      };
    })
  );
}

function readCachedVibecodingRows() {
  try {
    var raw = localStorage.getItem('portfolio:supabase:vibecoding:list');
    if (!raw) return null;
    var entry = JSON.parse(raw);
    var version =
      window.SUPABASE_CACHE_VERSION != null ? String(window.SUPABASE_CACHE_VERSION) : '1';
    if (!entry || entry.version !== version || !Array.isArray(entry.data)) return null;
    return entry.data;
  } catch (error) {
    return null;
  }
}

function clearVibecodingLoadingState(container) {
  if (!container) return;
  container.classList.remove('vibecoding-page__loading', 'vibecoding-home__loading');
}

function wireVibecodingVideos(container) {
  if (!container) return;
  container.querySelectorAll('video.vibecoding-card__media').forEach(function (video) {
    if (video.dataset.vibecodingWired === 'true') return;
    video.dataset.vibecodingWired = 'true';

    function markReady() {
      video.classList.add('is-ready');
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      markReady();
      return;
    }

    video.addEventListener('loadeddata', markReady, { once: true });
  });
}

function renderVibecodingExperimentsRow(container, rows) {
  if (!rows || !rows.length) {
    clearVibecodingLoadingState(container);
    container.innerHTML = '<p class="vibecoding-home__empty">No experiments yet.</p>';
    container.dataset.vibecodingSig = '';
    return;
  }

  var signature = vibecodingRowsSignature(rows);
  if (container.dataset.vibecodingSig === signature) return;

  clearVibecodingLoadingState(container);
  container.dataset.vibecodingSig = signature;
  container.innerHTML = rows
    .map(function (row) {
      return buildVibecodingCardHtml(row, { stickTarget: true });
    })
    .join('');
  wireVibecodingVideos(container);
}

function renderVibecodingExperimentsPage(container, rows) {
  if (!rows || !rows.length) {
    clearVibecodingLoadingState(container);
    container.innerHTML = '<p class="vibecoding-page__empty">No experiments yet.</p>';
    container.dataset.vibecodingSig = '';
    return;
  }

  var signature = vibecodingRowsSignature(rows);
  if (container.dataset.vibecodingSig === signature) return;

  clearVibecodingLoadingState(container);
  container.dataset.vibecodingSig = signature;
  container.innerHTML =
    '<div class="vibecoding-page__list">' +
    rows
      .map(function (row) {
        return buildVibecodingCardHtml(row, { pageLayout: true });
      })
      .join('') +
    '</div>';
  wireVibecodingVideos(container);
}

async function initVibecodingExperiments() {
  const env = vibecodingMustGetEnv();
  const homeRow = document.getElementById('vibecodingExperimentsRow');
  const mobileList = document.getElementById('vibecodingExperimentsList');
  if (!homeRow && !mobileList) return;

  if (!env.url || !env.key) {
    const message = '<p class="vibecoding-home__empty">Supabase is not configured.</p>';
    if (homeRow) homeRow.innerHTML = message;
    if (mobileList) mobileList.innerHTML = message;
    return;
  }

  try {
    var cachedRows = readCachedVibecodingRows();
    if (cachedRows) {
      if (homeRow) renderVibecodingExperimentsRow(homeRow, cachedRows);
      if (mobileList) renderVibecodingExperimentsPage(mobileList, cachedRows);
    }

    const rows = await fetchVibecodingExperiments(env, {
      onRevalidate: function (freshRows) {
        if (homeRow) renderVibecodingExperimentsRow(homeRow, freshRows);
        if (mobileList) renderVibecodingExperimentsPage(mobileList, freshRows);
      },
    });
    if (homeRow) renderVibecodingExperimentsRow(homeRow, rows);
    if (mobileList) renderVibecodingExperimentsPage(mobileList, rows);
  } catch (err) {
    console.error('[vibecoding]', err);
    const message = '<p class="vibecoding-home__empty">Could not load experiments.</p>';
    if (homeRow) homeRow.innerHTML = message;
    if (mobileList) mobileList.innerHTML = message;
  }
}

initVibecodingExperiments();
