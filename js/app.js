/* =============================================
   POMODORO TIMER - App Logic
   ============================================= */

'use strict';

// =============================================
// CONSTANTS
// =============================================
const MODES = {
  pomodoro: {
    label: 'Enfócate',
    theme: 'theme-pomodoro',
    defaultTime: 25 * 60,
    tabId: 'tab-pomodoro',
  },
  short: {
    label: '¡Descansa!',
    theme: 'theme-short',
    defaultTime: 5 * 60,
    tabId: 'tab-short',
  },
  long: {
    label: 'Descanso largo',
    theme: 'theme-long',
    defaultTime: 15 * 60,
    tabId: 'tab-long',
  },
};

const RING_CIRCUMFERENCE = 2 * Math.PI * 96; // r=96 → ~603.19
const SESSION_GOAL = 4;

// =============================================
// STATE
// =============================================
let state = {
  mode: 'pomodoro',
  totalTime: MODES.pomodoro.defaultTime,
  timeLeft: MODES.pomodoro.defaultTime,
  isRunning: false,
  intervalId: null,
  pomodoroCount: 0,
  totalFocusSeconds: 0,
  isDark: false,
  titleBlinkId: null,
};

// =============================================
// DOM REFERENCES
// =============================================
const dom = {
  body: document.body,
  timerDisplay: document.getElementById('timerDisplay'),
  timerLabel: document.getElementById('timerLabel'),
  ringProgress: document.getElementById('ringProgress'),
  timerRingContainer: document.querySelector('.timer-ring-container'),
  startBtn: document.getElementById('startBtn'),
  resetBtn: document.getElementById('resetBtn'),
  skipBtn: document.getElementById('skipBtn'),
  themeToggle: document.getElementById('themeToggle'),
  tabs: document.querySelectorAll('.tab'),
  pomodoroCount: document.getElementById('pomodoroCount'),
  focusTime: document.getElementById('focusTime'),
  sessionGoal: document.getElementById('sessionGoal'),
  pomodoroDots: document.getElementById('pomodoroDots'),
  dots: document.querySelectorAll('.dot'),
  snackbar: document.getElementById('snackbar'),
  iconPlay: document.querySelector('.icon-play'),
  iconPause: document.querySelector('.icon-pause'),
};

// =============================================
// AUDIO (Web Audio API)
// =============================================
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(frequency, duration, type = 'sine', volume = 0.4, delay = 0) {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);

    gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    oscillator.start(ctx.currentTime + delay);
    oscillator.stop(ctx.currentTime + delay + duration);
  } catch (e) {
    // Audio not supported or blocked
  }
}

function playStartSound() {
  playTone(440, 0.15, 'sine', 0.3);
  playTone(550, 0.15, 'sine', 0.3, 0.15);
}

function playPauseSound() {
  playTone(550, 0.15, 'sine', 0.3);
  playTone(440, 0.15, 'sine', 0.3, 0.15);
}

function playCompleteSound() {
  // Celebratory ascending arpeggio
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    playTone(freq, 0.3, 'sine', 0.35, i * 0.18);
  });
}

function playTickSound() {
  playTone(800, 0.05, 'square', 0.05);
}

// =============================================
// TIMER LOGIC
// =============================================
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateRing() {
  const progress = state.timeLeft / state.totalTime;
  const offset = RING_CIRCUMFERENCE * (1 - progress);
  dom.ringProgress.style.strokeDashoffset = offset;
}

function updateDisplay() {
  dom.timerDisplay.textContent = formatTime(state.timeLeft);
  updateRing();
  updatePageTitle();
}

function updatePageTitle() {
  if (state.isRunning) {
    document.title = `${formatTime(state.timeLeft)} — ${MODES[state.mode].label} | Pomodoro`;
  } else {
    document.title = 'Pomodoro Timer';
  }
}

function startTimer() {
  if (state.isRunning) return;
  state.isRunning = true;
  dom.timerRingContainer.classList.add('running');
  setPlayPauseIcon(true);
  playStartSound();

  state.intervalId = setInterval(() => {
    state.timeLeft--;

    // Tick sound in last 5 seconds
    if (state.timeLeft <= 5 && state.timeLeft > 0) {
      playTickSound();
    }

    if (state.mode === 'pomodoro') {
      state.totalFocusSeconds++;
      updateFocusTime();
    }

    updateDisplay();

    if (state.timeLeft <= 0) {
      onTimerComplete();
    }
  }, 1000);
}

function pauseTimer() {
  if (!state.isRunning) return;
  state.isRunning = false;
  clearInterval(state.intervalId);
  state.intervalId = null;
  dom.timerRingContainer.classList.remove('running');
  setPlayPauseIcon(false);
  playPauseSound();
  updatePageTitle();
}

function resetTimer() {
  pauseTimer();
  state.timeLeft = state.totalTime;
  updateDisplay();
  animateShake(dom.timerRingContainer);
  showSnackbar('Timer reiniciado');
}

function onTimerComplete() {
  pauseTimer();
  playCompleteSound();

  if (state.mode === 'pomodoro') {
    state.pomodoroCount++;
    updatePomodoroCount();
    updateDots();
    animateBounce(dom.timerRingContainer);
    showSnackbar(`🍅 ¡Pomodoro #${state.pomodoroCount} completado! Toma un descanso.`);

    // Auto-switch to break
    if (state.pomodoroCount % SESSION_GOAL === 0) {
      setTimeout(() => switchMode('long'), 1500);
    } else {
      setTimeout(() => switchMode('short'), 1500);
    }
  } else {
    showSnackbar('☕ ¡Descanso terminado! Hora de enfocarse.');
    setTimeout(() => switchMode('pomodoro'), 1500);
  }

  // Blink title
  startTitleBlink();
}

function startTitleBlink() {
  let visible = true;
  clearInterval(state.titleBlinkId);
  state.titleBlinkId = setInterval(() => {
    document.title = visible ? '⏰ ¡Tiempo! | Pomodoro' : 'Pomodoro Timer';
    visible = !visible;
  }, 800);

  // Stop blinking after 8 seconds
  setTimeout(() => {
    clearInterval(state.titleBlinkId);
    document.title = 'Pomodoro Timer';
  }, 8000);
}

// =============================================
// MODE SWITCHING
// =============================================
function switchMode(mode) {
  if (!MODES[mode]) return;

  pauseTimer();
  state.mode = mode;
  state.totalTime = MODES[mode].defaultTime;
  state.timeLeft = state.totalTime;

  // Update body theme class
  dom.body.classList.remove('theme-pomodoro', 'theme-short', 'theme-long');
  dom.body.classList.add(MODES[mode].theme);

  // Update label
  dom.timerLabel.textContent = MODES[mode].label;

  // Update tabs
  dom.tabs.forEach(tab => {
    const isActive = tab.dataset.mode === mode;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive);
  });

  updateDisplay();
}

// =============================================
// STATS & UI UPDATES
// =============================================
function updatePomodoroCount() {
  dom.pomodoroCount.textContent = state.pomodoroCount;
  animateBounce(dom.pomodoroCount);
}

function updateFocusTime() {
  const minutes = Math.floor(state.totalFocusSeconds / 60);
  dom.focusTime.textContent = `${minutes} min`;
}

function updateDots() {
  const activeDots = state.pomodoroCount % SESSION_GOAL;
  dom.dots.forEach((dot, i) => {
    const shouldBeCompleted = state.pomodoroCount > 0 && (
      activeDots === 0 ? true : i < activeDots
    );
    dot.classList.toggle('completed', shouldBeCompleted);
    dot.classList.remove('pulse');
  });

  // Pulse the next dot if not all completed
  if (activeDots > 0 && activeDots < SESSION_GOAL) {
    dom.dots[activeDots].classList.add('pulse');
  }

  // If all 4 completed, reset dots after animation
  if (state.pomodoroCount > 0 && state.pomodoroCount % SESSION_GOAL === 0) {
    setTimeout(() => {
      dom.dots.forEach(dot => {
        dot.classList.remove('completed', 'pulse');
      });
    }, 3000);
  }
}

function setPlayPauseIcon(isPlaying) {
  dom.iconPlay.style.display = isPlaying ? 'none' : 'block';
  dom.iconPause.style.display = isPlaying ? 'block' : 'none';
}

// =============================================
// ANIMATIONS
// =============================================
function animateShake(el) {
  el.classList.remove('shake');
  void el.offsetWidth; // reflow
  el.classList.add('shake');
  el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
}

function animateBounce(el) {
  el.classList.remove('bounce');
  void el.offsetWidth;
  el.classList.add('bounce');
  el.addEventListener('animationend', () => el.classList.remove('bounce'), { once: true });
}

// =============================================
// SNACKBAR
// =============================================
let snackbarTimeout = null;

function showSnackbar(message, duration = 3500) {
  clearTimeout(snackbarTimeout);
  dom.snackbar.textContent = message;
  dom.snackbar.classList.add('show');
  snackbarTimeout = setTimeout(() => {
    dom.snackbar.classList.remove('show');
  }, duration);
}

// =============================================
// DARK MODE
// =============================================
function toggleDarkMode() {
  state.isDark = !state.isDark;
  dom.body.classList.toggle('dark', state.isDark);
  localStorage.setItem('pomodoro-dark', state.isDark ? '1' : '0');

  // Update icon
  const moonPath = "M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z";
  const sunPath = "M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 0 0 0-1.41l-1.06-1.06zm1.06-12.37l-1.06 1.06a.996.996 0 0 0 0 1.41c.39.39 1.03.39 1.41 0l1.06-1.06a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0zM7.05 18.36l-1.06 1.06a.996.996 0 0 0 0 1.41c.39.39 1.03.39 1.41 0l1.06-1.06a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0z";

  const svgPath = dom.themeToggle.querySelector('path');
  svgPath.setAttribute('d', state.isDark ? sunPath : moonPath);

  showSnackbar(state.isDark ? '🌙 Modo oscuro activado' : '☀️ Modo claro activado');
}

// =============================================
// PERSISTENCE (localStorage)
// =============================================
function loadSavedState() {
  // Dark mode preference
  const savedDark = localStorage.getItem('pomodoro-dark');
  if (savedDark === '1') {
    state.isDark = true;
    dom.body.classList.add('dark');
    const svgPath = dom.themeToggle.querySelector('path');
    const sunPath = "M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 0 0 0-1.41l-1.06-1.06zm1.06-12.37l-1.06 1.06a.996.996 0 0 0 0 1.41c.39.39 1.03.39 1.41 0l1.06-1.06a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0zM7.05 18.36l-1.06 1.06a.996.996 0 0 0 0 1.41c.39.39 1.03.39 1.41 0l1.06-1.06a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0z";
    svgPath.setAttribute('d', sunPath);
  }

  // Pomodoro count (session)
  const savedCount = sessionStorage.getItem('pomodoro-count');
  const savedFocus = sessionStorage.getItem('pomodoro-focus');
  if (savedCount) {
    state.pomodoroCount = parseInt(savedCount, 10) || 0;
    dom.pomodoroCount.textContent = state.pomodoroCount;
    updateDots();
  }
  if (savedFocus) {
    state.totalFocusSeconds = parseInt(savedFocus, 10) || 0;
    updateFocusTime();
  }
}

function saveSessionState() {
  sessionStorage.setItem('pomodoro-count', state.pomodoroCount);
  sessionStorage.setItem('pomodoro-focus', state.totalFocusSeconds);
}

// =============================================
// EVENT LISTENERS
// =============================================
function initEventListeners() {
  // Start / Pause
  dom.startBtn.addEventListener('click', () => {
    if (state.isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  // Reset
  dom.resetBtn.addEventListener('click', () => {
    resetTimer();
  });

  // Skip
  dom.skipBtn.addEventListener('click', () => {
    const modes = ['pomodoro', 'short', 'long'];
    const currentIndex = modes.indexOf(state.mode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    switchMode(nextMode);
    showSnackbar(`Cambiado a: ${MODES[nextMode].label}`);
  });

  // Tabs
  dom.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.mode;
      if (mode !== state.mode) {
        switchMode(mode);
        showSnackbar(`Modo: ${MODES[mode].label}`);
      }
    });
  });

  // Dark mode toggle
  dom.themeToggle.addEventListener('click', toggleDarkMode);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Space = play/pause
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      if (state.isRunning) {
        pauseTimer();
      } else {
        startTimer();
      }
    }
    // R = reset
    if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
      resetTimer();
    }
    // 1 = pomodoro, 2 = short, 3 = long
    if (e.code === 'Digit1') switchMode('pomodoro');
    if (e.code === 'Digit2') switchMode('short');
    if (e.code === 'Digit3') switchMode('long');
  });

  // Save session state on visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      saveSessionState();
    }
  });

  // Save on unload
  window.addEventListener('beforeunload', saveSessionState);
}

// =============================================
// INIT
// =============================================
function init() {
  // Set initial ring circumference
  dom.ringProgress.style.strokeDasharray = RING_CIRCUMFERENCE;
  dom.ringProgress.style.strokeDashoffset = 0;

  // Set session goal display
  dom.sessionGoal.textContent = SESSION_GOAL;

  // Load saved preferences
  loadSavedState();

  // Set initial display
  updateDisplay();

  // Attach events
  initEventListeners();

  // Welcome snackbar
  setTimeout(() => {
    showSnackbar('👋 ¡Listo! Presiona ▶ para comenzar', 3000);
  }, 500);
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', init);
