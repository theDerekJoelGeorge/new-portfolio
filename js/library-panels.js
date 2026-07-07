(function () {
  const TRANSITION_MS = 260;
  const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

  const PANEL_CONFIGS = [
    {
      key: 'photo',
      categoryId: 1,
      folderId: 'photoLogsFolder',
      panelId: 'photoLogsPanel',
      openClass: 'is-photo-logs-open',
      expandClass: 'is-photo-logs-expanded',
      title: 'photo logs',
      mediaType: 'image',
      cacheKey: 'category_entries:photo-logs:1',
      devDataKey: 'SUPABASE_DEV_PHOTO_LOGS',
      loadingLabel: 'Loading photos…',
      emptyLabel: 'No photos yet.',
      missingMediaLabel: 'Photos found, but image URLs are missing.',
      defaultSlideLabel: 'Photo',
    },
    {
      key: 'video',
      categoryId: 2,
      folderId: 'videoLogsFolder',
      panelId: 'videoLogsPanel',
      openClass: 'is-video-logs-open',
      expandClass: 'is-video-logs-expanded',
      title: 'video logs',
      mediaType: 'video',
      cacheKey: 'category_entries:video-logs:2',
      devDataKey: 'SUPABASE_DEV_VIDEO_LOGS',
      loadingLabel: 'Loading videos…',
      emptyLabel: 'No videos yet.',
      missingMediaLabel: 'Videos found, but playable URLs are missing.',
      defaultSlideLabel: 'Video',
    },
  ];

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const logoTrigger = document.querySelector('.site-header__brand');
  const panelControllers = [];
  let imageModal = null;

  function isMobile() {
    return window.matchMedia('(max-width: 960px)').matches;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function displayCategoryTitle(title) {
    const value = String(title || '');
    if (value.toLowerCase() === 'writings') return 'Writings';
    if (value.toLowerCase() === 'photo logs') return 'Photo Logs';
    if (value.toLowerCase() === 'video logs') return 'Video Logs';
    return value.replace(/\b\w/g, function (char) {
      return char.toUpperCase();
    });
  }

  function getEntryDescription(entry) {
    const description = entry.description || entry.Description || entry.desc || '';
    if (String(description).trim()) return String(description).trim();
    const body = entry.body || entry.content || entry.text || entry.entry || entry.Entry || '';
    if (body && !/youtube\.com|youtu\.be/i.test(body)) return String(body).trim();
    return '';
  }

  function getEntryYear(entry) {
    let year = entry.year || entry.date || entry.created_at;
    if (year && typeof year === 'string' && year.length > 4) year = year.slice(0, 4);
    return year ? String(year) : '';
  }

  function buildMobileHeader(title) {
    const displayTitle = displayCategoryTitle(title);
    return (
      '<nav class="library-mobile-breadcrumbs" aria-label="Breadcrumb">' +
        '<ol class="library-mobile-breadcrumbs__list">' +
          '<li><a class="library-mobile-breadcrumbs__link" href="creative-library.html">Creative Library</a></li>' +
          '<li aria-hidden="true">/</li>' +
          '<li><span class="library-mobile-breadcrumbs__current">' + escapeHtml(displayTitle) + '</span></li>' +
        '</ol>' +
      '</nav>' +
      '<h1 class="library-mobile-title">' + escapeHtml(displayTitle) + '</h1>'
    );
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
    if (!value) {
      for (const key in entry) {
        if (!Object.prototype.hasOwnProperty.call(entry, key)) continue;
        const lower = key.toLowerCase();
        if (lower === 'category_id' || lower === 'id' || lower === 'type') continue;
        const candidate = typeof entry[key] === 'string' ? entry[key].trim() : '';
        if (!candidate) continue;
        if (
          lower.includes('image') ||
          lower.includes('photo') ||
          lower.includes('img') ||
          lower.includes('url') ||
          lower.includes('src') ||
          lower.includes('cover') ||
          candidate.indexOf('http') === 0 ||
          /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(candidate) ||
          candidate.indexOf('/') === 0
        ) {
          value = candidate;
          break;
        }
      }
    }

    if (!value) return '';
    if (value.indexOf('http://') === 0 || value.indexOf('https://') === 0) return value;
    return window.resolveSupabaseStorageUrl ? window.resolveSupabaseStorageUrl(value) : '';
  }

  function getVideoUrl(entry) {
    const raw =
      entry.entry ||
      entry.Entry ||
      entry.video_url ||
      entry.videoUrl ||
      entry.url ||
      entry.body ||
      entry.content ||
      '';
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

  function getYouTubeThumbUrl(url) {
    const videoId = getYouTubeVideoId(url);
    return videoId ? 'https://img.youtube.com/vi/' + videoId + '/mqdefault.jpg' : '';
  }

  function getSlideLabel(entry, index, defaultLabel) {
    return entry.title || entry.name || entry.Title || defaultLabel + ' ' + (index + 1);
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

  function closeOtherPanels(exceptController) {
    if (typeof window.closeAboutPanel === 'function') {
      window.closeAboutPanel(true);
    }
    if (typeof window.closeResumeIfOpen === 'function') {
      window.closeResumeIfOpen();
    }
    panelControllers.forEach(function (controller) {
      if (controller !== exceptController) {
        controller.close(true);
      }
    });
    if (typeof window.closeWritingsPanel === 'function') {
      window.closeWritingsPanel(true);
    }
  }

  function createLibraryPanel(config) {
    const folderTrigger = document.getElementById(config.folderId);
    const panelEl = document.getElementById(config.panelId);
    const windowEl = panelEl ? panelEl.querySelector('.library-window') : null;
    const slideshowEl = panelEl ? panelEl.querySelector('.library-slideshow') : null;
    const heroImageEl = panelEl ? panelEl.querySelector('.library-slideshow__hero-image') : null;
    const heroVideoEl = panelEl ? panelEl.querySelector('.library-slideshow__hero-video') : null;
    const thumbsEl = panelEl ? panelEl.querySelector('.library-slideshow__thumbs') : null;
    const statusEl = panelEl ? panelEl.querySelector('.library-window__status') : null;
    const mobileFeedEl = panelEl ? panelEl.querySelector('.library-mobile-feed') : null;
    const closeButtons = panelEl ? panelEl.querySelectorAll('[data-library-close]') : [];
    const expandBtn = panelEl ? panelEl.querySelector('[data-library-expand]') : null;

    if (!folderTrigger || !panelEl || !windowEl || !slideshowEl || !thumbsEl || !statusEl) {
      return null;
    }

    let isAnimating = false;
    let loadState = 'idle';
    let entries = [];
    let slides = [];
    let activeIndex = 0;

    function buildSlide(entry, index) {
      const label = getSlideLabel(entry, index, config.defaultSlideLabel);

      if (config.mediaType === 'video') {
        const videoUrl = getVideoUrl(entry);
        const embedUrl = getYouTubeEmbedUrl(videoUrl);
        const thumbUrl = getYouTubeThumbUrl(videoUrl);
        if (!embedUrl || !thumbUrl) return null;
        return {
          label: label,
          embedUrl: embedUrl,
          thumbUrl: thumbUrl,
        };
      }

      const imageUrl = getImageUrl(entry);
      if (!imageUrl) return null;
      return {
        label: label,
        imageUrl: imageUrl,
        thumbUrl: imageUrl,
      };
    }

    function rowsHaveMedia(rows) {
      return rows.some(function (entry, index) {
        return Boolean(buildSlide(entry, index));
      });
    }

    function setStatus(message, isError) {
      statusEl.textContent = message;
      statusEl.hidden = false;
      statusEl.classList.toggle('library-window__status--error', Boolean(isError));
      slideshowEl.hidden = true;
      if (mobileFeedEl) mobileFeedEl.hidden = true;
    }

    function renderMobilePhotoGallery(rows) {
      if (!mobileFeedEl) return;

      const items = rows
        .map(function (entry, index) {
          const imageUrl = getImageUrl(entry);
          if (!imageUrl) return '';
          const title = escapeHtml(getSlideLabel(entry, index, config.defaultSlideLabel));
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
        .filter(Boolean)
        .join('');

      mobileFeedEl.innerHTML =
        buildMobileHeader(config.title) +
        '<div class="library-gallery-grid" role="list" aria-label="Photo gallery">' +
          items +
        '</div>';

      mobileFeedEl.hidden = false;
      slideshowEl.hidden = true;
      statusEl.hidden = true;

      mobileFeedEl.querySelectorAll('[data-image-src]').forEach(function (button) {
        button.addEventListener('click', function () {
          openImageModal({
            src: button.getAttribute('data-image-src'),
            alt: button.getAttribute('data-image-title') || '',
            title: button.getAttribute('data-image-title') || '',
          });
        });
      });
    }

    function renderMobileVideoList(rows) {
      if (!mobileFeedEl) return;

      const items = rows
        .map(function (entry, index) {
          const videoUrl = getVideoUrl(entry);
          const embedUrl = getYouTubeEmbedUrl(videoUrl);
          if (!embedUrl) return '';
          const title = escapeHtml(getSlideLabel(entry, index, config.defaultSlideLabel));
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
        .filter(Boolean)
        .join('');

      mobileFeedEl.innerHTML =
        buildMobileHeader(config.title) +
        '<div class="library-video-list" role="list" aria-label="Video logs">' +
          items +
        '</div>';

      mobileFeedEl.hidden = false;
      slideshowEl.hidden = true;
      statusEl.hidden = true;
    }

    function renderContent(rows) {
      if (isMobile()) {
        if (config.mediaType === 'video') {
          renderMobileVideoList(rows);
        } else {
          renderMobilePhotoGallery(rows);
        }
        return;
      }

      if (mobileFeedEl) mobileFeedEl.hidden = true;
      renderSlideshow(rows);
    }

    function scrollActiveThumbIntoView() {
      const activeThumb = thumbsEl.querySelector('.library-slideshow__thumb--active');
      if (!activeThumb) return;
      activeThumb.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }

    function updateThumbsOverflow() {
      const hasOverflow = thumbsEl.scrollWidth > thumbsEl.clientWidth + 1;
      thumbsEl.classList.toggle('library-slideshow__thumbs--overflow', hasOverflow);
    }

    function setActiveSlide(index) {
      if (!slides.length) return;

      activeIndex = ((index % slides.length) + slides.length) % slides.length;
      const slide = slides[activeIndex];

      if (config.mediaType === 'video' && heroVideoEl) {
        heroVideoEl.src = slide.embedUrl;
        heroVideoEl.title = slide.label;
      } else if (heroImageEl) {
        heroImageEl.src = slide.imageUrl;
        heroImageEl.alt = slide.label;
      }

      thumbsEl.querySelectorAll('.library-slideshow__thumb').forEach(function (button, thumbIndex) {
        const isActive = thumbIndex === activeIndex;
        button.classList.toggle('library-slideshow__thumb--active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        button.tabIndex = isActive ? 0 : -1;
      });

      scrollActiveThumbIntoView();
    }

    function renderSlideshow(rows) {
      slides = rows
        .map(function (entry, index) {
          return buildSlide(entry, index);
        })
        .filter(Boolean);

      thumbsEl.innerHTML = '';

      slides.forEach(function (slide, index) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'library-slideshow__thumb';
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-label', slide.label);
        button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');

        const image = document.createElement('img');
        image.className = 'library-slideshow__thumb-image';
        image.src = slide.thumbUrl;
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';

        button.appendChild(image);
        button.addEventListener('click', function () {
          setActiveSlide(index);
        });

        thumbsEl.appendChild(button);
      });

      statusEl.hidden = true;
      slideshowEl.hidden = false;
      setActiveSlide(0);
      requestAnimationFrame(updateThumbsOverflow);
    }

    thumbsEl.addEventListener(
      'wheel',
      function (event) {
        if (thumbsEl.scrollWidth <= thumbsEl.clientWidth) return;
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        event.preventDefault();
        thumbsEl.scrollLeft += event.deltaY;
      },
      { passive: false }
    );

    window.addEventListener('resize', updateThumbsOverflow);

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
      if (loadState === 'loading') return;
      if (loadState === 'loaded' && entries.length && rowsHaveMedia(entries)) return;

      loadState = 'loading';
      setStatus(config.loadingLabel, false);

      async function applyRows(rows) {
        entries = rows || [];
        if (!entries.length) {
          setStatus(config.emptyLabel, true);
          loadState = 'empty';
          return;
        }
        if (!rowsHaveMedia(entries)) {
          setStatus(config.missingMediaLabel, true);
          loadState = 'error';
          return;
        }
        renderContent(entries);
        loadState = 'loaded';
      }

      try {
        let rows;
        const shouldUseCache = !(window.isSupabasePaused && window.isSupabasePaused());

        if (shouldUseCache && window.fetchWithSupabaseCache) {
          rows = await window.fetchWithSupabaseCache(config.cacheKey, fetchEntries, {
            onRevalidate: applyRows,
          });
        } else {
          rows = await fetchEntries();
        }
        await applyRows(rows);
      } catch (error) {
        console.warn('Library panel fetch failed:', config.key, error);
        setStatus('Could not load content. Please try again.', true);
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
      return document.documentElement.classList.contains(config.openClass);
    }

    function setExpanded(expanded) {
      if (!config.expandClass) return;
      document.documentElement.classList.toggle(config.expandClass, expanded);
      if (expandBtn) {
        expandBtn.setAttribute('aria-pressed', expanded ? 'true' : 'false');
      }
      if (expanded) {
        requestAnimationFrame(function () {
          updateThumbsOverflow();
          scrollActiveThumbIntoView();
        });
      }
    }

    function toggleExpanded() {
      if (!isOpen() || !config.expandClass) return;
      setExpanded(!document.documentElement.classList.contains(config.expandClass));
    }

    function open() {
      if (isOpen()) return;
      if (isAnimating) return;
      isAnimating = true;

      closeOtherPanels(controller);
      setExpanded(false);
      loadEntries();
      document.documentElement.classList.add(config.openClass);

      if (prefersReducedMotion || isMobile()) {
        isAnimating = false;
        requestAnimationFrame(function () {
          if (!isMobile()) {
            updateThumbsOverflow();
            scrollActiveThumbIntoView();
          }
        });
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
          updateThumbsOverflow();
          scrollActiveThumbIntoView();
        }, TRANSITION_MS);
      });
    }

    function close(immediate) {
      if (!isOpen()) return;

      if (immediate || prefersReducedMotion || isMobile()) {
        document.documentElement.classList.remove(config.openClass);
        setExpanded(false);
        setWindowTransition('');
        windowEl.style.opacity = '';
        windowEl.style.transform = '';
        if (heroVideoEl) heroVideoEl.src = '';
        if (mobileFeedEl) {
          mobileFeedEl.innerHTML = '';
          mobileFeedEl.hidden = true;
        }
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
          document.documentElement.classList.remove(config.openClass);
          setExpanded(false);
          setWindowTransition('');
          windowEl.style.opacity = '';
          windowEl.style.transform = '';
          if (heroVideoEl) heroVideoEl.src = '';
          isAnimating = false;
        }, TRANSITION_MS);
      });
    }

    const controller = {
      config: config,
      open: open,
      close: close,
      isOpen: isOpen,
      setActiveSlide: setActiveSlide,
      get slides() {
        return slides;
      },
      get activeIndex() {
        return activeIndex;
      },
    };

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

    return controller;
  }

  PANEL_CONFIGS.forEach(function (config) {
    const controller = createLibraryPanel(config);
    if (controller) panelControllers.push(controller);
  });

  if (logoTrigger) {
    logoTrigger.addEventListener('click', function () {
      panelControllers.forEach(function (controller) {
        controller.close(true);
      });
    });
  }

  window.addEventListener('keydown', function (e) {
    const activeController = panelControllers.find(function (controller) {
      return controller.isOpen();
    });
    if (!activeController) return;

    if (e.key === 'Escape') {
      activeController.close();
      return;
    }

    if (!activeController.slides.length) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      activeController.setActiveSlide(activeController.activeIndex + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      activeController.setActiveSlide(activeController.activeIndex - 1);
    }
  });

  function closeAllLibraryPanels(immediate) {
    panelControllers.forEach(function (controller) {
      controller.close(immediate);
    });
    if (typeof window.closeWritingsPanel === 'function') {
      window.closeWritingsPanel(immediate);
    }
  }

  window.closeAllLibraryPanels = closeAllLibraryPanels;
  window.closePhotoLogsPanel = function (immediate) {
    const photoPanel = panelControllers.find(function (controller) {
      return controller.config.key === 'photo';
    });
    if (photoPanel) photoPanel.close(immediate);
  };

  window.openLibraryPanelByKey = function (key) {
    const controller = panelControllers.find(function (item) {
      return item.config.key === key;
    });
    if (controller) controller.open();
  };
})();
