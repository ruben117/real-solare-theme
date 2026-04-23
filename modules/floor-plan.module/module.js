(function () {

  /**
   * Floor Plan – Real Solare
   * • Soporta 1 o varios planos con nav prev/next.
   * • Abre la imagen activa en lightbox al hacer clic.
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
      /* 'instant' bypasea scroll-behavior:smooth del CSS */
      window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' });
    }
  }

  function initFloorPlan(rootEl) {

    // ── Slides ───────────────────────────────────────────────
    var slides   = Array.from(rootEl.querySelectorAll('[data-fp-slide]'));
    var btnPrev  = rootEl.querySelector('[data-fp-prev]');
    var btnNext  = rootEl.querySelector('[data-fp-next]');
    var current  = 0;

    function goTo(index) {
      slides[current].classList.remove('is-active');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('is-active');
      updateNav();
    }

    function updateNav() {
      if (!btnPrev || !btnNext) return;
      btnPrev.disabled = current === 0;
      btnNext.disabled = current === slides.length - 1;
    }

    if (btnPrev) btnPrev.addEventListener('click', function () { goTo(current - 1); });
    if (btnNext) btnNext.addEventListener('click', function () { goTo(current + 1); });

    updateNav();

    // ── Lightbox ─────────────────────────────────────────────
    var lb       = rootEl.nextElementSibling; // div[data-fp-lightbox]
    // Fallback: buscar en el padre por si hay algo entre medias
    if (!lb || !lb.hasAttribute('data-fp-lightbox')) {
      lb = rootEl.parentElement && rootEl.parentElement.querySelector('[data-fp-lightbox]');
    }
    if (!lb) return;

    var lbImg    = lb.querySelector('[data-fp-lb-img]');
    var closeEls = Array.from(lb.querySelectorAll('[data-fp-close]'));
    var isOpen   = false;

    function open(imgSrc, imgAlt) {
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
    }

    // Clic en cada trigger abre el lightbox con la imagen del slide activo
    slides.forEach(function (slide) {
      var trigger = slide.querySelector('[data-fp-trigger]');
      if (!trigger) return;

      trigger.addEventListener('click', function () {
        var imgSrc = trigger.getAttribute('data-fp-img') || '';
        var imgAlt = trigger.getAttribute('data-fp-alt') || '';
        open(imgSrc, imgAlt);
      });

      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          var imgSrc = trigger.getAttribute('data-fp-img') || '';
          var imgAlt = trigger.getAttribute('data-fp-alt') || '';
          open(imgSrc, imgAlt);
        }
      });
    });

    closeEls.forEach(function (el) { el.addEventListener('click', close); });

    document.addEventListener('keydown', function (e) {
      if (isOpen && e.key === 'Escape') close();
    });
  }

  function init() {
    document.querySelectorAll('[data-fp-root]').forEach(initFloorPlan);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
