/* ==========================================================================
   Giriş / Kayıt / Şifremi Unuttum — alan doğrulama, üyelik tipi, prototip uyarısı
   Kurallar markup'tan okunur: required, minlength, type=email, [data-phone],
   [data-taxno], [data-match="id"], [data-label] (hata metnindeki alan adı)
   ========================================================================== */
(function () {
  'use strict';

  var A = window.AZEM_APP;
  var $ = A.$, $$ = A.$$;

  var MSG = {
    /* "Faaliyet Alanı" gibi "Alanı" ile biten adlarda "alanı" tekrar etmez */
    required: function (label) { return /alanı$/i.test(label) ? label + ' zorunludur.' : label + ' alanı zorunludur.'; },
    min: function (label, n) { return label + ' en az ' + n + ' karakter olmalıdır.'; },
    phone: 'Geçerli bir telefon numarası girin (05 ile başlayan 11 hane).',
    email: 'Email adresi uygun formatta değil !',
    taxno: 'Vergi/TC 10 ya da 11 hane olmalıdır.',
    match: 'Şifreler eşleşmiyor.',
    il: 'İl seçiniz.',
    check: 'Devam etmek için bu onayı işaretleyin.',
    fail: 'Başarısız İşlem!',
    proto: 'Bu bir prototiptir; form gönderilmez.'
  };
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* Gizli (Bireysel'de ticari) alanlar doğrulamaya girmez */
  function active(input) { var f = input.closest('.field'); return !(f && f.hidden); }

  /* Alanın hata metni; geçerliyse '' */
  function check(input) {
    var v = input.type === 'password' ? input.value : input.value.trim();
    var label = input.getAttribute('data-label');
    if (input.type === 'checkbox') return input.required && !input.checked ? MSG.check : '';
    if (input.tagName === 'SELECT') return input.required && !v ? MSG.il : '';
    if (input.hasAttribute('data-match')) return v !== document.getElementById(input.getAttribute('data-match')).value ? MSG.match : '';
    if (!v) return input.required ? MSG.required(label) : '';
    if (input.hasAttribute('data-phone')) return /^05\d{9}$/.test(A.phoneDigits(input)) ? '' : MSG.phone;
    if (input.type === 'email') return EMAIL.test(v) ? '' : MSG.email;
    if (input.hasAttribute('data-taxno')) return /^\d{10,11}$/.test(v) ? '' : MSG.taxno;
    if (input.minLength > 0 && v.length < input.minLength) return MSG.min(label, input.minLength);
    return '';
  }

  function validate(input) {
    var msg = active(input) ? check(input) : '';
    if (msg) A.setError(input, msg); else A.clearError(input);
    return !msg;
  }

  function alertBox(el, icon, html) {
    el.hidden = false;
    /* canlı bölge görünür olduktan sonra dolsun ki ekran okuyucu okusun */
    requestAnimationFrame(function () { el.innerHTML = '<i class="fa-solid ' + icon + '" aria-hidden="true"></i><span>' + html + '</span>'; });
  }

  $$('form[data-form]').forEach(function (form) {
    var inputs = $$('.input, .check__input[required]', form);
    var errBox = $('[data-form-error]', form), infoBox = $('[data-form-info]', form);
    var tried = false;

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
      } else if (form.getAttribute('data-form') === 'giris' || form.getAttribute('data-form') === 'kayit') {
        /* prototip oturumu (K3/K14): gerçek doğrulama yok; yerel oturum açılır, hesaba ya da geldiği sayfaya döner */
        var f = new FormData(form), kayit = form.getAttribute('data-form') === 'kayit';
        var v = function (n) { return String(f.get(n) || '').trim(); };
        A.session.set(kayit
          ? { ad: v('ad'), soyad: v('soyad'), email: v('email'), telefon: v('telefon'), tip: v('registerType') || 'bireysel',
              firma: v('firmaadi'), vergiDairesi: v('vergidairesi'), vergiNo: v('tcvergino'), faaliyet: v('faaliyetalani'), il: v('sehir'), ilce: v('ilce') }
          : { telefon: v('telefon') || ($('[type="tel"]', form) || {}).value || '' });
        var btn = $('[type="submit"]', form); A.busy(btn, true, kayit ? 'Hesap oluşturuluyor' : 'Giriş yapılıyor');
        var geri = A.param('geri');
        setTimeout(function () { location.href = geri && /^[a-z-]+\.html/.test(geri) ? geri : A.URLS.hesap(); }, 600);
      } else {
        alertBox(infoBox, 'fa-circle-info', MSG.proto);
        infoBox.scrollIntoView({ block: 'center', behavior: A.reduceMotion ? 'auto' : 'smooth' });
      }
    });

    /* İlk gönderimden sonra canlı: çıkışta doğrula, yazarken hatalıysa yeniden bak */
    function live(input, always) {
      if (!tried) return;
      if (always || input.getAttribute('aria-invalid') === 'true') validate(input);
      if (input.id) $$('[data-match="' + input.id + '"]', form).forEach(function (m) { if (m.value || m.getAttribute('aria-invalid') === 'true') validate(m); });
    }
    inputs.forEach(function (input) {
      input.addEventListener('blur', function () { live(input, true); });
    });
    /* document üzerinde: main.js'in telefon maskesinden sonra çalışsın, değer biçimlenmiş olsun */
    document.addEventListener('input', function (e) {
      var input = e.target;
      if (!form.contains(input) || inputs.indexOf(input) < 0 || input.type === 'checkbox' || input.tagName === 'SELECT') return;
      /* Vergi / TC: yalnız rakam, en çok 11 hane (Azem maxlength 11) */
      if (input.hasAttribute('data-taxno')) {
        var d = input.value.replace(/\D/g, '').slice(0, 11);
        if (d !== input.value) input.value = d;
      }
      live(input, false);
    });
    form.addEventListener('change', function (e) {
      var input = e.target;
      if (inputs.indexOf(input) > -1 && (input.type === 'checkbox' || input.tagName === 'SELECT')) live(input, true);
    });

    /* Üyelik tipi (Azem usertype): Ticari'de [data-ticari] alanlar görünür ve zorunlu */
    var types = $$('input[name="registerType"]', form);
    function setType() {
      var ticari = types.some(function (r) { return r.checked && r.value === '2'; });
      $$('[data-ticari-group]', form).forEach(function (g) { g.hidden = !ticari; });
      $$('[data-ticari]', form).forEach(function (f) {
        var input = $('.input', f);
        input.required = ticari;
        if (!ticari) { f.hidden = true; A.clearError(input); return; }
        if (!f.hidden) return;
        f.hidden = false;
        f.classList.remove('is-in'); f.classList.add('reveal');
        void f.offsetWidth;
        f.classList.add('is-in');
      });
    }
    types.forEach(function (r) { r.addEventListener('change', setType); });
    if (types.length) setType();
  });

  /* Giriş | Kayıt sekmeleri: aynı kart, adres korunur (giris-yap.html ↔ kayit-ol.html) */
  var auth = $('[data-auth]');
  if (auth) {
    var PAGES = { giris: { url: 'giris-yap.html', title: 'Giriş', crumb: 'Giriş' }, kayit: { url: 'kayit-ol.html', title: 'Kayıt Ol', crumb: 'Kayıt Ol' } };
    var tabs = $$('[data-auth-tab]', auth), crumb = $('[data-auth-crumb]');
    A.initTabs(auth);
    function sync() {
      var on = tabs.filter(function (b) { return b.getAttribute('aria-selected') === 'true'; })[0];
      if (!on) return;
      var pg = PAGES[on.getAttribute('data-auth-tab')];
      if (location.pathname.split('/').pop() !== pg.url) history.replaceState(null, '', pg.url + location.hash);
      document.title = pg.title + ' | Azem Toptan';
      if (crumb) crumb.textContent = pg.crumb;
    }
    /* tıklama ve ok tuşlarıyla seçim aynı yoldan: aria-selected değişimini izle */
    new MutationObserver(sync).observe(auth, { attributes: true, attributeFilter: ['aria-selected'], subtree: true });
    $$('[data-auth-goto]', auth).forEach(function (a) {
      a.addEventListener('click', function (e) {
        var b = $('[data-auth-tab="' + a.getAttribute('data-auth-goto') + '"]', auth);
        if (!b) return;
        e.preventDefault();
        b.click(); b.focus();
        auth.scrollIntoView({ block: 'start', behavior: A.reduceMotion ? 'auto' : 'smooth' });
      });
    });
  }

  A.ready();
})();
