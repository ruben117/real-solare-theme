(function () {
  'use strict';

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

  // ── Inicializar slider ─────────────────────────────────────
  function initImageSlider(sliderEl) {
    var track    = sliderEl.querySelector('[data-img-slider-track]');
    var slides   = Array.from(sliderEl.querySelectorAll('[data-img-slide]'));
    var triggers = Array.from(sliderEl.querySelectorAll('[data-img-lb-trigger]'));
    var prevBtn  = sliderEl.querySelector('[data-img-prev]');
    var nextBtn  = sliderEl.querySelector('[data-img-next]');
    var viewport = sliderEl.querySelector('.img-slider__viewport');

    if (!track || !slides.length || !viewport) return;

    var total        = slides.length;
    var currentIndex = 0;
    var isLoop       = sliderEl.dataset.loop !== 'false';
    var doAutoplay   = sliderEl.dataset.autoplay === 'true';
    var autoDelay    = parseInt(sliderEl.dataset.autoplayDelay, 10) || 4000;
    var autoTimer    = null;
    var resizeTimer  = null;
    var lbIsOpen     = false; // flag para bloquear swipe del slider cuando el lightbox está abierto

    // ── Ir a slide ───────────────────────────────────────────
    function goTo(index) {
      if (isLoop) {
        index = ((index % total) + total) % total;
      } else {
        index = Math.max(0, Math.min(index, total - 1));
      }
      currentIndex = index;

      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === currentIndex);
        slide.classList.toggle('is-prev',   i === currentIndex - 1);
        slide.classList.toggle('is-next',   i === currentIndex + 1);
      });

      var slideW = slides[0].offsetWidth;
      var gapVal = parseFloat(getComputedStyle(track).gap) || 0;
      var viewW  = viewport.offsetWidth;
      var peekL  = (viewW - slideW) / 2;
      var offset = currentIndex * (slideW + gapVal) - peekL;
      var maxOff = (total - 1) * (slideW + gapVal) - peekL;
      if (offset < 0)         offset = 0;
      if (maxOff > 0 && offset > maxOff) offset = maxOff;

      track.style.transform = 'translateX(-' + offset + 'px)';

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
      autoTimer = setInterval(function () { goTo(currentIndex + 1); }, autoDelay);
    }
    function stopAutoplay()  { clearInterval(autoTimer); }
    function resetAutoplay() { stopAutoplay(); startAutoplay(); }

    // ── Botones del slider ───────────────────────────────────
    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(currentIndex - 1); resetAutoplay(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(currentIndex + 1); resetAutoplay(); });

    // ── Swipe táctil del slider ──────────────────────────────
    var touchStartX = 0;
    sliderEl.addEventListener('touchstart', function (e) {
      if (lbIsOpen) return; // ignorar si el lightbox está abierto
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    sliderEl.addEventListener('touchend', function (e) {
      if (lbIsOpen) return;
      var diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        goTo(diff > 0 ? currentIndex + 1 : currentIndex - 1);
        resetAutoplay();
      }
    }, { passive: true });

    // ── Teclado del slider ───────────────────────────────────
    sliderEl.addEventListener('keydown', function (e) {
      if (lbIsOpen) return;
      if (e.key === 'ArrowLeft')  { goTo(currentIndex - 1); resetAutoplay(); }
      if (e.key === 'ArrowRight') { goTo(currentIndex + 1); resetAutoplay(); }
    });

    // ── Resize ───────────────────────────────────────────────
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { goTo(currentIndex); }, 130);
    });

    sliderEl.addEventListener('mouseenter', stopAutoplay);
    sliderEl.addEventListener('mouseleave', startAutoplay);

    goTo(0);
    startAutoplay();

    // ── Lightbox ─────────────────────────────────────────────
    var lb        = sliderEl.querySelector('[data-img-lightbox]');
    if (!lb) return;

    var lbImg     = lb.querySelector('[data-img-lb-img]');
    var lbCurrent = lb.querySelector('[data-img-lb-current]');
    var lbTotal   = lb.querySelector('[data-img-lb-total]');
    var lbPrev    = lb.querySelector('[data-img-lb-prev]');
    var lbNext    = lb.querySelector('[data-img-lb-next]');
    var closeEls  = Array.from(lb.querySelectorAll('[data-img-lb-close]'));

    var lbIndex   = 0;

    if (lbTotal) lbTotal.textContent = total;

    function populate(index) {
      var trigger = triggers[index];
      if (!trigger) return;

      var imgSrc = trigger.getAttribute('data-lb-img') || '';
      var imgAlt = trigger.getAttribute('data-lb-alt') || '';

      lbImg.classList.add('is-loading');
      lbImg.onload = function () { lbImg.classList.remove('is-loading'); };
      lbImg.src = imgSrc;
      lbImg.alt = imgAlt;

      if (lbCurrent) lbCurrent.textContent = index + 1;
      if (lbPrev) lbPrev.disabled = index === 0;
      if (lbNext) lbNext.disabled = index === total - 1;
    }

    function openLb(index) {
      lbIndex = Math.max(0, Math.min(index, total - 1));
      populate(lbIndex);
      lb.removeAttribute('aria-hidden');
      lb.classList.add('is-open');
      lbIsOpen = true;
      stopAutoplay();
      lockScroll();
      var closeBtn = lb.querySelector('.img-slider__lb-close');
      if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 50);
    }

    function closeLb() {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      lbIsOpen = false;
      unlockScroll();
      startAutoplay();
    }

    function goLb(index) {
      lbIndex = Math.max(0, Math.min(index, total - 1));
      populate(lbIndex);
    }

    // Clic en cada imagen-trigger
    triggers.forEach(function (trigger, i) {
      trigger.addEventListener('click', function () { openLb(i); });
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(i); }
      });
    });

    // Cerrar: overlay + botón X
    closeEls.forEach(function (el) { el.addEventListener('click', closeLb); });

    // Flechas del lightbox
    if (lbPrev) lbPrev.addEventListener('click', function () { goLb(lbIndex - 1); });
    if (lbNext) lbNext.addEventListener('click', function () { goLb(lbIndex + 1); });

    // Teclado: Escape y flechas
    document.addEventListener('keydown', function (e) {
      if (!lbIsOpen) return;
      if (e.key === 'Escape')     closeLb();
      if (e.key === 'ArrowLeft')  goLb(lbIndex - 1);
      if (e.key === 'ArrowRight') goLb(lbIndex + 1);
    });

    // Swipe dentro del lightbox (mobile)
    var lbSwipeStart = 0;
    var lbContainer  = lb.querySelector('.img-slider__lb-container');
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
    document.querySelectorAll('[data-img-slider]').forEach(initImageSlider);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
