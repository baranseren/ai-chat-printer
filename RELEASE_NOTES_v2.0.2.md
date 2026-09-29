# AI Chat Printer v2.0.2 — Sürüm Notları

> Yayın tarihi: 30.08.2026
> Manifest: V3

AI Chat Printer v2.0.2, dört sitedeki tüm mevcut yazdırma, PDF, seçim, dışa aktarma, görsel ve artifact özelliklerini korur; extension update ve service worker yaşam döngüsünde görülen bağlantı kopmalarını otomatik kurtarır.

## Bağlantı Dayanıklılığı

- Eklenti kurulduğunda veya güncellendiğinde açık Gemini, Claude, ChatGPT ve Grok sekmeleri otomatik tazelenir; eski content script bağlamı kullanıcıdan F5 istenmeden yenilenir.
- Service worker mesajları 0, 150 ve 500 ms aralıklarıyla en fazla üç kez denenir.
- Sayfa içi düğmede extension context gerçekten kaybolmuşsa sekme bir kez otomatik yenilenir ve yazdırma işlemi kaldığı yerden sürer.
- Popup ve `Ctrl+Shift+P`, eski content script'i algıladığında sekmeyi otomatik yeniler, `baglantiSaglik` yanıtını bekler ve aynı komutu yeniden gönderir.
- Aynı UUID açma isteği `chrome.storage.session` eşlemesiyle 30 saniye boyunca idempotenttir; yanıt kaybı mükerrer önizleme sekmesi oluşturmaz.
- Otomatik kurtarma tek denemelidir; gerçek background arızasında reload döngüsü oluşmaz ve gerçek hata bağlantı etiketi altında gizlenmez.

## İzin Sınırı

- API izinleri değişmedi: `activeTab`, `storage`, `clipboardWrite`.
- Dört dar `host_permissions`, yalnız `gemini.google.com`, `claude.ai`, `chatgpt.com` ve `grok.com` açık sekmelerini install/update sonrasında tazelemek için eklendi.
- `tabs`, `history`, `cookies`, `downloads`, `scripting` ve joker host izni yoktur.

## Kabul Kanıtı

- Tam kaynak kabulü: 18/18 başarılı.
- Gerçek MV3 kabulünde dört content script → `storage.local` → service worker → önizleme zinciri geçti.
- Gerçek hedef sekme reload'u sonrasında content script düğmesi geri geldi.
- Geçici service worker kopması üçüncü denemede kurtarıldı.
- Popup eski bağlamı bir reload ile kurtardı.
- Aynı UUID için iki açma çağrısı tek sekme kimliği döndürdü.
- UTF-8/mojibake, XSS, raster resim, Markdown, seçim, dışa aktarım, paralel oturum, Claude artifact ve ChatGPT Çalışma/Canvas kabulleri gerilemesiz geçti.
