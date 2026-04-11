// Gemini Printer - Content Script
// Gemini sayfasına yazdır butonu enjekte eder ve konuşma içeriğini çıkarır

// Buton zaten enjekte edildi mi kontrolü
let butonEnjekteEdildi = false; // tekrar enjekte etmeyi önle

// Sayfa yüklendiğinde ve navigasyon değişikliklerinde butonu enjekte et
function baslat() {
    butonuEnjekteEt(); // ilk deneme
    // Gemini SPA olduğu için URL değişikliklerini izle
    const gozlemci = new MutationObserver(() => { // DOM değişikliklerini izle
        if (!document.querySelector('#gemini-printer-buton')) { // buton kaybolmuşsa
            butonEnjekteEdildi = false; // tekrar enjekte edilebilir
            butonuEnjekteEt(); // butonu yeniden ekle
        }
    });
    gozlemci.observe(document.body, { childList: true, subtree: true }); // body'deki değişiklikleri izle
}

// Yazdır butonunu Gemini toolbar'ına enjekte eder
function butonuEnjekteEt() {
    if (butonEnjekteEdildi) return; // zaten enjekte edildiyse çık

    // Sağ üst aksiyon alanını bul
    const sagBolum = document.querySelector('.top-bar-actions .right-section'); // sağ butonlar alanı
    if (!sagBolum) { // alan henüz yüklenmediyse
        setTimeout(butonuEnjekteEt, 1000); // 1 saniye sonra tekrar dene
        return;
    }

    // Eski butonu sil (eklenti yeniden yüklenince ölü handler kalır)
    const eskiButon = document.querySelector('#gemini-printer-buton'); // eski buton
    if (eskiButon) eskiButon.closest('.buttons-container')?.remove() || eskiButon.remove(); // container ile birlikte sil

    // Buton container oluştur (Gemini'nin buton stiline uyumlu)
    const butonContainer = document.createElement('div'); // container div
    butonContainer.className = 'buttons-container'; // Gemini ile aynı sınıf
    butonContainer.style.cssText = 'display:flex;align-items:center;padding:0 4px;'; // flex düzen

    // Yazdır butonu
    const yazdirButonu = document.createElement('button'); // buton elementi
    yazdirButonu.id = 'gemini-printer-buton'; // benzersiz id
    yazdirButonu.title = 'Konuşmayı Yazdır (Gemini Printer)'; // tooltip
    yazdirButonu.setAttribute('aria-label', 'Konuşmayı Yazdır'); // erişilebilirlik
    yazdirButonu.style.cssText = [ // Gemini buton stiline uyumlu
        'width:40px',
        'height:40px',
        'border-radius:9999px',
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

    // Yazıcı SVG ikonu (Gemini'nin ikon boyutuna uygun 24px)
    const svgNS = 'http://www.w3.org/2000/svg'; // SVG namespace
    const svg = document.createElementNS(svgNS, 'svg'); // SVG oluştur
    svg.setAttribute('width', '20'); // genişlik
    svg.setAttribute('height', '20'); // yükseklik
    svg.setAttribute('viewBox', '0 0 24 24'); // görünüm alanı
    svg.setAttribute('fill', 'none'); // dolgu yok
    svg.setAttribute('stroke', 'currentColor'); // çizgi rengi mevcut renk
    svg.setAttribute('stroke-width', '2'); // çizgi kalınlığı
    svg.setAttribute('stroke-linecap', 'round'); // çizgi ucu yuvarlak
    svg.setAttribute('stroke-linejoin', 'round'); // çizgi birleşimi yuvarlak
    svg.style.color = '#5f6368'; // Gemini'nin ikon rengi (koyu gri)

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
        svg.style.color = '#1a73e8'; // mavi renk
    });
    yazdirButonu.addEventListener('mouseleave', () => { // fare çıkınca
        yazdirButonu.style.background = 'transparent'; // şeffaf geri dön
        svg.style.color = '#5f6368'; // gri renk geri dön
    });

    // Tıklama olayı
    yazdirButonu.addEventListener('click', yazdirmaBaslat); // yazdırma işlemini başlat

    butonContainer.appendChild(yazdirButonu); // butonu container'a ekle

    // İlk buttons-container'dan önce ekle (NotebookLM'den sonra, paylaş'tan önce)
    const mevcutContainerlar = sagBolum.querySelectorAll('.buttons-container'); // mevcut container'lar
    if (mevcutContainerlar.length >= 2) { // paylaş ve menü container'ları varsa
        sagBolum.insertBefore(butonContainer, mevcutContainerlar[1]); // paylaş'tan önce ekle
    } else { // yoksa sona ekle
        sagBolum.appendChild(butonContainer);
    }

    butonEnjekteEdildi = true; // enjekte edildi olarak işaretle
}

// Yazdırma işlemini başlatır
async function yazdirmaBaslat() {
    uyariBalonuGoster('Konuşma çıkarılıyor, resimler işleniyor...', 'basari'); // işlem başladı bildirimi

    const veri = await konusmayiCikar(); // konuşma verisini çıkar (async — resim dönüşümü için)

    if (veri.hata) { // hata varsa
        uyariBalonuGoster('Hata: ' + veri.hata, 'hata'); // hata mesajı göster
        return;
    }

    if (!veri.mesajlar || veri.mesajlar.length === 0) { // mesaj yoksa
        uyariBalonuGoster('Konuşmada mesaj bulunamadı.', 'hata'); // uyarı göster
        return;
    }

    // Varsayılan ayarlar
    const ayarlar = { // yazdırma ayarları
        kodBloklari: true, // kod blokları dahil
        otomatikYazdir: true, // otomatik yazdır
        yaziBoyutu: '13' // normal yazı boyutu
    };

    // Veriyi chrome.storage.local'a kaydet (try-catch — eklenti yeniden yüklenince context kaybolabilir)
    try {
        await chrome.storage.local.set({ // geçici veri kaydet
            konusmaVerisi: veri, // konuşma içeriği
            yazdirAyarlari: ayarlar // yazdırma ayarları
        });
    } catch (storageHata) { // extension context kaybolmuşsa
        uyariBalonuGoster('Eklenti bağlantısı koptu. Sayfayı yenileyip (F5) tekrar deneyin.', 'hata'); // hata mesajı
        console.error('Gemini Printer: chrome.storage erişim hatası:', storageHata.message); // debug
        return;
    }

    // Toplam resim sayısını hesapla (debug bilgi)
    let toplamResim = 0; // resim sayacı
    veri.mesajlar.forEach(m => { // her mesajdaki resimleri say
        toplamResim += (m.html && m.html.match(/<img /gi) || []).length; // HTML içindeki img'ler
        toplamResim += (m.resimler ? m.resimler.length : 0); // ekstra resimler
    });
    console.log('Gemini Printer [DEBUG]: Toplam mesaj:', veri.mesajSayisi, ', Toplam resim:', toplamResim); // debug

    uyariBalonuGoster(veri.mesajSayisi + ' mesaj, ' + toplamResim + ' resim çıkarıldı. Yazdırma sayfası açılıyor...', 'basari'); // başarı mesajı

    // Yazdırma sayfasını aç
    chrome.runtime.sendMessage({ islem: 'yazdirmaSayfasiAc' }); // background'a mesaj gönder
}

// Sayfa içi uyarı balonu gösterir (toast notification)
function uyariBalonuGoster(mesaj, tip) {
    // Önceki balonu kaldır
    const eskiBalon = document.querySelector('#gemini-printer-uyari'); // eski uyarı
    if (eskiBalon) eskiBalon.remove(); // varsa sil

    const balon = document.createElement('div'); // balon oluştur
    balon.id = 'gemini-printer-uyari'; // benzersiz id
    const arkaRenk = tip === 'hata' ? '#d93025' : '#1a73e8'; // hata: kırmızı, başarı: mavi
    balon.style.cssText = [ // balon stili
        'position:fixed',
        'bottom:24px',
        'right:24px',
        'background:' + arkaRenk,
        'color:#ffffff',
        'padding:12px 20px',
        'border-radius:8px',
        'font-size:14px',
        'font-family:Google Sans,Roboto,sans-serif',
        'z-index:99999',
        'box-shadow:0 4px 12px rgba(0,0,0,0.2)',
        'max-width:360px',
        'animation:geminiPrinterFadeIn 0.3s ease'
    ].join(';');
    balon.textContent = mesaj; // mesaj metni

    // Animasyon CSS ekle (bir kez)
    if (!document.querySelector('#gemini-printer-stil')) { // stil yoksa
        const stil = document.createElement('style'); // style elementi
        stil.id = 'gemini-printer-stil'; // benzersiz id
        stil.textContent = '@keyframes geminiPrinterFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}'; // fade-in animasyonu
        document.head.appendChild(stil); // head'e ekle
    }

    document.body.appendChild(balon); // balonu sayfaya ekle
    setTimeout(() => { // 3 saniye sonra
        balon.style.opacity = '0'; // saydam yap
        balon.style.transition = 'opacity 0.3s'; // geçiş animasyonu
        setTimeout(() => balon.remove(), 300); // animasyon bitince sil
    }, 3000);
}

// Resim yardımcıları (resmiBase64Yap, resimliHtmlCikar, turnResimleriniTopla)
// resim-yardimcilari.js dosyasında tanımlıdır ve manifest.json içinde önce yüklenir

// Gemini sayfasından konuşma verilerini çıkarır (async — resim base64 dönüşümü için)
async function konusmayiCikar() {
    const mesajlar = []; // tüm mesajları tutacak dizi

    // Ana konuşma container'ını bul
    const kaydirmaAlani = document.querySelector('.chat-history-scroll-container'); // mesajların bulunduğu alan
    if (!kaydirmaAlani) { // konuşma alanı bulunamadıysa
        return { hata: 'Konuşma bulunamadı. Bir Gemini sohbeti açık olduğundan emin olun.', mesajlar: [] };
    }

    // Tüm user-query ve model-response elementlerini sırayla bul
    const tumTurnlar = kaydirmaAlani.querySelectorAll('user-query, model-response'); // tüm konuşma dönüşleri

    for (const turn of tumTurnlar) { // her dönüşü sırayla işle (async resim dönüşümü için)
        const etiketAdi = turn.tagName.toLowerCase(); // element adını al

        if (etiketAdi === 'user-query') { // kullanıcı mesajı
            const queryText = turn.querySelector('.query-text'); // asıl kullanıcı metni
            const balonSpan = turn.querySelector('.user-query-bubble-with-background'); // kullanıcı balonu
            const queryContent = turn.querySelector('.query-content'); // sorgu içeriği
            const kaynakElement = queryText || balonSpan || queryContent; // en uygun elementi seç

            let htmlIcerik = ''; // mesaj HTML'i
            let metinIcerik = ''; // mesaj düz metni

            if (kaynakElement) { // element bulunduysa
                htmlIcerik = await resimliHtmlCikar(kaynakElement); // resimleri base64'e çevirip HTML çıkar
                metinIcerik = geminiPrefixTemizle(kaynakElement.textContent?.trim() || ''); // prefix temizle
            }

            // Turn genelinde kaynak element dışında kalan resimleri topla
            const ekstraResimler = await turnResimleriniTopla(turn, kaynakElement); // ekstra resimler

            if (htmlIcerik || metinIcerik || ekstraResimler.length > 0) { // içerik varsa
                mesajlar.push({
                    rol: 'kullanici', // mesaj rolü
                    html: htmlIcerik, // base64 resimli HTML içerik
                    metin: metinIcerik, // temizlenmiş düz metin
                    resimler: ekstraResimler // kaynak element dışındaki resimler
                });
            }
        } else if (etiketAdi === 'model-response') { // yapay zeka yanıtı
            const markdownDiv = turn.querySelector('.markdown'); // markdown içerik
            const responseContent = turn.querySelector('.response-content'); // yanıt içeriği
            const messageContent = turn.querySelector('message-content'); // mesaj içeriği
            const kaynakElement = markdownDiv || responseContent || messageContent; // en uygun elementi seç

            let htmlIcerik = ''; // yanıt HTML'i

            if (kaynakElement) { // element bulunduysa
                htmlIcerik = await resimliHtmlCikar(kaynakElement); // resimleri base64'e çevirip HTML çıkar
            }

            // Turn genelinde kaynak element dışında kalan resimleri topla
            const ekstraResimler = await turnResimleriniTopla(turn, kaynakElement); // ekstra resimler

            if (htmlIcerik || ekstraResimler.length > 0) { // içerik varsa
                mesajlar.push({
                    rol: 'gemini', // mesaj rolü
                    html: htmlIcerik, // base64 resimli HTML içerik
                    metin: kaynakElement ? kaynakElement.textContent?.trim() : '', // düz metin
                    resimler: ekstraResimler // kaynak element dışındaki resimler
                });
            }
        }
    }

    // Konuşma başlığını sidebar'daki aktif linkten al
    const aktifLink = document.querySelector('conversations-list a.selected, conversations-list a[aria-current="page"], conversations-list a.active'); // sidebar aktif konuşma
    const sidebarBaslik = aktifLink ? aktifLink.textContent?.trim().replace(/Sabitlenmiş sohbet$/, '').trim() : ''; // suffix temizle
    const sayfaBasligi = sidebarBaslik || document.title?.replace(' - Google Gemini', '').replace('Google Gemini', '').trim() || 'Gemini Konuşması';

    return {
        baslik: sayfaBasligi, // konuşma başlığı
        tarih: new Date().toLocaleDateString('tr-TR'), // bugünün tarihi
        saat: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), // şu anki saat
        mesajSayisi: mesajlar.length, // toplam mesaj sayısı
        mesajlar: mesajlar, // mesaj dizisi
        kaynak: 'gemini' // hangi siteden geldiği
    };
}

// Gemini'nin kullanıcı mesajlarına eklediği erişilebilirlik prefix'lerini temizler
function geminiPrefixTemizle(metin) {
    if (!metin) return ''; // boş metin kontrolü
    const prefixler = ['Siz şunu dediniz: ', 'Siz şunu söylediniz: ', 'You said: ']; // bilinen prefix'ler
    for (const prefix of prefixler) { // her prefix'i kontrol et
        if (metin.startsWith(prefix)) return metin.substring(prefix.length).trim(); // prefix'i kaldır
    }
    return metin; // prefix yoksa aynen döndür
}

// Popup'tan gelen mesajları da dinle (fallback)
chrome.runtime.onMessage.addListener((mesaj, gonderen, yanitGonder) => { // mesaj dinleyici
    if (mesaj.islem === 'konusmayiCikar') { // konuşma çıkarma isteği
        konusmayiCikar().then(veri => yanitGonder(veri)); // async çıkar ve gönder
    }
    return true; // asenkron yanıt için true döndür
});

// Sayfa hazır olduğunda başlat
if (document.readyState === 'loading') { // sayfa yükleniyorsa
    document.addEventListener('DOMContentLoaded', baslat); // yüklendikten sonra başlat
} else { // sayfa zaten yüklendiyse
    baslat(); // hemen başlat
}
