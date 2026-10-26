/* Azem Toptan — veri katmanı biçimlendirme. Ana sayfa, liste ve detay aynı fonksiyonu kullanır.
   Ürün adı: Azem kaynakta TAMAMEN BÜYÜK HARF; her kelimenin ilk harfi büyük, kalanı küçük olur.
   Türkçe yerel ayar (tr-TR): İ→i, I→ı doğru dönüşür. */
(function () {
  'use strict';
  var TR = 'tr-TR';
  /* Kaynakta İngilizce "I" ile yazılmış markalar (Türkçe kurala göre ı'ya düşerdi) */
  var BRAND = { 'lıpton': 'Lipton', 'cropıx': 'Cropix' };
  /* Büyük kalan kısaltmalar ve beden harfleri */
  var UPPER = { 'wc': 'WC', 's': 'S', 'm': 'M', 'l': 'L', 'xl': 'XL', 'xxl': 'XXL' };
  /* Ölçü birimleri: sayıdan sonra küçük harf */
  var UNIT = { 'gr': 'gr', 'g': 'g', 'kg': 'kg', 'ml': 'ml', 'lt': 'lt', 'cc': 'cc', 'mt': 'mt', 'cm': 'cm', 'mm': 'mm', 'ad': 'ad', 'x': 'x' };

  function capitalize(w) { return w.charAt(0).toLocaleUpperCase(TR) + w.slice(1); }

  function productName(raw) {
    var words = String(raw).trim().replace(/\s+/g, ' ').toLocaleLowerCase(TR).split(' ');
    return words.map(function (w, i) {
      var prev = words[i - 1] || '';
      if (BRAND[w]) return BRAND[w];
      if (UNIT[w] && /\d$/.test(prev)) return UNIT[w];
      if (UPPER[w]) return UPPER[w];
      if (/^\d/.test(w)) return w;                     /* "3ü", "5li", "100" */
      if (w === '&' || w === '*' || w === '+') return w;
      return capitalize(w);
    }).join(' ');
  }

  window.AZEM_FORMAT = { productName: productName };

  /* Katalog yüklendiğinde adları bir kez normalleştir (kaynak ad saklanır) */
  var D = window.AZEM;
  if (!D) return;
  D.shelves.forEach(function (s) {
    s.products.forEach(function (p) { p.sourceName = p.name; p.name = productName(p.name); });
  });
  D.categories.forEach(function (c) {
    c.children.forEach(function (k) { if (k.photoAlt) k.photoAlt = productName(k.photoAlt); });
  });
})();
