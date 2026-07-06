(function () {
  const resumeTrigger = document.querySelector('.social-link--resume');
  const logoTrigger = document.querySelector('.site-header__brand');
  const portfolioPanel = document.getElementById('portfolioPanel');
  const resumePanel = document.getElementById('resumePanel');
  const resumeWindow = resumePanel ? resumePanel.querySelector('.resume-window') : null;
  const closeBtn = document.getElementById('resumeCloseBtn');
  const minBtn = document.getElementById('resumeMinBtn');
  const zoomBtn = document.getElementById('resumeZoomBtn');

  if (!resumeTrigger || !portfolioPanel || !resumePanel || !resumeWindow) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TRANSITION_MS = 260;

  const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
  let isAnimating = false;

  function rectCenter(rect) {
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function computeDiveTransform(fromRect, toRect) {
    const from = rectCenter(fromRect);
    const to = rectCenter(toRect);

    // Scale from icon-ish size into the window size
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

    if (prefersReducedMotion) {
      isAnimating = false;
      return;
    }

    // Measure start (icon) and end (window) positions and animate like Finder "dive".
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
      return;
    }

    if (isAnimating) return;
    isAnimating = true;

    // Reverse-dive back into the resume icon.
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

        setWindowTransition('');
        resumeWindow.style.opacity = '';
        resumeWindow.style.transform = '';
        isAnimating = false;
      }, TRANSITION_MS);
    });
  }

  function toggleFullscreen() {
    if (!document.documentElement.classList.contains('is-resume-open')) return;
    document.documentElement.classList.toggle('is-resume-fullscreen');
  }

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

