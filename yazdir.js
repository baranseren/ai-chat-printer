// Yazdırma sayfası script - konuşma verisini okur ve sayfaya render eder

// Sayfa yüklendiğinde konuşma verisini oku ve göster
document.addEventListener('DOMContentLoaded', async () => { // DOM hazır olduğunda

    // chrome.storage.local'dan veriyi oku
    const depolanmisVeri = await chrome.storage.local.get(['konusmaVerisi', 'yazdirAyarlari']); // kayıtlı veri
    const konusma = depolanmisVeri.konusmaVerisi; // konuşma verisi
    const ayarlar = depolanmisVeri.yazdirAyarlari || {}; // yazdırma ayarları

    if (!konusma || !konusma.mesajlar || konusma.mesajlar.length === 0) { // veri yoksa
        document.getElementById('mesajlarAlani').textContent = 'Konusma verisi bulunamadi.'; // hata mesajı
        return;
    }

    // Kaynak bilgisini belirle (gemini/claude)
    const kaynak = konusma.kaynak || 'gemini'; // varsayılan gemini
    const yapayZekaAdi = kaynak === 'claude' ? 'CLAUDE' : kaynak === 'chatgpt' ? 'CHATGPT' : 'GEMINI'; // etiket metni
    const yapayZekaSinif = kaynak === 'claude' ? 'claude' : kaynak === 'chatgpt' ? 'chatgpt' : 'gemini'; // CSS sınıfı
    const kaynakSite = kaynak === 'claude' ? 'claude.ai' : kaynak === 'chatgpt' ? 'chatgpt.com' : 'gemini.google.com'; // site adresi

    // Yazı boyutunu uygula
    if (ayarlar.yaziBoyutu) { // yazı boyutu ayarı varsa
        document.getElementById('yazdirmaAlani').style.fontSize = ayarlar.yaziBoyutu + 'px'; // boyutu uygula
    }

    // Başlık ve tarih bilgisini yaz
    const varsayilanBaslik = kaynak === 'claude' ? 'Claude Konusmasi' : kaynak === 'chatgpt' ? 'ChatGPT Konusmasi' : 'Gemini Konusmasi'; // varsayılan başlık
    const konusmaBasligi = konusma.baslik || varsayilanBaslik; // konuşma başlığı
    document.getElementById('konusmaBasligi').textContent = konusmaBasligi; // başlık
    document.getElementById('konusmaTarihi').textContent = konusma.tarih + ' ' + (konusma.saat || ''); // tarih ve saat
    document.title = konusmaBasligi; // sayfa title'ı = konuşma adı (PDF dosya adı olarak kullanılır)

    // Mesaj sayısı bilgisini göster
    document.getElementById('mesajSayisi').textContent = konusma.mesajSayisi + ' mesaj'; // toplam mesaj sayısı

    // Kaynak site bilgisini güncelle
    document.getElementById('kaynakSite').textContent = kaynakSite; // kaynak site

    // Mesajları render et
    const mesajlarAlani = document.getElementById('mesajlarAlani'); // mesajlar container
    let mesajSirasi = 0; // mesaj numaralandırma sayacı

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

        if (mesaj.rol === 'kullanici') { // kullanıcı mesajı
            // Kullanıcı mesajında da paragraf yapısını koru (HTML sanitize ile)
            const temizHtml = htmlTemizle(mesaj.html || mesaj.metin || ''); // HTML'i temizle
            icerikDiv.appendChild(temizHtml); // temizlenmiş içeriği ekle
            // "Siz şunu dediniz:" prefix varsa ilk text node'dan temizle
            prefixTemizleDOM(icerikDiv); // DOM üzerinde prefix temizle
        } else { // Gemini yanıtı
            const temizHtml = htmlTemizle(mesaj.html || mesaj.metin || ''); // HTML'i temizle
            icerikDiv.appendChild(temizHtml); // temizlenmiş içeriği ekle
        }

        // Kod bloklarını kaldır seçeneği
        if (!ayarlar.kodBloklari) { // kod blokları dahil değilse
            const kodBloklari = icerikDiv.querySelectorAll('pre'); // tüm pre elementleri
            kodBloklari.forEach((blok) => blok.remove()); // pre bloklarını sil
        }

        // Mesaj içindeki ekstra resimleri ekle (kaynak element dışından yakalananlar)
        if (mesaj.resimler && mesaj.resimler.length > 0) { // ekstra resim varsa
            mesaj.resimler.forEach((resim) => { // her resmi render et
                const resimElementi = document.createElement('img'); // img oluştur
                resimElementi.src = resim.src; // base64 kaynak
                resimElementi.className = 'mesaj-resim'; // CSS sınıfı
                if (resim.alt) resimElementi.alt = resim.alt; // alt metin
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
                    artifactKod.textContent = artifact.icerik; // içerik metni
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

    // Kullanılan veriyi temizle
    await chrome.storage.local.remove(['konusmaVerisi', 'yazdirAyarlari']); // geçici veriyi sil

    // Otomatik yazdır
    if (ayarlar.otomatikYazdir) { // otomatik yazdır açıksa
        setTimeout(() => { window.print(); }, 800); // 800ms bekle ve yazdır
    }

    // Kontrol butonları
    document.getElementById('yazdirTetikle').addEventListener('click', () => { // yazdır butonu
        window.print(); // yazdırma dialogunu aç
    });
    document.getElementById('sayfayiKapat').addEventListener('click', () => { // kapat butonu
        window.close(); // sekmeyi kapat
    });
});

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

// HTML içeriği güvenli bir şekilde parse eder - sadece izin verilen etiketleri korur
function htmlTemizle(htmlString) {
    const geciciDiv = document.createElement('div'); // geçici container

    // Güvenli etiketler listesi
    const izinliEtiketler = ['P', 'H1', 'H2', 'H3', 'H4', 'UL', 'OL', 'LI', 'PRE', 'CODE',
        'STRONG', 'B', 'EM', 'I', 'BR', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD',
        'BLOCKQUOTE', 'A', 'SPAN', 'DIV', 'HR', 'SUP', 'SUB', 'IMG']; // izin verilen HTML etiketleri (IMG resim desteği)

    // DOMParser ile güvenli parse
    const parser = new DOMParser(); // HTML parser
    const doc = parser.parseFromString(htmlString, 'text/html'); // HTML'i parse et
    const govde = doc.body; // body elementi

    // Recursive temizleme fonksiyonu
    function temizleVeKopyala(kaynak, hedef) { // kaynak elementten hedef elemente kopyala
        for (const cocuk of kaynak.childNodes) { // her alt düğümü işle
            if (cocuk.nodeType === Node.TEXT_NODE) { // metin düğümü
                hedef.appendChild(document.createTextNode(cocuk.textContent)); // metni kopyala
            } else if (cocuk.nodeType === Node.ELEMENT_NODE) { // element düğümü
                if (izinliEtiketler.includes(cocuk.tagName)) { // izin verilen etiketse
                    const yeniElement = document.createElement(cocuk.tagName); // yeni element oluştur

                    // Sadece class attribute'unu kopyala (güvenli)
                    if (cocuk.className) yeniElement.className = cocuk.className; // sınıf kopyala

                    // A etiketi için href'i kopyala (sadece http/https)
                    if (cocuk.tagName === 'A' && cocuk.href) { // link etiketi
                        const href = cocuk.getAttribute('href') || ''; // href al
                        if (href.startsWith('http://') || href.startsWith('https://')) { // güvenli URL
                            yeniElement.setAttribute('href', href); // href ayarla
                            yeniElement.setAttribute('target', '_blank'); // yeni sekmede aç
                        }
                    }

                    // IMG etiketi için src ve alt kopyala (sadece data: ve https: güvenli kaynaklar)
                    if (cocuk.tagName === 'IMG') { // resim etiketi
                        const src = cocuk.getAttribute('src') || ''; // kaynak URL
                        if (src.startsWith('data:') || src.startsWith('https://')) { // güvenli kaynaklar
                            yeniElement.setAttribute('src', src); // kaynağı kopyala
                        }
                        if (cocuk.getAttribute('alt')) yeniElement.setAttribute('alt', cocuk.getAttribute('alt')); // alt metin kopyala
                    }

                    temizleVeKopyala(cocuk, yeniElement); // alt elementleri recursive temizle
                    hedef.appendChild(yeniElement); // temizlenmiş elementi ekle
                } else { // izin verilmeyen etiket
                    temizleVeKopyala(cocuk, hedef); // içeriğini direkt parent'a ekle (etiketi atla)
                }
            }
        }
    }

    temizleVeKopyala(govde, geciciDiv); // temizleme başlat
    return geciciDiv; // temizlenmiş DOM döndür
}
