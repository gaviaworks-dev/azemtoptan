/* ==========================================================================
   Azem Toptan — ortak çekirdek (tüm sayfalar)
   Kabuk shell.js'ten gelir; içerik window.AZEM (catalog.js) ve window.AZEM_DB
   (products.js) üzerinden okunur. Sayfa betikleri window.AZEM_APP'i kullanır.
   ========================================================================== */
(function () {
  'use strict';

  var D = window.AZEM || {};
  var DB = window.AZEM_DB || { cats: [], brands: [], products: [] };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mqDesktop = window.matchMedia('(min-width: 1025px)');
  var mqCurtain = window.matchMedia('(min-width: 641px)');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function slug(s) {
    var map = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'İ': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'c', 'Ğ': 'g', 'Ö': 'o', 'Ş': 's', 'Ü': 'u' };
    return String(s).replace(/[çğıİöşüÇĞÖŞÜ]/g, function (c) { return map[c]; }).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  /* Arka plan görseli: 1x + 2x (image-set). single=true → kaynağı 2x'e yetmeyen görsel, tek dosya */
  function bg(path, single) {
    var u = 'assets/' + path;
    if (single) return 'background-image:url(\'' + u + '\')';
    var u2 = u.replace(/\.(\w+)$/, '@2x.$1');
    var set = 'url(\'' + u + '\') 1x, url(\'' + u2 + '\') 2x';
    return 'background-image:url(\'' + u + '\');background-image:-webkit-image-set(' + set + ');background-image:image-set(' + set + ')';
  }
  /* Kategori görseli: tek ikon seti (Font Awesome Solid). Her kategorinin ikonu catalog.js'te (ico);
     eşleşmeyen alt kategori ana kategorinin ikonunu alır. Story şeridi gerçek ürün fotoğrafıyla kalır. */
  function catImg(c, cls) {
    return '<span class="' + cls + ' cat-ico" aria-hidden="true"><i class="fa-solid fa-' + ((c && c.ico) || 'layer-group') + '"></i></span>';
  }
  function toNumber(price) { return typeof price === 'number' ? price : (parseFloat(String(price).replace(/\./g, '').replace(',', '.')) || 0); }
  function formatPrice(n) {
    return toNumber(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
  }
  /* sayfa adresleri tek yerde (shell.js) */
  var URLS = (window.AZEM_SHELL && window.AZEM_SHELL.url) || {};
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* depolama yoksa yoksay */ } }
  };
  function param(name) { return new URLSearchParams(location.search).get(name); }

  /* ---------- Katalog: ürünler, kategoriler, markalar ---------- */
  var products = {}, cats = {}, catBySlug = {}, brands = {};
  DB.products.forEach(function (p) { products[p.id] = p; });
  /* Fiyatı 0,00 ₺ olan ürünler (Azem verisi eksik; referans/azem-eksikler.md) liste, raf ve aramada gösterilmez;
     ürün sayfası adresiyle açılabilir kalır. Kategori sayıları da buna göre. */
  function sellable(p) { return !!p && toNumber(p.price) > 0; }
  DB.cats.forEach(function (c) { c.items = c.items.filter(function (id) { return sellable(products[id]); }); });
  DB.cats.forEach(function (c) { cats[c.id] = c; catBySlug[c.slug] = c; });
  DB.brands.forEach(function (b) { brands[b.id] = b; });
  /* ana sayfa ağacındaki adla eşle (catalog.js yalnız ad taşır) */
  function catByName(name, parentId) {
    var key = slug(name);
    for (var i = 0; i < DB.cats.length; i++) {
      var c = DB.cats[i];
      if (slug(c.name) === key && (parentId === undefined || c.parent === parentId)) return c;
    }
    return null;
  }
  function catPath(c) { var out = []; while (c) { out.unshift(c); c = cats[c.parent]; } return out; }
  function catUrl(c) { return c ? 'kategori.html?k=' + encodeURIComponent(c.slug) : '#'; }
  function productUrl(p) { return p ? 'urun.html?u=' + encodeURIComponent(p.id) : '#'; }

  var cart = store.get('azem-sepet', {});
  var favs = store.get('azem-favori', []).filter(function (id) { return products[id]; });
  /* Satış çeşitleri (Bizim Toptan kalıbı): her üründe Adet · Paket (N Adet) · Koli sırası.
     Kaynak Azem'in seçenekleri; eksik olan türetilir, uydurulmaz:
       adet  = Azem adet fiyatı, yoksa paket ÷ N (ya da koli ÷ N)
       paket = Azem paket fiyatı, yoksa adet × N (N ürün adındaki "N ADET"; koli adedine eşitse paket türetilmez)
       koli  = yalnız Azem'de varsa; yoksa fiyatsız (seçilemez) gösterilir.
     def: Azem'in kendi satış birimi (kart ve hızlı bakış bunu ekler; kart fiyatı da bu). */
  function round2(n) { return Math.round(n * 100) / 100; }
  function saleOptions(p) {
    if (p._sale) return p._sale;
    var az = {}, first = null;
    (p.options || []).forEach(function (o) {
      var t = /^adet/i.test(o.label) ? 0 : /^paket/i.test(o.label) ? 1 : /^koli/i.test(o.label) ? 2 : -1;
      if (t < 0 || az[t]) return;
      az[t] = { price: toNumber(o.price) || null, n: +((/\((\d+)\s*adet\)/i.exec(o.label) || [])[1] || 0) };
      if (first === null) first = t;
    });
    var nameN = +((/(\d+)\s*(?:ADET|AD)\b/i.exec(p.sourceName || '') || [])[1] || 0);
    var each = (az[0] && az[0].price) || (az[1] && az[1].price && az[1].n && az[1].price / az[1].n) || (az[2] && az[2].price && az[2].n && az[2].price / az[2].n) || null;
    var pak = az[1] || null, src = { adet: az[0] ? 'azem' : each ? 'turetildi' : 'yok' };
    if (!pak && each && nameN > 1 && !(az[2] && az[2].n === nameN)) { pak = { price: round2(each * nameN), n: nameN }; src.paket = 'turetildi'; }
    else src.paket = pak ? 'azem' : 'yok';
    var koli = az[2] || null; src.koli = koli ? 'azem' : 'yok';
    var rows = [
      { unit: 'Adet', label: 'Adet Fiyatı', price: each ? round2(each) : null },
      { unit: 'Paket', n: pak && pak.n, label: 'Paket Fiyatı' + (pak && pak.n ? ' (' + pak.n + ' Adet)' : ''), price: pak ? pak.price : null, each: pak && pak.n ? round2(pak.price / pak.n) : null },
      { unit: 'Koli', n: koli && koli.n, label: 'Koli' + (koli && koli.n ? ' Fiyatı (' + koli.n + ' Adet)' : ''), price: koli ? koli.price : null, each: koli && koli.n && koli.price ? round2(koli.price / koli.n) : null }
    ];
    var def = first !== null && rows[first].price ? first : rows.findIndex(function (r) { return r.price; });
    p._sale = { rows: rows, def: def < 0 ? 0 : def, src: src };
    return p._sale;
  }
  /* Sepet anahtarı: ürün id (Azem'in satış birimi) ya da "id~k" (k: 0 adet, 1 paket, 2 koli) */
  function cartKey(id, k) { var p = products[id]; return k == null || !p || k === saleOptions(p).def ? id : id + '~' + k; }
  function cartItem(key) {
    var m = String(key).split('~'), p = products[m[0]];
    if (!p) return null;
    var s = saleOptions(p), k = m[1] != null ? +m[1] : s.def, row = s.rows[k];
    if (!row || !row.price) return null;
    return { p: p, k: k, opt: row, price: row.price, isDefault: k === s.def };
  }
  Object.keys(cart).forEach(function (key) { if (!cartItem(key)) delete cart[key]; });

  /* ---------- İletişim alanları ---------- */
  if (D.contact) {
    $$('[data-address]').forEach(function (el) { el.textContent = D.contact.address; });
    $$('[data-whatsapp]').forEach(function (el) { el.textContent = D.contact.whatsapp; });
    $$('[data-email]').forEach(function (el) { el.textContent = D.contact.email; });
  }

  /* ---------- Masaüstü kategori menüsü ---------- */
  var nav = $('[data-nav]');
  (D.categories || []).forEach(function (cat, ci) {
    var top = catByName(cat.name, null);
    var li = document.createElement('li');
    li.className = 'nav__item';
    li.innerHTML =
      '<a class="nav__link" href="' + catUrl(top) + '" aria-haspopup="true" aria-expanded="false">' + esc(cat.name) + '</a>' +
      '<div class="dropdown"><div class="mega__col"><ul class="dropdown__list">' +
      cat.children.map(function (c, i) {
        var sub = top && catByName(c.name, top.id);
        return '<li><a class="dropdown__item" href="' + catUrl(sub) + '" data-sub="' + ci + '-' + i + '">' +
          catImg(c, 'dropdown__item-img') + esc(c.name) +
          (c.children.length ? '<i class="fa-solid fa-chevron-right dropdown__item-chev" aria-hidden="true"></i>' : '') +
          '</a></li>';
      }).join('') +
      '</ul></div>' +
      cat.children.map(function (c, i) {
        if (!c.children.length) return '';
        var sub = top && catByName(c.name, top.id);
        return '<div class="mega__sub" data-sub-panel="' + ci + '-' + i + '"><p class="mega__sub-title">' + esc(c.name) + '</p>' +
          c.children.map(function (g) { return '<a href="' + catUrl(sub && catByName(g, sub.id)) + '">' + esc(g) + '</a>'; }).join('') + '</div>';
      }).join('') +
      '</div>';
    if (nav) nav.appendChild(li);
  });

  var menuScrim = $('[data-menu-scrim]');
  var navTimer;
  function closeNav() {
    $$('.nav__item.is-open').forEach(function (li) {
      li.classList.remove('is-open');
      var a = $('.nav__link', li); if (a) a.setAttribute('aria-expanded', 'false');
    });
    if (menuScrim) menuScrim.classList.remove('is-open');
  }
  function openNav(li) {
    if (li.classList.contains('is-open')) return;
    closeNav(); closeMenus();
    if (!$('.dropdown', li)) return;
    li.classList.add('is-open');
    $('.nav__link', li).setAttribute('aria-expanded', 'true');
    if (menuScrim) menuScrim.classList.add('is-open');
    var first = $('[data-sub]', li); if (first) showSub(li, first);
  }
  function showSub(li, item) {
    $$('.dropdown__item.is-active', li).forEach(function (x) { x.classList.remove('is-active'); });
    $$('.mega__sub.is-visible', li).forEach(function (x) { x.classList.remove('is-visible'); });
    item.classList.add('is-active');
    var p = $('[data-sub-panel="' + item.getAttribute('data-sub') + '"]', li);
    if (p) p.classList.add('is-visible');
  }
  $$('.nav__item', nav).forEach(function (li) {
    li.addEventListener('mouseenter', function () { clearTimeout(navTimer); navTimer = setTimeout(function () { openNav(li); }, 90); });
    li.addEventListener('mouseleave', function () { clearTimeout(navTimer); navTimer = setTimeout(closeNav, 140); });
    li.addEventListener('focusin', function () { openNav(li); });
    $$('[data-sub]', li).forEach(function (item) {
      item.addEventListener('mouseenter', function () { showSub(li, item); });
      item.addEventListener('focus', function () { showSub(li, item); });
    });
  });
  if (nav) nav.addEventListener('focusout', function (e) { if (!nav.contains(e.relatedTarget)) closeNav(); });

  /* ---------- Hesap / mini sepet menüleri ---------- */
  function closeMenus(except) {
    $$('[data-menu].is-open').forEach(function (m) {
      if (m === except) return;
      m.classList.remove('is-open');
      $$('[data-menu-btn]', m).forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    });
  }
  function bindMenu(m) {
    $$('[data-menu-btn]', m).forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = !m.classList.contains('is-open');
        closeMenus(m); closeNav();
        m.classList.toggle('is-open', open);
        $$('[data-menu-btn]', m).forEach(function (b) { b.setAttribute('aria-expanded', String(open)); });
      });
    });
  }
  $$('[data-menu]').forEach(bindMenu);
  document.addEventListener('click', function (e) { if (!e.target.closest('[data-menu]')) closeMenus(); });

  /* Favori / hesap / sepet: fare ile hover'da açılır, dokunmatikte tıklamayla (yukarıdaki) */
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  $$('[data-menu][data-hover]').forEach(function (m) {
    var timer;
    function set(open) {
      m.classList.toggle('is-open', open);
      $$('[data-menu-btn]', m).forEach(function (b) { b.setAttribute('aria-expanded', String(open)); });
    }
    m.addEventListener('mouseenter', function () {
      if (!finePointer.matches) return;
      clearTimeout(timer); timer = setTimeout(function () { closeMenus(m); closeNav(); set(true); }, 80);
    });
    m.addEventListener('mouseleave', function () {
      if (!finePointer.matches) return;
      clearTimeout(timer); timer = setTimeout(function () { set(false); }, 160);
    });
  });

  /* ---------- Ürün kartı ---------- */
  function cartControl(id) {
    var q = cart[id] || 0;
    if (!q) return '<button class="add-btn" type="button" data-add="' + id + '" aria-label="Sepete Ekle"><i class="fa-solid fa-plus" aria-hidden="true"></i></button>';
    return '<span class="stepper" role="group" aria-label="Adet">' +
      '<button class="stepper__btn" type="button" data-dec="' + id + '" aria-label="Azalt"><i class="fa-solid ' + (q === 1 ? 'fa-trash-can' : 'fa-minus') + '" aria-hidden="true"></i></button>' +
      '<span class="stepper__qty" aria-live="polite">' + q + '</span>' +
      '<button class="stepper__btn" type="button" data-inc="' + id + '" aria-label="Artır"><i class="fa-solid fa-plus" aria-hidden="true"></i></button></span>';
  }
  /* Ürün görseli stili. Dosyalar kare; 2x = kaynağın kendi boyutu (p.px), 1x = en çok 320.
     --img-px: görsel hiçbir kutuda kaynak boyutundan büyük çizilmez (upscale yok). big: büyük alanlar 2x dosyayı tek kaynak kullanır. */
  function productBg(p, big) {
    return (big ? bg(p.img.replace(/\.webp$/, '@2x.webp'), true) : bg(p.img)) + (p.px ? ';--img-px:' + p.px + 'px' : '');
  }
  function productImg(p) {
    return p.img
      ? '<span class="p-card__img" style="' + productBg(p) + '" role="img" aria-label="' + esc(p.name) + '"></span>'
      : '<span class="p-card__img p-card__img--empty" role="img" aria-label="Görsel yok"><i class="fa-solid fa-box-open" aria-hidden="true"></i></span>';
  }
  /* ürün (herhangi bir seçeneğiyle) sepette mi — kart kenarı işaretlenir (A101 topInCart) */
  function inCart(id) { return Object.keys(cart).some(function (k) { return k === id || k.indexOf(id + '~') === 0; }); }
  function productCard(p) {
    var fav = favs.indexOf(p.id) > -1, url = productUrl(p);
    return '<article class="p-card' + (inCart(p.id) ? ' is-in-cart' : '') + '" data-product="' + p.id + '">' +
      '<div class="p-card__media"><a href="' + url + '" tabindex="-1" aria-hidden="true">' + productImg(p) + '</a>' +
      '<div class="p-card__tools">' +
      '<button class="p-card__tool" type="button" data-quick="' + p.id + '" aria-label="Ayrıntı"><i class="fa-regular fa-eye" aria-hidden="true"></i></button>' +
      '<button class="p-card__tool" type="button" data-fav="' + p.id + '" aria-pressed="' + fav + '" aria-label="Favorilere Ekle"><i class="' + (fav ? 'fa-solid' : 'fa-regular') + ' fa-heart" aria-hidden="true"></i></button>' +
      '</div>' +
      '<div class="p-card__cart" data-cart-slot="' + p.id + '">' + cartControl(p.id) + '</div></div>' +
      '<div class="p-card__info"><h3 class="p-card__name"><a href="' + url + '">' + esc(p.name) + '</a></h3>' +
      '<p class="price">' + formatPrice(p.price) + (p.old ? '<span class="price__old">' + formatPrice(p.old) + '</span>' : '') + '</p></div></article>';
  }

  /* ---------- Ray okları (sonradan basılan raflar için tekrar çağrılır) ---------- */
  function railStep(rail) { var c = rail.firstElementChild; return c ? (c.getBoundingClientRect().width + parseFloat(getComputedStyle(rail).columnGap || 0)) * Math.max(1, Math.floor(rail.clientWidth / c.getBoundingClientRect().width) - 1) : rail.clientWidth; }
  function syncRail(rail) {
    var max = rail.scrollWidth - rail.clientWidth - 2;
    $$('[data-rail-prev="' + rail.id + '"]').forEach(function (b) { b.disabled = rail.scrollLeft <= 2; });
    $$('[data-rail-next="' + rail.id + '"]').forEach(function (b) { b.disabled = rail.scrollLeft >= max; });
  }
  function initRails(root) {
    $$('.rail[id]', root).forEach(function (rail) {
      if (rail.hasAttribute('data-rail-ready')) return;
      rail.setAttribute('data-rail-ready', '');
      rail.addEventListener('scroll', function () { syncRail(rail); }, { passive: true });
      syncRail(rail);
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-rail-prev], [data-rail-next]');
    if (!b) return;
    var rail = document.getElementById(b.getAttribute('data-rail-prev') || b.getAttribute('data-rail-next'));
    rail.scrollBy({ left: (b.hasAttribute('data-rail-prev') ? -1 : 1) * railStep(rail) });
  });
  window.addEventListener('resize', function () { $$('.rail[id]').forEach(syncRail); });

  /* ---------- Bildirim (Azem'deki notify mesajları) ---------- */
  var toastBox = $('[data-toasts]');
  /* toast(mesaj, ikon, { tone: 'success' | 'error' | 'info', action: { label, onClick }, ms }) */
  function toast(msg, icon, opt) {
    opt = opt || {};
    var el = document.createElement('p');
    el.className = 'toast' + (opt.tone ? ' toast--' + opt.tone : '') + (opt.action ? ' toast--action' : '');
    el.innerHTML = '<i class="fa-solid ' + (icon || (opt.tone === 'success' ? 'fa-circle-check' : opt.tone === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info')) + '" aria-hidden="true"></i><span>' + esc(msg) + '</span>' +
      (opt.action ? '<button class="toast__action" type="button">' + esc(opt.action.label) + '</button>' : '');
    if (opt.action) $('.toast__action', el).addEventListener('click', function () { opt.action.onClick(); hide(); });
    toastBox.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-in'); });
    var t = setTimeout(hide, opt.ms || (opt.action ? 5000 : 2600));
    function hide() { clearTimeout(t); el.classList.remove('is-in'); setTimeout(function () { el.remove(); }, 300); }
  }

  /* ---------- Sepet ve favoriler ---------- */
  var listeners = [];
  function onCart(fn) { listeners.push(fn); }
  /* Sayaç kuralı (her yerde aynı): sepetteki SATIR (kalem) sayısı — rozet, alt menü, "Sepetim (N ürün)".
     Toptanda adet toplamı (ör. 3 koli + 24 paket) anlam taşımaz; aynı ürünün farklı birimi ayrı satırdır. */
  function cartCount() { return Object.keys(cart).length; }
  var FREE_SHIP = 10000;   /* Azem: 10.000 TL ve üzeri ücretsiz kargo */
  function unitText(row) { return row.unit + (row.n ? ' · ' + row.n + ' Adet' : ''); }
  /* Boş durum kartı (A101): tint zemin, ikon, Azem'in boş metni ve alışverişe dönüş */
  function emptyCard(ic, title) {
    return '<div class="empty empty--box empty--compact"><i class="' + ic + '" aria-hidden="true"></i><p class="empty__title">' + title + '</p>' +
      '<a class="btn btn--primary btn--sm" href="kategori.html">Alışverişe hemen başla <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></div>';
  }
  /* Mini sepet (header paneli; mobilde aynı içerik header altında): başlık + sayı · kayan satırlar · ara toplam, kargo eşiği, butonlar */
  function renderMiniCart() {
    var keys = Object.keys(cart).filter(function (k) { return cartItem(k); });
    var box = $('[data-minicart]');
    if (!box) return;
    if (!keys.length) {
      box.innerHTML = '<div class="mini-cart mini-cart--empty">' + emptyCard('fa-solid fa-basket-shopping', 'Sepetinizde Ürün Bulunamadı!') + '</div>';
      return;
    }
    var total = 0;
    var lines = keys.map(function (key) {
      var it = cartItem(key), p = it.p, q = cart[key], line = toNumber(it.price) * q;
      total += line;
      return '<li class="mc-line">' +
        '<a class="mc-line__img" href="' + productUrl(p) + '" tabindex="-1" aria-hidden="true">' + (p.img ? '<span style="' + productBg(p) + '"></span>' : '') + '</a>' +
        '<div class="mc-line__body">' +
          '<a class="mc-line__name" href="' + productUrl(p) + '">' + esc(p.name) + '</a>' +
          '<p class="mc-line__meta"><span class="unit-badge">' + esc(unitText(it.opt)) + '</span><span>' + formatPrice(it.price) + ' / ' + it.opt.unit + '</span></p>' +
          '<div class="mc-line__row">' +
            '<span class="qty qty--xs" role="group" aria-label="' + esc(p.name) + ' adedi">' +
              '<button class="qty__btn" type="button" data-mc-dec="' + key + '" aria-label="Azalt"' + (q <= 1 ? ' disabled' : '') + '><i class="fa-solid fa-minus" aria-hidden="true"></i></button>' +
              '<span class="qty__input" aria-live="polite">' + q + '</span>' +
              '<button class="qty__btn" type="button" data-mc-inc="' + key + '" aria-label="Artır"><i class="fa-solid fa-plus" aria-hidden="true"></i></button></span>' +
            '<span class="price mc-line__total">' + formatPrice(line) + '</span>' +
          '</div>' +
        '</div>' +
        '<button class="icon-btn mc-line__del" type="button" data-mc-del="' + key + '" aria-label="' + esc(p.name) + ' sepetten çıkar"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button>' +
      '</li>';
    }).join('');
    var left = Math.max(0, FREE_SHIP - total), pct = Math.min(100, total / FREE_SHIP * 100);
    box.innerHTML = '<div class="mini-cart">' +
      '<div class="mini-cart__head"><p class="mini-cart__title">Sepetim <span class="mini-cart__count">(' + keys.length + ' ürün)</span></p></div>' +
      '<ul class="mini-cart__list">' + lines + '</ul>' +
      '<div class="mini-cart__foot">' +
        '<p class="mini-cart__sum"><span>Ara Toplam</span><span class="price">' + formatPrice(total) + '</span></p>' +
        '<div class="ship-meter">' +
          '<p class="ship-meter__text">' + (left ? icon('fa-solid fa-truck-fast') + '<span>10.000 TL ücretsiz kargoya <b>' + formatPrice(left) + '</b> kaldı</span>'
            : icon('fa-solid fa-circle-check') + '<span><b>Kargo ücretsiz</b></span>') + '</p>' +
          '<span class="ship-meter__bar" role="progressbar" aria-label="Ücretsiz kargo eşiği" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(pct) + '"><span style="width:' + pct.toFixed(1) + '%"></span></span>' +
        '</div>' +
        '<div class="mini-cart__actions"><a class="btn btn--ghost" href="' + URLS.sepet + '">Sepete Git</a><a class="btn btn--primary" href="' + URLS.odeme + '">Siparişi Tamamla</a></div>' +
      '</div></div>';
  }
  /* mini sepet içi: adet ve silme (panel yeniden basılırken açık kalsın: belge tıklamasına gitmez) */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-mc-inc], [data-mc-dec], [data-mc-del]');
    if (!t) return;
    e.preventDefault(); e.stopPropagation();
    var key;
    if ((key = t.getAttribute('data-mc-inc'))) cart[key] += 1;
    else if ((key = t.getAttribute('data-mc-dec'))) cart[key] = Math.max(1, cart[key] - 1);
    else if ((key = t.getAttribute('data-mc-del'))) { delete cart[key]; toast('Ürün sepetten çıkarıldı', 'fa-trash-can'); }
    syncCart(key);
    var same = $('[data-minicart] [' + t.getAttributeNames().filter(function (a) { return /^data-mc-/.test(a); })[0] + '="' + key + '"]');
    if (same && !same.disabled) same.focus(); else { var f = $('[data-minicart] button, [data-minicart] a'); if (f) f.focus(); }
  }, true);
  function icon(c) { return '<i class="' + c + '" aria-hidden="true"></i>'; }
  function syncCart(id) {
    store.set('azem-sepet', cart);
    $$('[data-cart-slot="' + id + '"]').forEach(function (slot) {
      var wasAdd = !!slot.querySelector('.add-btn');
      slot.innerHTML = cartControl(id);
      var st = slot.querySelector('.stepper');
      if (st && wasAdd) st.classList.add('is-entering');   /* + → adet seçici: kısa büyüyerek giriş */
    });
    var pid = String(id).split('~')[0];
    $$('.p-card[data-product="' + pid + '"]').forEach(function (c) { c.classList.toggle('is-in-cart', inCart(pid)); });
    var n = cartCount();
    $$('[data-cart-count]').forEach(function (c) { c.textContent = n; c.setAttribute('data-count', n); });
    renderMiniCart();
    listeners.forEach(function (fn) { fn(id); });
  }
  /* k: seçenek sırası (detay sayfası); kart ve hızlı bakış varsayılan seçeneği (0) ekler */
  /* opt.dialog: "Sepete Eklendi" diyaloğu (detay sayfası, A101 Ekstra); yoksa toast (kart +, A101 Kapıda) */
  function addToCart(id, qty, k, opt) {
    var key = cartKey(id, k);
    cart[key] = (cart[key] || 0) + (qty || 1); syncCart(key);
    if (opt && opt.dialog) addedDialog(key);
    else toast('Ürün sepete eklendi', 'fa-basket-shopping', { tone: 'success' });
    return key;
  }
  function renderFavs() {
    var box = $('[data-favlist]');
    if (!box) return;
    if (!favs.length) {
      box.innerHTML = emptyCard('fa-regular fa-heart', 'Favorilerinizde Ürün Bulunamadı!');
      return;
    }
    box.innerHTML = '<ul class="dropdown__list">' + favs.map(function (id) {
      var p = products[id];
      return '<li><a class="dropdown__item" href="' + productUrl(p) + '"><span class="dropdown__item-img" style="' + (p.img ? bg(p.img) : '') + '"></span>' +
        '<span>' + esc(p.name) + '<span class="dropdown__meta">' + formatPrice(p.price) + '</span></span></a></li>';
    }).join('') + '</ul>';
  }
  function favIcon(on) { return '<i class="' + (on ? 'fa-solid' : 'fa-regular') + ' fa-heart" aria-hidden="true"></i>'; }
  function syncFav(id) {
    store.set('azem-favori', favs);
    renderFavs();
    var on = favs.indexOf(id) > -1;
    $$('[data-fav="' + id + '"]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(on));
      var label = b.querySelector('[data-fav-label]');
      b.innerHTML = favIcon(on) + (label ? label.outerHTML : '');
    });
    $$('[data-fav-count]').forEach(function (c) { c.textContent = favs.length; c.setAttribute('data-count', favs.length); });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-add], [data-inc], [data-dec], [data-fav], [data-quick]');
    if (!t) return;
    e.preventDefault();
    var id;
    if ((id = t.getAttribute('data-add')) || (id = t.getAttribute('data-inc'))) { addToCart(id, 1); }
    else if ((id = t.getAttribute('data-dec'))) {
      cart[id] -= 1;
      if (cart[id] <= 0) { delete cart[id]; toast('Ürün sepetten çıkarıldı', 'fa-trash-can'); }
      syncCart(id);
    }
    else if ((id = t.getAttribute('data-fav'))) {
      var i = favs.indexOf(id); if (i > -1) favs.splice(i, 1); else favs.push(id); syncFav(id);
    } else if ((id = t.getAttribute('data-quick'))) { openQuick(id, t); }
    var slot = document.querySelector('[data-cart-slot="' + id + '"] button');
    if (t.closest('[data-cart-slot]') && slot && !t.isConnected) slot.focus();
  });

  /* ---------- Perde yöneticisi: drawer'lar ve modal ---------- */
  var lastFocus = null;
  function lock(on) { document.body.classList.toggle('is-locked', on); }
  function anyOpen() { return !!$('.drawer.is-open, .modal.is-open'); }
  function drawerScrim(d) { return $('[data-drawer-scrim="' + d.id + '"]') || (d.id === 'drawer' ? $('[data-drawer-scrim=""]') : null); }
  function openDrawer(id, trigger) {
    var d = document.getElementById(id); if (!d) return;
    lastFocus = trigger || document.activeElement;
    if (d.contains(tree)) $$('.acc__btn[aria-expanded="true"]', tree).forEach(function (x) { setAcc(x, false); });
    closeMenus(); closeNav();
    d.classList.add('is-open'); var s = drawerScrim(d); if (s) s.classList.add('is-open'); lock(true);
    setTimeout(function () { var c = $('[data-drawer-close]', d); if (c) c.focus(); }, 50);
  }
  function closeDrawer(d) {
    d = d || $('.drawer.is-open');
    if (!d || !d.classList.contains('is-open')) return;
    d.classList.remove('is-open'); var s = drawerScrim(d); if (s) s.classList.remove('is-open'); lock(anyOpen());
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-drawer-open]');
    if (o) { openDrawer(o.getAttribute('data-drawer-open') || 'drawer', o); return; }
    var c = e.target.closest('[data-drawer-close]');
    if (c) { closeDrawer(c.closest('.drawer')); return; }
    var s = e.target.closest('[data-drawer-scrim]');
    if (s) closeDrawer();
  });

  /* Drawer kategori ağacı: iki seviye akordeon, her seviyede tek açık (data-acc-single).
     2. seviye adı alt kategori sayfasına gider; yanındaki düğme chip'leri (3. seviye) açar. */
  var tree = $('[data-drawer-tree]');
  if (tree) {
    tree.setAttribute('data-acc-single', '');
    tree.innerHTML = (D.categories || []).map(function (cat, ci) {
      var top = catByName(cat.name, null);
      return '<div class="acc"><button class="acc__btn" type="button" aria-expanded="false" aria-controls="acc-' + ci + '">' +
        catImg(cat, 'acc__img') + esc(cat.name) + '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
        '<div class="acc__panel" id="acc-' + ci + '"><div><ul class="dropdown__list" data-acc-single>' +
        cat.children.map(function (c, i) {
          var sub = top && catByName(c.name, top.id);
          var link = '<a class="dropdown__item" href="' + catUrl(sub) + '">' + catImg(c, 'dropdown__item-img') + esc(c.name) + '</a>';
          if (!c.children.length) return '<li>' + link + '</li>';
          var pid = 'acc-' + ci + '-' + i;
          return '<li class="acc acc--nested">' + link +
            '<button class="acc__btn acc__btn--toggle" type="button" aria-expanded="false" aria-controls="' + pid + '" aria-label="' + esc(c.name) + ' alt kategorileri"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
            '<div class="acc__panel" id="' + pid + '"><div><div class="acc__sub">' +
            c.children.map(function (g) { return '<a class="chip" href="' + catUrl(sub && catByName(g, sub.id)) + '">' + esc(g) + '</a>'; }).join('') +
            '</div></div></div></li>';
        }).join('') + '</ul></div></div></div>';
    }).join('');
  }

  /* Akordeon (drawer ağacı, liste filtresi, yasal içindekiler — tek bileşen):
     aria-expanded açar/kapatır (CSS: .acc__btn[aria-expanded=true] + .acc__panel); kapalı panel inert;
     [data-acc-single] kabında aynı seviyede tek açık; kapanan bölümün içindekiler de kapanır. */
  function setAcc(b, open) {
    b.setAttribute('aria-expanded', String(open));
    var p = document.getElementById(b.getAttribute('aria-controls'));
    if (!p) return;
    p.inert = !open;
    if (!open) $$('.acc__btn[aria-expanded="true"]', p).forEach(function (x) { setAcc(x, false); });
  }
  function initAcc(root) {
    $$('.acc__btn', root).forEach(function (b) {
      var p = document.getElementById(b.getAttribute('aria-controls'));
      if (p) p.inert = b.getAttribute('aria-expanded') !== 'true';
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.acc__btn');
    if (!b) return;
    var open = b.getAttribute('aria-expanded') !== 'true';
    var group = b.closest('[data-acc-single]');
    if (open && group) $$('.acc__btn[aria-expanded="true"]', group).forEach(function (x) {
      if (x !== b && x.closest('[data-acc-single]') === group && !x.contains(b)) setAcc(x, false);
    });
    setAcc(b, open);
  });
  initAcc(document);

  /* Modal: hızlı bakış ve sayfa modalları aynı perdeyi kullanır */
  var modal = $('#quickView'), modalScrim = $('[data-modal-scrim]');
  function openModal(el, trigger) {
    if (typeof el === 'string') el = document.getElementById(el);
    /* odak dönüşü: tetikleyici odaklanamıyorsa (ör. galeri görseli) o an odaktaki öğe */
    lastFocus = trigger && (trigger.tabIndex >= 0 || trigger.matches('a[href], button, input, select, textarea')) ? trigger : document.activeElement;
    closeMenus(); closeNav();
    el.classList.add('is-open'); modalScrim.classList.add('is-open'); lock(true);
    setTimeout(function () { $('.modal__panel', el).focus(); }, 50);
  }
  function closeModal(el) {
    el = el || $('.modal.is-open');
    if (!el || !el.classList.contains('is-open')) return;
    el.classList.remove('is-open');
    if (!$('.modal.is-open')) modalScrim.classList.remove('is-open');
    lock(anyOpen());
    if (lastFocus) lastFocus.focus();
  }
  function openQuick(id, trigger) {
    var p = products[id];
    lastFocus = trigger;
    $('[data-qv]', modal).innerHTML =
      '<div class="qv__media">' + (p.img ? '<span class="p-card__img" style="' + productBg(p, true) + '"></span>' : '<span class="p-card__img p-card__img--empty"><i class="fa-solid fa-box-open" aria-hidden="true"></i></span>') + '</div>' +
      '<div class="qv__body"><h2 class="qv__name" id="qvName"><a href="' + productUrl(p) + '">' + esc(p.name) + '</a></h2>' +
      '<p class="price price--lg">' + formatPrice(p.price) + (p.old ? '<span class="price__old">' + formatPrice(p.old) + '</span>' : '') + '</p>' +
      '<div class="qv__actions"><div data-cart-slot="' + id + '">' + cartControl(id) + '</div>' +
      '<button class="btn btn--ghost" type="button" data-fav="' + id + '" aria-pressed="' + (favs.indexOf(id) > -1) + '" aria-label="Favorilere Ekle">' + favIcon(favs.indexOf(id) > -1) + '</button>' +
      '</div></div>';
    openModal(modal, trigger);
  }
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-modal-close]');
    if (c) { closeModal(c.closest('.modal')); return; }
    if (e.target === modalScrim) { closeModal(); return; }
    if (e.target.classList && e.target.classList.contains('modal')) closeModal(e.target);
  });

  var escHandlers = [];
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    for (var i = 0; i < escHandlers.length; i++) if (escHandlers[i]()) return;
    if ($('.modal.is-open')) closeModal();
    else if ($('.drawer.is-open')) closeDrawer();
    else { closeMenus(); closeNav(); }
  });

  /* ---------- Header: gölge, mobil katlanma, arama; alt menü; yukarı çık ---------- */
  var header = $('#siteHeader');
  var bottomNav = $('#bottomNav');
  var toTop = $('[data-to-top]');
  var lastY = window.scrollY;
  /* Yön algısı (header ve liste chip satırı): birikimli eşik + durum değişiminden sonra kısa kilit.
     Katlanan alan sayfa yüksekliğini değiştirir; tarayıcının kaydırma sabitlemesi scrollY'yi geri çeker
     ve bu "yukarı" sanılırdı (açıl-kapan döngüsü). Kilit, geçiş süresi boyunca yeni yön kararını engeller. */
  function scrollDir(state) {
    var y = window.scrollY, now = Date.now();
    if (now < state.lock) { state.anchor = y; return 0; }
    var d = y - state.anchor;
    if (d > (state.down || 16)) { state.anchor = y; return 1; }
    if (d < -(state.up || 16)) { state.anchor = y; return -1; }
    return 0;
  }
  var hdrDir = { anchor: window.scrollY, lock: 0 };
  /* sticky yan sütun ve araç çubukları header'ın altına oturur: yüksekliği CSS'e yaz */
  function syncHeaderH() { document.documentElement.style.setProperty('--hdr-h', header.offsetHeight + 'px'); }
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 4);
    if (!mqDesktop.matches) {
      var compact = y > 90;
      if (compact !== header.classList.contains('is-compact')) hdrDir.lock = Date.now() + 420;   /* boy değişimi sabitleme sıçraması */
      header.classList.toggle('is-compact', compact);
      var dir = scrollDir(hdrDir), was = header.classList.contains('is-revealed');
      if (!compact) { header.classList.remove('is-search-open'); header.classList.remove('is-revealed'); }
      else if (dir < 0) header.classList.add('is-revealed');
      else if (dir > 0) header.classList.remove('is-revealed');
      if (was !== header.classList.contains('is-revealed')) hdrDir.lock = Date.now() + 420;
    }
    if (y < 80 || y < lastY - 6) bottomNav.classList.remove('is-hidden');
    else if (y > lastY + 12) bottomNav.classList.add('is-hidden');
    toTop.classList.toggle('is-visible', y > 600);
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Yan sütun drawer'ı (masaüstü): azami yükseklik = ekranın altına kadar kalan alan.
     Yapışmadan önce sütun daha aşağıda başlar; sabit hesap alttaki Filtrele satırını ekran dışına iterdi. */
  var asideRaf = 0;
  function stickyH() { return parseFloat(document.documentElement.style.getPropertyValue('--sticky-h')) || 0; }
  function syncAside() {
    asideRaf = 0;
    $$('.drawer--aside').forEach(function (a) {
      if (!mqDesktop.matches) { a.style.removeProperty('--aside-max'); return; }
      var stuck = header.offsetHeight + stickyH() + 24, top = Math.max(a.getBoundingClientRect().top, stuck);
      a.style.setProperty('--aside-max', Math.max(240, window.innerHeight - top - 24) + 'px');
    });
  }
  function queueAside() { if (!asideRaf) asideRaf = requestAnimationFrame(syncAside); }
  window.addEventListener('scroll', queueAside, { passive: true });

  /* Liste üstü yapışık blok (kategori çubuğu + chip'ler): yüksekliği --sticky-h; yapışınca .is-stuck,
     yapışıkken görseller kapanır (.is-compact), sayfanın üstüne dönünce geri açılır */
  var listSticky = $('.list-sticky');
  if (listSticky) {
    var setStickyH = function () { document.documentElement.style.setProperty('--sticky-h', listSticky.offsetHeight + 'px'); queueAside(); };
    if ('ResizeObserver' in window) new ResizeObserver(setStickyH).observe(listSticky);
    setStickyH();
    /* A101 ölçümü: chip satırı ~120px birikimli aşağıda gizlenir, 16px yukarıda geri gelir */
    var stickRaf = 0, chipDir = { anchor: window.scrollY, lock: 0, down: 120, up: 16 };
    var syncStick = function () {
      stickRaf = 0;
      var y = window.scrollY;
      var stuck = y > 0 && listSticky.getBoundingClientRect().top <= header.offsetHeight + 1;
      listSticky.classList.toggle('is-stuck', stuck);
      /* histerezis (A101): yapışınca kompakt olur, yalnız sayfanın en üstüne dönünce açılır —
         daralma sayfayı oynattığı için yapışma sınırında açıl-kapan titremesi olmaz */
      if (stuck) listSticky.classList.add('is-compact');
      else if (y <= 8) listSticky.classList.remove('is-compact');
      /* chip satırı: yapışıkken aşağı kaydırınca gizlenir, yukarı kaydırınca geri gelir (A101 chipsHidden) */
      var dir = scrollDir(chipDir), was = listSticky.classList.contains('is-chips-hidden');
      if (!stuck || dir < 0) listSticky.classList.remove('is-chips-hidden');
      else if (dir > 0) listSticky.classList.add('is-chips-hidden');
      if (was !== listSticky.classList.contains('is-chips-hidden')) chipDir.lock = Date.now() + 420;
    };
    window.addEventListener('scroll', function () { if (!stickRaf) stickRaf = requestAnimationFrame(syncStick); }, { passive: true });
    syncStick();
  }
  window.addEventListener('resize', queueAside);
  window.addEventListener('load', queueAside);
  syncHeaderH();
  if ('ResizeObserver' in window) new ResizeObserver(syncHeaderH).observe(header);
  $$('[data-search-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      header.classList.toggle('is-search-open');
      if (header.classList.contains('is-search-open')) $('#mobileSearch').focus();
    });
  });
  $$('[data-search-focus]').forEach(function (b) {
    b.addEventListener('click', function () {
      header.classList.add('is-search-open');
      $('#mobileSearch').focus({ preventScroll: true });
    });
  });
  /* ---------- Arama: öneri paneli (A101) — katalogdan ürün ve kategori, eşleşen kısım kalın ----------
     Enter / "tüm sonuçlar" → kategori.html?q= (liste şablonu arama sonucu olarak açılır) */
  function lowerTR(s) { return String(s).toLocaleLowerCase('tr-TR'); }
  /* Türkçe harfsiz yedek eşleşme: birebir sonuç yoksa "cay" → "çay" (ç ğ ı ö ş ü sadeleştirilir) */
  function fold(s) { return lowerTR(s).replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u'); }
  function searchProducts(q) {
    q = lowerTR(String(q).trim());
    if (!q) return [];
    var hit = DB.products.filter(function (p) { return sellable(p) && lowerTR(p.name).indexOf(q) > -1; });
    if (hit.length) return hit;
    var f = fold(q);
    return DB.products.filter(function (p) { return sellable(p) && fold(p.name).indexOf(f) > -1; });
  }
  function markHit(name, q) {
    var i = lowerTR(name).indexOf(q);
    return i < 0 ? esc(name) : esc(name.slice(0, i)) + '<mark>' + esc(name.slice(i, i + q.length)) + '</mark>' + esc(name.slice(i + q.length));
  }
  function searchUrl(q) { return 'kategori.html?q=' + encodeURIComponent(q.trim()); }
  $$('[data-search]').forEach(function (form, fi) {
    var input = $('input', form), panel = $('.search-panel', form), clear = $('[data-search-clear]', form), timer = 0;
    function items() { return $$('[role="option"]', panel); }
    function setOpen(on) {
      form.classList.toggle('is-open', on);
      input.setAttribute('aria-expanded', String(on));
      if (mqDesktop.matches && menuScrim) menuScrim.classList.toggle('is-open', on);
      if (!on) { input.removeAttribute('aria-activedescendant'); items().forEach(function (o) { o.setAttribute('aria-selected', 'false'); }); }
    }
    function render() {
      var raw = input.value.trim(), q = lowerTR(raw);
      var n = 0, opt = function (href, inner) { return '<a class="search-panel__item" role="option" id="arama-' + fi + '-' + (n++) + '" aria-selected="false" href="' + href + '">' + inner + '</a>'; };
      clear.hidden = !input.value;
      if (q.length < 2) {
        /* odakta, yazmadan önce: Azem'in "Popüler Kategoriler" modülü (A101 "Popüler Aramalar" yerinde) */
        if (document.activeElement !== input) { setOpen(false); return; }
        panel.innerHTML = '<p class="search-panel__title" role="presentation">Popüler Kategoriler</p><div class="search-panel__list" role="presentation">' +
          (D.categories || []).map(function (c) {
            return opt(catUrl(catByName(c.name, null)), catImg(c, 'search-panel__img') + '<span>' + esc(c.name) + '</span>');
          }).join('') + '</div>';
        setOpen(true); return;
      }
      var prods = searchProducts(raw), catsHit = DB.cats.filter(function (c) { return c.items.length && lowerTR(c.name).indexOf(q) > -1; }).slice(0, 4);
      panel.innerHTML =
        (prods.length ? '<p class="search-panel__title" role="presentation">Ürünler</p><div class="search-panel__list" role="presentation">' + prods.slice(0, 5).map(function (p) {
          return opt(productUrl(p), (p.img ? '<span class="search-panel__img" style="' + bg(p.img) + '" aria-hidden="true"></span>' : '<span class="search-panel__img search-panel__img--icon" aria-hidden="true"><i class="fa-solid fa-box-open"></i></span>') + '<span>' + markHit(p.name, q) + '</span>');
        }).join('') + '</div>' : '') +
        (catsHit.length ? '<p class="search-panel__title" role="presentation">Kategoriler</p><div class="search-panel__list" role="presentation">' + catsHit.map(function (c) {
          return opt(catUrl(c), '<span class="search-panel__img search-panel__img--icon" aria-hidden="true"><i class="fa-solid fa-layer-group"></i></span><span>' + markHit(c.name, q) + ' <span class="chip__count">(' + c.items.length + ')</span></span>');
        }).join('') + '</div>' : '') +
        (prods.length ? '<div class="search-panel__all" role="presentation">' + opt(searchUrl(raw), '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><span>“' + esc(raw) + '” için tüm sonuçlar (' + prods.length + ')</span>') + '</div>'
          : (catsHit.length ? '' : '<p class="search-panel__empty" role="presentation">Ürün bulunamadı</p>'));
      setOpen(true);
    }
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(render, 150); });
    input.addEventListener('focus', render);
    clear.addEventListener('click', function () { input.value = ''; input.focus(); render(); });
    input.addEventListener('keydown', function (e) {
      var list = items(), cur = list.indexOf($('[aria-selected="true"]', panel));
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!list.length) return;
        e.preventDefault();
        var next = list[(cur + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length];
        list.forEach(function (o) { o.setAttribute('aria-selected', String(o === next)); });
        input.setAttribute('aria-activedescendant', next.id);
        next.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && cur > -1) { e.preventDefault(); location.href = list[cur].href; }
      else if (e.key === 'Escape' && form.classList.contains('is-open')) { e.stopPropagation(); setOpen(false); }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (input.value.trim()) location.href = searchUrl(input.value);
    });
    document.addEventListener('click', function (e) { if (!form.contains(e.target)) setOpen(false); });
    form.addEventListener('focusout', function (e) { if (!form.contains(e.relatedTarget)) setTimeout(function () { if (!form.contains(document.activeElement)) setOpen(false); }, 0); });
  });
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });

  /* ---------- Footer perde açılışı (DadaGastro mekanizması) ----------
     ≥641'de footer position:fixed; gövdeye footer yüksekliği kadar dip boşluğu
     açılmazsa son ekranı kalıcı örter. ResizeObserver border-box izler (dolgu
     değişince content-box aynı kalır, gözlemci tetiklenmezdi); fontlar ve tam
     yükleme sonrası yeniden ölçülür. <641'de footer normal akışta, boşluk 0. */
  var footer = $('#siteFooter'), main = $('.page-main');
  function syncFooter() {
    /* perde yalnız footer ekrana sığıyorsa: tablette footer (≈965px) kısa ekrandan uzun olunca üstü erişilemez kalırdı */
    var curtain = mqCurtain.matches && footer.offsetHeight <= window.innerHeight;
    document.documentElement.classList.toggle('no-curtain', !curtain);
    main.style.marginBottom = (curtain ? footer.offsetHeight : 0) + 'px';
  }
  syncFooter();
  window.addEventListener('resize', syncFooter);
  window.addEventListener('load', syncFooter);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncFooter);
  if ('ResizeObserver' in window) new ResizeObserver(syncFooter).observe(footer, { box: 'border-box' });

  /* ---------- Çerez ---------- */
  var cookie = $('[data-cookie]');
  if (!store.get('azem-cerez', null)) cookie.hidden = false;
  $$('[data-cookie-choice]').forEach(function (b) {
    b.addEventListener('click', function () { store.set('azem-cerez', b.getAttribute('data-cookie-choice')); cookie.hidden = true; });
  });

  /* ---------- Kaydırınca belirme (sonradan basılan içerik için tekrar çağrılır) ---------- */
  var io = ('IntersectionObserver' in window && !reduceMotion) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -7% 0px' }) : null;
  function reveal(root) {
    $$('.reveal:not(.is-in)', root).forEach(function (r) { if (io) io.observe(r); else r.classList.add('is-in'); });
  }

  /* ==========================================================================
     Bileşen davranışları — sayfa betikleri yalnız çağırır
     ========================================================================== */

  /* Sekmeler: [data-tabs] > .tabs__list [role=tab][aria-controls] ; ok tuşları, Home/End */
  function initTabs(root) {
    $$('[data-tabs]', root).forEach(function (box) {
      if (box.hasAttribute('data-tabs-ready')) return;
      box.setAttribute('data-tabs-ready', '');
      var tabs = $$('[role="tab"]', box);
      function select(t, focus) {
        tabs.forEach(function (x) {
          var on = x === t;
          x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1;
          var p = document.getElementById(x.getAttribute('aria-controls')); if (p) { p.hidden = !on; if (on) measureClamp(p); }
        });
        if (focus) t.focus();
      }
      tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { select(t); });
        t.addEventListener('keydown', function (e) {
          var n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
          if (n === undefined) return;
          e.preventDefault(); select(tabs[(n + tabs.length) % tabs.length], true);
        });
      });
      select(tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0]);
    });
  }

  /* Daha Fazla Gör (A101): .clamp > .clamp__body + .clamp__toggle; yalnız uzun içerikte etkin.
     Gizli sekmede ölçülemez → sekme açılınca yeniden ölçülür. */
  function measureClamp(root) {
    $$('.clamp', root).forEach(function (c) {
      var body = $('.clamp__body', c), btn = $('.clamp__toggle', c);
      if (!body || !body.offsetParent || c.hasAttribute('data-clamp-ready')) return;
      c.setAttribute('data-clamp-ready', '');
      if (body.scrollHeight <= 220) return;
      c.classList.add('is-clamped');
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', function () {
        var open = !c.classList.contains('is-open');
        c.classList.toggle('is-open', open);
        body.style.maxHeight = open ? body.scrollHeight + 'px' : '';
        btn.setAttribute('aria-expanded', String(open));
        btn.textContent = open ? 'Daha Az Gör' : 'Daha Fazla Gör';
      });
    });
  }

  /* Şifre gözü: <button data-eye="inputId"> */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-eye]');
    if (!b) return;
    var input = document.getElementById(b.getAttribute('data-eye'));
    var show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    b.setAttribute('aria-pressed', String(show));
    b.setAttribute('aria-label', show ? 'Şifreyi gizle' : 'Şifreyi göster');
    b.innerHTML = '<i class="fa-solid ' + (show ? 'fa-eye-slash' : 'fa-eye') + '" aria-hidden="true"></i>';
  });

  /* Telefon: <input data-phone> "0" öneki dışarıda; görünüm 5xx xxx xx xx, değer 11 hane (0 + 10) */
  function phoneDigits(input) { var d = input.value.replace(/\D/g, ''); return d ? '0' + d : ''; }
  document.addEventListener('input', function (e) {
    var input = e.target.closest && e.target.closest('[data-phone]');
    if (!input) return;
    var d = input.value.replace(/\D/g, '');
    if (/^\s*\+/.test(input.value) || (d.length > 10 && d.indexOf('90') === 0)) d = d.replace(/^90/, '');   /* +90 / 90 ülke kodu */
    d = d.replace(/^0+/, '').slice(0, 10);
    var parts = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)].filter(Boolean);
    input.value = parts.join(' ');
  });

  /* Adet seçici: .qty > [data-qty-dec] input.qty__input [data-qty-inc] ; 1–999 */
  function qtyValue(box) { var i = $('.qty__input', box); return Math.min(999, Math.max(1, parseInt(i.value, 10) || 1)); }
  function qtySync(box, v) {
    var i = $('.qty__input', box); i.value = v;
    var dec = $('[data-qty-dec]', box); if (dec) dec.disabled = v <= 1;
    box.dispatchEvent(new CustomEvent('qtychange', { bubbles: true, detail: v }));
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-qty-inc], [data-qty-dec]');
    if (!b) return;
    var box = b.closest('.qty');
    qtySync(box, Math.min(999, Math.max(1, qtyValue(box) + (b.hasAttribute('data-qty-inc') ? 1 : -1))));
  });
  document.addEventListener('change', function (e) {
    if (e.target.classList && e.target.classList.contains('qty__input')) { var box = e.target.closest('.qty'); qtySync(box, qtyValue(box)); }
  });

  /* Fiyat aralığı: initRange(el, {min, max, from, to, step, format, onInput}) — .range içinde iki .range__input */
  function initRange(el, o) {
    var inputs = $$('.range__input', el), lo = inputs[0], hi = inputs[1];
    var out = $$('[data-range-out]', el);
    var fmt = o.format || function (v) { return v; };
    [lo, hi].forEach(function (i) { i.min = o.min; i.max = o.max; i.step = o.step || 1; });
    lo.value = o.from != null ? o.from : o.min; hi.value = o.to != null ? o.to : o.max;
    function paint(src) {
      var a = +lo.value, b = +hi.value;
      if (a > b) { if (src === lo) lo.value = a = b; else hi.value = b = a; }
      var span = (o.max - o.min) || 1;
      el.style.setProperty('--lo', ((a - o.min) / span) * 100);
      el.style.setProperty('--hi', ((b - o.min) / span) * 100);
      lo.setAttribute('aria-valuetext', fmt(a)); hi.setAttribute('aria-valuetext', fmt(b));
      if (out[0]) out[0].textContent = fmt(a);
      if (out[1]) out[1].textContent = fmt(b);
      if (o.onInput && src) o.onInput(a, b);
    }
    lo.addEventListener('input', function () { paint(lo); });
    hi.addEventListener('input', function () { paint(hi); });
    paint();
    return { get: function () { return [+lo.value, +hi.value]; }, set: function (a, b) { lo.value = a; hi.value = b; paint(); } };
  }

  /* Galeri: [data-gallery] — küçük görseller, kaydırma, sayaç; fare ile büyüteç, dokunmatikte tam ekran */
  var coarse = window.matchMedia('(hover: none), (pointer: coarse)');
  function initGallery(el) {
    var track = $('.gallery__track', el), slides = $$('.gallery__slide', el), thumbs = $$('.gallery__thumb', el);
    var counter = $('.gallery__counter', el), i = 0;
    function go(n) {
      i = Math.max(0, Math.min(slides.length - 1, n));
      track.style.transform = 'translateX(' + (-100 * i) + '%)';
      thumbs.forEach(function (t, k) { t.setAttribute('aria-selected', String(k === i)); });
      if (counter) counter.textContent = (i + 1) + '/' + slides.length;
    }
    thumbs.forEach(function (t, k) { t.addEventListener('click', function () { go(k); }); });
    var x0 = null;
    track.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    track.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
      else if (coarse.matches) openLightbox(slides[i]);
    });
    if (!coarse.matches) {
      el.classList.add('gallery--zoom');
      slides.forEach(function (s) {
        var zi = $('.gallery__img[data-zoom]', s);
        /* büyüteç 1:1 kaynak pikseli gösterir; kaynak kutudan belirgin büyük değilse büyüteç yok (büyütme olmaz) */
        if (!zi || !(parseFloat(zi.style.getPropertyValue('--img-px')) > zi.clientWidth * 1.15)) return;
        s.classList.add('is-zoomable');
        s.addEventListener('mousemove', function (e) {
          var r = s.getBoundingClientRect();
          s.style.setProperty('--zx', ((e.clientX - r.left) / r.width * 100) + '%');
          s.style.setProperty('--zy', ((e.clientY - r.top) / r.height * 100) + '%');
          s.classList.add('is-zooming');
        });
        s.addEventListener('mouseleave', function () { s.classList.remove('is-zooming'); });
      });
    }
    var expand = $('.gallery__expand', el);
    if (expand) expand.addEventListener('click', function () { openLightbox(slides[i], expand); });
    go(0);
  }
  var lightbox = null;
  function openLightbox(slide, trigger) {
    var img = slide && $('.gallery__img[data-zoom]', slide);
    if (!img) return;
    if (!lightbox) {
      document.body.insertAdjacentHTML('beforeend',
        '<div class="modal" id="lightbox" role="dialog" aria-modal="true" aria-label="Ürün görseli"><div class="modal__panel modal__panel--media" tabindex="-1">' +
        '<button class="icon-btn icon-btn--round modal__close" type="button" data-modal-close aria-label="Kapat"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
        '<span class="lightbox__img" role="img"></span></div></div>');
      lightbox = $('#lightbox');
    }
    var box = $('.lightbox__img', lightbox);
    box.setAttribute('style', img.getAttribute('data-zoom'));
    $('.modal__panel', lightbox).style.setProperty('--img-px', img.style.getPropertyValue('--img-px'));
    box.setAttribute('aria-label', img.getAttribute('aria-label') || '');
    /* dokunarak açılınca (slayt odaklanamaz) odak "Görseli büyüt" düğmesine döner */
    openModal(lightbox, trigger || $('.gallery__expand', slide.closest('.gallery')) || slide);
  }

  /* Scroll-spy: bağlantıların hedefi görünür olunca aria-current="true" */
  function scrollSpy(links, onChange) {
    var map = links.map(function (a) { return { a: a, t: document.getElementById(decodeURIComponent(a.hash.slice(1))) }; }).filter(function (m) { return m.t; });
    function pick() {
      var line = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr-h')) || 0) + 40, cur = map[0];
      map.forEach(function (m) { if (m.t.getBoundingClientRect().top - line <= 0) cur = m; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) cur = map[map.length - 1];
      map.forEach(function (m) { if (m === cur) m.a.setAttribute('aria-current', 'true'); else m.a.removeAttribute('aria-current'); });
      if (onChange && cur) onChange(cur.a);
    }
    window.addEventListener('scroll', pick, { passive: true });
    window.addEventListener('resize', pick);
    pick();
    return pick;
  }

  /* Sabit çubuk: sentinel ekranın üstünden çıkınca bar görünür; body.has-buybar alt menüyü gizler.
     end (isteğe bağlı): bu öğe ekrandayken çubuk gizlenir (ör. mobilde içeriğin altına inen sipariş özeti) */
  function stickyBar(bar, sentinel, end) {
    /* gizli çubuk (ör. .buy-bar--mobile masaüstünde) alt menüyü ve yukarı çık'ı kaydırmaz; genişlik değişince yeniden bakılır */
    var raw = false, endIn = {};
    function set(on) {
      raw = on;
      on = on && !endIn.end && !endIn.page && getComputedStyle(bar).display !== 'none';
      bar.classList.toggle('is-visible', on); bar.setAttribute('aria-hidden', String(!on));
      if ('inert' in bar) bar.inert = !on;
      document.body.classList.toggle('has-buybar', on);
    }
    set(false);
    window.addEventListener('resize', function () { set(raw); });
    if (!('IntersectionObserver' in window)) return;
    /* kök alttan sınırsız genişletilir: sentinel yalnız ekranın ÜSTÜNDEN çıkınca görünmez sayılır.
       (alttan-görünmez → üstten-görünmez tek karede atlanınca isIntersecting değişmez, çubuk takılırdı)
       Üst pay = header yüksekliği: alan header'ın altına girdiği anda çubuk belirir. Header boyu değişince yeniden kurulur. */
    var io = null, lastH = -1;
    function observe() {
      var h = header.offsetHeight;
      if (h === lastH) return;
      lastH = h;
      if (io) io.disconnect();
      io = new IntersectionObserver(function (en) { set(!en[0].isIntersecting); }, { rootMargin: '-' + h + 'px 0px 100000px 0px' });
      io.observe(sentinel);
    }
    observe();
    if ('ResizeObserver' in window) new ResizeObserver(observe).observe(header);
    function watchEnd(el, k, opt) { new IntersectionObserver(function (en) { endIn[k] = en[0].isIntersecting; set(raw); }, opt).observe(el); }
    if (end) watchEnd(end, 'end');
    /* sayfa sonu: içerik bitip footer görünmeye başlayınca çubuk çekilir, footer'ın son satırını örtmez */
    var pageEnd = $('.page-main > .page-end');
    if (!pageEnd) { pageEnd = document.createElement('span'); pageEnd.className = 'page-end'; pageEnd.setAttribute('aria-hidden', 'true'); $('.page-main').appendChild(pageEnd); }
    /* kök üstten sınırsız: işaret ekranın altına girdiği andan itibaren (üstten çıksa da) çubuk kapalı */
    watchEnd(pageEnd, 'page', { rootMargin: '100000px 0px 0px 0px' });
  }

  /* Alan hatası: .field içindeki .field__error; aria-invalid + aria-describedby */
  /* metin alanı: hata .field'ın sonuna; onay kutusu: .check'in hemen altına */
  function errorEl(input, create) {
    var field = input.closest('.field'), check = input.closest('.check');
    var err = field ? $('.field__error', field) : (check && check.nextElementSibling && check.nextElementSibling.classList.contains('field__error') ? check.nextElementSibling : null);
    if (!err && create) {
      err = document.createElement('p'); err.className = 'field__error';
      err.id = (input.id || input.name || 'alan') + '-hata';
      if (field) field.appendChild(err); else (check || input).after(err);
    }
    return err;
  }
  function setError(input, msg) {
    var err = errorEl(input, true);
    err.innerHTML = '<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><span>' + esc(msg) + '</span>';
    err.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    var ids = (input.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
    if (ids.indexOf(err.id) < 0) ids.push(err.id);
    input.setAttribute('aria-describedby', ids.join(' '));
  }
  function clearError(input) {
    var err = errorEl(input, false);
    if (err) err.hidden = true;
    input.removeAttribute('aria-invalid');
  }

  /* Yükleme durumu: arka plan görseli (image-set dahil) yüklenene kadar kutusunda shimmer.
     Önbellekteki görselde hiç gösterilmez (göz kırpması olmasın). */
  var IMG_BOXES = '.p-card__media, .story__ring, .banner-frame, .hero__frame, .gallery__main, .gallery__thumb, .promo-card__media, .cat-cell__img, .buy-bar__img, .qv__media';
  function bgUrls(el) {
    var v = getComputedStyle(el).backgroundImage, out = [];
    if (!v || v === 'none') return out;
    var list = [];
    v.replace(/url\("?([^")]+)"?\)\s*([\d.]+x)?/g, function (_, u, d) { list.push({ u: u, d: parseFloat(d) || 1 }); });
    if (!list.length) return out;
    var want = (window.devicePixelRatio || 1) >= 1.5 ? 2 : 1;
    out.push((list.filter(function (x) { return x.d === want; })[0] || list[list.length - 1]).u);
    return out;
  }
  function watchImages(root) {
    $$(IMG_BOXES, root).forEach(function (box) {
      if (box.hasAttribute('data-img-watch')) return;
      box.setAttribute('data-img-watch', '');
      var urls = [box].concat($$('*', box)).reduce(function (acc, el) {
        bgUrls(el).forEach(function (u) { if (acc.indexOf(u) < 0) acc.push(u); }); return acc;
      }, []);
      if (!urls.length) return;
      var pending = 0;
      urls.forEach(function (u) {
        var img = new Image();
        img.src = u;
        if (img.complete && img.naturalWidth) return;
        pending++;
        img.onload = img.onerror = function () {
          if (--pending) return;
          box.classList.add('is-loaded');
          setTimeout(function () { box.classList.remove('is-loading', 'is-loaded'); }, 340);
        };
      });
      if (pending) box.classList.add('is-loading');
    });
  }
  /* Türkçe heceleme (Hyphenopoly, self-hosted): Chrome Türkçe hecelemediği için iki yana yaslı paragraflarda
     büyük boşluklar açılıyordu. Betik yalnız uzun metin olan sayfada yüklenir; metne yumuşak tire (&shy;) ekler. */
  var HYPH_SEL = '.prose p:not(.prose__title)', hyphLoad = null;
  function hyphenate(root) {
    var els = $$(HYPH_SEL, root).filter(function (el) { return !el.hasAttribute('data-hyph'); });
    if (!els.length) return;
    els.forEach(function (el) { el.setAttribute('data-hyph', ''); });
    if (!hyphLoad) hyphLoad = new Promise(function (res, rej) {
      var sc = document.createElement('script');
      sc.src = 'assets/vendor/hyphenopoly/Hyphenopoly_Loader.js';
      sc.onload = function () {
        var sel = {}; sel[HYPH_SEL] = { minWordLength: 6, orphanControl: 2 };
        window.Hyphenopoly.config({ require: { tr: 'FORCEHYPHENOPOLY' }, setup: { hide: 'none', selectors: sel } });
        window.Hyphenopoly.hyphenators.HTML.then(res, rej);
      };
      sc.onerror = rej;
      document.head.appendChild(sc);
    });
    hyphLoad.then(function (hy) { els.forEach(function (el) { if (el.isConnected) hy(el, HYPH_SEL); }); }, function () {});
  }
  /* iskelet ürün kartı (liste ilk açılış ve filtre/sıralama/sayfa değişimi) */
  function skeletonCards(n) {
    var one = '<article class="p-card p-card--skeleton" aria-hidden="true"><div class="p-card__media is-loading"></div>' +
      '<div class="p-card__info"><span class="skeleton skeleton--text"></span><span class="skeleton skeleton--text skeleton--short"></span>' +
      '<span class="skeleton skeleton--text skeleton--xs"></span></div></article>';
    return new Array(n + 1).join(one);
  }

  /* ==========================================================================
     Ortak kanon II (Faz A): diyalog, yükleniyor, oturum, adres, sipariş, sepet toplamları
     ========================================================================== */

  /* Diyalog (A101 onay/uyarı penceresi). dialog({ tone: 'info'|'danger'|'warn'|'success', icon, title, text, body,
     ok: 'Onayla', cancel: 'Vazgeç' (false: tek buton), okTone: 'primary'|'danger', okHref }) → Promise<boolean> */
  var dialogSeq = 0;
  function dialog(o) {
    o = o || {};
    var id = 'dialog-' + (++dialogSeq), tone = o.tone || 'info';
    var el = document.createElement('div');
    el.className = 'modal modal--sheet dialog dialog--' + tone; el.id = id;
    el.setAttribute('role', 'alertdialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', id + '-t');
    var okCls = 'btn btn--' + (o.okTone || (tone === 'danger' ? 'danger' : 'primary'));
    el.innerHTML = '<div class="modal__panel modal__panel--dialog" tabindex="-1">' +
      '<button class="icon-btn icon-btn--round modal__close" type="button" data-dialog-cancel aria-label="Kapat">' + icon('fa-solid fa-xmark') + '</button>' +
      '<span class="dialog__icon">' + icon('fa-solid ' + (o.icon || ({ danger: 'fa-trash-can', warn: 'fa-triangle-exclamation', success: 'fa-check' })[tone] || 'fa-circle-info')) + '</span>' +
      '<h2 class="dialog__title" id="' + id + '-t">' + esc(o.title || '') + '</h2>' +
      (o.text ? '<p class="dialog__text">' + esc(o.text) + '</p>' : '') +
      (o.body ? '<div class="dialog__body">' + o.body + '</div>' : '') +
      '<div class="dialog__actions">' +
        (o.cancel === false ? '' : '<button class="btn btn--ghost" type="button" data-dialog-cancel>' + esc(o.cancel || 'Vazgeç') + '</button>') +
        (o.okHref ? '<a class="' + okCls + '" href="' + o.okHref + '" data-dialog-ok>' + esc(o.ok || 'Tamam') + '</a>'
          : '<button class="' + okCls + '" type="button" data-dialog-ok>' + esc(o.ok || 'Tamam') + '</button>') +
      '</div></div>';
    document.body.appendChild(el);
    return new Promise(function (resolve) {
      var done = false;
      function finish(v) {
        if (done) return; done = true;
        closeModal(el); setTimeout(function () { el.remove(); }, 400); resolve(v);
      }
      el.addEventListener('click', function (e) {
        if (e.target.closest('[data-dialog-ok]')) { if (!o.okHref) e.preventDefault(); finish(true); }
        else if (e.target.closest('[data-dialog-cancel]') || e.target === el) finish(false);
      });
      escHandlers.unshift(function () { if (!done && el.classList.contains('is-open')) { finish(false); return true; } return false; });
      requestAnimationFrame(function () { openModal(el, document.activeElement); });
    });
  }
  /* "Sepete Eklendi" diyaloğu (A101 Ekstra): ürün satırı + Alışverişe Devam Et / Sepete Git */
  function addedDialog(key) {
    var it = cartItem(key); if (!it) return;
    var p = it.p;
    return dialog({
      tone: 'success', icon: 'fa-check', title: 'Sepete Eklendi',
      body: '<div class="dialog__product"><span class="dialog__product-img">' + (p.img ? '<span style="' + productBg(p) + '"></span>' : '') + '</span>' +
        '<div><p class="dialog__product-name">' + esc(p.name) + '</p><p class="dialog__product-meta"><span class="unit-badge">' + esc(unitText(it.opt)) + '</span>' +
        '<b class="price">' + formatPrice(it.price) + '</b></p></div></div>',
      cancel: 'Alışverişe Devam Et', ok: 'Sepete Git', okHref: URLS.sepet
    });
  }

  /* Buton yükleniyor: busy(btn, true, 'Kaydediliyor') — genişlik sabit, dönen ikon, aria-busy */
  function busy(btn, on, label) {
    if (!btn) return;
    if (on) {
      if (btn.getAttribute('aria-busy') === 'true') return;
      btn.dataset.html = btn.innerHTML; btn.style.minWidth = btn.offsetWidth + 'px';
      btn.innerHTML = icon('fa-solid fa-circle-notch fa-spin') + '<span>' + esc(label || btn.textContent.trim()) + '</span>';
      btn.setAttribute('aria-busy', 'true'); btn.disabled = true;
    } else {
      if (btn.dataset.html != null) btn.innerHTML = btn.dataset.html;
      btn.style.minWidth = ''; btn.removeAttribute('aria-busy'); btn.disabled = false; delete btn.dataset.html;
    }
  }
  /* bölüm durumu kutuları: boş / hata (Tekrar dene) — empty--box ailesi */
  function stateBox(o) {
    return '<div class="empty empty--box' + (o.error ? ' empty--error' : '') + '">' + icon('fa-solid ' + (o.icon || (o.error ? 'fa-circle-exclamation' : 'fa-box-open'))) +
      '<p class="empty__title">' + esc(o.title) + '</p>' + (o.text ? '<p class="empty__text">' + esc(o.text) + '</p>' : '') +
      (o.action ? (o.action.href ? '<a class="btn btn--primary btn--sm" href="' + o.action.href + '">' + esc(o.action.label) + '</a>'
        : '<button class="btn btn--primary btn--sm" type="button" data-state-action>' + esc(o.action.label) + '</button>') : '') + '</div>';
  }
  function skeletonRows(n) {
    var one = '<div class="sk-row" aria-hidden="true"><span class="skeleton skeleton--square"></span><span class="sk-row__lines">' +
      '<span class="skeleton skeleton--text"></span><span class="skeleton skeleton--text skeleton--short"></span></span></div>';
    return '<div class="sk-list">' + new Array(n + 1).join(one) + '</div>';
  }

  /* Prototip oturumu (K3, K14): giriş/kayıt formu başarılıysa yerel olarak açılır; gerçek doğrulama yok */
  var session = {
    get: function () { return store.get('azem-oturum', null); },
    set: function (v) { var o = session.get(); if (o && o.demo && !(v && v.demo)) clearDemo(o); store.set('azem-oturum', v); syncSession(); },
    clear: function () { var o = session.get(); if (o && o.demo) clearDemo(o); try { localStorage.removeItem('azem-oturum'); } catch (e) {} syncSession(); }
  };
  function syncSession() {
    var s = session.get();
    $$('[data-session-name]').forEach(function (el) { el.textContent = s ? (s.ad ? s.ad + (s.soyad ? ' ' + s.soyad : '') : 'Hesabım') : ''; });
    document.documentElement.classList.toggle('is-signed-in', !!s);
  }
  /* giriş gerektiren işlem (A101 "İşleme devam etmek için…"): oturum yoksa diyalog, true dönerse devam */
  function requireLogin(text) {
    if (session.get()) return Promise.resolve(true);
    return dialog({ tone: 'info', icon: 'fa-user-lock', title: 'Giriş yapmalısınız', text: text || 'İşleme devam etmek için giriş yapın ya da üye olun.',
      cancel: 'Vazgeç', ok: 'Giriş Yap', okHref: URLS.giris + '?geri=' + encodeURIComponent(location.pathname.split('/').pop() + location.search) }).then(function () { return false; });
  }

  /* Adres defteri ve siparişler (K14): yalnız yerel; ilk açılışta boş durum */
  function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  var addresses = {
    list: function () { return store.get('azem-adresler', []); },
    get: function (id) { return addresses.list().filter(function (a) { return a.id === id; })[0] || null; },
    save: function (a) {
      var l = addresses.list(); if (!a.id) a.id = uid('ad');
      var i = l.map(function (x) { return x.id; }).indexOf(a.id);
      if (!l.length) a.varsayilan = true;
      if (a.varsayilan) l.forEach(function (x) { x.varsayilan = false; });
      if (i > -1) l[i] = a; else l.push(a);
      store.set('azem-adresler', l); return a;
    },
    remove: function (id) {
      var l = addresses.list().filter(function (x) { return x.id !== id; });
      if (l.length && !l.some(function (x) { return x.varsayilan; })) l[0].varsayilan = true;
      store.set('azem-adresler', l);
    },
    makeDefault: function (id) { var l = addresses.list(); l.forEach(function (x) { x.varsayilan = x.id === id; }); store.set('azem-adresler', l); }
  };
  /* Sipariş durumları (Azem'den teyit beklenir): prototipte yalnız ilk adım gerçekleşir, diğerleri bekleyen */
  var ORDER_STEPS = ['Sipariş Alındı', 'Hazırlanıyor', 'Kargoya Verildi', 'Teslim Edildi'];
  var orders = {
    list: function () { return store.get('azem-siparisler', []); },
    get: function (no) { return orders.list().filter(function (o) { return o.no === no; })[0] || null; },
    add: function (o) {
      var l = orders.list();
      o.no = o.no || ('AZ' + Date.now().toString().slice(-8));
      o.tarih = o.tarih || new Date().toISOString(); o.durum = o.durum || 0;
      l.unshift(o); store.set('azem-siparisler', l); return o;
    }
  };

  /* Demo hesap (patronun kayıt olmadan gezmesi; K14'e yalnız burada istisna): ticari üyelik, 1 adres, 2 sipariş, birkaç favori.
     Ürünler Azem kataloğundan; tüm kayıtlar "Örnek" etiketli. Çıkışta (ya da başka hesapla girişte) örnekler silinir, kullanıcının kendi kayıtları kalır. */
  var DEMO_ADDR = { id: 'ornek-adres', baslik: 'Depo', ad: 'Demo', soyad: 'Kullanıcı', telefon: '05000000000', il: 'İstanbul', ilce: 'Şişli',
    mahalle: 'Kurtuluş Mah.', adres: 'Örnek Sok. No 1', ornek: true };
  /* demo giriş bilgisi: giriş formu bununla dolu gelir; bu ikiliyle "Giriş Yap" demo hesabı açar */
  var DEMO_LOGIN = { telefon: '05000000000', sifre: 'demo123' };
  function ornekBadge(x) { return x && x.ornek ? ' <span class="status-badge status-badge--muted">Örnek</span>' : ''; }
  function demoLogin() {
    var pool = Object.keys(products).map(function (id) { return products[id]; }).filter(function (p) { return sellable(p) && p.img; });
    var pick = function (i) { return pool[(i * 37) % pool.length]; };
    function line(p, qty) {
      var o = saleOptions(p), row = o.rows[o.def];
      return { id: p.id, name: p.name, img: p.img, px: p.px, unit: unitText(row), price: row.price, qty: qty, line: round2(row.price * qty) };
    }
    function order(no, days, durum, lines, odeme) {
      var sub = round2(lines.reduce(function (n, l) { return n + l.line; }, 0)), ship = sub < FREE_SHIP ? SHIPPING_FEE : 0;
      return { no: no, tarih: new Date(Date.now() - days * 864e5).toISOString(), durum: durum, ornek: true, lines: lines,
        totals: { subtotal: sub, shipping: ship, discount: 0, total: round2(sub + ship) }, adres: DEMO_ADDR, teslimat: 'Kargo ile Teslimat', odeme: odeme,
        fatura: { tip: 'Ticari', firma: 'Örnek Gıda Ltd. Şti.', vergiDairesi: 'Şişli', vergiNo: '1234567890', adres: DEMO_ADDR } };
    }
    var own = addresses.list().filter(function (a) { return !a.ornek; });
    store.set('azem-adresler', own.concat([Object.assign({}, DEMO_ADDR, { varsayilan: !own.length })]));
    var demoOrders = [
      order('AZ90000002', 1, 0, [line(pick(1), 2), line(pick(2), 1), line(pick(3), 3)], 'Havale / EFT'),
      order('AZ90000001', 6, 2, [line(pick(4), 1), line(pick(5), 2), line(pick(6), 1), line(pick(7), 4), line(pick(8), 1)], 'Kredi / Banka Kartı')
    ];
    store.set('azem-siparisler', demoOrders.concat(orders.list().filter(function (o) { return !o.ornek; }))
      .sort(function (a, b) { return new Date(b.tarih) - new Date(a.tarih); }));
    var added = [9, 10, 11, 12].map(function (i) { return pick(i).id; }).filter(function (id, i, l) { return favs.indexOf(id) < 0 && l.indexOf(id) === i; });
    added.forEach(function (id) { favs.push(id); });
    store.set('azem-favori', favs);
    session.set({ ad: 'Demo', soyad: 'Kullanıcı', email: 'demo@example.com', telefon: '05000000000', tip: '2', firma: 'Örnek Gıda Ltd. Şti.',
      vergiDairesi: 'Şişli', vergiNo: '1234567890', faaliyet: 'Market', il: 'İstanbul', ilce: 'Şişli', demo: true, demoFavs: added });
  }
  function clearDemo(o) {
    store.set('azem-adresler', addresses.list().filter(function (a) { return !a.ornek; }));
    store.set('azem-siparisler', orders.list().filter(function (x) { return !x.ornek; }));
    (o.demoFavs || []).forEach(function (id) { var i = favs.indexOf(id); if (i > -1) { favs.splice(i, 1); syncFav(id); } });
    store.set('azem-favori', favs);
  }

  /* Sepet toplamları (K4: 10.000 TL altı kargo 500 ₺, Azem sepetindeki ücret) */
  var SHIPPING_FEE = 500;
  function cartLines() {
    return Object.keys(cart).map(function (key) {
      var it = cartItem(key); if (!it) return null;
      return { key: key, p: it.p, opt: it.opt, unit: unitText(it.opt), price: toNumber(it.price), qty: cart[key], line: toNumber(it.price) * cart[key] };
    }).filter(Boolean);
  }
  function cartTotals(discount) {
    var sub = cartLines().reduce(function (n, l) { return n + l.line; }, 0);
    var ship = sub > 0 && sub < FREE_SHIP ? SHIPPING_FEE : 0, d = discount || 0;
    return { count: cartCount(), subtotal: sub, shipping: ship, discount: d, total: Math.max(0, sub + ship - d), left: Math.max(0, FREE_SHIP - sub), pct: Math.min(100, sub / FREE_SHIP * 100) };
  }
  function setQty(key, q) { if (!(key in cart)) return; if (q <= 0) delete cart[key]; else cart[key] = q; syncCart(key); }
  function removeLine(key) { delete cart[key]; syncCart(key); }
  function clearCart() { Object.keys(cart).forEach(function (k) { delete cart[k]; }); syncCart(''); }
  /* kargo eşiği bileşeni (mini sepet, sepet, ödeme) */
  function shipMeter(t) {
    return '<div class="ship-meter"><p class="ship-meter__text">' + (t.left ? icon('fa-solid fa-truck-fast') + '<span>10.000 TL ücretsiz kargoya <b>' + formatPrice(t.left) + '</b> kaldı</span>'
      : icon('fa-solid fa-circle-check') + '<span><b>Kargo ücretsiz</b></span>') + '</p>' +
      '<span class="ship-meter__bar" role="progressbar" aria-label="Ücretsiz kargo eşiği" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(t.pct) + '"><span style="width:' + t.pct.toFixed(1) + '%"></span></span></div>';
  }
  function formatDate(iso) { try { return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return iso; } }

  /* Çıkış Yap (hesap menüsü) */
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-logout]')) {
      e.preventDefault(); session.clear(); closeMenus();
      toast('Çıkış yapıldı', 'fa-arrow-right-from-bracket');
      if (/hesabim\.html/.test(location.pathname)) setTimeout(function () { location.href = URLS.home; }, 600);
    }
    /* Demo Hesapla Giriş Yap (giriş kartı): hazır hesapla oturum, hesaba ya da geldiği sayfaya */
    var demoBtn = e.target.closest('[data-demo-login]');
    if (demoBtn) {
      demoLogin(); busy(demoBtn, true, 'Giriş yapılıyor');
      var geri = param('geri');
      setTimeout(function () { location.href = geri && /^[a-z-]+\.html/.test(geri) ? geri : URLS.hesap(); }, 600);
    }
    /* Bugünün Fırsatı (K10): Azem'in modalı boş → boş durum + kampanyalara yönlendirme */
    if (e.target.closest('[data-firsat]')) {
      e.preventDefault();
      var onCamp = document.body.getAttribute('data-page') === 'kampanyalar';
      dialog(onCamp
        ? { tone: 'info', icon: 'fa-bolt', title: 'Bugünün Fırsatı', text: 'Bugün için tanımlanmış bir fırsat ürünü yok.', cancel: false, ok: 'Kapat' }
        : { tone: 'info', icon: 'fa-bolt', title: 'Bugünün Fırsatı', text: 'Bugün için tanımlanmış bir fırsat ürünü yok. Güncel kampanyalara göz atabilirsiniz.',
            cancel: 'Kapat', ok: 'Kampanyalar', okHref: URLS.kampanyalar });
    }
  });
  syncSession();

  window.AZEM_APP = {
    D: D, DB: DB, $: $, $$: $$, esc: esc, slug: slug, bg: bg, catImg: catImg, sellable: sellable, toNumber: toNumber, formatPrice: formatPrice,
    store: store, param: param, reduceMotion: reduceMotion, mqDesktop: mqDesktop,
    products: products, cats: cats, catBySlug: catBySlug, brands: brands,
    catByName: catByName, catPath: catPath, catUrl: catUrl, productUrl: productUrl,
    productCard: productCard, productImg: productImg, productBg: productBg, cartControl: cartControl, favIcon: favIcon,
    cart: cart, favs: favs, addToCart: addToCart, onCart: onCart, syncFav: syncFav,
    toast: toast, openDrawer: openDrawer, closeDrawer: closeDrawer, openModal: openModal, closeModal: closeModal, lock: lock,
    onEscape: function (fn) { escHandlers.push(fn); },
    initRails: initRails, reveal: reveal, syncFooter: syncFooter, bindMenu: bindMenu, closeMenus: closeMenus,
    initTabs: initTabs, initAcc: initAcc, setAcc: setAcc, initRange: initRange, initGallery: initGallery, scrollSpy: scrollSpy, stickyBar: stickyBar,
    dialog: dialog, addedDialog: addedDialog, busy: busy, stateBox: stateBox, skeletonRows: skeletonRows, session: session, requireLogin: requireLogin,
    fold: fold, addresses: addresses, orders: orders, ornekBadge: ornekBadge, demoLogin: demoLogin, DEMO_LOGIN: DEMO_LOGIN, ORDER_STEPS: ORDER_STEPS, cartLines: cartLines, cartTotals: cartTotals, setQty: setQty, removeLine: removeLine, clearCart: clearCart,
    shipMeter: shipMeter, unitText: unitText, formatDate: formatDate, FREE_SHIP: FREE_SHIP, SHIPPING_FEE: SHIPPING_FEE, URLS: URLS, icon: icon,
    qtyValue: qtyValue, saleOptions: saleOptions, cartKey: cartKey, cartItem: cartItem, inCart: inCart, measureClamp: measureClamp, hyphenate: hyphenate, searchProducts: searchProducts, watchImages: watchImages, skeletonCards: skeletonCards, phoneDigits: phoneDigits, setError: setError, clearError: clearError,
    /* sayfa betiği içeriği bastıktan sonra çağırır */
    ready: function () {
      Object.keys(cart).forEach(syncCart);
      syncCart('');
      favs.forEach(syncFav); syncFav('');
      initRails(); reveal(); syncFooter(); syncAside(); initAcc(document); watchImages(document); measureClamp(document); hyphenate(document); syncSession();
    }
  };
})();
