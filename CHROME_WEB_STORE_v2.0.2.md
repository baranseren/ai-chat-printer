# AI Chat Printer v2.0.2 — Chrome Web Store İçeriği

> Hazırlanma tarihi: 30.08.2026
> Kategori: Üretkenlik
> Varsayılan dil: Türkçe
> Ek dil: İngilizce

## Mağaza Başlığı

`AI Chat Printer`

## Türkçe Özet — 114/132 Karakter

`Gemini, Claude, ChatGPT ve Grok konuşmalarını tek tıkla yazdır veya PDF olarak kaydet. Hızlı, güvenli ve ücretsiz.`

## English Summary — 111/132 Characters

`Print or save as PDF your Gemini, Claude, ChatGPT and Grok conversations with one click. Fast, secure and free.`

## Türkçe Ayrıntılı Açıklama

AI Chat Printer; Gemini, Claude, ChatGPT ve Grok konuşmalarını tek tıkla düzenli bir baskı belgesine dönüştürür. Konuşmanızı önizleyebilir, istediğiniz mesajları seçebilir, yazdırabilir, PDF olarak kaydedebilir veya Markdown, metin, HTML ve JSON biçimlerinde dışa aktarabilirsiniz.

Öne çıkan özellikler:

- Gemini, Claude, ChatGPT ve Grok desteği
- Temiz, kâğıt merkezli Baskı Stüdyosu önizlemesi
- A4, A3 ve Letter kâğıt; dikey/yatay yön ve kenar boşluğu seçenekleri
- 11, 13, 15 ve 17 px yazı boyutları
- Mesaj bazlı ve rol bazlı seçim: Yalnız Kullanıcı veya Yalnız AI
- Kod blokları, Claude artifact içerikleri, ChatGPT Çalışma/Canvas dosyaları ve konuşma görselleri
- Markdown, düz metin, bağımsız HTML ve JSON dışa aktarımı
- Ctrl+Shift+P; macOS'ta Command+Shift+P kısayolu
- Eşzamanlı önizlemelerde UUID izolasyonu ve F5 dayanıklılığı
- Eklenti güncellemesi veya geçici service worker kopmasında otomatik bağlantı kurtarma

Gizlilik önce gelir: konuşma içeriği yalnız kullanıcının açık eylemiyle, kendi tarayıcısında işlenir. Konuşmalar üçüncü taraf sunucuya gönderilmez. Reklam, analiz, profil oluşturma, uzak ölçüm ve remote code yoktur. Geçici konuşma paketi önizleme tarafından okununca silinir; kullanıcı tercihleri Chrome'un yerel/senkronize depolama alanında tutulur.

## English Detailed Description

AI Chat Printer turns Gemini, Claude, ChatGPT and Grok conversations into clean, print-ready documents with one click. Preview the conversation, select the messages you need, print or save as PDF, and export to Markdown, plain text, standalone HTML or structured JSON.

Key features:

- Gemini, Claude, ChatGPT and Grok support
- A clean, paper-focused Print Studio preview
- A4, A3 and Letter paper sizes with portrait, landscape and margin controls
- 11, 13, 15 and 17 px text sizes
- Per-message and role-based selection: User only or AI only
- Code blocks, Claude artifacts, ChatGPT Work/Canvas files and conversation images
- Markdown, plain text, standalone HTML and JSON export
- Ctrl+Shift+P shortcut; Command+Shift+P on macOS
- Isolated concurrent preview sessions and refresh-safe previews
- Automatic recovery after extension updates or transient service-worker disconnections

Privacy comes first: conversation content is processed locally in the browser only after an explicit user action. Conversations are not sent to third-party servers. There is no advertising, analytics, profiling, remote telemetry or remote code. Temporary conversation data is deleted after the preview reads it; user preferences remain in Chrome storage.

## Sürüm Notu Alanı

v2.0.2, açık desteklenen sekmeleri extension update sonrasında otomatik tazeler; service worker mesajlarını kontrollü yeniden dener; popup, sayfa içi düğme ve klavye kısayolunda bağlantıyı kullanıcıdan F5 istemeden yeniden kurar. Aynı UUID için önizleme açılışı idempotenttir ve mükerrer sekme oluşturmaz.

## Tek Amaç Beyanı

Kullanıcının açıkça seçtiği Gemini, Claude, ChatGPT veya Grok konuşmasını kendi tarayıcısında baskı, PDF ve taşınabilir belge çıktısına dönüştürmek.

## İzin Gerekçeleri

| İzin / erişim | Web Store gerekçesi |
|---|---|
| `activeTab` | Kullanıcı popup düğmesine veya klavye kısayoluna bastığında yalnız etkin destekli AI sekmesini doğrulamak ve o sekmedeki content script ile iletişim kurmak için kullanılır. |
| `storage` | Kullanıcı tercihlerini `chrome.storage.sync`, tek kullanımlık konuşma paketini `chrome.storage.local`, kısa ömürlü idempotent önizleme sekmesi eşlemesini `chrome.storage.session` içinde tutmak için kullanılır. |
| `clipboardWrite` | Kullanıcı Markdown veya Metin düğmesine açıkça bastığında seçili konuşmayı panoya yazmak için kullanılır. |
| `https://gemini.google.com/*` | Gemini konuşmasını yerel çıkarmak ve extension update sonrasında açık Gemini sekmesini yeni content script ile otomatik tazelemek için gereken dar site erişimidir. |
| `https://claude.ai/*` | Claude konuşma/artifact içeriğini yerel çıkarmak ve extension update sonrasında açık Claude sekmesini otomatik tazelemek için gereken dar site erişimidir. |
| `https://chatgpt.com/*` | ChatGPT konuşma/Çalışma/Canvas içeriğini yerel çıkarmak ve extension update sonrasında açık ChatGPT sekmesini otomatik tazelemek için gereken dar site erişimidir. |
| `https://grok.com/*` | Grok konuşmasını yerel çıkarmak ve extension update sonrasında açık Grok sekmesini otomatik tazelemek için gereken dar site erişimidir. |

## Remote Code Beyanı

`Hayır, eklenti remote code kullanmıyor.`

Tüm JavaScript, CSS, HTML, locale ve ikon dosyaları yüklenen ZIP paketinin içindedir. `eval`, `new Function`, uzak script, WebAssembly veya haricî CDN çalıştırılmaz.

## Veri Kullanımı Beyanı

Eklenti aşağıdaki verileri yalnız cihaz üzerinde, açık kullanıcı eylemiyle işler:

- Website content: seçilen konuşmanın metni, biçimlendirmesi, görselleri ve artifact içeriği.
- User-generated content: kullanıcının AI konuşmasına yazdığı mesajlar.
- Personal communications: konuşma içeriği bu sınıfa giriyorsa yalnız seçilen çıktı için yerel ve geçici işleme.
- Web browsing activity: yalnız açık sekmenin desteklenen dört hostname'den biri olup olmadığını belirlemek ve update sonrasında bu sekmeyi tazelemek için geçici URL/hostname kontrolü; tarama geçmişi oluşturulmaz veya saklanmaz.

Eklenti kişisel kimlik, sağlık, finans, ödeme, konum, kimlik doğrulama bilgisi veya tarama geçmişi toplamaz. İşlenen içerik satılmaz, reklama aktarılmaz, profil oluşturmada kullanılmaz, insan incelemesine açılmaz ve üçüncü tarafa gönderilmez. Kullanım, mağaza sayfasında açıklanan tek amaçla sınırlıdır.

## Gizlilik ve Destek Adresleri

- Gizlilik politikası: `https://github.com/baranseren/ai-chat-printer/blob/master/GIZLILIK.md`
- Proje ve destek: `https://github.com/baranseren/ai-chat-printer`

## Görsel Yükleme Sırası

1. `store_assets/v2.0.0/01-baski-studyosu-1280x800.png`
2. `store_assets/v2.0.0/02-mesaj-secimi-1280x800.png`
3. `store_assets/v2.0.0/03-popup-ve-onizleme-1280x800.png`
4. `store_assets/v2.0.0/04-dar-ekran-640x400.png`
5. `store_assets/v2.0.0/tanitim-kucuk-440x280.png`
6. `store_assets/v2.0.0/tanitim-marquee-1400x560.png`
