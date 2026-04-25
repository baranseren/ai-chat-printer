// Background service worker - content script'ten gelen mesajları ve keyboard shortcut'ı işler

// Content script'ten gelen mesajları dinle
chrome.runtime.onMessage.addListener((mesaj, gonderen, yanitGonder) => { // mesaj dinleyici
    if (mesaj.islem === 'yazdirmaSayfasiAc') { // yazdırma sayfası aç isteği
        chrome.tabs.create({ url: chrome.runtime.getURL('yazdir.html') }); // yeni sekmede aç
        yanitGonder({ basari: true }); // yanıt dön
        return false; // senkron yanıt
    }
    return false; // bilinmeyen mesaj — yanıt yok
});

// Keyboard shortcut dinleyicisi — Ctrl+Shift+P / Cmd+Shift+P
chrome.commands.onCommand.addListener(async (komut) => { // komut tetiklendi
    if (komut !== 'yazdir-kisayol') return; // bizim komutumuz değilse atla

    try { // aktif sekmeyi al
        const [aktifSekme] = await chrome.tabs.query({ active: true, currentWindow: true }); // aktif sekme
        if (!aktifSekme || !aktifSekme.url) return; // sekme yoksa çık

        // Desteklenen site kontrolü
        const desteklenenSite = aktifSekme.url.includes('gemini.google.com') || // Gemini
            aktifSekme.url.includes('claude.ai') || // Claude
            aktifSekme.url.includes('chatgpt.com') || // ChatGPT
            aktifSekme.url.includes('grok.com'); // Grok
        if (!desteklenenSite) { // desteklenmeyen site
            // Badge ile bildir — ekranda uyarı gösterilemez
            chrome.action.setBadgeText({ text: '!', tabId: aktifSekme.id }); // uyarı badge
            chrome.action.setBadgeBackgroundColor({ color: '#d93025', tabId: aktifSekme.id }); // kırmızı
            setTimeout(() => chrome.action.setBadgeText({ text: '', tabId: aktifSekme.id }), 3000); // 3sn sonra temizle
            return;
        }

        // Content script'e yazdırma tetikle
        try { // mesaj gönderme denemesi
            await chrome.tabs.sendMessage(aktifSekme.id, { islem: 'klavyeKisayoluYazdir' }); // tetikle
        } catch (iletisimHata) { // content script hazır değilse — kullanıcıya badge ile bildir
            console.warn('AI Chat Printer [Shortcut]: Content script erişilemedi:', iletisimHata.message); // log
            chrome.action.setBadgeText({ text: 'F5', tabId: aktifSekme.id }); // sayfa yenileme önerisi
            chrome.action.setBadgeBackgroundColor({ color: '#f59e0b', tabId: aktifSekme.id }); // amber uyarı
            setTimeout(() => chrome.action.setBadgeText({ text: '', tabId: aktifSekme.id }), 4000); // 4sn temizle
        }
    } catch (hata) { // genel hata
        console.error('AI Chat Printer [Shortcut]: Komut işleme hatası:', hata.message); // hata
    }
});

// Extension kurulduğunda veya güncellendiğinde sekmelere bildir (opsiyonel bilgi amaçlı)
chrome.runtime.onInstalled.addListener((detaylar) => { // kurulum olayı
    if (detaylar.reason === 'install') { // ilk kurulum
        console.log('AI Chat Printer: İlk kurulum tamamlandı.'); // hoşgeldin mesajı
    } else if (detaylar.reason === 'update') { // güncelleme
        console.log('AI Chat Printer: v' + chrome.runtime.getManifest().version + ' sürümüne güncellendi.'); // sürüm bilgisi
    }
});
