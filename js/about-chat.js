(function () {
  const infoBtn = document.getElementById('aboutInfoBtn');
  const backBtn = document.getElementById('aboutBackBtn');
  const aboutPanel = document.getElementById('aboutPanel');
  const aboutWindow = aboutPanel ? aboutPanel.querySelector('.about-window') : null;
  const messagesEl = document.getElementById('aboutChatMessages');
  const suggestionsEl = document.getElementById('aboutChatSuggestions');
  const viewportEl = document.getElementById('aboutChatViewport');
  const scrollbarThumb = document.getElementById('aboutScrollbarThumb');
  const logoTrigger = document.querySelector('.site-header__brand');
  const chatTab = document.getElementById('aboutChatTab');
  const galleryTab = document.getElementById('aboutGalleryTab');
  const chatPanel = document.getElementById('aboutChatPanel');
  const galleryPanel = document.getElementById('aboutGalleryPanel');
  const galleryGrid = document.getElementById('aboutGalleryGrid');
  const galleryStatus = document.getElementById('aboutGalleryStatus');

  if (!infoBtn || !aboutPanel || !aboutWindow || !messagesEl || !suggestionsEl || !viewportEl) return;

  const GALLERY_IMAGE_FIELDS = [
    'Hero Image',
    'img1',
    'img2',
    'img3',
    'img4',
    'img5',
    'img6',
    'img7',
    'img8',
    'img9',
    'img10'
  ];

  let isAnimating = false;
  let askedIds = new Set();
  let isChatBootstrapped = false;
  let galleryLoadState = 'idle';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TRANSITION_MS = 260;
  const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
  const TYPING_MS = prefersReducedMotion ? 0 : 1400;
  const BUBBLE_GAP_MS = prefersReducedMotion ? 0 : 500;

  const INTRO_MESSAGE =
    "Hi, I'm Derek — a Product Designer based in Brisbane, with a Master of Interaction Design from The University of Queensland. I enjoy turning messy problems into thoughtful, human-centered digital experiences.";

  const CHAT_QA = [
    {
      id: 'before-design',
      question: 'What were you doing before design?',
      responses: [
        'Before moving to Australia to pursue my Masters degree, I studied Electronics and Communication Engineering and worked as an analyst at Capgemini.',
        'That experience gave me a structured way of thinking and taught me how to break down problems, but I eventually realized I wanted to work closer to the human side of products.'
      ]
    },
    {
      id: 'switch-design',
      question: 'Why did you switch to  Product Design ?',
      responses: [
        'I kept noticing that the products I used every day were shaped as much by design decisions as by engineering ones — and I wanted to be the person making those human-facing calls.',
        'Moving into interaction design let me combine analytical thinking with empathy, research, and craft in a way engineering alone never quite satisfied.'
      ]
    },
    {
      id: 'uq-proud',
      question: 'What are you proud of from your time at UQ?',
      responses: [
        'Leading a capstone project that went from messy stakeholder brief to a tested prototype students actually wanted to use.',
        'UQ pushed me to defend design decisions with research, not just taste — that discipline still shapes how I work.'
      ]
    },
    {
      id: 'masters-worth',
      question: "Was the master's degree worth it ?",
      responses: [
        'For me, yes — it gave structure to instincts I already had and opened doors in Australia I would not have had otherwise.',
        'The biggest value was learning alongside people from different backgrounds and building a portfolio grounded in real briefs, not just class exercises.'
      ]
    },
    {
      id: 'working-toward',
      question: 'What are you working toward now?',
      responses: [
        'Building depth as a product designer — stronger research, sharper systems thinking, and more shipped work I can point to.',
        'Long term, I want to help teams ship thoughtful products at the intersection of business goals and real human needs.'
      ]
    },
    {
      id: 'sunglass-hut',
      question: 'How is it working in retail at Sunglass Hut ?',
      responses: [
        'It keeps me close to real people making quick decisions — reading body language, explaining trade-offs, and adapting on the fly.',
        'Retail taught me patience and presence under pressure, which surprisingly shows up in user interviews and stakeholder workshops too.'
      ]
    },
    {
      id: 'fact-of-day',
      question: 'Can you give me a quick fact of the day ?',
      responses: [
        'Octopuses have three hearts — two pump blood to the gills and one to the rest of the body.',
        'I collect random facts like this; they are a good reminder that interesting details often make interfaces more memorable too.'
      ]
    },
    {
      id: 'outside-work',
      question: 'Who is Derek outside of work hours ?',
      responses: [
        'Usually behind a camera, tinkering with side projects, or hunting down good coffee around Brisbane.',
        'I recharge by making things — photos, small apps, messy sketches — and by spending time with people who are curious about the world.'
      ]
    }
  ];

  function setGalleryStatus(message, isError) {
    if (!galleryStatus) return;
    galleryStatus.textContent = message;
    galleryStatus.hidden = false;
    galleryStatus.classList.toggle('about-gallery__status--error', Boolean(isError));
    if (galleryGrid) galleryGrid.hidden = true;
  }

  function renderGalleryImages(imageUrls) {
    if (!galleryGrid || !galleryStatus) return;

    galleryGrid.innerHTML = '';

    imageUrls.forEach(function (url, index) {
      const item = document.createElement('figure');
      item.className = 'about-gallery__item';

      const image = document.createElement('img');
      image.className = 'about-gallery__image';
      image.src = url;
      image.alt = 'Gallery photo ' + (index + 1);
      image.loading = 'lazy';
      image.decoding = 'async';

      item.appendChild(image);
      galleryGrid.appendChild(item);
    });

    galleryStatus.hidden = true;
    galleryGrid.hidden = false;
  }

  async function loadGalleryFromSupabase() {
    if (!galleryGrid || galleryLoadState === 'loading' || galleryLoadState === 'loaded') return;

    if (window.isSupabasePaused && window.isSupabasePaused()) {
      setGalleryStatus('Gallery paused during development (Supabase fetching is off).', true);
      galleryLoadState = 'paused';
      return;
    }

    const supabaseUrl = window.SUPABASE_URL;
    const supabaseKey = window.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setGalleryStatus('Gallery is not configured yet.', true);
      galleryLoadState = 'error';
      return;
    }

    galleryLoadState = 'loading';
    setGalleryStatus('Loading photos…', false);

    const selectFields = GALLERY_IMAGE_FIELDS.map(function (field) {
      return field.includes(' ') ? encodeURIComponent('"' + field + '"') : field;
    }).join(',');

    async function fetchGalleryRow() {
      const response = await fetch(supabaseUrl + '/rest/v1/about_me?select=' + selectFields + '&limit=1', {
        headers: {
          apikey: supabaseKey,
          Authorization: 'Bearer ' + supabaseKey
        }
      });

      if (!response.ok) {
        throw new Error('Could not load gallery images.');
      }

      const rows = await response.json();
      return Array.isArray(rows) ? rows[0] : null;
    }

    function applyGalleryRow(row) {
      if (!row) {
        setGalleryStatus('No gallery photos found yet.', true);
        galleryLoadState = 'error';
        return;
      }

      const imageUrls = GALLERY_IMAGE_FIELDS.map(function (field) {
        return row[field];
      }).filter(function (url) {
        return typeof url === 'string' && url.trim().length > 0;
      });

      if (!imageUrls.length) {
        setGalleryStatus('No gallery photos found yet.', true);
        galleryLoadState = 'error';
        return;
      }

      renderGalleryImages(imageUrls);
      galleryLoadState = 'loaded';
    }

    try {
      let row;

      if (window.fetchWithSupabaseCache) {
        row = await window.fetchWithSupabaseCache('about_me:gallery', fetchGalleryRow, {
          onRevalidate: applyGalleryRow
        });
      } else {
        row = await fetchGalleryRow();
      }

      applyGalleryRow(row);
    } catch (error) {
      setGalleryStatus('Could not load gallery photos. Please try again.', true);
      galleryLoadState = 'error';
    }
  }

  function formatTime(date) {
    return date
      .toLocaleTimeString('en-AU', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
      .toUpperCase();
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
      scale
    };
  }

  function setWindowTransform(dx, dy, scale) {
    aboutWindow.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;
  }

  function setWindowTransition(enabled) {
    aboutWindow.style.transition = enabled
      ? `opacity ${TRANSITION_MS}ms ${EASE}, transform ${TRANSITION_MS}ms ${EASE}`
      : 'none';
  }

  function closeResumeIfOpen() {
    if (!document.documentElement.classList.contains('is-resume-open')) return;
    document.documentElement.classList.remove('is-resume-open');
    document.documentElement.classList.remove('is-resume-fullscreen');
  }

  function closeLibraryPanelsIfOpen() {
    if (typeof window.closeAllLibraryPanels === 'function') {
      window.closeAllLibraryPanels(true);
    }
  }

  function updateScrollbar() {
    if (!scrollbarThumb) return;
    const maxScroll = viewportEl.scrollHeight - viewportEl.clientHeight;
    if (maxScroll <= 0) {
      scrollbarThumb.style.top = '0';
      return;
    }
    const trackHeight = viewportEl.clientHeight - 82;
    const thumbHeight = Math.max(21, (viewportEl.clientHeight / viewportEl.scrollHeight) * trackHeight);
    const maxThumbTop = trackHeight - thumbHeight;
    const thumbTop = (viewportEl.scrollTop / maxScroll) * maxThumbTop;
    scrollbarThumb.style.height = `${thumbHeight}px`;
    scrollbarThumb.style.top = `${thumbTop}px`;
  }

  function scrollToBottom() {
    viewportEl.scrollTop = viewportEl.scrollHeight;
    updateScrollbar();
  }

  function createTimestamp() {
    const time = document.createElement('time');
    time.className = 'about-chat__timestamp';
    time.dateTime = new Date().toISOString();
    time.textContent = formatTime(new Date());
    return time;
  }

  function createMessageGroup(align) {
    const group = document.createElement('div');
    group.className = 'about-chat__group about-chat__group--' + align;
    return group;
  }

  function createBubble(text, type, compact) {
    const bubble = document.createElement('div');
    bubble.className = 'about-chat__bubble about-chat__bubble--' + type + (compact ? ' about-chat__bubble--compact' : '');
    bubble.textContent = text;
    return bubble;
  }

  function createTypingIndicator() {
    const wrap = document.createElement('div');
    wrap.className = 'about-chat__typing';
    wrap.setAttribute('aria-label', 'Derek is typing');

    const bubble = document.createElement('div');
    bubble.className = 'about-chat__typing-bubble';
    bubble.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 3; i += 1) {
      const dot = document.createElement('span');
      dot.className = 'about-chat__typing-dot';
      bubble.appendChild(dot);
    }

    const label = document.createElement('span');
    label.className = 'about-chat__typing-label';
    label.textContent = 'Derek is typing';

    wrap.appendChild(bubble);
    wrap.appendChild(label);
    return wrap;
  }

  function renderSuggestions() {
    suggestionsEl.innerHTML = '';
    CHAT_QA.forEach(function (item) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'about-chat__chip';
      chip.textContent = item.question;
      chip.dataset.questionId = item.id;

      if (askedIds.has(item.id)) {
        chip.classList.add('about-chat__chip--asked');
        chip.disabled = true;
      }

      chip.addEventListener('click', function () {
        askQuestion(item);
      });

      suggestionsEl.appendChild(chip);
    });
  }

  function bootstrapChat() {
    if (isChatBootstrapped) return;
    isChatBootstrapped = true;

    messagesEl.innerHTML = '';
    const introGroup = createMessageGroup('derek');
    introGroup.appendChild(createBubble(INTRO_MESSAGE, 'derek', false));
    introGroup.appendChild(createTimestamp());
    messagesEl.appendChild(introGroup);
    renderSuggestions();
    updateScrollbar();
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  async function askQuestion(item) {
    if (askedIds.has(item.id)) return;

    askedIds.add(item.id);
    renderSuggestions();

    const userGroup = createMessageGroup('user');
    userGroup.appendChild(createBubble(item.question, 'user', true));
    userGroup.appendChild(createTimestamp());
    messagesEl.appendChild(userGroup);
    scrollToBottom();

    const typing = createTypingIndicator();
    messagesEl.appendChild(typing);
    scrollToBottom();

    if (TYPING_MS > 0) await delay(TYPING_MS);
    typing.remove();

    const replyGroup = createMessageGroup('derek');
    messagesEl.appendChild(replyGroup);

    for (let i = 0; i < item.responses.length; i += 1) {
      replyGroup.appendChild(createBubble(item.responses[i], 'derek', true));
      scrollToBottom();
      if (i < item.responses.length - 1 && BUBBLE_GAP_MS > 0) {
        await delay(BUBBLE_GAP_MS);
      }
    }

    replyGroup.appendChild(createTimestamp());
    scrollToBottom();
  }

  function setOpenState(isOpen) {
    infoBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  function openAboutPanel() {
    if (document.documentElement.classList.contains('is-about-open')) return;
    if (isAnimating) return;
    isAnimating = true;

    closeResumeIfOpen();
    closeLibraryPanelsIfOpen();
    bootstrapChat();
    setAboutTab('chat');
    loadGalleryFromSupabase();
    document.documentElement.classList.add('is-about-open');
    setOpenState(true);

    if (prefersReducedMotion) {
      isAnimating = false;
      scrollToBottom();
      return;
    }

    const fromRect = infoBtn.getBoundingClientRect();
    const toRect = aboutWindow.getBoundingClientRect();
    const { dx, dy, scale } = computeDiveTransform(fromRect, toRect);

    setWindowTransition(false);
    aboutWindow.style.opacity = '0';
    setWindowTransform(dx, dy, scale);

    requestAnimationFrame(function () {
      setWindowTransition(true);
      aboutWindow.style.opacity = '1';
      setWindowTransform(0, 0, 1);

      window.setTimeout(function () {
        setWindowTransition('');
        aboutWindow.style.opacity = '';
        aboutWindow.style.transform = '';
        isAnimating = false;
        scrollToBottom();
      }, TRANSITION_MS);
    });
  }

  function closeAboutPanel(immediate) {
    if (!document.documentElement.classList.contains('is-about-open')) return;

    if (immediate || prefersReducedMotion) {
      document.documentElement.classList.remove('is-about-open');
      setOpenState(false);
      setWindowTransition('');
      aboutWindow.style.opacity = '';
      aboutWindow.style.transform = '';
      isAnimating = false;
      return;
    }

    if (isAnimating) return;
    isAnimating = true;

    const fromRect = infoBtn.getBoundingClientRect();
    const toRect = aboutWindow.getBoundingClientRect();
    const { dx, dy, scale } = computeDiveTransform(fromRect, toRect);

    setWindowTransition(true);
    aboutWindow.style.opacity = '1';
    setWindowTransform(0, 0, 1);

    requestAnimationFrame(function () {
      aboutWindow.style.opacity = '0';
      setWindowTransform(dx, dy, scale);

      window.setTimeout(function () {
        document.documentElement.classList.remove('is-about-open');
        setOpenState(false);

        setWindowTransition('');
        aboutWindow.style.opacity = '';
        aboutWindow.style.transform = '';
        isAnimating = false;
      }, TRANSITION_MS);
    });
  }

  function toggleAboutPanel() {
    if (document.documentElement.classList.contains('is-about-open')) {
      closeAboutPanel();
    } else {
      openAboutPanel();
    }
  }

  function setAboutTab(tabName) {
    if (!chatTab || !galleryTab || !chatPanel || !galleryPanel) return;

    const isChat = tabName === 'chat';

    chatTab.classList.toggle('about-window__tab--active', isChat);
    galleryTab.classList.toggle('about-window__tab--active', !isChat);
    chatTab.setAttribute('aria-selected', isChat ? 'true' : 'false');
    galleryTab.setAttribute('aria-selected', isChat ? 'false' : 'true');
    chatPanel.hidden = !isChat;
    galleryPanel.hidden = isChat;

    if (isChat) {
      scrollToBottom();
    } else {
      loadGalleryFromSupabase();
    }
  }

  if (chatTab && galleryTab) {
    chatTab.addEventListener('click', function () {
      setAboutTab('chat');
    });

    galleryTab.addEventListener('click', function () {
      setAboutTab('gallery');
    });
  }

  infoBtn.addEventListener('click', toggleAboutPanel);
  if (backBtn) backBtn.addEventListener('click', closeAboutPanel);

  if (logoTrigger) {
    logoTrigger.addEventListener('click', closeAboutPanel);
  }

  viewportEl.addEventListener('scroll', updateScrollbar, { passive: true });
  window.addEventListener('resize', updateScrollbar);

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAboutPanel();
  });

  window.closeAboutPanel = closeAboutPanel;
})();
