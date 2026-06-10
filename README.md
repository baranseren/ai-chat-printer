# AI Chat Printer - Chrome Extension

**Google Gemini, Claude.ai, ChatGPT ve Grok konusmalarini yazicidan yazdir veya PDF olarak kaydet.**

**Print your Google Gemini, Claude.ai, ChatGPT and Grok conversations or save them as PDF.**

---

<p align="center">
  <img src="icons/icon128.png" alt="AI Chat Printer Logo" width="128">
</p>

<p align="center">
  <strong>v1.7.8</strong> &nbsp;|&nbsp; Chrome Extension (Manifest V3) &nbsp;|&nbsp; Vanilla JS &nbsp;|&nbsp; Zero Dependencies
</p>

---

## TR - Turkce

### Ne Yapar?

AI Chat Printer, Google Gemini, Claude.ai, ChatGPT ve Grok uzerinde yaptginiz konusmalari tek tikla yazdirmanizi veya PDF olarak kaydetmenizi saglar.

- Gemini, Claude, ChatGPT ve Grok sayfalarinin icerisine **yazici butonu** enjekte eder
- Konusma icerigini otomatik olarak cikarir (kullanici mesajlari + AI yanitlari)
- Temiz, profesyonel bir **yazdirma onizleme sayfasi** olusturur
- **Claude artifact'lari** (kod dosyalari, dokumanlar) otomatik olarak icerige dahil edilir
- **Gemini resimleri** base64 formatinda yazdirma ciktisina dahil edilir
- Tarayicinin **PDF olarak kaydet** ozelligi ile PDF'e donusturebilirsiniz
- Konusma basligi otomatik olarak PDF dosya adi olarak kullanilir

### Ozellikler

| Ozellik | Aciklama |
|---------|----------|
| Gemini Destegi | gemini.google.com konusmalarini yazdirir (resim destegi dahil) |
| Claude Destegi | claude.ai konusmalarini yazdirir (artifact dahil) |
| ChatGPT Destegi | chatgpt.com konusmalarini yazdirir |
| Grok Destegi | grok.com konusmalarini yazdirir |
| Sayfa Ici Buton | Popup acmadan dogrudan sayfadan yazdir |
| Cevap Alti Indir (Gemini) | Her Gemini cevabinin altinda **↓ MD** ve **↓ TXT** butonlari — tek soru-cevabi anlik indir |
| Gercek Markdown Cikti | HTML→Markdown donusturucu: baslik, kod blogu, liste, tablo, link korunur (duz metin degil) |
| Konusma Dosya Indirme | Yazdirma onizleme sayfasindan tum konusmayi **.md** veya **.txt** dosyasi olarak indir |
| HTML Temizleme | XSS korumasli guvenli icerik render |
| Mesaj Numaralama | Her mesaj sirayla numaralanir |
| Kod Bloklari | Kod bloklari okunabilir formatta yazdirmaya dahil edilir |
| Artifact Destegi | Claude'un olusturdugu dosyalar otomatik cikarilir |
| Resim Destegi | Gemini konusmalarindaki resimler base64 olarak yazdirma ciktisina dahil edilir |
| Otomatik Yazdir | Onizleme sayfasi acildiginda yazdir dialogu otomatik baslar |
| PDF Kaydetme | Konusma basligini dosya adi olarak kullanir |
| Responsive | Yazdirma ciktisi tum kagit boyutlarina uyumlu |

### Kurulum (Adim Adim)

Chrome Web Store'da yayinlanmadigindan, eklentiyi manuel olarak yuklemeniz gerekiyor. Cok basit:

#### 1. Dosyalari Indirin

- Bu sayfanin ust kismindaki yesil **"Code"** butonuna tiklayin
- **"Download ZIP"** secenegini tiklayin
- Indirilen ZIP dosyasini bilgisayarinizda bir klasore cikartin (ornegin Masaustu)

#### 2. Chrome'a Yukleyin

1. Chrome tarayicinizda adres cubuguna `chrome://extensions` yazin ve Enter'a basin
2. Sag ust kosedeki **"Gelistirici modu"** (Developer mode) anahtarini acik konuma getirin
3. Sol ustteki **"Paketlenmemis oge yukle"** (Load unpacked) butonuna tiklayin
4. ZIP'ten cikardiginiz **klasoru** secin (icinde `manifest.json` dosyasi olan klasor)
5. Eklenti listede gorunecek ve otomatik aktif olacak

#### 3. Kullanim

1. [gemini.google.com](https://gemini.google.com), [claude.ai](https://claude.ai), [chatgpt.com](https://chatgpt.com) veya [grok.com](https://grok.com) adresine gidin
2. Bir konusma acin veya yeni konusma baslatin
3. Sayfanin sag ust kosesinde beliren **yazici ikonuna** tiklayin
4. Yazdirma onizleme sayfasi acilir ve otomatik olarak yazdir/PDF dialogu baslar
5. **"PDF olarak kaydet"** secenegini secerek PDF dosyasi olusturabilirsiniz

> **Not:** Eklentiyi yukledikten sonra acik olan Gemini/Claude/ChatGPT/Grok sekmelerini yenilemeniz (F5) gerekir.

---

## EN - English

### What Does It Do?

AI Chat Printer lets you print or save as PDF your Google Gemini, Claude.ai, ChatGPT and Grok conversations with a single click.

- Injects a **printer button** directly into Gemini, Claude, ChatGPT and Grok pages
- Automatically extracts conversation content (user messages + AI responses)
- Generates a clean, professional **print preview page**
- **Claude artifacts** (code files, documents) are automatically included
- **Gemini images** are included in print output as base64
- Use your browser's **Save as PDF** feature to create PDF files
- Conversation title is automatically used as the PDF filename

### Features

| Feature | Description |
|---------|-------------|
| Gemini Support | Print conversations from gemini.google.com (with image support) |
| Claude Support | Print conversations from claude.ai (including artifacts) |
| ChatGPT Support | Print conversations from chatgpt.com |
| Grok Support | Print conversations from grok.com |
| In-Page Button | Print directly from the page without opening a popup |
| Per-Answer Download (Gemini) | **↓ MD** and **↓ TXT** buttons under each Gemini answer — instantly download a single Q&A pair |
| HTML Sanitization | Secure content rendering with XSS protection |
| Message Numbering | Each message is sequentially numbered |
| Code Blocks | Code blocks are included in readable format |
| Artifact Support | Files created by Claude are automatically extracted |
| Image Support | Images in Gemini conversations are included as base64 in print output |
| Auto Print | Print dialog opens automatically when preview loads |
| PDF Export | Uses conversation title as the filename |
| Responsive | Print output adapts to all paper sizes |

### Installation (Step by Step)

Since this extension is not published on the Chrome Web Store, you need to install it manually. It's very easy:

#### 1. Download the Files

- Click the green **"Code"** button at the top of this page
- Select **"Download ZIP"**
- Extract the downloaded ZIP file to a folder on your computer (e.g., Desktop)

#### 2. Load into Chrome

1. Open Chrome and type `chrome://extensions` in the address bar, then press Enter
2. Toggle on **"Developer mode"** in the top right corner
3. Click **"Load unpacked"** in the top left
4. Select the **folder** you extracted from the ZIP (the one containing `manifest.json`)
5. The extension will appear in the list and activate automatically

#### 3. Usage

1. Go to [gemini.google.com](https://gemini.google.com), [claude.ai](https://claude.ai), [chatgpt.com](https://chatgpt.com) or [grok.com](https://grok.com)
2. Open an existing conversation or start a new one
3. Click the **printer icon** that appears in the top right area of the page
4. A print preview page opens and the print/PDF dialog starts automatically
5. Choose **"Save as PDF"** to create a PDF file

> **Note:** After installing the extension, you need to refresh (F5) any open Gemini/Claude/ChatGPT/Grok tabs.

---

## Desteklenen Siteler / Supported Sites

| Site | Durum / Status |
|------|---------------|
| gemini.google.com | ✅ Tam destek (resim dahil) / Full support (with images) |
| claude.ai | ✅ Tam destek (artifact dahil) / Full support (including artifacts) |
| chatgpt.com | ✅ Tam destek / Full support |
| grok.com | ✅ Tam destek / Full support |

---

## Ekran Goruntuleri / Screenshots

### Gemini - Sayfa Ici Buton / In-Page Button
> Gemini arabirimindeki toolbar'a entegre yazici butonu

### Claude - Sayfa Ici Buton / In-Page Button
> Claude arabiriminde Share butonunun yaninda yazici butonu

### ChatGPT - Sayfa Ici Buton / In-Page Button
> ChatGPT arabiriminde Paylas butonunun yaninda yazici butonu

### Grok - Sayfa Ici Buton / In-Page Button
> Grok arabiriminde header'da yazici butonu

### Yazdirma Onizleme / Print Preview
> Mesaj numaralama, rol etiketleri, kod bloklari ve artifact destegiyle temiz cikti

---

## Teknik Detaylar / Technical Details

- **Manifest Version:** V3 (Chrome'un en guncel standardi)
- **Permissions:** `activeTab`, `storage`, `clipboardWrite` (minimum gerekli izinler)
- **Dependencies:** Yok / None (saf JavaScript, harici kutuphane kullanilmaz)
- **Data Storage:** Yazdirma verisi gecici olarak `chrome.storage.local`'da tutulur ve kullanildiktan sonra silinir. Hicbir veri disariya gonderilmez.
- **Security:** HTML icerik whitelist tabanli sanitizer ile temizlenir (XSS korumasi)

---

## Proje Yapisi / Project Structure

```
├── manifest.json           # Extension manifest (MV3) — CSP, commands, i18n
├── background.js           # Service worker — tab management + keyboard shortcut handler
├── resim-yardimcilari.js   # Shared image-to-base64 helpers (total timeout support)
├── ortak-yardimcilar.js    # Shared: settings + debounce + streaming + title + quota + markdown export
├── content.js              # Gemini content script
├── content-claude.js       # Claude content script (+ artifact extraction with progress)
├── content-chatgpt.js      # ChatGPT content script
├── content-grok.js         # Grok content script (multi-fallback selectors)
├── popup.html              # Extension popup UI (persistent settings, keyboard shortcut info)
├── popup.js                # Popup logic (chrome.storage.sync + UI feedback)
├── yazdir.html             # Print preview page (loading overlay, toast region)
├── yazdir.js               # Print rendering + HTML sanitizer + markdown/text export
├── yazdir.css              # Print styles (A4, color-adjust, page numbering, toast)
├── _locales/               # i18n resources (tr, en)
│   ├── tr/messages.json
│   └── en/messages.json
└── icons/                  # Extension icons (16/48/128px)
```

---

## Degisiklik Gecmisi / Changelog

### v1.7.8 (10.06.2026) — Cift tiklama reentrance korumasi

- **Yazdir butonuna art arda basmak artik paralel akis baslatmiyor** — 4 content script'te `yazdirmaIslemiSuruyor` kilidi: ikinci tiklama "islem zaten suruyor" uyarisi verir. Onceden cift tiklama iki cikarma akisi + iki yazdirma sekmesi acabiliyor, paylasilan resim-deadline'i cakisiyordu; **Claude'da** paralel artifact tikla-ac-kapat donguleri viewer'i cakistirip icerikleri karistirabiliyordu (popup mesaj yolu da kilitli). / Double-click no longer spawns parallel extraction flows; Claude artifact loop protected on both trigger paths.

### v1.7.7 (10.06.2026) — Linkli resim MD duzeltmesi + uctan uca render dogrulamasi

- **Linkli resim Markdown'da bozulmuyor** — `<a><img></a>` (Gemini gorsel sonuclari) artik `[![alt](src)](href)` olarak dogru uretilir; `[]` escape'i yalnizca duz metinli linklere uygulanir (ic ice markdown sozdizimi korunur). / Linked images no longer broken by bracket escaping.
- **Uctan uca render testi** — chrome API mock'u ile yazdir.js'in tam akisi (storage → sanitize → render) 21 senaryoda dogrulandi: XSS script/onerror/SVG-data-URI engelleme, buton/style sizinti filtreleri, prefix temizleme, artifact render, sessionStorage F5 yedegi, PDF baslik atamasi.

### v1.7.6 (10.06.2026) — Kullanici ciktilarinda tam Turkce diakritik

- **Runtime ciktilarindaki ASCII Turkce metinler duzeltildi** — yazdirma onizleme basligi/butonu/footer'i ("Yazdırma Önizleme", "Yazdır", "Bu çıktı ... oluşturulmuştur."), varsayilan konusma basliklari ("Gemini Konuşması" vb.) ve TXT indirme sablonu ("Konuşma:", "alınamadı") artik tam diakritikli. UTF-8 byte butunlugu dogrulandi, NTFS dosya adlarinda Turkce karakter sorunsuz. / All user-facing runtime strings now use proper Turkish diacritics.

### v1.7.5 (10.06.2026) — MD link sozdizimi cakismasi + olcek dayanikliligi

- **Parantezli URL'ler linki kirmiyor** — Wikipedia tarzi `.../X_(album)` URL'leri CommonMark `<>` sargisiyla yazilir; `(` `)` veya bosluk iceren href/src MD linkini erken kapatmaz. / Parenthesized URLs wrapped in `<>` per CommonMark.
- **Link metni ve img alt'inda `[` `]` escape** — `dizi[0]` gibi metinler link yapisini bozmaz.
- **mdFenceUret stack overflow korumasi** — `Math.max(...spread)` yerine `reduce`; cok sayida backtick dizisi iceren dev iceriklerde (200k+ dizi) export crash etmez.

### v1.7.4 (10.06.2026) — Resim kanalinda UI gorsel filtresi

- **Buton/ikon gorselleri artik "ekstra resim" olarak toplanmiyor** — `turnResimleriniTopla()` buton, `[role="button"]` ve `mat-icon` icindeki img + background-image gorsellerini atlar; begen/kopyala ikonlari ve hover sprite'lari yazdirma ciktisina giremez (UI ≠ icerik ilkesinin 4. kanali: html, metin, md'den sonra resim). / Button/icon images are no longer collected as content images.

### v1.7.3 (10.06.2026) — Markdown fence kacisi duzeltmesi

- **Fence kacisi bug'i kapatildi** — kod blogu veya artifact iceriginde ``` gectiginde (markdown ogreten cevaplar, README.md artifact'lari) MD ciktisi artik kirilmiyor: `mdFenceUret()` icerikteki en uzun backtick dizisinden 1 uzun fence secer (CommonMark uyumlu). / Fence escaping fixed: code blocks containing ``` no longer break MD output.
- **Quota mesaji dinamik** — "Storage siniri 10 MB" sabit metni yerine gercek `QUOTA_BYTES` degerinden hesaplanan limit gosterilir.
- **Cevap alti MD sablonunda soru escape** — satir basi `#` ile baslayan kullanici sorusu sahte baslik olusturmaz.

### v1.7.2 (10.06.2026) — TXT sizinti ayagi + olu indirme butonu duzeltmesi

- **TXT ciktilarindaki UI sizintisi kapatildi** — `mesaj.metin` 4 content script'te artik `temizMetinCikar()` ile uretilir; kod blogu "Copy / Kodu kopyala" buton yazilari ve ikon metinleri duz metin kopyala/indir ciktilarina girmez (v1.7.1 sadece MD/yazdirma ayagini kapatmisti). / TXT-side UI leakage fixed across all 4 sites.
- **Eklenti reload sonrasi olu MD/TXT butonlari** — content script basinda eski `.gp-indir-btn`'ler silinir, canli handler'la yeniden enjekte edilir (dead-handler-cleanup pattern'i cevap alti butonlara da uygulandi).
- `uiTemizKlon()` + `temizMetinCikar()` ortak modulde — content.js'teki yerel kopya kaldirildi (DRY).
- Yazdirma onizleme kontrol cubugu dar pencerede tasmaz (`flex-wrap`).

### v1.7.1 (10.06.2026) — UI metni sizintisi duzeltmesi

- **Markdown/yazdirma ciktisina UI metni sizmasi kapatildi** — "Kodu kopyala" buton yazisi, `mat-icon` ligature metni (`content_copy`), inline `<style>` CSS kurallari artik ciktiya girmez. / UI text leakage fixed: copy-button labels, icon ligatures and inline CSS no longer leak into Markdown or print output.
- `htmlToMarkdown` ve `htmlTemizle` artik BUTTON/MAT-ICON/STYLE/SCRIPT/SELECT/TEXTAREA/SVG/IFRAME vb. etiketleri **icerikleriyle birlikte** atlar.
- Gemini cevap alti ↓ MD / ↓ TXT cikarimi klon uzerinde UI temizliginden gecer (`icerikKlonuTemizle`).

### v1.7.0 (10.06.2026) — Gercek Markdown motoru + dosya indirme + derin denetim duzeltmeleri

**Yeni Ozellik / New Feature:**
- **Gercek HTML→Markdown donusturucu** (`htmlToMarkdown`) — Markdown ciktilarinda artik baslik (`#`), kod bloklari (dil etiketli ``` fence), inline kod, kalin/italik, ic ice listeler, linkler, tablolar (pipe format), alintilar ve yatay cizgiler korunur. Onceden tum Markdown ciktilari duz `textContent` idi. / Real HTML→Markdown converter — headings, fenced code blocks (with language), lists, links, tables, blockquotes now preserved in all Markdown exports (previously plain text).
- **Yazdirma sayfasindan dosya indirme** — Kontrol cubuguna **↓ MD** ve **↓ TXT** butonlari eklendi; tum konusma tek tikla `.md` / `.txt` dosyasi olarak iner (pano kopyalamanin dosya karsiligi). / Download whole conversation as `.md` / `.txt` file from the print preview toolbar.
- **Gemini cevap alti ↓ MD butonu artik gercek Markdown uretir** (eskiden duz metin). / Gemini per-answer ↓ MD button now produces real Markdown.

**Duzeltmeler / Fixes:**
- **Yanlis F5 badge duzeltildi** — klavye kisayolu mesajinda content script yanit gondermeden kanali acik tutuyordu; background "port closed" hatasi alip gereksiz F5 badge gosteriyordu. 4 content script'te mesaj dinleyici duzeltildi. / Fixed false F5 badge: keyboard-shortcut message channel was left open without a response.
- **Cikarma hatalari artik dogru raporlaniyor** — `konusmayiCikar` beklenmedik hata firlatirsa popup yanlis "content script yuklenmemis" yerine gercek hata mesajini gosterir; sayfa ici akista toast takili kalmaz (4 content script'e catch eklendi).
- **F5 dayanikliligi** — yazdirma sayfasi verisi sekmeye ozel `sessionStorage`'a yedeklenir; F5 sonrasi "veri bulunamadi" hatasi kalkti (multi-tab race condition korumasi bozulmadan).
- **Gereksiz `scripting` izni kaldirildi** — kodda hic kullanilmiyordu; Chrome Web Store gereksiz izin reddi riski giderildi.
- **blob: tutarsizligi giderildi** — CSP `img-src`'de olmayan ve cross-origin'de zaten calismayan blob URL kabulleri sanitizer ve render'dan kaldirildi.
- **Duz metin mesajlarda satir sonu korunuyor** — HTML fallback render'inda newline'lar artik `<br>`'a cevriliyor.
- **Sayfa resim handler'lari korunuyor** — resim base64 donusumu artik sayfanin kendi `onload`/`onerror` handler'larini ezmiyor (`addEventListener` + timeout temizligi).
- **Olmeyen sayfa numarasi CSS'i temizlendi** — `@page` margin box'lari (`@bottom-right` sayfa numarasi) Chrome'da desteklenmiyor; dead CSS kaldirildi. Sayfa numarasi gerekirse yazdirma diyalogundaki "Ustbilgi ve altbilgiler" secenegi kullanilir.

**Hijyen / Housekeeping:**
- `popup.html` artik `ortak-yardimcilar.js` yukluyor — `VARSAYILAN_AYARLAR` duplikasyonu kaldirildi, popup yazdirma akisina da storage quota kontrolu eklendi.
- Eklenti kurulum/guncellemesinde kalinti gecici konusma verisi otomatik temizlenir (`onInstalled`).
- Ortak `dosyayaIndir()` yardimcisi — Gemini cevap alti indirme ve yazdirma sayfasi indirme ayni Blob pattern'ini paylasir.

### v1.6.1 (15.05.2026) — Cevap alti MD/TXT indirme + storage sertlestirme

**Yeni Ozellik / New Feature:**
- **Gemini cevap alti indirme butonlari** — Her `model-response` action bar'ina **↓ MD** ve **↓ TXT** butonlari enjekte edilir. Tek bir soru-cevap ciftini Markdown veya duz metin olarak anlik indirir (tum konusmayi degil).
- **Per-answer download buttons for Gemini** — Each `model-response` action bar gets **↓ MD** and **↓ TXT** buttons. Instantly downloads a single Q&A pair as Markdown or plain text (not the whole conversation).
- Dosya adi soru metninden uretilir (80 karakter limit, FS yasakli karakterler temizlenir) / Filename derived from question text (80 char limit, FS-unsafe chars stripped).
- MD ciktida tarih, konusma basligi, ayrac ile yapilandirilmis format. TXT ciktida 60 karakter `=` ayraclar.

**Sertlestirme / Hardening:**
- `chrome.storage` erisilemez durumlarda guvenli fallback — eklenti context invalidation sirasinda sessizce varsayilan ayarlar donulur. / Safe fallback when `chrome.storage` is inaccessible — silently returns defaults during extension context invalidation.
- `console.warn` / `console.error` → `console.log` demote — eklenti `chrome://extensions` "Errors" sayfasinda gereksiz uyari biriktirmiyor. / Demoted to `console.log` so extension Errors page doesn't accumulate noise.
- `yazdirmayaBasla()` icin `chrome.storage.local` mevcudiyet kontrolu erkene cekildi (try/catch oncesi). / `chrome.storage.local` existence check moved before try/catch in `yazdirmayaBasla()`.

**MutationObserver Genisletildi:**
- Gemini icin gozlemci artik yalnizca toolbar butonunu degil, yeni gelen `model-response`'lara da MD/TXT enjeksiyonu yapiyor (200ms debounce ile ayni dongude). / Gemini observer now also injects MD/TXT buttons into new `model-response` elements (same 200ms debounce cycle).

### v1.5.2 (25.04.2026) — Gemini streaming false positive hotfix
- **Gemini sayfasinda yanlis "henuz yanit yaziyor" toast'i kaldirildi**
- Sebep: Gemini DOM'unda "Stop" butonu gizli (visibility:hidden / opacity:0) olarak duruyordu — `offsetParent !== null` bunu "gorunur" sayiyordu, surekli streaming sandiriyordu (false positive)
- Cozum: Gemini icin streaming kontrolu tamamen kaldirildi (sayfa ici buton + popup mesaj handler)
- Kullanici yarim yanit yazdirirsa kendi takdirinde — UI engellemesi yok

### v1.5.1 (25.04.2026) — Ticari kalite denetlemesi
- **Guvenlik:** HTML sanitizer SVG data URI XSS acigi kapatildi (sadece raster format'lara izin)
- **Multi-tab race condition cozuldu:** oku-ve-hemen-sil pattern (ayni anda 2 sekmede yazdirma kaybi onlendi)
- **MutationObserver memory leak fix:** 4 content script'te pagehide event ile disconnect
- **i18n duzgun calisiyor:** manifest'te __MSG_*__ placeholder'lari kullanilarak _locales aktif edildi
- **homepage_url duzeltildi:** ai-chat-printer (eski: GeminiPrinter — 404 veriyordu)
- **Print otomasyon iyilesti:** sabit 800ms gecikme yerine resim yuklenmesini bekler (Promise.all + 3sn timeout)
- **Bilinmeyen kaynak fallback:** sessizce gemini'ye dusmek yerine generic "ai" tema
- **Storage quota dinamik:** chrome.storage.local.QUOTA_BYTES kullanir, hard-code degil
- **Footer toggle:** popup'tan eklenti imzasi kaldirilabilir
- **Klavye kisayolu uyari:** content script erisilemezse F5 badge gosterir
- **Popup proaktif kontrol:** desteklenmeyen sayfada yazdir butonu disabled
- **Turkce karakter regex fix:** content-grok.js'te \\b yerine non-word boundary
- **Markdown export escape:** `#` ile baslayan kullanici metni baslik olmaz
- **Dead code temizligi:** ortak-yardimcilar.js'te kullanilmayan storageErisimiVarMi kaldirildi
- **referrerpolicy="no-referrer"** tum yazdirma resimlerinde — referrer leak onlendi

### v1.5.0 (25.04.2026) — Grok destegi
- **Grok destegi eklendi** — grok.com konusmalarini yazdirma
- Grok header'ina yazici butonu enjeksiyonu (Share/Paylas butonunun soluna; bulunamazsa header son child'ina)
- Grok icin koyu gri (#1f2937) tema rengi
- DOM tanimasi icin coklu fallback strateji (data-message-author-role / aria-label / class regex / article tag)
- Mesaj rolu tespit edilemezse alternating user/assistant fallback
- ortak-yardimcilar.js: streamingMiKontrol + basligiTemizle + konusmayiMarkdowneDonustur fonksiyonlarina Grok handler

### v1.4.0 (22.04.2026) — Ticari Kalite Sürümü
- **Klavye kisayolu** — Ctrl+Shift+P (Mac: Cmd+Shift+P) ile hizli yazdirma
- **Markdown ve duz metin kopyalama** — yazdirma onizleme sayfasindan panoya
- **Loading overlay** — yazdirma sayfasinda yukleme animasyonu
- **ARIA live region toast** — ekran okuyucular icin erisilebilir bildirimler
- **Storage quota kontrolu** — 10MB limiti asilirsa kullanici uyarilir (8MB'ta erken uyari)
- **Resim toplam sure limiti** — 50+ resim varsa 90 saniyeden fazla takilmaz
- **Artifact progress gostergesi** — "3/10 cikariliyor" seklinde canli ilerleme
- **Sadece resim mesajlari** icin ozel render
- **Bos mesaj** placeholder
- **Genis tablo uyarisi** — kullaniciya landscape (yatay) onerisi
- **A4 varsayilan sayfa boyutu** — yazdirma CSS'inde @page size
- **Renk koruma** — tum elementler icin print-color-adjust: exact
- **Sayfa alt sol etiket** — "AI Chat Printer" @bottom-left
- **Sanitizer** genisletildi — mailto:, tel:, blob: ve 12 yeni HTML etiketi (FIGURE, KBD, MARK, DEL, S, SMALL vb.)
- **A tag rel="noopener noreferrer"** — guvenlik iyilestirmesi
- **i18n altyapisi** — _locales/tr ve _locales/en klasorleri
- **Chrome Web Store metadata** — minimum_chrome_version, short_name, homepage_url, default_locale
- **Content Security Policy** — extension pages icin siki CSP
- **commands API** — keyboard shortcut manifest tanimi
- **clipboardWrite izni** — markdown/metin kopyalama icin
- **Baslik temizleme** — Windows/macOS dosya adi icin yasakli karakterleri sil
- **Context invalidation** kontrolu — `chrome.runtime?.id` kontrolu eklendi
- **onInstalled listener** — kurulum/guncelleme bildirimi
- **Ayar kaydedildi toast** — popup'ta feedback
- **Escape ile sayfa kapatma** + Ctrl+Shift+M ile markdown kopyala

### v1.3.0 (22.04.2026)
- **Kullanici ayarlari kalici** — `chrome.storage.sync` ile ayarlar taraycilar arasinda senkronize
- **Sayfa ici buton popup ayarlarini kullaniyor** — kod bloklari, otomatik yazdir, yazi boyutu tum butonlarda gecerli
- **Claude artifact popup'tan da calisiyor** — popup fallback artifact'lari cikariyor (onceden eksik)
- **Streaming mesaj koruma** — AI yanit yaziyorsa yazdirmayi engeller
- **Sidebar basligi** — Claude ve ChatGPT'de de aktif konusmanin basligi kullaniliyor
- **Cok dilli baslik temizleme** — TR/EN suffix'leri ortak fonksiyonda
- **MutationObserver debounce** — 200ms debounce ile CPU kullanimi azaltildi
- **Artifact cikarma race condition fix** — viewer acma-kapama sirasinda observer bastirilir
- **afterprint temizleme** — yazdirma bittikten sonra storage silinir (F5'te veri kaybi onlendi)
- **Sekme kapatma duzeltildi** — `chrome.tabs.remove` fallback ile `window.close()`
- **Sayfa numaralandirma** — yazdirma ciktisinda "Sayfa X / Y"
- **Link URL'leri yazdirmada** — `<a href>` URL'leri parantez icinde gosterilir
- **FOUC duzeltmesi** — yazdir.html'de hardcoded "Gemini Konusmasi" flash kaldirildi
- **ChatGPT selector iyilestirme** — `header.children[2]` yerine paylas butonu parent'i
- **Ortak modul** — `ortak-yardimcilar.js` ile kod tekrari azaltildi (3 content script paylasiyor)

### v1.2.0 (29.03.2026)
- **ChatGPT destegi eklendi** — chatgpt.com konusmalarini yazdirma
- ChatGPT header'ina yazici butonu enjeksiyonu (Paylas butonunun soluna)
- ChatGPT icin yesil (#10a37f) tema rengi
- Tablo tasma sorunu duzeltildi (table-layout: fixed, word-break)
- Uzun linklerin tasmasini onleyen CSS duzeltmesi

### v1.1.0 (25.03.2026)
- **Claude.ai destegi eklendi** — artifact (kod dosyalari, dokumanlar) otomatik cikarma
- **Gemini resim destegi** — konusmalardaki resimler base64 olarak yazdirma ciktisina dahil
- Claude icin amber (#d97706) tema rengi
- HTML sanitizer'a IMG etiketi destegi eklendi
- Tablo, blockquote, resim stilleri iyilestirildi

### v1.0.0 (25.03.2026)
- Ilk surum — Gemini destegi
- Sayfa ici buton enjeksiyonu
- Yazdirma onizleme sayfasi
- HTML sanitizer (XSS korumasi)
- Mesaj numaralama
- PDF kaydetme destegi

---

## Lisans / License

MIT License - Ozgurce kullanin, degistirin, dagitin.

MIT License - Free to use, modify, and distribute.

---

## Gelistirici / Developer

**Baran SEREN** - Ankara, Turkiye

---

<p align="center">
  <sub>Built with Vanilla JS | Zero Dependencies | Privacy First</sub>
</p>
