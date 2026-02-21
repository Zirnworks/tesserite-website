/* Tesserite Landing — Interactions */

// --- Mobile nav toggle ---
const toggle = document.getElementById('nav-toggle');
const links = document.getElementById('nav-links');

toggle?.addEventListener('click', () => {
  links.classList.toggle('open');
  const open = links.classList.contains('open');
  const spans = toggle.querySelectorAll('span');
  spans[0].style.transform = open ? 'rotate(45deg) translate(5px, 5px)' : '';
  spans[1].style.opacity = open ? '0' : '1';
  spans[2].style.transform = open ? 'rotate(-45deg) translate(5px, -5px)' : '';
});

// Close mobile nav on link click
links?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    links.classList.remove('open');
    const spans = toggle.querySelectorAll('span');
    spans[0].style.transform = '';
    spans[1].style.opacity = '1';
    spans[2].style.transform = '';
  });
});

// --- Scroll-triggered card reveal ---
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.card').forEach(card => observer.observe(card));

// --- Grid connectors (SVG overlay) ---
function drawGridConnectors() {
  const grid = document.querySelector('.grid-6');
  if (!grid) return;

  // Remove previous SVG
  const old = grid.querySelector('.grid-connectors');
  if (old) old.remove();

  const cards = Array.from(grid.querySelectorAll('.grid-card'));
  const gridRect = grid.getBoundingClientRect();

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('grid-connectors');
  svg.setAttribute('width', gridRect.width);
  svg.setAttribute('height', gridRect.height);
  svg.style.position = 'absolute';
  svg.style.top = '0';
  svg.style.left = '0';
  svg.style.pointerEvents = 'none';
  svg.style.overflow = 'visible';

  const color = '#3a3f54';
  const dotR = 3;

  // Find horizontally adjacent pairs
  for (let i = 0; i < cards.length; i++) {
    const a = cards[i].getBoundingClientRect();
    for (let j = i + 1; j < cards.length; j++) {
      const b = cards[j].getBoundingClientRect();

      // Check vertical overlap
      const overlapTop = Math.max(a.top, b.top);
      const overlapBot = Math.min(a.bottom, b.bottom);
      if (overlapBot - overlapTop < 20) continue;

      // Check horizontal gap is roughly the grid gap
      const left = a.right < b.left ? a : b;
      const right = a.right < b.left ? b : a;
      const gap = right.left - left.right;
      if (gap < 8 || gap > 60) continue;

      // Draw connector at vertical midpoint of overlap
      const midY = (overlapTop + overlapBot) / 2 - gridRect.top;
      const x1 = left.right - gridRect.left;
      const x2 = right.left - gridRect.left;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', midY);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', midY);
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);

      [x1, x2].forEach(cx => {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', cx);
        dot.setAttribute('cy', midY);
        dot.setAttribute('r', dotR);
        dot.setAttribute('fill', color);
        svg.appendChild(dot);
      });
    }
  }

  grid.style.position = 'relative';
  grid.appendChild(svg);
}

// Draw on load and resize
window.addEventListener('load', drawGridConnectors);
window.addEventListener('resize', drawGridConnectors);

// --- Email signup form handler ---
document.querySelectorAll('.nav-signup, .hero-signup').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector('button[type="submit"]');
    const email = input.value.trim();
    if (!email) return;

    // Clear previous feedback
    const oldMsg = form.querySelector('.signup-msg');
    if (oldMsg) oldMsg.remove();

    const originalText = button.textContent;
    button.textContent = 'Sending\u2026';
    button.disabled = true;
    input.disabled = true;

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      const msg = document.createElement('span');
      msg.className = 'signup-msg';

      if (data.ok) {
        msg.classList.add('signup-msg--success');
        msg.textContent = data.message;
        input.value = '';
        setTimeout(() => msg.remove(), 6000);
      } else {
        msg.classList.add('signup-msg--error');
        msg.textContent = data.message || 'Something went wrong. Please try again.';
      }
      form.appendChild(msg);

    } catch {
      const msg = document.createElement('span');
      msg.className = 'signup-msg signup-msg--error';
      msg.textContent = 'Network error. Please try again.';
      form.appendChild(msg);
    } finally {
      button.textContent = originalText;
      button.disabled = false;
      input.disabled = false;
    }
  });
});
