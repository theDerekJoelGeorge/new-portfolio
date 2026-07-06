(function () {
  if (!window.FooterGameHub) return;

  const COLORS = {
    runner: '#ff8d28',
    runnerDark: '#eb8b01',
    obstacle: '#6e6e73',
    obstacleDark: '#1e1e1e',
    cloud: '#e8e8e8',
    ground: '#d9d9d9',
    score: '#aeaeb2'
  };

  const BASE_RUNNER_W = 18;
  const BASE_RUNNER_H = 22;
  const RUNNER_X_FALLBACK = 48;
  const GRAVITY = 0.62;
  const JUMP_VELOCITY = -9.5;
  const MIN_SPEED = 4.2;
  const MAX_SPEED = 11;
  const VIEW_PADDING = 5;
  const HIGH_SCORE_KEY = 'footerRunnerHighScore';

  let ctx = null;
  let width = 0;
  let height = 0;
  let groundY = 0;
  let yearAnchor = null;
  let runnerX = RUNNER_X_FALLBACK;
  let runnerW = BASE_RUNNER_W;
  let runnerH = BASE_RUNNER_H;
  let runnerScale = 1;
  let runnerY = 0;
  let runnerVy = 0;
  let isJumping = false;
  let legFrame = 0;
  let speed = MIN_SPEED;
  let score = 0;
  let distance = 0;
  let obstacles = [];
  let clouds = [];
  let spawnTimer = 0;
  let nextSpawn = 90;
  let cloudTimer = 0;
  let flashTimer = 0;
  let highScore = 0;
  let gameOver = false;
  let endGameMessage = '';

  const loadHighScore = function () {
    try {
      const stored = sessionStorage.getItem(HIGH_SCORE_KEY);
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch (err) {
      return 0;
    }
  };

  const saveHighScore = function (value) {
    try {
      sessionStorage.setItem(HIGH_SCORE_KEY, String(value));
    } catch (err) {
      /* sessionStorage unavailable */
    }
  };

  const updateHighScore = function () {
    const finalScore = Math.floor(score);
    if (finalScore > highScore) {
      highScore = finalScore;
      saveHighScore(highScore);
      return true;
    }
    return false;
  };

  const syncRunnerX = function () {
    if (!yearAnchor) {
      runnerX = RUNNER_X_FALLBACK;
      return;
    }
    const canvas = ctx.canvas;
    const canvasRect = canvas.getBoundingClientRect();
    const anchorRect = yearAnchor.getBoundingClientRect();
    runnerX = Math.round(anchorRect.left - canvasRect.left);
    runnerX = Math.max(16, Math.min(runnerX, width - runnerW - 16));
  };

  const updatePlayDimensions = function () {
    const playBand = Math.max(groundY - VIEW_PADDING, 12);
    runnerScale = Math.min(1, Math.max(0.52, playBand / 30));
    runnerW = BASE_RUNNER_W * runnerScale;
    runnerH = BASE_RUNNER_H * runnerScale;
  };

  const getJumpVelocity = function () {
    return JUMP_VELOCITY * Math.sqrt(runnerScale);
  };

  const getMaxJumpHeight = function () {
    const v = getJumpVelocity();
    return (v * v) / (2 * GRAVITY);
  };

  const getMaxObstacleHeight = function () {
    const jumpH = getMaxJumpHeight();
    return Math.max(4, Math.min(16, jumpH * 0.5));
  };

  const spawnObstacle = function () {
    const maxObsH = getMaxObstacleHeight();
    const types = [
      { w: 10, h: maxObsH * 0.72 },
      { w: 14, h: maxObsH },
      { w: 22, h: maxObsH * 0.8, wide: true }
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    obstacles.push({
      x: width + 20,
      w: type.w,
      h: Math.max(4, type.h),
      wide: !!type.wide
    });
    nextSpawn = 70 + Math.random() * 90 + (MAX_SPEED - speed) * 4;
  };

  const spawnCloud = function () {
    clouds.push({
      x: width + 30,
      y: VIEW_PADDING + Math.random() * Math.max(groundY - runnerH - VIEW_PADDING * 3, 8),
      w: 20 + Math.random() * 28,
      speed: 0.35 + Math.random() * 0.25
    });
  };

  const drawGround = function () {
    ctx.strokeStyle = COLORS.ground;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundY + 0.5);
    ctx.lineTo(width, groundY + 0.5);
    ctx.stroke();
  };

  const drawCloud = function (cloud) {
    const w = cloud.w;
    const h = Math.max(3, w * 0.22);
    ctx.fillStyle = COLORS.cloud;
    ctx.fillRect(cloud.x, cloud.y, w, h);
    ctx.fillRect(cloud.x + w * 0.2, cloud.y - h * 0.5, w * 0.55, h);
  };

  const drawObstacle = function (obs) {
    const x = obs.x;
    const top = groundY - obs.h;
    ctx.fillStyle = COLORS.obstacleDark;
    ctx.fillRect(x, top, obs.w, obs.h);
    ctx.fillStyle = COLORS.obstacle;
    ctx.fillRect(x + 1, top + 1, obs.w - 2, obs.h - 1);

    if (obs.wide) {
      ctx.fillStyle = COLORS.obstacleDark;
      ctx.fillRect(x + 4, top + 1, 4, 3);
      ctx.fillRect(x + obs.w - 8, top + 2, 4, 2);
    } else if (obs.w <= 12) {
      ctx.fillStyle = COLORS.obstacleDark;
      ctx.fillRect(x + obs.w - 4, top + 1, 3, 2);
    } else {
      ctx.fillStyle = COLORS.obstacleDark;
      ctx.fillRect(x + 2, top + 1, 4, 3);
      ctx.fillRect(x + obs.w - 6, top + 2, 4, 2);
    }
  };

  const drawRunner = function (x, y, frame) {
    const w = runnerW;
    const h = runnerH;
    const headH = Math.max(4, h * 0.36);
    const bodyH = h - headH;

    ctx.fillStyle = COLORS.runner;
    ctx.fillRect(x, y + headH, w, bodyH);

    ctx.fillStyle = COLORS.runnerDark;
    ctx.fillRect(x + w * 0.17, y, w * 0.67, headH);

    ctx.fillStyle = COLORS.runner;
    const legOffset = frame % 2 === 0 ? 0 : Math.max(1, w * 0.17);
    const legW = Math.max(3, w * 0.28);
    const legH = Math.max(2, h * 0.18);
    ctx.fillRect(x + w * 0.11, y + h - legH, legW, legH);
    ctx.fillRect(x + w * 0.61 - legOffset, y + h - legH, legW, legH);

    ctx.fillStyle = '#fff';
    ctx.fillRect(x + w * 0.5, y + headH * 0.25, Math.max(2, w * 0.17), Math.max(2, headH * 0.38));
  };

  const drawScore = function () {
    ctx.font = '600 11px Manrope, sans-serif';
    ctx.fillStyle = COLORS.score;
    ctx.textAlign = 'left';
    ctx.fillText('HI ' + String(highScore).padStart(5, '0'), 16, 16);
    ctx.textAlign = 'right';
    ctx.fillText(String(Math.floor(score)).padStart(5, '0'), width - 16, 16);
    ctx.textAlign = 'left';
  };

  const drawGameOverText = function () {
    ctx.font = '600 11px Manrope, sans-serif';
    ctx.fillStyle = COLORS.obstacleDark;
    ctx.textAlign = 'center';
    ctx.fillText('game over — space to retry', width / 2, 22);
    ctx.textAlign = 'left';
  };

  const collides = function (obs) {
    const pad = 2;
    const feet = runnerY + runnerH - pad;
    const obstacleTop = groundY - obs.h;

    if (feet <= obstacleTop + 2) {
      return false;
    }

    const rx = runnerX + pad;
    const rw = runnerW - pad * 2;
    return rx < obs.x + obs.w && rx + rw > obs.x;
  };

  const jump = function () {
    if (gameOver || isJumping) return;
    runnerVy = getJumpVelocity();
    isJumping = true;
  };

  const triggerEndGame = function (helpers) {
    if (gameOver) return;
    gameOver = true;
    const isNewRecord = updateHighScore();
    flashTimer = 12;
    const finalScore = Math.floor(score);
    const recordNote = isNewRecord ? ' New high score.' : ' High score ' + highScore + '.';
    endGameMessage = 'Game over. Score ' + finalScore + '.' + recordNote + ' Press space to retry or escape to exit.';
    helpers.endGame(endGameMessage);
  };

  FooterGameHub.register({
    id: 'runner',
    label: 'Runner',

    onEnter: function (helpers) {
      ctx = helpers.ctx;
      width = helpers.width;
      height = helpers.height;
      groundY = helpers.groundY;
      yearAnchor = document.querySelector('.profile__timeline-year-anchor');
      highScore = loadHighScore();
      gameOver = false;
      endGameMessage = '';
    },

    onExit: function () {
      gameOver = false;
      obstacles = [];
      clouds = [];
    },

    reset: function (helpers) {
      ctx = helpers.ctx;
      width = helpers.width;
      height = helpers.height;
      groundY = helpers.groundY;
      gameOver = false;
      endGameMessage = '';
      syncRunnerX();
      updatePlayDimensions();
      runnerY = groundY - runnerH;
      runnerVy = 0;
      isJumping = false;
      legFrame = 0;
      speed = MIN_SPEED;
      score = 0;
      distance = 0;
      obstacles = [];
      clouds = [];
      spawnTimer = 0;
      nextSpawn = 90;
      cloudTimer = 0;
      flashTimer = 0;
    },

    onResize: function (helpers) {
      width = helpers.width;
      height = helpers.height;
      groundY = helpers.groundY;
      syncRunnerX();
      updatePlayDimensions();
      if (!gameOver) {
        runnerY = Math.min(runnerY, groundY - runnerH);
      }
    },

    getStartMessage: function () {
      return 'Runner! Press space to jump. Press escape to exit.';
    },

    update: function (helpers) {
      if (gameOver) return;

      distance += speed * 0.05;
      score = distance;
      speed = Math.min(MAX_SPEED, MIN_SPEED + distance * 0.0025);

      runnerVy += GRAVITY;
      runnerY += runnerVy;

      if (runnerY >= groundY - runnerH) {
        runnerY = groundY - runnerH;
        runnerVy = 0;
        isJumping = false;
      }

      legFrame++;

      spawnTimer++;
      if (spawnTimer >= nextSpawn) {
        spawnObstacle();
        spawnTimer = 0;
      }

      cloudTimer++;
      if (cloudTimer >= 120) {
        spawnCloud();
        cloudTimer = 0;
      }

      obstacles.forEach(function (obs) {
        obs.x -= speed;
      });
      obstacles = obstacles.filter(function (obs) {
        return obs.x + obs.w > -20;
      });

      clouds.forEach(function (cloud) {
        cloud.x -= speed * cloud.speed;
      });
      clouds = clouds.filter(function (cloud) {
        return cloud.x + cloud.w > -30;
      });

      for (let i = 0; i < obstacles.length; i++) {
        if (collides(obstacles[i])) {
          triggerEndGame(helpers);
          break;
        }
      }
    },

    draw: function (helpers) {
      ctx = helpers.ctx;
      width = helpers.width;
      height = helpers.height;
      groundY = helpers.groundY;

      ctx.clearRect(0, 0, width, height);

      if (flashTimer > 0) {
        ctx.fillStyle = 'rgba(255, 141, 40, 0.12)';
        ctx.fillRect(0, 0, width, height);
        flashTimer--;
      }

      drawGround();
      clouds.forEach(drawCloud);
      obstacles.forEach(drawObstacle);
      drawRunner(runnerX, runnerY, legFrame);
      drawScore();
    },

    drawGameOver: function () {
      drawGameOverText();
    },

    onKeyDown: function (e) {
      if (e.code === 'Space' || e.key === ' ') {
        if (gameOver) {
          return false;
        }
        jump();
        return true;
      }
      return false;
    },

    onPointerDown: function () {
      if (gameOver) return;
      jump();
    }
  });
})();
