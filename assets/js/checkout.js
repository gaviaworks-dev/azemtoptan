/* ==========================================================================
   Ödeme — odeme.html (A101 ödeme, G5: tek sayfa, numaralı bölümler, sağda yapışık özet)
   1 Teslimat Adresi (adres defteri + çekmecede yeni adres, G4) · 2 Teslimat Yöntemi (K8a) ·
   3 Fatura (Bireysel / Ticari, K6a) · 4 Ödeme (kart yer tutucusu + havale/EFT + kapıda ödeme; Azem SSS: "Kredi Kartı, Havale / EFT veya Kapıda Ödeme").
   Koruma: boş sepet → sepete dönüş; oturum yok → giriş (K3a). Kart bilgisi işlenmez, saklanmaz.
   ========================================================================== */
(function () {
  'use strict';

  var A = window.AZEM_APP, IL = window.AZEM_ILLER || {};
  var $ = A.$, $$ = A.$$, esc = A.esc, icon = A.icon;

  var body = $('[data-co-body]');
  var lines = A.cartLines(), user = A.session.get();

  /* ---------- Koruma ---------- */
  if (!lines.length) {
    body.innerHTML = A.stateBox({ icon: 'fa-basket-shopping', title: 'Sepetinizde Ürün Bulunamadı!',
      text: 'Ödeme adımına geçmek için sepetinize ürün ekleyin.', action: { label: 'Sepete Git', href: A.URLS.sepet } });
    A.ready();
    return;
  }
  if (!user) {
    var geri = A.URLS.giris + '?geri=' + encodeURIComponent(A.URLS.odeme);
    body.innerHTML = A.stateBox({ icon: 'fa-user-lock', title: 'Giriş yapmalısınız',
      text: 'Siparişinizi tamamlamak için giriş yapın ya da üye olun.', action: { label: 'Giriş Yap', href: geri } });
    A.ready();
    A.requireLogin('Siparişinizi tamamlamak için giriş yapın ya da üye olun.');
    return;
  }

  /* ---------- Durum ---------- */
  function defaultAddr() { var l = A.addresses.list(); return (l.filter(function (a) { return a.varsayilan; })[0] || l[0] || {}).id || null; }
  var st = {
    adres: defaultAddr(), fatAyni: true, fatAdres: null,
    teslimat: 'kargo', fatTip: user.tip === '2' || user.tip === 'ticari' ? 'ticari' : 'bireysel', odeme: 'kart'
  };
  var tried = false;

  /* teslimat yöntemine göre toplamlar: mağazadan teslimde kargo ücreti yok */
  function totals() {
    var t = A.cartTotals(0);
    if (st.teslimat === 'magaza') { t.shipping = 0; t.total = t.subtotal - t.discount; }
    return t;
  }
  /* Azem gönderim metninden süre ("1-3 iş günü") */
  var sure = (/(\d+\s*-\s*\d+)\s*<\/strong>\s*iş günü|(\d+\s*-\s*\d+)\s*iş günü/.exec((A.DB.texts && A.DB.texts.gonderim) || '') || []);
  var sureText = (sure[1] || sure[2]) ? (sure[1] || sure[2]).replace(/\s/g, '') + ' iş günü içerisinde kargoya teslim edilir.' : '';

  function phoneText(d) { d = String(d || '').replace(/\D/g, ''); return d.length === 11 ? d.slice(0, 4) + ' ' + d.slice(4, 7) + ' ' + d.slice(7, 9) + ' ' + d.slice(9) : d; }
  function addrLine(a) { return [a.mahalle, a.adres].filter(Boolean).join(', ') + ' · ' + a.ilce + ' / ' + a.il; }

  /* ---------- Parçalar ---------- */
  function checkbox(id, label, checked, extra) {
    return '<label class="check"><input class="check__input" type="checkbox" id="' + id + '"' + (checked ? ' checked' : '') + (extra || '') + '>' +
      '<span class="check__box">' + icon('fa-solid fa-check') + '</span><span class="check__label">' + label + '</span></label>';
  }
  function radio(name, value, on, label, sub, meta) {
    return '<label class="radio-card"><input class="check__input" type="radio" name="' + name + '" value="' + esc(value) + '"' + (on ? ' checked' : '') + '>' +
      '<span class="check__box"></span><span class="radio-card__body"><span class="radio-card__label">' + label + '</span>' +
      (sub || []).map(function (s) { return '<span class="radio-card__sub">' + s + '</span>'; }).join('') + '</span>' +
      (meta ? '<span class="radio-card__meta">' + meta + '</span>' : '') + '</label>';
  }
  function field(id, label, input, full) {
    return '<div class="field' + (full ? ' field--full' : '') + '"><label class="field__label" for="' + id + '">' + label +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(zorunlu)</span></label>' + input + '</div>';
  }
  function section(no, id, title, action, inner) {
    return '<section class="co-section" id="' + id + '" aria-labelledby="' + id + 'T">' +
      '<div class="co-section__head"><span class="co-section__no">' + no + '</span><h2 class="co-section__title" id="' + id + 'T">' + title + '</h2>' + (action || '') + '</div>' +
      inner + '</section>';
  }

  /* 1 · adres listeleri (teslimat ve ayrı fatura adresi aynı defterden) */
  function addrList(name, sel) {
    var l = A.addresses.list();
    if (!l.length) return name !== 'adres' ? '' :
      '<div class="empty empty--box empty--compact">' + icon('fa-solid fa-location-dot') + '<p class="empty__title">Kayıtlı Adresiniz Bulunmamaktadır</p>' +
      '<p class="empty__text">Siparişinizin teslimatı için adres ekleyin.</p><button class="btn btn--primary btn--sm" type="button" data-state-action>' + icon('fa-solid fa-plus') + ' Adres Ekle</button></div>';
    return '<div class="radio-list" role="radiogroup" aria-label="' + (name === 'adres' ? 'Teslimat adresi' : 'Fatura adresi') + '">' + l.map(function (a) {
      return radio(name, a.id, a.id === sel, esc(a.baslik), [esc(a.ad + ' ' + a.soyad) + ' · ' + esc(phoneText(a.telefon)), esc(addrLine(a))]);
    }).join('') + '</div>';
  }
  function renderAddr() {
    $('[data-addr-list]').innerHTML = addrList('adres', st.adres);
    $('[data-addr-fatura]').innerHTML = addrList('faturaAdres', st.fatAdres);
    $('[data-addr-same]').hidden = !A.addresses.list().length;
    sync();
  }

  var secAdres = section(1, 'coAdres', 'Teslimat Adresi',
      '<button class="link co-section__action" type="button" data-addr-new>' + icon('fa-solid fa-plus') + ' Adres Ekle</button>',
      '<div data-addr-list></div>' +
      '<div data-addr-same>' + checkbox('faturaAyni', 'Fatura adresim aynı', true) + '</div>' +
      '<fieldset class="form-group" data-fat-group hidden><legend class="form-group__title">Fatura Adresi</legend><div data-addr-fatura></div></fieldset>');

  /* 2 · teslimat yöntemi */
  function shipMeta() { var t = A.cartTotals(0); return t.shipping ? A.formatPrice(t.shipping) : 'Ücretsiz'; }
  var secTeslimat = section(2, 'coTeslimat', 'Teslimat Yöntemi', '',
    '<div class="radio-list" role="radiogroup" aria-label="Teslimat yöntemi">' +
      radio('teslimat', 'kargo', true, 'Kargo ile Teslimat', sureText ? [esc(sureText)] : [], shipMeta()) +
      radio('teslimat', 'magaza', false, 'Mağazadan Teslim Al', [esc((A.D.contact && A.D.contact.address) || '')], 'Ücretsiz') +
    '</div>');

  /* 3 · fatura: ticari alanlar kayıttan dolu gelir */
  var secFatura = section(3, 'coFatura', 'Fatura', '',
    '<div class="segmented segmented--block" role="radiogroup" aria-label="Fatura tipi">' +
      '<label class="segmented__opt"><input type="radio" name="faturaTipi" value="bireysel"' + (st.fatTip === 'bireysel' ? ' checked' : '') + '><span>' + icon('fa-solid fa-user') + 'Bireysel</span></label>' +
      '<label class="segmented__opt"><input type="radio" name="faturaTipi" value="ticari"' + (st.fatTip === 'ticari' ? ' checked' : '') + '><span>' + icon('fa-solid fa-building') + 'Ticari</span></label>' +
    '</div>' +
    '<fieldset class="form-group" data-ticari-group' + (st.fatTip === 'ticari' ? '' : ' hidden') + '><legend class="sr-only">Firma bilgileri</legend><div class="form-grid form-grid--2">' +
      field('fFirma', 'Firma Adı', '<input class="input" id="fFirma" name="firma" type="text" autocomplete="organization" maxlength="120" required data-label="Firma Adı" value="' + esc(user.firma || '') + '">', true) +
      field('fVergiDairesi', 'Vergi Dairesi', '<input class="input" id="fVergiDairesi" name="vergiDairesi" type="text" maxlength="60" required data-label="Vergi Dairesi" value="' + esc(user.vergiDairesi || '') + '">') +
      field('fVergiNo', 'Vergi/TC No', '<input class="input" id="fVergiNo" name="vergiNo" type="text" inputmode="numeric" maxlength="11" required data-taxno data-label="Vergi/TC No" value="' + esc(user.vergiNo || '') + '">') +
    '</div></fieldset>');

  /* 4 · ödeme: kart alanları yalnız arayüz (PayTR yer tutucusu); havale bilgisi uydurulmaz */
  var secOdeme = section(4, 'coOdeme', 'Ödeme', '',
    '<div class="radio-list" role="radiogroup" aria-label="Ödeme yöntemi">' +
      radio('odeme', 'kart', true, 'Kredi / Banka Kartı', [], icon('fa-regular fa-credit-card')) +
      radio('odeme', 'havale', false, 'Havale / EFT', ['Banka hesap bilgileri sipariş onayından sonra paylaşılır.'], icon('fa-solid fa-building-columns')) +
      radio('odeme', 'kapida', false, 'Kapıda Ödeme', ['Ödeme, sipariş teslim edilirken yapılır.'], icon('fa-solid fa-hand-holding-dollar')) +
    '</div>' +
    '<fieldset class="form-group" data-kart-group><legend class="form-group__title">Kart Bilgileri</legend>' +
      '<div class="form-alert" role="note">' + icon('fa-solid fa-circle-info') + '<span><strong>Bu bir prototiptir.</strong>Kart bilgisi gönderilmez ve saklanmaz. Canlı sitede ödeme PayTR güvenli ödeme sayfasında alınır.</span></div>' +
      '<div class="form-grid form-grid--2">' +
        field('kIsim', 'Kart Üzerindeki İsim', '<input class="input" id="kIsim" type="text" autocomplete="off" required data-label="Kart Üzerindeki İsim">', true) +
        field('kNo', 'Kart Numarası', '<input class="input" id="kNo" type="text" inputmode="numeric" autocomplete="off" placeholder="0000 0000 0000 0000" required data-card="no" data-label="Kart Numarası">', true) +
        field('kSkt', 'Son Kullanma Tarihi', '<input class="input" id="kSkt" type="text" inputmode="numeric" autocomplete="off" placeholder="AA/YY" required data-card="skt" data-label="Son Kullanma Tarihi">') +
        field('kCvv', 'CVV', '<input class="input" id="kCvv" type="text" inputmode="numeric" autocomplete="off" placeholder="000" required data-card="cvv" data-label="CVV">') +
      '</div>' +
    '</fieldset>');

  /* özet: ürün küçük görselleri, toplamlar, sözleşme onayı, Siparişi Tamamla */
  function thumbs() {
    var max = 4, more = lines.length - max;
    return '<div class="order-card__thumbs">' + lines.slice(0, more > 0 ? max - 1 : max).map(function (l) {
      return '<span class="order-card__thumb" title="' + esc(l.p.name) + '">' + (l.p.img ? '<span style="' + A.productBg(l.p) + '" aria-hidden="true"></span>' : '') + '</span>';
    }).join('') + (more > 0 ? '<span class="order-card__more">+' + (more + 1) + '</span>' : '') + '</div>';
  }
  /* özetin değişen parçaları .summary'nin doğrudan çocukları (aralık özetin kendi gap'i); data-co-dyn ile yenilenir */
  function sumRows() {
    var t = totals();
    return '<div class="summary__rows" data-co-dyn>' +
        '<p class="summary__row"><span>Ara Toplam</span><b>' + A.formatPrice(t.subtotal) + '</b></p>' +
        '<p class="summary__row"><span>' + (st.teslimat === 'magaza' ? 'Teslimat' : 'Kargo') + '</span><b>' + (t.shipping ? A.formatPrice(t.shipping) : 'Ücretsiz') + '</b></p>' +
      '</div>' +
      (st.teslimat === 'kargo' ? A.shipMeter(t).replace('class="ship-meter"', 'class="ship-meter" data-co-dyn') : '') +
      '<p class="summary__total" data-co-dyn><span>Toplam</span><span class="price">' + A.formatPrice(t.total) + '</span></p>';
  }
  var summary = '<div class="summary">' +
    '<h2 class="summary__title">Sipariş Özeti</h2>' +
    '<p class="summary__row"><span>' + lines.length + ' Ürün</span><a class="link" href="' + A.URLS.sepet + '">Sepeti Düzenle</a></p>' +
    thumbs() +
    '<span data-co-sum hidden></span>' +
    checkbox('onaySozlesme', '<a href="' + A.URLS.yasal('mesafeli-satis-sozlesmesi') + '" target="_blank">Mesafeli Satış Sözleşmesi</a>\'ni ve <a href="' + A.URLS.yasal('iptal-ve-iade') + '" target="_blank">İptal ve İade</a> koşullarını okudum, kabul ediyorum.', false, ' required') +
    '<button class="btn btn--primary btn--block" type="button" data-co-submit aria-disabled="true">Siparişi Tamamla ' + icon('fa-solid fa-lock') + '</button>' +
    '<p class="summary__note">Fiyatlara KDV dahildir.</p>' +
  '</div>';

  body.innerHTML = '<div class="buy-layout">' +
    '<div class="stack stack--lg">' + secAdres + secTeslimat + secFatura + secOdeme + '</div>' +
    '<aside class="summary-col" aria-label="Sipariş özeti">' + summary + '</aside></div>';

  /* ---------- Doğrulama (üyelik formlarıyla aynı metinler) ---------- */
  function required(label) { return label + ' alanı zorunludur.'; }
  function expiryOk(v) {
    var m = /^(\d{2})\/(\d{2})$/.exec(v); if (!m) return false;
    var mo = +m[1], yy = +m[2], now = new Date(), cy = now.getFullYear() % 100, cm = now.getMonth() + 1;
    return mo >= 1 && mo <= 12 && (yy > cy || (yy === cy && mo >= cm));
  }
  function check(input) {
    var v = input.value.trim(), label = input.getAttribute('data-label');
    if (input.type === 'checkbox') return input.required && !input.checked ? 'Devam etmek için bu onayı işaretleyin.' : '';
    if (input.tagName === 'SELECT') return !v ? (input.name === 'ilce' ? 'İlçe seçiniz.' : 'İl seçiniz.') : '';
    if (!v) return required(label);
    if (input.hasAttribute('data-phone')) return /^05\d{9}$/.test(A.phoneDigits(input)) ? '' : 'Geçerli bir telefon numarası girin (05 ile başlayan 11 hane).';
    if (input.hasAttribute('data-taxno')) return /^\d{10,11}$/.test(v) ? '' : 'Vergi/TC 10 ya da 11 hane olmalıdır.';
    var c = input.getAttribute('data-card');
    if (c === 'no') return /^\d{16}$/.test(v.replace(/\s/g, '')) ? '' : 'Kart numarası 16 hane olmalıdır.';
    if (c === 'skt') return expiryOk(v) ? '' : 'Geçerli bir son kullanma tarihi girin (AA/YY).';
    if (c === 'cvv') return /^\d{3,4}$/.test(v) ? '' : 'CVV 3 ya da 4 hane olmalıdır.';
    return '';
  }
  function validate(input) { var msg = check(input); if (msg) A.setError(input, msg); else A.clearError(input); return !msg; }
  /* görünür (gizli grupta olmayan) zorunlu alanlar */
  function activeInputs(root) {
    return $$('.input[required], .check__input[required]', root).filter(function (i) { var g = i.closest('[hidden]'); return !g && !i.disabled; });
  }
  function firstBad(inputs) {
    var bad = inputs.filter(function (i) { return !validate(i); });
    if (bad.length) { bad[0].focus({ preventScroll: true }); bad[0].scrollIntoView({ block: 'center', behavior: A.reduceMotion ? 'auto' : 'smooth' }); }
    return bad.length;
  }

  /* ---------- Bölüm durumu ve buton: koşullar sağlanana kadar pasif görünür (A101) ---------- */
  function filled(root) { return activeInputs(root).every(function (i) { return i.type === 'checkbox' ? i.checked : i.value.trim(); }); }
  function sync() {
    var done = [
      !!A.addresses.get(st.adres) && (st.fatAyni || !!A.addresses.get(st.fatAdres)),
      true,
      filled($('#coFatura')),
      filled($('#coOdeme'))
    ];
    ['coAdres', 'coTeslimat', 'coFatura', 'coOdeme'].forEach(function (id, i) { $('#' + id).classList.toggle('is-done', done[i]); });
    var ready = done.every(Boolean) && $('#onaySozlesme').checked;
    $$('[data-co-submit]').forEach(function (b) { b.setAttribute('aria-disabled', String(!ready)); });
    $('[data-sum-bar-total]').textContent = A.formatPrice(totals().total);
    $$('[data-co-dyn]').forEach(function (el) { el.remove(); });
    $('[data-co-sum]').insertAdjacentHTML('beforebegin', sumRows());
  }

  /* G20: mağazadan teslimde kapıda ödeme yok; seçiliyse ilk seçeneğe (kart) döner */
  function syncKapida() {
    var r = $('input[name="odeme"][value="kapida"]'), card = r.closest('.radio-card'), sub = $('.radio-card__sub', card);
    var off = st.teslimat === 'magaza';
    if (!sub.hasAttribute('data-sub')) sub.setAttribute('data-sub', sub.textContent);
    r.disabled = off; card.classList.toggle('is-disabled', off); card.setAttribute('aria-disabled', String(off));
    sub.textContent = off ? 'Mağazadan teslimde kullanılamaz.' : sub.getAttribute('data-sub');
    if (off && st.odeme === 'kapida') {
      var first = $('input[name="odeme"]'); first.checked = true; st.odeme = first.value;
      $('[data-kart-group]').hidden = st.odeme !== 'kart';
    }
  }

  /* ---------- Davranışlar ---------- */
  body.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'adres') st.adres = t.value;
    else if (t.name === 'faturaAdres') st.fatAdres = t.value;
    else if (t.id === 'faturaAyni') {
      st.fatAyni = t.checked;
      if (!st.fatAyni && !A.addresses.get(st.fatAdres)) { st.fatAdres = st.adres; $('[data-addr-fatura]').innerHTML = addrList('faturaAdres', st.fatAdres); }
      $('[data-fat-group]').hidden = st.fatAyni;
    }
    else if (t.name === 'teslimat') { st.teslimat = t.value; syncKapida(); }
    else if (t.name === 'faturaTipi') { st.fatTip = t.value; $('[data-ticari-group]').hidden = st.fatTip !== 'ticari'; }
    else if (t.name === 'odeme') { st.odeme = t.value; $('[data-kart-group]').hidden = st.odeme !== 'kart'; }
    else if (tried && t.type === 'checkbox') validate(t);
    sync();
  });
  /* alan maskeleri (kart, vergi no) ve ilk denemeden sonra canlı doğrulama */
  body.addEventListener('input', function (e) {
    var t = e.target, c = t.getAttribute('data-card'), d;
    if (c === 'no') { d = t.value.replace(/\D/g, '').slice(0, 16); t.value = d.replace(/(\d{4})(?=\d)/g, '$1 '); }
    else if (c === 'skt') { d = t.value.replace(/\D/g, '').slice(0, 4); t.value = d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; }
    else if (c === 'cvv' || t.hasAttribute('data-taxno')) { d = t.value.replace(/\D/g, '').slice(0, c === 'cvv' ? 4 : 11); if (d !== t.value) t.value = d; }
    if (tried && t.getAttribute('aria-invalid') === 'true') validate(t);
    sync();
  });
  body.addEventListener('focusout', function (e) {
    if (tried && e.target.matches('.input[required]')) validate(e.target);
  });

  body.addEventListener('click', function (e) {
    var t = e.target.closest('[data-addr-new], [data-state-action], [data-co-submit]');
    if (!t) return;
    if (t.hasAttribute('data-co-submit')) submit(t);
    else openForm(t);
  });

  /* mobil toplam çubuğu (body dışında) aynı gönderimi çağırır */
  var bar = $('[data-sum-bar]');
  bar.addEventListener('click', function (e) { var b = e.target.closest('[data-co-submit]'); if (b) submit(b); });

  /* ---------- Siparişi Tamamla ---------- */
  var ODEME = { kart: 'Kredi / Banka Kartı', havale: 'Havale / EFT', kapida: 'Kapıda Ödeme' };
  function submit(btn) {
    tried = true;
    if (!A.addresses.get(st.adres)) {
      /* A101: "Devam Etmek İçin Adres Girin", tek buton */
      A.dialog({ tone: 'warn', title: 'Devam Etmek İçin Adres Girin', text: 'Siparişinizi tamamlamak için adres bilgisi girmeniz gerekiyor.', cancel: false, ok: 'Tamam' })
        .then(function () {
          var sec = $('#coAdres');
          sec.scrollIntoView({ block: 'start', behavior: A.reduceMotion ? 'auto' : 'smooth' });
          $('[data-addr-new]', sec).focus({ preventScroll: true });
        });
      return;
    }
    if (firstBad(activeInputs(body))) { A.toast('Eksik ya da hatalı alanları düzeltin', null, { tone: 'error' }); return; }

    if (btn.getAttribute('aria-busy') === 'true') return;
    $$('[data-co-submit]').forEach(function (b) { A.busy(b, true, 'Sipariş oluşturuluyor'); });
    var t = totals(), adr = A.addresses.get(st.adres);
    var ticari = st.fatTip === 'ticari', v = function (id) { return $('#' + id).value.trim(); };
    var order = {
      lines: lines.map(function (l) { return { id: l.p.id, name: l.p.name, img: l.p.img, px: l.p.px, unit: l.unit, price: l.price, qty: l.qty, line: l.line }; }),
      totals: { subtotal: t.subtotal, shipping: t.shipping, discount: t.discount, total: t.total },
      adres: adr,
      teslimat: st.teslimat === 'magaza' ? 'Mağazadan Teslim Al' : 'Kargo ile Teslimat',
      odeme: ODEME[st.odeme],
      fatura: {
        tip: ticari ? 'Ticari' : 'Bireysel',
        firma: ticari ? v('fFirma') : '', vergiDairesi: ticari ? v('fVergiDairesi') : '', vergiNo: ticari ? v('fVergiNo') : '',
        adres: st.fatAyni ? adr : A.addresses.get(st.fatAdres)
      }
    };
    /* kart alanları siparişe girmez; sayfadan ayrılmadan temizlenir */
    $$('[data-card], #kIsim').forEach(function (i) { i.value = ''; });
    setTimeout(function () {
      var o = A.orders.add(order);
      A.clearCart();
      location.href = A.URLS.tamam(o.no);
    }, 900);
  }

  /* ---------- Yeni adres çekmecesi ---------- */
  var form = $('#adresFormu'), ilSel = $('#oIl'), ilceSel = $('#oIlce');
  ilSel.insertAdjacentHTML('beforeend', Object.keys(IL).map(function (il) { return '<option>' + esc(il) + '</option>'; }).join(''));
  function fillIlce(il) {
    ilceSel.innerHTML = '<option value="">İlçe Seçiniz</option>' + (IL[il] || []).map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('');
    ilceSel.disabled = !IL[il];
  }
  ilSel.addEventListener('change', function () { fillIlce(ilSel.value); if (formTried) { validate(ilSel); A.clearError(ilceSel); } });
  var formTried = false;
  function openForm(trigger) {
    form.reset(); formTried = false;
    $$('.input', form).forEach(A.clearError);
    fillIlce('');
    /* ilk adreste ad, soyad ve telefon oturumdan */
    if (!A.addresses.list().length) {
      $('#oAd').value = user.ad || ''; $('#oSoyad').value = user.soyad || '';
      var d = String(user.telefon || '').replace(/\D/g, '').replace(/^0/, '');
      $('#oTelefon').value = d.length === 10 ? d.slice(0, 3) + ' ' + d.slice(3, 6) + ' ' + d.slice(6, 8) + ' ' + d.slice(8) : '';
    }
    A.openDrawer('adresCekmece', trigger);
  }
  form.addEventListener('input', function (e) { if (formTried && e.target.getAttribute('aria-invalid') === 'true') validate(e.target); });
  form.addEventListener('focusout', function (e) { if (formTried && e.target.matches('.input')) validate(e.target); });
  form.addEventListener('change', function (e) { if (formTried && e.target === ilceSel) validate(ilceSel); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    formTried = true;
    if (firstBad($$('.input', form))) return;
    var v = function (id) { return $('#' + id).value.trim(); };
    var a = A.addresses.save({ baslik: v('oBaslik'), ad: v('oAd'), soyad: v('oSoyad'), telefon: A.phoneDigits($('#oTelefon')),
      il: ilSel.value, ilce: ilceSel.value, mahalle: v('oMahalle'), adres: v('oAdres') });
    st.adres = a.id;
    A.closeDrawer($('#adresCekmece'));
    renderAddr();
    A.toast('Adres kaydedildi', null, { tone: 'success' });
  });

  $('[data-kart-group]').hidden = st.odeme !== 'kart';
  renderAddr();
  /* çubuk sayfa başı header'ın altına girince belirir, özet kartı ekrandayken gizlenir */
  A.stickyBar(bar, $('.page-head'), $('.summary', body));
  A.ready();
})();
