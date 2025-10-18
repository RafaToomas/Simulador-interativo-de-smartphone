/* script.js - corrigido e completo
   - preserva todas as funcionalidades solicitadas
   - substitui os ícones <img> por "icon circles" usando Material Icons (colorful background)
   - galeria com modal (click-out para fechar)
   - spotify-like player (toca musica/musica.mp3)
   - back buttons, theme persist, rotating that lays phone down (landscape)
   - notes localStorage, calculator safe eval, snake game with wrap, browser fallback
*/

/* ------------- UTILIDADES & READY ------------- */
document.addEventListener('DOMContentLoaded', () => {
  const phone = document.getElementById('phone');
  // create an inner screen-shell wrapper if not present (our CSS expects .screen-shell)
  if (!phone.querySelector('.screen-shell')) {
    const shell = document.createElement('div');
    shell.className = 'screen-shell';
    // move existing children into shell
    while (phone.firstChild) shell.appendChild(phone.firstChild);
    phone.appendChild(shell);
  }
  const shell = phone.querySelector('.screen-shell');

  const homeScreen = document.getElementById('homeScreen');
  const appElements = document.querySelectorAll('.app');
  const appScreens = document.querySelectorAll('.app-screen');
  const backButtons = document.querySelectorAll('.back-btn');
  const themeSwitch = document.getElementById('themeSwitch');
  const rotateBtn = document.getElementById('rotateBtn');

  /* ---------- THEME PERSIST ---------- */
  const THEME_KEY = 'sim_theme_v1';
  const storedTheme = localStorage.getItem(THEME_KEY);
  if (storedTheme === 'dark') {
    document.body.classList.add('dark');
    if (themeSwitch) themeSwitch.checked = true;
  }
  if (themeSwitch) {
    themeSwitch.addEventListener('change', () => {
      document.body.classList.toggle('dark', themeSwitch.checked);
      localStorage.setItem(THEME_KEY, themeSwitch.checked ? 'dark' : 'light');
    });
  }

  /* ---------- ROTATE (lay phone down, landscape) ---------- */
  let isLandscape = false;
  rotateBtn.addEventListener('click', () => {
    isLandscape = !isLandscape;
    phone.classList.toggle('landscape', isLandscape);
  });

  /* ---------- ICONS: replace <img> placeholders with colorful icon-circles ---------- */
  // mapping: dataset app -> {iconName, bgColor}
  const ICON_MAP = {
    gallery: { icon: 'photo_camera', color: '#ff6b6b' },
    music:   { icon: 'music_note',    color: '#8b5cf6' },
    browser: { icon: 'public',        color: '#06b6d4' },
    notes:   { icon: 'note',          color: '#f59e0b' },
    calculator: { icon: 'calculate',  color: '#10b981' },
    snake:   { icon: 'sports_esports', color: '#ef4444' },
    profile: { icon: 'person',        color: '#3b82f6' }
  };

  // Load Google Material Icons font (outlined) dynamically if not present
  if (!document.querySelector('link[data-material-icons]')) {
    const l = document.createElement('link');
    l.setAttribute('rel', 'stylesheet');
    l.setAttribute('href', 'https://fonts.googleapis.com/icon?family=Material+Icons');
    l.setAttribute('data-material-icons', '1');
    document.head.appendChild(l);
  }

  appElements.forEach(a => {
    const key = a.dataset.app;
    const map = ICON_MAP[key] || {icon:'apps', color:'#6b7280'};
    // remove existing img (if any)
    const existingImg = a.querySelector('img');
    if (existingImg) existingImg.remove();
    // create circle
    const circle = document.createElement('div');
    circle.className = 'icon-circle';
    circle.style.background = map.color;
    // icon span (material icons)
    const span = document.createElement('span');
    span.className = 'material-icons';
    span.style.fontSize = '26px';
    span.innerText = map.icon;
    circle.appendChild(span);
    // insert at top
    a.insertBefore(circle, a.firstChild);
  });

  /* ---------- NAV: open/close apps ---------- */
  function openAppId(id) {
    homeScreen.style.display = 'none';
    appScreens.forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }
  function closeAllApps() {
    appScreens.forEach(s => s.classList.remove('active'));
    homeScreen.style.display = 'flex';
  }

  appElements.forEach(app => {
    app.addEventListener('click', () => {
      const target = app.dataset.app;
      switch (target) {
        case 'gallery': openAppId('galleryApp'); break;
        case 'music': openAppId('musicApp'); break;
        case 'browser': openAppId('browserApp'); break;
        case 'notes': openAppId('notesApp'); break;
        case 'calculator': openAppId('calculatorApp'); break;
        case 'snake': openAppId('snakeApp'); startSnake(); break;
        case 'profile': openAppId('profileApp'); break;
        default: break;
      }
    });
  });

  backButtons.forEach(b => {
    b.addEventListener('click', () => {
      // cleanup when leaving
      audioPauseSafe();
      removeImageModal();
      stopSnake();
      closeAllApps();
    });
  });

  /* ---------- GALLERY ---------- */
  // expected image paths - I will try to load from `/imagens/` (as you indicated)
  const galleryApp = document.getElementById('galleryApp');
  const galleryContainer = galleryApp ? galleryApp.querySelector('.gallery') : null;
  const gallerySources = [
    'imagens/img1.webp',
    'imagens/img2.avif'
  ];

  // populate gallery only if container exists
  if (galleryContainer) {
    galleryContainer.innerHTML = ''; // clear
    gallerySources.forEach(src => {
      const img = document.createElement('img');
      img.className = 'gallery-img';
      img.src = src;
      img.alt = 'foto';
      // ensure same display size via CSS already
      // click -> modal
      img.addEventListener('click', (e) => {
        createImageModal(src);
      });
      // on error: show placeholder
      img.addEventListener('error', () => {
        img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(
          `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='100%' height='100%' fill='#f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' font-family='Arial' font-size='24'>imagem não encontrada</text></svg>`
        );
      });
      galleryContainer.appendChild(img);
    });
  }

  function createImageModal(src) {
    removeImageModal();
    const modal = document.createElement('div');
    modal.className = 'img-modal';
    modal.tabIndex = 0;
    const wrap = document.createElement('div');
    wrap.className = 'img-wrap';
    const img = document.createElement('img');
    img.src = src;
    wrap.appendChild(img);
    modal.appendChild(wrap);
    // click outside to close
    modal.addEventListener('click', (ev) => {
      if (ev.target === modal) removeImageModal();
    });
    document.body.appendChild(modal);
    // esc closes
    modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') removeImageModal(); });
    // autofocus
    modal.focus?.();
  }
  function removeImageModal() {
    const existing = document.querySelector('.img-modal');
    if (existing) existing.remove();
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') removeImageModal();
  });

  /* ---------- MUSIC (Spotify-like) ---------- */
  const musicAppEl = document.getElementById('musicApp');
  // prepare UI: album-art, info, controls, progress
  if (musicAppEl) {
    const container = musicAppEl.querySelector('.music-player');
    container.innerHTML = ''; // reset and build modern UI

    const album = document.createElement('div'); album.className = 'album-art';
    const albumImg = document.createElement('img');
    // try to load a local album cover if exists; fallback to generated gradient
    albumImg.src = 'imagens/cover.jpg'; // optional path (user can upload)
    albumImg.addEventListener('error', () => {
      // generate gradient placeholder as data URL
      albumImg.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><defs><linearGradient id='g' x1='0' x2='1'><stop stop-color='#5b8cff' offset='0'/><stop stop-color='#6df0c4' offset='1'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/><text x='50%' y='50%' font-size='36' font-family='Roboto' fill='white' text-anchor='middle' dominant-baseline='middle'>R.E.M.</text></svg>`);
    });
    album.appendChild(albumImg);

    const info = document.createElement('div'); info.className = 'track-info';
    const title = document.createElement('h3'); title.innerText = 'R.E.M. - Losing My Religion';
    const artist = document.createElement('p'); artist.innerText = 'Single';
    info.appendChild(title); info.appendChild(artist);

    const controlsWrap = document.createElement('div'); controlsWrap.className = 'player-controls';
    const prevBtn = document.createElement('button'); prevBtn.className = 'ctrl-btn'; prevBtn.innerText = '⟵';
    const playBtn = document.createElement('button'); playBtn.className = 'play-big'; playBtn.innerText = '▶';
    const nextBtn = document.createElement('button'); nextBtn.className = 'ctrl-btn'; nextBtn.innerText = '⟶';
    controlsWrap.append(prevBtn, playBtn, nextBtn);

    const progressWrap = document.createElement('div'); progressWrap.className = 'progress';
    const bar = document.createElement('div'); bar.className = 'bar';
    progressWrap.appendChild(bar);

    container.appendChild(album);
    const rightCol = document.createElement('div'); rightCol.style.display='flex'; rightCol.style.flexDirection='column'; rightCol.style.gap='10px'; rightCol.style.flex='1';
    rightCol.appendChild(info);
    rightCol.appendChild(controlsWrap);
    rightCol.appendChild(progressWrap);
    container.appendChild(rightCol);

    // audio element (preload)
    const audio = new Audio('musica/musica.mp3');
    audio.preload = 'auto';
    let isPlaying = false;
    let raf = null;

    // play/pause handler
    function updatePlayUI() {
      playBtn.innerText = isPlaying ? '⏸' : '▶';
    }
    playBtn.addEventListener('click', async () => {
      try {
        if (!isPlaying) {
          await audio.play();
          isPlaying = true;
          updatePlayUI();
          startProgressLoop();
        } else {
          audio.pause();
          isPlaying = false;
          updatePlayUI();
          cancelProgressLoop();
        }
      } catch (err) {
        // autoplay policy: still update UI
        console.warn('play error', err);
        isPlaying = !isPlaying;
        updatePlayUI();
      }
    });

    prevBtn.addEventListener('click', () => {
      // only one track: go to start
      audio.currentTime = 0;
      if (!isPlaying) { audio.play(); isPlaying = true; updatePlayUI(); startProgressLoop(); }
    });
    nextBtn.addEventListener('click', () => {
      // only one track: restart
      audio.currentTime = 0;
      if (!isPlaying) { audio.play(); isPlaying = true; updatePlayUI(); startProgressLoop(); }
    });

    audio.addEventListener('ended', () => {
      isPlaying = false;
      updatePlayUI();
      audio.currentTime = 0;
      bar.style.width = '0%';
      cancelProgressLoop();
    });

    audio.addEventListener('timeupdate', () => {
      if (!isNaN(audio.duration) && audio.duration > 0) {
        const pct = (audio.currentTime / audio.duration) * 100;
        bar.style.width = pct + '%';
      }
    });

    // progress loop with requestAnimationFrame for smoothness
    function startProgressLoop() {
      cancelProgressLoop();
      function tick() {
        if (!isNaN(audio.duration) && audio.duration > 0) {
          const pct = (audio.currentTime / audio.duration) * 100;
          bar.style.width = pct + '%';
        }
        raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);
    }
    function cancelProgressLoop() { if (raf) cancelAnimationFrame(raf); raf = null; }

    // clicking progress to seek
    progressWrap.addEventListener('click', (e) => {
      const rect = progressWrap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      if (!isNaN(audio.duration) && audio.duration > 0) {
        audio.currentTime = pct * audio.duration;
        bar.style.width = (pct * 100) + '%';
      }
    });

    // expose pause safe for outer scope to stop music when leaving app
    window._sim_audio = audio;
    window._sim_audio_pause = () => {
      try { audio.pause(); isPlaying = false; updatePlayUI(); cancelProgressLoop(); } catch(e){}
    };
  } // end if musicAppEl

  function audioPauseSafe() {
    if (window._sim_audio_pause) window._sim_audio_pause();
  }

  /* ---------- BROWSER (search, iframe fallback) ---------- */
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const browserFrame = document.getElementById('browserFrame');

  function setIframeFallback(query) {
    if (!browserFrame) return;
    const safeHtml = `
      <div style="padding:18px;font-family:system-ui,Roboto,Arial">
        <h3>Resultado de pesquisa</h3>
        <p>O navegador embutido não conseguiu carregar o site por proteção (X-Frame-Options).</p>
        <p><a href="https://duckduckgo.com/?q=${encodeURIComponent(query)}" target="_blank">Abrir pesquisa em nova aba</a></p>
      </div>
    `;
    try {
      browserFrame.srcdoc = safeHtml;
    } catch (e) {
      window.open('https://duckduckgo.com/?q=' + encodeURIComponent(query), '_blank');
    }
  }

  function doSearch(q) {
    if (!browserFrame) return;
    if (!q || q.trim() === '') {
      browserFrame.srcdoc = `<div style="padding:18px;font-family:system-ui,Roboto,Arial"><p>Digite algo para pesquisar.</p></div>`;
      return;
    }
    const url = 'https://duckduckgo.com/?q=' + encodeURIComponent(q);
    // attempt to load inside iframe; many sites will block and then fallback
    browserFrame.onload = function () {
      try {
        const doc = browserFrame.contentDocument || browserFrame.contentWindow.document;
        if (!doc || doc.location.href === 'about:blank') setIframeFallback(q);
      } catch (err) {
        setIframeFallback(q);
      }
    };
    browserFrame.src = url;
  }

  if (searchBtn) searchBtn.addEventListener('click', () => doSearch(searchInput.value));
  if (searchInput) searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(searchInput.value); });

  /* ---------- NOTES (localStorage) ---------- */
  const notesTextarea = document.getElementById('notes');
  const NOTES_KEY = 'sim_notes_v1';
  if (notesTextarea) {
    const saved = localStorage.getItem(NOTES_KEY);
    if (saved) notesTextarea.value = saved;
    let timer = null;
    notesTextarea.addEventListener('input', () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => localStorage.setItem(NOTES_KEY, notesTextarea.value), 500);
    });
  }

  /* ---------- CALCULATOR (safe eval) ---------- */
  const calcDisplay = document.getElementById('calcDisplay');
  const calcButtons = document.querySelectorAll('#calculatorApp .buttons button');
  let calcBuffer = '';
  if (calcDisplay) calcDisplay.value = '0';
  calcButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.innerText.trim();
      if (v === 'C') { calcBuffer = ''; if (calcDisplay) calcDisplay.value = '0'; return; }
      if (v === '=') {
        try {
          const safe = calcBuffer.replace(/[^0-9+\-*/().% ]/g, '');
          const finalExp = safe.replace(/%/g, '/100');
          const res = Function('"use strict";return (' + finalExp + ')')();
          calcBuffer = String(res);
        } catch (e) {
          calcBuffer = 'Erro';
        }
        if (calcDisplay) calcDisplay.value = calcBuffer;
        return;
      }
      calcBuffer += v;
      if (calcDisplay) calcDisplay.value = calcBuffer;
    });
  });

  /* ---------- SNAKE GAME (wrap-around) ---------- */
  const canvas = document.getElementById('snakeGame');
  let snakeInterval = null;
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const gridSize = 15;
    const cols = Math.floor(canvas.width / gridSize);
    const rows = Math.floor(canvas.height / gridSize);
    let snake = [];
    let dir = { x: 1, y: 0 };
    let food = null;
    let speed = 120;
    let isOver = false;

    function randCell() { return { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) }; }
    function startSnake() {
      stopSnake();
      snake = [{ x: Math.floor(cols/2), y: Math.floor(rows/2) }];
      dir = { x: 1, y: 0 };
      food = randCell();
      speed = 120; isOver = false;
      draw();
      snakeInterval = setInterval(step, speed);
      window.addEventListener('keydown', snakeKey);
    }
    function stopSnake() {
      if (snakeInterval) { clearInterval(snakeInterval); snakeInterval = null; }
      window.removeEventListener('keydown', snakeKey);
      removeGameOverUI();
    }
    function snakeKey(e) {
      if (e.key === 'ArrowUp' && dir.y !== 1) dir = {x:0,y:-1};
      if (e.key === 'ArrowDown' && dir.y !== -1) dir = {x:0,y:1};
      if (e.key === 'ArrowLeft' && dir.x !== 1) dir = {x:-1,y:0};
      if (e.key === 'ArrowRight' && dir.x !== -1) dir = {x:1,y:0};
    }
    function step() {
      if (isOver) return;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      // wrap
      if (head.x < 0) head.x = cols - 1;
      if (head.x >= cols) head.x = 0;
      if (head.y < 0) head.y = rows - 1;
      if (head.y >= rows) head.y = 0;
      // self collision
      if (snake.some(s => s.x === head.x && s.y === head.y)) {
        gameOver();
        return;
      }
      snake.unshift(head);
      if (food && head.x === food.x && head.y === food.y) {
        food = randCell();
        speed = Math.max(50, speed - 3);
        if (snakeInterval) { clearInterval(snakeInterval); snakeInterval = setInterval(step, speed); }
      } else {
        snake.pop();
      }
      draw();
    }
    function draw() {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      // background
      ctx.fillStyle = '#eaf4ff';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      // food
      if (food) { ctx.fillStyle = '#ef4444'; ctx.fillRect(food.x*gridSize, food.y*gridSize, gridSize, gridSize); }
      // snake
      for (let i=0;i<snake.length;i++){
        ctx.fillStyle = i===0 ? '#0b6cff' : '#2563eb';
        ctx.fillRect(snake[i].x*gridSize+1, snake[i].y*gridSize+1, gridSize-2, gridSize-2);
      }
    }
    function gameOver() {
      isOver = true;
      stopSnake();
      showGameOverUI();
    }
    function showGameOverUI() {
      removeGameOverUI();
      const wrapper = document.createElement('div'); wrapper.className='game-over';
      const title = document.createElement('div'); title.style.fontSize='22px'; title.style.fontWeight='700'; title.innerText='Game Over';
      const score = document.createElement('div'); score.innerText = `Pontuação: ${snake.length-1}`;
      const ok = document.createElement('button'); ok.innerText='OK';
      ok.style.padding='10px 18px'; ok.style.borderRadius='10px'; ok.style.border='none'; ok.style.background='#fff'; ok.style.fontWeight='700';
      ok.addEventListener('click', () => { startSnake(); });
      wrapper.append(title,score,ok);
      const app = document.getElementById('snakeApp');
      app.appendChild(wrapper);
    }
    function removeGameOverUI() { const ex = document.querySelector('#snakeApp .game-over'); if (ex) ex.remove(); }
    // expose start/stop so other parts can call
    window.startSnake = startSnake;
    window.stopSnake = stopSnake;
  } // end if canvas

  function stopSnake() { if (window.stopSnake) window.stopSnake(); }

  /* ---------- SAFETY: when leaving apps clean up ---------- */
  document.querySelectorAll('.back-btn').forEach(b => {
    b.addEventListener('click', () => {
      audioPauseSafe();
      removeImageModal();
      stopSnake();
      // hide game overlays
      const go = document.querySelector('.game-over');
      if (go) go.remove();
    });
  });

  /* ---------- small accessibility: Esc closes modals & pauses music ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      removeImageModal();
      audioPauseSafe();
    }
  });

  /* ---------- initial state ---------- */
  closeAllApps();
}); // DOMContentLoaded end
