# AI Chat Printer — Gizlilik Bildirimi

> Sürüm: 2.0.0 · Son güncelleme: 15.08.2026

AI Chat Printer, Gemini, Claude, ChatGPT ve Grok konuşmalarını kullanıcının kendi tarayıcısında yazdırılabilir ve dışa aktarılabilir belgelere dönüştüren bir Chrome eklentisidir.

## Veri İşleme İlkesi

- Konuşma içeriği yalnız kullanıcının açık olan destekli AI sekmesinden, kullanıcının yazdırma veya dışa aktarma eylemi üzerine okunur.
- Konuşmalar, görseller, artifact içerikleri, başlıklar ve dışa aktarılan dosyalar herhangi bir sunucuya gönderilmez.
- Uzak ölçüm, reklam, kullanıcı profilleme, analiz servisi, hata izleme servisi veya üçüncü taraf veri aktarımı yoktur.
- Eklenti; kullanıcı adı, parola, ödeme bilgisi veya tarama geçmişi toplamaz.

## Yerel Saklama ve Silme

| Saklama alanı | Saklanan veri | Yaşam süresi |
|---|---|---|
| `chrome.storage.sync` | Yazı boyutu, kâğıt, yön, kenar boşluğu, kod, belge imzası, bağlantı adresi ve otomatik yazdırma tercihleri | Kullanıcı ayarı değişene veya eklenti verileri temizlenene kadar |
| `chrome.storage.local` | Yazdırma önizlemesine taşınan, benzersiz UUID ile ayrılmış geçici konuşma paketi | Önizleme tarafından okunur okunmaz silinir; sahipsiz paketler en geç 6 saat sonra temizlenir |
| `sessionStorage` | Açık önizleme sekmesinin F5 yenileme yedeği | Yalnız o sekmenin yaşamı boyunca; sekme kapanınca tarayıcı tarafından silinir |

## İzinlerin Kullanımı

- `activeTab`: Yalnız kullanıcının etkin Gemini, Claude, ChatGPT veya Grok konuşma sekmesiyle iletişim kurmak için kullanılır.
- `storage`: Kullanıcı ayarlarını ve tek kullanımlık yerel yazdırma paketini saklamak için kullanılır.
- `clipboardWrite`: Kullanıcı “Markdown” veya “Metin” düğmesine bastığında seçili konuşmayı panoya kopyalamak için kullanılır.

Eklenti `tabs`, `history`, `cookies`, `downloads`, `scripting` veya geniş kapsamlı host izni istemez.

## Ağ Erişimi

Eklentinin kendi sunucusu veya API uç noktası yoktur. Görseller mümkün olduğunda sayfada zaten yüklenmiş içerikten yerel olarak dönüştürülür. HTTPS görseli için gereken tarayıcı isteği, yalnız kullanıcının seçtiği konuşma belgesini oluşturmak amacıyla yapılır; kimlik bilgileri gönderilmez ve referer aktarılmaz.

## Kullanıcı Denetimi

Kullanıcı önizlemede mesajları tek tek veya role göre seçebilir, kod bloklarını ve bağlantı adreslerini kapatabilir, belge imzasını kaldırabilir ve çıktı üretmeden sekmeyi kapatabilir. Kapatma işlemi o önizlemeye ait geçici paketi de temizler.

## Değişiklikler

Bu bildirimin veri işleme kapsamını değiştiren bir sürüm yayımlanırsa sürüm numarası ve son güncelleme tarihi bu dosyada yenilenir.
