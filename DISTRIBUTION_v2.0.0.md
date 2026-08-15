# AI Chat Printer v2.0.0 — Dağıtım Künyesi

> Üretim tarihi: 15.08.2026

| Alan | Değer |
|---|---|
| Paket | `dist/AI-Chat-Printer-v2.0.0-webstore.zip` |
| Boyut | 87.111 bayt |
| SHA-256 | `0388E89DDB5E6C1B15BB665FC6311B3FED4524752FC529CDEEA37641AFAD6C4C` |
| Hash listesi | `dist/SHA256SUMS-v2.0.0.txt` |
| Manifest konumu | ZIP kökü: `manifest.json` |
| Manifest sürümü | 3 |
| Eklenti sürümü | 2.0.0 |
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

Test, dokümantasyon, mağaza görseli, Python üretici, geliştirme kuralı ve geçici dosya Web Store ZIP'ine alınmamıştır.

## Kabul Sonucu

- Kaynak ağaç: `python -u .\tests\acceptance_tests.py` → **14/14 başarılı**.
- Açılmış ZIP: `AI_CHAT_PRINTER_PROJECT_ROOT=<açılmış paket> python -u .\tests\acceptance_tests.py --runtime-only` → **2/2 başarılı**.
- Paket kabulü Playwright Chromium'un yalıtılmış geçici profilinde gerçek MV3 service worker, `storage.sync`, 6 saat TTL, Gemini/Claude/ChatGPT/Grok content script enjeksiyonu, `storage.local` oturum taşıması ve `chrome-extension://.../yazdir.html` önizleme zincirini doğrudan ZIP dosyalarından çalıştırdı. Kurulu Google Chrome aynı paketin render/popup katmanında ayrıca kullanıldı; Chrome 137+ resmî build'lerde `--load-extension` bayrağı kaldırıldığı için komut satırı yükleme katmanında Chromium kanonik test yüzeyidir.
