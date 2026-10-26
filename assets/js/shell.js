/* ==========================================================================
   Ortak kabuk — header, footer, alt menü, drawer, hızlı bakış, çerez, bildirim.
   Tek kaynak: her sayfa iki satırla çağırır, markup senkron yerine basılır
   (sayfa boyanmadan önce; yerleşim kayması olmaz).
     <script src="assets/js/shell.js" data-shell="top"></script>     body'nin ilk satırı
     <script src="assets/js/shell.js" data-shell="bottom"></script>  </main>'den sonra
   Etkin alt menü öğesi: <body data-page="home|kategori|urun|sayfa|giris">
   ========================================================================== */
(function () {
  'use strict';

  var URL = {
    home: 'index.html',
    giris: 'giris-yap.html',
    kayit: 'kayit-ol.html',
    sifre: 'sifremi-unuttum.html',
    yasal: function (s) { return 'sayfa.html?s=' + s; }
  };

  var icon = function (cls) { return '<i class="' + cls + '" aria-hidden="true"></i>'; };

  function top() {
    return '' +
'<a class="sr-only" href="#icerik">İçeriğe geç</a>' +
'<header class="site-header" id="siteHeader">' +
  '<div class="wrap">' +
    '<div class="hdr-top">' +
      '<button class="icon-btn icon-btn--ghost hdr-mobile-only" type="button" data-drawer-open="drawer" aria-controls="drawer" aria-label="Menüyü aç">' + icon('fa-solid fa-bars') + '</button>' +
      '<a class="hdr-logo" href="' + URL.home + '" aria-label="Azem Toptan ana sayfa"><img src="assets/img/brand/azem-logo.svg" width="114" height="44" alt="Azem Toptan"></a>' +
      '<form class="hdr-search hdr-desktop-only search-box" role="search" action="kategori.html" data-search>' +
        '<label class="search">' + icon('fa-solid fa-magnifying-glass') + '<span class="sr-only">Ürün ara</span>' +
          '<input type="search" name="q" placeholder="Ne Aramıştınız ?" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="aramaPaneli">' + '<button class="search__clear" type="button" data-search-clear aria-label="Aramayı temizle" hidden>' + icon('fa-solid fa-xmark') + '</button>' + '<button type="submit">Ara</button></label>' +
        '<div class="search-panel" id="aramaPaneli" role="listbox" aria-label="Arama önerileri"></div>' +
      '</form>' +
      '<div class="hdr-actions">' +
        '<button class="icon-btn icon-btn--ghost hdr-mobile-only hdr-search-trigger" type="button" data-search-toggle aria-label="Aramayı aç">' + icon('fa-solid fa-magnifying-glass') + '</button>' +
        '<a class="pill pill--brand hdr-desktop-only" href="#">' + icon('fa-solid fa-bolt') + ' Bugünün Fırsatı</a>' +
        '<div class="hdr-menu" data-menu data-hover>' +
          '<button class="icon-btn icon-btn--ghost hdr-icon" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Favorilerim" title="Favorilerim" data-menu-btn>' + icon('fa-regular fa-heart') +
          '<span class="pill__count" data-fav-count data-count="0">0</span></button>' +
          '<div class="dropdown" data-favlist></div>' +
        '</div>' +
        '<div class="hdr-menu" data-menu data-hover>' +
          '<button class="icon-btn icon-btn--ghost hdr-icon" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Giriş Yap" title="Giriş Yap" data-menu-btn>' + icon('fa-regular fa-user') + '</button>' +
          '<div class="dropdown" role="menu"><ul class="dropdown__list">' +
            '<li><a class="dropdown__item" href="' + URL.giris + '" role="menuitem">' + icon('fa-solid fa-arrow-right-to-bracket') + ' Giriş Yap</a></li>' +
            '<li><a class="dropdown__item" href="' + URL.kayit + '" role="menuitem">' + icon('fa-solid fa-user-plus') + ' Kayıt Ol</a></li>' +
            '<li><a class="dropdown__item" href="' + URL.sifre + '" role="menuitem">' + icon('fa-solid fa-key') + ' Şifremi Unuttum?</a></li>' +
          '</ul></div>' +
        '</div>' +
        '<div class="hdr-menu" data-menu data-hover>' +
          '<button class="icon-btn icon-btn--ghost hdr-icon" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Sepetim" title="Sepetim" data-menu-btn>' + icon('fa-solid fa-basket-shopping') +
          '<span class="pill__count" data-cart-count data-count="0">0</span></button>' +
          '<div class="dropdown" data-minicart></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="hdr-nav-row hdr-desktop-only"><nav aria-label="Kategoriler"><ul class="nav" data-nav>' +
      '<li class="nav__item"><a class="nav__link nav__link--home" href="' + URL.home + '" aria-label="Ana Sayfa">' + icon('fa-solid fa-house') + '</a></li>' +
    '</ul></nav></div>' +
    '<div class="hdr-collapse" id="hdrCollapse"><div class="hdr-collapse__row">' +
      '<form class="hdr-collapse__search search-box" role="search" action="kategori.html" data-search>' +
        '<label class="search">' + icon('fa-solid fa-magnifying-glass') + '<span class="sr-only">Ürün ara</span>' +
          '<input type="search" name="q" placeholder="Ne Aramıştınız ?" autocomplete="off" id="mobileSearch" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="aramaPaneliMobil">' + '<button class="search__clear" type="button" data-search-clear aria-label="Aramayı temizle" hidden>' + icon('fa-solid fa-xmark') + '</button>' + '</label>' +
        '<div class="search-panel" id="aramaPaneliMobil" role="listbox" aria-label="Arama önerileri"></div>' +
      '</form>' +
      '<button class="pill pill--brand" type="button" data-drawer-open="drawer" aria-controls="drawer">' + icon('fa-solid fa-table-cells-large') + ' Kategoriler</button>' +
    '</div></div>' +
  '</div>' +
'</header>' +
'<div class="menu-scrim" data-menu-scrim></div>';
  }

  function sep() { return '<span class="sep"></span>'; }

  function bottom(page) {
    var active = function (p) { return page === p ? ' is-active' : ''; };
    return '' +
'<footer class="site-footer" id="siteFooter">' +
  '<div class="wrap">' +
    '<div class="foot-grid">' +
      '<div class="foot-brand">' +
        '<a class="foot-brand__logo" href="' + URL.home + '" aria-label="Azem Toptan ana sayfa"><img src="assets/img/brand/azem-logo.svg" width="108" height="42" alt="Azem Toptan"></a>' +
        '<div class="foot-soc" aria-label="Bizi Takip Edin">' +
          '<a href="#" aria-label="Facebook">' + icon('fa-brands fa-facebook-f') + '</a>' +
          '<a href="#" aria-label="YouTube">' + icon('fa-brands fa-youtube') + '</a>' +
          '<a href="#" aria-label="X">' + icon('fa-brands fa-x-twitter') + '</a>' +
          '<a href="#" aria-label="Instagram">' + icon('fa-brands fa-instagram') + '</a>' +
        '</div>' +
      '</div>' +
      '<nav class="foot-col" aria-label="Kategoriler"><h2>Kategoriler</h2><div data-foot-cats></div></nav>' +
      '<nav class="foot-col" aria-label="Yardım"><h2>Yardım</h2>' +
        '<a href="#">Müşteri Hizmetleri</a>' +
        '<a href="' + URL.yasal('iptal-ve-iade') + '">İptal ve İade</a>' +
        '<a href="#">Nasıl Kolay İade Yaparım?</a>' +
        '<a href="#">S.S.S.</a>' +
      '</nav>' +
      '<div class="foot-col"><h2>İletişim</h2><div class="foot-contact">' +
        '<p class="foot-contact__row">' + icon('fa-brands fa-whatsapp') + '<span><strong>WhatsApp Sipariş Hattı</strong><span data-whatsapp></span></span></p>' +
        '<p class="foot-contact__row">' + icon('fa-solid fa-envelope') + '<span><strong>E-Posta Adresi</strong><span data-email></span></span></p>' +
        '<p class="foot-contact__row">' + icon('fa-solid fa-location-dot') + '<span><strong>Adres</strong><span data-address></span></span></p>' +
      '</div></div>' +
      '<div class="foot-app"><h2>Uygulamayı İndir</h2><div class="foot-app__btns">' +
        '<a class="app-btn" href="#" aria-label="App Store\'dan indir">' + icon('fa-brands fa-apple') + '<span class="app-btn__tx"><span class="app-btn__pre">İndir</span><span class="app-btn__store">App Store</span></span></a>' +
        '<a class="app-btn" href="#" aria-label="Google Play\'den indir">' + icon('fa-brands fa-google-play') + '<span class="app-btn__tx"><span class="app-btn__pre">İndir</span><span class="app-btn__store">Google Play</span></span></a>' +
      '</div></div>' +
    '</div>' +
    '<nav class="foot-corp" aria-label="Kurumsal">' +
      '<a href="#">Hakkımızda</a>' + sep() + '<a href="#">Markalar</a>' + sep() + '<a href="#">Azem Kart</a>' + sep() + '<a href="#">İletişim</a>' +
    '</nav>' +
    '<nav class="foot-legal" aria-label="Yasal">' +
      '<a href="' + URL.yasal('cerez-politikasi') + '">Çerez Politikası</a>' + sep() +
      '<a href="' + URL.yasal('uyelik-sozlesmesi') + '">Üyelik Sözleşmesi</a>' + sep() +
      '<a href="' + URL.yasal('mesafeli-satis-sozlesmesi') + '">Mesafeli Satış Sözleşmesi</a>' + sep() +
      '<a href="' + URL.yasal('kvkk') + '">KVKK</a>' +
    '</nav>' +
    '<div class="foot-bottom">' +
      '<span>© 2024 <b>Azem Toptan</b> · Toptan Alışverişin Adresi</span>' +
      '<div class="pay-logos" aria-label="Ödeme yöntemleri" data-pay-logos></div>' +
      '<a class="foot-sign" href="#"><span class="gw-code">&lt;/&gt;</span> GaviaWorks</a>' +
    '</div>' +
  '</div>' +
'</footer>' +

'<nav class="bottom-nav" id="bottomNav" aria-label="Hızlı erişim">' +
  '<a class="bottom-nav__item' + active('home') + '" href="' + URL.home + '"' + (page === 'home' ? ' aria-current="page"' : '') + '>' + icon('fa-solid fa-house') + 'Ana Sayfa</a>' +
  '<button class="bottom-nav__item' + active('kategori') + '" type="button" data-drawer-open="drawer" aria-controls="drawer">' + icon('fa-solid fa-table-cells-large') + 'Kategori</button>' +
  '<button class="bottom-nav__item" type="button" data-search-focus>' + icon('fa-solid fa-magnifying-glass') + 'Ara</button>' +
  '<a class="bottom-nav__item" href="#">' + icon('fa-regular fa-heart') + 'Favorilerim<span class="pill__count" data-fav-count data-count="0">0</span></a>' +
  '<a class="bottom-nav__item" href="#">' + icon('fa-solid fa-basket-shopping') + 'Sepet<span class="pill__count" data-cart-count data-count="0">0</span></a>' +
'</nav>' +

'<div class="scrim" data-drawer-scrim></div>' +
'<aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-label="Kategoriler" tabindex="-1">' +
  '<div class="drawer__head"><img src="assets/img/brand/azem-logo.svg" width="104" height="40" alt="Azem Toptan">' +
    '<button class="icon-btn" type="button" data-drawer-close aria-label="Menüyü kapat">' + icon('fa-solid fa-xmark') + '</button></div>' +
  '<div class="drawer__body"><p class="drawer__title">Kategoriler</p><div data-drawer-tree></div></div>' +
  '<div class="drawer__foot">' +
    '<a class="btn btn--primary btn--block" href="#">' + icon('fa-solid fa-bolt') + ' Bugünün Fırsatı</a>' +
    '<div class="drawer__pair"><a class="btn btn--ghost btn--sm" href="' + URL.giris + '">Giriş Yap</a><a class="btn btn--ghost btn--sm" href="' + URL.kayit + '">Kayıt Ol</a></div>' +
  '</div>' +
'</aside>' +

'<div class="scrim scrim--modal" data-modal-scrim></div>' +
'<div class="modal" id="quickView" role="dialog" aria-modal="true" aria-labelledby="qvName">' +
  '<div class="modal__panel" tabindex="-1">' +
    '<button class="icon-btn icon-btn--round modal__close" type="button" data-modal-close aria-label="Kapat">' + icon('fa-solid fa-xmark') + '</button>' +
    '<div class="qv" data-qv></div>' +
  '</div>' +
'</div>' +

'<div class="cookie" role="region" aria-label="Çerezler" data-cookie hidden>' +
  '<p class="cookie__title">' + icon('fa-solid fa-cookie-bite') + '<strong>Çerezler</strong></p>' +
  '<p>Daha iyi bir kullanıcı deneyimi sunmak için çerezleri kullanıyoruz. <a href="' + URL.yasal('gizlilik-politikasi') + '">Gizlilik Politikası</a></p>' +
  '<div class="cookie__actions">' +
    '<button class="btn btn--ghost btn--sm" type="button" data-cookie-choice="reddet">Reddet</button>' +
    '<button class="btn btn--primary btn--sm" type="button" data-cookie-choice="kabul">Kabul Et</button>' +
  '</div>' +
'</div>' +
'<div class="toast-stack" data-toasts role="status" aria-live="polite"></div>' +
'<button class="to-top" type="button" data-to-top aria-label="Yukarı çık">' + icon('fa-solid fa-chevron-up') + '</button>';
  }

  /* Ödeme logoları: footer ve ürün detayı aynı sprite'ı kullanır */
  var PAY = [['troy', '0 0 108.473 50.022', 'troy'], ['visa', '0 0 24 7.751', 'Visa'], ['mastercard', '0 0 24 14.831', 'Mastercard'],
    ['paytr', '0 0 134 22.911', 'PayTR'], ['americanexpress', '0 0 24 24', 'American Express', 'pay-logo--badge']];
  function payLogos() {
    return PAY.map(function (p) {
      return '<svg' + (p[3] ? ' class="' + p[3] + '"' : '') + ' viewBox="' + p[1] + '" role="img" aria-label="' + p[2] + '"><use href="assets/img/icons/odeme.svg#' + p[0] + '"></use></svg>';
    }).join('');
  }

  window.AZEM_SHELL = window.AZEM_SHELL || { url: URL, payLogos: payLogos };

  var me = document.currentScript;
  if (!me) return;
  var part = me.getAttribute('data-shell');
  if (part === 'top') me.insertAdjacentHTML('beforebegin', top());
  if (part === 'bottom') {
    me.insertAdjacentHTML('beforebegin', bottom(document.body.getAttribute('data-page') || ''));
    Array.prototype.forEach.call(document.querySelectorAll('[data-pay-logos]'), function (el) { el.innerHTML = payLogos(); });
  }
})();
