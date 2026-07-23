/* ========================================================
   Oscar's Toy Box — game logic
   Four modes: Peekaboo, Balloon Pop, Little Doors, Magic Taps
   Sounds are synthesized with Web Audio (no asset files),
   and animal names are spoken with speechSynthesis.
   ======================================================== */

'use strict';

// ---------- shared data ----------
const ANIMALS = [
  { emoji: '🐶', name: 'Dog' },
  { emoji: '🐱', name: 'Cat' },
  { emoji: '🐮', name: 'Cow' },
  { emoji: '🐷', name: 'Pig' },
  { emoji: '🐸', name: 'Frog' },
  { emoji: '🦁', name: 'Lion' },
  { emoji: '🐵', name: 'Monkey' },
  { emoji: '🐰', name: 'Bunny' },
  { emoji: '🦆', name: 'Duck' },
  { emoji: '🐘', name: 'Elephant' },
  { emoji: '🦒', name: 'Giraffe' },
  { emoji: '🐢', name: 'Turtle' },
];

// big, clearly-distinct colors for the colour-naming game
const COLORS = [
  { name: 'Red',    hex: '#ff5a5a' },
  { name: 'Orange', hex: '#ffab5e' },
  { name: 'Yellow', hex: '#ffd83d' },
  { name: 'Green',  hex: '#63cf6b' },
  { name: 'Blue',   hex: '#5aa9ff' },
  { name: 'Purple', hex: '#b483ff' },
  { name: 'Pink',   hex: '#ff8fc6' },
  { name: 'Brown',  hex: '#b07a4f' },
];

const CONFETTI_COLORS = ['#ff8fb8', '#ffd45e', '#7be0c3', '#7fc4ff', '#c3a4ff', '#ffab6b'];
const MAGIC_EMOJIS = ['⭐', '🌟', '✨', '🌙', '💫', '🪐', '🌈', '❤️', '💛', '💚', '💙', '💜'];

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const rand = (min, max) => min + Math.random() * (max - min);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ---------- sound (Web Audio synth) ----------
let audioCtx = null;
function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone(freq, duration, type = 'sine', volume = 0.25, when = 0) {
  const ac = ctx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = ac.currentTime + when;
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration);
}

function popSound() {
  const ac = ctx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(400, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ac.currentTime + 0.08);
  gain.gain.setValueAtTime(0.3, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.12);
}

function cheerSound() {
  // quick ascending major arpeggio
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, 'triangle', 0.22, i * 0.09));
}

function sparkleSound() {
  tone(rand(700, 1400), 0.3, 'sine', 0.15);
  tone(rand(1400, 2200), 0.25, 'sine', 0.08, 0.05);
}

function creakSound() {
  const ac = ctx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(140, ac.currentTime);
  osc.frequency.linearRampToValueAtTime(220, ac.currentTime + 0.35);
  gain.gain.setValueAtTime(0.07, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.4);
}

function splashSound() {
  // a soft watery "plip" — quick downward blip plus a high sparkle
  const ac = ctx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(900, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, ac.currentTime + 0.14);
  gain.gain.setValueAtTime(0.22, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.18);
  tone(rand(1500, 2100), 0.12, 'sine', 0.06, 0.02);
}

function say(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85;
  u.pitch = 1.3;
  speechSynthesis.speak(u);
}

// ---------- confetti ----------
const fxLayer = document.getElementById('fx-layer');

function confettiBurst(x, y, count = 18, color = null) {
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti';
    piece.style.left = x + 'px';
    piece.style.top = y + 'px';
    piece.style.background = color || pick(CONFETTI_COLORS);
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
    piece.style.setProperty('--cx', rand(-160, 160) + 'px');
    piece.style.setProperty('--cy', rand(60, 340) + 'px');
    piece.style.animationDuration = rand(0.7, 1.4) + 's';
    fxLayer.appendChild(piece);
    piece.addEventListener('animationend', () => piece.remove());
  }
}

function emojiBurst(x, y, emoji, count = 6) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'fx-emoji';
    el.textContent = emoji;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.setProperty('--cx', rand(-140, 140) + 'px');
    el.style.setProperty('--cy', rand(-40, 220) + 'px');
    el.style.animationDuration = rand(0.8, 1.3) + 's';
    fxLayer.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

// ---------- screen switching ----------
const screens = document.querySelectorAll('.screen');
const homeBtn = document.getElementById('home-btn');
let activeMode = 'menu';
let balloonTimer = null;

function show(id) {
  activeMode = id;
  screens.forEach((s) => s.classList.toggle('active', s.id === id));
  homeBtn.hidden = id === 'menu';

  clearInterval(balloonTimer);
  balloonTimer = null;

  if (id === 'peekaboo') buildPeekaboo();
  if (id === 'balloons') startBalloons();
  if (id === 'doors') buildDoors();
  if (id === 'colors') buildColors();
  if (id === 'rain') startRain();
  if (id === 'moles') startMoles();
  if (id === 'draw') startDraw();
}

document.querySelectorAll('.mode-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    ctx(); // unlock audio on first user gesture
    tone(660, 0.15, 'triangle', 0.2);
    show(btn.dataset.mode);
  });
});

homeBtn.addEventListener('click', () => {
  tone(440, 0.15, 'triangle', 0.2);
  show('menu');
});

/* ======================================================
   PEEKABOO — grid of flip cards; flips back after a bit
   ====================================================== */
const peekabooGrid = document.getElementById('peekaboo-grid');

function buildPeekaboo() {
  peekabooGrid.innerHTML = '';
  shuffle(ANIMALS).slice(0, 6).forEach((animal) => {
    const card = document.createElement('button');
    card.className = 'flip-card';
    card.innerHTML = `
      <div class="flip-inner">
        <div class="flip-face flip-front"></div>
        <div class="flip-face flip-back"><span>${animal.emoji}</span></div>
      </div>`;
    let currentAnimal = animal;
    card.addEventListener('click', () => {
      if (card.classList.contains('revealed')) return;
      card.classList.add('revealed');
      cheerSound();
      say(currentAnimal.name);
      const r = card.getBoundingClientRect();
      confettiBurst(r.left + r.width / 2, r.top + r.height / 2, 14);

      // flip back to a NEW animal after a moment, so the game never ends
      setTimeout(() => {
        card.classList.remove('revealed');
        setTimeout(() => {
          currentAnimal = pick(ANIMALS);
          card.querySelector('.flip-back span').textContent = currentAnimal.emoji;
        }, 300);
      }, 4000);
    });
    peekabooGrid.appendChild(card);
  });
}

/* ======================================================
   BALLOON POP — balloons drift up, tap to pop
   ====================================================== */
const balloonField = document.getElementById('balloon-field');
const BALLOON_EMOJIS = ['🎈', '🎈', '🎈', '🐙', '🐠', '🦋', '🐝'];
const BALLOON_HUES = [0, 140, 200, 240, 280, 320];

function spawnBalloon() {
  if (activeMode !== 'balloons') return;
  // don't pile up balloons while the tab is hidden or the sky is already busy
  if (document.hidden || balloonField.childElementCount >= 10) return;
  const b = document.createElement('button');
  b.className = 'balloon';
  const emoji = pick(BALLOON_EMOJIS);
  b.innerHTML = `<span class="face">${emoji}</span>`;
  if (emoji === '🎈') {
    b.style.filter = `hue-rotate(${pick(BALLOON_HUES)}deg) drop-shadow(0 6px 4px rgba(74,59,99,0.2))`;
  }
  b.style.left = rand(2, 82) + 'vw';
  b.style.setProperty('--sway', rand(-14, 14) + 'deg');
  const flightSecs = rand(7, 13);
  b.style.animationDuration = flightSecs + 's';
  // fallback cleanup in case animationend never fires (e.g. throttled tab)
  setTimeout(() => b.remove(), (flightSecs + 4) * 1000);

  b.addEventListener('click', () => {
    if (b.classList.contains('popped')) return;
    const r = b.getBoundingClientRect();
    b.classList.add('popped');
    popSound();
    confettiBurst(r.left + r.width / 2, r.top + r.height / 2, 16);
    setTimeout(() => b.remove(), 100);
  });

  b.addEventListener('animationend', () => b.remove());
  balloonField.appendChild(b);
}

function startBalloons() {
  balloonField.innerHTML = '';
  for (let i = 0; i < 3; i++) setTimeout(spawnBalloon, i * 600);
  balloonTimer = setInterval(spawnBalloon, 1400);
}

/* ======================================================
   LITTLE DOORS — open a door, find a friend
   ====================================================== */
const doorRow = document.getElementById('door-row');
const DOOR_COLORS = ['#ffab6b', '#7fc4ff', '#ff8fb8', '#7be0c3', '#c3a4ff', '#ffd45e'];

function buildDoors() {
  doorRow.innerHTML = '';
  const picks = shuffle(ANIMALS).slice(0, 6);
  picks.forEach((animal, i) => {
    const door = document.createElement('button');
    door.className = 'door-frame';
    door.style.setProperty('--door-color', DOOR_COLORS[i % DOOR_COLORS.length]);
    door.innerHTML = `
      <div class="door-prize"><span>${animal.emoji}</span></div>
      <div class="door-panel"></div>`;
    let currentAnimal = animal;

    door.addEventListener('click', () => {
      if (door.classList.contains('open')) return;
      door.classList.add('open');
      creakSound();
      setTimeout(() => {
        cheerSound();
        say(currentAnimal.name);
        const r = door.getBoundingClientRect();
        emojiBurst(r.left + r.width / 2, r.top + r.height / 3, '⭐', 5);
      }, 250);

      // close again with a fresh animal behind it
      setTimeout(() => {
        door.classList.remove('open');
        setTimeout(() => {
          currentAnimal = pick(ANIMALS);
          door.querySelector('.door-prize span').textContent = currentAnimal.emoji;
        }, 400);
      }, 4200);
    });
    doorRow.appendChild(door);
  });
}

/* ======================================================
   COLORS — tap a blob, it says its colour out loud
   ====================================================== */
const blobGrid = document.getElementById('blob-grid');

function paintBlob(blob, color) {
  blob.style.setProperty('--blob-color', color.hex);
  blob.dataset.name = color.name;
  blob.querySelector('.blob-label').textContent = color.name;
}

function buildColors() {
  blobGrid.innerHTML = '';
  shuffle(COLORS).slice(0, 6).forEach((color) => {
    const blob = document.createElement('button');
    blob.className = 'color-blob';
    blob.innerHTML = '<span class="blob-label"></span>';
    let currentColor = color;
    paintBlob(blob, currentColor);

    blob.addEventListener('click', () => {
      if (blob.classList.contains('said')) return;
      blob.classList.add('said');
      cheerSound();
      say(currentColor.name);
      const r = blob.getBoundingClientRect();
      confettiBurst(r.left + r.width / 2, r.top + r.height / 2, 16, currentColor.hex);

      // after a moment, become a NEW colour so it never runs out
      setTimeout(() => {
        blob.classList.remove('said');
        currentColor = pick(COLORS);
        paintBlob(blob, currentColor);
      }, 2500);
    });
    blobGrid.appendChild(blob);
  });
}

/* ======================================================
   RAIN CATCHER — drops fall from the sky, tap to catch
   ====================================================== */
const rainField = document.getElementById('rain-field');
// mostly raindrops, with the occasional treat tumbling down for a surprise
const RAIN_EMOJIS = ['💧', '💧', '💧', '💦', '⭐', '🍎', '🍓', '🌸', '🐞', '🍋'];

function spawnDrop() {
  if (activeMode !== 'rain') return;
  // don't pile up drops while the tab is hidden or the sky is already full
  if (document.hidden || rainField.childElementCount >= 12) return;
  const d = document.createElement('button');
  d.className = 'drop';
  d.textContent = pick(RAIN_EMOJIS);
  d.style.left = rand(3, 84) + 'vw';
  d.style.setProperty('--sway', rand(-10, 10) + 'deg');
  const fallSecs = rand(4, 7);
  d.style.animationDuration = fallSecs + 's';
  // fallback cleanup in case animationend never fires (e.g. throttled tab)
  setTimeout(() => d.remove(), (fallSecs + 3) * 1000);

  d.addEventListener('click', () => {
    if (d.classList.contains('caught')) return;
    const r = d.getBoundingClientRect();
    d.classList.add('caught');
    splashSound();
    emojiBurst(r.left + r.width / 2, r.top + r.height / 2, '💦', 5);
    confettiBurst(r.left + r.width / 2, r.top + r.height / 2, 10, '#7fc4ff');
    setTimeout(() => d.remove(), 120);
  });

  d.addEventListener('animationend', () => d.remove());
  rainField.appendChild(d);
}

function startRain() {
  rainField.innerHTML = '';
  for (let i = 0; i < 4; i++) setTimeout(spawnDrop, i * 400);
  balloonTimer = setInterval(spawnDrop, 800);
}

/* ======================================================
   WHACK-A-MOLE — critters pop from holes, tap to bonk
   ====================================================== */
const moleGrid = document.getElementById('mole-grid');
// friendly critters that peek out of the holes
const MOLE_CRITTERS = ['🐹', '🐹', '🐰', '🐭', '🦔', '🐸', '🐱'];
const MOLE_HOLES = 9;

function buildMoles() {
  moleGrid.innerHTML = '';
  for (let i = 0; i < MOLE_HOLES; i++) {
    const hole = document.createElement('div');
    hole.className = 'mole-hole';
    hole.innerHTML = `
      <button class="mole" aria-label="critter"><span class="mole-face"></span></button>
      <div class="mole-dirt"></div>`;
    const mole = hole.querySelector('.mole');
    mole.addEventListener('click', () => {
      if (!hole.classList.contains('up') || mole.classList.contains('bonked')) return;
      mole.classList.add('bonked');
      hole.classList.remove('up');
      popSound();
      const r = mole.getBoundingClientRect();
      emojiBurst(r.left + r.width / 2, r.top + r.height / 2, '⭐', 5);
      confettiBurst(r.left + r.width / 2, r.top + r.height / 2, 14);
    });
    moleGrid.appendChild(hole);
  }
}

function popMole() {
  if (activeMode !== 'moles' || document.hidden) return;
  const holes = [...moleGrid.querySelectorAll('.mole-hole')];
  const down = holes.filter((h) => !h.classList.contains('up'));
  if (!down.length) return;
  const hole = pick(down);
  const mole = hole.querySelector('.mole');
  mole.classList.remove('bonked');
  mole.querySelector('.mole-face').textContent = pick(MOLE_CRITTERS);
  hole.classList.add('up');
  // duck back down on its own if nobody bonks it
  setTimeout(() => hole.classList.remove('up'), rand(1400, 2600));
}

function startMoles() {
  buildMoles();
  for (let i = 0; i < 2; i++) setTimeout(popMole, i * 500);
  balloonTimer = setInterval(popMole, 900);
}

/* ======================================================
   RAINBOW DRAW — drag to paint a thick rainbow trail
   ====================================================== */
const drawCanvas = document.getElementById('draw-canvas');
const drawCtx = drawCanvas.getContext('2d');
const drawClearBtn = document.getElementById('draw-clear');
const drawHint = document.querySelector('.draw-hint');

let drawHue = 0;
let drawing = false;
let drawLastX = 0;
let drawLastY = 0;
let drawSoundReady = true;

function sizeDrawCanvas() {
  const dpr = window.devicePixelRatio || 1;
  drawCanvas.width = Math.round(window.innerWidth * dpr);
  drawCanvas.height = Math.round(window.innerHeight * dpr);
  drawCanvas.style.width = window.innerWidth + 'px';
  drawCanvas.style.height = window.innerHeight + 'px';
  drawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawCtx.lineCap = 'round';
  drawCtx.lineJoin = 'round';
}

function clearDraw() {
  drawCtx.save();
  drawCtx.setTransform(1, 0, 0, 1, 0, 0);
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  drawCtx.restore();
}

// a soft, pitch-shifting note while the crayon moves (throttled so it purrs, not screeches)
function drawTone(hue) {
  if (!drawSoundReady) return;
  drawSoundReady = false;
  tone(300 + (hue / 360) * 900, 0.12, 'sine', 0.05);
  setTimeout(() => { drawSoundReady = true; }, 90);
}

function drawDot(x, y) {
  drawHue = (drawHue + 12) % 360;
  drawCtx.fillStyle = `hsl(${drawHue}, 90%, 60%)`;
  drawCtx.beginPath();
  drawCtx.arc(x, y, 12, 0, Math.PI * 2);
  drawCtx.fill();
}

function drawStart(x, y) {
  drawing = true;
  drawLastX = x;
  drawLastY = y;
  drawDot(x, y); // a lone tap still leaves a blob
  drawTone(drawHue);
  if (drawHint) drawHint.classList.add('gone');
}

function drawMove(x, y) {
  if (!drawing) return;
  drawHue = (drawHue + 6) % 360;
  drawCtx.strokeStyle = `hsl(${drawHue}, 90%, 60%)`;
  drawCtx.lineWidth = 22;
  drawCtx.beginPath();
  drawCtx.moveTo(drawLastX, drawLastY);
  drawCtx.lineTo(x, y);
  drawCtx.stroke();
  drawLastX = x;
  drawLastY = y;
  drawTone(drawHue);
}

function drawEnd() { drawing = false; }

function startDraw() {
  sizeDrawCanvas();
  clearDraw();
  if (drawHint) drawHint.classList.remove('gone');
}

drawCanvas.addEventListener('pointerdown', (e) => {
  ctx(); // unlock audio on first touch
  drawStart(e.clientX, e.clientY);
});
drawCanvas.addEventListener('pointermove', (e) => drawMove(e.clientX, e.clientY));
window.addEventListener('pointerup', drawEnd);
window.addEventListener('pointercancel', drawEnd);

// keep the canvas matched to the window (e.g. rotation) — only while this mode is showing
window.addEventListener('resize', () => {
  if (activeMode !== 'draw' || drawing) return;
  sizeDrawCanvas();
  clearDraw();
});

drawClearBtn.addEventListener('click', () => {
  clearDraw();
  sparkleSound();
  if (drawHint) drawHint.classList.remove('gone');
});

/* ======================================================
   MAGIC TAPS — tap anywhere, stars burst out
   ====================================================== */
const magicCanvas = document.getElementById('magic-canvas');

function magicTap(x, y) {
  sparkleSound();
  const count = 7;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'magic-burst';
    el.textContent = pick(MAGIC_EMOJIS);
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    const angle = (i / count) * Math.PI * 2 + rand(-0.3, 0.3);
    const dist = rand(70, 190);
    el.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
    el.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
    el.style.setProperty('--rot', rand(-180, 180) + 'deg');
    magicCanvas.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

magicCanvas.addEventListener('pointerdown', (e) => magicTap(e.clientX, e.clientY));

// dismiss the hint after the first few taps
let magicTaps = 0;
magicCanvas.addEventListener('pointerdown', () => {
  magicTaps++;
  if (magicTaps === 3) {
    const hint = document.querySelector('.magic-hint');
    if (hint) hint.style.display = 'none';
  }
});
