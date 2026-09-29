// AI Chat Printer - Claude Content Script
// Claude.ai sayfasına yazdır butonu enjekte eder ve konuşma içeriğini çıkarır

// Buton zaten enjekte edildi mi kontrolü
let butonEnjekteEdildi = false; // tekrar enjekte etmeyi önle
let observerAktif = null; // MutationObserver referansı (artifact çıkarırken geçici disconnect için)
let artifactCikarmaAktif = false; // artifact çıkarma sırasında observer yeniden-enjeksiyonu baskılar
let yazdirmaIslemiSuruyor = false; // çift tıklama reentrance koruması — paralel artifact döngüsü viewer'ı çakıştırır

// Sayfa yüklendiğinde ve navigasyon değişikliklerinde butonu enjekte et
function baslat() {
    butonuEnjekteEt(); // ilk deneme
    // Claude SPA olduğu için URL ve DOM değişikliklerini izle — debounce ile CPU yükü düşür
    const butonuKontrolEt = debounce(() => { // 200ms debounce'lu kontrol
        if (artifactCikarmaAktif) return; // artifact çıkarma sırasında dokunma
        if (!document.querySelector('#claude-printer-buton')) { // buton kaybolmuşsa
            butonEnjekteEdildi = false; // tekrar enjekte edilebilir
            butonuEnjekteEt(); // butonu yeniden ekle
        }
    }, 200);
    observerAktif = new MutationObserver(butonuKontrolEt); // debounce'lu observer
    observerAktif.observe(document.body, { childList: true, subtree: true }); // body'deki değişiklikleri izle
    // Sayfa gizlenince observer'ı temizle (memory leak önleme)
    window.addEventListener('pagehide', () => observerAktif?.disconnect(), { once: true }); // pagehide event
    bekleyenYazdirmayiDevamEttir(yazdirmaBaslat); // bağlantı kurtarma reload'u varsa işlemi otomatik sürdür
}

// Yazdır butonunu Claude header'ına enjekte eder
function butonuEnjekteEt() {
    if (butonEnjekteEdildi) return; // zaten enjekte edildiyse çık

    // Sayfa header'ını bul (2026-07 UI: chat-header; eski UI: page-header)
    const header = document.querySelector('[data-testid="chat-header"]') || document.querySelector('[data-testid="page-header"]'); // üst çubuk
    if (!header) { // header henüz yüklenmediyse
        setTimeout(butonuEnjekteEt, 1000); // 1 saniye sonra tekrar dene
        return;
    }

    // Eski butonu sil (eklenti yeniden yüklenince ölü handler kalır)
    const eskiButon = document.querySelector('#claude-printer-buton'); // eski buton
    if (eskiButon) eskiButon.remove(); // sil ve yenisini oluştur

    // Header'daki aksiyon alanını bul (yeni UI: dframe-header-actions-slot; eski UI: flex justify-between)
    const icerikDiv = header.querySelector('#dframe-header-actions-slot') || header.querySelector('.flex.w-full.items-center.justify-between'); // butonlar alanı
    if (!icerikDiv) { // alan bulunamadıysa
        setTimeout(butonuEnjekteEt, 1000); // tekrar dene
        return;
    }

    // Yazdır butonu
    const yazdirButonu = document.createElement('button'); // buton elementi
    yazdirButonu.id = 'claude-printer-buton'; // benzersiz id
    yazdirButonu.type = 'button'; // form içine taşınsa bile submit davranışı üretme
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

    // Share butonunun soluna ekle (yeni UI: wiggle-controls-actions-share testid; eski UI: textContent)
    const shareButonu = document.querySelector('[data-testid="wiggle-controls-actions-share"]') || Array.from(document.querySelectorAll('button')).find( // Share butonunu bul
        (b) => b.textContent?.trim() === 'Share'
    );
    if (shareButonu && shareButonu.parentElement) { // Share butonu bulunduysa
        shareButonu.parentElement.insertBefore(yazdirButonu, shareButonu); // Share'den önce ekle
    } else { // Share bulunamazsa NotebookLM'nin yanına ekle
        const notebookBtn = document.querySelector('#archive-button'); // NotebookLM butonu
        if (notebookBtn && notebookBtn.parentElement) { // bulunduysa
            notebookBtn.parentElement.insertBefore(yazdirButonu, notebookBtn); // önüne ekle
        } else { // hiçbiri yoksa header aksiyon alanının başına ekle
            icerikDiv.insertBefore(yazdirButonu, icerikDiv.firstChild);
        }
    }

    butonEnjekteEdildi = true; // enjekte edildi olarak işaretle
}

// Yazdırma işlemini başlatır
async function yazdirmaBaslat() {
    // Streaming kontrol — Claude yanıt yazıyorsa uyar
    if (streamingMiKontrol('claude')) { // streaming aktifse
        uyariBalonuGoster('Claude henüz yanıt yazıyor. Tamamlanmasını bekleyin.', 'hata'); // uyarı
        return;
    }

    if (yazdirmaIslemiSuruyor) { // çift tıklama — paralel artifact tıkla-aç-kapat döngüsü viewer'ı çakıştırır
        uyariBalonuGoster('Yazdırma işlemi zaten sürüyor, lütfen bekleyin...', 'hata'); // bilgi
        return;
    }
    yazdirmaIslemiSuruyor = true; // akış kilidi

    resimIslemOturumuBaslat(RESIM_TOPLAM_SURE_LIMIT); // resim toplam süre limiti başlat

    try { // oturum bitirme garantisi
        // Önce artifact içeriklerini çıkar (async — her birini açıp kapatır)
        const artifactSayisi = document.querySelectorAll('.artifact-block-cell').length; // sayfadaki artifact sayısı
        if (artifactSayisi > 0) { // artifact varsa
            uyariBalonuGoster(artifactSayisi + ' artifact bulundu, içerikleri çıkarılıyor (0/' + artifactSayisi + ')...', 'basari'); // bilgi mesajı
        }
        const artifactIcerikleri = await artifactIcerikleriniCikar((mevcut, toplam) => { // progress callback
            uyariBalonuGoster('Artifact ' + mevcut + '/' + toplam + ' çıkarılıyor...', 'basari'); // ilerleme güncelle
        });

        uyariBalonuGoster('Konuşma çıkarılıyor, resimler işleniyor...', 'basari'); // çıkarma aşaması bildirimi

        // Konuşma verisini çıkar (artifact içerikleriyle birlikte, async — resim dönüşümü için)
        const veri = await konusmayiCikar(artifactIcerikleri); // konuşma verisini çıkar

        // Ortak yazdırma başlatıcıyı kullan (ayarlar kalıcı storage'dan okur)
        await yazdirmayaBasla(veri, uyariBalonuGoster); // ortak başlatma akışı
    } catch (cikarmaHata) { // çıkarma sırasında beklenmeyen hata
        uyariBalonuGoster('Konuşma çıkarılamadı: ' + cikarmaHata.message, 'hata'); // kullanıcıya bildir
        console.log('AI Chat Printer: Çıkarma hatası:', cikarmaHata); // sessiz log
    } finally { // işlem bitişinde oturum kapatılmalı
        yazdirmaIslemiSuruyor = false; // akış kilidini bırak
        resimIslemOturumuBitir(); // deadline'ı sıfırla
    }
}

// Açık Claude artifact viewer'ını kapatır ve DOM'dan kalktığını doğrular
async function artifactViewerKapat() {
    if (!document.querySelector('#wiggle-file-content')) return; // viewer açık değilse işlem yok
    const kapatButonu = document.querySelector('button[aria-label="Go back"]') || document.querySelector('button[aria-label="Close"]'); // yeni ve eski UI kapatma butonları
    if (kapatButonu) kapatButonu.click(); // bulunan kapatma eylemini uygula
    for (let kontrol = 0; kontrol < 8; kontrol++) { // 8 deneme x 250 ms = 2 saniye
        if (!document.querySelector('#wiggle-file-content')) return; // viewer kapandı
        await new Promise((coz) => setTimeout(coz, 250)); // animasyon/DOM güncellemesi
    }
}

// Sayfadaki tüm artifact bloklarının içeriklerini tıkla-aç-çıkar-kapat döngüsüyle toplar
// ilerlemeCallback(mevcut, toplam) — her artifact tamamlandığında çağrılır
async function artifactIcerikleriniCikar(ilerlemeCallback) {
    const kartlar = document.querySelectorAll('.artifact-block-cell'); // tüm artifact kartları
    if (kartlar.length === 0) return []; // artifact yoksa boş dön

    artifactCikarmaAktif = true; // observer'ı sustur — viewer açma-kapama race'ini önle
    const icerikleri = []; // çıkarılan içerikler
    const toplamArtifact = kartlar.length; // toplam artifact sayısı
    let mevcutIndex = 0; // işlenen artifact indeksi

    try { // hata olsa bile flag'i mutlaka resetle
    for (const kart of kartlar) { // her artifact kartını işle
        mevcutIndex++; // sayaç artır
        if (ilerlemeCallback) { // progress callback verilmişse
            try { ilerlemeCallback(mevcutIndex, toplamArtifact); } catch (e) {} // güvenli çağrı
        }
        // Başlık: .line-clamp-1 div'lerden al (ilki başlık, ikincisi tür)
        const baslikEl = kart.querySelector('.leading-tight.line-clamp-1'); // başlık div'i
        const turEl = kart.querySelector('.text-text-400.line-clamp-1'); // tür div'i
        let baslik = baslikEl?.textContent?.trim() || ''; // artifact başlığı
        let tur = turEl?.textContent?.trim() || ''; // artifact türü (Document · MD vs.)

        // Tıklanabilir hedefi bul (2026-07 UI: grup içi "View ..." overlay butonu; eski UI: role="button" parent)
        const kartGrubu = kart.closest('[class*="group/artifact-block"]'); // yeni kart sarmalayıcısı
        const viewButonu = kartGrubu ? kartGrubu.querySelector('button[aria-label^="View"]') : null; // yeni overlay aç butonu
        const tiklanabilir = viewButonu || kart.closest('[role="button"]') || kartGrubu; // fallback zinciri
        if (!tiklanabilir) { // hiçbir tıklama hedefi yoksa sadece başlık ile ekle
            icerikleri.push({ baslik: baslik, tur: tur, icerik: null });
            continue;
        }

        let icerik = null; // hata veya timeout durumunda null korunur
        try { // her kartın viewer yaşam döngüsünü kendi içinde kapat
            tiklanabilir.click(); // artifact viewer'ını aç

            let viewerAcildi = false; // viewer açılma durumu
            for (let bekle = 0; bekle < 8; bekle++) { // 8 deneme x 400 ms = 3,2 saniye
                await new Promise((coz) => setTimeout(coz, 400)); // DOM güncellemesini bekle
                if (document.querySelector('#wiggle-file-content')) { // panel DOM'a eklendiyse
                    viewerAcildi = true; // açıldı
                    break;
                }
            }

            if (viewerAcildi) { // panel gerçekten açıldıysa içeriği oku
                await new Promise((coz) => setTimeout(coz, 800)); // ilk render için kısa hazırlık
                let oncekiUzunluk = 0; // önceki içerik uzunluğu
                let stabilSayac = 0; // ardışık stabil ölçüm sayısı

                for (let deneme = 0; deneme < 18; deneme++) { // 18 deneme x 400 ms = 7,2 saniye
                    await new Promise((coz) => setTimeout(coz, 400)); // streaming içeriğini bekle
                    const hedef = document.querySelector('#wiggle-file-content .code-block__code') || document.querySelector('#wiggle-file-content pre') || document.querySelector('#wiggle-file-content .standard-markdown') || document.querySelector('#wiggle-file-content'); // güvenilir içerik zinciri
                    const mevcutMetin = hedef?.textContent || ''; // mevcut metin
                    const mevcutUzunluk = mevcutMetin.length; // stabilite metriği
                    if (mevcutUzunluk > 10 && mevcutUzunluk === oncekiUzunluk) { // anlamlı ve değişmeyen içerik
                        stabilSayac++; // stabil sayacı
                        if (stabilSayac >= 2) { // iki ardışık eşit ölçüm
                            icerik = mevcutMetin; // tam içeriği al
                            break; // polling tamamlandı
                        }
                    } else { // içerik hâlâ değişiyor
                        stabilSayac = 0; // sayacı sıfırla
                    }
                    oncekiUzunluk = mevcutUzunluk; // sonraki ölçüm tabanı
                }

                if (!icerik) { // stabilite zaman aşımında son anlamlı içeriği koru
                    const sonHedef = document.querySelector('#wiggle-file-content .code-block__code') || document.querySelector('#wiggle-file-content pre') || document.querySelector('#wiggle-file-content .standard-markdown') || document.querySelector('#wiggle-file-content'); // son hedef
                    if ((sonHedef?.textContent || '').length > 10) icerik = sonHedef.textContent; // mevcut içeriği al
                }
            }
        } catch (artifactHata) { // tek kart hatası kalan artifact'ları engellemez
            console.log('AI Chat Printer: Artifact çıkarma hatası:', artifactHata.message); // konuşma içeriği olmadan yapısal log
        } finally { // geç açılan veya hata sırasında açık kalan viewer mutlaka kapatılır
            await artifactViewerKapat(); // kapanışı doğrula
        }

        icerikleri.push({ baslik: baslik, tur: tur, icerik: icerik }); // kart için tek sonuç ekle
    }
    } finally { // hata olsa bile observer'ı tekrar aktif et
        artifactCikarmaAktif = false; // observer tekrar aktif
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
        stil.textContent = '@keyframes claudePrinterFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}#claude-printer-buton:focus-visible{outline:3px solid rgba(217,119,6,.4)!important;outline-offset:3px!important}@media(prefers-reduced-motion:reduce){#claude-printer-buton,#claude-printer-uyari{animation:none!important;transition:none!important}}'; // animasyon + görünür klavye odağı
        document.head.appendChild(stil); // head'e ekle
    }

    document.body.appendChild(balon); // balonu sayfaya ekle
    setTimeout(() => { // 3 saniye sonra
        balon.style.opacity = '0'; // saydam yap
        balon.style.transition = 'opacity 0.3s'; // geçiş animasyonu
        setTimeout(() => balon.remove(), 300); // animasyon bitince sil
    }, 3000);
}

// Claude.ai sayfasından konuşma verilerini çıkarır (async — resim base64 dönüşümü için)
async function konusmayiCikar(artifactIcerikleri) {
    const mesajlar = []; // tüm mesajları tutacak dizi
    const artifactListesi = artifactIcerikleri || []; // önceden çıkarılmış artifact içerikleri
    let artifactSayaci = 0; // hangi artifact'a geldiğimizi takip eder

    // Ana konuşma container'ını bul
    const konusmaAlani = document.querySelector('.flex-1.flex.flex-col.px-4.max-w-3xl'); // mesajların bulunduğu alan
    if (!konusmaAlani) { // konuşma alanı bulunamadıysa
        return { hata: 'Konuşma bulunamadı. Bir Claude sohbeti açık olduğundan emin olun.', mesajlar: [] };
    }

    // Mesajları belge sırasıyla topla (2026-07 UI: tüm konuşma tek children[0] ağacında — turn döngüsü çalışmaz)
    // querySelectorAll document-order garantilidir; eski turn-bazlı DOM'da da aynı sırayı verir
    const mesajElemanlari = konusmaAlani.querySelectorAll('[data-testid="user-message"], .font-claude-response'); // kullanıcı + Claude akışı
    for (const eleman of mesajElemanlari) { // her mesaj elemanını işle
        // İç içe eşleşme koruması — bir mesajın içindeki ikinci eşleşmeyi atla
        if (eleman.parentElement?.closest('[data-testid="user-message"], .font-claude-response')) continue; // nested guard

        // Kullanıcı mesajı mı?
        if (eleman.getAttribute('data-testid') === 'user-message') { // kullanıcı mesajı
            const htmlIcerik = await resimliHtmlCikar(eleman); // resimleri base64'e çevirip HTML çıkar
            const ekstraResimler = await turnResimleriniTopla(eleman.parentElement || eleman, eleman); // mesaj çevresindeki ekstra resimleri topla
            mesajlar.push({
                rol: 'kullanici', // mesaj rolü
                html: htmlIcerik, // base64 resimli HTML içerik
                metin: temizMetinCikar(eleman), // UI sızıntısız düz metin
                resimler: ekstraResimler // kullanıcı eki resimleri
            });
            continue; // sonraki elemana geç
        }

        // Claude yanıtı
        const claudeEl = eleman; // yanıt kök elementi
        // Tüm standard-markdown bloklarını al (artifact + metin birden fazla olabilir)
        const markdownlar = claudeEl.querySelectorAll('.standard-markdown'); // tüm markdown blokları
        let birlesikHtml = ''; // tüm blokların HTML'i
        let birlesikMetin = ''; // tüm blokların metni

        if (markdownlar.length > 0) { // en az bir markdown bulunduysa
            for (const markdownEl of markdownlar) { // her bloğu birleştir (async — resim dönüşümü için)
                birlesikHtml += await resimliHtmlCikar(markdownEl); // resimli HTML ekle
                birlesikMetin += (birlesikMetin ? '\n\n' : '') + temizMetinCikar(markdownEl); // UI sızıntısız metin ekle
            }
        } else { // markdown bulunamadıysa tüm Claude yanıtını al
            birlesikHtml = await resimliHtmlCikar(claudeEl); // resimli HTML içerik
            birlesikMetin = temizMetinCikar(claudeEl); // UI sızıntısız düz metin
        }

        // Bu yanıttaki artifact kartlarını bul ve içeriklerini mesaja ekle
        const turnArtifactlari = claudeEl.querySelectorAll('.artifact-block-cell'); // yanıttaki artifactlar
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

    // Konuşma başlığını al — 2026-07 UI: chat-title-split; eski UI: sidebar aktif link; son çare: document.title
    const baslikSplitEl = document.querySelector('[data-testid="chat-title-split"]'); // header'daki başlık elementi
    const splitBaslik = baslikSplitEl ? basligiTemizle(baslikSplitEl.textContent?.trim() || '', 'claude') : ''; // header başlığı
    const aktifSidebar = document.querySelector('a[data-testid="recent-conversation"][aria-current="page"], a[href*="/chat/"][aria-current="page"], nav a.bg-bg-300, nav a[aria-current="true"]'); // aktif konuşma linki (eski UI)
    const sidebarBaslik = aktifSidebar ? basligiTemizle(aktifSidebar.textContent?.trim() || '', 'claude') : ''; // sidebar başlığı
    const docBaslik = basligiTemizle(document.title || '', 'claude'); // doc başlığı
    const sayfaBasligi = splitBaslik || sidebarBaslik || docBaslik || 'Claude Konuşması'; // ilk dolu olanı kullan

    return {
        baslik: sayfaBasligi, // konuşma başlığı
        tarih: new Date().toLocaleDateString('tr-TR'), // bugünün tarihi
        saat: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), // şu anki saat
        mesajSayisi: mesajlar.length, // toplam mesaj sayısı
        mesajlar: mesajlar, // mesaj dizisi
        kaynak: 'claude' // hangi siteden geldiği
    };
}

// Popup'tan gelen mesajları da dinle (fallback) — artifact desteği dahil
chrome.runtime.onMessage.addListener((mesaj, gonderen, yanitGonder) => { // mesaj dinleyici
    if (mesaj.islem === 'baglantiSaglik') { // popup/background yeni content script'i doğrular
        yanitGonder({ basari: true, kaynak: 'claude' }); // senkron sağlık yanıtı
        return false; // kanal kapanabilir
    }
    if (mesaj.islem === 'konusmayiCikar') { // konuşma çıkarma isteği
        (async () => { // async IIFE — artifact önce çıkar
            if (streamingMiKontrol('claude')) { // streaming aktifse
                yanitGonder({ hata: 'Claude henüz yanıt yazıyor. Tamamlanmasını bekleyin.', mesajlar: [] }); // uyarı
                return;
            }
            if (yazdirmaIslemiSuruyor) { // sayfa içi akışla paralel artifact döngüsü viewer'ı çakıştırır
                yanitGonder({ hata: 'Yazdırma işlemi zaten sürüyor. Lütfen bekleyin.', mesajlar: [] }); // bilgi
                return;
            }
            yazdirmaIslemiSuruyor = true; // akış kilidi (popup yolu da artifact döngüsü çalıştırıyor)
            resimIslemOturumuBaslat(RESIM_TOPLAM_SURE_LIMIT); // resim oturumu başlat
            try { // oturum kapatma garantisi
                const artifactIcerikleri = await artifactIcerikleriniCikar(); // artifact içerikleri
                const veri = await konusmayiCikar(artifactIcerikleri); // artifact'lı çıkarma
                yanitGonder(veri); // popup'a dön
            } catch (hata) { // çıkarma hatası — popup yanlış "yüklenmemiş" mesajı göstermesin
                yanitGonder({ hata: 'Konuşma çıkarılamadı: ' + hata.message, mesajlar: [] }); // hata yanıtı
            } finally { // oturum kapatma
                yazdirmaIslemiSuruyor = false; // akış kilidini bırak
                resimIslemOturumuBitir(); // deadline sıfırla
            }
        })();
        return true; // asenkron yanıt — kanalı açık tut
    }
    if (mesaj.islem === 'klavyeKisayoluYazdir') { // keyboard shortcut tetiklemesi
        yazdirmaBaslat(); // sayfa içi yazdır akışını başlat
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
