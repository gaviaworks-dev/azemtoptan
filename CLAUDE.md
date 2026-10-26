# Azem Toptan prototipi

## Görsel kuralları
- Statik prototiplerde görseller image-set() ile 1x + 2x verilir; logo ve ikonlar mümkünse SVG/Font Awesome. Sadece 1x üretmek Retina ekranda bulanıklık yapar.
- Görsel asla kaynak boyutundan büyük gösterilmez (upscale yasak). Alan büyükse daha büyük kaynak bulunur ya da alan küçültülür; her turda 'render > kaynak' taraması yapılır.
- Kategori görselleri (kategori çubuğu, kategori grid'i, header menüsü, mega menü, mobil drawer) story'deki gibi saydam kesilmiş gerçek ürün fotoğrafıdır; çizgi ikon kullanılmaz. Kural prototip için de geçerli.

## Radius kuralı
- Radius standardı 8px (kareye yakın), küçük öğeler 4px; yuvarlak sadece story ve sayaç rozeti.

## Çalışma kuralları
- Revize turlarında yalnız değişen sayfalar 390 ve 1440'ta (yerleşim değiştiyse 768) hızlı kontrol edilir; 6 genişlik tam tarama yalnız yayından önce bir kez yapılır.
- Bot koruması veya site engelleri aşılmaz; engellenen kaynaktan vazgeçilir.
