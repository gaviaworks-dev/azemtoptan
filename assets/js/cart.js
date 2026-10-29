/* ==========================================================================
   Sepet — sepet.html (A101 Ekstra sepeti, K1a)
   Sol: satırlar (görsel, ad, birim rozeti, birim fiyat, adet, satır toplamı, sil) + "Sepeti Boşalt".
   Sağ: yapışık sipariş özeti (Ara Toplam, Kargo, kargo eşiği, Toplam, "Sepeti Onayla") + kupon (K5a).
   Altta "Bunlar da İlginizi Çekebilir" rayı. Boş sepet: Azem'in boş metni.
   ========================================================================== */
(function () {
  'use strict';

  var A = window.AZEM_APP;
  var $ = A.$, $$ = A.$$, esc = A.esc, icon = A.icon;

  var head = $('[data-cart-head]'), body = $('[data-cart-body]'), railBox = $('[data-cart-rail]');
  var fullEl = $('[data-cart-full]', body), emptyEl = $('[data-cart-empty]', body);
  var bar = $('[data-sum-bar]'), barTotal = $('[data-sum-bar-total]');
  var discount = 0;   /* Azem'de tanımlı kupon yok (K5a): indirim satırı yalnız geçerli kuponda görünür */
  var listEl = null, sumEl = null, nEl = null;
  /* satır toplamı ₺ ile bölünmez */
  function price(n) { return A.formatPrice(n).replace(' ₺', '\u00a0₺'); }

  /* ---------- Satır ---------- */
  function qtyHtml(l) {
    var one = l.qty <= 1;
    return '<span class="qty qty--sm" role="group" aria-label="' + esc(l.p.name) + ' adedi">' +
      '<button class="qty__btn" type="button" data-line-dec="' + esc(l.key) + '" aria-label="' + (one ? 'Sepetten çıkar' : 'Azalt') + '">' + icon('fa-solid ' + (one ? 'fa-trash-can' : 'fa-minus')) + '</button>' +
      '<input class="qty__input" type="text" inputmode="numeric" value="' + l.qty + '" aria-label="Adet" data-line-qty="' + esc(l.key) + '">' +
      '<button class="qty__btn" type="button" data-line-inc="' + esc(l.key) + '" aria-label="Artır"' + (l.qty >= 999 ? ' disabled' : '') + '>' + icon('fa-solid fa-plus') + '</button></span>';
  }
  function lineHtml(l) {
    var p = l.p, url = A.productUrl(p);
    return '<li class="mc-line mc-line--lg">' +
      '<a class="mc-line__img" href="' + url + '" tabindex="-1" aria-hidden="true">' + (p.img ? '<span style="' + A.productBg(p) + '"></span>' : '') + '</a>' +
      '<div class="mc-line__body">' +
        '<a class="mc-line__name" href="' + url + '">' + esc(p.name) + '</a>' +
        '<p class="mc-line__meta"><span class="unit-badge">' + esc(l.unit) + '</span><span>' + A.formatPrice(l.price) + ' / ' + esc(l.opt.unit) + '</span></p>' +
        '<div class="mc-line__row">' + qtyHtml(l) + '<span class="price mc-line__total">' + price(l.line) + '</span></div>' +
      '</div>' +
      '<button class="icon-btn mc-line__del" type="button" data-line-del="' + esc(l.key) + '" aria-label="' + esc(p.name) + ' sepetten çıkar">' + icon('fa-regular fa-trash-can') + '</button>' +
    '</li>';
  }

  /* ---------- Sipariş özeti ---------- */
  function summaryHtml(t) {
    return '<h2 class="summary__title">Sipariş Özeti</h2>' +
      '<div class="summary__rows">' +
        '<p class="summary__row"><span>Ara Toplam</span><b>' + A.formatPrice(t.subtotal) + '</b></p>' +
        '<p class="summary__row"><span>Kargo</span><b>' + (t.shipping ? A.formatPrice(t.shipping) : 'Ücretsiz') + '</b></p>' +
        (t.discount ? '<p class="summary__row summary__row--discount"><span>Kupon İndirimi</span><b>−' + A.formatPrice(t.discount) + '</b></p>' : '') +
      '</div>' +
      A.shipMeter(t) +
      '<p class="summary__total"><span>Toplam</span><span class="price">' + A.formatPrice(t.total) + '</span></p>' +
      '<button class="btn btn--primary btn--block" type="button" data-cart-confirm>Sepeti Onayla ' + icon('fa-solid fa-arrow-right') + '</button>' +
      '<p class="summary__note">Fiyatlara KDV dahildir.</p>';
  }

  /* ---------- Yerleşim: bir kez kurulur (kupon alanı ve toplam çubuğunun izlediği özet kartı yerinde kalır);
     sepet boşalınca gizlenir, yanında boş durum görünür. Satırlar ve özet her değişimde. ---------- */
  function layout() {
    fullEl.innerHTML = '<div class="buy-layout">' +
      '<section class="co-section" aria-labelledby="sepetSatirlar">' +
        '<div class="co-section__head"><h2 class="co-section__title" id="sepetSatirlar" data-cart-n></h2>' +
          '<button class="link co-section__action" type="button" data-cart-clear>' + icon('fa-regular fa-trash-can') + ' Sepeti Boşalt</button></div>' +
        '<div data-cart-lines>' + A.skeletonRows(Math.min(3, A.cartLines().length)) + '</div>' +
      '</section>' +
      '<aside class="summary-col" aria-label="Sipariş özeti">' +
        '<div class="summary" data-cart-summary></div>' +
        '<div class="field">' +
          '<label class="field__label" for="kuponKodu">Kupon Kodu</label>' +
          '<div class="field-action"><input class="input" id="kuponKodu" name="kupon" type="text" autocomplete="off" spellcheck="false">' +
          '<button class="btn btn--ghost" type="button" data-coupon-apply disabled>Kupon Uygula</button></div>' +
        '</div>' +
      '</aside></div>';
    listEl = $('[data-cart-lines]', body); sumEl = $('[data-cart-summary]', body); nEl = $('[data-cart-n]', body);
    /* çubuk sayfa başı header'ın altına girince belirir, özet kartı ekrandayken gizlenir */
    A.stickyBar(bar, $('.page-head'), sumEl);
  }
  /* toplam çubuğu yalnız dolu sepette; gizlenince stickyBar yeniden baksın (resize) */
  function showFull(on) {
    fullEl.hidden = !on; emptyEl.hidden = on;
    if (bar.hidden === on) { bar.hidden = !on; window.dispatchEvent(new Event('resize')); }
  }

  function render() {
    var lines = A.cartLines(), t = A.cartTotals(discount);
    head.textContent = lines.length ? '(' + lines.length + ' ürün)' : '';
    if (!lines.length) {
      showFull(false);
      if (!emptyEl.innerHTML) emptyEl.innerHTML = A.stateBox({ icon: 'fa-basket-shopping', title: 'Sepetinizde Ürün Bulunamadı!',
        text: 'Sepetinize ürün eklemek için kategorilere göz atın.', action: { label: 'Alışverişe Geri Dön', href: A.URLS.home } });
      return;
    }
    if (!listEl) layout();
    showFull(true);
    nEl.textContent = lines.length + ' Ürün';
    listEl.innerHTML = '<ul>' + lines.map(lineHtml).join('') + '</ul>';
    sumEl.innerHTML = summaryHtml(t);
    barTotal.textContent = A.formatPrice(t.total);
  }

  /* ---------- Geri Al: silinen satırlar eski sıralarına döner; arada eklenenler korunur ---------- */
  function snapshot() { var s = {}; Object.keys(A.cart).forEach(function (k) { s[k] = A.cart[k]; }); return s; }
  function restore(snap, keys) {
    var now = snapshot();
    Object.keys(A.cart).forEach(function (k) { delete A.cart[k]; });
    Object.keys(snap).forEach(function (k) {
      if (k in now) A.cart[k] = now[k]; else if (keys.indexOf(k) > -1) A.cart[k] = snap[k];
    });
    Object.keys(now).forEach(function (k) { if (!(k in A.cart)) A.cart[k] = now[k]; });
    keys.forEach(function (k) { A.setQty(k, A.cart[k]); });
    A.toast('Geri alındı', null, { tone: 'success' });
  }
  function askRemove(key) {
    A.dialog({ tone: 'danger', title: 'Ürün sepetten silinecek', text: 'Bu ürünü sepetinizden çıkarmak istediğinize emin misiniz?', cancel: 'Vazgeç', ok: 'Sil' })
      .then(function (ok) {
        if (!ok) return;
        var snap = snapshot();
        A.removeLine(key);
        A.toast('Ürün sepetten çıkarıldı', 'fa-trash-can', { action: { label: 'Geri Al', onClick: function () { restore(snap, [key]); } } });
      });
  }

  /* ---------- Satır davranışları: adet, sil, boşalt, onay ---------- */
  function refocus(attr, key) {
    var b = listEl && $('[' + attr + '="' + key + '"]', listEl);
    if (b && !b.disabled) b.focus();
    else { var q = listEl && $('[data-line-qty="' + key + '"]', listEl); if (q) q.focus(); }
  }
  bar.addEventListener('click', function (e) {
    if (e.target.closest('[data-cart-confirm]')) confirm();
  });
  /* K3a: ödeme için giriş zorunlu */
  function confirm() { A.requireLogin().then(function (ok) { if (ok) location.href = A.URLS.odeme; }); }
  body.addEventListener('click', function (e) {
    var t = e.target.closest('[data-line-inc], [data-line-dec], [data-line-del], [data-cart-clear], [data-cart-confirm], [data-coupon-apply]');
    if (!t) return;
    var key, q;
    if ((key = t.getAttribute('data-line-inc'))) { A.setQty(key, Math.min(999, A.cart[key] + 1)); refocus('data-line-inc', key); }
    else if ((key = t.getAttribute('data-line-dec'))) {
      q = A.cart[key];
      if (q <= 1) askRemove(key);   /* A101: 1'de çöp kutusu */
      else { A.setQty(key, q - 1); refocus('data-line-dec', key); }
    }
    else if ((key = t.getAttribute('data-line-del'))) askRemove(key);
    else if (t.hasAttribute('data-cart-clear')) {
      A.dialog({ tone: 'danger', title: 'Sepetiniz boşaltılacak', text: 'Sepetinizdeki tüm ürünler silinecek.', cancel: 'Vazgeç', ok: 'Sepeti Boşalt' })
        .then(function (ok) {
          if (!ok) return;
          var snap = snapshot();
          A.clearCart();
          A.toast('Sepet boşaltıldı', 'fa-trash-can', { action: { label: 'Geri Al', onClick: function () { restore(snap, Object.keys(snap)); } } });
        });
    }
    else if (t.hasAttribute('data-cart-confirm')) confirm();
    else if (t.hasAttribute('data-coupon-apply')) applyCoupon();
  });
  /* elle yazılan adet (main.js .qty__input değişiminde qtychange yayar; 1–999) */
  body.addEventListener('qtychange', function (e) {
    var input = $('[data-line-qty]', e.target);
    if (input) A.setQty(input.getAttribute('data-line-qty'), e.detail);
  });

  /* ---------- Kupon (K5a): Azem'de geçerli kod tanımlı değil, her kod geçersiz döner ---------- */
  function applyCoupon() {
    var input = $('#kuponKodu'), btn = $('[data-coupon-apply]');
    if (!input.value.trim()) return;
    A.busy(btn, true, 'Kontrol ediliyor');
    setTimeout(function () {
      A.busy(btn, false);
      A.setError(input, 'Kupon kodu geçersiz.');
      A.toast('Kupon kodu geçersiz', null, { tone: 'error' });
      input.focus();
    }, 500);
  }
  body.addEventListener('input', function (e) {
    if (e.target.id !== 'kuponKodu') return;
    $('[data-coupon-apply]').disabled = !e.target.value.trim();
    A.clearError(e.target);
  });
  body.addEventListener('keydown', function (e) {
    if (e.target.id === 'kuponKodu' && e.key === 'Enter') { e.preventDefault(); applyCoupon(); }
  });

  /* ---------- Öneri rayı (A101 "Bunlar da İlginizi Çekebilir"): sepetteki ürünlerin kategorilerinden, sepette olmayanlar ---------- */
  function picks() {
    var lines = A.cartLines(), skip = {}, out = [];
    lines.forEach(function (l) { skip[l.p.id] = true; });
    function add(id) {
      var p = A.products[id];
      if (out.length >= 10 || !p || skip[id] || !p.img || !A.sellable(p)) return;
      skip[id] = true; out.push(p);
    }
    lines.forEach(function (l) {
      var deepest = l.p.cats.map(function (id) { return A.cats[id]; }).filter(Boolean)
        .reduce(function (a, c) { return !a || c.level > a.level ? c : a; }, null);
      for (var c = deepest, n = 0; c && n < 3; c = A.cats[c.parent]) c.items.forEach(function (id) { if (n < 3 && !skip[id]) { add(id); n++; } });
    });
    A.DB.products.forEach(function (p) { add(p.id); });
    return out;
  }
  var rec = picks();
  if (rec.length) {
    railBox.innerHTML = '<section class="sec sec--white"><div class="wrap">' +
      '<div class="sec-head"><h2 class="sec-head__title">Bunlar da İlginizi Çekebilir</h2>' +
      '<div class="sec-head__tools rail-arrows">' +
      '<button class="icon-btn icon-btn--round" type="button" data-rail-prev="rail-oneri" aria-label="Önceki ürünler">' + icon('fa-solid fa-chevron-left') + '</button>' +
      '<button class="icon-btn icon-btn--round" type="button" data-rail-next="rail-oneri" aria-label="Sonraki ürünler">' + icon('fa-solid fa-chevron-right') + '</button>' +
      '</div></div>' +
      '<div class="rail rail--bleed" id="rail-oneri">' + rec.map(A.productCard).join('') + '</div>' +
      '</div></section>';
  }

  /* İlk açılış: satırlar ~300 ms iskelet (liste sayfasındaki gibi), sonra sepet değişimlerini dinle */
  var n0 = A.cartLines().length;
  if (n0) {
    layout(); showFull(true);
    head.textContent = '(' + n0 + ' ürün)'; nEl.textContent = n0 + ' Ürün';
    sumEl.innerHTML = summaryHtml(A.cartTotals(discount));
    barTotal.textContent = A.formatPrice(A.cartTotals(discount).total);
  } else render();
  A.ready();
  setTimeout(function () {
    render(); A.onCart(render);
  }, 300);
})();
