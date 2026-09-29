# AI Chat Printer v2.0.2 — Dağıtım Künyesi

> Üretim tarihi: 30.08.2026

| Alan | Değer |
|---|---|
| Paket | `dist/AI-Chat-Printer-v2.0.2-webstore.zip` |
| Boyut | 97.337 bayt |
| SHA-256 | `39B506889D8464F4EAEF522FBBFA58653053FCC8928D44E2CE02F88127FC5A10` |
| Hash listesi | `dist/SHA256SUMS-v2.0.2.txt` |
| Manifest konumu | ZIP kökü: `manifest.json` |
| Manifest sürümü | 3 |
| Eklenti sürümü | 2.0.2 |
| Minimum Chrome | 114 |

## Paket İçeriği

ZIP yalnız çalışma anında gereken 20 dosyayı içerir:

- `manifest.json`
- `background.js`
- `site-yardimcilari.js`
- `resim-yardimcilari.js`
- `ortak-yardimcilar.js`
- `content.js`
- `content-claude.js`
- `content-chatgpt.js`
- `content-grok.js`
- `popup.html`, `popup.css`, `popup.js`
- `yazdir.html`, `yazdir.css`, `yazdir.js`
- `_locales/tr/messages.json`, `_locales/en/messages.json`
- `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`

Test, dokümantasyon, mağaza görseli, geliştirme kuralı ve geçici dosya Web Store ZIP'ine alınmamıştır.

## Kabul Sonucu

- Kaynak ağaç: `python .\tests\acceptance_tests.py` → **18/18 başarılı**.
- Açılmış ZIP: `AI_CHAT_PRINTER_PROJECT_ROOT=<açılmış paket> python .\tests\acceptance_tests.py --runtime-only` → **4/4 başarılı**.
- Gerçek MV3 kabulü; service worker, `storage.sync`, `storage.session`, 6 saat TTL, dört content script, `storage.local` oturum taşıması ve `chrome-extension://.../yazdir.html` önizleme zincirini doğrudan paket dosyalarından çalıştırdı.
- Güncelleme sonrası açık desteklenen sekme gerçek `chrome.tabs.reload` ile tazelendi ve content script düğmesi geri geldi.
- Geçici background kopması üçlü yeniden denemeyle, eski popup content script'i otomatik reload+sağlık ping ile kurtarıldı.
- Aynı UUID için iki açma isteği tek önizleme sekme kimliği döndürdü.
- ChatGPT güncel Çalışma dosyası gecikmeli CodeMirror kaynak yüklemesiyle, eski Canvas belgesi ise `canvas-content` geri dönüşüyle aç-oku-kapat yaşam döngüsünden geçti.
- Paket kabulinde oluşturulan geçici açma klasörü ve test betiği test sonunda silindi.
