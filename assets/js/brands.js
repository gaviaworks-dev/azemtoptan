/* ==========================================================================
   Marka dizini — markalar.html (K11a)
   Azem'in /markalar sayfası boş; dizin AZEM_DB.brands'ten. Yalnız satılabilir ürünü olan markalar, ürün sayısıyla.
   Harf dizini Türk alfabesi (markası olmayan harf pasif); alfabe dışı ilk harfler (ör. Q) sıraya eklenir.
   Sayfa içi süzme: yazdıkça gruplar ve harf dizini yeniden basılır. Marka → kategori.html?marka=<slug>.
   ========================================================================== */
(function () {
  'use strict';

  var A = window.AZEM_APP;
  var $ = A.$, esc = A.esc, fold = A.fold, display = window.AZEM_FORMAT.productName;   /* fold: süzmede Türkçe harfler sadeleşir, "kup" → Balküpü */

  var ALPHABET = 'A B C Ç D E F G Ğ H I İ J K L M N O Ö P R S Ş T U Ü V Y Z'.split(' ');
  function upperTR(s) { return String(s).toLocaleUpperCase('tr-TR'); }
  function letterOf(name) { var c = upperTR(String(name).trim().charAt(0)); return /[A-ZÇĞİÖŞÜ]/.test(c) ? c : '#'; }
  function anchor(l) { return 'harf-' + (l === '#' ? 'diger' : A.slug(l) + (/[ÇĞİÖŞÜ]/.test(l) ? '-tr' : '')); }

  /* Satılabilir ürün sayısı (fiyatı 0,00 ₺ olanlar sayılmaz; liste sayfasıyla aynı) */
  var count = {};
  A.DB.products.forEach(function (p) {
    if (A.sellable(p) && p.brand != null && A.brands[p.brand]) count[p.brand] = (count[p.brand] || 0) + 1;
  });
  var brands = A.DB.brands.filter(function (b) { return count[b.id]; })
    .sort(function (a, b) { return a.name.localeCompare(b.name, 'tr'); });

  var letters = ALPHABET.slice();
  brands.forEach(function (b) { var l = letterOf(b.name); if (letters.indexOf(l) < 0) letters.push(l); });
  letters.sort(function (a, b) { return a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b, 'tr'); });

  $('[data-total]').textContent = '(' + brands.length + ' marka)';

  var input = $('[data-brand-filter]'), groupsBox = $('[data-groups]'), lettersBox = $('[data-letters]');

  function render() {
    var q = fold(input.value.trim());
    var hit = q ? brands.filter(function (b) { return fold(b.name).indexOf(q) > -1; }) : brands;
    var byLetter = {};
    hit.forEach(function (b) { var l = letterOf(b.name); (byLetter[l] = byLetter[l] || []).push(b); });

    lettersBox.innerHTML = letters.map(function (l) {
      var label = l === '#' ? 'Diğer' : l;
      return byLetter[l]
        ? '<a class="chip" href="#' + anchor(l) + '" data-jump>' + esc(label) + '</a>'
        : '<span class="chip" aria-disabled="true">' + esc(label) + '</span>';
    }).join('');

    groupsBox.innerHTML = hit.length
      ? letters.filter(function (l) { return byLetter[l]; }).map(function (l) {
          return '<section class="stack stack--sm" id="' + anchor(l) + '" aria-labelledby="' + anchor(l) + '-baslik">' +
            '<h2 class="sec-head__title" id="' + anchor(l) + '-baslik">' + esc(l === '#' ? 'Diğer' : l) + '</h2>' +
            '<div class="chip-row">' + byLetter[l].map(function (b) {
              return '<a class="chip" href="kategori.html?marka=' + encodeURIComponent(b.slug) + '">' + esc(display(b.name)) +
                ' <span class="chip__count">(' + count[b.id] + ')</span></a>';
            }).join('') + '</div></section>';
        }).join('')
      : '<div class="empty empty--box empty--compact"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
        '<p class="empty__title">“' + esc(input.value.trim()) + '” ile eşleşen marka bulunamadı</p></div>';

    $('[data-status]').textContent = q ? hit.length + ' marka listelendi' : '';
  }

  var timer = 0;
  input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(render, 120); });

  /* Harfe atlama: yapışık header'ın altında kalmasın */
  lettersBox.addEventListener('click', function (e) {
    var a = e.target.closest('[data-jump]');
    if (!a) return;
    var target = document.getElementById(a.getAttribute('href').slice(1));
    if (!target) return;
    e.preventDefault();
    var hdr = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr-h')) || 0;
    window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - hdr - 16), behavior: A.reduceMotion ? 'auto' : 'smooth' });
    var first = $('a', target);
    if (first) first.focus({ preventScroll: true });
  });

  render();
  A.ready();
})();
