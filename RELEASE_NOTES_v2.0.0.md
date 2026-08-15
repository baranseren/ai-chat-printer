# AI Chat Printer v2.0.0 — Sürüm Notları

> Yayın tarihi: 15.08.2026
> Minimum Chrome: 114
> Manifest: V3

AI Chat Printer v2.0.0, Gemini, Claude, ChatGPT ve Grok konuşmalarını yazdırma, PDF'e dönüştürme ve taşınabilir dosyalara aktarma yeteneklerini korurken arayüzü, veri yaşam döngüsünü, güvenliği ve dört-site DOM dayanıklılığını baştan sona yeniler.

## Öne Çıkan Yenilikler

- Popup ve yazdırma önizlemesi, kâğıt merkezli “Baskı Stüdyosu” tasarım sistemiyle yeniden kuruldu.
- A4, A3 ve Letter kâğıt; dikey/yatay yön; dar/normal/geniş kenar; 11/13/15/17 px yazı seçenekleri eklendi.
- Mesajlar tek tek veya “Yalnız Kullanıcı / Yalnız AI” araçlarıyla seçilebiliyor; boş seçim yazdırma ve dışa aktarma işlemlerini güvenli biçimde kilitliyor.
- Markdown, düz metin, bağımsız HTML ve yapılandırılmış JSON çıktıları aynı seçili konuşma sözleşmesini kullanıyor.
- Belge imzası, kod blokları ve yazdırılan bağlantı adresleri önizlemeden canlı yönetilebiliyor.
- Eklenti ikonu, Web Store güvenli alanı ve Baskı Stüdyosu görsel diliyle yeniden çizildi.

## Güvenilirlik ve Gizlilik

- Her yazdırma isteği benzersiz UUID oturumunda taşınıyor; eşzamanlı önizlemeler birbirinin konuşmasını okuyamıyor.
- Geçici konuşma paketi önizleme tarafından okunur okunmaz siliniyor; sahipsiz paketler 6 saat TTL ile temizleniyor.
- HTML sanitizer yalnız güvenli etiket, bağlantı ve raster görselleri kabul ediyor; `language-*` sınıfları yalnız `PRE`/`CODE` üzerinde korunuyor.
- Uzak görsel isteği kimlik bilgisi ve referrer taşımıyor; seçili resimlerin hazır olma bariyeri tamamlanmadan yazdırma başlamıyor.
- Konuşma verisi üçüncü taraf sunucuya gönderilmiyor; uzak ölçüm, reklam, profil oluşturma ve remote code kullanılmıyor.

## Site Dayanıklılığı

- ChatGPT 2026 “wm” DOM'u ile eski turn DOM'u birlikte destekleniyor; sanallaştırılmış uzun konuşmalar scroll-süpürmesiyle eksiksiz toplanıyor.
- Claude'un yeni tek-ağaç konuşma akışı ve tıkla-aç artifact viewer yaşam döngüsü destekleniyor; panel her sonuç yolunda kapatılıyor.
- Grok kesin `data-testid` rol seçicilerini önce kullanıyor ve özel konuşma içeriğini loglamıyor.
- Gemini kullanıcı erişilebilirlik ön eklerini temizliyor; cevap-altı Markdown ve metin indirme yetenekleri korunuyor.
- Dört sitede SPA gezinmesi, streaming kilidi, buton yeniden enjeksiyonu ve klavye kısayolu davranışı korunuyor.

## Uyumluluk ve Yükseltme

- Yeni izin eklenmedi: `activeTab`, `storage`, `clipboardWrite`.
- `scripting`, `tabs`, `history`, `cookies`, `downloads` ve geniş kapsamlı host izni kullanılmıyor.
- Kullanıcı ayarları `chrome.storage.sync` içinde doğrulanarak korunuyor; eski geçici global konuşma anahtarları temizleniyor.
- Güncelleme sonrasında açık Gemini, Claude, ChatGPT ve Grok sekmelerinin yeni content script'i alması için sayfa yenilemesi gerekir.

## Kabul Kanıtı

- `python -u .\tests\acceptance_tests.py` sonucu: **14/14 başarılı**.
- Statik sözdizimi, UTF-8/mojibake, manifest, XSS/sanitizer, resim izolasyonu, Markdown fence, seçim, dışa aktarım, canlı ayar, F5/paralel oturum, popup erişilebilirliği, gerçek MV3 service worker ve dört gerçek content-script zinciri birlikte doğrulandı.
- Paketlenmiş ZIP ayrıca açılarak gerçek MV3 çalışma zincirinde yeniden sınanır; SHA-256 değeri `dist/SHA256SUMS-v2.0.0.txt` içinde teslim edilir.
