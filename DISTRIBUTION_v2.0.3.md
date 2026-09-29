# AI Chat Printer v2.0.3 — Dağıtım Künyesi

> Üretim tarihi: 29.09.2026

| Alan | Değer |
|---|---|
| Paket | `dist/AI-Chat-Printer-v2.0.3-webstore.zip` |
| Boyut | 98.397 bayt |
| SHA-256 | `B17276DF9D2FA8D14FAEA27DCE5A4A201316D1CA06F62C0F19EAA2EB398C118F` |
| Hash listesi | `dist/SHA256SUMS-v2.0.3.txt` |
| Manifest sürümü | 3 |
| Eklenti sürümü | 2.0.3 |
| Minimum Chrome | 114 |

## Paket İçeriği

ZIP kökünde manifest, background, dört content script, üç ortak yardımcı, popup, önizleme, iki locale ve üç ikon olmak üzere yalnız 20 çalışma dosyası bulunur.

## Kabul Sonucu

- Kaynak ağaç: `python .\tests\acceptance_tests.py` → **23/23 başarılı**.
- Açılmış ZIP: `AI_CHAT_PRINTER_PROJECT_ROOT=<açılmış paket> python .\tests\acceptance_tests.py --runtime-only` → **8/8 başarılı**.
- Tamamlanmış ChatGPT mesajı `data-assistant-content-started` taşıdığı ve `data-message-complete` taşımadığı hâlde gerçek MV3 zinciri altı mesajın tamamını önizlemeye aktardı.
- Aynı element açık `[data-message-status="in_progress"]` aldığında streaming engeli true, yalnız content-started taşıdığında false doğrulandı.
- Dört site, service worker yeniden denemesi, sekme yenileme, idempotent önizleme, Canvas/artifact, güvenlik ve dışa aktarım kabulleri gerilemesiz geçti.
- Geçici test klasörleri, test betikleri ve `__pycache__` temizlendi.
