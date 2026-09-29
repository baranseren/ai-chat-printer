// AI Chat Printer - ChatGPT Content Script
// ChatGPT sayfasına yazdır butonu enjekte eder ve konuşma içeriğini çıkarır

// Buton zaten enjekte edildi mi kontrolü
let butonEnjekteEdildi = false; // tekrar enjekte etmeyi önle
let yazdirmaIslemiSuruyor = false; // çift tıklama reentrance koruması — paralel çıkarma akışını önler
let headerDenemeSayisi = 0; // header arama deneme sayacı — 5 denemeden sonra floating fallback

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
    bekleyenYazdirmayiDevamEttir(yazdirmaBaslat); // bağlantı kurtarma reload'u varsa işlemi otomatik sürdür
}

// Yazdır butonunu ChatGPT header'ına enjekte eder
function butonuEnjekteEt() {
    if (butonEnjekteEdildi) return; // zaten enjekte edildiyse çık

    // Sayfa header'ını bul
    const header = document.querySelector('header'); // üst çubuk
    if (!header) { // header henüz yüklenmediyse (2026-07 wm frontend'inde header olmayabilir)
        headerDenemeSayisi++; // deneme sayacını artır
        if (headerDenemeSayisi >= 5) { // 5 deneme başarısız — header'sız yeni UI
            floatingButonEkle(); // sağ üst köşeye sabit floating buton ekle
            return;
        }
        setTimeout(butonuEnjekteEt, 1000); // 1 saniye sonra tekrar dene
        return;
    }
    headerDenemeSayisi = 0; // header bulundu — sayacı sıfırla

    // Eski butonu sil (eklenti yeniden yüklenince ölü handler kalır)
    const eskiButon = document.querySelector('#chatgpt-printer-buton'); // eski buton
    if (eskiButon) eskiButon.remove(); // sil ve yenisini oluştur

    // Paylaş butonunu bul — yeni UI'da aria-label yok, buton metniyle de aranır (v1.8.3 hizalama düzeltmesi)
    const paylasButonu = paylasButonunuBul(header); // aria-label + metin araması
    if (!paylasButonu || !paylasButonu.parentElement) { // Paylaş yoksa header'a gömme — dikey container'a girip üst satırda kalıyor
        floatingButonEkle(); // sabit konumlu floating buton garantili hizada durur
        return;
    }

    // Yazdır butonu
    const yazdirButonu = document.createElement('button'); // buton elementi
    yazdirButonu.id = 'chatgpt-printer-buton'; // benzersiz id
    yazdirButonu.type = 'button'; // form içine taşınsa bile submit davranışı üretme
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
        'position:relative',
        'align-self:center', // flex parent'ta dikey ortalama (üst satıra yapışmayı önler)
        'flex-shrink:0' // dar header'da butonun ezilmesini önle
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

    // Paylaş butonunun soluna, AYNI parent içine ekle — aynı satırda hizalanma garantisi
    paylasButonu.parentElement.insertBefore(yazdirButonu, paylasButonu); // Paylaş'tan önce ekle

    butonEnjekteEdildi = true; // enjekte edildi olarak işaretle
}

// Header içindeki Paylaş butonunu bulur — önce aria-label (eski UI), sonra buton metni (yeni UI aria-label taşımıyor)
function paylasButonunuBul(header) {
    const ariaIle = header.querySelector('button[aria-label="Paylaş"], button[aria-label="Share"]'); // eski UI aria-label
    if (ariaIle) return ariaIle; // bulundu
    return Array.from(header.querySelectorAll('button')).find((buton) => { // tüm header butonlarını tara
        const metin = (buton.textContent || '').trim(); // buton görünür metni
        return metin === 'Paylaş' || metin === 'Share'; // TR + EN eşleşme
    }) || null; // bulunamadıysa null
}

// Header bulunamadığında sağ üst köşeye sabit floating yazdır butonu ekler (Grok kalıbı)
// Body'e eklenir, React reconciliation tarafından silinmez
function floatingButonEkle() {
    if (document.querySelector('#chatgpt-printer-buton')) return; // zaten varsa çık

    const yazdirButonu = document.createElement('button'); // buton elementi
    yazdirButonu.id = 'chatgpt-printer-buton'; // benzersiz id (observer aynı id'yi izler)
    yazdirButonu.type = 'button'; // form içine taşınsa bile submit davranışı üretme
    yazdirButonu.title = 'Konuşmayı Yazdır (AI Chat Printer)'; // tooltip
    yazdirButonu.setAttribute('aria-label', 'Konuşmayı Yazdır'); // erişilebilirlik
    yazdirButonu.style.cssText = [ // floating buton stili — sağ üst köşede sabit
        'position:fixed', // viewport'a kilitli
        'top:72px', // değişken header butonlarıyla çakışmayacak erişim noktası
        'right:18px', // viewport kenarına dayanıklı konum
        'width:42px',
        'height:42px',
        'border-radius:9999px',
        'border:1px solid rgba(0,0,0,0.08)', // hafif kenarlık (görünürlük için)
        'background:#ffffff', // beyaz arka plan
        'cursor:pointer',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'transition:all 0.2s',
        'padding:0',
        'z-index:9999', // sayfa elementlerinin üstünde
        'box-shadow:0 5px 18px rgba(0,0,0,0.16)' // açık ve koyu temada görünür gölge
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
        yazdirButonu.style.background = '#f5f5f5'; // açık gri arka plan
        svg.style.color = '#10a37f'; // ChatGPT yeşil rengi
    });
    yazdirButonu.addEventListener('mouseleave', () => { // fare çıkınca
        yazdirButonu.style.background = '#ffffff'; // beyaz geri dön
        svg.style.color = '#8e8ea0'; // gri renk geri dön
    });

    yazdirButonu.addEventListener('click', yazdirmaBaslat); // yazdırma işlemini başlat
    document.body.appendChild(yazdirButonu); // body seviyesi floating buton
    butonEnjekteEdildi = true; // enjekte edildi olarak işaretle
}

// Yazdırma işlemini başlatır
async function yazdirmaBaslat() {
    // Streaming kontrol — ChatGPT yanıt yazıyorsa uyar
    if (streamingMiKontrol('chatgpt')) { // streaming aktifse
        uyariBalonuGoster('ChatGPT henüz yanıt yazıyor. Tamamlanmasını bekleyin.', 'hata'); // uyarı
        return;
    }

    if (yazdirmaIslemiSuruyor) { // çift tıklama — ikinci akışı başlatma
        uyariBalonuGoster('Yazdırma işlemi zaten sürüyor, lütfen bekleyin...', 'hata'); // bilgi
        return;
    }
    yazdirmaIslemiSuruyor = true; // akış kilidi

    uyariBalonuGoster('Konuşma çıkarılıyor, resimler ve artefaktlar işleniyor...', 'basari'); // işlem başladı bildirimi
    resimIslemOturumuBaslat(RESIM_TOPLAM_SURE_LIMIT); // resim oturumu

    try { // oturum garanti kapatma
        const veri = await konusmayiCikar(uyariBalonuGoster); // konuşma verisini çıkar (uzun konuşmada ilerleme bildirimi)
        await yazdirmayaBasla(veri, uyariBalonuGoster); // ortak başlatma akışı
    } catch (cikarmaHata) { // çıkarma sırasında beklenmeyen hata
        uyariBalonuGoster('Konuşma çıkarılamadı: ' + cikarmaHata.message, 'hata'); // kullanıcıya bildir
        console.log('AI Chat Printer: Çıkarma hatası:', cikarmaHata); // sessiz log
    } finally { // oturum kapat
        yazdirmaIslemiSuruyor = false; // akış kilidini bırak
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
        stil.textContent = '@keyframes chatgptPrinterFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}#chatgpt-printer-buton:focus-visible{outline:3px solid rgba(16,163,127,.4)!important;outline-offset:3px!important}@media(prefers-reduced-motion:reduce){#chatgpt-printer-buton,#chatgpt-printer-uyari{animation:none!important;transition:none!important}}'; // animasyon + görünür klavye odağı
        document.head.appendChild(stil); // head'e ekle
    }

    document.body.appendChild(balon); // balonu sayfaya ekle
    setTimeout(() => { // 3 saniye sonra
        balon.style.opacity = '0'; // saydam yap
        balon.style.transition = 'opacity 0.3s'; // geçiş animasyonu
        setTimeout(() => balon.remove(), 300); // animasyon bitince sil
    }, 3000);
}

// ChatGPT mesajlarını güncel arama anahtarından, eski arayüzlerde önceki seçicilerden bulur.
const CHATGPT_TURN_SELEKTORU = '[data-testid^="conversation-turn"], li[data-message-role]'; // eski arayüzler

// Güncel mesaj kapsayıcılarını önceliklendirir; aynı mesajın iki kez alınmasını önler.
function chatgptTurnleriBul() {
    var guncelTurnler = document.querySelectorAll('main [data-chatgpt-search-unit-key]');
    return guncelTurnler.length ? guncelTurnler : document.querySelectorAll(CHATGPT_TURN_SELEKTORU);
}

// Turn elementinin rolünü döndürür — yeni DOM'da li attribute, eski DOM'da descendant attribute
function chatgptTurnRolu(turn) {
    var aramaAnahtari = turn.getAttribute('data-chatgpt-search-unit-key') || '';
    var aramaRolu = aramaAnahtari.match(/:(user|assistant)$/);
    if (aramaRolu) return aramaRolu[1];
    const yeniRol = turn.getAttribute('data-turn') || turn.getAttribute('data-message-role'); // yeni wm DOM — rol li'nin kendisinde
    if (yeniRol === 'user' || yeniRol === 'assistant') return yeniRol; // geçerli rol
    const eskiEl = turn.querySelector('[data-message-author-role]'); // eski DOM — rol descendant'ta
    const eskiRol = eskiEl ? eskiEl.getAttribute('data-message-author-role') : null; // eski rol değeri
    if (eskiRol === 'user' || eskiRol === 'assistant') return eskiRol; // geçerli rol
    return null; // rol tespit edilemedi
}

// Fallback: turn'ün sr-only attribution ("Şunu dedin:"/"ChatGPT:") ve aksiyon barı dışındaki gövde div'i
function chatgptTurnGovdesi(turn) {
    const govde = Array.from(turn.children).find((cocuk) => // ilk uygun gövde div'i
        cocuk.tagName === 'DIV' && !cocuk.hasAttribute('data-message-actions') && !cocuk.hasAttribute('data-message-supplement')
    );
    return govde || turn; // gövde yoksa turn'ün kendisi
}

// Turn içindeki asıl içerik elementini döndürür — attribution/buton sızıntısı olmadan
function chatgptIcerikElemani(turn, rol) {
    if (rol === 'user') { // kullanıcı mesajı
        return turn.querySelector('[data-user-message-bubble]') || // yeni wm DOM balonu
            turn.querySelector('.user-message-bubble-color') || // eski DOM balonu
            turn.querySelector('[data-message-author-role="user"]') || // eski DOM mesaj elementi
            chatgptTurnGovdesi(turn); // fallback gövde
    }
    return turn.querySelector('[data-markdown-text-style]') || // güncel DOM markdown içeriği
        turn.querySelector('[data-assistant-markdown]') || // önceki wm DOM markdown içeriği
        turn.querySelector('.markdown') || // eski DOM markdown
        turn.querySelector('[data-message-author-role="assistant"]') || // eski DOM mesaj elementi
        chatgptTurnGovdesi(turn); // fallback gövde
}

// ChatGPT metin ve görsellerini DOM sırasıyla, dekoratif kopyaları ayıklayarak çıkarır.
async function chatgptAkisIceriginiCikar(turn, rol) {
    var secici = rol === 'user' ? '[data-user-message-bubble], .user-message-bubble-color' : '[data-markdown-text-style], [data-assistant-markdown], .markdown';
    var bloklar = Array.from(turn.querySelectorAll(secici));
    bloklar = bloklar.filter(function(blok) { return !bloklar.some(function(diger) { return diger !== blok && diger.contains(blok); }); });
    if (!bloklar.length) bloklar = [chatgptIcerikElemani(turn, rol)];
    var kaynaklar = new Set();
    var sonuc = document.createElement('div');
    var adaylar = Array.from(turn.querySelectorAll('*')).filter(function(eleman) {
        return bloklar.includes(eleman) || (eleman.tagName === 'IMG' && !bloklar.some(function(blok) { return blok.contains(eleman); }));
    });
    if (bloklar.includes(turn)) adaylar = [turn];
    for (var eleman of adaylar) {
        if (eleman.tagName === 'IMG') {
            var resim = await chatgptAkisResminiCikar(eleman, kaynaklar);
            if (resim) sonuc.appendChild(resim);
        } else {
            var klon = eleman.cloneNode(true);
            var asillar = Array.from(eleman.querySelectorAll('img'));
            var kopyalar = Array.from(klon.querySelectorAll('img'));
            for (var sira = 0; sira < asillar.length; sira++) {
                var donusen = await chatgptAkisResminiCikar(asillar[sira], kaynaklar);
                if (donusen) kopyalar[sira].replaceWith(donusen);
                else kopyalar[sira].remove();
            }
            klon.querySelectorAll('button, [role="button"]').forEach(function(dugme) {
                var gorseller = Array.from(dugme.querySelectorAll('img'));
                dugme.replaceWith(...gorseller);
            });
            sonuc.appendChild(klon);
        }
    }
    return sonuc.innerHTML;
}

// İçerik resmini taşınabilir kaynağa dönüştürür; ikon ve dekoratif tekrarları almaz.
async function chatgptAkisResminiCikar(resim, kaynaklar) {
    var kaynak = resim.currentSrc || resim.src;
    if (!kaynak || resim.closest('[data-message-actions], [data-message-supplement], [data-message-attribution]')) return null;
    if (resim.getAttribute('aria-hidden') === 'true') return null;
    var boyut = resim.getBoundingClientRect();
    if (Math.max(resim.naturalWidth, Number(resim.getAttribute('width')), boyut.width) <= 48) return null;
    if (kaynaklar.has(kaynak)) return null;
    var veri = await resmiBase64Yap(resim);
    if (!veri) throw new Error('Bir konuşma görseli aktarılamadı: ' + (resim.alt || resim.getAttribute('aria-label') || 'Görsel'));
    kaynaklar.add(kaynak);
    var kopya = document.createElement('img');
    kopya.src = veri;
    kopya.alt = resim.alt || resim.getAttribute('aria-label') || 'Görsel';
    kopya.setAttribute('loading', 'eager');
    return kopya;
}
// ChatGPT Çalışma/Canvas içindeki dosya ve artefakt düğmelerini benzersiz kayıtlar hâlinde toplar
function chatgptArtifactAdaylariniBul(turn) {
    const adaySelektoru = [ // güncel Çalışma dosyaları + eski Canvas/artefakt geri dönüşleri
        'button[data-file-citation-primary-file-id]',
        'button[data-file-citation-group-identity]',
        'button[data-testid*="canvas"]',
        'button[data-testid*="artifact"]'
    ].join(','); // tek sorguda tüm kararlı işaretler
    const adayButonlar = Array.from(turn.querySelectorAll(adaySelektoru)); // veri işaretli düğmeler
    const dosyaUzantiliButonlar = Array.from(turn.querySelectorAll('button[aria-label]')).filter((buton) => { // açık dosya kartı geri dönüşü
        const etiket = (buton.getAttribute('aria-label') || '').trim(); // erişilebilir ad
        return /\.(?:html?|css|jsx?|tsx?|json|md|txt|py|java|c|cpp|cs|go|rs|sql|xml|ya?ml|csv|svg)$/i.test(etiket); // metin tabanlı dosya türleri
    });
    const benzersizButonlar = Array.from(new Set(adayButonlar.concat(dosyaUzantiliButonlar))); // aynı düğümü tekilleştir
    const gorulenDosyaKimlikleri = new Set(); // aynı dosyanın atıf + kart düğmesini birleştir
    const gorulenBasliklar = new Set(); // kimliksiz eski Canvas düğmelerini tekilleştir
    const artifactlar = []; // çıkarılacak artefakt tanımları

    for (const buton of benzersizButonlar) { // DOM sırasını koru
        const dosyaKimligi = (buton.getAttribute('data-file-citation-primary-file-id') || '').trim(); // güncel dosya kimliği
        const grupKimligi = (buton.getAttribute('data-file-citation-group-identity') || '').trim(); // güncel dosya grubu işareti
        const testKimligi = (buton.getAttribute('data-testid') || '').trim(); // eski Canvas/artefakt işareti
        const veriBasligi = (buton.getAttribute('data-canvas-title') || buton.getAttribute('data-artifact-title') || '').trim(); // eski UI başlık alanları
        const ariaBasligi = (buton.getAttribute('aria-label') || '').trim(); // güncel dosya adı
        const metinBasligi = (buton.textContent || '').trim(); // son çare görünür metin
        const dosyaEtiketiMi = /\.(?:html?|css|jsx?|tsx?|json|md|txt|py|java|c|cpp|cs|go|rs|sql|xml|ya?ml|csv|svg)$/i.test(ariaBasligi); // açık dosya kartı
        const eskiAdayMi = /(canvas|artifact)/i.test(testKimligi) && Boolean(veriBasligi || /(canvas|artifact)/i.test(ariaBasligi + ' ' + metinBasligi)); // genel araç düğmelerini dışla
        if (!dosyaKimligi && !grupKimligi && !dosyaEtiketiMi && !eskiAdayMi) continue; // artefakt açma düğmesi değil
        let baslik = veriBasligi || ariaBasligi || metinBasligi || 'ChatGPT Canvas'; // ilk dolu başlık
        if (/^(view|open|aç|görüntüle).*(artifact|canvas)|^(artifact|canvas).*(aç|görüntüle)$/i.test(baslik)) baslik = 'ChatGPT Canvas'; // eylem etiketini başlık sayma
        if (dosyaKimligi && gorulenDosyaKimlikleri.has(dosyaKimligi)) continue; // aynı dosya kimliği işlendi
        if (!dosyaKimligi && gorulenBasliklar.has(baslik.toLocaleLowerCase('tr-TR'))) continue; // aynı kimliksiz başlık işlendi
        if (dosyaKimligi) gorulenDosyaKimlikleri.add(dosyaKimligi); // dosya kimliğini kaydet
        gorulenBasliklar.add(baslik.toLocaleLowerCase('tr-TR')); // atıf + kart ikilisini başlıkla birleştir
        artifactlar.push({ buton, dosyaKimligi, baslik, tur: chatgptArtifactTurunuBul(baslik) }); // çıkarma kaydı
    }
    return artifactlar; // benzersiz artefakt listesi
}

// Dosya uzantısından önizlemede gösterilecek artefakt türünü belirler
function chatgptArtifactTurunuBul(baslik) {
    const uzantiEslesmesi = baslik.toLocaleLowerCase('tr-TR').match(/\.([^.\s]+)$/); // son uzantı
    const uzanti = uzantiEslesmesi ? uzantiEslesmesi[1] : ''; // uzantı yoksa boş
    const turler = { // yaygın Çalışma/Canvas türleri
        htm: 'HTML', html: 'HTML', css: 'CSS', js: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript',
        jsx: 'React JSX', ts: 'TypeScript', tsx: 'React TSX', json: 'JSON', md: 'Markdown', txt: 'Metin',
        py: 'Python', java: 'Java', c: 'C', cpp: 'C++', cs: 'C#', go: 'Go', rs: 'Rust', sql: 'SQL',
        xml: 'XML', yaml: 'YAML', yml: 'YAML', csv: 'CSV', svg: 'SVG'
    }; // uzantı → görünür tür
    return turler[uzanti] || 'ChatGPT Canvas'; // bilinmeyen türde genel ad
}

// Açık ChatGPT artefakt panelini başlığa göre bulur
function chatgptArtifactPaneliniBul(baslik) {
    const panelSelektoru = [ // güncel Çalışma paneli + eski Canvas/artefakt panelleri
        'section[data-testid="screen-threadFlyOut"]',
        'section[data-testid="canvas-panel"]',
        'aside[data-testid="canvas-panel"]',
        '[role="dialog"][data-testid*="canvas"]',
        '[role="dialog"][data-testid*="artifact"]',
        'section[data-testid*="canvas"][aria-label]',
        'aside[data-testid*="canvas"][aria-label]'
    ].join(','); // tek panel sorgusu
    const paneller = Array.from(document.querySelectorAll(panelSelektoru)).filter((panel) => !panel.hidden && panel.getAttribute('aria-hidden') !== 'true'); // açık paneller
    if (baslik) { // belirli dosya isteniyorsa
        const tamEslesen = paneller.find((panel) => (panel.getAttribute('aria-label') || '').trim() === baslik); // güncel panel başlığı
        if (tamEslesen) return tamEslesen; // doğru dosya paneli
    }
    return paneller.length > 0 ? paneller[paneller.length - 1] : null; // en son açılan panel
}

// Artefakt panelinin kullanıcıya görünen başlığını döndürür
function chatgptArtifactPanelBasliginiBul(panel) {
    if (!panel) return ''; // panel yok
    const ariaBasligi = (panel.getAttribute('aria-label') || '').trim(); // güncel Çalışma paneli
    if (ariaBasligi) return ariaBasligi; // en güvenilir başlık
    const baslikElemani = panel.querySelector('[data-testid="artifact-title"], [data-testid="canvas-title"], header h2, h2'); // eski UI başlığı
    return baslikElemani ? (baslikElemani.textContent || '').trim() : ''; // görünür başlık veya boş
}

// Panelde seçili Kod/Önizleme sekmesinin adını döndürür
function chatgptArtifactAktifSekmesiniBul(panel) {
    if (!panel) return ''; // panel yok
    const aktifButon = panel.querySelector('button[aria-pressed="true"], [role="tab"][aria-selected="true"]'); // seçili sekme
    return aktifButon ? (aktifButon.textContent || aktifButon.getAttribute('aria-label') || '').trim() : ''; // sekme adı
}

// Belirtilen panel sekmesini görünür metniyle seçer
function chatgptArtifactSekmesiniSec(panel, sekmeAdlari) {
    if (!panel || !sekmeAdlari || sekmeAdlari.length === 0) return false; // seçim yapılamaz
    const sekmeButonu = Array.from(panel.querySelectorAll('button, [role="tab"]')).find((buton) => { // panel sekmelerini tara
        const ad = (buton.textContent || buton.getAttribute('aria-label') || '').trim(); // görünür/erişilebilir ad
        return sekmeAdlari.some((sekmeAdi) => ad.toLocaleLowerCase('tr-TR') === sekmeAdi.toLocaleLowerCase('tr-TR')); // TR + EN tam eşleşme
    });
    if (!sekmeButonu) return false; // bu panelde sekme yok
    if (sekmeButonu.getAttribute('aria-pressed') !== 'true' && sekmeButonu.getAttribute('aria-selected') !== 'true') sekmeButonu.click(); // seçili değilse tıkla
    return true; // sekme bulundu
}

// Koşul sağlanana veya süre dolana kadar kısa aralıklarla bekler
async function chatgptKosuluBekle(kontrol, azamiSure, aralik) {
    const bitisZamani = Date.now() + azamiSure; // kesin bitiş zamanı
    while (Date.now() < bitisZamani) { // süre dolana kadar
        const sonuc = kontrol(); // güncel DOM'u sorgula
        if (sonuc) return sonuc; // koşul sağlandı
        await new Promise((coz) => setTimeout(coz, aralik)); // React render aralığı
    }
    return null; // süre doldu
}

// Paneldeki kaynak veya belge içeriğini en güvenilir DOM yüzeyinden okur
function chatgptArtifactIceriginiOku(panel) {
    if (!panel) return ''; // panel yok
    const icerikSelektorleri = [ // güncel CodeMirror kaynağı + eski Canvas editörleri
        '[id^="artifact-"][id*="-source:"] .cm-content > code',
        '.cm-content > code',
        '[data-testid="artifact-source"]',
        '[data-testid*="artifact-source"]',
        '[data-testid="canvas-content"]',
        '[data-testid*="canvas-content"]',
        '.ProseMirror',
        '[contenteditable="true"]',
        'textarea',
        'pre > code',
        'pre'
    ]; // öncelik sıralı içerik selektörleri
    for (const selektor of icerikSelektorleri) { // CSS virgül listesinin DOM-sırası tuzağına düşmeden gerçek önceliği uygula
        const icerikElemani = panel.querySelector(selektor); // bu katmandaki ilk aday
        if (!icerikElemani) continue; // sıradaki geri dönüşe geç
        const deger = icerikElemani.tagName === 'TEXTAREA' ? icerikElemani.value : icerikElemani.textContent; // textarea değeri veya metin
        if ((deger || '').trim()) return deger.trim(); // boş değilse döndür
    }
    const onizleme = panel.querySelector('iframe'); // aynı-origin eski Canvas önizlemesi
    if (onizleme) { // iframe varsa
        try { // cross-origin güvenlik hatasını yalıt
            const onizlemeMetni = onizleme.contentDocument && onizleme.contentDocument.body ? onizleme.contentDocument.body.innerText : ''; // erişilebilen metin
            if ((onizlemeMetni || '').trim()) return onizlemeMetni.trim(); // aynı-origin içerik
        } catch { // güncel web-sandbox çapraz origin olduğu için beklenen geri dönüş
            return ''; // kaynak sekmesi yüklenene kadar boş kal
        }
    }
    return ''; // içerik henüz yok
}

// Artefakt içeriği değişmeden iki ölçüm boyunca sabitlenene kadar bekler
async function chatgptArtifactIcerigininKararlilasmasiniBekle(panel) {
    let oncekiIcerik = ''; // önceki ölçüm
    let esitOlcumSayisi = 0; // ardışık eşit ölçüm
    const bitisZamani = Date.now() + 6000; // en fazla 6 saniye
    while (Date.now() < bitisZamani) { // içerik yüklenirken
        const mevcutIcerik = chatgptArtifactIceriginiOku(panel); // güncel kaynak
        if (mevcutIcerik && mevcutIcerik === oncekiIcerik) esitOlcumSayisi++; // içerik kararlı
        else esitOlcumSayisi = 0; // değişti veya boş
        if (mevcutIcerik && esitOlcumSayisi >= 1) return mevcutIcerik; // iki ardışık aynı ölçüm
        oncekiIcerik = mevcutIcerik; // sonraki ölçüm için sakla
        await new Promise((coz) => setTimeout(coz, 250)); // render ölçüm aralığı
    }
    return oncekiIcerik || null; // süre sonunda eldeki içeriği koru
}

// Açık artefakt panelini güvenli kapatma düğmesiyle kapatır
async function chatgptArtifactPaneliniKapat(panel) {
    if (!panel || !document.documentElement.contains(panel)) return true; // panel zaten kapalı
    const kapatButonu = panel.querySelector('button[data-testid="close-button"], button[data-testid*="close"], button[aria-label="Kapat"], button[aria-label="Close"]'); // güncel + eski kapatma
    if (!kapatButonu) return false; // React dışından DOM silme yapma
    kapatButonu.click(); // doğal panel kapatma akışı
    const kapandi = await chatgptKosuluBekle(() => !document.documentElement.contains(panel) || panel.hidden || panel.getAttribute('aria-hidden') === 'true', 1800, 100); // kapanmayı doğrula
    return Boolean(kapandi); // kapanma sonucu
}

// Dosya kimliği veya başlığıyla güncel artefakt açma düğmesini yeniden bulur
function chatgptArtifactButonunuBul(artifact) {
    if (artifact.buton && document.documentElement.contains(artifact.buton)) return artifact.buton; // ilk DOM referansı hâlâ geçerli
    const butonlar = Array.from(document.querySelectorAll('button')); // sanallaştırma sonrası güncel düğmeler
    if (artifact.dosyaKimligi) { // güncel Çalışma dosyası
        const kimlikliButon = butonlar.find((buton) => buton.getAttribute('data-file-citation-primary-file-id') === artifact.dosyaKimligi); // dosya kimliği eşleşmesi
        if (kimlikliButon) return kimlikliButon; // bulundu
    }
    return butonlar.find((buton) => (buton.getAttribute('aria-label') || '').trim() === artifact.baslik) || null; // başlık geri dönüşü
}

// Bir ChatGPT asistan turn'ündeki Çalışma/Canvas artefaktlarını açıp kaynaklarını çıkarır
async function chatgptArtifactlariniCikar(turn, ilerlemeBildir) {
    const adaylar = chatgptArtifactAdaylariniBul(turn); // bu yanıta bağlı dosyalar
    if (adaylar.length === 0) return []; // artefakt yok
    const baslangicPaneli = chatgptArtifactPaneliniBul(); // kullanıcının önceden açık paneli
    const baslangicBasligi = chatgptArtifactPanelBasliginiBul(baslangicPaneli); // geri yüklenecek dosya
    const baslangicSekmesi = chatgptArtifactAktifSekmesiniBul(baslangicPaneli); // geri yüklenecek görünüm
    const artifactlar = []; // çıkarılmış artefaktlar

    try { // panel durumunu sonunda mutlaka geri yükle
        for (let sira = 0; sira < adaylar.length; sira++) { // dosyaları sırayla aç
            const aday = adaylar[sira]; // güncel dosya
            if (ilerlemeBildir) ilerlemeBildir('ChatGPT artefaktı çıkarılıyor... (' + (sira + 1) + '/' + adaylar.length + ')', 'basari'); // kullanıcı ilerlemesi
            let panel = chatgptArtifactPaneliniBul(aday.baslik); // dosya zaten açık olabilir
            try { // tek dosya hatası diğerlerini durdurmasın
                if (!panel || chatgptArtifactPanelBasliginiBul(panel) !== aday.baslik) { // doğru dosya açık değil
                    const acmaButonu = chatgptArtifactButonunuBul(aday); // güncel React düğmesi
                    if (!acmaButonu) throw new Error('Artefakt açma düğmesi bulunamadı.'); // tanımlı hata
                    acmaButonu.click(); // ChatGPT panelini aç
                    panel = await chatgptKosuluBekle(() => { // doğru dosya panelini bekle
                        const bulunanPanel = chatgptArtifactPaneliniBul(aday.baslik); // açık panel
                        return bulunanPanel && (chatgptArtifactPanelBasliginiBul(bulunanPanel) === aday.baslik || aday.baslik === 'ChatGPT Canvas') ? bulunanPanel : null; // doğru panel
                    }, 4500, 100); // React + dosya yükleme payı
                }
                if (!panel) throw new Error('Artefakt paneli açılamadı.'); // panel yok
                chatgptArtifactSekmesiniSec(panel, ['Kod', 'Code', 'Kaynak', 'Source']); // çapraz-origin önizleme yerine kaynak görünümü
                const icerik = await chatgptArtifactIcerigininKararlilasmasiniBekle(panel); // kararlı kaynak
                artifactlar.push({ baslik: aday.baslik, tur: aday.tur, icerik: icerik || null }); // proje mesaj sözleşmesi
            } catch (artifactHatasi) { // yalnız bu dosyayı boş içerikle koru
                console.log('AI Chat Printer: ChatGPT artefakt çıkarma hatası:', artifactHatasi); // tanı izi
                artifactlar.push({ baslik: aday.baslik, tur: aday.tur, icerik: null }); // başlık ve tür kaybolmasın
            }
        }
    } finally { // kullanıcı arayüzünü başlangıç durumuna getir
        let acikPanel = chatgptArtifactPaneliniBul(); // çıkarma sonunda açık panel
        const acikBaslik = chatgptArtifactPanelBasliginiBul(acikPanel); // açık dosya
        if (!baslangicPaneli) { // kullanıcı başlangıçta panel açmamıştı
            if (acikPanel) await chatgptArtifactPaneliniKapat(acikPanel); // eklentinin açtığını kapat
        } else if (acikBaslik !== baslangicBasligi) { // kullanıcı farklı bir dosyada kalmasın
            if (acikPanel) await chatgptArtifactPaneliniKapat(acikPanel); // son çıkarılanı kapat
            const eskiButon = Array.from(document.querySelectorAll('button[aria-label]')).find((buton) => (buton.getAttribute('aria-label') || '').trim() === baslangicBasligi); // önceki dosya düğmesi
            if (eskiButon) { // önceki dosya görünürse
                eskiButon.click(); // paneli geri aç
                acikPanel = await chatgptKosuluBekle(() => chatgptArtifactPaneliniBul(baslangicBasligi), 3000, 100); // geri açılmayı bekle
            }
        }
        if (baslangicSekmesi && acikPanel) chatgptArtifactSekmesiniSec(acikPanel, [baslangicSekmesi]); // kullanıcının sekmesini geri yükle
    }
    return artifactlar; // bu mesaja bağlı artefaktlar
}

// Turn için benzersiz anahtar — sanallaştırma süpürmesinde mükerrer önleme
function chatgptTurnAnahtari(turn) {
    var mesajKimligi = turn.getAttribute('data-chatgpt-search-message-ids');
    if (mesajKimligi) return 'mesaj:' + mesajKimligi;
    if (turn.id) return 'id:' + turn.id; // yeni DOM: li id'si mesaj UUID'si
    const testid = turn.getAttribute('data-testid'); // eski DOM: conversation-turn-N
    if (testid) return 'testid:' + testid; // testid anahtarı
    const metin = (turn.textContent || '').trim(); // son çare: içerik parmak izi
    return 'metin:' + metin.length + ':' + metin.substring(0, 80) + ':' + metin.substring(metin.length - 40); // uzunluk + baş + son
}

// Turn listesinin kaydırılabilir ancestor'ını bulur (sanallaştırma süpürmesi için)
function chatgptKaydiriciBul(turn) {
    let aday = turn ? turn.parentElement : null; // turn'den yukarı çık
    while (aday && aday !== document.body) { // body'e kadar
        const stil = window.getComputedStyle(aday); // hesaplanmış stil
        if (/(auto|scroll|overlay)/.test(stil.overflowY) && aday.scrollHeight > aday.clientHeight + 10) return aday; // kaydırılabilir alan
        aday = aday.parentElement; // bir seviye yukarı
    }
    const kok = document.scrollingElement; // sayfa kökü
    return (kok && kok.scrollHeight > kok.clientHeight + 10) ? kok : null; // kök kaydırılabilirse o, değilse null
}

// ChatGPT sayfasından konuşma verilerini çıkarır (async — resim base64 dönüşümü için)
// Yeni UI mesaj listesini sanallaştırabildiği için scroll-süpürme ile TÜM mesajlar toplanır
async function konusmayiCikar(ilerlemeBildir) {
    const ilkTurnler = chatgptTurnleriBul(); // ilk tarama
    if (ilkTurnler.length === 0) { // hiç turn bulunamadıysa
        return { hata: 'Konuşma bulunamadı. Bir ChatGPT sohbeti açık olduğundan emin olun.', mesajlar: [] };
    }

    const mesajMap = new Map(); // anahtar → mesaj (ekleme sırası üstten alta korunur)

    // O an DOM'da bulunan turn'leri işleyip map'e ekler (görülmüşler atlanır)
    async function gorunenleriIsle() {
        for (const turn of chatgptTurnleriBul()) { // güncel turn seti
            const anahtar = chatgptTurnAnahtari(turn); // benzersiz anahtar
            if (mesajMap.has(anahtar)) continue; // zaten işlendi
            const rol = chatgptTurnRolu(turn); // rol tespiti
            if (!rol) continue; // rol yoksa atla (boş/sistem bloğu)

            const kaynakEl = chatgptIcerikElemani(turn, rol); // asıl içerik elementi
            const htmlIcerik = await chatgptAkisIceriginiCikar(turn, rol); // resimleri base64'e çevirip HTML çıkar
            const ekstraResimler = []; // kaynak dışındaki resimler
            const metinIcerik = temizMetinCikar(kaynakEl); // UI sızıntısız düz metin
            const artifactlar = rol === 'assistant' ? await chatgptArtifactlariniCikar(turn, ilerlemeBildir) : []; // Çalışma/Canvas dosyalarını aç-kaynak oku-kapat

            if (!htmlIcerik && !metinIcerik && ekstraResimler.length === 0 && artifactlar.length === 0) continue; // tamamen boş turn atla

            const mesajKaydi = {
                rol: rol === 'user' ? 'kullanici' : 'chatgpt', // proje formatı
                html: htmlIcerik, // base64 resimli HTML içerik
                metin: metinIcerik, // düz metin
                resimler: ekstraResimler // ekstra resimler
            }; // ortak mesaj sözleşmesi
            if (artifactlar.length > 0) mesajKaydi.artifactlar = artifactlar; // alan yalnız gerçek artefakt varsa taşınır
            mesajMap.set(anahtar, mesajKaydi); // sıralı mesaja ekle
        }
    }

    // Sanallaştırma süpürmesi — uzun konuşmada görünmeyen mesajlar DOM'dan düşer; adım adım kaydırarak topla
    const kaydirici = chatgptKaydiriciBul(ilkTurnler[0]); // konuşma scroll alanı
    const supurmeGerekli = kaydirici && kaydirici.scrollHeight > kaydirici.clientHeight * 1.5; // scroll edilecek kadar uzun mu
    if (supurmeGerekli) { // uzun konuşma — süpürme yap
        const orijinalScroll = kaydirici.scrollTop; // kullanıcının mevcut konumu
        try {
            kaydirici.scrollTop = 0; // en üste git
            await new Promise((coz) => setTimeout(coz, 450)); // üst mesajların render'ını bekle
            let adim = 0; // adım sayacı
            let ilerlemeyenAdim = 0; // kaydırıcının hareket etmediği ardışık adımlar
            while (true) { // konuşmanın gerçek dibine kadar süpür
                await gorunenleriIsle(); // bu dilimdeki turn'leri işle
                if (kaydirici.scrollTop + kaydirici.clientHeight >= kaydirici.scrollHeight - 5) break; // dibe ulaşıldı
                const oncekiScroll = kaydirici.scrollTop; // ilerleme denetimi için mevcut konum
                const hedefScroll = Math.min(kaydirici.scrollHeight - kaydirici.clientHeight, oncekiScroll + Math.max(200, Math.floor(kaydirici.clientHeight * 0.75))); // sınırı aşmayan hedef
                kaydirici.scrollTop = hedefScroll; // bir dilim aşağı
                await new Promise((coz) => setTimeout(coz, 350)); // lazy render bekleme
                ilerlemeyenAdim = kaydirici.scrollTop <= oncekiScroll + 1 ? ilerlemeyenAdim + 1 : 0; // gerçekten hareket etti mi
                if (ilerlemeyenAdim >= 3) { // DOM üç kez hareket üretmediyse sonsuz döngüyü önle
                    await gorunenleriIsle(); // mevcut son dilimi yine de işle
                    break; // kaydırma yüzeyi ilerlemiyor
                }
                adim++; // sayaç
                if (ilerlemeBildir && adim % 8 === 0) ilerlemeBildir('Uzun konuşma taranıyor... (' + mesajMap.size + ' mesaj)', 'basari'); // ilerleme bildirimi
            }
            await gorunenleriIsle(); // son dilim
        } finally {
            kaydirici.scrollTop = orijinalScroll; // kullanıcının konumunu geri yükle
        }
    } else { // kısa konuşma — tüm turn'ler zaten DOM'da
        await gorunenleriIsle(); // tek geçiş
    }

    const mesajlar = Array.from(mesajMap.values()); // sıralı mesaj dizisi

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
    if (mesaj.islem === 'baglantiSaglik') { // popup/background yeni content script'i doğrular
        yanitGonder({ basari: true, kaynak: 'chatgpt' }); // senkron sağlık yanıtı
        return false; // kanal kapanabilir
    }
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
            } catch (hata) { // çıkarma hatası — popup yanlış "yüklenmemiş" mesajı göstermesin
                yanitGonder({ hata: 'Konuşma çıkarılamadı: ' + hata.message, mesajlar: [] }); // hata yanıtı
            } finally { // oturum kapat
                resimIslemOturumuBitir();
            }
        })();
        return true; // asenkron yanıt — kanalı açık tut
    }
    if (mesaj.islem === 'klavyeKisayoluYazdir') { // keyboard shortcut tetiklemesi
        yazdirmaBaslat(); // sayfa içi yazdırma akışı
        yanitGonder({ basari: true }); // background'ın await'i temiz kapansın (yanlış F5 badge önleme)
    }
    return false; // senkron yanıt — kanal kapanabilir
});

// Sayfa hazır olduğunda başlat
if (document.readyState === 'loading') { // sayfa yükleniyorsa
    document.addEventListener('DOMContentLoaded', baslat); // yüklendikten sonra başlat
} else { // sayfa zaten yüklendiyse
    baslat(); // hemen başlat
}
