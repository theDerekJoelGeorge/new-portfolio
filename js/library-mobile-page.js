// Mobile category views on creative-library.html — loads entries from Supabase.
(function () {
  const params = new URLSearchParams(window.location.search);
  const categorySlug = params.get('category') || params.get('slug');
  if (!categorySlug) return;

  const CATEGORY_CONFIGS = {
    'photo-logs': {
      key: 'photo',
      categoryId: 1,
      title: 'Photo Logs',
      cacheKey: 'category_entries:photo-logs:1',
      devDataKey: 'SUPABASE_DEV_PHOTO_LOGS',
      loadingLabel: 'Loading photos…',
      emptyLabel: 'No photos yet.',
      missingMediaLabel: 'Photos found, but image URLs are missing.',
      defaultItemLabel: 'Photo',
      mediaType: 'photo',
    },
    'video-logs': {
      key: 'video',
      categoryId: 2,
      title: 'Video Logs',
      cacheKey: 'category_entries:video-logs:2',
      devDataKey: 'SUPABASE_DEV_VIDEO_LOGS',
      loadingLabel: 'Loading videos…',
      emptyLabel: 'No videos yet.',
      missingMediaLabel: 'Videos found, but playable URLs are missing.',
      defaultItemLabel: 'Video',
      mediaType: 'video',
    },
    writings: {
      key: 'writings',
      categoryId: 4,
      title: 'Writings',
      cacheKey: 'category_entries:writings:4',
      devDataKey: 'SUPABASE_DEV_WRITINGS',
      loadingLabel: 'Loading writings…',
      emptyLabel: 'No writings yet.',
      mediaType: 'writings',
    },
  };

  const config = CATEGORY_CONFIGS[categorySlug];
  if (!config) return;

  const categoryView = document.getElementById('libraryCategoryView');
  const categoryInner = document.getElementById('libraryCategoryInner');
  const libraryContainer = document.getElementById('libraryContainer');
  const pageTitle = document.querySelector('.page-title');
  const pageIntro = document.querySelector('.page-intro');

  if (!categoryView || !categoryInner) return;

  let imageModal = null;
  let writingsEntries = [];
  let writingsFilter = 'all';

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function showCategoryShell() {
    if (pageTitle) pageTitle.hidden = true;
    if (pageIntro) pageIntro.hidden = true;
    if (libraryContainer) libraryContainer.hidden = true;
    categoryView.hidden = false;
    document.title = config.title + ' — Derek Joel George';
  }

  function buildBreadcrumbs(currentTitle) {
    return (
      '<nav class="library-mobile-breadcrumbs" aria-label="Breadcrumb">' +
        '<ol class="library-mobile-breadcrumbs__list">' +
          '<li><a class="library-mobile-breadcrumbs__link" href="creative-library.html">Creative Library</a></li>' +
          '<li aria-hidden="true">/</li>' +
          '<li><span class="library-mobile-breadcrumbs__current">' + escapeHtml(currentTitle) + '</span></li>' +
        '</ol>' +
      '</nav>'
    );
  }

  function setStatus(message, isError) {
    categoryInner.innerHTML =
      buildBreadcrumbs(config.title) +
      '<h1 class="library-mobile-title">' + escapeHtml(config.title) + '</h1>' +
      '<p class="library-window__status' + (isError ? ' library-window__status--error' : '') + '">' +
      escapeHtml(message) +
      '</p>';
  }

  function getImageUrl(entry) {
    const raw =
      entry.entry ||
      entry.Entry ||
      entry['Cover Image'] ||
      entry.image_url ||
      entry.image ||
      entry.thumbnail_url ||
      entry.photo_url ||
      entry.photo ||
      entry.url ||
      entry.src ||
      entry.cover_image ||
      entry.img ||
      entry.cover ||
      '';

    let value = String(raw || '').trim();
    if (!value) return '';
    if (value.indexOf('http://') === 0 || value.indexOf('https://') === 0) return value;
    return window.resolveSupabaseStorageUrl ? window.resolveSupabaseStorageUrl(value) : '';
  }

  function getVideoUrl(entry) {
    const raw = entry.entry || entry.Entry || entry.video_url || entry.videoUrl || entry.url || entry.body || entry.content || '';
    const value = String(raw || '').trim();
    if (!value) return '';
    if (/youtube\.com|youtu\.be/i.test(value)) return value;
    return '';
  }

  function getYouTubeVideoId(url) {
    if (!url) return '';
    const youtuBeMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (youtuBeMatch && youtuBeMatch[1]) return youtuBeMatch[1];
    const youtubeMatch = url.match(
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)([a-zA-Z0-9_-]{11})/
    );
    if (youtubeMatch && youtubeMatch[1]) return youtubeMatch[1];
    const vParamMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (vParamMatch && vParamMatch[1]) return vParamMatch[1];
    return '';
  }

  function getYouTubeEmbedUrl(url) {
    const videoId = getYouTubeVideoId(url);
    return videoId ? 'https://www.youtube.com/embed/' + videoId + '?rel=0' : '';
  }

  function getEntryDescription(entry) {
    const description = entry.description || entry.Description || entry.desc || '';
    if (String(description).trim()) return String(description).trim();
    const body = entry.body || entry.content || entry.text || entry.entry || entry.Entry || '';
    if (body && !/youtube\.com|youtu\.be/i.test(body)) return String(body).trim();
    return '';
  }

  function getSlideLabel(entry, index, defaultLabel) {
    return entry.title || entry.name || entry.Title || defaultLabel + ' ' + (index + 1);
  }

  function getEntryType(entry) {
    return String(entry.Type || entry.type || entry.entry_type || '').trim();
  }

  function getEntryBody(entry) {
    return String(entry.entry || entry.body || entry.content || entry.description || '').trim();
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

  async function fetchEntries() {
    if (window.isSupabasePaused && window.isSupabasePaused()) {
      return window[config.devDataKey] || [];
    }

    const supabaseUrl = window.SUPABASE_URL;
    const supabaseKey = window.SUPABASE_ANON_KEY;
    const table = window.SUPABASE_CATEGORY_ENTRIES_TABLE || 'category_entries';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase is not configured.');
    }

    const endpoint =
      supabaseUrl +
      '/rest/v1/' +
      table +
      '?select=' +
      encodeURIComponent('*') +
      '&category_id=eq.' +
      encodeURIComponent(String(config.categoryId)) +
      '&order=id.asc';

    const response = await fetch(endpoint, {
      headers: {
        apikey: supabaseKey,
        Authorization: 'Bearer ' + supabaseKey,
      },
    });

    if (!response.ok) {
      throw new Error('Could not load entries.');
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  async function loadEntries() {
    setStatus(config.loadingLabel, false);

    async function applyRows(rows) {
      if (config.mediaType === 'photo') {
        renderPhotoGallery(rows || []);
        return;
      }
      if (config.mediaType === 'video') {
        renderVideoList(rows || []);
        return;
      }
      renderWritingsList(rows || []);
    }

    try {
      const shouldUseCache = !(window.isSupabasePaused && window.isSupabasePaused());
      let rows;

      if (shouldUseCache && window.fetchWithSupabaseCache) {
        rows = await window.fetchWithSupabaseCache(config.cacheKey, fetchEntries, {
          onRevalidate: applyRows,
        });
      } else {
        rows = await fetchEntries();
      }

      await applyRows(rows);
    } catch (error) {
      console.warn('Library mobile page fetch failed:', categorySlug, error);
      setStatus('Could not load content. Please try again.', true);
    }
  }

  function ensureImageModal() {
    if (imageModal) return imageModal;

    const modal = document.createElement('div');
    modal.className = 'library-image-modal';
    modal.innerHTML =
      '<div class="library-image-modal__overlay" data-library-modal-close></div>' +
      '<div class="library-image-modal__content">' +
        '<img class="library-image-modal__img" src="" alt="">' +
        '<p class="library-image-modal__title"></p>' +
      '</div>' +
      '<button type="button" class="library-image-modal__close" data-library-modal-close aria-label="Close image">×</button>';

    document.body.appendChild(modal);

    modal.querySelectorAll('[data-library-modal-close]').forEach(function (button) {
      button.addEventListener('click', function () {
        modal.classList.remove('library-image-modal--active');
      });
    });

    imageModal = modal;
    return modal;
  }

  function openImageModal(image) {
    const modal = ensureImageModal();
    const img = modal.querySelector('.library-image-modal__img');
    const title = modal.querySelector('.library-image-modal__title');
    img.src = image.src;
    img.alt = image.alt || '';
    title.textContent = image.title || '';
    title.hidden = !image.title;
    modal.classList.add('library-image-modal--active');
  }

  function renderPhotoGallery(rows) {
    const items = rows
      .map(function (entry, index) {
        const imageUrl = getImageUrl(entry);
        if (!imageUrl) return '';
        const title = escapeHtml(getSlideLabel(entry, index, config.defaultItemLabel));
        return (
          '<article class="library-gallery-item">' +
            '<button type="button" class="library-gallery-item__button" data-image-src="' + escapeHtml(imageUrl) + '" data-image-title="' + title + '">' +
              '<span class="library-gallery-item__image-wrap">' +
                '<img class="library-gallery-item__image" src="' + escapeHtml(imageUrl) + '" alt="' + title + '" loading="lazy" decoding="async">' +
              '</span>' +
            '</button>' +
          '</article>'
        );
      })
      .filter(Boolean);

    if (!items.length) {
      setStatus(rows.length ? config.missingMediaLabel : config.emptyLabel, true);
      return;
    }

    categoryInner.innerHTML =
      buildBreadcrumbs(config.title) +
      '<h1 class="library-mobile-title">' + escapeHtml(config.title) + '</h1>' +
      '<div class="library-gallery-grid" role="list" aria-label="Photo gallery">' +
        items.join('') +
      '</div>';

    categoryInner.querySelectorAll('[data-image-src]').forEach(function (button) {
      button.addEventListener('click', function () {
        openImageModal({
          src: button.getAttribute('data-image-src'),
          alt: button.getAttribute('data-image-title') || '',
          title: button.getAttribute('data-image-title') || '',
        });
      });
    });
  }

  function renderVideoList(rows) {
    const items = rows
      .map(function (entry, index) {
        const videoUrl = getVideoUrl(entry);
        const embedUrl = getYouTubeEmbedUrl(videoUrl);
        if (!embedUrl) return '';
        const title = escapeHtml(getSlideLabel(entry, index, config.defaultItemLabel));
        const description = escapeHtml(getEntryDescription(entry));
        return (
          '<article class="library-video-entry">' +
            '<div class="library-video-entry__video">' +
              '<iframe title="' + title + '" src="' + escapeHtml(embedUrl) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>' +
            '</div>' +
            '<h2 class="library-video-entry__title">' + title + '</h2>' +
            (description ? '<p class="library-video-entry__description">' + description + '</p>' : '') +
          '</article>'
        );
      })
      .filter(Boolean);

    if (!items.length) {
      setStatus(rows.length ? config.missingMediaLabel : config.emptyLabel, true);
      return;
    }

    categoryInner.innerHTML =
      buildBreadcrumbs(config.title) +
      '<h1 class="library-mobile-title">' + escapeHtml(config.title) + '</h1>' +
      '<div class="library-video-list" role="list" aria-label="Video logs">' +
        items.join('') +
      '</div>';
  }

  function formatPostsLabel(count, total) {
    if (writingsFilter !== 'all' && count !== total) {
      return count + ' of ' + total + ' posts that might be worth a read';
    }
    if (count === 1) return '1 post that might be worth a read';
    return count + ' posts that might be worth a read';
  }

  function renderWritingsFilters(rows) {
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

    if (!types.length) return '';

    const allBtn =
      '<button type="button" class="writings-filters__tab' +
      (writingsFilter === 'all' ? ' is-active' : '') +
      '" data-filter="all" role="tab" aria-selected="' +
      (writingsFilter === 'all' ? 'true' : 'false') +
      '">All</button>';

    const typeBtns = types
      .map(function (type) {
        const isActive = writingsFilter === type;
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

    return '<div class="writings-filters" role="tablist" aria-label="Filter by type">' + allBtn + typeBtns + '</div>';
  }

  function renderWritingsGridMarkup(rows) {
    return rows
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
  }

  function applyWritingsFilter() {
    const cards = categoryInner.querySelectorAll('.writings-card');
    let visibleCount = 0;

    cards.forEach(function (card) {
      const type = card.getAttribute('data-type') || '';
      const show = writingsFilter === 'all' || type === writingsFilter;
      card.hidden = !show;
      if (show) visibleCount += 1;
    });

    const countEl = categoryInner.querySelector('.writings-panel__count');
    if (countEl) {
      countEl.textContent = formatPostsLabel(visibleCount, writingsEntries.length);
    }

    categoryInner.querySelectorAll('.writings-filters__tab').forEach(function (btn) {
      const isActive = btn.getAttribute('data-filter') === writingsFilter;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  function showWritingsArticle(entry) {
    const title = entry.title || entry.name || 'Untitled';
    const typeStr = getEntryType(entry);
    const body = getEntryBody(entry);

    categoryInner.innerHTML =
      '<article class="writings-article writings-article--page">' +
        '<header class="writings-article__toolbar">' +
          '<button type="button" class="writings-article__back" id="libraryWritingsBackBtn" aria-label="Back to writings list">' +
            '<span class="writings-article__back-chevron" aria-hidden="true"></span>' +
            '<span>Writings</span>' +
          '</button>' +
        '</header>' +
        '<div class="writings-article__scroll">' +
          '<h1 class="writings-article__title">' + escapeHtml(title) + '</h1>' +
          (typeStr
            ? '<p class="writings-article__meta">' + escapeHtml(typeStr) + '</p>'
            : '') +
          (body
            ? '<div class="writings-article__body">' +
              escapeHtml(body).replace(/\r\n|\n|\r/g, '<br>') +
              '</div>'
            : '') +
        '</div>' +
      '</article>';

    const backBtn = document.getElementById('libraryWritingsBackBtn');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        renderWritingsList(writingsEntries);
      });
    }

    window.scrollTo(0, 0);
  }

  function attachWritingsInteractions() {
    categoryInner.querySelectorAll('.writings-card').forEach(function (card) {
      card.addEventListener('click', function () {
        const id = card.getAttribute('data-entry-id');
        const entry = writingsEntries.find(function (row) {
          return String(row.id) === String(id);
        });
        if (entry) showWritingsArticle(entry);
      });
    });

    const filtersEl = categoryInner.querySelector('.writings-filters');
    if (filtersEl) {
      filtersEl.addEventListener('click', function (e) {
        const btn = e.target.closest('.writings-filters__tab');
        if (!btn) return;
        e.preventDefault();
        writingsFilter = btn.getAttribute('data-filter') || 'all';
        applyWritingsFilter();
      });
    }
  }

  function renderWritingsList(rows) {
    writingsEntries = Array.isArray(rows) ? rows : [];

    if (!writingsEntries.length) {
      setStatus(config.emptyLabel, true);
      return;
    }

    const filtersMarkup = renderWritingsFilters(writingsEntries);

    categoryInner.innerHTML =
      '<div class="library-window__content--writings">' +
        buildBreadcrumbs(config.title) +
        '<h1 class="library-mobile-title">' + escapeHtml(config.title) + '</h1>' +
        '<p class="writings-panel__intro">I got into writing as I was looking for new ways of expressing the ideas that were going on in my head.</p>' +
        filtersMarkup +
        '<div class="writings-grid" role="list" aria-label="Writings">' +
          renderWritingsGridMarkup(writingsEntries) +
        '</div>' +
        '<p class="writings-panel__count" aria-live="polite"></p>' +
      '</div>';

    attachWritingsInteractions();
    applyWritingsFilter();
  }

  showCategoryShell();
  loadEntries();
})();
