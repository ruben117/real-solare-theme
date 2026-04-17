(function () {

  /**
   * Dual Image – Real Solare
   * Usa IntersectionObserver para añadir .is-visible cuando la sección
   * entra en el viewport, disparando las animaciones CSS.
   */

  function initDualImg(el) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      io.observe(el);
    } else {
      // Fallback: sin IntersectionObserver, mostrar de inmediato
      el.classList.add('is-visible');
    }
  }

  function init() {
    document.querySelectorAll('[data-dual-img]').forEach(initDualImg);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
