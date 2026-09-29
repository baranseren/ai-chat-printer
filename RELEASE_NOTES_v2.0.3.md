# AI Chat Printer v2.0.3 — Sürüm Notları

> Yayın tarihi: 29.09.2026
> Manifest: V3

AI Chat Printer v2.0.3, GitHub'daki son yayın olan v2.0.0'dan beri eklenen Çalışma/Canvas çıkarımını, güncelleme sonrası bağlantı kurtarmasını ve güncel ChatGPT konuşma/görsel desteğini bir araya getirir.

## Başlıca Değişiklikler

- `data-assistant-content-started`, tamamlanmış ChatGPT mesajlarında kalıcı kaldığı için artık streaming sinyali sayılmaz.
- `data-message-complete` bulunmaması da tek başına streaming kanıtı değildir.
- Yalnız görünür Durdur/Stop düğmesi, görünür `.result-streaming` veya `[data-message-status="in_progress"]` yazdırmayı geçici olarak engeller.
- Gizli ve DOM'da kalmış eski göstergeler `offsetParent` denetimiyle reddedilir.
- ChatGPT'nin `main [data-chatgpt-search-unit-key]` mesaj yapısı, eski `li[data-message-role]` ve `conversation-turn` yapılarıyla birlikte desteklenir.
- Kullanıcı ve asistan görselleri, metinle DOM sırasını koruyarak aktarılır; dekoratif kopyalar ayıklanır. SVG/Mermaid görselleri ve gecikmeli yüklenen resimler işlenir.
- `unlimitedStorage`, büyük konuşmaların yerel depoda 10 MB sınırına takılmasını önler. Büyük paketler F5 için saklanır ve önizleme sekmesi kapandığında temizlenir.
- Eklenti güncellendiğinde açık desteklenen sekmeler tazelenir; popup, kısayol ve sayfa içi yazdırma kopan mesaj kanalını kontrollü biçimde yeniden kurar.
- ChatGPT Çalışma dosyaları ile eski Canvas belgelerinin içeriği açılıp çıkarılır; önceki panel durumu korunur.

## Kabul Kanıtı

- Kaynak kabulü 23/23 başarılıdır; dağıtım ZIP'i ayrıca 8/8 çalışma zamanı kabulünden geçmiştir.
- Normal tarayıcı testinde kalıcı content-started false, gerçek in-progress true doğrulandı.
- Gerçek MV3 ChatGPT fixture'ının tamamlanmış son mesajı content-started taşıdığı ve complete taşımadığı hâlde altı mesajın tamamı önizlemeye aktarıldı.
- Gemini, Claude, Grok, bağlantı kurtarma, idempotent önizleme, artifact, Canvas, görsel, Markdown, güvenlik ve dışa aktarım kabulleri gerilemesiz geçti.
