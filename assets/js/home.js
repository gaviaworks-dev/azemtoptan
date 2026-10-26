/* ==========================================================================
   Ana sayfa — story, hero, duyuru, kategori grid'i, kampanya kartları, raflar, e-bülten
   ========================================================================== */
(function () {
  'use strict';

  var A = window.AZEM_APP, D = A.D;
  var $ = A.$, $$ = A.$$, esc = A.esc, bg = A.bg;

  /* Ana sayfa verisindeki ürünü kataloğa bağla (aynı ürün → aynı sepet/favori kaydı) */
  var byCode = {};
  A.DB.products.forEach(function (p) { if (p.code) byCode[p.code] = p; });
  function resolve(p) {
    var code = p.img && (p.img.match(/(\d{6,})\.\w+$/) || [])[1];
    return (code && byCode[code]) || A.products[A.slug(p.sourceName || p.name)] || null;
  }
  /* Banner hedefi: Azem'deki linki varsa o; yoksa banner'ın adını verdiği ürün/kategori */
  function findProduct(re) {
    for (var i = 0; i < A.DB.products.length; i++) if (re.test(A.DB.products[i].sourceName)) return A.DB.products[i];
    return null;
  }
  function linkFor(target) {
    if (!target) return '#';
    if (target.product) return A.productUrl(A.products[target.product]);
    if (target.match) return A.productUrl(findProduct(new RegExp(target.match)));
    if (target.cat) return A.catUrl(A.catBySlug[target.cat]);
    return '#';
  }

  /* ---------- Story şeridi ---------- */
  var stories = $('[data-stories]');
  var storyHtml =
    '<a class="story story--featured" href="#"><span class="story__ring"><span class="story__badge">FIRSAT</span>' +
    '<i class="fa-solid fa-bolt story__icon" aria-hidden="true"></i></span><span class="story__label">Bugünün Fırsatı</span></a>';
  /* Gerçek ürün fotoğrafı olan alt kategoriler (ürünü olmayan alt kategori şeritte yer almaz; menülerde durur) */
  var subs = [];
  D.categories.forEach(function (cat) {
    var top = A.catByName(cat.name, null);
    cat.children.forEach(function (c) { subs.push({ c: c, cat: top && A.catByName(c.name, top.id) }); });
  });
  subs.filter(function (s) { return s.c.photo; }).forEach(function (s) {
    var c = s.c;
    storyHtml += '<a class="story story--photo" href="' + A.catUrl(s.cat) + '"><span class="story__ring">' +
      '<span class="story__img" style="' + bg(c.photo) + '" role="img" aria-label="' + esc(c.photoAlt) + '"></span></span>' +
      '<span class="story__label">' + esc(c.name) + '</span></a>';
  });
  stories.innerHTML = storyHtml;

  /* ---------- Hero slider ---------- */
  var hero = $('[data-hero]');
  var track = $('[data-hero-track]', hero);
  track.innerHTML = D.hero.map(function (s, i) {
    var label = 'aria-roledescription="slide" aria-label="' + (i + 1) + ' / ' + D.hero.length + '"';
    if (s.type === 'panel') {
      return '<div class="hero__slide hero__slide--panel" ' + label + '>' +
        '<div class="hero__bg" style="' + bg(s.img) + '"></div>' +
        '<div class="hero__content">' +
        '<span class="eyebrow">' + esc(s.eyebrow) + '</span>' +
        '<h1 class="hero__title">' + esc(s.title) + '</h1>' +
        '<p class="hero__text">' + esc(s.text) + '</p>' +
        '<a class="btn btn--light" href="' + linkFor(s.link) + '">' + esc(s.cta) + ' <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>' +
        '</div></div>';
    }
    return '<a class="hero__slide" href="' + linkFor(s.link) + '" ' + label + '>' +
      /* yanlar görselin kenar renginden geçişle dolar (bulanık büyütülmüş kopya yerine: görsel kaynağından büyük çizilmez) */
      '<span class="hero__bg" style="background:linear-gradient(90deg, ' + s.edge[0] + ', ' + s.edge[1] + ')"></span>' +
      '<span class="hero__media" style="' + bg(s.img) + '" role="img" aria-label="' + esc(s.alt) + '"></span></a>';
  }).join('');
  var heroIndex = 0, heroTimer = null, heroPaused = A.reduceMotion;
  var pauseBtn = $('[data-hero-pause]', hero);
  function heroGo(n) {
    heroIndex = (n + D.hero.length) % D.hero.length;
    track.style.transform = 'translateX(' + (-100 * heroIndex) + '%)';
    $('[data-hero-counter]', hero).textContent = (heroIndex + 1) + '/' + D.hero.length;
    $$('.hero__slide', track).forEach(function (sl, i) {
      sl.setAttribute('aria-hidden', String(i !== heroIndex));
      $$('a, button', sl).concat(sl.tagName === 'A' ? [sl] : []).forEach(function (f) { f.tabIndex = i === heroIndex ? 0 : -1; });
    });
  }
  function heroPlay() {
    clearInterval(heroTimer);
    if (!heroPaused) heroTimer = setInterval(function () { heroGo(heroIndex + 1); }, 6000);
  }
  function syncPause() {
    pauseBtn.setAttribute('aria-label', heroPaused ? 'Otomatik geçişi başlat' : 'Otomatik geçişi durdur');
    pauseBtn.innerHTML = '<i class="fa-solid ' + (heroPaused ? 'fa-play' : 'fa-pause') + '" aria-hidden="true"></i>';
  }
  $('[data-hero-prev]', hero).addEventListener('click', function () { heroGo(heroIndex - 1); heroPlay(); });
  $('[data-hero-next]', hero).addEventListener('click', function () { heroGo(heroIndex + 1); heroPlay(); });
  pauseBtn.addEventListener('click', function () { heroPaused = !heroPaused; syncPause(); heroPlay(); });
  hero.addEventListener('mouseenter', function () { clearInterval(heroTimer); });
  hero.addEventListener('mouseleave', heroPlay);
  (function swipe() {
    var x0 = null;
    track.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    track.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { heroGo(heroIndex + (dx < 0 ? 1 : -1)); heroPlay(); }
    });
  })();
  heroGo(0); syncPause(); heroPlay();

  /* ---------- Duyuru şeridi ---------- */
  var ann = $('[data-announce]');
  ann.innerHTML = D.announcements.map(function (m, i) { return '<p class="announce__msg' + (i ? '' : ' is-active') + '">' + esc(m) + '</p>'; }).join('');
  var annIndex = 0;
  setInterval(function () {
    var msgs = $$('.announce__msg', ann);
    msgs[annIndex].classList.remove('is-active');
    annIndex = (annIndex + 1) % msgs.length;
    msgs[annIndex].classList.add('is-active');
  }, 4500);

  /* ---------- Popüler Kategoriler ---------- */
  $('[data-cat-grid]').innerHTML = D.categories.map(function (c) {
    return '<a class="cat-cell" href="' + A.catUrl(A.catByName(c.name, null)) + '"><span class="cat-cell__img">' + A.catImg(c, 'cat-cell__photo') + '</span>' +
      '<span class="cat-cell__label">' + esc(c.name) + '</span></a>';
  }).join('');

  /* ---------- Kampanya kartları ---------- */
  $('[data-promos]').innerHTML = D.promos.map(function (p) {
    return '<a class="promo-card reveal" href="' + linkFor(p.link) + '"><span class="promo-card__media' + (p.fit === 'contain' ? ' promo-card__media--contain' : '') + '"><span style="' + bg(p.img) + '" role="img" aria-label="' + esc(p.title) + '"></span></span>' +
      '<span class="promo-card__body"><span class="promo-card__text"><span class="promo-card__kicker">' + esc(p.title) + '</span><br>' +
      '<span class="promo-card__cta">' + esc(p.cta) + '</span></span>' +
      '<span class="promo-card__arrow" aria-hidden="true"><i class="fa-solid fa-arrow-right"></i></span></span></a>';
  }).join('');
  $('[data-promos]').classList.add('rail');

  /* ---------- Raflar ve vitrinler (Azem sırası) ---------- */
  var shelfOrder = [
    { shelf: 0, bg: '' }, { showcase: 0, bg: 'sec--white' },
    { shelf: 1, bg: 'sec--white' }, { showcase: 1, bg: '' },
    { shelf: 2, bg: 'sec--white' },
    { shelf: 3, bg: '' }
  ].filter(function (o) { return !('showcase' in o) || !D.showcases[o.showcase].gizli; });
  $('[data-shelves]').outerHTML = shelfOrder.map(function (o, k) {
    if ('showcase' in o) {
      var v = D.showcases[o.showcase];
      return '<section class="sec sec--compact ' + o.bg + '" aria-label="' + esc(v.alt) + '"><div class="wrap">' +
        '<a class="banner-frame' + (v.fill ? ' banner-frame--fill' : '') + ' reveal" href="' + linkFor(v.link) + '" style="--ratio:' + v.ratio +
        (v.fill ? ';--img-px:' + v.fill.px + 'px;--img-h:' + v.fill.h + 'px;--fill:' + v.fill.color : '') + '"><span style="' + bg(v.img, true) + '" role="img" aria-label="' + esc(v.alt) + '"></span></a></div></section>';
    }
    var s = D.shelves[o.shelf], railId = 'rail-' + k;
    var items = s.products.map(function (p) { return resolve(p); }).filter(A.sellable);
    return '<section class="sec ' + o.bg + '"><div class="wrap">' +
      '<div class="sec-head"><h2 class="sec-head__title">' + esc(s.title) + '</h2>' +
      '<div class="sec-head__tools rail-arrows">' +
      '<button class="icon-btn icon-btn--round" type="button" data-rail-prev="' + railId + '" aria-label="Önceki ürünler"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>' +
      '<button class="icon-btn icon-btn--round" type="button" data-rail-next="' + railId + '" aria-label="Sonraki ürünler"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>' +
      '</div></div>' +
      '<div class="rail rail--bleed" id="' + railId + '">' + items.map(A.productCard).join('') + '</div>' +
      '</div></section>';
  }).join('');

  /* ---------- E-bülten ---------- */
  var nl = $('[data-newsletter]');
  nl.addEventListener('submit', function (e) {
    e.preventDefault();
    var input = $('input', nl), email = input.value.trim().toLowerCase();
    var list = A.store.get('azem-ebulten', []);
    if (!email || !input.checkValidity()) A.toast('Email adresi uygun formatta değil !', 'fa-circle-exclamation');
    else if (list.indexOf(email) > -1) A.toast('Email adresiniz E-Bülten listemize daha önce eklenmiş!', 'fa-circle-info');
    else { list.push(email); A.store.set('azem-ebulten', list); input.value = ''; A.toast('Email adresiniz E-Bülten listemize eklendi', 'fa-envelope-circle-check'); }
  });

  A.ready();
})();
