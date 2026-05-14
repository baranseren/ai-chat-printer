// Gemini Printer - Content Script
// Gemini sayfasına yazdır butonu enjekte eder ve konuşma içeriğini çıkarır

// Buton zaten enjekte edildi mi kontrolü
let butonEnjekteEdildi = false; // tekrar enjekte etmeyi önle

// Sayfa yüklendiğinde ve navigasyon değişikliklerinde butonu enjekte et
function baslat() {
    butonuEnjekteEt(); // ilk deneme — toolbar yazdır butonu
    indirmeButonlariniKontrolEt(); // ilk deneme — her cevabın altına MD/TXT indir butonları
    // Gemini SPA olduğu için URL değişikliklerini izle — debounce ile CPU yükü düşür
    const gozlemKontrol = debounce(() => { // 200ms debounce'lu kontrol
        if (!document.querySelector('#gemini-printer-buton')) { // toolbar buton kaybolmuşsa
            butonEnjekteEdildi = false; // tekrar enjekte edilebilir
            butonuEnjekteEt(); // butonu yeniden ekle
        }
        indirmeButonlariniKontrolEt(); // yeni model-response'lara indir butonu ekle
    }, 200);
    const gozlemci = new MutationObserver(gozlemKontrol); // debounce'lu observer
    gozlemci.observe(document.body, { childList: true, subtree: true }); // body'deki değişiklikleri izle
    // Sayfa gizlenince observer'ı temizle (memory leak önleme)
    window.addEventListener('pagehide', () => gozlemci.disconnect(), { once: true }); // pagehide event
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
    // Streaming kontrol Gemini için kaldırıldı — false positive üretiyordu (gizli stop butonu kontrolü güvenilir değil)
    // Kullanıcı yarım yanıt yazdırırsa kendi takdirinde

    uyariBalonuGoster('Konuşma çıkarılıyor, resimler işleniyor...', 'basari'); // işlem başladı bildirimi
    resimIslemOturumuBaslat(RESIM_TOPLAM_SURE_LIMIT); // resim toplam süre limiti başlat

    try { // oturum bitirme garantisi için try-finally
        const veri = await konusmayiCikar(); // konuşma verisini çıkar (async — resim dönüşümü için)

        // Toplam resim sayısını hesapla (debug bilgi)
        let toplamResim = 0; // resim sayacı
        (veri.mesajlar || []).forEach(m => { // her mesajdaki resimleri say
            toplamResim += (m.html && m.html.match(/<img /gi) || []).length; // HTML içindeki img'ler
            toplamResim += (m.resimler ? m.resimler.length : 0); // ekstra resimler
        });
        console.log('Gemini Printer [DEBUG]: Toplam mesaj:', veri.mesajSayisi, ', Toplam resim:', toplamResim); // debug

        // Ortak yazdırma başlatıcıyı kullan (ayarlar kalıcı storage'dan okur)
        await yazdirmayaBasla(veri, uyariBalonuGoster); // ortak başlatma akışı
    } finally { // işlem bitişinde oturum kapatılmalı
        resimIslemOturumuBitir(); // deadline'ı sıfırla
    }
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
    const sidebarHam = aktifLink ? aktifLink.textContent?.trim() || '' : ''; // sidebar ham başlık
    const sidebarBaslik = basligiTemizle(sidebarHam, 'gemini'); // sidebar başlığını temizle
    const docBaslik = basligiTemizle(document.title || '', 'gemini'); // doc başlığını temizle
    const sayfaBasligi = sidebarBaslik || docBaslik || 'Gemini Konuşması'; // ilk dolu olanı kullan

    return {
        baslik: sayfaBasligi, // konuşma başlığı
        tarih: new Date().toLocaleDateString('tr-TR'), // bugünün tarihi
        saat: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), // şu anki saat
        mesajSayisi: mesajlar.length, // toplam mesaj sayısı
        mesajlar: mesajlar, // mesaj dizisi
        kaynak: 'gemini' // hangi siteden geldiği
    };
}

// ═══════════════════════════════════════════════════════════════════
// CEVAP ALTI MD/TXT İNDİRME BUTONLARI — her model-response için 2 buton
// ═══════════════════════════════════════════════════════════════════

// Tüm model-response'ları tarar ve buton enjekte edilmemiş olanlara ekler
function indirmeButonlariniKontrolEt() {
    const tumYanitlar = document.querySelectorAll('model-response'); // tüm Gemini yanıtları
    for (const yanit of tumYanitlar) { // her yanıt için
        if (yanit.querySelector('.gp-indir-btn')) continue; // zaten enjekte edildiyse atla
        if (!yanit.querySelector('.markdown, .response-content, message-content')) continue; // içerik yoksa atla
        indirmeButonlariniEnjekte(yanit); // butonları ekle
    }
}

// Bir model-response için action bar'ı bulup MD/TXT butonlarını ekler
function indirmeButonlariniEnjekte(modelResponse) {
    // Action bar adayları — Gemini farklı sürümlerde farklı container kullanıyor
    const aksiyonBar = modelResponse.querySelector('message-actions') || // custom element
        modelResponse.querySelector('.response-actions-container') || // container class
        modelResponse.querySelector('.message-actions'); // alternatif class

    if (!aksiyonBar) return; // action bar bulunamadıysa çık (henüz render olmamış olabilir)

    // Action bar içindeki mevcut ikon butonları bul — onların gerçek parent'ına ekleyeceğiz
    // (action bar bazen wrapper olur, asıl flex container içerideki bir div'dir)
    const mevcutButonlar = aksiyonBar.querySelectorAll('button[mat-icon-button], button.mat-mdc-icon-button, button.mat-icon-button, button'); // ikon buton adayları
    if (mevcutButonlar.length === 0) return; // hiç buton yoksa enjekte etme (yapı tanınamadı)
    const sonButon = mevcutButonlar[mevcutButonlar.length - 1]; // en sondaki buton (⋮ more options)
    const butonParent = sonButon.parentElement; // gerçek flex container — diğer butonların kardeşi olacağız
    if (!butonParent) return; // parent yoksa çık

    // Stil bir kez ekle
    if (!document.querySelector('#gp-indir-stil')) { // stil yoksa
        const stil = document.createElement('style'); // style elementi
        stil.id = 'gp-indir-stil'; // benzersiz id
        stil.textContent = [ // CSS kuralları — diğer ikon butonlarla yan yana hizalı
            '.gp-indir-btn {',
            '  display:inline-flex; align-items:center; justify-content:center;',
            '  padding:0 10px; border:1px solid #dadce0; border-radius:14px;',
            '  background:#ffffff; font-size:11px; cursor:pointer; color:#5f6368;',
            '  font-family:"Google Sans Text","Google Sans",Roboto,Arial,sans-serif;',
            '  font-weight:500; transition:background 0.15s, border-color 0.15s, color 0.15s;',
            '  line-height:1; height:28px; margin:0 2px; flex-shrink:0;',
            '  vertical-align:middle; white-space:nowrap;',
            '}',
            '.gp-indir-btn:hover { background:#e8f0fe; border-color:#1a73e8; color:#1a73e8; }',
            '.gp-indir-btn.gp-md-btn { border-color:#d2e3fc; color:#1a73e8; }',
            '.gp-indir-btn.gp-txt-btn { border-color:#dadce0; }',
            '.gp-indir-btn:first-of-type { margin-left:8px; }'
        ].join('\n'); // birleştir
        document.head.appendChild(stil); // head'e ekle
    }

    // MD indir butonu
    const mdBtn = document.createElement('button'); // MD butonu
    mdBtn.type = 'button'; // form submit önle
    mdBtn.className = 'gp-indir-btn gp-md-btn'; // CSS sınıfları
    mdBtn.textContent = '↓ MD'; // metin (Türkçe karakter yok)
    mdBtn.title = 'Bu soru-cevabı Markdown olarak indir'; // tooltip
    mdBtn.setAttribute('aria-label', 'Markdown olarak indir'); // erişilebilirlik

    // TXT indir butonu
    const txtBtn = document.createElement('button'); // TXT butonu
    txtBtn.type = 'button'; // form submit önle
    txtBtn.className = 'gp-indir-btn gp-txt-btn'; // CSS sınıfları
    txtBtn.textContent = '↓ TXT'; // metin
    txtBtn.title = 'Bu soru-cevabı düz metin olarak indir'; // tooltip
    txtBtn.setAttribute('aria-label', 'Düz metin olarak indir'); // erişilebilirlik

    // Tıklama olayları — closure ile modelResponse referansını sabitle
    mdBtn.addEventListener('click', (olay) => { // MD tıklama
        olay.preventDefault(); olay.stopPropagation(); olay.stopImmediatePropagation(); // diğer handler'ları durdur
        const soru = oncekiSoruMetniBul(modelResponse); // önceki kullanıcı sorusu
        const cevap = cevapMetniniAl(modelResponse); // şu anki cevap metni
        cevapIndir(soru, cevap, 'md'); // MD olarak indir
    });
    txtBtn.addEventListener('click', (olay) => { // TXT tıklama
        olay.preventDefault(); olay.stopPropagation(); olay.stopImmediatePropagation(); // diğer handler'ları durdur
        const soru = oncekiSoruMetniBul(modelResponse); // önceki kullanıcı sorusu
        const cevap = cevapMetniniAl(modelResponse); // şu anki cevap metni
        cevapIndir(soru, cevap, 'txt'); // TXT olarak indir
    });

    // Son ikon butonun yanına kardeş olarak ekle (aynı flex container içinde — yan yana hizalanır)
    if (sonButon.nextSibling) { // son butondan sonra başka bir element varsa
        butonParent.insertBefore(mdBtn, sonButon.nextSibling); // araya MD ekle
        butonParent.insertBefore(txtBtn, mdBtn.nextSibling); // MD'nin yanına TXT ekle
    } else { // son butondan sonra hiçbir şey yoksa
        butonParent.appendChild(mdBtn); // sona MD ekle
        butonParent.appendChild(txtBtn); // sona TXT ekle
    }
}

// Bir model-response'tan önceki user-query'nin metnini bulur (soru eşleştirme)
function oncekiSoruMetniBul(modelResponse) {
    let oncekiKardes = modelResponse.previousElementSibling; // DOM'da önceki kardeş
    while (oncekiKardes) { // user-query bulana kadar geri git
        if (oncekiKardes.tagName && oncekiKardes.tagName.toLowerCase() === 'user-query') { // user-query elementi
            const queryText = oncekiKardes.querySelector('.query-text') || // asıl metin
                oncekiKardes.querySelector('.user-query-bubble-with-background') || // balon
                oncekiKardes.querySelector('.query-content') || // içerik
                oncekiKardes; // fallback
            return geminiPrefixTemizle((queryText.textContent || '').trim()); // prefix temizle ve dön
        }
        oncekiKardes = oncekiKardes.previousElementSibling; // bir önceki kardeşe git
    }
    return ''; // bulunamadıysa boş
}

// Bir model-response'un cevap metnini düz text olarak çıkarır
function cevapMetniniAl(modelResponse) {
    const icerikEl = modelResponse.querySelector('.markdown') || // markdown bloğu
        modelResponse.querySelector('.response-content') || // yanıt içeriği
        modelResponse.querySelector('message-content'); // mesaj içeriği
    return icerikEl ? (icerikEl.textContent || '').trim() : ''; // metni dön
}

// Soru-cevap çiftini MD veya TXT formatında dosyaya indirir
function cevapIndir(soru, cevap, format) {
    const tarih = new Date().toLocaleString('tr-TR'); // tarih saat damgası
    const konusmaBasligi = basligiTemizle(document.title || '', 'gemini') || 'Gemini Konuşması'; // sayfa başlığı

    let icerik; // dosya içeriği
    let mimeType; // MIME tipi

    if (format === 'md') { // Markdown format
        icerik = '# Gemini Soru-Cevap\n\n' + // başlık
            '**Tarih:** ' + tarih + '  \n' + // tarih
            '**Konuşma:** ' + konusmaBasligi + '\n\n' + // konuşma adı
            '---\n\n' + // ayırıcı
            '## Soru\n\n' + // soru başlığı
            (soru || '*(Soru metni alınamadı)*') + '\n\n' + // soru metni
            '## Cevap\n\n' + // cevap başlığı
            (cevap || '*(Cevap metni alınamadı)*') + '\n\n' + // cevap metni
            '---\n*AI Chat Printer eklentisi ile indirildi*\n'; // imza
        mimeType = 'text/markdown;charset=utf-8'; // markdown MIME
    } else { // düz metin format
        const ayirici = new Array(61).join('='); // 60 karakter = çizgisi
        icerik = 'Gemini Soru-Cevap\n' + // başlık
            ayirici + '\n' + // ayırıcı
            'Tarih:    ' + tarih + '\n' + // tarih
            'Konusma:  ' + konusmaBasligi + '\n' + // konuşma adı
            ayirici + '\n\n' + // ayırıcı
            'SORU:\n' + // soru başlığı
            (soru || '(Soru metni alinamadi)') + '\n\n' + // soru
            'CEVAP:\n' + // cevap başlığı
            (cevap || '(Cevap metni alinamadi)') + '\n\n' + // cevap
            ayirici + '\n' + // ayırıcı
            'AI Chat Printer eklentisi ile indirildi\n'; // imza
        mimeType = 'text/plain;charset=utf-8'; // plain text MIME
    }

    const dosyaAdi = indirmeDosyaAdiOlustur(soru, format); // güvenli dosya adı
    const blob = new Blob([icerik], { type: mimeType }); // blob oluştur
    const url = URL.createObjectURL(blob); // geçici URL
    const link = document.createElement('a'); // gizli a etiketi
    link.href = url; // blob URL
    link.download = dosyaAdi; // indirilecek dosya adı
    document.body.appendChild(link); // body'e ekle
    link.click(); // tıkla — indirme başlar
    document.body.removeChild(link); // hemen sil
    setTimeout(() => URL.revokeObjectURL(url), 100); // 100ms sonra URL'i serbest bırak

    uyariBalonuGoster('İndirildi: ' + dosyaAdi, 'basari'); // kullanıcıya bildir
}

// Soru metninden güvenli dosya adı üretir (FS yasaklı karakterler temizlenir)
function indirmeDosyaAdiOlustur(soru, format) {
    let temel = (soru || '').trim(); // ham soru metni
    if (!temel) { // soru yoksa
        temel = 'gemini-cevap-' + Date.now(); // timestamp ile fallback
    } else { // soru varsa
        temel = temel.replace(/[<>:"/\\|?*\n\r\t]/g, '').replace(/\s+/g, ' ').trim(); // FS yasaklı karakterleri temizle
        if (temel.length > 80) temel = temel.substring(0, 80).trim(); // 80 karakterle sınırla
    }
    return temel + '.' + format; // uzantı ekle ve dön
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

// Popup'tan ve background'tan gelen mesajları dinle
chrome.runtime.onMessage.addListener((mesaj, gonderen, yanitGonder) => { // mesaj dinleyici
    if (mesaj.islem === 'konusmayiCikar') { // konuşma çıkarma isteği
        (async () => { // async IIFE
            // Streaming kontrol Gemini için kaldırıldı — false positive üretiyordu
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
