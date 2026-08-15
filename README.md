# AI Chat Printer

Gemini, Claude, ChatGPT ve Grok konuşmalarını temiz bir belgeye dönüştüren, yazdıran ve Markdown, metin, HTML veya JSON olarak dışa aktaran Manifest V3 Chrome eklentisi.

![Sürüm](https://img.shields.io/badge/sürüm-2.0.0-c54a3d)
![Manifest](https://img.shields.io/badge/manifest-V3-172630)
![Chrome](https://img.shields.io/badge/Chrome-114%2B-2d6691)
![Lisans](https://img.shields.io/badge/lisans-MIT-2f7d5d)

## Türkçe

### Temel Yetenekler

- Gemini, Claude, ChatGPT ve Grok konuşmalarını sayfa içi yazdır düğmesiyle veya `Ctrl+Shift+P` kısayoluyla çıkarır.
- Tarayıcının yazdırma penceresi üzerinden fiziksel yazıcı ve PDF çıktısı üretir.
- Markdown ve düz metni panoya kopyalar.
- Seçili konuşmayı `.md`, `.txt`, bağımsız `.html` veya yapılandırılmış `.json` dosyası olarak indirir.
- Gemini yanıtlarının altında tek soru-cevap için hızlı `↓ MD` ve `↓ TXT` düğmeleri sunar.
- Claude artifact içeriklerini açar, yüklenmesini kararlılık ölçümüyle bekler, çıkarır ve paneli doğrulanmış biçimde kapatır.
- Konuşma görsellerini yerel olarak işler; raster veri URI’lerini ve güvenli HTTPS kaynaklarını destekler.
- ChatGPT’nin eski ve 2026 “wm” DOM yapılarını birlikte destekler; uzun ve sanallaştırılmış konuşmaları son mesaja kadar kaydırarak toplar.
- Grok’un güncel `data-testid` yapısını önceleyen, eski arayüzleri de koruyan çok katmanlı rol ve içerik tespiti kullanır.

### Baskı Stüdyosu

v2.0.0 ile popup ve önizleme arayüzleri baştan tasarlandı:

- Kâğıt boyutu: A4, A3 veya Letter.
- Yön: dikey veya yatay.
- Kenar boşluğu: dar, normal veya geniş.
- Yazı boyutu: 11, 13, 15 veya 17 piksel.
- Kod bloklarını, belge imzasını ve yazılı bağlantı adreslerini ayrı ayrı açıp kapatma.
- Otomatik yazdırma tercihi.
- Mesajları tek tek, topluca veya “Yalnız Kullanıcı / Yalnız AI” kısayollarıyla seçme.
- Hiç mesaj seçilmediğinde yazdırma ve dışa aktarma eylemlerini güvenli biçimde kilitleme.
- Dar ekranlarda kaydırma gerektirmeyen, satıra sarılan denetimler.
- Klavye odağı, `aria-live` durumları ve azaltılmış hareket tercihi desteği.

### Güvenilirlik ve Güvenlik

- Her yazdırma isteği `crypto.randomUUID()` ile ayrılmış `aiChatPrinterOturum:<UUID>` paketini kullanır; eşzamanlı önizlemeler birbirinin verisini okuyamaz.
- Paket önizleme tarafından okunur okunmaz silinir; sahipsiz paketler service worker tarafından en geç 6 saat sonra temizlenir.
- Sekmeye özel `sessionStorage` yedeği, önizleme F5 ile yenilendiğinde veriyi geri getirir.
- Site denetimi metin aramasıyla değil, HTTPS ve tam hostname eşleşmesiyle yapılır.
- HTML, izinli etiket listesiyle yeni bir DOM olarak kurulur; script, olay attribute’u, SVG veri URI’si ve güvensiz URL şemaları çıktıya taşınmaz.
- Kaynak sitenin rastgele CSS sınıfları çıktıya geçirilmez; yalnız `PRE`/`CODE` üzerindeki `language-*` kod dili sınıfları korunur.
- Uzaktaki görseller kimlik bilgisi ve referer göndermeden alınır; event handler’lar ezilmez ve tüm zamanlayıcılar temizlenir.
- İzinler yalnız `activeTab`, `storage` ve `clipboardWrite` ile sınırlıdır.
- Konuşmalar üçüncü taraf sunucuya gönderilmez; ayrıntılar [Gizlilik Bildirimi](GIZLILIK.md) içindedir.

### Kurulum

1. Depoyu indirin veya klonlayın.
2. Chrome’da `chrome://extensions` adresini açın.
3. Sağ üstten “Geliştirici modu”nu etkinleştirin.
4. “Paketlenmemiş öğe yükle” düğmesine basın.
5. Bu projenin kök klasörünü seçin.

Minimum desteklenen sürüm Chrome 114’tür. Derleme, paket yöneticisi veya çalışma zamanı bağımlılığı yoktur.

### Kullanım

1. Desteklenen sitelerden birinde konuşmayı açın.
2. Sayfadaki yazıcı simgesine basın, popup’taki “Konuşmayı Önizle” düğmesini kullanın veya `Ctrl+Shift+P` kısayoluna basın.
3. Baskı Stüdyosu’nda sayfa ve içerik tercihlerini düzenleyin.
4. Mesaj seçimi gerekiyorsa konuşma bloklarını veya rol kısayollarını kullanın.
5. “Yazdır” ile yazıcı/PDF çıktısı alın ya da dışa aktarma düğmelerinden birini kullanın.

## English

AI Chat Printer is a dependency-free Manifest V3 Chrome extension that turns Gemini, Claude, ChatGPT, and Grok conversations into clean printable documents.

### Highlights

- Print or save conversations as PDF.
- Copy Markdown or plain text.
- Download selected messages as Markdown, text, standalone HTML, or JSON.
- Extract Gemini images, Claude artifacts, current and legacy ChatGPT message trees, and current or fallback Grok layouts.
- Configure paper size, orientation, margins, font size, code blocks, footer, printed link addresses, and automatic printing.
- Select individual messages, all messages, user messages only, or AI messages only.
- Keep concurrent print sessions isolated with UUID-scoped local storage and tab-scoped refresh recovery.
- Process conversation data locally without analytics or an external server.

### Installation

1. Download or clone the repository.
2. Open `chrome://extensions` in Chrome.
3. Enable Developer mode.
4. Choose “Load unpacked”.
5. Select the repository root.

## Desteklenen Siteler / Supported Sites

| Site | Hostname | İçerik betiği | Öne çıkan uyumluluk |
|---|---|---|---|
| Google Gemini | `gemini.google.com` | `content.js` | Custom element yapısı, resim dönüştürme, hızlı MD/TXT |
| Claude | `claude.ai` | `content-claude.js` | Document-order mesaj akışı, artifact viewer yaşam döngüsü |
| ChatGPT | `chatgpt.com` | `content-chatgpt.js` | Eski + `wm` DOM, sanallaştırma scroll-süpürmesi |
| Grok | `grok.com` | `content-grok.js` | Kesin `data-testid` önceliği, geriye uyumlu fallback zinciri |

Hostname doğrulaması kesindir. `example.invalid/?next=https://chatgpt.com` gibi URL içinde hedef site adı taşıyan başka alan adları destekli kabul edilmez.

## Mimari

```text
Desteklenen AI sekmesi
  ├─ resim-yardimcilari.js
  ├─ ortak-yardimcilar.js
  └─ content-*.js
       │
       ├─ DOM → konusmaVerisi
       ├─ ayarlariDogrula()
       └─ storage.local[aiChatPrinterOturum:<UUID>]
              │
              └─ background.js → yazdir.html?oturum=<UUID>
                       │
                       ├─ oku ve hemen sil
                       ├─ sessionStorage F5 yedeği
                       ├─ htmlTemizle()
                       ├─ canlı sayfa/mesaj ayarları
                       └─ yazdır / MD / TXT / HTML / JSON
```

Content script yükleme sırası `resim-yardimcilari.js → ortak-yardimcilar.js → content-*.js` biçimindedir. `background.js`, `site-yardimcilari.js` dosyasını `importScripts()` ile yükler. Popup ve önizleme de aynı site sözleşmesini kullanır; böylece destekli kaynak listesi üç ayrı yerde sapmaz.

## Proje Yapısı

```text
GeminiPrinter/
├── manifest.json              # Manifest V3, izinler, komutlar, CSP ve içerik betikleri
├── background.js              # Service worker, önizleme sekmesi ve kalıntı temizliği
├── site-yardimcilari.js       # Tam-hostname site ve kaynak sözleşmesi
├── resim-yardimcilari.js      # Görsel dönüştürme, timeout ve güvenli kaynak denetimi
├── ortak-yardimcilar.js       # Ayarlar, quota, oturum, Markdown ve dosya yardımcıları
├── content.js                 # Gemini çıkarıcısı
├── content-claude.js          # Claude + artifact çıkarıcısı
├── content-chatgpt.js         # ChatGPT çift DOM + sanallaştırma çıkarıcısı
├── content-grok.js            # Grok çok katmanlı çıkarıcısı
├── popup.html
├── popup.css                  # Baskı Stüdyosu popup tasarımı
├── popup.js
├── yazdir.html
├── yazdir.css                 # Ekran, responsive ve yazıcı stilleri
├── yazdir.js                  # Güvenli render, seçim ve tüm dışa aktarımlar
├── _locales/tr/messages.json
├── _locales/en/messages.json
├── icons/                    # Web Store güvenli alanlı ikonlar + yeniden üretim betiği
├── tests/acceptance_tests.py  # Statik, tarayıcı ve gerçek MV3 kabul paketi
├── store_assets/v2.0.0/       # 4 ekran görüntüsü, small/marquee tanıtım görselleri
├── CHROME_WEB_STORE_v2.0.0.md # TR/EN mağaza metni, izin ve veri kullanım beyanları
├── RELEASE_NOTES_v2.0.0.md    # Yayın notları ve yükseltme sözleşmesi
├── DISTRIBUTION_v2.0.0.md     # ZIP içeriği, SHA-256 ve paket kabul kanıtı
├── GIZLILIK.md
├── TEKNIK_DOKUMANTASYON.md
├── CLAUDE.md
├── LICENSE
└── README.md
```

## Geliştirme ve Kabul

Python 3, Playwright ve Node.js bulunan geliştirme ortamında bütün kabul paketi tek komutla çalışır:

```powershell
python .\tests\acceptance_tests.py
```

Dağıtım ZIP’i açıldıktan sonra yalnız gerçek MV3 service worker ve dört site zincirini aynı test dosyasıyla yeniden doğrulamak için:

```powershell
$env:AI_CHAT_PRINTER_PROJECT_ROOT = "C:\gecici\AI-Chat-Printer-v2.0.0"
python .\tests\acceptance_tests.py --runtime-only
```

Paket şu katmanları doğrular:

- Tüm kök JavaScript dosyalarında `node --check` ve bütün Python dosyalarında derleme denetimi.
- Manifest V3, sürüm ve asgari izin sözleşmesi.
- UTF-8 ve mojibake taraması.
- Resim yaşam döngüsünde event handler, kimlik bilgisi ve referrer güvenliği.
- Gerçek Chromium üzerinde sanitizer, XSS, ayar, seçim, seçili-resim decode bariyeri, dışa aktarım, F5, bozuk oturum ve paralel oturum yalıtımı testleri.
- Popup erişilebilirliği ve kötü niyetli hostname benzerliği testi.
- Paketlenmemiş eklentinin gerçek MV3 service worker ile yüklenmesi.
- Dört siteye özgü fixture üzerinde gerçek content script → `storage.local` → service worker → önizleme uçtan uca zinciri; ayrıca Gemini hızlı Markdown, Claude artifact ve ChatGPT uzun-konuşma süpürmesi.

## Sürüm Geçmişi

### v2.0.0 — 15.08.2026

- Popup ve yazdırma önizlemesi user-friendly Baskı Stüdyosu tasarımıyla yenilendi.
- A4/A3/Letter, dikey/yatay, üç kenar boşluğu, 17 px yazı, belge imzası ve bağlantı adresi ayarları eklendi.
- Rol bazlı mesaj seçimi, boş seçim kilidi ve tüm çıktı türlerinde tek seçim sözleşmesi eklendi.
- Sayfa ayarları dinamik `@page` kuralıyla gerçek yazıcı/PDF çıktısına bağlandı.
- Uzun mesajların sayfalar arasında bölünebilmesi, tablo başlıklarının tekrarı ve responsive araç satırları sağlandı.
- Tam-hostname site doğrulaması `site-yardimcilari.js` içinde merkezileştirildi.
- Eski ve sahipsiz yazdırma paketlerine 6 saatlik TTL temizliği eklendi.
- HTML dışa aktarımı string birleştirme yerine güvenli belge DOM’u ile üretildi.
- Sanitizer yalnız güvenli `language-*` sınıflarını koruyacak biçimde sertleştirildi.
- Raster veri URI allowlist’i, kimlik bilgisiz HTTPS fallback’i, event/timeout temizliği ve baskı öncesi resim hazır olma kontrolü eklendi.
- ChatGPT sanallaştırma süpürmesindeki sessiz adım sınırı kaldırıldı; gerçek sona kadar ilerleme ve hareketsizlik koruması getirildi.
- Claude artifact çıkarımı öğe bazında izole edildi; hata olsa da viewer kapanışı `finally` ile güvenceye alındı.
- Grok güncel kesin selektörleri fallback’lerin önüne alındı ve konuşma metnini console’a yazan debug sızıntısı kaldırıldı.
- Kalıcı 14 maddelik otomatik kabul paketi ve gizlilik bildirimi eklendi.
- Web Store güvenli alanlı yeni ikon, gerçek arayüzden üretilmiş mağaza görselleri, TR/EN mağaza metni ve yayın notları eklendi.
- Açılmış dağıtım ZIP’ini `--runtime-only` ile gerçek MV3 zincirinde yeniden sınayan paket kabul yolu eklendi.

### v1.9.0 — 15.08.2026

- UUID tabanlı eşzamanlı yazdırma oturumları ve oturum kimlikli F5 yedeği eklendi.

### v1.8.3 — 22.07.2026

- ChatGPT Paylaş düğmesi metin fallback’i ve aynı satır hizalaması düzeltildi.

### v1.8.2 — 22.07.2026

- ChatGPT 2026 “wm” DOM desteği, çift çıkarıcı, sanallaştırma süpürmesi ve floating düğme eklendi.

### v1.8.1 — 19.07.2026

- Claude 2026 arayüzü, document-order mesaj toplama ve yeni artifact viewer akışı desteklendi.

### v1.8.0

- Canlı önizleme ayarları, mesaj seçimi, HTML ve JSON dışa aktarımı eklendi.

### v1.7.0–v1.7.8 — 10.06.2026

- Gerçek HTML→Markdown motoru, MD/TXT dosya indirme, F5 dayanıklılığı, reentrance koruması, resim ve UI sızıntı filtreleri, fence/link/encoding düzeltmeleri tamamlandı.

### v1.6.1 — 15.05.2026

- Gemini cevap altı MD/TXT indirme ve storage sertleştirmesi eklendi.

### v1.5.0–v1.5.2 — 25.04.2026

- Grok desteği, ticari kalite denetimi ve Gemini streaming false-positive düzeltmesi yayımlandı.

### v1.0.0–v1.4.0 — 25.03.2026–22.04.2026

- İlk Gemini sürümünden dört platformlu Manifest V3 yapısına geçildi; Claude/ChatGPT, resim, PDF, i18n ve güvenlik katmanları eklendi.

## Lisans / License

[MIT](LICENSE)

## Geliştirici / Developer

Baran SEREN — Ankara / Gölbaşı
