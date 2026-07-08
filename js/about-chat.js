(function () {
  const infoBtn = document.getElementById('aboutInfoBtn');
  const backBtn = document.getElementById('aboutBackBtn');
  const aboutPanel = document.getElementById('aboutPanel');
  const aboutWindow = aboutPanel ? aboutPanel.querySelector('.about-window') : null;
  const messagesEl = document.getElementById('aboutChatMessages');
  const suggestionsEl = document.getElementById('aboutChatSuggestions');
  const promptEl = document.getElementById('aboutChatPrompt');
  const pickerEl = document.getElementById('aboutChatPicker');
  const viewportEl = document.getElementById('aboutChatViewport');
  const logoTrigger = document.querySelector('.site-header__brand');
  const chatTab = document.getElementById('aboutChatTab');
  const galleryTab = document.getElementById('aboutGalleryTab');
  const chatPanel = document.getElementById('aboutChatPanel');
  const galleryPanel = document.getElementById('aboutGalleryPanel');
  const galleryGrid = document.getElementById('aboutGalleryGrid');
  const galleryStatus = document.getElementById('aboutGalleryStatus');
  const aboutTable = window.SUPABASE_ABOUT_ME_TABLE || 'about_me';

  const mobileAboutPage = document.getElementById('aboutMobilePage');
  const MOBILE_MQ = window.matchMedia('(max-width: 960px)');

  if (!infoBtn || !aboutPanel || !aboutWindow || !messagesEl || !suggestionsEl || !viewportEl) return;

  function isMobileAboutView() {
    return MOBILE_MQ.matches;
  }

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
  const TYPING_MS = prefersReducedMotion ? 0 : 2400;

  // Set to true to re-enable Rap or Crap in the about chat.
  const RAP_OR_CRAP_ENABLED = false;

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
      question: 'Why did you switch to product design ?',
      responses: [
        'What really drew me to product design was the opportunity to combine creativity with problem-solving. It allowed me to use my technical background while focusing on designing solutions that are intuitive, meaningful, and user-centered.',
        "I realized I enjoyed understanding users' needs, simplifying complex problems, and creating experiences that genuinely improve people's lives."
      ]
    },
    {
      id: 'uq-proud',
      question: 'What are you proud of from your time at UQ?',
      responses: [
        "I'm most proud of how much I grew during my time at UQ. I transitioned from a software engineering background into product design and developed strong skills in UX research, prototyping, and user-centered design through several industry-style projects.",
        "I'm also proud of my involvement with the Association of Postgraduate Students, where I took on leadership roles and helped organize events and support the postgraduate community. Those experiences taught me not only how to design better products but also how to communicate, collaborate, and lead teams effectively.",
        "Looking back, I'm most proud that I didn't just graduate with a Master's degree, I graduated as a more well-rounded designer, collaborator, and leader."
      ]
    },
    {
      id: 'masters-worth',
      question: "Was the master's degree worth it ?",
      responses: [
        "With the mindset of an engineer, I can say that I enjoy finding creative solutions to problems, but while working on projects throughout the course of my master's degree, I learnt the importance of putting the user's need ahead of our assumptions. By talking to users via interviews and surveys, then validating these findings through testing loops, I was able to develop prototypes that met diverse interaction needs and solved the problem that was at hand.",
        'So yes, I believe that it was worth it.'
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
        "Working at Sunglass Hut has been a great experience because it's a very customer-focused environment. Every customer comes in with different needs, whether it's finding the right style, getting the correct lens for their lifestyle, or staying within a budget. My role is to listen, ask the right questions, and help them find the best solution rather than simply trying to make a sale.",
        "Moreover, many of the skills I've developed like understanding customer needs, communicating clearly, collaborating with a team, and delivering a positive customer experience are directly transferable to product design, where empathy and understanding users are equally important.",
        'Plus getting your sunglasses for half price does not hurt 😂😂'
      ]
    },
    {
      id: 'fact-of-day',
      question: 'Can we play Rap or Crap ?',
      launchGame: true,
      responses: []
    },
    {
      id: 'outside-work',
      question: 'Who is Derek outside of work ?',
      responses: [
        "Outside of work, I'm usually binge watching a show, playing on my PS5, going out with my camera to take photos or making notes of random projects that I should vibe code."
      ]
    }
  ].filter(function (item) {
    return RAP_OR_CRAP_ENABLED || !item.launchGame;
  });

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
      const response = await fetch(
        supabaseUrl + '/rest/v1/' + encodeURIComponent(aboutTable) + '?select=' + selectFields + '&limit=1',
        {
          headers: {
            apikey: supabaseKey,
            Authorization: 'Bearer ' + supabaseKey
          }
        }
      );

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
      })
        .filter(function (url) {
          return typeof url === 'string' && url.trim().length > 0;
        })
        .map(function (url) {
          if (window.resolveSupabaseStorageUrl) {
            return window.resolveSupabaseStorageUrl(url.trim());
          }
          return url.trim();
        })
        .filter(Boolean);

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
    if (typeof window.closeResumeIfOpen === 'function') {
      window.closeResumeIfOpen();
    }
  }

  function closeLibraryPanelsIfOpen() {
    if (typeof window.closeAllLibraryPanels === 'function') {
      window.closeAllLibraryPanels(true);
    }
  }

  function scrollToBottom() {
    viewportEl.scrollTop = viewportEl.scrollHeight;
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

  function hideQuestionPicker() {
    if (pickerEl) pickerEl.hidden = true;
  }

  function showQuestionPicker() {
    if (pickerEl) pickerEl.hidden = false;
    renderSuggestions();
  }

  window.hideAboutChatQuestions = hideQuestionPicker;
  window.showAboutChatQuestions = showQuestionPicker;

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
    if (!suggestionsEl) return;

    suggestionsEl.innerHTML = '';
    const remaining = CHAT_QA.length - askedIds.size;

    if (promptEl) {
      promptEl.hidden = remaining === 0;
      promptEl.textContent = remaining === 0 ? '' : 'Pick a question to ask';
    }

    CHAT_QA.forEach(function (item) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'about-chat__chip';
      chip.textContent = item.question;
      chip.dataset.questionId = item.id;

      if (askedIds.has(item.id)) {
        chip.classList.add('about-chat__chip--asked');
        chip.disabled = true;
      } else {
        chip.addEventListener('click', function () {
          askQuestion(item);
        });
      }

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
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  async function showTypingIndicator() {
    const typing = createTypingIndicator();
    messagesEl.appendChild(typing);
    scrollToBottom();
    if (TYPING_MS > 0) await delay(TYPING_MS);
    typing.remove();
  }

  async function askQuestion(item) {
    if (item.launchGame && !RAP_OR_CRAP_ENABLED) return;

    if (item.launchGame) {
      if (document.documentElement.classList.contains('is-rap-or-crap-open')) return;
    } else if (askedIds.has(item.id)) {
      return;
    }

    if (!item.launchGame) {
      askedIds.add(item.id);
      renderSuggestions();
    }

    const userGroup = createMessageGroup('user');
    userGroup.appendChild(createBubble(item.question, 'user', true));
    userGroup.appendChild(createTimestamp());
    messagesEl.appendChild(userGroup);
    scrollToBottom();

    if (item.launchGame) {
      hideQuestionPicker();
      if (typeof window.openRapOrCrapGame === 'function') {
        window.openRapOrCrapGame();
      }
      return;
    }

    const replyGroup = createMessageGroup('derek');
    messagesEl.appendChild(replyGroup);

    for (let i = 0; i < item.responses.length; i += 1) {
      await showTypingIndicator();
      replyGroup.appendChild(createBubble(item.responses[i], 'derek', true));
      scrollToBottom();
    }

    replyGroup.appendChild(createTimestamp());
    scrollToBottom();
  }

  window.scrollAboutChatToBottom = scrollToBottom;

  function setOpenState(isOpen) {
    infoBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  function openAboutPanel() {
    if (document.documentElement.classList.contains('is-about-open')) return;
    if (isAnimating) return;
    isAnimating = true;

    closeResumeIfOpen();
    closeLibraryPanelsIfOpen();

    if (isMobileAboutView()) {
      if (typeof window.loadAboutMobileContent === 'function') {
        window.loadAboutMobileContent();
      }
      if (typeof window.resetAboutMobileScroll === 'function') {
        window.resetAboutMobileScroll();
      }
      if (mobileAboutPage) mobileAboutPage.hidden = false;
      document.documentElement.classList.add('is-about-open');
      setOpenState(true);
      isAnimating = false;
      return;
    }

    if (mobileAboutPage) mobileAboutPage.hidden = true;
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

    if (typeof window.closeRapOrCrapGame === 'function' && RAP_OR_CRAP_ENABLED) {
      window.closeRapOrCrapGame();
    }

    if (immediate || prefersReducedMotion || isMobileAboutView()) {
      document.documentElement.classList.remove('is-about-open');
      setOpenState(false);
      if (mobileAboutPage) mobileAboutPage.hidden = true;
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
        if (mobileAboutPage) mobileAboutPage.hidden = true;

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

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAboutPanel();
  });

  window.closeAboutPanel = closeAboutPanel;
})();
