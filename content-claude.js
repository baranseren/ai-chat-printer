// AI Chat Printer - Claude Content Script
// Claude.ai sayfasına yazdır butonu enjekte eder ve konuşma içeriğini çıkarır

// Buton zaten enjekte edildi mi kontrolü
let butonEnjekteEdildi = false; // tekrar enjekte etmeyi önle

// Sayfa yüklendiğinde ve navigasyon değişikliklerinde butonu enjekte et
function baslat() {
    butonuEnjekteEt(); // ilk deneme
    // Claude SPA olduğu için URL ve DOM değişikliklerini izle
    const gozlemci = new MutationObserver(() => { // DOM değişikliklerini izle
        if (!document.querySelector('#claude-printer-buton')) { // buton kaybolmuşsa
            butonEnjekteEdildi = false; // tekrar enjekte edilebilir
            butonuEnjekteEt(); // butonu yeniden ekle
        }
    });
    gozlemci.observe(document.body, { childList: true, subtree: true }); // body'deki değişiklikleri izle
}

// Yazdır butonunu Claude header'ına enjekte eder
function butonuEnjekteEt() {
    if (butonEnjekteEdildi) return; // zaten enjekte edildiyse çık

    // Sayfa header'ını bul
    const header = document.querySelector('[data-testid="page-header"]'); // üst çubuk
    if (!header) { // header henüz yüklenmediyse
        setTimeout(butonuEnjekteEt, 1000); // 1 saniye sonra tekrar dene
        return;
    }

    // Zaten varsa ekleme
    if (document.querySelector('#claude-printer-buton')) return; // tekrar kontrol

    // Header'daki içerik div'ini bul (flex items-center justify-between)
    const icerikDiv = header.querySelector('.flex.w-full.items-center.justify-between'); // butonlar alanı
    if (!icerikDiv) { // alan bulunamadıysa
        setTimeout(butonuEnjekteEt, 1000); // tekrar dene
        return;
    }

    // Yazdır butonu
    const yazdirButonu = document.createElement('button'); // buton elementi
    yazdirButonu.id = 'claude-printer-buton'; // benzersiz id
    yazdirButonu.title = 'Konuşmayı Yazdır (AI Chat Printer)'; // tooltip
    yazdirButonu.setAttribute('aria-label', 'Konuşmayı Yazdır'); // erişilebilirlik
    yazdirButonu.style.cssText = [ // Claude buton stiline uyumlu
        'width:36px',
        'height:36px',
        'border-radius:8px',
        'border:none',
        'background:transparent',
        'cursor:pointer',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'transition:background 0.2s',
        'padding:0',
        'position:relative',
        'margin-right:4px'
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
    svg.style.color = '#6b7280'; // Claude'un gri ikon rengi

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
        svg.style.color = '#d97706'; // Claude turuncu/amber rengi
    });
    yazdirButonu.addEventListener('mouseleave', () => { // fare çıkınca
        yazdirButonu.style.background = 'transparent'; // şeffaf geri dön
        svg.style.color = '#6b7280'; // gri renk geri dön
    });

    // Tıklama olayı
    yazdirButonu.addEventListener('click', yazdirmaBaslat); // yazdırma işlemini başlat

    // Share butonunun soluna ekle (Share absolute positioned, z-20 — aynı container'a eklenmeli)
    const shareButonu = Array.from(document.querySelectorAll('button')).find( // Share butonunu bul
        (b) => b.textContent?.trim() === 'Share'
    );
    if (shareButonu && shareButonu.parentElement) { // Share butonu bulunduysa
        shareButonu.parentElement.insertBefore(yazdirButonu, shareButonu); // Share'den önce ekle
    } else { // Share bulunamazsa NotebookLM'nin yanına ekle
        const notebookBtn = document.querySelector('#archive-button'); // NotebookLM butonu
        if (notebookBtn && notebookBtn.parentElement) { // bulunduysa
            notebookBtn.parentElement.insertBefore(yazdirButonu, notebookBtn); // önüne ekle
        } else { // hiçbiri yoksa header'a ekle
            icerikDiv.appendChild(yazdirButonu);
        }
    }

    butonEnjekteEdildi = true; // enjekte edildi olarak işaretle
}

// Yazdırma işlemini başlatır
async function yazdirmaBaslat() {
    // Önce artifact içeriklerini çıkar (async — her birini açıp kapatır)
    const artifactSayisi = document.querySelectorAll('.artifact-block-cell').length; // sayfadaki artifact sayısı
    if (artifactSayisi > 0) { // artifact varsa
        uyariBalonuGoster(artifactSayisi + ' artifact içeriği çıkarılıyor...', 'basari'); // bilgi mesajı
    }
    const artifactIcerikleri = await artifactIcerikleriniCikar(); // artifact içeriklerini topla

    // Konuşma verisini çıkar (artifact içerikleriyle birlikte)
    const veri = konusmayiCikar(artifactIcerikleri); // konuşma verisini çıkar

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
        console.error('Claude Printer: chrome.storage erişim hatası:', storageHata.message); // debug
        return;
    }

    uyariBalonuGoster(veri.mesajSayisi + ' mesaj çıkarıldı. Yazdırma sayfası açılıyor...', 'basari'); // başarı mesajı

    // Yazdırma sayfasını aç
    chrome.runtime.sendMessage({ islem: 'yazdirmaSayfasiAc' }); // background'a mesaj gönder
}

// Sayfadaki tüm artifact bloklarının içeriklerini tıkla-aç-çıkar-kapat döngüsüyle toplar
async function artifactIcerikleriniCikar() {
    const kartlar = document.querySelectorAll('.artifact-block-cell'); // tüm artifact kartları
    if (kartlar.length === 0) return []; // artifact yoksa boş dön

    const icerikleri = []; // çıkarılan içerikler

    for (const kart of kartlar) { // her artifact kartını işle
        // Başlık: .line-clamp-1 div'lerden al (ilki başlık, ikincisi tür)
        const baslikEl = kart.querySelector('.leading-tight.line-clamp-1'); // başlık div'i
        const turEl = kart.querySelector('.text-text-400.line-clamp-1'); // tür div'i
        let baslik = baslikEl?.textContent?.trim() || ''; // artifact başlığı
        let tur = turEl?.textContent?.trim() || ''; // artifact türü (Document · MD vs.)

        // Tıklanabilir parent'ı bul (role="button")
        const tiklanabilir = kart.closest('[role="button"]'); // tıklanabilir kart
        if (!tiklanabilir) { // bulunamazsa sadece başlık ile ekle
            icerikleri.push({ baslik: baslik, tur: tur, icerik: null });
            continue;
        }

        // Artifact viewer'ı aç
        tiklanabilir.click(); // karta tıkla

        // Viewer panelinin açılmasını bekle (max 3 saniye)
        let viewerAcildi = false; // viewer açılma durumu
        for (let bekle = 0; bekle < 6; bekle++) { // 6 deneme x 500ms = 3sn
            await new Promise((coz) => setTimeout(coz, 500)); // 500ms bekle
            if (document.querySelector('#wiggle-file-content')) { // panel DOM'a eklendiyse
                viewerAcildi = true; // açıldı
                break;
            }
        }

        if (!viewerAcildi) { // viewer açılamadıysa
            icerikleri.push({ baslik: baslik, tur: tur, icerik: null }); // boş ekle
            continue; // sonraki artifact'a geç
        }

        // Viewer açıldı — içeriğin tam yüklenmesini bekle (max 8 saniye)
        await new Promise((coz) => setTimeout(coz, 1000)); // panel açıldıktan sonra 1sn ekstra bekle

        let icerik = null; // çıkarılacak içerik
        let oncekiUzunluk = 0; // önceki içerik uzunluğu (stabilite kontrolü)
        let stabilSayac = 0; // içerik uzunluğu kaç kez aynı kaldı

        for (let deneme = 0; deneme < 16; deneme++) { // 16 deneme x 500ms = 8sn
            await new Promise((coz) => setTimeout(coz, 500)); // 500ms bekle
            const kodBlok = document.querySelector('#wiggle-file-content .code-block__code'); // kod bloğu
            const markdownBlok = document.querySelector('#wiggle-file-content .standard-markdown'); // markdown bloğu
            const hedef = kodBlok || markdownBlok; // hangisi varsa onu al

            if (hedef && hedef.textContent?.length > 0) { // içerik varsa
                const mevcutUzunluk = hedef.textContent.length; // mevcut uzunluk

                if (mevcutUzunluk === oncekiUzunluk && mevcutUzunluk > 10) { // uzunluk değişmiyorsa ve anlamlı boyuttaysa
                    stabilSayac++; // stabilite sayacını artır
                    if (stabilSayac >= 2) { // 2 ardışık kontrol aynıysa içerik tamamen yüklendi
                        icerik = hedef.textContent; // kesin içeriği al
                        break; // döngüden çık
                    }
                } else { // uzunluk hala değişiyor — yüklenmeye devam ediyor
                    stabilSayac = 0; // sayacı sıfırla
                }
                oncekiUzunluk = mevcutUzunluk; // önceki uzunluğu güncelle
            }
        }

        // Son kontrol — eğer stabilite sağlanamadıysa mevcut içeriği al
        if (!icerik) { // stabilite kontrolü geçemediyse
            const sonHedef = document.querySelector('#wiggle-file-content .code-block__code') || document.querySelector('#wiggle-file-content .standard-markdown'); // son deneme
            if (sonHedef && sonHedef.textContent?.length > 10) { // en az 10 karakter varsa
                icerik = sonHedef.textContent; // ne varsa al
            }
        }

        // Viewer'ı kapat
        const kapatButonu = document.querySelector('button[aria-label="Close"]'); // kapat butonu
        if (kapatButonu) { // buton bulunduysa
            kapatButonu.click(); // kapat
        }
        await new Promise((coz) => setTimeout(coz, 600)); // kapanma animasyonu için bekle

        // Viewer'ın gerçekten kapandığını doğrula
        for (let kontrol = 0; kontrol < 6; kontrol++) { // 6 deneme x 300ms = 1.8sn
            if (!document.querySelector('#wiggle-file-content')) break; // panel kapandıysa çık
            await new Promise((coz) => setTimeout(coz, 300)); // 300ms bekle
        }

        icerikleri.push({ baslik: baslik, tur: tur, icerik: icerik }); // sonucu ekle
    }

    return icerikleri; // tüm artifact içerikleri
}

// Sayfa içi uyarı balonu gösterir (toast notification)
function uyariBalonuGoster(mesaj, tip) {
    // Önceki balonu kaldır
    const eskiBalon = document.querySelector('#claude-printer-uyari'); // eski uyarı
    if (eskiBalon) eskiBalon.remove(); // varsa sil

    const balon = document.createElement('div'); // balon oluştur
    balon.id = 'claude-printer-uyari'; // benzersiz id
    const arkaRenk = tip === 'hata' ? '#dc2626' : '#d97706'; // hata: kırmızı, başarı: amber
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
        'animation:claudePrinterFadeIn 0.3s ease'
    ].join(';');
    balon.textContent = mesaj; // mesaj metni

    // Animasyon CSS ekle (bir kez)
    if (!document.querySelector('#claude-printer-stil')) { // stil yoksa
        const stil = document.createElement('style'); // style elementi
        stil.id = 'claude-printer-stil'; // benzersiz id
        stil.textContent = '@keyframes claudePrinterFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}'; // fade-in animasyonu
        document.head.appendChild(stil); // head'e ekle
    }

    document.body.appendChild(balon); // balonu sayfaya ekle
    setTimeout(() => { // 3 saniye sonra
        balon.style.opacity = '0'; // saydam yap
        balon.style.transition = 'opacity 0.3s'; // geçiş animasyonu
        setTimeout(() => balon.remove(), 300); // animasyon bitince sil
    }, 3000);
}

// Claude.ai sayfasından konuşma verilerini çıkarır
function konusmayiCikar(artifactIcerikleri) {
    const mesajlar = []; // tüm mesajları tutacak dizi
    const artifactListesi = artifactIcerikleri || []; // önceden çıkarılmış artifact içerikleri
    let artifactSayaci = 0; // hangi artifact'a geldiğimizi takip eder

    // Ana konuşma container'ını bul
    const konusmaAlani = document.querySelector('.flex-1.flex.flex-col.px-4.max-w-3xl'); // mesajların bulunduğu alan
    if (!konusmaAlani) { // konuşma alanı bulunamadıysa
        return { hata: 'Konuşma bulunamadı. Bir Claude sohbeti açık olduğundan emin olun.', mesajlar: [] };
    }

    // Konuşma container'ının çocuklarını sırayla tara
    for (let i = 0; i < konusmaAlani.children.length; i++) { // her turn'ü işle
        const turn = konusmaAlani.children[i]; // mevcut turn

        // Ayırıcı div'leri atla (h-px separator)
        if ((turn.className || '').includes('h-px')) continue; // ayırıcıyı atla

        // Kullanıcı mesajı mı?
        const kullaniciEl = turn.querySelector('[data-testid="user-message"]'); // kullanıcı mesajı ara
        if (kullaniciEl) { // kullanıcı mesajı bulunduysa
            mesajlar.push({
                rol: 'kullanici', // mesaj rolü
                html: kullaniciEl.innerHTML, // HTML içerik
                metin: kullaniciEl.textContent?.trim() || '' // düz metin
            });
            continue; // sonraki turn'e geç
        }

        // Claude yanıtı mı?
        const claudeEl = turn.querySelector('[class*="font-claude-response"]'); // Claude yanıtı ara
        if (claudeEl) { // Claude yanıtı bulunduysa
            // Tüm standard-markdown bloklarını al (artifact + metin birden fazla olabilir)
            const markdownlar = claudeEl.querySelectorAll('.standard-markdown'); // tüm markdown blokları
            let birlesikHtml = ''; // tüm blokların HTML'i
            let birlesikMetin = ''; // tüm blokların metni

            if (markdownlar.length > 0) { // en az bir markdown bulunduysa
                markdownlar.forEach((markdownEl) => { // her bloğu birleştir
                    birlesikHtml += markdownEl.innerHTML; // HTML ekle
                    birlesikMetin += (birlesikMetin ? '\n\n' : '') + (markdownEl.textContent?.trim() || ''); // metin ekle
                });
            } else { // markdown bulunamadıysa tüm Claude yanıtını al
                birlesikHtml = claudeEl.innerHTML; // HTML içerik
                birlesikMetin = claudeEl.textContent?.trim() || ''; // düz metin
            }

            // Bu turn'deki artifact kartlarını bul ve içeriklerini mesaja ekle
            const turnArtifactlari = claudeEl.querySelectorAll('.artifact-block-cell'); // turn'deki artifactlar
            const mesajArtifactlari = []; // bu mesaja ait artifact listesi
            turnArtifactlari.forEach(() => { // her artifact kartı için
                if (artifactSayaci < artifactListesi.length) { // içerik listesinde karşılığı varsa
                    mesajArtifactlari.push(artifactListesi[artifactSayaci]); // artifact içeriğini ekle
                }
                artifactSayaci++; // sayacı ilerlet
            });

            mesajlar.push({
                rol: 'claude', // mesaj rolü
                html: birlesikHtml, // birleştirilmiş HTML içerik
                metin: birlesikMetin, // birleştirilmiş düz metin
                artifactlar: mesajArtifactlari.length > 0 ? mesajArtifactlari : undefined // artifact içerikleri
            });
        }
    }

    // Konuşma başlığını al
    const sayfaBasligi = document.title?.replace(' - Claude', '').trim() || 'Claude Konuşması'; // sayfa başlığından çıkar

    return {
        baslik: sayfaBasligi, // konuşma başlığı
        tarih: new Date().toLocaleDateString('tr-TR'), // bugünün tarihi
        saat: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), // şu anki saat
        mesajSayisi: mesajlar.length, // toplam mesaj sayısı
        mesajlar: mesajlar, // mesaj dizisi
        kaynak: 'claude' // hangi siteden geldiği
    };
}

// Popup'tan gelen mesajları da dinle (fallback)
chrome.runtime.onMessage.addListener((mesaj, gonderen, yanitGonder) => { // mesaj dinleyici
    if (mesaj.islem === 'konusmayiCikar') { // konuşma çıkarma isteği
        const veri = konusmayiCikar(); // konuşmayı çıkar
        yanitGonder(veri); // veriyi geri gönder
    }
    return true; // asenkron yanıt için true döndür
});

// Sayfa hazır olduğunda başlat
if (document.readyState === 'loading') { // sayfa yükleniyorsa
    document.addEventListener('DOMContentLoaded', baslat); // yüklendikten sonra başlat
} else { // sayfa zaten yüklendiyse
    baslat(); // hemen başlat
}
