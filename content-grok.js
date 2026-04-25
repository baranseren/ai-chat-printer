// AI Chat Printer - Grok Content Script
// grok.com sayfasına yazdır butonu enjekte eder ve konuşma içeriğini çıkarır

// Buton zaten enjekte edildi mi kontrolü
let butonEnjekteEdildi = false; // tekrar enjekte etmeyi önle

// Sayfa yüklendiğinde ve navigasyon değişikliklerinde butonu enjekte et
function baslat() {
    butonuEnjekteEt(); // ilk deneme
    // Grok SPA olduğu için URL ve DOM değişikliklerini izle — debounce ile CPU yükü düşür
    const butonuKontrolEt = debounce(() => { // 200ms debounce'lu kontrol
        if (!document.querySelector('#grok-printer-buton')) { // buton kaybolmuşsa
            butonEnjekteEdildi = false; // tekrar enjekte edilebilir
            butonuEnjekteEt(); // butonu yeniden ekle
        }
    }, 200);
    const gozlemci = new MutationObserver(butonuKontrolEt); // debounce'lu observer
    gozlemci.observe(document.body, { childList: true, subtree: true }); // body'deki değişiklikleri izle
    // Sayfa gizlenince observer'ı temizle (memory leak önleme)
    window.addEventListener('pagehide', () => gozlemci.disconnect(), { once: true }); // pagehide event
}

// Grok'un agresif React reconciliation'ı header inject'ini bozuyor — floating fixed button kullan
// Body'e eklenir, viewport'a kilitlidir, React DOM'una dokunmaz

// Yazdır butonunu floating fixed olarak body'e ekler (sağ üst köşede sabit)
// Grok'un dinamik header'ına dokunmaz, React reconciliation tarafından silinmez
function butonuEnjekteEt() {
    if (butonEnjekteEdildi && document.querySelector('#grok-printer-buton')) return; // zaten ekli ve görünürse çık

    // Eski butonu sil (eklenti yeniden yüklenince ölü handler kalır)
    const eskiButon = document.querySelector('#grok-printer-buton'); // eski buton
    if (eskiButon) eskiButon.remove(); // sil ve yenisini oluştur

    // Yazdır butonu (floating, fixed positioned)
    const yazdirButonu = document.createElement('button'); // buton elementi
    yazdirButonu.id = 'grok-printer-buton'; // benzersiz id
    yazdirButonu.title = 'Konuşmayı Yazdır (AI Chat Printer)'; // tooltip
    yazdirButonu.setAttribute('aria-label', 'Konuşmayı Yazdır'); // erişilebilirlik
    yazdirButonu.style.cssText = [ // floating button stili — sağ üst köşede sabit
        'position:fixed', // viewport'a kilitli
        'top:14px', // header seviyesinde
        'right:240px', // Paylaş butonunun yaklaşık solu (Grok layout'una göre)
        'width:36px',
        'height:36px',
        'border-radius:9999px',
        'border:1px solid rgba(0,0,0,0.08)', // hafif kenarlık (görünürlük için)
        'background:#ffffff', // beyaz arka plan (header görünür kalır)
        'cursor:pointer',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'transition:all 0.2s',
        'padding:0',
        'z-index:9999', // tüm Grok elementlerinin üstünde
        'box-shadow:0 1px 3px rgba(0,0,0,0.08)' // hafif gölge
    ].join(';'); // stil özellikleri

    // Yazıcı SVG ikonu
    const svgNS = 'http://www.w3.org/2000/svg'; // SVG namespace
    const svg = document.createElementNS(svgNS, 'svg'); // SVG oluştur
    svg.setAttribute('width', '18'); // genişlik
    svg.setAttribute('height', '18'); // yükseklik
    svg.setAttribute('viewBox', '0 0 24 24'); // görünüm alanı
    svg.setAttribute('fill', 'none'); // dolgu yok
    svg.setAttribute('stroke', 'currentColor'); // çizgi rengi mevcut renk
    svg.setAttribute('stroke-width', '2'); // çizgi kalınlığı
    svg.setAttribute('stroke-linecap', 'round'); // çizgi ucu yuvarlak
    svg.setAttribute('stroke-linejoin', 'round'); // çizgi birleşimi yuvarlak
    svg.style.color = '#525252'; // Grok'un nötr gri tonu (kontrast için biraz koyu)

    // Yazıcı yolları
    const yol1 = document.createElementNS(svgNS, 'path'); // üst kağıt
    yol1.setAttribute('d', 'M6 9V2h12v7'); // kağıt giriş yolu
    const yol2 = document.createElementNS(svgNS, 'path'); // yazıcı gövde
    yol2.setAttribute('d', 'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2'); // gövde yolu
    const yol3 = document.createElementNS(svgNS, 'rect'); // çıkan kağıt
    yol3.setAttribute('x', '6'); // sol konum
    yol3.setAttribute('y', '14'); // üst konum
    yol3.setAttribute('width', '12'); // genişlik
    yol3.setAttribute('height', '8'); // yükseklik

    svg.appendChild(yol1); // yolları SVG'ye ekle
    svg.appendChild(yol2);
    svg.appendChild(yol3);
    yazdirButonu.appendChild(svg); // SVG'yi butona ekle

    // Hover efekti (Grok siyah-beyaz teması)
    yazdirButonu.addEventListener('mouseenter', () => { // fare girince
        yazdirButonu.style.background = '#f5f5f5'; // açık gri arka plan
        yazdirButonu.style.borderColor = 'rgba(0,0,0,0.15)'; // belirgin kenarlık
        svg.style.color = '#000000'; // Grok siyah
    });
    yazdirButonu.addEventListener('mouseleave', () => { // fare çıkınca
        yazdirButonu.style.background = '#ffffff'; // beyaz geri
        yazdirButonu.style.borderColor = 'rgba(0,0,0,0.08)'; // hafif kenarlık
        svg.style.color = '#525252'; // gri renk geri dön
    });

    // Tıklama olayı
    yazdirButonu.addEventListener('click', yazdirmaBaslat); // yazdırma işlemini başlat

    // Body'e ekle (header'a değil) — React reconciliation'a dayanıklı
    document.body.appendChild(yazdirButonu); // body level floating buton

    butonEnjekteEdildi = true; // enjekte edildi olarak işaretle
}

// Yazdırma işlemini başlatır
async function yazdirmaBaslat() {
    // Streaming kontrol — Grok yanıt yazıyorsa uyar
    if (streamingMiKontrol('grok')) { // streaming aktifse
        uyariBalonuGoster('Grok henüz yanıt yazıyor. Tamamlanmasını bekleyin.', 'hata'); // uyarı
        return;
    }

    uyariBalonuGoster('Konuşma çıkarılıyor, resimler işleniyor...', 'basari'); // işlem başladı bildirimi
    resimIslemOturumuBaslat(RESIM_TOPLAM_SURE_LIMIT); // resim oturumu

    try { // oturum garanti kapatma
        const veri = await konusmayiCikar(); // konuşma verisini çıkar (async — resim dönüşümü için)
        await yazdirmayaBasla(veri, uyariBalonuGoster); // ortak başlatma akışı
    } finally { // oturum kapat
        resimIslemOturumuBitir();
    }
}

// Sayfa içi uyarı balonu gösterir (toast notification)
function uyariBalonuGoster(mesaj, tip) {
    // Önceki balonu kaldır
    const eskiBalon = document.querySelector('#grok-printer-uyari'); // eski uyarı
    if (eskiBalon) eskiBalon.remove(); // varsa sil

    const balon = document.createElement('div'); // balon oluştur
    balon.id = 'grok-printer-uyari'; // benzersiz id
    const arkaRenk = tip === 'hata' ? '#dc2626' : '#1f2937'; // hata: kırmızı, başarı: koyu gri (Grok teması)
    balon.style.cssText = [ // balon stili
        'position:fixed',
        'bottom:24px',
        'right:24px',
        'background:' + arkaRenk,
        'color:#ffffff',
        'padding:12px 20px',
        'border-radius:8px',
        'font-size:14px',
        'font-family:system-ui,-apple-system,sans-serif',
        'z-index:99999',
        'box-shadow:0 4px 12px rgba(0,0,0,0.2)',
        'max-width:360px',
        'animation:grokPrinterFadeIn 0.3s ease'
    ].join(';');
    balon.textContent = mesaj; // mesaj metni

    // Animasyon CSS ekle (bir kez)
    if (!document.querySelector('#grok-printer-stil')) { // stil yoksa
        const stil = document.createElement('style'); // style elementi
        stil.id = 'grok-printer-stil'; // benzersiz id
        stil.textContent = '@keyframes grokPrinterFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}'; // fade-in animasyonu
        document.head.appendChild(stil); // head'e ekle
    }

    document.body.appendChild(balon); // balonu sayfaya ekle
    setTimeout(() => { // 3 saniye sonra
        balon.style.opacity = '0'; // saydam yap
        balon.style.transition = 'opacity 0.3s'; // geçiş animasyonu
        setTimeout(() => balon.remove(), 300); // animasyon bitince sil
    }, 3000);
}

// Bir DOM elementinin Grok mesaj container'ı olup olmadığını ve rolünü tespit eder
// Birden çok stratejiyle: data attribute, aria-label, class regex
function grokMesajRolu(el) {
    if (!el || !el.getAttribute) return null; // null kontrol

    // 1. data-message-author-role / data-role / data-author / data-sender attribute
    const dataRol = el.getAttribute('data-message-author-role') || // OpenAI tarzı
        el.getAttribute('data-role') || // Grok varyantı
        el.getAttribute('data-author') || // alternatif
        el.getAttribute('data-sender') || // başka bir varyant
        el.getAttribute('data-message-role'); // başka bir varyant
    if (dataRol) { // varsa
        const norm = dataRol.toLowerCase(); // normalize
        if (norm === 'user' || norm === 'human') return 'user'; // kullanıcı
        if (norm === 'assistant' || norm === 'grok' || norm === 'ai' || norm === 'bot' || norm === 'model') return 'assistant'; // Grok
    }

    // 2. aria-label içinde "user" / "you" / "grok" / "assistant"
    // Türkçe karakter Unicode word boundary'de tutmaz — `\b` yerine substring eşleşme kullanılır
    const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase(); // aria-label
    if (ariaLabel) { // varsa
        if (/(^|[^a-z])(user|you|sen|kullanıcı|kullanici)([^a-z]|$)/i.test(ariaLabel)) return 'user'; // kullanıcı (ASCII boundary)
        if (/(^|[^a-z])(grok|assistant|ai|bot)([^a-z]|$)/i.test(ariaLabel)) return 'assistant'; // Grok (ASCII boundary)
    }

    // 3. Class içinde "user" / "human" / "assistant" / "grok" / "query" / "response"
    const className = (typeof el.className === 'string' ? el.className : el.getAttribute('class') || '').toLowerCase(); // class adı
    if (/\b(user-message|human-message|user-bubble|user-turn|user-block|message-user|user-input|user-query|message-from-user)\b/.test(className)) return 'user'; // kullanıcı varyantları
    if (/\b(assistant-message|grok-message|ai-message|bot-message|message-assistant|message-grok|model-response|ai-response|grok-response|message-from-assistant|message-from-grok|response-bubble|response-content)\b/.test(className)) return 'assistant'; // assistant varyantları
    // Grok'a özel: query-bubble (kullanıcı), response-bubble (Grok)
    if (/\bquery-bubble\b/.test(className) || /\bquery-content\b/.test(className) || /\bquery-text\b/.test(className)) return 'user'; // Grok kullanıcı
    if (/\bresponse-bubble\b/.test(className) || /\bresponse-content\b/.test(className) || /\bresponse-text\b/.test(className)) return 'assistant'; // Grok yanıt

    return null; // bilinmiyor
}

// Bir element'in en uzun metin içeriğini barındıran descendant'ını bulur (agresif içerik çıkarma)
function enZenginIcerikDescendant(el) {
    // Markdown / prose adayları (öncelikli)
    const oncelikliAday = el.querySelector('.markdown, .prose, .markdown-content, [class*="prose"], [class*="markdown"], [class*="message-text"], [class*="response-text"], [class*="query-text"]'); // öncelikli class'lar
    if (oncelikliAday && (oncelikliAday.textContent || '').trim().length > 5) return oncelikliAday; // öncelikli aday

    // Eğer öncelikli yoksa, en uzun metin barındıran descendant'ı bul
    const tumDescendantlar = Array.from(el.querySelectorAll('div, p, article, section, span')); // tüm bloklar
    const adaylar = tumDescendantlar
        .filter((c) => (c.textContent || '').trim().length > 5) // anlamlı içerik
        .sort((a, b) => (b.textContent || '').length - (a.textContent || '').length); // en uzun başta

    if (adaylar[0] && (adaylar[0].textContent || '').length > (el.textContent || '').length * 0.5) { // descendant elementten anlamlı oranda metin barındırıyor
        return adaylar[0]; // en zengin descendant
    }
    return el; // fallback: kendisi
}

// Grok sayfasından konuşma verilerini çıkarır (async — resim base64 dönüşümü için)
async function konusmayiCikar() {
    const mesajlar = []; // tüm mesajları tutacak dizi
    const debug = { stratejiler: {}, kullanilan: null }; // debug bilgisi (DevTools'a yazılır)

    // STRATEJİ 1: Konuşma scroll alanının doğrudan child'ları (Grok'ta en yaygın)
    function konusmaScrollAlaniBul() {
        // Çoklu aday selektörler — class isimleri Tailwind tabanlı
        const adayQueryler = [
            'main [class*="overflow-y"]', // overflow scroll alanı
            'main [class*="overflow"]', // generic overflow
            '[class*="conversation"]', // conversation class
            '[class*="messages"]', // messages container
            '[class*="chat-history"]', // chat history
            '[role="log"]', // semantic log role
            'main > div > div' // main'in derin child'ı
        ];
        for (const sec of adayQueryler) { // her selektörü dene
            const adaylar = Array.from(document.querySelectorAll(sec)); // adaylar
            const uygun = adaylar.find((a) => a.children.length >= 2 && (a.textContent || '').trim().length > 50); // en uygun
            if (uygun) return uygun; // ilk uygun olanı döndür
        }
        return null; // hiçbir scroll alanı bulunamadı
    }

    let mesajContainerlari = []; // bulunan mesaj container'ları

    // Strateji 1: scroll alanı child'ları
    const scrollAlani = konusmaScrollAlaniBul(); // scroll alanı bul
    if (scrollAlani) { // bulunduysa
        const child1 = Array.from(scrollAlani.children).filter((c) => // doğrudan child'ları filtrele
            (c.textContent || '').trim().length > 0 && // içerik var
            (c.tagName === 'DIV' || c.tagName === 'ARTICLE' || c.tagName === 'SECTION') // blok element
        );
        if (child1.length >= 2) { // en az 2 child varsa
            mesajContainerlari = child1; // bu strateji kullanılır
            debug.kullanilan = '1-scrollAlaniDoğrudanChild'; // debug
        } else {
            // Bir level daha derin git (scrollAlani > div > [mesajlar])
            const child2 = Array.from(scrollAlani.querySelectorAll(':scope > * > *')).filter((c) => // 2. seviye descendant
                (c.textContent || '').trim().length > 5 && // anlamlı içerik
                (c.tagName === 'DIV' || c.tagName === 'ARTICLE' || c.tagName === 'SECTION') // blok element
            );
            if (child2.length >= 2) { // en az 2 element varsa
                mesajContainerlari = child2; // bu strateji
                debug.kullanilan = '1b-scrollAlaniNestedChild'; // debug
            }
        }
        debug.stratejiler.scrollAlani = { childCount: child1.length, cls: (scrollAlani.className || '').toString().slice(0, 80) }; // debug
    }

    // STRATEJİ 2: data-attribute tabanlı arama
    if (mesajContainerlari.length < 2) { // strateji 1 başarısızsa
        mesajContainerlari = Array.from(document.querySelectorAll(
            '[data-message-author-role], [data-author], [data-role="user"], [data-role="assistant"], [data-sender], [data-message-role], [data-testid*="message"]'
        )); // data attribute aramaları
        if (mesajContainerlari.length >= 2) debug.kullanilan = '2-dataAttribute'; // debug
        debug.stratejiler.dataAttr = mesajContainerlari.length; // debug
    }

    // STRATEJİ 3: aria-label tabanlı
    if (mesajContainerlari.length < 2) { // strateji 2 başarısızsa
        mesajContainerlari = Array.from(document.querySelectorAll(
            '[aria-label*="message" i], [aria-label*="user" i], [aria-label*="grok" i], [aria-label*="assistant" i]'
        )); // aria-label
        if (mesajContainerlari.length >= 2) debug.kullanilan = '3-ariaLabel'; // debug
        debug.stratejiler.ariaLabel = mesajContainerlari.length; // debug
    }

    // STRATEJİ 4: article veya role="article"
    if (mesajContainerlari.length < 2) { // strateji 3 başarısızsa
        mesajContainerlari = Array.from(document.querySelectorAll('article, [role="article"]')); // semantic article
        if (mesajContainerlari.length >= 2) debug.kullanilan = '4-articleTag'; // debug
        debug.stratejiler.article = mesajContainerlari.length; // debug
    }

    // STRATEJİ 5: class regex (geniş havuz)
    if (mesajContainerlari.length < 2) { // strateji 4 başarısızsa
        const tumElementler = Array.from(document.querySelectorAll('div, section, article')); // tüm bloklar
        mesajContainerlari = tumElementler.filter((el) => { // class regex filtresi
            const cls = (typeof el.className === 'string' ? el.className : '').toLowerCase(); // class
            return /\b(message-bubble|message-content|chat-message|user-message|assistant-message|message-user|message-grok|message-assistant|query-bubble|response-bubble|prose-message|chat-turn|conversation-turn|query-content|response-content|message-from-user|message-from-grok|message-from-assistant)\b/.test(cls); // mesaj class'ları
        });
        if (mesajContainerlari.length >= 2) debug.kullanilan = '5-classRegex'; // debug
        debug.stratejiler.classRegex = mesajContainerlari.length; // debug
    }

    // Debug bilgisini DevTools console'a yaz (kullanıcı sorun bildirirse buraya bakar)
    console.log('AI Chat Printer [Grok DEBUG]:', debug); // detaylı debug
    console.log('AI Chat Printer [Grok DEBUG]: Bulunan container sayısı:', mesajContainerlari.length); // sayı

    if (mesajContainerlari.length === 0) { // hiç mesaj container'ı bulunamadı
        return { hata: 'Grok konuşma yapısı tanınamadı. F12 → Console\'da [Grok DEBUG] log\'larını inceleyip eklenti geliştiricisine iletin.', mesajlar: [] };
    }

    // Debug: ilk 2 container'ın yapısını yazdır
    if (mesajContainerlari[0]) { // ilk varsa
        console.log('AI Chat Printer [Grok DEBUG]: 1. container:', { // debug
            tag: mesajContainerlari[0].tagName, // tag
            cls: (mesajContainerlari[0].className || '').toString().slice(0, 120), // class
            txt: (mesajContainerlari[0].textContent || '').trim().slice(0, 80) // metin önizleme
        });
    }
    if (mesajContainerlari[1]) { // ikinci varsa
        console.log('AI Chat Printer [Grok DEBUG]: 2. container:', { // debug
            tag: mesajContainerlari[1].tagName, // tag
            cls: (mesajContainerlari[1].className || '').toString().slice(0, 120), // class
            txt: (mesajContainerlari[1].textContent || '').trim().slice(0, 80) // metin önizleme
        });
    }

    // Mesajları sırasıyla işle — alternating fallback ile rol tespiti
    let oncekiRol = 'assistant'; // ilk mesaj genelde kullanıcıdır, alternating için ters başla
    let basariliMesaj = 0; // başarılı çıkarılan mesaj sayacı

    for (const el of mesajContainerlari) { // her aday element
        // Rol tespit et (kendisi → parent → alternating fallback)
        let rol = grokMesajRolu(el); // kendi attribute'lerinden
        if (!rol && el.parentElement) rol = grokMesajRolu(el.parentElement); // parent'tan
        // Element'in 2 seviye yukarısını da kontrol et
        if (!rol && el.parentElement?.parentElement) rol = grokMesajRolu(el.parentElement.parentElement); // 2 seviye yukarı
        // Alternating fallback
        if (!rol) rol = oncekiRol === 'user' ? 'assistant' : 'user'; // sırayla değiştir
        oncekiRol = rol; // sonraki için kaydet

        // İçerik çıkarma — agresif descendant tarama
        const kaynakEl = enZenginIcerikDescendant(el); // en zengin içerikli element
        const htmlIcerik = await resimliHtmlCikar(kaynakEl); // resimleri base64'e çevirip HTML çıkar
        const ekstraResimler = await turnResimleriniTopla(el, kaynakEl); // kaynak dışındaki resimler
        const metinIcerik = (kaynakEl.textContent || '').trim(); // düz metin

        if (!htmlIcerik && !metinIcerik && ekstraResimler.length === 0) { // tamamen boşsa atla
            console.log('AI Chat Printer [Grok DEBUG]: Boş container atlandı:', (el.className || '').toString().slice(0, 60)); // debug
            continue;
        }

        mesajlar.push({
            rol: rol === 'user' ? 'kullanici' : 'grok', // proje formatı (kullanici / grok)
            html: htmlIcerik, // base64 resimli HTML içerik
            metin: metinIcerik, // düz metin
            resimler: ekstraResimler // ekstra resimler
        });
        basariliMesaj++; // sayacı artır
    }

    console.log('AI Chat Printer [Grok DEBUG]: Çıkarılan mesaj sayısı:', basariliMesaj); // sonuç

    if (mesajlar.length === 0) { // hiçbir mesaj çıkarılamadıysa
        return { hata: 'Grok konuşma içeriği çıkarılamadı. F12 → Console\'da [Grok DEBUG] log\'larını inceleyip eklenti geliştiricisine iletin.', mesajlar: [] };
    }

    // Konuşma başlığını al — sidebar aktif link veya document.title
    const aktifSidebar = document.querySelector('nav a[aria-current="page"], aside a[aria-current="page"], a[aria-current="true"], [class*="sidebar"] a[class*="active"], [class*="sidebar"] a[class*="selected"]'); // aktif sohbet
    const sidebarBaslik = aktifSidebar ? basligiTemizle(aktifSidebar.textContent?.trim() || '', 'grok') : ''; // sidebar başlığı
    const docBaslik = basligiTemizle(document.title || '', 'grok'); // doc başlığı
    const sayfaBasligi = sidebarBaslik || docBaslik || 'Grok Konuşması'; // ilk dolu olanı kullan

    return {
        baslik: sayfaBasligi, // konuşma başlığı
        tarih: new Date().toLocaleDateString('tr-TR'), // bugünün tarihi
        saat: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), // şu anki saat
        mesajSayisi: mesajlar.length, // toplam mesaj sayısı
        mesajlar: mesajlar, // mesaj dizisi
        kaynak: 'grok' // hangi siteden geldiği
    };
}

// Popup'tan ve background'tan gelen mesajları dinle
chrome.runtime.onMessage.addListener((mesaj, gonderen, yanitGonder) => { // mesaj dinleyici
    if (mesaj.islem === 'konusmayiCikar') { // konuşma çıkarma isteği
        (async () => { // async IIFE
            if (streamingMiKontrol('grok')) { // streaming aktifse
                yanitGonder({ hata: 'Grok henüz yanıt yazıyor. Tamamlanmasını bekleyin.', mesajlar: [] }); // uyarı
                return;
            }
            resimIslemOturumuBaslat(RESIM_TOPLAM_SURE_LIMIT); // resim oturumu
            try { // oturum garanti kapatma
                const veri = await konusmayiCikar(); // konuşma verisi
                yanitGonder(veri); // popup'a gönder
            } finally { // oturum kapat
                resimIslemOturumuBitir();
            }
        })();
    } else if (mesaj.islem === 'klavyeKisayoluYazdir') { // keyboard shortcut tetiklemesi
        yazdirmaBaslat(); // sayfa içi yazdırma akışı
    }
    return true; // asenkron yanıt için true döndür
});

// Sayfa hazır olduğunda başlat
if (document.readyState === 'loading') { // sayfa yükleniyorsa
    document.addEventListener('DOMContentLoaded', baslat); // yüklendikten sonra başlat
} else { // sayfa zaten yüklendiyse
    baslat(); // hemen başlat
}
