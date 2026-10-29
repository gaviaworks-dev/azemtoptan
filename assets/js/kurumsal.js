/* ==========================================================================
   Kurumsal ve yardım sayfası — kurumsal.html?s=<slug> (tek şablon, yasal sayfa kalıbı)
   Metin: window.AZEM_KURUMSAL (assets/data/kurumsal.js). s yok ya da geçersizse dizin.
   Masaüstü: yan menü (Kurumsal / Yardım). ≤1024: yan menü gizli, geri butonu dizine döner.
   Türler: metin (blocks), iletisim (bilgi kartları + form), sss (kategori chip'leri + akordeon),
   empty (Azem'de içerik yok: "Metin Azem'den bekleniyor." + işe yarar bağlantılar).
   ========================================================================== */
(function () {
  'use strict';

  var A = window.AZEM_APP, K = window.AZEM_KURUMSAL || { groups: [], contact: [], docs: [] };
  var $ = A.$, $$ = A.$$, esc = A.esc, icon = A.icon;

  var bySlug = {}, contact = {};
  K.docs.forEach(function (d) { if (d.slug) bySlug[d.slug] = d; });
  K.contact.forEach(function (c) { contact[c.key] = c; });
  var doc = bySlug[A.param('s')] || null;

  /* menü öğesinin adresi: sayfa ya da A.URLS'teki başka sayfa */
  function href(d) {
    if (!d.link) return A.URLS.kurumsal(encodeURIComponent(d.slug));
    var u = A.URLS[d.link];
    return typeof u === 'function' ? u(d.arg) : u;
  }
  var INDEX = 'Kurumsal ve Yardım';
  var sep = '<li class="breadcrumb__sep" aria-hidden="true"><i class="fa-solid fa-chevron-right"></i></li>';

  /* ---------- Üst bant: breadcrumb + başlık ---------- */
  $('[data-kur-top]').innerHTML =
    '<nav aria-label="Konum"><ol class="breadcrumb"><li><a href="' + A.URLS.home + '">Ana Sayfa</a></li>' + sep +
    (doc ? '<li><a href="kurumsal.html">' + esc(doc.group) + '</a></li>' + sep + '<li aria-current="page">' + esc(doc.title) + '</li>'
         : '<li aria-current="page">' + INDEX + '</li>') +
    '</ol></nav>' +
    '<div class="page-head__row">' +
      (doc ? '<a class="icon-btn icon-btn--round page-head__back" href="kurumsal.html" aria-label="' + INDEX + '"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></a>' : '') +
      '<h1 class="page-head__title">' + esc(doc ? doc.title : INDEX) + '</h1>' +
    '</div>';
  document.title = (doc ? doc.title : INDEX) + ' | Azem Toptan';

  /* ---------- Yan menü: gruplar, etkin sayfa ---------- */
  function sideMenu(mod) {
    return '<nav class="side-menu' + (mod ? ' ' + mod : '') + '" aria-label="' + INDEX + '">' + K.groups.map(function (g, gi) {
      var items = K.docs.filter(function (d) { return d.group === g; });
      return (gi ? '<hr class="side-menu__divider">' : '') +
        '<p class="side-menu__title">' + esc(g) + '</p><ul class="side-menu__list">' + items.map(function (d) {
          return '<li><a class="side-menu__item" href="' + esc(href(d)) + '"' + (d === doc ? ' aria-current="page"' : '') + '>' +
            icon(d.icon) + '<span>' + esc(d.label || d.title) + '</span>' +
            '<i class="fa-solid fa-chevron-right side-menu__chev" aria-hidden="true"></i></a></li>';
        }).join('') + '</ul>';
    }).join('') + '</nav>';
  }

  /* ---------- Parçalar ---------- */
  /* Metin blokları (html alanları Azem'den, güvenli) */
  function block(b) {
    switch (b.t) {
      case 'h2': return '<h2>' + esc(b.text) + '</h2>';
      case 'h3': return '<h3>' + esc(b.text) + '</h3>';
      case 'p': return '<p>' + b.html + '</p>';
      case 'ul': return '<ul>' + b.items.map(function (li) { return '<li>' + li + '</li>'; }).join('') + '</ul>';
    }
    return '';
  }

  /* Bilgi kartları (azemtoptan.com/iletisim); bağlantısı olmayan kart (Depo) düz kutu */
  function infoGrid(keys) {
    return '<div class="info-grid">' + keys.map(function (k) {
      var c = contact[k];
      var inner = '<span class="info-card__icon">' + icon(c.icon) + '</span>' +
        '<div><p class="info-card__label">' + esc(c.label) + '</p><p class="info-card__value">' + esc(c.value) + '</p></div>';
      return c.href
        ? '<a class="info-card" href="' + esc(c.href) + '"' + (c.external ? ' target="_blank" rel="noopener"' : '') + '>' + inner + '</a>'
        : '<div class="info-card">' + inner + '</div>';
    }).join('') + '</div>';
  }

  function emptyBox(d) {
    return '<div class="empty empty--box">' + icon('fa-solid fa-file-lines') + '<p class="empty__title">Metin Azem\'den bekleniyor.</p>' +
      (d.action ? '<a class="btn btn--ghost" href="' + esc(href(d.action)) + '">' + esc(d.action.label) + '</a>' : '') +
    '</div>';
  }

  function section(title, html) {
    return '<section class="stack"><h2 class="h3">' + esc(title) + '</h2>' + html + '</section>';
  }

  /* İletişim formu (Azem: ad, soyad, e-posta, telefon, mesaj, KVKK onayı); prototipte gönderilmez */
  function req() { return '<span class="req" aria-hidden="true">*</span><span class="sr-only">(zorunlu)</span>'; }
  function field(id, label, input, full) {
    return '<div class="field' + (full ? ' field--full' : '') + '"><label class="field__label" for="' + id + '">' + label + req() + '</label>' + input + '</div>';
  }
  function contactForm(d) {
    return '<form class="form-stack" data-contact-form novalidate>' +
      '<div class="form-alert form-alert--error" data-form-error role="alert" hidden></div>' +
      '<div class="form-alert" data-form-info role="status" hidden></div>' +
      '<div class="form-grid form-grid--2">' +
        field('iAd', 'Adınız', '<input class="input" id="iAd" name="ad" type="text" autocomplete="given-name" required data-label="Ad">') +
        field('iSoyad', 'Soyadınız', '<input class="input" id="iSoyad" name="soyad" type="text" autocomplete="family-name" required data-label="Soyad">') +
        field('iEmail', 'E-Posta', '<input class="input" id="iEmail" name="email" type="email" autocomplete="email" required data-label="E-posta">') +
        field('iTelefon', 'Telefon', '<div class="input-group"><span class="input-group__prefix" aria-hidden="true">0</span><input class="input" id="iTelefon" name="telefon" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="5__ ___ __ __" data-phone required data-label="Telefon"></div>') +
        field('iMesaj', 'Mesajınız', '<textarea class="input" id="iMesaj" name="mesaj" rows="6" placeholder="Mesajınızı Buraya Giriniz" required data-label="Mesaj"></textarea>', true) +
      '</div>' +
      '<label class="check"><input class="check__input" id="iOnay" name="onay" type="checkbox" required><span class="check__box"><i class="fa-solid fa-check" aria-hidden="true"></i></span>' +
        '<span class="check__label"><a href="' + A.URLS.yasal('kvkk') + '" target="_blank">' + esc(d.consent.link) + '</a>' + esc(d.consent.rest) + '</span></label>' +
      '<div class="cluster"><button class="btn btn--primary btn--lg" type="submit">Gönder <i class="fa-solid fa-paper-plane" aria-hidden="true"></i></button></div>' +
    '</form>';
  }

  /* SSS: kategori chip'leri + tek açık akordeon; Destek Hattı iletişim kartlarını gösterir */
  function faq(d) {
    var chips = [{ id: '', name: 'Tümü' }].concat(d.cats);
    return '<div class="prose"><p>' + esc(d.lead) + '</p></div>' +
      '<div class="chip-row" role="group" aria-label="Soru kategorileri">' + chips.map(function (c) {
        return '<button class="chip" type="button" data-faq-cat="' + c.id + '" aria-pressed="' + String(!c.id) + '">' + esc(c.name) + '</button>';
      }).join('') + '</div>' +
      '<div class="faq" data-acc-single data-faq-list>' + d.items.map(function (it, i) {
        return '<div class="acc faq__item" data-cat="' + it.cat + '">' +
          '<button class="acc__btn" type="button" id="soru-' + (i + 1) + '" aria-expanded="false" aria-controls="cevap-' + (i + 1) + '">' + esc(it.q) + '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
          '<div class="acc__panel" id="cevap-' + (i + 1) + '" role="region" aria-labelledby="soru-' + (i + 1) + '"><div><p class="faq__answer">' + esc(it.a) + '</p></div></div>' +
        '</div>';
      }).join('') + '</div>' +
      d.cats.filter(function (c) { return c.contact; }).map(function (c) {
        return '<div data-faq-contact="' + c.id + '" hidden>' + infoGrid(c.contact) + '</div>';
      }).join('') +
      '<div class="prose"><p>' + esc(d.more.pre) + '<a href="' + A.URLS.kurumsal('iletisim') + '">' + esc(d.more.link) + '</a></p></div>';
  }

  function content(d) {
    if (d.empty) return emptyBox(d) + (d.contact ? section('Bize Ulaşın', infoGrid(d.contact)) : '');
    if (d.type === 'iletisim') return section(d.heading, infoGrid(K.contact.map(function (c) { return c.key; }))) + section('İletişim Formu', contactForm(d));
    if (d.type === 'sss') return faq(d);
    return '<article class="prose">' + d.blocks.map(block).join('') + '</article>';
  }

  var body = $('[data-kur-body]');
  if (!doc) {
    /* Dizin: masaüstü ve mobilde aynı kart (yasal dizin gibi) */
    body.innerHTML = sideMenu('side-menu--index');
  } else {
    body.innerHTML =
      '<div class="with-aside">' +
        '<aside class="with-aside__side with-aside__side--desktop">' + sideMenu() + '</aside>' +
        '<div class="with-aside__main stack stack--lg">' + content(doc) + '</div>' +
      '</div>';
  }

  /* ---------- SSS: kategori süzgeci ---------- */
  var list = $('[data-faq-list]');
  if (list) {
    var chips = $$('[data-faq-cat]'), items = $$('.faq__item', list), boxes = $$('[data-faq-contact]');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var cat = chip.getAttribute('data-faq-cat');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        var shown = 0;
        items.forEach(function (it) {
          var on = !cat || it.getAttribute('data-cat') === cat;
          if (!on) A.setAcc($('.acc__btn', it), false);
          it.hidden = !on;
          if (on) shown++;
        });
        list.hidden = !shown;
        boxes.forEach(function (b) { b.hidden = b.getAttribute('data-faq-contact') !== cat; });
      });
    });
  }

  /* ---------- İletişim formu: alan doğrulama (üyelik formlarıyla aynı kurallar ve metinler) ---------- */
  var form = $('[data-contact-form]');
  if (form) {
    var MSG = {
      required: function (label) { return label + ' alanı zorunludur.'; },
      phone: 'Geçerli bir telefon numarası girin (05 ile başlayan 11 hane).',
      email: 'Email adresi uygun formatta değil !',
      check: 'Devam etmek için bu onayı işaretleyin.',
      fail: 'Başarısız İşlem!',
      proto: 'Bu bir prototiptir; mesaj gönderilmez.'
    };
    var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var inputs = $$('.input, .check__input', form);
    var errBox = $('[data-form-error]', form), infoBox = $('[data-form-info]', form);
    var tried = false;

    var check = function (input) {
      var v = input.value.trim();
      if (input.type === 'checkbox') return input.checked ? '' : MSG.check;
      if (!v) return MSG.required(input.getAttribute('data-label'));
      if (input.hasAttribute('data-phone')) return /^05\d{9}$/.test(A.phoneDigits(input)) ? '' : MSG.phone;
      if (input.type === 'email') return EMAIL.test(v) ? '' : MSG.email;
      return '';
    };
    var validate = function (input) {
      var msg = check(input);
      if (msg) A.setError(input, msg); else A.clearError(input);
      return !msg;
    };
    var alertBox = function (el, ico, html) {
      el.hidden = false;
      /* canlı bölge görünür olduktan sonra dolsun ki ekran okuyucu okusun */
      requestAnimationFrame(function () { el.innerHTML = icon('fa-solid ' + ico) + '<span>' + html + '</span>'; });
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      tried = true;
      var bad = inputs.filter(function (i) { return !validate(i); });
      errBox.hidden = infoBox.hidden = true;
      errBox.innerHTML = infoBox.innerHTML = '';
      if (bad.length) {
        alertBox(errBox, 'fa-circle-exclamation', '<strong>' + MSG.fail + '</strong>');
        bad[0].focus({ preventScroll: true });
        bad[0].scrollIntoView({ block: 'center', behavior: A.reduceMotion ? 'auto' : 'smooth' });
      } else {
        alertBox(infoBox, 'fa-circle-info', MSG.proto);
        infoBox.scrollIntoView({ block: 'center', behavior: A.reduceMotion ? 'auto' : 'smooth' });
      }
    });

    /* İlk gönderimden sonra canlı: çıkışta doğrula, yazarken hatalıysa yeniden bak */
    inputs.forEach(function (input) {
      input.addEventListener('blur', function () { if (tried) validate(input); });
      input.addEventListener('change', function () { if (tried && input.type === 'checkbox') validate(input); });
    });
    /* document üzerinde: main.js'in telefon maskesinden sonra çalışsın, değer biçimlenmiş olsun */
    document.addEventListener('input', function (e) {
      var input = e.target;
      if (tried && form.contains(input) && input.getAttribute('aria-invalid') === 'true') validate(input);
    });
  }

  A.ready();
})();
