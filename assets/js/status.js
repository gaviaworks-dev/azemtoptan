/* ==========================================================================
   Durum sayfaları — 404.html, 500.html (bakim.html betiksiz)
   404: GitHub Pages iç içe eksik adreslerde de bu dosyayı sunar; <base> site kökünü gösterir.
   Base yüzünden "#..." bağlantıları ana sayfaya gider: bulunulan adrese bağlanır.
   ========================================================================== */
(function () {
  'use strict';

  var A = window.AZEM_APP;
  var $$ = A.$$;

  if (document.querySelector('base')) {
    var here = location.pathname + location.search;
    $$('a[href^="#"]').forEach(function (a) { a.setAttribute('href', here + a.getAttribute('href')); });
  }

  /* 500: Tekrar Dene */
  $$('[data-reload]').forEach(function (b) { b.addEventListener('click', function () { location.reload(); }); });

  A.ready();
})();
