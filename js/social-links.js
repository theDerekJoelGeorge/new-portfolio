(function () {
  const EMAIL = 'derekjoelgeorge@gmail.com';
  const DEFAULT_TOOLTIP = 'send me an email';
  const COPIED_TOOLTIP = 'email copied';
  const FEEDBACK_MS = 2000;

  document.querySelectorAll('.social-link--email').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();

      function showFeedback() {
        link.setAttribute('data-tooltip', COPIED_TOOLTIP);
        link.classList.add('is-feedback-visible');
        link.setAttribute('aria-label', COPIED_TOOLTIP);

        window.setTimeout(function () {
          link.setAttribute('data-tooltip', DEFAULT_TOOLTIP);
          link.classList.remove('is-feedback-visible');
          link.setAttribute('aria-label', 'Email');
        }, FEEDBACK_MS);
      }

      function fallbackCopy() {
        const textarea = document.createElement('textarea');
        textarea.value = EMAIL;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(EMAIL).then(showFeedback).catch(function () {
          fallbackCopy();
          showFeedback();
        });
      } else {
        fallbackCopy();
        showFeedback();
      }
    });
  });
})();
