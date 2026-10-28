# Azem Toptan prototipi

## Görsel kuralları
- Statik prototiplerde görseller image-set() ile 1x + 2x verilir; logo ve ikonlar mümkünse SVG/Font Awesome. Sadece 1x üretmek Retina ekranda bulanıklık yapar.
- Görsel asla kaynak boyutundan büyük gösterilmez (upscale yasak). Alan büyükse daha büyük kaynak bulunur ya da alan küçültülür; her turda 'render > kaynak' taraması yapılır.
- Kategori görselleri (kategori çubuğu, kategori grid'i, header/mega menü, mobil drawer, arama paneli ve story şeridi) tek ve tutarlı bir ikon setidir: Font Awesome Solid, aynı stil ve kalınlık, set karıştırılmaz. Her kategorinin ikonu catalog.js'te (ico); eşleşmeyen kategori, kategori tipinin varsayılan ikonunu (ana kategorinin ikonu) alır. Story'de "Bugünün Fırsatı" şimşek ikonu ve FIRSAT rozetiyle kalır.

## Radius kuralı
- Radius iki ölçülü, tokenlardan yönetilir: büyük kapsayıcılar (form kartları, marka paneli, modal, hero, banner, drawer, açılır panel, büyük paneller) 16px (`--radius-lg`); buton, input, chip, küçük kart ve küçük öğeler 8px (`--radius`); rozet ve onay kutusu 4px (`--radius-badge`); story dairesi, sayaç rozeti ve radyo düğmesi yuvarlak.

## Çalışma kuralları
- Revize turlarında yalnız değişen sayfalar 390 ve 1440'ta (yerleşim değiştiyse 768) hızlı kontrol edilir; 6 genişlik tam tarama yalnız yayından önce bir kez yapılır.
- Bot koruması veya site engelleri aşılmaz; engellenen kaynaktan vazgeçilir.

## Durum ve sıradaki adım (28.10.2026)
- **Yapılan 7 sayfa:** ana sayfa (`index.html`), liste (`kategori.html`, arama sonucu dahil), ürün detayı (`urun.html`), yasal metinler (`sayfa.html`), giriş (`giris-yap.html`), kayıt (`kayit-ol.html`), şifremi unuttum (`sifremi-unuttum.html`).
- **Canlı:** https://gaviaworks-dev.github.io/azemtoptan/ (GitHub Pages, `main` dalı).
- **Açık konular:** Azem'den beklenen içerik ve görseller `referans/azem-eksikler.md`'de (ör. boş yasal metinler, 0,00 ₺ ürünler, 404 görseller); harici kaynaktan bulunan ürün görselleri ve "görsel bekleniyor" olan 2 ürün `referans/urun-gorsel-kaynaklari.md`'de. `referans/` repoya girmez, yerelde durur.
- **Sıradaki faz (patron onayından sonra):** önce site haritası çıkarılır. Sonra ortak kanon: popup/modal, onay pencereleri, hata sayfaları, boş durumlar. Ardından tüm akışlar: sepet, ödeme, adres, profil, siparişler, favoriler, arama, kurumsal sayfalar.
