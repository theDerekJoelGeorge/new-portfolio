// Creative library: load categories from Supabase, fallback to local defaults.
(function () {
  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;
  const table = window.SUPABASE_CATEGORIES_TABLE || 'categories';

  const foldersGrid = document.getElementById('foldersGrid');
  const libraryLoading = document.getElementById('libraryLoading');
  const libraryEmpty = document.getElementById('libraryEmpty');

  const STATIC_CATEGORIES = [
    { name: 'Photo Logs', cover_color: '#2BA89A', slug: '', 'tool-tip text': 'Photography and visual logs' },
    { name: 'Video Logs', cover_color: '#4A7EB8', slug: '', 'tool-tip text': 'Video experiments and logs' },
    { name: 'Writings', cover_color: '#7C5CB8', slug: '', 'tool-tip text': 'Essays and written pieces' },
  ];

  function setLoading(show) {
    if (libraryLoading) libraryLoading.hidden = !show;
    if (libraryEmpty) libraryEmpty.hidden = true;
  }

  function setEmpty(msg) {
    if (libraryLoading) libraryLoading.hidden = true;
    if (libraryEmpty) {
      libraryEmpty.hidden = false;
      libraryEmpty.textContent = msg || 'No categories yet.';
    }
    if (foldersGrid) foldersGrid.innerHTML = '';
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function getCategoryLabel(cat) {
    const raw = cat.name || cat.title || cat.category_name || 'Category';
    if (String(raw).toLowerCase() === 'writings') return 'Writings';
    return raw;
  }

  const HIDDEN_CATEGORY_IDS = new Set([3]);

  function isHiddenCategory(cat) {
    if (cat.category_id != null && HIDDEN_CATEGORY_IDS.has(Number(cat.category_id))) return true;
    const slug = String(cat.slug || '').toLowerCase();
    const name = String(cat.name || cat.title || '').toLowerCase();
    return slug === 'graphic-design' || name.includes('graphic design');
  }

  function filterCategories(rows) {
    return (rows || []).filter(function (cat) {
      return !isHiddenCategory(cat);
    });
  }

  async function fetchCategories() {
    if (!url || !key || (window.isSupabasePaused && window.isSupabasePaused())) {
      return STATIC_CATEGORIES;
    }

    const select = encodeURIComponent('category_id,name,slug,cover_color,description_1,"tool-tip text"');
    const endpoint =
      `${url}/rest/v1/${table}` +
      `?select=${select}` +
      `&order=category_id.asc`;
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    const body = await res.text();
    if (!res.ok) {
      console.warn('Creative library: categories fetch failed, using defaults.', res.status, body);
      return STATIC_CATEGORIES;
    }

    if (!body || body.trim() === '') return STATIC_CATEGORIES;
    try {
      const rows = JSON.parse(body);
      return filterCategories(rows.length ? rows : STATIC_CATEGORIES);
    } catch (e) {
      console.warn('Creative library: invalid JSON, using defaults.', e);
      return STATIC_CATEGORIES;
    }
  }

  function getMobileCategoryHref(label, slug) {
    const normalized = String(label || '').toLowerCase();
    const slugValue = String(slug || '').trim().toLowerCase();
    if (normalized.includes('photo') || slugValue === 'photo-logs') return 'creative-library.html?category=photo-logs';
    if (normalized.includes('video') || slugValue === 'video-logs') return 'creative-library.html?category=video-logs';
    if (normalized.includes('writing') || slugValue === 'writings') return 'creative-library.html?category=writings';
    if (slugValue) return 'creative-library.html?category=' + encodeURIComponent(slugValue);
    return '';
  }

  function renderFolderMarkup(cat) {
    const label = escapeHtml(getCategoryLabel(cat));
    const slugRaw = cat.slug && String(cat.slug).trim() ? String(cat.slug).trim() : '';
    const mobileHref = getMobileCategoryHref(getCategoryLabel(cat), slugRaw);
    const href =
      window.matchMedia('(max-width: 960px)').matches && mobileHref
        ? mobileHref
        : slugRaw
          ? `category.html?slug=${encodeURIComponent(slugRaw)}`
          : '#';
    const tooltipText = cat['tool-tip text'] ? String(cat['tool-tip text']).trim() : '';
    const coverColor =
      cat.cover_color && /^#[0-9A-Fa-f]{6}$/.test(String(cat.cover_color).trim())
        ? String(cat.cover_color).trim()
        : '';
    const colorStyle = coverColor ? ` style="--folder-color:${escapeHtml(coverColor)}"` : '';
    const dataTooltip = tooltipText ? ` data-tooltip="${escapeHtml(tooltipText)}"` : '';

    return (
      `<a class="folder" href="${href}"${dataTooltip}${colorStyle}>` +
      '<span class="folder__icon" aria-hidden="true">' +
      '<span class="folder__icon-back"></span>' +
      '<span class="folder__icon-contents">' +
      '<span class="folder__icon-line"></span><span class="folder__icon-line"></span><span class="folder__icon-line"></span>' +
      '</span>' +
      '<span class="folder__icon-flap"><span class="folder__icon-tab"></span></span>' +
      '</span>' +
      `<span class="folder__label">${label}</span>` +
      '</a>'
    );
  }

  function renderFolders(rows) {
    if (!foldersGrid) return;
    setLoading(false);
    if (!rows || !rows.length) {
      setEmpty('No categories yet.');
      return;
    }
    if (libraryEmpty) libraryEmpty.hidden = true;
    foldersGrid.innerHTML = rows.map(renderFolderMarkup).join('');
    attachFolderAnimations();
    attachTooltipListeners();
  }

  function attachFolderAnimations() {
    if (!foldersGrid || typeof gsap === 'undefined') return;
    foldersGrid.querySelectorAll('.folder').forEach(function (folder) {
      const icon = folder.querySelector('.folder__icon');
      const flap = folder.querySelector('.folder__icon-flap');
      if (!icon || !flap) return;

      const open = function () {
        gsap.killTweensOf([icon, flap]);
        gsap.to(icon, { scale: 1.06, duration: 0.4, ease: 'power2.out' });
        gsap.to(flap, {
          rotationX: -52,
          transformOrigin: 'bottom center',
          duration: 0.4,
          ease: 'power2.inOut',
        });
      };

      const close = function () {
        gsap.killTweensOf([icon, flap]);
        gsap.to(icon, { scale: 1, duration: 0.35, ease: 'power2.out' });
        gsap.to(flap, {
          rotationX: 0,
          transformOrigin: 'bottom center',
          duration: 0.35,
          ease: 'power2.inOut',
        });
      };

      folder.addEventListener('mouseenter', open);
      folder.addEventListener('mouseleave', close);
      folder.addEventListener('focus', open);
      folder.addEventListener('blur', close);
    });
  }

  function attachTooltipListeners() {
    if (!foldersGrid || !window.matchMedia('(hover: hover)').matches) return;

    let tooltip = document.getElementById('cursor-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'cursor-tooltip';
      tooltip.className = 'folder__tooltip folder__tooltip--cursor';
      tooltip.setAttribute('aria-hidden', 'true');
      document.body.appendChild(tooltip);
    }

    foldersGrid.querySelectorAll('.folder[data-tooltip]').forEach(function (folder) {
      const text = folder.getAttribute('data-tooltip') || '';
      if (!text) return;

      folder.addEventListener('mouseenter', function (e) {
        tooltip.textContent = text;
        tooltip.style.left = `${e.clientX + 10}px`;
        tooltip.style.top = `${e.clientY + 10}px`;
        tooltip.classList.add('folder__tooltip--visible');
      });

      folder.addEventListener('mousemove', function (e) {
        tooltip.style.left = `${e.clientX + 10}px`;
        tooltip.style.top = `${e.clientY + 10}px`;
      });

      folder.addEventListener('mouseleave', function () {
        tooltip.classList.remove('folder__tooltip--visible');
      });
    });
  }

  setLoading(true);
  fetchCategories()
    .then(renderFolders)
    .catch(function (err) {
      console.error('Creative library: failed to load categories', err);
      renderFolders(STATIC_CATEGORIES);
    });
})();
