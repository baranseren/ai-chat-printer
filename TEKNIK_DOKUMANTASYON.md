# AI Chat Printer — Teknik Dokümantasyon (v2.0.3)

> Revizyon: 29.09.2026 — Güncel ChatGPT mesaj/görsel yapısı, 23 maddelik kabul ve v2.0.3 dağıtım paketiyle eşitlendi.

> Bu belge, projeyi **sıfırdan birebir yeniden inşa edebilmek** için hazırlanmıştır. Düşük yetenekli bir LLM dahi bu dokümandaki adımları, fonksiyon imzalarını, selektör tablolarını, algoritma adımlarını ve birebir kod kurallarını takip ederek **fonksiyonel olarak özdeş bir eklenti** üretebilir. Hiçbir karar "açık" bırakılmamıştır — buton piksel boyutlarından sanitizer whitelist'ine, Markdown fence algoritmasından mesaj kanalı semantiğine, toast renklerinden storage anahtarlarına kadar her şey burada tanımlıdır.
>
> **SÜRÜM NOTU (29.09.2026):** Belge **v2.0.3**'ü anlatır. Sürüm geçmişi özeti:
> - **v1.7.8** (commit `2547bab`, 10.06.2026): v1.7.0 derin denetimi + 8 saatlik öz-denetim turunun ürünü; bulunan 14 gerçek bug'ın düzeltmeleri gövdeye işlendi ("neden böyle" kuralları için bkz. EK G ve EK H).
> - **v1.8.0** (commit `f79d049` + `33e62fb`): Yazdırma sayfasına üç büyük yetenek eklendi — **canlı ayar çubuğu** (yazı boyutu / kod blokları / mesaj seçim modu; popup'a dönmeden anlık uygulanır), **mesaj seçimi** (checkbox'la her mesajı çıktıdan hariç tutabilme + Tümünü Seç/Kaldır), **HTML ve JSON dışa aktarma** (tek dosya bağımsız HTML + yapılandırılmış JSON). Kod bloğu gizleme `pre.remove()` yerine `body.kod-gizli` CSS class'ına taşındı (DOM silinmez, canlı geri açılır). Tüm dışa aktarımlar mesaj seçimine saygılıdır. Bölüm 16 ve 18 bu sürümü anlatır; popup sürüm satırı `chrome.runtime.getManifest().version` ile dinamikleşti.
> - **v1.8.1** (19.07.2026): claude.ai 2026-07 UI güncellemesi eklentiyi tamamen kırdı; Bölüm 11 ve EK C canlı DOM analiziyle yeniden yazıldı. Kırılan 5 nokta: (1) `page-header` → `chat-header`, (2) turn-bazlı mesaj döngüsü → document-order `querySelectorAll` akışı (tüm konuşma artık `children[0]` tek ağaç), (3) artifact aç `[role="button"]` → grup içi `button[aria-label^="View"]`, (4) viewer kapat `Close` → `Go back`, (5) başlık sidebar linki → `chat-title-split`. Grok rol tespitine `data-testid` katmanı eklendi. Tüm yeni selektörler eski UI fallback'leriyle birlikte uygulanır.
> - **v1.8.2** (22.07.2026): ChatGPT 2026-07 "wm" UI güncellemesi çıkarıcıyı kırdı ("konuşmanın tamamı yazdırılmıyor" şikayeti). Canlı DOM analiziyle tespit: `[data-testid^="conversation-turn"]`, `[data-message-author-role]`, `.markdown`, `.user-message-bubble-color` yeni DOM'da 0 eşleşme; yeni yapı `ol[data-conversation-transcript] > li[data-message-role]` (id = mesaj UUID), kullanıcı içerik `[data-user-message-bubble]`, AI içerik `[data-assistant-markdown]`, sr-only `h4[data-message-attribution]` ("Şunu dedin:"/"ChatGPT:") sızıntı riski. `content-chatgpt.js` çift DOM, sanallaştırma süpürmesi ve floating fallback ile yeniden yazıldı. Bu sürümde eklenen content-started/complete streaming çıkarımı tarihsel karardır; v2.0.3 canlı kanıtıyla güvenilmez olduğu görülüp tamamen kaldırılmıştır.
> - **v1.9.0** (15.08.2026): Global `konusmaVerisi`/`yazdirAyarlari` anahtarları kaldırıldı. Her yazdırma isteği `crypto.randomUUID()` ile üretilen benzersiz oturum kimliği altında, `aiChatPrinterOturum:<kimlik>` anahtarında saklanır; background ilgili kimliği `yazdir.html?oturum=<kimlik>` adresine taşır. Böylece art arda veya eşzamanlı yazdırmalarda hiçbir sekme başka konuşmanın verisini okuyamaz. Oturum paketi okunur okunmaz silinir; F5 yedeği de oturum kimliğiyle ayrılır. Önceki sürümden açık kalmış doğrudan `yazdir.html` sekmeleri için eski anahtar okuma fallback'i korunur.
> - **v2.0.0** (15.08.2026): Popup ve önizleme “Baskı Stüdyosu” tasarım sistemiyle baştan kuruldu. Ayar sözleşmesi 8 alana genişledi; A4/A3/Letter, dikey/yatay, üç kenar boşluğu, 11/13/15/17 px, kod, belge imzası, bağlantı adresi ve otomatik yazdırma birlikte doğrulanır. Rol bazlı mesaj seçimi ve boş seçim kilidi eklendi. `site-yardimcilari.js` tam-hostname doğrulamasını merkezileştirdi. Service worker sahipsiz oturumlara 6 saat TTL uyguladı. HTML dışa aktarımı güvenli DOM belgesiyle yeniden yazıldı; sanitizer yalnız `PRE`/`CODE` üzerindeki `language-*` sınıflarını geçirir. Resim kanalı raster allowlist, kimlik bilgisi/referrer izolasyonu, olay/zamanlayıcı temizliği ve yazdırma öncesi seçili-resim hazır olma bariyeri kazandı. ChatGPT süpürmesi gerçek sona kadar ilerler; Claude artifact paneli her sonuçta kapanır; Grok kesin `data-testid` seçicilerini önce kullanır ve özel konuşma metnini loglamaz. `tests/acceptance_tests.py`, statik + gerçek Chromium + gerçek MV3 service worker/content-script zincirini 14 kabul maddesiyle doğrular.
> - **v2.0.1** (15.08.2026): ChatGPT'nin güncel Çalışma dosyaları canlı DOM'da doğrulandı: metin atfı `data-file-citation-primary-file-id`, sağ panel `section[data-testid="screen-threadFlyOut"]`, kaynak görünümü CodeMirror `.cm-content > code`. Çıkarıcı bu zinciri eski Canvas `data-testid`/ProseMirror/contenteditable geri dönüşleriyle birleştirir; dosyaları tekilleştirir, Kod/Kaynak sekmesini seçer, içeriği iki ölçüm boyunca kararlılaştıktan sonra alır, eklentinin açtığı paneli kapatır ve kullanıcının önceden açık panel/seçili sekme durumunu geri yükler. Gerçek MV3 kabulü güncel Çalışma ve eski Canvas aç-oku-kapat fixture'larıyla genişletildi.
> - **v2.0.2** (30.08.2026): Açık hedef sekmelerde extension update sonrası kalan eski content script bağlamı kökten ele alındı. Dört dar `host_permissions` ile install/update anında yalnız Gemini/Claude/ChatGPT/Grok sekmeleri otomatik tazelenir. `arkaPlanMesajiGonder` üç kontrollü deneme yapar; sayfa içi akışta gerçek context kaybı bir kez otomatik reload + `sessionStorage` devam işaretiyle kurtarılır. Popup ve kısayol, `baglantiSaglik` ping'i görünene kadar bekleyip işlemi yeniden yollar. Background açma isteği `chrome.storage.session` oturum→sekme eşlemesiyle idempotenttir. Kabul paketi 18 maddede bu yeni yaşam döngüsünü gerçek MV3 altında doğrular.
> - **v2.0.3** (30.08.2026): ChatGPT tamamlanmış yanıtlarda `data-assistant-content-started` işaretini kalıcı tutmaya başladı; `data-message-complete` bulunmayan bitmiş mesajlar yanlışlıkla streaming sayılıyordu. Bu iki attribute streaming kararından tamamen çıkarıldı. Yalnız görünür Durdur düğmesi, görünür `.result-streaming` ve `[data-message-status="in_progress"]` kabul edilir. Tamamlanmış ama content-started taşıyan fixture, hem doğrudan tarayıcı hem gerçek MV3 zincirinde false-positive regresyon kapısı oldu; paket 19 maddede doğrulanır.
> - **24.09.2026 düzeltmesi:** `unlimitedStorage` ile 10 MB kota engeli kaldırıldı. 4 MB ve üzerindeki paketler F5 için `chrome.storage.local` içinde kalır ve önizleme sekmesi kapanınca silinir; küçük paketler `sessionStorage` yedeğiyle çalışır. Gerçek MV3 testinde 30 MB aktarım, F5 ve kapanış temizliği doğrulandı.
> - **29.09.2026 dağıtımı:** Güncel ChatGPT `main [data-chatgpt-search-unit-key]` akışı, metin/görsel DOM sırası, SVG/Mermaid ve büyük konuşma davranışı kaynak kabulünde 23/23; dağıtım ZIP'inde 4/4 doğrulandı.

> **TARİHSEL KAYNAK ANLIK GÖRÜNTÜSÜ (30.08.2026 - 19:38):** Proje kökünde 34 dosya; dağıtım ve `.git` dışındaki taranabilir kapsamda 38 UTF-8 metin dosyası, 10 kök JavaScript, 2 HTML, 2 CSS ve 2 Python dosyası vardır. 38/38 metin dosyası UTF-8 BOM'suzdur. Manifest `2.0.3`; API izinleri `activeTab, storage, clipboardWrite`; host izinleri yalnız dört hedef sitedir. v2.0.3 ZIP 20 giriş, 97.351 bayt ve SHA-256 `0CCED3917A6319965E087118FF88C95670CD3B9173F274D37BADB7232B97E287` değerindedir. Kaynak kabulü 19/19, açılmış paket kabulü 4/4 başarılıdır.

---

## İçindekiler

1. [Proje Özeti ve Amaç](#1-proje-özeti-ve-amaç)
2. [Mimari Genel Bakış](#2-mimari-genel-bakış)
3. [Çalışma Ortamı ve Bağımlılıklar](#3-çalışma-ortamı-ve-bağımlılıklar)
4. [Dosya Yapısı (Tam Liste)](#4-dosya-yapısı-tam-liste)
5. [manifest.json (Birebir + Gerekçeler)](#5-manifestjson)
6. [Veri Modeli — `konusmaVerisi`](#6-veri-modeli)
7. [Ortak Modül: resim-yardimcilari.js](#7-ortak-modül-resim-yardimcilarijs)
8. [Ortak Modül: ortak-yardimcilar.js](#8-ortak-modül-ortak-yardimcilarjs)
9. [HTML→Markdown Motoru](#9-htmlmarkdown-motoru)
10. [Gemini Content Script (content.js)](#10-gemini-content-script)
11. [Claude Content Script (content-claude.js)](#11-claude-content-script)
12. [ChatGPT Content Script (content-chatgpt.js)](#12-chatgpt-content-script)
13. [Grok Content Script (content-grok.js)](#13-grok-content-script)
14. [Background Service Worker](#14-background-service-worker)
15. [Popup (popup.html + popup.js)](#15-popup)
16. [Yazdırma Sayfası (yazdir.html + yazdir.js)](#16-yazdırma-sayfası)
17. [HTML Sanitizer (htmlTemizle)](#17-html-sanitizer)
18. [Yazdırma Stilleri (yazdir.css)](#18-yazdırma-stilleri)
19. [Mesajlaşma Protokolü](#19-mesajlaşma-protokolü)
20. [Storage Mimarisi](#20-storage-mimarisi)
21. [Güvenlik Modeli](#21-güvenlik-modeli)
22. [Eşzamanlılık ve Yaşam Döngüsü](#22-eşzamanlılık-ve-yaşam-döngüsü)
23. [i18n (_locales)](#23-i18n)
24. [İkon Üretimi](#24-ikon-üretimi)
25. [Versiyonlama](#25-versiyonlama)
26. [Kurulum ve Test Workflow](#26-kurulum-ve-test-workflow)
27. [Sıfırdan İnşa Adım Adım](#27-sıfırdan-inşa-adım-adım)
28. [v2.0.0 Kanonik Modernizasyon Sözleşmesi](#28-v200-kanonik-modernizasyon-sözleşmesi)
29. [v2.0.1 ChatGPT Çalışma ve Canvas Artefakt Sözleşmesi](#29-v201-chatgpt-çalışma-ve-canvas-artefakt-sözleşmesi)
30. [v2.0.2 MV3 Bağlantı Kurtarma Sözleşmesi](#30-v202-mv3-bağlantı-kurtarma-sözleşmesi)
31. [v2.0.3 ChatGPT Streaming False-Positive Sözleşmesi](#31-v203-chatgpt-streaming-false-positive-sözleşmesi)

### Ekler

- **EK A** — Edge Case'ler ve Özel Durumlar
- **EK B** — Encoding ve Türkçe Diakritik Kuralları
- **EK C** — DOM Selektör Master Tablosu (4 site, kırılganlık dereceli)
- **EK D** — Veri Akışı Sırası (iki tetikleme yolu, tam tur)
- **EK E** — Test Kontrol Listesi ve Otomatik Kabul Paketi
- **EK F** — Kullanıcıya Görünen Tüm Metinler (birebir Türkçe)
- **EK G** — Kritik Etkileşim Noktaları (14 sıkça atlanan davranış)
- **EK H** — Tasarım Kararları ve Gerekçeleri (10 "neden böyle?")
- **EK I** — Dosya/Fonksiyon Haritası (satır aralıkları)
- **EK J** — Tip İmza Özeti (tüm fonksiyonlar)
- **EK K** — Bilinen Sınırlamalar ve Bilinçli-Dokunulmayan Kararlar
- **EK L** — Hızlı Sözlük (terim → kod karşılığı)

---

## 1. Proje Özeti ve Amaç

**AI Chat Printer**, dört AI sohbet sitesindeki konuşmaları tek tıkla **yazdırmak / PDF kaydetmek / Markdown-metin olarak dışa aktarmak** için geliştirilmiş bir Chrome eklentisidir (Manifest V3, vanilla JS, sıfır bağımlılık).

| Hedef Site | Content Script | Özel Yetenek |
|------------|----------------|--------------|
| gemini.google.com | `content.js` | Resim base64 gömme + cevap altı ↓ MD / ↓ TXT indirme butonları |
| claude.ai | `content-claude.js` | Artifact içeriği çıkarma (tıkla-aç-oku-kapat döngüsü) |
| chatgpt.com | `content-chatgpt.js` | Eski + “wm” DOM, gerçek sona kadar sanallaştırma süpürmesi, Çalışma/Canvas artefaktları |
| grok.com | `content-grok.js` | Kesin `data-testid` önceliği + geriye uyumlu çok katmanlı fallback |

**Temel davranış zinciri:** Sayfaya enjekte edilen yazıcı butonu → DOM'dan konuşma çıkarılır (mesajlar + resimler + artifact'lar) → benzersiz oturum anahtarıyla `chrome.storage.local`'a yazılır → `yazdir.html?oturum=<kimlik>` yeni sekmede açılır → yalnız o oturumun verisi okunur-okunduğu anda silinir → sanitize edilip render edilir → `window.print()` (PDF dosya adı = konuşma başlığı).

**Dışa aktarma yüzeyleri (6):**
1. Yazdırma / PDF (tarayıcı print dialogu)
2. Panoya kopyala: Markdown veya düz metin (yazdırma sayfası araç çubuğu)
3. Dosyaya indir: `.md` / `.txt` (yazdırma sayfası araç çubuğu)
4. Dosyaya indir: `.html` (tek dosya, gömülü CSS'li bağımsız belge) / `.json` (yapılandırılmış ham veri) — v1.8.0
5. Cevap altı hızlı indirme: tek soru-cevap çifti `.md` / `.txt` (yalnız Gemini)
6. Canlı önizleme kontrolü: yazı boyutu, kâğıt, yön, kenar, kod, imza ve link adresi anlık değişir; **mesaj seçim modu** tekil/toplu/yalnız kullanıcı/yalnız AI seçimi sunar — bütün dışa aktarımlar aynı seçime saygılıdır

Markdown çıktıları **gerçek Markdown'dır** — `htmlToMarkdown` motoru başlık, dil etiketli kod fence'i, iç içe liste, pipe tablo, link, alıntı üretir (Bölüm 9).

---

## 2. Mimari Genel Bakış

```
┌─────────────────────────── HEDEF SİTE SEKMESİ ────────────────────────────┐
│  (gemini.google.com / claude.ai / chatgpt.com / grok.com)                 │
│                                                                           │
│  manifest content_scripts sırası (üçü de AYNI isolated world'de):         │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌────────────────────┐ │
│  │ resim-yardimcilari.js│→│ ortak-yardimcilar.js │→│ content-{site}.js  │ │
│  │ base64 + deadline    │ │ ayar+quota+MD motoru │ │ buton + çıkarma    │ │
│  └──────────────────────┘ └──────────────────────┘ └────────────────────┘ │
│         │                                                  │              │
│         │   konusmayiCikar() → {baslik, mesajlar[], ...}   │              │
│         └──────────────────────┬───────────────────────────┘              │
└────────────────────────────────┼──────────────────────────────────────────┘
                                 │ chrome.storage.local.set({
                                 │  ['aiChatPrinterOturum:' + kimlik]: paket})
                                 │ chrome.runtime.sendMessage(
                                 │ {islem:'yazdirmaSayfasiAc', oturumKimligi})
                                 ▼
                  ┌──────────────────────────────┐
                  │   background.js (SW, MV3)    │
                  │  • yazdirmaSayfasiAc→tabs.create
                  │  • Ctrl+Shift+P komutu       │
                  │  • otomatik sekme/port kurtarma
                  │  • onInstalled hedef sekme tazeleme
                  └──────────────┬───────────────┘
                                 │ chrome.tabs.create(yazdir.html?oturum=kimlik)
                                 ▼
┌────────────────────────── YAZDIRMA SEKMESİ ───────────────────────────────┐
│  yazdir.html  →  site-yardimcilari.js + ortak-yardimcilar.js + yazdir.js │
│  1. storage.local.get(oturum anahtarı) → küçükse sil, büyükse koru        │
│  2. Küçükse sessionStorage yedeği; büyükse local paketle F5 desteği       │
│  3. htmlTemizle() whitelist sanitizer → DOM render                        │
│  4. Araç çubuğu: Yazdır | Markdown | Metin | ↓ MD/TXT/HTML/JSON | Kapat   │
│  5. otomatikYazdir ise: seçili resimler yüklenip decode edilince print()  │
└───────────────────────────────────────────────────────────────────────────┘

İkinci tetikleme yolu (popup):
  popup.js → chrome.tabs.sendMessage({islem:'konusmayiCikar'})
           → content script async yanıt → popup quota kontrolü
           → popup yazdırma oturumu oluşturur + background yazdir.html?oturum açar
```

**Önemli mimari kararlar:**

| Karar | Gerekçe |
|-------|---------|
| Ortak modüller `content_scripts.js[]` array'inde ilk sırada | MV3'te aynı isolated world'e sıralı yüklenir; ES module/bundler gerekmez. Top-level `function` bildirimleri sonraki script'lere global görünür |
| `popup.html` ve `yazdir.html` de `ortak-yardimcilar.js`'i `<script>` ile yükler | `VARSAYILAN_AYARLAR`, `quotaKontrol`, `htmlToMarkdown`, `dosyayaIndir` tek kaynak (DRY) |
| Veri taşıma `chrome.storage.local` üzerinden (URL parametresi yalnız oturum kimliği taşır) | Konuşma MB mertebesinde olabilir; URL limiti yetmez. `unlimitedStorage` izni 10 MB yerel depo kotasını kaldırır |
| Oturum-özel anahtar + boyuta göre F5 yedeği | Eşzamanlı yazdırmaların veri karışmasını engeller; küçük paket hemen silinir, büyük paket sekme kapanana kadar tutulur (Bölüm 20) |
| Resimler base64'e content script'te çevrilir | Yazdırma sayfası farklı origin — sayfanın blob/korumalı resimlerine erişemez (EK G.6) |
| Vanilla JS, sıfır bağımlılık | Baran kuralı: framework yok, npm yok, minimal etki |

---

## 3. Çalışma Ortamı ve Bağımlılıklar

- **Tarayıcı:** Chrome **114+** (`minimum_chrome_version: "114"`)
- **Manifest:** V3 (service worker background)
- **Bağımlılık:** YOK — tamamen vanilla JS + Web API (DOMParser, Canvas, Blob, Clipboard, sessionStorage)
- **Geliştirme araçları:** `node --check` (syntax), Python 3 (`http.server` ile test düzeneği + ikon üretimi için PIL)
- **API izinleri:** `activeTab`, `storage`, `clipboardWrite`; `tabs/history/cookies/downloads/scripting` YOK. `host_permissions` yalnız dört mevcut content-script hedefidir ve install/update sekme tazelemesinde kullanılır.

---

## 4. Dosya Yapısı (Tam Liste)

```
GeminiPrinter/
├── manifest.json            # MV3 manifest — izinler, content_scripts, commands, CSP, i18n
├── background.js            # Service worker — sekme açma, kısayol ve 6 saatlik oturum temizliği
├── site-yardimcilari.js     # Tam-hostname destekli site ve kaynak görünüm sözleşmesi
├── resim-yardimcilari.js    # Resim→base64, raster allowlist, deadline ve olay temizliği
├── ortak-yardimcilar.js     # Ayar doğrulama, quota, oturum, başlık, Markdown ve indirme
├── content.js               # Gemini + resimler + cevap altı MD/TXT
├── content-claude.js        # Claude + hata yalıtımlı artifact yaşam döngüsü
├── content-chatgpt.js       # ChatGPT çift DOM + sınırsız sanallaştırma süpürmesi
├── content-grok.js          # Grok kesin data-testid öncelikli çoklu fallback
├── popup.html               # Erişilebilir Baskı Stüdyosu popup iskeleti
├── popup.css                # Popup tasarım sistemi ve responsive durumlar
├── popup.js                 # Popup ayar, site doğrulama ve önizleme akışı
├── yazdir.html              # Tek sticky kontrol yüzeyi + sayfa/mesaj araçları
├── yazdir.js                # Güvenli render, sayfa ayarı, seçim ve dışa aktarım
├── yazdir.css               # Ekran, responsive ve @media print stilleri
├── _locales/
│   ├── tr/messages.json     # extName, extDescription, actionTitle, kisayolAciklama
│   └── en/messages.json     # Aynı 4 anahtar İngilizce
├── icons/
│   ├── icon16.png  icon48.png  icon128.png
│   └── ikon_olustur.py      # PIL ile ikon üretici (geliştirme aracı, pakete girmez)
├── tests/
│   └── acceptance_tests.py  # Statik + Playwright + gerçek MV3 kabul paketi
├── store_assets/v2.0.0/
│   ├── 01-baski-studyosu-1280x800.png
│   ├── 02-mesaj-secimi-1280x800.png
│   ├── 03-popup-ve-onizleme-1280x800.png
│   ├── 04-dar-ekran-640x400.png
│   ├── tanitim-kucuk-440x280.png
│   ├── tanitim-marquee-1400x560.png
│   └── TASARIM_FELSEFESI.md
├── README.md                # İki dilli tanıtım + sürüm geçmişi
├── CHROME_WEB_STORE_v2.0.0.md # Mağaza metni, izin, veri ve görsel yükleme sözleşmesi
├── RELEASE_NOTES_v2.0.0.md  # Kullanıcıya dönük tam sürüm notu
├── DISTRIBUTION_v2.0.0.md   # Web Store ZIP künyesi, SHA-256 ve açılmış paket kabulü
├── CHROME_WEB_STORE_DURUMU_v2.0.0.md # Gönderim, inceleme ve API sınırı kaydı
├── RELEASE_NOTES_v2.0.1.md  # ChatGPT Çalışma/Canvas sürüm notu
├── DISTRIBUTION_v2.0.1.md   # v2.0.1 ZIP künyesi, SHA-256 ve açılmış paket kabulü
├── RELEASE_NOTES_v2.0.2.md  # MV3 bağlantı kurtarma sürüm notu
├── DISTRIBUTION_v2.0.2.md   # v2.0.2 ZIP künyesi, SHA-256 ve açılmış paket kabulü
├── CHROME_WEB_STORE_v2.0.2.md # Güncel TR/EN mağaza ve izin beyanları
├── RELEASE_NOTES_v2.0.3.md  # ChatGPT streaming false-positive sürüm notu
├── DISTRIBUTION_v2.0.3.md   # v2.0.3 ZIP künyesi, SHA-256 ve açılmış paket kabulü
├── CHROME_WEB_STORE_v2.0.3.md # Güncel TR/EN mağaza ve izin beyanları
├── GIZLILIK.md              # Veri işleme, yerel saklama ve izin beyanı
├── AGENTS.md                # Codex çalışma ve proje kuralları; güncel worktree'de izlenmeyen yerel dosya
├── TEKNIK_DOKUMANTASYON.md  # Bu dosya
├── LICENSE                  # MIT
└── .gitignore
```

### `.gitignore` (birebir)
```gitignore
CLAUDE.md
talimatlar.md
yol-haritasi.md
aha_point.md
Hafiza/
tasks/
.claude/
.vscode/
*.log
.DS_Store
Thumbs.db
__pycache__/
.pytest_cache/
test-results/
screenshots/
dist/
_store_capture/
```

---

## 5. manifest.json

```json
{
  "manifest_version": 3,
  "name": "__MSG_extName__",
  "short_name": "__MSG_extName__",
  "version": "2.0.3",
  "description": "__MSG_extDescription__",
  "minimum_chrome_version": "114",
  "default_locale": "tr",
  "homepage_url": "https://github.com/baranseren/ai-chat-printer",
  "permissions": ["activeTab", "storage", "clipboardWrite"],
  "host_permissions": [
    "https://gemini.google.com/*",
    "https://claude.ai/*",
    "https://chatgpt.com/*",
    "https://grok.com/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "__MSG_actionTitle__",
    "default_icon": { "16": "icons/icon16.png", "48": "icons/icon48.png", "128": "icons/icon128.png" }
  },
  "icons": { "16": "icons/icon16.png", "48": "icons/icon48.png", "128": "icons/icon128.png" },
  "background": { "service_worker": "background.js" },
  "content_scripts": [
    { "matches": ["https://gemini.google.com/*"], "js": ["resim-yardimcilari.js", "ortak-yardimcilar.js", "content.js"], "run_at": "document_idle" },
    { "matches": ["https://claude.ai/*"],         "js": ["resim-yardimcilari.js", "ortak-yardimcilar.js", "content-claude.js"], "run_at": "document_idle" },
    { "matches": ["https://chatgpt.com/*"],       "js": ["resim-yardimcilari.js", "ortak-yardimcilar.js", "content-chatgpt.js"], "run_at": "document_idle" },
    { "matches": ["https://grok.com/*"],          "js": ["resim-yardimcilari.js", "ortak-yardimcilar.js", "content-grok.js"], "run_at": "document_idle" }
  ],
  "commands": {
    "yazdir-kisayol": {
      "suggested_key": { "default": "Ctrl+Shift+P", "mac": "Command+Shift+P" },
      "description": "__MSG_kisayolAciklama__"
    }
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'"
  }
}
```

**Alan gerekçeleri:**

| Alan | Gerekçe |
|------|---------|
| `permissions` üçlüsü | `activeTab`: popup/komut anında URL okuma; `storage`: veri taşıma + ayar; `clipboardWrite`: MD/metin kopyalama. **`scripting` YOK** — statik content_scripts izin gerektirmez; gereksiz izin Web Store red sebebidir |
| `host_permissions` dört dar hedefi | Yalnız mevcut content-script alan adlarındaki açık sekmeleri install/update sonrasında otomatik tazeler. Joker alan adı, `tabs` veya `scripting` izni eklenmez |
| `run_at: document_idle` | SPA'lar tam yüklensin; buton enjeksiyonu zaten retry + MutationObserver'lı |
| `js[]` sırası | resim-yardimcilari → ortak-yardimcilar → site script'i. **Sıra değişirse global fonksiyonlar tanımsız kalır** |
| CSP `img-src 'self' data: https:` | Yazdırma sayfası base64 (`data:`) ve https resimleri gösterir. **`blob:` bilinçli YOK** — content-origin blob extension sayfasında zaten ölü doğar (EK G.6) |
| CSP `style-src 'unsafe-inline'` | Content script düğme/toast `style.cssText` değerleri ve dinamik `@page` style elementi için zorunlu; popup görünümü harici `popup.css` içindedir |
| `__MSG_*__` | `_locales` i18n — Web Store iki dilde listeler |

---

## 6. Veri Modeli

Content script → storage → yazdırma sayfası arasında taşınan tek nesne:

```javascript
{
    baslik: 'Konuşma Başlığı',     // basligiTemizle()'den geçmiş, FS-güvenli; sayfa H1 + PDF/MD/TXT dosya adı
    tarih: '10.06.2026',           // new Date().toLocaleDateString('tr-TR')
    saat: '03.13',                 // toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})
    mesajSayisi: 5,                // mesajlar.length
    kaynak: 'gemini',              // 'gemini' | 'claude' | 'chatgpt' | 'grok' — tema + etiket seçimi
    mesajlar: [
        { rol: 'kullanici',                   // 'kullanici' | 'gemini' | 'claude' | 'chatgpt' | 'grok'
          html: '<p>...</p>',                 // resimliHtmlCikar() çıktısı — resimler base64'e çevrilmiş ham klon HTML'i
          metin: 'düz metin',                 // temizMetinCikar() çıktısı — UI sızıntısız textContent
          resimler: [                         // turnResimleriniTopla() — kaynak element DIŞINDA kalan görseller
              { src: 'data:image/jpeg;base64,...', alt: '' }
          ],
          artifactlar: [                      // Claude veya ChatGPT Çalışma/Canvas — yoksa alan hiç konmaz
              { baslik: 'app.py', tur: 'Code · PY', icerik: 'print(1)' }   // icerik null olabilir (çıkarılamadı)
          ]
        }
    ],
    hata: 'mesaj'                  // YALNIZ hata durumunda; varsa mesajlar=[] gelir
}
```

**Dört içerik kanalı kuralı (KRİTİK):** `html`, `metin`, `resimler`, `artifactlar` aynı mesajın ayrı taşıma kanallarıdır. Bir filtre/temizlik kuralı eklenirken ilgili kanalların tamamı birlikte denetlenmelidir; artefaktı olmayan mesajda `artifactlar` alanı taşınmaz (v1.7.1–1.7.4 bug serisinin dersi — EK G.1).

---

## 7. Ortak Modül: resim-yardimcilari.js

Manifest'te **ilk** yüklenir. Global state: `let resimIslemDeadline = 0` (0 = limitsiz), `const TEK_RESIM_TIMEOUT = 5000`.

### Oturum/Deadline API'si
```javascript
resimIslemOturumuBaslat(toplamSure)  // deadline = Date.now() + toplamSure
resimIslemOturumuBitir()             // deadline = 0
resimDeadlineDoldu() -> boolean      // deadline > 0 && Date.now() > deadline
```
Her yazdırma akışı `resimIslemOturumuBaslat(RESIM_TOPLAM_SURE_LIMIT)` (90 sn) ile başlar, `finally`'de `resimIslemOturumuBitir()` çağrılır. Deadline dolunca kalan resimler atlanır (50+ resimli konuşma 90 sn'den fazla bloklamaz).

### `resmiBase64Yap(resimElementi) -> Promise<string|null>` — 3 katmanlı fallback

1. `src` yoksa → `null`; `data:` yalnız `guvenliRasterDataUriMi` ile PNG/JPEG/GIF/WebP ise kabul; deadline dolmuşsa HTTPS URL'i döndür, diğerini atla.
2. **Katman 1 — Canvas:** resim `!complete` ise `resimOlayiniBekle()` load/error listener'larını ve timeout'u tek settlement noktasında temizler. Property `onload/onerror` ataması yoktur. `naturalWidth === 0` veya 2D context yoksa HTTPS fallback uygulanır. Genişlik > **2400 px** ise oranlı küçült; çıktı `canvas.toDataURL('image/png')`.
3. **Katman 2 — Fetch:** Canvas cross-origin nedeniyle başarısızsa `AbortController` + 5 sn timeout ile `fetch(orijinalSrc, {credentials: aynı-origin ? 'same-origin' : 'omit', referrerPolicy:'no-referrer'})`; `response.ok` ve raster `Content-Type` doğrulanır; blob `FileReader` ile data URL olur. Abort timeout'u `finally` içinde temizlenir.
4. **Katman 3 — URL:** Fetch de başarısızsa: `https://` ile başlıyorsa orijinal URL'i döndür (yazdırma sayfası `<img>` ile dener), değilse `null`

### `resimliHtmlCikar(element) -> Promise<string>`
Element klonlanır (`cloneNode(true)`), **orijinaldeki** img'ler sırayla `resmiBase64Yap`'tan geçirilir, başarılı olanların base64'ü **klondaki** eş-indeksli img'e yazılır, başarısızlar klondan silinir. Dönüş: `kopya.innerHTML`. Resim hiç yoksa kısa devre `element.innerHTML`.

### `uiElementiIcindeMi(element) -> boolean`
`element.closest('button, [role="button"], mat-icon')` — **UI bileşeni içindeki görsel içerik DEĞİLDİR** (beğen/kopyala ikonları, buton sprite'ları çıktıya giremez).

### `turnResimleriniTopla(turn, kaynakElement) -> Promise<Array<{src,alt}>>`
Kaynak elementin DIŞINDA kalan görselleri toplar (kullanıcının yüklediği dosya önizlemeleri vb.):
1. `turn.querySelectorAll('img')` — kaynak içindekiler ve `uiElementiIcindeMi` olanlar atlanır; kalanlar `resmiBase64Yap`
2. `turn.querySelectorAll('*')` üzerinde `getComputedStyle(el).backgroundImage` taraması — `url(...)` ayrıştırılır; güvenli raster data URI, HTTPS veya sayfa-bağlamı blob adayları geçici `Image` ile denenir. Geçici `Image` için `referrerPolicy='no-referrer'` uygulanır. Blob yalnız başarıyla canvas üzerinden raster data URI'ye çevrilirse çıkar; ham blob başka extension bağlamına taşınmaz. Listener'lar `src` atamasından önce kurulur, timeout sonunda kaldırılır. Kaynaklar `Set` ile mükerrersizleştirilir; SVG ve bilinmeyen şemalar çıktı kanalına girmez.

---

## 8. Ortak Modül: ortak-yardimcilar.js

### Sabitler
```javascript
const VARSAYILAN_AYARLAR = {
    kodBloklari: true,
    otomatikYazdir: true,
    yaziBoyutu: '13',
    footerGoster: true,
    kagitBoyutu: 'A4',
    yonlendirme: 'portrait',
    kenarBosluk: 'normal',
    linkAdresleriniGoster: true
};
const STORAGE_LOCAL_LIMIT = chrome.storage?.local?.QUOTA_BYTES || (10 * 1024 * 1024);  // dinamik; fallback 10 MB
const STORAGE_UYARI_ESIGI = Math.floor(STORAGE_LOCAL_LIMIT * 0.8);                     // %80
const RESIM_TOPLAM_SURE_LIMIT = 90 * 1000;                                             // 90 sn
const ARKA_PLAN_YENIDEN_DENEME_GECIKMELERI = [0, 150, 500];                           // MV3 worker uyanma yarışı
const BAGLANTI_KURTARMA_ANAHTARI = 'aiChatPrinterBaglantiKurtarmaV1';                 // sekmeye özel reload/devam kilidi
const BAGLANTI_KURTARMA_AZAMI_YASI = 60 * 1000;                                       // 60 sn
```

### Ayarlar — `chrome.storage.sync`, anahtar `kullaniciAyarlari`
- `ayarlariDogrula(ayarlar)`: boolean alanları normalize eder; yazı boyutunu `11|13|15|17`, kâğıdı `A4|A3|Letter`, yönü `portrait|landscape`, kenarı `dar|normal|genis` allowlist'ine sıkıştırır. Eski sürümde bulunmayan alanlar varsayılandan tamamlanır; bozuk storage değeri UI veya `@page` kuralına ulaşamaz.
- `ayarlariYukle() -> Promise<object>`: storage değerini okuyup mutlaka `ayarlariDogrula` sonucunu döndürür. Chrome context erişilemezse doğrulanmış varsayılanlar kullanılır.
- `ayarlariKaydet(ayarlar) -> Promise<boolean>`: yalnız doğrulanmış nesneyi kaydeder.
- `yazdirmaOturumKimligiGecerliMi(oturumKimligi)`: URL/storage anahtarında yalnız `[A-Za-z0-9-]` ve 8–80 karakter kabul eder; parametre enjeksiyonu ve kontrolsüz storage anahtarı üretimi engellenir.

### `debounce(fonksiyon, gecikme)` — klasik timeout-resetli sarmalayıcı. MutationObserver'larda 200 ms ile kullanılır.

### `streamingMiKontrol(kaynak) -> boolean`
AI hâlâ yanıt yazıyor mu? Kaynak başına görünür "Durdur" butonu (`offsetParent !== null`) ve/veya streaming attribute kontrolü:
| Kaynak | Selektörler |
|--------|-------------|
| `claude` | `button[aria-label*="Stop" i]`, `[data-is-streaming="true"]` |
| `chatgpt` | `button[data-testid="stop-button"]`, `aria-label*="Durdur/Stop"`, `.result-streaming`, `[data-message-status="in_progress"]` |
| `grok` | `aria-label*="Stop/Durdur"`, `[data-testid*="stop" i]`, `[data-streaming="true"]`, `[aria-live="polite"][aria-busy="true"]` |
| `gemini` | Fonksiyonda tanımlı AMA **çağrılmaz** — Gemini DOM'unda Stop butonu gizliyken `offsetParent` görünür sayılıyordu, kalıcı false positive üretti; v1.5.2'de Gemini akışlarından kaldırıldı (EK H.7) |

### `basligiTemizle(hamBaslik, kaynak) -> string`
1. Ortak suffix listesi `endsWith` ile budanır: `' - Google Gemini'`, `' – Gemini'`, `' | Claude'`, `'Claude'`, `' - ChatGPT'`, `' - Grok'`, `' - xAI'` vb. (TR+EN tire/pipe varyantları + bare adlar)
2. `kaynak === 'gemini'` ise sidebar suffix regex'leri: `/Sabitlenmiş sohbet$/`, `/Pinned chat$/`, `/Pinned$/`, `/Sabitlenmiş$/`
3. FS-yasaklı karakterler silinir: `/[<>:"/\\|?*]/g` → `''`; çoklu boşluk → tek; 150 karakter sınırı
4. **Türkçe diakritik korunur** — NTFS Unicode'dur, `ç ğ ı İ ö ş ü` dosya adında geçerlidir

### `quotaKontrol(veri) -> {gecerli, uyari?, boyut, mbBoyut, mesaj?}`
`new Blob([JSON.stringify(veri)]).size` (Unicode-doğru bayt). Manifest'te `unlimitedStorage` varsa 10 MB yerel depo kotası uygulanmaz; büyük veri yalnız yazdırmanın yavaşlayabileceği bilgisini üretir. İzin bulunmayan eski kurulumda limit aşımı `gecerli:false` döndürür.

### `yazdirmayaBasla(veri, uyariBalonuGoster) -> Promise<boolean>` — ortak yazdırma akışı
1. `veri.hata` → toast + `false`  2. mesaj yoksa → toast + `false`  3. `ayarlariYukle()`  4. `quotaKontrol` — geçersizse toast + `false`  5. `yazdirmaOturumuOlustur(veri, ayarlar, veriBoyutu)` — `crypto.randomUUID()` kimliğiyle boyutlu oturum paketini `storage.local`'a yazar  6. başarı toastı (`'N mesaj çıkarıldı...'`)  7. `arkaPlanMesajiGonder({islem:'yazdirmaSayfasiAc', oturumKimligi})` 0/150/500 ms yeniden deneme sözleşmesiyle çağrılır  8. background iş hatası döndürürse paket silinir ve gerçek hata gösterilir; mesaj kanalı/context hatasıysa `baglantiKurtarmayiBaslat` sayfayı bir kez yenileyip işlemi otomatik sürdürür  9. başarılı açılış kurtarma kaydını temizler.

### MV3 Bağlantı Kurtarma Yardımcıları
- `eklentiBaglantiHatasiMi(hata)`: `chrome.runtime.id` yokluğu ile `Extension context invalidated`, `Receiving end does not exist`, message-port/channel ve yanıtsız-background hata ailelerini tek sınıfa indirir; gerçek storage/veri hatasını bağlantı hatası diye gizlemez.
- `arkaPlanMesajiGonder(mesaj)`: service worker'ı 0, 150 ve 500 ms gecikmelerle en fazla üç kez uyandırır; boş yanıtı başarı kabul etmez.
- `baglantiKurtarmaKaydiniOku/Temizle`: `sessionStorage['aiChatPrinterBaglantiKurtarmaV1']` kaydını JSON olarak güvenli okur/siler; host storage kapalıysa ana akışı bozmaz.
- `baglantiKurtarmayiBaslat`: son 60 saniyede deneme yoksa `{zaman,deneme:1,otomatikDevam:true}` yazar, kullanıcıya otomatik yenileme toastı gösterir ve 600 ms sonra sayfayı reload eder. Aynı dakika içinde ikinci hata reload döngüsü üretmez.
- `bekleyenYazdirmayiDevamEttir(yazdirmaFonksiyonu)`: reload sonrasında işareti `otomatikDevam:false` yapar ve SPA DOM'u için 900 ms bekleyerek aynı yazdırma fonksiyonunu bir kez sürdürür. Dört content script'in `baslat()` fonksiyonu bu yardımcıyı çağırır.

### Yazdırma Oturumu Yardımcıları
- `YAZDIRMA_OTURUM_ANAHTAR_ON_EKI = 'aiChatPrinterOturum:'`
- `yazdirmaOturumAnahtari(oturumKimligi)` → storage anahtarı
- `yazdirmaOturumKimligiOlustur()` → öncelikle `crypto.randomUUID()`, desteklenmeyen ortamda zaman+rastgele fallback
- `yazdirmaOturumuOlustur(veri, ayarlar)` → `{konusmaVerisi, yazdirAyarlari, olusturmaZamani}` paketini yalnız ilgili yazdırma isteğinin anahtarında saklar ve kimliği döndürür

### Dosya İndirme — `dosyayaIndir(icerik, dosyaAdi, mimeType)`
`Blob` → `URL.createObjectURL` → gizli `<a download>` append → `click()` → remove → 1 sn sonra `revokeObjectURL`. Content script'te de extension sayfasında da çalışır.

### UI Temizlik İkilisi
```javascript
uiTemizKlon(element)      // cloneNode(true) + klonda şu selektörleri içerikleriyle siler:
                          // 'button, [role="button"], mat-icon, svg, script, style, noscript, template, select, textarea'
temizMetinCikar(element)  // null-güvenli; uiTemizKlon(element).textContent.trim()
```
**Tüm `mesaj.metin` üretimleri bundan geçer** — kod bloğu "Copy / Kodu kopyala" buton yazıları ve ikon ligature metinleri (`content_copy`) TXT çıktısına sızamaz.

### `mesajMarkdownIcerigi(mesaj)` / `konusmayiMarkdowneDonustur(veri)`
- `mesajMarkdownIcerigi`: `mesaj.html` varsa `htmlToMarkdown(html)`; sonuç boşsa veya html yoksa `mesaj.metin`'e düşer ve satır başı `#{1,6}` escape'lenir (sahte başlık önleme)
- `konusmayiMarkdowneDonustur` çıktı şablonu:

```markdown
# {baslik}

**Tarih:** {tarih} {saat}  
**Mesaj sayısı:** {N}  
**Kaynak:** {Gemini|Claude|ChatGPT|Grok}

---

## #1 — Kullanıcı

{mesajMarkdownIcerigi}

### {artifact.baslik} ({artifact.tur})        ← yalnız artifact'lı mesajlarda

{mdFenceUret ile fence}
{artifact.icerik veya "(içerik çıkarılamadı)"}
{aynı fence}

_(Bu mesajda N resim var - Markdown çıktısında görsel yok.)_   ← yalnız resimli mesajlarda

---

> Bu çıktı AI Chat Printer eklentisi ile oluşturulmuştur.
```

---

## 9. HTML→Markdown Motoru

### `mdFenceUret(icerik) -> string` — fence kaçışı önleme
```javascript
const diziler = (icerik || '').match(/`{3,}/g);
const enUzun = diziler ? diziler.reduce((m, s) => Math.max(m, s.length), 0) : 0;  // reduce ZORUNLU — spread 100k+ elemanda stack overflow
return '`'.repeat(Math.max(3, enUzun + 1));
```
İçerikte ``` ``` `` geçiyorsa (markdown öğreten cevap, README artifact'ı) fence ```` ```` `` olur — CommonMark gereği kapanış açılıştan kısa olamaz, blok kırılmaz.

### `htmlToMarkdown(htmlString) -> string`
`DOMParser.parseFromString(html, 'text/html')` (script çalışmaz) → `doc.body` recursive yürüyüş → son temizlik: `[ \t]+\n → \n`, `\n{3,} → \n\n`, `trim()`.

**Düğüm işleme spesifikasyonu (birebir):**

| Düğüm/Etiket | Çıktı kuralı |
|--------------|--------------|
| TEXT_NODE | `pre` içinde ham; dışında `\s+ → ' '` (trim YOK — kelime bitişmesin) |
| `SCRIPT STYLE NOSCRIPT TEMPLATE IFRAME BUTTON SELECT TEXTAREA SVG CANVAS AUDIO VIDEO MAT-ICON` | `''` — **içerikleriyle atlanır** (UI/aktif içerik sızıntı yasağı). Karşılaştırma öncesi `tagName.toUpperCase()` (SVG namespace lowercase döner) |
| `H1..H6` | `\n\n` + `#`×seviye + boşluk + iç.trim() + `\n\n` |
| `P FIGURE FIGCAPTION` | `\n\n` + iç.trim() + `\n\n` |
| `BR` | `\n` ; `HR` → `\n\n---\n\n` |
| `STRONG B` | `**iç**` (iç boşsa hiç) ; `EM I` → `*iç*` ; `DEL S` → `~~iç~~` |
| `CODE` (pre dışı) | İçerik backtick içeriyorsa `` `` iç `` `` (boşluk paddingli çift), değilse `` `iç` `` |
| `PRE` | dil = içteki `code` veya pre'nin class'ında `/language-([\w+-]+)/`; fence = `mdFenceUret(ham)`; çıktı: `\n\n{fence}{dil}\n{ham, sondaki \n kırpılmış}\n{fence}\n\n`. İçerik `textContent` ile HAM alınır (çocuklara inilmez) |
| `A` | href `^https?://` değilse → yalnız metin. Metin: iç markdown; **escape yalnız `children.length === 0` (düz metinli link) ise** `[ ] → \[ \]` — linkli resmin `![alt](src)` sözdizimi bozulmasın. href `( ) boşluk` içeriyorsa `<href>` sargısı (Wikipedia parantezli URL'leri). Çıktı: `[metin](href)` |
| `IMG` | alt'ta `[ ] → \[ \]`. src `https://` değilse → `*[Görsel: alt]*` placeholder (base64 MD'yi MB şişirir); https ise parantez/boşlukta `<src>` sargısı, çıktı `![alt](src)` |
| `UL OL` | `\n\n` + listeyiCevir(düğüm, 0) + `\n` |
| `BLOCKQUOTE` | iç.trim() satırlara bölünür, her satıra `> ` öneki |
| `TABLE` | tabloyuCevir (aşağıda) |
| `DIV SECTION ARTICLE` | iç doluysa `\n` + iç + `\n` (yumuşak blok sınırı) |
| diğer (SPAN, SUP, SUB...) | şeffaf — yalnız içerik geçer |

**`listeyiCevir(liste, derinlik)`:** girinti = `'  '.repeat(derinlik)`; `OL` ise `start` attribute'undan başlayan sayaç (`1.`), değilse `- `. LI içindeki iç içe `UL/OL` `derinlik+1` ile işlenir; LI içeriğindeki `\n{2,} → \n`, satır devamları marker hizasına girintilenir (`\n(?!\s*$) → \n + girinti + '  '`). Nested çıktı 4-boşluk girintilidir — CommonMark geçerli.

**`tabloyuCevir(tablo)`:** tüm `tr`'ler; hücre metni = `dugumleriCevir(hucre)` + `| → \|` + `\n+ → ' '` + trim. İlk satır header varsayılır; ayırıcı `|' --- |'×kolonSayısı`. Çıktı pipe tablo.

---

## 10. Gemini Content Script

### Global state
```javascript
let butonEnjekteEdildi = false;      // toolbar butonu tek enjeksiyon
let yazdirmaIslemiSuruyor = false;   // reentrance kilidi (Bölüm 22)
```

### `baslat()`
1. `eskiIndirmeButonlariniTemizle()` — eklenti reload'unda önceki script'in ölü handler'lı `.gp-indir-btn`'lerini siler
2. `butonuEnjekteEt()` + `indirmeButonlariniKontrolEt()`
3. `MutationObserver(debounce(..., 200))` → body subtree: toolbar butonu kaybolduysa yeniden enjekte + yeni `model-response`'lara indirme butonu
4. `pagehide` (`{once:true}`) → `observer.disconnect()` (bellek sızıntısı önleme)
5. `bekleyenYazdirmayiDevamEttir(yazdirmaBaslat)` → extension update/context kaybı sonrası kullanıcıdan F5 istemeden aynı işlemi tek kez sürdürür

### Toolbar Butonu — `butonuEnjekteEt()`
- Hedef: `.top-bar-actions .right-section`; yoksa `setTimeout(butonuEnjekteEt, 1000)` retry
- Eski buton temizliği: `#gemini-printer-buton` varsa `closest('.buttons-container')` ile birlikte sil (yoksa yalnız butonu)
- Görsel spec: `div.buttons-container` (Gemini'nin kendi sınıfı) içinde `button#gemini-printer-buton` — **40×40 px, border-radius 9999px**, şeffaf zemin; 20×20 yazıcı SVG'si (`createElementNS` ile 3 path: `M6 9V2h12v7`, gövde, `rect 6,14,12,8`); renk `#5f6368`, hover'da zemin `rgba(0,0,0,0.06)` + ikon `#1a73e8`
- Konum: `.buttons-container`'lardan en az 2 varsa `insertBefore(container, mevcut[1])` (paylaş'tan önce), yoksa sona

### `yazdirmaBaslat()` (buton + Ctrl+Shift+P)
Reentrance kilidi → "Konuşma çıkarılıyor..." toastı → `resimIslemOturumuBaslat(90sn)` → `try { konusmayiCikar() → yazdirmayaBasla() } catch { hata toastı } finally { kilit bırak + oturum bitir }`. **Streaming kontrolü Gemini'de bilinçli YOK** (EK H.7).

### `konusmayiCikar()` — çıkarma algoritması
1. Konteyner: `.chat-history-scroll-container`; yoksa `{hata: 'Konuşma bulunamadı...', mesajlar: []}`
2. `querySelectorAll('user-query, model-response')` — DOM sırasıyla `for...of` (await'li işlemler İÇİN `forEach` YASAK)
3. **user-query:** kaynak öncelik `.query-text` → `.user-query-bubble-with-background` → `.query-content`; `html = await resimliHtmlCikar(kaynak)`; `metin = geminiPrefixTemizle(temizMetinCikar(kaynak))`; `resimler = await turnResimleriniTopla(turn, kaynak)`
4. **model-response:** kaynak `.markdown` → `.response-content` → `message-content`; aynı üçlü; `rol:'gemini'`
5. Başlık: sidebar aktif link `conversations-list a.selected | a[aria-current="page"] | a.active` → `basligiTemizle(.., 'gemini')`; boşsa `document.title`; boşsa `'Gemini Konuşması'`

### `geminiPrefixTemizle(metin)`
Gemini erişilebilirlik önekleri `/^\s*(Siz şunu dediniz:|Siz şunu söylediniz:|You said:)\s*/` regex'iyle soyulur. Prefix sonrasında boşluk veya satır kırması bulunmasa da yakalanır; eski `startsWith` yaklaşımının boşluk varyantı kaçırma sorunu yoktur.

### Cevap Altı ↓ MD / ↓ TXT Butonları
- `indirmeButonlariniKontrolEt()`: tüm `model-response`'lar; `.gp-indir-btn` zaten varsa veya içerik elementi yoksa atla
- `indirmeButonlariniEnjekte(modelResponse)`:
  - Action bar adayları: `message-actions` → `.response-actions-container` → `.message-actions`
  - Bar içindeki son ikon butonun (`button[mat-icon-button], button.mat-mdc-icon-button, ...`) **`parentElement`'ine KARDEŞ olarak** `insertBefore` — custom element kabuğuna `appendChild` YAPILMAZ, Angular Material'de gerçek flex container child düzeyindedir; wrapper span da KULLANILMAZ (flex-wrap alt satıra düşürür) (EK G.9)
  - Stil bir kez `#gp-indir-stil` ile head'e: `.gp-indir-btn` pill (28px yükseklik, radius 14px, 11px font, `#dadce0` kenar; `.gp-md-btn` mavi tonlu; hover `#e8f0fe`); buton metinleri `↓ MD` / `↓ TXT`
  - Click handler'lar `preventDefault + stopPropagation + stopImmediatePropagation`; **closure'a yalnız `modelResponse` referansı sabitlenir, metinler TIKLAMA ANINDA çıkarılır** (streaming/regenerate toleransı)
- `oncekiSoruMetniBul(modelResponse)`: `previousElementSibling` zinciriyle geriye ilk `user-query`; içinden `.query-text`→balon→içerik; `geminiPrefixTemizle(temizMetinCikar(...))`
- `cevapMarkdownAl`: `htmlToMarkdown(uiTemizKlon(icerikEl).innerHTML)`; boşsa temiz klon metni. `cevapMetniniAl`: `temizMetinCikar(icerikEl)`
- `cevapIndir(soru, cevap, format)`: MD şablonu (`# Gemini Soru-Cevap` + Tarih/Konuşma + `## Soru` [soru `#` escape'li] + `## Cevap` [gerçek markdown] + imza) veya TXT şablonu (60×`=` ayraçlar, `SORU:`/`CEVAP:` etiketleri — tam diakritikli `Konuşma:` / `alınamadı`); `indirmeDosyaAdiOlustur` (FS-yasaklı `[<>:"/\\|?*\n\r\t]` temizliği + 80 char + boşsa `gemini-cevap-{Date.now()}`); `dosyayaIndir`; başarı toastı

---

## 11. Claude Content Script

### Global state
`butonEnjekteEdildi`, `observerAktif` (MutationObserver referansı), `artifactCikarmaAktif` (artifact döngüsü sırasında observer'ı susturur — viewer aç/kapa DOM değişimi yeniden-enjeksiyon tetiklemesin), `yazdirmaIslemiSuruyor`.

### Buton Enjeksiyonu (v1.8.1 — 2026-07 UI)
- Header: `[data-testid="chat-header"]` (yeni `.dframe-header`) → fallback `[data-testid="page-header"]` (eski UI); içinde `#dframe-header-actions-slot` → fallback `.flex.w-full.items-center.justify-between`; ikisi de retry'lı
- Buton: 36×36 px, radius 8px, ikon 18px, renk `#6b7280`, hover `#d97706` (amber)
- Konum: `[data-testid="wiggle-controls-actions-share"]` (yeni) → fallback `textContent === 'Share'` butonunun **kendi parent'ına** `insertBefore`; fallback `#archive-button` (NotebookLM — 2026-07 UI'da kalktı) önüne; o da yoksa aksiyon alanının başına `insertBefore(firstChild)`

### `yazdirmaBaslat()`
`streamingMiKontrol('claude')` → uyar+çık; reentrance kilidi; artifact sayısı toastı (`'N artifact bulundu, içerikleri çıkarılıyor (0/N)...'`); `artifactIcerikleriniCikar(progressCallback)`; "Konuşma çıkarılıyor..." toastı; `konusmayiCikar(artifactIcerikleri)`; `yazdirmayaBasla`; catch+finally standart.

### `artifactViewerKapat()` ve `artifactIcerikleriniCikar(ilerlemeCallback)`

Her `.artifact-block-cell` kendi `try/catch/finally` sınırında işlenir. Bir kartın click, render veya stabilite hatası sonraki artifact'ı iptal etmez. `finally`, o kart için `artifactViewerKapat()` çağırır; yardımcı `button[aria-label="Go back"] → button[aria-label="Close"]` zincirini kullanır ve `#wiggle-file-content` DOM'dan kalkana kadar doğrular.

Akış:

1. Başlık `.leading-tight.line-clamp-1`, tür `.text-text-400.line-clamp-1` üzerinden okunur.
2. Açma hedefi grup içi `button[aria-label^="View"]`, eski `closest('[role=button]')` ve grup fallback sırasıyla seçilir.
3. Panel en çok 3,2 saniye beklenir; render için ek kısa bekleme uygulanır.
4. İçerik hedefi `.code-block__code → pre → .standard-markdown → panel` zinciridir.
5. Uzunluk 400 ms aralıklarla ölçülür; iki ardışık eşit ve 10 karakterden uzun değer stabil kabul edilir. Üst sınırda mevcut anlamlı içerik yine korunur.
6. Her hata `icerik:null` ile yalnız ilgili artifact kaydına yansır; sıra ve diğer kartlar korunur.
7. Dış `finally`, `artifactCikarmaAktif=false` yaparak observer baskısını her koşulda kaldırır.

### `konusmayiCikar(artifactIcerikleri)` (v1.8.1 — document-order akış)
- Konteyner: `.flex-1.flex.flex-col.px-4.max-w-3xl`
- **2026-07 UI kırılması:** eski DOM'da her mesaj konteynerin ayrı bir çocuğuydu (turn döngüsü `children[i]`); yeni DOM'da TÜM konuşma `children[0]` içinde tek ağaç → turn döngüsü yalnız ilk mesajı bulup Claude yanıtlarını kaybediyordu
- **Yeni algoritma:** `konusmaAlani.querySelectorAll('[data-testid="user-message"], .font-claude-response')` — querySelectorAll document-order garantilidir, eski turn-bazlı DOM'da da aynı sırayı verir (geriye uyumlu). Nested guard: elemanın `parentElement.closest()`'i başka bir mesaj elemanına çıkıyorsa atla
- **`.font-claude-response` TAM class:** `[class*="font-claude-response"]` substring'i yanıt içindeki arbitrary-variant class'larda (`[&_...]:font-claude-response`) 36 sahte eşleşme veriyordu; CSS class selektörü token-eşleşmesi yapar (gerçek yanıt wrapper'ları)
- **Kullanıcı:** `[data-testid="user-message"]` → html/metin/resimler üçlüsü ("You said:" sr-only prefix'i elementin DIŞINDA — sızmaz)
- **Claude:** içindeki TÜM `.standard-markdown` blokları birleştirilir (`birlesikHtml += resimliHtmlCikar`, `birlesikMetin += temizMetinCikar` `\n\n` ile); hiç yoksa claudeEl'in kendisi. Tool-call accordion metinleri ("Created a file...") yalnız `.standard-markdown` dışında kalır
- **Artifact eşleştirme:** yanıt içindeki `.artifact-block-cell` sayısı kadar, global `artifactSayaci` ile önceden çıkarılmış listeden sıralı atanır; `artifactlar` alanı yalnız doluysa konur (artifact kartı yeni UI'da da yanıt elementinin descendant'ı — eşleşme korunur)
- Başlık: `[data-testid="chat-title-split"]` (yeni UI header başlığı) → eski sidebar selektörleri (`a[aria-current="page"]` vb. — 2026-07 UI'da `<a href="/chat/">` linkleri tamamen kalktı) → doc.title → `'Claude Konuşması'`

### Mesaj dinleyicisi
`konusmayiCikar` yolu popup için artifact'ları da çıkarır (v1.3.0 kritik düzeltmesi) ve **reentrance kilidine tabidir** (sayfa içi akışla paralel artifact döngüsü viewer'ı çakıştırır).

---

## 12. ChatGPT Content Script (v2.0.3 — “wm” + eski UI + Çalışma/Canvas)

- Buton: `paylasButonunuBul(header)` önce `button[aria-label="Paylaş"/"Share"]`, sonra görünür buton metnini kullanır. Bulunursa Paylaş'ın aynı parent'ına `insertBefore`; bulunamazsa header yapısına zorla gömülmeden `floatingButonEkle()` çağrılır. Floating düğme `top:72px; right:18px`, 42×42 px, görünür gölge/odak halkası taşır; değişken header eylemleriyle sabit 64/240 px tahmin üzerinden çakışmaz.
- **Turn keşfi:** `chatgptTurnleriBul()` önce `main [data-chatgpt-search-unit-key]` akışını kullanır; bulunmazsa `CHATGPT_TURN_SELEKTORU = '[data-testid^="conversation-turn"], li[data-message-role]'` ile eski DOM yapılarına döner.
- **Rol tespiti `chatgptTurnRolu(turn)`:** önce li'nin kendisinde `data-message-role` (yeni wm DOM), yoksa descendant `[data-message-author-role]` (eski DOM); ikisi de yoksa null → turn atlanır
- **İçerik elementi `chatgptIcerikElemani(turn, rol)`:** user → `[data-user-message-bubble]` → `.user-message-bubble-color` → `[data-message-author-role="user"]` → `chatgptTurnGovdesi`; assistant → `[data-assistant-markdown]` → `.markdown` → `[data-message-author-role="assistant"]` → `chatgptTurnGovdesi`. Gövde fallback'i `data-message-actions`/`data-message-supplement` taşımayan ilk DIV çocuğu — sr-only `h4[data-message-attribution]` ("Şunu dedin:"/"ChatGPT:") sızmaz
- **Sanallaştırma scroll-süpürmesi (`konusmayiCikar(ilerlemeBildir)`):** uzun konuşmada görünmeyen turn'ler DOM'dan düşebilir. `chatgptKaydiriciBul` kaydırılabilir ancestor'ı veya belge kökünü bulur; yükseklik 1,5 viewport'u aşarsa konum kaydedilir, en üste gidilir ve %75 viewport adımlarıyla gerçek dibe kadar ilerlenir. Eski sessiz `maks 120 adım` sınırı kaldırılmıştır; çok uzun konuşmanın son kısmı kırpılmaz. Sonsuz döngü koruması, kaydırma yüzeyinin üç ardışık adımda ilerlememesi koşuludur. Her dilim UUID/testid/parmak izi anahtarlı `Map` ile mükerrersiz işlenir; `finally` kullanıcının scroll konumunu geri yükler.
- Başlık: `nav a[href^="/c/"][data-active="true"]` | `.bg-token-sidebar-surface-secondary` | `[aria-current="page"]` → doc.title → `'ChatGPT Konuşması'`
- Streaming kontrolü: yalnız görünür `button[data-testid="stop-button"]` / Durdur-Stop aria-label, görünür `.result-streaming` veya `[data-message-status="in_progress"]`. `data-assistant-content-started` ve `data-message-complete` karar dışıdır; ilki tamamlanmış mesajda kalabilir, ikincisi hiç gelmeyebilir. Toast renkleri: başarı `#10a37f`, hata `#ef4444`.

### ChatGPT Çalışma/Canvas artefakt çıkarımı (v2.0.1)

`chatgptArtifactAdaylariniBul(turn)`, güncel dosya atıflarını `button[data-file-citation-primary-file-id]` ve `button[data-file-citation-group-identity]` üzerinden, eski Canvas/artefakt düğmelerini `data-testid*="canvas"|"artifact"` üzerinden toplar. Erişilebilir adı metin tabanlı bir dosya uzantısıyla biten açık dosya kartları ayrıca geri dönüş olarak alınır. Dosya kimliği olan kayıtlar kimlikle, kimliksiz kartlar Türkçe locale ile küçültülmüş başlıkla tekilleştirilir; böylece aynı dosyanın metin atfı ve büyük kartı iki kez yazılmaz.

Her aday için `chatgptArtifactButonunuBul()` sanallaştırma sonrası güncel DOM düğmesini yeniden bulur. `chatgptArtifactPaneliniBul()` güncel `section[data-testid="screen-threadFlyOut"]` panelini başlığa göre doğrular; eski Canvas/artefakt dialog, section ve aside geri dönüşlerini de kabul eder. Panelde `Kod|Code|Kaynak|Source` sekmesi varsa seçilir. İçerik öncelik zinciri: `[id^="artifact-"][id*="-source:"] .cm-content > code` → `.cm-content > code` → artifact/canvas source-content `data-testid` → `.ProseMirror` → contenteditable → textarea → `pre > code` → `pre` → yalnız aynı-origin ise iframe metni. Güncel `web-sandbox.oaiusercontent.com` önizlemesi cross-origin olduğundan kaynak sekmesi kanonik yoldur.

`chatgptArtifactIcerigininKararlilasmasiniBekle()` içeriği 250 ms aralıkla ölçer ve iki ardışık ölçüm birebir eşit olmadan kaydı tamamlamaz; üst sınır 6 saniyedir. Her dosya kendi `try/catch` sınırındadır: başarısız dosya `{baslik,tur,icerik:null}` olarak korunur, diğerleri devam eder. Dış `finally`, başlangıçta panel yoksa eklentinin açtığı paneli `data-testid="close-button"`/eski close geri dönüşüyle kapatır; panel önceden açıksa dosya başlığı ve Kod/Önizleme sekmesini geri yükler. Konuşma scroll konumu dış süpürme `finally` bloğunda ayrıca geri yüklenir.

## 13. Grok Content Script

- **Floating buton:** React reconciliation riskine karşı `document.body` düzeyinde, `position:fixed; top:72px; right:18px`, 42×42 px, yüksek kontrastlı ve klavye odağı görünür bir düğmedir. Sabit `right:240px` tahmini kaldırıldığı için farklı pencere genişliklerinde site eylemleriyle çakışmaz.
- `konusmayiCikar()` ilk olarak güncel sözleşmenin kesin balonlarını tarar: `[data-testid="user-message"], [data-testid="assistant-message"]`. Bu sonuç yeterliyse geniş heuristiklere hiç girilmez. Kapsayıcı/nested mükerrerler filtrelenir.
- `grokMesajRolu(el)` kesin `data-testid` değerini önce, ardından data attribute, aria-label ve geriye uyumlu class kalıplarını kullanır. Rol bulunamazsa eski arayüzler için alternating fallback korunur.
- İçerik seçiminde kesin `[data-message-content]`, `.markdown` ve `.prose` hedefleri geniş substring class aramasından önce gelir. Bu, UI araçlarının konuşma metni sanılma riskini düşürür.
- Console tanısı yalnız strateji adı, aday sayısı, tag ve kısa class yapısını kaydeder; konuşma metninin ilk karakterleri artık loglanmaz. Kullanıcı hata metni F12/log gönderme işi istemez, doğrudan anlaşılır çıkarma hatası verir.
- Tema: koyu gri `#1f2937`; toast başarı koyu gri, hata `#dc2626`

---

## 14. Background Service Worker

Service worker ilk satırda `importScripts('site-yardimcilari.js')` çağırır. Popup ile background aynı `DESTEKLENEN_SITELER` ve `desteklenenSiteBilgisi()` sözleşmesini kullanır; destek kontrolü URL içinde metin aramasıyla yinelenmez.

**`yazdirmaSayfasiAc` mesajı:** `oturumKimligi`, background'a özgü aynı `[A-Za-z0-9-]`, 8–80 karakter allowlist'iyle doğrulanır. Geçersiz kimlikte sekme açılmaz ve `{basari:false}` döner. Geçerliyse `yazdir.html?oturum=<encodeURIComponent>` oluşturulur. Açılan tab kimliği `chrome.storage.session['aiChatPrinterOnizlemeSekmesi:<UUID>']` altında 30 saniyelik eşleme olarak tutulur; aynı mesajın yanıtı kaybolup yeniden gelirse mevcut sekme etkinleştirilir, ikinci önizleme açılmaz. Eski eşleme yeniden kullanılmaz. `chrome.tabs.create/update` tamamlanana kadar mesaj kanalı `return true` ile açık tutulur.

**Ctrl+Shift+P komutu (`yazdir-kisayol`):** aktif sekme `chrome.tabs.query({active:true,currentWindow:true})` ile alınır. `new URL()` sonucu HTTPS ve hostname tam olarak dört destekli değerden biri değilse kırmızı `!` badge gösterilir. `example.invalid/?next=https://chatgpt.com` gibi substring saldırıları destekli sayılmaz. Destekli sekmeye `{islem:'klavyeKisayoluYazdir'}` gönderilir. İçerik betiği eski/yoksa sekme otomatik `chrome.tabs.reload` edilir; 300 ms aralıkla `baglantiSaglik` yanıtı beklenir ve komut kullanıcıdan F5 istenmeden yeniden gönderilir.

**Kalıntı temizliği:** `YAZDIRMA_OTURUM_AZAMI_YASI = 6 saat`. Başlangıçta ve worker uyanışında eski global anahtarlar ile tarihi geçersiz veya 6 saatten eski `aiChatPrinterOturum:*` paketleri silinir. Büyük paket önizleme sekmesi kapanınca `tabs.onRemoved` ile temizlenir. `onInstalled` install/update sırasında tüm eski paketleri temizler. Güncel ve henüz sahiplenilmemiş paketler worker yeniden başladığında korunur; MV3 worker yaşam döngüsü veri kaybına yol açmaz.

**Install/update tazelemesi:** `desteklenenSekmeleriYenile()`, `DESTEKLENEN_SITELER` anahtarlarından dört HTTPS pattern üretir ve yalnız bu hostlardaki açık, discard/frozen olmayan sekmeleri reload eder. Bu yol, Chrome'un aktif content script'i update için engel saymaması nedeniyle açık sayfada kalan eski extension context'ini yeni sürümle değiştirir. `tabs/history/scripting` izni kullanılmaz; dört dar host izni URL filtreli sorgu için yeterlidir.

---

## 15. Popup

**Dosya ayrımı:** Yapı `popup.html`, görünüm `popup.css`, davranış `popup.js` içindedir. Inline stil ve inline script yoktur. Script sırası `site-yardimcilari.js → ortak-yardimcilar.js → popup.js` biçimindedir.

**Tasarım sistemi:** 390 px sıcak kâğıt zemini, koyu mürekkep başlık, vermilyon vurgu ve Georgia/Tahoma hiyerarşisi kullanılır. “İçerik” ile “Sayfa” iki net karttır. Toggle'lar native checkbox semantiğini korur; select alanlarının görünür label'ı vardır. Tüm eylemlerde `:focus-visible`, `aria-live` durum metni ve `prefers-reduced-motion` desteği bulunur.

**Ayar yüzeyi:** Kod blokları, belge imzası, bağlantı adresleri, yazı boyutu, kâğıt boyutu, yön, kenar boşluğu ve otomatik yazdırma. `ayarlariFormdanOku()` ham UI değerlerini `ayarlariDogrula()` üzerinden geçirir; `ayarlariFormaYansit()` yalnız doğrulanmış değerleri gösterir. Her değişiklik `ayarlariKaydet()` ile tek sözleşmeye yazılır.

**Site durumu:** Aktif sekme `desteklenenSiteBilgisi()` ile tam-hostname doğrulanır. Destekli sayfada yeşil nokta ve “Claude konuşması hazır” benzeri durum görünür. Desteksiz veya eklenti sayfasında native `disabled` ile düğme devre dışı bırakılır; işlem anında ayrıca `aria-busy` kullanılır.

**Önizleme akışı:** Düğme busy durumuna geçer → `popupSekmeyeMesajGonder` content script'ten `konusmayiCikar` ister → eski bağlamda sekmeyi otomatik reload eder ve `baglantiSaglik` sonrasında aynı isteği sürdürür → hata/boş konuşma/quota denetlenir → doğrulanmış ayarlarla UUID paketi oluşturulur → `arkaPlanMesajiGonder` ile background'a yalnız oturum kimliği gönderilir. Background başarısızsa yazılan paket geri silinir. Başarılı açılışta popup kapanacağı için düğmeyi tekrar etkinleştirmek gerekmez; hata yollarının tamamı UI durumunu geri yükler.

---

## 16. Yazdırma Sayfası

### HTML ve kontrol yüzeyi

`yazdir.html` tek bir sticky `.uygulama-kontrolleri` başlığı kullanır; eski iki sabit çubuğun üst üste binme ve içerik marjı hesaplama bağı kaldırılmıştır. İlk satır marka/özet ile Yazdır, Markdown, Metin, MD, TXT, HTML, JSON ve Kapat eylemlerini; ikinci satır canlı sayfa/içerik ayarlarını taşır. Dar görünümde iki satır da `flex-wrap` ile sarılır, yatay kaydırma veya sağdaki kontrollerin kesilmesi yoktur.

Canlı ayarlar: `canliYaziBoyutu`, `canliKagitBoyutu`, `canliYonlendirme`, `canliKenarBosluk`, `canliKodBloklari`, `canliFooterGoster`, `canliLinkAdresleri` ve `mesajSecimModu`. Seçim modu açılınca `tumunuSecKaldir`, `yalnizKullaniciSec`, `yalnizYapayZekaSec` ile sayaç görünür. Kontroller semantic `button/select/input`, görünür label, `role=toolbar/group` ve `aria-live` kullanır.

Script sırası `site-yardimcilari.js → ortak-yardimcilar.js → yazdir.js` biçimindedir. `<style id="dinamikSayfaStili">`, doğrulanmış sayfa ayarını çalışma anında `@page { size: <kâğıt> <yön>; margin: <ölçü>; }` kuralına dönüştürür:

| Ayar | Kabul edilen değer | Baskı karşılığı |
|---|---|---|
| Kâğıt | `A4`, `A3`, `Letter` | `@page size` |
| Yön | `portrait`, `landscape` | `@page size` ikinci bileşeni |
| Kenar | `dar`, `normal`, `genis` | sırasıyla `1cm`, `2cm 1.5cm`, `2.7cm 2.2cm` |
| Yazı | `11`, `13`, `15`, `17` | `#yazdirmaAlani.style.fontSize` |

### Veri alma ve F5 dayanıklılığı

1. URL'deki `oturum` parametresi `yazdirmaOturumKimligiGecerliMi` ile doğrulanır. Parametre var ama geçersizse eski global anahtara düşülmez; sahte parametrenin başka paketi okutması engellenir.
2. Geçerli UUID için yalnız `aiChatPrinterOturum:<UUID>` okunur. 4 MB altındaki paket hemen silinir; büyük paket F5 için local depoda tutulur.
3. Küçük paket `sessionStorage['aiChatPrinterYedek:<UUID>']` içine yazılır. F5'te küçük paket bu yedekten, büyük paket local depodan okunur.
4. Konuşma veya mesaj dizisi yoksa yükleme kapanır; çıktı ve ayar kontrolleri kilitlenir, “Önizleme kullanılamıyor” durumu gösterilir, Kapat/Escape etkin kalır. Geçersiz oturum parametresi eski global paketi okuyamaz veya silemez.
5. Paket ayarları `ayarlariDogrula` ile normalize edilir; `mevcutAyarlar` render, yazdırma ve bütün dışa aktarımların tek kaynağı olur.

### Render ve seçim

Kaynak görünümü `kaynakSiteBilgisi(mevcutKonusma.kaynak)` ile alınır. Başlık, tarih, sayı ve hostname yalnız `textContent` ile yazılır. Her mesaj `dataset.mesajIndex`, rol rozeti, seçim checkbox'ı ve sanitize edilmiş içerik taşır. Düz metin fallback'i önce escape edilir. Ek resimler yalnız `guvenliResimKaynagiMi` sonucunda eklenir; `loading=eager`, `decoding=async`, `referrerpolicy=no-referrer` uygulanır ve hata listener'ı yalnız kendi resmini gizler. Artifact içeriği `textContent` ile `pre>code` içine yazılır.

`seciliKonusmaVerisi()`, görünür mesaj indekslerine göre konuşmanın filtreli kopyasını üretir. `gecerliSecimVerisi()` sıfır mesajda bütün yazdırma/kopyalama/indirme düğmelerini devre dışı bırakır ve somut durum metni verir. Rol seçimleri DOM sırasını değiştirmez; yalnız checkbox ve `.mesaj-secilmedi` durumu güncellenir. MD, TXT, HTML, JSON ve yazdırma aynı seçim sözleşmesine uyar.

### Baskı ve dışa aktarım

`belgeResimleriniBekle()`, yalnız seçili mesajların görselleri için `complete/naturalWidth`, `decode()`, load/error ve 5 saniye üst sınırını birleştirir. Manuel ve otomatik yazdırma `yazdirmayaHazirlaVeYazdir()` üzerinden geçer; seçilmeyen büyük görseller baskıyı bekletmez ve geç yüklenen görseller yüzünden eksik ilk baskı oluşmaz.

- Markdown: `konusmayiMarkdowneDonustur(veri, mevcutAyarlar.footerGoster)`.
- Metin: `konusmayiDuzMetneDonustur(veri, mevcutAyarlar.footerGoster)`.
- JSON: yalnız seçili konuşma nesnesi, iki boşluk girintili UTF-8.
- HTML: `document.implementation.createHTMLDocument` ile yeni belge kurulur; kontrollü CSS ve dinamik `@page` eklenir, sanitize edilmiş `#yazdirmaAlani` klonu `importNode` ile taşınır. Konuşma başlığı HTML string'ine birleştirilmez. Seçilmeyen mesajlar, checkbox'lar ve kapalı kod/artifact içerikleri dosyaya girmez.
- Dosya adı: `guvenliDosyaTemeli`, başlığı yeniden temizler; uzantı eklenmeden önce boş/yasaklı değerleri engeller.

## 17. HTML Sanitizer

`htmlTemizle(htmlString) -> HTMLDivElement`, girdiyi `DOMParser` ile inert belgeye ayrıştırır ve her düğümü yeni DOM node'u olarak kurar. Kaynak HTML hiçbir aşamada çıktı konteynerine doğrudan atanmaz.

**İzinli yapısal etiketler:** `P H1-H6 UL OL LI PRE CODE STRONG B EM I U BR TABLE THEAD TBODY TR TH TD TFOOT CAPTION BLOCKQUOTE A SPAN DIV HR SUP SUB IMG FIGURE FIGCAPTION DEL S MARK SMALL KBD SAMP VAR DL DT DD`.

**Tamamen atlanan etiketler:** `SCRIPT STYLE NOSCRIPT TEMPLATE IFRAME OBJECT EMBED BUTTON SELECT TEXTAREA SVG CANVAS AUDIO VIDEO MAT-ICON`. Bilinmeyen kabuk etiketi atılır fakat güvenli çocukları rekürsif işlenir.

**Attribute sözleşmesi:**

- Kaynak sitenin class listesi taşınmaz. Yalnız `PRE` ve `CODE` düğümlerindeki `language-*` token'ları regex allowlist'inden geçerek korunur. Böylece kaynak `mesaj-secilmedi`, utility veya dahili UI sınıfıyla önizleme davranışı değiştirilemez.
- `A`: `new URL(href)` ile yalnız mutlak `http:`, `https:`, `mailto:`, `tel:` bağlantıları kabul edilir; göreli/bozuk değerler reddedilir. HTTP(S) için `target=_blank` ve `rel=noopener noreferrer`.
- `IMG`: yalnız raster `data:image/(png|jpeg|jpg|gif|webp)` veya HTTPS. SVG data URI, blob, javascript ve bilinmeyen MIME reddedilir. Kabul edilen resim eager/async/no-referrer nitelikleriyle kurulur.
- Başlık, alt metin ve bütün kullanıcı görünür değerleri property/`textContent` ile atanır; event attribute veya inline stil kopyalanmaz.

## 18. Yazdırma Stilleri

Tasarım dili sıcak kâğıt (`#fffdf8`), koyu mürekkep (`#172630`) ve vermilyon vurgu (`#c54a3d`) üçlüsüdür. Georgia başlıklarda, sistem sans-serif kontrollerde, Consolas kodda kullanılır. Görsel hiyerarşi site markasını taklit etmez; kaynak rolü yalnız rozet ve sol çizgi rengiyle belirtilir.

Ekranda araç yüzeyi sticky, belge yüzeyi gerçek kâğıt oranını çağrıştıran gölgeli bir karttır. `max-width:1080px` altında ana eylemler ve ayarlar satıra sarılır; `max-width:680px` altında export grupları bağımsız düğmelere dönüşür, belge padding'i küçülür. Klavye odağı 3 px görünür halka taşır. `prefers-reduced-motion:reduce` tüm animasyon/geçiş sürelerini etkisizleştirir.

Yazdırmada uygulama kontrolleri, overlay, toast ve seçim UI'ı yok edilir. Uzun `.mesaj-blogu` ve `.mesaj-icerigi` blokları sayfalar arasında bölünebilir; eski `page-break-inside:avoid` kaynaklı yarım boş sayfa davranışı kaldırılmıştır. Paragraf ve listelerde `orphans/widows:3`; `thead` için `table-header-group`; satır ve görseller için `break-inside:avoid` kullanılır. Tablolar baskıda `table-layout:auto`, kod `pre-wrap` olur. Bağlantı URL'si yalnız `linkAdresleriniGoster` açıksa `::after` ile basılır. Footer `footerGoster` kapalıysa ekran, baskı ve bütün metinsel dışa aktarımlarda birlikte yoktur.

---

## 19. Mesajlaşma Protokolü

| `islem` | Yön | Yanıt | Kanal kuralı |
|---------|-----|-------|--------------|
| `arkaPlanSaglik` | popup/content → background | `{basari:true,surum}` senkron | service worker uyanma/bağlantı kontrolü |
| `baglantiSaglik` | popup/background → content | `{basari:true,kaynak}` senkron | reload sonrası yeni içerik bağlamı doğrulaması |
| `yazdirmaSayfasiAc` | content → background | `{basari:true}` veya `{basari:false,hata}` **asenkron** | `tabs.create` tamamlanana kadar `return true` |
| `konusmayiCikar` | popup → content | konusmaVerisi VEYA `{hata, mesajlar:[]}` **asenkron** | bu dalda `return true` |
| `klavyeKisayoluYazdir` | background → content | `{basari:true}` senkron | `return false` |

**ALTIN KURAL (v1.7.0'ın en sinsi bug'ı):** `onMessage` listener'ında `return true` **mesaj yoluna özeldir, listener'a değil**. Koşulsuz `return true` + yanıt göndermeyen yol = gönderen tarafta "message port closed before a response was received" üretir. v2.0.2 bu hatayı ayrıca otomatik reload/sağlık-ping zinciriyle kurtarır; yine de gereksiz açık kanal bırakılmaz. Her content script listener'ı şu iskelettedir:

```javascript
chrome.runtime.onMessage.addListener((mesaj, gonderen, yanitGonder) => {
    if (mesaj.islem === 'baglantiSaglik') {
        yanitGonder({ basari: true, kaynak: 'site' });
        return false;
    }
    if (mesaj.islem === 'konusmayiCikar') {
        (async () => {
            // (Claude: streaming + reentrance ön kontrolleri yanitGonder({hata...}) ile)
            resimIslemOturumuBaslat(RESIM_TOPLAM_SURE_LIMIT);
            try { yanitGonder(await konusmayiCikar(/*claude: artifact'lı*/)); }
            catch (hata) { yanitGonder({ hata: 'Konuşma çıkarılamadı: ' + hata.message, mesajlar: [] }); }
            finally { resimIslemOturumuBitir(); }
        })();
        return true;                                   // YALNIZ bu async dal
    }
    if (mesaj.islem === 'klavyeKisayoluYazdir') {
        yazdirmaBaslat();
        yanitGonder({ basari: true });                 // background await'i temiz kapanır
    }
    return false;
});
```

---

## 20. Storage Mimarisi

| Depo | Anahtar | İçerik | Yaşam döngüsü |
|---|---|---|---|
| `chrome.storage.sync` | `kullaniciAyarlari` | Doğrulanmış 8 ayar | Değişince kaydedilir; cihazlar arası kullanıcı tercihi |
| `chrome.storage.local` | `aiChatPrinterOturum:<UUID>` | `{konusmaVerisi,yazdirAyarlari,olusturmaZamani,veriBoyutu}` | Küçük paket okununca silinir; büyük paket F5 için sekme kapanana kadar tutulur |
| `chrome.storage.session` | `aiChatPrinterOnizlemeSekmesi:<UUID>` | Önizleme tab kimliği + oluşturma zamanı | 30 saniyelik idempotent yeniden deneme; konuşma içermez |
| `sessionStorage` | `aiChatPrinterYedek:<UUID>` | 4 MB altındaki konuşma ve ayar paketi | Küçük paket için sekme/oturum özel F5 yedeği; sekme kapanınca biter |
| `sessionStorage` | `aiChatPrinterBaglantiKurtarmaV1` | `{zaman,deneme,otomatikDevam}` | Desteklenen sayfada tek reload/otomatik devam kilidi; en fazla 60 saniye |

Paket boyutu `Blob(JSON.stringify(veri)).size` ile UTF-8 bayt olarak hesaplanır. Manifest'teki `unlimitedStorage` izni 10 MB yerel depo kotasını kaldırır; büyük paketlerde yalnız performans uyarısı verilir. İzin bulunmayan eski kurulumlarda `chrome.storage.local.QUOTA_BYTES` veya 10 MB geri dönüş değeri aşılırsa işlem durur.

Oturum kimliği üretiminde `crypto.randomUUID()` önceliklidir. Kimlik hem üreten yardımcıda, hem önizlemede, hem background'da allowlist ile doğrulanır. Bu üçlü doğrulama; URL parametresi, storage key ve sekme açma sınırlarını aynı sözleşmede tutar.

UUID anahtarları eşzamanlı önizlemeleri ayırır. Küçük paket okununca silinir ve F5 için sekmeye özel `sessionStorage` kullanılır. Büyük paket F5 için yerel depoda kalır; önizleme sekmesi kapanınca kaldırılır. Sahipsiz paketler `olusturmaZamani` üzerinden 6 saat TTL ile temizlenir; install/update eski sürüm kalıntılarını kaldırır.

## 21. Güvenlik ve Gizlilik Modeli

| Katman | Uygulanan önlem |
|---|---|
| İzin minimizasyonu | API: yalnız `activeTab`, `storage`, `unlimitedStorage`, `clipboardWrite`; `tabs/history/cookies/downloads/scripting` yok. Host: yalnız dört content-script hedefi, joker yok |
| Site sınırı | `new URL()` + HTTPS + tam hostname; URL substring'i, alt alan adı veya yönlendirme parametresi kabul edilmez |
| XSS render | Inert `DOMParser`, etiket allowlist'i, yeni DOM üretimi; script/event/style doğrudan taşınmaz |
| CSS davranış enjeksiyonu | Kaynak class'ları atılır; yalnız güvenli `language-*` kod sınıfı korunur |
| Resim | Raster data URI allowlist'i; HTTPS için güvenli URL, `credentials:omit`, `referrerpolicy:no-referrer`; SVG/blob reddi |
| Link | Yalnız HTTP(S), mailto ve tel; yeni sekmede `noopener noreferrer` |
| Dışa aktarım | HTML string enjeksiyonu yerine `createHTMLDocument + importNode`; dosya adı çıkış sınırında yeniden temizlenir |
| Storage | UUID izolasyonu, kimlik allowlist'i, oku-sil, sekme yedeği, 6 saat TTL |
| Özel veri | Konuşma metni Grok debug loguna yazılmaz; uzak analiz/telemetri/sunucu yok |
| CSP | `script-src 'self'; object-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'` |

`GIZLILIK.md`, Chrome Web Store beyanının teknik kaynağıdır: konuşma yalnız kullanıcı eylemiyle aktif sekmeden okunur; ayarlar dışında kalıcı kişisel veri tutulmaz; konuşma paketi üçüncü tarafa gönderilmez. Clipboard yalnız kullanıcının açık kopyalama eyleminde yazılır.

---

## 22. Eşzamanlılık ve Yaşam Döngüsü

### Reentrance kilidi — `yazdirmaIslemiSuruyor` (4 content script)
Çift tıklama / buton+kısayol kombinasyonu paralel iki çıkarma akışı başlatır: iki yazdırma sekmesi + **paylaşılan `resimIslemDeadline`'ın ilk biten akış tarafından sıfırlanması** (ikinci akış limitsiz kalır) + **Claude'da paralel artifact döngülerinin viewer'ı çakıştırması** (yanlış içerik yanlış artifact'a). Kural: girişte kontrol+set ("Yazdırma işlemi zaten sürüyor, lütfen bekleyin..." toastı), `finally`'de bırak. Claude'da popup mesaj yolu DA kilitlidir (o yol da artifact döngüsü çalıştırır).

### MutationObserver disiplinleri
- 200 ms debounce (SPA streaming'de CPU)
- `pagehide {once:true}` → `disconnect()`
- Claude: `artifactCikarmaAktif` true iken observer callback'i erken döner (viewer aç/kapa kendi tetiklediği mutasyonlarla buton enjeksiyonunu yarıştırmasın)

### Dead-handler temizliği (eklenti reload senaryosu)
Reload'da eski content script'in DOM'a koyduğu elemanlar **ölü closure'lara** bağlı kalır. Her enjeksiyon öncesi eski eleman silinir: toolbar butonu `butonuEnjekteEt` başında; cevap altı `.gp-indir-btn`'ler `baslat()` başında (`eskiIndirmeButonlariniTemizle`). Stil elementleri (`#gp-indir-stil` vb.) kalabilir — CSS ölü handler taşımaz.

### Async döngü kuralı
DOM sıralı işlendiği ve await içerdiği her yerde `for...of` — `forEach(async ...)` YASAK (sıra bozulur, paralel patlar).

---

## 23. i18n

`_locales/{tr,en}/messages.json` — 4 anahtar: `extName` ("AI Chat Printer"), `extDescription` (mağaza açıklaması), `actionTitle`, `kisayolAciklama`. Manifest `__MSG_*__` ile tüketir; `default_locale: "tr"`. Content script ve yazdırma sayfası metinleri **bilinçli Türkçe-hardcoded** (hedef kitle kararı — EK K).

## 24. İkon Üretimi

`icons/ikon_olustur.py` (geliştirme aracı): PIL ile 16/48/128 px PNG'ler üretir. 128 px sürümde resmî Web Store kılavuzuna uygun 16 px şeffaf güvenli alan içinde, Baskı Stüdyosu'nun koyu mürekkep + kâğıt + vermilyon paletini taşıyan önden görünüşlü yazıcı piktogramı bulunur. Betik 512 px ana çizimi Lanczos ile küçültür; doğrudan çalıştırıldığında üç ikonu kendi klasöründe yeniden üretir. Dağıtım paketi yalnız PNG'leri içerir, üretici betik kaynak paketinde kalır.

## 25. Versiyonlama

**Dörtlü eş-zamanlı bump kuralı:** `manifest.json version`, `README.md` rozet/changelog, `TEKNIK_DOKUMANTASYON.md` başlık/revizyon ve `GIZLILIK.md` sürüm satırı birlikte güncellenir. Popup sürümü hardcoded değildir; `chrome.runtime.getManifest().version` değerini gösterir. Otomatik kabul manifest sürümünü ve doküman dosyalarının varlığını doğrular.

| Sürüm | Özet |
|-------|------|
| 1.0–1.2 | Gemini → +Claude/artifact/resim → +ChatGPT |
| 1.3–1.4 | Ortak modül, kalıcı ayar, kısayol, pano, ticari kalite seti |
| 1.5.x | +Grok, i18n, güvenlik denetimi, Gemini streaming false-positive kaldırma |
| 1.6.x | Gemini cevap altı ↓ MD/↓ TXT + storage sertleştirme |
| 1.7.0 | Derin denetim: gerçek MD motoru, dosya indirme, sessionStorage F5, `scripting` izni kaldırma, mesaj kanalı düzeltmesi |
| 1.7.1–1.7.8 | Saatlik öz-denetim turları: UI sızıntı filtreleri (4 kanal), fence kaçışı, dinamik quota mesajı, URL `<>` sargısı, `[]` escape, spread→reduce, runtime diakritik, linkli resim düzeltmesi, reentrance kilidi |
| 1.8.0 | Yazdırma sayfası canlı ayar çubuğu (yazı boyutu/kod blokları/mesaj seçim modu), mesaj seçimi (`seciliKonusmaVerisi`), HTML + JSON dışa aktarma, `pre.remove()` → `body.kod-gizli` class'ı, dinamik popup sürüm satırı |
| 1.8.1 | claude.ai 2026-07 UI kırılması giderildi (chat-header, document-order mesaj akışı, View/Go back artifact akışı, chat-title-split başlık) + Grok `data-testid` rol tespiti — hepsi eski UI fallback'li |
| 1.8.2 | ChatGPT 2026-07 "wm" UI kırılması giderildi: çift DOM turn selektörü (`li[data-message-role]` + eski `conversation-turn`), `[data-user-message-bubble]`/`[data-assistant-markdown]` içerik zinciri, sr-only attribution sızıntı koruması, sanallaştırma scroll-süpürmesi (UUID dedup'lu Map), floating buton fallback, yeni streaming göstergesi |
| 1.8.3 | ChatGPT yazdır butonu hizalama düzeltmesi: `paylasButonunuBul` (aria-label + buton metni araması), Paylaş yanına aynı-parent insert, Paylaş yoksa header yerine floating buton, `align-self:center`+`flex-shrink:0` |
| 1.9.0 | UUID tabanlı eşzamanlı yazdırma oturumları, oturum kimlikli URL ve sekmeye özel F5 yedeği |
| 2.0.0 | Baskı Stüdyosu UX, 8 alanlı doğrulanmış sayfa sözleşmesi, rol seçimi, dinamik `@page`, güvenli DOM dışa aktarımı, tam-hostname kontrolü, 6 saat TTL, resim/Claude/ChatGPT/Grok sertleştirmesi, gizlilik beyanı, Web Store güvenli alanlı ikon ve görsel seti, TR/EN mağaza metni, yayın notları ve 14 maddelik otomatik/gerçek MV3 kabul paketi |
| 2.0.1 | ChatGPT güncel Çalışma dosyası + eski Canvas artefakt çıkarımı; dosya/başlık dedup, panel ve kaynak sekmesi doğrulama, CodeMirror/ProseMirror geri dönüşleri, kararlılık ölçümü, hata yalıtımı ve kullanıcı panel-sekme durumunun geri yüklenmesi |
| 2.0.2 | Update sonrası eski content script'i otomatik tazeleme; service worker mesaj yeniden denemesi; popup/kısayol reload+sağlık ping kurtarması; UUID→sekme idempotent önizleme; 18 maddelik gerçek MV3 kabul |
| 2.0.3 | ChatGPT kalıcı `data-assistant-content-started` false-positive düzeltmesi; yalnız görünür gerçek streaming sinyalleri; 19 maddelik kabul |

## 26. Kurulum ve Kabul Akışı

**Kurulum:** `chrome://extensions` → Geliştirici modu AÇIK → "Paketlenmemiş öğe yükle" → klasörü seç. v2.0.3, açık hedef-site sekmelerini `onInstalled` içinde otomatik tazeler; manuel F5 gerekmez.

**Değişiklik döngüsü:** kod değiştir → eklenti kartında ↻ → `desteklenenSekmeleriYenile()` hedef sekmeleri otomatik reload eder → butonla uçtan uca dene.

**Kanonik otomatik kabul:**

```powershell
python .\tests\acceptance_tests.py
```

Test önce tüm kök JavaScript dosyalarını `node --check`, bütün Python dosyalarını yerleşik `compile()` ile doğrular; manifest/sürüm/izin/script sırası/CSP, zorunlu dosya, UTF-8/mojibake ve resim olay-kimlik bilgisi-referrer sözleşmelerini tarar. Ardından geçici localhost fixture üzerinde gerçek Chrome ile sanitizer, XSS, raster resim, güvenli class, dinamik `@page`, Markdown, footer, seçim, rol seçimi, boş seçim kilidi, yalnız seçili resimlerde `decode()` bariyeri, MD/HTML indirme, canlı ayar, F5, geçersiz oturum UX'i, paralel oturum yalıtımı ve popup hostname/erişilebilirlik kabulü çalışır.

Son katmanda Playwright’ın Chromium binary’si geçici profil ile `--load-extension` üzerinden paketlenmemiş eklentiyi yükler. Service worker’ın v2.0.3 manifestini, ortak hostname sözleşmesini, gerçek `storage.sync/session` erişimini ve 6 saat TTL temizliğini doğrular. Dört dar host izniyle açık hedef sekmenin otomatik reload edildiği ve content script'in geri geldiği; aynı UUID açma isteğinin iki kez işlendiğinde tek önizleme sekmesinde kaldığı ayrıca sınanır. Gemini, Claude, ChatGPT ve Grok HTTPS istekleri yalnız test bağlamında siteye özgü fixture HTML ile route edilir; dört gerçek content script kendi düğmesini enjekte eder ve tıklama `storage.local → background.js → chrome-extension://.../yazdir.html?oturum=...` zincirini çalıştırır. ChatGPT son tamamlanmış mesajı `data-assistant-content-started` taşır fakat `data-message-complete` taşımaz; buna rağmen streaming engeline düşmeden altı mesajın tamamı çıkarılır. Geçici Chromium profili test sonunda otomatik silinir.

Kurulu kararlı Google Chrome, tarayıcı render/popup katmanında ayrıca kullanılır. Gerçek eklenti yükleme katmanında Chromium seçilmesinin nedeni ürün kısıtı değil, Chrome 137'den itibaren resmî markalı Chrome build'lerinde `--load-extension` komut satırı bayrağının kaldırılmış olmasıdır. Chromium ve Chrome for Testing bu bayrağı desteklemeye devam eder; Chrome ekibinin kanonik duyurusu: `https://groups.google.com/a/chromium.org/g/chromium-extensions/c/1-g8EFx2BBY`.

İsteğe bağlı görsel kabul `AI_CHAT_PRINTER_SCREENSHOT_DIR` ortam değişkeniyle masaüstü, 640 px dar görünüm ve popup PNG’lerini üretir; kalıcı kabulte görseller vision ile incelendikten sonra silinir.

**Açılmış dağıtım paketi kabulü:** Test dosyası çalışma alanında kalırken `AI_CHAT_PRINTER_PROJECT_ROOT` açılmış ZIP köküne yöneltilir ve `--runtime-only` kullanılır. Böylece pakette test/dokümantasyon bulunmasa bile manifest, service worker, content script ve önizleme zinciri doğrudan paket dosyalarından çalışır:

```powershell
$env:AI_CHAT_PRINTER_PROJECT_ROOT = "C:\gecici\AI-Chat-Printer-v2.0.3"
python .\tests\acceptance_tests.py --runtime-only
```

**Web Store paket sözleşmesi:** ZIP kökünde `manifest.json` bulunur. Paket yalnız manifestin çalışma anında kullandığı HTML, CSS, JavaScript, locale ve PNG ikonlarını taşır; test, dokümantasyon, üretici betik, ekran görüntüsü ve geliştirme kuralı içermez. `dist/SHA256SUMS-v2.0.3.txt` teslim edilen ZIP’in byte seviyesinde doğrulama kaynağıdır.

**v2.0.3 dağıtım read-back'i (29.09.2026):** `dist/AI-Chat-Printer-v2.0.3-webstore.zip` 98.397 bayt ve 20 girişlidir. SHA-256 değeri `B17276DF9D2FA8D14FAEA27DCE5A4A201316D1CA06F62C0F19EAA2EB398C118F` olup `dist/SHA256SUMS-v2.0.3.txt` ile birebir eşleşir. ZIP geçici klasöre açılarak `--runtime-only` çalıştırılmış, 8/8 gerçek MV3 kabulinden sonra geçici klasör silinmiştir.

## 27. Sıfırdan İnşa Adım Adım

1. Klasör + `manifest.json` (Bölüm 5 birebir) + `_locales` (Bölüm 23) + ikonlar
2. `site-yardimcilari.js` tam-hostname ve kaynak sözleşmesi
3. `resim-yardimcilari.js` (Bölüm 7 — deadline → güvenli olay bekleme → raster allowlist → canvas/fetch → dedup)
4. `ortak-yardimcilar.js` (Bölüm 8: doğrulanmış 8 ayar → UUID/kimlik → quota → Markdown/indirme)
5. `background.js` (Bölüm 14: site helper import → TTL → önizleme → kısayol)
6. `content.js` (Bölüm 10): başlat → buton → yazdırma → çıkarma → hızlı MD/TXT → listener
7. `content-claude.js` (Bölüm 11), `content-chatgpt.js` (12), `content-grok.js` (13); ortak mesaj kanalı Bölüm 19
8. `popup.html + popup.css + popup.js` (Bölüm 15)
9. `yazdir.html + yazdir.css + yazdir.js` (Bölüm 16–18: sticky kontrol yüzeyi, dinamik `@page`, seçim, güvenli render ve export)
10. `GIZLILIK.md`, README ve bu belgeyi sürümle senkronla
11. Bölüm 26'daki otomatik paket 23/23 + EK E görsel/canlı kontrol

---

## 28. v2.0.0 Kanonik Modernizasyon Sözleşmesi

Bu bölüm, önceki sürüm davranışını eksiltmeden v2.0.0'da eklenen ve bundan sonraki geliştirmelerin bozmayacağı sınırları tek yerde toplar.

### Tek doğru kaynaklar

- Site/hostname/kaynak etiketi: `site-yardimcilari.js`.
- Kullanıcı ayarı şeması ve migration: `VARSAYILAN_AYARLAR + ayarlariDogrula()`.
- Yazdırma oturumu anahtarı: `aiChatPrinterOturum:<UUID>`.
- Geçici paketin sahibi: URL'deki doğrulanmış `oturum` kimliğini taşıyan tek önizleme sekmesi.
- Dışa aktarılacak konuşma: `gecerliSecimVerisi()` üzerinden gelen `seciliKonusmaVerisi()`.
- Baskı sayfası: `sayfaAyarlariUygula(mevcutAyarlar)` ile üretilen dinamik `@page`.
- Kaynak HTML sınırı: `htmlTemizle()`; kaynak sitenin HTML'i veya class'ı doğrudan çıktı DOM'una atanmaz.

### Özellik koruma matrisi

| Önceki yetenek | v2.0.0 durumu | Ek koruma |
|---|---|---|
| Dört site desteği | Korundu | Tam-hostname ve merkezi kaynak sözleşmesi |
| Yazdırma/PDF | Korundu | Sayfa boyutu, yön, kenar ve resim hazır olma bariyeri |
| MD/TXT kopyalama/indirme | Korundu | Footer tercihi ve sıfır-seçim kilidi |
| HTML/JSON indirme | Korundu | DOM tabanlı güvenli HTML, tek seçim kaynağı |
| Gemini hızlı MD/TXT | Korundu | Mevcut buton yerleşimi ve gerçek Markdown motoru |
| Claude artifact | Korundu | Kart bazlı hata yalıtımı ve garantili viewer kapanışı |
| ChatGPT eski/yeni DOM | Korundu | Sessiz 120-adım kırpması kaldırıldı |
| Grok fallback zinciri | Korundu | Güncel kesin selektör önce, özel metin logu yok |
| Eşzamanlı UUID oturumları | Korundu | Kimlik allowlist'i ve 6 saat TTL |
| F5 yedeği | Korundu | Oturum anahtarıyla tam ayrım |
| Klavye kısayolları | Korundu | Tam-hostname background doğrulaması |

### Güncel dosya/fonksiyon haritası

| Dosya | Satır | Ana sorumluluklar |
|---|---:|---|
| `background.js` | 154 | TTL temizliği, health/onMessage, idempotent önizleme, kısayol reload/ping, install/update hedef sekme tazeleme |
| `site-yardimcilari.js` | 27 | `DESTEKLENEN_SITELER`, `desteklenenSiteBilgisi`, `kaynakSiteBilgisi` |
| `resim-yardimcilari.js` | 223 | deadline, `resimOlayiniBekle`, raster allowlist, canvas/fetch, dedup |
| `ortak-yardimcilar.js` | 571 | bağlantı sınıflandırma/retry/reload-devam, 8 ayar, UUID, quota, streaming, Markdown, indirme |
| `content.js` | 525 | Gemini mesaj/resim, bağlantı devamı ve hızlı MD/TXT |
| `content-claude.js` | 441 | Claude document-order, bağlantı devamı ve artifact yaşam döngüsü |
| `content-chatgpt.js` | 690 | çift DOM, güvenilir streaming, tam süpürme, Çalışma/Canvas çıkarımı ve panel durum geri yükleme |
| `content-grok.js` | 457 | bağlantı devamı, kesin rol seçicileri ve geriye uyumlu fallback |
| `popup.js` | 158 | otomatik reload/sağlık ping, erişilebilir durum, 8 ayar, çıkarma ve oturum açma |
| `yazdir.js` | 735 | güvenli render, hata durumu, seçim, dinamik sayfa, baskı ve dört dosya formatı |
| `tests/acceptance_tests.py` | 737 | statik, normal Chrome ve gerçek MV3 kabul katmanları; 19 kanıt |

Satır sayısı yalnız v2.0.0 keşif kolaylığı içindir; davranış sözleşmesi fonksiyon adlarıdır. Satır kayması dokümantasyon hatası sayılmaz.

### Kabul kapısı

Sürüm tamamlanmış sayılmadan `python .\tests\acceptance_tests.py` sonucu 23/23 başarılı olmalıdır. Buna ek olarak masaüstü ve 640 px dar görünüm vision ile incelenir; kontrol kesilmesi, yatay kaydırma, odak kaybı, üst üste binme veya görünmez eylem kalmamalıdır. v2.0.3 kabulinde önceki bütün katmanlara ek olarak ChatGPT kalıcı content-started false-positive regresyonu birlikte geçer.

---

## 29. v2.0.1 ChatGPT Çalışma ve Canvas Artefakt Sözleşmesi

Bu sürüm, Claude'a özgü `artifactlar[]` veri modelini değiştirmeden ChatGPT yanıtlarına genişletir. Render, Markdown, düz metin, HTML ve JSON dışa aktarım katmanları zaten aynı `artifactlar[]` sözleşmesini kullandığı için yeni siteye özel ikinci bir çıktı modeli oluşturulmamıştır.

### Canlı DOM kanıtı

15.08.2026 tarihli giriş yapılmış ChatGPT Pro “Çalışma” kabulünde tek HTML dosyası üretildi ve şu kararlı yüzeyler gözlendi:

| Amaç | Canlı işaret |
|---|---|
| Yanıt içi dosya atfı | `button[data-file-citation-primary-file-id]` + `data-file-citation-group-identity` |
| Dosya adı | Düğmenin `aria-label` değeri |
| Sağ çalışma paneli | `section[data-testid="screen-threadFlyOut"][aria-label="<dosya>"]` |
| Görünüm sekmeleri | `Kod` / `Önizleme` (`Code` / `Preview` İngilizce geri dönüşü) |
| Kaynak editörü | `div[id^="artifact-"][id*="-source:"]` içindeki CodeMirror `.cm-content > code` |
| Çapraz-origin önizleme | `iframe[title="Önizleme"]` → `web-sandbox.oaiusercontent.com` |
| Kapatma | Panel içi `button[data-testid="close-button"]` |

Iframe kaynağı aynı-origin olmadığı için içerik doğrudan okunmaz. Çıkarıcı Kod/Kaynak sekmesine geçer; editör DOM'u gelene kadar bekler ve tam kaynak metnini CodeMirror yüzeyinden alır. Bu yöntem HTML önizlemesindeki yalnız görünür metni değil, `head`, CSS ve script dâhil dosyanın tamamını korur.

### Yaşam döngüsü

1. Asistan turn'ündeki güncel dosya atıfları, dosya kartları ve eski Canvas düğmeleri toplanır.
2. Aynı dosyanın atıf/kart ikilisi dosya kimliği ve başlıkla tekilleştirilir.
3. Kullanıcının açık panel başlığı ve seçili sekmesi kaydedilir.
4. Dosya düğmesi tıklanır; doğru başlıktaki panel en fazla 4,5 saniye beklenir.
5. Kod/Kaynak sekmesi seçilir; içerik en fazla 6 saniye boyunca 250 ms aralıkla ölçülür.
6. İki ardışık ölçüm aynıysa `{baslik,tur,icerik}` kaydı oluşturulur.
7. Tek dosya hatasında `{icerik:null}` korunur ve sıradaki dosyaya geçilir.
8. Başlangıçta panel yoksa eklentinin açtığı panel kapatılır; varsa eski dosya ve sekme geri yüklenir.
9. Uzun-konuşma süpürmesinin dış `finally` bloğu kullanıcının konuşma kaydırma konumunu geri yükler.

### Gerçek MV3 kabul sözleşmesi

ChatGPT fixture'ı hem güncel hem eski yolu aynı gerçek content script içinde çalıştırır. Güncel senaryo dosya atfını tıklar, gecikmeli CodeMirror kaynağını bekler ve paneli kapatır. Eski senaryo `data-testid="canvas-open-button"` üzerinden `canvas-panel` açar, `canvas-content` metnini alır ve paneli kapatır. Önizlemede iki `.artifact-blogu`, her iki içerik, altı mesaj, kod dili sınıfı ve scroll konumu birlikte doğrulanır; kaynak sayfada açık panel kalmadığı ayrıca kabul edilir.

---

## 30. v2.0.2 MV3 Bağlantı Kurtarma Sözleşmesi

Chrome, MV3 extension update için aktif content script'i “eklenti kullanımda” saymaz. Service worker boşta kaldığında yeni sürüm kurulabilir; fakat önceden açık hedef sekmede eski isolated-world betiği kalır ve yeni background bağlamına gönderilen mesaj `Extension context invalidated`, `Receiving end does not exist` veya message-port kapanmasıyla sonuçlanabilir. v2.0.2 dört bağımsız kurtarma katmanı kurar:

1. **Kurulum/güncelleme tazelemesi:** `onInstalled` yalnız `install|update` nedenlerinde `desteklenenSekmeleriYenile()` çağırır. Dört dar host pattern'iyle bulunan açık, discard/frozen olmayan sekmeler reload edilir; yeni statik content script otomatik enjekte edilir.
2. **Service worker yeniden denemesi:** `arkaPlanMesajiGonder()` 0/150/500 ms gecikmeleriyle en fazla üç kez gönderir. Her denemede `chrome.runtime.id` ve gerçek yanıt doğrulanır; yanıtsız port başarı sayılmaz.
3. **Sayfa içi otomatik devam:** Storage/runtime bağlamı gerçekten koptuysa `aiChatPrinterBaglantiKurtarmaV1` kaydı sekmeye yazılır, sayfa bir kez reload edilir ve yeni content script `bekleyenYazdirmayiDevamEttir(yazdirmaBaslat)` ile işlemi sürdürür. Kayıt 60 saniye ömürlü ve tek denemelidir; gerçek background arızasında reload döngüsü oluşmaz.
4. **Popup/kısayol kurtarması:** `popupSekmeyeMesajGonder()` ve background `icerikBetigineMesajGonder()` ilk `tabs.sendMessage` hatasında sekmeyi kendileri yeniler; `baglantiSaglik` yanıtını en fazla 12 saniye bekler ve asıl komutu tekrar yollar.
5. **İdempotent önizleme:** Background aynı UUID için açılan tab kimliğini `chrome.storage.session` içinde 30 saniyelik zaman damgasıyla saklar. İlk yanıt açılıştan sonra kaybolsa bile yeniden gelen istek mevcut tabı etkinleştirir; mükerrer önizleme üretmez. Süresi geçen kimlik, sonradan farklı sayfaya taşınmış bir tabı etkinleştirmez.

Kabul kanıtı; iki geçici runtime hatasından sonra üçüncü denemenin başarıya ulaşması, popup'ın bir reload sonrası konuşma isteğini sürdürmesi, hedef sekmenin worker fonksiyonuyla gerçek reload olması, content button'ın geri gelmesi ve aynı UUID'nin tek tab kimliği döndürmesi şartlarını birlikte sınar.

---

## 31. v2.0.3 ChatGPT Streaming False-Positive Sözleşmesi

Canlı hata: ChatGPT yanıtı tamamlandığı hâlde yazdırma girişinde `ChatGPT henüz yanıt yazıyor. Tamamlanmasını bekleyin.` uyarısı oluştu. Kök neden, `data-assistant-content-started` işaretinin “stream başladı” anlamına gelmesine rağmen mesaj tamamlandıktan sonra DOM'da kalmasıdır. `data-message-complete` ise her UI akışında üretilmediğinden `started && !complete` çıkarımı güvenilir değildir.

Kanonik karar:

- `data-assistant-content-started` streaming sinyali değildir.
- `data-message-complete` yokluğu streaming kanıtı değildir.
- Yalnız görünür `button[data-testid="stop-button"]`, Durdur/Stop aria-label taşıyan görünür buton, görünür `.result-streaming` veya görünür `[data-message-status="in_progress"]` gerçek streaming kabul edilir.
- Attribute veya class DOM'da gizli kalırsa `offsetParent === null` nedeniyle karar dışı kalır.

Regresyon kabulü iki katmanlıdır: normal tarayıcı testinde tamamlanmış assistant `li`, yalnız `data-assistant-content-started` ile false; aynı element açık `data-message-status="in_progress"` aldığında true dönmelidir. Gerçek MV3 ChatGPT fixture'ının son tamamlanmış mesajı `data-assistant-content-started` taşır ve `data-message-complete` taşımaz; eski kod bu fixture'ı kilitlerken v2.0.3 altı mesajın tamamını önizlemeye taşır.

### Gerçek Chrome Kabulü ve AHK Fallback Zinciri

30.08.2026 tarihli giriş yapılmış gerçek Chrome profilinde browser-control bağlantısı kullanılamadı; Anayasa Madde 19/28 gereği AHK v2 + UIA fallback'i uygulandı. Tüm canlı giriş eylemleri `AiInputLockStart(5000)` / `try/finally` / `AiInputLockStop()` altında kaldı.

1. `chrome://extensions` sayfası sağ monitördeki belirli Chrome pencere kimliğiyle açıldı; iki Chrome penceresi bulunduğu için genel `ElementFromChromium("ahk_exe chrome.exe")` ilk denemede renderer seçemedi. Kök çözüm, pencereyi `ahk_id` ile sabitlemek oldu.
2. Sayfa `Uzantılarda arayın` alanında `AI Chat Printer` ile filtrelendi. Global `Güncelle` düğmesine basılmadı; yalnız ürün kartındaki `Yeniden Yükle` düğmesi UIA koordinatıyla tıklandı. Log sonucu `YENIDEN_YUKLENDI=EVET` oldu.
3. Giriş yapılmış `chatgpt.com` açıldı ve gerçek `16 Yaş Hakları` konuşması seçildi. Sayfadaki `Konuşmayı Yazdır` düğmesi tıklandı.
4. Önizleme sekmesi `chrome-extension://<id>/yazdir.html?oturum=<UUID>` adresinde açıldı; başlık `16 Yaş Hakları`, kaynak `chatgpt.com` ve mesaj sayısı **8** olarak canlı görüldü. `ChatGPT henüz yanıt yazıyor. Tamamlanmasını bekleyin.` uyarısı oluşmadı.
5. Geçici AHK, log, screenshot ve `__pycache__` artefaktları doğrulamadan sonra silindi.

**Kazanılmış değer:** Sabit UIA hedefi olmadan çoklu Chrome penceresinde genel renderer seçimi güvenilir değildir. `chrome://extensions` için doğru sıra: spesifik pencereyi `ahk_id` ile etkinleştir → sayfa aramasında ürün adını filtrele → ürün başlığının Y koordinatına en yakın `Yeniden Yükle` düğmesini seç → yalnız o kartı reload et → gerçek konuşma ve önizlemeyi geri oku. Global `Güncelle`, diğer unpacked uzantıları ve browser-control köprüsünü de yeniden yükleyebileceği için kullanılmaz.

---

## EK A — Edge Case'ler ve Özel Durumlar

| Durum | Davranış |
|-------|----------|
| Konuşma konteyneri bulunamadı | `{hata: 'Konuşma bulunamadı. Bir X sohbeti açık olduğundan emin olun.', mesajlar: []}` |
| Çıkarma sırasında exception | Sayfa içi: hata toastı; popup yolu: `{hata: 'Konuşma çıkarılamadı: ' + message}` — popup asla yanlış "yüklenmemiş" demez |
| AI yanıt yazarken yazdırma | Claude/ChatGPT/Grok: engellenir + uyarı; **Gemini: engellenmez** (false positive geçmişi) |
| ChatGPT tamamlandı ama `data-assistant-content-started` kaldı | Streaming sayılmaz; yalnız görünür Stop/result-streaming/in_progress sinyali engeller |
| Çift tıklama | Reentrance kilidi — "işlem zaten sürüyor" toastı |
| Eklenti reload/update + eski sekme | Install/update hedef sekmeyi otomatik yeniler; popup/kısayol ping sonrası işlemi sürdürür; sayfa içi akış bir kez reload+otomatik devam eder |
| Yazdırma sekmesinde F5 | Küçük paket `sessionStorage`, büyük paket `chrome.storage.local` üzerinden geri yüklenir |
| İki sekmede art arda yazdır | UUID anahtarları her sekmenin yalnız kendi verisini okumasını sağlar |
| 10 MB'tan büyük konuşma | `unlimitedStorage` ile aktarılır; %80 üstü yalnız konsol bilgisi |
| 90 sn'den uzun resim işleme | Deadline — kalan resimler atlanır/URL'e düşer, akış asılı kalmaz |
| Tek resim 5 sn'de yüklenmedi | O resim fetch fallback'ine, o da olmazsa https-URL/atlama |
| Cross-origin canvas taint | 3 katmanlı fallback (Bölüm 7) |
| Artifact viewer açılmadı/içerik gelmedi | `icerik:null` → render'da "(Artifact içeriği çıkarılamadı)" |
| ChatGPT Çalışma önizleme iframe'i cross-origin | Kod/Kaynak sekmesi seçilir; `.cm-content > code` kaynağı okunur, iframe erişimi zorlanmaz |
| ChatGPT artefakt çıkarılırken kullanıcı paneli açıktı | Başlangıç dosya başlığı ve seçili sekme kaydedilir; dış `finally` ikisini geri yükler |
| Grok DOM'u tanınamadı | Kesin `data-testid` → anlamsal fallback → alternating rol; hata konuşma metni/log gönderme talebi içermez |
| Kod bloğu içinde ``` | `mdFenceUret` daha uzun fence seçer |
| URL'de `()` veya boşluk | `<url>` sargısı |
| Soru/alt metninde `[ ]` | Escape (yalnız düz metin bağlamında) |
| `prefers-...`/bilinmeyen kaynak değeri | Generic `ai` teması |
| Boş mesaj / yalnız görsel mesaj | "(Boş mesaj)" / "(Bu mesajda yalnızca görsel içerik var)" placeholder'ları |

## EK B — Encoding ve Türkçe Diakritik Kuralları

- Tüm dosyalar **UTF-8 (BOM'suz)**; HTML'lerde `<meta charset="utf-8">`
- İndirme MIME'ları: `text/markdown;charset=utf-8`, `text/plain;charset=utf-8`
- **Kullanıcıya görünen/teslim edilen HER metin tam diakritikli** (Anayasa Madde 11): "Yazdırma Önizleme", "Yazdır", "Konuşma:", "alınamadı", "Bu çıktı ... oluşturulmuştur." — ASCII transliterasyon YASAK. Dosya adlarında da diakritik korunur (NTFS Unicode)
- Doğrulama kalıbı: dosya byte'ları `bytes.decode('utf-8')` ile hatasız çözülmeli; U+FFFD replacement karakteri ve çift-kodlama kalıpları (UTF-8 byte'larının Latin-1 yorumlanmış görünümleri) taraması 0 eşleşme vermeli (Madde 12 protokolü — tarama karakterleri bu belgeye literal yazılmaz, yoksa tarama kendi tarifini bulur)
- İstisnalar: kod tanımlayıcıları İngilizce-karaktersiz camelCase Türkçe (`butonEnjekteEdildi`); buton kısaltmaları `↓ MD` / `↓ TXT` (format adı, transliterasyon değil)

## EK C — DOM Selektör Master Tablosu

Kırılganlık: 🟢 attribute/custom-element (dayanıklı) · 🟡 anlamsal class · 🔴 utility-class/pozisyon (site güncellemesinde ilk kırılacaklar).

### Gemini
| Amaç | Selektör | K |
|------|----------|---|
| Konuşma konteyneri | `.chat-history-scroll-container` | 🟡 |
| Mesaj turn'leri | `user-query`, `model-response` | 🟢 |
| Kullanıcı metni | `.query-text` → `.user-query-bubble-with-background` → `.query-content` | 🟡 |
| AI metni | `.markdown` → `.response-content` → `message-content` | 🟡 |
| Toolbar | `.top-bar-actions .right-section` | 🟡 |
| Cevap action bar | `message-actions` → `.response-actions-container` → `.message-actions` | 🟢→🟡 |
| Sidebar aktif | `conversations-list a.selected` / `a[aria-current="page"]` / `a.active` | 🟡 |

### Claude (v1.8.1 — 2026-07 UI; her satırda yeni → eski fallback)
| Amaç | Selektör | K |
|------|----------|---|
| Header | `[data-testid="chat-header"]` → `[data-testid="page-header"]`; içinde `#dframe-header-actions-slot` → `.flex.w-full.items-center.justify-between` | 🟢→🔴 |
| Kullanıcı | `[data-testid="user-message"]` | 🟢 |
| Yanıt | `.font-claude-response` TAM class (`[class*=]` substring arbitrary-variant'larda sahte eşleşir) → `.standard-markdown` (descendant) | 🟡 |
| Mesaj akışı | `querySelectorAll('[data-testid="user-message"], .font-claude-response')` document-order (turn döngüsü 2026-07'de öldü — tüm konuşma `children[0]` tek ağaç) | 🟢 |
| Başlık | `[data-testid="chat-title-split"]` → sidebar linkleri (öldü) → doc.title | 🟢 |
| Artifact kart/başlık/tür | `.artifact-block-cell` / `.leading-tight.line-clamp-1` / `.text-text-400.line-clamp-1` | 🟡→🔴 |
| Artifact aç | kart grubu `[class*="group/artifact-block"]` içi `button[aria-label^="View"]` → `closest('[role="button"]')` | 🟢→🟡 |
| Artifact viewer/içerik | `#wiggle-file-content` → `.code-block__code` \| `pre` \| `.standard-markdown` \| panel | 🟢→🟡 |
| Viewer kapat / Share | `button[aria-label="Go back"]` → `"Close"` / `[data-testid="wiggle-controls-actions-share"]` → `textContent === 'Share'` | 🟢/🟢 |

### ChatGPT (v2.0.1 — 2026 Çalışma + "wm" + eski Canvas/turn geri dönüşleri)
| Amaç | Selektör | K |
|------|----------|---|
| Turn | `main [data-chatgpt-search-unit-key]` → `li[data-message-role]` (id = mesaj UUID) → `[data-testid^="conversation-turn"]` + `[data-message-author-role]`; eski yapılar `CHATGPT_TURN_SELEKTORU` ile bulunur | 🟢 |
| Kullanıcı balon | `[data-user-message-bubble]` (içinde `p[data-user-message-copy]`) → `.user-message-bubble-color` | 🟢→🟡 |
| AI metin | `[data-markdown-text-style]` → `[data-assistant-markdown]` → `.markdown` | 🟢→🟡 |
| sr-only attribution (SIZINTI) | `h4[data-message-attribution]` — içerik elementi zinciri + `chatgptTurnGovdesi` bunları dışlar | 🟢 |
| Streaming | görünür `stop-button` / Durdur-Stop, `.result-streaming`, `[data-message-status="in_progress"]`; content-started/complete karar dışı | 🟢 |
| Paylaş | `button[aria-label="Paylaş"], button[aria-label="Share"]` (yeni UI'da mesaj bazlı `[data-share-message]`; header yoksa floating buton) | 🟢(2 dil) |
| Sidebar aktif | `nav a[href^="/c/"][data-active="true"]` vb. 3'lü → doc.title | 🟡 |
| Sanallaştırma | scroll-süpürme: kaydırılabilir ancestor + `clientHeight×0.75` adım + UUID dedup Map + scroll konumu geri yükleme | — |
| Çalışma dosya atfı | `button[data-file-citation-primary-file-id]` / `button[data-file-citation-group-identity]` → uzantılı `button[aria-label]` | 🟢 |
| Çalışma paneli | `section[data-testid="screen-threadFlyOut"][aria-label="<dosya>"]` → eski `canvas-panel`/Canvas-artifact dialog/aside geri dönüşleri | 🟢→🟡 |
| Kaynak içerik | `[id^="artifact-"][id*="-source:"] .cm-content > code` → `.cm-content > code` → Canvas/ProseMirror/contenteditable/textarea/pre | 🟢→🟡 |
| Panel kapat | `button[data-testid="close-button"]` → `data-testid*="close"` → `aria-label="Kapat"|"Close"` | 🟢 |
| DİKKAT | Yeni DOM class'ları build hash'li (`_wdUoQG_*`) — class selektörü YASAK, yalnız `data-*` attribute | 🔴 |

### Grok
Tek selektöre güvenilmez — Bölüm 13'teki 0–5 numaralı 6 strateji + 4 katmanlı rol tespiti (v1.8.1: `data-testid="user-message"/"assistant-message"` en öncelikli) + yalnız yapısal sayı/tag/class taşıyan `[Grok DEBUG]` teşhis logları bütün olarak uygulanır. 🔴 doğası gereği; dayanıklılık stratejilerin çokluğundan gelir. 2026-07 DOM: mesajlar `.message-bubble` + data-testid; yanıt içeriği `.response-content-markdown.markdown` (thinking `.thinking-container` ayrı — öncelikli aday seçimi sızmayı önler).

## EK D — Veri Akışı Sırası (Tam Tur)

```
YOL A — sayfa içi buton / Ctrl+Shift+P:
 1. click → yazdirmaBaslat()
 2. [Claude/ChatGPT/Grok] streamingMiKontrol → yazıyorsa uyar, DUR
 3. reentrance kilidi al
 4. [Claude] artifactIcerikleriniCikar; [ChatGPT] her asistan turn'ünde chatgptArtifactlariniCikar (progress toast'larıyla)
 5. resimIslemOturumuBaslat(90sn) → konusmayiCikar()
    her turn: resimliHtmlCikar (klon+base64) + temizMetinCikar + turnResimleriniTopla + varsa artifactlar[]
 6. yazdirmayaBasla: ayar yükle → quotaKontrol → yazdirmaOturumuOlustur(UUID) → toast →
    await sendMessage(yazdirmaSayfasiAc, oturumKimligi)
 7. background: tabs.create(yazdir.html?oturum=UUID)
 8. yazdir.js: get(oturumAnahtari) → küçükse remove + sessionStorage yedeği, büyükse paketi F5 için koru → mevcutKonusma ata → KAYNAK_HARITA →
    render (htmlTemizle + prefixTemizleDOM + resimler + artifact'lar + dataset.mesajIndex) →
    body.kod-gizli başlangıç → canlı ayar çubuğu bağlama (yazı boyutu/kod/seçim modu) → buton bağlama (export'lar seciliKonusmaVerisi'nden)
 9. otomatikYazdir: yalnız seçili resimlerin load/error/decode/5 sn bariyeri → window.print() → kullanıcı PDF/yazıcı
10. finally: kilit bırak + resimIslemOturumuBitir

YOL B — popup:
 1. popup aç → ayarlar yüklenir → site kontrolü (değilse buton disabled)
 2. Yazdır → sendMessage(konusmayiCikar) → content script async (kilit+oturum+catch)
 3. popup: hata/boş kontrolleri → quotaKontrol → sync.set(ayarlar) → yazdirmaOturumuOlustur(UUID) → background'a oturumlu açma isteği
 4. 8-9 Yol A ile aynı

F5 (yazdırma sekmesi): küçük pakette sessionStorage 'aiChatPrinterYedek:UUID', büyük pakette storage.local oturum paketi → render devam
Geçersiz/eksik veri: çıktı+ayarlar kilitli → hata özeti → Kapat/Escape etkin; geçersiz oturum eski global anahtara dokunmaz
Kapat: oturumlu akışta yalnız aktif anahtar; parametresiz legacy akışta eski iki anahtar → tabs.getCurrent→remove → (fallback window.close)
```

## EK E — Test Kontrol Listesi ve Otomatik Kabul Paketi

**Otomatik zorunlu sonuç:** `tests/acceptance_tests.py` 23/23. Kanıtlar; önceki katmanlar ile güncel ChatGPT mesaj/görsel ve büyük konuşma sözleşmelerini birlikte kapsar.

- [x] `python .\tests\acceptance_tests.py` → 23/23 başarılı
- [x] Açılmış v2.0.3 ZIP `--runtime-only` → 8/8 başarılı
- [x] Gerçek Chrome `16 Yaş Hakları` → 8 mesajlı önizleme, streaming false-positive yok

- [ ] 4 sitede buton doğru konumda görünür (Gemini toolbar, Claude Share solu, ChatGPT Paylaş solu, Grok floating)
- [ ] Aynı anda iki farklı konuşmada yazdır: her önizleme sekmesi yalnız kendi başlığını ve mesajlarını gösterir
- [ ] SPA navigasyonunda buton geri gelir (sidebar'dan sohbet değiştir)
- [ ] Eklenti ↻ + açık dört hedef sekme: sekmeler otomatik reload olur; toolbar ve cevap altı butonlar yeni handler ile canlıdır
- [ ] Popup/kısayol eski content script: otomatik reload → `baglantiSaglik` → asıl komut zinciri kullanıcı eylemi istemeden tamamlanır
- [ ] Background yanıt kaybı: 0/150/500 ms yeniden denemeleri ve aynı UUID için tek önizleme doğrulanır
- [ ] Çift tıklama: "işlem zaten sürüyor" — ikinci sekme AÇILMAZ
- [ ] Streaming sırasında: Claude/ChatGPT/Grok uyarır; Gemini engellemez
- [ ] Yazdırma sayfası: başlık/tarih/sayı/kaynak doğru; document.title = başlık (PDF adı)
- [ ] Mesaj rozetleri site temasında; kullanıcı mesajında "Siz şunu dediniz:" YOK
- [ ] Resimli Gemini konuşması: içerik resimleri çıktıda; buton/ikon görselleri YOK
- [ ] Claude artifact'ları: progress toast'ları; içerik tam (yarım okuma yok); viewer kapanmış
- [ ] Kod blokları toggle (popup ayarı): kapalıyken pre'ler ve artifact'lar gizli
- [ ] **Canlı ayar çubuğu — yazı boyutu:** ayar çubuğu select'inden değişince metin anında büyür/küçülür (popup'a dönmeden)
- [ ] **Canlı ayar çubuğu — kod blokları:** checkbox kapatınca pre + artifact gizlenir, açınca geri gelir (DOM silinmiyor — tekrar açılabilir)
- [ ] **Mesaj seçim modu:** açınca her mesajda checkbox belirir; işaret kaldırılan mesaj ekranda solar (0.35), seçim modu kapanınca tamamen gizlenir
- [ ] **Tümünü Seç/Kaldır:** tüm mesajları toplu çevirir; `#secimBilgisi` "N / M mesaj seçili" doğru; buton etiketi duruma göre değişir
- [ ] **↓ HTML:** tek dosya iner, CSS gömülü (bağımsız açılır); seçilmeyen mesajlar + kontrol checkbox'ları yok; kod gizliyse pre/artifact de yok
- [ ] **↓ JSON:** seçili mesajlarla yapılandırılmış veri iner (`JSON.stringify(..., null, 2)`)
- [ ] Yazı boyutu 11/13/15/17 uygulanıyor; footer toggle çalışıyor; ayarlar kalıcı (popup yeniden açınca aynı)
- [ ] A4/A3/Letter, dikey/yatay ve dar/normal/geniş seçenekleri `#dinamikSayfaStili` içindeki `@page` kuralına doğru yansıyor
- [ ] Bağlantı adresi kapalıyken yazdırma/HTML'de URL suffix'i yok; açıkken HTTP(S) adresi görünür
- [ ] “Yalnız Kullanıcı” ve “Yalnız AI” doğru rolü seçiyor; mesaj sırası ve orijinal veri değişmiyor
- [ ] Sıfır mesaj seçiminde Yazdır/Markdown/Metin/MD/TXT/HTML/JSON düğmeleri disabled; kullanıcıya 0/N bilgisi gösteriliyor
- [ ] 640 px dar görünümde bütün eylem ve ayar kontrolleri satıra sarılıyor; sağ kenar kesilmesi ve yatay kaydırma yok
- [ ] `otomatikYazdir`: resimler load/error/decode/5 sn bariyerinden sonra print dialogu; manuel Yazdır da aynı bariyerden geçiyor
- [ ] Markdown kopyala: başlıklar `#`, kod ```dil fence'li, tablolar pipe — DÜZ METİN DEĞİL
- [ ] Metin kopyala: buton yazısı sızıntısı YOK ("Kodu kopyala" araması 0 sonuç)
- [ ] ↓ MD / ↓ TXT (sayfa): dosya iner, adı = başlık, içerik panoya kopyalananla aynı
- [ ] Tüm kopyala/indir (MD/TXT/HTML/JSON) mesaj seçimine saygılı — çıkarılan mesaj hiçbir çıktıda yok
- [ ] Gemini cevap altı ↓ MD: tek soru-cevap, cevap gerçek markdown; ↓ TXT düz şablon
- [ ] Cevap altı dosya adı: sorudan üretilmiş, 80 char, FS-güvenli
- [ ] İçinde ``` olan kod bloğu MD'de kırılmıyor (4'lü fence)
- [ ] Wikipedia tarzı parantezli link MD'de `<>` sargılı; `dizi[0]` metni escape'li
- [ ] Linkli resim MD'de `[![alt](src)](href)` bozulmadan
- [ ] F5 (yazdırma sekmesi): veri kaybolmuyor
- [ ] İki sekmede art arda yazdır: her sekme kendi konuşmasını gösterir
- [ ] Escape kapatır; Ctrl+Shift+M markdown kopyalar
- [ ] Ctrl+Shift+P: desteklenen sitede yazdırır; desteklenmeyende `!` badge
- [ ] Popup desteklenmeyen sitede: bilgi + buton disabled
- [ ] >10 MB konuşma: önizleme, F5 ve sekme kapanışında paket temizliği
- [ ] XSS fixture (script+onerror+svg-data-uri+kaynak CSS class enjeksiyonu): hiçbiri çalışmaz/render olmaz; yalnız `PRE`/`CODE` üzerindeki `language-*` korunur
- [ ] `example.invalid/?yonlendir=https://chatgpt.com` destekli site sayılmıyor; gerçek `https://chatgpt.com/...` destekli sayılıyor
- [ ] Sahipsiz `aiChatPrinterOturum:*` paketi 6 saati geçince temizleniyor; güncel paket worker uyanışında korunuyor
- [ ] Geniş tablo: landscape önerisi toastı; print'te tablo taşmıyor
- [ ] Tüm görünen metinler tam diakritikli ("Yazdırma Önizleme", "Konuşma:", "alınamadı")

## EK F — Kullanıcıya Görünen Tüm Metinler (birebir)

**Toast'lar (content script'ler):** `Konuşma çıkarılıyor, resimler işleniyor...` · `{N} mesaj çıkarıldı. Yazdırma sayfası açılıyor...` · `Yazdırma işlemi zaten sürüyor, lütfen bekleyin...` · `Konuşma çıkarılamadı: {mesaj}` · `{Claude|ChatGPT|Grok} henüz yanıt yazıyor. Tamamlanmasını bekleyin.` · `{N} artifact bulundu, içerikleri çıkarılıyor (0/{N})...` · `Artifact {i}/{N} çıkarılıyor...` · `İndirildi: {dosyaAdi}` · `Konuşmada mesaj bulunamadı.` · `Hata: {veri.hata}` · `Eklenti bağlantısı otomatik yenileniyor. İşlem kaldığı yerden sürecek...` · `Eklenti arka planı otomatik olarak yeniden başlatılamadı.` · `Storage sınırı doldu. Lütfen daha kısa bir konuşma seçin veya resimleri atlayın.` · `Konuşma çok büyük ({X} MB). Storage sınırı {Y} MB. Lütfen daha kısa bir konuşma seçin.`

**Hata nesneleri:** `Konuşma bulunamadı. Bir {Gemini|Claude|ChatGPT} sohbeti açık olduğundan emin olun.` · `Grok konuşma yapısı tanınamadı. Açık bir konuşma bulunduğundan emin olun.` · `Grok konuşma içeriği çıkarılamadı.` · `Yazdırma işlemi zaten sürüyor. Lütfen bekleyin.`

**Popup:** `{Gemini|Claude|ChatGPT|Grok} konuşması hazır` · `Bu sekme desteklenen bir AI konuşması değil` · `Etkin sekme bilgisi alınamadı.` · `Gemini, Claude, ChatGPT veya Grok üzerinde açık bir konuşmaya geçildiğinde buton etkinleşir.` · `Ayar kaydedildi.` · `Ayar kaydedilemedi.` · `Konuşma içeriği ve görseller hazırlanıyor…` · `Sayfa bağlantısı otomatik yenileniyor…` · `Sayfa bağlantısı otomatik olarak yeniden kurulamadı: {hata}` · `Sayfadan konuşma verisi alınamadı.` · `Açık konuşmada yazdırılabilir mesaj bulunamadı.` · `{N} mesaj önizlemeye aktarıldı.` · buton: `Konuşmayı Önizle` / `Konuşma hazırlanıyor…`

**Yazdırma sayfası:** marka `BASKI STÜDYOSU / Yazdırma Önizleme` · eylemler `Yazdır · Markdown · Metin · ↓ MD · ↓ TXT · ↓ HTML · ↓ JSON · Kapat` · ayarlar `Yazı · Kâğıt · Yön · Kenar · Kod · İmza · Link adresi · Mesaj seçimi` · seçim `Tümünü Kaldır / Tümünü Seç / Yalnız Kullanıcı / Yalnız AI` · sayaç `{N} / {M} mesaj seçili` · overlay `Konuşma yükleniyor… / Konuşma verisi okunuyor... / İçerik işleniyor ({N} mesaj)...` · toast'lar `Markdown panoya kopyalandı. / Düz metin panoya kopyalandı. / İndirildi: {ad} / Çıktı için en az bir mesaj seçin.` · footer `AI Chat Printer / Yerel olarak oluşturuldu · Dış servise gönderilmedi` · hata özeti `Önizleme kullanılamıyor` · hatalar `Yazdırma oturumu geçersiz. AI konuşmasından yeni bir önizleme oluşturun. / Storage erişim hatası: {mesaj} / Konuşma verisi bulunamadı. Lütfen AI sayfasından tekrar yazdır butonuna tıklayın.`

**MD/TXT şablon sabitleri:** Bölüm 8 ve 10'da birebir verildi (`# Gemini Soru-Cevap`, `**Tarih:**`, `## Soru`, `SORU:`, `Konuşma:`, `*(Soru metni alınamadı)*`, `(Cevap metni alınamadı)`, imzalar).

## EK G — Kritik Etkileşim Noktaları (Sıkça Atlananlar)

1. **Dört içerik kanalı:** `html`/`metin`/`resimler`/`artifactlar` ayrı kanallardır; filtre ve dışa aktarım ilgili kanalların tamamında birlikte doğrulanır. Tek kanalı düzeltip "bitti" demek bug'ın belirtisini düzeltmektir
2. **`return true` yol-bazlıdır** (Bölüm 19) — koşulsuz yazmak message port'u yanıtsız açık bırakır; otomatik kurtarma semptomu örterken sözleşme hatası yine düzeltilmelidir
3. **Escape işlenmemiş veriye uygulanır:** `[]` escape'i yalnız `children.length===0` linklerde — işlenmiş markdown'a escape iç sözdizimi (`![alt](src)`) bozar
4. **Sabit fence yazma** — `mdFenceUret` zorunlu; spread yerine `reduce` (dev içerik stack overflow)
5. **`onload =` property ataması yasak** — sayfanın kendi handler'ı ezilir; `addEventListener {once:true}` + timeout temizliği
6. **blob: cross-context ölüdür** — content-origin blob URL extension sayfasında yüklenmez; bu yüzden base64'e content script'te çevrilir, sanitizer/CSP blob kabul etmez
7. **F5 saklaması boyuta göre seçilir** — küçük pakette `sessionStorage`, büyük pakette sekme kapanışında temizlenen `chrome.storage.local` kullanılır; UUID anahtarları eşzamanlı sekmeleri ayırır
8. **`cocuk.getAttribute('href')` kullan, `.href` değil** — property DOM-resolve eder (relative→absolute), şema kontrolü ham string üzerinde yapılmalı
9. **Custom element kabuğuna `appendChild` etme; wrapper span de koyma** — Angular Material'de flex container child div'dir; mevcut butonun `parentElement`'ine kardeş `insertBefore` (yoksa butonlar alt satıra düşer)
10. **Closure'a içerik değil DOM referansı sabitle** — cevap altı butonlar metni tıklama anında çıkarır (streaming/regenerate/edit toleransı)
11. **Stabilite polling'i = 2 ardışık eşit uzunluk** — Claude artifact içeriği stream edilir; tek ölçüm yarım veri döndürür
12. **`@page` margin box / `counter(pages)` Chrome'da YOK** — sayfa numarası istenirse print dialogundaki "Üstbilgi ve altbilgiler" seçeneği önerilir; CSS'e koymak dead code'dur
13. **Kod bloğu gizleme = CSS class, `pre.remove()` DEĞİL** (v1.8.0) — `body.kod-gizli` class'ı `.mesaj-icerigi pre` + `.artifact-blogu`'yu CSS'te gizler; DOM korunur ki canlı toggle geri açabilsin. Yalnız HTML export bu class okunduğunda klondan `pre, .artifact-blogu`'yu **gerçekten çıkarır** (indirilen dosyada gizli-ama-var içerik kalmasın)
14. **Tüm export'lar `seciliKonusmaVerisi()` üzerinden** (v1.8.0) — mesaj seçim filtresi tek noktadadır; MD/TXT kopyala + MD/TXT/HTML/JSON indir hepsi buradan okur. Yeni bir dışa aktarım eklenirken `mevcutKonusma` DEĞİL `seciliKonusmaVerisi()` kullanılmalı, yoksa kullanıcının mesaj seçimi sessizce yok sayılır

## EK H — Tasarım Kararları ve Gerekçeleri

1. **Neden ortak modüller `js[]` array'inde?** MV3 isolated world'de sıralı yükleme bundler'sız paylaşım sağlar; ES module content script'lerde ek karmaşıklıktır (H: basitlik > tooling)
2. **Neden storage ile taşıma (mesajla değil)?** Yazdırma sayfası açılış zamanlaması belirsiz; mesaj kanalı sekme hazır olmadan kurulamaz, storage "bırak-al" deseni zamanlamadan bağımsız
3. **Neden gerçek MD motoru (textContent değil)?** "Markdown" adlı çıktının düz metin olması v1.7.0'a dek fark edilmeyen format yalanıydı; başlık/kod/tablo kaybı kullanıcı değerini sıfırlıyordu
4. **Neden data-URI resimler MD'de placeholder?** Tek konuşmada onlarca base64 resim MD dosyasını MB'larca şişirir, hiçbir MD görüntüleyici beklemez
5. **Neden Claude artifact'ı tıkla-aç-oku-kapat?** İçerik DOM'da değil React state'inde; fiber erişimi sürümle kırılır — UI üzerinden okumak tek dayanıklı yol
6. **Neden Grok'ta floating buton?** React reconciliation header'a ekleneni siliyor; body-level fixed buton React ağacının dışındadır
7. **Neden Gemini'de streaming kontrolü yok?** Stop butonu DOM'da gizli dururken `offsetParent` testi sürekli "yazıyor" diyordu (v1.5.2 false positive vakası) — yanlış engel, engelsizden kötü
8. **Neden `console.log` (warn/error değil)?** Beklenen durumlar (context invalidation) chrome://extensions "Errors" sayfasında alarm biriktirmesin; gerçek hatalar zaten kullanıcı toast'ı üretir
9. **Neden popup VE sayfa içi buton?** Sayfa içi buton ana akış (tek tık); popup ayar yüzeyi + buton enjeksiyonu kırıldığında yedek tetikleyici
10. **Neden `unlimitedStorage`?** 10 MB yerel depo kotası uzun konuşmayı yazdırmadan önce engelliyordu; izin bu kotayı kaldırır. İzin olmayan kurulumdaki hata mesajı gerçek `QUOTA_BYTES` değerini kullanır
11. **Neden merkezi tam-hostname sözleşmesi?** Popup ve background'da `includes('chatgpt.com')` kullanmak hem sapma hem `example.invalid/?next=...` false-positive üretir; URL parser + exact hostname tek güvenlik sınırıdır.
12. **Neden tek sticky kontrol yüzeyi?** İki bağımsız fixed bar, dar görünümde yükseklik değişince içerik marjını geçersiz kılar; normal belge akışı + sticky kapsayıcı responsive sarılmayı doğal çözer.
13. **Neden HTML export için gerçek belge DOM'u?** Başlık ve içerik string template içine konursa ikinci bir enjeksiyon yüzeyi açılır; `createHTMLDocument/importNode/textContent` sanitizer sınırını export sonuna kadar korur.
14. **Neden uzun mesajlar baskıda bölünebilir?** Tüm mesajı `break-inside:avoid` yapmak viewport'tan uzun blokta büyük boşluk veya kesilme üretir; yalnız başlık/tek satır/görsel bölünmez kalmalıdır.
15. **Neden sıfır-seçim eylemleri kilitli?** Boş PDF veya anlamsız dosya üretmek sessiz başarısızlıktır; UI sayaç ve disabled state ile veri sözleşmesini eylemden önce görünür kılar.
16. **Neden service worker TTL'i 6 saat?** Oku-sil normal akışı temizdir fakat tarayıcı/sekme kapanması sahipsiz paket bırakabilir; update'e kadar beklemek gereksiz yerel veri tutar, çok kısa TTL ise yavaş artifact çıkarımını riske atar.
17. **Neden ChatGPT content-started/complete karar dışı?** `data-assistant-content-started` tamamlandıktan sonra kalabilir, `data-message-complete` ise hiç üretilmeyebilir; iki kalıcı/opsiyonel attribute'tan canlı süreç çıkarımı yapmak false-positive kilit üretir. Görünür Stop veya açık `in_progress` tek güvenilir sınırdır.

## EK I — Dosya/Fonksiyon Haritası (v2.0.3)

| Dosya | Satır | Fonksiyon sırası |
|---|---:|---|
| `background.js` | 154 | kalıntı temizliği · health/onMessage · kısayol · onInstalled · idempotent önizleme (93) · content reload/ping (120) · hedef sekme tazeleme (141) |
| `site-yardimcilari.js` | 27 | site sözleşmesi (4) · URL doğrulama (12) · kaynak görünümü (24) |
| `resim-yardimcilari.js` | 223 | deadline (10–20) · event bekleme (25) · raster URI (57) · base64 (62) · HTML klon (132) · UI filtresi (158) · turn resimleri (163) |
| `ortak-yardimcilar.js` | 571 | background retry (40) · reload/devam kurtarması (60–106) · ayar/UUID/IO · streaming (203) · başlık/quota · yazdırma başlatma (293) · Markdown · UI temizlik/indirme |
| `content.js` | 525 | Gemini enjeksiyon/çıkarma · hızlı indirme yüzeyi · health/işlem listener'ı |
| `content-claude.js` | 441 | enjeksiyon · yazdırma · viewer/artifact yaşam döngüsü · mesaj çıkarma · health/işlem listener'ı |
| `content-chatgpt.js` | 690 | enjeksiyon/floating · turn sözleşmesi · Çalışma/Canvas yaşam döngüsü · tam süpürme · health/işlem listener'ı |
| `content-grok.js` | 457 | floating enjeksiyon · rol/içerik · çok katmanlı çıkarma · health/işlem listener'ı |
| `popup.js` | 158 | otomatik sekme reload/ping (12) · form IO · site/durum/busy · DOMContentLoaded çıkarma akışı |
| `yazdir.js` | 735 | temel UI/hata durumu (11–78) · resim/sayfa/baskı (81–152) · DOMContentLoaded render ve eylemler (155 sonrası) · seçim (521–559) · kapat/pano/prefix/metin (566–653) · sanitizer (654) |
| `tests/acceptance_tests.py` | 737 | statik kabul (103) · normal tarayıcı kabulü (176) · gerçek MV3 kabulü (431) · ana orkestrasyon (706) |

## EK J — Tip İmza Özeti

```javascript
// site-yardimcilari.js
desteklenenSiteBilgisi(adres: string): SiteBilgisi|null
kaynakSiteBilgisi(kaynak: string): SiteBilgisi

// resim-yardimcilari.js
resimIslemOturumuBaslat(toplamSure: number): void
resimIslemOturumuBitir(): void
resimDeadlineDoldu(): boolean
resimOlayiniBekle(hedef: EventTarget, basariOlayi: string, hataOlayi: string, sure: number): Promise<boolean>
guvenliRasterDataUriMi(kaynak: string): boolean
resmiBase64Yap(resimElementi: HTMLImageElement): Promise<string|null>
resimliHtmlCikar(element: Element): Promise<string>
uiElementiIcindeMi(element: Element): boolean
turnResimleriniTopla(turn: Element, kaynakElement: Element|null): Promise<{src,alt}[]>

// ortak-yardimcilar.js
ortakBekle(sure: number): Promise<void>
arkaPlanMesajiGonder(mesaj: object): Promise<object>
eklentiBaglantiHatasiMi(hata: Error): boolean
baglantiKurtarmaKaydiniOku(): object|null
baglantiKurtarmaKaydiniTemizle(): void
baglantiKurtarmayiBaslat(uyariBalonuGoster: Function, hata: Error): boolean
bekleyenYazdirmayiDevamEttir(yazdirmaFonksiyonu: Function): void
ayarlariDogrula(ayarlar: Partial<Ayarlar>): Ayarlar
yazdirmaOturumKimligiGecerliMi(oturumKimligi: string): boolean
yazdirmaOturumAnahtari(oturumKimligi: string): string
yazdirmaOturumKimligiOlustur(): string
yazdirmaOturumuOlustur(veri: KonusmaVerisi, ayarlar: Ayarlar): Promise<string>
ayarlariYukle(): Promise<Ayarlar>
ayarlariKaydet(ayarlar: Ayarlar): Promise<boolean>
debounce(fonksiyon: Function, gecikme: number): Function
streamingMiKontrol(kaynak: 'gemini'|'claude'|'chatgpt'|'grok'): boolean
basligiTemizle(hamBaslik: string, kaynak: string): string
veriBoyutuHesapla(veri: any): number
quotaKontrol(veri: any): {gecerli, uyari?, boyut, mbBoyut, mesaj?}
yazdirmayaBasla(veri: KonusmaVerisi, uyariBalonuGoster: Function): Promise<boolean>
mdFenceUret(icerik: string): string
htmlToMarkdown(htmlString: string): string
mesajMarkdownIcerigi(mesaj: Mesaj): string
konusmayiMarkdowneDonustur(veri: KonusmaVerisi, footerGoster: boolean): string
uiTemizKlon(element: Element): Element
temizMetinCikar(element: Element|null): string
dosyayaIndir(icerik: string, dosyaAdi: string, mimeType: string): void

// background.js
arkaPlanBekle(sure: number): Promise<void>
kalintiYazdirmaOturumlariniTemizle(tumunuSil: boolean): Promise<void>
yazdirmaSayfasiniAc(oturumKimligi: string): Promise<object>
icerikBetigineMesajGonder(sekmeId: number, mesaj: object, yenilemeSerbest: boolean): Promise<object>
desteklenenSekmeleriYenile(): Promise<{bulunan,yenilenen}>
yazdirmaOturumKimligiGecerliMiArkaPlan(oturumKimligi: string): boolean

// content script ortak yüzeyi
baslat(): void
butonuEnjekteEt(): void
yazdirmaBaslat(): Promise<void>
uyariBalonuGoster(mesaj: string, tip: 'basari'|'hata'): void
konusmayiCikar(...): Promise<KonusmaVerisi>

// Gemini ek yüzeyi
eskiIndirmeButonlariniTemizle(): void
indirmeButonlariniKontrolEt(): void
indirmeButonlariniEnjekte(modelResponse: Element): void
oncekiSoruMetniBul(modelResponse: Element): string
cevapIcerikElementiBul(modelResponse: Element): Element|null
cevapMetniniAl(modelResponse: Element): string
cevapMarkdownAl(modelResponse: Element): string
cevapIndir(soru: string, cevap: string, format: 'md'|'txt'): void
indirmeDosyaAdiOlustur(soru: string, format: string): string
geminiPrefixTemizle(metin: string): string

// Claude ek yüzeyi
artifactViewerKapat(): Promise<void>
artifactIcerikleriniCikar(ilerlemeCallback?: Function): Promise<{baslik,tur,icerik}[]>

// ChatGPT ek yüzeyi
paylasButonunuBul(header: Element): HTMLButtonElement|null
floatingButonEkle(): void
chatgptTurnRolu(turn: Element): 'user'|'assistant'|null
chatgptTurnGovdesi(turn: Element): Element
chatgptIcerikElemani(turn: Element, rol: string): Element
chatgptArtifactAdaylariniBul(turn: Element): ArtifactAdayi[]
chatgptArtifactTurunuBul(baslik: string): string
chatgptArtifactPaneliniBul(baslik?: string): Element|null
chatgptArtifactPanelBasliginiBul(panel: Element): string
chatgptArtifactAktifSekmesiniBul(panel: Element): string
chatgptArtifactSekmesiniSec(panel: Element, sekmeAdlari: string[]): boolean
chatgptKosuluBekle(kontrol: Function, azamiSure: number, aralik: number): Promise<any|null>
chatgptArtifactIceriginiOku(panel: Element): string
chatgptArtifactIcerigininKararlilasmasiniBekle(panel: Element): Promise<string|null>
chatgptArtifactPaneliniKapat(panel: Element): Promise<boolean>
chatgptArtifactButonunuBul(artifact: ArtifactAdayi): Element|null
chatgptArtifactlariniCikar(turn: Element, ilerlemeBildir?: Function): Promise<{baslik,tur,icerik}[]>
chatgptTurnAnahtari(turn: Element): string
chatgptKaydiriciBul(turn: Element): Element|null

// Grok ek yüzeyi
grokMesajRolu(element: Element): 'user'|'assistant'|null
enZenginIcerikDescendant(element: Element): Element

// yazdir.js
guvenliResimKaynagiMi(kaynak: string): boolean
sayfaAyarlariUygula(ayarlar: Ayarlar): void
canliAyarlariOku(): Ayarlar
belgeResimleriniBekle(): Promise<void>
yazdirmayaHazirlaVeYazdir(): Promise<void>
seciliKonusmaVerisi(): KonusmaVerisi|null
gecerliSecimVerisi(): KonusmaVerisi|null
guvenliDosyaTemeli(veri: KonusmaVerisi): string
secimBilgisiniGuncelle(): void
sayfayiKapat(): Promise<void>
panoyaKopyala(metin: string): Promise<boolean>
prefixTemizleDOM(element: Element): void
konusmayiDuzMetneDonustur(veri: KonusmaVerisi, footerGoster: boolean): string
htmlTemizle(htmlString: string): HTMLDivElement

// popup.js
popupBekle(sure: number): Promise<void>
popupSekmeyeMesajGonder(sekmeId: number, mesaj: object): Promise<object>
ayarlariFormdanOku(): Ayarlar
ayarlariFormaYansit(ayarlar: Ayarlar): void
siteDurumunuGoster(siteBilgisi: SiteBilgisi|null): void
durumGoster(tip: string, mesaj: string, otomatikGizle?: boolean): void
yazdirButonuDurumunuAyarla(calisiyor: boolean): void

// tests/acceptance_tests.py
free_port(): int
chrome_mock_script(base_url, local_seed, sync_seed, active_url): str
run_static_tests(): list[str]
run_browser_tests(base_url): list[str]
run_extension_runtime_tests(): list[str]
main(): None
```

## EK K — Bilinen Sınırlamalar ve Bilinçli-Dokunulmayan Kararlar

| Konu | Durum / Gerekçe |
|------|------------------|
| Cevap altı ↓ MD/↓ TXT yalnız Gemini'de | Diğer sitelere taşıma canlı DOM incelemesi gerektirir — tahmini selektörle kırık özellik gönderilmez |
| Gemini canvas-immersive | Desteklenmiyor; ChatGPT Çalışma/Canvas v2.0.1'de desteklenir |
| `basligiTemizle` bare suffix agresifliği | "Sohbet Claude" → "Sohbet" yapar; kozmetik, v1.3.0'dan beri stabil |
| `oncekiSoruMetniBul` sibling-zinciri varsayımı | Canlı testte doğrulandı; Gemini wrapper katmanı eklerse kırılır — o zaman çok-seviyeli aramaya genişletilir |
| Nested tablo (`tabloyuCevir`) | İç tablonun tr'leri düz listelenir — AI çıktısında pratikte yok |
| `turnResimleriniTopla` `querySelectorAll('*')` maliyeti | Çok uzun konuşmalarda yavaş; kanıtsız daraltma davranış bozar, şikayet yok |
| Grok heuristik fallback logları | Yalnız yapısal sayı/tag/class bilgisi; konuşma metni ve kullanıcıdan log gönderme talebi yok |
| `htmlToMarkdown` `preIcinde` parametresi | Fiilen ölü (PRE textContent ile ham okur) — davranış doğru, dokunulmadı |
| Düz metindeki `* _` literal'leri MD'de escape edilmez | Tam escape çıktıyı çirkinleştirir; export hedefi round-trip değil okunabilirlik |
| README iki dilli | Türkçe bölüm tam diakritikli; mevcut uluslararası kullanım için kısa İngilizce bölüm korunur |
| i18n yalnız manifest düzeyinde | Hedef kitle TR; content metinlerinin i18n'i istek gelirse yapılır |
| x.com/i/grok host'u yok | Talep edilmedi; manifest matches genişletmesiyle eklenebilir |

## EK L — Hızlı Sözlük

| Terim | Kod karşılığı | Anlam |
|-------|---------------|-------|
| Turn | `user-query`/`model-response`, `conversation-turn` | Bir konuşma sırası |
| Dört kanal | `mesaj.html/metin/resimler/artifactlar` | Aynı mesajın render, düz metin, görsel ve dosya/Canvas yolları |
| Artifact | `.artifact-block-cell` veya `data-file-citation-*`, `artifactlar[]` | Claude ya da ChatGPT'nin ürettiği dosya/Canvas belgesi |
| Viewer | `#wiggle-file-content` veya `screen-threadFlyOut` | Claude/ChatGPT artefakt içerik paneli |
| Stabilite polling | 2 ardışık eşit `textContent.length` | Stream bitti sinyali |
| Deadline | `resimIslemDeadline`, 90 sn | Resim işleme toplam süre sigortası |
| Reentrance kilidi | `yazdirmaIslemiSuruyor` | Çift tıklama paralel akış engeli |
| Yazdırma oturumu | `aiChatPrinterOturum:<UUID>` | Eşzamanlı yazdırma verilerini tam ayırır |
| Boyuta göre paket yaşamı | 4 MB altında `get` → `remove`; büyük pakette sekme kapanışı → `remove` | Büyük konuşmada F5 desteği ve kapanış temizliği |
| Sekme yedeği | Küçük pakette `sessionStorage['aiChatPrinterYedek:<UUID>']` | Küçük oturumlar için F5 dayanıklılığı |
| Fence kaçışı | `mdFenceUret` | İçerikteki ``` ile çakışmayan çit |
| `<>` sargısı | `[m](<url>)` | Parantezli/boşluklu URL koruması |
| UI sızıntısı | buton/ikon/stil metni çıktıda | 4 kanal filtresiyle yasak |
| Dead handler | reload sonrası eski DOM butonu | Enjeksiyon öncesi temizlenir |
| Bağlantı kurtarma | `aiChatPrinterBaglantiKurtarmaV1` + `baglantiSaglik` | Eski content script'i tek reload ile yeniler ve işlemi sürdürür |
| İdempotent açılış | `aiChatPrinterOnizlemeSekmesi:<UUID>` | Yanıt kaybında ikinci önizleme açılmaz |
| Prefix | "Siz şunu dediniz: " | Gemini erişilebilirlik öneki — soyulur |
| Dörtlü bump | manifest + README + teknik dokümantasyon + gizlilik (popup dinamik) | Sürüm eş-zamanlılık kuralı |
| Canlı ayar çubuğu | `#ayarCubugu` | Yazdırma sayfasında popup'a dönmeden anlık önizleme kontrolü (v1.8.0) |
| Mesaj seçimi | `.mesaj-secilmedi` + `seciliKonusmaVerisi()` | Tek tek mesajı çıktıdan çıkarma; tüm export'lar buna saygılı (v1.8.0) |
| Kod gizleme | `body.kod-gizli` class'ı | pre + artifact CSS ile gizlenir (DOM silinmez, canlı geri açılır — v1.8.0) |
| dataset.mesajIndex | `.mesaj-blogu` data attribute'u | Seçim filtresinin orijinal mesaj indeksi anahtarı |

---

**Dokümantasyon sonu — v2.0.3 (29.09.2026)**

> Bu dokümanın amacı, projeyi başka bir geliştirici veya LLM tarafından **birebir yeniden üretilebilir** kılmaktır. Belge eksiksiz takip edilirse sonuç v2.0.3 ile fonksiyonel olarak özdeş olur: önceki bütün çıktı ve dört-site çıkarma yetenekleri korunur; Baskı Stüdyosu UX, MV3 bağlantı kurtarması, güvenilir ChatGPT streaming kararı ve 23 maddelik kabul kapısı birlikte kurulur. Bölüm 28–31 güncel kanonik sınırları; Bölüm 11–22 mekanik ayrıntıları; EK C seçicileri; EK E kabul kanıtını tanımlar.

## 10.09.2026 — ChatGPT görsel akışı düzeltmesi

Canlı ChatGPT konuşmasında kullanıcı görseli button[aria-haspopup="dialog"] > img içinde; üretilen resim ise asıl img ve iki aria-hidden="true" dekoratif kopyayla gösteriliyordu. Ortak düğme filtresi kullanıcı resmini eliyordu. İlk markdown bloğunu alıp diğer görselleri mesaj sonuna eklemek de metin ve resim sırasını değiştiriyordu.

chatgptAkisIceriginiCikar(turn, rol) tüm üst düzey markdown/kullanıcı balonlarını ve dışlarındaki resimleri DOM sırasıyla işler. Düğmelerden yalnız dönüştürülmüş resimler çıkarılır; düğme metni aktarılmaz. chatgptAkisResminiCikar aksiyon/attribution alanlarını, 48 piksel ve altı ikonları, dekoratif kopyaları ve mesaj içindeki aynı kaynak tekrarlarını eler. Resimler mesaj.html içinde yerlerinde taşınır; ChatGPT için mesaj.resimler boş kalır. Canvas/Çalışma çıkarımı korunur.

Ortak dönüştürücü currentSrc kullanır; canvas çizimini 800 yerine en fazla 2400 piksel genişlikte PNG olarak alır. Kaynak daha küçükse büyütmez. Saydamlık ve çizgi/metin detayları JPEG dönüşümüyle kaybedilmez. Yüklenmemiş lazy resimde doğrudan fetch denenir; yalnız aynı-origin isteklerde mevcut oturum kullanılır. Üçüncü tarafa cookie/referrer gönderilmez. Fetch zaman aşımı gövde indirmesini de kapsar. Klonun srcset ve sizes alanları temizlenir.

Yazdırma öncesinde seçili resimlerin gerçek yüklenme sonucu denetlenir. Eksik görsel varsa otomatik/manuel eklenti yazdırması hata bildirip durur. Tarayıcının kendi Ctrl+P komutu bu kontrolden geçmez. `unlimitedStorage` izni 10 MB yerel depo sınırını kaldırır; çok sayıda yüksek çözünürlüklü resim aktarımı yine yavaşlatabilir.

Kabul: gerçek MV3 test profilinde blob kaynaklı 1200 × 600 resimler → content script → storage → service worker → önizleme zinciri; kullanıcı düğmesi, dekoratif tekilleştirme, metin–resim–metin sırası, ekranda 400 pikselden geniş gösterim ve print ortamında en-boy oranı doğrulandı. Dört site regresyon paketi 20/20 geçti. Kullanıcı Chrome profilinde eklenti yenilemesi tarayıcı URL politikasıyla engellendiğinden kurulu sürümde son kullanıcı kabulü henüz yapılmadı.
### Görsel-only asistan rolü düzeltmesi — 10.09.2026

Canlı konuşmada conversation-turn-2 ve conversation-turn-4, SECTION üzerinde data-turn="assistant" taşıyor; bu yanıtlarda data-message-author-role ve data-message-role bulunmuyor. Önceki rol çıkarıcı null döndürüp iki yanıtı da tümüyle atlıyordu. chatgptTurnRolu artık önce turn üzerindeki data-turn işaretini okur, ardından önceki iki DOM biçimini desteklemeyi sürdürür. Canlı DOM'da iki kullanıcı resmi ve iki adet 1055 × 1491 üretilmiş resim doğrulandı.

Regresyon örneği güncel SECTION/data-turn biçimine çevrildi; ayrıca hiç markdown içermeyen, role="button" altında asıl görsel ve dekoratif kopya taşıyan asistan yanıtı eklendi. Gerçek MV3 zincirinde üç mesaj ve üç resim, metin sırası ve çözünürlük kabulü geçti. Kurulu kullanıcı profilindeki yenileme sınırı nedeniyle bu doğrulama ayrı test profilindedir.
### Mermaid SVG aktarımı ve lazy yükleme — 10.09.2026

Teknik Ofis İlan Analizi konuşmasındaki hata, yüklenmiş 709 × 396 Mermaid diyagramının data:image/svg+xml;utf8 kaynağının raster allowlist tarafından erken reddedilmesiydi. Bu örnekte lazy yükleme hata nedeni değildi. Ortak dönüştürücü artık SVG data kaynağını img bağlamında PNG'ye çizer; vektör kaynakları iki kat çözünürlükte, en fazla 2400 piksel genişlikte işler. Ham SVG önizlemeye aktarılmaz; sanitizer ve raster MIME sınırı korunur. Yüklenmemiş SVG için bağımsız eager Image kullanılır ve beş saniyelik yükleme sınırı uygulanır. Kaynak sayfadaki lazy öğe değiştirilmez.

Toplam süre dolmuş olsa da yüklenmiş blob/SVG resmi canvas ile korunur. Görselin alt metni yoksa aria-label hata açıklamasında ve çıktı etiketinde kullanılır. Gerçek MV3 kabulü: SVG → PNG → storage → önizleme zinciri, 1420 × 792 çözünürlük, 400 pikselden geniş gösterim, lazy SVG, süre dolmuş hazır blob ve PNG piksel içeriği doğrulandı. Kullanıcının açık Chrome profilinde eklenti yeniden yükleme işlemi araç politikası nedeniyle yapılmadı; bu düzeltmenin uçtan uca kabulü ayrı Chromium test profilindedir.
