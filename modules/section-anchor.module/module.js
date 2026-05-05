/* ── Section Anchor – Smooth scroll con offset de header ───
   1. Mide la altura real del .site-header y la expone como
      --header-height en :root para que scroll-margin-top la use.
   2. Escucha clics en href="#..." e intercepta el scroll
      nativo para aplicar el offset (compatible con Safari
      que ignora scroll-margin-top en ciertos casos).
   ──────────────────────────────────────────────────────── */

(function () {
  'use strict';

  /* ── 1. Calcular y publicar la altura del header ─────── */

  function setHeaderHeight() {
    var header = document.querySelector('.site-header');
    var height = header ? header.getBoundingClientRect().height : 100;
    document.documentElement.style.setProperty('--header-height', height + 'px');
  }

  /* Ejecutar al cargar y en cada resize */
  setHeaderHeight();
  window.addEventListener('resize', setHeaderHeight, { passive: true });

  /* Re-calcular si el header cambia de tamaño (ej: topbar oculta en scroll) */
  if (window.ResizeObserver) {
    var header = document.querySelector('.site-header');
    if (header) {
      new ResizeObserver(setHeaderHeight).observe(header);
    }
  }

  /* ── 2. Posición absoluta via cadena offsetParent ────── */

  function getAbsoluteTop(el) {
    var top = 0;
    while (el) {
      top += el.offsetTop || 0;
      el = el.offsetParent;
    }
    return top;
  }

  /* ── 3. Interceptar clics en anclas internas ────────── */

  document.addEventListener('click', function (e) {
    /* Buscar el <a> más cercano al elemento clicado */
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;

    var targetId = link.getAttribute('href').slice(1);
    if (!targetId) return;

    var target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    /* ── Cerrar menú móvil si está abierto ─────────────────
       En iOS Safari, window.scrollTo es ignorado si se llama
       sincrónicamente dentro de un evento touch sobre un
       contenedor con overflow-y: auto (como el nav móvil).
       Cerrarlo aquí elimina ese contexto de scroll antes de
       llamar a window.scrollTo.
    ─────────────────────────────────────────────────────── */
    var mobileNav = document.getElementById('header-nav');
    var hamburger = document.getElementById('header-hamburger');
    if (mobileNav && mobileNav.classList.contains('is-open')) {
      mobileNav.classList.remove('is-open');
      if (hamburger) {
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Abrir menú');
      }
    }

    /* ── Diferir el scroll al siguiente frame ──────────────
       requestAnimationFrame garantiza que el scroll se calcula
       DESPUÉS de que el navegador haya procesado el cierre del
       menú, evitando el bloqueo de iOS Safari.
    ─────────────────────────────────────────────────────── */
    requestAnimationFrame(function () {
      var headerHeight = parseFloat(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--header-height')
      ) || 100;

      /* ── offsetParent chain: posición absoluta en el documento ──
         getBoundingClientRect().top + scrollY puede ser inestable
         si hay transiciones activas (menu closing). La cadena de
         offsetTop da la posición real sin depender del viewport.
      ──────────────────────────────────────────────────────────── */
      var absoluteTop = getAbsoluteTop(target);
      var top = Math.max(0, absoluteTop - headerHeight);

      window.scrollTo({ top: top, behavior: 'smooth' });

      /* Actualizar la URL sin disparar un segundo scroll */
      if (history.pushState) {
        history.pushState(null, '', '#' + targetId);
      }
    });
  });

})();
