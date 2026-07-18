# AI Chat Printer — Teknik Dokümantasyon (v1.8.1)

> Bu belge, projeyi **sıfırdan birebir yeniden inşa edebilmek** için hazırlanmıştır. Düşük yetenekli bir LLM dahi bu dokümandaki adımları, fonksiyon imzalarını, selektör tablolarını, algoritma adımlarını ve birebir kod kurallarını takip ederek **fonksiyonel olarak özdeş bir eklenti** üretebilir. Hiçbir karar "açık" bırakılmamıştır — buton piksel boyutlarından sanitizer whitelist'ine, Markdown fence algoritmasından mesaj kanalı semantiğine, toast renklerinden storage anahtarlarına kadar her şey burada tanımlıdır.
>
> **SÜRÜM NOTU (10.06.2026):** Belge **v1.7.8**'i anlatır (commit `2547bab`). v1.7.x serisi, v1.7.0 derin denetimi + 8 saatlik öz-denetim turunun ürünüdür; turlarda bulunan 14 gerçek bug'ın düzeltmeleri gövdeye işlenmiş durumdadır (ayrıca bkz. EK G ve EK H — "neden böyle" kuralları bu bulgulardan doğdu).
>
> **SÜRÜM NOTU (19.07.2026 — v1.8.1):** claude.ai 2026-07 UI güncellemesi eklentiyi tamamen kırdı; Bölüm 11 ve EK C canlı DOM analiziyle yeniden yazıldı. Kırılan 5 nokta: (1) `page-header` → `chat-header`, (2) turn-bazlı mesaj döngüsü → document-order `querySelectorAll` akışı (tüm konuşma artık `children[0]` tek ağaç), (3) artifact aç `[role="button"]` → grup içi `button[aria-label^="View"]`, (4) viewer kapat `Close` → `Go back`, (5) başlık sidebar linki → `chat-title-split`. Ayrıca Grok rol tespitine `data-testid` katmanı eklendi. Tüm yeni selektörler eski UI fallback'leriyle birlikte uygulanır — belge gövdesindeki v1.7.8 anlatımı bu bölümler dışında geçerliliğini korur.

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

### Ekler

- **EK A** — Edge Case'ler ve Özel Durumlar
- **EK B** — Encoding ve Türkçe Diakritik Kuralları
- **EK C** — DOM Selektör Master Tablosu (4 site, kırılganlık dereceli)
- **EK D** — Veri Akışı Sırası (iki tetikleme yolu, tam tur)
- **EK E** — Test Kontrol Listesi (30 madde)
- **EK F** — Kullanıcıya Görünen Tüm Metinler (birebir Türkçe)
- **EK G** — Kritik Etkileşim Noktaları (12 sıkça atlanan davranış)
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
| chatgpt.com | `content-chatgpt.js` | Turn tabanlı çıkarma |
| grok.com | `content-grok.js` | 5 kademeli DOM tanıma stratejisi + floating buton |

**Temel davranış zinciri:** Sayfaya enjekte edilen yazıcı butonu → DOM'dan konuşma çıkarılır (mesajlar + resimler + artifact'lar) → `chrome.storage.local`'a yazılır → `yazdir.html` yeni sekmede açılır → veri okunur-okunduğu anda silinir → sanitize edilip render edilir → `window.print()` (PDF dosya adı = konuşma başlığı).

**Dışa aktarma yüzeyleri (4):**
1. Yazdırma / PDF (tarayıcı print dialogu)
2. Panoya kopyala: Markdown veya düz metin (yazdırma sayfası araç çubuğu)
3. Dosyaya indir: `.md` / `.txt` (yazdırma sayfası araç çubuğu)
4. Cevap altı hızlı indirme: tek soru-cevap çifti `.md` / `.txt` (yalnız Gemini)

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
                                 │ chrome.storage.local.set({konusmaVerisi,
                                 │                            yazdirAyarlari})
                                 │ chrome.runtime.sendMessage(
                                 │            {islem:'yazdirmaSayfasiAc'})
                                 ▼
                  ┌──────────────────────────────┐
                  │   background.js (SW, MV3)    │
                  │  • yazdirmaSayfasiAc→tabs.create
                  │  • Ctrl+Shift+P komutu       │
                  │  • badge uyarıları (!,F5)    │
                  │  • onInstalled kalıntı temizliği
                  └──────────────┬───────────────┘
                                 │ chrome.tabs.create(yazdir.html)
                                 ▼
┌────────────────────────── YAZDIRMA SEKMESİ ───────────────────────────────┐
│  yazdir.html  →  ortak-yardimcilar.js + yazdir.js                         │
│  1. storage.local.get → OKU-VE-HEMEN-SİL (multi-tab race koruması)        │
│  2. sessionStorage'a yedekle (F5 dayanıklılığı — sekmeye özel)            │
│  3. htmlTemizle() whitelist sanitizer → DOM render                        │
│  4. Araç çubuğu: Yazdır | Markdown | Metin | ↓ MD | ↓ TXT | Kapat         │
│  5. otomatikYazdir ise: resimler yüklenince window.print()                │
└───────────────────────────────────────────────────────────────────────────┘

İkinci tetikleme yolu (popup):
  popup.js → chrome.tabs.sendMessage({islem:'konusmayiCikar'})
           → content script async yanıt → popup quota kontrolü
           → popup storage.local.set + tabs.create(yazdir.html)
```

**Önemli mimari kararlar:**

| Karar | Gerekçe |
|-------|---------|
| Ortak modüller `content_scripts.js[]` array'inde ilk sırada | MV3'te aynı isolated world'e sıralı yüklenir; ES module/bundler gerekmez. Top-level `function` bildirimleri sonraki script'lere global görünür |
| `popup.html` ve `yazdir.html` de `ortak-yardimcilar.js`'i `<script>` ile yükler | `VARSAYILAN_AYARLAR`, `quotaKontrol`, `htmlToMarkdown`, `dosyayaIndir` tek kaynak (DRY) |
| Veri taşıma `chrome.storage.local` üzerinden (URL parametresi değil) | Konuşma MB mertebesinde olabilir; URL limiti yetmez. Storage 10 MB |
| Oku-ve-hemen-sil + sessionStorage yedeği | Multi-tab yarışını çözer + F5 veri kaybını önler (Bölüm 20) |
| Resimler base64'e content script'te çevrilir | Yazdırma sayfası farklı origin — sayfanın blob/korumalı resimlerine erişemez (EK G.6) |
| Vanilla JS, sıfır bağımlılık | Baran kuralı: framework yok, npm yok, minimal etki |

---

## 3. Çalışma Ortamı ve Bağımlılıklar

- **Tarayıcı:** Chrome **114+** (`minimum_chrome_version: "114"`)
- **Manifest:** V3 (service worker background)
- **Bağımlılık:** YOK — tamamen vanilla JS + Web API (DOMParser, Canvas, Blob, Clipboard, sessionStorage)
- **Geliştirme araçları:** `node --check` (syntax), Python 3 (`http.server` ile test düzeneği + ikon üretimi için PIL)
- **İzinler:** `activeTab`, `storage`, `clipboardWrite` — başka hiçbir izin YOK (`scripting` v1.7.0'da kaldırıldı; statik content_scripts izin gerektirmez)

---

## 4. Dosya Yapısı (Tam Liste)

```
GeminiPrinter/
├── manifest.json            # MV3 manifest — izinler, content_scripts, commands, CSP, i18n
├── background.js            # Service worker (57 satır)
├── resim-yardimcilari.js    # Paylaşılan resim→base64 + deadline + UI görsel filtresi (178)
├── ortak-yardimcilar.js     # Ayarlar, quota, başlık, MD motoru, indirme (423)
├── content.js               # Gemini (521)
├── content-claude.js        # Claude + artifact (445)
├── content-chatgpt.js       # ChatGPT (286)
├── content-grok.js          # Grok çoklu-fallback (434)
├── popup.html               # Eklenti popup UI — inline CSS (216)
├── popup.js                 # Popup mantığı (181)
├── yazdir.html              # Yazdırma önizleme iskeleti (60)
├── yazdir.js                # Okuma + sanitizer + render + export (483)
├── yazdir.css               # Ekran + @media print stilleri (480)
├── _locales/
│   ├── tr/messages.json     # extName, extDescription, actionTitle, kisayolAciklama
│   └── en/messages.json     # Aynı 4 anahtar İngilizce
├── icons/
│   ├── icon16.png  icon48.png  icon128.png
│   └── ikon_olustur.py      # PIL ile ikon üretici (geliştirme aracı, pakete girmez)
├── README.md                # İki dilli tanıtım + changelog
├── CLAUDE.md                # Geliştirme kuralları (Claude Code için)
├── TEKNIK_DOKUMANTASYON.md  # Bu dosya
├── LICENSE                  # MIT
└── .gitignore
```

### `.gitignore` (birebir)
```gitignore
# Claude Code yerel ayarları
.claude/

# İşletim sistemi çöp dosyaları
Thumbs.db
Desktop.ini
.DS_Store

# Editör
.vscode/
.idea/
*.swp

# Log ve geçici dosyalar
*.log
*.tmp
*.bak
```

---

## 5. manifest.json

```json
{
  "manifest_version": 3,
  "name": "__MSG_extName__",
  "short_name": "__MSG_extName__",
  "version": "1.7.8",
  "description": "__MSG_extDescription__",
  "minimum_chrome_version": "114",
  "default_locale": "tr",
  "homepage_url": "https://github.com/baranseren/ai-chat-printer",
  "permissions": ["activeTab", "storage", "clipboardWrite"],
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
| `run_at: document_idle` | SPA'lar tam yüklensin; buton enjeksiyonu zaten retry + MutationObserver'lı |
| `js[]` sırası | resim-yardimcilari → ortak-yardimcilar → site script'i. **Sıra değişirse global fonksiyonlar tanımsız kalır** |
| CSP `img-src 'self' data: https:` | Yazdırma sayfası base64 (`data:`) ve https resimleri gösterir. **`blob:` bilinçli YOK** — content-origin blob extension sayfasında zaten ölü doğar (EK G.6) |
| CSP `style-src 'unsafe-inline'` | popup.html inline `<style>` bloğu + dinamik `style.cssText` atamaları için zorunlu |
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
          artifactlar: [                      // YALNIZ Claude — yoksa alan hiç konmaz (undefined)
              { baslik: 'app.py', tur: 'Code · PY', icerik: 'print(1)' }   // icerik null olabilir (çıkarılamadı)
          ]
        }
    ],
    hata: 'mesaj'                  // YALNIZ hata durumunda; varsa mesajlar=[] gelir
}
```

**Üç içerik kanalı kuralı (KRİTİK):** `html`, `metin`, `resimler` aynı içeriğin üç ayrı kanalıdır. Bir filtre/temizlik kuralı eklenirken ÜÇÜNE BİRDEN uygulanmalıdır (v1.7.1–1.7.4 bug serisinin dersi — EK G.1).

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

1. `src` yoksa → `null`; `src` zaten `data:` ise → aynen döndür; deadline dolmuşsa → https ise URL'i döndür, değilse `null`
2. **Katman 1 — Canvas:** resim `!complete` ise `addEventListener('load'/'error', {once:true})` + 5 sn timeout ile bekle (**`onload =` property ATAMA YASAK** — sayfanın kendi handler'ını ezer, EK G.8). `naturalWidth === 0` → https ise URL döndür. Genişlik > **800 px** ise oranlı küçült. `canvas.toDataURL('image/jpeg', 0.92)`
3. **Katman 2 — Fetch:** Canvas `SecurityError` (tainted cross-origin) fırlatırsa: `AbortController` + 5 sn timeout'lu `fetch(orijinalSrc)` → `blob` → `FileReader.readAsDataURL`
4. **Katman 3 — URL:** Fetch de başarısızsa: `https://` ile başlıyorsa orijinal URL'i döndür (yazdırma sayfası `<img>` ile dener), değilse `null`

### `resimliHtmlCikar(element) -> Promise<string>`
Element klonlanır (`cloneNode(true)`), **orijinaldeki** img'ler sırayla `resmiBase64Yap`'tan geçirilir, başarılı olanların base64'ü **klondaki** eş-indeksli img'e yazılır, başarısızlar klondan silinir. Dönüş: `kopya.innerHTML`. Resim hiç yoksa kısa devre `element.innerHTML`.

### `uiElementiIcindeMi(element) -> boolean`
`element.closest('button, [role="button"], mat-icon')` — **UI bileşeni içindeki görsel içerik DEĞİLDİR** (beğen/kopyala ikonları, buton sprite'ları çıktıya giremez).

### `turnResimleriniTopla(turn, kaynakElement) -> Promise<Array<{src,alt}>>`
Kaynak elementin DIŞINDA kalan görselleri toplar (kullanıcının yüklediği dosya önizlemeleri vb.):
1. `turn.querySelectorAll('img')` — kaynak içindekiler ve `uiElementiIcindeMi` olanlar atlanır; kalanlar `resmiBase64Yap`
2. `turn.querySelectorAll('*')` üzerinde `getComputedStyle(el).backgroundImage` taraması — `url(...)` regex'i `/url\(["']?(.+?)["']?\)/`; `data:`/`https:`/`blob:` URL'ler geçici `new Image()` (`crossOrigin='anonymous'`) ile yüklenip base64'e çevrilir; yükleme başarısızsa https URL ham eklenir. Aynı iki atlama kuralı geçerli; her adımda deadline kontrolü

---

## 8. Ortak Modül: ortak-yardimcilar.js

### Sabitler
```javascript
const VARSAYILAN_AYARLAR = { kodBloklari: true, otomatikYazdir: true, yaziBoyutu: '13', footerGoster: true };
const STORAGE_LOCAL_LIMIT = chrome.storage?.local?.QUOTA_BYTES || (10 * 1024 * 1024);  // dinamik; fallback 10 MB
const STORAGE_UYARI_ESIGI = Math.floor(STORAGE_LOCAL_LIMIT * 0.8);                     // %80
const RESIM_TOPLAM_SURE_LIMIT = 90 * 1000;                                             // 90 sn
```

### Ayarlar — `chrome.storage.sync`, anahtar `kullaniciAyarlari`
- `ayarlariYukle() -> Promise<object>`: `{...VARSAYILAN_AYARLAR, ...kayitli}`. chrome.storage erişilemezse (context invalidation) **sessizce varsayılan döner** — `console.log` ile loglanır (`warn`/`error` DEĞİL: chrome://extensions "Errors" sayfasını kirletmesin)
- `ayarlariKaydet(ayarlar) -> Promise<boolean>`

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
`new Blob([JSON.stringify(veri)]).size` (Unicode-doğru bayt). Limit aşımı → `gecerli:false` + **dinamik** limitli mesaj (`'Storage sınırı ' + limitMb + ' MB.'` — sabit "10" yazmak yanlış bilgi olurdu); %80 üstü → `uyari:true`.

### `yazdirmayaBasla(veri, uyariBalonuGoster) -> Promise<boolean>` — ortak yazdırma akışı
1. `veri.hata` → toast + `false`  2. mesaj yoksa → toast + `false`  3. `ayarlariYukle()`  4. `quotaKontrol` — geçersizse toast + `false`  5. `chrome.storage.local` mevcudiyet kontrolü (yoksa "Eklenti bağlantısı koptu... F5")  6. `storage.local.set({konusmaVerisi, yazdirAyarlari})` — catch'te quota/`context` ayrımı yapılır  7. başarı toastı (`'N mesaj çıkarıldı...'`)  8. `chrome.runtime.sendMessage({islem:'yazdirmaSayfasiAc'})`

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
Gemini erişilebilirlik önekleri `startsWith` ile soyulur: `'Siz şunu dediniz: '`, `'Siz şunu söylediniz: '`, `'You said: '`.

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

### `artifactIcerikleriniCikar(ilerlemeCallback)` — tıkla-aç-oku-kapat döngüsü
```
artifactCikarmaAktif = true     (try/finally garantili reset)
her .artifact-block-cell kartı için sırayla:
  1. progress callback (mevcut/toplam) — try'lı güvenli çağrı
  2. başlık = '.leading-tight.line-clamp-1', tür = '.text-text-400.line-clamp-1'
  3. tıklanabilir zinciri (v1.8.1): kartGrubu = kart.closest('[class*="group/artifact-block"]') →
     grup içi button[aria-label^="View"] (yeni UI overlay) || kart.closest('[role="button"]') (eski UI) || kartGrubu;
     hiçbiri yoksa {baslik, tur, icerik:null} ekle, geç
  4. click() → viewer bekleme: 6×500ms (3 sn) '#wiggle-file-content' DOM'a gelene dek; gelmezse icerik:null
  5. 1 sn ekstra render beklemesi
  6. STABİLİTE POLLING (16×500ms = 8 sn): hedef = '#wiggle-file-content .code-block__code' || '... pre' || '... .standard-markdown' || panelin kendisi
     uzunluk öncekiyle AYNI ve >10 ise stabilSayac++; 2 ardışık eşitlikte içerik kesinleşti (streaming yarım okuma önlenir)
  7. stabilite sağlanamadıysa son durumda >10 karakter varsa onu al (aynı 4'lü hedef zinciri)
  8. kapat: button[aria-label="Go back"] (yeni UI) || button[aria-label="Close"] (eski UI) .click() → 600 ms animasyon → 6×300ms '#wiggle-file-content' silinene dek doğrula
  9. {baslik, tur, icerik} listeye
artifactCikarmaAktif = false
```

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

## 12. ChatGPT Content Script

- Buton: `header` içinde `button[aria-label="Paylaş"], button[aria-label="Share"]`'in parent'ına `insertBefore`; fallback `header.children[son]` başına. 36×36, radius 10px, renk `#8e8ea0`, hover `#10a37f`
- `konusmayiCikar()`: `[data-testid^="conversation-turn"]` sıralı; her turn'de `[data-message-author-role]` → `user`: kaynak `.user-message-bubble-color` || mesajEl; `assistant`: kaynak `.markdown` || mesajEl; üç kanal standart
- Başlık: `nav a[href^="/c/"][data-active="true"]` | `.bg-token-sidebar-surface-secondary` | `[aria-current="page"]` → doc.title → `'ChatGPT Konuşması'`
- Streaming kontrolü aktif; toast renkleri: başarı `#10a37f`, hata `#ef4444`

## 13. Grok Content Script

- **Floating buton:** Grok'un agresif React reconciliation'ı header enjeksiyonunu siliyor → buton `document.body`'ye `position:fixed; top:14px; right:240px` 36×36 yuvarlak beyaz buton olarak eklenir (React DOM'una dokunulmaz)
- `grokMesajRolu(el)` — 4 stratejili rol tespiti: (0) **data-testid** (v1.8.1 — 2026-07 Grok DOM'u `.message-bubble` balonlarını `data-testid="user-message"` / `"assistant-message"` ile işaretler; `/(^|-)(user|human)(-|$)/` ve `/(^|-)(assistant|grok|ai|bot|model)(-|$)/` kalıpları), (1) data attribute'lar (`data-message-author-role`, `data-role`, `data-author`, `data-sender`, `data-message-role` → user/human vs assistant/grok/ai/bot/model), (2) aria-label substring (ASCII-boundary regex — Türkçe karakter `\b` ile çalışmaz: `/(^|[^a-z])(user|you|sen|kullanıcı|kullanici)([^a-z]|$)/i`), (3) class regex (user-message/query-bubble vs assistant-message/response-bubble havuzları)
- `konusmayiCikar()` — **5 kademeli konteyner stratejisi** (sırayla, ≥2 aday bulan kazanır): (1) scroll alanı doğrudan çocukları (`main [class*="overflow-y"]` vb. 7 aday selektör; çocuk yetersizse `:scope > * > *` derinliği), (2) data-attribute taraması, (3) aria-label taraması, (4) `article, [role="article"]`, (5) geniş class regex havuzu. Her stratejinin sonucu `[Grok DEBUG]` console loglarına yazılır (hata mesajı kullanıcıyı F12'ye yönlendirir — bilinçli üretim logu)
- Rol bulunamazsa **alternating fallback** (`oncekiRol` ters çevirme, ilk mesaj user varsayımı); içerik `enZenginIcerikDescendant` (öncelik `.markdown/.prose/[class*="message-text"]`; yoksa en uzun metinli descendant)
- Tema: koyu gri `#1f2937`; toast başarı koyu gri, hata `#dc2626`

---

## 14. Background Service Worker

```javascript
chrome.runtime.onMessage.addListener((mesaj, gonderen, yanitGonder) => {
    if (mesaj.islem === 'yazdirmaSayfasiAc') {
        chrome.tabs.create({ url: chrome.runtime.getURL('yazdir.html') });
        yanitGonder({ basari: true });
        return false;                       // senkron yanıt
    }
    return false;
});
```

**Ctrl+Shift+P komutu (`yazdir-kisayol`):** aktif sekme `chrome.tabs.query({active:true, currentWindow:true})`; URL 4 desteklenen domain'den birini içermiyorsa kırmızı `!` badge 3 sn; içeriyorsa `chrome.tabs.sendMessage({islem:'klavyeKisayoluYazdir'})` — content script erişilemezse (catch) amber `F5` badge 4 sn (sayfa yenileme önerisi).

**`onInstalled`:** install/update logu + **kalıntı temizliği**: `chrome.storage.local.remove(['konusmaVerisi','yazdirAyarlari'])` — yazdir.html hiç açılmadan kalmış geçici veri (10 MB'a dek) silinir.

---

## 15. Popup

**popup.html:** 320 px genişlik, koyu tema (`#1a1a2e` zemin), inline `<style>`. Bileşenler: başlık (28px yazıcı SVG + "AI Chat Printer" + alt açıklama), `#durumAlani` (gizli durum şeridi; `.basarili/.hata/.bilgi` sol-kenar renkli), 4 ayar satırı (toggle switch'ler: `kodBloklari`, `otomatikYazdir`, `footerGoster`; select: `yaziBoyutu` 11/13/15), `#yazdirButonu` (gradyan `#4a8cff→#6a5aff`), alt bilgi (kısayol + sürüm). Script sırası: `ortak-yardimcilar.js` → `popup.js`.

**popup.js akışı:**
1. `DOMContentLoaded`: `chrome.storage.sync.get(['kullaniciAyarlari'])` → `{...VARSAYILAN_AYARLAR, ...kayit}` → UI'ya yansıt
2. **Proaktif site kontrolü:** aktif sekme URL'si `DESTEKLENEN_URLLER = ['gemini.google.com','claude.ai','chatgpt.com','grok.com']` içinde değilse bilgi mesajı + yazdır butonu disabled (opacity 0.5, `not-allowed`)
3. Her ayar değişiminde otomatik `sync.set` + "Ayar kaydedildi." (1.5 sn sonra yalnız `bilgi` sınıfıysa gizlenir)
4. Yazdır tıklaması: buton disable + "Çıkarılıyor..." (**`butonMetniGuncelle`** — SVG'yi koruyarak yalnız text node güncellenir) → site kontrolü → `sendMessage({islem:'konusmayiCikar'})` try/catch ("Content script yüklenmemiş... F5") → boş yanıt / `yanit.hata` / boş mesajlar ayrı ayrı raporlanır → **`quotaKontrol(yanit)`** → ayarlar `sync.set` → `local.set({konusmaVerisi: yanit, yazdirAyarlari})` → `tabs.create(yazdir.html)`

---

## 16. Yazdırma Sayfası

**yazdir.html iskeleti:** `.kontrol-cubugu` (yalnız ekran; başlık + 6 buton: `#yazdirTetikle` "Yazdır" [birincil], `#markdownKopyala` "Markdown", `#metinKopyala` "Metin", `#markdownIndir` "↓ MD", `#metinIndir` "↓ TXT", `#sayfayiKapat` "Kapat"), `#yuklemeOverlay` (spinner + durum metni, `role="status" aria-live="polite"`), `#toastAlani` (ARIA live region), `#yazdirmaAlani` (başlık bloğu `#konusmaBasligi` h1 + `#konusmaTarihi/#mesajSayisi/#kaynakSite` + `#mesajlarAlani` + footer). Script: `ortak-yardimcilar.js` → `yazdir.js`.

**yazdir.js `DOMContentLoaded` akışı (sıra önemli):**
1. `storage.local.get(['konusmaVerisi','yazdirAyarlari'])` → veri geldiyse **anında** `storage.local.remove(...)` (oku-ve-hemen-sil)
2. **sessionStorage senkronizasyonu:** veri geldiyse `sessionStorage.setItem('aiChatPrinterYedek', JSON.stringify({konusmaVerisi, yazdirAyarlari}))` (quota aşımı sessizce yutulur); veri YOKSA (F5) yedekten `JSON.parse` ile geri yükle
3. Veri hâlâ yoksa: overlay gizle + "Konuşma verisi bulunamadı..." mesajı, çık
4. `KAYNAK_HARITA` ile tema seçimi: `{ad:'GEMINI', sinif:'gemini', site:'gemini.google.com', baslik:'Gemini Konuşması'}` ×4 + bilinmeyen kaynak → `{ad:'AI', sinif:'ai', baslik:'AI Konuşması'}` (sessizce gemini'ye düşmek YASAK)
5. Ayar uygulama: `yaziBoyutu` → `#yazdirmaAlani.style.fontSize`; `footerGoster === false` → footer `display:none`
6. Başlık/tarih/sayı/site **`textContent` ile** yazılır (XSS-güvenli); `document.title = baslik` (**PDF dosya adı bu satırdır**)
7. **Mesaj render döngüsü** — her mesaj için: `.mesaj-blogu` > etiket satırı (`#N` + `KULLANICI|GEMINI|...` rozeti) + `.mesaj-icerigi`:
   - `hamIcerik = mesaj.html || escape(mesaj.metin).replace(/\n/g,'<br>')` — düz metin fallback'inde newline'lar korunur (`& < >` önce escape edilir)
   - `htmlTemizle(hamIcerik)` → DOM fragment append; boşsa resimliyse "(Bu mesajda yalnızca görsel içerik var)", değilse "(Boş mesaj)"
   - kullanıcı mesajıysa `prefixTemizleDOM` (TreeWalker ilk text node'da "Siz şunu dediniz: " soyulur)
   - `kodBloklari === false` → tüm `pre`'ler silinir; tablolar varsa flag (landscape toast'u için)
   - `mesaj.resimler` döngüsü: yalnız `data:image/` veya `https://` src kabul; `loading="lazy"`, `onerror`'da kendini gizler
   - `mesaj.artifactlar`: `.artifact-blogu` (koyu başlık şeridi + `pre>code` textContent içerik veya "(Artifact içeriği çıkarılamadı)"); kodBloklari kapalıysa gizli
8. Tablo varsa 1.2 sn sonra "Geniş tablolar tespit edildi... Yatay (Landscape)..." bilgi toastı
9. `otomatikYazdir` ise: TÜM `img`'lerin load/error/3sn-timeout promise'leri `Promise.all` → 200 ms → `window.print()`
10. Buton bağlama: yazdır → `window.print()`; Markdown/Metin kopyala → `konusmayiMarkdowneDonustur` / `konusmayiDuzMetneDonustur` → `panoyaKopyala` (Clipboard API → `execCommand('copy')` fallback'li) + toast; ↓ MD / ↓ TXT → aynı üreticiler → `dosyayaIndir(icerik, baslik + '.md|.txt', mime)`; Kapat → `sayfayiKapat()` (storage temizle + `chrome.tabs.getCurrent → tabs.remove`, fallback `window.close`)
11. Kısayollar: `Escape` → kapat; `Ctrl/Cmd+Shift+M` → Markdown kopyala

**`konusmayiDuzMetneDonustur(veri)`:** başlık + tarih + 60×`=`; her mesaj `[#N] ROL` + 40×`-` + `mesaj.metin`; artifact'lar `[DOSYA] baslik (tur)` + içerik; resimler `[N görsel içerik]`; footer imza.

---

## 17. HTML Sanitizer

`htmlTemizle(htmlString) -> HTMLDivElement` — **innerHTML hiçbir yerde kullanılmaz**; her düğüm `createElement`/`createTextNode` ile yeniden üretilir.

**İzinli etiketler (whitelist, 46):**
`P H1-H6 UL OL LI PRE CODE STRONG B EM I U BR TABLE THEAD TBODY TR TH TD TFOOT CAPTION BLOCKQUOTE A SPAN DIV HR SUP SUB IMG FIGURE FIGCAPTION DEL S MARK SMALL KBD SAMP VAR DL DT DD`

**İçerikleriyle atlanan etiketler:** `SCRIPT STYLE NOSCRIPT TEMPLATE IFRAME OBJECT EMBED BUTTON SELECT TEXTAREA SVG CANVAS AUDIO VIDEO MAT-ICON` (`tagName.toUpperCase()` ile) — buton yazısı/ikon ligature/CSS kuralı çıktıya giremez.

**Üç sınıf kuralı:** whitelist'te → kopyala + içine in; atlama listesinde → tamamen yok say; ikisinde de değil → **tag'i at, içeriğine in** (yapısal kabuk div'leri için).

**Attribute kuralları:**
- `class` aynen kopyalanır (stil sürekliliği); başka attribute default kopyalanmaz
- `A`: yalnız `http:// https:// mailto: tel:` href; http(s) ise `target="_blank"` + `rel="noopener noreferrer"`
- `IMG`: src yalnız `^data:image/(png|jpeg|jpg|gif|webp);(base64,|charset=)` (SVG data-URI XSS engeli — raster-only) VEYA `https://` (içinde `javascript:` geçmeyen). Ek: `alt` (yoksa "Görsel"), `loading="lazy"`, `referrerpolicy="no-referrer"`

---

## 18. Yazdırma Stilleri

**Ekran:** zemin `#eef1f5`; içerik kartı 820 px, beyaz, 48/56 px padding. Kontrol çubuğu koyu `#1a1a2e`, `flex-wrap: wrap` (6 buton dar pencerede taşmaz). Yükleme overlay'i `rgba(26,26,46,0.92)` + dönen spinner.

**Rol renk sistemi (rozet zemin/metin + içerik sol çizgisi):**
| Sınıf | Rozet | Sol çizgi |
|-------|-------|-----------|
| `.kullanici` | `#e3edfd` / `#1a6be0` | `#4a8cff` |
| `.gemini` | `#fde3e1` / `#d42b1e` | `#ea4335` |
| `.claude` | `#fef3c7` / `#b45309` | `#d97706` |
| `.chatgpt` | `#d1fae5` / `#047857` | `#10a37f` |
| `.grok` | `#e5e7eb` / `#1f2937` | `#1f2937` |

**Tipografi:** kod `Consolas`; `pre` açık gri kutu, `code` `#c7254e`; tablolar `table-layout: fixed` + `word-break: break-word` (taşma çözümü); linkler `word-break: break-all`.

**`@media print`:** kontrol çubuğu/overlay/toast `display:none !important`; tüm elementlere `print-color-adjust: exact`; `@page { size: A4; margin: 2cm 1.5cm; }` — **`@page` margin box'ları (`@bottom-right` + `counter(pages)`) KULLANILMAZ: Chrome desteklemiyor** (14 ay dead CSS olarak yaşadı, v1.7.0'da kaldırıldı); `pre` satır kaydırmalı; `.mesaj-blogu`/`tr`/`img` `page-break-inside: avoid`; `thead { display: table-header-group }` (çok sayfalı tabloda başlık tekrarı); `a[href^="http"]::after { content: " (" attr(href) ")" }` (yazdırılan linkin URL'i görünür).

---

## 19. Mesajlaşma Protokolü

| `islem` | Yön | Yanıt | Kanal kuralı |
|---------|-----|-------|--------------|
| `yazdirmaSayfasiAc` | content → background | `{basari:true}` senkron | `return false` |
| `konusmayiCikar` | popup → content | konusmaVerisi VEYA `{hata, mesajlar:[]}` **asenkron** | bu dalda `return true` |
| `klavyeKisayoluYazdir` | background → content | `{basari:true}` senkron | `return false` |

**ALTIN KURAL (v1.7.0'ın en sinsi bug'ı):** `onMessage` listener'ında `return true` **mesaj yoluna özeldir, listener'a değil**. Koşulsuz `return true` + yanıt göndermeyen yol = gönderen tarafta "message port closed before a response was received" → background bunu "content script yok" sanıp **yanlış F5 badge'i** gösterir. Her content script listener'ı şu iskelettedir:

```javascript
chrome.runtime.onMessage.addListener((mesaj, gonderen, yanitGonder) => {
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
|------|---------|--------|----------------|
| `chrome.storage.sync` | `kullaniciAyarlari` | 4 ayar | Kalıcı, cihazlar arası senkron (100 KB sınıfı, sorun değil) |
| `chrome.storage.local` | `konusmaVerisi`, `yazdirAyarlari` | Taşıma verisi (10 MB'a dek) | content/popup yazar → yazdir.js okur-okuduğu anda **siler** → `onInstalled`'da kalıntı temizliği → `sayfayiKapat`'ta da silinir |
| `sessionStorage` (yazdir sekmesi) | `aiChatPrinterYedek` | Aynı taşıma verisi | Sekmeye özel F5 yedeği; sekme kapanınca tarayıcı siler |

**Oku-ve-hemen-sil + sessionStorage ikilisi:** local storage tek global anahtar olduğundan iki sekmede art arda "yazdır" basılırsa son yazan kazanırdı; okur okumaz silmek yarış penceresini daraltır. Silme F5'te veri kaybı yaratır → sekmeye özel sessionStorage yedeği bunu kapatır ve **multi-tab korumasını bozmaz** (sessionStorage sekme-izoledir). Quota: 10 MB veri sessionStorage'a sığmayabilir → `try/catch` sessiz; o durumda F5 davranışı eski hâline (veri bulunamadı) döner.

---

## 21. Güvenlik Modeli

| Katman | Önlem |
|--------|-------|
| İzin minimizasyonu | Yalnız `activeTab + storage + clipboardWrite`; host izni yok, `tabs` yok, `scripting` yok |
| XSS — render | Whitelist sanitizer, `createElement`-only, `innerHTML` yasak; DOMParser script çalıştırmaz |
| XSS — resim | data-URI yalnız raster formatlar (`svg+xml` REDDEDİLİR — SVG script taşıyabilir); https src'de `javascript:` substring engeli |
| XSS — metin yolları | Başlık/tarih/sayı/toast/hata mesajları her yerde `textContent` |
| Link güvenliği | href şema whitelist'i; `rel="noopener noreferrer"`; MD motoru da yalnız `^https?://` linkler |
| Referrer sızıntısı | Tüm render img'lerinde `referrerpolicy="no-referrer"` |
| UI metni sızıntısı | 4 kanalda (render, metin, MD, resim) buton/ikon/stil içerikleri filtrelenir |
| CSP | `script-src 'self'` — extension sayfalarında inline/uzak script imkânsız |
| Veri gizliliği | Hiçbir veri dışarı gönderilmez; taşıma verisi okunur okunmaz silinir |

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

`icons/ikon_olustur.py` (geliştirme aracı): PIL ile 16/48/128 px PNG'ler — mavi-mor gradyan zemin üzerine beyaz yazıcı pikt ogramı. Üretim paketi yalnız PNG'leri içerir.

## 25. Versiyonlama

**Üçlü eş-zamanlı bump kuralı (ASLA ayrı commit'e kalmaz):** `manifest.json version` + `popup.html` alt bilgi satırı + `README.md` rozet ve changelog. Kontrol: `grep -n "1\.7\.8" manifest.json popup.html README.md` üçünde de eşleşmeli.

| Sürüm | Özet |
|-------|------|
| 1.0–1.2 | Gemini → +Claude/artifact/resim → +ChatGPT |
| 1.3–1.4 | Ortak modül, kalıcı ayar, kısayol, pano, ticari kalite seti |
| 1.5.x | +Grok, i18n, güvenlik denetimi, Gemini streaming false-positive kaldırma |
| 1.6.x | Gemini cevap altı ↓ MD/↓ TXT + storage sertleştirme |
| 1.7.0 | Derin denetim: gerçek MD motoru, dosya indirme, sessionStorage F5, `scripting` izni kaldırma, mesaj kanalı düzeltmesi |
| 1.7.1–1.7.8 | Saatlik öz-denetim turları: UI sızıntı filtreleri (4 kanal), fence kaçışı, dinamik quota mesajı, URL `<>` sargısı, `[]` escape, spread→reduce, runtime diakritik, linkli resim düzeltmesi, reentrance kilidi |

## 26. Kurulum ve Test Workflow

**Kurulum:** `chrome://extensions` → Geliştirici modu AÇIK → "Paketlenmemiş öğe yükle" → klasörü seç. Açık hedef-site sekmeleri **F5** ister.

**Değişiklik döngüsü:** kod değiştir → eklenti kartında ↻ → hedef sekme F5 → butonla uçtan uca dene.

**Hızlı doğrulama komutları:**
```bash
for f in *.js; do node --check "$f"; done
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8'))"
```

**Tarayıcı-içi birim test düzeneği (bağımlılıksız):** geçici `test.html` (fixture DOM + `<script src="ortak-yardimcilar.js">` + doğrulama scripti) → `python -m http.server 8765` → `http://127.0.0.1:8765/test.html` → sonuç `<pre>`'den okunur → düzenek SİLİNİR. `file://` ÇALIŞMAZ (tarayıcı otomasyon araçları https'e zorlar). Uçtan uca render testi için `window.chrome` mock'u (storage.local.get fixture döndürür) + yazdir.html iskeleti + `yazdir.js` yüklenir — XSS/sızıntı/prefix/artifact zinciri tek seferde doğrulanır.

## 27. Sıfırdan İnşa Adım Adım

1. Klasör + `manifest.json` (Bölüm 5 birebir) + `_locales` (Bölüm 23) + ikonlar
2. `resim-yardimcilari.js` (Bölüm 7 — deadline API → resmiBase64Yap → resimliHtmlCikar → uiElementiIcindeMi → turnResimleriniTopla)
3. `ortak-yardimcilar.js` (Bölüm 8 sırasıyla; MD motoru Bölüm 9 spesifikasyonuyla)
4. `background.js` (Bölüm 14)
5. `content.js` (Bölüm 10): baslat → buton → yazdirmaBaslat → uyariBalonuGoster → konusmayiCikar → cevap altı blok → prefix → listener (Bölüm 19 iskeleti)
6. `content-claude.js` (Bölüm 11 — artifact algoritması adım adım), sonra `content-chatgpt.js` (12), `content-grok.js` (13)
7. `popup.html` + `popup.js` (Bölüm 15)
8. `yazdir.html` + `yazdir.css` (Bölüm 16/18) + `yazdir.js` (Bölüm 16 akışı + Bölüm 17 sanitizer)
9. Bölüm 26 doğrulamaları + EK E test listesi

---

## EK A — Edge Case'ler ve Özel Durumlar

| Durum | Davranış |
|-------|----------|
| Konuşma konteyneri bulunamadı | `{hata: 'Konuşma bulunamadı. Bir X sohbeti açık olduğundan emin olun.', mesajlar: []}` |
| Çıkarma sırasında exception | Sayfa içi: hata toastı; popup yolu: `{hata: 'Konuşma çıkarılamadı: ' + message}` — popup asla yanlış "yüklenmemiş" demez |
| AI yanıt yazarken yazdırma | Claude/ChatGPT/Grok: engellenir + uyarı; **Gemini: engellenmez** (false positive geçmişi) |
| Çift tıklama | Reentrance kilidi — "işlem zaten sürüyor" toastı |
| Eklenti reload + eski sekme | Ölü butonlar silinir-yeniden enjekte edilir; storage erişim hataları "F5" yönlendirmeli toast'lara çevrilir |
| Yazdırma sekmesinde F5 | sessionStorage yedeğinden geri yükleme |
| İki sekmede art arda yazdır | Oku-ve-hemen-sil — ikinci sekme kendi verisini okur (pencere daraltılmış yarış) |
| 10 MB'tan büyük konuşma | quotaKontrol reddeder (dinamik limitli mesaj); %80 üstü yalnız konsol bilgisi |
| 90 sn'den uzun resim işleme | Deadline — kalan resimler atlanır/URL'e düşer, akış asılı kalmaz |
| Tek resim 5 sn'de yüklenmedi | O resim fetch fallback'ine, o da olmazsa https-URL/atlama |
| Cross-origin canvas taint | 3 katmanlı fallback (Bölüm 7) |
| Artifact viewer açılmadı/içerik gelmedi | `icerik:null` → render'da "(Artifact içeriği çıkarılamadı)" |
| Grok DOM'u tanınamadı | 5 strateji + alternating rol; yine olmazsa F12 `[Grok DEBUG]` yönlendiren hata |
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

### ChatGPT
| Amaç | Selektör | K |
|------|----------|---|
| Turn | `[data-testid^="conversation-turn"]` + `[data-message-author-role]` | 🟢 |
| Kullanıcı balon / AI metin | `.user-message-bubble-color` / `.markdown` | 🟡 |
| Paylaş | `button[aria-label="Paylaş"], button[aria-label="Share"]` | 🟢(2 dil) |
| Sidebar aktif | `nav a[href^="/c/"][data-active="true"]` vb. 3'lü | 🟡 |

### Grok
Tek selektöre güvenilmez — Bölüm 13'teki 5 strateji + 4 katmanlı rol tespiti (v1.8.1: `data-testid="user-message"/"assistant-message"` en öncelikli) + `[Grok DEBUG]` teşhis logları bütün olarak uygulanır. 🔴 doğası gereği; dayanıklılık stratejilerin çokluğundan gelir. 2026-07 DOM: mesajlar `.message-bubble` + data-testid; yanıt içeriği `.response-content-markdown.markdown` (thinking `.thinking-container` ayrı — öncelikli aday seçimi sızmayı önler).

## EK D — Veri Akışı Sırası (Tam Tur)

```
YOL A — sayfa içi buton / Ctrl+Shift+P:
 1. click → yazdirmaBaslat()
 2. [Claude/ChatGPT/Grok] streamingMiKontrol → yazıyorsa uyar, DUR
 3. reentrance kilidi al
 4. [Claude] artifactIcerikleriniCikar (progress toast'larıyla)
 5. resimIslemOturumuBaslat(90sn) → konusmayiCikar()
    her turn: resimliHtmlCikar (klon+base64) + temizMetinCikar + turnResimleriniTopla
 6. yazdirmayaBasla: ayar yükle → quotaKontrol → storage.local.set → toast →
    sendMessage(yazdirmaSayfasiAc)
 7. background: tabs.create(yazdir.html)
 8. yazdir.js: get → ANINDA remove → sessionStorage yedek → KAYNAK_HARITA →
    render (htmlTemizle + prefixTemizleDOM + resimler + artifact'lar)
 9. otomatikYazdir: resim load'ları → window.print() → kullanıcı PDF/yazıcı
10. finally: kilit bırak + resimIslemOturumuBitir

YOL B — popup:
 1. popup aç → ayarlar yüklenir → site kontrolü (değilse buton disabled)
 2. Yazdır → sendMessage(konusmayiCikar) → content script async (kilit+oturum+catch)
 3. popup: hata/boş kontrolleri → quotaKontrol → sync.set(ayarlar) → local.set → tabs.create
 4. 8-9 Yol A ile aynı

F5 (yazdırma sekmesi): get boş → sessionStorage 'aiChatPrinterYedek' → render devam
Kapat: storage temizle → tabs.getCurrent→remove → (fallback window.close)
```

## EK E — Test Kontrol Listesi (30 madde)

- [ ] 4 sitede buton doğru konumda görünür (Gemini toolbar, Claude Share solu, ChatGPT Paylaş solu, Grok floating)
- [ ] SPA navigasyonunda buton geri gelir (sidebar'dan sohbet değiştir)
- [ ] Eklenti ↻ + sayfa F5'siz: butonlar tıklanınca "bağlantı koptu/F5" rehberi (sessiz ölüm yok)
- [ ] Eklenti ↻ + F5: toolbar VE cevap altı butonlar canlı (ölü handler temizliği)
- [ ] Çift tıklama: "işlem zaten sürüyor" — ikinci sekme AÇILMAZ
- [ ] Streaming sırasında: Claude/ChatGPT/Grok uyarır; Gemini engellemez
- [ ] Yazdırma sayfası: başlık/tarih/sayı/kaynak doğru; document.title = başlık (PDF adı)
- [ ] Mesaj rozetleri site temasında; kullanıcı mesajında "Siz şunu dediniz:" YOK
- [ ] Resimli Gemini konuşması: içerik resimleri çıktıda; buton/ikon görselleri YOK
- [ ] Claude artifact'ları: progress toast'ları; içerik tam (yarım okuma yok); viewer kapanmış
- [ ] Kod blokları toggle: kapalıyken pre'ler ve artifact'lar gizli
- [ ] Yazı boyutu 11/13/15 uygulanıyor; footer toggle çalışıyor; ayarlar kalıcı (popup yeniden açınca aynı)
- [ ] otomatikYazdir: resimler yüklendikten sonra print dialogu
- [ ] Markdown kopyala: başlıklar `#`, kod ```dil fence'li, tablolar pipe — DÜZ METİN DEĞİL
- [ ] Metin kopyala: buton yazısı sızıntısı YOK ("Kodu kopyala" araması 0 sonuç)
- [ ] ↓ MD / ↓ TXT (sayfa): dosya iner, adı = başlık, içerik panoya kopyalananla aynı
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
- [ ] >10 MB konuşma: dinamik limitli quota mesajı
- [ ] XSS fixture (script+onerror+svg-data-uri): hiçbiri çalışmaz/render olmaz
- [ ] Geniş tablo: landscape önerisi toastı; print'te tablo taşmıyor
- [ ] Tüm görünen metinler tam diakritikli ("Yazdırma Önizleme", "Konuşma:", "alınamadı")

## EK F — Kullanıcıya Görünen Tüm Metinler (birebir)

**Toast'lar (content script'ler):** `Konuşma çıkarılıyor, resimler işleniyor...` · `{N} mesaj çıkarıldı. Yazdırma sayfası açılıyor...` · `Yazdırma işlemi zaten sürüyor, lütfen bekleyin...` · `Konuşma çıkarılamadı: {mesaj}` · `{Claude|ChatGPT|Grok} henüz yanıt yazıyor. Tamamlanmasını bekleyin.` · `{N} artifact bulundu, içerikleri çıkarılıyor (0/{N})...` · `Artifact {i}/{N} çıkarılıyor...` · `İndirildi: {dosyaAdi}` · `Konuşmada mesaj bulunamadı.` · `Hata: {veri.hata}` · `Eklenti bağlantısı koptu. Sayfayı yenileyip (F5) tekrar deneyin.` · `Storage sınırı doldu. Lütfen daha kısa bir konuşma seçin veya resimleri atlayın.` · `Arka plan bağlantısı koptu. Sayfayı yenileyin (F5).` · `Konuşma çok büyük ({X} MB). Storage sınırı {Y} MB. Lütfen daha kısa bir konuşma seçin.`

**Hata nesneleri:** `Konuşma bulunamadı. Bir {Gemini|Claude|ChatGPT} sohbeti açık olduğundan emin olun.` · `Grok konuşma yapısı tanınamadı. F12 → Console'da [Grok DEBUG] log'larını inceleyip eklenti geliştiricisine iletin.` · `Grok konuşma içeriği çıkarılamadı. ...` · `Yazdırma işlemi zaten sürüyor. Lütfen bekleyin.`

**Popup:** `Bu sayfa desteklenmiyor. Eklenti gemini.google.com, claude.ai, chatgpt.com ve grok.com sayfalarında çalışır.` · `Konuşma içeriği çıkarılıyor...` · `Content script yüklenmemiş. Sayfayı yenileyip (F5) tekrar deneyin.` · `Sayfadan yanıt alınamadı. ...` · `Konuşmada mesaj bulunamadı. Bir sohbet açık olduğundan emin olun.` · `Ayar kaydedildi.` · `Ayar kaydedilemedi.` · `Bir hata oluştu: {mesaj}` · buton: `Konuşmayı Yazdır` / `Çıkarılıyor...`

**Yazdırma sayfası:** başlık `AI Chat Printer - Yazdırma Önizleme` · butonlar `Yazdır · Markdown · Metin · ↓ MD · ↓ TXT · Kapat` · overlay `Konuşma yükleniyor...` / `Konuşma verisi okunuyor...` / `İçerik işleniyor ({N} mesaj)...` · toast'lar `Markdown panoya kopyalandı.` / `Düz metin panoya kopyalandı.` / `Kopyalama başarısız. Tarayıcı izinlerini kontrol edin.` / `İndirildi: {ad}` / `Geniş tablolar tespit edildi. Yazdırma diyaloğunda "Yatay" (Landscape) yönlendirme daha okunabilir olabilir.` · placeholder'lar `(Boş mesaj)` / `(Bu mesajda yalnızca görsel içerik var)` / `(Artifact içeriği çıkarılamadı)` · footer `Bu çıktı AI Chat Printer eklentisi ile oluşturulmuştur.` · hata `Konuşma verisi bulunamadı. Lütfen AI sayfasından tekrar yazdır butonuna tıklayın.` / `Storage erişim hatası: {mesaj}`

**MD/TXT şablon sabitleri:** Bölüm 8 ve 10'da birebir verildi (`# Gemini Soru-Cevap`, `**Tarih:**`, `## Soru`, `SORU:`, `Konuşma:`, `*(Soru metni alınamadı)*`, `(Cevap metni alınamadı)`, imzalar).

## EK G — Kritik Etkileşim Noktaları (Sıkça Atlananlar)

1. **Üç içerik kanalı:** `html`/`metin`/`resimler` ayrı kanallardır; filtre üçüne birden uygulanır. Tek kanalı düzeltip "bitti" demek bug'ın belirtisini düzeltmektir
2. **`return true` yol-bazlıdır** (Bölüm 19) — koşulsuz yazmak background'da hayalet F5 badge'i üretir
3. **Escape işlenmemiş veriye uygulanır:** `[]` escape'i yalnız `children.length===0` linklerde — işlenmiş markdown'a escape iç sözdizimi (`![alt](src)`) bozar
4. **Sabit fence yazma** — `mdFenceUret` zorunlu; spread yerine `reduce` (dev içerik stack overflow)
5. **`onload =` property ataması yasak** — sayfanın kendi handler'ı ezilir; `addEventListener {once:true}` + timeout temizliği
6. **blob: cross-context ölüdür** — content-origin blob URL extension sayfasında yüklenmez; bu yüzden base64'e content script'te çevrilir, sanitizer/CSP blob kabul etmez
7. **Oku-ve-hemen-sil'in F5 bedeli sessionStorage ile ödenir** — silmeyi kaldırmak multi-tab yarışını geri getirir, yedeklemeyi kaldırmak F5 kaybını
8. **`cocuk.getAttribute('href')` kullan, `.href` değil** — property DOM-resolve eder (relative→absolute), şema kontrolü ham string üzerinde yapılmalı
9. **Custom element kabuğuna `appendChild` etme; wrapper span de koyma** — Angular Material'de flex container child div'dir; mevcut butonun `parentElement`'ine kardeş `insertBefore` (yoksa butonlar alt satıra düşer)
10. **Closure'a içerik değil DOM referansı sabitle** — cevap altı butonlar metni tıklama anında çıkarır (streaming/regenerate/edit toleransı)
11. **Stabilite polling'i = 2 ardışık eşit uzunluk** — Claude artifact içeriği stream edilir; tek ölçüm yarım veri döndürür
12. **`@page` margin box / `counter(pages)` Chrome'da YOK** — sayfa numarası istenirse print dialogundaki "Üstbilgi ve altbilgiler" seçeneği önerilir; CSS'e koymak dead code'dur

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
10. **Neden dinamik quota mesajı?** `QUOTA_BYTES` tarayıcıya göre değişebilir; sabit "10 MB" yazmak yanlış bilgi sınıfı bug'dır

## EK I — Dosya/Fonksiyon Haritası (v1.7.8 satır aralıkları)

| Dosya | Satır | İçerik sırası |
|-------|-------|---------------|
| background.js | 57 | onMessage (4-11) · onCommand (14-46) · onInstalled+temizlik (49-57) |
| resim-yardimcilari.js | 178 | deadline API (6-22) · resmiBase64Yap (25-91) · resimliHtmlCikar (93-117) · uiElementiIcindeMi (119-122) · turnResimleriniTopla (124-178) |
| ortak-yardimcilar.js | 423 | sabitler (6-17) · ayarlar (20-46) · debounce (49) · streamingMiKontrol (60) · basligiTemizle (87) · veriBoyutu/quota (124-146) · yazdirmayaBasla (148) · mdFenceUret (207) · htmlToMarkdown (214-350) · mesajMarkdownIcerigi (352) · konusmayiMarkdowneDonustur (362) · uiTemizKlon (400) · temizMetinCikar (407) · dosyayaIndir (413) |
| content.js | 521 | state (5-6) · baslat (9) · butonuEnjekteEt (28) · yazdirmaBaslat (127) · uyariBalonuGoster (163) · konusmayiCikar (208) · eskiIndirmeButonlariniTemizle (297) · indirme blok (302-481) · geminiPrefixTemizle (483) · listener (493) |
| content-claude.js | 445 | state (5-8) · baslat (11) · butonuEnjekteEt (28) · yazdirmaBaslat (131) · artifactIcerikleriniCikar (174) · uyariBalonuGoster (279) · konusmayiCikar (321) · listener (407) |
| content-chatgpt.js | 286 | state · baslat (9) · butonuEnjekteEt (25) · yazdirmaBaslat (122) · uyariBalonuGoster (151) · konusmayiCikar (193) · listener (255) |
| content-grok.js | 434 | state · baslat (9) · butonuEnjekteEt (29) · yazdirmaBaslat (111) · uyariBalonuGoster (140) · grokMesajRolu (183) · enZenginIcerikDescendant (218) · konusmayiCikar (236) · listener (403) |
| yazdir.js | 483 | yardımcılar (4-45) · DOMContentLoaded ana akış (47-330) · sayfayiKapat (~332) · panoyaKopyala · prefixTemizleDOM · konusmayiDuzMetneDonustur · htmlTemizle (sonda) |
| popup.js | 181 | DOMContentLoaded (5-150) · durumGoster · butonuSifirla · butonMetniGuncelle |

## EK J — Tip İmza Özeti

```javascript
// resim-yardimcilari.js
resimIslemOturumuBaslat(toplamSure: number): void
resimIslemOturumuBitir(): void
resimDeadlineDoldu(): boolean
resmiBase64Yap(resimElementi: HTMLImageElement): Promise<string|null>
resimliHtmlCikar(element: Element): Promise<string>
uiElementiIcindeMi(element: Element): boolean
turnResimleriniTopla(turn: Element, kaynakElement: Element|null): Promise<{src,alt}[]>

// ortak-yardimcilar.js
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
konusmayiMarkdowneDonustur(veri: KonusmaVerisi): string
uiTemizKlon(element: Element): Element
temizMetinCikar(element: Element|null): string
dosyayaIndir(icerik: string, dosyaAdi: string, mimeType: string): void

// content script ortak yüzeyi (4 dosya)
baslat(): void
butonuEnjekteEt(): void
yazdirmaBaslat(): Promise<void>
uyariBalonuGoster(mesaj: string, tip: 'basari'|'hata'): void
konusmayiCikar(claudeArtifactlar?): Promise<KonusmaVerisi>
// content.js ek: eskiIndirmeButonlariniTemizle, indirmeButonlariniKontrolEt/Enjekte,
//   oncekiSoruMetniBul, cevapIcerikElementiBul, cevapMetniniAl, cevapMarkdownAl,
//   cevapIndir, indirmeDosyaAdiOlustur, geminiPrefixTemizle
// content-claude.js ek: artifactIcerikleriniCikar(cb?): Promise<{baslik,tur,icerik}[]>
// content-grok.js ek: grokMesajRolu(el): 'user'|'assistant'|null, enZenginIcerikDescendant(el): Element

// yazdir.js
elementiBosalt(element): void · toastGoster(mesaj, tip): void
yuklemeyiGizle(): void · yuklemeMetniniGuncelle(metin): void
sayfayiKapat(): Promise<void> · panoyaKopyala(metin): Promise<boolean>
prefixTemizleDOM(element): void · konusmayiDuzMetneDonustur(veri): string
htmlTemizle(htmlString): HTMLDivElement

// popup.js
durumGoster(tip, mesaj): void · butonuSifirla(): void · butonMetniGuncelle(buton, yeniMetin): void
```

## EK K — Bilinen Sınırlamalar ve Bilinçli-Dokunulmayan Kararlar

| Konu | Durum / Gerekçe |
|------|------------------|
| Cevap altı ↓ MD/↓ TXT yalnız Gemini'de | Diğer sitelere taşıma canlı DOM incelemesi gerektirir — tahmini selektörle kırık özellik gönderilmez |
| ChatGPT Canvas / Gemini canvas-immersive | Desteklenmiyor (artifact karşılığı yalnız Claude'da) |
| `basligiTemizle` bare suffix agresifliği | "Sohbet Claude" → "Sohbet" yapar; kozmetik, v1.3.0'dan beri stabil |
| `oncekiSoruMetniBul` sibling-zinciri varsayımı | Canlı testte doğrulandı; Gemini wrapper katmanı eklerse kırılır — o zaman çok-seviyeli aramaya genişletilir |
| Nested tablo (`tabloyuCevir`) | İç tablonun tr'leri düz listelenir — AI çıktısında pratikte yok |
| `turnResimleriniTopla` `querySelectorAll('*')` maliyeti | Çok uzun konuşmalarda yavaş; kanıtsız daraltma davranış bozar, şikayet yok |
| `[Grok DEBUG]` üretim logları | Bilinçli — Grok hata mesajı kullanıcıyı bu loglara yönlendirir |
| `htmlToMarkdown` `preIcinde` parametresi | Fiilen ölü (PRE textContent ile ham okur) — davranış doğru, dokunulmadı |
| Düz metindeki `* _` literal'leri MD'de escape edilmez | Tam escape çıktıyı çirkinleştirir; export hedefi round-trip değil okunabilirlik |
| README gövdesi ASCII | Depo belgesi (runtime çıktısı değil); diakritiğe çevirme kararı Baran'a ait |
| i18n yalnız manifest düzeyinde | Hedef kitle TR; content metinlerinin i18n'i istek gelirse yapılır |
| x.com/i/grok host'u yok | Talep edilmedi; manifest matches genişletmesiyle eklenebilir |

## EK L — Hızlı Sözlük

| Terim | Kod karşılığı | Anlam |
|-------|---------------|-------|
| Turn | `user-query`/`model-response`, `conversation-turn` | Bir konuşma sırası |
| Üç kanal | `mesaj.html/metin/resimler` | Aynı içeriğin render/TXT/görsel yolları |
| Artifact | `.artifact-block-cell`, `artifactlar[]` | Claude'un ürettiği dosya |
| Viewer | `#wiggle-file-content` | Artifact içerik paneli |
| Stabilite polling | 2 ardışık eşit `textContent.length` | Stream bitti sinyali |
| Deadline | `resimIslemDeadline`, 90 sn | Resim işleme toplam süre sigortası |
| Reentrance kilidi | `yazdirmaIslemiSuruyor` | Çift tıklama paralel akış engeli |
| Oku-ve-hemen-sil | `get` → anında `remove` | Multi-tab yarış daraltması |
| Sekme yedeği | `sessionStorage['aiChatPrinterYedek']` | F5 dayanıklılığı |
| Fence kaçışı | `mdFenceUret` | İçerikteki ``` ile çakışmayan çit |
| `<>` sargısı | `[m](<url>)` | Parantezli/boşluklu URL koruması |
| UI sızıntısı | buton/ikon/stil metni çıktıda | 4 kanal filtresiyle yasak |
| Dead handler | reload sonrası eski DOM butonu | Enjeksiyon öncesi temizlenir |
| Prefix | "Siz şunu dediniz: " | Gemini erişilebilirlik öneki — soyulur |
| Üçlü bump | manifest+popup+README | Sürüm eş-zamanlılık kuralı |

---

**Dokümantasyon sonu — v1.7.8 (10.06.2026, commit `2547bab`)**

> Bu dokümanın amacı, projeyi başka bir geliştirici (insan veya LLM) tarafından **birebir yeniden üretilebilir** kılmaktır. Tüm selektörler, eşikler, piksel ölçüleri, renk kodları, MIME tipleri, storage anahtarları, mesaj şablonları, algoritma adımları ve davranış kuralları açıkça yazılmıştır. Belge eksiksiz takip edilirse sonuç, v1.7.8 ile fonksiyonel olarak özdeş bir eklentidir. Bölüm 19/21/22 ve EK G'deki kurallar, v1.7.x denetim serisinde **gerçek bug olarak yaşanmış** davranışlardan damıtılmıştır — atlanmaları aynı bug'ları yeniden üretir.
