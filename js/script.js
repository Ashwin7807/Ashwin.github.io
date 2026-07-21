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
    ctx.strokeStyle = 'rgba(201,124,61,0.07)';
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

    ctx.fillStyle = 'rgba(201,124,61,0.16)';
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
  let ringR = 0;
  const glyphs = [];
  const hexChars = '0123456789ABCDEF';

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX * dpr;
    my = e.clientY * dpr;
    if (Math.random() < 0.25) {
      glyphs.push({
        x: mx, y: my,
        ch: hexChars[Math.floor(Math.random() * hexChars.length)],
        life: 1,
      });
    }
  });
  window.addEventListener('mousedown', () => { ringR = 0; });

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // core dot
    ctx.beginPath();
    ctx.arc(mx, my, 3 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(201,124,61,0.9)';
    ctx.fill();

    // soft glow ring
    ringR += 0.6 * dpr;
    if (ringR > 26 * dpr) ringR = 0;
    ctx.beginPath();
    ctx.arc(mx, my, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(201,124,61,${0.35 * (1 - ringR / (26 * dpr))})`;
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();

    // trailing hex glyphs
    ctx.font = `${10 * dpr}px 'JetBrains Mono', monospace`;
    for (let i = glyphs.length - 1; i >= 0; i--) {
      const g = glyphs[i];
      ctx.fillStyle = `rgba(169,152,133,${g.life * 0.5})`;
      ctx.fillText(g.ch, g.x + 8 * dpr, g.y - 8 * dpr);
      g.life -= 0.02;
      g.y -= 0.3 * dpr;
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

  // Lighting — warm, moody
  scene.add(new THREE.AmbientLight(0x3a2e22, 1.4));
  const key = new THREE.PointLight(0xc97c3d, 60, 30);
  key.position.set(4, 5, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0x8b4a24, 30, 30);
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

  const material = new THREE.MeshStandardMaterial({
    color: 0xa9702f,
    metalness: 0.55,
    roughness: 0.38,
    emissive: 0x2a1608,
    emissiveIntensity: 0.4,
  });
  const shield = new THREE.Mesh(geometry, material);
  scene.add(shield);

  // Canvas texture with "ASH" engraved look, applied as a decal plane on the front face
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, 512, 512);
  c.font = '700 150px Fraunces, Georgia, serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = 'rgba(28,22,16,0.88)';
  c.fillText('ASH', 256, 250);
  c.strokeStyle = 'rgba(241,233,221,0.25)';
  c.lineWidth = 2;
  c.strokeText('ASH', 256, 250);

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

    // Proximity reaction — only tilts when cursor is near the shield's screen position
    const rect = stage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
    const radius = Math.min(rect.width, rect.height) * 0.5;

    if (dist < radius) {
      const nx = (e.clientX - cx) / radius;
      const ny = (e.clientY - cy) / radius;
      targetRotY = nx * 0.6;
      targetRotX = -ny * 0.4;
    } else {
      targetRotX = 0;
      targetRotY = 0;
    }
  });

  function animate() {
    requestAnimationFrame(animate);
    baseRotY += 0.0018;

    currentRotX += (targetRotX - currentRotX) * 0.06;
    currentRotY += (targetRotY - currentRotY) * 0.06;

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
