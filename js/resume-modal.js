(function () {
  const RESUME_DOC_HTML =
    '<article class="resume-doc">' +
    '<header class="resume-doc__header">' +
    '<h1 class="resume-doc__name">Derek Joel George</h1>' +
    '<p class="resume-doc__contact">' +
    '<a href="mailto:derekjoelgeorge@gmail.com">derekjoelgeorge@gmail.com</a>' +
    '<span aria-hidden="true">·</span>' +
    '<a href="tel:+61478670086">+61 478 670 086</a>' +
    '<span aria-hidden="true">·</span>' +
    '<span>Brisbane, Australia</span>' +
    '<span aria-hidden="true">·</span>' +
    '<a href="https://www.linkedin.com/in/derek-joel-george" target="_blank" rel="noopener noreferrer">linkedin.com/in/derek-joel-george</a>' +
    '<span aria-hidden="true">·</span>' +
    '<a href="https://thederekjoel.com" target="_blank" rel="noopener noreferrer">thederekjoel.com</a>' +
    '</p>' +
    '</header>' +
    '<section class="resume-doc__section">' +
    '<h2 class="resume-doc__heading">Summary</h2>' +
    '<p class="resume-doc__summary">UX/UI designer with a Master’s in Interaction Design (UQ, 2025) and current contract work defining the experience for a data-heavy financial product at Dunstan Consulting Group. Two years at Capgemini mapping user journeys and design system workflows, plus tutoring web design at UQ. Stronger in wireframing, prototyping, interface design, and translating complex requirements into clearer user experiences, with HTML, CSS, and JavaScript for practical handoff.</p>' +
    '</section>' +
    '<section class="resume-doc__section">' +
    '<h2 class="resume-doc__heading">Skills</h2>' +
    '<dl class="resume-doc__skills">' +
    '<div class="resume-doc__skill"><dt>UX &amp; Interaction</dt><dd>UX &amp; Interaction Design, User Research, Usability Testing, Wireframing, Prototyping, User Flows</dd></div>' +
    '<div class="resume-doc__skill"><dt>UI &amp; Visual</dt><dd>UI Design, Visual Design, High-Fidelity Mockups, Design Systems, Responsive Layouts</dd></div>' +
    '<div class="resume-doc__skill"><dt>Tools</dt><dd>Figma, Miro, Adobe Creative Suite, Adobe XD, Illustrator, Photoshop, Unity</dd></div>' +
    '<div class="resume-doc__skill"><dt>Accessibility</dt><dd>WCAG 2.2, Inclusive Design Principles</dd></div>' +
    '<div class="resume-doc__skill"><dt>Technical</dt><dd>HTML, CSS, JavaScript, Python, SQL, Cursor (AI-assisted workflows)</dd></div>' +
    '</dl>' +
    '</section>' +
    '<section class="resume-doc__section">' +
    '<h2 class="resume-doc__heading">Experience</h2>' +
    '<div class="resume-doc__jobs">' +
    '<article class="resume-doc__job">' +
    '<div class="resume-doc__job-top">' +
    '<h3 class="resume-doc__role">User Interface / User Experience Specialist <span>(Contract)</span></h3>' +
    '<p class="resume-doc__dates">March 2026 – Present</p>' +
    '</div>' +
    '<p class="resume-doc__org">Dunstan Consulting Group <span>Brisbane, QLD</span></p>' +
    '<ul>' +
    '<li>Defining the user experience and user interface for DCG’s flagship software, Vantage.</li>' +
    '<li>Designing the whole app in a clear and intuitive way so complex financial loss modelling data is presented effectively and helps users make better decisions.</li>' +
    '</ul>' +
    '</article>' +
    '<article class="resume-doc__job">' +
    '<div class="resume-doc__job-top">' +
    '<h3 class="resume-doc__role">Casual Academic Tutor <span>(DECO7140)</span></h3>' +
    '<p class="resume-doc__dates">July 2024 – November 2025</p>' +
    '</div>' +
    '<p class="resume-doc__org">University of Queensland <span>Brisbane, QLD</span></p>' +
    '<ul>' +
    '<li>Conducted weekly tutorials on web design fundamentals, covering HTML, CSS, responsive design principles, and introductory JavaScript programming.</li>' +
    '<li>Guided 100+ postgraduate students through theoretical concepts and practical applications of web design, fostering a deep understanding of modern web development practices and tools.</li>' +
    '</ul>' +
    '</article>' +
    '<article class="resume-doc__job">' +
    '<div class="resume-doc__job-top">' +
    '<h3 class="resume-doc__role">Senior Analyst</h3>' +
    '<p class="resume-doc__dates">August 2021 – June 2023</p>' +
    '</div>' +
    '<p class="resume-doc__org">Capgemini India Private Ltd. <span>Bangalore, India</span></p>' +
    '<ul>' +
    '<li>Engaged with project managers to map user journeys and design system workflows, ensuring that backend API integrations supported clear, intuitive product experiences.</li>' +
    '<li>Developed a Proof of Concept (POC) website, incorporating the Stripe payments platform to support its expansion into the Indian market, ensuring compliance with local payment regulations and optimizing transaction workflows.</li>' +
    '</ul>' +
    '</article>' +
    '<article class="resume-doc__job">' +
    '<div class="resume-doc__job-top">' +
    '<h3 class="resume-doc__role">Retail Sales Associate</h3>' +
    '<p class="resume-doc__dates">November 2025 – October 2026</p>' +
    '</div>' +
    '<p class="resume-doc__org">Sunglass Hut <span>Brisbane, QLD</span></p>' +
    '<ul>' +
    '<li>Achieved 1200+ sales and over AUD 350K in gross sales through personalized service, strong product knowledge, and a clear understanding of customer needs.</li>' +
    '<li>Specialized in selling Meta smart glasses and designer eyewear using style-led, conversion-focused recommendations tailored to each customer.</li>' +
    '</ul>' +
    '</article>' +
    '</div>' +
    '</section>' +
    '<section class="resume-doc__section">' +
    '<h2 class="resume-doc__heading">Education</h2>' +
    '<div class="resume-doc__jobs">' +
    '<article class="resume-doc__job">' +
    '<div class="resume-doc__job-top">' +
    '<h3 class="resume-doc__role">Master of Interaction Design</h3>' +
    '<p class="resume-doc__dates">July 2025</p>' +
    '</div>' +
    '<p class="resume-doc__org">University of Queensland <span>Brisbane, QLD</span></p>' +
    '<ul>' +
    '<li>GPA: 6.375. Dean’s Commendation for Academic Excellence recipient. Employability Award recipient.</li>' +
    '</ul>' +
    '</article>' +
    '<article class="resume-doc__job">' +
    '<div class="resume-doc__job-top">' +
    '<h3 class="resume-doc__role">Bachelor of Technology in Electronics and Communication Engineering</h3>' +
    '<p class="resume-doc__dates">May 2021</p>' +
    '</div>' +
    '<p class="resume-doc__org">National Institute of Technology Karnataka <span>Surathkal, India</span></p>' +
    '<ul>' +
    '<li>GPA: 6.54</li>' +
    '</ul>' +
    '</article>' +
    '</div>' +
    '</section>' +
    '</article>';

  const RESUME_PANEL_HTML =
    '<div class="resume-window">' +
    '<div class="resume-window__titlebar">' +
    '<div class="resume-window__controls" aria-label="Window controls">' +
    '<button type="button" class="resume-window__dot resume-window__dot--close" id="resumeCloseBtn" aria-label="Close resume"></button>' +
    '<button type="button" class="resume-window__dot resume-window__dot--minimize" id="resumeMinBtn" aria-label="Close resume"></button>' +
    '<button type="button" class="resume-window__dot resume-window__dot--zoom" id="resumeZoomBtn" aria-label="Fullscreen resume"></button>' +
    '</div>' +
    '<p class="resume-window__title">derek-resume.pdf</p>' +
    '<div class="resume-window__actions" aria-label="Resume actions">' +
    '<a class="resume-window__download" href="assets/derek-resume.pdf?v=2" download="derek-resume.pdf">Download</a>' +
    '</div>' +
    '</div>' +
    '<div class="resume-window__content">' +
    RESUME_DOC_HTML +
    '</div>' +
    '</div>';

  function ensureResumePanel() {
    var existing = document.getElementById('resumePanel');
    if (existing) return existing;

    var panel = document.createElement('aside');
    panel.className = 'resume-panel';
    panel.id = 'resumePanel';
    panel.setAttribute('aria-label', 'Resume');
    panel.innerHTML = RESUME_PANEL_HTML;

    var page = document.querySelector('.page');
    if (page) {
      page.appendChild(panel);
    } else {
      document.body.appendChild(panel);
    }

    return panel;
  }

  const resumeTrigger = document.querySelector('.social-link--resume');
  const logoTrigger = document.querySelector('.site-header__brand');
  const resumePanel = ensureResumePanel();
  const resumeWindow = resumePanel ? resumePanel.querySelector('.resume-window') : null;
  const closeBtn = document.getElementById('resumeCloseBtn');
  const minBtn = document.getElementById('resumeMinBtn');
  const zoomBtn = document.getElementById('resumeZoomBtn');

  if (!resumeTrigger || !resumePanel || !resumeWindow) return;

  const resumeContent = resumeWindow.querySelector('.resume-window__content');
  if (resumeContent && !resumeContent.querySelector('.resume-doc')) {
    resumeContent.innerHTML = RESUME_DOC_HTML;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TRANSITION_MS = 260;
  const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
  let isAnimating = false;

  function resetResumeView() {
    if (resumeContent) resumeContent.scrollTop = 0;
    if (zoomBtn) zoomBtn.setAttribute('aria-pressed', 'false');
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

    const dx = from.x - to.x;
    const dy = from.y - to.y;

    return { dx, dy, scale };
  }

  function setWindowTransform(dx, dy, scale) {
    resumeWindow.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;
  }

  function setWindowTransition(enabled) {
    resumeWindow.style.transition = enabled
      ? `opacity ${TRANSITION_MS}ms ${EASE}, transform ${TRANSITION_MS}ms ${EASE}`
      : 'none';
  }

  function openResumePanel() {
    if (document.documentElement.classList.contains('is-resume-open')) return;
    if (isAnimating) return;
    isAnimating = true;

    if (typeof window.closeAboutPanel === 'function') {
      window.closeAboutPanel(true);
    }
    if (typeof window.closeAllLibraryPanels === 'function') {
      window.closeAllLibraryPanels(true);
    }

    document.documentElement.classList.add('is-resume-open');
    resumePanel.classList.remove('is-closing');
    resetResumeView();

    if (prefersReducedMotion) {
      isAnimating = false;
      return;
    }

    const fromRect = resumeTrigger.getBoundingClientRect();
    const toRect = resumeWindow.getBoundingClientRect();
    const { dx, dy, scale } = computeDiveTransform(fromRect, toRect);

    setWindowTransition(false);
    resumeWindow.style.opacity = '0';
    setWindowTransform(dx, dy, scale);

    requestAnimationFrame(function () {
      setWindowTransition(true);
      resumeWindow.style.opacity = '1';
      setWindowTransform(0, 0, 1);

      window.setTimeout(function () {
        setWindowTransition('');
        resumeWindow.style.opacity = '';
        resumeWindow.style.transform = '';
        isAnimating = false;
      }, TRANSITION_MS);
    });
  }

  function toggleResumePanel() {
    if (document.documentElement.classList.contains('is-resume-open')) {
      closeResumePanel();
    } else {
      openResumePanel();
    }
  }

  function closeResumePanel() {
    if (!document.documentElement.classList.contains('is-resume-open')) return;
    if (prefersReducedMotion) {
      document.documentElement.classList.remove('is-resume-open');
      document.documentElement.classList.remove('is-resume-fullscreen');
      resetResumeView();
      return;
    }

    if (isAnimating) return;
    isAnimating = true;

    const fromRect = resumeTrigger.getBoundingClientRect();
    const toRect = resumeWindow.getBoundingClientRect();
    const { dx, dy, scale } = computeDiveTransform(fromRect, toRect);

    setWindowTransition(true);
    resumeWindow.style.opacity = '1';
    setWindowTransform(0, 0, 1);

    requestAnimationFrame(function () {
      resumeWindow.style.opacity = '0';
      setWindowTransform(dx, dy, scale);

      window.setTimeout(function () {
        resumePanel.classList.remove('is-closing');
        document.documentElement.classList.remove('is-resume-open');
        document.documentElement.classList.remove('is-resume-fullscreen');
        resetResumeView();

        setWindowTransition('');
        resumeWindow.style.opacity = '';
        resumeWindow.style.transform = '';
        isAnimating = false;
      }, TRANSITION_MS);
    });
  }

  function toggleFullscreen() {
    if (!document.documentElement.classList.contains('is-resume-open')) return;
    const isFullscreen = document.documentElement.classList.toggle('is-resume-fullscreen');
    if (zoomBtn) zoomBtn.setAttribute('aria-pressed', isFullscreen ? 'true' : 'false');
  }

  window.clearResumePdf = resetResumeView;
  window.closeResumeIfOpen = function () {
    if (!document.documentElement.classList.contains('is-resume-open')) return;
    document.documentElement.classList.remove('is-resume-open');
    document.documentElement.classList.remove('is-resume-fullscreen');
    resetResumeView();
  };

  resumeTrigger.addEventListener('click', function (e) {
    e.preventDefault();
    toggleResumePanel();
  });

  if (logoTrigger) {
    logoTrigger.addEventListener('click', function () {
      closeResumePanel();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeResumePanel);
  if (minBtn) minBtn.addEventListener('click', closeResumePanel);
  if (zoomBtn) zoomBtn.addEventListener('click', toggleFullscreen);

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeResumePanel();
  });
})();
