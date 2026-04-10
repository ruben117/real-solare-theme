(function () {
  'use strict';

  function initImageSlider(sliderEl) {
    var track    = sliderEl.querySelector('[data-img-slider-track]');
    var slides   = Array.from(sliderEl.querySelectorAll('[data-img-slide]'));
    var prevBtn  = sliderEl.querySelector('[data-img-prev]');
    var nextBtn  = sliderEl.querySelector('[data-img-next]');
    var viewport = sliderEl.querySelector('.img-slider__viewport');

    if (!track || !slides.length || !viewport) return;

    var total         = slides.length;
    var currentIndex  = 0;
    var isLoop        = sliderEl.dataset.loop !== 'false';
    var doAutoplay    = sliderEl.dataset.autoplay === 'true';
    var autoDelay     = parseInt(sliderEl.dataset.autoplayDelay, 10) || 4000;
    var autoTimer     = null;
    var resizeTimer   = null;

    // ── Ir a slide ───────────────────────────────────────────
    function goTo(index) {
      if (isLoop) {
        index = ((index % total) + total) % total;
      } else {
        index = Math.max(0, Math.min(index, total - 1));
      }
      currentIndex = index;

      // Actualizar clases activo / prev / next
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === currentIndex);
        slide.classList.toggle('is-prev',   i === currentIndex - 1);
        slide.classList.toggle('is-next',   i === currentIndex + 1);
      });

      // Calcular desplazamiento del track
      var slideW  = slides[0].offsetWidth;
      var gapVal  = parseFloat(getComputedStyle(track).gap) || 0;
      var viewW   = viewport.offsetWidth;
      // Centrar el slide activo dentro del viewport
      var peekL   = (viewW - slideW) / 2;
      var offset  = currentIndex * (slideW + gapVal) - peekL;
      // No mostrar espacio vacío al inicio ni al final
      var maxOff  = (total - 1) * (slideW + gapVal) - peekL;
      if (!isLoop) {
        if (offset < 0) offset = 0;
        if (offset > maxOff && maxOff > 0) offset = maxOff;
      }

      track.style.transform = 'translateX(-' + offset + 'px)';

      // Estado de botones
      if (!isLoop) {
        if (prevBtn) prevBtn.disabled = currentIndex === 0;
        if (nextBtn) nextBtn.disabled = currentIndex === total - 1;
      } else {
        if (prevBtn) prevBtn.disabled = false;
        if (nextBtn) nextBtn.disabled = false;
      }
    }

    // ── Autoplay ─────────────────────────────────────────────
    function startAutoplay() {
      if (!doAutoplay) return;
      autoTimer = setInterval(function () {
        goTo(currentIndex + 1);
      }, autoDelay);
    }

    function stopAutoplay() {
      clearInterval(autoTimer);
    }

    function resetAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    // ── Botones ──────────────────────────────────────────────
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        goTo(currentIndex - 1);
        resetAutoplay();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        goTo(currentIndex + 1);
        resetAutoplay();
      });
    }

    // ── Swipe táctil ─────────────────────────────────────────
    var touchStartX = 0;
    sliderEl.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    sliderEl.addEventListener('touchend', function (e) {
      var diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        goTo(diff > 0 ? currentIndex + 1 : currentIndex - 1);
        resetAutoplay();
      }
    }, { passive: true });

    // ── Teclado (accesibilidad) ───────────────────────────────
    sliderEl.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft')  { goTo(currentIndex - 1); resetAutoplay(); }
      if (e.key === 'ArrowRight') { goTo(currentIndex + 1); resetAutoplay(); }
    });

    // ── Resize ───────────────────────────────────────────────
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { goTo(currentIndex); }, 130);
    });

    // ── Pausa autoplay al hacer hover ────────────────────────
    sliderEl.addEventListener('mouseenter', stopAutoplay);
    sliderEl.addEventListener('mouseleave', startAutoplay);

    // ── Init ─────────────────────────────────────────────────
    goTo(0);
    startAutoplay();
  }

  // Inicializar en DOMContentLoaded o inmediatamente si el DOM ya está listo
  function init() {
    document.querySelectorAll('[data-img-slider]').forEach(initImageSlider);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
