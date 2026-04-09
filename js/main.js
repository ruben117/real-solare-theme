(function () {

  // ── Utilidad: ejecutar cuando el DOM esté listo ────────────────
  function domReady(callback) {
    if (['interactive', 'complete'].indexOf(document.readyState) >= 0) {
      callback();
    } else {
      document.addEventListener('DOMContentLoaded', callback);
    }
  }

  // ── Header: scroll sticky + hamburger mobile ───────────────────
  function initHeader() {
    var header     = document.getElementById('site-header');
    var hamburger  = document.getElementById('header-hamburger');
    var nav        = document.getElementById('header-nav');

    if (!header) return;

    // Agrega/quita .is-scrolled para cambiar fondo al hacer scroll
    var SCROLL_THRESHOLD = 10;

    function onScroll() {
      if (window.scrollY > SCROLL_THRESHOLD) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Estado inicial

    // Hamburger: toggle del menú mobile
    if (!hamburger || !nav) return;

    function openMenu() {
      nav.classList.add('is-open');
      hamburger.setAttribute('aria-expanded', 'true');
      hamburger.setAttribute('aria-label', 'Cerrar menú');
    }

    function closeMenu() {
      nav.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Abrir menú');
    }

    function toggleMenu() {
      var isOpen = nav.classList.contains('is-open');
      isOpen ? closeMenu() : openMenu();
    }

    hamburger.addEventListener('click', toggleMenu);

    // Cerrar menú al hacer click fuera
    document.addEventListener('click', function (e) {
      if (!header.contains(e.target)) {
        closeMenu();
      }
    });

    // Cerrar menú al hacer click en un link de navegación
    nav.querySelectorAll('.menu__link').forEach(function (link) {
      link.addEventListener('click', function () {
        closeMenu();
      });
    });

    // Cerrar menú al cambiar a viewport desktop
    var mql = window.matchMedia('(min-width: 768px)');
    function onBreakpoint(e) {
      if (e.matches) closeMenu();
    }
    if (mql.addEventListener) {
      mql.addEventListener('change', onBreakpoint);
    } else {
      mql.addListener(onBreakpoint); // Safari < 14
    }
  }

  // ── Email unsubscribe (funcionalidad original) ─────────────────
  function initEmailUnsub() {
    var emailGlobalUnsub = document.querySelector('input[name="globalunsub"]');
    if (!emailGlobalUnsub) return;

    function toggleDisabled() {
      var emailSubItem = document.querySelectorAll('#email-prefs-form .item');
      emailSubItem.forEach(function (item) {
        var input = item.querySelector('input');
        if (emailGlobalUnsub.checked) {
          item.classList.add('disabled');
          input.setAttribute('disabled', 'disabled');
          input.checked = false;
        } else {
          item.classList.remove('disabled');
          input.removeAttribute('disabled');
        }
      });
    }

    emailGlobalUnsub.addEventListener('change', toggleDisabled);
  }

  // ── Init ───────────────────────────────────────────────────────
  domReady(function () {
    if (!document.body) return;
    initHeader();
    initEmailUnsub();
  });

})();
