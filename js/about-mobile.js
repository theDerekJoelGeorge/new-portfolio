(function () {
  const statusEl = document.getElementById('aboutMobileStatus');
  const contentEl = document.getElementById('aboutMobileContent');
  const scrollEl = document.getElementById('aboutMobileScroll');
  const homeBreadcrumb = document.getElementById('aboutMobileHomeBreadcrumb');
  const aboutTable = window.SUPABASE_ABOUT_ME_TABLE || 'about_me';

  if (!statusEl || !contentEl) return;

  let loadState = 'idle';

  function escapeHtml(value) {
    if (!value) return '';
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  }

  function getText(row, keys) {
    for (let i = 0; i < keys.length; i += 1) {
      const value = row[keys[i]];
      if (value != null && String(value).trim() !== '') {
        return String(value).trim();
      }
    }
    return '';
  }

  function resolveImageUrl(raw) {
    if (!raw || typeof raw !== 'string') return '';
    const trimmed = raw.trim();
    if (!trimmed) return '';

    if (trimmed.indexOf('http://') === 0 || trimmed.indexOf('https://') === 0) {
      return trimmed;
    }

    if (window.isSupabasePaused && window.isSupabasePaused()) {
      return trimmed;
    }

    if (window.resolveSupabaseStorageUrl) {
      return window.resolveSupabaseStorageUrl(trimmed);
    }

    const supabaseUrl = window.SUPABASE_URL;
    if (!supabaseUrl) return '';

    const bucket = window.SUPABASE_STORAGE_BUCKET || 'images';
    const path = trimmed.charAt(0) === '/' ? trimmed.slice(1) : bucket + '/' + trimmed;
    return supabaseUrl + '/storage/v1/object/public/' + path;
  }
  function getHeroImageUrl(row) {
    const raw =
      row['Hero Image'] ||
      row['hero image'] ||
      row.hero_image ||
      row.hero_image_url ||
      row.image ||
      row.image_url ||
      row.photo ||
      row.photo_url ||
      row.url ||
      row.cover_image ||
      '';
    return resolveImageUrl(String(raw || ''));
  }

  function getSlideImageUrls(row, start, end) {
    const urls = [];
    for (let i = start; i <= end; i += 1) {
      const raw = row['img' + i] || row['img ' + i] || row['image' + i] || '';
      const resolved = resolveImageUrl(String(raw || ''));
      if (resolved) urls.push(resolved);
    }
    return urls;
  }

  function buildSlideshow(urls, caption) {
    if (!urls.length) return '';

    const slides = urls
      .map(function (src) {
        return (
          '<div class="about-mobile-page__slide">' +
            '<img class="about-mobile-page__slide-image" src="' +
            src.replace(/"/g, '&quot;') +
            '" alt="" loading="lazy" decoding="async">' +
          '</div>'
        );
      })
      .join('');

    const captionHtml = caption
      ? '<p class="about-mobile-page__slideshow-caption">' + escapeHtml(caption) + '</p>'
      : '';

    return (
      '<div class="about-mobile-page__section about-mobile-page__slideshow-wrap">' +
        captionHtml +
        '<div class="about-mobile-page__slideshow about-mobile-page__slideshow--auto" aria-label="Image gallery">' +
          '<div class="about-mobile-page__slideshow-track">' + slides + slides + '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function render(row) {
    if (!row) {
      contentEl.innerHTML = '';
      contentEl.hidden = true;
      return;
    }

    const desc1 = getText(row, ['description 1', 'description_1', 'description1']);
    const paragraph2 = getText(row, ['paragraph 2', 'paragraph_2', 'paragraph2', 'description_2', 'description2']);
    const paragraph3 = getText(row, ['paragraph 3', 'paragraph_3', 'paragraph3', 'description_3', 'description3']);
    const paragraph4 = getText(row, ['paragraph 4', 'paragraph_4', 'paragraph4', 'description_4', 'description4']);
    const paragraph5 = getText(row, ['paragraph 5', 'paragraph_5', 'paragraph5', 'description_5', 'description5']);
    const tldr1 = getText(row, ['tldr-1', 'tldr_1', 'tldr1']);
    const tldr2 = getText(row, ['tldr-2', 'tldr_2', 'tldr2']);
    const heroUrl = getHeroImageUrl(row);
    const slideUrls = getSlideImageUrls(row, 1, 6);
    const slideUrlsSecond = getSlideImageUrls(row, 7, 10);
    const parts = [];

    if (desc1) {
      parts.push(
        '<div class="about-mobile-page__section about-mobile-page__intro">' + escapeHtml(desc1) + '</div>'
      );
    }

    if (heroUrl) {
      parts.push(
        '<div class="about-mobile-page__section about-mobile-page__hero">' +
          '<img class="about-mobile-page__hero-image" src="' +
          heroUrl.replace(/"/g, '&quot;') +
          '" alt="" loading="lazy" decoding="async">' +
        '</div>'
      );
    }

    if (paragraph2) {
      parts.push(
        '<div class="about-mobile-page__section">' +
          '<h2 class="about-mobile-page__subheading">What made me switch to HCI?</h2>' +
        '</div>' +
        '<div class="about-mobile-page__section about-mobile-page__intro">' + escapeHtml(paragraph2) + '</div>'
      );
    }

    if (paragraph3) {
      parts.push(
        '<div class="about-mobile-page__section about-mobile-page__intro">' + escapeHtml(paragraph3) + '</div>'
      );
    }

    if (tldr1) {
      parts.push(
        '<div class="about-mobile-page__section">' +
          '<div class="about-mobile-page__tldr">' + escapeHtml(tldr1) + '</div>' +
        '</div>'
      );
    }

    parts.push(buildSlideshow(slideUrls, 'My Time at The University of Queensland.'));

    if (paragraph4) {
      parts.push(
        '<div class="about-mobile-page__section about-mobile-page__intro">' + escapeHtml(paragraph4) + '</div>'
      );
    }

    if (paragraph5) {
      parts.push(
        '<div class="about-mobile-page__section about-mobile-page__intro">' + escapeHtml(paragraph5) + '</div>'
      );
    }

    if (tldr2) {
      parts.push(
        '<div class="about-mobile-page__section">' +
          '<div class="about-mobile-page__tldr">' + escapeHtml(tldr2) + '</div>' +
        '</div>'
      );
    }

    parts.push(buildSlideshow(slideUrlsSecond, ''));

    contentEl.innerHTML = parts.filter(Boolean).join('');
    contentEl.hidden = !parts.length;
  }

  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.hidden = !message;
    statusEl.classList.toggle('about-mobile-page__status--error', Boolean(isError));
    if (message) contentEl.hidden = true;
  }

  async function loadAboutMobileContent() {
    if (loadState === 'loading' || loadState === 'loaded') return;

    if (window.isSupabasePaused && window.isSupabasePaused()) {
      if (window.SUPABASE_DEV_ABOUT_ME) {
        setStatus('', false);
        render(window.SUPABASE_DEV_ABOUT_ME);
        loadState = 'loaded';
        return;
      }

      setStatus('About Me content is paused during development.', true);
      loadState = 'paused';
      return;
    }

    const supabaseUrl = window.SUPABASE_URL;
    const supabaseKey = window.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setStatus('About Me is not configured yet.', true);
      loadState = 'error';
      return;
    }

    loadState = 'loading';
    setStatus('Loading…', false);

    async function fetchAboutRow() {
      const endpoint =
        supabaseUrl +
        '/rest/v1/' +
        encodeURIComponent(aboutTable) +
        '?select=*&limit=1';

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          apikey: supabaseKey,
          Authorization: 'Bearer ' + supabaseKey,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Could not load About Me content.');
      }

      const rows = await response.json();
      return Array.isArray(rows) ? rows[0] : null;
    }

    function applyAboutRow(row) {
      if (!row) {
        setStatus('No About Me content found yet.', true);
        loadState = 'error';
        return;
      }

      setStatus('', false);
      render(row);
      loadState = 'loaded';
    }

    try {
      let row;

      if (window.fetchWithSupabaseCache) {
        row = await window.fetchWithSupabaseCache('about_me:mobile-page', fetchAboutRow, {
          onRevalidate: applyAboutRow
        });
      } else {
        row = await fetchAboutRow();
      }

      applyAboutRow(row);
    } catch (error) {
      setStatus('Could not load About Me content. Please try again.', true);
      loadState = 'error';
    }
  }

  function resetAboutMobileScroll() {
    if (scrollEl) scrollEl.scrollTop = 0;
  }

  if (homeBreadcrumb) {
    homeBreadcrumb.addEventListener('click', function () {
      if (typeof window.closeAboutPanel === 'function') {
        window.closeAboutPanel(true);
      }
    });
  }

  window.loadAboutMobileContent = loadAboutMobileContent;
  window.resetAboutMobileScroll = resetAboutMobileScroll;
})();
