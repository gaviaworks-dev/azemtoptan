/* ==========================================================================
   Azem Toptan — ana sayfa davranışları
   İçerik window.AZEM'den (assets/data/catalog.js) okunur.
   ========================================================================== */
(function () {
  'use strict';

  var D = window.AZEM;
  if (!D) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mqDesktop = window.matchMedia('(min-width: 1025px)');
  var mqCurtain = window.matchMedia('(min-width: 641px)');

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
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
  function toNumber(price) { return parseFloat(String(price).replace(/\./g, '').replace(',', '.')) || 0; }
  function formatPrice(n) {
    return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
  }
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* depolama yoksa yoksay */ } }
  };

  /* ---------- Ürün kataloğu (aynı ürün birden çok rafta olabilir) ---------- */
  var products = {};
  D.shelves.forEach(function (s) {
    s.products.forEach(function (p) { p.id = slug(p.name); products[p.id] = p; });
  });

  var cart = store.get('azem-sepet', {});
  var favs = store.get('azem-favori', []).filter(function (id) { return products[id]; });
  Object.keys(cart).forEach(function (id) { if (!products[id]) delete cart[id]; });

  /* ---------- İletişim alanları ---------- */
  $$('[data-address]').forEach(function (el) { el.textContent = D.contact.address; });
  $$('[data-whatsapp]').forEach(function (el) { el.textContent = D.contact.whatsapp; });
  $$('[data-email]').forEach(function (el) { el.textContent = D.contact.email; });

  /* ---------- Masaüstü kategori menüsü ---------- */
  var nav = $('[data-nav]');
  D.categories.forEach(function (cat, ci) {
    var li = document.createElement('li');
    li.className = 'nav__item';
    li.innerHTML =
      '<a class="nav__link" href="#" aria-haspopup="true" aria-expanded="false">' + esc(cat.name) + '</a>' +
      '<div class="dropdown"><div class="mega__col"><ul class="dropdown__list">' +
      cat.children.map(function (c, i) {
        return '<li><a class="dropdown__item" href="#" data-sub="' + ci + '-' + i + '">' +
          '<span class="dropdown__item-img" style="' + bg(c.icon) + '"></span>' + esc(c.name) +
          (c.children.length ? '<i class="fa-solid fa-chevron-right dropdown__item-chev" aria-hidden="true"></i>' : '') +
          '</a></li>';
      }).join('') +
      '</ul></div>' +
      cat.children.map(function (c, i) {
        if (!c.children.length) return '';
        return '<div class="mega__sub" data-sub-panel="' + ci + '-' + i + '"><p class="mega__sub-title">' + esc(c.name) + '</p>' +
          c.children.map(function (g) { return '<a href="#">' + esc(g) + '</a>'; }).join('') + '</div>';
      }).join('') +
      '</div>';
    nav.appendChild(li);
  });

  var menuScrim = $('[data-menu-scrim]');
  var navTimer;
  function closeNav() {
    $$('.nav__item.is-open').forEach(function (li) {
      li.classList.remove('is-open');
      var a = $('.nav__link', li); if (a) a.setAttribute('aria-expanded', 'false');
    });
    menuScrim.classList.remove('is-open');
  }
  function openNav(li) {
    if (li.classList.contains('is-open')) return;
    closeNav(); closeMenus();
    if (!$('.dropdown', li)) return;
    li.classList.add('is-open');
    $('.nav__link', li).setAttribute('aria-expanded', 'true');
    menuScrim.classList.add('is-open');
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
  nav.addEventListener('focusout', function (e) { if (!nav.contains(e.relatedTarget)) closeNav(); });

  /* ---------- Hesap / mini sepet menüleri ---------- */
  function closeMenus(except) {
    $$('[data-menu].is-open').forEach(function (m) {
      if (m === except) return;
      m.classList.remove('is-open');
      $$('[data-menu-btn]', m).forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    });
  }
  $$('[data-menu]').forEach(function (m) {
    $$('[data-menu-btn]', m).forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = !m.classList.contains('is-open');
        closeMenus(m); closeNav();
        m.classList.toggle('is-open', open);
        $$('[data-menu-btn]', m).forEach(function (b) { b.setAttribute('aria-expanded', String(open)); });
      });
    });
  });
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

  /* ---------- Story şeridi ---------- */
  var stories = $('[data-stories]');
  var storyHtml =
    '<a class="story story--featured" href="#"><span class="story__ring"><span class="story__badge">FIRSAT</span>' +
    '<i class="fa-solid fa-bolt story__icon" aria-hidden="true"></i></span><span class="story__label">Bugünün Fırsatı</span></a>';
  /* Gerçek ürün fotoğrafı olan alt kategoriler önde; fotoğrafı olmayanlar Azem ikonuyla sonda */
  var subs = [];
  D.categories.forEach(function (cat) { cat.children.forEach(function (c) { subs.push(c); }); });
  subs.filter(function (c) { return c.photo; }).concat(subs.filter(function (c) { return !c.photo; })).forEach(function (c) {
    storyHtml += '<a class="story' + (c.photo ? ' story--photo' : '') + '" href="#"><span class="story__ring">' +
      '<span class="story__img" style="' + bg(c.photo || c.icon) + '"' + (c.photo ? ' role="img" aria-label="' + esc(c.photoAlt) + '"' : '') + '></span></span>' +
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
        '<a class="btn btn--light" href="#">' + esc(s.cta) + ' <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>' +
        '</div></div>';
    }
    return '<a class="hero__slide" href="#" ' + label + '>' +
      '<span class="hero__bg hero__bg--blur" style="' + bg(s.img) + '"></span>' +
      '<span class="hero__media" style="' + bg(s.img) + '" role="img" aria-label="' + esc(s.alt) + '"></span></a>';
  }).join('');
  var heroIndex = 0, heroTimer = null, heroPaused = reduceMotion;
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
    return '<a class="cat-cell" href="#"><span class="cat-cell__img"><span style="' + bg(c.icon) + '"></span></span>' +
      '<span class="cat-cell__label">' + esc(c.name) + '</span></a>';
  }).join('');

  /* ---------- Kampanya kartları ---------- */
  $('[data-promos]').innerHTML = D.promos.map(function (p) {
    return '<a class="promo-card reveal" href="#"><span class="promo-card__media' + (p.fit === 'contain' ? ' promo-card__media--contain' : '') + '"><span style="' + bg(p.img) + '" role="img" aria-label="' + esc(p.title) + '"></span></span>' +
      '<span class="promo-card__body"><span class="promo-card__text"><span class="promo-card__kicker">' + esc(p.title) + '</span><br>' +
      '<span class="promo-card__cta">' + esc(p.cta) + '</span></span>' +
      '<span class="promo-card__arrow" aria-hidden="true"><i class="fa-solid fa-arrow-right"></i></span></span></a>';
  }).join('');
  $('[data-promos]').classList.add('rail');

  /* ---------- Ürün kartı ---------- */
  function cartControl(id) {
    var q = cart[id] || 0;
    if (!q) return '<button class="add-btn" type="button" data-add="' + id + '" aria-label="Sepete Ekle"><i class="fa-solid fa-plus" aria-hidden="true"></i></button>';
    return '<span class="stepper" role="group" aria-label="Adet">' +
      '<button class="stepper__btn" type="button" data-dec="' + id + '" aria-label="Azalt"><i class="fa-solid ' + (q === 1 ? 'fa-trash-can' : 'fa-minus') + '" aria-hidden="true"></i></button>' +
      '<span class="stepper__qty" aria-live="polite">' + q + '</span>' +
      '<button class="stepper__btn" type="button" data-inc="' + id + '" aria-label="Artır"><i class="fa-solid fa-plus" aria-hidden="true"></i></button></span>';
  }
  function productCard(p) {
    var fav = favs.indexOf(p.id) > -1;
    var img = p.img
      ? '<span class="p-card__img" style="' + bg(p.img) + '" role="img" aria-label="' + esc(p.name) + '"></span>'
      : '<span class="p-card__img p-card__img--empty" role="img" aria-label="Görsel yok"><i class="fa-solid fa-box-open" aria-hidden="true"></i></span>';
    return '<article class="p-card" data-product="' + p.id + '">' +
      '<div class="p-card__media"><a href="#" tabindex="-1" aria-hidden="true">' + img + '</a>' +
      '<div class="p-card__tools">' +
      '<button class="p-card__tool" type="button" data-quick="' + p.id + '" aria-label="Ayrıntı"><i class="fa-regular fa-eye" aria-hidden="true"></i></button>' +
      '<button class="p-card__tool" type="button" data-fav="' + p.id + '" aria-pressed="' + fav + '" aria-label="Favorilere Ekle"><i class="' + (fav ? 'fa-solid' : 'fa-regular') + ' fa-heart" aria-hidden="true"></i></button>' +
      '</div>' +
      '<div class="p-card__cart" data-cart-slot="' + p.id + '">' + cartControl(p.id) + '</div></div>' +
      '<div class="p-card__info"><h3 class="p-card__name"><a href="#">' + esc(p.name) + '</a></h3>' +
      '<p class="price">' + formatPrice(toNumber(p.price)) + '</p></div></article>';
  }

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
        '<a class="banner-frame reveal" href="#" style="--ratio:' + v.ratio + '"><span style="' + bg(v.img, true) + '" role="img" aria-label="' + esc(v.alt) + '"></span></a></div></section>';
    }
    var s = D.shelves[o.shelf], railId = 'rail-' + k;
    return '<section class="sec ' + o.bg + '"><div class="wrap">' +
      '<div class="sec-head"><h2 class="sec-head__title">' + esc(s.title) + '</h2>' +
      '<div class="sec-head__tools rail-arrows">' +
      '<button class="icon-btn icon-btn--round" type="button" data-rail-prev="' + railId + '" aria-label="Önceki ürünler"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>' +
      '<button class="icon-btn icon-btn--round" type="button" data-rail-next="' + railId + '" aria-label="Sonraki ürünler"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>' +
      '</div></div>' +
      '<div class="rail rail--bleed" id="' + railId + '">' + s.products.map(productCard).join('') + '</div>' +
      '</div></section>';
  }).join('');

  /* ---------- Ray okları ---------- */
  function railStep(rail) { var c = rail.firstElementChild; return c ? (c.getBoundingClientRect().width + parseFloat(getComputedStyle(rail).columnGap || 0)) * Math.max(1, Math.floor(rail.clientWidth / c.getBoundingClientRect().width) - 1) : rail.clientWidth; }
  function syncRail(rail) {
    var max = rail.scrollWidth - rail.clientWidth - 2;
    $$('[data-rail-prev="' + rail.id + '"]').forEach(function (b) { b.disabled = rail.scrollLeft <= 2; });
    $$('[data-rail-next="' + rail.id + '"]').forEach(function (b) { b.disabled = rail.scrollLeft >= max; });
  }
  $$('.rail[id]').forEach(function (rail) {
    rail.addEventListener('scroll', function () { syncRail(rail); }, { passive: true });
    syncRail(rail);
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-rail-prev], [data-rail-next]');
    if (!b) return;
    var rail = document.getElementById(b.getAttribute('data-rail-prev') || b.getAttribute('data-rail-next'));
    rail.scrollBy({ left: (b.hasAttribute('data-rail-prev') ? -1 : 1) * railStep(rail) });
  });
  window.addEventListener('resize', function () { $$('.rail[id]').forEach(syncRail); });

  /* ---------- Bildirim (Azem'deki notify mesajları) ---------- */
  var toastBox = $('[data-toasts]');
  function toast(msg, icon) {
    var el = document.createElement('p');
    el.className = 'toast';
    el.innerHTML = '<i class="fa-solid ' + (icon || 'fa-circle-info') + '" aria-hidden="true"></i><span>' + esc(msg) + '</span>';
    toastBox.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-in'); });
    setTimeout(function () { el.classList.remove('is-in'); setTimeout(function () { el.remove(); }, 300); }, 2600);
  }

  /* ---------- Sepet ---------- */
  function cartCount() { return Object.keys(cart).reduce(function (n, id) { return n + cart[id]; }, 0); }
  function renderMiniCart() {
    var ids = Object.keys(cart);
    var box = $('[data-minicart]');
    if (!ids.length) {
      box.innerHTML = '<p class="empty"><i class="fa-solid fa-basket-shopping" aria-hidden="true"></i>Sepetinizde Ürün Bulunamadı!</p>';
      return;
    }
    var total = 0;
    box.innerHTML = '<ul class="dropdown__list">' + ids.map(function (id) {
      var p = products[id], line = toNumber(p.price) * cart[id];
      total += line;
      return '<li class="dropdown__item"><span class="dropdown__item-img" style="' + (p.img ? bg(p.img) : '') + '"></span>' +
        '<span>' + esc(p.name) + '<span class="dropdown__meta">' + cart[id] + ' × ' + formatPrice(toNumber(p.price)) + '</span></span></li>';
    }).join('') + '</ul><p class="dropdown__item"><strong>Toplam</strong><span class="price dropdown__total">' + formatPrice(total) + '</span></p>';
  }
  function syncCart(id) {
    store.set('azem-sepet', cart);
    $$('[data-cart-slot="' + id + '"]').forEach(function (slot) { slot.innerHTML = cartControl(id); });
    var n = cartCount();
    $$('[data-cart-count]').forEach(function (c) { c.textContent = n; c.setAttribute('data-count', n); });
    renderMiniCart();
  }
  function renderFavs() {
    var box = $('[data-favlist]');
    if (!favs.length) {
      box.innerHTML = '<p class="empty"><i class="fa-regular fa-heart" aria-hidden="true"></i>Favorilerinizde Ürün Bulunamadı!</p>';
      return;
    }
    box.innerHTML = '<ul class="dropdown__list">' + favs.map(function (id) {
      var p = products[id];
      return '<li><a class="dropdown__item" href="#"><span class="dropdown__item-img" style="' + (p.img ? bg(p.img) : '') + '"></span>' +
        '<span>' + esc(p.name) + '<span class="dropdown__meta">' + formatPrice(toNumber(p.price)) + '</span></span></a></li>';
    }).join('') + '</ul>';
  }
  function syncFav(id) {
    store.set('azem-favori', favs);
    renderFavs();
    var on = favs.indexOf(id) > -1;
    $$('[data-fav="' + id + '"]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(on));
      b.innerHTML = '<i class="' + (on ? 'fa-solid' : 'fa-regular') + ' fa-heart" aria-hidden="true"></i>';
    });
    $$('[data-fav-count]').forEach(function (c) { c.textContent = favs.length; c.setAttribute('data-count', favs.length); });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-add], [data-inc], [data-dec], [data-fav], [data-quick]');
    if (!t) return;
    e.preventDefault();
    var id;
    if ((id = t.getAttribute('data-add')) || (id = t.getAttribute('data-inc'))) { cart[id] = (cart[id] || 0) + 1; syncCart(id); toast('Ürün sepete eklendi', 'fa-basket-shopping'); }
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
  Object.keys(cart).forEach(syncCart);
  syncCart('');
  favs.forEach(syncFav); syncFav('');

  /* ---------- Perde yöneticisi: drawer ve modal ---------- */
  var lastFocus = null;
  function lock(on) { document.body.classList.toggle('is-locked', on); }
  var drawer = $('#drawer'), drawerScrim = $('[data-drawer-scrim]');
  function openDrawer(trigger) {
    lastFocus = trigger || document.activeElement;
    closeMenus(); closeNav();
    drawer.classList.add('is-open'); drawerScrim.classList.add('is-open'); lock(true);
    setTimeout(function () { $('[data-drawer-close]', drawer).focus(); }, 50);
  }
  function closeDrawer() {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open'); drawerScrim.classList.remove('is-open'); lock(false);
    if (lastFocus) lastFocus.focus();
  }
  $$('[data-drawer-open]').forEach(function (b) { b.addEventListener('click', function () { openDrawer(b); }); });
  $('[data-drawer-close]').addEventListener('click', closeDrawer);
  drawerScrim.addEventListener('click', closeDrawer);

  $('[data-drawer-tree]').innerHTML = D.categories.map(function (cat, ci) {
    return '<div class="acc"><button class="acc__btn" type="button" aria-expanded="false" aria-controls="acc-' + ci + '">' +
      '<span class="acc__img" style="' + bg(cat.icon) + '"></span>' + esc(cat.name) + '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
      '<div class="acc__panel" id="acc-' + ci + '"><div><ul class="dropdown__list">' +
      cat.children.map(function (c) {
        return '<li><a class="dropdown__item" href="#"><span class="dropdown__item-img" style="' + bg(c.icon) + '"></span>' + esc(c.name) + '</a>' +
          (c.children.length ? '<div class="acc__sub">' + c.children.map(function (g) { return '<a class="chip" href="#">' + esc(g) + '</a>'; }).join('') + '</div>' : '') + '</li>';
      }).join('') + '</ul></div></div></div>';
  }).join('');
  $$('.acc__btn').forEach(function (b) {
    b.addEventListener('click', function () { b.setAttribute('aria-expanded', String(b.getAttribute('aria-expanded') !== 'true')); });
  });

  var modal = $('#quickView'), modalScrim = $('[data-modal-scrim]');
  function openQuick(id, trigger) {
    var p = products[id];
    lastFocus = trigger;
    $('[data-qv]', modal).innerHTML =
      '<div class="qv__media">' + (p.img ? '<span class="p-card__img" style="' + bg(p.img) + '"></span>' : '<span class="p-card__img p-card__img--empty"><i class="fa-solid fa-box-open" aria-hidden="true"></i></span>') + '</div>' +
      '<div class="qv__body"><h2 class="qv__name" id="qvName">' + esc(p.name) + '</h2>' +
      '<p class="price price--lg">' + formatPrice(toNumber(p.price)) + '</p>' +
      '<div class="qv__actions"><div data-cart-slot="' + id + '">' + cartControl(id) + '</div>' +
      '<button class="btn btn--ghost" type="button" data-fav="' + id + '" aria-pressed="' + (favs.indexOf(id) > -1) + '"><i class="' + (favs.indexOf(id) > -1 ? 'fa-solid' : 'fa-regular') + ' fa-heart" aria-hidden="true"></i></button>' +
      '</div></div>';
    modal.classList.add('is-open'); modalScrim.classList.add('is-open'); lock(true);
    setTimeout(function () { $('.modal__panel', modal).focus(); }, 50);
  }
  function closeQuick() {
    if (!modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open'); modalScrim.classList.remove('is-open'); lock(drawer.classList.contains('is-open'));
    if (lastFocus) lastFocus.focus();
  }
  $('[data-modal-close]').addEventListener('click', closeQuick);
  modalScrim.addEventListener('click', closeQuick);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeQuick(); });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (modal.classList.contains('is-open')) closeQuick();
    else if (drawer.classList.contains('is-open')) closeDrawer();
    else { closeMenus(); closeNav(); }
  });

  /* ---------- Header: gölge, mobil katlanma, arama ---------- */
  var header = $('#siteHeader');
  var bottomNav = $('#bottomNav');
  var toTop = $('[data-to-top]');
  var lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 4);
    if (!mqDesktop.matches) {
      var compact = y > 90;
      header.classList.toggle('is-compact', compact);
      if (!compact) header.classList.remove('is-search-open');
    }
    if (y < 80 || y < lastY - 6) bottomNav.classList.remove('is-hidden');
    else if (y > lastY + 12) bottomNav.classList.add('is-hidden');
    toTop.classList.toggle('is-visible', y > 600);
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
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
  $$('[data-search]').forEach(function (f) { f.addEventListener('submit', function (e) { e.preventDefault(); }); });
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });

  /* ---------- Footer: kategori linkleri ---------- */
  $('[data-foot-cats]').outerHTML = D.categories.map(function (c) { return '<a href="#">' + esc(c.name) + '</a>'; }).join('');

  /* ---------- Footer perde açılışı (DadaGastro mekanizması) ----------
     ≥641'de footer position:fixed; gövdeye footer yüksekliği kadar dip boşluğu
     açılmazsa son ekranı kalıcı örter. ResizeObserver border-box izler (dolgu
     değişince content-box aynı kalır, gözlemci tetiklenmezdi); fontlar ve tam
     yükleme sonrası yeniden ölçülür. <641'de footer normal akışta, boşluk 0. */
  var footer = $('#siteFooter'), main = $('.page-main');
  function syncFooter() { main.style.marginBottom = (mqCurtain.matches ? footer.offsetHeight : 0) + 'px'; }
  syncFooter();
  window.addEventListener('resize', syncFooter);
  window.addEventListener('load', syncFooter);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncFooter);
  if ('ResizeObserver' in window) new ResizeObserver(syncFooter).observe(footer, { box: 'border-box' });

  /* ---------- E-bülten ---------- */
  var nl = $('[data-newsletter]');
  nl.addEventListener('submit', function (e) {
    e.preventDefault();
    var input = $('input', nl), email = input.value.trim().toLowerCase();
    var list = store.get('azem-ebulten', []);
    if (!email || !input.checkValidity()) toast('Email adresi uygun formatta değil !', 'fa-circle-exclamation');
    else if (list.indexOf(email) > -1) toast('Email adresiniz E-Bülten listemize daha önce eklenmiş!', 'fa-circle-info');
    else { list.push(email); store.set('azem-ebulten', list); input.value = ''; toast('Email adresiniz E-Bülten listemize eklendi', 'fa-envelope-circle-check'); }
  });

  /* ---------- Çerez ---------- */
  var cookie = $('[data-cookie]');
  if (!store.get('azem-cerez', null)) cookie.hidden = false;
  $$('[data-cookie-choice]').forEach(function (b) {
    b.addEventListener('click', function () { store.set('azem-cerez', b.getAttribute('data-cookie-choice')); cookie.hidden = true; });
  });

  /* ---------- Kaydırınca belirme ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -7% 0px' });
    reveals.forEach(function (r) { io.observe(r); });
  } else {
    reveals.forEach(function (r) { r.classList.add('is-in'); });
  }
})();
