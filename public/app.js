const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
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
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);
document.querySelector('#year').textContent = new Date().getFullYear();

const config = window.UNIBUDDY_CONFIG || {};
function safePublicUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; }
  catch { return null; }
}
const newsletter = document.querySelector('#newsletter-link');
const newsletterUrl = safePublicUrl(config.newsletterUrl);
if (newsletterUrl) {
  newsletter.href = newsletterUrl;
  newsletter.removeAttribute('aria-disabled');
  newsletter.textContent = 'Get launch updates ↗';
  newsletter.target = '_blank';
  newsletter.rel = 'noopener noreferrer';
  newsletter.setAttribute('aria-label', 'Get launch updates — opens subscription form in a new tab');
  document.querySelector('#signup-note').textContent = 'Opens our subscription form on Brevo. Subscribe there to receive launch updates.';
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
  const small = badge.querySelector('small');
  small.textContent = 'DOWNLOAD ON';
  link.append(...badge.childNodes);
  badge.replaceWith(link);
}

const previewDialog = document.querySelector('#preview-dialog');
document.querySelector('#open-preview').addEventListener('click', () => previewDialog.showModal());
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }});
});
// Motion is enhancement only: content remains readable without JavaScript.
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktopQuery = window.matchMedia('(min-width: 761px)');
const motionButton = document.querySelector('.motion-toggle');
let pausedByVisitor = false;
const motionEnabled = () => !motionQuery.matches && !pausedByVisitor;
const storySection = document.querySelector('.journey-section');
const storySticky = document.querySelector('.journey-sticky');
const storyViewport = document.querySelector('.journey-viewport');
const panels = [...document.querySelectorAll('.journey-panel')];
const counter = document.querySelector('.journey-counter');
let activeStory = 0;
let framePending = false;
let storyStart = 0;
let storyDistance = 1;
let maxHorizontal = 0;
let pageDistance = 1;
let storyInView = false;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const revealItems = [...document.querySelectorAll('.story > div, .section-heading, .feature-card, .community-copy, .network-art, .preview-button, .faq-section > div, .launch-content, .footer-invitation, .footer-grid')];
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -25px 0px' });
  revealItems.forEach((item, index) => {
    item.classList.add('reveal');
    if (item.classList.contains('network-art')) item.classList.add('reveal-side');
    // Stagger only adjacent cards; do not delay unrelated page sections.
    item.style.setProperty('--reveal-delay', item.classList.contains('feature-card') ? `${index % 2 * 90}ms` : '0ms');
    revealObserver.observe(item);
  });
  document.body.classList.add('motion-ready');
  const storyObserver = new IntersectionObserver(entries => { storyInView = entries[0].isIntersecting; scheduleFrame(); }, { rootMargin: '100px' });
  storyObserver.observe(storySection);
}
function measure() {
  storyStart = storySection.getBoundingClientRect().top + window.scrollY - 95;
  storyDistance = Math.max(1, storySection.offsetHeight - storySticky.offsetHeight);
  maxHorizontal = storyViewport.scrollWidth - storyViewport.clientWidth;
  pageDistance = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  scheduleFrame();
}
function updateCounter(index) {
  activeStory = clamp(index, 0, panels.length - 1);
  counter.textContent = `${String(activeStory + 1).padStart(2, '0')} / 03`;
  document.querySelector('.journey-prev').disabled = activeStory === 0;
  document.querySelector('.journey-next').disabled = activeStory === panels.length - 1;
}
function renderMotion() {
  framePending = false;
  const y = window.scrollY;
  document.querySelector('.reading-progress').style.transform = `scaleX(${clamp(y / pageDistance, 0, 1)})`;
  if (motionEnabled() && desktopQuery.matches) {
    if (y < window.innerHeight * 1.5) document.querySelector('.hero-visual').style.setProperty('--hero-drift', `${clamp(y * 0.045, 0, 28)}px`);
    if (storyInView) {
      const progress = clamp((y - storyStart) / storyDistance, 0, 1);
      storyViewport.scrollLeft = progress * maxHorizontal;
      updateCounter(Math.round(progress * (panels.length - 1)));
    }
  }
}
function scheduleFrame() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(renderMotion);
}
function goToStory(index) {
  const target = clamp(index, 0, panels.length - 1);
  if (desktopQuery.matches && motionEnabled()) {
    window.scrollTo({ top: storyStart + storyDistance * (target / (panels.length - 1)), behavior: 'smooth' });
  } else {
    const panel = panels[target];
    const panelOffset = panel.offsetLeft - (storyViewport.clientWidth - panel.clientWidth) / 2;
    storyViewport.scrollTo({ left: panelOffset, behavior: motionEnabled() ? 'smooth' : 'instant' });
    updateCounter(target);
  }
}
document.querySelector('.journey-prev').addEventListener('click', () => goToStory(activeStory - 1));
document.querySelector('.journey-next').addEventListener('click', () => goToStory(activeStory + 1));
storyViewport.addEventListener('keydown', event => {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
  event.preventDefault();
  goToStory(activeStory + (event.key === 'ArrowRight' ? 1 : -1));
});
storyViewport.addEventListener('scroll', () => {
  if (desktopQuery.matches && motionEnabled()) return;
  const center = storyViewport.scrollLeft + storyViewport.clientWidth / 2;
  let closest = 0;
  panels.forEach((panel, index) => {
    if (Math.abs(panel.offsetLeft + panel.clientWidth / 2 - center) < Math.abs(panels[closest].offsetLeft + panels[closest].clientWidth / 2 - center)) closest = index;
  });
  updateCounter(closest);
}, { passive:true });
function applyMotionPreference() {
  const paused = !motionEnabled();
  document.body.classList.toggle('motion-paused', paused);
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.textContent = motionQuery.matches ? 'Reduced motion enabled' : paused ? 'Resume decorative motion' : 'Pause decorative motion';
  motionButton.disabled = motionQuery.matches;
  measure();
}
motionButton.addEventListener('click', () => { pausedByVisitor = !pausedByVisitor; applyMotionPreference(); });
motionQuery.addEventListener('change', applyMotionPreference);
desktopQuery.addEventListener('change', measure);
window.addEventListener('scroll', scheduleFrame, { passive:true });
window.addEventListener('resize', measure, { passive:true });
window.addEventListener('load', measure, { once:true });
if (document.fonts) document.fonts.ready.then(measure);
if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
applyMotionPreference();
updateCounter(0);
