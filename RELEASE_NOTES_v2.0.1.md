# AI Chat Printer v2.0.1 — Sürüm Notları

> Yayın tarihi: 15.08.2026
> Minimum Chrome: 114
> Manifest: V3

AI Chat Printer v2.0.1, v2.0.0'daki tüm yazdırma, PDF, seçim ve dışa aktarma özelliklerini korur; ChatGPT'nin güncel Çalışma dosyaları ile eski Canvas belgelerini konuşma çıktısına dâhil eder.

## ChatGPT Çalışma ve Canvas

- Güncel dosya atıfları `data-file-citation-primary-file-id` ve `data-file-citation-group-identity` üzerinden benzersizleştirilir.
- Dosya kartı açıldığında `screen-threadFlyOut` paneli doğrulanır ve çapraz-origin önizleme yerine Kod/Kaynak sekmesi seçilir.
- CodeMirror `.cm-content > code` kaynağı iki ardışık kararlı ölçümden sonra alınır.
- Eski Canvas ve artefakt panelleri `canvas-content`, ProseMirror, contenteditable, textarea ve kod bloğu geri dönüşleriyle desteklenir.
- Aynı dosyanın metin atfı ile kart düğmesi tek artefakt olarak işlenir.
- Bir dosya çıkarılamazsa başlık ve tür korunur; hata diğer mesajları veya dosyaları durdurmaz.
- Eklentinin açtığı panel işlem sonunda kapatılır. Kullanıcının önceden açık dosya paneli ve seçili sekmesi korunur.

## Uyumluluk ve Gizlilik

- Yeni izin eklenmedi: `activeTab`, `storage`, `clipboardWrite`.
- Çalışma/Canvas içeriği yalnız açık ChatGPT sekmesinde ve kullanıcı eylemi üzerine yerel olarak okunur.
- Harici API, ölçüm, reklam, remote code veya üçüncü taraf veri aktarımı yoktur.
- Gemini, Claude ve Grok çıkarıcılarının mevcut davranışı değiştirilmedi.

## Kabul Kanıtı

- Gerçek MV3 service worker ve dört content script zinciri Playwright Chromium'da doğrulandı.
- ChatGPT güncel Çalışma fixture'ı: dosya atfı → panel → Kod sekmesi → gecikmeli CodeMirror kaynak → içerik → doğrulanmış kapanış.
- ChatGPT eski Canvas fixture'ı: Canvas düğmesi → eski panel → belge içeriği → doğrulanmış kapanış.
- Uzun konuşma scroll-süpürmesi, orijinal kaydırma konumu ve `language-js` sınıfı korunarak doğrulandı.
