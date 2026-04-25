// AI Chat Printer - ChatGPT Content Script
// ChatGPT sayfasına yazdır butonu enjekte eder ve konuşma içeriğini çıkarır

// Buton zaten enjekte edildi mi kontrolü
let butonEnjekteEdildi = false; // tekrar enjekte etmeyi önle

// Sayfa yüklendiğinde ve navigasyon değişikliklerinde butonu enjekte et
function baslat() {
    butonuEnjekteEt(); // ilk deneme
    // ChatGPT SPA olduğu için URL ve DOM değişikliklerini izle — debounce ile CPU yükü düşür
    const butonuKontrolEt = debounce(() => { // 200ms debounce'lu kontrol
        if (!document.querySelector('#chatgpt-printer-buton')) { // buton kaybolmuşsa
            butonEnjekteEdildi = false; // tekrar enjekte edilebilir
            butonuEnjekteEt(); // butonu yeniden ekle
        }
    }, 200);
    const gozlemci = new MutationObserver(butonuKontrolEt); // debounce'lu observer
    gozlemci.observe(document.body, { childList: true, subtree: true }); // body'deki değişiklikleri izle
    // Sayfa gizlenince observer'ı temizle (memory leak önleme)
    window.addEventListener('pagehide', () => gozlemci.disconnect(), { once: true }); // pagehide event
}

// Yazdır butonunu ChatGPT header'ına enjekte eder
function butonuEnjekteEt() {
    if (butonEnjekteEdildi) return; // zaten enjekte edildiyse çık

    // Sayfa header'ını bul
    const header = document.querySelector('header'); // üst çubuk
    if (!header) { // header henüz yüklenmediyse
        setTimeout(butonuEnjekteEt, 1000); // 1 saniye sonra tekrar dene
        return;
    }

    // Eski butonu sil (eklenti yeniden yüklenince ölü handler kalır)
    const eskiButon = document.querySelector('#chatgpt-printer-buton'); // eski buton
    if (eskiButon) eskiButon.remove(); // sil ve yenisini oluştur

    // Header'daki sağ butonlar alanını bul — önce Paylaş butonunun parent'ı, yoksa son child
    const paylasButonuErken = header.querySelector('button[aria-label="Paylaş"], button[aria-label="Share"]'); // paylaş butonu
    let sagKisim = paylasButonuErken ? paylasButonuErken.parentElement : null; // paylaş butonunun container'ı
    if (!sagKisim) sagKisim = header.children[header.children.length - 1]; // son child (sağ kısım)
    if (!sagKisim) { // alan bulunamadıysa
        setTimeout(butonuEnjekteEt, 1000); // tekrar dene
        return;
    }

    // Yazdır butonu
    const yazdirButonu = document.createElement('button'); // buton elementi
    yazdirButonu.id = 'chatgpt-printer-buton'; // benzersiz id
    yazdirButonu.title = 'Konuşmayı Yazdır (AI Chat Printer)'; // tooltip
    yazdirButonu.setAttribute('aria-label', 'Konuşmayı Yazdır'); // erişilebilirlik
    yazdirButonu.style.cssText = [ // ChatGPT buton stiline uyumlu
        'width:36px',
        'height:36px',
        'border-radius:10px',
        'border:none',
        'background:transparent',
        'cursor:pointer',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'transition:background 0.2s',
        'padding:0',
        'position:relative'
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
    svg.style.color = '#8e8ea0'; // ChatGPT'nin ikon rengi (gri)

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

    // Hover efekti
    yazdirButonu.addEventListener('mouseenter', () => { // fare girince
        yazdirButonu.style.background = 'rgba(0,0,0,0.06)'; // hafif gri arka plan
        svg.style.color = '#10a37f'; // ChatGPT yeşil rengi
    });
    yazdirButonu.addEventListener('mouseleave', () => { // fare çıkınca
        yazdirButonu.style.background = 'transparent'; // şeffaf geri dön
        svg.style.color = '#8e8ea0'; // gri renk geri dön
    });

    // Tıklama olayı
    yazdirButonu.addEventListener('click', yazdirmaBaslat); // yazdırma işlemini başlat

    // Paylaş butonunun soluna ekle (TR + EN)
    const paylasButonu = header.querySelector('button[aria-label="Paylaş"], button[aria-label="Share"]'); // Paylaş butonunu bul
    if (paylasButonu && paylasButonu.parentElement) { // bulunduysa
        paylasButonu.parentElement.insertBefore(yazdirButonu, paylasButonu); // Paylaş'tan önce ekle
    } else { // Paylaş bulunamazsa sağ kısma ekle
        sagKisim.insertBefore(yazdirButonu, sagKisim.firstChild); // en başa ekle
    }

    butonEnjekteEdildi = true; // enjekte edildi olarak işaretle
}

// Yazdırma işlemini başlatır
async function yazdirmaBaslat() {
    // Streaming kontrol — ChatGPT yanıt yazıyorsa uyar
    if (streamingMiKontrol('chatgpt')) { // streaming aktifse
        uyariBalonuGoster('ChatGPT henüz yanıt yazıyor. Tamamlanmasını bekleyin.', 'hata'); // uyarı
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
    const eskiBalon = document.querySelector('#chatgpt-printer-uyari'); // eski uyarı
    if (eskiBalon) eskiBalon.remove(); // varsa sil

    const balon = document.createElement('div'); // balon oluştur
    balon.id = 'chatgpt-printer-uyari'; // benzersiz id
    const arkaRenk = tip === 'hata' ? '#ef4444' : '#10a37f'; // hata: kırmızı, başarı: yeşil
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
        'animation:chatgptPrinterFadeIn 0.3s ease'
    ].join(';');
    balon.textContent = mesaj; // mesaj metni

    // Animasyon CSS ekle (bir kez)
    if (!document.querySelector('#chatgpt-printer-stil')) { // stil yoksa
        const stil = document.createElement('style'); // style elementi
        stil.id = 'chatgpt-printer-stil'; // benzersiz id
        stil.textContent = '@keyframes chatgptPrinterFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}'; // fade-in animasyonu
        document.head.appendChild(stil); // head'e ekle
    }

    document.body.appendChild(balon); // balonu sayfaya ekle
    setTimeout(() => { // 3 saniye sonra
        balon.style.opacity = '0'; // saydam yap
        balon.style.transition = 'opacity 0.3s'; // geçiş animasyonu
        setTimeout(() => balon.remove(), 300); // animasyon bitince sil
    }, 3000);
}

// ChatGPT sayfasından konuşma verilerini çıkarır (async — resim base64 dönüşümü için)
async function konusmayiCikar() {
    const mesajlar = []; // tüm mesajları tutacak dizi

    // Tüm conversation turn'lerini sırayla bul
    const tumTurnlar = document.querySelectorAll('[data-testid^="conversation-turn"]'); // sıralı turn'ler
    if (tumTurnlar.length === 0) { // turn bulunamadıysa
        return { hata: 'Konuşma bulunamadı. Bir ChatGPT sohbeti açık olduğundan emin olun.', mesajlar: [] };
    }

    for (const turn of tumTurnlar) { // her turn'ü sırayla işle (async resim dönüşümü için)
        // Turn içindeki mesaj rolünü belirle
        const mesajEl = turn.querySelector('[data-message-author-role]'); // mesaj elementi
        if (!mesajEl) continue; // mesaj yoksa atla

        const rol = mesajEl.getAttribute('data-message-author-role'); // user veya assistant

        if (rol === 'user') { // kullanıcı mesajı
            const balonEl = mesajEl.querySelector('.user-message-bubble-color'); // kullanıcı balonu
            const kaynakEl = balonEl || mesajEl; // balon yoksa mesaj elementinin kendisi

            const htmlIcerik = await resimliHtmlCikar(kaynakEl); // resimleri base64'e çevirip HTML çıkar
            const ekstraResimler = await turnResimleriniTopla(turn, kaynakEl); // kaynak dışındaki resimler (yüklenen dosyalar)

            mesajlar.push({
                rol: 'kullanici', // mesaj rolü
                html: htmlIcerik, // base64 resimli HTML içerik
                metin: kaynakEl.textContent?.trim() || '', // düz metin
                resimler: ekstraResimler // kullanıcı eki resimleri
            });
        } else if (rol === 'assistant') { // ChatGPT yanıtı
            const markdownEl = mesajEl.querySelector('.markdown'); // markdown içerik
            const kaynakEl = markdownEl || mesajEl; // markdown yoksa mesaj elementinin kendisi

            const htmlIcerik = await resimliHtmlCikar(kaynakEl); // resimleri base64'e çevirip HTML çıkar (DALL-E)
            const ekstraResimler = await turnResimleriniTopla(turn, kaynakEl); // kaynak dışındaki resimler

            mesajlar.push({
                rol: 'chatgpt', // mesaj rolü
                html: htmlIcerik, // base64 resimli HTML içerik
                metin: kaynakEl.textContent?.trim() || '', // düz metin
                resimler: ekstraResimler // yanıt içindeki ekstra resimler
            });
        }
    }

    // Konuşma başlığını al — önce sidebar aktif linkten, sonra document.title
    const aktifSidebar = document.querySelector('nav a[href^="/c/"][data-active="true"], nav a[href^="/c/"].bg-token-sidebar-surface-secondary, nav a[href^="/c/"][aria-current="page"]'); // aktif konuşma
    const sidebarBaslik = aktifSidebar ? basligiTemizle(aktifSidebar.textContent?.trim() || '', 'chatgpt') : ''; // sidebar başlığı
    const docBaslik = basligiTemizle(document.title || '', 'chatgpt'); // doc başlığı
    const sayfaBasligi = sidebarBaslik || docBaslik || 'ChatGPT Konuşması'; // ilk dolu olanı kullan

    return {
        baslik: sayfaBasligi, // konuşma başlığı
        tarih: new Date().toLocaleDateString('tr-TR'), // bugünün tarihi
        saat: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), // şu anki saat
        mesajSayisi: mesajlar.length, // toplam mesaj sayısı
        mesajlar: mesajlar, // mesaj dizisi
        kaynak: 'chatgpt' // hangi siteden geldiği
    };
}

// Popup'tan ve background'tan gelen mesajları dinle
chrome.runtime.onMessage.addListener((mesaj, gonderen, yanitGonder) => { // mesaj dinleyici
    if (mesaj.islem === 'konusmayiCikar') { // konuşma çıkarma isteği
        (async () => { // async IIFE
            if (streamingMiKontrol('chatgpt')) { // streaming aktifse
                yanitGonder({ hata: 'ChatGPT henüz yanıt yazıyor. Tamamlanmasını bekleyin.', mesajlar: [] }); // uyarı
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
