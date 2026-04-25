// Yazdırma sayfası script - konuşma verisini okur ve sayfaya render eder

// Global referans — Escape kısayolu ve clipboard export için render sonrası erişim
let mevcutKonusma = null; // render edilen konuşma verisi

// Bir elementin tüm alt düğümlerini güvenli şekilde siler (innerHTML kullanmadan)
function elementiBosalt(element) {
    while (element.firstChild) { // ilk çocuk varken
        element.removeChild(element.firstChild); // sil
    }
}

// Toast bildirim gösterir (ARIA live region ile screen reader uyumlu)
function toastGoster(mesaj, tip) { // tip: 'basari', 'hata', 'bilgi'
    const alan = document.getElementById('toastAlani'); // toast container
    if (!alan) return; // alan yoksa çık

    const toast = document.createElement('div'); // toast elementi
    toast.className = 'toast ' + (tip || 'bilgi'); // CSS sınıfı
    toast.textContent = mesaj; // metin

    elementiBosalt(alan); // önceki toastları temizle (safe)
    alan.appendChild(toast); // yeni toast ekle

    setTimeout(() => { // 3 saniye sonra
        toast.style.opacity = '0'; // saydamlaştır
        setTimeout(() => toast.remove(), 300); // animasyon sonunda sil
    }, 3000);
}

// Loading overlay'i gizler
function yuklemeyiGizle() {
    const overlay = document.getElementById('yuklemeOverlay'); // overlay elementi
    if (overlay) { // varsa
        overlay.style.opacity = '0'; // saydamlaştır
        setTimeout(() => overlay.style.display = 'none', 300); // animasyon sonu
    }
}

// Loading overlay metnini günceller
function yuklemeMetniniGuncelle(metin) {
    const el = document.querySelector('#yuklemeOverlay .yukleme-metin'); // metin elementi
    if (el) el.textContent = metin; // güncelle (textContent XSS-safe)
}

// Sayfa yüklendiğinde konuşma verisini oku ve göster
document.addEventListener('DOMContentLoaded', async () => { // DOM hazır olduğunda
    yuklemeMetniniGuncelle('Konuşma verisi okunuyor...'); // durum güncelle

    // chrome.storage.local'dan veriyi oku (try-catch)
    // Multi-tab race condition: aynı anda 2+ sekmede yazdır yapılınca son yazılan kazanır
    // Çözüm: oku-ve-hemen-sil pattern'i — bu sekme veriyi alır almaz storage'dan kaldırır
    let depolanmisVeri; // kayıtlı veri
    try { // erişim denemesi
        depolanmisVeri = await chrome.storage.local.get(['konusmaVerisi', 'yazdirAyarlari']); // oku
        // Hemen sil — diğer sekmelerin aynı veriyi okumasını önle (race condition koruması)
        if (depolanmisVeri.konusmaVerisi) { // veri varsa
            chrome.storage.local.remove(['konusmaVerisi', 'yazdirAyarlari']).catch(() => {}); // arka planda sil
        }
    } catch (okumaHata) { // storage erişilemezse
        yuklemeyiGizle(); // overlay'i gizle
        document.getElementById('mesajlarAlani').textContent = 'Storage erişim hatası: ' + okumaHata.message; // hata göster (textContent XSS-safe)
        return;
    }

    const konusma = depolanmisVeri.konusmaVerisi; // konuşma verisi
    const ayarlar = depolanmisVeri.yazdirAyarlari || {}; // yazdırma ayarları

    if (!konusma || !konusma.mesajlar || konusma.mesajlar.length === 0) { // veri yoksa
        yuklemeyiGizle(); // overlay'i gizle
        document.getElementById('mesajlarAlani').textContent = 'Konuşma verisi bulunamadı. Lütfen AI sayfasından tekrar yazdır butonuna tıklayın.'; // hata mesajı
        return;
    }

    mevcutKonusma = konusma; // global referans (kopyala için)

    yuklemeMetniniGuncelle('İçerik işleniyor (' + konusma.mesajSayisi + ' mesaj)...'); // durum güncelle

    // Kaynak bilgisini belirle (bilinen 4 site dışında "ai" generic theme)
    const KAYNAK_HARITA = { // tek doğru kaynak — DRY
        gemini: { ad: 'GEMINI', sinif: 'gemini', site: 'gemini.google.com', baslik: 'Gemini Konusmasi' },
        claude: { ad: 'CLAUDE', sinif: 'claude', site: 'claude.ai', baslik: 'Claude Konusmasi' },
        chatgpt: { ad: 'CHATGPT', sinif: 'chatgpt', site: 'chatgpt.com', baslik: 'ChatGPT Konusmasi' },
        grok: { ad: 'GROK', sinif: 'grok', site: 'grok.com', baslik: 'Grok Konusmasi' }
    };
    const kaynak = konusma.kaynak || 'gemini'; // ham kaynak alanı
    const kaynakBilgi = KAYNAK_HARITA[kaynak] || { ad: 'AI', sinif: 'ai', site: 'unknown', baslik: 'AI Konusmasi' }; // bilinmeyen → generic
    const yapayZekaAdi = kaynakBilgi.ad; // etiket metni
    const yapayZekaSinif = kaynakBilgi.sinif; // CSS sınıfı
    const kaynakSite = kaynakBilgi.site; // site adresi

    // Yazı boyutunu uygula
    if (ayarlar.yaziBoyutu) { // yazı boyutu ayarı varsa
        document.getElementById('yazdirmaAlani').style.fontSize = ayarlar.yaziBoyutu + 'px'; // boyutu uygula
    }

    // Footer'ı toggle et (kullanıcı imzayı kapatmışsa gizle)
    if (ayarlar.footerGoster === false) { // varsayılan true; sadece açıkça false ise gizle
        const footer = document.querySelector('.sayfa-alt-bilgi'); // footer elementi
        if (footer) footer.style.display = 'none'; // gizle (yazdırmadan da çıkar)
    }

    // Başlık ve tarih bilgisini yaz (tümü textContent — XSS-safe)
    const konusmaBasligi = konusma.baslik || kaynakBilgi.baslik;
    document.getElementById('konusmaBasligi').textContent = konusmaBasligi;
    document.getElementById('konusmaTarihi').textContent = (konusma.tarih || '') + ' ' + (konusma.saat || '');
    document.title = konusmaBasligi; // PDF dosya adı
    document.getElementById('mesajSayisi').textContent = konusma.mesajSayisi + ' mesaj';
    document.getElementById('kaynakSite').textContent = kaynakSite;

    // Mesajları render et
    const mesajlarAlani = document.getElementById('mesajlarAlani'); // mesajlar container
    let mesajSirasi = 0; // mesaj numaralandırma sayacı
    let tabloVarMi = false; // geniş tablo kontrolü için

    konusma.mesajlar.forEach((mesaj) => { // her mesajı işle
        mesajSirasi++; // sıra numarasını artır

        const mesajBlogu = document.createElement('div'); // mesaj bloğu oluştur
        mesajBlogu.className = 'mesaj-blogu'; // CSS sınıfı

        // Etiket satırı (numara + Kullanıcı/Claude/Gemini)
        const etiketSatiri = document.createElement('div'); // etiket satırı container
        etiketSatiri.className = 'mesaj-etiket-satiri'; // CSS sınıfı

        const numara = document.createElement('span'); // sıra numarası
        numara.className = 'mesaj-numara'; // CSS sınıfı
        numara.textContent = '#' + mesajSirasi; // numara metni

        const etiket = document.createElement('span'); // etiket elementi
        etiket.className = 'mesaj-etiketi ' + (mesaj.rol === 'kullanici' ? 'kullanici' : yapayZekaSinif); // rol sınıfı
        etiket.textContent = mesaj.rol === 'kullanici' ? 'KULLANICI' : yapayZekaAdi; // etiket metni

        etiketSatiri.appendChild(numara); // numara ekle
        etiketSatiri.appendChild(etiket); // etiket ekle
        mesajBlogu.appendChild(etiketSatiri); // etiket satırını ekle

        // Mesaj içeriği
        const icerikDiv = document.createElement('div'); // içerik elementi
        icerikDiv.className = 'mesaj-icerigi ' + (mesaj.rol === 'kullanici' ? 'kullanici' : yapayZekaSinif); // rol sınıfı

        const temizHtml = htmlTemizle(mesaj.html || mesaj.metin || ''); // HTML'i güvenli sanitize et
        if (temizHtml.childNodes.length > 0) { // içerik varsa
            icerikDiv.appendChild(temizHtml); // temizlenmiş içeriği ekle (createElement ile oluşturulan — güvenli)
        } else if (mesaj.resimler && mesaj.resimler.length > 0) { // sadece resim olan mesajsa
            const bilgiP = document.createElement('p'); // bilgi paragrafı
            bilgiP.className = 'salt-resim-bilgi'; // CSS sınıfı
            bilgiP.textContent = '(Bu mesajda yalnızca görsel içerik var)'; // yer tutucu
            icerikDiv.appendChild(bilgiP); // ekle
        } else { // içerik yoksa
            const bosP = document.createElement('p'); // boş paragraf
            bosP.className = 'bos-mesaj'; // CSS sınıfı
            bosP.textContent = '(Boş mesaj)'; // yer tutucu
            icerikDiv.appendChild(bosP); // ekle
        }

        if (mesaj.rol === 'kullanici') { // kullanıcı mesajı — prefix temizle
            prefixTemizleDOM(icerikDiv); // DOM üzerinde prefix temizle
        }

        // Kod bloklarını kaldır seçeneği
        if (!ayarlar.kodBloklari) { // kod blokları dahil değilse
            const kodBloklari = icerikDiv.querySelectorAll('pre'); // tüm pre elementleri
            kodBloklari.forEach((blok) => blok.remove()); // pre bloklarını sil
        }

        // Tablo varlığını kontrol et (landscape uyarısı için)
        if (icerikDiv.querySelector('table')) tabloVarMi = true; // tablo var

        // Mesaj içindeki ekstra resimleri ekle (kaynak element dışından yakalananlar)
        if (mesaj.resimler && mesaj.resimler.length > 0) { // ekstra resim varsa
            mesaj.resimler.forEach((resim) => { // her resmi render et
                const src = resim.src || ''; // kaynak URL
                if (!src.startsWith('data:image/') && !src.startsWith('https://') && !src.startsWith('blob:')) return; // güvensiz — atla
                const resimElementi = document.createElement('img'); // img oluştur
                resimElementi.src = src; // güvenli kaynak
                resimElementi.className = 'mesaj-resim'; // CSS sınıfı
                resimElementi.loading = 'lazy'; // lazy yükleme
                resimElementi.alt = (resim.alt && typeof resim.alt === 'string') ? resim.alt : 'Görsel'; // alt metin
                resimElementi.onerror = function() { this.style.display = 'none'; }; // yükleme hatası — gizle
                icerikDiv.appendChild(resimElementi); // içerik alanına ekle
            });
        }

        mesajBlogu.appendChild(icerikDiv); // içerik ekle

        // Artifact blokları varsa ekle (kod dosyaları, dokümanlar vs.)
        if (mesaj.artifactlar && mesaj.artifactlar.length > 0) { // artifact varsa
            mesaj.artifactlar.forEach((artifact) => { // her artifact'ı render et
                const artifactDiv = document.createElement('div'); // artifact container
                artifactDiv.className = 'artifact-blogu'; // CSS sınıfı

                // Artifact başlık satırı
                const artifactBaslik = document.createElement('div'); // başlık container
                artifactBaslik.className = 'artifact-baslik'; // CSS sınıfı
                artifactBaslik.textContent = (artifact.baslik || 'Dosya') + (artifact.tur ? ' (' + artifact.tur + ')' : ''); // başlık metni
                artifactDiv.appendChild(artifactBaslik); // başlığı ekle

                // Artifact içeriği
                if (artifact.icerik) { // içerik çıkarılabildiyse
                    const artifactIcerik = document.createElement('pre'); // pre bloğu (kod formatı)
                    artifactIcerik.className = 'artifact-icerik'; // CSS sınıfı
                    const artifactKod = document.createElement('code'); // code elementi
                    artifactKod.textContent = artifact.icerik; // içerik metni (textContent XSS-safe)
                    artifactIcerik.appendChild(artifactKod); // code'u pre'ye ekle
                    artifactDiv.appendChild(artifactIcerik); // içeriği ekle
                } else { // içerik çıkarılamadıysa
                    const uyari = document.createElement('p'); // uyarı paragrafı
                    uyari.className = 'artifact-uyari'; // CSS sınıfı
                    uyari.textContent = '(Artifact içeriği çıkarılamadı)'; // uyarı metni
                    artifactDiv.appendChild(uyari); // uyarıyı ekle
                }

                // Kod blokları dahil değilse artifact'ı da gizle
                if (!ayarlar.kodBloklari) { // kod blokları kapalıysa
                    artifactDiv.style.display = 'none'; // gizle
                }

                mesajBlogu.appendChild(artifactDiv); // artifact'ı mesaja ekle
            });
        }

        mesajlarAlani.appendChild(mesajBlogu); // mesajı sayfaya ekle
    });

    // Geniş tablo varsa landscape önerisi göster
    if (tabloVarMi) { // tablo içeren mesaj varsa
        setTimeout(() => { // render sonrası
            toastGoster('Geniş tablolar tespit edildi. Yazdırma diyaloğunda "Yatay" (Landscape) yönlendirme daha okunabilir olabilir.', 'bilgi'); // ipucu
        }, 1200);
    }

    // Loading overlay'i gizle
    yuklemeyiGizle();

    // Storage temizliği zaten oku-anında yapıldı (multi-tab race condition koruması)
    // Bu noktada storage zaten boş, ek temizleme gereksiz

    // Otomatik yazdır — tüm resimlerin yüklenmesini bekle, sonra print
    if (ayarlar.otomatikYazdir) { // otomatik yazdır açıksa
        const tumResimler = Array.from(document.querySelectorAll('#yazdirmaAlani img')); // tüm img elementleri
        const yuklemeleriBekle = tumResimler.map((img) => { // her resim için promise
            if (img.complete) return Promise.resolve(); // zaten yüklü
            return new Promise((coz) => { // yüklenmeyi bekle
                img.addEventListener('load', coz, { once: true }); // başarılı
                img.addEventListener('error', coz, { once: true }); // başarısız da geç
                setTimeout(coz, 3000); // max 3sn bekle (timeout)
            });
        });
        Promise.all(yuklemeleriBekle).then(() => { // tüm resimler hazır
            setTimeout(() => { window.print(); }, 200); // kısa render hazırlığı, sonra yazdır
        });
    }

    // Kontrol butonları
    document.getElementById('yazdirTetikle').addEventListener('click', () => { // yazdır butonu
        window.print(); // yazdırma dialogunu aç
    });

    // Markdown kopyala
    document.getElementById('markdownKopyala').addEventListener('click', async () => { // markdown butonu
        if (!mevcutKonusma) return; // veri yoksa çık
        const md = konusmayiMarkdowneDonustur(mevcutKonusma); // markdown string
        const basari = await panoyaKopyala(md); // panoya kopyala
        if (basari) toastGoster('Markdown panoya kopyalandı.', 'basari'); // başarı bildirimi
        else toastGoster('Kopyalama başarısız. Tarayıcı izinlerini kontrol edin.', 'hata'); // hata
    });

    // Düz metin kopyala
    document.getElementById('metinKopyala').addEventListener('click', async () => { // metin butonu
        if (!mevcutKonusma) return; // veri yoksa çık
        const metin = konusmayiDuzMetneDonustur(mevcutKonusma); // düz metin
        const basari = await panoyaKopyala(metin); // panoya kopyala
        if (basari) toastGoster('Düz metin panoya kopyalandı.', 'basari'); // başarı
        else toastGoster('Kopyalama başarısız. Tarayıcı izinlerini kontrol edin.', 'hata'); // hata
    });

    // Kapat butonu
    document.getElementById('sayfayiKapat').addEventListener('click', sayfayiKapat); // kapat dinleyici

    // Klavye kısayolları
    document.addEventListener('keydown', (olay) => { // keydown dinleyici
        if (olay.key === 'Escape') { // Escape ile kapat
            olay.preventDefault();
            sayfayiKapat();
        } else if ((olay.ctrlKey || olay.metaKey) && olay.shiftKey && olay.key === 'M') { // Ctrl+Shift+M = markdown kopyala
            olay.preventDefault();
            document.getElementById('markdownKopyala').click();
        }
    });
});

// Sayfayı kapat — storage temizle + chrome.tabs.remove
async function sayfayiKapat() {
    try { // storage temizleme denemesi
        await chrome.storage.local.remove(['konusmaVerisi', 'yazdirAyarlari']); // temizle
    } catch (e) {}
    try { // chrome tabs API denemesi
        const mevcutSekme = await chrome.tabs.getCurrent(); // mevcut sekme
        if (mevcutSekme && mevcutSekme.id) { // sekme bilgisi varsa
            chrome.tabs.remove(mevcutSekme.id); // sekmeyi kapat
            return;
        }
    } catch (kapatHata) { // API başarısızsa fallback
        console.warn('chrome.tabs.remove başarısız:', kapatHata.message); // uyarı
    }
    window.close(); // fallback: window.close (her zaman çalışmaz)
}

// Panoya kopyalama (Clipboard API + execCommand fallback)
async function panoyaKopyala(metin) {
    try { // modern clipboard API denemesi
        await navigator.clipboard.writeText(metin); // panoya yaz
        return true; // başarılı
    } catch (clipHata) { // clipboard API başarısızsa
        try { // execCommand fallback
            const textarea = document.createElement('textarea'); // geçici textarea
            textarea.value = metin; // değer
            textarea.style.position = 'fixed'; // viewport dışı
            textarea.style.opacity = '0'; // görünmez
            document.body.appendChild(textarea); // ekle
            textarea.select(); // seç
            const basari = document.execCommand('copy'); // eski API
            document.body.removeChild(textarea); // temizle
            return basari; // sonuç
        } catch (execHata) { // ikisi de başarısızsa
            return false; // başarısız
        }
    }
}

// DOM üzerinde "Siz şunu dediniz:" prefix'ini temizler
function prefixTemizleDOM(element) {
    const prefixler = ['Siz şunu dediniz: ', 'Siz şunu söylediniz: ', 'You said: ']; // bilinen prefix'ler
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT); // text node'ları tara
    const ilkTextNode = walker.nextNode(); // ilk text node
    if (ilkTextNode) { // text node bulunduysa
        for (const prefix of prefixler) { // her prefix'i kontrol et
            if (ilkTextNode.textContent.startsWith(prefix)) { // prefix ile başlıyorsa
                ilkTextNode.textContent = ilkTextNode.textContent.substring(prefix.length); // prefix'i kaldır
                break; // ilk eşleşmede dur
            }
        }
    }
}

// Konuşma verisini düz metne dönüştürür (clipboard için)
function konusmayiDuzMetneDonustur(veri) {
    if (!veri || !veri.mesajlar) return ''; // boş
    const yapayZekaAdi = veri.kaynak === 'claude' ? 'Claude' : veri.kaynak === 'chatgpt' ? 'ChatGPT' : veri.kaynak === 'grok' ? 'Grok' : 'Gemini'; // etiket
    let metin = (veri.baslik || (yapayZekaAdi + ' Konuşması')) + '\n'; // başlık
    metin += (veri.tarih || '') + ' ' + (veri.saat || '') + '\n'; // tarih
    metin += '='.repeat(60) + '\n\n'; // ayırıcı

    veri.mesajlar.forEach((mesaj, idx) => { // her mesaj
        const rolAdi = mesaj.rol === 'kullanici' ? 'KULLANICI' : yapayZekaAdi.toUpperCase(); // rol
        metin += '[#' + (idx + 1) + '] ' + rolAdi + '\n'; // başlık satırı
        metin += '-'.repeat(40) + '\n'; // ayırıcı
        metin += (mesaj.metin || '(boş)') + '\n\n'; // mesaj metni

        if (mesaj.artifactlar && mesaj.artifactlar.length > 0) { // artifact varsa
            mesaj.artifactlar.forEach((artifact) => { // her artifact
                metin += '[DOSYA] ' + (artifact.baslik || 'Dosya') + (artifact.tur ? ' (' + artifact.tur + ')' : '') + '\n'; // başlık
                metin += (artifact.icerik || '(içerik çıkarılamadı)') + '\n\n'; // içerik
            });
        }

        if (mesaj.resimler && mesaj.resimler.length > 0) { // resim varsa
            metin += '[' + mesaj.resimler.length + ' görsel içerik]\n\n'; // bilgi
        }
    });

    metin += '\n\nBu çıktı AI Chat Printer eklentisi ile oluşturulmuştur.\n'; // footer
    return metin; // string
}

// HTML içeriği güvenli bir şekilde parse eder - sadece izin verilen etiketleri korur
// Not: DOMParser ile parse edilen içerik yeni bir document'te, script'ler otomatik çalıştırılmaz.
// Her element createElement ile yeniden oluşturulur — string concat / innerHTML KULLANILMAZ.
function htmlTemizle(htmlString) {
    const geciciDiv = document.createElement('div'); // geçici container

    // Güvenli etiketler listesi (whitelist — bunun dışındaki her etiket içeriği alınır ama tag atılır)
    const izinliEtiketler = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'PRE', 'CODE',
        'STRONG', 'B', 'EM', 'I', 'U', 'BR', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'TFOOT', 'CAPTION',
        'BLOCKQUOTE', 'A', 'SPAN', 'DIV', 'HR', 'SUP', 'SUB', 'IMG', 'FIGURE', 'FIGCAPTION',
        'DEL', 'S', 'MARK', 'SMALL', 'KBD', 'SAMP', 'VAR', 'DL', 'DT', 'DD']; // whitelist

    // DOMParser ile güvenli parse — script çalıştırılmaz
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const govde = doc.body;

    // Recursive temizleme fonksiyonu — sadece whitelist'e uyan element'leri createElement ile yeniden oluşturur
    function temizleVeKopyala(kaynak, hedef) {
        for (const cocuk of kaynak.childNodes) {
            if (cocuk.nodeType === Node.TEXT_NODE) { // metin düğümü
                hedef.appendChild(document.createTextNode(cocuk.textContent)); // güvenli metin kopya
            } else if (cocuk.nodeType === Node.ELEMENT_NODE) { // element düğümü
                if (izinliEtiketler.includes(cocuk.tagName)) { // izin verilen etiketse
                    const yeniElement = document.createElement(cocuk.tagName); // createElement — güvenli

                    // Class attribute'unu kopyala (stil korunması için)
                    if (cocuk.className && typeof cocuk.className === 'string') {
                        yeniElement.className = cocuk.className;
                    }

                    // A etiketi için href (güvenli şemalar: http/https/mailto/tel)
                    if (cocuk.tagName === 'A' && cocuk.href) {
                        const href = cocuk.getAttribute('href') || '';
                        if (href.startsWith('http://') || href.startsWith('https://') ||
                            href.startsWith('mailto:') || href.startsWith('tel:')) {
                            yeniElement.setAttribute('href', href);
                            if (href.startsWith('http')) {
                                yeniElement.setAttribute('target', '_blank');
                                yeniElement.setAttribute('rel', 'noopener noreferrer'); // güvenlik
                            }
                        }
                    }

                    // IMG etiketi için src (güvenli şemalar: data:image/{png,jpeg,jpg,gif,webp} / https: / blob:)
                    if (cocuk.tagName === 'IMG') {
                        const src = cocuk.getAttribute('src') || '';
                        // SVG data URI XSS koruması: sadece raster format'lara izin ver
                        const guvenliDataUri = /^data:image\/(png|jpeg|jpg|gif|webp);(base64,|charset=)/i.test(src); // raster format kontrol
                        const guvenliHttps = src.startsWith('https://') && !src.toLowerCase().includes('javascript:'); // https + javascript: önleme
                        const guvenliBlob = src.startsWith('blob:'); // blob güvenli
                        if (guvenliDataUri || guvenliHttps || guvenliBlob) { // sadece güvenli kaynak
                            yeniElement.setAttribute('src', src); // güvenli src
                        }
                        yeniElement.setAttribute('alt', cocuk.getAttribute('alt') || 'Görsel');
                        yeniElement.setAttribute('loading', 'lazy');
                        yeniElement.setAttribute('referrerpolicy', 'no-referrer'); // referrer leak önle
                    }

                    temizleVeKopyala(cocuk, yeniElement); // alt element'leri recursive temizle
                    hedef.appendChild(yeniElement);
                } else { // whitelist dışı — içeriği al, tag'i at
                    temizleVeKopyala(cocuk, hedef);
                }
            }
        }
    }

    temizleVeKopyala(govde, geciciDiv);
    return geciciDiv; // temizlenmiş DOM — tüm elementler createElement ile oluşturulmuş
}
