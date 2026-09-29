# -*- coding: utf-8 -*-
"""AI Chat Printer için bağımlılıksız statik ve Playwright kabul testleri."""

from __future__ import annotations

import argparse
import json
import os
import socket
import subprocess
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory

from playwright.sync_api import sync_playwright


PROJECT_ROOT = Path(os.environ.get("AI_CHAT_PRINTER_PROJECT_ROOT", Path(__file__).resolve().parents[1])).resolve()
CHROME_PATH = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")


class SilentHandler(SimpleHTTPRequestHandler):
    """Test sunucusunun gereksiz erişim loglarını susturur."""

    def log_message(self, format_text: str, *arguments: object) -> None:
        return


def free_port() -> int:
    """Yerel test sunucusu için boş bir TCP portu döndürür."""

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as listener:
        listener.bind(("127.0.0.1", 0))
        return int(listener.getsockname()[1])


def chrome_mock_script(base_url: str, local_seed: dict, sync_seed: dict, active_url: str) -> str:
    """Extension API'lerini gerçek storage yaşam döngüsünü koruyan tarayıcı mock'una çevirir."""

    configuration = json.dumps(
        {
            "baseUrl": base_url,
            "localSeed": local_seed,
            "syncSeed": sync_seed,
            "activeUrl": active_url,
        },
        ensure_ascii=False,
    )
    return f"""
(() => {{
    const configuration = {configuration};
    const localKey = '__aiChatPrinterTestLocal';
    const syncKey = '__aiChatPrinterTestSync';
    if (localStorage.getItem(localKey) === null) localStorage.setItem(localKey, JSON.stringify(configuration.localSeed));
    if (localStorage.getItem(syncKey) === null) localStorage.setItem(syncKey, JSON.stringify(configuration.syncSeed));
    const readStore = (key) => JSON.parse(localStorage.getItem(key) || '{{}}');
    const writeStore = (key, value) => localStorage.setItem(key, JSON.stringify(value));
    const selectKeys = (store, keys) => {{
        if (keys === null || keys === undefined) return {{ ...store }};
        const requested = Array.isArray(keys) ? keys : [keys];
        const result = {{}};
        requested.forEach((key) => {{ if (Object.prototype.hasOwnProperty.call(store, key)) result[key] = store[key]; }});
        return result;
    }};
    const makeStorage = (key, quota) => ({{
        QUOTA_BYTES: quota,
        get: async (keys) => selectKeys(readStore(key), keys),
        set: async (items) => writeStore(key, {{ ...readStore(key), ...items }}),
        remove: async (keys) => {{
            const store = readStore(key);
            (Array.isArray(keys) ? keys : [keys]).forEach((item) => delete store[item]);
            writeStore(key, store);
        }},
        clear: async () => writeStore(key, {{}})
    }});
    window.__printCount = 0;
    window.__removedTabs = [];
    window.print = () => {{ window.__printCount += 1; }};
    window.chrome = {{
        storage: {{ local: makeStorage(localKey, 10485760), sync: makeStorage(syncKey, 102400) }},
        runtime: {{
            id: 'test-extension-id',
            getURL: (path) => configuration.baseUrl + '/' + path,
            getManifest: () => ({{ version: '2.0.3', permissions: ['activeTab', 'storage', 'clipboardWrite', 'unlimitedStorage'] }}),
            sendMessage: async () => ({{ basari: true }}),
            onMessage: {{ addListener: () => undefined }}
        }},
        tabs: {{
            query: async () => [{{ id: 7, url: configuration.activeUrl }}],
            sendMessage: async () => null,
            reload: async () => undefined,
            getCurrent: async () => ({{ id: 77 }}),
            remove: async (tabId) => {{ window.__removedTabs.push(tabId); }}
        }},
        commands: {{ onCommand: {{ addListener: () => undefined }} }},
        action: {{ setBadgeText: async () => undefined, setBadgeBackgroundColor: async () => undefined }}
    }};
}})();
"""


def run_static_tests() -> list[str]:
    """Kaynakların sözdizimi, manifest ve encoding sözleşmelerini doğrular."""

    results: list[str] = []
    javascript_files = sorted(PROJECT_ROOT.glob("*.js"))
    for javascript_file in javascript_files:
        subprocess.run(["node", "--check", str(javascript_file)], check=True, capture_output=True, text=True)
    python_files = sorted(PROJECT_ROOT.rglob("*.py"))
    for python_file in python_files:
        compile(python_file.read_text(encoding="utf-8-sig"), str(python_file), "exec")
    results.append(f"{len(javascript_files)} JavaScript ve {len(python_files)} Python dosyasının sözdizimi geçti")

    manifest = json.loads((PROJECT_ROOT / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["manifest_version"] == 3
    assert manifest["version"] == "2.0.3"
    assert set(manifest["permissions"]) == {"activeTab", "storage", "clipboardWrite", "unlimitedStorage"}
    expected_content_scripts = {
        "https://gemini.google.com/*": "content.js",
        "https://claude.ai/*": "content-claude.js",
        "https://chatgpt.com/*": "content-chatgpt.js",
        "https://grok.com/*": "content-grok.js",
    }
    assert set(manifest["host_permissions"]) == set(expected_content_scripts)
    assert len(manifest["content_scripts"]) == len(expected_content_scripts)
    for content_script in manifest["content_scripts"]:
        assert len(content_script["matches"]) == 1
        assert content_script["matches"][0] in expected_content_scripts
        assert content_script["js"] == ["resim-yardimcilari.js", "ortak-yardimcilar.js", expected_content_scripts[content_script["matches"][0]]]
        assert content_script["run_at"] == "document_idle"
    assert manifest["content_security_policy"]["extension_pages"] == "script-src 'self'; object-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'"
    results.append("Manifest V3, v2.0.3 ve dört hedefle sınırlı host izin sözleşmesi geçti")

    required_files = ["site-yardimcilari.js", "popup.css", "yazdir.css", "GIZLILIK.md", "TEKNIK_DOKUMANTASYON.md"]
    assert all((PROJECT_ROOT / file_name).is_file() for file_name in required_files)
    for versioned_document in ["README.md", "GIZLILIK.md", "TEKNIK_DOKUMANTASYON.md"]:
        assert "2.0.3" in (PROJECT_ROOT / versioned_document).read_text(encoding="utf-8")
    results.append("Yeni ortak sözleşme, arayüz ve dokümantasyon dosyaları mevcut")

    searchable_suffixes = {".js", ".css", ".html", ".json", ".md", ".py"}
    for source_path in PROJECT_ROOT.rglob("*"):
        if not source_path.is_file() or source_path.suffix.lower() not in searchable_suffixes:
            continue
        if ".git" in source_path.parts:
            continue
        text = source_path.read_text(encoding="utf-8")
        assert "\ufffd" not in text, f"Replacement karakteri: {source_path}"
        mojibake_patterns = [chr(0x00C3) + chr(0x00A7), chr(0x00C4) + chr(0x00B1), chr(0x00C5) + chr(0x015F)]  # Yanlış decode edilmiş yaygın Türkçe kalıpları.
        assert not any(pattern in text for pattern in mojibake_patterns), f"Mojibake: {source_path}"
    results.append("UTF-8 ve mojibake taraması geçti")

    image_helpers = (PROJECT_ROOT / "resim-yardimcilari.js").read_text(encoding="utf-8")
    assert ".onload =" not in image_helpers and ".onerror =" not in image_helpers
    assert "origin === location.origin ? 'same-origin' : 'omit'" in image_helpers
    assert "geciciResim.referrerPolicy = 'no-referrer'" in image_helpers
    results.append("Resim yaşam döngüsü, kimlik bilgisi ve referrer koruması geçti")

    common_helpers = (PROJECT_ROOT / "ortak-yardimcilar.js").read_text(encoding="utf-8")
    background_source = (PROJECT_ROOT / "background.js").read_text(encoding="utf-8")
    assert "arkaPlanMesajiGonder" in common_helpers
    assert "baglantiKurtarmayiBaslat" in common_helpers
    assert "data-assistant-content-started]:not([data-message-complete])" not in common_helpers
    assert "Sayfayı yenileyin (F5)" not in common_helpers
    assert "desteklenenSekmeleriYenile" in background_source
    assert "icerikBetigineMesajGonder" in background_source
    assert "text: 'F5'" not in background_source
    for content_file in expected_content_scripts.values():
        content_source = (PROJECT_ROOT / content_file).read_text(encoding="utf-8")
        assert "mesaj.islem === 'baglantiSaglik'" in content_source
        assert "bekleyenYazdirmayiDevamEttir(yazdirmaBaslat)" in content_source
    results.append("Service worker yeniden deneme, otomatik sekme yenileme ve dört site sağlık sözleşmesi geçti")
    return results


def run_browser_tests(base_url: str) -> list[str]:
    """Gerçek Chrome üzerinde render, güvenlik, seçim, dışa aktarım ve popup kabulünü çalıştırır."""

    results: list[str] = []
    session_id = "test-session-0001"
    session_key = f"aiChatPrinterOturum:{session_id}"
    safe_png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL8WQAAAABJRU5ErkJggg=="
    unsafe_svg = "data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+PC9zdmc+"
    conversation = {
        "baslik": "Güvenli <Başlık>: Test",
        "tarih": "15.08.2026",
        "saat": "15.45",
        "mesajSayisi": 2,
        "kaynak": "chatgpt",
        "mesajlar": [
            {
                "rol": "kullanici",
                "html": f'<script>window.__xssCalisti=true</script><p class="mesaj-secilmedi kaynak-sinifi language-css">Siz şunu dediniz: Merhaba</p><img src="{unsafe_svg}" onerror="window.__xssCalisti=true">',
                "metin": "Siz şunu dediniz: Merhaba",
                "resimler": [{"src": safe_png, "alt": "Güvenli görsel"}, {"src": unsafe_svg, "alt": "Güvensiz görsel"}],
            },
            {
                "rol": "chatgpt",
                "html": '<h2>Yanıt</h2><pre><code class="language-js kaynak-sinifi">const deger = 1;</code></pre><a href="javascript:alert(1)">Güvensiz</a><a href="https://example.com/test">Güvenli</a>',
                "metin": "Yanıt\nconst deger = 1;",
                "resimler": [{"src": safe_png, "alt": "AI görseli"}],
                "artifactlar": [{"baslik": "örnek.js", "tur": "JavaScript", "icerik": "console.log('✓');"}],
            },
        ],
    }
    settings = {
        "kodBloklari": True,
        "otomatikYazdir": False,
        "yaziBoyutu": "15",
        "footerGoster": False,
        "kagitBoyutu": "A3",
        "yonlendirme": "landscape",
        "kenarBosluk": "dar",
        "linkAdresleriniGoster": False,
    }
    local_seed = {session_key: {"konusmaVerisi": conversation, "yazdirAyarlari": settings, "olusturmaZamani": 1786800000000}}
    sync_seed = {"kullaniciAyarlari": settings}
    screenshot_directory_value = os.environ.get("AI_CHAT_PRINTER_SCREENSHOT_DIR", "").strip()  # İsteğe bağlı görsel kabul hedefi.
    screenshot_directory = Path(screenshot_directory_value) if screenshot_directory_value else None
    if screenshot_directory:
        screenshot_directory.mkdir(parents=True, exist_ok=True)

    executable = str(CHROME_PATH) if CHROME_PATH.is_file() else None
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=executable, headless=True)
        context = browser.new_context(accept_downloads=True)
        context.add_init_script(script=chrome_mock_script(base_url, local_seed, sync_seed, "https://chatgpt.com/c/test"))
        page = context.new_page()
        page.goto(f"{base_url}/yazdir.html?oturum={session_id}", wait_until="networkidle")
        page.wait_for_selector(".mesaj-blogu:nth-child(2)")

        assert page.locator(".mesaj-blogu").count() == 2
        assert page.locator("#mesajlarAlani script, #mesajlarAlani svg").count() == 0
        assert page.evaluate("() => window.__xssCalisti === true") is False
        assert page.locator("#mesajlarAlani .kaynak-sinifi").count() == 0
        assert page.locator("#mesajlarAlani p.language-css").count() == 0
        assert page.locator("#mesajlarAlani code.language-js").count() == 1
        assert page.locator("#mesajlarAlani img").count() == 2
        assert page.locator('a:has-text("Güvensiz")').get_attribute("href") is None
        assert page.locator('a:has-text("Güvenli")').get_attribute("rel") == "noopener noreferrer"
        assert page.locator(".sayfa-alt-bilgi").is_hidden()
        assert page.locator("body").evaluate("element => element.classList.contains('link-adresi-gizli')")
        assert "size: A3 landscape" in page.locator("#dinamikSayfaStili").text_content()
        assert "margin: 1cm" in page.locator("#dinamikSayfaStili").text_content()
        assert page.locator("#yazdirmaAlani").evaluate("element => element.style.fontSize") == "15px"
        assert page.evaluate(f"() => !Object.prototype.hasOwnProperty.call(JSON.parse(localStorage.getItem('__aiChatPrinterTestLocal')), '{session_key}')")
        assert page.evaluate("() => document.documentElement.scrollWidth <= window.innerWidth")
        if screenshot_directory:
            page.screenshot(path=str(screenshot_directory / "onizleme-masaustu.png"), full_page=True)
            page.set_viewport_size({"width": 640, "height": 900})
            page.wait_for_timeout(100)
            assert page.evaluate(
                """() => document.documentElement.scrollWidth <= window.innerWidth &&
                    Array.from(document.querySelectorAll('#kontrolCubugu button, #kontrolCubugu select, #kontrolCubugu input'))
                        .filter((element) => element.getClientRects().length > 0)
                        .every((element) => { const rect = element.getBoundingClientRect(); return rect.left >= 0 && rect.right <= window.innerWidth; })"""
            )
            page.screenshot(path=str(screenshot_directory / "onizleme-dar.png"), full_page=True)
            page.set_viewport_size({"width": 1280, "height": 800})
            page.wait_for_timeout(100)
        results.append("Oturumlu render, XSS/resim/class sanitizer ve sayfa ayarları geçti")

        markdown_check = page.evaluate(
            """() => ({
                withoutFooter: konusmayiMarkdowneDonustur({baslik:'Test',tarih:'',saat:'',mesajSayisi:1,kaynak:'chatgpt',mesajlar:[{rol:'chatgpt',html:'<pre><code>```içerik```</code></pre>',metin:''}]}, false),
                withFooter: konusmayiMarkdowneDonustur({baslik:'Test',tarih:'',saat:'',mesajSayisi:0,kaynak:'chatgpt',mesajlar:[]}, true)
            })"""
        )
        assert "AI Chat Printer eklentisi" not in markdown_check["withoutFooter"]
        assert "````" in markdown_check["withoutFooter"]
        assert "AI Chat Printer eklentisi" in markdown_check["withFooter"]
        results.append("Markdown fence ve footer tercihi geçti")

        chatgpt_streaming_contract = page.evaluate(
            """() => {
                const tamamlanmis = document.createElement('li');
                tamamlanmis.setAttribute('data-message-role', 'assistant');
                tamamlanmis.setAttribute('data-assistant-content-started', '');
                tamamlanmis.textContent = 'Tamamlanmış ChatGPT yanıtı';
                document.body.appendChild(tamamlanmis);
                const kaliciIsaretSonucu = streamingMiKontrol('chatgpt');
                tamamlanmis.setAttribute('data-message-status', 'in_progress');
                const aktifIsaretSonucu = streamingMiKontrol('chatgpt');
                tamamlanmis.remove();
                return {kaliciIsaretSonucu, aktifIsaretSonucu};
            }"""
        )
        assert chatgpt_streaming_contract == {"kaliciIsaretSonucu": False, "aktifIsaretSonucu": True}
        results.append("ChatGPT kalıcı content-started işareti streaming false-positive üretmedi")

        page.check("#mesajSecimModu")
        page.click("#tumunuSecKaldir")
        assert page.locator("#yazdirTetikle").is_disabled()
        assert "0 / 2" in page.locator("#secimBilgisi").text_content()
        page.click("#yalnizYapayZekaSec")
        assert not page.locator("#yazdirTetikle").is_disabled()
        assert page.locator(".mesaj-blogu:not(.mesaj-secilmedi)").count() == 1
        if screenshot_directory:
            page.screenshot(path=str(screenshot_directory / "onizleme-mesaj-secimi.png"), full_page=True)
        page.evaluate("() => { window.__decodeCount = 0; HTMLImageElement.prototype.decode = function() { window.__decodeCount += 1; return Promise.resolve(); }; }")
        page.click("#yazdirTetikle")
        page.wait_for_function("window.__printCount === 1")
        assert page.evaluate("() => window.__decodeCount") == 1
        results.append("Boş seçim kilidi, rol bazlı seçim ve yazdırma hazırlığı geçti")

        with page.expect_download() as download_info:
            page.click("#markdownIndir")
        markdown_download = download_info.value
        assert markdown_download.suggested_filename.endswith(".md")
        markdown_text = Path(markdown_download.path()).read_text(encoding="utf-8")
        assert "## #1 — ChatGPT" in markdown_text
        assert "Kullanıcı" not in markdown_text
        assert "AI Chat Printer eklentisi" not in markdown_text

        with page.expect_download() as download_info:
            page.click("#htmlIndir")
        html_download = download_info.value
        html_text = Path(html_download.path()).read_text(encoding="utf-8")
        assert "<!DOCTYPE html>" in html_text
        assert "window.__xssCalisti" not in html_text
        assert "link-adresi-gizli" in html_text
        results.append("Seçime saygılı Markdown ve güvenli bağımsız HTML dışa aktarımı geçti")

        page.select_option("#canliYaziBoyutu", "17")
        page.select_option("#canliYonlendirme", "portrait")
        page.wait_for_timeout(100)
        assert page.locator("#yazdirmaAlani").evaluate("element => element.style.fontSize") == "17px"
        assert "A3 portrait" in page.locator("#dinamikSayfaStili").text_content()
        results.append("Canlı ayar değişimi ve kalıcı ayar senkronu geçti")

        page.reload(wait_until="networkidle")
        page.wait_for_selector(".mesaj-blogu:nth-child(2)")
        assert page.locator(".mesaj-blogu").count() == 2
        page.evaluate("async () => chrome.storage.local.set({konusmaVerisi:{eski:true}})")
        page.goto(f"{base_url}/yazdir.html?oturum=../gecersiz", wait_until="networkidle")
        page.wait_for_selector("#yuklemeOverlay", state="hidden")
        assert "Yazdırma oturumu geçersiz" in page.locator("#mesajlarAlani").text_content()
        assert page.locator("#yazdirTetikle").is_disabled()
        assert not page.locator("#sayfayiKapat").is_disabled()
        assert page.locator("#ayarCubugu input:not(:disabled), #ayarCubugu select:not(:disabled), #ayarCubugu button:not(:disabled)").count() == 0
        assert page.evaluate("async () => Object.prototype.hasOwnProperty.call(await chrome.storage.local.get(null), 'konusmaVerisi')")
        page.click("#sayfayiKapat")
        page.wait_for_function("window.__removedTabs.length === 1")
        assert page.evaluate("async () => Object.prototype.hasOwnProperty.call(await chrome.storage.local.get(null), 'konusmaVerisi')")

        parallel_first = {"baslik": "Birinci Oturum", "tarih": "15.08.2026", "saat": "17.30", "mesajSayisi": 1, "kaynak": "gemini", "mesajlar": [{"rol": "kullanici", "html": "<p>Birinci veri</p>", "metin": "Birinci veri", "resimler": []}]}
        parallel_second = {"baslik": "İkinci Oturum", "tarih": "15.08.2026", "saat": "17.31", "mesajSayisi": 1, "kaynak": "claude", "mesajlar": [{"rol": "claude", "html": "<p>İkinci veri</p>", "metin": "İkinci veri", "resimler": []}]}
        page.evaluate(
            """async (payload) => chrome.storage.local.set({
                'aiChatPrinterOturum:parallel-session-0001': {konusmaVerisi: payload.first, yazdirAyarlari: {}, olusturmaZamani: Date.now()},
                'aiChatPrinterOturum:parallel-session-0002': {konusmaVerisi: payload.second, yazdirAyarlari: {}, olusturmaZamani: Date.now()}
            })""",
            {"first": parallel_first, "second": parallel_second},
        )
        first_preview = context.new_page()
        second_preview = context.new_page()
        first_preview.goto(f"{base_url}/yazdir.html?oturum=parallel-session-0001", wait_until="networkidle")
        second_preview.goto(f"{base_url}/yazdir.html?oturum=parallel-session-0002", wait_until="networkidle")
        assert first_preview.locator("#konusmaBasligi").text_content() == "Birinci Oturum"
        assert second_preview.locator("#konusmaBasligi").text_content() == "İkinci Oturum"
        assert "İkinci veri" not in first_preview.locator("#mesajlarAlani").inner_text()
        assert "Birinci veri" not in second_preview.locator("#mesajlarAlani").inner_text()
        first_preview.close()
        second_preview.close()
        results.append("Oturum kimlikli F5, geçersiz durum ve paralel önizleme izolasyonu geçti")
        context.close()

        supported_context = browser.new_context()
        supported_page = supported_context.new_page()
        supported_page.add_init_script(script=chrome_mock_script(base_url, {}, sync_seed, "https://claude.ai/chat/test"))
        supported_page.goto(f"{base_url}/popup.html", wait_until="networkidle")
        assert not supported_page.locator("#yazdirButonu").is_disabled()
        assert "Claude konuşması hazır" in supported_page.locator("#siteDurumuMetni").text_content()
        retry_contract = supported_page.evaluate(
            """async () => {
                let arkaPlanDenemesi = 0;
                const orijinalRuntimeMesaji = chrome.runtime.sendMessage;
                chrome.runtime.sendMessage = async () => {
                    arkaPlanDenemesi += 1;
                    if (arkaPlanDenemesi < 3) throw new Error('Could not establish connection. Receiving end does not exist.');
                    return {basari:true};
                };
                const arkaPlanYaniti = await arkaPlanMesajiGonder({islem:'arkaPlanSaglik'});
                chrome.runtime.sendMessage = orijinalRuntimeMesaji;

                let zamanAsimiDenemesi = 0;
                const orijinalSetTimeout = window.setTimeout;
                window.setTimeout = (fonksiyon, sure, ...parametreler) => orijinalSetTimeout(fonksiyon, Math.min(sure, 5), ...parametreler);
                chrome.runtime.sendMessage = () => {
                    zamanAsimiDenemesi += 1;
                    return new Promise(() => {});
                };
                let zamanAsimiHatasi = '';
                try {
                    await arkaPlanMesajiGonder({islem:'yazdirmaSayfasiAc', oturumKimligi:'canli-kabul-0001'});
                } catch (hata) {
                    zamanAsimiHatasi = hata.message;
                }
                chrome.runtime.sendMessage = orijinalRuntimeMesaji;
                window.setTimeout = orijinalSetTimeout;

                let sekmeMesaji = 0;
                let sekmeYenilemesi = 0;
                const orijinalSekmeMesaji = chrome.tabs.sendMessage;
                const orijinalSekmeYenilemesi = chrome.tabs.reload;
                chrome.tabs.sendMessage = async (sekmeId, mesaj) => {
                    if (mesaj.islem === 'baglantiSaglik') return {basari:true,kaynak:'claude'};
                    sekmeMesaji += 1;
                    if (sekmeMesaji === 1) throw new Error('Extension context invalidated.');
                    return {basari:true,mesajlar:[{rol:'claude'}]};
                };
                chrome.tabs.reload = async () => { sekmeYenilemesi += 1; };
                const sekmeYaniti = await popupSekmeyeMesajGonder(7, {islem:'konusmayiCikar'});
                chrome.tabs.sendMessage = orijinalSekmeMesaji;
                chrome.tabs.reload = orijinalSekmeYenilemesi;
                return {arkaPlanDenemesi, arkaPlanBasarili:arkaPlanYaniti.basari, zamanAsimiDenemesi, zamanAsimiHatasi, sekmeMesaji, sekmeYenilemesi, sekmeBasarili:sekmeYaniti.basari};
            }"""
        )
        assert retry_contract == {
            "arkaPlanDenemesi": 3,
            "arkaPlanBasarili": True,
            "zamanAsimiDenemesi": 3,
            "zamanAsimiHatasi": "Arka plan yanıt vermedi.",
            "sekmeMesaji": 2,
            "sekmeYenilemesi": 1,
            "sekmeBasarili": True,
        }
        results.append("Geçici service worker kopması ve eski popup sekmesi otomatik kurtarma sözleşmesi geçti")
        if screenshot_directory:
            supported_page.set_viewport_size({"width": 390, "height": 700})
            supported_page.wait_for_timeout(100)
            assert supported_page.evaluate("() => document.documentElement.scrollWidth <= window.innerWidth && document.body.getBoundingClientRect().width === 390")
            supported_page.screenshot(path=str(screenshot_directory / "popup.png"), full_page=True)
        supported_context.close()

        unsupported_context = browser.new_context()
        unsupported_page = unsupported_context.new_page()
        hostile_url = "https://example.invalid/?yonlendir=https://chatgpt.com/c/sahte"
        unsupported_page.add_init_script(script=chrome_mock_script(base_url, {}, sync_seed, hostile_url))
        unsupported_page.goto(f"{base_url}/popup.html", wait_until="networkidle")
        assert unsupported_page.locator("#yazdirButonu").is_disabled()
        assert "desteklenen bir AI konuşması değil" in unsupported_page.locator("#siteDurumuMetni").text_content()
        unsupported_context.close()
        results.append("Popup erişilebilirliği ve tam-hostname site doğrulaması geçti")
        browser.close()
    return results


def run_extension_runtime_tests() -> list[str]:
    """Paketlenmemiş MV3 eklentisini Chromium'a yükleyip gerçek çalışma zincirini doğrular."""

    results: list[str] = []
    site_fixtures = {
        "gemini": {
            "url": "https://gemini.google.com/app/canli-kabul",
            "route": "https://gemini.google.com/**",
            "button": "#gemini-printer-buton",
            "user": "Gemini canlı kullanıcı mesajı",
            "assistant": "Gemini canlı asistan yanıtı.",
            "html": """<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Canlı Kabul - Google Gemini</title></head><body>
<div class="top-bar-actions"><div class="right-section"><div class="buttons-container"></div><div class="buttons-container"></div></div></div>
<div class="chat-history-scroll-container">
  <user-query><div class="query-text">Siz şunu dediniz: Gemini canlı kullanıcı mesajı</div></user-query>
  <model-response><div class="markdown"><p>Gemini canlı asistan yanıtı.</p></div><message-actions><div><button type="button" aria-label="Diğer işlemler">Diğer</button></div></message-actions></model-response>
</div></body></html>""",
        },
        "claude": {
            "url": "https://claude.ai/chat/canli-kabul",
            "route": "https://claude.ai/**",
            "button": "#claude-printer-buton",
            "user": "Claude canlı kullanıcı mesajı",
            "assistant": "Claude canlı asistan yanıtı.",
            "html": """<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Canlı Kabul | Claude</title></head><body>
<header data-testid="chat-header"><div id="dframe-header-actions-slot"><button type="button" data-testid="wiggle-controls-actions-share">Share</button></div><span data-testid="chat-title-split">Canlı Kabul</span></header>
<div class="flex-1 flex flex-col px-4 max-w-3xl">
  <div data-testid="user-message"><p>Claude canlı kullanıcı mesajı</p></div>
  <div class="font-claude-response">
    <div class="standard-markdown"><p>Claude canlı asistan yanıtı.</p></div>
    <div class="group/artifact-block">
      <div class="artifact-block-cell"><div class="leading-tight line-clamp-1">canli-kabul.js</div><div class="text-text-400 line-clamp-1">JavaScript</div></div>
      <button type="button" aria-label="View artifact">Artifact aç</button>
    </div>
  </div>
</div>
<button id="artifactGeri" type="button" aria-label="Go back" hidden>Geri</button>
<script>
document.querySelector('button[aria-label="View artifact"]').addEventListener('click', () => {
  const panel = document.createElement('div');
  panel.id = 'wiggle-file-content';
  panel.innerHTML = '<div class="code-block__code">Claude artifact canlı içeriği</div>';
  document.body.appendChild(panel);
  document.querySelector('#artifactGeri').hidden = false;
});
document.querySelector('#artifactGeri').addEventListener('click', () => {
  document.querySelector('#wiggle-file-content')?.remove();
  document.querySelector('#artifactGeri').hidden = true;
});
</script></body></html>""",
        },
        "chatgpt": {
            "url": "https://chatgpt.com/c/canli-kabul",
            "route": "https://chatgpt.com/**",
            "button": "#chatgpt-printer-buton",
            "user": "ChatGPT canlı kullanıcı mesajı",
            "assistant": "ChatGPT canlı asistan yanıtı.",
            "last_assistant": "ChatGPT son asistan yanıtı.",
            "expected_count": 6,
            "html": """<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Canlı Kabul | ChatGPT</title></head><body>
<header><div><button type="button" aria-label="Paylaş">Paylaş</button></div></header>
<main style="height:160px;overflow-y:auto"><ol data-conversation-transcript>
  <li style="min-height:80px" id="mesaj-kullanici-1" data-message-role="user"><h4 data-message-attribution>Şunu dedin:</h4><div data-user-message-bubble><p data-user-message-copy>ChatGPT canlı kullanıcı mesajı</p></div></li>
  <li style="min-height:80px" id="mesaj-asistan-1" data-message-role="assistant" data-assistant-content-started data-message-complete><h4 data-message-attribution>ChatGPT:</h4><div data-assistant-markdown><div class="markdown prose"><p>ChatGPT canlı asistan yanıtı.</p><pre><code class="language-js">const sonuc = true;</code></pre><p><button type="button" aria-label="chatgpt-calisma-kabulu.html" data-file-citation-primary-file-id="file-canli-kabul" data-file-citation-group-identity="file-canli-kabul">chatgpt-calisma-kabulu.html</button></p></div></div><button type="button" aria-label="chatgpt-calisma-kabulu.html">chatgpt-calisma-kabulu.html HTML Dosyayı aç</button></li>
  <li style="min-height:80px" id="mesaj-kullanici-2" data-message-role="user"><div data-user-message-bubble><p data-user-message-copy>ChatGPT ikinci kullanıcı mesajı</p></div></li>
  <li style="min-height:80px" id="mesaj-asistan-2" data-message-role="assistant"><div data-assistant-markdown><p>ChatGPT ikinci asistan yanıtı.</p></div><button type="button" data-testid="canvas-open-button" data-canvas-title="Eski Canvas belgesi" aria-label="Canvas'ı aç">Canvas'ı aç</button></li>
  <li style="min-height:80px" id="mesaj-kullanici-3" data-message-role="user"><div data-user-message-bubble><p data-user-message-copy>ChatGPT son kullanıcı mesajı</p></div></li>
  <li style="min-height:80px" id="mesaj-asistan-3" data-message-role="assistant" data-assistant-content-started><div data-assistant-markdown><p>ChatGPT son asistan yanıtı.</p></div></li>
</ol></main>
<script>
function chatgptKabulPaneliniKapat() {
  document.querySelector('section[data-testid="screen-threadFlyOut"], section[data-testid="canvas-panel"]')?.remove();
}
function chatgptCalismaPaneliniAc() {
  chatgptKabulPaneliniKapat();
  window.__chatgptCalismaAcildi = true;
  const panel = document.createElement('section');
  panel.dataset.testid = 'screen-threadFlyOut';
  panel.setAttribute('aria-label', 'chatgpt-calisma-kabulu.html');
  panel.innerHTML = '<header><button type="button" aria-pressed="false">Kod</button><button type="button" aria-pressed="true">Önizleme</button><button type="button" data-testid="close-button" aria-label="Kapat">Kapat</button></header><div data-preview>Önizleme hazırlanıyor...</div>';
  document.body.appendChild(panel);
  panel.querySelector('button').addEventListener('click', () => {
    panel.querySelector('[data-preview]')?.remove();
    panel.querySelectorAll('header button').forEach((button) => button.setAttribute('aria-pressed', button.textContent === 'Kod' ? 'true' : 'false'));
    setTimeout(() => {
      const kaynak = document.createElement('div');
      kaynak.id = 'artifact-html-source:chatgpt-calisma-kabulu.html';
      kaynak.innerHTML = '<pre class="cm-content"><code>&lt;h1&gt;AI Chat Printer Canvas Kabulü&lt;/h1&gt;\\n&lt;p&gt;Canvas içerik çıkarma doğrulaması&lt;/p&gt;</code></pre>';
      panel.appendChild(kaynak);
    }, 120);
  });
  panel.querySelector('[data-testid="close-button"]').addEventListener('click', () => {
    window.__chatgptCalismaKapatildi = true;
    panel.remove();
  });
}
document.querySelectorAll('button[aria-label="chatgpt-calisma-kabulu.html"]').forEach((button) => button.addEventListener('click', chatgptCalismaPaneliniAc));
document.querySelector('button[data-testid="canvas-open-button"]').addEventListener('click', () => {
  chatgptKabulPaneliniKapat();
  window.__chatgptCanvasAcildi = true;
  const panel = document.createElement('section');
  panel.dataset.testid = 'canvas-panel';
  panel.setAttribute('aria-label', 'Eski Canvas belgesi');
  panel.innerHTML = '<button type="button" data-testid="canvas-close-button" aria-label="Kapat">Kapat</button><article data-testid="canvas-content"><h1>Eski Canvas kabulü</h1><p>Canvas belge içeriği korundu.</p></article>';
  document.body.appendChild(panel);
  panel.querySelector('[data-testid="canvas-close-button"]').addEventListener('click', () => {
    window.__chatgptCanvasKapatildi = true;
    panel.remove();
  });
});
</script></body></html>""",
        },
        "grok": {
            "url": "https://grok.com/c/canli-kabul",
            "route": "https://grok.com/**",
            "button": "#grok-printer-buton",
            "user": "Grok canlı kullanıcı mesajı",
            "assistant": "Grok canlı asistan yanıtı.",
            "html": """<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Canlı Kabul - Grok</title></head><body><main>
<div data-testid="user-message" role="article" aria-label="Sen"><div class="response-content-markdown markdown"><p>Grok canlı kullanıcı mesajı</p></div></div>
<div data-testid="assistant-message" role="article" aria-label="Grok"><div class="response-content-markdown markdown"><p>Grok canlı asistan yanıtı.</p></div></div>
<div data-testid="assistant-message" role="article" aria-label="Grok"><div class="response-content-markdown markdown"></div></div>
</main></body></html>""",
        },
    }

    with TemporaryDirectory(prefix="ai-chat-printer-runtime-") as profile_directory:
        with sync_playwright() as playwright:
            context = playwright.chromium.launch_persistent_context(
                profile_directory,
                executable_path=playwright.chromium.executable_path,
                headless=True,
                accept_downloads=True,
                args=[
                    f"--disable-extensions-except={PROJECT_ROOT}",
                    f"--load-extension={PROJECT_ROOT}",
                ],
            )
            runtime_errors: list[str] = []
            try:
                worker = context.service_workers[0] if context.service_workers else context.wait_for_event("serviceworker", timeout=10000)
                extension_id = worker.url.split("/")[2]
                worker_contract = worker.evaluate(
                    """async () => {
                        await chrome.storage.sync.set({kullaniciAyarlari:{kodBloklari:true,otomatikYazdir:false,yaziBoyutu:'13',footerGoster:true,kagitBoyutu:'A4',yonlendirme:'portrait',kenarBosluk:'normal',linkAdresleriniGoster:true}});
                        const staleKey = 'aiChatPrinterOturum:stale-session-0001';
                        const freshKey = 'aiChatPrinterOturum:fresh-session-0001';
                        await chrome.storage.local.set({
                            konusmaVerisi: {eski:true},
                            [staleKey]: {olusturmaZamani: Date.now() - (7 * 60 * 60 * 1000)},
                            [freshKey]: {olusturmaZamani: Date.now()}
                        });
                        await kalintiYazdirmaOturumlariniTemizle(false);
                        const localAfterCleanup = await chrome.storage.local.get(null);
                        return {
                            version: chrome.runtime.getManifest().version,
                            validSource: desteklenenSiteBilgisi('https://chatgpt.com/c/canli')?.kaynak || null,
                            hostileSource: desteklenenSiteBilgisi('https://example.invalid/?yonlendir=https://chatgpt.com/c/sahte'),
                            legacyRemoved: !Object.prototype.hasOwnProperty.call(localAfterCleanup, 'konusmaVerisi'),
                            staleRemoved: !Object.prototype.hasOwnProperty.call(localAfterCleanup, staleKey),
                            freshPreserved: Object.prototype.hasOwnProperty.call(localAfterCleanup, freshKey)
                        };
                    }"""
                )
                assert worker_contract == {
                    "version": "2.0.3",
                    "validSource": "chatgpt",
                    "hostileSource": None,
                    "legacyRemoved": True,
                    "staleRemoved": True,
                    "freshPreserved": True,
                }
                results.append("Gerçek MV3 service worker, site sözleşmesi, storage.sync ve 6 saat TTL geçti")

                for fixture in site_fixtures.values():
                    context.route(
                        fixture["route"],
                        lambda route, request, html=fixture["html"]: route.fulfill(status=200, content_type="text/html; charset=utf-8", body=html),
                    )

                recovery_page = context.new_page()
                recovery_page.goto(site_fixtures["gemini"]["url"], wait_until="domcontentloaded")
                recovery_page.wait_for_selector(site_fixtures["gemini"]["button"], state="visible", timeout=10000)
                renewal_result = worker.evaluate("desteklenenSekmeleriYenile()")
                assert renewal_result["bulunan"] >= 1
                assert renewal_result["yenilenen"] >= 1
                recovery_page.wait_for_load_state("domcontentloaded")
                recovery_page.wait_for_selector(site_fixtures["gemini"]["button"], state="visible", timeout=10000)
                assert recovery_page.evaluate("() => performance.getEntriesByType('navigation')[0].type") == "reload"
                recovery_page.close()
                results.append("Güncelleme sonrası açık desteklenen sekme otomatik yenilendi ve content script geri geldi")

                idempotent_contract = worker.evaluate(
                    """async () => {
                        const oturum = 'idempotent-session-0001';
                        await chrome.storage.local.set({
                            ['aiChatPrinterOturum:' + oturum]: {
                                konusmaVerisi: {baslik:'İdempotent Kabul',tarih:'30.08.2026',saat:'12.00',mesajSayisi:1,kaynak:'gemini',mesajlar:[{rol:'gemini',html:'<p>Tek önizleme</p>',metin:'Tek önizleme',resimler:[]}]},
                                yazdirAyarlari: {otomatikYazdir:false},
                                olusturmaZamani: Date.now()
                            }
                        });
                        const ilk = await yazdirmaSayfasiniAc(oturum);
                        const ikinci = await yazdirmaSayfasiniAc(oturum);
                        return {ilk, ikinci};
                    }"""
                )
                assert idempotent_contract["ilk"]["basari"] is True
                assert idempotent_contract["ilk"]["yenidenKullanildi"] is False
                assert idempotent_contract["ikinci"]["basari"] is True
                assert idempotent_contract["ikinci"]["yenidenKullanildi"] is True
                assert idempotent_contract["ilk"]["sekmeId"] == idempotent_contract["ikinci"]["sekmeId"]
                worker.evaluate("new Promise((coz) => setTimeout(coz, 500))")
                idempotent_pages = [page for page in context.pages if "idempotent-session-0001" in page.url]
                assert len(idempotent_pages) == 1, [page.url for page in context.pages]
                idempotent_pages[0].close()
                results.append("Yanıt kaybı yeniden denemesinde aynı oturum tek önizleme sekmesinde kaldı")

                for site_name, fixture in site_fixtures.items():
                    source_page = context.new_page()
                    source_page.on("pageerror", lambda error, name=site_name: runtime_errors.append(f"{name} kaynak sayfa: {error}"))
                    source_page.goto(fixture["url"], wait_until="domcontentloaded")
                    source_page.wait_for_selector(fixture["button"], state="visible", timeout=10000)
                    assert source_page.locator(fixture["button"]).get_attribute("type") == "button"

                    original_scroll = 0
                    if site_name == "gemini":
                        source_page.wait_for_selector(".gp-md-btn", state="visible", timeout=10000)
                        assert source_page.locator(".gp-indir-btn").count() == 2
                        with source_page.expect_download(timeout=10000) as quick_download_info:
                            source_page.click(".gp-md-btn")
                        quick_download = quick_download_info.value
                        quick_markdown = Path(quick_download.path()).read_text(encoding="utf-8")
                        assert fixture["user"] in quick_markdown and fixture["assistant"] in quick_markdown
                    elif site_name == "chatgpt":
                        original_scroll = source_page.evaluate("() => { const alan = document.querySelector('main'); alan.scrollTop = 120; return alan.scrollTop; }")

                    with context.expect_page(timeout=15000) as preview_info:
                        source_page.click(fixture["button"])
                    preview_page = preview_info.value
                    preview_page.on("pageerror", lambda error, name=site_name: runtime_errors.append(f"{name} önizleme: {error}"))
                    preview_page.wait_for_load_state("domcontentloaded")
                    preview_page.wait_for_selector(".mesaj-blogu:nth-child(2)", timeout=20000)

                    assert preview_page.url.startswith(f"chrome-extension://{extension_id}/yazdir.html?oturum=")
                    actual_message_count = preview_page.locator(".mesaj-blogu").count()
                    assert actual_message_count == fixture.get("expected_count", 2), f"{site_name}: {actual_message_count} mesaj"
                    assert fixture["user"] in preview_page.locator(".mesaj-blogu").nth(0).inner_text()
                    assert fixture["assistant"] in preview_page.locator(".mesaj-blogu").nth(1).inner_text()
                    assert fixture["url"].split("/")[2] in preview_page.locator("#kaynakSite").inner_text()
                    assert preview_page.evaluate("() => Object.keys(sessionStorage).some((key) => key.startsWith('aiChatPrinterYedek:'))")
                    if site_name == "chatgpt":
                        assert preview_page.locator("code.language-js").count() == 1
                        assert fixture["last_assistant"] in preview_page.locator(".mesaj-blogu").nth(5).inner_text()
                        assert preview_page.locator(".artifact-blogu").count() == 2
                        artifact_text = preview_page.locator(".artifact-blogu").all_inner_texts()
                        assert any("Canvas içerik çıkarma doğrulaması" in text for text in artifact_text), artifact_text
                        assert any("Canvas belge içeriği korundu." in text for text in artifact_text), artifact_text
                        assert source_page.evaluate("() => document.querySelector('main').scrollTop") == original_scroll
                        assert source_page.evaluate("() => window.__chatgptCalismaAcildi === true && window.__chatgptCalismaKapatildi === true")
                        assert source_page.evaluate("() => window.__chatgptCanvasAcildi === true && window.__chatgptCanvasKapatildi === true")
                        assert source_page.locator('section[data-testid="screen-threadFlyOut"], section[data-testid="canvas-panel"]').count() == 0
                    elif site_name == "claude":
                        assert preview_page.locator(".artifact-blogu").count() == 1
                        assert "Claude artifact canlı içeriği" in preview_page.locator(".artifact-blogu").inner_text()
                    local_keys = preview_page.evaluate("async () => Object.keys(await chrome.storage.local.get(null))")
                    assert not any(key.startswith("aiChatPrinterOturum:") and "fresh-session" not in key for key in local_keys)
                    preview_page.close()
                    source_page.close()

                # ChatGPT'nin güncel arama birimi DOM'unda eski turn seçicileri bulunmaz.
                current_page = context.new_page()
                current_page.on("pageerror", lambda error: runtime_errors.append(f"chatgpt güncel kaynak sayfa: {error}"))
                current_page.route("https://chatgpt.com/**", lambda route: route.fulfill(status=200, content_type="text/html", body="""<!doctype html><meta charset="utf-8"><title>Güncel ChatGPT konuşması</title><header></header><main>
<div data-chatgpt-search-unit-key="fallback-turn-0:0:user" data-chatgpt-search-message-ids="guncel-kullanici-1"><div data-user-message-bubble><p data-user-message-copy>Güncel kullanıcı sorusu</p></div></div>
<div data-chatgpt-search-unit-key="fallback-turn-0:2:assistant" data-chatgpt-search-message-ids="guncel-asistan-1"><h4 data-conversation-role="assistant" class="sr-only">ChatGPT:</h4><div data-chatgpt-selection-message-id="guncel-asistan-1"><div data-markdown-text-style class="MarkdownRoot-degisken"><p>Güncel asistan yanıtı</p><pre><code class="language-js">var sonuc = 1;</code></pre></div></div></div>
</main>"""))
                current_page.goto("https://chatgpt.com/c/guncel-dom-kabul", wait_until="domcontentloaded")
                current_page.wait_for_selector("#chatgpt-printer-buton", state="visible", timeout=10000)
                assert current_page.locator('[data-testid^="conversation-turn"], li[data-message-role]').count() == 0
                with context.expect_page(timeout=15000) as current_preview_info:
                    current_page.click("#chatgpt-printer-buton")
                current_preview = current_preview_info.value
                current_preview.on("pageerror", lambda error: runtime_errors.append(f"chatgpt güncel önizleme: {error}"))
                current_preview.wait_for_selector(".mesaj-blogu:nth-child(2)", timeout=20000)
                assert current_preview.locator(".mesaj-blogu").count() == 2
                assert "Güncel kullanıcı sorusu" in current_preview.locator(".mesaj-blogu").nth(0).inner_text()
                assert "Güncel asistan yanıtı" in current_preview.locator(".mesaj-blogu").nth(1).inner_text()
                assert current_preview.locator("code.language-js").count() == 1
                assert "ChatGPT:" not in current_preview.locator(".mesaj-icerigi").all_inner_texts()[1]
                current_preview.close()
                current_page.close()
                results.append("ChatGPT güncel arama birimi DOM'unda kullanıcı ve asistan yazdırma kabulü geçti")

                # Gerçek MV3 zincirinde düğme içi, yinelenen ve metin arası görselleri doğrula.
                image_page = context.new_page()
                image_page.route("https://chatgpt.com/**", lambda route: route.fulfill(status=200, content_type="text/html", body="""<!doctype html><meta charset="utf-8"><header></header><main><ol>
<li data-message-role="user" id="image-user"><div data-user-message-bubble><button aria-label="Görseli aç"><img width="1200" height="600" alt="Yüklenen görsel"></button><p>Resimden sonraki soru</p></div></li>
<section data-testid="conversation-turn-2" data-turn="assistant" id="image-assistant"><div data-assistant-markdown><p>Görselden önce</p></div><button aria-label="Görseli aç"><img width="1200" height="600" alt="Üretilen görsel"><img aria-hidden="true" width="1200" height="600"></button><div data-assistant-markdown><p>Görselden sonra</p></div></section><section data-testid="conversation-turn-3" data-turn="assistant" id="image-only"><div><div data-conversation-screenshot-content><div role="button"><img width="1200" height="600" alt="Yalnız üretilen görsel"><img aria-hidden="true" width="1200" height="600"></div></div></div></section>
</ol></main><script>var c=document.createElement('canvas');c.width=1200;c.height=600;var x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,1200,600);x.fillStyle='black';x.font='48px Arial';x.fillText('Görsel aktarımı 1200 × 600',80,120);c.toBlob(function(b){var u=URL.createObjectURL(b);document.querySelectorAll('img').forEach(function(i){i.src=u;});});</script>"""))
                image_page.goto("https://chatgpt.com/c/resim-kabul")
                image_page.wait_for_selector("#chatgpt-printer-buton")
                image_page.wait_for_function("() => Array.from(document.querySelectorAll('img')).every(i => i.complete && i.naturalWidth === 1200)")
                with context.expect_page() as image_preview_info:
                    image_page.click("#chatgpt-printer-buton")
                image_preview = image_preview_info.value
                image_preview.wait_for_selector(".mesaj-blogu:nth-child(2) img")
                assert image_preview.locator(".mesaj-icerigi img").count() == 3
                assert image_preview.locator(".mesaj-blogu").count() == 3
                image_stats = image_preview.locator(".mesaj-icerigi img").evaluate_all("(images) => images.map(i => ({width:i.naturalWidth, shown:i.getBoundingClientRect().width, source:i.src.startsWith('data:image/png')}))")
                assert all(i["width"] == 1200 and i["shown"] > 400 and i["source"] for i in image_stats), image_stats
                flow = image_preview.locator(".mesaj-blogu").nth(1).locator(".mesaj-icerigi").evaluate("(e) => Array.from(e.querySelectorAll('p,img')).map(n => n.tagName === 'IMG' ? 'RESİM' : n.textContent)")
                assert flow == ["Görselden önce", "RESİM", "Görselden sonra"], flow
                image_preview.emulate_media(media="print")
                assert image_preview.locator(".mesaj-icerigi img").evaluate_all("(images) => images.every(i => i.getBoundingClientRect().width > 400 && Math.abs(i.getBoundingClientRect().width / i.getBoundingClientRect().height - 2) < .02)")
                image_preview.emulate_media(media="screen")
                screenshot_target = os.environ.get("AI_CHAT_PRINTER_SCREENSHOT_DIR")
                if screenshot_target:
                    Path(screenshot_target).mkdir(parents=True, exist_ok=True)
                    image_preview.screenshot(path=str(Path(screenshot_target) / "chatgpt-resim-kabul.png"), full_page=True)
                # Mermaid benzeri SVG: yüklenmiş ve görünüm dışı lazy kaynakları PNG olarak koru.
                image_page.add_script_tag(path=str(PROJECT_ROOT / "resim-yardimcilari.js"))
                svg_result = image_page.evaluate("""async () => {
                    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="710" height="396" viewBox="0 0 710 396"><rect width="710" height="396" fill="white"/><path d="M20 20H690V376H20Z" fill="#e0f2fe" stroke="black"/><text x="50" y="150" font-size="32">Teknik Ofis → Planlama</text></svg>';
                    var source = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
                    var loaded = new Image(); loaded.src = source; await loaded.decode();
                    resimIslemOturumuBaslat(-1);
                    var ready = await resmiBase64Yap(loaded);
                    var readyBlob = await resmiBase64Yap(document.querySelector('img'));
                    resimIslemOturumuBitir();
                    var lazy = new Image(); lazy.loading = 'lazy'; lazy.src = source;
                    var delayed = await resmiBase64Yap(lazy);
                    var result = new Image(); result.src = delayed; await result.decode();
                    var canvas = document.createElement('canvas'); canvas.width = result.naturalWidth; canvas.height = result.naturalHeight;
                    var ctx = canvas.getContext('2d'); ctx.drawImage(result, 0, 0);
                    var pixel = Array.from(ctx.getImageData(100,100,1,1).data);
                    return {ready:ready.startsWith('data:image/png;base64,'), blob:readyBlob.startsWith('data:image/png;base64,'), delayed:delayed.startsWith('data:image/png;base64,'), width:result.naturalWidth, height:result.naturalHeight, pixel:pixel};
                }""")
                assert svg_result == {"ready": True, "blob": True, "delayed": True, "width": 1420, "height": 792, "pixel": [224, 242, 254, 255]}, svg_result
                # Aynı SVG gerçek content script ve yazdırma sanitizer zincirinden de geçmeli.
                image_page.evaluate("""() => { var i=document.querySelector('#image-only img'); i.src='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="710" height="396"><rect width="710" height="396" fill="white"/><text x="40" y="100" font-size="32">Mermaid diyagramı</text></svg>'); i.removeAttribute('alt'); i.setAttribute('aria-label','Mermaid diyagramı'); }""")
                image_page.wait_for_function("() => document.querySelector('#image-only img').naturalWidth === 710")
                with context.expect_page() as svg_preview_info:
                    image_page.click("#chatgpt-printer-buton")
                svg_preview = svg_preview_info.value
                svg_preview.wait_for_selector('img[alt="Mermaid diyagramı"]')
                svg_preview.wait_for_function("() => document.querySelector('img[alt=\"Mermaid diyagramı\"]').naturalWidth === 1420")
                assert svg_preview.locator('img[alt="Mermaid diyagramı"]').evaluate("i => i.src.startsWith('data:image/png;base64,') && i.getBoundingClientRect().width > 400")
                assert svg_preview.locator('.mesaj-icerigi svg').count() == 0
                svg_preview.close()
                results.append("SVG kabulü: Mermaid PNG aktarımı, lazy yükleme, süre dolmuş hazır blob ve piksel içeriği geçti")
                image_preview.close()
                image_page.close()
                results.append("Görsel kabulü: düğme içi yükleme, dekoratif tekilleştirme, 1200 piksel ve metin sırası geçti")
                large_page = context.new_page()
                large_page.goto(f"chrome-extension://{extension_id}/popup.html", wait_until="domcontentloaded")
                with context.expect_page(timeout=90000) as large_preview_info:
                    large_result = large_page.evaluate("""async () => {
                        var veri = {
                            baslik: 'Büyük konuşma kabulü', tarih: '24.09.2026', saat: '12.00',
                            mesajSayisi: 1, kaynak: 'chatgpt',
                            mesajlar: [{rol: 'chatgpt', html: '<p>30 MB aktarım başarıyla açıldı.</p>', metin: 'A'.repeat(30 * 1024 * 1024), resimler: []}]
                        };
                        var durum = quotaKontrol(veri);
                        var basari = await yazdirmayaBasla(veri, () => undefined);
                        return {basari: basari, gecerli: durum.gecerli, boyut: durum.boyut};
                    }""")
                assert large_result["boyut"] > 30 * 1024 * 1024, large_result
                assert large_result["gecerli"] and large_result["basari"], large_result
                large_preview = large_preview_info.value
                large_preview.wait_for_selector(".mesaj-blogu", timeout=90000)
                assert "30 MB aktarım başarıyla açıldı." in large_preview.locator(".mesaj-blogu").inner_text()
                large_session = large_preview.url.split("oturum=", 1)[1].split("&", 1)[0]
                large_key = "aiChatPrinterOturum:" + large_session
                assert large_page.evaluate("async key => Boolean((await chrome.storage.local.get(key))[key])", large_key)
                assert large_preview.evaluate("() => !Object.keys(sessionStorage).some(key => key.startsWith('aiChatPrinterYedek:'))")
                large_preview.reload(wait_until="domcontentloaded")
                large_preview.wait_for_selector(".mesaj-blogu", timeout=90000)
                assert "30 MB aktarım başarıyla açıldı." in large_preview.locator(".mesaj-blogu").inner_text()
                large_preview.close()
                large_page.wait_for_function("async key => !(await chrome.storage.local.get(key))[key]", arg=large_key, timeout=30000)
                large_page.close()
                results.append("30 MB gerçek MV3 aktarımı, F5 ve sekme kapanışında depolama temizliği geçti")
                assert not runtime_errors, " | ".join(runtime_errors)
                results.append("Dört gerçek content script → storage.local → service worker → önizleme zinciri geçti")
            finally:
                context.close()
    return results


def main() -> None:
    """Tam paketi veya yalnız gerçek MV3 çalışma zincirini doğrular."""

    parser = argparse.ArgumentParser(description="AI Chat Printer kabul paketi")
    parser.add_argument("--runtime-only", action="store_true", help="Yalnız gerçek MV3 service worker ve dört site zincirini çalıştır")
    arguments = parser.parse_args()

    if arguments.runtime_only:
        results = run_extension_runtime_tests()
    else:
        results = run_static_tests()
        port = free_port()
        handler = lambda *args, **kwargs: SilentHandler(*args, directory=str(PROJECT_ROOT), **kwargs)
        server = ThreadingHTTPServer(("127.0.0.1", port), handler)
        server_thread = threading.Thread(target=server.serve_forever, daemon=True)
        server_thread.start()
        try:
            results.extend(run_browser_tests(f"http://127.0.0.1:{port}"))
        finally:
            server.shutdown()
            server.server_close()
            server_thread.join(timeout=3)

        results.extend(run_extension_runtime_tests())

    print("AI Chat Printer kabul sonucu: BAŞARILI")
    for index, result in enumerate(results, start=1):
        print(f"{index:02d}. {result}")


if __name__ == "__main__":
    main()
