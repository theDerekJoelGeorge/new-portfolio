(function () {
  const layer = document.getElementById('clickRippleLayer');
  if (!layer) return;

  const MIN_RADIUS = 14;
  const RADIUS_PER_MS = 0.16;

  let activeRipple = null;
  let holdStart = 0;
  let holdRaf = null;
  let pointerDown = false;

  const isBowmanActive = function () {
    return document.body.classList.contains('bowman-is-active');
  };

  const isBlocked = function () {
    if (document.documentElement.classList.contains('site-broken')) return true;
    const breakOverlay = document.getElementById('breakOverlay');
    if (breakOverlay && breakOverlay.classList.contains('active')) return true;
    const active = document.activeElement;
    if (!active) return false;
    const tag = active.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || active.isContentEditable;
  };

  const getHoldRadius = function (elapsed) {
    return MIN_RADIUS + elapsed * RADIUS_PER_MS;
  };

  const setRippleSize = function (ripple, radius) {
    const size = radius * 2;
    ripple.style.width = size + 'px';
    ripple.style.height = size + 'px';
  };

  const cancelHoldLoop = function () {
    if (holdRaf) {
      cancelAnimationFrame(holdRaf);
      holdRaf = null;
    }
  };

  const releaseRipple = function () {
    if (!activeRipple) return;

    cancelHoldLoop();
    const elapsed = performance.now() - holdStart;
    const radius = getHoldRadius(elapsed);
    setRippleSize(activeRipple, radius);

    const ripple = activeRipple;
    activeRipple = null;
    pointerDown = false;

    ripple.classList.remove('is-holding');
    ripple.classList.add('is-releasing');

    const cleanup = function () {
      ripple.removeEventListener('animationend', cleanup);
      ripple.remove();
    };
    ripple.addEventListener('animationend', cleanup);
  };

  const discardRipple = function () {
    cancelHoldLoop();
    if (activeRipple) {
      activeRipple.remove();
      activeRipple = null;
    }
    pointerDown = false;
  };

  const tickHoldRipple = function () {
    if (!activeRipple || !pointerDown) return;
    if (isBowmanActive() || isBlocked()) {
      discardRipple();
      return;
    }

    const elapsed = performance.now() - holdStart;
    setRippleSize(activeRipple, getHoldRadius(elapsed));
    holdRaf = requestAnimationFrame(tickHoldRipple);
  };

  const onPointerDown = function (e) {
    if (e.button !== 0) return;
    if (isBowmanActive() || isBlocked()) return;

    discardRipple();

    pointerDown = true;
    holdStart = performance.now();

    activeRipple = document.createElement('span');
    activeRipple.className = 'click-ripple is-holding';
    activeRipple.setAttribute('aria-hidden', 'true');
    activeRipple.style.left = e.clientX + 'px';
    activeRipple.style.top = e.clientY + 'px';
    setRippleSize(activeRipple, MIN_RADIUS);
    layer.appendChild(activeRipple);

    holdRaf = requestAnimationFrame(tickHoldRipple);
  };

  const onPointerUp = function (e) {
    if (e.button !== 0 || !pointerDown) return;
    releaseRipple();
  };

  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('pointercancel', discardRipple);
})();
