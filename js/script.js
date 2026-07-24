import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* =========================================================
   BOOT SEQUENCE
   ========================================================= */
const boot = document.getElementById('boot-screen');
setTimeout(() => {
  boot.classList.add('is-hidden');
}, prefersReducedMotion ? 100 : 2100);

/* =========================================================
   FOOTER YEAR
   ========================================================= */
document.getElementById('year').textContent = new Date().getFullYear();

/* =========================================================
   HERO NAME — DecryptedText scramble-reveal (letter-by-letter, controlled speed)
   ========================================================= */
(() => {
  const container = document.getElementById('decrypted-name');
  const dot = document.getElementById('hero-dot');
  if (!container) return;

  const text = container.dataset.text || "Hi, I'm Ashwin";
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+{}[]<>';
  const delayStart = prefersReducedMotion ? 100 : 2200;

  function getRandomChar() {
    return chars[Math.floor(Math.random() * chars.length)];
  }

  function render(revealedCount, currentScramble) {
    container.innerHTML = '';
    text.split('').forEach((realChar, i) => {
      const span = document.createElement('span');
      if (i < revealedCount) {
        span.className = 'decrypted-char revealed';
        span.textContent = realChar;
      } else if (i === revealedCount) {
        span.className = 'decrypted-char encrypted';
        span.textContent = currentScramble || getRandomChar();
      } else {
        span.className = 'decrypted-char encrypted';
        span.textContent = getRandomChar();
      }
      container.appendChild(span);
    });
  }

  // Pre-render scrambled placeholders
  render(0, '');

  setTimeout(() => {
    let revealedCount = 0;
    let scrambleFrame = 0;
    const framesPerLetter = 4; // Snappy & fast scrambling per character
    const intervalMs = 35; // Fast 35ms tick rate

    const interval = setInterval(() => {
      if (revealedCount >= text.length) {
        clearInterval(interval);
        container.innerHTML = '';
        text.split('').forEach((realChar) => {
          const span = document.createElement('span');
          span.className = 'decrypted-char revealed';
          span.textContent = realChar;
          container.appendChild(span);
        });
        if (dot) dot.style.opacity = '1';
        return;
      }

      render(revealedCount, getRandomChar());
      scrambleFrame++;

      if (scrambleFrame >= framesPerLetter) {
        scrambleFrame = 0;
        revealedCount++;
      }
    }, intervalMs);
  }, delayStart);
})();

/* =========================================================
   ROLLING TEXT
   ========================================================= */
(() => {
  const lines = document.querySelectorAll('.rolling-line');
  if (!lines.length) return;
  let i = 0;
  setInterval(() => {
    lines[i].classList.remove('is-active');
    i = (i + 1) % lines.length;
    lines[i].classList.add('is-active');
  }, 2600);
})();

/* =========================================================
   TIME-ZONE AWARE GREETING (uses the VISITOR'S local clock)
   ========================================================= */
(() => {
  const el = document.getElementById('cat-greeting');
  if (!el) return;
  const hour = new Date().getHours();
  let msg;
  if (hour >= 5 && hour < 12) msg = "Good morning! Rise & secure ☀️";
  else if (hour >= 12 && hour < 17) msg = "Good afternoon! Stay sharp 🐾";
  else if (hour >= 17 && hour < 21) msg = "Good evening! Nice of you to drop by 🌙";
  else msg = "Up late? Get some rest, hacker 😽";
  el.textContent = msg;
})();

/* =========================================================
   ID CARD — mouse tilt (rotatable) + click-to-flip
   ========================================================= */
(() => {
  const card = document.getElementById('id-card');
  if (!card) return;
  let flipped = false;

  const maxTilt = 14;
  card.addEventListener('mousemove', (e) => {
    if (prefersReducedMotion) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotY = (px - 0.5) * maxTilt * 2;
    const rotX = (0.5 - py) * maxTilt * 2;
    card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY + (flipped ? 180 : 0)}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = `rotateX(0deg) rotateY(${flipped ? 180 : 0}deg)`;
  });

  const doFlip = () => {
    flipped = !flipped;
    card.classList.toggle('is-flipped', flipped);
    card.style.transform = '';
  };
  card.addEventListener('click', doFlip);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doFlip(); }
  });
})();

/* =========================================================
   CURSOR-REACTIVE GRID BACKGROUND (CursorGrid)
   ========================================================= */
(() => {
  const container = document.getElementById('cursor-grid');
  if (!container) return;
  const canvas = container.querySelector('.cursor-grid__canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const cfg = {
    cellSize: 75, color: '#10B981', radius: 130,
    falloff: 'smooth', holdTime: 350, fadeDuration: 700,
    lineWidth: 1.0, maxOpacity: 0.35, fillOpacity: 0,
    gridOpacity: 0, cellRadius: 0, clickPulse: true, pulseSpeed: 550
  };

  const FALLOFF = { linear: t => t, smooth: t => t * t * (3 - 2 * t), sharp: t => t * t * t };
  const hx = cfg.color.replace('#', '');
  const cR = parseInt(hx.slice(0, 2), 16);
  const cG = parseInt(hx.slice(2, 4), 16);
  const cB = parseInt(hx.slice(4, 6), 16);

  let cols = 0, rows = 0, offX = 0, offY = 0;
  let alphas, touched, gw = 0, gh = 0;
  const pulses = [];
  let raf = 0, running = false, lastFrame = 0;

  function rebuild() {
    gw = window.innerWidth; gh = window.innerHeight;
    canvas.width = Math.max(1, Math.round(gw * dpr));
    canvas.height = Math.max(1, Math.round(gh * dpr));
    canvas.style.width = gw + 'px';
    canvas.style.height = gh + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(gw / cfg.cellSize) + 1;
    rows = Math.ceil(gh / cfg.cellSize) + 1;
    offX = (gw - cols * cfg.cellSize) / 2;
    offY = (gh - rows * cfg.cellSize) / 2;
    alphas = new Float32Array(cols * rows);
    touched = new Float64Array(cols * rows);
  }

  function cellCenter(i) {
    return [
      offX + (i % cols) * cfg.cellSize + cfg.cellSize / 2,
      offY + Math.floor(i / cols) * cfg.cellSize + cfg.cellSize / 2
    ];
  }

  function energize(x, y) {
    const r = Math.max(cfg.radius, 1);
    const ease = FALLOFF[cfg.falloff] || FALLOFF.linear;
    const now = performance.now();
    const mc1 = Math.max(0, Math.floor((x - r - offX) / cfg.cellSize));
    const mc2 = Math.min(cols - 1, Math.floor((x + r - offX) / cfg.cellSize));
    const mr1 = Math.max(0, Math.floor((y - r - offY) / cfg.cellSize));
    const mr2 = Math.min(rows - 1, Math.floor((y + r - offY) / cfg.cellSize));
    for (let row = mr1; row <= mr2; row++) {
      for (let col = mc1; col <= mc2; col++) {
        const i = row * cols + col;
        const [cx, cy] = cellCenter(i);
        const dist = Math.hypot(cx - x, cy - y);
        if (dist > r) continue;
        const level = ease(1 - dist / r) * cfg.maxOpacity;
        if (level > alphas[i]) { alphas[i] = level; touched[i] = now; }
        else if (level > 0) { touched[i] = now; }
      }
    }
  }

  function draw(now) {
    const dt = Math.min(now - lastFrame, 50);
    lastFrame = now;
    ctx.clearRect(0, 0, gw, gh);

    /* Click pulses */
    for (let pi = pulses.length - 1; pi >= 0; pi--) {
      const p = pulses[pi];
      const age = (now - p.t0) / 1000;
      const ringR = age * cfg.pulseSpeed;
      if (ringR > Math.hypot(gw, gh)) { pulses.splice(pi, 1); continue; }
      const band = cfg.cellSize;
      const pc1 = Math.max(0, Math.floor((p.x - ringR - band - offX) / cfg.cellSize));
      const pc2 = Math.min(cols - 1, Math.floor((p.x + ringR + band - offX) / cfg.cellSize));
      const pr1 = Math.max(0, Math.floor((p.y - ringR - band - offY) / cfg.cellSize));
      const pr2 = Math.min(rows - 1, Math.floor((p.y + ringR + band - offY) / cfg.cellSize));
      for (let row = pr1; row <= pr2; row++) {
        for (let col = pc1; col <= pc2; col++) {
          const i = row * cols + col;
          const [cx, cy] = cellCenter(i);
          const dist = Math.hypot(cx - p.x, cy - p.y);
          if (Math.abs(dist - ringR) < band / 2 && cfg.maxOpacity > alphas[i]) {
            alphas[i] = cfg.maxOpacity; touched[i] = now;
          }
        }
      }
    }

    let anyVisible = pulses.length > 0;
    const fadeStep = dt / Math.max(cfg.fadeDuration, 16);
    const half = cfg.cellSize / 2;

    for (let i = 0; i < alphas.length; i++) {
      let a = alphas[i];
      if (a <= 0) continue;
      if (now - touched[i] > cfg.holdTime) {
        a = Math.max(0, a - fadeStep); alphas[i] = a;
        if (a <= 0) continue;
      }
      anyVisible = true;
      const [cx, cy] = cellCenter(i);
      const grad = ctx.createRadialGradient(cx, cy, half * 0.1, cx, cy, cfg.cellSize);
      grad.addColorStop(0, `rgba(${cR},${cG},${cB},${a})`);
      grad.addColorStop(1, `rgba(${cR},${cG},${cB},0)`);
      const x = cx - half + 0.5, y = cy - half + 0.5, s = cfg.cellSize - 1;
      ctx.beginPath();
      ctx.rect(x, y, s, s);
      if (cfg.fillOpacity > 0) {
        ctx.fillStyle = `rgba(${cR},${cG},${cB},${a * cfg.fillOpacity})`; ctx.fill();
      }
      ctx.strokeStyle = grad; ctx.lineWidth = cfg.lineWidth; ctx.stroke();
    }

    if (anyVisible) { raf = requestAnimationFrame(draw); }
    else { running = false; }
  }

  function wake() {
    if (running) return;
    running = true; lastFrame = performance.now();
    raf = requestAnimationFrame(draw);
  }

  window.addEventListener('pointermove', e => { energize(e.clientX, e.clientY); wake(); });
  window.addEventListener('pointerdown', e => {
    if (!cfg.clickPulse) return;
    pulses.push({ x: e.clientX, y: e.clientY, t0: performance.now() });
    wake();
  });

  window.addEventListener('resize', () => { rebuild(); wake(); });
  rebuild();
  if (!prefersReducedMotion) wake();
})();

/* =========================================================
   CURSOR EFFECT — soft scan-glow + trailing hex glyphs
   ========================================================= */
(() => {
  if (window.matchMedia('(hover: none)').matches) return; // skip on touch
  const canvas = document.getElementById('cursor-canvas');
  const ctx = canvas.getContext('2d');
  let w, h, dpr;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = window.innerWidth * dpr;
    h = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  let mx = w / 2, my = h / 2;
  let clickPulse = 0;
  let scanAngle = 0;
  const glyphs = [];
  const hexChars = '0123456789ABCDEF';
  let overInteractive = false;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX * dpr;
    my = e.clientY * dpr;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    overInteractive = !!(target && target.closest('a, button, .id-card, .dock-item'));
    if (Math.random() < 0.4) {
      const angle = Math.random() * Math.PI * 2;
      const spread = Math.random() * 10 * dpr;
      const pair = Math.random() < 0.3;
      glyphs.push({
        x: mx + Math.cos(angle) * spread,
        y: my + Math.sin(angle) * spread,
        ch: pair
          ? hexChars[Math.floor(Math.random() * hexChars.length)] + hexChars[Math.floor(Math.random() * hexChars.length)]
          : hexChars[Math.floor(Math.random() * hexChars.length)],
        life: 1,
        decay: 0.014 + Math.random() * 0.016,
        drift: (Math.random() - 0.5) * 0.4,
        size: (7.5 + Math.random() * 3.5) * dpr,
      });
    }
  });
  window.addEventListener('mousedown', () => { clickPulse = 1; });

  function drawReticle(size) {
    const c = overInteractive ? '16,185,129' : '148,163,184';
    ctx.strokeStyle = `rgba(${c}, ${overInteractive ? 0.85 : 0.4})`;
    ctx.lineWidth = (overInteractive ? 1.5 : 1.2) * dpr;

    // Smooth circular target ring instead of square brackets for easy tracking & clicking
    ctx.beginPath();
    ctx.arc(mx, my, size, 0, Math.PI * 2);
    ctx.stroke();

    // Four subtle precision crosshair ticks on the ring
    const gap = 3 * dpr;
    const len = 4 * dpr;
    ctx.beginPath();
    ctx.moveTo(mx - size - len, my); ctx.lineTo(mx - size + gap, my);
    ctx.moveTo(mx + size - gap, my); ctx.lineTo(mx + size + len, my);
    ctx.moveTo(mx, my - size - len); ctx.lineTo(mx, my - size + gap);
    ctx.moveTo(mx, my + size - gap); ctx.lineTo(mx, my + size + len);
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // Precise core target dot
    ctx.beginPath();
    ctx.arc(mx, my, (overInteractive ? 3.5 : 2.5) * dpr, 0, Math.PI * 2);
    ctx.fillStyle = overInteractive ? 'rgba(16, 185, 129, 1)' : 'rgba(248, 250, 252, 0.9)';
    if (overInteractive) {
      ctx.shadowColor = 'rgba(16, 185, 129, 0.9)';
      ctx.shadowBlur = 6 * dpr;
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    // Precision circular target ring
    const size = (overInteractive ? 15 : 11) * dpr;
    drawReticle(size);

    // Rotating micro-scan tick on the ring
    scanAngle += 0.025;
    const rx = mx + Math.cos(scanAngle) * size;
    const ry = my + Math.sin(scanAngle) * size;
    ctx.beginPath();
    ctx.arc(rx, ry, 1.5 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
    ctx.fill();

    // Click pulse — expanding emerald ping
    if (clickPulse > 0) {
      ctx.beginPath();
      ctx.arc(mx, my, (1 - clickPulse) * 28 * dpr, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(16, 185, 129, ${clickPulse})`;
      ctx.lineWidth = 1.4 * dpr;
      ctx.stroke();
      clickPulse -= 0.04;
    }

    // Trailing hex glyphs in emerald jade
    for (let i = glyphs.length - 1; i >= 0; i--) {
      const g = glyphs[i];
      ctx.font = `${g.size}px 'JetBrains Mono', monospace`;
      ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
      ctx.shadowBlur = 4 * dpr;
      ctx.fillStyle = `rgba(167, 243, 208, ${g.life * 0.6})`;
      ctx.fillText(g.ch, g.x + 14 * dpr, g.y - 14 * dpr);
      ctx.shadowBlur = 0;
      g.life -= g.decay;
      g.y -= 0.3 * dpr;
      g.x += g.drift;
      if (g.life <= 0) glyphs.splice(i, 1);
    }

    requestAnimationFrame(draw);
  }
  if (!prefersReducedMotion) draw();
})();

/* =========================================================
   REACT BITS DOCK (Proximity Magnification & Active Scroll)
   ========================================================= */
(() => {
  const panel = document.querySelector('.dock-panel');
  if (!panel) return;
  const items = panel.querySelectorAll('.dock-item');
  const baseSize = 48;
  const magSize = 68;
  const distanceThreshold = 160;

  panel.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX;
    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const itemCenterX = rect.left + rect.width / 2;
      const dist = Math.abs(mouseX - itemCenterX);

      if (dist < distanceThreshold) {
        const norm = dist / distanceThreshold;
        const scale = 0.5 * (1 + Math.cos(Math.PI * norm));
        const targetSize = baseSize + (magSize - baseSize) * scale;
        item.style.width = `${targetSize}px`;
        item.style.height = `${targetSize}px`;
      } else {
        item.style.width = `${baseSize}px`;
        item.style.height = `${baseSize}px`;
      }
    });
  });

  panel.addEventListener('mouseleave', () => {
    items.forEach((item) => {
      item.style.width = `${baseSize}px`;
      item.style.height = `${baseSize}px`;
    });
  });

  // Active section tracker on scroll
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    let current = 'top';
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 140;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });
    items.forEach((item) => {
      const href = item.getAttribute('href');
      if (href === `#${current}`) {
        item.classList.add('dock-item--active');
      } else {
        item.classList.remove('dock-item--active');
      }
    });
  });
})();

/* =========================================================
   3D CYBERSECURITY SHIELD — reactive, rotating encryption mesh & particles
   ========================================================= */
(() => {
  const stage = document.getElementById('shield-stage');
  if (!stage || prefersReducedMotion) return;

  const width = stage.clientWidth || window.innerWidth;
  const height = stage.clientHeight || window.innerHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
  camera.position.set(0, 0, 9);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  stage.appendChild(renderer.domElement);

  // Lighting — Rich Charcoal & Emerald Amber Theme
  scene.add(new THREE.AmbientLight(0x0b0f17, 1.8));
  const key = new THREE.PointLight(0x10b981, 70, 30);
  key.position.set(4, 5, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0xf59e0b, 40, 30);
  rim.position.set(-5, -3, -4);
  scene.add(rim);

  // Shield silhouette shape
  const shieldShape = new THREE.Shape();
  shieldShape.moveTo(0, 2.1);
  shieldShape.bezierCurveTo(1.3, 2.1, 1.7, 1.6, 1.7, 1.6);
  shieldShape.lineTo(1.7, 0.2);
  shieldShape.bezierCurveTo(1.7, -1.3, 0.9, -2.3, 0, -2.7);
  shieldShape.bezierCurveTo(-0.9, -2.3, -1.7, -1.3, -1.7, 0.2);
  shieldShape.lineTo(-1.7, 1.6);
  shieldShape.bezierCurveTo(-1.7, 1.6, -1.3, 2.1, 0, 2.1);

  const extrudeSettings = { depth: 0.32, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 4, curveSegments: 24 };
  const geometry = new THREE.ExtrudeGeometry(shieldShape, extrudeSettings);
  geometry.center();

  // Procedural dark metal texture
  function makeMetalTexture() {
    const size = 512;
    const tc = document.createElement('canvas');
    tc.width = size; tc.height = size;
    const tx = tc.getContext('2d');
    tx.fillStyle = '#141c2b';
    tx.fillRect(0, 0, size, size);
    for (let i = 0; i < 900; i++) {
      const y = Math.random() * size;
      const shade = 30 + Math.random() * 50;
      tx.strokeStyle = `rgba(${shade},${shade + 30},${shade + 20},0.12)`;
      tx.lineWidth = 0.6 + Math.random() * 0.8;
      tx.beginPath();
      tx.moveTo(0, y);
      tx.lineTo(size, y + (Math.random() - 0.5) * 4);
      tx.stroke();
    }
    const tex = new THREE.CanvasTexture(tc);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }
  const metalTexture = makeMetalTexture();

  const material = new THREE.MeshStandardMaterial({
    color: 0x141c2b,
    metalness: 0.75,
    roughness: 0.3,
    roughnessMap: metalTexture,
    bumpMap: metalTexture,
    bumpScale: 0.015,
    emissive: 0x059669,
    emissiveIntensity: 0.3,
  });
  const shield = new THREE.Mesh(geometry, material);
  scene.add(shield);

  // Outer Cybersecurity Encryption Mesh Barrier (Wireframe Icosahedron)
  const meshGeo = new THREE.IcosahedronGeometry(2.4, 1);
  const meshMat = new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true, transparent: true, opacity: 0.22 });
  const cyberMesh = new THREE.Mesh(meshGeo, meshMat);
  scene.add(cyberMesh);

  // Orbiting Cyber Data Particles
  const particleCount = 140;
  const pGeo = new THREE.BufferGeometry();
  const pPositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i += 3) {
    const r = 2.2 + Math.random() * 1.6;
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * Math.PI;
    pPositions[i] = r * Math.cos(theta) * Math.cos(phi);
    pPositions[i + 1] = r * Math.sin(phi);
    pPositions[i + 2] = r * Math.sin(theta) * Math.cos(phi);
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  const pMat = new THREE.PointsMaterial({ color: 0xf59e0b, size: 0.045, transparent: true, opacity: 0.65 });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // Canvas texture with Security Lock Icon + "ASH" engraved decal
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, 512, 512);

  // Draw cyber circuit grid on shield decal
  c.strokeStyle = 'rgba(16,185,129,0.25)';
  c.lineWidth = 2;
  c.beginPath();
  c.arc(256, 256, 180, 0, Math.PI * 2);
  c.stroke();

  // Security Padlock Icon
  c.fillStyle = '#10B981';
  c.strokeStyle = '#10B981';
  c.lineWidth = 8;
  // Shackle
  c.beginPath();
  c.arc(256, 175, 42, Math.PI, 0);
  c.stroke();
  // Lock body
  c.beginPath();
  c.roundRect(210, 175, 92, 75, 10);
  c.fill();
  // Keyhole
  c.fillStyle = '#0B0F17';
  c.beginPath();
  c.arc(256, 205, 10, 0, Math.PI * 2);
  c.fill();

  // "ASH" engraved text
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.font = '800 100px "Syne", sans-serif';

  c.fillStyle = 'rgba(16,185,129,0.3)';
  c.fillText('ASH', 260, 310);
  c.fillStyle = '#F8FAFC';
  c.fillText('ASH', 256, 306);
  c.strokeStyle = '#10B981';
  c.lineWidth = 3;
  c.strokeText('ASH', 256, 306);

  const texture = new THREE.CanvasTexture(canvas);
  const decalGeo = new THREE.PlaneGeometry(2.6, 2.6);
  const decalMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
  const decal = new THREE.Mesh(decalGeo, decalMat);
  decal.position.z = 0.19;
  shield.add(decal);

  // Idle floating rotation baseline
  let baseRotY = 0;
  let targetRotX = 0, targetRotY = 0;
  let currentRotX = 0, currentRotY = 0;

  // Drag to rotate
  let dragging = false;
  let dragStart = { x: 0, y: 0 };
  let dragRot = { x: 0, y: 0 };

  renderer.domElement.style.pointerEvents = 'auto';
  renderer.domElement.addEventListener('pointerdown', (e) => {
    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    dragRot = { x: currentRotX, y: currentRotY };
  });
  window.addEventListener('pointerup', () => { dragging = false; });
  window.addEventListener('pointermove', (e) => {
    if (dragging) {
      const dx = (e.clientX - dragStart.x) * 0.006;
      const dy = (e.clientY - dragStart.y) * 0.006;
      targetRotY = dragRot.y + dx;
      targetRotX = dragRot.x - dy;
      return;
    }

    const rect = stage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const radius = Math.min(rect.width, rect.height) * 0.55;

    const nx = (e.clientX - cx) / radius;
    const ny = (e.clientY - cy) / radius;
    const strength = Math.max(0, 1 - Math.min(Math.hypot(nx, ny), 1.8) / 1.8);

    targetRotY = Math.max(-0.85, Math.min(0.85, nx * 0.8)) * strength;
    targetRotX = Math.max(-0.6, Math.min(0.6, -ny * 0.55)) * strength;
  });

  function animate() {
    requestAnimationFrame(animate);
    baseRotY += 0.0018;

    currentRotX += (targetRotX - currentRotX) * 0.14;
    currentRotY += (targetRotY - currentRotY) * 0.14;

    shield.rotation.x = currentRotX;
    shield.rotation.y = baseRotY + currentRotY;
    shield.position.y = Math.sin(baseRotY * 4) * 0.08;

    // Counter-rotate cyber mesh and data particles for cybersecurity effect
    cyberMesh.rotation.y = -baseRotY * 1.5;
    cyberMesh.rotation.x = Math.sin(baseRotY * 2) * 0.2;
    particles.rotation.y = baseRotY * 0.8;

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const w2 = stage.clientWidth || window.innerWidth;
    const h2 = stage.clientHeight || window.innerHeight;
    camera.aspect = w2 / h2;
    camera.updateProjectionMatrix();
    renderer.setSize(w2, h2);
  });
})();
