# AI Chat Printer - Chrome Extension

**Google Gemini ve Claude.ai konusmalarini yazicidan yazdir veya PDF olarak kaydet.**

**Print your Google Gemini and Claude.ai conversations or save them as PDF.**

---

<p align="center">
  <img src="icons/icon128.png" alt="AI Chat Printer Logo" width="128">
</p>

<p align="center">
  <strong>v1.1.0</strong> &nbsp;|&nbsp; Chrome Extension (Manifest V3) &nbsp;|&nbsp; Vanilla JS &nbsp;|&nbsp; Zero Dependencies
</p>

---

## TR - Turkce

### Ne Yapar?

AI Chat Printer, Google Gemini ve Claude.ai uzerinde yaptginiz konusmalari tek tikla yazdirmanizi veya PDF olarak kaydetmenizi saglar.

- Gemini ve Claude sayfalarinin icerisine **yazici butonu** enjekte eder
- Konusma icerigini otomatik olarak cikarir (kullanici mesajlari + AI yanitlari)
- Temiz, profesyonel bir **yazdirma onizleme sayfasi** olusturur
- **Claude artifact'lari** (kod dosyalari, dokumanlar) otomatik olarak icerige dahil edilir
- Tarayicinin **PDF olarak kaydet** ozelligi ile PDF'e donusturebilirsiniz
- Konusma basligi otomatik olarak PDF dosya adi olarak kullanilir

### Ozellikler

| Ozellik | Aciklama |
|---------|----------|
| Gemini Destegi | gemini.google.com konusmalarini yazdirir |
| Claude Destegi | claude.ai konusmalarini yazdirir (artifact dahil) |
| Sayfa Ici Buton | Popup acmadan dogrudan sayfadan yazdir |
| HTML Temizleme | XSS korumasli guvenli icerik render |
| Mesaj Numaralama | Her mesaj sirayla numaralanir |
| Kod Bloklari | Kod bloklari okunabilir formatta yazdirmaya dahil edilir |
| Artifact Destegi | Claude'un olusturdugu dosyalar otomatik cikarilir |
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

1. [gemini.google.com](https://gemini.google.com) veya [claude.ai](https://claude.ai) adresine gidin
2. Bir konusma acin veya yeni konusma baslatin
3. Sayfanin sag ust kosesinde beliren **yazici ikonuna** tiklayin
4. Yazdirma onizleme sayfasi acilir ve otomatik olarak yazdir/PDF dialogu baslar
5. **"PDF olarak kaydet"** secenegini secerek PDF dosyasi olusturabilirsiniz

> **Not:** Eklentiyi yukledikten sonra acik olan Gemini/Claude sekmelerini yenilemeniz (F5) gerekir.

---

## EN - English

### What Does It Do?

AI Chat Printer lets you print or save as PDF your Google Gemini and Claude.ai conversations with a single click.

- Injects a **printer button** directly into Gemini and Claude pages
- Automatically extracts conversation content (user messages + AI responses)
- Generates a clean, professional **print preview page**
- **Claude artifacts** (code files, documents) are automatically included
- Use your browser's **Save as PDF** feature to create PDF files
- Conversation title is automatically used as the PDF filename

### Features

| Feature | Description |
|---------|-------------|
| Gemini Support | Print conversations from gemini.google.com |
| Claude Support | Print conversations from claude.ai (including artifacts) |
| In-Page Button | Print directly from the page without opening a popup |
| HTML Sanitization | Secure content rendering with XSS protection |
| Message Numbering | Each message is sequentially numbered |
| Code Blocks | Code blocks are included in readable format |
| Artifact Support | Files created by Claude are automatically extracted |
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

1. Go to [gemini.google.com](https://gemini.google.com) or [claude.ai](https://claude.ai)
2. Open an existing conversation or start a new one
3. Click the **printer icon** that appears in the top right area of the page
4. A print preview page opens and the print/PDF dialog starts automatically
5. Choose **"Save as PDF"** to create a PDF file

> **Note:** After installing the extension, you need to refresh (F5) any open Gemini/Claude tabs.

---

## Desteklenen Siteler / Supported Sites

| Site | Durum / Status |
|------|---------------|
| gemini.google.com | ✅ Tam destek / Full support |
| claude.ai | ✅ Tam destek (artifact dahil) / Full support (including artifacts) |

---

## Ekran Goruntuleri / Screenshots

### Gemini - Sayfa Ici Buton / In-Page Button
> Gemini arabirimindeki toolbar'a entegre yazici butonu

### Claude - Sayfa Ici Buton / In-Page Button
> Claude arabiriminde Share butonunun yaninda yazici butonu

### Yazdirma Onizleme / Print Preview
> Mesaj numaralama, rol etiketleri, kod bloklari ve artifact destegiyle temiz cikti

---

## Teknik Detaylar / Technical Details

- **Manifest Version:** V3 (Chrome'un en guncel standardi)
- **Permissions:** `activeTab`, `scripting`, `storage` (minimum gerekli izinler)
- **Dependencies:** Yok / None (saf JavaScript, harici kutuphane kullanilmaz)
- **Data Storage:** Yazdirma verisi gecici olarak `chrome.storage.local`'da tutulur ve kullanildiktan sonra silinir. Hicbir veri disariya gonderilmez.
- **Security:** HTML icerik whitelist tabanli sanitizer ile temizlenir (XSS koruması)

---

## Proje Yapisi / Project Structure

```
├── manifest.json          # Extension manifest (MV3)
├── background.js          # Service worker (tab management)
├── content.js             # Gemini content script (button injection + extraction)
├── content-claude.js      # Claude content script (button + artifact extraction)
├── popup.html             # Extension popup UI (fallback)
├── popup.js               # Popup logic
├── yazdir.html            # Print preview page
├── yazdir.js              # Print rendering + HTML sanitizer
├── yazdir.css             # Print styles (screen + print media)
└── icons/                 # Extension icons (16/48/128px)
```

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
