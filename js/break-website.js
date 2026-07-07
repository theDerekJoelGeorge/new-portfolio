(function () {
  const breakBtn = document.getElementById('breakWebsiteBtn');
  const overlay = document.getElementById('breakOverlay');
  const screen1 = document.getElementById('breakScreen1');
  const screen2 = document.getElementById('breakScreen2');
  const screen3 = document.getElementById('breakScreen3');
  const yesBtn = document.getElementById('breakYesBtn');
  const noBtn = document.getElementById('breakNoBtn');
  const hardBtn = document.getElementById('breakHardBtn');
  const easyBtn = document.getElementById('breakEasyBtn');
  const userChoiceSpan = document.getElementById('userChoice');
  const pongCanvas = document.getElementById('pongCanvas');
  const pongInstructions = document.getElementById('pongInstructions');
  const pongStartBtn = document.getElementById('pongStartBtn');
  const pongGameEnd = document.getElementById('pongGameEnd');
  const gameEndTitle = document.getElementById('gameEndTitle');
  const gameEndSubtitle = document.getElementById('gameEndSubtitle');
  const gameEndBtn = document.getElementById('gameEndBtn');

  if (!breakBtn || !overlay) return;

  let isBroken = false;
  let fallingElements = [];
  let pongGame = null;

  const getOpenPanelElements = function () {
    const html = document.documentElement;
    const panels = [];
    const openMap = [
      ['is-about-open', 'aboutPanel'],
      ['is-photo-logs-open', 'photoLogsPanel'],
      ['is-video-logs-open', 'videoLogsPanel'],
      ['is-writings-open', 'writingsPanel'],
      ['is-resume-open', 'resumePanel'],
    ];

    openMap.forEach(function (entry) {
      if (html.classList.contains(entry[0])) {
        const el = document.getElementById(entry[1]);
        if (el) panels.push(el);
      }
    });

    return panels;
  };

  const preparePanelWindowsForFall = function () {
    getOpenPanelElements().forEach(function (panel) {
      panel.style.transition = 'none';
      panel.style.transform = '';
    });

    document.querySelectorAll('.about-window, .library-window, .resume-window').forEach(function (win) {
      win.style.transition = 'none';
      win.style.transform = 'none';
      win.style.opacity = '';
      win.style.willChange = 'auto';
    });
  };

  const hideGameOverlays = function () {
    document.querySelectorAll(
      '.bowman-overlay, .bowman-stuck-layer, .bowman-target, .bowman-confetti-layer, .click-ripple-layer, .click-ripple'
    ).forEach(function (el) {
      el.style.display = 'none';
      el.style.visibility = 'hidden';
      el.style.pointerEvents = 'none';
    });
  };

  const restoreGameOverlays = function () {
    document.querySelectorAll('.bowman-overlay, .bowman-stuck-layer, .bowman-target, .bowman-confetti-layer').forEach(function (el) {
      el.style.display = '';
      el.style.visibility = '';
      el.style.pointerEvents = '';
    });
    document.querySelectorAll('.click-ripple-layer').forEach(function (el) {
      el.style.display = '';
      el.style.visibility = '';
      el.style.pointerEvents = '';
    });
  };

  const getTargetElements = function () {
    const seen = new Set();
    const add = function (el) {
      if (el) seen.add(el);
    };

    document.querySelectorAll('.site-header, .site-footer, .mobile-nav').forEach(add);

    const openPanels = getOpenPanelElements();
    const isMobile = window.matchMedia('(max-width: 960px)').matches;

    if (isMobile) {
      document.querySelectorAll('.profile').forEach(add);
      openPanels.forEach(add);
      return [...seen];
    }

    document.querySelectorAll('.profile, .portfolio').forEach(add);
    openPanels.forEach(add);

    return [...seen];
  };

  const showScreen = function (screenNum) {
    screen1.classList.remove('active');
    screen2.classList.remove('active');
    screen3.classList.remove('active');
    if (screenNum === 1) screen1.classList.add('active');
    if (screenNum === 2) screen2.classList.add('active');
    if (screenNum === 3) {
      screen3.classList.add('active');
      if (pongInstructions) pongInstructions.style.display = '';
      if (pongCanvas) pongCanvas.classList.remove('active');
      if (pongGameEnd) {
        pongGameEnd.hidden = true;
        pongGameEnd.style.display = 'none';
      }
    }
  };

  const showGameEndScreen = function (didWin) {
    if (pongGameEnd) {
      pongGameEnd.hidden = false;
      pongGameEnd.style.display = 'flex';
    }

    if (didWin) {
      if (gameEndTitle) gameEndTitle.textContent = 'Congratulations!';
      if (gameEndSubtitle) gameEndSubtitle.textContent = 'You beat the AI';
      if (gameEndBtn) {
        gameEndBtn.textContent = 'Rebuild Website';
        gameEndBtn.classList.remove('pong-game-end__btn--retry');
      }
      createConfetti();
    } else {
      if (gameEndTitle) gameEndTitle.textContent = 'Game Over';
      if (gameEndSubtitle) gameEndSubtitle.textContent = 'The AI won this round';
      if (gameEndBtn) {
        gameEndBtn.textContent = 'Try Again';
        gameEndBtn.classList.add('pong-game-end__btn--retry');
      }
    }
  };

  const createConfetti = function () {
    const container = document.getElementById('confettiContainer');
    if (!container) return;
    container.innerHTML = '';

    const colors = ['#ffd700', '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#1dd1a1'];
    for (let i = 0; i < 30; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      const size = 6 + Math.random() * 6;
      confetti.style.width = size + 'px';
      confetti.style.height = size + 'px';
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      confetti.style.left = '50%';
      confetti.style.top = '80px';
      const angle = (Math.random() * 120 + 30) * (Math.PI / 180);
      const velocity = 60 + Math.random() * 80;
      confetti.style.setProperty('--x', Math.cos(angle) * velocity * (Math.random() > 0.5 ? 1 : -1) + 'px');
      confetti.style.setProperty('--y', -Math.sin(angle) * velocity + 'px');
      confetti.style.animation = 'confetti-burst ' + (1.5 + Math.random()) + 's ease-out ' + (Math.random() * 0.15) + 's forwards';
      container.appendChild(confetti);
    }
  };

  const breakWebsite = function () {
    if (isBroken) return;
    isBroken = true;
    preparePanelWindowsForFall();
    hideGameOverlays();
    document.body.classList.add('site-broken');
    document.documentElement.classList.add('site-broken');

    fallingElements = getTargetElements();
    fallingElements.forEach(function (el, index) {
      el.style.transition = 'none';
      el.style.setProperty('--fall-rotation', (Math.random() - 0.5) * 60 + 'deg');
      setTimeout(function () {
        el.style.transform = '';
        el.classList.add('gravity-fall');
      }, index * 80);
    });

    const fallDuration = fallingElements.length * 80 + 2000;
    setTimeout(function () {
      fallingElements.forEach(function (el) {
        el.style.visibility = 'hidden';
        el.style.pointerEvents = 'none';
      });
      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden', 'false');
      showScreen(1);
    }, fallDuration);
  };

  const goToScreen2 = function (choice) {
    if (userChoiceSpan) userChoiceSpan.textContent = choice;
    showScreen(2);
  };

  const startPongGame = function () {
    if (!pongCanvas) return;

    const ctx = pongCanvas.getContext('2d');
    const W = pongCanvas.width;
    const H = pongCanvas.height;
    let playerScore = 0;
    let aiScore = 0;
    const winScore = 3;
    let countdownValue = 3;
    let ballPaused = false;
    let ballHasBeenHit = false;
    let flashColor = null;
    let flashOpacity = 0;
    const paddleW = 60;
    const paddleH = 10;
    let playerX = W / 2 - paddleW / 2;
    let aiX = W / 2 - paddleW / 2;
    const paddleSpeed = 8;
    let ballX = W / 2;
    let ballY = H / 2;
    const ballRadius = 8;
    let ballSpeedX = 0;
    let ballSpeedY = 0;
    let usingKeyboard = false;
    let animationId;
    let lastAnnouncedScore = { player: 0, ai: 0 };

    const handleMouseMove = function (e) {
      usingKeyboard = false;
      const rect = pongCanvas.getBoundingClientRect();
      playerX = e.clientX - rect.left - paddleW / 2;
      playerX = Math.max(0, Math.min(W - paddleW, playerX));
    };

    const handleTouchMove = function (e) {
      usingKeyboard = false;
      const rect = pongCanvas.getBoundingClientRect();
      playerX = e.touches[0].clientX - rect.left - paddleW / 2;
      playerX = Math.max(0, Math.min(W - paddleW, playerX));
    };

    const handleTouchStart = function (e) {
      usingKeyboard = false;
      const rect = pongCanvas.getBoundingClientRect();
      playerX = e.touches[0].clientX - rect.left - paddleW / 2;
      playerX = Math.max(0, Math.min(W - paddleW, playerX));
    };

    document.addEventListener('mousemove', handleMouseMove);
    pongCanvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    pongCanvas.addEventListener('touchstart', handleTouchStart, { passive: true });

    const keysPressed = { left: false, right: false };

    const handleKeyDown = function (e) {
      if (e.key === 'ArrowLeft') {
        keysPressed.left = true;
        usingKeyboard = true;
        e.preventDefault();
      }
      if (e.key === 'ArrowRight') {
        keysPressed.right = true;
        usingKeyboard = true;
        e.preventDefault();
      }
    };

    const handleKeyUp = function (e) {
      if (e.key === 'ArrowLeft') keysPressed.left = false;
      if (e.key === 'ArrowRight') keysPressed.right = false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    const flashBoard = function (color) {
      flashColor = color;
      flashOpacity = 0.6;
    };

    const resetBall = function (withCountdown) {
      ballX = W / 2;
      ballY = H / 2;
      ballSpeedX = 0;
      ballSpeedY = 0;
      ballHasBeenHit = false;
      if (withCountdown) {
        ballPaused = true;
        countdownValue = 3;
        const countdownInterval = setInterval(function () {
          countdownValue--;
          if (countdownValue <= 0) {
            clearInterval(countdownInterval);
            ballPaused = false;
            ballSpeedX = 2 * (Math.random() > 0.5 ? 1 : -1);
            ballSpeedY = 2 * (playerScore > aiScore ? 1 : -1);
          }
        }, 700);
      }
    };

    const updateAriaStatus = function () {
      if (playerScore !== lastAnnouncedScore.player || aiScore !== lastAnnouncedScore.ai) {
        pongCanvas.setAttribute(
          'aria-label',
          'Pong game. Your score: ' + playerScore + '. AI score: ' + aiScore + '. First to ' + winScore + ' wins.'
        );
        lastAnnouncedScore = { player: playerScore, ai: aiScore };
      }
    };

    const update = function () {
      if (usingKeyboard) {
        if (keysPressed.left) playerX -= paddleSpeed;
        if (keysPressed.right) playerX += paddleSpeed;
        playerX = Math.max(0, Math.min(W - paddleW, playerX));
      }
      if (ballPaused) return;

      const aiCenter = aiX + paddleW / 2;
      if (ballSpeedY < 0 && Math.random() > 0.4) {
        if (aiCenter < ballX - 30) aiX += paddleSpeed * 0.35;
        else if (aiCenter > ballX + 30) aiX -= paddleSpeed * 0.35;
      }
      aiX = Math.max(0, Math.min(W - paddleW, aiX));

      ballX += ballSpeedX;
      ballY += ballSpeedY;

      if (ballX - ballRadius < 0 || ballX + ballRadius > W) {
        ballSpeedX = -ballSpeedX;
        ballX = Math.max(ballRadius, Math.min(W - ballRadius, ballX));
      }

      if (ballY + ballRadius > H - paddleH - 10 && ballX > playerX && ballX < playerX + paddleW && ballSpeedY > 0) {
        if (!ballHasBeenHit) {
          ballHasBeenHit = true;
          ballSpeedY = -3;
        } else {
          ballSpeedY = -ballSpeedY;
        }
        ballSpeedX = ((ballX - playerX) / paddleW - 0.5) * 6;
      }

      if (ballY - ballRadius < paddleH + 10 && ballX > aiX && ballX < aiX + paddleW && ballSpeedY < 0) {
        if (!ballHasBeenHit) {
          ballHasBeenHit = true;
          ballSpeedY = 3;
        } else {
          ballSpeedY = -ballSpeedY;
        }
        ballSpeedX = ((ballX - aiX) / paddleW - 0.5) * 6;
      }

      if (ballY > H + ballRadius) {
        aiScore++;
        flashBoard('#e74c3c');
        ballPaused = true;
        if (aiScore >= winScore) {
          setTimeout(function () {
            stopPongGame();
            resetButtons();
            showGameEndScreen(false);
          }, 1200);
          return;
        }
        setTimeout(function () { resetBall(true); }, 800);
      } else if (ballY < -ballRadius) {
        playerScore++;
        flashBoard('#27ae60');
        ballPaused = true;
        if (playerScore >= winScore) {
          setTimeout(function () {
            stopPongGame();
            resetButtons();
            showGameEndScreen(true);
          }, 1200);
          return;
        }
        setTimeout(function () { resetBall(true); }, 800);
      }
    };

    const draw = function () {
      ctx.fillStyle = '#d9d9d9';
      ctx.fillRect(0, 0, W, H);

      if (flashOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = flashOpacity;
        ctx.fillStyle = flashColor;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
        flashOpacity -= 0.004;
        if (flashOpacity < 0) flashOpacity = 0;
      }

      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#888';
      ctx.beginPath();
      ctx.moveTo(0, H / 2);
      ctx.lineTo(W, H / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(aiX, 10, paddleW, paddleH);
      ctx.fillStyle = '#2d5a1e';
      ctx.fillRect(playerX, H - paddleH - 10, paddleW, paddleH);
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1a1a';
      ctx.fill();

      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = '#444';
      ctx.textAlign = 'right';
      ctx.fillText(aiScore, W - 12, 30);
      ctx.fillText(playerScore, W - 12, H - 12);

      if (ballPaused && countdownValue > 0) {
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, 40, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();
        ctx.font = 'bold 48px monospace';
        ctx.fillStyle = '#1a1a1a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(countdownValue, W / 2, H / 2);
        ctx.textBaseline = 'alphabetic';
      }

      updateAriaStatus();
    };

    const gameLoop = function () {
      update();
      draw();
      animationId = requestAnimationFrame(gameLoop);
    };

    const stopPongGame = function () {
      if (animationId) cancelAnimationFrame(animationId);
      document.removeEventListener('mousemove', handleMouseMove);
      pongCanvas.removeEventListener('touchmove', handleTouchMove);
      pongCanvas.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };

    pongGame = { stop: stopPongGame };
    resetBall(true);
    gameLoop();
  };

  const fixWebsite = function () {
    if (pongGame) {
      pongGame.stop();
      pongGame = null;
    }

    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    screen1.classList.remove('active');
    screen2.classList.remove('active');
    screen3.classList.remove('active');
    document.body.classList.remove('site-broken');
    document.documentElement.classList.remove('site-broken');
    restoreGameOverlays();
    preparePanelWindowsForFall();

    fallingElements.forEach(function (el, index) {
      el.classList.remove('gravity-fall');
      el.style.transform = '';
      el.style.transition = '';
      el.style.visibility = '';
      el.style.pointerEvents = '';
      setTimeout(function () {
        el.classList.add('gravity-reset');
        setTimeout(function () { el.classList.remove('gravity-reset'); }, 600);
      }, index * 30);
    });

    document.querySelectorAll('.about-window, .library-window, .resume-window').forEach(function (win) {
      win.style.transition = '';
      win.style.transform = '';
      win.style.opacity = '';
    });

    setTimeout(function () { isBroken = false; }, fallingElements.length * 30 + 600);
  };

  let easyIsLeft = true;
  let swapCount = 0;
  const screen2Subtitle = screen2 ? screen2.querySelector('.break-screen__subtitle') : null;
  const breakHint = document.getElementById('breakHint');
  const breakTaunt = document.getElementById('breakTaunt');
  const easyBtnTooltip = easyBtn && easyBtn.parentElement ? easyBtn.parentElement.querySelector('.break-btn-tooltip') : null;
  const hardBtnTooltip = hardBtn && hardBtn.parentElement ? hardBtn.parentElement.querySelector('.break-btn-tooltip') : null;

  const swapButtons = function () {
    if (!easyBtn || !hardBtn) return;
    swapCount++;

    if (easyIsLeft) {
      easyBtn.textContent = 'the hard way';
      easyBtn.style.backgroundColor = '#437036';
      if (easyBtnTooltip) easyBtnTooltip.textContent = 'are you sure?';
      hardBtn.textContent = 'the easy way';
      hardBtn.style.backgroundColor = '';
      if (hardBtnTooltip) hardBtnTooltip.textContent = "well, you're boring";
    } else {
      hardBtn.textContent = 'the hard way';
      hardBtn.style.backgroundColor = '#437036';
      if (hardBtnTooltip) hardBtnTooltip.textContent = 'are you sure?';
      easyBtn.textContent = 'the easy way';
      easyBtn.style.backgroundColor = '';
      if (easyBtnTooltip) easyBtnTooltip.textContent = "well, you're boring";
    }

    easyIsLeft = !easyIsLeft;
    if (screen2Subtitle) screen2Subtitle.textContent = 'are you happy with your choice ?';
    if (breakHint) breakHint.hidden = false;
    if (swapCount >= 3 && breakTaunt) breakTaunt.hidden = false;
    if (swapCount >= 6 && breakTaunt) breakTaunt.textContent = "go on then, lets see how long you spend trying to select the easy way";
    if (swapCount >= 12 && breakTaunt) breakTaunt.textContent = "okay, you're very persistent. click on it once more to get the easy way";
    if (swapCount >= 13 && breakTaunt) {
      breakTaunt.textContent = 'well sike, there is no easy way out';
      easyBtn.textContent = 'the hard way';
      hardBtn.textContent = 'the hard way';
    }
  };

  const resetButtons = function () {
    if (easyBtn) {
      easyBtn.textContent = 'the easy way';
      easyBtn.style.backgroundColor = '';
    }
    if (easyBtnTooltip) easyBtnTooltip.textContent = "well, you're boring";
    if (hardBtn) {
      hardBtn.textContent = 'the hard way';
      hardBtn.style.backgroundColor = '';
    }
    if (hardBtnTooltip) hardBtnTooltip.textContent = 'are you sure?';
    if (screen2Subtitle) screen2Subtitle.textContent = "you've got 2 choices now to fix the website";
    if (breakHint) breakHint.hidden = true;
    if (breakTaunt) {
      breakTaunt.hidden = true;
      breakTaunt.textContent = 'come on now, we all know that there is no easy way out here';
    }
    easyIsLeft = true;
    swapCount = 0;
  };

  breakBtn.addEventListener('click', breakWebsite);
  if (yesBtn) yesBtn.addEventListener('click', function () { goToScreen2('yes'); });
  if (noBtn) noBtn.addEventListener('click', function () { goToScreen2('no'); });

  if (easyBtn) {
    easyBtn.addEventListener('click', function () {
      if (swapCount >= 13) { showScreen(3); return; }
      if (easyIsLeft) swapButtons();
      else showScreen(3);
    });
  }

  if (hardBtn) {
    hardBtn.addEventListener('click', function () {
      if (swapCount >= 13) { showScreen(3); return; }
      if (!easyIsLeft) swapButtons();
      else showScreen(3);
    });
  }

  if (pongStartBtn) {
    pongStartBtn.addEventListener('click', function () {
      if (pongInstructions) pongInstructions.style.display = 'none';
      if (pongCanvas) pongCanvas.classList.add('active');
      startPongGame();
    });
  }

  if (gameEndBtn) {
    gameEndBtn.addEventListener('click', function () {
      if (gameEndBtn.classList.contains('pong-game-end__btn--retry')) {
        if (pongGameEnd) {
          pongGameEnd.hidden = true;
          pongGameEnd.style.display = 'none';
        }
        if (pongInstructions) pongInstructions.style.display = '';
        if (pongCanvas) pongCanvas.classList.remove('active');
      } else {
        if (pongGameEnd) {
          pongGameEnd.hidden = true;
          pongGameEnd.style.display = 'none';
        }
        fixWebsite();
      }
    });
  }
})();
