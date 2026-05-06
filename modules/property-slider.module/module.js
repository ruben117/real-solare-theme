(function () {

  /**
   * Property Slider – Real Solare
   * • Slider: dots + flechas + swipe/drag
   * • Clic en tarjeta → navega a la URL configurada (sin lightbox)
   */

  // ── Inicializar un slider ──────────────────────────────────
  function initSlider(sliderEl) {
    var track    = sliderEl.querySelector('[data-prop-slider-track]');
    var viewport = sliderEl.querySelector('.prop-slider__viewport');
    var dotsWrap = sliderEl.querySelector('[data-prop-slider-dots]');
    var slides   = Array.from(sliderEl.querySelectorAll('.prop-slider__slide'));
    var dots     = dotsWrap ? Array.from(dotsWrap.querySelectorAll('[data-prop-slider-dot]')) : [];
    var navPrev  = sliderEl.querySelector('[data-prop-slider-prev]');
    var navNext  = sliderEl.querySelector('[data-prop-slider-next]');

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
        goTo(parseInt(dot.getAttribute('data-prop-slider-dot'), 10));
      });
    });

    // Flechas
    if (navPrev) navPrev.addEventListener('click', function () { goTo(currentIndex - 1); });
    if (navNext) navNext.addEventListener('click', function () { goTo(currentIndex + 1); });

    // ── Drag / Swipe ────────────────────────────────────────
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

    // Prevenir navegación del <a> si el usuario hizo drag en vez de clic
    track.addEventListener('click', function (e) {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    }, true);

    // Resize
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { goTo(currentIndex); }, 120);
    });

    goTo(0);
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
