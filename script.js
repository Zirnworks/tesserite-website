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
