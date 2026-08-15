// AI Chat Printer - Desteklenen site sözleşmesi
// Background, popup ve yazdırma sayfası aynı hostname/kaynak bilgisini buradan okur.

const DESTEKLENEN_SITELER = Object.freeze({ // hostname tabanlı tek doğru kaynak
    'gemini.google.com': Object.freeze({ hostname: 'gemini.google.com', kaynak: 'gemini', ad: 'GEMINI', gorunenAd: 'Gemini', baslik: 'Gemini Konuşması' }), // Gemini
    'claude.ai': Object.freeze({ hostname: 'claude.ai', kaynak: 'claude', ad: 'CLAUDE', gorunenAd: 'Claude', baslik: 'Claude Konuşması' }), // Claude
    'chatgpt.com': Object.freeze({ hostname: 'chatgpt.com', kaynak: 'chatgpt', ad: 'CHATGPT', gorunenAd: 'ChatGPT', baslik: 'ChatGPT Konuşması' }), // ChatGPT
    'grok.com': Object.freeze({ hostname: 'grok.com', kaynak: 'grok', ad: 'GROK', gorunenAd: 'Grok', baslik: 'Grok Konuşması' }) // Grok
});

// Bir URL'yi ayrıştırıp yalnız tam hostname eşleşmesinde desteklenen site bilgisini döndürür
function desteklenenSiteBilgisi(adres) {
    if (!adres || typeof adres !== 'string') return null; // boş veya yanlış tip
    try { // URL ayrıştırma güvenli şekilde yapılır
        const url = new URL(adres); // substring yerine gerçek URL sözleşmesi
        if (url.protocol !== 'https:') return null; // hedef siteler yalnız HTTPS'tir
        return DESTEKLENEN_SITELER[url.hostname.toLowerCase()] || null; // tam hostname eşleşmesi
    } catch (hata) { // geçersiz URL
        return null; // desteklenmiyor
    }
}

// Kaynak anahtarından site bilgisini döndürür
function kaynakSiteBilgisi(kaynak) {
    const bilgi = Object.values(DESTEKLENEN_SITELER).find((site) => site.kaynak === kaynak); // kaynak eşleşmesini ara
    return bilgi || { hostname: 'Yerel kaynak', kaynak: 'ai', ad: 'AI', gorunenAd: 'AI', baslik: 'AI Konuşması' }; // bilinmeyen kaynak için tarafsız fallback
}
