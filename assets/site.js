(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.header');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#navigation');
  const setMenu = open => {
    nav?.classList.toggle('is-open', open);
    toggle?.setAttribute('aria-expanded', String(open));
    if (toggle) toggle.textContent = open ? 'Fechar ×' : 'Menu ☰';
  };
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
      setMenu(false); toggle.focus();
    }
  });
  nav?.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  matchMedia('(min-width: 901px)').addEventListener('change', () => setMenu(false));

  const progress = document.querySelector('.progress');
  const backTop = document.querySelector('.back-top');
  let scheduled = false;
  function updateScroll() {
    const y = window.scrollY;
    header?.classList.toggle('scrolled', y > 8);
    backTop?.classList.toggle('visible', y > 600);
    const distance = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${distance > 0 ? Math.min(y / distance, 1) : 0})`;
    scheduled = false;
  }
  const requestUpdate = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateScroll); } };
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', requestUpdate);
  updateScroll();
  backTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    document.querySelector('.skip')?.focus({ preventScroll: true });
  });

  const config = window.SITE_CONFIG || {};
  const phone = String(config.whatsapp || '').replace(/\D/g, '');
  const whatsapp = /^\d{10,15}$/.test(phone) ? `https://wa.me/${phone}` : '';
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email || '') ? config.email : '';
  document.querySelectorAll('[data-contact-links]').forEach(container => {
    for (const [label, href] of [['Conversar pelo WhatsApp', whatsapp], ['Enviar e-mail', email && `mailto:${email}`]]) {
      if (!href) continue;
      const link = document.createElement('a'); link.className = 'button'; link.textContent = label; link.href = href;
      container.append(link);
    }
  });
  document.querySelectorAll('[data-contact-details]').forEach(container => {
    for (const [label, value] of [['Endereço', config.address], ['Horário', config.hours]]) {
      if (value) { const line = document.createElement('p'); line.textContent = `${label}: ${value}`; container.append(line); }
    }
  });
  const form = document.querySelector('#contact-form');
  const status = document.querySelector('#form-status');
  const submit = form?.querySelector('button[type="submit"]');
  if (submit && (whatsapp || email)) {
    submit.disabled = false; submit.textContent = whatsapp ? 'Continuar no WhatsApp' : 'Continuar no e-mail';
    document.querySelector('#contact-unavailable')?.setAttribute('hidden', '');
    if (status) status.textContent = 'Revise e confirme o envio no aplicativo que será aberto.';
  }
  form?.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity() || !(whatsapp || email)) return;
    const values = new FormData(form);
    const message = `Olá, gostaria de informações sobre atendimento.\nNome: ${values.get('name')}\nE-mail: ${values.get('email')}\nTelefone: ${values.get('phone')}\n\n${values.get('message')}`;
    location.href = whatsapp ? `${whatsapp}?text=${encodeURIComponent(message)}` : `mailto:${email}?subject=${encodeURIComponent('Solicitação de atendimento')}&body=${encodeURIComponent(message)}`;
    status.textContent = 'Continue no aplicativo para confirmar o envio. Este site não armazena a mensagem.';
  });
})();
