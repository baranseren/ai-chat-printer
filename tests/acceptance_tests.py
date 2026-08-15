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
            getURL: (path) => configuration.baseUrl + '/' + path,
            getManifest: () => ({{ version: '2.0.0' }}),
            sendMessage: async () => ({{ basari: true }}),
            onMessage: {{ addListener: () => undefined }}
        }},
        tabs: {{
            query: async () => [{{ id: 7, url: configuration.activeUrl }}],
            sendMessage: async () => null,
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
        compile(python_file.read_text(encoding="utf-8"), str(python_file), "exec")
    results.append(f"{len(javascript_files)} JavaScript ve {len(python_files)} Python dosyasının sözdizimi geçti")

    manifest = json.loads((PROJECT_ROOT / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["manifest_version"] == 3
    assert manifest["version"] == "2.0.0"
    assert set(manifest["permissions"]) == {"activeTab", "storage", "clipboardWrite"}
    expected_content_scripts = {
        "https://gemini.google.com/*": "content.js",
        "https://claude.ai/*": "content-claude.js",
        "https://chatgpt.com/*": "content-chatgpt.js",
        "https://grok.com/*": "content-grok.js",
    }
    assert len(manifest["content_scripts"]) == len(expected_content_scripts)
    for content_script in manifest["content_scripts"]:
        assert len(content_script["matches"]) == 1
        assert content_script["matches"][0] in expected_content_scripts
        assert content_script["js"] == ["resim-yardimcilari.js", "ortak-yardimcilar.js", expected_content_scripts[content_script["matches"][0]]]
        assert content_script["run_at"] == "document_idle"
    assert manifest["content_security_policy"]["extension_pages"] == "script-src 'self'; object-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'"
    results.append("Manifest V3, v2.0.0 ve asgari izin sözleşmesi geçti")

    required_files = ["site-yardimcilari.js", "popup.css", "yazdir.css", "GIZLILIK.md", "TEKNIK_DOKUMANTASYON.md"]
    assert all((PROJECT_ROOT / file_name).is_file() for file_name in required_files)
    for versioned_document in ["README.md", "GIZLILIK.md", "TEKNIK_DOKUMANTASYON.md"]:
        assert "2.0.0" in (PROJECT_ROOT / versioned_document).read_text(encoding="utf-8")
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
    assert "credentials: 'omit', referrerPolicy: 'no-referrer'" in image_helpers
    assert "geciciResim.referrerPolicy = 'no-referrer'" in image_helpers
    results.append("Resim yaşam döngüsü, kimlik bilgisi ve referrer koruması geçti")
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
  <li style="min-height:80px" id="mesaj-asistan-1" data-message-role="assistant" data-assistant-content-started data-message-complete><h4 data-message-attribution>ChatGPT:</h4><div data-assistant-markdown><div class="markdown prose"><p>ChatGPT canlı asistan yanıtı.</p><pre><code class="language-js">const sonuc = true;</code></pre></div></div></li>
  <li style="min-height:80px" id="mesaj-kullanici-2" data-message-role="user"><div data-user-message-bubble><p data-user-message-copy>ChatGPT ikinci kullanıcı mesajı</p></div></li>
  <li style="min-height:80px" id="mesaj-asistan-2" data-message-role="assistant"><div data-assistant-markdown><p>ChatGPT ikinci asistan yanıtı.</p></div></li>
  <li style="min-height:80px" id="mesaj-kullanici-3" data-message-role="user"><div data-user-message-bubble><p data-user-message-copy>ChatGPT son kullanıcı mesajı</p></div></li>
  <li style="min-height:80px" id="mesaj-asistan-3" data-message-role="assistant"><div data-assistant-markdown><p>ChatGPT son asistan yanıtı.</p></div></li>
</ol></main></body></html>""",
        },
        "grok": {
            "url": "https://grok.com/c/canli-kabul",
            "route": "https://grok.com/**",
            "button": "#grok-printer-buton",
            "user": "Grok canlı kullanıcı mesajı",
            "assistant": "Grok canlı asistan yanıtı.",
            "html": """<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Canlı Kabul - Grok</title></head><body><main>
<section data-testid="user-message"><div data-message-content><p>Grok canlı kullanıcı mesajı</p></div></section>
<section data-testid="assistant-message"><div data-message-content><p>Grok canlı asistan yanıtı.</p></div></section>
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
                    "version": "2.0.0",
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
                    assert preview_page.locator(".mesaj-blogu").count() == fixture.get("expected_count", 2)
                    assert fixture["user"] in preview_page.locator(".mesaj-blogu").nth(0).inner_text()
                    assert fixture["assistant"] in preview_page.locator(".mesaj-blogu").nth(1).inner_text()
                    assert fixture["url"].split("/")[2] in preview_page.locator("#kaynakSite").inner_text()
                    assert preview_page.evaluate("() => Object.keys(sessionStorage).some((key) => key.startsWith('aiChatPrinterYedek:'))")
                    if site_name == "chatgpt":
                        assert preview_page.locator("code.language-js").count() == 1
                        assert fixture["last_assistant"] in preview_page.locator(".mesaj-blogu").nth(5).inner_text()
                        assert source_page.evaluate("() => document.querySelector('main').scrollTop") == original_scroll
                    elif site_name == "claude":
                        assert preview_page.locator(".artifact-blogu").count() == 1
                        assert "Claude artifact canlı içeriği" in preview_page.locator(".artifact-blogu").inner_text()
                    local_keys = preview_page.evaluate("async () => Object.keys(await chrome.storage.local.get(null))")
                    assert not any(key.startswith("aiChatPrinterOturum:") and "fresh-session" not in key for key in local_keys)
                    preview_page.close()
                    source_page.close()

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
