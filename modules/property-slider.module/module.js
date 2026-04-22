(function () {

  /**
   * Property Slider + Lightbox – Real Solare
   * • Slider: dots + swipe/drag
   * • Lightbox: abre al clic en tarjeta, navega con flechas / teclado / swipe
   */

  // ── Bloqueo de scroll del body ─────────────────────────────
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
      window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' });
    }
  }

  // ── Inicializar un slider ──────────────────────────────────
  function initSlider(sliderEl) {
    var track      = sliderEl.querySelector('[data-prop-slider-track]');
    var viewport   = sliderEl.querySelector('.prop-slider__viewport');
    var dotsWrap   = sliderEl.querySelector('[data-prop-slider-dots]');
    var slides     = Array.from(sliderEl.querySelectorAll('.prop-slider__slide'));
    var dots       = dotsWrap ? Array.from(dotsWrap.querySelectorAll('[data-prop-slider-dot]')) : [];
    var cards      = Array.from(sliderEl.querySelectorAll('[data-lightbox-trigger]'));
    var navPrev    = sliderEl.querySelector('[data-prop-slider-prev]');
    var navNext    = sliderEl.querySelector('[data-prop-slider-next]');

    if (!track || slides.length < 1) return;

    var currentIndex  = 0;
    var currentOffset = 0;
    var totalSlides   = slides.length;

    // ── Máximo desplazamiento posible (sin dejar espacio vacío) ─
    function getMaxOffset() {
      return Math.max(0, track.scrollWidth - viewport.clientWidth);
    }

    // ── Calcula el offset ideal por índice ──────────────────
    function getOffsetLeft(index) {
      var firstLeft = slides[0].offsetLeft;
      return slides[index] ? slides[index].offsetLeft - firstLeft : 0;
    }

    // ── Actualizar estado disabled de las flechas ───────────
    function updateNav() {
      if (navPrev) navPrev.disabled = currentOffset <= 0;
      if (navNext) navNext.disabled = currentOffset >= getMaxOffset() - 1;
    }

    // ── Ir al slide del slider ──────────────────────────────
    function goTo(index) {
      index = Math.max(0, Math.min(index, totalSlides - 1));
      currentIndex = index;
      // Clampear para que el track nunca deje espacio vacío a la derecha
      currentOffset = Math.min(getOffsetLeft(index), getMaxOffset());
      track.style.transform = 'translateX(-' + currentOffset + 'px)';
      dots.forEach(function (dot, i) {
        var active = i === currentIndex;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      updateNav();
    }

    // Dots click
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        goTo(parseInt(dot.getAttribute('data-prop-slider-dot'), 10));
      });
    });

    // Flechas del carrusel
    if (navPrev) navPrev.addEventListener('click', function () { goTo(currentIndex - 1); });
    if (navNext) navNext.addEventListener('click', function () { goTo(currentIndex + 1); });

    // ── Drag / Swipe del slider ─────────────────────────────
    var dragStart  = 0;
    var dragging   = false;
    var THRESHOLD  = 50;
    var hasDragged = false;

    function onDragStart(x) {
      dragStart  = x;
      dragging   = true;
      hasDragged = false;
      track.classList.add('is-dragging');
    }

    function onDragEnd(x) {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
      var diff = dragStart - x;
      if (Math.abs(diff) > THRESHOLD) {
        hasDragged = true;
        goTo(diff > 0 ? currentIndex + 1 : currentIndex - 1);
      }
    }

    track.addEventListener('mousedown',  function (e) { onDragStart(e.clientX); });
    window.addEventListener('mouseup',   function (e) { onDragEnd(e.clientX); });
    track.addEventListener('touchstart', function (e) { onDragStart(e.touches[0].clientX); }, { passive: true });
    track.addEventListener('touchend',   function (e) { onDragEnd(e.changedTouches[0].clientX); }, { passive: true });

    // Prevenir apertura del lightbox si hubo drag
    track.addEventListener('click', function (e) {
      if (hasDragged) { e.preventDefault(); e.stopPropagation(); hasDragged = false; }
    }, true);

    // Resize
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { goTo(currentIndex); }, 120);
    });

    goTo(0);

    // ── Lightbox ────────────────────────────────────────────
    initLightbox(sliderEl, cards, hasDragged);
  }

  // ── Lightbox ───────────────────────────────────────────────
  function initLightbox(sliderEl, cards) {
    var lb         = sliderEl.querySelector('[data-prop-lightbox]');
    if (!lb) return;

    var lbImg      = lb.querySelector('[data-lb-img]');
    var lbName     = lb.querySelector('[data-lb-name]');
    var lbPrice    = lb.querySelector('[data-lb-price]');
    var lbDesc     = lb.querySelector('[data-lb-desc]');
    var lbCta      = lb.querySelector('[data-lb-cta]');
    var lbCurrent  = lb.querySelector('[data-lb-current]');
    var lbTotal    = lb.querySelector('[data-lb-total]');
    var lbPrev     = lb.querySelector('[data-lb-prev]');
    var lbNext     = lb.querySelector('[data-lb-next]');
    var closeEls   = Array.from(lb.querySelectorAll('[data-lb-close]'));

    var lbIndex    = 0;
    var total      = cards.length;
    var isOpen     = false;

    // Actualizar total
    if (lbTotal) lbTotal.textContent = total;

    // ── Poblar lightbox con datos del slide i ───────────────
    function populate(index) {
      var card = cards[index];
      if (!card) return;

      var imgSrc = card.getAttribute('data-lb-img') || '';
      var name   = card.getAttribute('data-lb-name')  || '';
      var price  = card.getAttribute('data-lb-price') || '';
      var desc   = card.getAttribute('data-lb-desc')  || '';
      var href   = card.getAttribute('data-lb-href')  || '#';
      var newTab = card.getAttribute('data-lb-new-tab') === 'true';

      // Imagen con fade-in
      lbImg.classList.add('is-loading');
      lbImg.onload = function () { lbImg.classList.remove('is-loading'); };
      lbImg.src = imgSrc;
      lbImg.alt = name;

      if (lbName)    lbName.textContent    = name;
      if (lbPrice)   lbPrice.textContent   = price;
      if (lbDesc)    lbDesc.textContent    = desc;
      if (lbCta)     { lbCta.href = href; lbCta.target = newTab ? '_blank' : '_self'; }
      if (lbCurrent) lbCurrent.textContent = index + 1;

      // Estado flechas
      if (lbPrev) lbPrev.disabled = index === 0;
      if (lbNext) lbNext.disabled = index === total - 1;
    }

    // ── Abrir ───────────────────────────────────────────────
    function open(index) {
      lbIndex = Math.max(0, Math.min(index, total - 1));
      populate(lbIndex);
      lb.removeAttribute('aria-hidden');
      lb.classList.add('is-open');
      isOpen = true;
      lockScroll();
      // Focus al botón de cerrar para accesibilidad
      var closeBtn = lb.querySelector('.prop-slider__lb-close');
      if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 50);
    }

    // ── Cerrar ──────────────────────────────────────────────
    function close() {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      isOpen = false;
      unlockScroll();
    }

    // ── Navegar dentro del lightbox ─────────────────────────
    function goLb(index) {
      lbIndex = Math.max(0, Math.min(index, total - 1));
      populate(lbIndex);
    }

    // ── Eventos: abrir al clic en tarjetas ──────────────────
    cards.forEach(function (card, i) {
      card.addEventListener('click', function () {
        open(i);
      });
      // Teclado: Enter / Space
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(i);
        }
      });
    });

    // ── Cerrar: botón X y overlay ───────────────────────────
    closeEls.forEach(function (el) {
      el.addEventListener('click', close);
    });

    // ── Flechas del lightbox ────────────────────────────────
    if (lbPrev) lbPrev.addEventListener('click', function () { goLb(lbIndex - 1); });
    if (lbNext) lbNext.addEventListener('click', function () { goLb(lbIndex + 1); });

    // ── Teclado: Escape y flechas ───────────────────────────
    document.addEventListener('keydown', function (e) {
      if (!isOpen) return;
      if (e.key === 'Escape')      { close(); }
      if (e.key === 'ArrowLeft')   { goLb(lbIndex - 1); }
      if (e.key === 'ArrowRight')  { goLb(lbIndex + 1); }
    });

    // ── Swipe en el lightbox (mobile) ───────────────────────
    var lbSwipeStart = 0;
    var lbContainer  = lb.querySelector('.prop-slider__lb-container');

    if (lbContainer) {
      lbContainer.addEventListener('touchstart', function (e) {
        lbSwipeStart = e.touches[0].clientX;
      }, { passive: true });

      lbContainer.addEventListener('touchend', function (e) {
        var diff = lbSwipeStart - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
          goLb(diff > 0 ? lbIndex + 1 : lbIndex - 1);
        }
      }, { passive: true });
    }
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    document.querySelectorAll('[data-prop-slider]').forEach(initSlider);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
