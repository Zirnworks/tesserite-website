/* =============================================
   Animated Dot Grid — Simplex noise cloud
   Warm gray base dots, light blue where noise is dense
   ============================================= */
(() => {
  const canvas = document.getElementById('dot-grid');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // --- Config ---
  const SPACING = 24;
  const DOT_RADIUS = 0.8;
  const BASE_ALPHA = 0.45;

  // Colors
  const BASE_R = 58, BASE_G = 53, BASE_B = 46;       // #3a352e warm gray
  const GLOW_R = 120, GLOW_G = 170, GLOW_B = 220;    // light blue

  // Noise field
  const NOISE_SCALE = 0.008;     // cloud size (smaller = larger blobs)
  const TIME_SPEED = 0.0004;     // animation speed
  const THRESHOLD = 0.70;        // top 30% of noise values get color

  // --- Simplex 2D (compact implementation) ---
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;

  // Permutation table
  const perm = new Uint8Array(512);
  const grad = [
    [1,1],[-1,1],[1,-1],[-1,-1],
    [1,0],[-1,0],[0,1],[0,-1]
  ];

  // Seed once
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  function dot2(g, x, y) { return g[0] * x + g[1] * y; }

  function simplex2(x, y) {
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const t = (i + j) * G2;
    const X0 = i - t, Y0 = j - t;
    const x0 = x - X0, y0 = y - Y0;

    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;

    const ii = i & 255, jj = j & 255;

    let n0 = 0, n1 = 0, n2 = 0;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) {
      t0 *= t0;
      const gi = perm[ii + perm[jj]] & 7;
      n0 = t0 * t0 * dot2(grad[gi], x0, y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) {
      t1 *= t1;
      const gi = perm[ii + i1 + perm[jj + j1]] & 7;
      n1 = t1 * t1 * dot2(grad[gi], x1, y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) {
      t2 *= t2;
      const gi = perm[ii + 1 + perm[jj + 1]] & 7;
      n2 = t2 * t2 * dot2(grad[gi], x2, y2);
    }

    // Returns -1..1, normalize to 0..1
    return (70 * (n0 + n1 + n2) + 1) * 0.5;
  }

  // Fractal brownian motion for richer cloud texture
  function fbm(x, y) {
    let val = 0, amp = 0.6, freq = 1;
    for (let i = 0; i < 3; i++) {
      val += amp * simplex2(x * freq, y * freq);
      freq *= 2.2;
      amp *= 0.45;
    }
    return val;
  }

  // --- Resize ---
  let w, h, dpr;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resize);
  resize();

  // --- Animation loop ---
  function draw(time) {
    ctx.clearRect(0, 0, w, h);

    const t = time * TIME_SPEED;
    const cols = Math.ceil(w / SPACING) + 1;
    const rows = Math.ceil(h / SPACING) + 1;

    for (let row = 0; row < rows; row++) {
      const py = row * SPACING;
      for (let col = 0; col < cols; col++) {
        const px = col * SPACING;

        // Sample noise at this dot's position
        const n = fbm(px * NOISE_SCALE + t, py * NOISE_SCALE + t * 0.7);

        let r, g, b, a;

        if (n > THRESHOLD) {
          // Map the above-threshold portion to 0..1 blend factor
          const blend = (n - THRESHOLD) / (1 - THRESHOLD);
          const eased = blend * blend; // ease-in for smoother transition
          r = BASE_R + (GLOW_R - BASE_R) * eased;
          g = BASE_G + (GLOW_G - BASE_G) * eased;
          b = BASE_B + (GLOW_B - BASE_B) * eased;
          a = BASE_ALPHA + (0.7 - BASE_ALPHA) * eased;
        } else {
          r = BASE_R;
          g = BASE_G;
          b = BASE_B;
          a = BASE_ALPHA;
        }

        ctx.fillStyle = `rgba(${r|0},${g|0},${b|0},${a})`;
        ctx.beginPath();
        ctx.arc(px, py, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
})();
