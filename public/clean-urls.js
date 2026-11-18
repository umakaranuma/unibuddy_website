/* Keeps the address bar clean: in-page links scroll to their section without adding #hash to the URL. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clean = () => history.replaceState(null, '', location.pathname + location.search);
  function go(id, smooth) {
    const target = id ? document.getElementById(decodeURIComponent(id)) : document.body;
    if (!target) return false;
    if (id === 'home' || !id) window.scrollTo({ top: 0, behavior: smooth && !reduce.matches ? 'smooth' : 'auto' });
    else target.scrollIntoView({ behavior: smooth && !reduce.matches ? 'smooth' : 'auto', block: 'start' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    return true;
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    if (go(link.getAttribute('href').slice(1), true)) { event.preventDefault(); clean(); }
  });
  // Someone opened a shared link that still carries a #hash: jump there, then tidy the URL.
  const tidy = () => { if (location.hash.length > 1 && go(location.hash.slice(1), false)) clean(); };
  if (document.readyState === 'complete') tidy(); else window.addEventListener('load', tidy);
})();
