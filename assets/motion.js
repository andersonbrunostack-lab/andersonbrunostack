(() => {
  'use strict';
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  if (!Element.prototype.animate || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('motion-enabled');

  const seen = new WeakSet();
  const running = new Set();
  const ease = 'cubic-bezier(.25,.8,.25,1)';
  function play(element, frames, options) {
    if (preference.matches) return null;
    const animation = element.animate(frames, { easing: ease, fill: 'backwards', ...options });
    running.add(animation);
    const cleanup = () => running.delete(animation);
    animation.addEventListener('finish', cleanup, { once: true });
    animation.addEventListener('cancel', cleanup, { once: true });
    return animation;
  }

  function enter(element, index = 0, initial = false, forcedType = '') {
    if (seen.has(element)) return;
    seen.add(element);
    const type = forcedType || (
      element.matches('.card') ? 'card' : element.matches('.step') ? 'step' :
      element.matches('.brand-panel') ? 'brand' : element.matches('.contact-box') ? 'form' :
      element.matches('.faq-list details') ? 'faq' : element.matches('h1,h2,h3') ? 'heading' :
      element.matches('.eyebrow') ? 'eyebrow' : element.matches('.button,.contact-links,.actions') ? 'action' :
      element.matches('p,.lead') ? 'copy' : element.matches('.checks') ? 'list' : 'section'
    );
    const stagger = Math.min(index * 65, 195);
    const distance = type === 'eyebrow' || type === 'copy' || type === 'form' || type === 'faq'
      ? (type === 'form' ? 10 : 7)
      : type === 'card' || type === 'step' || type === 'brand' || type === 'list' ? 12 : 15;
    const horizontal = type === 'eyebrow' || type === 'copy' || type === 'form' || type === 'faq' ||
      (type === 'card' && index % 2 === 1) || (type === 'step' && index % 2 === 1);
    const from = type === 'header' ? '0 -10px' : horizontal ? `${type === 'eyebrow' || type === 'copy' ? -distance : distance}px 0` : `0 ${distance}px`;
    const duration = type === 'header' ? 640 : type === 'heading' ? 760 : type === 'brand' || type === 'form' ? 720 : 660;
    // Fades and short, understated movement keep the content calm and readable.
    play(element, [
      { translate: from, opacity: .35 },
      { translate: '0 0', opacity: 1 },
    ], { delay: initial ? Math.min(index * 46, 138) : stagger, duration });
  }

  const intro = document.querySelectorAll('.hero-copy > *, .page-head .breadcrumb, .page-head .reveal > *');
  intro.forEach((element, index) => {
    const type = element.matches('.eyebrow') ? 'eyebrow' : element.matches('h1') ? 'heading' :
      element.matches('.lead,.hero-copy p') ? 'copy' : element.matches('.button,.actions') ? 'action' : 'section';
    enter(element, index, true, type);
  });

  const targets = new Set();
  document.querySelectorAll('.reveal').forEach(block => {
    if (block.closest('.page-head')) return;
    if (block.matches('.center')) [...block.children].forEach(child => targets.add(child));
    else if (block.matches('.faq-group')) {
      const heading = block.querySelector(':scope > h2');
      if (heading) targets.add(heading);
    } else targets.add(block);
  });
  document.querySelectorAll('.faq-list details,.footer-grid > div').forEach(element => targets.add(element));

  let sequence = 0;
  const observer = new IntersectionObserver(entries => {
    entries.filter(entry => entry.isIntersecting).forEach(entry => {
      enter(entry.target, sequence++);
      observer.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -24px 0px' });
  let initialIndex = 0;
  targets.forEach(element => {
    const rect = element.getBoundingClientRect();
    if (rect.top < innerHeight && rect.bottom > 0) enter(element, initialIndex++, true);
    else observer.observe(element);
  });

  // FAQ opens and closes at its actual content height, without a separate stock fade.
  document.querySelectorAll('.faq-list details').forEach(details => {
    const summary = details.querySelector('summary');
    let animation = null;
    let wantedOpen = details.open;
    summary.addEventListener('click', event => {
      if (preference.matches) return;
      event.preventDefault();
      const start = details.getBoundingClientRect().height;
      wantedOpen = !wantedOpen;
      animation?.cancel();
      details.open = true;
      const end = wantedOpen ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height + 1;
      details.style.overflow = 'hidden';
      animation = play(details, [{ height: `${start}px` }, { height: `${end}px` }], { duration: 470, easing: 'cubic-bezier(.33,1,.68,1)' });
      if (!animation) { details.open = wantedOpen; details.style.overflow = ''; return; }
      animation.onfinish = () => { details.open = wantedOpen; details.style.overflow = ''; animation = null; };
      animation.oncancel = () => { details.style.overflow = ''; };
    });
  });

  preference.addEventListener('change', () => {
    if (!preference.matches) return;
    running.forEach(animation => animation.finish());
    observer.disconnect();
  });
  addEventListener('pagehide', () => running.forEach(animation => animation.finish()));
})();
