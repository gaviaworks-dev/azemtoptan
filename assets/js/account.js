/* ==========================================================================
   Hesabım — hesabim.html?s=<bölüm> (tek şablon, A101 profilim kabuğu)
   Bölümler: (boş)/ozet, siparisler, siparis&no=, favoriler, adresler, profil, sifre, tercihler.
   Veri yalnız yerel (K14): A.session, A.orders, A.addresses, A.favs, 'azem-tercihler'. İlk açılışta boş durum.
   Masaüstü: solda karşılama kartı + menü, sağda bölüm. ≤1024: bölüm yoksa dizin (menü), varsa ayrıntı + geri butonu.
   ========================================================================== */
(function () {
  'use strict';

  var A = window.AZEM_APP, ILLER = window.AZEM_ILLER || {};
  var $ = A.$, $$ = A.$$, esc = A.esc, icon = A.icon, URLS = A.URLS;

  var SECTIONS = {
    ozet: { title: 'Hesabım', icon: 'fa-solid fa-house' },
    siparisler: { title: 'Siparişlerim', icon: 'fa-solid fa-box' },
    favoriler: { title: 'Favorilerim', icon: 'fa-regular fa-heart' },
    adresler: { title: 'Adreslerim', icon: 'fa-solid fa-location-dot' },
    profil: { title: 'Profil Bilgilerim', icon: 'fa-solid fa-user' },
    sifre: { title: 'Şifre Değiştir', icon: 'fa-solid fa-key' },
    tercihler: { title: 'İletişim Tercihleri', icon: 'fa-solid fa-bell' },
    siparis: { title: 'Sipariş Detayı', parent: 'siparisler' }
  };
  var MENU = [['ozet', 'siparisler', 'favoriler', 'adresler'], ['profil', 'sifre', 'tercihler']];

  var sec = SECTIONS[A.param('s')] ? A.param('s') : '';
  var info = SECTIONS[sec || 'ozet'];
  var user = A.session.get();
  var sep = '<li class="breadcrumb__sep" aria-hidden="true"><i class="fa-solid fa-chevron-right"></i></li>';

  function href(key) { return key === 'ozet' ? URLS.hesap('ozet') : URLS.hesap(key); }

  /* ---------- Üst bant: breadcrumb + başlık (+ mobil geri) ---------- */
  var named = user && sec && sec !== 'ozet';
  var parent = named && info.parent ? SECTIONS[info.parent] : null;
  $('[data-account-top]').innerHTML =
    '<nav aria-label="Konum"><ol class="breadcrumb"><li><a href="' + URLS.home + '">Ana Sayfa</a></li>' + sep +
    (named ? '<li><a href="' + URLS.hesap() + '">Hesabım</a></li>' + sep +
        (parent ? '<li><a href="' + href(info.parent) + '">' + esc(parent.title) + '</a></li>' + sep : '') +
        '<li aria-current="page">' + esc(info.title) + '</li>'
      : '<li aria-current="page">Hesabım</li>') +
    '</ol></nav>' +
    '<div class="page-head__row">' +
      (user && sec ? '<a class="icon-btn icon-btn--round page-head__back" href="' + (parent ? href(info.parent) : URLS.hesap()) + '" aria-label="' + esc(parent ? parent.title : 'Hesabım') + '"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></a>' : '') +
      '<h1 class="page-head__title">' + esc(user ? info.title : 'Hesabım') + '</h1>' +
    '</div>';
  document.title = (user ? info.title : 'Hesabım') + ' | Azem Toptan';

  var body = $('[data-account-body]');

  /* ---------- Misafir: giriş / kayıt kutusu ---------- */
  if (!user) {
    var geri = encodeURIComponent('hesabim.html' + location.search);
    body.innerHTML = '<div class="empty empty--box">' + icon('fa-solid fa-user-lock') +
      '<p class="empty__title">Hesabınıza giriş yapın</p>' +
      '<p class="empty__text">Siparişlerinizi, adreslerinizi ve favorilerinizi görmek için giriş yapın ya da üye olun.</p>' +
      '<div class="cluster"><a class="btn btn--primary btn--sm" href="' + URLS.giris + '?geri=' + geri + '">Giriş Yap</a>' +
      '<a class="btn btn--ghost btn--sm" href="' + URLS.kayit + '">Kayıt Ol</a></div></div>';
    A.ready();
    return;
  }

  /* ---------- Ortak yardımcılar ---------- */
  function fullName(o) { return [o.ad, o.soyad].filter(Boolean).join(' '); }
  /* telefon: depoda 11 hane (05xx…); alanda "5xx xxx xx xx" (main.js maskesi), kartta "05xx xxx xx xx" */
  function phoneField(v) {
    var d = String(v || '').replace(/\D/g, '').replace(/^90(?=\d{10}$)/, '').replace(/^0+/, '').slice(0, 10);
    return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)].filter(Boolean).join(' ');
  }
  function phoneText(v) { var f = phoneField(v); return f ? '0' + f : ''; }
  function sellableFavs() { return A.favs.filter(function (id) { return A.sellable(A.products[id]); }); }
  function lineBg(l) {
    var p = A.products[l.id];
    if (p && p.img) return A.productBg(p);
    return l.img ? A.bg(l.img) + (l.px ? ';--img-px:' + l.px + 'px' : '') : '';
  }
  var BADGE = ['', ' status-badge--warn', '', ' status-badge--success'];
  function badge(o) { var d = o.durum || 0; return '<span class="status-badge' + (BADGE[d] || '') + '">' + esc(A.ORDER_STEPS[d] || A.ORDER_STEPS[0]) + '</span>'; }
  /* sipariş alanları metin ya da nesne olabilir (ödeme sayfası yazar) */
  function txt(v) {
    if (!v) return '';
    if (typeof v !== 'object') return String(v);
    return v.label || v.ad || v.name || v.baslik || v.title || '';
  }
  function head(sub, tools) {
    return '<div class="account__head"><p class="account__sub">' + sub + '</p>' + (tools || '') + '</div>';
  }

  /* ---------- Alan doğrulama (form.js ile aynı kurallar ve metinler) ---------- */
  var MSG = {
    required: function (label) { return /alanı$/i.test(label) ? label + ' zorunludur.' : label + ' alanı zorunludur.'; },
    min: function (label, n) { return label + ' en az ' + n + ' karakter olmalıdır.'; },
    phone: 'Geçerli bir telefon numarası girin (05 ile başlayan 11 hane).',
    email: 'Email adresi uygun formatta değil !',
    taxno: 'Vergi/TC 10 ya da 11 hane olmalıdır.',
    match: 'Şifreler eşleşmiyor.'
  };
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function check(input) {
    var v = input.type === 'password' ? input.value : input.value.trim();
    var label = input.getAttribute('data-label');
    if (input.tagName === 'SELECT') return input.required && !v ? label + ' seçiniz.' : '';
    if (input.hasAttribute('data-match')) return v !== document.getElementById(input.getAttribute('data-match')).value ? MSG.match : '';
    if (!v) return input.required ? MSG.required(label) : '';
    if (input.hasAttribute('data-phone')) return /^05\d{9}$/.test(A.phoneDigits(input)) ? '' : MSG.phone;
    if (input.type === 'email') return EMAIL.test(v) ? '' : MSG.email;
    if (input.hasAttribute('data-taxno')) return /^\d{10,11}$/.test(v) ? '' : MSG.taxno;
    if (input.minLength > 0 && v.length < input.minLength) return MSG.min(label, input.minLength);
    return '';
  }
  function validate(input) {
    var f = input.closest('.field, .form-group');
    var msg = input.disabled || (f && f.closest('[hidden]')) ? '' : check(input);
    if (msg) A.setError(input, msg); else A.clearError(input);
    return !msg;
  }
  /* gönderimde tüm alanlar; sonra hatalı alan yazarken / çıkışta yeniden bakılır */
  function bindForm(form, onValid) {
    var tried = false;
    function inputs() { return $$('.input', form); }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      tried = true;
      var bad = inputs().filter(function (i) { return !validate(i); });
      if (bad.length) { bad[0].focus({ preventScroll: true }); bad[0].scrollIntoView({ block: 'center', behavior: A.reduceMotion ? 'auto' : 'smooth' }); return; }
      onValid(new FormData(form));
    });
    form.addEventListener('focusout', function (e) { if (tried && e.target.classList.contains('input')) validate(e.target); });
    form.addEventListener('change', function (e) { if (tried && e.target.tagName === 'SELECT') validate(e.target); });
    /* document üzerinde: main.js'in telefon maskesinden sonra çalışsın */
    document.addEventListener('input', function (e) {
      var i = e.target;
      if (!form.contains(i) || !i.classList.contains('input')) return;
      if (i.hasAttribute('data-taxno')) { var d = i.value.replace(/\D/g, '').slice(0, 11); if (d !== i.value) i.value = d; }
      if (i.getAttribute('aria-invalid') === 'true') validate(i);
      if (tried && i.id) $$('[data-match="' + i.id + '"]', form).forEach(function (m) { if (m.value) validate(m); });
    });
    form.reset = (function (native) { return function () { native.call(form); tried = false; inputs().forEach(A.clearError); }; })(form.reset);
  }
  function ilOptions(sel) {
    return '<option value="">İl Seçiniz</option>' + Object.keys(ILLER).map(function (il) {
      return '<option' + (il === sel ? ' selected' : '') + '>' + esc(il) + '</option>';
    }).join('');
  }
  function fillIlce(select, il, sel) {
    var list = ILLER[il] || [];
    select.innerHTML = '<option value="">İlçe Seçiniz</option>' + list.map(function (x) {
      return '<option' + (x === sel ? ' selected' : '') + '>' + esc(x) + '</option>';
    }).join('');
    select.disabled = !list.length;
  }
  function field(id, label, input, opt) {
    opt = opt || {};
    return '<div class="field' + (opt.full ? ' field--full' : '') + '"' + (opt.attr || '') + '><label class="field__label" for="' + id + '">' + esc(label) +
      (opt.req === false ? '' : '<span class="req" aria-hidden="true">*</span><span class="sr-only">(zorunlu)</span>') + '</label>' + input + '</div>';
  }
  function pwInput(id, name, ac, extra) {
    return '<div class="input-group"><input class="input" id="' + id + '" name="' + name + '" type="password" autocomplete="' + ac + '" required ' + extra + '>' +
      '<button class="input-group__btn" type="button" data-eye="' + id + '" aria-label="Şifreyi göster" aria-pressed="false"><i class="fa-solid fa-eye" aria-hidden="true"></i></button></div>';
  }

  /* ---------- Kabuk: karşılama kartı + menü ---------- */
  var activeKey = info.parent || sec || 'ozet';
  function menuItem(key) {
    var x = SECTIONS[key];
    return '<li><a class="side-menu__item" href="' + href(key) + '"' + (key === activeKey ? ' aria-current="page"' : '') + '>' + icon(x.icon) +
      '<span>' + esc(x.title) + '</span><i class="fa-solid fa-chevron-right side-menu__chev" aria-hidden="true"></i></a></li>';
  }
  body.innerHTML =
    '<div class="account account--' + (sec ? 'detail' : 'index') + '">' +
      '<aside class="account__side">' +
        '<div class="account__hello"><span class="account__hello-pre">Hoş geldiniz' + (user.demo ? ' <span class="status-badge status-badge--muted">Örnek hesap</span>' : '') + '</span><span class="account__hello-name" data-session-name>' + esc(fullName(user) || 'Hesabım') + '</span>' +
          '<a class="link" href="' + href('profil') + '">Bilgilerimi Düzenle</a></div>' +
        '<nav class="side-menu" aria-label="Hesabım">' +
          MENU.map(function (g) { return '<ul class="side-menu__list">' + g.map(menuItem).join('') + '</ul>'; }).join('<hr class="side-menu__divider">') +
          '<hr class="side-menu__divider"><ul class="side-menu__list">' +
            '<li><a class="side-menu__item" href="' + URLS.kurumsal('sss') + '">' + icon('fa-solid fa-circle-question') + '<span>Yardım</span><i class="fa-solid fa-chevron-right side-menu__chev" aria-hidden="true"></i></a></li>' +
            '<li><button class="side-menu__item" type="button" data-logout>' + icon('fa-solid fa-arrow-right-from-bracket') + '<span>Çıkış Yap</span></button></li>' +
          '</ul>' +
        '</nav>' +
      '</aside>' +
      '<div class="account__main" data-account-main></div>' +
    '</div>';
  var main = $('[data-account-main]');

  /* ---------- Özet: kartlar ---------- */
  function card(ic, title, text, label, to) {
    return '<div class="account-card"><span class="account-card__icon">' + icon(ic) + '</span><p class="account-card__title">' + esc(title) + '</p>' +
      '<p class="account-card__text">' + esc(text) + '</p><a class="btn btn--ghost btn--sm" href="' + to + '">' + esc(label) + '</a></div>';
  }
  function renderOzet() {
    main.innerHTML = '<div class="account__cards">' +
      card('fa-solid fa-box', 'Siparişlerim', 'Toplam ' + A.orders.list().length + ' Sipariş', 'Siparişlerime Git', href('siparisler')) +
      card('fa-regular fa-heart', 'Favorilerim', sellableFavs().length + ' Ürün', 'Favorilere Git', href('favoriler')) +
      card('fa-solid fa-location-dot', 'Adreslerim', A.addresses.list().length + ' Kayıtlı Adres', 'Adreslerime Git', href('adresler')) +
      card('fa-solid fa-user', 'Profil Bilgilerim', 'Kişisel ve firma bilgileriniz', 'Bilgilerimi Düzenle', href('profil')) +
    '</div>';
  }

  /* ---------- Siparişlerim: dönem seçici + sipariş kartları ---------- */
  var SIX_MONTHS = 183 * 864e5;
  function orderCard(o) {
    var lines = o.lines || [], more = lines.length - 4;
    return '<article class="order-card">' +
      '<div class="order-card__head"><p class="order-card__no">Sipariş No: ' + esc(o.no) + A.ornekBadge(o) + '</p><span class="order-card__date">' + esc(A.formatDate(o.tarih)) + '</span>' + badge(o) + '</div>' +
      '<div class="order-card__body">' +
        '<div class="order-card__thumbs">' + lines.slice(0, 4).map(function (l) {
          return '<span class="order-card__thumb"><span style="' + lineBg(l) + '" role="img" aria-label="' + esc(l.name) + '"></span></span>';
        }).join('') + (more > 0 ? '<span class="order-card__more" aria-label="' + more + ' ürün daha">+' + more + '</span>' : '') + '</div>' +
        '<div class="cluster"><p class="order-card__total">Toplam<b class="price">' + A.formatPrice((o.totals || {}).total || 0) + '</b></p>' +
        '<a class="btn btn--ghost btn--sm" href="' + URLS.hesap('siparis') + '&no=' + encodeURIComponent(o.no) + '">Sipariş Detayı</a></div>' +
      '</div></article>';
  }
  function renderSiparisler() {
    var all = A.orders.list();
    if (!all.length) {
      main.innerHTML = A.stateBox({ icon: 'fa-box-open', title: 'Henüz siparişiniz bulunmuyor', action: { label: 'Alışverişe Başla', href: URLS.home } });
      return;
    }
    main.innerHTML = head('<span data-order-count></span>',
      '<span class="select"><select class="input input--sm" data-order-period aria-label="Sipariş dönemi"><option value="6">Son 6 Ay</option><option value="all">Tümü</option></select></span>') +
      '<div data-order-list>' + A.skeletonRows(Math.min(3, all.length)) + '</div>';
    var period = $('[data-order-period]', main), box = $('[data-order-list]', main), count = $('[data-order-count]', main);
    function paint() {
      var from = period.value === 'all' ? 0 : Date.now() - SIX_MONTHS;
      var list = all.filter(function (o) { return new Date(o.tarih).getTime() >= from; });
      count.textContent = 'Toplam ' + list.length + ' Sipariş';
      box.innerHTML = list.length ? '<div class="stack">' + list.map(orderCard).join('') + '</div>'
        : A.stateBox({ icon: 'fa-calendar-xmark', title: 'Bu dönemde siparişiniz bulunmuyor' });
      A.watchImages(box);
    }
    count.textContent = 'Toplam ' + all.length + ' Sipariş';
    period.addEventListener('change', paint);
    setTimeout(paint, 300);
  }

  /* ---------- Sipariş detayı ---------- */
  var STEP_ICON = ['fa-check', 'fa-box', 'fa-truck', 'fa-house'];
  function addressCard(a, actions) {
    return '<article class="address-card">' +
      '<p class="address-card__title">' + esc(a.baslik || 'Adres') + (a.varsayilan && actions ? ' <span class="status-badge">Varsayılan</span>' : '') + A.ornekBadge(a) + '</p>' +
      (fullName(a) ? '<p>' + esc(fullName(a)) + '</p>' : '') +
      '<p>' + esc([a.mahalle, a.adres].filter(Boolean).join(', ')) + '</p>' +
      '<p>' + esc([a.ilce, a.il].filter(Boolean).join(' / ')) + '</p>' +
      (a.telefon ? '<p>' + esc(phoneText(a.telefon)) + '</p>' : '') +
      (actions ? '<div class="address-card__actions">' +
        '<button class="link" type="button" data-addr-edit="' + esc(a.id) + '">Düzenle</button>' +
        '<button class="link" type="button" data-addr-del="' + esc(a.id) + '">Sil</button>' +
        (a.varsayilan ? '' : '<button class="link" type="button" data-addr-default="' + esc(a.id) + '">Varsayılan Yap</button>') +
      '</div>' : '') +
    '</article>';
  }
  /* fatura (checkout.js): { tip: 'Bireysel'|'Ticari', firma, vergiDairesi, vergiNo, adres } */
  function faturaText(f) {
    if (!f) return '';
    if (typeof f !== 'object') return String(f);
    return [f.tip, f.firma, f.vergiDairesi, f.vergiNo].filter(Boolean).join(' · ');
  }
  /* fatura adresi yalnız teslimat adresinden farklıysa ayrı kart */
  function faturaAdres(o) {
    var b = o.fatura && typeof o.fatura === 'object' ? o.fatura.adres : null;
    return b && typeof b === 'object' && !(o.adres && b.id && b.id === o.adres.id) ? b : null;
  }
  function renderSiparis() {
    var o = A.orders.get(A.param('no'));
    if (!o) {
      main.innerHTML = A.stateBox({ error: true, title: 'Sipariş bulunamadı', text: 'Bu numarayla kayıtlı bir sipariş yok.', action: { label: 'Siparişlerime Dön', href: href('siparisler') } });
      return;
    }
    var d = o.durum || 0, lines = o.lines || [], t = o.totals || {};
    var pickup = /mağaza/i.test(txt(o.teslimat));   /* "Mağazadan Teslim Al": teslimat adresi kartı yok */
    var kv = [['Teslimat', txt(o.teslimat)], ['Ödeme', txt(o.odeme)], ['Fatura', faturaText(o.fatura)]].filter(function (r) { return r[1]; });
    main.innerHTML =
      '<div class="order-card"><div class="order-card__head"><p class="order-card__no">Sipariş No: ' + esc(o.no) + A.ornekBadge(o) + '</p><span class="order-card__date">' + esc(A.formatDate(o.tarih)) + '</span>' + badge(o) + '</div></div>' +
      '<section class="co-section"><div class="co-section__head"><h2 class="co-section__title">Sipariş Durumu</h2></div>' +
        '<ol class="timeline">' + A.ORDER_STEPS.map(function (s, i) {
          var done = i <= d;
          return '<li class="timeline__step' + (done ? ' is-done' : '') + '"><span class="timeline__mark">' + icon('fa-solid ' + (done ? 'fa-check' : STEP_ICON[i])) + '</span>' +
            '<div><p class="timeline__title">' + esc(s) + '</p>' + (i === 0 ? '<p class="timeline__meta">' + esc(A.formatDate(o.tarih)) + '</p>' : '') + '</div></li>';
        }).join('') + '</ol></section>' +
      '<div class="buy-layout">' +
        '<section class="co-section"><div class="co-section__head"><h2 class="co-section__title">Ürünler (' + lines.length + ')</h2></div>' +
          '<ul>' + lines.map(function (l) {
            var p = A.products[l.id], url = p ? A.productUrl(p) : null;
            var img = '<span style="' + lineBg(l) + '"></span>';
            return '<li class="mc-line">' +
              (url ? '<a class="mc-line__img" href="' + url + '" tabindex="-1" aria-hidden="true">' + img + '</a>' : '<span class="mc-line__img" aria-hidden="true">' + img + '</span>') +
              '<div class="mc-line__body">' +
                (url ? '<a class="mc-line__name" href="' + url + '">' + esc(l.name) + '</a>' : '<p class="mc-line__name">' + esc(l.name) + '</p>') +
                '<p class="mc-line__meta">' + (l.unit ? '<span class="unit-badge">' + esc(l.unit) + '</span>' : '') + '<span>' + l.qty + ' × ' + A.formatPrice(l.price) + '</span></p>' +
              '</div>' +
              '<span class="price mc-line__total">' + A.formatPrice(l.line != null ? l.line : l.price * l.qty) + '</span></li>';
          }).join('') + '</ul></section>' +
        '<aside class="summary-col">' +
          '<div class="summary"><h2 class="summary__title">Sipariş Özeti</h2><div class="summary__rows">' +
            '<p class="summary__row"><span>Ara Toplam</span><b>' + A.formatPrice(t.subtotal || 0) + '</b></p>' +
            '<p class="summary__row"><span>Kargo</span><b>' + (t.shipping ? A.formatPrice(t.shipping) : 'Ücretsiz') + '</b></p>' +
            (t.discount ? '<p class="summary__row summary__row--discount"><span>Kupon İndirimi</span><b>−' + A.formatPrice(t.discount) + '</b></p>' : '') +
          '</div><p class="summary__total"><span>Toplam</span><span class="price">' + A.formatPrice(t.total || 0) + '</span></p>' +
          '<p class="summary__note">Fiyatlara KDV dahildir.</p></div>' +
          (o.adres && typeof o.adres === 'object' && !pickup ? '<section class="co-section"><div class="co-section__head"><h2 class="co-section__title">Teslimat Adresi</h2></div>' + addressCard(o.adres, false) + '</section>' : '') +
          (faturaAdres(o) ? '<section class="co-section"><div class="co-section__head"><h2 class="co-section__title">Fatura Adresi</h2></div>' + addressCard(faturaAdres(o), false) + '</section>' : '') +
          (kv.length ? '<div class="kv">' + kv.map(function (r) { return '<div class="kv__row"><span class="kv__key">' + r[0] + '</span><span class="kv__val">' + esc(r[1]) + '</span></div>'; }).join('') + '</div>' : '') +
        '</aside>' +
      '</div>';
  }

  /* ---------- Favorilerim: ürün ızgarası; kalpten çıkarılan kart listeden düşer (Geri Al) ---------- */
  function renderFavoriler() {
    var ids = sellableFavs();
    main.innerHTML = ids.length
      ? head(ids.length + ' Ürün' + (user.demo ? A.ornekBadge({ ornek: true }) : '')) + '<div class="p-grid p-grid--4">' + ids.map(function (id) { return A.productCard(A.products[id]); }).join('') + '</div>'
      : A.stateBox({ icon: 'fa-heart', title: 'Favorilerinizde ürün bulunmuyor', action: { label: 'Alışverişe Başla', href: URLS.home } });
    A.watchImages(main);
  }
  if (sec === 'favoriler') {
    /* main.js'in favori tıklamasından sonra çalışır (aynı belgeye önce o bağlandı) */
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-fav]');
      if (!b || !main.contains(b)) return;
      var id = b.getAttribute('data-fav');
      if (A.favs.indexOf(id) > -1) return;
      renderFavoriler();
      A.toast('Ürün favorilerden çıkarıldı', 'fa-heart-crack', { action: { label: 'Geri Al', onClick: function () {
        if (A.favs.indexOf(id) < 0) A.favs.push(id);
        A.syncFav(id); renderFavoriler();
      } } });
    });
  }

  /* ---------- Adreslerim: kart ızgarası + sağdan form çekmecesi ---------- */
  var aForm = $('#adresFormu'), aTitle = $('#adresFormBaslik'), aIl = $('#aIl'), aIlce = $('#aIlce'), editing = null;
  aIl.innerHTML = ilOptions('');
  aIl.addEventListener('change', function () { fillIlce(aIlce, aIl.value, ''); A.clearError(aIlce); });
  bindForm(aForm, function (f) {
    var v = function (n) { return String(f.get(n) || '').trim(); };
    var a = Object.assign({}, editing || {}, {
      baslik: v('baslik'), ad: v('ad'), soyad: v('soyad'), telefon: A.phoneDigits($('#aTelefon')),
      il: v('il'), ilce: v('ilce'), mahalle: v('mahalle'), adres: v('adres')
    });
    A.addresses.save(a);
    A.closeDrawer();
    A.toast(editing ? 'Adres güncellendi' : 'Adres kaydedildi', null, { tone: 'success' });
    renderAdresler();
  });
  function openForm(a, trigger) {
    editing = a || null;
    aForm.reset();
    aTitle.textContent = a ? 'Adresi Düzenle' : 'Yeni Adres';
    var src = a || { ad: user.ad, soyad: user.soyad, telefon: user.telefon };   /* yeni adres: profildeki ad ve telefon */
    $('#aBaslik').value = (a && a.baslik) || '';
    $('#aAd').value = src.ad || '';
    $('#aSoyad').value = src.soyad || '';
    $('#aTelefon').value = phoneField(src.telefon);
    aIl.value = (a && ILLER[a.il]) ? a.il : '';
    fillIlce(aIlce, aIl.value, a ? a.ilce : '');
    $('#aMahalle').value = (a && a.mahalle) || '';
    $('#aAdres').value = (a && a.adres) || '';
    A.openDrawer('adresForm', trigger);
  }
  function renderAdresler() {
    var list = A.addresses.list();
    main.innerHTML = list.length
      ? head(list.length + ' Kayıtlı Adres', '<button class="btn btn--primary btn--sm" type="button" data-addr-new>' + icon('fa-solid fa-plus') + ' Adres Ekle</button>') +
        '<div class="address-grid">' + list.map(function (a) { return addressCard(a, true); }).join('') + '</div>'
      : A.stateBox({ icon: 'fa-location-dot', title: 'Kayıtlı adresiniz bulunmuyor', action: { label: 'Adres Ekle' } });
  }
  main.addEventListener('click', function (e) {
    var t = e.target.closest('[data-addr-new], [data-state-action], [data-addr-edit], [data-addr-del], [data-addr-default]');
    if (!t || sec !== 'adresler') return;
    var id;
    if (t.hasAttribute('data-addr-new') || t.hasAttribute('data-state-action')) openForm(null, t);
    else if ((id = t.getAttribute('data-addr-edit'))) openForm(A.addresses.get(id), t);
    else if ((id = t.getAttribute('data-addr-default'))) {
      A.addresses.makeDefault(id); renderAdresler();
      A.toast('Varsayılan adres güncellendi', null, { tone: 'success' });
    } else if ((id = t.getAttribute('data-addr-del'))) {
      var a = A.addresses.get(id);
      A.dialog({ tone: 'danger', title: 'Adres silinsin mi?', text: '"' + (a ? a.baslik : '') + '" adresi adres defterinizden kaldırılacak.', ok: 'Sil', cancel: 'Vazgeç' }).then(function (ok) {
        if (!ok) return;
        A.addresses.remove(id); renderAdresler();
        A.toast('Adres silindi', 'fa-trash-can');
      });
    }
  });

  /* ---------- Profil Bilgilerim: kayıt formunun alanları (Azem), oturumdan dolu ---------- */
  function renderProfil() {
    var s = A.session.get() || {}, ticari = s.tip === '2' || s.tip === 'ticari';
    /* etiket ve hata adı (data-label) kayıt formuyla aynı */
    var tx = function (id, name, label, dl, val, extra) {
      return field(id, label, '<input class="input" id="' + id + '" name="' + name + '" type="text" value="' + esc(val || '') + '" data-label="' + esc(dl) + '" ' + (extra || '') + '>');
    };
    main.innerHTML = '<form class="form-stack" data-profile novalidate>' +
      '<div><div class="segmented segmented--lg segmented--block-sm" role="radiogroup" aria-label="Üyelik tipi">' +
        '<label class="segmented__opt"><input type="radio" name="registerType" value="1"' + (ticari ? '' : ' checked') + '><span><i class="fa-solid fa-user" aria-hidden="true"></i>Bireysel Üyelik</span></label>' +
        '<label class="segmented__opt"><input type="radio" name="registerType" value="2"' + (ticari ? ' checked' : '') + '><span><i class="fa-solid fa-building" aria-hidden="true"></i>Ticari Üyelik</span></label>' +
      '</div></div>' +
      '<fieldset class="form-group"><legend class="form-group__title">Kişisel bilgiler</legend><div class="form-grid form-grid--2">' +
        tx('pAd', 'ad', 'Adınız', 'Ad', s.ad, 'autocomplete="given-name" required') +
        tx('pSoyad', 'soyad', 'Soyadınız', 'Soyad', s.soyad, 'autocomplete="family-name" required') +
        field('pEmail', 'E-Posta', '<input class="input" id="pEmail" name="email" type="email" value="' + esc(s.email || '') + '" autocomplete="email" required data-label="E-posta">') +
        field('pTelefon', 'Telefon', '<div class="input-group"><span class="input-group__prefix" aria-hidden="true">0</span><input class="input" id="pTelefon" name="telefon" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="5__ ___ __ __" value="' + esc(phoneField(s.telefon)) + '" data-phone required data-label="Telefon"></div>') +
      '</div></fieldset>' +
      '<fieldset class="form-group" data-ticari-group' + (ticari ? '' : ' hidden') + '><legend class="form-group__title">Firma bilgileri</legend><div class="form-grid form-grid--2">' +
        tx('pFirma', 'firmaadi', 'Şirket', 'Şirket', s.firma, 'autocomplete="organization" data-ticari') +
        tx('pFaaliyet', 'faaliyetalani', 'Faaliyet Alanı', 'Faaliyet Alanı', s.faaliyet, 'minlength="5" maxlength="100" data-ticari') +
        field('pIl', 'İl', '<span class="select"><select class="input" id="pIl" name="sehir" autocomplete="address-level1" data-label="İl" data-ticari>' + ilOptions(s.il) + '</select></span>') +
        tx('pIlce', 'ilce', 'İlçe Yazınız', 'İlçe', s.ilce, 'minlength="3" maxlength="255" autocomplete="address-level2" placeholder="İlçeniz" data-ticari') +
        tx('pVergiDairesi', 'vergidairesi', 'Vergi Dairesi', 'Vergi Dairesi', s.vergiDairesi, 'minlength="3" maxlength="100" data-ticari') +
        tx('pVergiNo', 'tcvergino', 'Vergi Num. / TC Num.', 'Vergi/TC', s.vergiNo, 'inputmode="numeric" data-taxno data-ticari') +
      '</div></fieldset>' +
      '<div class="cluster"><button class="btn btn--primary" type="submit">Kaydet</button></div>' +
    '</form>';
    var form = $('[data-profile]', main), group = $('[data-ticari-group]', form);
    function setType() {
      var on = $('input[name="registerType"]:checked', form).value === '2';
      group.hidden = !on;
      $$('[data-ticari]', form).forEach(function (i) { i.required = on; if (!on) A.clearError(i); });
    }
    $$('input[name="registerType"]', form).forEach(function (r) { r.addEventListener('change', setType); });
    setType();
    bindForm(form, function (f) {
      var v = function (n) { return String(f.get(n) || '').trim(); }, on = v('registerType') === '2';
      var btn = $('[type="submit"]', form);
      A.busy(btn, true, 'Kaydediliyor');
      setTimeout(function () {
        A.session.set(Object.assign({}, A.session.get() || {}, {
          ad: v('ad'), soyad: v('soyad'), email: v('email'), telefon: v('telefon'), tip: on ? '2' : '1',
          firma: on ? v('firmaadi') : '', faaliyet: on ? v('faaliyetalani') : '', il: on ? v('sehir') : '', ilce: on ? v('ilce') : '',
          vergiDairesi: on ? v('vergidairesi') : '', vergiNo: on ? v('tcvergino') : ''
        }));
        A.busy(btn, false);
        A.toast('Bilgileriniz güncellendi', null, { tone: 'success' });
      }, 500);
    });
  }

  /* ---------- Şifre Değiştir (prototip: hiçbir şey saklanmaz) ---------- */
  function renderSifre() {
    main.innerHTML = '<form class="form-stack" data-password novalidate>' +
      '<fieldset class="form-group"><legend class="form-group__title">Mevcut şifre</legend><div class="form-grid form-grid--2">' +
        field('sMevcut', 'Mevcut Şifre', pwInput('sMevcut', 'mevcut', 'current-password', 'data-label="Mevcut Şifre"')) +
      '</div></fieldset>' +
      '<fieldset class="form-group"><legend class="form-group__title">Yeni şifre</legend><div class="form-grid form-grid--2">' +
        field('sYeni', 'Yeni Şifre', pwInput('sYeni', 'yeni', 'new-password', 'minlength="5" data-label="Yeni Şifre"')) +
        field('sTekrar', 'Yeni Şifre (Tekrar)', pwInput('sTekrar', 'tekrar', 'new-password', 'data-match="sYeni" data-label="Yeni Şifre (Tekrar)"')) +
      '</div></fieldset>' +
      '<div class="cluster"><button class="btn btn--primary" type="submit">Şifremi Güncelle</button></div>' +
    '</form>';
    var form = $('[data-password]', main);
    bindForm(form, function () {
      var btn = $('[type="submit"]', form);
      A.busy(btn, true, 'Kaydediliyor');
      setTimeout(function () {
        A.busy(btn, false);
        $$('[data-eye][aria-pressed="true"]', form).forEach(function (b) { b.click(); });
        form.reset();
        A.toast('Şifreniz güncellendi', null, { tone: 'success' });
      }, 500);
    });
  }

  /* ---------- İletişim Tercihleri (A101: açıklamalı onay kutuları, G7) ---------- */
  function renderTercihler() {
    var s = A.session.get() || {}, pref = A.store.get('azem-tercihler', {}), tel = phoneText(s.telefon);
    function opt(name, title, desc) {
      return '<label class="check check--desc"><input class="check__input" type="checkbox" name="' + name + '"' + (pref[name] ? ' checked' : '') + '>' +
        '<span class="check__box"><i class="fa-solid fa-check" aria-hidden="true"></i></span>' +
        '<span class="check__label"><strong>' + esc(title) + '</strong>' + (desc ? '<span>' + esc(desc) + '</span>' : '') + '</span></label>';
    }
    main.innerHTML = '<form class="form-stack" data-prefs novalidate>' +
      '<fieldset class="form-group"><legend class="form-group__title">Bildirim Tercihleri</legend><div class="stack">' +
        opt('kampanya', 'Kampanyalar ve Yenilikler', 'Fırsatlardan haberdar olmak için bildirim almak istiyorum.') +
        opt('siparis', 'Siparişlerim ve Üyeliğim', 'Siparişlerim ve üyeliğimle ilgili bildirim almak istiyorum.') +
      '</div></fieldset>' +
      '<fieldset class="form-group"><legend class="form-group__title">İletişim Kanalları</legend><div class="stack">' +
        opt('eposta', 'E-posta', s.email) + opt('sms', 'SMS', tel) + opt('telefon', 'Telefon', tel) +
      '</div></fieldset>' +
      '<div class="cluster"><button class="btn btn--primary" type="submit">Kaydet</button></div>' +
    '</form>';
    var form = $('[data-prefs]', main);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var out = {};
      $$('.check__input', form).forEach(function (c) { out[c.name] = c.checked; });
      A.store.set('azem-tercihler', out);
      A.toast('Tercihleriniz kaydedildi', null, { tone: 'success' });
    });
  }

  ({ siparisler: renderSiparisler, siparis: renderSiparis, favoriler: renderFavoriler, adresler: renderAdresler,
     profil: renderProfil, sifre: renderSifre, tercihler: renderTercihler }[sec] || renderOzet)();

  A.ready();
})();
