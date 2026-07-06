(function () {
  const container = document.getElementById('footerRunner');
  const canvas = document.getElementById('footerRunnerCanvas');
  const overlay = document.getElementById('bowmanOverlay');
  const overlayCanvas = document.getElementById('bowmanOverlayCanvas');
  const statusEl = document.getElementById('footerRunnerStatus');
  const footer = container ? container.closest('footer') : null;

  const games = [];
  let activeGame = null;
  let state = 'idle';
  let animationId = null;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let groundY = 0;
  let ctx = null;
  let usingViewport = false;

  const MOBILE_MAX_WIDTH = 960;
  const mobileQuery = window.matchMedia('(max-width: ' + MOBILE_MAX_WIDTH + 'px)');

  const isMobileViewport = function () {
    return mobileQuery.matches;
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

  const getActiveCanvas = function () {
    return usingViewport && overlayCanvas ? overlayCanvas : canvas;
  };

  const announce = function (message) {
    if (statusEl) statusEl.textContent = message;
  };

  const setState = function (next) {
    state = next;
    container.classList.remove('is-idle', 'is-playing', 'is-gameover');
    container.classList.add('is-' + next);
    if (footer) {
      footer.classList.remove('is-idle', 'is-playing', 'is-gameover');
      footer.classList.add('is-' + next);
    }
  };

  const setViewportMode = function (enabled) {
    usingViewport = enabled;
    if (overlay) {
      overlay.hidden = !enabled;
      overlay.setAttribute('aria-hidden', enabled ? 'false' : 'true');
    }
    document.body.classList.toggle('bowman-is-active', enabled);
    ctx = getActiveCanvas().getContext('2d');
  };

  const resizeCanvas = function () {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetCanvas = getActiveCanvas();
    if (!targetCanvas) return;

    if (usingViewport) {
      width = window.innerWidth;
      height = window.innerHeight;
      groundY = height - 1;
    } else {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(rect.width, 320);
      height = rect.height;
      groundY = height - 1;
    }

    targetCanvas.width = Math.floor(width * dpr);
    targetCanvas.height = Math.floor(height * dpr);
    ctx = targetCanvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const syncCanvasSize = function () {
    resizeCanvas();
    if (activeGame && activeGame.onResize) activeGame.onResize(helpers);
  };

  const pickRandomGame = function (excludeId) {
    if (games.length === 0) return null;
    if (games.length === 1) return games[0];
    let pool = games;
    if (excludeId && games.length > 1) {
      pool = games.filter(function (g) { return g.id !== excludeId; });
      if (pool.length === 0) pool = games;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const helpers = {
    get canvas() { return getActiveCanvas(); },
    get ctx() { return ctx; },
    get container() { return container; },
    get width() { return width; },
    get height() { return height; },
    get groundY() { return groundY; },
    get dpr() { return dpr; },
    get state() { return state; },
    get usingViewport() { return usingViewport; },
    announce: announce,
    endGame: function (message) {
      if (state !== 'playing') return;
      setState('gameover');
      syncCanvasSize();
      if (message) announce(message);
    },
    exitToIdle: function () {
      if (activeGame && activeGame.onExit) activeGame.onExit(helpers);
      activeGame = null;
      setViewportMode(false);
      setState('idle');
      syncCanvasSize();
      announce('');
      drawIdle();
    }
  };

  const startGame = function () {
    if (isMobileViewport()) return;
    if (state === 'playing') return;
    const previousId = activeGame ? activeGame.id : null;
    if (activeGame && activeGame.onExit) activeGame.onExit(helpers);
    activeGame = pickRandomGame(previousId);
    if (!activeGame) return;
    setViewportMode(!!activeGame.useViewport);
    setState('playing');
    syncCanvasSize();
    if (activeGame.onEnter) activeGame.onEnter(helpers);
    if (activeGame.reset) activeGame.reset(helpers);
    if (activeGame.getStartMessage) {
      announce(activeGame.getStartMessage());
    } else {
      announce('Game started. Press escape to exit.');
    }
    if (!animationId) gameLoop();
  };

  const drawIdle = function () {
    if (!canvas) return;
    const footerCtx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const footerDpr = Math.min(window.devicePixelRatio || 1, 2);
    footerCtx.setTransform(footerDpr, 0, 0, footerDpr, 0, 0);
    footerCtx.clearRect(0, 0, rect.width, rect.height);
  };

  const gameLoop = function () {
    if (state === 'playing' && activeGame) {
      if (activeGame.update) activeGame.update(helpers);
      if (activeGame.draw) activeGame.draw(helpers);
    } else if (state === 'gameover' && activeGame) {
      if (activeGame.draw) activeGame.draw(helpers);
      if (activeGame.drawGameOver) activeGame.drawGameOver(helpers);
    }
    animationId = requestAnimationFrame(gameLoop);
  };

  const handleKeyDown = function (e) {
    if (isBlocked()) return;

    if (e.code === 'Space' || e.key === ' ') {
      if (state === 'idle') {
        e.preventDefault();
        startGame();
        return;
      }
      if (state === 'gameover') {
        e.preventDefault();
        startGame();
        return;
      }
      if (state === 'playing' && activeGame && activeGame.onKeyDown) {
        if (activeGame.onKeyDown(e, helpers)) e.preventDefault();
      }
      return;
    }

    if (e.key === 'Escape' && state !== 'idle') {
      e.preventDefault();
      helpers.exitToIdle();
      return;
    }

    if (state === 'playing' && activeGame && activeGame.onKeyDown) {
      if (activeGame.onKeyDown(e, helpers)) e.preventDefault();
    }
  };

  const handleKeyUp = function (e) {
    if (isBlocked()) return;
    if (state === 'playing' && activeGame && activeGame.onKeyUp) {
      if (activeGame.onKeyUp(e, helpers)) e.preventDefault();
    }
  };

  const handlePointerDown = function (e) {
    if (isBlocked()) return;
    if (state === 'idle') {
      startGame();
      return;
    }
    if (state === 'gameover') {
      startGame();
      return;
    }
    if (state === 'playing' && activeGame && activeGame.onPointerDown) {
      if (activeGame.onPointerDown(e, helpers)) e.preventDefault();
    }
  };

  const handleDocumentPointerDown = function (e) {
    if (isBlocked()) return;
    if (state !== 'playing' || !activeGame || !activeGame.onPointerDown) return;
    if (activeGame.onPointerDown(e, helpers)) e.preventDefault();
  };

  const handlePointerUp = function (e) {
    if (isBlocked()) return;
    if (state === 'playing' && activeGame && activeGame.onPointerUp) {
      if (activeGame.onPointerUp(e, helpers)) e.preventDefault();
    }
  };

  const handlePointerMove = function (e) {
    if (state === 'playing' && activeGame && activeGame.onPointerMove) {
      activeGame.onPointerMove(e, helpers);
    }
  };

  const boot = function () {
    if (!container || !canvas) return;
    if (isMobileViewport()) return;
    ctx = canvas.getContext('2d');

    window.addEventListener('resize', function () {
      if (isMobileViewport()) {
        if (state !== 'idle') helpers.exitToIdle();
        return;
      }
      syncCanvasSize();
      if (state === 'idle') drawIdle();
    });

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointerdown', handleDocumentPointerDown);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointermove', handlePointerMove);

    resizeCanvas();
    setState('idle');
    drawIdle();
    animationId = requestAnimationFrame(gameLoop);
  };

  window.FooterGameHub = {
    register: function (game) {
      games.push(game);
    },
    boot: boot
  };
})();
