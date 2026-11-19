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
$('#open-preview')?.addEventListener('click', () => previewDialog.showModal());
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

/* ---------- Round 2: rotating word, particle network, cursor glow, magnet, confetti ---------- */
const rotatorWord = $('.rotator .word');
if (rotatorWord) {
  const list = ['people.', 'notes.', 'spots.', 'circle.', 'buddies.'];
  let n = 0;
  setInterval(() => {
    if (!motionEnabled() || document.hidden) return;
    rotatorWord.classList.add('out');
    setTimeout(() => {
      n = (n + 1) % list.length;
      rotatorWord.textContent = list[n];
      rotatorWord.classList.remove('out');
    }, 380);
  }, 2600);
}

const canvas = $('.net');
if (canvas && canvas.getContext) {
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dots = [];
  const mouse = { x: -999, y: -999 };
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = () => {
    const r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(clamp(w * h / 14000, 20, 70));
    dots = Array.from({ length: count }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35 }));
  };
  const hero = $('.hero');
  hero.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
  let visible = true;
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(canvas);
  const draw = () => {
    requestAnimationFrame(draw);
    if (!visible || !motionEnabled()) return;
    ctx.clearRect(0, 0, w, h);
    for (const d of dots) {
      d.x += d.vx; d.y += d.vy;
      if (d.x < 0 || d.x > w) d.vx *= -1;
      if (d.y < 0 || d.y > h) d.vy *= -1;
      const dx = mouse.x - d.x, dy = mouse.y - d.y;
      if (Math.hypot(dx, dy) < 140) { d.x += dx * .006; d.y += dy * .006; }
    }
    for (let i = 0; i < dots.length; i++) {
      const a = dots[i];
      ctx.fillStyle = 'rgba(255,178,60,.8)';
      ctx.beginPath(); ctx.arc(a.x, a.y, 1.8, 0, 6.283); ctx.fill();
      for (let j = i + 1; j < dots.length; j++) {
        const b = dots[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 130) { ctx.strokeStyle = `rgba(255,138,53,${(1 - d / 130) * .35})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      const m = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (m < 170) { ctx.strokeStyle = `rgba(61,232,180,${(1 - m / 170) * .6})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
    }
  };
  size(); draw();
  window.addEventListener('resize', size, { passive: true });
}

const glow = $('.cursor-glow');
if (glow && finePointer.matches) {
  window.addEventListener('pointermove', e => {
    glow.classList.add('on');
    glow.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => glow.classList.remove('on'));
}

if (finePointer.matches) {
  $$('.button:not([aria-disabled=true]), .round-link, .footer-arrow').forEach(el => {
    const target = el.classList.contains('footer-arrow') ? el.parentElement : el;
    target.addEventListener('pointermove', e => {
      if (!motionEnabled()) return;
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`;
    });
    target.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

function confetti(x, y) {
  if (!motionEnabled()) return;
  const colors = ['#ffb23c', '#ff6a1a', '#3de8b4', '#8b6cff', '#ff3f6c'];
  for (let i = 0; i < 32; i++) {
    const piece = document.createElement('i');
    piece.className = 'confetti';
    piece.style.background = colors[i % colors.length];
    piece.style.left = `${x}px`; piece.style.top = `${y}px`;
    document.body.append(piece);
    const angle = Math.random() * Math.PI * 2, speed = 120 + Math.random() * 220;
    const anim = piece.animate([
      { transform: 'translate(0,0) rotate(0)', opacity: 1 },
      { transform: `translate(${Math.cos(angle) * speed}px,${Math.sin(angle) * speed + 160}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
    ], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.8,.3,1)' });
    anim.onfinish = () => piece.remove();
  }
}
$$('.t-toggle').forEach(btn => btn.addEventListener('click', () => { const r = btn.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top); }));
$$('.orb.you, .follow').forEach(el => el.addEventListener('click', () => { const r = el.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2); }));

/* scroll-linked extras */
let lastY = window.scrollY;
const marquees = $$('.marquee');
const stackCards = $$('.stack-card');
const previewImg = $('.preview-button img');
const stickers = $$('.sticker');
function extraFrame() {
  requestAnimationFrame(extraFrame);
  if (!motionEnabled()) return;
  const y = window.scrollY, v = clamp((y - lastY) * .12, -4, 4);
  lastY = y;
  marquees.forEach(m => m.style.setProperty('--skew', `${v.toFixed(2)}deg`));
  stackCards.forEach((card, i) => {
    const next = stackCards[i + 1];
    if (!next || window.innerWidth <= 820) { card.style.setProperty('--sc', 1); return; }
    const gap = clamp((next.getBoundingClientRect().top - card.getBoundingClientRect().top) / 360, 0, 1);
    card.style.setProperty('--sc', (0.94 + gap * 0.06).toFixed(3));
  });
  if (previewImg) {
    const r = previewImg.parentElement.getBoundingClientRect();
    previewImg.style.setProperty('--pp', `${clamp((r.top + r.height / 2 - window.innerHeight / 2) * -.06, -40, 40).toFixed(1)}px`);
  }
  if (y < window.innerHeight * 1.5) stickers.forEach((s, i) => s.style.setProperty('--sy', `${(y * (i % 2 ? -.05 : .07)).toFixed(1)}px`));
}
extraFrame();

/* ---------- App showcase: tabs, auto-play, mini focus timer, follow + theme toggles ---------- */
(() => {
  const root = $('[data-showcase]');
  if (!root) return;
  const tabs = $$('.show-tab', root);
  const screens = $$('.screen', root);
  const navItems = $$('[data-nav]', root);
  const phone = $('.phone', root);
  const durations = { home: 7500, map: 7000, notes: 7000, focus: 7500, students: 6500, chat: 9000, reviews: 7000, settings: 9000 };
  let current = 0;
  let elapsed = 0;
  let hovering = false;
  let inView = false;
  let last = performance.now();
  let focusTick = null;

  function stopFocusDemo() { clearInterval(focusTick); focusTick = null; }
  function startFocusDemo(screen) {
    const time = $('.f-time', screen), arc = $('.fr-fg', screen), main = $('.f-main', screen);
    const total = 25 * 60;
    let remaining = total;
    const paint = () => {
      time.textContent = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
      arc.style.strokeDashoffset = String(327 * (1 - remaining / total));
    };
    main.textContent = 'Start focus';
    paint();
    stopFocusDemo();
    setTimeout(() => { main.textContent = 'Pause'; }, 900);
    focusTick = setInterval(() => {
      if (!motionEnabled()) return;
      remaining = remaining <= 40 ? total : remaining - 40;
      paint();
    }, 500);
  }

  function activate(index, fromUser) {
    current = (index + tabs.length) % tabs.length;
    elapsed = 0;
    const name = tabs[current].dataset.go;
    tabs.forEach((tab, i) => {
      const on = i === current;
      tab.classList.toggle('active', on);
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      $('.tab-bar', tab).style.transform = 'scaleX(0)';
    });
    let activeScreen = null;
    screens.forEach(screen => {
      const on = screen.dataset.screen === name;
      screen.classList.toggle('active', on);
      screen.toggleAttribute('inert', !on);
      screen.setAttribute('aria-hidden', String(!on));
      if (on) activeScreen = screen;
    });
    navItems.forEach(item => item.classList.toggle('on', item.dataset.nav === activeScreen.dataset.tab));
    stopFocusDemo();
    if (name === 'focus') startFocusDemo(activeScreen);
    if (fromUser && window.innerWidth <= 900) tabs[current].scrollIntoView({ inline: 'center', block: 'nearest', behavior: motionEnabled() ? 'smooth' : 'auto' });
    else if (window.innerWidth <= 900) tabs[current].parentElement.scrollTo({ left: tabs[current].offsetLeft - 20, behavior: 'smooth' });
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activate(i, true));
    tab.addEventListener('keydown', event => {
      const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      activate(i + step, true);
      tabs[current].focus();
    });
  });

  root.addEventListener('pointerenter', () => { hovering = true; });
  root.addEventListener('pointerleave', () => { hovering = false; });
  root.addEventListener('focusin', () => { hovering = true; });
  root.addEventListener('focusout', () => { hovering = false; });
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting; }, { threshold: 0.25 }).observe(root);

  function loop(now) {
    requestAnimationFrame(loop);
    const dt = now - last;
    last = now;
    if (!inView || hovering || document.hidden || !motionEnabled()) return;
    elapsed += dt;
    const total = durations[tabs[current].dataset.go] || 7000;
    $('.tab-bar', tabs[current]).style.transform = `scaleX(${clamp(elapsed / total, 0, 1)})`;
    if (elapsed >= total) activate(current + 1, false);
  }
  requestAnimationFrame(loop);

  /* Follow buttons */
  $$('.fol', root).forEach(btn => btn.addEventListener('click', () => {
    const on = btn.classList.toggle('is');
    btn.textContent = on ? 'Following' : 'Follow';
    if (on) { const r = btn.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2); }
  }));

  /* Theme switch actually restyles the phone */
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const seg = $$('.seg button', root);
  function setTheme(mode) {
    const dark = mode === 'dark' || (mode === 'system' && systemDark.matches);
    phone.classList.toggle('dark', dark);
    phone.classList.toggle('light', !dark);
    seg.forEach(button => button.classList.toggle('on', button.dataset.theme === mode));
  }
  seg.forEach(button => button.addEventListener('click', () => setTheme(button.dataset.theme)));

  activate(0, false);
})();
