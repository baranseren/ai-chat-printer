// AI Chat Printer - Ortak Resim Yardımcıları
// Gemini, Claude, ChatGPT ve Grok content script'leri tarafından paylaşılır
// MV3 content script array'inde ilk sırada yüklenir, diğer script'lere global olarak görünür

// Toplam resim işleme deadline'ı — tüm resimler için global zaman limiti
let resimIslemDeadline = 0; // 0 = limit yok, >0 = deadline timestamp (ms)
const TEK_RESIM_TIMEOUT = 5000; // tek bir resim için max 5sn

// Resim işleme oturumunu başlatır — toplam N saniye limiti koyar
function resimIslemOturumuBaslat(toplamSure) {
    resimIslemDeadline = Date.now() + toplamSure; // deadline ayarla
}

// Resim işleme oturumunu kapatır — limiti kaldırır
function resimIslemOturumuBitir() {
    resimIslemDeadline = 0; // deadline sıfırla
}

// Oturum deadline'ı geçtiyse true döner (toplam süre doldu)
function resimDeadlineDoldu() {
    return resimIslemDeadline > 0 && Date.now() > resimIslemDeadline; // deadline kontrolü
}

// Bir EventTarget üzerinde başarı, hata veya timeout sonucunu tek seferde bekler
function resimOlayiniBekle(hedef, basariOlayi, hataOlayi, sure) {
    return new Promise((coz, reddet) => { // olayları Promise yüzeyine çevir
        let tamamlandi = false; // birden fazla sonucun yarışı için kilit
        const temizle = () => { // dinleyicileri ve timer'ı birlikte temizle
            hedef.removeEventListener(basariOlayi, basarili); // başarı dinleyicisini kaldır
            hedef.removeEventListener(hataOlayi, basarisiz); // hata dinleyicisini kaldır
            clearTimeout(zamanlayici); // timeout'u kaldır
        };
        const basarili = () => { // başarı olayı
            if (tamamlandi) return; // yarış sonucu önceden geldiyse çık
            tamamlandi = true; // sonucu kilitle
            temizle(); // kaynakları temizle
            coz(); // Promise'i tamamla
        };
        const basarisiz = () => { // hata olayı
            if (tamamlandi) return; // yarış sonucu önceden geldiyse çık
            tamamlandi = true; // sonucu kilitle
            temizle(); // kaynakları temizle
            reddet(new Error('Resim yüklenemedi.')); // anlamlı hata üret
        };
        const zamanlayici = setTimeout(() => { // azami bekleme süresi
            if (tamamlandi) return; // sonuç geldiyse çık
            tamamlandi = true; // sonucu kilitle
            temizle(); // kaynakları temizle
            reddet(new Error('Resim yükleme süresi doldu.')); // timeout hatası
        }, sure);
        hedef.addEventListener(basariOlayi, basarili, { once: true }); // sayfanın mevcut handler'ını ezmeden dinle
        hedef.addEventListener(hataOlayi, basarisiz, { once: true }); // sayfanın mevcut handler'ını ezmeden dinle
    });
}

// Yazdırma akışında kabul edilen raster data URI biçimini doğrular
function guvenliRasterDataUriMi(kaynak) {
    return /^data:image\/(png|jpeg|jpg|gif|webp);(?:base64,|charset=)/i.test(kaynak || ''); // SVG ve bilinmeyen biçimleri reddet
}

// Tek bir resmi base64 data URL'e dönüştürür (canvas + fetch + URL fallback)
async function resmiBase64Yap(resimElementi) {
    if (!resimElementi || !resimElementi.src) return null; // kaynak yoksa çık
    if (resimElementi.src.startsWith('data:')) return guvenliRasterDataUriMi(resimElementi.src) ? resimElementi.src : null; // yalnız güvenli raster data URI'yi koru
    if (resimDeadlineDoldu()) { // toplam süre dolmuşsa
        console.log('AI Chat Printer [DEBUG]: Resim deadline aşıldı; kalan görsel güvenli fallback ile işlendi.'); // özel veya imzalı URL'yi loglama
        return resimElementi.src.startsWith('https://') ? resimElementi.src : null; // https ise URL'i döndür
    }

    const orijinalSrc = resimElementi.src; // orijinal URL'i sakla (fallback için)
    const maksGenislik = 800; // max piksel genişlik (storage tasarrufu)

    try {
        // Resim henüz yüklenmediyse bekle
        if (!resimElementi.complete) { // yüklenmemiş resim
            await resimOlayiniBekle(resimElementi, 'load', 'error', TEK_RESIM_TIMEOUT); // mevcut handler'ları ezmeden yüklenmeyi bekle
        }

        if (resimElementi.naturalWidth === 0) { // geçersiz resim (0 piksel)
            return orijinalSrc.startsWith('https://') ? orijinalSrc : null; // https ise URL'i döndür
        }

        let genislik = resimElementi.naturalWidth; // orijinal genişlik
        let yukseklik = resimElementi.naturalHeight; // orijinal yükseklik

        // Çok büyük resimleri küçült (storage ve performans için)
        if (genislik > maksGenislik) { // max genişlikten büyükse
            const oran = maksGenislik / genislik; // küçültme oranı
            genislik = maksGenislik; // yeni genişlik
            yukseklik = Math.round(yukseklik * oran); // oranla yeni yükseklik
        }

        const canvas = document.createElement('canvas'); // geçici canvas
        canvas.width = genislik; // canvas genişliği
        canvas.height = yukseklik; // canvas yüksekliği
        const ctx = canvas.getContext('2d'); // 2D çizim bağlamı
        if (!ctx) throw new Error('Canvas çizim bağlamı oluşturulamadı.'); // kapalı/bozuk canvas durumunu fallback'e taşı
        ctx.drawImage(resimElementi, 0, 0, genislik, yukseklik); // resmi canvas'a çiz
        return canvas.toDataURL('image/jpeg', 0.92); // JPEG %92 kaliteyle base64'e çevir
    } catch (canvasHata) { // canvas tainted hatası (cross-origin resim)
        if (resimDeadlineDoldu()) return orijinalSrc.startsWith('https://') ? orijinalSrc : null; // deadline doldu
        try {
            // Fetch için timeout wrapper — takılı kalmayı önle
            const kontrolci = new AbortController(); // fetch iptal
            const timeoutId = setTimeout(() => kontrolci.abort(), TEK_RESIM_TIMEOUT); // timeout
            let yanit; // fetch yanıtı
            try { // timeout'un her durumda temizlenmesini garanti et
                yanit = await fetch(orijinalSrc, { signal: kontrolci.signal, credentials: 'omit', referrerPolicy: 'no-referrer' }); // kimlik bilgisi veya sayfa adresi taşımadan signal'lı fetch
            } finally { // başarılı veya hatalı fetch sonrası
                clearTimeout(timeoutId); // timeout iptal
            }
            if (!yanit.ok) throw new Error('Resim isteği başarısız: HTTP ' + yanit.status); // HTML hata sayfasını resim diye alma
            const blob = await yanit.blob(); // blob olarak al
            if (!/^image\/(png|jpeg|jpg|gif|webp)$/i.test(blob.type || '')) throw new Error('Yanıt güvenli bir raster resim değil.'); // içerik türünü doğrula
            return await new Promise((coz, reddet) => { // FileReader ile base64'e çevir
                const okuyucu = new FileReader(); // dosya okuyucu
                okuyucu.addEventListener('load', () => coz(okuyucu.result), { once: true }); // okuma bitince döndür
                okuyucu.addEventListener('error', () => reddet(new Error('Resim verisi okunamadı.')), { once: true }); // hata
                okuyucu.readAsDataURL(blob); // blob'u data URL'e çevir
            });
        } catch (fetchHata) { // fetch de başarısız olduysa
            // Son çare: https URL ise direkt döndür (yazdırma sayfasında <img> yükleyebilir)
            if (orijinalSrc.startsWith('https://')) { // güvenli URL ise
                return orijinalSrc; // orijinal URL'i döndür
            }
            return null; // null döndür (resim atlanacak)
        }
    }
}

// Element klonlayıp içindeki resimleri base64'e çevirerek HTML döndürür
async function resimliHtmlCikar(element) {
    if (!element) return ''; // element yoksa boş döndür

    const orijinalResimler = element.querySelectorAll('img'); // sayfadaki gerçek resimler
    if (orijinalResimler.length === 0) return element.innerHTML; // resim yoksa direkt innerHTML

    const kopya = element.cloneNode(true); // orijinali bozmamak için klonla
    const kopyaResimler = kopya.querySelectorAll('img'); // klondaki resimler

    for (let i = 0; i < orijinalResimler.length; i++) { // her resmi işle
        if (resimDeadlineDoldu()) { // deadline dolmuşsa kalan resimleri atla
            if (kopyaResimler[i]) kopyaResimler[i].remove(); // klondan çıkar
            continue;
        }
        const base64 = await resmiBase64Yap(orijinalResimler[i]); // orijinalden base64 üret
        if (base64 && kopyaResimler[i]) { // dönüşüm başarılıysa
            kopyaResimler[i].src = base64; // klondaki resmin kaynağını güncelle
        } else if (kopyaResimler[i]) { // dönüşüm başarısızsa
            kopyaResimler[i].remove(); // dönüştürülemeyen resmi kaldır
        }
    }

    return kopya.innerHTML; // base64 resimli HTML döndür
}

// Bir element UI bileşeni (buton/ikon) içinde mi — UI görselleri içerik resmi DEĞİLDİR
function uiElementiIcindeMi(element) {
    return !!(element.closest && element.closest('button, [role="button"], mat-icon')); // beğen/kopyala ikonları, buton görselleri
}

// Turn/container elementinde kaynak element dışında kalan resimleri toplar (img + background-image)
async function turnResimleriniTopla(turn, kaynakElement) {
    const resimler = []; // ekstra resim dizisi
    const eklenenKaynaklar = new Set(); // aynı görselin img ve background kanallarından iki kez eklenmesini önle

    // Tekilleştirilmiş resmi sonuç listesine ekler
    const resimEkle = (kaynak, alt) => {
        if (!kaynak || eklenenKaynaklar.has(kaynak)) return; // boş veya mükerrer kaynağı atla
        eklenenKaynaklar.add(kaynak); // kaynağı işlendi olarak işaretle
        resimler.push({ src: kaynak, alt: alt || '' }); // sonucu ekle
    };

    // 1. Standart <img> etiketlerini ara
    const turnResimleri = turn.querySelectorAll('img'); // turn'deki tüm resimler

    for (const resim of turnResimleri) { // her resmi kontrol et
        if (kaynakElement && kaynakElement.contains(resim)) continue; // kaynak element içindeyse atla (zaten yakalandı)
        if (uiElementiIcindeMi(resim)) continue; // buton/ikon içindeki görsel — çıktıya alma
        if (resimDeadlineDoldu()) break; // deadline dolmuşsa döngüyü kır
        const base64 = await resmiBase64Yap(resim); // base64'e çevir
        if (base64) { // dönüşüm başarılıysa
            resimEkle(base64, resim.alt || ''); // resim verisini tekilleştirerek ekle
        }
    }

    // 2. CSS background-image ile render edilen resimleri ara
    if (!resimDeadlineDoldu()) { // deadline dolmadıysa bg image taraması yap
        const tumElementler = turn.querySelectorAll('*'); // turn'deki tüm elementler
        for (const element of tumElementler) { // her elementi kontrol et
            if (kaynakElement && kaynakElement.contains(element)) continue; // kaynak element içindeyse atla
            if (uiElementiIcindeMi(element)) continue; // buton/ikon arka plan görseli (hover sprite vb.) — çıktıya alma
            if (resimDeadlineDoldu()) break; // deadline dolmuşsa döngüyü kır
            const stil = window.getComputedStyle(element); // hesaplanmış stil
            const arkaplanResim = stil.backgroundImage; // background-image değeri
            if (arkaplanResim && arkaplanResim !== 'none' && arkaplanResim.startsWith('url(')) { // URL varsa
                const urlEslesmesi = arkaplanResim.match(/url\(["']?(.+?)["']?\)/); // URL'i çıkar
                if (urlEslesmesi && urlEslesmesi[1]) { // URL bulunduysa
                    const resimUrl = urlEslesmesi[1]; // çıkarılan URL
                    if (guvenliRasterDataUriMi(resimUrl) || resimUrl.startsWith('https://') || resimUrl.startsWith('blob:')) { // geçerli URL
                        // background-image'ı geçici img element ile dönüştür
                        const geciciResim = new Image(); // geçici img oluştur
                        geciciResim.crossOrigin = 'anonymous'; // CORS için
                        geciciResim.referrerPolicy = 'no-referrer'; // kaynak konuşma adresini uzak sunucuya taşıma
                        try {
                            const yukleme = resimOlayiniBekle(geciciResim, 'load', 'error', TEK_RESIM_TIMEOUT); // handler atamadan önce dinleyicileri kur
                            geciciResim.src = resimUrl; // dinleyiciler hazırken kaynağı ayarla
                            await yukleme; // yüklenmesini bekle
                            const base64 = await resmiBase64Yap(geciciResim); // base64'e çevir
                            if (base64) resimEkle(base64, ''); // tekilleştirerek ekle
                        } catch (resimHata) { // yükleme başarısız
                            if (resimUrl.startsWith('https://')) { // https ise direkt ekle
                                resimEkle(resimUrl, ''); // tekilleştirerek ham URL ekle
                            }
                        }
                    }
                }
            }
        }
    }

    return resimler; // ekstra resim dizisi döndür
}
