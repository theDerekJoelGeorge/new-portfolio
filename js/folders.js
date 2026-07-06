(function () {
  const folders = document.querySelectorAll('.folder');
  if (!folders.length || typeof gsap === 'undefined') return;

  folders.forEach(function (folder) {
    const icon = folder.querySelector('.folder__icon');
    const flap = folder.querySelector('.folder__icon-flap');
    if (!icon || !flap) return;

    folder.addEventListener('mouseenter', function () {
      gsap.to(icon, { scale: 1.06, duration: 0.4, ease: 'power2.inOut' });
      gsap.to(flap, {
        rotationX: -52,
        transformOrigin: 'bottom center',
        duration: 0.4,
        ease: 'power2.inOut'
      });
    });

    folder.addEventListener('mouseleave', function () {
      gsap.to(icon, { scale: 1, duration: 0.35, ease: 'power2.inOut' });
      gsap.to(flap, {
        rotationX: 0,
        transformOrigin: 'bottom center',
        duration: 0.35,
        ease: 'power2.inOut'
      });
    });

    folder.addEventListener('focus', function () {
      gsap.to(icon, { scale: 1.06, duration: 0.4, ease: 'power2.inOut' });
      gsap.to(flap, {
        rotationX: -52,
        transformOrigin: 'bottom center',
        duration: 0.4,
        ease: 'power2.inOut'
      });
    });

    folder.addEventListener('blur', function () {
      gsap.to(icon, { scale: 1, duration: 0.35, ease: 'power2.inOut' });
      gsap.to(flap, {
        rotationX: 0,
        transformOrigin: 'bottom center',
        duration: 0.35,
        ease: 'power2.inOut'
      });
    });
  });

  if (!window.matchMedia('(hover: hover)').matches) return;

  const tooltip = document.createElement('div');
  tooltip.id = 'cursor-tooltip';
  tooltip.className = 'folder__tooltip folder__tooltip--cursor';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  document.body.appendChild(tooltip);

  const tooltipStyle = document.createElement('style');
  tooltipStyle.textContent =
    '.folder__tooltip--cursor{position:fixed;left:0;top:0;padding:0.375rem 0.625rem;background:rgba(0,0,0,0.9);color:#fff;font-size:0.75rem;border-radius:0.25rem;pointer-events:none;opacity:0;transition:opacity 0.15s ease;z-index:1000;white-space:nowrap}.folder__tooltip--cursor.is-visible{opacity:1}';
  document.head.appendChild(tooltipStyle);

  folders.forEach(function (folder) {
    const text = folder.getAttribute('data-tooltip');
    if (!text) return;

    folder.addEventListener('mouseenter', function () {
      tooltip.textContent = text;
      tooltip.hidden = false;
      tooltip.classList.add('is-visible');
    });

    folder.addEventListener('mousemove', function (e) {
      tooltip.style.left = e.clientX + 10 + 'px';
      tooltip.style.top = e.clientY + 10 + 'px';
    });

    folder.addEventListener('mouseleave', function () {
      tooltip.classList.remove('is-visible');
      tooltip.hidden = true;
    });
  });
})();
