/* ==========================================================================
   Ürün detay — urun.html?u=<ürün id>
   Galeri | içerik (A101 sırası, Azem alanları), sekmeler, Benzer Ürünler,
   yan banner, Birlikte Alınan Ürünler, sabit sepet çubuğu
   ========================================================================== */
(function () {
  'use strict';

  var A = window.AZEM_APP, DB = A.DB;
  var $ = A.$, $$ = A.$$, esc = A.esc, bg = A.bg;
  var icon = function (cls) { return '<i class="' + cls + '" aria-hidden="true"></i>'; };
  var SEP = '<li class="breadcrumb__sep" aria-hidden="true">' + icon('fa-solid fa-chevron-right') + '</li>';

  var body = $('[data-detail]'), bar = $('[data-buy-bar]');
  var p = A.products[A.param('u')];
  var crumbsHtml = '<li><a href="index.html">Ana Sayfa</a></li>';
  function head() { return '<div class="page-head"><nav aria-label="Konum"><ol class="breadcrumb">' + crumbsHtml + '</ol></nav></div>'; }

  /* ---------- Bulunamayan ürün ---------- */
  if (!p) {
    document.title = 'Ürün bulunamadı | Azem Toptan';
    crumbsHtml += SEP + '<li aria-current="page">Ürün bulunamadı</li>';
    body.innerHTML = '<section class="sec sec--white"><div class="wrap">' + head() +
      '<div class="empty empty--box">' + icon('fa-solid fa-box-open') + '<p class="empty__title">Ürün bulunamadı</p>' +
      '<a class="link" href="index.html">Ana Sayfa</a></div></div></section>';
    bar.remove();
    A.ready();
    return;
  }

  document.title = p.name + ' | Azem Toptan';
  $('meta[name="description"]').setAttribute('content', p.name + ' — Azem Toptan');

  /* ---------- Kategori: en derin kategori ve yolu ---------- */
  var deepest = p.cats.map(function (id) { return A.cats[id]; }).filter(Boolean)
    .reduce(function (a, c) { return !a || c.level > a.level ? c : a; }, null);
  var path = deepest ? A.catPath(deepest) : [];
  crumbsHtml += path.map(function (c) {
    return SEP + '<li><a href="' + A.catUrl(c) + '">' + esc(c.name) + '</a></li>';
  }).join('') + SEP + '<li aria-current="page">' + esc(p.name) + '</li>';

  /* ---------- İlk açılış: galeri + içerik iskeleti (A101), ardından gerçek içerik ---------- */
  body.innerHTML = '<section class="sec sec--white sec--compact-bottom" aria-busy="true"><div class="wrap">' + head() +
    '<div class="split" aria-hidden="true"><div class="gallery gallery--single"><div class="gallery__main is-loading"></div></div>' +
    '<div class="stack stack--lg"><div class="stack stack--sm"><span class="skeleton skeleton--text skeleton--xs"></span><span class="skeleton skeleton--title"></span></div>' +
    '<span class="skeleton skeleton--price"></span><span class="skeleton skeleton--text skeleton--short"></span>' +
    '<span class="skeleton skeleton--block"></span><span class="skeleton skeleton--block skeleton--short"></span><span class="skeleton skeleton--panel"></span></div></div>' +
    '</div></section>';
  setTimeout(render, A.reduceMotion ? 0 : 450);
  function render() {

  /* ---------- Galeri: Azem'de tek görsel; büyük alanda 2x dosya, kaynak boyutundan büyük çizilmez (--img-px) ---------- */
  var imgs = p.imgs || (p.img ? [p.img] : []);
  function zoomBg() { return A.productBg(p, true); }
  /* klavye ve dokunmatik için tam ekran düğmesi (kapanınca odak buraya döner) */
  var expand = '<button class="icon-btn icon-btn--round gallery__expand" type="button" aria-label="Görseli büyüt">' + icon('fa-solid fa-expand') + '</button>';
  var gallery = imgs.length > 1
    ? '<div class="gallery" data-gallery>' +
        '<div class="gallery__thumbs" role="tablist" aria-label="Ürün görselleri">' + imgs.map(function (img, i) {
          return '<button class="gallery__thumb" type="button" role="tab" aria-selected="' + (i === 0) + '" aria-label="Görsel ' + (i + 1) + '"><span style="' + bg(img) + '"></span></button>';
        }).join('') + '</div>' +
        '<div class="gallery__main"><div class="gallery__track">' + imgs.map(function (img) {
          var z = zoomBg(img);
          return '<div class="gallery__slide"><span class="gallery__img" role="img" aria-label="' + esc(p.name) + '" style="' + z + '" data-zoom="' + z + '"></span></div>';
        }).join('') + '</div>' + expand + '<span class="gallery__counter">1/' + imgs.length + '</span></div>' +
      '</div>'
    : '<div class="gallery gallery--single" data-gallery><div class="gallery__main"><div class="gallery__track"><div class="gallery__slide">' +
        (imgs.length
          ? '<span class="gallery__img" role="img" aria-label="' + esc(p.name) + '" style="' + zoomBg(imgs[0]) + '" data-zoom="' + zoomBg(imgs[0]) + '"></span>'
          : '<span class="gallery__img gallery__img--empty" role="img" aria-label="Görsel yok">' + icon('fa-solid fa-box-open') + '</span>') +
      '</div></div>' + (imgs.length ? expand : '') + '</div></div>';

  /* ---------- Sağ sütun ---------- */
  var brand = p.brand != null && A.brands[p.brand];
  var fav = A.favs.indexOf(p.id) > -1;
  var opts = p.options && p.options.length ? p.options : [{ label: 'Adet Fiyatı', price: p.price }];
  function priceHtml(price) { return A.formatPrice(price) + (p.old ? '<span class="price__old">' + A.formatPrice(p.old) + '</span>' : ''); }
  function qtyHtml(mod) {
    return '<div class="qty' + mod + '" role="group" aria-label="Adet">' +
      '<button class="qty__btn" type="button" data-qty-dec aria-label="Azalt" disabled>' + icon('fa-solid fa-minus') + '</button>' +
      '<input class="qty__input" type="text" value="1" inputmode="numeric" aria-label="Adet">' +
      '<button class="qty__btn" type="button" data-qty-inc aria-label="Artır">' + icon('fa-solid fa-plus') + '</button></div>';
  }
  var cartBtn = '<button class="btn btn--primary" type="button" data-buy-add>' + icon('fa-solid fa-basket-shopping') + ' Sepete Ekle</button>';
  var service = esc(DB.service).replace('Ücretsiz Kargo !', '<span class="note__em">Ücretsiz Kargo !</span>');

  var info =
    '<div class="stack stack--lg">' +
      '<div class="stack stack--sm">' +
        (brand ? '<span class="eyebrow">' + esc(brand.name) + '</span>' : '') +
        '<div class="cluster cluster--between cluster--nowrap"><h1 class="h3">' + esc(p.name) + '</h1>' +
          '<button class="icon-btn" type="button" data-fav="' + p.id + '" aria-pressed="' + fav + '" aria-label="Favorilere Ekle">' + A.favIcon(fav) + '</button></div>' +
      '</div>' +
      '<p class="price price--lg" data-price>' + priceHtml(opts[0].price) + '</p>' +
      '<p class="text-meta">' + esc(p.short) + '</p>' +
      '<div class="radio-list" role="radiogroup" aria-label="Seçenekler">' + opts.map(function (o, i) {
        return '<label class="radio-card"><input class="check__input" type="radio" name="secenek" value="' + i + '"' + (i ? '' : ' checked') + '>' +
          '<span class="check__box">' + icon('fa-solid fa-check') + '</span>' +
          '<span class="radio-card__label">' + esc(o.label) + '</span><span class="radio-card__meta">' + A.formatPrice(o.price) + '</span></label>';
      }).join('') + '</div>' +
      '<div class="cluster" data-buy-inline>' + qtyHtml('') + cartBtn + '</div>' +
      '<div class="note-list">' +
        '<p class="note">' + icon('fa-solid fa-truck-fast') + '<span>' + service + '</span></p>' +
        '<p class="note">' + icon('fa-solid fa-circle-info') + '<span>' + esc(DB.priceNote) + '</span></p>' +
      '</div>' +
      '<div class="stack stack--sm"><p class="field__label">Güvenli Ödeme Garantisi</p>' +
        '<div class="pay-logos pay-logos--ink" aria-label="Ödeme yöntemleri">' + window.AZEM_SHELL.payLogos() + '</div></div>' +
    '</div>';

  /* ---------- Sekmeler (Taksit Seçenekleri: PayTR dış betiği, K21 → yok) ---------- */
  var tabs = [
    ['aciklama', 'Açıklama', '<p>' + esc(p.desc) + '</p>'],
    ['gonderim', 'Gönderim Bilgisi', DB.texts.gonderim],
    ['iade', 'İade/İptal İşlemler', DB.texts.iade]
  ];
  var tabsHtml = '<div class="tabs tabs--center" data-tabs><div class="tabs__list" role="tablist" aria-label="Ürün bilgileri">' + tabs.map(function (t, i) {
    return '<button class="tabs__tab" type="button" role="tab" id="sekme-' + t[0] + '" aria-controls="panel-' + t[0] + '" aria-selected="' + (i === 0) + '">' + t[1] + '</button>';
  }).join('') + '</div>' + tabs.map(function (t) {
    /* uzun metin 180px'te kesilir, "Daha Fazla Gör" ile açılır (A101) */
    return '<div class="tabs__panel" role="tabpanel" id="panel-' + t[0] + '" aria-labelledby="sekme-' + t[0] + '" tabindex="0">' +
      '<div class="clamp"><div class="clamp__body prose" id="metin-' + t[0] + '">' + t[2] + '</div>' +
      '<button class="btn btn--ghost btn--sm clamp__toggle" type="button" aria-controls="metin-' + t[0] + '">Daha Fazla Gör</button></div></div>';
  }).join('') + '</div>';

  /* ---------- Raflar (K20a: Azem'de boş; aynı kategoriden gerçek ürünler) ---------- */
  var taken = {}; taken[p.id] = true;
  function pick(ids, max, out) {
    out = out || [];
    (ids || []).forEach(function (id) {
      if (out.length < max && !taken[id] && A.products[id]) { taken[id] = true; out.push(A.products[id]); }
    });
    return out;
  }
  /* Benzer: en derin kategori (Azem sırası); 4'ten azsa üst kategoriden tamamla */
  var similar = [];
  for (var c = deepest; c && similar.length < 4; c = A.cats[c.parent]) pick(c.items, 10, similar);
  /* Birlikte: aynı ana kategorinin diğer alt kategorileri (benzerlerle çakışmaz) */
  var root = path[0], sub = path[1];
  var together = root ? pick(root.items.filter(function (id) {
    return A.products[id] && (!sub || A.products[id].cats.indexOf(sub.id) < 0);
  }), 10) : [];

  function shelf(title, items, railId, cls) {
    if (!items.length) return '';
    return '<section class="sec' + cls + '"><div class="wrap">' +
      '<div class="sec-head"><h2 class="sec-head__title">' + title + '</h2>' +
      '<div class="sec-head__tools rail-arrows">' +
      '<button class="icon-btn icon-btn--round" type="button" data-rail-prev="' + railId + '" aria-label="Önceki ürünler">' + icon('fa-solid fa-chevron-left') + '</button>' +
      '<button class="icon-btn icon-btn--round" type="button" data-rail-next="' + railId + '" aria-label="Sonraki ürünler">' + icon('fa-solid fa-chevron-right') + '</button>' +
      '</div></div>' +
      '<div class="rail rail--bleed" id="' + railId + '">' + items.map(A.productCard).join('') + '</div>' +
      '</div></section>';
  }
  /* Yan banner (K24a): Azem'de linki yok → div */
  var sb = DB.sideBanner;
  var banner = sb ? '<section class="sec sec--white sec--compact" aria-label="' + esc(sb.alt) + '"><div class="wrap">' +
    '<div class="banner-frame banner-frame--half reveal" style="--ratio:' + sb.ratio + '"><span style="' + bg(sb.img) + '" role="img" aria-label="' + esc(sb.alt) + '"></span></div>' +
    '</div></section>' : '';

  body.innerHTML =
    '<section class="sec sec--white sec--compact-bottom"><div class="wrap">' + head() + '<div class="split">' + gallery + info + '</div></div></section>' +
    '<section class="sec sec--white sec--flush-top" aria-label="Ürün bilgileri"><div class="wrap">' + tabsHtml + '</div></section>' +
    shelf('Benzer Ürünler', similar, 'rail-benzer', '') +
    banner +
    shelf('Birlikte Alınan Ürünler', together, 'rail-birlikte', '');

  /* ---------- Sabit sepet çubuğu (K25a) ---------- */
  bar.innerHTML = '<div class="wrap buy-bar__inner">' +
    '<div class="buy-bar__item">' + (p.img ? '<span class="buy-bar__img" style="' + A.productBg(p) + '" aria-hidden="true"></span>' : '') +
      '<div><p class="buy-bar__name">' + esc(p.name) + '</p><p class="price" data-price>' + priceHtml(opts[0].price) + '</p></div></div>' +
    qtyHtml(' qty--sm buy-bar__qty') +
    '<div class="buy-bar__actions">' +
      '<button class="btn btn--ghost buy-bar__fav" type="button" data-fav="' + p.id + '" aria-pressed="' + fav + '">' + A.favIcon(fav) + '<span data-fav-label>Favori Listesi</span></button>' +
      cartBtn +
    '</div></div>';

  /* ---------- Davranışlar ---------- */
  var inline = $('[data-buy-inline]', body);
  var qtys = [$('.qty', inline), $('.qty', bar)];

  /* seçenek → fiyat (içerik + çubuk) */
  $$('input[name="secenek"]', body).forEach(function (r) {
    r.addEventListener('change', function () {
      var html = priceHtml(opts[+r.value].price);
      $$('[data-price]').forEach(function (el) { el.innerHTML = html; });
    });
  });
  /* iki adet seçici aynı değeri taşır */
  qtys.forEach(function (box) {
    box.addEventListener('qtychange', function (e) {
      qtys.forEach(function (other) {
        if (other === box) return;
        $('.qty__input', other).value = e.detail;
        $('[data-qty-dec]', other).disabled = e.detail <= 1;
      });
    });
  });
  $$('[data-buy-add]').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = +($('input[name="secenek"]:checked', body) || { value: 0 }).value;
      A.addToCart(p.id, A.qtyValue(qtys[0]), k);
    });
  });

  if (imgs.length) A.initGallery($('[data-gallery]', body));
  A.initTabs(body);
  A.stickyBar(bar, inline);
  A.ready();
  }
})();
