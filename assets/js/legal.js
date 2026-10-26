/* ==========================================================================
   Yasal metin sayfası — sayfa.html?s=<slug> (tek şablon)
   Metin: window.AZEM_LEGAL (assets/data/legal.js). s yok ya da geçersizse dizin.
   Masaüstü: yan menü (gruplu) + etkin metnin altında içindekiler (DadaGastro lg-toc).
   ≤1024: yan menü gizli, geri butonu dizine döner; içindekiler içerik üstünde katlanır.
   ========================================================================== */
(function () {
  'use strict';

  var A = window.AZEM_APP, L = window.AZEM_LEGAL || { groups: [], docs: [] };
  var $ = A.$, $$ = A.$$, esc = A.esc;

  var bySlug = {};
  L.docs.forEach(function (d) { bySlug[d.slug] = d; });
  var doc = bySlug[A.param('s')] || null;
  var heads = doc ? doc.blocks.filter(function (b) { return b.t === 'h2'; }) : [];
  var hasToc = heads.length >= 4;   /* K29a: yalnız 4+ başlıklı metinlerde */

  function url(d) { return 'sayfa.html?s=' + encodeURIComponent(d.slug); }
  var sep = '<li class="breadcrumb__sep" aria-hidden="true"><i class="fa-solid fa-chevron-right"></i></li>';

  /* ---------- Üst bant: breadcrumb + başlık ---------- */
  $('[data-legal-top]').innerHTML =
    '<nav aria-label="Konum"><ol class="breadcrumb"><li><a href="index.html">Ana Sayfa</a></li>' + sep +
    (doc ? '<li><a href="sayfa.html">Yasal</a></li>' + sep + '<li aria-current="page">' + esc(doc.title) + '</li>'
         : '<li aria-current="page">Yasal</li>') +
    '</ol></nav>' +
    '<div class="page-head__row">' +
      (doc ? '<a class="icon-btn icon-btn--round page-head__back" href="sayfa.html" aria-label="Yasal metinler"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></a>' : '') +
      '<h1 class="page-head__title">' + esc(doc ? doc.title : 'Yasal') + '</h1>' +
    '</div>';
  document.title = (doc ? doc.title : 'Yasal') + ' | Azem Toptan';

  /* ---------- İçindekiler ---------- */
  function tocList() {
    return '<ol class="toc__list">' + heads.map(function (h) {
      return '<li><a class="toc__link" href="#' + esc(h.id) + '">' + esc(h.text) + '</a></li>';
    }).join('') + '</ol>';
  }

  /* ---------- Yan menü: gruplar, etkin metin, içindekiler ---------- */
  function sideMenu(mod) {
    return '<nav class="side-menu' + (mod ? ' ' + mod : '') + '" aria-label="Yasal metinler">' + L.groups.map(function (g, gi) {
      var items = L.docs.filter(function (d) { return d.group === g; });
      return (gi ? '<hr class="side-menu__divider">' : '') +
        '<p class="side-menu__title">' + esc(g) + '</p><ul class="side-menu__list">' + items.map(function (d) {
          var on = d === doc;
          return '<li><a class="side-menu__item" href="' + url(d) + '"' + (on ? ' aria-current="page"' : '') + '>' +
            '<i class="fa-regular fa-file-lines" aria-hidden="true"></i><span>' + esc(d.title) + '</span>' +
            '<i class="fa-solid fa-chevron-right side-menu__chev" aria-hidden="true"></i></a>' +
            (on && hasToc ? '<div class="toc"><p class="toc__title">İçindekiler</p>' + tocList() + '</div>' : '') +
          '</li>';
        }).join('') + '</ul>';
    }).join('') + '</nav>';
  }

  /* ---------- Metin blokları (html alanları Azem'den, güvenli) ---------- */
  function block(b) {
    switch (b.t) {
      case 'title': return '<p class="prose__title">' + esc(b.text) + '</p>';
      case 'h2': return '<h2 id="' + esc(b.id) + '" tabindex="-1">' + esc(b.text) + '</h2>';
      case 'h3': return '<h3 id="' + esc(b.id) + '">' + esc(b.text) + '</h3>';
      case 'p': return '<p>' + b.html + '</p>';
      case 'ul': return '<ul>' + b.items.map(function (li) { return '<li>' + li + '</li>'; }).join('') + '</ul>';
      case 'dl': return '<dl>' + b.rows.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl>';
      case 'table':
        return '<table><thead><tr>' + b.head.map(function (h) { return '<th scope="col">' + esc(h) + '</th>'; }).join('') + '</tr></thead>' +
          '<tbody>' + b.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
    }
    return '';
  }

  var body = $('[data-legal-body]');
  if (!doc) {
    /* Dizin: A101 /sozlesmeler mobil dizini + DadaGastro lg index; masaüstü ve mobilde aynı kart */
    body.innerHTML = sideMenu('side-menu--index');
  } else {
    body.innerHTML =
      '<div class="with-aside">' +
        '<aside class="with-aside__side with-aside__side--desktop">' + sideMenu() + '</aside>' +
        '<div class="with-aside__main stack">' +
          (hasToc && !doc.empty ?
            '<div class="acc toc toc--inline show-tablet"><button class="acc__btn" type="button" aria-expanded="false" aria-controls="tocInline">İçindekiler<i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
            '<div class="acc__panel" id="tocInline"><div>' + tocList() + '</div></div></div>' : '') +
          (doc.empty ?
            '<div class="empty empty--box"><i class="fa-solid fa-file-lines" aria-hidden="true"></i><p class="empty__title">Metin Azem\'den bekleniyor.</p></div>' :
            '<article class="prose">' + doc.blocks.map(block).join('') + '</article>') +
        '</div>' +
      '</div>';
  }

  /* ---------- İçindekiler: tıklayınca başlığa kaydır, scroll-spy ---------- */
  var links = $$('.toc__link');
  if (links.length) {
    var side = $('.with-aside__side--desktop');
    var inline = $('.toc--inline');
    var inlineBtn = inline && $('.acc__btn', inline);
    var inlinePanel = inline && $('.acc__panel', inline);

    function go(target) {
      target.scrollIntoView({ behavior: A.reduceMotion ? 'auto' : 'smooth', block: 'start' });
      target.focus({ preventScroll: true });
      history.replaceState(null, '', '#' + target.id);
    }
    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        var target = document.getElementById(decodeURIComponent(a.hash.slice(1)));
        if (!target) return;
        e.preventDefault();
        /* satır içi liste: önce kapanır (başlık yukarı kayar), sonra kaydırılır */
        if (inline && inline.contains(a)) {
          A.setAcc(inlineBtn, false);
          var done = false, run = function (ev) {
            if (done || (ev && ev.target !== inlinePanel)) return;   /* bağlantının renk geçişi de buraya kabarır */
            done = true; inlinePanel.removeEventListener('transitionend', run); go(target);
          };
          inlinePanel.addEventListener('transitionend', run);
          setTimeout(run, 400);
        } else go(target);
      });
    });

    /* aynı başlığın iki listedeki bağlantısı birlikte işaretlenir; yan sütunda görünür tutulur */
    A.scrollSpy(links, function (cur) {
      links.forEach(function (a) {
        if (a.hash === cur.hash) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
      var s = side && $('.toc__link[aria-current="true"]', side);
      if (s && side.scrollHeight > side.clientHeight) {
        var r = s.getBoundingClientRect(), box = side.getBoundingClientRect();
        if (r.top < box.top) side.scrollTop -= box.top - r.top + 8;
        else if (r.bottom > box.bottom) side.scrollTop += r.bottom - box.bottom + 8;
      }
    });

    /* doğrudan #başlık ile açılışta metin JS ile basıldığı için konumu düzelt */
    var start = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (start) start.scrollIntoView({ behavior: 'instant', block: 'start' });
  }

  A.ready();
})();
