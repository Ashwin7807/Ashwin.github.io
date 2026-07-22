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
   HERO NAME — GSAP SplitType animation
   ========================================================= */
(() => {
  const el = document.getElementById('hero-name');
  if (!el || typeof SplitType === 'undefined' || typeof gsap === 'undefined') return;
  
  const delayStart = prefersReducedMotion ? 0 : 2200;

  setTimeout(() => {
    // Split the text into characters
    const text = new SplitType(el, { types: 'chars' });
    
    // Mimic the React Bits SplitText animation behavior
    gsap.fromTo(text.chars, 
      { opacity: 0, y: 40 },
      {
        opacity: 1, 
        y: 0,
        duration: 1.25,
        ease: 'power3.out',
        stagger: 0.1,
        force3D: true
      }
    );
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
   AMBIENT BACKGROUND — schematic / circuit grid, slow drift
   ========================================================= */
(() => {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let w, h, dpr;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = window.innerWidth * dpr;
    h = canvas.height = document.documentElement.scrollHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = document.documentElement.scrollHeight + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  const spacing = 64;
  let t = 0;

  // scattered "node" points where lines intersect get a small pulse
  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(198,166,100,0.07)';
    ctx.lineWidth = 1 * dpr;

    const offset = (t * 6) % (spacing * dpr);

    for (let x = -spacing * dpr; x < w + spacing * dpr; x += spacing * dpr) {
      ctx.beginPath();
      ctx.moveTo(x + offset, 0);
      ctx.lineTo(x + offset, h);
      ctx.stroke();
    }
    for (let y = -spacing * dpr; y < h + spacing * dpr; y += spacing * dpr) {
      ctx.beginPath();
      ctx.moveTo(0, y + offset * 0.4);
      ctx.lineTo(w, y + offset * 0.4);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(198,166,100,0.16)';
    for (let x = -spacing * dpr; x < w + spacing * dpr; x += spacing * dpr) {
      for (let y = -spacing * dpr; y < h + spacing * dpr; y += spacing * dpr) {
        const nx = x + offset;
        const ny = y + offset * 0.4;
        const pulse = (Math.sin(t * 0.02 + nx * 0.01 + ny * 0.01) + 1) / 2;
        if (pulse > 0.93) {
          ctx.beginPath();
          ctx.arc(nx, ny, 2 * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  function loop() {
    if (!prefersReducedMotion) {
      t += 1;
      draw();
      requestAnimationFrame(loop);
    } else {
      draw();
    }
  }
  loop();
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
    overInteractive = !!(target && target.closest('a, button, .id-card'));
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

  function drawReticle(size, bracket, gap) {
    const c = overInteractive ? '198,166,100' : '169,152,133';
    ctx.strokeStyle = `rgba(${c},0.85)`;
    ctx.lineWidth = 1.4 * dpr;

    // four corner brackets — target-lock style
    const s = size, b = bracket;
    const corners = [
      [-1, -1], [1, -1], [-1, 1], [1, 1],
    ];
    corners.forEach(([sx, sy]) => {
      const cx = mx + sx * s;
      const cy = my + sy * s;
      ctx.beginPath();
      ctx.moveTo(cx, cy + sy * -b);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + sx * -b, cy);
      ctx.stroke();
    });

    // thin crosshair
    ctx.strokeStyle = `rgba(${c},0.35)`;
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(mx - gap, my); ctx.lineTo(mx - size * 0.4, my);
    ctx.moveTo(mx + gap, my); ctx.lineTo(mx + size * 0.4, my);
    ctx.moveTo(mx, my - gap); ctx.lineTo(mx, my - size * 0.4);
    ctx.moveTo(mx, my + gap); ctx.lineTo(mx, my + size * 0.4);
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // core dot
    ctx.beginPath();
    ctx.arc(mx, my, 2 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = overInteractive ? 'rgba(198,166,100,0.95)' : 'rgba(241,233,221,0.8)';
    ctx.fill();

    // target-lock reticle, tightens slightly over interactive elements
    const size = (overInteractive ? 14 : 18) * dpr;
    drawReticle(size, 5 * dpr, 5 * dpr);

    // slow rotating scan tick on the reticle radius
    scanAngle += 0.02;
    const rx = mx + Math.cos(scanAngle) * size * 1.35;
    const ry = my + Math.sin(scanAngle) * size * 1.35;
    ctx.beginPath();
    ctx.arc(rx, ry, 1.6 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(198,166,100,0.7)';
    ctx.fill();

    // click pulse — brief expanding ring, like a scan ping
    if (clickPulse > 0) {
      ctx.beginPath();
      ctx.arc(mx, my, (1 - clickPulse) * 30 * dpr, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(198,166,100,${clickPulse})`;
      ctx.lineWidth = 1.2 * dpr;
      ctx.stroke();
      clickPulse -= 0.04;
    }

    // trailing hex glyphs — soft glow, gentle upward drift, varied size/lifespan
    for (let i = glyphs.length - 1; i >= 0; i--) {
      const g = glyphs[i];
      ctx.font = `${g.size}px 'JetBrains Mono', monospace`;
      ctx.shadowColor = 'rgba(198,166,100,0.6)';
      ctx.shadowBlur = 4 * dpr;
      ctx.fillStyle = `rgba(210,198,178,${g.life * 0.55})`;
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
   3D SHIELD — behind hero text, reacts near cursor, drag to rotate
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

  // Lighting — cool, moody, futuristic
  scene.add(new THREE.AmbientLight(0x1e293b, 1.6));
  const key = new THREE.PointLight(0x60a5fa, 70, 30);
  key.position.set(4, 5, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0xf472b6, 40, 30);
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

  // Procedural brushed-metal texture for surface detail (noise + fine streaks)
  function makeMetalTexture() {
    const size = 512;
    const tc = document.createElement('canvas');
    tc.width = size; tc.height = size;
    const tx = tc.getContext('2d');
    tx.fillStyle = '#808080';
    tx.fillRect(0, 0, size, size);
    // fine horizontal brushed streaks
    for (let i = 0; i < 900; i++) {
      const y = Math.random() * size;
      const shade = 110 + Math.random() * 80;
      tx.strokeStyle = `rgba(${shade},${shade},${shade},0.18)`;
      tx.lineWidth = 0.6 + Math.random() * 0.8;
      tx.beginPath();
      tx.moveTo(0, y);
      tx.lineTo(size, y + (Math.random() - 0.5) * 4);
      tx.stroke();
    }
    // speckled noise for a hammered look
    const img = tx.getImageData(0, 0, size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 45;
      img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
    }
    tx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(tc);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }
  const metalTexture = makeMetalTexture();

  const material = new THREE.MeshStandardMaterial({
    color: 0x8CA2C2,
    metalness: 0.75,
    roughness: 0.35,
    roughnessMap: metalTexture,
    bumpMap: metalTexture,
    bumpScale: 0.025,
    emissive: 0x0B0E14,
    emissiveIntensity: 0.4,
  });
  const shield = new THREE.Mesh(geometry, material);
  scene.add(shield);

  // Canvas texture with "ASH" engraved look, applied as a decal plane on the front face
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, 512, 512);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.font = '700 128px "Outfit", sans-serif';

  // glitch-offset ghost layers, tech-terminal style
  c.fillStyle = 'rgba(96,165,250,0.5)';
  c.fillText('ASH', 250, 246);
  c.fillStyle = 'rgba(226,232,240,0.28)';
  c.fillText('ASH', 262, 254);

  // main engraved text
  c.fillStyle = 'rgba(11,14,20,0.92)';
  c.fillText('ASH', 256, 250);
  c.strokeStyle = 'rgba(226,232,240,0.3)';
  c.lineWidth = 2;
  c.strokeText('ASH', 256, 250);

  // faint scanlines across the plate for a terminal feel
  c.strokeStyle = 'rgba(11,14,20,0.18)';
  c.lineWidth = 2;
  for (let y = 0; y < 512; y += 6) {
    c.beginPath();
    c.moveTo(60, y);
    c.lineTo(452, y);
    c.stroke();
  }

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

  // Drag to rotate (the "movable" requirement)
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

    // Proximity reaction — smooth falloff, tuned to be more sensitive to cursor movement
    const rect = stage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const radius = Math.min(rect.width, rect.height) * 0.55;

    const nx = (e.clientX - cx) / radius;
    const ny = (e.clientY - cy) / radius;
    const strength = Math.max(0, 1 - Math.min(Math.hypot(nx, ny), 1.8) / 1.8);

    targetRotY = Math.max(-1.5, Math.min(1.5, nx * 1.5)) * strength;
    targetRotX = Math.max(-1.2, Math.min(1.2, -ny * 1.2)) * strength;
  });

  function animate() {
    requestAnimationFrame(animate);
    baseRotY += 0.0018;

    currentRotX += (targetRotX - currentRotX) * 0.14;
    currentRotY += (targetRotY - currentRotY) * 0.14;

    shield.rotation.x = currentRotX;
    shield.rotation.y = baseRotY + currentRotY;
    shield.position.y = Math.sin(baseRotY * 4) * 0.08;

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
