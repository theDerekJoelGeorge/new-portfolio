(function () {
  const gameRoot = document.getElementById('rapOrCrapGame');
  const gamePark = document.getElementById('rapOrCrapGamePark');
  const viewportEl = document.getElementById('aboutChatViewport');
  if (!gameRoot) return;

  let gameWrap = null;

  const screens = {
    splash: gameRoot.querySelector('[data-screen="splash"]'),
    rules: gameRoot.querySelector('[data-screen="rules"]'),
    round: gameRoot.querySelector('[data-screen="round"]'),
    reveal: gameRoot.querySelector('[data-screen="reveal"]'),
    finished: gameRoot.querySelector('[data-screen="finished"]')
  };

  const roundEl = document.getElementById('rapOrCrapRound');
  const revealRoundEl = document.getElementById('rapOrCrapRevealRound');
  const lyricEl = document.getElementById('rapOrCrapLyric');
  const revealAnswerEl = document.getElementById('rapOrCrapRevealAnswer');
  const revealMetaEl = document.getElementById('rapOrCrapRevealMeta');
  const revealSongEl = document.getElementById('rapOrCrapRevealSong');
  const spotifyEl = document.getElementById('rapOrCrapSpotify');
  const revealMainEl = document.getElementById('rapOrCrapRevealMain');
  const finalScoreEl = document.getElementById('rapOrCrapFinalScore');
  const totalRoundsEl = document.getElementById('rapOrCrapTotalRounds');
  const finishedNoteEl = document.getElementById('rapOrCrapFinishedNote');
  const replayBtn = document.getElementById('rapOrCrapReplayBtn');
  const closeBtn = document.getElementById('rapOrCrapCloseBtn');
  const minBtn = document.getElementById('rapOrCrapMinBtn');

  const ROUNDS = [
    {
      lyric:
        'Regulate, industry is shady, it needs to be taken over.\nLabel owners hate me, radio won\'t play me.',
      answer: 'rap',
      song: 'Regulate by Warren G & Nate Dogg',
      spotify: 'https://open.spotify.com/embed/track/7KLwXgJt2X7ThRX3bNYTZE'
    },
    {
      lyric:
        'My figma file loads faster when the recruiter is nervous.\nEvery auto-layout hug feels like a tiny miracle.',
      answer: 'crap'
    },
    {
      lyric:
        'I got five on it, pour your forty out.\nFeelin\' kinda broad, I still smoke weed in the alley of the crick.',
      answer: 'rap',
      song: 'I Got 5 On It by Luniz',
      spotify: 'https://open.spotify.com/embed/track/7LcgH9J30BlGJc2tQwycO4'
    },
    {
      lyric:
        'User empathy hits different at 2am in a sticky note.\nI wrote "talk to users" and then talked to my ceiling fan.',
      answer: 'crap'
    },
    {
      lyric:
        'Started from the bottom, now we\'re here.\nStarted from the bottom, now my whole team here.',
      answer: 'rap',
      song: 'Started From the Bottom by Drake',
      spotify: 'https://open.spotify.com/embed/track/5DXTT1mEeD11STYcw6eBQS'
    },
    {
      lyric:
        'His palms are sweaty, knees weak, arms are heavy.\nThere\'s vomit on his sweater already, mom\'s spaghetti.',
      answer: 'rap',
      song: 'Lose Yourself by Eminem',
      spotify: 'https://open.spotify.com/embed/track/7MJQ9Nfxzh8LP37kot4gx1'
    },
    {
      lyric:
        'It was all a dream, I used to read Word Up! magazine.\nSalt-N-Pepa and Heavy D up in the limousine.',
      answer: 'rap',
      song: 'Juicy by The Notorious B.I.G.',
      spotify: 'https://open.spotify.com/embed/track/5ByAIlEEnxyY04sHAy7kG3'
    },
    {
      lyric:
        'My portfolio case study has a hero image and a redemption arc.\nThe problem statement rhymes, so I assume the users felt seen.',
      answer: 'crap'
    }
  ];

  let currentScreen = 'splash';
  let roundIndex = 0;
  let score = 0;
  let lastGuess = null;

  function padRound(value) {
    return String(value).padStart(2, '0');
  }

  function setScreen(name) {
    currentScreen = name;
    Object.keys(screens).forEach(function (key) {
      const screen = screens[key];
      if (!screen) return;
      const isActive = key === name;
      screen.classList.toggle('is-active', isActive);
      screen.hidden = !isActive;
    });
  }

  function resetGame() {
    roundIndex = 0;
    score = 0;
    lastGuess = null;
    setScreen('splash');
  }

  function mountGameInViewport() {
    if (!viewportEl) return;

    if (!gameWrap) {
      gameWrap = document.createElement('div');
      gameWrap.className = 'about-chat__game-wrap';
      gameWrap.setAttribute('aria-label', 'Rap or Crap game');
    }

    if (gameRoot.parentElement !== gameWrap) {
      gameWrap.appendChild(gameRoot);
    }

    if (gameWrap.parentElement !== viewportEl) {
      viewportEl.appendChild(gameWrap);
    }
  }

  function parkGame() {
    if (!gamePark) return;
    if (gameWrap && gameWrap.parentElement) {
      gameWrap.parentElement.removeChild(gameWrap);
    }
    if (gameRoot.parentElement !== gamePark) {
      gamePark.appendChild(gameRoot);
    }
    gamePark.hidden = true;
    gamePark.setAttribute('aria-hidden', 'true');
  }

  function openGame() {
    if (!gameRoot.hidden) return;

    resetGame();
    mountGameInViewport();
    gameRoot.hidden = false;
    gameRoot.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('is-rap-or-crap-open');

    if (typeof window.scrollAboutChatToBottom === 'function') {
      window.scrollAboutChatToBottom();
    }
  }

  function closeGame() {
    if (gameRoot.hidden) return;

    gameRoot.hidden = true;
    gameRoot.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('is-rap-or-crap-open');
    resetGame();
    parkGame();

    if (typeof window.showAboutChatQuestions === 'function') {
      window.showAboutChatQuestions();
    }

    if (typeof window.scrollAboutChatToBottom === 'function') {
      window.scrollAboutChatToBottom();
    }
  }

  function renderRound() {
    const round = ROUNDS[roundIndex];
    if (!round) return;

    if (roundEl) roundEl.textContent = padRound(roundIndex + 1);
    if (revealRoundEl) revealRoundEl.textContent = padRound(roundIndex + 1);
    if (lyricEl) lyricEl.textContent = round.lyric;
  }

  function createSpotifyEmbed(url, songTitle) {
    const iframe = document.createElement('iframe');
    const embedUrl = url + (url.indexOf('?') === -1 ? '?' : '&') + 'theme=0';
    iframe.src = embedUrl;
    iframe.title = 'Spotify — ' + songTitle;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', '');
    iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    iframe.loading = 'lazy';
    return iframe;
  }

  function renderReveal() {
    const round = ROUNDS[roundIndex];
    if (!round || !revealAnswerEl) return;

    const isRap = round.answer === 'rap';

    revealAnswerEl.textContent = isRap ? 'RAP' : 'CR*P';
    revealAnswerEl.classList.toggle('rapor-crap-screen__reveal-answer--rap', isRap);
    revealAnswerEl.classList.toggle('rapor-crap-screen__reveal-answer--crap', !isRap);

    if (revealMainEl) {
      revealMainEl.classList.toggle('rapor-crap-screen__reveal-main--crap', !isRap);
    }

    if (revealMetaEl && revealSongEl && spotifyEl) {
      if (isRap && round.song) {
        revealMetaEl.hidden = false;
        revealSongEl.textContent = 'Song: ' + round.song;

        if (round.spotify) {
          spotifyEl.innerHTML = '';
          spotifyEl.appendChild(createSpotifyEmbed(round.spotify, round.song));
        } else {
          spotifyEl.innerHTML = '<div class="rapor-crap-screen__spotify-placeholder">Spotify player</div>';
        }
      } else {
        revealMetaEl.hidden = true;
        revealSongEl.textContent = '';
        spotifyEl.innerHTML = '';
      }
    }
  }

  function renderFinished() {
    if (finalScoreEl) finalScoreEl.textContent = String(score);
    if (totalRoundsEl) totalRoundsEl.textContent = String(ROUNDS.length);

    if (finishedNoteEl) {
      if (score === ROUNDS.length) {
        finishedNoteEl.textContent = 'certified bar spotter. my rap career remains unvalidated.';
      } else if (score === 0) {
        finishedNoteEl.textContent = 'you believed in every note. respect the confidence.';
      } else {
        finishedNoteEl.textContent = 'not bad — the real bars and the crap notes both need love.';
      }
    }
  }

  function startRound() {
    if (roundIndex >= ROUNDS.length) {
      renderFinished();
      setScreen('finished');
      return;
    }

    renderRound();
    setScreen('round');
  }

  function submitGuess(guess) {
    const round = ROUNDS[roundIndex];
    if (!round) return;

    lastGuess = guess;
    if (guess === round.answer) score += 1;
    renderReveal();
    setScreen('reveal');
  }

  function continueFromReveal() {
    roundIndex += 1;
    if (roundIndex >= ROUNDS.length) {
      renderFinished();
      setScreen('finished');
      return;
    }

    startRound();
  }

  if (screens.splash) {
    screens.splash.addEventListener('click', function () {
      setScreen('rules');
    });
  }

  if (screens.rules) {
    screens.rules.addEventListener('click', function () {
      startRound();
    });
  }

  if (replayBtn) {
    replayBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      resetGame();
      setScreen('rules');
    });
  }

  if (screens.reveal) {
    screens.reveal.addEventListener('click', function () {
      continueFromReveal();
    });
  }

  gameRoot.querySelectorAll('[data-guess]').forEach(function (button) {
    button.addEventListener('click', function (e) {
      e.stopPropagation();
      submitGuess(button.getAttribute('data-guess'));
    });
  });

  [closeBtn, minBtn].forEach(function (button) {
    if (!button) return;
    button.addEventListener('click', function (e) {
      e.stopPropagation();
      closeGame();
    });
  });

  window.openRapOrCrapGame = openGame;
  window.closeRapOrCrapGame = closeGame;
})();
