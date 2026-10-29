/* Azem Toptan kurumsal ve yardım sayfaları — azemtoptan.com (30.10.2026):
   /hakkimizda, /iletisim, /sss, /sayfa/azem-kart, /sayfa/musteri-hizmetleri, /sayfa/nasil-kolay-iade-yaparim.
   Metin aynen; yalnız markup temizlendi (<b> → <strong>, kalın virgül kelime sınırına).
   empty: Azem'de içerik yok (Azem Kart: yalnız "Çok yakında..", Müşteri Hizmetleri: boş, İade: sayfa yok, ana sayfaya yönleniyor).
   link: sayfa değil, A.URLS'teki adrese giden menü öğesi.
   SSS kategorileri Azem'de boş kutu; soruların kategoriye dağılımı prototip önerisi (cat). */
window.AZEM_KURUMSAL = {
 "groups": [
  "Kurumsal",
  "Yardım"
 ],
 /* azemtoptan.com/iletisim "Bizimle İletişime Geçin" kartları */
 "contact": [
  { "key": "email", "label": "E-Posta", "value": "iletisim@azemtoptan.com", "href": "mailto:iletisim@azemtoptan.com", "icon": "fa-solid fa-envelope" },
  { "key": "kurumsal", "label": "Kurumsal E-Posta", "value": "siparis@azemtoptan.com", "href": "mailto:siparis@azemtoptan.com", "icon": "fa-solid fa-envelope-open-text" },
  { "key": "telefon", "label": "Telefon", "value": "0212 706 2936", "href": "tel:+902127062936", "icon": "fa-solid fa-phone" },
  { "key": "whatsapp", "label": "WhatsApp", "value": "0212 706 2936", "href": "https://wa.me/902127062936", "icon": "fa-brands fa-whatsapp", "external": true },
  { "key": "magaza", "label": "Mağaza", "value": "Kurtuluş Cad. Şişli/İstanbul", "href": "https://www.google.com/maps/search/?api=1&query=Azem+Toptan+G%C4%B1da+Kurtulu%C5%9F+Cad.+%C5%9Ei%C5%9Fli", "icon": "fa-solid fa-location-dot", "external": true },
  { "key": "depo", "label": "Depo", "value": "Şişli İstanbul", "icon": "fa-solid fa-warehouse" }
 ],
 "docs": [
  {
   "slug": "hakkimizda",
   "title": "Hakkımızda",
   "group": "Kurumsal",
   "icon": "fa-solid fa-building",
   "blocks": [
    { "t": "h2", "text": "Azem Toptan Gıda" },
    { "t": "p", "html": "<strong>Azem Toptan</strong>, 2016 yılında faaliyete geçerek <strong>Avrupa</strong> bölgesinde müşterilerine hizmet veren lider bir toptan gıda şirketidir. Tek şubesiyle faaliyet gösteren <strong>Azem Toptan</strong>, geniş ürün yelpazesi ve uygun fiyat politikasıyla müşterilerine kaliteli alışveriş deneyimi sunmaktadır." },
    { "t": "p", "html": "Gıda kategorisindeki zengin çeşitliliğiyle dikkat çeken <strong>Azem Toptan</strong>, müşterilerine taze, sağlıklı ve lezzetli gıda seçenekleri sunma konusunda iddialıdır. Şirket, kısa sürede bölgedeki müşterilerin gözdesi olmuş, güçlü tedarik ağı sayesinde kaliteli ürünleri ekonomik fiyatlarla sunmayı başarmıştır." },
    { "t": "p", "html": "<strong>Azem Toptan</strong>, sadece gıda alanında değil, aynı zamanda temizlik konusunda da güvenilir çözümler sunmanın yanı sıra, kırtasiye malzemeleri ile ofislerden okullara kadar geniş bir kullanıcı kitlesine hitap etmektedir." },
    { "t": "p", "html": "Müşterilere sağlıklı alternatifler sunma amacı güden <strong>Azem Toptan</strong>, gıda ürünlerinin yanı sıra sıcak içecek çeşitleri ve soğuk içecek seçenekleriyle de dikkat çekmektedir." },
    { "t": "p", "html": "<strong>Azem Toptan</strong>, müşteri memnuniyetini öncelikli tutarak, kaliteli ürünleri uygun fiyatlarla müşterilerine ulaştırmayı ilke edinmiştir. Profesyonel ve müşteri odaklı hizmet anlayışıyla şirket, bölgesinde güvenilir bir iş ortağı olma yolunda emin adımlarla ilerlemektedir." },
    { "t": "p", "html": "Güçlü tedarik zinciri ve kaliteli hizmet anlayışıyla <strong>Azem Toptan</strong>, toptan alışverişin vazgeçilmez adresi olma hedefine kararlılıkla ilerlemekte, geniş ürün yelpazesi ve müşteri memnuniyetiyle bölgesinde tercih edilen bir marka olma başarısını sürdürmektedir." },
    /* Azem'de "Ne Yapıyoruz ?" üst başlıklı sayaç şeridi */
    { "t": "h2", "text": "Müşterilerimiz Bize Güveniyor" },
    { "t": "ul", "items": [
     "<strong>10 İş Zamanı:</strong> Firma olarak tüketiciye en uygun ve en kaliteli ürünleri ihraç ediyoruz.",
     "<strong>80 K+ Ürün Satışları:</strong> Siz değerli müşterilere en kaliteli ürünler ile hizmet vermekten gurur duyuyoruz.",
     "<strong>90% Memnun Müşteriler:</strong> Müşterilerimizin isteklerini onların talepleri doğrultusunda karşılıyoruz."
    ] }
   ],
   "source": "azemtoptan.com/hakkimizda"
  },
  { "title": "Markalar", "group": "Kurumsal", "icon": "fa-solid fa-tags", "link": "markalar" },
  { "title": "Kampanyalar", "group": "Kurumsal", "icon": "fa-solid fa-percent", "link": "kampanyalar" },
  {
   "slug": "azem-kart",
   "title": "Azem Kart",
   "group": "Kurumsal",
   "icon": "fa-solid fa-credit-card",
   "empty": true,
   "source": "azemtoptan.com/sayfa/azem-kart"
  },
  {
   "slug": "iletisim",
   "title": "İletişim",
   "group": "Kurumsal",
   "icon": "fa-solid fa-envelope",
   "type": "iletisim",
   "heading": "Bizimle İletişime Geçin",
   /* Azem'de bağlantı Üyelik Sözleşmesi'ne gidiyor; prototipte KVKK aydınlatma metni */
   "consent": { "link": "Kişisel Verilerimin Kullanılması ve İşlemesi", "rest": " hakkında Aydınlatma Metnini Okudum ve Onaylıyorum" },
   "source": "azemtoptan.com/iletisim"
  },
  {
   "slug": "musteri-hizmetleri",
   "title": "Müşteri Hizmetleri",
   "group": "Yardım",
   "icon": "fa-solid fa-headset",
   "empty": true,
   "contact": ["telefon", "whatsapp", "email", "magaza"],
   "source": "azemtoptan.com/sayfa/musteri-hizmetleri"
  },
  {
   "slug": "sss",
   "title": "Sıkça Sorulan Sorular",
   "label": "S.S.S.",
   "group": "Yardım",
   "icon": "fa-solid fa-circle-question",
   "type": "sss",
   "lead": "Aklınıza takılan tüm soru ve cevapları sizin için derledik",
   "cats": [
    { "id": "baslarken", "name": "Başlarken" },
    { "id": "satis", "name": "Satış Soruları" },
    { "id": "fiyat", "name": "Fiyat ve Planlama" },
    { "id": "destek", "name": "Destek Hattı", "contact": ["telefon", "whatsapp", "email"] }
   ],
   "items": [
    { "cat": "baslarken", "q": "Web sitenizden kredi kartı ile alışveriş yapmak güvenli mi?", "a": "Alışverişlerinizde sunulan güvenlik önlemleri ile ilgili detaylı bilgi için Güvenlik sayfamızı inceleyebilirsiniz." },
    { "cat": "satis", "q": "Sipariş kodum nerede yazıyor? Siparişimi nasıl takip edebilirim? Siparişimin faturasına nasıl ulaşabilirim?", "a": "Siparişiniz ile ilgili bilgiler, bildirdiğiniz e-mail adresine otomatik olarak gönderilmektedir. Lütfen önemsiz postaları kontrol ediniz. Burada da bulunmaması durumunda bizimle iletişime geçebilirsiniz. Siparişinizin durumu da aynı şekilde bildirdiğiniz e-mail adresine otomatik olarak gönderilmektedir. Faturanız ise size kargonuz ile birlikte gönderilecektir." },
    { "cat": "satis", "q": "Özel günler için paketin içine not ekleyebilir miyiz?", "a": "Sipariş sonrasında mail yolu ile eklemek istediğiniz notu ilettiğinizde not eklememiz mümkündür." },
    { "cat": "fiyat", "q": "Ödeme Seçenekleriniz Nelerdir?", "a": "Web sitemiz üzerinden Kredi Kartı, Havale / EFT veya Kapıda Ödeme ile ödeme yapmanız mümkündür. Ödeme Seçenekleri sayfamızdan konuyla ilgili detaylı bilgilere erişmeniz mümkündür." },
    { "cat": "fiyat", "q": "Kredi kartımı kullanmak istemiyorum, nasıl ödeme yapabilirim?", "a": "Kredi kartınızı kullanmak istemiyorsanız, Kapıda Ödeme seçeneğini seçebilir, bankanızdan veya tüm ATM’lerden Havale veya EFT ile ödeme yapabilirsiniz. Ödeme Seçenekleri sayfamızdan konuyla ilgili detaylı bilgilere erişmeniz mümkündür." },
    { "cat": "satis", "q": "Adres değişikliği yapabilir miyim?", "a": "Siparişinizin durumu “Kargo Bekleniyor” olana kadar istemiş olduğunuz değişikliği İletişim bölümünden sipariş kodunuz ile birlikte bize bildirerek yapabilirsiniz." }
   ],
   "more": { "pre": "Daha fazla ayrıntı için ", "link": "Destek Ekibimiz İle İrtibata Geçin" },
   "source": "azemtoptan.com/sss"
  },
  {
   "slug": "iade",
   "title": "Nasıl Kolay İade Yaparım?",
   "group": "Yardım",
   "icon": "fa-solid fa-rotate-left",
   "empty": true,
   "action": { "label": "İptal ve İade Koşulları", "link": "yasal", "arg": "iptal-ve-iade" },
   "source": "azemtoptan.com/sayfa/nasil-kolay-iade-yaparim (sayfa yok)"
  },
  { "title": "İptal ve İade", "group": "Yardım", "icon": "fa-solid fa-file-lines", "link": "yasal", "arg": "iptal-ve-iade" }
 ]
};
