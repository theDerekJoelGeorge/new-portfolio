(function () {
  if (!window.FooterGameHub) return;

  const COLORS = {
    archer: '#ff8d28',
    archerDark: '#eb8b01',
    bow: '#6e6e73',
    arrow: '#1e1e1e',
    power: '#ff8d28',
    score: '#aeaeb2'
  };

  const MAX_POWER = 100;
  const POWER_CHARGE_RATE = 1.8;
  const GRAVITY = 0.14;
  const LAUNCH_POWER_SCALE = 0.1;
  const WIND_SCALE = 0.012;
  const MAX_STUCK_ARROWS = 200;
  const ARROW_LEN = 14;
  const ARCHER_HIT_W = 28;
  const ARCHER_HIT_H = 30;
  const MIN_STICK_DIST = 52;
  const ARCHER_STICK_PADDING = 18;
  const TARGET_RADIUS = 10;
  const TARGET_FLEE_DIST = 82;
  const TARGET_NEAR_MISS_DIST = 36;
  const TARGET_FLEE_COOLDOWN = 700;
  const TARGET_MIN_JUMP_DIST = 160;
  const TARGET_MOVE_SPEED = 0.09;
  const TARGET_FLEE_SPEED = 0.22;
  const PAGE_GRID_COLS = 11;
  const PAGE_GRID_ROWS = 8;
  const PAGE_MARGIN = 40;

  const HIDE_SPOT_SELECTOR = [
    '[data-stick-target]',
    '.profile__timeline-date',
    '.profile__timeline-detail',
    '.profile__name',
    '.profile__avatar',
    '.profile__bio',
    '.profile__tagline',
    '.profile__role-barcode',
    '.card-placeholder',
    '.case-card',
    '.case-card--compact',
    '.case-card-home__role',
    '.folder',
    '.folder__label',
    '.portfolio__section-title',
    '.site-header__logo',
    '.site-header__social .social-link',
    '.site-footer__location',
    '.break-website-btn',
    '.info-btn',
    '.profile__watermark'
  ].join(', ');

  const STICKABLE_SELECTOR = [
    '[data-stick-target]',
    'img',
    'h1',
    'h2',
    'h3',
    'p',
    'dt',
    'dd',
    'a',
    'button',
    'hr',
    '.portfolio__section-title',
    '.profile__timeline-date',
    '.profile__timeline-detail',
    '.profile__name',
    '.profile__bio',
    '.profile__tagline',
    '.profile__role-barcode',
    '.card-placeholder',
    '.case-card',
    '.case-card--compact',
    '.case-card-home__role',
    '.folder',
    '.folder__label',
    '.site-header__logo',
    '.social-link',
    '.site-footer__location',
    '.break-website-btn',
    '.info-btn',
    '.footer-runner__instruction',
    '.site-footer__rule',
    '.mobile-nav__link',
    '.profile__avatar',
    '.profile__avatar-inner',
    '.curious-btn-tooltip',
    '.site-header__brand',
    'i.fab',
    'i.far'
  ].join(', ');

  const GAME_LAYER_SELECTOR = '#bowmanOverlay, #bowmanStuckLayer, #bowmanTarget, #bowmanConfettiLayer';

  let ctx = null;
  let width = 0;
  let height = 0;
  let archerX = 80;
  let archerY = 0;
  let archerH = 22;
  let archerPlacedManually = false;
  let isMovingArcher = false;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let stuckLayer = null;
  let angle = -0.8;
  let power = 0;
  let isCharging = false;
  let arrow = null;
  let wind = 0;
  let documentPointerMove = null;
  let targetEl = null;
  let target = null;
  let targetHitFlash = 0;
  let hideSpots = [];
  let confettiLayer = null;
  let targetsHit = 0;
  let gameStartTime = 0;
  let scoreHudVisible = false;
  let didPrankStartTarget = false;

  const formatElapsedTime = function (ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return minutes + ':' + String(seconds).padStart(2, '0');
  };

  const getFooterHudY = function () {
    const footerCanvas = document.getElementById('footerRunnerCanvas');
    if (footerCanvas) {
      const rect = footerCanvas.getBoundingClientRect();
      if (rect.height > 0) return rect.top + 16;
    }

    const rule = document.querySelector('.site-footer__rule');
    if (rule) {
      const rect = rule.getBoundingClientRect();
      return rect.top - 8;
    }

    return Math.max(16, height - 56);
  };

  const drawScoreHud = function () {
    if (!scoreHudVisible) return;

    const hudY = getFooterHudY();

    ctx.font = '600 11px Manrope, sans-serif';
    ctx.fillStyle = COLORS.score;
    ctx.textAlign = 'left';
    ctx.fillText('HIT ' + String(targetsHit).padStart(5, '0'), 16, hudY);
    ctx.textAlign = 'right';
    if (gameStartTime > 0) {
      ctx.fillText(formatElapsedTime(performance.now() - gameStartTime), width - 16, hudY);
    }
    ctx.textAlign = 'left';
  };

  const spawnHitPopup = function () {
    if (!confettiLayer) return;
    const popup = document.createElement('span');
    popup.className = 'bowman-hit-popup';
    popup.setAttribute('aria-hidden', 'true');
    popup.textContent = '+1';
    popup.style.left = lastPointerX + 'px';
    popup.style.top = lastPointerY + 'px';
    confettiLayer.appendChild(popup);

    window.setTimeout(function () {
      popup.remove();
    }, 1200);
  };

  const randomWind = function () {
    wind = (Math.random() - 0.5) * 0.1;
  };

  const getBowOrigin = function () {
    return {
      x: archerX + 6,
      y: archerY
    };
  };

  const getArcherBounds = function () {
    return {
      left: archerX - 10,
      top: archerY - archerH * 0.5,
      right: archerX + ARCHER_HIT_W,
      bottom: archerY + 6
    };
  };

  const isPointOnArcher = function (clientX, clientY) {
    const b = getArcherBounds();
    return clientX >= b.left && clientX <= b.right && clientY >= b.top && clientY <= b.bottom;
  };

  const isPointInArcherZone = function (x, y, padding) {
    const pad = padding || 0;
    const b = getArcherBounds();
    return (
      x >= b.left - pad &&
      x <= b.right + pad &&
      y >= b.top - pad &&
      y <= b.bottom + pad
    );
  };

  const clampArcherPosition = function (x, y) {
    archerX = Math.max(12, Math.min(x, width - 24));
    archerY = Math.max(archerH * 0.5, Math.min(y, height - 8));
  };

  const moveArcherToPointer = function (clientX, clientY) {
    archerPlacedManually = true;
    clampArcherPosition(clientX - 6, clientY);
  };

  const syncArcherToFooter = function () {
    if (archerPlacedManually) return;
    const rule = document.querySelector('.site-footer__rule');
    if (!rule) {
      archerX = 80;
      archerY = height - 40;
      return;
    }
    const rect = rule.getBoundingClientRect();
    archerX = rect.left + 72;
    archerY = rect.top;
    archerH = 22;
  };

  const getAimFromPointer = function (clientX, clientY) {
    const origin = getBowOrigin();
    const dx = clientX - origin.x;
    const dy = clientY - origin.y;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    angle = Math.atan2(dy, dx);
  };

  const isVisibleElement = function (el) {
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (parseFloat(style.opacity) === 0) return false;
    return true;
  };

  const isStickableElement = function (el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.closest(GAME_LAYER_SELECTOR)) return false;
    if (el.classList.contains('stuck-arrow')) return false;
    if (el.closest('.skip-link')) return false;
    if (el === document.documentElement || el === document.body) return false;
    if (!el.closest('.page') && !el.closest('.mobile-nav')) return false;
    if (!el.matches(STICKABLE_SELECTOR)) return false;
    if (!isVisibleElement(el)) return false;
    return true;
  };

  const getElementAtPoint = function (x, y) {
    const stack = document.elementsFromPoint(x, y);
    for (let i = 0; i < stack.length; i++) {
      if (isStickableElement(stack[i])) return stack[i];
    }
    return null;
  };

  const dist2 = function (x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
  };

  const distBetween = function (x1, y1, x2, y2) {
    return Math.sqrt(dist2(x1, y1, x2, y2));
  };

  const collectHideSpots = function () {
    const seen = new Set();
    hideSpots = [];
    document.querySelectorAll(HIDE_SPOT_SELECTOR).forEach(function (el) {
      if (!el.isConnected || seen.has(el)) return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) return;
      seen.add(el);
      hideSpots.push(el);
    });
  };

  const getPageGridPoints = function (awayX, awayY) {
    const points = [];
    const usableW = Math.max(width - PAGE_MARGIN * 2, 120);
    const usableH = Math.max(height - PAGE_MARGIN * 2, 120);

    for (let c = 0; c < PAGE_GRID_COLS; c++) {
      for (let r = 0; r < PAGE_GRID_ROWS; r++) {
        const x = PAGE_MARGIN + usableW * (PAGE_GRID_COLS === 1 ? 0.5 : c / (PAGE_GRID_COLS - 1));
        const y = PAGE_MARGIN + usableH * (PAGE_GRID_ROWS === 1 ? 0.5 : r / (PAGE_GRID_ROWS - 1));
        const jx = x + (Math.random() - 0.5) * 28;
        const jy = y + (Math.random() - 0.5) * 28;
        points.push({
          x: jx,
          y: jy,
          el: null,
          awayScore: distBetween(jx, jy, awayX, awayY)
        });
      }
    }

    return points;
  };

  const getHidePointsForElement = function (el, awayX, awayY) {
    const rect = el.getBoundingClientRect();
    if (rect.width < 12 || rect.height < 10) return [];

    const padX = Math.min(14, rect.width * 0.2);
    const padY = Math.min(14, rect.height * 0.2);
    const points = [
      { x: rect.left + padX, y: rect.top + padY },
      { x: rect.right - padX, y: rect.top + padY },
      { x: rect.left + padX, y: rect.bottom - padY },
      { x: rect.right - padX, y: rect.bottom - padY },
      { x: rect.left + rect.width * 0.5, y: rect.top + padY },
      { x: rect.left + rect.width * 0.5, y: rect.bottom - padY },
      { x: rect.left + padX, y: rect.top + rect.height * 0.5 },
      { x: rect.right - padX, y: rect.top + rect.height * 0.5 },
      { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.5 }
    ];

    return points
      .filter(function (p) {
        return p.x > 12 && p.x < width - 12 && p.y > 12 && p.y < height - 12;
      })
      .map(function (p) {
        return {
          x: p.x,
          y: p.y,
          el: el,
          awayScore: distBetween(p.x, p.y, awayX, awayY)
        };
      });
  };

  const pickHideDestination = function () {
    const origin = getBowOrigin();
    const awayX = origin.x;
    const awayY = origin.y;
    let candidates = getPageGridPoints(awayX, awayY);

    hideSpots.forEach(function (el) {
      if (!el.isConnected) return;
      candidates = candidates.concat(getHidePointsForElement(el, awayX, awayY));
    });

    if (target) {
      candidates = candidates.filter(function (p) {
        return distBetween(p.x, p.y, target.lastGoalX, target.lastGoalY) >= TARGET_MIN_JUMP_DIST;
      });
    }

    if (candidates.length === 0) {
      return {
        x: PAGE_MARGIN + Math.random() * (width - PAGE_MARGIN * 2),
        y: PAGE_MARGIN + Math.random() * (height - PAGE_MARGIN * 2),
        el: null
      };
    }

    candidates.sort(function (a, b) {
      return b.awayScore - a.awayScore;
    });

    const poolSize = Math.min(24, candidates.length);
    const pool = candidates.slice(0, poolSize);
    const pick = pool[Math.floor(Math.random() * pool.length)];

    return {
      x: pick.x + (Math.random() - 0.5) * 16,
      y: pick.y + (Math.random() - 0.5) * 16,
      el: pick.el
    };
  };

  const scheduleTargetRelocate = function (force) {
    if (!target) return;
    if (!force && target.fleeing) return;
    const dest = pickHideDestination();
    target.lastGoalX = target.goalX;
    target.lastGoalY = target.goalY;
    target.goalX = dest.x;
    target.goalY = dest.y;
    target.spotEl = dest.el;
    target.fleeing = true;
    target.hiding = false;
    target.fleeCooldownUntil = performance.now() + TARGET_FLEE_COOLDOWN;
  };

  const spawnTargetConfetti = function (originX, originY) {
    if (!confettiLayer) return;
    const colors = ['#ff8d28', '#eb4b4b', '#ffd700', '#ff9ff3', '#48dbfb'];
    const count = 14;

    for (let i = 0; i < count; i++) {
      const piece = document.createElement('span');
      piece.className = 'bowman-confetti';
      piece.setAttribute('aria-hidden', 'true');
      const size = 3 + Math.random() * 4;
      piece.style.width = size + 'px';
      piece.style.height = size + 'px';
      piece.style.left = originX + 'px';
      piece.style.top = originY + 'px';
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '1px';

      const angle = Math.random() * Math.PI * 2;
      const burst = 10 + Math.random() * 20;
      piece.style.setProperty('--bx', Math.cos(angle) * burst + 'px');
      piece.style.setProperty('--by', Math.sin(angle) * burst + 'px');
      const duration = 1.4 + Math.random() * 0.9;
      const delay = Math.random() * 0.25;
      piece.style.animation =
        'bowman-confetti-pop ' + duration + 's ease-out ' + delay + 's forwards';
      confettiLayer.appendChild(piece);

      window.setTimeout(function () {
        piece.remove();
      }, (duration + delay) * 1000 + 150);
    }
  };

  const showTarget = function () {
    if (!targetEl) return;
    targetEl.hidden = false;
    targetEl.setAttribute('aria-hidden', 'false');
  };

  const hideTargetEl = function () {
    if (!targetEl) return;
    targetEl.hidden = true;
    targetEl.setAttribute('aria-hidden', 'true');
  };

  const syncTargetDom = function () {
    if (!targetEl || !target) return;
    targetEl.style.left = target.x + 'px';
    targetEl.style.top = target.y + 'px';
    targetEl.classList.toggle('is-hiding', target.hiding);
    targetEl.classList.toggle('is-fleeing', target.fleeing);
  };

  const initTarget = function () {
    targetEl = document.getElementById('bowmanTarget');
    confettiLayer = document.getElementById('bowmanConfettiLayer');
    collectHideSpots();
    let start = pickHideDestination();

    if (!didPrankStartTarget) {
      const icon = document.querySelector('.footer-runner__target-icon');
      if (icon) {
        const r = icon.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          start = {
            x: r.left + r.width / 2,
            y: r.top + r.height / 2,
            el: icon
          };
          didPrankStartTarget = true;
        }
      }
    }
    target = {
      x: start.x,
      y: start.y,
      goalX: start.x,
      goalY: start.y,
      lastGoalX: start.x,
      lastGoalY: start.y,
      r: TARGET_RADIUS,
      spotEl: start.el,
      fleeing: false,
      hiding: true,
      fleeCooldownUntil: 0,
      active: true,
      lockedVisibleUntilHit: !!(start && start.el && start.el.classList && start.el.classList.contains('footer-runner__target-icon'))
    };

    if (target.lockedVisibleUntilHit) {
      target.hiding = false;
    }
    showTarget();
    syncTargetDom();
  };

  const destroyTarget = function () {
    target = null;
    hideTargetEl();
    if (targetEl) {
      targetEl.classList.remove('is-hiding', 'is-fleeing', 'is-hit');
    }
    if (confettiLayer) confettiLayer.innerHTML = '';
  };

  const distTargetToArcher = function () {
    if (!target) return Infinity;
    const b = getArcherBounds();
    const cx = Math.max(b.left, Math.min(target.x, b.right));
    const cy = Math.max(b.top, Math.min(target.y, b.bottom));
    return distBetween(target.x, target.y, cx, cy);
  };

  const predictArrowHitTarget = function () {
    if (!arrow || !target || !target.active) return false;

    let simX = arrow.x;
    let simY = arrow.y;
    let simVx = arrow.vx;
    let simVy = arrow.vy;
    let travelDist = arrow.travelDist;
    let prevX = simX;
    let prevY = simY;

    for (let step = 0; step < 150; step++) {
      prevX = simX;
      prevY = simY;
      simVy += GRAVITY;
      simVx += wind * WIND_SCALE;
      simX += simVx;
      simY += simVy;
      travelDist += Math.sqrt(dist2(prevX, prevY, simX, simY));

      if (travelDist < MIN_STICK_DIST) continue;
      if (segmentHitsTarget(prevX, prevY, simX, simY)) return true;

      if (simX < -60 || simX > width + 60 || simY < -120 || simY > height + 60) break;
    }

    return false;
  };

  const updateTarget = function () {
    if (!target || !target.active) return;

    if (target.lockedVisibleUntilHit) {
      target.hiding = false;
      target.fleeing = false;
      target.goalX = target.x;
      target.goalY = target.y;
      syncTargetDom();
      return;
    }

    if (arrow && predictArrowHitTarget()) {
      syncTargetDom();
      return;
    }

    const archerDist = distTargetToArcher();
    const now = performance.now();
    const goalDist = distBetween(target.x, target.y, target.goalX, target.goalY);

    if (
      archerDist < TARGET_FLEE_DIST &&
      !target.fleeing &&
      now >= target.fleeCooldownUntil
    ) {
      scheduleTargetRelocate();
    }

    const speed = target.fleeing ? TARGET_FLEE_SPEED : TARGET_MOVE_SPEED;
    target.x += (target.goalX - target.x) * speed;
    target.y += (target.goalY - target.y) * speed;

    if (goalDist < 5) {
      target.fleeing = false;
      target.hiding = true;
    } else if (goalDist > 20) {
      target.hiding = false;
    }

    syncTargetDom();
  };

  const triggerTargetHit = function (hitX, hitY, landAngle) {
    if (!target) return;
    targetsHit++;
    target.lockedVisibleUntilHit = false;
    createStuckArrow(hitX, hitY, landAngle);
    targetHitFlash = 10;
    spawnTargetConfetti(hitX, hitY);
    spawnHitPopup();

    if (targetEl) {
      targetEl.classList.remove('is-hit');
      void targetEl.offsetWidth;
      targetEl.classList.add('is-hit');
    }

    target.x = hitX;
    target.y = hitY;
    target.lastGoalX = hitX;
    target.lastGoalY = hitY;
    target.fleeCooldownUntil = 0;
    scheduleTargetRelocate(true);
    syncTargetDom();
  };

  const segmentHitsTarget = function (x0, y0, x1, y1) {
    if (!target || !target.active) return null;

    const r = target.r + 3;
    const r2 = r * r;
    const landAngle = Math.atan2(y1 - y0, x1 - x0);
    const steps = Math.max(2, Math.ceil(distBetween(x0, y0, x1, y1) / 3));

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      if (dist2(x, y, target.x, target.y) <= r2) {
        return { x: x, y: y, angle: landAngle, isTarget: true };
      }
    }

    return null;
  };

  const checkTargetNearMiss = function (x0, y0, x1, y1) {
    if (!target || !target.active) return false;

    const hitR = target.r + 3;
    const nearR = TARGET_NEAR_MISS_DIST;
    const steps = Math.max(2, Math.ceil(distBetween(x0, y0, x1, y1) / 3));

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      const d = Math.sqrt(dist2(x, y, target.x, target.y));
      if (d <= hitR) return false;
      if (d <= nearR) return true;
    }

    return false;
  };

  const triggerTargetNearMiss = function () {
    if (!target) return;
    if (arrow && predictArrowHitTarget()) return;
    const now = performance.now();
    if (target.fleeing || now < target.fleeCooldownUntil) return;
    scheduleTargetRelocate(true);
  };

  const drawTargetHitFlash = function () {
    if (!target || targetHitFlash <= 0) return;
    ctx.fillStyle = 'rgba(255, 141, 40, ' + (targetHitFlash / 40) + ')';
    ctx.beginPath();
    ctx.arc(target.x, target.y, target.r + 14, 0, Math.PI * 2);
    ctx.fill();
    targetHitFlash--;
  };

  const distFromBowOrigin = function (x, y) {
    const origin = getBowOrigin();
    return Math.sqrt(dist2(origin.x, origin.y, x, y));
  };

  const bindDocumentPointer = function () {
    if (documentPointerMove) return;

    documentPointerMove = function (e) {
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      if (isMovingArcher) {
        moveArcherToPointer(e.clientX, e.clientY);
        return;
      }
      getAimFromPointer(e.clientX, e.clientY);
    };

    document.addEventListener('pointermove', documentPointerMove);
  };

  const unbindDocumentPointer = function () {
    if (documentPointerMove) {
      document.removeEventListener('pointermove', documentPointerMove);
      documentPointerMove = null;
    }
    isMovingArcher = false;
  };

  const clearAllStuckArrows = function () {
    if (stuckLayer) stuckLayer.innerHTML = '';
    document.querySelectorAll('.stuck-arrow').forEach(function (el) {
      el.remove();
    });
  };

  const createStuckArrow = function (hitX, hitY, landAngle) {
    if (!stuckLayer) return;

    const stuck = document.createElement('span');
    stuck.className = 'stuck-arrow';
    stuck.setAttribute('aria-hidden', 'true');
    stuck.style.left = hitX + 'px';
    stuck.style.top = hitY + 'px';
    stuck.style.transform = 'rotate(' + landAngle + 'rad)';
    stuckLayer.appendChild(stuck);

    const arrows = stuckLayer.querySelectorAll('.stuck-arrow');
    if (arrows.length > MAX_STUCK_ARROWS) {
      arrows[0].remove();
    }
  };

  const findHitAlongSegment = function (x0, y0, x1, y1) {
    const segLen = Math.sqrt(dist2(x0, y0, x1, y1));
    const steps = Math.max(2, Math.ceil(segLen / 4));
    const landAngle = Math.atan2(y1 - y0, x1 - x0);

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;

      if (distFromBowOrigin(x, y) < MIN_STICK_DIST) continue;
      if (isPointInArcherZone(x, y, ARCHER_STICK_PADDING)) continue;

      const el = getElementAtPoint(x, y);
      if (el) {
        return { x: x, y: y, angle: landAngle, el: el };
      }
    }

    return null;
  };

  const fireArrow = function () {
    if (arrow || isMovingArcher) return;
    const origin = getBowOrigin();
    const launchPower = Math.max(5, power * LAUNCH_POWER_SCALE);
    arrow = {
      x: origin.x,
      y: origin.y,
      prevX: origin.x,
      prevY: origin.y,
      vx: Math.cos(angle) * launchPower,
      vy: Math.sin(angle) * launchPower,
      travelDist: 0
    };
    isCharging = false;
    power = 0;
  };

  const drawArcher = function () {
    const x = archerX - 4;
    const y = archerY - archerH * 0.5;
    const headH = Math.max(5, archerH * 0.34);
    const bodyH = archerH - headH;

    if (isMovingArcher) {
      ctx.strokeStyle = 'rgba(255, 141, 40, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      const b = getArcherBounds();
      ctx.strokeRect(b.left, b.top, b.right - b.left, b.bottom - b.top);
      ctx.setLineDash([]);
    }

    ctx.fillStyle = COLORS.archer;
    ctx.fillRect(x, y + headH, 9, bodyH);
    ctx.fillStyle = COLORS.archerDark;
    ctx.fillRect(x + 1, y, 7, headH);

    const bx = archerX + 6;
    const by = archerY;
    const bowLen = 11;
    const bowTipX = bx + Math.cos(angle - Math.PI / 2) * bowLen * 0.5;
    const bowTipY = by + Math.sin(angle - Math.PI / 2) * bowLen * 0.5;
    const bowTipX2 = bx + Math.cos(angle + Math.PI / 2) * bowLen * 0.5;
    const bowTipY2 = by + Math.sin(angle + Math.PI / 2) * bowLen * 0.5;

    ctx.strokeStyle = COLORS.bow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bowTipX, bowTipY);
    ctx.quadraticCurveTo(
      bx + Math.cos(angle) * bowLen,
      by + Math.sin(angle) * bowLen,
      bowTipX2,
      bowTipY2
    );
    ctx.stroke();

    if (isCharging && power > 0) {
      const pull = power * 0.045;
      const nx = bx - Math.cos(angle) * pull;
      const ny = by - Math.sin(angle) * pull;
      ctx.strokeStyle = COLORS.arrow;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(bx + Math.cos(angle) * 7, by + Math.sin(angle) * 7);
      ctx.stroke();
    }
  };

  const drawFlyingArrow = function () {
    if (!arrow) return;
    const flightAngle = Math.atan2(arrow.vy, arrow.vx);
    const tipX = arrow.x;
    const tipY = arrow.y;
    const tailX = tipX - Math.cos(flightAngle) * ARROW_LEN;
    const tailY = tipY - Math.sin(flightAngle) * ARROW_LEN;

    ctx.strokeStyle = COLORS.arrow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    ctx.fillStyle = COLORS.arrow;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX - Math.cos(flightAngle) * 4 - Math.sin(flightAngle) * 2,
      tipY - Math.sin(flightAngle) * 4 + Math.cos(flightAngle) * 2
    );
    ctx.lineTo(
      tipX - Math.cos(flightAngle) * 4 + Math.sin(flightAngle) * 2,
      tipY - Math.sin(flightAngle) * 4 - Math.cos(flightAngle) * 2
    );
    ctx.closePath();
    ctx.fill();
  };

  const drawPowerBar = function () {
    if (!isCharging && power <= 0) return;
    const barW = 32;
    const barH = 3;
    const x = archerX - 4;
    const y = archerY - archerH * 0.5 - 10;
    ctx.fillStyle = 'rgba(232, 232, 232, 0.85)';
    ctx.fillRect(x, y, barW, barH);
    ctx.fillStyle = COLORS.power;
    ctx.fillRect(x, y, barW * (power / MAX_POWER), barH);
  };

  const drawAimGuide = function () {
    if (arrow || isMovingArcher) return;
    const origin = getBowOrigin();
    const guideLen = 22 + power * 0.15;
    ctx.strokeStyle = 'rgba(174, 174, 178, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(
      origin.x + Math.cos(angle) * guideLen,
      origin.y + Math.sin(angle) * guideLen
    );
    ctx.stroke();
    ctx.setLineDash([]);
  };

  FooterGameHub.register({
    id: 'bowman',
    label: 'Bowman',
    useViewport: true,

    onEnter: function (helpers) {
      ctx = helpers.ctx;
      width = helpers.width;
      height = helpers.height;
      stuckLayer = document.getElementById('bowmanStuckLayer');
      if (stuckLayer) stuckLayer.setAttribute('aria-hidden', 'false');
      syncArcherToFooter();
      lastPointerX = archerX + 6;
      lastPointerY = archerY;
      bindDocumentPointer();
      randomWind();
      didPrankStartTarget = false;
      initTarget();
    },

    onExit: function () {
      unbindDocumentPointer();
      arrow = null;
      isCharging = false;
      isMovingArcher = false;
      archerPlacedManually = false;
      targetsHit = 0;
      gameStartTime = 0;
      scoreHudVisible = false;
      destroyTarget();
      clearAllStuckArrows();
      if (stuckLayer) stuckLayer.setAttribute('aria-hidden', 'true');
    },

    reset: function (helpers) {
      ctx = helpers.ctx;
      width = helpers.width;
      height = helpers.height;
      archerPlacedManually = false;
      power = 0;
      isCharging = false;
      arrow = null;
      isMovingArcher = false;
      targetsHit = 0;
      gameStartTime = 0;
      scoreHudVisible = false;
      clearAllStuckArrows();
      syncArcherToFooter();
      lastPointerX = archerX + 6;
      lastPointerY = archerY;
      randomWind();
      didPrankStartTarget = false;
      initTarget();
    },

    onResize: function (helpers) {
      width = helpers.width;
      height = helpers.height;
      syncArcherToFooter();
      collectHideSpots();
    },

    getStartMessage: function () {
      return 'Hold space to move the bowman. Click and hold to aim power, release to fire. Press Esc to exit.';
    },

    update: function () {
      if (isCharging && !arrow && !isMovingArcher) {
        power = Math.min(MAX_POWER, power + POWER_CHARGE_RATE);
      }

      if (arrow) {
        const prevX = arrow.prevX;
        const prevY = arrow.prevY;

        arrow.vy += GRAVITY;
        arrow.vx += wind * WIND_SCALE;
        arrow.x += arrow.vx;
        arrow.y += arrow.vy;
        arrow.travelDist += Math.sqrt(dist2(prevX, prevY, arrow.x, arrow.y));

        let hit = null;
        if (arrow.travelDist >= MIN_STICK_DIST) {
          hit = segmentHitsTarget(prevX, prevY, arrow.x, arrow.y);
          if (!hit && checkTargetNearMiss(prevX, prevY, arrow.x, arrow.y)) {
            triggerTargetNearMiss();
          }
          if (!hit) {
            hit = findHitAlongSegment(prevX, prevY, arrow.x, arrow.y);
          }
        }
        arrow.prevX = arrow.x;
        arrow.prevY = arrow.y;

        if (hit) {
          if (hit.isTarget) {
            triggerTargetHit(hit.x, hit.y, hit.angle);
          } else {
            createStuckArrow(hit.x, hit.y, hit.angle);
          }
          arrow = null;
        } else if (
          arrow.x < -60 ||
          arrow.x > width + 60 ||
          arrow.y < -120 ||
          arrow.y > height + 60
        ) {
          arrow = null;
        }
      }

      updateTarget();
    },

    draw: function (helpers) {
      ctx = helpers.ctx;
      width = helpers.width;
      height = helpers.height;
      syncArcherToFooter();

      ctx.clearRect(0, 0, width, height);
      drawAimGuide();
      drawArcher();
      drawFlyingArrow();
      drawPowerBar();
      drawTargetHitFlash();
      drawScoreHud();
    },

    onKeyDown: function (e) {
      if (e.code === 'Space' || e.key === ' ') {
        if (!scoreHudVisible) {
          scoreHudVisible = true;
          gameStartTime = performance.now();
        }
        isMovingArcher = true;
        isCharging = false;
        power = 0;
        moveArcherToPointer(lastPointerX, lastPointerY);
        return true;
      }
      return false;
    },

    onKeyUp: function (e) {
      if (e.code === 'Space' || e.key === ' ') {
        isMovingArcher = false;
        return true;
      }
      return false;
    },

    onPointerDown: function (e) {
      if (e.button !== 0) return false;
      if (isMovingArcher || arrow) return false;
      getAimFromPointer(e.clientX, e.clientY);
      isCharging = true;
      if (e.target && typeof e.target.setPointerCapture === 'function') {
        try {
          e.target.setPointerCapture(e.pointerId);
        } catch (_) {}
      }
      return true;
    },

    onPointerUp: function (e) {
      if (e.button !== 0) return false;
      if (e.target && typeof e.target.releasePointerCapture === 'function') {
        try {
          e.target.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
      if (isCharging) {
        fireArrow();
        return true;
      }
      return false;
    },

    onPointerMove: function (e) {
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      if (isMovingArcher) {
        moveArcherToPointer(e.clientX, e.clientY);
        return;
      }
      getAimFromPointer(e.clientX, e.clientY);
    }
  });

  FooterGameHub.boot();
})();
