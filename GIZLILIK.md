# AI Chat Printer — Gizlilik Bildirimi

> Sürüm: 2.0.3 · Son güncelleme: 24.09.2026

AI Chat Printer, Gemini, Claude, ChatGPT ve Grok konuşmalarını kullanıcının kendi tarayıcısında yazdırılabilir ve dışa aktarılabilir belgelere dönüştüren bir Chrome eklentisidir.

## Veri İşleme İlkesi

- Konuşma içeriği yalnız kullanıcının açık olan destekli AI sekmesinden, kullanıcının yazdırma veya dışa aktarma eylemi üzerine okunur.
- Konuşmalar, görseller, Claude artifact içerikleri, ChatGPT Çalışma/Canvas içerikleri, başlıklar ve dışa aktarılan dosyalar herhangi bir sunucuya gönderilmez.
- Uzak ölçüm, reklam, kullanıcı profilleme, analiz servisi, hata izleme servisi veya üçüncü taraf veri aktarımı yoktur.
- Eklenti; kullanıcı adı, parola, ödeme bilgisi veya tarama geçmişi toplamaz.

## Yerel Saklama ve Silme

| Saklama alanı | Saklanan veri | Yaşam süresi |
|---|---|---|
| `chrome.storage.sync` | Yazı boyutu, kâğıt, yön, kenar boşluğu, kod, belge imzası, bağlantı adresi ve otomatik yazdırma tercihleri | Kullanıcı ayarı değişene veya eklenti verileri temizlenene kadar |
| `chrome.storage.local` | Yazdırma önizlemesine taşınan, benzersiz UUID ile ayrılmış geçici konuşma paketi | Küçük paket okununca silinir; büyük paket F5 için önizleme sekmesi kapanana kadar tutulur. Sahipsiz paketler en geç 6 saat sonra temizlenir |
| `chrome.storage.session` | Aynı açma isteğinde mükerrer sekmeyi önleyen UUID→önizleme sekmesi kimliği eşlemesi; konuşma içeriği içermez | Yalnız tarayıcı oturumu boyunca |
| `sessionStorage` | Küçük konuşmaların F5 yedeği veya desteklenen sayfada tek seferlik otomatik bağlantı kurtarma işareti | Yalnız o sekmenin yaşamı boyunca; sekme kapanınca tarayıcı tarafından silinir |

## İzinlerin Kullanımı

- `activeTab`: Yalnız kullanıcının etkin Gemini, Claude, ChatGPT veya Grok konuşma sekmesiyle iletişim kurmak için kullanılır.
- `storage`: Kullanıcı ayarlarını ve geçici yerel yazdırma paketini saklamak için kullanılır.
- `unlimitedStorage`: 10 MB'ı aşan konuşma paketlerini yalnız tarayıcının yerel deposunda tutarak yazdırmak için kullanılır; sunucuya aktarım sağlamaz.
- `clipboardWrite`: Kullanıcı “Markdown” veya “Metin” düğmesine bastığında seçili konuşmayı panoya kopyalamak için kullanılır.
- `host_permissions`: Yalnız `gemini.google.com`, `claude.ai`, `chatgpt.com` ve `grok.com` için tanımlıdır. Kurulum/güncelleme sonrasında açık desteklenen sekmeleri yeni content script ile otomatik tazelemek amacıyla kullanılır; başka alan adlarına erişim vermez.

Eklenti `tabs`, `history`, `cookies`, `downloads`, `scripting` veya joker/geniş kapsamlı host izni istemez; tarama geçmişi toplamaz.

## Ağ Erişimi

Eklentinin kendi sunucusu veya API uç noktası yoktur. Görseller mümkün olduğunda sayfada zaten yüklenmiş içerikten yerel olarak dönüştürülür. HTTPS görseli için gereken tarayıcı isteği, yalnız kullanıcının seçtiği konuşma belgesini oluşturmak amacıyla yapılır; kimlik bilgileri gönderilmez ve referer aktarılmaz.

## Kullanıcı Denetimi

Kullanıcı önizlemede mesajları tek tek veya role göre seçebilir, kod bloklarını ve bağlantı adreslerini kapatabilir, belge imzasını kaldırabilir ve çıktı üretmeden sekmeyi kapatabilir. Kapatma işlemi o önizlemeye ait geçici paketi de temizler.

## Değişiklikler

Bu bildirimin veri işleme kapsamını değiştiren bir sürüm yayımlanırsa sürüm numarası ve son güncelleme tarihi bu dosyada yenilenir.

v2.0.3, ChatGPT streaming false-positive denetimini düzeltir; izin, konuşma verisi, ağ erişimi ve üçüncü taraf aktarım sözleşmesi değişmemiştir.

24.09.2026: Uzun konuşmalar için `unlimitedStorage` izni eklendi; büyük paketler F5 boyunca yerel depoda tutulur ve önizleme kapanınca temizlenir. Üçüncü taraf aktarımı yoktur.
