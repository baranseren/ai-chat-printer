// Background service worker - content script'ten gelen mesajları işler

// Content script'ten gelen mesajları dinle
chrome.runtime.onMessage.addListener((mesaj, gonderen, yanitGonder) => { // mesaj dinleyici
    if (mesaj.islem === 'yazdirmaSayfasiAc') { // yazdırma sayfası aç isteği
        chrome.tabs.create({ url: chrome.runtime.getURL('yazdir.html') }); // yeni sekmede aç
    }
    return true; // asenkron yanıt
});
