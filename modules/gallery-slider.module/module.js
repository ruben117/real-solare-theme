(function () {

  /**
   * Gallery Slider – Real Solare
   * Slider de imágenes puras: dots, flechas prev/next, drag/swipe, lightbox.
   */

  // ── Bloqueo de scroll ──────────────────────────────────────
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

  // ── Inicializar un slider ──────────────────────────────────
  function initSlider(sliderEl) {
    var track    = sliderEl.querySelector('[data-gal-slider-track]');
    var viewport = sliderEl.querySelector('.gal-slider__viewport');
    var dotsWrap = sliderEl.querySelector('[data-gal-slider-dots]');
    var slides   = Array.from(sliderEl.querySelectorAll('.gal-slider__slide'));
    var dots     = dotsWrap ? Array.from(dotsWrap.querySelectorAll('[data-gal-slider-dot]')) : [];
    var cards    = Array.from(sliderEl.querySelectorAll('[data-gal-lightbox-trigger]'));
    var navPrev  = sliderEl.querySelector('[data-gal-slider-prev]');
    var navNext  = sliderEl.querySelector('[data-gal-slider-next]');

    if (!track || slides.length < 1) return;

    var currentIndex  = 0;
    var currentOffset = 0;
    var totalSlides   = slides.length;

    function getMaxOffset() {
      return Math.max(0, track.scrollWidth - viewport.clientWidth);
    }

    function getOffsetLeft(index) {
      var firstLeft = slides[0].offsetLeft;
      return slides[index] ? slides[index].offsetLeft - firstLeft : 0;
    }

    function updateNav() {
      if (navPrev) navPrev.disabled = currentOffset <= 0;
      if (navNext) navNext.disabled = currentOffset >= getMaxOffset() - 1;
    }

    function goTo(index) {
      index = Math.max(0, Math.min(index, totalSlides - 1));
      currentIndex  = index;
      currentOffset = Math.min(getOffsetLeft(index), getMaxOffset());
      track.style.transform = 'translateX(-' + currentOffset + 'px)';
      dots.forEach(function (dot, i) {
        var active = i === currentIndex;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      updateNav();
    }

    // Dots
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        goTo(parseInt(dot.getAttribute('data-gal-slider-dot'), 10));
      });
    });

    // Flechas
    if (navPrev) navPrev.addEventListener('click', function () { goTo(currentIndex - 1); });
    if (navNext) navNext.addEventListener('click', function () { goTo(currentIndex + 1); });

    // ── Drag / Swipe ───────────────────────────────────────
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

    track.addEventListener('click', function (e) {
      if (hasDragged) { e.preventDefault(); e.stopPropagation(); hasDragged = false; }
    }, true);

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { goTo(currentIndex); }, 120);
    });

    goTo(0);

    // ── Lightbox ───────────────────────────────────────────
    initLightbox(sliderEl, cards);
  }

  // ── Lightbox ───────────────────────────────────────────────
  function initLightbox(sliderEl, cards) {
    var lb        = sliderEl.querySelector('[data-gal-lightbox]');
    if (!lb) return;

    var lbImg     = lb.querySelector('[data-gal-lb-img]');
    var lbCurrent = lb.querySelector('[data-gal-lb-current]');
    var lbTotal   = lb.querySelector('[data-gal-lb-total]');
    var lbPrev    = lb.querySelector('[data-gal-lb-prev]');
    var lbNext    = lb.querySelector('[data-gal-lb-next]');
    var closeEls  = Array.from(lb.querySelectorAll('[data-gal-lb-close]'));

    var lbIndex = 0;
    var total   = cards.length;
    var isOpen  = false;

    if (lbTotal) lbTotal.textContent = total;

    function populate(index) {
      var card   = cards[index];
      if (!card) return;
      var imgSrc = card.getAttribute('data-lb-img') || '';

      lbImg.classList.add('is-loading');
      lbImg.onload = function () { lbImg.classList.remove('is-loading'); };
      lbImg.src = imgSrc;
      lbImg.alt = card.getAttribute('aria-label') || '';

      if (lbCurrent) lbCurrent.textContent = index + 1;
      if (lbPrev) lbPrev.disabled = index === 0;
      if (lbNext) lbNext.disabled = index === total - 1;
    }

    function open(index) {
      lbIndex = Math.max(0, Math.min(index, total - 1));
      populate(lbIndex);
      lb.removeAttribute('aria-hidden');
      lb.classList.add('is-open');
      isOpen = true;
      lockScroll();
      var closeBtn = lb.querySelector('.gal-slider__lb-close');
      if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 50);
    }

    function close() {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      isOpen = false;
      unlockScroll();
    }

    function goLb(index) {
      lbIndex = Math.max(0, Math.min(index, total - 1));
      populate(lbIndex);
    }

    cards.forEach(function (card, i) {
      card.addEventListener('click', function () { open(i); });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
      });
    });

    closeEls.forEach(function (el) { el.addEventListener('click', close); });

    if (lbPrev) lbPrev.addEventListener('click', function () { goLb(lbIndex - 1); });
    if (lbNext) lbNext.addEventListener('click', function () { goLb(lbIndex + 1); });

    document.addEventListener('keydown', function (e) {
      if (!isOpen) return;
      if (e.key === 'Escape')     close();
      if (e.key === 'ArrowLeft')  goLb(lbIndex - 1);
      if (e.key === 'ArrowRight') goLb(lbIndex + 1);
    });

    // Swipe en lightbox (mobile)
    var lbSwipeStart = 0;
    var lbContainer  = lb.querySelector('.gal-slider__lb-container');
    if (lbContainer) {
      lbContainer.addEventListener('touchstart', function (e) {
        lbSwipeStart = e.touches[0].clientX;
      }, { passive: true });
      lbContainer.addEventListener('touchend', function (e) {
        var diff = lbSwipeStart - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) goLb(diff > 0 ? lbIndex + 1 : lbIndex - 1);
      }, { passive: true });
    }
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    document.querySelectorAll('[data-gal-slider]').forEach(initSlider);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
