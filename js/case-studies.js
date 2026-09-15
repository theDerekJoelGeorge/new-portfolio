// Case studies list + detail loader (slug-based) using Supabase REST (no build step).
// Requires js/supabase-config.js to be populated.

function mustGetEnv() {
  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;
  const table = window.SUPABASE_PROJECTS_TABLE || 'projects';
  return { url, key, table };
}

function resolveStorageUrl(u) {
  if (!u || typeof u !== 'string') return u;
  return window.resolveSupabaseStorageUrl ? window.resolveSupabaseStorageUrl(u.trim()) : u;
}

function resolveMediaUrl(u) {
  if (!u || typeof u !== 'string') return '';
  const s = u.trim();
  if (!s) return '';
  if (s.startsWith('images/') || s.startsWith('./') || s.startsWith('/')) return s;
  return resolveStorageUrl(s) || s;
}

function supabaseHeaders(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

function getSlugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('slug');
}

const PROJECT_SELECT_LIST = 'id,slug,name,year,role,hero_image_url,hero_description,is_published';
const PROJECT_SELECT_DETAIL = [
  'id',
  'slug',
  'name',
  'breadcrumb_title',
  'year',
  'role',
  'logo_url',
  'hero_image_url',
  'hero_description',
  'contributions',
  'intro_media',
  'challenge_title',
  'challenge_body',
  'challenge_media',
  'ideation_title',
  'ideation_para1',
  'ideation_slides',
  'ideation_para2',
  'ideation_buttons',
  'solution_title',
  'solution_para1',
  'solution_slides',
  'solution_select_prompt',
  'solution_features',
  'solution_buttons',
  'solution_body',
  'solution_observations',
  'reflection_title',
  'reflection_body',
  'reflection_slides',
  'reflection_para2',
  'is_published',
].join(',');

async function fetchProjectsListFromNetwork({ url, key, table }) {
  const select = encodeURIComponent(PROJECT_SELECT_LIST);
  const endpoint =
    `${url}/rest/v1/${table}` +
    `?select=${select}` +
    `&is_published=eq.true` +
    `&order=year.desc.nullslast,name.asc`;
  const res = await fetch(endpoint, { headers: supabaseHeaders(key) });
  if (!res.ok) throw new Error(`Supabase list fetch failed: ${res.status}`);
  return await res.json();
}

async function fetchProjectsList(env, options) {
  if (window.isSupabasePaused && window.isSupabasePaused()) {
    return window.SUPABASE_DEV_PROJECTS ? [...window.SUPABASE_DEV_PROJECTS] : [];
  }
  if (!window.fetchWithSupabaseCache) {
    return fetchProjectsListFromNetwork(env);
  }
  return window.fetchWithSupabaseCache('projects:list', () => fetchProjectsListFromNetwork(env), options);
}

async function fetchProjectBySlugFromNetwork({ url, key, table }, slug) {
  const select = encodeURIComponent(PROJECT_SELECT_DETAIL);
  const endpoint =
    `${url}/rest/v1/${table}` +
    `?select=${select}` +
    `&is_published=eq.true` +
    `&slug=eq.${encodeURIComponent(slug)}` +
    `&limit=1`;
  const res = await fetch(endpoint, { headers: { ...supabaseHeaders(key), Accept: 'application/vnd.pgrst.object+json' } });
  if (!res.ok) throw new Error(`Supabase detail fetch failed: ${res.status}`);
  return await res.json();
}

async function fetchProjectBySlug(env, slug, options) {
  if (window.isSupabasePaused && window.isSupabasePaused()) {
    return window.getSupabaseDevProjectBySlug ? window.getSupabaseDevProjectBySlug(slug) : null;
  }
  if (!window.fetchWithSupabaseCache) {
    return fetchProjectBySlugFromNetwork(env, slug);
  }
  return window.fetchWithSupabaseCache(`project:${slug}`, () => fetchProjectBySlugFromNetwork(env, slug), options);
}

function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getProjectRole(row) {
  return row?.role || '';
}

function tryJson(val) {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
}

function asArray(val) {
  const parsed = tryJson(val);
  return Array.isArray(parsed) ? parsed : [];
}

function formatInline(text) {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function formatRichText(text, className = 'cs-copy') {
  if (!text) return '';
  return String(text)
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p class="${className}">${formatInline(block)}</p>`)
    .join('');
}

function youtubeId(url) {
  if (!url) return '';
  const youtuBe = String(url).match(/(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (youtuBe?.[1]) return youtuBe[1];
  const youtube = String(url).match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:watch\?v=|embed\/|v\/)([a-zA-Z0-9_-]{11})/);
  if (youtube?.[1]) return youtube[1];
  const vParam = String(url).match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  return vParam?.[1] || '';
}

function isVideoUrl(url) {
  return Boolean(youtubeId(url)) || /\.(mp4|webm|ogg)(\?|#|$)/i.test(String(url || ''));
}

function renderMediaPairOrSlideshow(items, alt) {
  const normalized = asArray(items)
    .map((item) => (typeof item === 'string' ? { url: item } : item || {}))
    .filter((item) => String(item.url || '').trim());
  if (!normalized.length) return '';
  if (normalized.length === 2 && normalized.some((item) => isVideoUrl(item.url))) {
    return renderCaptionedPair(normalized, 'pair');
  }
  return renderSlideshow(
    normalized.map((item) => item.url),
    alt
  );
}

function mediaInner(url, alt, variant) {
  const resolved = resolveMediaUrl(url);
  if (!resolved) {
    return `<div class="cs-media cs-media--${variant}" aria-hidden="true"></div>`;
  }

  const videoId = youtubeId(resolved);
  if (videoId) {
    return `
      <div class="cs-media cs-media--${variant} cs-media--embed">
        <iframe
          title="${escapeHtml(alt || 'Video')}"
          src="https://www.youtube.com/embed/${escapeHtml(videoId)}"
          loading="lazy"
          allow="fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    `;
  }

  if (/\.(mp4|webm|ogg)(\?|$)/i.test(resolved)) {
    return `
      <div class="cs-media cs-media--${variant} cs-media--embed">
        <video class="cs-video" autoplay loop muted playsinline preload="metadata" aria-label="${escapeHtml(alt || 'Video')}">
          <source src="${escapeHtml(resolved)}">
        </video>
      </div>
    `;
  }

  return `
    <div class="cs-media cs-media--${variant}">
      <img class="cs-img" src="${escapeHtml(resolved)}" alt="${escapeHtml(alt || '')}" loading="lazy" decoding="async">
    </div>
  `;
}

function renderSlideshow(urls, alt) {
  const slides = Array.isArray(urls) ? urls.map((item) => (typeof item === 'string' ? item : item?.url || '')) : [];
  if (!slides.length) return '';
  if (slides.length === 1) return mediaInner(slides[0], alt, 'hero');

  const slidesHtml = slides
    .map((url, index) => {
      const active = index === 0 ? ' cs-slideshow__slide--active' : '';
      return `<div class="cs-slideshow__slide${active}">${mediaInner(url, `${alt || 'Slide'} ${index + 1}`, 'hero')}</div>`;
    })
    .join('');

  const dots = slides
    .map(
      (_, index) =>
        `<button type="button" class="cs-slideshow__indicator${index === 0 ? ' cs-slideshow__indicator--active' : ''}" data-slide="${index}" aria-label="Go to slide ${index + 1}"></button>`
    )
    .join('');

  return `
    <div class="cs-slideshow">
      <button type="button" class="cs-slideshow__prev" aria-label="Previous image">‹</button>
      <div class="cs-slideshow__container">
        <div class="cs-slideshow__slides">${slidesHtml}</div>
        <div class="cs-slideshow__indicators">${dots}</div>
      </div>
      <button type="button" class="cs-slideshow__next" aria-label="Next image">›</button>
    </div>
  `;
}

function renderCaptionedPair(items, variant = 'pair') {
  const list = asArray(items);
  if (!list.length) return '';
  return `
    <div class="cs-pair">
      ${list
        .map((item) => {
          const caption = item.caption || '';
          const href = item.href || '';
          const url = item.url || '';
          const media = mediaInner(url, caption, variant);
          const linkedMedia = href
            ? `<a class="cs-pair__media-link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${media}</a>`
            : media;
          const captionHtml = caption
            ? href
              ? `<a class="cs-caption" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(caption)}</a>`
              : `<p class="cs-caption">${escapeHtml(caption)}</p>`
            : '';
          return `<figure class="cs-pair__item">${linkedMedia}${captionHtml}</figure>`;
        })
        .join('')}
    </div>
  `;
}

function splitMediaUrls(raw) {
  return String(raw || '')
    .split(/\s+and\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function isLikelyImageUrl(url) {
  const value = String(url || '');
  if (!value) return false;
  if (/\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i.test(value)) return true;
  return /\/storage\/v1\/object\//i.test(value) && !/\.(mp4|webm|mov|ogg)(\?|#|$)/i.test(value);
}

function renderButtons(items) {
  const list = asArray(items).filter((item) => item && item.label);
  if (!list.length) return '';
  return `
    <div class="cs-actions">
      ${list
        .map((item) => {
          const label = escapeHtml(item.label);
          const href = (item.url || '').trim();
          const modal = item.modal && typeof item.modal === 'object' ? item.modal : null;
          if (modal && (modal.body || modal.video_url || (Array.isArray(modal.images) && modal.images.length))) {
            const payload = JSON.stringify({
              body: modal.body || '',
              video_url: modal.video_url || '',
              images: Array.isArray(modal.images) ? modal.images.filter(Boolean) : [],
              title: String(item.label || '').replace(/^Read about (the\s+)?/i, '').trim() || item.label,
            });
            return `<button type="button" class="cs-action" data-modal-article="${escapeHtml(payload)}">${label}</button>`;
          }
          const imageUrls = splitMediaUrls(href)
            .map((part) => resolveMediaUrl(part) || part)
            .filter(Boolean);
          if (imageUrls.length && imageUrls.every(isLikelyImageUrl)) {
            return `<button type="button" class="cs-action" data-modal-images="${escapeHtml(JSON.stringify(imageUrls))}">${label}</button>`;
          }
          if (href) {
            return `<a class="cs-action" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
          }
          return `<span class="cs-action">${label}</span>`;
        })
        .join('')}
    </div>
  `;
}

function renderObservations(items) {
  const list = asArray(items);
  if (!list.length) return '';
  return `
    <div class="cs-notes">
      ${list
        .map((item) => {
          const align = ['left', 'center', 'right'].includes(item.align) ? item.align : 'left';
          const caption = item.caption ? `<p class="cs-notes__caption cs-notes__caption--${align}">${escapeHtml(item.caption)}</p>` : '';
          const imageUrl = String(item.image_url || '').trim();
          const media = imageUrl ? mediaInner(imageUrl, item.caption || '', 'square') : '';
          return `
            <figure class="cs-notes__item">
              ${media}
              ${caption}
            </figure>
          `;
        })
        .join('')}
    </div>
  `;
}

function isSafeFaIcon(icon) {
  return /^fa-(?:solid|regular|brands) fa-[a-z0-9-]+$/.test(String(icon || '').trim());
}

function renderFeatureThumb(feature) {
  const thumbUrl = String(feature.thumb_url || '').trim();
  if (thumbUrl) return mediaInner(thumbUrl, feature.label || '', 'thumb');
  const icon = String(feature.icon || '').trim();
  if (isSafeFaIcon(icon)) {
    return `<div class="cs-media cs-media--thumb cs-media--icon" aria-hidden="true"><i class="${escapeHtml(icon)}"></i></div>`;
  }
  return mediaInner('', feature.label || '', 'thumb');
}

function featureMediaUrls(feature) {
  const raw = feature?.image_url;
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === 'string' ? item : item?.url || ''))
      .flatMap((item) => splitMediaUrls(item));
  }
  return splitMediaUrls(raw);
}

function renderFeatureMedia(feature) {
  const urls = featureMediaUrls(feature);
  const alt = feature?.title || feature?.label || '';
  if (urls.length > 1) return renderSlideshow(urls, alt);
  return mediaInner(urls[0] || '', alt, 'hero');
}

function renderFeaturePicker(features, prompt) {
  const list = asArray(features);
  if (!list.length) return '';
  const first = list[0] || {};
  const thumbs = list
    .map((feature, index) => {
      const active = index === 0 ? ' is-active' : '';
      return `
        <button type="button" class="cs-picker__thumb${active}" data-feature-index="${index}">
          ${renderFeatureThumb(feature)}
          <span class="cs-picker__label">${escapeHtml(feature.label || '')}</span>
        </button>
      `;
    })
    .join('');

  return `
    <div class="cs-picker" data-feature-picker data-count="${list.length}" data-features="${encodeURIComponent(JSON.stringify(list))}">
      ${prompt ? `<p class="cs-copy cs-copy--center">${escapeHtml(prompt)}</p>` : ''}
      <div class="cs-picker__thumbs">${thumbs}</div>
      <h3 class="cs-picker__title" data-feature-title>${escapeHtml(first.title || '')}</h3>
      <div data-feature-desc>${first.description ? `<p class="cs-copy">${escapeHtml(first.description)}</p>` : ''}</div>
      <div data-feature-media>${renderFeatureMedia(first)}</div>
      <div data-feature-body>${formatRichText(first.body || '')}</div>
    </div>
  `;
}

function renderBreak() {
  return `
    <div class="cs-break" aria-hidden="true">
      <img src="images/case-studies/line-break.svg" alt="" width="62" height="20">
    </div>
  `;
}

function renderSection(num, title, bodyHtml) {
  if (!bodyHtml) return '';
  const number = String(num).padStart(2, '0');
  return `
    ${renderBreak()}
    <section class="cs-block">
      <div class="cs-block__head">
        <p class="cs-block__num">${number}</p>
        <h2 class="cs-block__title">${escapeHtml(title || '')}</h2>
      </div>
      ${bodyHtml}
    </section>
  `;
}

function renderList(container, rows) {
  if (!rows?.length) {
    container.innerHTML = `<p>No case studies yet.</p>`;
    return;
  }

  const cards = rows
    .map((r) => {
      const title = escapeHtml(r.name || r.slug);
      const role = escapeHtml(getProjectRole(r));
      const year = r.year ? escapeHtml(r.year) : '';
      const description = escapeHtml(r.hero_description || 'This is the project description.');
      const meta = [role, year].filter(Boolean).join(' | ');
      const heroUrl = resolveMediaUrl(r.hero_image_url);
      const img = heroUrl
        ? `<img class="case-card__img" src="${escapeHtml(heroUrl)}" alt="${title} cover" loading="lazy" decoding="async">`
        : `<div class="case-card__img case-card__img--placeholder" aria-hidden="true"></div>`;

      return `
        <a class="case-card" href="case-study.html?slug=${encodeURIComponent(r.slug)}">
          ${img}
          <div class="case-card__body">
            <div class="case-card__header">
              <h2 class="case-card__title">${title}</h2>
              ${meta ? `<div class="case-card__meta">${meta}</div>` : ''}
            </div>
            <p class="case-card__description">${description}</p>
          </div>
        </a>
      `;
    })
    .join('');

  container.innerHTML = `<div class="case-list">${cards}</div>`;
}

function renderHomeRow(container, rows, limit = 3) {
  const items = (rows || []).slice(0, limit);
  if (!items.length) {
    container.innerHTML = '<p class="case-studies-home__empty">No case studies yet.</p>';
    return;
  }

  const cards = items
    .map((r) => {
      const title = escapeHtml(r.name || r.slug);
      const role = escapeHtml(getProjectRole(r));
      const heroUrl = resolveMediaUrl(r.hero_image_url);
      const img = heroUrl
        ? `<img src="${escapeHtml(heroUrl)}" alt="" loading="lazy" decoding="async">`
        : '';

      return `
        <article class="case-card-home">
          <a
            class="case-card case-card--compact"
            href="case-study.html?slug=${encodeURIComponent(r.slug)}"
            data-stick-target
            aria-label="${title}"
            title="${title}"
          >
            ${img || '<span class="case-card--compact__fallback" aria-hidden="true"></span>'}
            <span class="case-card--compact__label">${title}</span>
          </a>
          ${role ? `<p class="case-card-home__role">${role}</p>` : ''}
        </article>
      `;
    })
    .join('');

  container.innerHTML = cards;
}

function renderDetail(container, row) {
  const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');

  if (!row) {
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = 'Not found';
    container.innerHTML = `<h1 class="cs-hero__title">Not found</h1><p class="cs-copy">No project matches that slug.</p>`;
    return;
  }

  if (row.is_published === false) {
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = 'Not available';
    container.innerHTML = `<h1 class="cs-hero__title">Not available</h1><p class="cs-copy">This case study is not published yet.</p>`;
    return;
  }

  const title = row.name || row.slug;
  if (breadcrumbCurrent) {
    breadcrumbCurrent.textContent = row.breadcrumb_title || title;
  }
  const role = getProjectRole(row);
  const logoUrl = resolveMediaUrl(row.logo_url);
  const logo = logoUrl
    ? `<img class="cs-logo" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(title)} logo" height="102">`
    : '';

  document.title = `${title} — Derek Joel George`;

  const challengeHtml = renderSection(
    1,
    row.challenge_title || 'The Challenge behind the idea',
    formatRichText(row.challenge_body) + renderCaptionedPair(row.challenge_media, 'pair')
  );

  const ideationHtml = renderSection(
    2,
    row.ideation_title || 'Ideation and Prototyping',
    formatRichText(row.ideation_para1) +
      renderSlideshow(asArray(row.ideation_slides), `${title} ideation`) +
      formatRichText(row.ideation_para2) +
      renderButtons(row.ideation_buttons)
  );

  const solutionHtml = renderSection(
    3,
    row.solution_title || 'The final product',
    formatRichText(row.solution_para1) +
      renderMediaPairOrSlideshow(row.solution_slides, `${title} solution`) +
      renderFeaturePicker(row.solution_features, row.solution_select_prompt) +
      renderButtons(row.solution_buttons) +
      formatRichText(row.solution_body) +
      renderObservations(row.solution_observations)
  );

  const reflectionHtml = renderSection(
    4,
    row.reflection_title || 'Reflections',
    formatRichText(row.reflection_body) +
      renderSlideshow(asArray(row.reflection_slides), `${title} reflection`) +
      formatRichText(row.reflection_para2)
  );

  container.innerHTML = `
    ${logo}
    <header class="cs-hero">
      <div class="cs-hero__row">
        <h1 class="cs-hero__title">${escapeHtml(title)}</h1>
        ${role ? `<p class="cs-hero__role">${escapeHtml(role)}</p>` : ''}
      </div>
      ${formatRichText(row.hero_description)}
    </header>
    ${
      row.contributions
        ? `<div class="cs-contrib">
            <p class="cs-contrib__label">// my contributions</p>
            <p class="cs-copy">${escapeHtml(row.contributions)}</p>
          </div>`
        : ''
    }
    ${renderCaptionedPair(row.intro_media, 'pair')}
    ${challengeHtml}
    ${ideationHtml}
    ${solutionHtml}
    ${reflectionHtml}
  `;
}

function initSlideshow(root = document) {
  const slideshows = root.querySelectorAll('.cs-slideshow');
  if (slideshows.length === 0) return;

  slideshows.forEach((slideshow) => {
    if (slideshow.dataset.slideshowBound === 'true') return;
    const slides = slideshow.querySelectorAll('.cs-slideshow__slide');
    const indicators = slideshow.querySelectorAll('.cs-slideshow__indicator');
    if (slides.length <= 1) return;
    slideshow.dataset.slideshowBound = 'true';

    let currentSlide = 0;

    const showSlide = (index) => {
      slides.forEach((slide, i) => {
        slide.classList.toggle('cs-slideshow__slide--active', i === index);
      });
      indicators.forEach((indicator, i) => {
        indicator.classList.toggle('cs-slideshow__indicator--active', i === index);
      });
      currentSlide = index;
    };

    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', (event) => {
        event.stopPropagation();
        showSlide(index);
      });
    });

    const prevBtn = slideshow.querySelector('.cs-slideshow__prev');
    const nextBtn = slideshow.querySelector('.cs-slideshow__next');
    if (prevBtn) {
      prevBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        showSlide((currentSlide - 1 + slides.length) % slides.length);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        showSlide((currentSlide + 1) % slides.length);
      });
    }

    slideshow.addEventListener('click', (event) => {
      if (event.target.closest('.cs-slideshow__indicator')) return;
      if (event.target.closest('.cs-slideshow__prev')) return;
      if (event.target.closest('.cs-slideshow__next')) return;
      if (!event.target.closest('.cs-slideshow__slides')) return;
      showSlide((currentSlide + 1) % slides.length);
    });
  });
}

function initFeaturePicker() {
  document.querySelectorAll('[data-feature-picker]').forEach((root) => {
    let features = [];
    try {
      features = JSON.parse(decodeURIComponent(root.dataset.features || '[]'));
    } catch {
      features = [];
    }
    if (!features.length) return;

    const buttons = root.querySelectorAll('[data-feature-index]');
    const titleEl = root.querySelector('[data-feature-title]');
    const descEl = root.querySelector('[data-feature-desc]');
    const mediaEl = root.querySelector('[data-feature-media]');

    const showFeature = (index) => {
      const feature = features[index] || {};
      buttons.forEach((button, i) => button.classList.toggle('is-active', i === index));
      if (titleEl) titleEl.textContent = feature.title || '';
      if (descEl) descEl.innerHTML = feature.description ? `<p class="cs-copy">${escapeHtml(feature.description)}</p>` : '';
      if (mediaEl) {
        mediaEl.innerHTML = renderFeatureMedia(feature);
        initSlideshow(mediaEl);
      }
      initImageModal();
    };

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        showFeature(Number(button.dataset.featureIndex));
      });
    });
  });
}

function initImageModal() {
  let modal = document.getElementById('cs-image-modal');
  const modalMarkup = `
      <div class="cs-image-modal__overlay"></div>
      <button class="cs-image-modal__close" aria-label="Close image">×</button>
      <button class="cs-image-modal__prev" aria-label="Previous image">‹</button>
      <button class="cs-image-modal__next" aria-label="Next image">›</button>
      <div class="cs-image-modal__content">
        <img class="cs-image-modal__img" src="" alt="">
        <div class="cs-image-modal__dots" hidden></div>
      </div>
    `;
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'cs-image-modal';
    modal.className = 'cs-image-modal';
    modal.innerHTML = modalMarkup;
    document.body.appendChild(modal);
  } else if (!modal.querySelector('.cs-image-modal__dots')) {
    modal.innerHTML = modalMarkup;
    delete modal.dataset.bound;
  }

  const modalImg = modal.querySelector('.cs-image-modal__img');
  const dotsEl = modal.querySelector('.cs-image-modal__dots');
  const closeBtn = modal.querySelector('.cs-image-modal__close');
  const prevBtn = modal.querySelector('.cs-image-modal__prev');
  const nextBtn = modal.querySelector('.cs-image-modal__next');
  const overlay = modal.querySelector('.cs-image-modal__overlay');

  modal._csState = modal._csState || { images: [], index: 0 };

  const updateModalButtons = () => {
    const { images, index } = modal._csState;
    const many = images.length > 1;
    prevBtn.style.display = many ? 'flex' : 'none';
    nextBtn.style.display = many ? 'flex' : 'none';
    if (!dotsEl) return;
    if (!many) {
      dotsEl.hidden = true;
      dotsEl.innerHTML = '';
      return;
    }
    dotsEl.hidden = false;
    dotsEl.innerHTML = images
      .map(
        (_, i) =>
          `<button type="button" class="cs-image-modal__dot${i === index ? ' is-active' : ''}" data-index="${i}" aria-label="Go to image ${i + 1}"></button>`
      )
      .join('');
  };

  const showImage = (nextIndex) => {
    const state = modal._csState;
    if (nextIndex < 0 || nextIndex >= state.images.length) return;
    state.index = nextIndex;
    const imgData = state.images[nextIndex];
    modalImg.hidden = false;
    modalImg.src = imgData.src;
    modalImg.alt = imgData.alt || 'Fullscreen image';
    updateModalButtons();
  };

  const openModal = (imgSrc, imgAlt, allImages = null, startIndex = 0) => {
    const images = allImages && allImages.length ? allImages : [{ src: imgSrc, alt: imgAlt }];
    modal._csState.images = images;
    modal._csState.index = startIndex;
    images.forEach((img) => {
      const preload = new Image();
      preload.src = img.src;
    });
    showImage(startIndex);
    modal.classList.add('cs-image-modal--active');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('cs-image-modal--active');
    document.body.style.overflow = '';
    modal._csState.images = [];
    modal._csState.index = 0;
  };

  const nextImage = () => {
    const { images, index } = modal._csState;
    if (images.length > 1) showImage((index + 1) % images.length);
  };

  const prevImage = () => {
    const { images, index } = modal._csState;
    if (images.length > 1) showImage((index - 1 + images.length) % images.length);
  };

  if (!modal.dataset.bound) {
    modal.dataset.bound = 'true';
    if (closeBtn) closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeModal(); });
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevImage(); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextImage(); });
    if (overlay) overlay.addEventListener('click', closeModal);
    if (dotsEl) {
      dotsEl.addEventListener('click', (e) => {
        const dot = e.target.closest('[data-index]');
        if (!dot) return;
        e.stopPropagation();
        showImage(Number(dot.dataset.index));
      });
    }
    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('cs-image-modal--active')) return;
      if (e.key === 'Escape') closeModal();
      else if (e.key === 'ArrowLeft') prevImage();
      else if (e.key === 'ArrowRight') nextImage();
    });
  }

  const caseStudyContainer = document.getElementById('caseStudy');
  if (!caseStudyContainer) return;

  caseStudyContainer.querySelectorAll('.cs-slideshow').forEach((slideshow) => {
    const slides = slideshow.querySelectorAll('.cs-slideshow__slide');
    const allSlideshowImages = [];
    slides.forEach((slide) => {
      const img = slide.querySelector('img');
      if (img?.src) allSlideshowImages.push({ src: img.src, alt: img.alt || '' });
    });

    slides.forEach((slide, slideIndex) => {
      const img = slide.querySelector('img');
      if (!img || img.dataset.modalEnabled) return;
      img.dataset.modalEnabled = 'true';
      img.style.cursor = 'pointer';
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        if (allSlideshowImages.length > 0) openModal('', '', allSlideshowImages, slideIndex);
      });
    });
  });

  caseStudyContainer.querySelectorAll('.cs-media img.cs-img').forEach((img) => {
    if (img.dataset.modalEnabled || img.closest('.cs-slideshow') || img.closest('a[href]')) return;
    img.dataset.modalEnabled = 'true';
    img.style.cursor = 'pointer';
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      const src = img.src || img.getAttribute('src');
      if (src) openModal(src, img.alt || '');
    });
  });

  caseStudyContainer.querySelectorAll('[data-modal-images]').forEach((button) => {
    if (button.dataset.modalEnabled) return;
    button.dataset.modalEnabled = 'true';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      let urls = [];
      try {
        urls = JSON.parse(button.getAttribute('data-modal-images') || '[]');
      } catch {
        urls = [];
      }
      const label = (button.textContent || 'Image').trim();
      const images = (Array.isArray(urls) ? urls : [])
        .flatMap((src) => splitMediaUrls(src))
        .map((src) => {
          try {
            return new URL(resolveMediaUrl(src) || src).href;
          } catch {
            return resolveMediaUrl(src) || src;
          }
        })
        .filter(Boolean)
        .map((src, index) => ({ src, alt: `${label} ${index + 1}` }));
      if (images.length) openModal('', '', images, 0);
    });
  });
}

function initArticleModal() {
  let modal = document.getElementById('cs-article-modal');
  if (modal && !modal.querySelector('[data-article-slides]')) {
    modal.remove();
    modal = null;
  }
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'cs-article-modal';
    modal.className = 'cs-article-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="cs-article-modal__overlay"></div>
      <div class="resume-window cs-article-modal__window">
        <div class="resume-window__titlebar">
          <div class="resume-window__controls" aria-label="Window controls">
            <button type="button" class="resume-window__dot resume-window__dot--close" data-article-close aria-label="Close"></button>
            <button type="button" class="resume-window__dot resume-window__dot--minimize" data-article-close aria-label="Close"></button>
            <button type="button" class="resume-window__dot resume-window__dot--zoom" data-article-zoom aria-label="Fullscreen"></button>
          </div>
          <p class="resume-window__title" data-article-title>Technical Implementation</p>
          <div class="resume-window__actions" aria-hidden="true"></div>
        </div>
        <div class="resume-window__content cs-article-modal__content">
          <div class="cs-article-modal__layout">
            <div class="cs-article-modal__copy"></div>
            <div class="cs-article-modal__media" hidden>
              <iframe title="Video" src="" allow="fullscreen; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe>
              <div class="cs-article-modal__slides" data-article-slides hidden>
                <button type="button" class="cs-article-modal__slide-nav cs-article-modal__slide-nav--prev" data-article-prev aria-label="Previous image">‹</button>
                <img class="cs-article-modal__slide-img" alt="">
                <button type="button" class="cs-article-modal__slide-nav cs-article-modal__slide-nav--next" data-article-next aria-label="Next image">›</button>
                <div class="cs-article-modal__slide-dots" data-article-dots></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const overlay = modal.querySelector('.cs-article-modal__overlay');
  const closeBtns = modal.querySelectorAll('[data-article-close]');
  const zoomBtn = modal.querySelector('[data-article-zoom]');
  const titleEl = modal.querySelector('[data-article-title]');
  const copyEl = modal.querySelector('.cs-article-modal__copy');
  const mediaEl = modal.querySelector('.cs-article-modal__media');
  const iframe = mediaEl ? mediaEl.querySelector('iframe') : null;
  const slidesEl = modal.querySelector('[data-article-slides]');
  const slideImg = modal.querySelector('.cs-article-modal__slide-img');
  const dotsEl = modal.querySelector('[data-article-dots]');
  const prevBtn = modal.querySelector('[data-article-prev]');
  const nextBtn = modal.querySelector('[data-article-next]');

  modal._articleSlides = modal._articleSlides || { images: [], index: 0 };

  const renderSlide = (index) => {
    const images = modal._articleSlides.images;
    if (!images.length || !slideImg) return;
    const nextIndex = (index + images.length) % images.length;
    modal._articleSlides.index = nextIndex;
    slideImg.src = images[nextIndex];
    slideImg.alt = `Slide ${nextIndex + 1}`;
    if (dotsEl) {
      dotsEl.querySelectorAll('button').forEach((dot, i) => {
        dot.classList.toggle('is-active', i === nextIndex);
      });
    }
  };

  const closeModal = () => {
    modal.classList.remove('cs-article-modal--active');
    modal.classList.remove('cs-article-modal--fullscreen');
    if (zoomBtn) zoomBtn.setAttribute('aria-pressed', 'false');
    document.body.style.overflow = '';
    if (iframe) iframe.src = '';
    if (slideImg) slideImg.src = '';
    if (mediaEl) mediaEl.hidden = true;
    if (slidesEl) slidesEl.hidden = true;
    modal._articleSlides = { images: [], index: 0 };
  };

  const toggleFullscreen = () => {
    const next = !modal.classList.contains('cs-article-modal--fullscreen');
    modal.classList.toggle('cs-article-modal--fullscreen', next);
    if (zoomBtn) zoomBtn.setAttribute('aria-pressed', next ? 'true' : 'false');
  };

  const openModal = (data) => {
    const title = String(data.title || 'Technical Implementation').trim();
    const body = String(data.body || '').trim();
    const videoUrl = String(data.video_url || '').trim();
    const videoId = youtubeId(videoUrl);
    const images = (Array.isArray(data.images) ? data.images : [])
      .map((src) => resolveMediaUrl(src) || src)
      .filter(Boolean);

    if (titleEl) titleEl.textContent = title;
    modal.setAttribute('aria-label', title);
    if (copyEl) copyEl.innerHTML = body ? formatRichText(body, 'cs-article-modal__text') : '';

    if (iframe) iframe.src = '';
    if (slidesEl) slidesEl.hidden = true;

    if (images.length && mediaEl && slidesEl && slideImg) {
      mediaEl.hidden = false;
      slidesEl.hidden = false;
      if (iframe) iframe.hidden = true;
      modal._articleSlides.images = images;
      modal._articleSlides.index = 0;
      images.forEach((src) => {
        const preload = new Image();
        preload.src = src;
      });
      if (dotsEl) {
        dotsEl.innerHTML = images
          .map(
            (_, i) =>
              `<button type="button" class="cs-article-modal__slide-dot${i === 0 ? ' is-active' : ''}" data-slide-index="${i}" aria-label="Go to image ${i + 1}"></button>`
          )
          .join('');
      }
      if (prevBtn) prevBtn.hidden = images.length < 2;
      if (nextBtn) nextBtn.hidden = images.length < 2;
      renderSlide(0);
    } else if (iframe && mediaEl && videoId) {
      mediaEl.hidden = false;
      iframe.hidden = false;
      iframe.title = title || 'Video';
      iframe.src = `https://www.youtube.com/embed/${videoId}`;
      if (prevBtn) prevBtn.hidden = true;
      if (nextBtn) nextBtn.hidden = true;
    } else if (mediaEl) {
      mediaEl.hidden = true;
      if (iframe) iframe.src = '';
    }

    modal.classList.add('cs-article-modal--active');
    document.body.style.overflow = 'hidden';
    const primaryClose = modal.querySelector('[data-article-close]');
    if (primaryClose) primaryClose.focus();
  };

  if (!modal.dataset.bound) {
    modal.dataset.bound = 'true';
    closeBtns.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        closeModal();
      });
    });
    if (zoomBtn) {
      zoomBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleFullscreen();
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        renderSlide(modal._articleSlides.index - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        renderSlide(modal._articleSlides.index + 1);
      });
    }
    if (dotsEl) {
      dotsEl.addEventListener('click', (event) => {
        const dot = event.target.closest('[data-slide-index]');
        if (!dot) return;
        event.stopPropagation();
        renderSlide(Number(dot.dataset.slideIndex));
      });
    }
    if (overlay) overlay.addEventListener('click', closeModal);
    document.addEventListener('keydown', (event) => {
      if (!modal.classList.contains('cs-article-modal--active')) return;
      if (event.key === 'Escape') closeModal();
      if (!modal._articleSlides.images.length) return;
      if (event.key === 'ArrowLeft') renderSlide(modal._articleSlides.index - 1);
      if (event.key === 'ArrowRight') renderSlide(modal._articleSlides.index + 1);
    });
  }

  const caseStudyContainer = document.getElementById('caseStudy');
  if (!caseStudyContainer) return;

  caseStudyContainer.querySelectorAll('[data-modal-article]').forEach((button) => {
    if (button.dataset.articleModalEnabled) return;
    button.dataset.articleModalEnabled = 'true';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      let data = {};
      try {
        data = JSON.parse(button.getAttribute('data-modal-article') || '{}');
      } catch {
        data = {};
      }
      if (data.body || data.video_url || (Array.isArray(data.images) && data.images.length)) openModal(data);
    });
  });
}

function bindDetail(container, row) {
  renderDetail(container, row);
  initSlideshow();
  initFeaturePicker();
  initImageModal();
  initArticleModal();
}

async function init() {
  const { url, key, table } = mustGetEnv();
  if (window.isSupabasePaused && window.isSupabasePaused()) {
    console.info('[portfolio] Supabase fetching is paused — using local dev data. Set SUPABASE_PAUSED = false in js/supabase-config.js to go live.');
  }
  if (!url || !key) {
    const listRoot = document.getElementById('caseStudiesList');
    const detailRoot = document.getElementById('caseStudy');
    const homeRow = document.getElementById('caseStudiesRow');
    const msg = `<p>Supabase is not configured (missing URL or anon key).</p>`;
    if (listRoot) listRoot.innerHTML = msg;
    if (detailRoot) detailRoot.innerHTML = msg;
    if (homeRow) homeRow.innerHTML = `<p class="case-studies-home__empty">Supabase is not configured.</p>`;
    return;
  }

  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    const toggle = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      backToTop.classList.toggle('is-visible', y > 400);
    };
    toggle();
    window.addEventListener('scroll', toggle, { passive: true });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const slug = getSlugFromUrl();

  const homeRow = document.getElementById('caseStudiesRow');
  if (homeRow) {
    const rows = await fetchProjectsList({ url, key, table }, {
      onRevalidate: (freshRows) => renderHomeRow(homeRow, freshRows, 3),
    });
    renderHomeRow(homeRow, rows, 3);
  }

  const detailRoot = document.getElementById('caseStudy');
  if (detailRoot && slug) {
    const row = await fetchProjectBySlug({ url, key, table }, slug, {
      onRevalidate: (freshRow) => bindDetail(detailRoot, freshRow),
    });
    bindDetail(detailRoot, row);
    return;
  }

  const listRoot = document.getElementById('caseStudiesList');
  if (listRoot) {
    const rows = await fetchProjectsList({ url, key, table }, {
      onRevalidate: (freshRows) => renderList(listRoot, freshRows),
    });
    renderList(listRoot, rows);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  init().catch((e) => {
    console.error(e);
    const listRoot = document.getElementById('caseStudiesList');
    const detailRoot = document.getElementById('caseStudy');
    const homeRow = document.getElementById('caseStudiesRow');
    const message = e?.message ? escapeHtml(e.message) : 'Unknown error';
    const hint = `
      <p><strong>Nothing will show if:</strong></p>
      <ul>
        <li><code>is_published</code> is not <code>true</code> on the row</li>
        <li>Supabase RLS blocks reads for anon users</li>
      </ul>
    `;
    const html = `<div><p><strong>Supabase error:</strong> ${message}</p>${hint}</div>`;
    if (listRoot) listRoot.innerHTML = html;
    if (detailRoot) detailRoot.innerHTML = html;
    if (homeRow) homeRow.innerHTML = `<p class="case-studies-home__empty">Could not load case studies.</p>`;
  });
});
