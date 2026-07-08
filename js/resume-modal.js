(function () {
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
    '<a class="resume-window__download" href="assets/derek-resume.pdf" download>Download</a>' +
    '</div>' +
    '</div>' +
    '<div class="resume-window__content">' +
    '<div class="resume-window__pdf-scroll" id="resumePdfScroll" hidden></div>' +
    '<iframe class="resume-window__pdf" id="resumePdfFrame" title="Derek resume" hidden scrolling="no"></iframe>' +
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
  const resumePdfFrame = document.getElementById('resumePdfFrame');
  const resumePdfScroll = document.getElementById('resumePdfScroll');
  const closeBtn = document.getElementById('resumeCloseBtn');
  const minBtn = document.getElementById('resumeMinBtn');
  const zoomBtn = document.getElementById('resumeZoomBtn');

  if (!resumeTrigger || !resumePanel || !resumeWindow) return;

  const RESUME_PDF_URL = 'assets/derek-resume.pdf';
  const RESUME_PDF_HASH = '#toolbar=0&navpanes=0&scrollbar=0&view=Fit';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TRANSITION_MS = 260;
  const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
  let isAnimating = false;
  let pdfRenderToken = 0;

  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  function clearResumePdf() {
    pdfRenderToken += 1;

    if (resumePdfFrame) {
      resumePdfFrame.removeAttribute('src');
      resumePdfFrame.hidden = true;
    }

    if (resumePdfScroll) {
      resumePdfScroll.innerHTML = '';
      resumePdfScroll.hidden = true;
    }
  }

  async function renderResumePdfWithPdfJs() {
    if (!resumePdfScroll || !window.pdfjsLib) return false;

    const renderToken = ++pdfRenderToken;
    resumePdfScroll.innerHTML = '';
    resumePdfScroll.hidden = false;

    if (resumePdfFrame) resumePdfFrame.hidden = true;

    try {
      const pdf = await pdfjsLib.getDocument(RESUME_PDF_URL).promise;
      if (renderToken !== pdfRenderToken) return false;

      const containerWidth = Math.max(resumePdfScroll.clientWidth, 320);

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        if (renderToken !== pdfRenderToken) return false;

        const baseViewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / baseViewport.width;
        const viewport = page.getViewport({ scale: scale });

        const canvas = document.createElement('canvas');
        canvas.className = 'resume-window__pdf-page';
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext('2d');
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        if (renderToken !== pdfRenderToken) return false;

        resumePdfScroll.appendChild(canvas);
      }

      return true;
    } catch (error) {
      console.warn('Failed to render resume PDF with PDF.js', error);
      return false;
    }
  }

  async function loadResumePdf() {
    clearResumePdf();

    // Wait for the open panel to finish layout before measuring the PDF viewport.
    await new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(resolve);
      });
    });

    const rendered = await renderResumePdfWithPdfJs();
    if (rendered) return;

    if (!resumePdfFrame) return;

    resumePdfFrame.hidden = false;
    resumePdfFrame.src = RESUME_PDF_URL + RESUME_PDF_HASH;
  }

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
    loadResumePdf();

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
      clearResumePdf();
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
        clearResumePdf();

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

  window.clearResumePdf = clearResumePdf;
  window.closeResumeIfOpen = function () {
    if (!document.documentElement.classList.contains('is-resume-open')) return;
    document.documentElement.classList.remove('is-resume-open');
    document.documentElement.classList.remove('is-resume-fullscreen');
    clearResumePdf();
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

