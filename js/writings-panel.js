(function () {
  const TRANSITION_MS = 260;
  const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
  const CATEGORY_ID = 4;
  const OPEN_CLASS = 'is-writings-open';
  const EXPAND_CLASS = 'is-writings-expanded';
  const CACHE_KEY = 'category_entries:writings:4';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const folderTrigger = document.getElementById('writingsFolder');
  const panelEl = document.getElementById('writingsPanel');
  const windowEl = panelEl ? panelEl.querySelector('.library-window') : null;
  const statusEl = document.getElementById('writingsStatus');
  const listViewEl = document.getElementById('writingsListView');
  const gridEl = document.getElementById('writingsGrid');
  const filtersEl = document.getElementById('writingsFilters');
  const countEl = document.getElementById('writingsCount');
  const articleViewEl = document.getElementById('writingsArticleView');
  const backBtn = document.getElementById('writingsBackBtn');
  const articleTitleEl = document.getElementById('writingsArticleTitle');
  const articleMetaEl = document.getElementById('writingsArticleMeta');
  const articleBodyEl = document.getElementById('writingsArticleBody');
  const closeButtons = panelEl ? panelEl.querySelectorAll('[data-writings-close]') : [];
  const expandBtn = panelEl ? panelEl.querySelector('[data-writings-expand]') : null;
  const logoTrigger = document.querySelector('.site-header__brand');

  if (!folderTrigger || !panelEl || !windowEl || !statusEl || !listViewEl || !gridEl || !articleViewEl) {
    return;
  }

  let isAnimating = false;
  let loadState = 'idle';
  let entries = [];
  let activeEntryId = null;
  let activeFilter = 'all';

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function getCoverImageUrl(entry) {
    const raw =
      entry['Cover Image'] ||
      entry.cover_image ||
      entry.cover ||
      entry.thumbnail_url ||
      entry.image_url ||
      entry.image ||
      '';

    let value = String(raw || '').trim();
    if (!value) return '';
    if (value.indexOf('http://') === 0 || value.indexOf('https://') === 0) return value;
    return window.resolveSupabaseStorageUrl ? window.resolveSupabaseStorageUrl(value) : '';
  }

  function getEntryType(entry) {
    return String(entry.Type || entry.type || entry.entry_type || '').trim();
  }

  function getEntryBody(entry) {
    return String(entry.entry || entry.body || entry.content || entry.description || '').trim();
  }

  function rectCenter(rect) {
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function computeDiveTransform(fromRect, toRect) {
    const from = rectCenter(fromRect);
    const to = rectCenter(toRect);
    const scale = Math.max(
      0.12,
      Math.min(0.95, Math.min(fromRect.width / toRect.width, fromRect.height / toRect.height))
    );
    return {
      dx: from.x - to.x,
      dy: from.y - to.y,
      scale,
    };
  }

  function closeOtherPanels() {
    if (typeof window.closeAboutPanel === 'function') {
      window.closeAboutPanel(true);
    }
    if (document.documentElement.classList.contains('is-resume-open')) {
      document.documentElement.classList.remove('is-resume-open');
      document.documentElement.classList.remove('is-resume-fullscreen');
    }
    if (typeof window.closeAllLibraryPanels === 'function') {
      window.closeAllLibraryPanels(true);
    }
  }

  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.hidden = false;
    statusEl.classList.toggle('library-window__status--error', Boolean(isError));
    listViewEl.hidden = true;
    articleViewEl.hidden = true;
  }

  function showListView(animate) {
    activeEntryId = null;
    statusEl.hidden = true;
    articleViewEl.hidden = true;
    articleViewEl.classList.remove('writings-screen--entering');
    listViewEl.hidden = false;
    if (animate && !prefersReducedMotion) {
      listViewEl.classList.remove('writings-screen--entering');
      void listViewEl.offsetWidth;
      listViewEl.classList.add('writings-screen--entering');
    }
  }

  function showArticleView(entry) {
    activeEntryId = entry.id;
    statusEl.hidden = true;
    listViewEl.hidden = true;
    articleViewEl.hidden = false;
    articleViewEl.classList.remove('writings-screen--entering');
    if (!prefersReducedMotion) {
      void articleViewEl.offsetWidth;
      articleViewEl.classList.add('writings-screen--entering');
    }

    const title = entry.title || entry.name || 'Untitled';
    const typeStr = getEntryType(entry);
    const body = getEntryBody(entry);

    articleTitleEl.textContent = title;
    if (typeStr) {
      articleMetaEl.textContent = typeStr;
      articleMetaEl.hidden = false;
    } else {
      articleMetaEl.textContent = '';
      articleMetaEl.hidden = true;
    }

    if (body) {
      articleBodyEl.innerHTML = escapeHtml(body).replace(/\r\n|\n|\r/g, '<br>');
      articleBodyEl.hidden = false;
    } else {
      articleBodyEl.innerHTML = '';
      articleBodyEl.hidden = true;
    }

    articleViewEl.scrollTop = 0;
    const scrollEl = articleViewEl.querySelector('.writings-article__scroll');
    if (scrollEl) scrollEl.scrollTop = 0;
  }

  function formatPostsLabel(count, total) {
    if (activeFilter !== 'all' && count !== total) {
      return count + ' of ' + total + ' posts that might be worth a read';
    }
    if (count === 1) return '1 post that might be worth a read';
    return count + ' posts that might be worth a read';
  }

  function updateCount() {
    const visibleCards = gridEl.querySelectorAll('.writings-card:not([hidden])');
    const count = visibleCards.length;
    const total = entries.length;
    countEl.textContent = formatPostsLabel(count, total);
  }

  function applyFilter(filter) {
    activeFilter = filter;

    if (filtersEl) {
      filtersEl.querySelectorAll('.writings-filters__tab').forEach(function (btn) {
        const isActive = btn.getAttribute('data-filter') === filter;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    }

    gridEl.querySelectorAll('.writings-card').forEach(function (card) {
      const type = card.getAttribute('data-type') || '';
      const show = filter === 'all' || type === filter;
      card.hidden = !show;
    });

    updateCount();
  }

  function renderFilters(rows) {
    if (!filtersEl) return;

    const types = [];
    const typeSet = {};

    rows.forEach(function (entry) {
      const type = getEntryType(entry);
      if (type && !typeSet[type]) {
        typeSet[type] = true;
        types.push(type);
      }
    });

    types.sort();

    if (!types.length) {
      filtersEl.hidden = true;
      filtersEl.innerHTML = '';
      return;
    }

    const allBtn =
      '<button type="button" class="writings-filters__tab' +
      (activeFilter === 'all' ? ' is-active' : '') +
      '" data-filter="all" role="tab" aria-selected="' +
      (activeFilter === 'all' ? 'true' : 'false') +
      '">All</button>';

    const typeBtns = types
      .map(function (type) {
        const isActive = activeFilter === type;
        return (
          '<button type="button" class="writings-filters__tab' +
          (isActive ? ' is-active' : '') +
          '" data-filter="' +
          escapeHtml(type) +
          '" role="tab" aria-selected="' +
          (isActive ? 'true' : 'false') +
          '">' +
          escapeHtml(type) +
          '</button>'
        );
      })
      .join('');

    filtersEl.innerHTML = allBtn + typeBtns;
    filtersEl.hidden = false;
  }

  function renderGrid(rows) {
    entries = Array.isArray(rows) ? rows : [];

    if (!entries.length) {
      setStatus('No writings yet.');
      loadState = 'empty';
      return;
    }

    if (!typesIncludeFilter(entries, activeFilter)) {
      activeFilter = 'all';
    }

    renderFilters(entries);

    gridEl.innerHTML = entries
      .map(function (entry) {
        const entryId = entry.id != null ? String(entry.id) : '';
        const title = escapeHtml(entry.title || entry.name || 'Untitled');
        const typeRaw = getEntryType(entry);
        const typeStr = escapeHtml(typeRaw || '—');
        const coverUrl = getCoverImageUrl(entry);
        const coverEscaped = coverUrl ? escapeHtml(coverUrl) : '';
        const coverClass =
          'writings-card__cover-wrap' + (coverUrl ? '' : ' writings-card__cover-wrap--placeholder');
        const imgTag = coverUrl
          ? '<img class="writings-card__cover" src="' +
            coverEscaped +
            '" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.parentElement.classList.add(\'writings-card__cover-wrap--placeholder\');this.remove();">'
          : '';

        return (
          '<button type="button" class="writings-card" role="listitem" data-entry-id="' +
          escapeHtml(entryId) +
          '" data-type="' +
          escapeHtml(typeRaw) +
          '">' +
          '<div class="' +
          coverClass +
          '">' +
          imgTag +
          '</div>' +
          '<p class="writings-card__name">' +
          title +
          '</p>' +
          '<p class="writings-card__type">' +
          typeStr +
          '</p>' +
          '</button>'
        );
      })
      .join('');

    applyFilter(activeFilter);

    gridEl.querySelectorAll('.writings-card').forEach(function (card) {
      card.addEventListener('click', function () {
        const id = card.getAttribute('data-entry-id');
        const entry = entries.find(function (row) {
          return String(row.id) === String(id);
        });
        if (entry) showArticleView(entry);
      });
    });

    showListView();
    loadState = 'ready';
  }

  function typesIncludeFilter(rows, filter) {
    if (filter === 'all') return true;
    return rows.some(function (entry) {
      return getEntryType(entry) === filter;
    });
  }

  async function fetchEntries() {
    const url = window.SUPABASE_URL;
    const key = window.SUPABASE_ANON_KEY;
    const table = window.SUPABASE_CATEGORY_ENTRIES_TABLE || 'category_entries';

    if (window.SUPABASE_PAUSED && window.SUPABASE_DEV_WRITINGS) {
      return window.SUPABASE_DEV_WRITINGS;
    }

    if (!url || !key) {
      throw new Error('Supabase is not configured.');
    }

    const select = encodeURIComponent('*');
    const endpoint =
      url +
      '/rest/v1/' +
      table +
      '?select=' +
      select +
      '&category_id=eq.' +
      CATEGORY_ID +
      '&order=id.asc';

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Writings fetch: ' + response.status);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  async function loadEntries() {
    if (loadState === 'loading' || loadState === 'ready') return;
    loadState = 'loading';
    setStatus('Loading writings…');

    try {
      const shouldUseCache = !window.SUPABASE_PAUSED && window.fetchWithSupabaseCache;
      let rows;

      if (shouldUseCache) {
        rows = await window.fetchWithSupabaseCache(CACHE_KEY, fetchEntries, {
          onRevalidate: renderGrid,
        });
      } else {
        rows = await fetchEntries();
      }

      renderGrid(rows);
    } catch (error) {
      console.warn('Writings panel fetch failed:', error);
      setStatus('Could not load writings. Please try again.', true);
      loadState = 'error';
    }
  }

  function setWindowTransform(dx, dy, scale) {
    windowEl.style.transform = 'translate3d(' + dx + 'px, ' + dy + 'px, 0) scale(' + scale + ')';
  }

  function setWindowTransition(enabled) {
    windowEl.style.transition = enabled
      ? 'opacity ' + TRANSITION_MS + 'ms ' + EASE + ', transform ' + TRANSITION_MS + 'ms ' + EASE
      : 'none';
  }

  function isOpen() {
    return document.documentElement.classList.contains(OPEN_CLASS);
  }

  function setExpanded(expanded) {
    document.documentElement.classList.toggle(EXPAND_CLASS, expanded);
    if (expandBtn) {
      expandBtn.setAttribute('aria-pressed', expanded ? 'true' : 'false');
    }
  }

  function toggleExpanded() {
    if (!isOpen()) return;
    setExpanded(!document.documentElement.classList.contains(EXPAND_CLASS));
  }

  function open() {
    if (isOpen() || isAnimating) return;
    isAnimating = true;

    closeOtherPanels();
    setExpanded(false);
    if (loadState === 'ready' && entries.length) {
      showListView();
    }
    loadEntries();
    document.documentElement.classList.add(OPEN_CLASS);

    if (prefersReducedMotion) {
      isAnimating = false;
      return;
    }

    const fromRect = folderTrigger.getBoundingClientRect();
    const toRect = windowEl.getBoundingClientRect();
    const transform = computeDiveTransform(fromRect, toRect);

    setWindowTransition(false);
    windowEl.style.opacity = '0';
    setWindowTransform(transform.dx, transform.dy, transform.scale);

    requestAnimationFrame(function () {
      setWindowTransition(true);
      windowEl.style.opacity = '1';
      setWindowTransform(0, 0, 1);

      window.setTimeout(function () {
        setWindowTransition('');
        windowEl.style.opacity = '';
        windowEl.style.transform = '';
        isAnimating = false;
      }, TRANSITION_MS);
    });
  }

  function close(immediate) {
    if (!isOpen()) return;

    if (immediate || prefersReducedMotion) {
      document.documentElement.classList.remove(OPEN_CLASS);
      setExpanded(false);
      setWindowTransition('');
      windowEl.style.opacity = '';
      windowEl.style.transform = '';
      activeEntryId = null;
      isAnimating = false;
      return;
    }

    if (isAnimating) return;
    isAnimating = true;

    const fromRect = folderTrigger.getBoundingClientRect();
    const toRect = windowEl.getBoundingClientRect();
    const transform = computeDiveTransform(fromRect, toRect);

    setWindowTransition(true);
    windowEl.style.opacity = '1';
    setWindowTransform(0, 0, 1);

    requestAnimationFrame(function () {
      windowEl.style.opacity = '0';
      setWindowTransform(transform.dx, transform.dy, transform.scale);

      window.setTimeout(function () {
        document.documentElement.classList.remove(OPEN_CLASS);
        setExpanded(false);
        setWindowTransition('');
        windowEl.style.opacity = '';
        windowEl.style.transform = '';
        activeEntryId = null;
        isAnimating = false;
      }, TRANSITION_MS);
    });
  }

  folderTrigger.addEventListener('click', function (e) {
    e.preventDefault();
    if (isOpen()) {
      close();
    } else {
      open();
    }
  });

  closeButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      close();
    });
  });

  if (expandBtn) {
    expandBtn.addEventListener('click', function (e) {
      e.preventDefault();
      toggleExpanded();
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', function () {
      showListView(true);
    });
  }

  if (filtersEl) {
    filtersEl.addEventListener('click', function (e) {
      const btn = e.target.closest('.writings-filters__tab');
      if (!btn) return;
      e.preventDefault();
      applyFilter(btn.getAttribute('data-filter') || 'all');
    });
  }

  if (logoTrigger) {
    logoTrigger.addEventListener('click', function () {
      close(true);
    });
  }

  window.addEventListener('keydown', function (e) {
    if (!isOpen()) return;

    if (e.key === 'Escape') {
      if (activeEntryId != null) {
        showListView(true);
      } else {
        close();
      }
    }
  });

  window.closeWritingsPanel = close;
})();
