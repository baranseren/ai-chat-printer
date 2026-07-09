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

    let konusma = depolanmisVeri.konusmaVerisi; // konuşma verisi
    let ayarlar = depolanmisVeri.yazdirAyarlari || {}; // yazdırma ayarları

    // F5 dayanıklılığı: storage boşsa bu sekmenin sessionStorage yedeğinden geri yükle
    // (sessionStorage sekmeye özeldir — multi-tab race condition korumasını bozmaz)
    if (!konusma) { // storage'dan veri gelmedi (muhtemelen F5)
        try { // sessionStorage okuma denemesi
            const yedek = sessionStorage.getItem('aiChatPrinterYedek'); // bu sekmenin yedeği
            if (yedek) { // yedek varsa
                const cozulmus = JSON.parse(yedek); // JSON çöz
                konusma = cozulmus.konusmaVerisi; // konuşma geri geldi
                ayarlar = cozulmus.yazdirAyarlari || {}; // ayarlar geri geldi
            }
        } catch (yedekHata) {} // yedek bozuksa normal hata akışına düş
    } else { // storage'dan taze veri geldi — F5 için bu sekmeye yedekle
        try { // quota aşımında sessizce vazgeç (davranış eskisi gibi kalır)
            sessionStorage.setItem('aiChatPrinterYedek', JSON.stringify({ konusmaVerisi: konusma, yazdirAyarlari: ayarlar })); // sekme içi yedek
        } catch (yedekHata) {} // büyük konuşma sessionStorage'a sığmayabilir — kritik değil
    }

    if (!konusma || !konusma.mesajlar || konusma.mesajlar.length === 0) { // veri yoksa
        yuklemeyiGizle(); // overlay'i gizle
        document.getElementById('mesajlarAlani').textContent = 'Konuşma verisi bulunamadı. Lütfen AI sayfasından tekrar yazdır butonuna tıklayın.'; // hata mesajı
        return;
    }

    mevcutKonusma = konusma; // global referans (kopyala için)

    yuklemeMetniniGuncelle('İçerik işleniyor (' + konusma.mesajSayisi + ' mesaj)...'); // durum güncelle

    // Kaynak bilgisini belirle (bilinen 4 site dışında "ai" generic theme)
    const KAYNAK_HARITA = { // tek doğru kaynak — DRY (başlıklar tam Türkçe diakritikli — NTFS/ekran ikisi de Unicode destekler)
        gemini: { ad: 'GEMINI', sinif: 'gemini', site: 'gemini.google.com', baslik: 'Gemini Konuşması' },
        claude: { ad: 'CLAUDE', sinif: 'claude', site: 'claude.ai', baslik: 'Claude Konuşması' },
        chatgpt: { ad: 'CHATGPT', sinif: 'chatgpt', site: 'chatgpt.com', baslik: 'ChatGPT Konuşması' },
        grok: { ad: 'GROK', sinif: 'grok', site: 'grok.com', baslik: 'Grok Konuşması' }
    };
    const kaynak = konusma.kaynak || 'gemini'; // ham kaynak alanı
    const kaynakBilgi = KAYNAK_HARITA[kaynak] || { ad: 'AI', sinif: 'ai', site: 'unknown', baslik: 'AI Konuşması' }; // bilinmeyen → generic
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

    konusma.mesajlar.forEach((mesaj, mesajIndex) => { // her mesajı işle
        mesajSirasi++; // sıra numarasını artır

        const mesajBlogu = document.createElement('div'); // mesaj bloğu oluştur
        mesajBlogu.className = 'mesaj-blogu'; // CSS sınıfı
        mesajBlogu.dataset.mesajIndex = String(mesajIndex); // export filtresi için orijinal indeks

        // Etiket satırı (numara + Kullanıcı/Claude/Gemini)
        const etiketSatiri = document.createElement('div'); // etiket satırı container
        etiketSatiri.className = 'mesaj-etiket-satiri'; // CSS sınıfı

        // Mesaj seçim checkbox'ı (sadece ekranda, seçim modunda görünür)
        const secimKutusu = document.createElement('input'); // checkbox elementi
        secimKutusu.type = 'checkbox'; // tip
        secimKutusu.className = 'mesaj-secim-kutusu'; // CSS sınıfı
        secimKutusu.checked = true; // varsayılan: mesaj dahil
        secimKutusu.setAttribute('aria-label', 'Mesaj #' + mesajSirasi + ' çıktıya dahil'); // erişilebilirlik
        secimKutusu.addEventListener('change', () => { // seçim değişimi
            mesajBlogu.classList.toggle('mesaj-secilmedi', !secimKutusu.checked); // görsel + çıktı durumu
            secimBilgisiniGuncelle(); // sayaç güncelle
        });
        etiketSatiri.appendChild(secimKutusu); // checkbox'ı etiket satırına ekle

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

        // Düz metin fallback'inde newline'ları koru — HTML parse boşlukları yutar
        const hamIcerik = mesaj.html || (mesaj.metin || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>'); // escape + satır kırma
        const temizHtml = htmlTemizle(hamIcerik); // HTML'i güvenli sanitize et
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

        // Kod blokları gizleme artık body.kod-gizli class'ı ile yapılır (canlı toggle — DOM silinmez)

        // Tablo varlığını kontrol et (landscape uyarısı için)
        if (icerikDiv.querySelector('table')) tabloVarMi = true; // tablo var

        // Mesaj içindeki ekstra resimleri ekle (kaynak element dışından yakalananlar)
        if (mesaj.resimler && mesaj.resimler.length > 0) { // ekstra resim varsa
            mesaj.resimler.forEach((resim) => { // her resmi render et
                const src = resim.src || ''; // kaynak URL
                if (!src.startsWith('data:image/') && !src.startsWith('https://')) return; // sadece base64 + https (blob: cross-origin'de zaten ölü, CSP de engelliyor)
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

                // Artifact gizleme body.kod-gizli class'ı ile yapılır (canlı toggle — DOM silinmez)
                mesajBlogu.appendChild(artifactDiv); // artifact'ı mesaja ekle
            });
        }

        mesajlarAlani.appendChild(mesajBlogu); // mesajı sayfaya ekle
    });

    // Kod blokları başlangıç durumu (kayıtlı ayara göre) — canlı toggle ile değiştirilebilir
    document.body.classList.toggle('kod-gizli', ayarlar.kodBloklari === false); // false ise gizle

    // ─── Canlı ayar çubuğu bağlantıları ───
    const canliYaziBoyutu = document.getElementById('canliYaziBoyutu'); // yazı boyutu select
    const canliKodBloklari = document.getElementById('canliKodBloklari'); // kod blokları toggle
    const mesajSecimModu = document.getElementById('mesajSecimModu'); // mesaj seçim modu toggle
    const tumunuSecKaldir = document.getElementById('tumunuSecKaldir'); // tümünü seç/kaldır butonu

    canliYaziBoyutu.value = ayarlar.yaziBoyutu || '13'; // kayıtlı boyutu yansıt
    canliKodBloklari.checked = ayarlar.kodBloklari !== false; // kayıtlı kod bloğu ayarını yansıt

    canliYaziBoyutu.addEventListener('change', () => { // yazı boyutu canlı değişim
        document.getElementById('yazdirmaAlani').style.fontSize = canliYaziBoyutu.value + 'px'; // anında uygula
    });
    canliKodBloklari.addEventListener('change', () => { // kod blokları canlı toggle
        document.body.classList.toggle('kod-gizli', !canliKodBloklari.checked); // gizle/göster
    });
    mesajSecimModu.addEventListener('change', () => { // seçim modu aç/kapat
        document.body.classList.toggle('secim-modu-acik', mesajSecimModu.checked); // checkbox görünürlüğü
        tumunuSecKaldir.classList.toggle('gizli-buton', !mesajSecimModu.checked); // toplu buton görünürlüğü
        secimBilgisiniGuncelle(); // sayaç güncelle
    });
    tumunuSecKaldir.addEventListener('click', () => { // toplu seç/kaldır
        const kutular = Array.from(document.querySelectorAll('.mesaj-secim-kutusu')); // tüm checkbox'lar
        const hepsiSecili = kutular.every((kutu) => kutu.checked); // hepsi seçili mi
        kutular.forEach((kutu) => { // her checkbox'ı çevir
            kutu.checked = !hepsiSecili; // hepsi seçiliyse kaldır, değilse seç
            kutu.closest('.mesaj-blogu').classList.toggle('mesaj-secilmedi', hepsiSecili); // görsel durum
        });
        secimBilgisiniGuncelle(); // sayaç güncelle
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

    // Markdown kopyala (mesaj seçimine saygılı)
    document.getElementById('markdownKopyala').addEventListener('click', async () => { // markdown butonu
        const veri = seciliKonusmaVerisi(); // seçili mesajlarla filtreli veri
        if (!veri) return; // veri yoksa çık
        const md = konusmayiMarkdowneDonustur(veri); // markdown string
        const basari = await panoyaKopyala(md); // panoya kopyala
        if (basari) toastGoster('Markdown panoya kopyalandı.', 'basari'); // başarı bildirimi
        else toastGoster('Kopyalama başarısız. Tarayıcı izinlerini kontrol edin.', 'hata'); // hata
    });

    // Düz metin kopyala (mesaj seçimine saygılı)
    document.getElementById('metinKopyala').addEventListener('click', async () => { // metin butonu
        const veri = seciliKonusmaVerisi(); // seçili mesajlarla filtreli veri
        if (!veri) return; // veri yoksa çık
        const metin = konusmayiDuzMetneDonustur(veri); // düz metin
        const basari = await panoyaKopyala(metin); // panoya kopyala
        if (basari) toastGoster('Düz metin panoya kopyalandı.', 'basari'); // başarı
        else toastGoster('Kopyalama başarısız. Tarayıcı izinlerini kontrol edin.', 'hata'); // hata
    });

    // Tüm konuşmayı dosya olarak indir (MD veya TXT) — panoya kopyalamanın dosya karşılığı
    const konusmayiDosyaIndir = (format) => { // format: 'md' | 'txt'
        const veri = seciliKonusmaVerisi(); // seçili mesajlarla filtreli veri
        if (!veri) return; // veri yoksa çık
        const icerik = format === 'md' ? konusmayiMarkdowneDonustur(veri) : konusmayiDuzMetneDonustur(veri); // formata göre içerik
        const mimeType = format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8'; // MIME tipi
        const dosyaAdi = (veri.baslik || 'AI Konuşması') + '.' + format; // başlık content script'te zaten FS-güvenli temizlendi (Türkçe karakter NTFS'te sorunsuz)
        dosyayaIndir(icerik, dosyaAdi, mimeType); // ortak indirme yardımcısı
        toastGoster('İndirildi: ' + dosyaAdi, 'basari'); // bildirim
    };
    document.getElementById('markdownIndir').addEventListener('click', () => konusmayiDosyaIndir('md')); // MD indir butonu
    document.getElementById('metinIndir').addEventListener('click', () => konusmayiDosyaIndir('txt')); // TXT indir butonu

    // Tek dosya HTML olarak indir — mevcut render + gömülü CSS (kendi kendine yeterli belge)
    document.getElementById('htmlIndir').addEventListener('click', async () => { // HTML indir butonu
        const veri = seciliKonusmaVerisi(); // dosya adı ve kontrol için
        if (!veri) return; // veri yoksa çık
        let cssMetni = ''; // gömülecek stil
        try { // extension kendi CSS dosyasını okuyabilir
            const yanit = await fetch(chrome.runtime.getURL('yazdir.css')); // stil dosyasını çek
            cssMetni = await yanit.text(); // metin olarak al
        } catch (cssHata) {} // stil alınamazsa çıplak HTML yine de üretilir
        const alanKlon = document.getElementById('yazdirmaAlani').cloneNode(true); // render edilmiş içeriğin klonu
        alanKlon.querySelectorAll('.mesaj-secim-kutusu').forEach((kutu) => kutu.remove()); // ekran checkbox'ları çıkar
        alanKlon.querySelectorAll('.mesaj-blogu.mesaj-secilmedi').forEach((blok) => blok.remove()); // seçilmeyen mesajları çıkar
        if (document.body.classList.contains('kod-gizli')) { // kod blokları gizliyse dosyada da olmasın
            alanKlon.querySelectorAll('pre, .artifact-blogu').forEach((blok) => blok.remove()); // kod + artifact çıkar
        }
        const yaziBoyutuStil = document.getElementById('yazdirmaAlani').style.fontSize || ''; // canlı yazı boyutu
        const htmlBelge = '<!DOCTYPE html>\n<html lang="tr">\n<head>\n<meta charset="UTF-8">\n' + // belge iskeleti
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' + // responsive
            '<title>' + (veri.baslik || 'AI Konuşması').replace(/</g, '&lt;') + '</title>\n' + // güvenli başlık
            '<style>\n' + cssMetni + '\n.yazdirma-alani{margin:32px auto;}\n</style>\n</head>\n' + // gömülü stil + bağımsız üst boşluk
            '<body>\n<div class="yazdirma-alani"' + (yaziBoyutuStil ? ' style="font-size:' + yaziBoyutuStil + '"' : '') + '>' + // canlı boyut korunur
            alanKlon.innerHTML + '</div>\n</body>\n</html>'; // içerik + kapanış
        const dosyaAdi = (veri.baslik || 'AI Konuşması') + '.html'; // dosya adı
        dosyayaIndir(htmlBelge, dosyaAdi, 'text/html;charset=utf-8'); // indir
        toastGoster('İndirildi: ' + dosyaAdi, 'basari'); // bildirim
    });

    // JSON olarak indir — yapılandırılmış ham veri (arşivleme / başka araçlara aktarım)
    document.getElementById('jsonIndir').addEventListener('click', () => { // JSON indir butonu
        const veri = seciliKonusmaVerisi(); // seçili mesajlarla filtreli veri
        if (!veri) return; // veri yoksa çık
        const dosyaAdi = (veri.baslik || 'AI Konuşması') + '.json'; // dosya adı
        dosyayaIndir(JSON.stringify(veri, null, 2), dosyaAdi, 'application/json;charset=utf-8'); // okunabilir JSON indir
        toastGoster('İndirildi: ' + dosyaAdi, 'basari'); // bildirim
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

// Seçim modunda işareti kaldırılan mesajları çıkararak filtreli konuşma verisi döndürür
// Hiç mesaj gizlenmemişse orijinal veri aynen döner (eski davranış birebir korunur)
function seciliKonusmaVerisi() {
    if (!mevcutKonusma) return null; // veri yoksa null
    const gizliIndeksler = new Set( // seçilmeyen mesajların orijinal indeksleri
        Array.from(document.querySelectorAll('.mesaj-blogu.mesaj-secilmedi')).map((blok) => parseInt(blok.dataset.mesajIndex, 10))
    );
    if (gizliIndeksler.size === 0) return mevcutKonusma; // filtre yoksa orijinal veri
    const mesajlar = mevcutKonusma.mesajlar.filter((mesaj, indeks) => !gizliIndeksler.has(indeks)); // seçili mesajlar
    return { ...mevcutKonusma, mesajlar: mesajlar, mesajSayisi: mesajlar.length }; // filtreli kopya
}

// Ayar çubuğundaki seçim sayacını ve toplu buton etiketini günceller
function secimBilgisiniGuncelle() {
    const bilgi = document.getElementById('secimBilgisi'); // sayaç alanı
    const tumunuButon = document.getElementById('tumunuSecKaldir'); // toplu buton
    const secimModu = document.getElementById('mesajSecimModu'); // seçim modu toggle
    if (!bilgi || !tumunuButon || !secimModu) return; // elementler yoksa çık
    if (!secimModu.checked) { // seçim modu kapalıysa
        bilgi.textContent = ''; // sayaç gizli
        return;
    }
    const toplam = document.querySelectorAll('.mesaj-blogu').length; // toplam mesaj
    const secili = toplam - document.querySelectorAll('.mesaj-blogu.mesaj-secilmedi').length; // seçili mesaj
    bilgi.textContent = secili + ' / ' + toplam + ' mesaj seçili'; // sayaç metni
    tumunuButon.textContent = secili === toplam ? 'Tümünü Kaldır' : 'Tümünü Seç'; // duruma göre etiket
}

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

    // İçeriğiyle birlikte tamamen atlanacak etiketler — UI metni çıktıya sızmasın ("Kodu kopyala" butonu, mat-icon ligature, CSS kuralı)
    const atlanacakEtiketler = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'IFRAME', 'OBJECT', 'EMBED',
        'BUTTON', 'SELECT', 'TEXTAREA', 'SVG', 'CANVAS', 'AUDIO', 'VIDEO', 'MAT-ICON']; // içerikle birlikte at

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

                    // IMG etiketi için src (güvenli şemalar: data:image/{png,jpeg,jpg,gif,webp} / https:)
                    if (cocuk.tagName === 'IMG') {
                        const src = cocuk.getAttribute('src') || '';
                        // SVG data URI XSS koruması: sadece raster format'lara izin ver
                        const guvenliDataUri = /^data:image\/(png|jpeg|jpg|gif|webp);(base64,|charset=)/i.test(src); // raster format kontrol
                        const guvenliHttps = src.startsWith('https://') && !src.toLowerCase().includes('javascript:'); // https + javascript: önleme
                        if (guvenliDataUri || guvenliHttps) { // sadece güvenli kaynak (blob: kaldırıldı — cross-origin'de ölü + CSP dışı)
                            yeniElement.setAttribute('src', src); // güvenli src
                        }
                        yeniElement.setAttribute('alt', cocuk.getAttribute('alt') || 'Görsel');
                        yeniElement.setAttribute('loading', 'lazy');
                        yeniElement.setAttribute('referrerpolicy', 'no-referrer'); // referrer leak önle
                    }

                    temizleVeKopyala(cocuk, yeniElement); // alt element'leri recursive temizle
                    hedef.appendChild(yeniElement);
                } else if (atlanacakEtiketler.includes(cocuk.tagName.toUpperCase())) { // UI/aktif element
                    // tamamen atla — içeriği de kopyalanmaz (buton yazısı, ikon metni, CSS sızıntısı önlenir)
                } else { // whitelist dışı — içeriği al, tag'i at
                    temizleVeKopyala(cocuk, hedef);
                }
            }
        }
    }

    temizleVeKopyala(govde, geciciDiv);
    return geciciDiv; // temizlenmiş DOM — tüm elementler createElement ile oluşturulmuş
}
