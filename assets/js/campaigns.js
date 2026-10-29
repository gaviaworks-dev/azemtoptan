/* ==========================================================================
   Kampanyalar — kampanyalar.html
   İçerik yalnız Azem'in kampanya malzemesi (catalog.js): ana sayfa hero'sundaki iki banner
   (çerçeve oranında geniş / dikey dolgu sürümleriyle) ve dört kampanya kartı; hedefler ana sayfayla aynı.
   Bugünün Fırsatı kartı main.js'in [data-firsat] diyaloğunu açar (G10). Uydurma kampanya, indirim, sayaç yok.
   ========================================================================== */
(function () {
  'use strict';

  var A = window.AZEM_APP, D = A.D;
  var $ = A.$, esc = A.esc, bg = A.bg;

  /* Banner hedefi (home.js ile aynı kural): Azem'deki linki varsa o; yoksa banner'ın adını verdiği ürün/kategori */
  function findProduct(re) {
    for (var i = 0; i < A.DB.products.length; i++) if (re.test(A.DB.products[i].sourceName)) return A.DB.products[i];
    return null;
  }
  function linkFor(target) {
    if (!target) return '';
    if (target.product) return A.productUrl(A.products[target.product]);
    if (target.match) return A.productUrl(findProduct(new RegExp(target.match)));
    if (target.cat) return A.catUrl(A.catBySlug[target.cat]);
    return '';
  }

  /* ---------- Banner'lar: yalnız dolgu sürümü olanlar (görsel banner); hedefi yoksa bağlantısız ---------- */
  $('[data-banners]').innerHTML = D.hero.filter(function (s) { return s.type === 'banner' && s.fill; }).map(function (s) {
    var href = linkFor(s.link);
    var media = '<span class="hero__media hero__media--wide" style="' + bg(s.fill.wide) + '" role="img" aria-label="' + esc(s.alt) + '"></span>' +
      '<span class="hero__media hero__media--tall" style="' + bg(s.fill.tall) + '" aria-hidden="true"></span>';
    /* tek slaytlık ray: slayt ana sayfadaki gibi esnek öğe olur, çerçeveyi doldurur */
    return '<div class="hero__frame"><div class="hero__track">' +
      (href ? '<a class="hero__slide" href="' + href + '">' + media + '</a>' : '<div class="hero__slide">' + media + '</div>') +
      '</div></div>';
  }).join('');

  /* ---------- Kampanya kartları (ana sayfadaki kart, aynı hedef) ---------- */
  var promos = $('[data-promos]');
  promos.innerHTML = D.promos.map(function (p) {
    return '<a class="promo-card" href="' + (linkFor(p.link) || '#') + '"><span class="promo-card__media' + (p.fit === 'contain' ? ' promo-card__media--contain' : '') + '"><span style="' + bg(p.img) + '" role="img" aria-label="' + esc(p.title) + '"></span></span>' +
      '<span class="promo-card__body"><span class="promo-card__text"><span class="promo-card__kicker">' + esc(p.title) + '</span><br>' +
      '<span class="promo-card__cta">' + esc(p.cta) + '</span></span>' +
      '<span class="promo-card__arrow" aria-hidden="true"><i class="fa-solid fa-arrow-right"></i></span></span></a>';
  }).join('');

  A.ready();
})();
