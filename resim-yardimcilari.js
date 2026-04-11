// AI Chat Printer - Ortak Resim Yardımcıları
// Gemini, Claude ve ChatGPT content script'leri tarafından paylaşılır
// MV3 content script array'inde ilk sırada yüklenir, diğer script'lere global olarak görünür

// Tek bir resmi base64 data URL'e dönüştürür (canvas + fetch + URL fallback)
async function resmiBase64Yap(resimElementi) {
    if (!resimElementi || !resimElementi.src) return null; // kaynak yoksa çık
    if (resimElementi.src.startsWith('data:')) return resimElementi.src; // zaten base64 ise aynen döndür

    const orijinalSrc = resimElementi.src; // orijinal URL'i sakla (fallback için)
    const maksGenislik = 800; // max piksel genişlik (storage tasarrufu)

    console.log('AI Chat Printer [DEBUG]: Resim dönüştürülüyor, src:', orijinalSrc.substring(0, 80)); // debug

    try {
        // Resim henüz yüklenmediyse bekle
        if (!resimElementi.complete) { // yüklenmemiş resim
            await new Promise((coz, reddet) => { // yüklenme promise'i
                resimElementi.onload = coz; // yüklenince çöz
                resimElementi.onerror = reddet; // hata olursa reddet
                setTimeout(reddet, 5000); // 5sn timeout
            });
        }

        if (resimElementi.naturalWidth === 0) { // geçersiz resim (0 piksel)
            console.log('AI Chat Printer [DEBUG]: Resim naturalWidth=0, atlanıyor'); // debug
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
        ctx.drawImage(resimElementi, 0, 0, genislik, yukseklik); // resmi canvas'a çiz
        const sonuc = canvas.toDataURL('image/jpeg', 0.92); // JPEG %92 kaliteyle base64'e çevir
        console.log('AI Chat Printer [DEBUG]: Canvas dönüşümü başarılı, boyut:', sonuc.length); // debug
        return sonuc;
    } catch (canvasHata) { // canvas tainted hatası (cross-origin resim)
        console.log('AI Chat Printer [DEBUG]: Canvas hatası:', canvasHata.message); // debug
        try {
            const yanit = await fetch(orijinalSrc); // resmi fetch ile indir
            const blob = await yanit.blob(); // blob olarak al
            const sonuc = await new Promise((coz) => { // FileReader ile base64'e çevir
                const okuyucu = new FileReader(); // dosya okuyucu
                okuyucu.onloadend = () => coz(okuyucu.result); // okuma bitince döndür
                okuyucu.readAsDataURL(blob); // blob'u data URL'e çevir
            });
            console.log('AI Chat Printer [DEBUG]: Fetch dönüşümü başarılı, boyut:', sonuc.length); // debug
            return sonuc;
        } catch (fetchHata) { // fetch de başarısız olduysa
            console.log('AI Chat Printer [DEBUG]: Fetch hatası:', fetchHata.message); // debug
            // Son çare: https URL ise direkt döndür (yazdırma sayfasında <img> yükleyebilir)
            if (orijinalSrc.startsWith('https://')) { // güvenli URL ise
                console.log('AI Chat Printer [DEBUG]: HTTPS URL fallback kullanılıyor'); // debug
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
        const base64 = await resmiBase64Yap(orijinalResimler[i]); // orijinalden base64 üret
        if (base64 && kopyaResimler[i]) { // dönüşüm başarılıysa
            kopyaResimler[i].src = base64; // klondaki resmin kaynağını güncelle
        } else if (kopyaResimler[i]) { // dönüşüm başarısızsa
            kopyaResimler[i].remove(); // dönüştürülemeyen resmi kaldır
        }
    }

    return kopya.innerHTML; // base64 resimli HTML döndür
}

// Turn/container elementinde kaynak element dışında kalan resimleri toplar (img + background-image)
async function turnResimleriniTopla(turn, kaynakElement) {
    const resimler = []; // ekstra resim dizisi

    // 1. Standart <img> etiketlerini ara
    const turnResimleri = turn.querySelectorAll('img'); // turn'deki tüm resimler
    console.log('AI Chat Printer [DEBUG]: Turn içi toplam <img> sayısı:', turnResimleri.length); // debug

    for (const resim of turnResimleri) { // her resmi kontrol et
        if (kaynakElement && kaynakElement.contains(resim)) continue; // kaynak element içindeyse atla (zaten yakalandı)
        console.log('AI Chat Printer [DEBUG]: Ekstra <img> bulundu, src:', resim.src?.substring(0, 80)); // debug

        const base64 = await resmiBase64Yap(resim); // base64'e çevir
        if (base64) { // dönüşüm başarılıysa
            resimler.push({ src: base64, alt: resim.alt || '' }); // resim verisini ekle
        }
    }

    // 2. CSS background-image ile render edilen resimleri ara
    const tumElementler = turn.querySelectorAll('*'); // turn'deki tüm elementler
    for (const element of tumElementler) { // her elementi kontrol et
        if (kaynakElement && kaynakElement.contains(element)) continue; // kaynak element içindeyse atla
        const stil = window.getComputedStyle(element); // hesaplanmış stil
        const arkaplanResim = stil.backgroundImage; // background-image değeri
        if (arkaplanResim && arkaplanResim !== 'none' && arkaplanResim.startsWith('url(')) { // URL varsa
            const urlEslesmesi = arkaplanResim.match(/url\(["']?(.+?)["']?\)/); // URL'i çıkar
            if (urlEslesmesi && urlEslesmesi[1]) { // URL bulunduysa
                const resimUrl = urlEslesmesi[1]; // çıkarılan URL
                if (resimUrl.startsWith('data:') || resimUrl.startsWith('https://') || resimUrl.startsWith('blob:')) { // geçerli URL
                    console.log('AI Chat Printer [DEBUG]: CSS background-image bulundu:', resimUrl.substring(0, 80)); // debug
                    // background-image'ı geçici img element ile dönüştür
                    const geciciResim = new Image(); // geçici img oluştur
                    geciciResim.crossOrigin = 'anonymous'; // CORS için
                    geciciResim.src = resimUrl; // kaynak ayarla
                    try {
                        await new Promise((coz, reddet) => { // yüklenmesini bekle
                            geciciResim.onload = coz;
                            geciciResim.onerror = reddet;
                            setTimeout(reddet, 5000);
                        });
                        const base64 = await resmiBase64Yap(geciciResim); // base64'e çevir
                        if (base64) resimler.push({ src: base64, alt: '' }); // ekle
                    } catch (resimHata) { // yükleme başarısız
                        if (resimUrl.startsWith('https://')) { // https ise direkt ekle
                            resimler.push({ src: resimUrl, alt: '' });
                        }
                    }
                }
            }
        }
    }

    console.log('AI Chat Printer [DEBUG]: Toplam ekstra resim:', resimler.length); // debug
    return resimler; // ekstra resim dizisi döndür
}
