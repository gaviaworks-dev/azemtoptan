/* ==========================================================================
   Sipariş tamamlandı — siparis-tamamlandi.html?no=<sipariş no>
   Sonuç kartı: Sipariş No, Tarih, Teslimat, Ödeme, Toplam + kısa ürün listesi.
   Sipariş yerel kayıttan (A.orders, K14a); numara yoksa ya da bilinmiyorsa hata kartı.
   ========================================================================== */
(function () {
  'use strict';

  var A = window.AZEM_APP;
  var $ = A.$, esc = A.esc, icon = A.icon;

  var box = $('[data-order-done]');
  var no = A.param('no'), o = no ? A.orders.get(no) : null;
  var MAX = 5;   /* kısa liste: ilk 5 satır, kalanı "+N ürün daha" */

  function row(k, v) { return '<div class="kv__row"><span class="kv__key">' + k + '</span><span class="kv__val">' + v + '</span></div>'; }
  function actions(siparisUrl) {
    return '<div class="result-card__actions">' +
      '<a class="btn btn--primary" href="' + siparisUrl + '">Siparişlerime Git</a>' +
      '<a class="btn btn--ghost" href="' + A.URLS.home + '">Alışverişe Devam Et</a></div>';
  }

  if (!o) {
    document.title = 'Sipariş bulunamadı | Azem Toptan';
    box.innerHTML = '<div class="result-card result-card--error">' +
      '<span class="result-card__icon">' + icon('fa-solid fa-circle-exclamation') + '</span>' +
      '<h1 class="result-card__title">Sipariş bulunamadı</h1>' +
      '<p class="result-card__text">Sipariş numarası geçersiz ya da bu cihazda kayıtlı değil.</p>' +
      actions(A.URLS.hesap('siparisler')) + '</div>';
    A.ready();
    return;
  }

  var magaza = o.teslimat === 'Mağazadan Teslim Al', a = o.adres || {};
  var yer = magaza ? ((A.D.contact && A.D.contact.address) || '') : [a.baslik, a.ilce && a.il ? a.ilce + ' / ' + a.il : ''].filter(Boolean).join(' · ');
  var lines = o.lines || [], more = lines.length - MAX;

  box.innerHTML = '<div class="result-card">' +
    '<span class="result-card__icon">' + icon('fa-solid fa-check') + '</span>' +
    '<h1 class="result-card__title">Siparişiniz alındı</h1>' +
    '<p class="result-card__text">Sipariş özetiniz aşağıdadır.' +
      (o.odeme === 'Havale / EFT' ? ' Banka hesap bilgileri sipariş onayından sonra paylaşılır.' : '') + '</p>' +
    '<div class="kv">' +
      row('Sipariş No', esc(o.no)) +
      row('Tarih', esc(A.formatDate(o.tarih))) +
      row('Teslimat', esc(o.teslimat) + (yer ? '<br>' + esc(yer) : '')) +
      row('Ödeme', esc(o.odeme)) +
      row('Toplam', A.formatPrice(o.totals.total)) +
    '</div>' +
    '<div class="kv">' + lines.slice(0, MAX).map(function (l) {
      return row(esc(l.name), l.qty + ' × ' + esc(l.unit) + '<br>' + A.formatPrice(l.line));
    }).join('') + (more > 0 ? row('+' + more + ' ürün daha', '') : '') + '</div>' +
    actions(A.URLS.hesap('siparis') + '&no=' + encodeURIComponent(o.no)) +
  '</div>';

  A.ready();
})();
