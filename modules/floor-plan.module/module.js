(function () {

  /**
   * Floor Plan – Real Solare
   * Abre la imagen de distribución en un lightbox al hacer clic.
   */

  var scrollLockCount = 0;

  function lockScroll() {
    if (++scrollLockCount === 1) {
      var scrollY = window.scrollY;
      document.body.style.cssText += 'overflow:hidden;position:fixed;top:-' + scrollY + 'px;width:100%;';
      document.body.dataset.scrollY = scrollY;
    }
  }

  function unlockScroll() {
    if (--scrollLockCount <= 0) {
      scrollLockCount = 0;
      var scrollY = parseInt(document.body.dataset.scrollY || '0', 10);
      document.body.style.cssText = document.body.style.cssText
        .replace(/overflow:[^;]+;/, '')
        .replace(/position:[^;]+;/, '')
        .replace(/top:[^;]+;/, '')
        .replace(/width:[^;]+;/, '');
      window.scrollTo(0, scrollY);
    }
  }

  function initFloorPlan(triggerEl) {
    // Busca el lightbox en el mismo módulo (hermano del wrapper .floor-plan)
    var wrapper   = triggerEl.closest('.floor-plan');
    var container = wrapper ? wrapper.parentElement : document.body;
    var lb        = container.querySelector('[data-fp-lightbox]');
    if (!lb) return;

    var lbImg    = lb.querySelector('[data-fp-lb-img]');
    var closeEls = Array.from(lb.querySelectorAll('[data-fp-close]'));
    var isOpen   = false;

    function open() {
      var imgSrc = triggerEl.getAttribute('data-fp-img') || '';
      var imgAlt = triggerEl.getAttribute('data-fp-alt') || '';

      lbImg.classList.add('is-loading');
      lbImg.onload = function () { lbImg.classList.remove('is-loading'); };
      lbImg.src = imgSrc;
      lbImg.alt = imgAlt;

      lb.removeAttribute('aria-hidden');
      lb.classList.add('is-open');
      isOpen = true;
      lockScroll();

      var closeBtn = lb.querySelector('.floor-plan__lb-close');
      if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 50);
    }

    function close() {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      isOpen = false;
      unlockScroll();
      triggerEl.focus();
    }

    // Abrir al clic
    triggerEl.addEventListener('click', open);

    // Enter / Space
    triggerEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });

    // Cerrar: overlay y botón X
    closeEls.forEach(function (el) { el.addEventListener('click', close); });

    // Escape
    document.addEventListener('keydown', function (e) {
      if (isOpen && e.key === 'Escape') close();
    });
  }

  function init() {
    document.querySelectorAll('[data-fp-trigger]').forEach(initFloorPlan);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
