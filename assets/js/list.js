/* ==========================================================================
   Ürün liste sayfası — kategori.html?k=<slug> · arama sonucu ?q=<sorgu> · marka listesi ?marka=<marka slug>
   Yapışık blok (A101): ana kategori çubuğu + alt kategori chip'leri (Azem "Kategoriler" filtresi:
   çoklu seçim, anında uygulanır). Yan sütun: Fiyat, Markalar, Filtrele. Sıralama, görünüm seçici,
   48'lik sayfalama (2, 3 ve 4 kolona tam bölünür: tam sayfada son satır her kırılımda dolu). Durum URL'de: geri tuşu ve yenileme çalışır.
   ========================================================================== */
(function () {
  'use strict';

  var A = window.AZEM_APP;
  var $ = A.$, $$ = A.$$, esc = A.esc;

  var PER_PAGE = 48;   /* Azem'de 50; 2/3/4 kolonda son satır dolu kalsın diye 48 */
  var SORTS = { '': 'En Çok Satanlar', artan: 'Ucuzadan Pahalıya', azalan: 'Pahalıdan Ucuza' };
  var VIEWS = { '3': 'p-grid', '4': 'p-grid p-grid--4', liste: 'p-grid p-grid--list' };
  var SEP = '<li class="breadcrumb__sep" aria-hidden="true"><i class="fa-solid fa-chevron-right"></i></li>';
  var EMPTY = '<div class="empty empty--box"><i class="fa-solid fa-box-open" aria-hidden="true"></i><p class="empty__title">Bu kategoride ürün bulunamadı !</p></div>';

  var cat = A.catBySlug[A.param('k') || ''] || null;
  /* arama sonucu: kategori.html?q=… (header arama kutusu ve öneri panelinin "tüm sonuçlar" bağlantısı) */
  var query = cat ? '' : (A.param('q') || '').trim();
  /* marka listesi: kategori.html?marka=<slug> (markalar.html). ?k= / ?q= varken marka= marka filtresidir (id listesi). */
  var brand = null;
  if (!cat && !query) A.DB.brands.forEach(function (b) { if (b.slug === A.param('marka')) brand = b; });
  var brandName = brand ? window.AZEM_FORMAT.productName(brand.name) : '';
  var items = cat ? cat.items.filter(function (id) { return A.products[id]; })
    : brand ? A.DB.products.filter(function (p) { return p.brand === brand.id && A.sellable(p); }).map(function (p) { return p.id; })
    : A.searchProducts(query).map(function (p) { return p.id; });   /* birebir yoksa Türkçe harfsiz yakın sonuç (main.js) */
  var heading = cat ? cat.name : brand ? brandName : (query ? '“' + query + '”' : 'Ürün Listesi');
  if (query) EMPTY = EMPTY.replace('Bu kategoride ürün bulunamadı !', 'Ürün bulunamadı').replace('</p>', '</p><p class="empty__text">Farklı bir kelimeyle aramayı deneyin.</p>');
  if (brand) EMPTY = EMPTY.replace('Bu kategoride ürün bulunamadı !', 'Bu markada ürün bulunamadı !');

  var drawer = $('#filterDrawer'), main = $('[data-main]'), results = $('[data-results]');

  /* ---------- Üst bant ---------- */
  var path = cat ? A.catPath(cat) : [];
  $('[data-crumbs]').innerHTML = '<li><a href="index.html">Ana Sayfa</a></li>' + SEP +
    path.slice(0, -1).map(function (c) { return '<li><a href="' + A.catUrl(c) + '">' + esc(c.name) + '</a></li>' + SEP; }).join('') +
    (brand ? '<li><a href="' + A.URLS.markalar + '">Markalar</a></li>' + SEP : '') +
    '<li aria-current="page">' + esc(cat ? cat.name : brand ? brandName : (query ? 'Arama' : 'Ürün Listesi')) + '</li>';
  $('[data-title]').textContent = heading;
  document.title = heading + ' | Azem Toptan';
  if (query) $$('input[name="q"]').forEach(function (i) { i.value = query; });

  /* ---------- Ana kategori çubuğu: Azem'in 7 ana kategorisi, etkin olan tintli ---------- */
  var topCat = path[0] || null;
  $('[data-cat-bar]').innerHTML = A.DB.cats.filter(function (c) { return c.level === 1; }).map(function (c) {
    var dc = (A.D.categories || []).filter(function (x) { return A.slug(x.name) === A.slug(c.name); })[0];
    return '<a class="cat-bar__item" href="' + A.catUrl(c) + '"' + (topCat && topCat.id === c.id ? ' aria-current="true"' : '') + '>' +
      A.catImg(dc, 'cat-bar__img') + esc(c.name) + '</a>';
  }).join('');
  /* hücreler sığıyorsa oklar gizlenir ve hücreler satırı doldurur; sığmıyorsa oklar + kaydırma */
  var catBar = $('.cat-bar'), catRail = $('[data-cat-bar]');
  function fitCatBar() {
    catBar.classList.add('is-fit');
    if (catRail.scrollWidth > catRail.clientWidth + 1) catBar.classList.remove('is-fit');
  }
  fitCatBar();
  window.addEventListener('resize', fitCatBar);
  /* etkin hücre çubukta ortalanır (A101) */
  var activeCell = $('.cat-bar__item[aria-current="true"]');
  if (activeCell) {
    var rail = activeCell.parentElement;
    rail.scrollLeft = activeCell.offsetLeft - rail.offsetLeft - (rail.clientWidth - activeCell.offsetWidth) / 2;
  }

  /* Kategori yok ya da ürünü yok: filtre ve araç çubuğu anlamsız, yalnız boş durum */
  if (!items.length) {
    if (cat || brand) $('[data-total]').textContent = '(0 Ürün)';
    drawer.remove();
    $('[data-drawer-scrim="filterDrawer"]').remove();
    $('[data-toolbar]').remove();
    $('[data-layout]').classList.remove('with-aside');
    /* sonuçsuz arama: boş durum + Azem'in 7 ana kategorisi (öneri panelindeki "Popüler Kategoriler") */
    results.innerHTML = EMPTY + (query
      ? '<div class="stack stack--sm"><h2 class="sec-head__title">Popüler Kategoriler</h2><div class="chip-row">' +
        (A.D.categories || []).map(function (c) { return '<a class="chip" href="' + A.catUrl(A.catByName(c.name, null)) + '">' + esc(c.name) + '</a>'; }).join('') +
        '</div></div>'
      : '');
    A.ready();
    return;
  }
  $('[data-total]').textContent = '(' + items.length + ' Ürün)';
  /* arama sonucu satırı (A101): ""q" araması için N sonuç listelendi"; chip ve filtreyle güncellenir */
  var resultLine = null;
  if (query) {
    $('[data-toolbar]').insertAdjacentHTML('beforebegin', '<p class="result-line" data-result-line></p>');
    resultLine = $('[data-result-line]');
  }

  /* ---------- Filtre seçenekleri ---------- */
  /* Kategoriler: geçerli kategori + alt ağacı, ağaç sırasıyla, yalnız ürünü olanlar */
  function subtree(c) {
    var out = [c];
    A.DB.cats.forEach(function (x) { if (x.parent === c.id) out = out.concat(subtree(x)); });
    return out;
  }
  var catOpts = cat ? subtree(cat).filter(function (c) { return c.items.length; }) : [null];

  /* Markalar: kategorideki ürünlerin markaları, ada göre; sayı kategori içindeki ürün sayısı */
  var brandCount = {};
  items.forEach(function (id) {
    var b = A.products[id].brand;
    if (b != null && A.brands[b]) brandCount[b] = (brandCount[b] || 0) + 1;
  });
  /* marka listesinde tek marka var: marka filtresi gösterilmez */
  var brandOpts = brand ? [] : Object.keys(brandCount).map(function (id) { return A.brands[id]; })
    .sort(function (a, b) { return a.name.localeCompare(b.name, 'tr'); });

  var prices = items.map(function (id) { return A.products[id].price; });
  var pMin = Math.floor(Math.min.apply(null, prices)), pMax = Math.ceil(Math.max.apply(null, prices));

  function checkRow(name, value, label, count) {
    return '<label class="check"><input class="check__input" type="checkbox" name="' + name + '" value="' + value + '">' +
      '<span class="check__box"><i class="fa-solid fa-check" aria-hidden="true"></i></span>' +
      '<span class="check__label">' + esc(label) + '</span><span class="check__count">(' + count + ')</span></label>';
  }
  /* Alt kategori chip'leri "Ad (sayı)": geçerli kategorinin ürünü olan alt kategorileri (ağaç sırası).
     Arama ve marka listesinde (A101 arama sonucu): sonuçların 2. seviye kategorileri, sayı sonuç içindeki ürün sayısı,
     çoktan aza; tek kategoriye düşen sonuçta chip satırı gösterilmez. */
  var chipOpts = catOpts.slice(1), chipCount = {};
  if (cat) chipOpts.forEach(function (c) { chipCount[c.id] = c.items.length; });
  else {
    items.forEach(function (id) {
      (A.products[id].cats || []).forEach(function (cid) {
        var c = A.cats[cid];
        if (c && c.level === 2 && c.items.indexOf(id) > -1) chipCount[cid] = (chipCount[cid] || 0) + 1;
      });
    });
    chipOpts = A.DB.cats.filter(function (c) { return chipCount[c.id]; })
      .sort(function (a, b) { return chipCount[b.id] - chipCount[a.id]; });   /* sort kararlı: eşitler ağaç sırasında */
    if (chipOpts.length < 2) chipOpts = [];
  }
  var chipBar = $('[data-chips]'), brandList = $('[data-brand-list]');
  chipBar.innerHTML = chipOpts.map(function (c) {
    return '<button class="chip" type="button" data-kat="' + c.id + '" aria-pressed="false">' + esc(c.name) +
      ' <span class="chip__count">(' + chipCount[c.id] + ')</span></button>';
  }).join('');
  if (!cat) chipBar.setAttribute('aria-label', 'Sonuç kategorileri');
  if (brandOpts.length) brandList.innerHTML = brandOpts.map(function (b) { return checkRow('marka', b.id, b.name, brandCount[b.id]); }).join('');
  else $('[data-group="marka"]').remove();
  var range = A.initRange($('[data-range]'), { min: pMin, max: pMax, from: pMin, to: pMax, format: A.formatPrice });

  /* Kapalı akordeonun içeriği klavyeyle odaklanmasın */
  function syncPanels() {
    $$('.acc__btn', drawer).forEach(function (b) {
      var p = document.getElementById(b.getAttribute('aria-controls'));
      if (p) p.inert = b.getAttribute('aria-expanded') !== 'true';
    });
  }
  document.addEventListener('click', function (e) { if (e.target.closest('.acc__btn') && drawer.contains(e.target)) syncPanels(); });

  /* ---------- Durum <-> URL ---------- */
  /* ?k=…|q=…|marka=<slug> &kat=ids&marka=ids (marka listesinde yok)&fiyat=min-max&sira=artan|azalan&gorunum=3|4|liste&s=2 ; geçersiz değerler yok sayılır */
  function idList(raw, allowed) {
    var want = String(raw || '').split(',');
    return allowed.filter(function (id) { return want.indexOf(String(id)) > -1; });
  }
  function readState() {
    var q = new URLSearchParams(location.search);
    var st = {
      kat: idList(q.get('kat'), chipOpts.map(function (c) { return c.id; })),
      marka: idList(q.get('marka'), brandOpts.map(function (b) { return b.id; })),
      fiyat: null,
      sira: SORTS.hasOwnProperty(q.get('sira')) ? q.get('sira') : '',
      gorunum: VIEWS.hasOwnProperty(q.get('gorunum')) ? q.get('gorunum') : '4',
      s: 1
    };
    var f = /^(\d+)-(\d+)$/.exec(q.get('fiyat') || '');
    if (f) {
      var lo = +f[1], hi = +f[2];
      if (lo >= pMin && hi <= pMax && lo <= hi && (lo > pMin || hi < pMax)) st.fiyat = [lo, hi];
    }
    var s = /^\d+$/.test(q.get('s') || '') ? +q.get('s') : 1;
    if (s >= 1 && s <= pageCount(filtered(st).length)) st.s = s;
    return st;
  }
  function toUrl(st) {
    var q = cat ? 'k=' + encodeURIComponent(cat.slug) : brand ? 'marka=' + encodeURIComponent(brand.slug) : 'q=' + encodeURIComponent(query);
    if (st.kat.length) q += '&kat=' + st.kat.join(',');
    if (st.marka.length) q += '&marka=' + st.marka.join(',');
    if (st.fiyat) q += '&fiyat=' + st.fiyat[0] + '-' + st.fiyat[1];
    if (st.sira) q += '&sira=' + st.sira;
    if (st.gorunum !== '4') q += '&gorunum=' + st.gorunum;
    if (st.s > 1) q += '&s=' + st.s;
    return location.pathname + '?' + q;
  }
  function copy(st, patch) {
    var out = {};
    Object.keys(st).forEach(function (k) { out[k] = st[k]; });
    Object.keys(patch || {}).forEach(function (k) { out[k] = patch[k]; });
    return out;
  }

  /* ---------- Sonuç kümesi ---------- */
  function filtered(st) {
    var pool = null;
    if (st.kat.length) {
      pool = {};
      st.kat.forEach(function (id) { A.cats[id].items.forEach(function (pid) { pool[pid] = true; }); });
    }
    var list = items.filter(function (id) {
      var p = A.products[id];
      if (pool && !pool[id]) return false;
      if (st.marka.length && st.marka.indexOf(p.brand) < 0) return false;
      if (st.fiyat && (p.price < st.fiyat[0] || p.price > st.fiyat[1])) return false;
      return true;
    });
    /* En Çok Satanlar = Azem kaynak sırası; fiyat sıralamasında eşitler bu sırayı korur */
    if (st.sira) {
      var dir = st.sira === 'artan' ? 1 : -1, order = {};
      items.forEach(function (id, i) { order[id] = i; });
      list.sort(function (a, b) { return dir * (A.products[a].price - A.products[b].price) || order[a] - order[b]; });
    }
    return list;
  }
  function pageCount(n) { return Math.max(1, Math.ceil(n / PER_PAGE)); }

  /* ---------- Basım ---------- */
  var state = readState();

  function pageNums(cur, total) {
    var out = [], i;
    if (total <= 7) { for (i = 1; i <= total; i++) out.push(i); return out; }
    if (cur <= 4) return [1, 2, 3, 4, 5, 0, total];
    if (cur >= total - 3) { out = [1, 0]; for (i = total - 4; i <= total; i++) out.push(i); return out; }
    return [1, 0, cur - 1, cur, cur + 1, 0, total];
  }
  function pageBtn(n, html, label, disabled) {
    if (disabled) return '<a class="pagination__btn" role="link" aria-disabled="true" aria-label="' + label + '">' + html + '</a>';
    return '<a class="pagination__btn" href="' + esc(toUrl(copy(state, { s: n }))) + '" data-goto="' + n + '"' +
      (label ? ' aria-label="' + label + '"' : '') + (n === state.s && !label ? ' aria-current="page"' : '') + '>' + html + '</a>';
  }
  function pagination(total) {
    if (total < 2) return '';
    return '<nav class="pagination" aria-label="Sayfalar">' +
      pageBtn(state.s - 1, '<i class="fa-solid fa-chevron-left" aria-hidden="true"></i>', 'Önceki sayfa', state.s === 1) +
      pageNums(state.s, total).map(function (n) { return n ? pageBtn(n, n) : '<span class="pagination__gap" aria-hidden="true">…</span>'; }).join('') +
      pageBtn(state.s + 1, '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>', 'Sonraki sayfa', state.s === total) +
      '</nav>';
  }

  /* İlk açılış ve her filtre/sıralama/sayfa değişimi: kısa süre iskelet kartlar (A101), sonra gerçek kartlar.
     Hızlı art arda değişimde yalnız son durum basılır. */
  var SKELETON_MS = A.reduceMotion ? 0 : 320, skeletonTimer = 0;
  function renderList() {
    var list = filtered(state), total = pageCount(list.length);
    if (state.s > total) state.s = 1;
    var page = list.slice((state.s - 1) * PER_PAGE, state.s * PER_PAGE);
    clearTimeout(skeletonTimer);
    if (list.length && SKELETON_MS) {
      results.setAttribute('aria-busy', 'true');
      results.innerHTML = '<div class="' + VIEWS[state.gorunum] + '">' + A.skeletonCards(Math.min(page.length, 12)) + '</div>';
      skeletonTimer = setTimeout(function () { paint(list, page, total); }, SKELETON_MS);
    } else paint(list, page, total);
    syncControls(list, total);
  }
  function paint(list, page, total) {
    results.removeAttribute('aria-busy');
    results.innerHTML = list.length
      ? '<div class="' + VIEWS[state.gorunum] + '">' + page.map(function (id) { return A.productCard(A.products[id]); }).join('') + '</div>' + pagination(total)
      : EMPTY;
    A.watchImages(results);
    A.syncFooter();
  }
  function syncControls(list, total) {
    $('[data-status]').textContent = list.length + ' ürün' + (total > 1 ? ', sayfa ' + state.s + ' / ' + total : '');
    if (resultLine) resultLine.innerHTML = '“' + esc(query) + '” araması için <strong>' + list.length + ' sonuç</strong> listelendi';

    $('[data-sort-label]').textContent = SORTS[state.sira];
    $$('[data-sort]').forEach(function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-sort') === state.sira)); });
    $$('[data-view]').forEach(function (r) { r.checked = r.value === state.gorunum; });
    A.syncFooter();
  }

  function chip(key, label) {
    return '<button class="chip chip--removable" type="button" data-remove="' + key + '" aria-label="' + esc(label) + ' filtresini kaldır">' +
      esc(label) + ' <i class="fa-solid fa-xmark" aria-hidden="true"></i></button>';
  }
  function renderFilters() {
    $$('[data-kat]', chipBar).forEach(function (b) { b.setAttribute('aria-pressed', String(state.kat.indexOf(+b.getAttribute('data-kat')) > -1)); });
    $$('input[name="marka"]', drawer).forEach(function (i) { i.checked = state.marka.indexOf(+i.value) > -1; });
    var f = state.fiyat || [pMin, pMax];
    range.set(f[0], f[1]);
    var chipsHtml =
      state.kat.map(function (id) { return chip('kat:' + id, A.cats[id].name); }).join('') +
      state.marka.map(function (id) { return chip('marka:' + id, A.brands[id].name); }).join('') +
      (state.fiyat ? chip('fiyat', A.formatPrice(state.fiyat[0]) + ' – ' + A.formatPrice(state.fiyat[1])) : '');
    /* yan sütundaki ve (≤1024) araç çubuğunun altındaki satır aynı chip'leri taşır */
    $$('[data-applied]').forEach(function (box) { box.innerHTML = chipsHtml; });
    var n = state.kat.length + state.marka.length + (state.fiyat ? 1 : 0);
    $$('[data-filter-count]').forEach(function (c) { c.textContent = n; c.setAttribute('data-count', n); });
  }
  function render() { renderFilters(); renderList(); }

  /* Durumu uygula: URL'ye yaz (aynıysa geçmişe yeni kayıt açma), yeniden bas */
  function commit(next, scroll) {
    state = next;
    var url = toUrl(state);
    if (url !== location.pathname + location.search) history.pushState(null, '', url);
    render();
    if (scroll === 'always' || (scroll && main.getBoundingClientRect().top < hdrH())) scrollToList();
  }
  /* header + yapışık blok (kategori çubuğu kompakt hâlde) */
  function hdrH() { var cs = getComputedStyle(document.documentElement); return (parseFloat(cs.getPropertyValue('--hdr-h')) || 0) + (parseFloat(cs.getPropertyValue('--sticky-h')) || 0); }
  function scrollToList() {
    var top = main.getBoundingClientRect().top + window.scrollY - hdrH() - (A.mqDesktop.matches ? 24 : 0);
    window.scrollTo({ top: Math.max(0, top), behavior: A.reduceMotion ? 'auto' : 'smooth' });
  }

  /* ---------- Etkileşimler ---------- */
  function closeIfDrawer() { if (drawer.classList.contains('is-open')) A.closeDrawer(drawer); }
  function formState() {
    var r = range.get();
    return copy(state, {
      kat: state.kat,
      marka: $$('input[name="marka"]', drawer).filter(function (i) { return i.checked; }).map(function (i) { return +i.value; }),
      fiyat: (r[0] > pMin || r[1] < pMax) ? r : null,
      s: 1
    });
  }
  /* Filtrele: Azem semantiği, seçimler bu düğmeye kadar bekler */
  $('[data-apply]').addEventListener('click', function () { closeIfDrawer(); commit(formState(), true); });
  $('[data-clear]').addEventListener('click', function () {
    commit(copy(state, { kat: [], marka: [], fiyat: null, s: 1 }), true);
  });
  $$('[data-applied]').forEach(function (box) { box.addEventListener('click', function (e) {
    var b = e.target.closest('[data-remove]');
    if (!b) return;
    var key = b.getAttribute('data-remove').split(':'), idx = $$('[data-remove]', this).indexOf(b);
    var patch = { s: 1 };
    if (key[0] === 'fiyat') patch.fiyat = null;
    else patch[key[0]] = state[key[0]].filter(function (id) { return id !== +key[1]; });
    commit(copy(state, patch), true);
    var chips = $$('[data-remove]', this);
    (chips[Math.min(idx, chips.length - 1)] || $('[data-clear]')).focus();
  }); });

  /* Alt kategori chip'i: anında uygulanır (A101), çoklu seçim (Azem), sayfa 1'e döner */
  chipBar.addEventListener('click', function (e) {
    var b = e.target.closest('[data-kat]');
    if (!b) return;
    var id = +b.getAttribute('data-kat'), on = state.kat.indexOf(id) > -1;
    commit(copy(state, { kat: on ? state.kat.filter(function (x) { return x !== id; }) : state.kat.concat(id), s: 1 }), true);
  });

  /* Sıralama: anında uygulanır, sayfa 1'e döner */
  $$('[data-sort]').forEach(function (b) {
    b.addEventListener('click', function () {
      A.closeMenus();
      $('[data-menu-btn]', b.closest('[data-menu]')).focus();
      commit(copy(state, { sira: b.getAttribute('data-sort'), s: 1 }), true);
    });
  });
  $$('[data-view]').forEach(function (r) {
    r.addEventListener('change', function () { if (r.checked) commit(copy(state, { gorunum: r.value })); });
  });
  results.addEventListener('click', function (e) {
    var a = e.target.closest('[data-goto]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    commit(copy(state, { s: +a.getAttribute('data-goto') }), 'always');
  });
  window.addEventListener('popstate', function () { state = readState(); render(); });

  /* Masaüstünde yan sütun, mobilde modal drawer: rol ve açık kalan perde genişlikle eşlenir */
  function syncDrawerRole() {
    if (A.mqDesktop.matches) { closeIfDrawer(); drawer.removeAttribute('role'); drawer.removeAttribute('aria-modal'); }
    else { drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-modal', 'true'); }
  }
  A.mqDesktop.addEventListener('change', syncDrawerRole);
  syncDrawerRole();

  /* İlk açılış: uygulanmış filtresi olan grup açık gelir; URL normalize edilir */
  if (state.fiyat) $('[aria-controls="fFiyat"]').setAttribute('aria-expanded', 'true');
  syncPanels();
  history.replaceState(null, '', toUrl(state));
  render();
  A.ready();
})();
