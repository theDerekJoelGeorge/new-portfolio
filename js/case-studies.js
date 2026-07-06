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

async function fetchProjectsListFromNetwork({ url, key, table }) {
  const select = encodeURIComponent('id,slug,name,year,role,hero_image_url,hero_description,is_published');
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
  const select = encodeURIComponent(
    [
      'id',
      'slug',
      'name',
      'year',
      'role',
      'hero_image_url',
      'hero_description',
      'my_role_para1',
      'my_role_image1',
      'my_role_para2',
      'my_role_image2',
      'my_role_para3',
      'challenge_para1',
      'challenge_image1',
      'challenge_para2',
      'challenge_quote',
      'challenge_quote_attribution',
      'research_para1',
      'research_image1',
      'research_para2',
      'research_image2',
      'research_para3',
      'research_para4',
      'research_cards',
      'research_citations',
      'ideation_para1',
      'ideation_image1',
      'ideation_para2',
      'ideation_image2',
      'ideation_cards',
      'solution_para1',
      'solution_image1',
      'solution_para2',
      'solution_image2',
      'solution_para3',
      'solution_image3',
      'feature_pages',
      'testing_para1',
      'testing_image1',
      'testing_para2',
      'results_stats',
      'ethics_para1',
      'ethics_image1',
      'ethics_para2',
      'reflection_para1',
      'reflection_image1',
      'reflection_para2',
      'figma_embed_url',
      'personas_image_url',
      'storyboard_image_url',
      'is_published',
    ].join(',')
  );
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

function formatCitationLine(line) {
  const trimmed = String(line ?? '').trim().replace(/^[-*•]\s+/, '');
  if (!trimmed) return '';

  return trimmed
    .split(/(\*[^*]+\*)/g)
    .map((part) => {
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return `<em>${escapeHtml(part.slice(1, -1))}</em>`;
      }
      return escapeHtml(part);
    })
    .join('');
}

const PROJECT_ROLE_LABELS = {
  seasaw: 'Interaction Designer',
  unmoot: 'UX Designer',
  eventhive: 'Product Designer',
};

function getProjectRole(row) {
  const slug = String(row?.slug || '').toLowerCase();
  if (PROJECT_ROLE_LABELS[slug]) return PROJECT_ROLE_LABELS[slug];
  return row?.role || '';
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
      const heroUrl = resolveStorageUrl(r.hero_image_url);
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
      const heroUrl = resolveStorageUrl(r.hero_image_url);
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
  if (!row) {
    const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = 'Not found';
    container.innerHTML = `<h1 class="case-study__title">Not found</h1><p class="case-study__subtitle">No project matches that slug.</p>`;
    return;
  }

  if (row.is_published === false) {
    container.innerHTML = `<h1 class="case-study__title">Not available</h1><p class="case-study__subtitle">This case study is not published yet.</p>`;
    return;
  }

  const title = escapeHtml(row.name || row.slug);
  const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = row.name || row.slug || 'Case Study';
  const subtitle = escapeHtml(getProjectRole(row));
  const year = row.year ? `<span class="case-study__meta">${escapeHtml(row.year)}</span>` : '';
  const coverUrl = resolveStorageUrl(row.hero_image_url);
  const cover = coverUrl
    ? `<img class="case-study__cover" src="${escapeHtml(coverUrl)}" alt="${title} cover" loading="lazy" decoding="async">`
    : '';

  const section = (heading, bodyHtml) => {
    if (!bodyHtml) return '';
    return `<section class="cs-section"><h2 class="cs-section__title">${escapeHtml(heading)}</h2>${bodyHtml}</section>`;
  };

  // Helper to convert YouTube URL to embed URL
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    // Match various YouTube URL formats including https://
    // Handles: youtube.com/watch?v=, youtube.com/embed/, youtube.com/v/, youtu.be/
    let videoId = null;
    
    // Try youtu.be format first (simpler)
    const youtuBeMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (youtuBeMatch && youtuBeMatch[1]) {
      videoId = youtuBeMatch[1];
    } else {
      // Try youtube.com formats
      const youtubeMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:watch\?v=|embed\/|v\/)([a-zA-Z0-9_-]{11})/);
      if (youtubeMatch && youtubeMatch[1]) {
        videoId = youtubeMatch[1];
      } else {
        // Try with v= parameter
        const vParamMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        if (vParamMatch && vParamMatch[1]) {
          videoId = vParamMatch[1];
        }
      }
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return '';
  };

  // Helper to create YouTube embed HTML
  const createYouTubeEmbed = (embedUrl, originalUrl) => {
    return `
      <div class="cs-embed">
        <iframe
          title="YouTube video"
          src="${escapeHtml(embedUrl)}"
          style="border:0;border-radius:12px;"
          width="100%"
          height="480"
          loading="lazy"
          allow="fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowfullscreen
        ></iframe>
        <p class="cs-embed__fallback">
          <a href="${escapeHtml(originalUrl || embedUrl)}" target="_blank" rel="noreferrer noopener">View Video on Youtube</a>
        </p>
      </div>
    `;
  };

  // Helper to convert text with bullet points to HTML with lists
  const formatTextWithBullets = (text) => {
    if (!text) return '';
    
    // Match YouTube URLs with http:// or https://, with or without www
    // Handles: youtube.com/watch?v=, youtube.com/embed/, youtube.com/v/, youtu.be/
    // More explicit pattern to ensure https:// is matched
    const youtubeRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11}))/gi;
    const lines = String(text).split('\n');
    let html = '';
    let inList = false;
    let listItems = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) continue;
      
      // Check for YouTube URLs in the line
      const youtubeMatches = [...line.matchAll(youtubeRegex)];
      
      if (youtubeMatches.length > 0) {
        // If we were in a list, close it
        if (inList) {
          html += `<ul class="cs-list">${listItems.map(item => `<li class="cs-list__item">${item}</li>`).join('')}</ul>`;
          listItems = [];
          inList = false;
        }
        
        // Split line by YouTube URLs and process each segment
        let lastIndex = 0;
        for (const match of youtubeMatches) {
          // Add text before the YouTube URL
          const beforeText = line.substring(lastIndex, match.index).trim();
          if (beforeText) {
            // Check if this segment is a bullet
            const isBullet = /^[-*•]\s+/.test(beforeText) || /^\d+\.\s+/.test(beforeText);
            if (isBullet) {
              if (!inList) inList = true;
              const content = beforeText.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '');
              listItems.push(escapeHtml(content));
            } else {
              if (inList) {
                html += `<ul class="cs-list">${listItems.map(item => `<li class="cs-list__item">${item}</li>`).join('')}</ul>`;
                listItems = [];
                inList = false;
              }
              html += `<p class="cs-p">${escapeHtml(beforeText)}</p>`;
            }
          }
          
          // Add YouTube embed
          const embedUrl = getYouTubeEmbedUrl(match[0]);
          if (embedUrl) {
            if (inList) {
              html += `<ul class="cs-list">${listItems.map(item => `<li class="cs-list__item">${item}</li>`).join('')}</ul>`;
              listItems = [];
              inList = false;
            }
            html += createYouTubeEmbed(embedUrl, match[0]);
          } else {
            // If embed URL extraction failed, log for debugging
            console.warn('Failed to extract YouTube embed URL from:', match[0]);
          }
          
          lastIndex = match.index + match[0].length;
        }
        
        // Add remaining text after the last YouTube URL
        const afterText = line.substring(lastIndex).trim();
        if (afterText) {
          const isBullet = /^[-*•]\s+/.test(afterText) || /^\d+\.\s+/.test(afterText);
          if (isBullet) {
            if (!inList) inList = true;
            const content = afterText.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '');
            listItems.push(escapeHtml(content));
          } else {
            if (inList) {
              html += `<ul class="cs-list">${listItems.map(item => `<li class="cs-list__item">${item}</li>`).join('')}</ul>`;
              listItems = [];
              inList = false;
            }
            html += `<p class="cs-p">${escapeHtml(afterText)}</p>`;
          }
        }
      } else {
        // No YouTube URLs, process normally
        // Check if line starts with bullet markers: -, *, •, or numbered (1. 2. etc)
        const isBullet = /^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line);
        
        if (isBullet) {
          // Start list if not already in one
          if (!inList) {
            inList = true;
          }
          // Remove bullet marker and add to list
          const content = line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '');
          listItems.push(escapeHtml(content));
        } else {
          // If we were in a list, close it
          if (inList) {
            html += `<ul class="cs-list">${listItems.map(item => `<li class="cs-list__item">${item}</li>`).join('')}</ul>`;
            listItems = [];
            inList = false;
          }
          // Add regular paragraph if line has content
          html += `<p class="cs-p">${escapeHtml(line)}</p>`;
        }
      }
    }
    
    // Close any remaining list
    if (inList && listItems.length > 0) {
      html += `<ul class="cs-list">${listItems.map(item => `<li class="cs-list__item">${item}</li>`).join('')}</ul>`;
    }
    
    return html || `<p class="cs-p">${escapeHtml(text)}</p>`;
  };

  const heroDesc = row.hero_description ? formatTextWithBullets(row.hero_description) : '';

  const paras = (...vals) => {
    const ps = vals.filter(Boolean).map((v) => formatTextWithBullets(v)).join('');
    return ps || '';
  };

  const img = (url, alt, caption) => {
    if (!url) return '';
    const resolved = resolveStorageUrl(url);
    const imgTag = `<img class="cs-img" src="${escapeHtml(resolved)}" alt="${escapeHtml(alt || 'Project image')}" loading="lazy" decoding="async">`;
    if (caption) {
      return `<figure class="cs-figure">${imgTag}<figcaption class="cs-figure__caption">${escapeHtml(caption)}</figcaption></figure>`;
    }
    return imgTag;
  };

  // Helper to interleave paragraphs and images: para1 + img1 + para2 + img2 + para3 + img3
  const parasWithImages = (para1, img1, img1Alt, para2, img2, img2Alt, para3, img3, img3Alt) => {
    let html = '';
    if (para1) html += formatTextWithBullets(para1);
    if (img1) html += img(img1, img1Alt || 'Project image');
    if (para2) html += formatTextWithBullets(para2);
    if (img2) html += img(img2, img2Alt || 'Project image');
    if (para3) html += formatTextWithBullets(para3);
    if (img3) html += img(img3, img3Alt || 'Project image');
    return html;
  };

  // Helper for two paragraphs with one image: para1 + img1 + para2
  const parasWithImage = (para1, img1, img1Alt, para2) => {
    let html = '';
    if (para1) html += formatTextWithBullets(para1);
    if (img1) html += img(img1, img1Alt || 'Project image');
    if (para2) html += formatTextWithBullets(para2);
    return html;
  };

  const quote = (q, by) =>
    q
      ? `<figure class="cs-quote"><blockquote>${escapeHtml(q)}</blockquote>${by ? `<figcaption>${escapeHtml(by)}</figcaption>` : ''}</figure>`
      : '';

  const tryJson = (val) => {
    if (!val) return null;
    if (typeof val === 'object') return val;
    try {
      return JSON.parse(val);
    } catch {
      return null;
    }
  };

  const cards = (val) => {
    const arr = tryJson(val);
    if (!Array.isArray(arr) || arr.length === 0) return '';
    const items = arr
      .map((c) => {
        const t = escapeHtml(c.title || c.heading || '');
        const statValue = escapeHtml(c.stat || c.value || c.metric || '');
        const statLabel = escapeHtml(c.label || c.k || '');
        const d = escapeHtml(c.description || c.body || c.text || '');
        const statHtml = statValue
          ? `<div class="cs-card__stat">
               ${statLabel ? `<div class="cs-card__statLabel">${statLabel}</div>` : ''}
               <div class="cs-card__statValue">${statValue}</div>
             </div>`
          : '';
        return `<div class="cs-card">${t ? `<div class="cs-card__t">${t}</div>` : ''}${statHtml}${d ? `<div class="cs-card__d">${d}</div>` : ''}</div>`;
      })
      .join('');
    return `<div class="cs-cards">${items}</div>`;
  };

  // Helper for ideation cards - displays only media files, with slideshow if multiple
  const ideationCards = (val) => {
    const arr = tryJson(val);
    if (!Array.isArray(arr) || arr.length === 0) return '';
    
    // Helper to extract media URLs from a card object
    const extractMediaUrls = (card) => {
      if (!card || typeof card !== 'object') return [];
      const urls = [];
      
      // Check demo_media (array or string)
      if (Array.isArray(card.demo_media)) {
        urls.push(...card.demo_media.filter(u => typeof u === 'string' && u.trim()));
      } else if (card.demo_media && typeof card.demo_media === 'string') {
        urls.push(card.demo_media);
      }
      
      // Check other common media fields
      const mediaFields = ['media_url', 'mediaUrl', 'video_url', 'videoUrl', 'gif_url', 'gifUrl', 'image_url', 'imageUrl'];
      for (const field of mediaFields) {
        if (card[field] && typeof card[field] === 'string' && card[field].trim()) {
          urls.push(card[field]);
        }
      }
      
      // Check if any string value looks like a URL
      for (const value of Object.values(card)) {
        if (typeof value === 'string' && value.trim()) {
          const trimmed = value.trim();
          if (/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|mp4|webm|ogg)(\?.*)?$/i.test(trimmed)) {
            urls.push(trimmed);
          }
        }
      }
      
      return urls.filter((url, index, self) => self.indexOf(url) === index); // Deduplicate
    };
    
    // Collect all media URLs from all cards
    const allMediaUrls = [];
    arr.forEach(card => {
      const urls = extractMediaUrls(card);
      allMediaUrls.push(...urls);
    });
    
    if (allMediaUrls.length === 0) return '';
    
    // If only one media file, display it directly
    if (allMediaUrls.length === 1) {
      const url = allMediaUrls[0];
      const mediaLower = url.toLowerCase();
      const isVideo = /\.(mp4|webm|ogg)(\?.*)?$/.test(mediaLower);
      const isGif = /\.(gif)(\?.*)?$/.test(mediaLower);
      
      if (isVideo) {
        return `
          <div class="cs-embed">
            <video class="cs-video" autoplay loop muted playsinline preload="metadata">
              <source src="${escapeHtml(url)}" type="video/mp4">
            </video>
          </div>
        `;
      } else if (isGif) {
        return `
          <div class="cs-embed">
            <img class="cs-img" src="${escapeHtml(url)}" alt="Ideation card media">
          </div>
        `;
      } else {
        return `<img class="cs-img" src="${escapeHtml(url)}" alt="Ideation card media">`;
      }
    }
    
    // Multiple media files - create slideshow
    const slideshowSlides = allMediaUrls.map((url, index) => {
      const mediaLower = url.toLowerCase();
      const isVideo = /\.(mp4|webm|ogg)(\?.*)?$/.test(mediaLower);
      const isGif = /\.(gif)(\?.*)?$/.test(mediaLower);
      
      let slideMedia = '';
      if (isVideo) {
        slideMedia = `
          <div class="cs-embed">
            <video class="cs-video" autoplay loop muted playsinline preload="metadata" aria-label="Ideation card video">
              <source src="${escapeHtml(url)}" type="video/mp4">
            </video>
          </div>
        `;
      } else if (isGif) {
        slideMedia = `
          <div class="cs-embed">
            <img class="cs-img" src="${escapeHtml(url)}" alt="Ideation card media">
          </div>
        `;
      } else {
        slideMedia = `
          <div class="cs-embed">
            <img class="cs-img" src="${escapeHtml(url)}" alt="Ideation card media">
          </div>
        `;
      }
      
      return `<div class="cs-slideshow__slide${index === 0 ? ' cs-slideshow__slide--active' : ''}">${slideMedia}</div>`;
    }).join('');
    
    const slideIndicators = allMediaUrls.map((_, index) => 
      `<button class="cs-slideshow__indicator${index === 0 ? ' cs-slideshow__indicator--active' : ''}" data-slide="${index}" aria-label="Go to slide ${index + 1}"></button>`
    ).join('');
    
    const slideshowHtml = `
      <div class="cs-slideshow">
        <div class="cs-slideshow__container">
          <button class="cs-slideshow__prev" aria-label="Previous slide">‹</button>
          <div class="cs-slideshow__slides">${slideshowSlides}</div>
          <button class="cs-slideshow__next" aria-label="Next slide">›</button>
        </div>
        <div class="cs-slideshow__indicators">${slideIndicators}</div>
      </div>
    `;
    
    return slideshowHtml;
  };

  const stats = (val) => {
    const arr = tryJson(val);
    if (!Array.isArray(arr) || arr.length === 0) return '';
    const items = arr
      .map((s) => {
        const k = escapeHtml(s.k || s.label || '');
        const v = escapeHtml(s.v || s.value || s.stat || s.metric || '');
        return `<div class="cs-stat">${v ? `<div class="cs-stat__v">${v}</div>` : ''}${k ? `<div class="cs-stat__k">${k}</div>` : ''}</div>`;
      })
      .join('');
    return `<div class="cs-stats">${items}</div>`;
  };

  const citations = (val) => {
    if (!val) return '';
    // Try to parse as JSON array first
    const arr = tryJson(val);
    if (Array.isArray(arr) && arr.length > 0) {
      const items = arr
        .map((item) => {
          const text = typeof item === 'string' ? item : item.text || item.citation || String(item);
          return `<li class="cs-citations__item">${formatCitationLine(text)}</li>`;
        })
        .join('');
      return `<ul class="cs-citations__list">${items}</ul>`;
    }
    // If not an array, treat as string and split by newlines
    const text = String(val).trim();
    if (!text) return '';
    const lines = text.split(/\n+/).filter((line) => line.trim());
    if (lines.length === 0) return '';
    const items = lines.map((line) => `<li class="cs-citations__item">${formatCitationLine(line)}</li>`).join('');
    return `<ul class="cs-citations__list">${items}</ul>`;
  };

  const embedMedia = (url) => {
    if (!url) return '';
    const raw = url.trim();
    const lower = raw.toLowerCase();

    // Video files
    if (/\.(mp4|webm|ogg)(\?.*)?$/.test(lower)) {
      const type =
        /\.(mp4)(\?.*)?$/.test(lower)
          ? 'video/mp4'
          : /\.(webm)(\?.*)?$/.test(lower)
            ? 'video/webm'
            : 'video/ogg';
      return `
        <div class="cs-embed">
          <video class="cs-video" controls preload="metadata" playsinline>
            <source src="${escapeHtml(raw)}" type="${type}">
            Sorry, your browser doesn’t support embedded video.
          </video>
          <p class="cs-embed__fallback">
            If the video doesn’t load, <a href="${escapeHtml(raw)}" target="_blank" rel="noreferrer noopener">open it in a new tab</a>.
          </p>
        </div>
      `;
    }

    // GIFs (render as images)
    if (/\.(gif)(\?.*)?$/.test(lower)) {
      return `
        <div class="cs-embed">
          <img class="cs-img" src="${escapeHtml(raw)}" alt="Embedded media">
        </div>
      `;
    }

    // Figma embeds (fallback for design prototypes)
    if (raw.includes('figma.com')) {
      // Normalize Figma URL - ensure it's an embed URL
      let embedUrl = raw;

      const isEmbedWrapper = embedUrl.includes('figma.com/embed') || embedUrl.includes('embed.figma.com/embed');

      // If user pasted an embed.figma.com/proto link, convert to the standard embed wrapper.
      if (embedUrl.includes('embed.figma.com/proto/')) {
        const asProto = embedUrl.replace('https://embed.figma.com/proto/', 'https://www.figma.com/proto/');
        embedUrl = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(asProto)}`;
      }

      if (!isEmbedWrapper && (embedUrl.includes('figma.com/file/') || embedUrl.includes('figma.com/proto/'))) {
        embedUrl = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(embedUrl)}`;
      }

      const safeEmbedUrl = escapeHtml(embedUrl);
      const fallbackHref = escapeHtml(raw);

      return `
        <div class="cs-embed">
          <iframe
            title="Figma embed"
            src="${safeEmbedUrl}"
            style="border:0;border-radius:12px;"
            width="100%"
            height="480"
            loading="lazy"
            allow="fullscreen; clipboard-write"
            allowfullscreen
            referrerpolicy="strict-origin-when-cross-origin"
          ></iframe>
          <p class="cs-embed__fallback">
            If the embed doesn’t load, <a href="${fallbackHref}" target="_blank" rel="noreferrer noopener">open it in a new tab</a>.
          </p>
        </div>
      `;
    }

    // Generic iframe embed (YouTube/Vimeo/etc.)
    return `
      <div class="cs-embed">
        <iframe
          title="Embedded media"
          src="${escapeHtml(raw)}"
          style="border:0;border-radius:12px;"
          width="100%"
          height="480"
          loading="lazy"
          allow="fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowfullscreen
        ></iframe>
        <p class="cs-embed__fallback">
          If the embed doesn’t load, <a href="${escapeHtml(raw)}" target="_blank" rel="noreferrer noopener">open it in a new tab</a>.
        </p>
      </div>
    `;
  };

  const featurePages = (val) => {
    const parsed = tryJson(val);

    // Supported shapes:
    // 1) ["https://...","https://..."]
    // 2) [{ url/image_url, title?, description? }, ...]
    // 3) { title?: "...", description: "...", pages/items: [...] }
    let description = '';
    let titleText = '';
    let pages = [];

    if (Array.isArray(parsed)) {
      pages = parsed;
      // arrays can't have .description/.title in JSON, so ignore
    } else if (parsed && typeof parsed === 'object') {
      titleText = String(parsed.title ?? '');
      description = String(parsed.description ?? '');
      if (Array.isArray(parsed.pages)) pages = parsed.pages;
      else if (Array.isArray(parsed.items)) pages = parsed.items;
      else if (Array.isArray(parsed.feature_pages)) pages = parsed.feature_pages;
      else if (Array.isArray(parsed.images)) pages = parsed.images;
    } else {
      // Not JSON (or empty)
      return { titleHtml: '', descriptionHtml: '', galleryHtml: '' };
    }

    // IMPORTANT: Do not auto-derive section title/description from the first item,
    // because each page item (e.g. "Table Screen") is rendered with its own title/description.
    // Only use section title/description if explicitly provided on the top-level object.

    const titleHtml = titleText
      ? `<h3 class="cs-feature-title">${escapeHtml(titleText)}</h3>`
      : '';

    const descriptionHtml = description
      ? formatTextWithBullets(description)
      : '';

    const looksLikeUrl = (s) =>
      typeof s === 'string' &&
      (s.startsWith('http://') ||
        s.startsWith('https://') ||
        s.startsWith('/') ||
        /\.(png|jpe?g|webp|gif|svg|mp4|webm|ogg)(\?.*)?$/i.test(s));

    const extractUrlsFromObject = (obj) => {
      if (!obj || typeof obj !== 'object') return [];
      const candidates = [
        obj.image_url,
        obj.imageUrl,
        obj.url,
        obj.src,
        obj.image,
        obj.href,
        obj.path,
      ];
      
      // Handle demo_media as array
      if (Array.isArray(obj.demo_media)) {
        candidates.push(...obj.demo_media);
      } else if (obj.demo_media && typeof obj.demo_media === 'string') {
        candidates.push(obj.demo_media);
      }
      if (Array.isArray(obj.demoMedia)) {
        candidates.push(...obj.demoMedia);
      } else if (obj.demoMedia && typeof obj.demoMedia === 'string') {
        candidates.push(obj.demoMedia);
      }
      
      // Also scan any string props for image-like URLs
      for (const v of Object.values(obj)) {
        if (Array.isArray(v)) {
          // If it's an array, check each item
          v.forEach(item => {
            if (typeof item === 'string' && looksLikeUrl(item)) candidates.push(item);
          });
        } else if (typeof v === 'string' && looksLikeUrl(v)) {
          candidates.push(v);
        }
      }
      // Deduplicate while preserving order
      const seen = new Set();
      return candidates
        .filter((u) => typeof u === 'string' && looksLikeUrl(u))
        .filter((u) => {
          if (seen.has(u)) return false;
          seen.add(u);
          return true;
        });
    };

    const mediaUrlFromObject = (obj) => {
      if (!obj || typeof obj !== 'object') return '';
      const candidates = [
        obj.demo_media,
        obj.demoMedia,
        obj.demo_media_url,
        obj.media_url,
        obj.mediaUrl,
        obj.video_url,
        obj.videoUrl,
        obj.gif_url,
        obj.gifUrl,
        obj.embed_url,
        obj.embedUrl,
        obj.figma_embed_url,
        obj.figmaEmbedUrl,
      ];
      for (const c of candidates) {
        // Handle array of URLs (e.g., demo_media: ["url1", "url2"])
        if (Array.isArray(c) && c.length > 0) {
          const firstUrl = c.find(u => typeof u === 'string' && u.trim());
          if (firstUrl) return firstUrl.trim();
        }
        // Handle single string URL
        if (typeof c === 'string' && c.trim()) return c.trim();
      }
      return '';
    };

    const pageKeyFor = (p) => {
      if (typeof p === 'string') return `url:${p}`;
      if (!p || typeof p !== 'object') return '';
      const t = String(p.title ?? p.heading ?? '').trim();
      const d = String(p.description ?? p.text ?? p.body ?? '').trim();
      const urls = extractUrlsFromObject(p).join('|');
      return `t:${t}__d:${d}__u:${urls}`;
    };

    // Deduplicate pages/screens (prevents repeated title+description blocks)
    if (Array.isArray(pages) && pages.length) {
      const seenPages = new Set();
      pages = pages.filter((p) => {
        const key = pageKeyFor(p);
        if (!key) return true;
        if (seenPages.has(key)) return false;
        seenPages.add(key);
        return true;
      });
    }

    // Helper to get all media URLs from an object (handles arrays)
    const getAllMediaUrls = (obj) => {
      if (!obj || typeof obj !== 'object') return [];
      const urls = [];
      if (Array.isArray(obj.demo_media)) {
        urls.push(...obj.demo_media.filter(u => typeof u === 'string' && u.trim()));
      } else if (obj.demo_media && typeof obj.demo_media === 'string') {
        urls.push(obj.demo_media);
      }
      if (Array.isArray(obj.demoMedia)) {
        urls.push(...obj.demoMedia.filter(u => typeof u === 'string' && u.trim()));
      } else if (obj.demoMedia && typeof obj.demoMedia === 'string') {
        urls.push(obj.demoMedia);
      }
      return urls;
    };

    const items = (pages || [])
      .map((p) => {
        // Check if this item has multiple images in demo_media array - create slideshow for this item only
        if (typeof p === 'object' && p) {
          const allMediaUrls = getAllMediaUrls(p);
          if (allMediaUrls.length > 1) {
            // This item has multiple images - create a slideshow for it
            const itemTitle = String(p?.title ?? p?.heading ?? '').trim();
            const itemDescription = String(p?.description ?? p?.text ?? p?.body ?? '').trim();
            
            const captionHtml =
              itemTitle || itemDescription
                ? `<div class="cs-feature-item__copy">
                     ${itemTitle ? `<h4 class="cs-feature-item__title">${escapeHtml(itemTitle)}</h4>` : ''}
                     ${itemDescription ? formatTextWithBullets(itemDescription) : ''}
                   </div>`
                : '';
            
            const slideshowSlides = allMediaUrls.map((url, index) => {
              const mediaLower = url.toLowerCase();
              const isVideo = mediaLower.endsWith('.mp4');
              
              let slideMedia = '';
              if (isVideo) {
                slideMedia = `
                  <div class="cs-embed">
                    <video class="cs-video" autoplay loop muted playsinline preload="metadata" aria-label="${escapeHtml(itemTitle || 'Demo video')}">
                      <source src="${escapeHtml(url)}" type="video/mp4">
                    </video>
                  </div>
                `;
              } else {
                slideMedia = `
                  <div class="cs-embed">
                    <img class="cs-img" src="${escapeHtml(url)}" alt="${escapeHtml(itemTitle || 'Demo media')}">
                  </div>
                `;
              }
              
              return `<div class="cs-slideshow__slide${index === 0 ? ' cs-slideshow__slide--active' : ''}">${slideMedia}</div>`;
            }).join('');
            
            const slideIndicators = allMediaUrls.map((_, index) => 
              `<button class="cs-slideshow__indicator${index === 0 ? ' cs-slideshow__indicator--active' : ''}" data-slide="${index}" aria-label="Go to slide ${index + 1}"></button>`
            ).join('');
            
            const slideshowHtml = `
              <div class="cs-slideshow">
                <div class="cs-slideshow__container">
                  <button class="cs-slideshow__prev" aria-label="Previous slide">‹</button>
                  <div class="cs-slideshow__slides">${slideshowSlides}</div>
                  <button class="cs-slideshow__next" aria-label="Next slide">›</button>
                </div>
                <div class="cs-slideshow__indicators">${slideIndicators}</div>
              </div>
            `;
            
            return `<div class="cs-feature-item">${captionHtml}${slideshowHtml}</div>`;
          }
        }
        
        // Simple string URL
        if (typeof p === 'string') {
          if (!looksLikeUrl(p)) return '';
          // If it's a video/gif URL, render as media; otherwise render as an image
          const lower = p.toLowerCase();
          if (/\.(mp4|webm|ogg)(\?.*)?$/.test(lower) || /\.(gif)(\?.*)?$/.test(lower)) {
            return `<div class="cs-feature-item">${embedMedia(p)}</div>`;
          }
          return `<img class="cs-img" src="${escapeHtml(p)}" alt="Feature page">`;
        }

        // Object with per-page metadata
        const itemTitle = String(p?.title ?? p?.heading ?? '').trim();
        const itemDescription = String(p?.description ?? p?.text ?? p?.body ?? '').trim();
        const itemMediaUrl = mediaUrlFromObject(p);

        const urls = extractUrlsFromObject(p);
        
        // Allow items with title/description even if no media
        if (!itemMediaUrl && !urls.length && !itemTitle && !itemDescription) return '';

        const captionHtml =
          itemTitle || itemDescription
            ? `<div class="cs-feature-item__copy">
                 ${itemTitle ? `<h4 class="cs-feature-item__title">${escapeHtml(itemTitle)}</h4>` : ''}
                 ${itemDescription ? `<p class="cs-feature-item__desc">${escapeHtml(itemDescription)}</p>` : ''}
               </div>`
            : '';

        // If you store media as page.demo_media, render videos as looping muted autoplay.
        // Otherwise fall back to the generic embedMedia handler.
        let mediaHtml = '';
        if (itemMediaUrl) {
          const mediaLower = itemMediaUrl.toLowerCase();
          const isVideo = mediaLower.endsWith('.mp4');
          if (isVideo) {
            mediaHtml = `
              <div class="cs-embed">
                <video class="cs-video" autoplay loop muted playsinline preload="metadata" aria-label="${escapeHtml(itemTitle || 'Demo video')}">
                  <source src="${escapeHtml(itemMediaUrl)}" type="video/mp4">
                </video>
                <p class="cs-embed__fallback">
                  If the video doesn’t load, <a href="${escapeHtml(itemMediaUrl)}" target="_blank" rel="noreferrer noopener">open it in a new tab</a>.
                </p>
              </div>
            `;
          } else {
            mediaHtml = `
              <div class="cs-embed">
                <img class="cs-img" src="${escapeHtml(itemMediaUrl)}" alt="${escapeHtml(itemTitle || 'Demo media')}">
              </div>
            `;
          }
        }

        const imagesHtml = itemMediaUrl
          ? ''
          : urls
              .map((u) => {
                const alt = itemTitle || 'Feature page';
                return `<img class="cs-img" src="${escapeHtml(u)}" alt="${escapeHtml(alt)}">`;
              })
              .join('');

        // Always wrap in feature-item div for consistent styling
        const content = mediaHtml || imagesHtml;
        if (!content && !captionHtml) return '';
        
        // Ensure content is always rendered if it exists
        return `<div class="cs-feature-item">${captionHtml}${content || ''}</div>`;
      })
      .filter(Boolean)
      .join('');

    const galleryHtml = items ? `<div class="cs-gallery">${items}</div>` : '';
    

    return { titleHtml, descriptionHtml, galleryHtml };
  };

  const feature = featurePages(row.feature_pages);

  container.innerHTML = `
    ${cover}
    <h1 class="case-study__title">${title}</h1>
    <div class="case-study__metaRow">
      ${subtitle ? `<span class="case-study__subtitle">${subtitle}</span>` : ''}
      ${year}
    </div>
    ${heroDesc}
    <div class="case-study__body">
      ${section(
        'My Role',
        parasWithImages(
          row.my_role_para1,
          row.my_role_image1,
          `${title} - role image 1`,
          row.my_role_para2,
          row.my_role_image2,
          `${title} - role image 2`,
          row.my_role_para3
        )
      )}

      ${section(
        'Challenge',
        parasWithImage(
          row.challenge_para1,
          row.challenge_image1,
          `${title} - challenge image`,
          row.challenge_para2
        ) + quote(row.challenge_quote, row.challenge_quote_attribution)
      )}

      ${section(
        'Research',
        (row.research_para1 ? formatTextWithBullets(row.research_para1) : '') +
          img(row.research_image1, `${title} - research image 1`) +
          (row.research_para2 ? `<div class="cs-feature-item__copy"><h4 class="cs-feature-item__title">Literature Review</h4></div>${formatTextWithBullets(row.research_para2)}` : '') +
          (row.research_citations ? `<div class="cs-feature-item__copy"><h4 class="cs-feature-item__title">References</h4></div><div class="cs-citations">${citations(row.research_citations)}</div>` : '') +
          img(row.research_image2, `${title} - research image 2`) +
          (row.research_para3 ? `<div class="cs-feature-item__copy"><h4 class="cs-feature-item__title">Interviews</h4></div>${formatTextWithBullets(row.research_para3)}` : '') +
          (row.research_para4 ? formatTextWithBullets(row.research_para4) : '') +
          cards(row.research_cards)
      )}

      ${section(
        'Ideation',
        parasWithImage(
          row.ideation_para1,
          row.ideation_image1,
          `${title} - ideation image 1`,
          row.ideation_para2
        ) +
          img(row.personas_image_url, `${title} - personas`, 'Personas') +
          img(row.storyboard_image_url, `${title} - storyboard`, 'Storyboard') +
          img(row.ideation_image2, `${title} - ideation image 2`) +
          ideationCards(row.ideation_cards)
      )}

      ${section(
        'Solution',
        (row.solution_para1 ? formatTextWithBullets(row.solution_para1) : '') +
          img(row.solution_image1, `${title} - solution image 1`) +
          feature.titleHtml +
          feature.descriptionHtml +
          feature.galleryHtml +
          (row.solution_para2 ? formatTextWithBullets(row.solution_para2) : '') +
          img(row.solution_image2, `${title} - solution image 2`) +
          (row.solution_para3 ? formatTextWithBullets(row.solution_para3) : '') +
          img(row.solution_image3, `${title} - solution image 3`)
      )}

      ${section(
        'Testing',
        parasWithImage(
          row.testing_para1,
          row.testing_image1,
          `${title} - testing image`,
          row.testing_para2
        ) + stats(row.results_stats)
      )}

      ${section(
        'Ethics',
        parasWithImage(
          row.ethics_para1,
          row.ethics_image1,
          `${title} - ethics image`,
          row.ethics_para2
        )
      )}

      ${section(
        'Reflection',
        parasWithImage(
          row.reflection_para1,
          row.reflection_image1,
          `${title} - reflection image`,
          row.reflection_para2
        )
      )}

      ${row.figma_embed_url ? section(
        'Test Out the Figma Prototype',
        embedMedia(row.figma_embed_url)
      ) : ''}
    </div>
  `;
}

function initSlideshow() {
  const slideshows = document.querySelectorAll('.cs-slideshow');
  if (slideshows.length === 0) return;

  slideshows.forEach((slideshow) => {
    const slides = slideshow.querySelectorAll('.cs-slideshow__slide');
    const indicators = slideshow.querySelectorAll('.cs-slideshow__indicator');
    const prevBtn = slideshow.querySelector('.cs-slideshow__prev');
    const nextBtn = slideshow.querySelector('.cs-slideshow__next');
    
    if (slides.length <= 1) return;

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

    const nextSlide = () => {
      showSlide((currentSlide + 1) % slides.length);
    };

    const prevSlide = () => {
      showSlide((currentSlide - 1 + slides.length) % slides.length);
    };

    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);

    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => showSlide(index));
    });
  });
}

function initImageModal() {
  // Create modal structure if it doesn't exist
  let modal = document.getElementById('cs-image-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'cs-image-modal';
    modal.className = 'cs-image-modal';
    modal.innerHTML = `
      <div class="cs-image-modal__overlay"></div>
      <div class="cs-image-modal__content">
        <button class="cs-image-modal__close" aria-label="Close image">×</button>
        <button class="cs-image-modal__prev" aria-label="Previous image">‹</button>
        <button class="cs-image-modal__next" aria-label="Next image">›</button>
        <img class="cs-image-modal__img" src="" alt="">
      </div>
    `;
    document.body.appendChild(modal);
  }

  const modalImg = modal.querySelector('.cs-image-modal__img');
  const closeBtn = modal.querySelector('.cs-image-modal__close');
  const prevBtn = modal.querySelector('.cs-image-modal__prev');
  const nextBtn = modal.querySelector('.cs-image-modal__next');
  const overlay = modal.querySelector('.cs-image-modal__overlay');

  let currentImages = [];
  let currentIndex = 0;

  const updateModalButtons = () => {
    if (currentImages.length <= 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    } else {
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
    }
  };

  const showImage = (index) => {
    if (index < 0 || index >= currentImages.length) return;
    currentIndex = index;
    const imgData = currentImages[index];
    modalImg.src = imgData.src;
    modalImg.alt = imgData.alt || 'Fullscreen image';
    updateModalButtons();
  };

  const openModal = (imgSrc, imgAlt, allImages = null, startIndex = 0) => {
    if (allImages && allImages.length > 0) {
      currentImages = allImages;
      currentIndex = startIndex;
      showImage(startIndex);
    } else {
      currentImages = [{ src: imgSrc, alt: imgAlt }];
      currentIndex = 0;
      modalImg.src = imgSrc;
      modalImg.alt = imgAlt || 'Fullscreen image';
      updateModalButtons();
    }
    modal.classList.add('cs-image-modal--active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const closeModal = () => {
    modal.classList.remove('cs-image-modal--active');
    document.body.style.overflow = ''; // Restore scrolling
    currentImages = [];
    currentIndex = 0;
  };

  const nextImage = () => {
    if (currentImages.length > 1) {
      showImage((currentIndex + 1) % currentImages.length);
    }
  };

  const prevImage = () => {
    if (currentImages.length > 1) {
      showImage((currentIndex - 1 + currentImages.length) % currentImages.length);
    }
  };

  // Close on close button click
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeModal();
    });
  }

  // Navigation buttons
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      prevImage();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      nextImage();
    });
  }

  // Close on overlay click
  if (overlay) {
    overlay.addEventListener('click', closeModal);
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('cs-image-modal--active')) return;
    
    if (e.key === 'Escape') {
      closeModal();
    } else if (e.key === 'ArrowLeft') {
      prevImage();
    } else if (e.key === 'ArrowRight') {
      nextImage();
    }
  });

  // Add click handlers to all images in case study
  const caseStudyContainer = document.getElementById('caseStudy');
  if (caseStudyContainer) {
    // Handle slideshow images
    const slideshows = caseStudyContainer.querySelectorAll('.cs-slideshow');
    slideshows.forEach((slideshow) => {
      const slides = slideshow.querySelectorAll('.cs-slideshow__slide');
      const allSlideshowImages = [];
      
      slides.forEach((slide) => {
        const img = slide.querySelector('img');
        if (img) {
          const imgSrc = img.src || img.getAttribute('src');
          const imgAlt = img.alt || '';
          if (imgSrc) {
            allSlideshowImages.push({ src: imgSrc, alt: imgAlt });
          }
        }
      });

      // Add click handlers to all images in this slideshow
      slides.forEach((slide, slideIndex) => {
        const img = slide.querySelector('img');
        if (img && !img.dataset.modalEnabled) {
          img.dataset.modalEnabled = 'true';
          img.setAttribute('data-modal-enabled', 'true');
          img.style.cursor = 'pointer';
          
          // Add tooltip
          const tooltip = document.createElement('div');
          tooltip.className = 'cs-image-tooltip';
          tooltip.textContent = 'Click to make me bigger';
          tooltip.style.display = 'none';
          document.body.appendChild(tooltip);
          
          img.addEventListener('mouseenter', () => {
            tooltip.style.display = 'block';
          });
          
          img.addEventListener('mousemove', (e) => {
            tooltip.style.left = (e.clientX + 10) + 'px';
            tooltip.style.top = (e.clientY + 10) + 'px';
            tooltip.style.transform = 'none';
          });
          
          img.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
          });
          
          img.addEventListener('click', (e) => {
            e.stopPropagation();
            if (allSlideshowImages.length > 0) {
              openModal('', '', allSlideshowImages, slideIndex);
            }
          });
        }
      });
    });

    // Handle regular images (not in slideshows)
    const regularImages = caseStudyContainer.querySelectorAll('img.cs-img:not(.cs-slideshow__slide img), .cs-embed img:not(.cs-slideshow__slide img)');
    regularImages.forEach((img) => {
      // Skip if already has click handler or is in a slideshow
      if (img.dataset.modalEnabled || img.closest('.cs-slideshow')) return;
      img.dataset.modalEnabled = 'true';
      img.setAttribute('data-modal-enabled', 'true');
      img.style.cursor = 'pointer';
      
      // Add tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'cs-image-tooltip';
      tooltip.textContent = 'Click to make me bigger';
      tooltip.style.display = 'none';
      document.body.appendChild(tooltip);
      
      img.addEventListener('mouseenter', () => {
        tooltip.style.display = 'block';
      });
      
      img.addEventListener('mousemove', (e) => {
        tooltip.style.left = (e.clientX + 10) + 'px';
        tooltip.style.top = (e.clientY + 10) + 'px';
        tooltip.style.transform = 'none';
      });
      
      img.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });
      
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        const imgSrc = img.src || img.getAttribute('src');
        const imgAlt = img.alt || '';
        if (imgSrc) {
          openModal(imgSrc, imgAlt);
        }
      });
    });
  }
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

  // Back to top (case study page only)
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

  // Detail page
  const detailRoot = document.getElementById('caseStudy');
  if (detailRoot && slug) {
    const row = await fetchProjectBySlug({ url, key, table }, slug, {
      onRevalidate: (freshRow) => {
        renderDetail(detailRoot, freshRow);
        initSlideshow();
        initImageModal();
      },
    });
    renderDetail(detailRoot, row);
    initSlideshow();
    initImageModal();
    return;
  }

  // List page
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
    // eslint-disable-next-line no-console
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

