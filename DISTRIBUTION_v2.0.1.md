# AI Chat Printer v2.0.1 — Dağıtım Künyesi

> Üretim tarihi: 15.08.2026

| Alan | Değer |
|---|---|
| Paket | `dist/AI-Chat-Printer-v2.0.1-webstore.zip` |
| Boyut | 92.759 bayt |
| SHA-256 | `89B546C42A3E70F3EB79D767C46DF3FA6969BF82BF2BF30F78F253685FACB830` |
| Hash listesi | `dist/SHA256SUMS-v2.0.1.txt` |
| Manifest konumu | ZIP kökü: `manifest.json` |
| Manifest sürümü | 3 |
| Eklenti sürümü | 2.0.1 |
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

- Kaynak ağaç: `python .\tests\acceptance_tests.py` → **14/14 başarılı**.
- Açılmış ZIP: `AI_CHAT_PRINTER_PROJECT_ROOT=<açılmış paket> python .\tests\acceptance_tests.py --runtime-only` → **2/2 başarılı**.
- Gerçek MV3 kabulü; service worker, `storage.sync`, 6 saat TTL, dört content script, `storage.local` oturum taşıması ve `chrome-extension://.../yazdir.html` önizleme zincirini doğrudan paket dosyalarından çalıştırdı.
- ChatGPT güncel Çalışma dosyası gecikmeli CodeMirror kaynak yüklemesiyle, eski Canvas belgesi ise `canvas-content` geri dönüşüyle aç-oku-kapat yaşam döngüsünden geçti.
- Paket kabulünde oluşturulan geçici açma klasörü test sonunda silindi.
