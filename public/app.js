/* UniBuddy site behaviour. Motion is enhancement only: content works without JavaScript. */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/* ---------- Navigation ---------- */
const menu = $('.menu-toggle');
const navigation = $('#navigation');
function closeMenu() {
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Open navigation');
  navigation.classList.remove('is-open');
}
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  navigation.classList.toggle('is-open', open);
});
$$('a', navigation).forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
window.matchMedia('(min-width: 821px)').addEventListener('change', closeMenu);
$('#year').textContent = new Date().getFullYear();

/* ---------- Launch / store links (unchanged behaviour) ---------- */
const config = window.UNIBUDDY_CONFIG || {};
function safePublicUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; }
  catch { return null; }
}
const newsletter = $('#newsletter-link');
const newsletterUrl = safePublicUrl(config.newsletterUrl);
if (newsletterUrl) {
  newsletter.href = newsletterUrl;
  newsletter.removeAttribute('aria-disabled');
  newsletter.textContent = 'Get launch updates ↗';
  newsletter.target = '_blank';
  newsletter.rel = 'noopener noreferrer';
  newsletter.setAttribute('aria-label', 'Get launch updates — opens subscription form in a new tab');
  $('#signup-note').textContent = 'Opens our subscription form on Brevo. Subscribe there to receive launch updates.';
} else {
  newsletter.addEventListener('click', event => event.preventDefault());
}
for (const [id, value, label] of [['android-link', config.androidUrl, 'Google Play'], ['ios-link', config.iosUrl, 'App Store']]) {
  const url = safePublicUrl(value);
  if (!url) continue;
  const badge = document.getElementById(id);
  const link = document.createElement('a');
  link.className = badge.className;
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', `Download UniBuddy on ${label} — opens in a new tab`);
  $('small', badge).textContent = 'DOWNLOAD ON';
  link.append(...badge.childNodes);
  badge.replaceWith(link);
}

/* ---------- Dialog ---------- */
const previewDialog = $('#preview-dialog');
$('#open-preview').addEventListener('click', () => previewDialog.showModal());
$$('dialog').forEach(dialog => {
  $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
});

/* ---------- Motion preference ---------- */
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const motionButton = $('.motion-toggle');
let pausedByVisitor = false;
const motionEnabled = () => !motionQuery.matches && !pausedByVisitor;

/* ---------- Scroll reveal ---------- */
const revealItems = $$('.section-heading, .card, .stack-card, .community-copy, .network-art, .preview-button, .faq-section > div, .launch-section, .footer-invitation, .footer-grid, .marquee');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  revealItems.forEach(item => {
    item.classList.add('reveal');
    if (item.classList.contains('network-art')) item.classList.add('reveal-side');
    // Stagger siblings inside a grid only; unrelated sections never wait.
    const siblings = item.parentElement.querySelectorAll(':scope > .card');
    if (item.classList.contains('card')) item.style.setProperty('--reveal-delay', `${[...siblings].indexOf(item) % 2 * 100}ms`);
    revealObserver.observe(item);
  });
  document.body.classList.add('motion-ready');
}

/* ---------- Story: words light up as you scroll ---------- */
const statement = $('[data-words]');
let words = [];
if (statement) {
  const text = statement.textContent.trim();
  statement.textContent = '';
  words = text.split(/\s+/).map(word => {
    const span = document.createElement('span');
    span.className = 'w';
    span.textContent = word;
    statement.append(span, ' ');
    return span;
  });
}

/* ---------- Active nav link ---------- */
const navLinks = $$('a', navigation);
const sections = navLinks.map(link => $(link.getAttribute('href'))?.closest('section') || $(link.getAttribute('href'))).filter(Boolean);
if ('IntersectionObserver' in window) {
  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => {
        const target = $(link.getAttribute('href'));
        link.classList.toggle('active', (target?.closest('section') || target) === entry.target);
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  new Set(sections).forEach(section => spy.observe(section));
}

/* ---------- Scroll frame: progress, header, parallax, word reveal ---------- */
const progress = $('.reading-progress');
const header = $('.site-header');
const chips = $$('.float-chip');
let framePending = false;
function renderFrame() {
  framePending = false;
  const y = window.scrollY;
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  progress.style.transform = `scaleX(${clamp(y / max, 0, 1)})`;
  header.classList.toggle('scrolled', y > 24);
  if (!motionEnabled()) return;
  if (y < window.innerHeight * 1.2) chips.forEach(chip => chip.style.setProperty('--py', `${-y * 0.04 * (Number(chip.dataset.depth) / 26)}px`));
  if (words.length) {
    const rect = statement.getBoundingClientRect();
    const start = window.innerHeight * 0.85;
    const end = window.innerHeight * 0.3;
    const p = clamp((start - rect.top) / (start - end + rect.height * 0.6), 0, 1);
    const lit = Math.round(p * words.length);
    words.forEach((word, index) => word.classList.toggle('on', index < lit));
  }
}
function scheduleFrame() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(renderFrame);
}
window.addEventListener('scroll', scheduleFrame, { passive: true });
window.addEventListener('resize', scheduleFrame, { passive: true });

/* ---------- Card spotlight + 3D tilt (fine pointers only) ---------- */
$$('[data-spot]').forEach(card => {
  card.addEventListener('pointermove', event => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    card.style.setProperty('--my', `${event.clientY - rect.top}px`);
  });
});
$$('[data-tilt]').forEach(element => {
  element.addEventListener('pointermove', event => {
    if (!motionEnabled() || !finePointer.matches) return;
    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    element.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.01)`;
  });
  element.addEventListener('pointerleave', () => { element.style.transform = ''; });
});

/* ---------- Focus-timer demo (real, interactive, nothing stored) ---------- */
const timer = $('[data-timer]');
if (timer) {
  const total = 25 * 60;
  const circumference = 327;
  const display = $('.t-time', timer);
  const arc = $('.t-fg', timer);
  const toggle = $('.t-toggle', timer);
  const reset = $('.t-reset', timer);
  let remaining = total;
  let interval = null;
  const paint = () => {
    display.textContent = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
    arc.style.strokeDashoffset = String(circumference * (1 - remaining / total));
  };
  const stop = () => { clearInterval(interval); interval = null; toggle.textContent = remaining === total ? 'Try it ▶' : 'Resume ▶'; toggle.setAttribute('aria-label', 'Start focus timer demo'); };
  toggle.addEventListener('click', () => {
    if (interval) { stop(); return; }
    toggle.textContent = 'Pause ❚❚';
    toggle.setAttribute('aria-label', 'Pause focus timer demo');
    interval = setInterval(() => {
      remaining -= 1;
      paint();
      if (remaining <= 0) { stop(); remaining = total; paint(); toggle.textContent = 'Again ▶'; }
    }, 1000);
  });
  reset.addEventListener('click', () => { stop(); remaining = total; paint(); });
  paint();
}

/* ---------- Pause / resume decorative motion ---------- */
function applyMotionPreference() {
  const paused = !motionEnabled();
  document.body.classList.toggle('motion-paused', paused);
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.textContent = motionQuery.matches ? 'Reduced motion enabled' : paused ? 'Resume decorative motion' : 'Pause decorative motion';
  motionButton.disabled = motionQuery.matches;
  scheduleFrame();
}
motionButton.addEventListener('click', () => { pausedByVisitor = !pausedByVisitor; applyMotionPreference(); });
motionQuery.addEventListener('change', applyMotionPreference);
applyMotionPreference();
