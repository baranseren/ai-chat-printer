// Yazdırma sayfası script - konuşma verisini okur ve sayfaya render eder

// Global referans — Escape kısayolu ve clipboard export için render sonrası erişim
let mevcutKonusma = null; // render edilen konuşma verisi
let aktifOturumAnahtari = null; // bu sekmenin yalnız kendine ait geçici storage anahtarı
let eskiYazdirmaAkisi = false; // yalnız parametresiz eski sürüm uyumluluk akışında true
let mevcutAyarlar = ayarlariDogrula({}); // canlı önizleme ve dışa aktarımların tek ayar kaynağı
const CIKTI_EYLEM_KIMLIKLERI = ['yazdirTetikle', 'markdownKopyala', 'metinKopyala', 'markdownIndir', 'metinIndir', 'htmlIndir', 'jsonIndir']; // belge üreten bütün eylemler
const SESSION_YEDEK_UST_SINIR = 4 * 1024 * 1024; // büyük konuşmalar sessionStorage yerine chrome.storage.local içinde kalır

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

// Önizleme kurulamadığında ölü kontrol bırakmadan hatayı gösterir; Kapat eylemi açık kalır
function onizlemeHatasiGoster(mesaj) {
    yuklemeyiGizle(); // yükleme katmanını kapat
    const mesajlarAlani = document.getElementById('mesajlarAlani'); // hata metni hedefi
    if (mesajlarAlani) mesajlarAlani.textContent = mesaj; // dış girdiyi güvenli metin olarak göster
    const ozet = document.getElementById('onizlemeOzeti'); // üst durum özeti
    if (ozet) ozet.textContent = 'Önizleme kullanılamıyor'; // görünür hata durumu
    CIKTI_EYLEM_KIMLIKLERI.forEach((kimlik) => { // veri gerektiren eylemleri kapat
        const buton = document.getElementById(kimlik); // çıktı düğmesi
        if (buton) buton.disabled = true; // işlevsiz fakat etkin görünen düğme bırakma
    });
    document.querySelectorAll('#ayarCubugu input, #ayarCubugu select, #ayarCubugu button').forEach((kontrol) => { // veri bağımlı ayarlar
        kontrol.disabled = true; // boş önizlemede değiştirilemez
    });
}

// Veri yüklenemese bile Kapat ve Escape davranışlarını erişilebilir bırakır
function temelSayfaKontrolleriniBagla() {
    document.getElementById('sayfayiKapat').addEventListener('click', sayfayiKapat); // kapat düğmesi her durumda çalışır
    document.addEventListener('keydown', (olay) => { // genel klavye kısayolları
        if (olay.key === 'Escape') { // Escape ile kapat
            olay.preventDefault(); // tarayıcının varsayılanını engelle
            sayfayiKapat(); // önizlemeyi kapat
        } else if ((olay.ctrlKey || olay.metaKey) && olay.shiftKey && olay.key === 'M') { // Ctrl/Cmd+Shift+M
            olay.preventDefault(); // sayfa varsayılanını engelle
            document.getElementById('markdownKopyala').click(); // düğme etkin ve bağlıysa Markdown kopyala
        }
    });
}

// Bir resim kaynağının yazdırma sayfasında güvenle gösterilebilir olup olmadığını denetler
function guvenliResimKaynagiMi(kaynak) {
    if (typeof kaynak !== 'string') return false; // yanlış tip
    if (/^data:image\/(png|jpeg|jpg|gif|webp);(?:base64,|charset=)/i.test(kaynak)) return true; // güvenli raster data URI
    try { // URL'yi gerçek ayrıştırıcıyla doğrula
        const adres = new URL(kaynak); // tam URL
        return adres.protocol === 'https:'; // yalnız HTTPS
    } catch (hata) { // geçersiz URL
        return false; // reddet
    }
}

// Sayfa boyutu, yönü, kenarı, yazı boyutu, link ve footer ayarlarını birlikte uygular
function sayfaAyarlariUygula(ayarlar) {
    mevcutAyarlar = ayarlariDogrula(ayarlar); // her girişte izinli değerlere indir
    const kenarHaritasi = { dar: '1cm', normal: '2cm 1.5cm', genis: '2.7cm 2.2cm' }; // yazdırma kenar boşlukları
    const sayfaStili = document.getElementById('dinamikSayfaStili'); // dinamik @page stili
    if (sayfaStili) sayfaStili.textContent = '@page { size: ' + mevcutAyarlar.kagitBoyutu + ' ' + mevcutAyarlar.yonlendirme + '; margin: ' + kenarHaritasi[mevcutAyarlar.kenarBosluk] + '; }'; // doğrulanmış değerlerle CSS üret
    const yazdirmaAlani = document.getElementById('yazdirmaAlani'); // belge yüzeyi
    if (yazdirmaAlani) yazdirmaAlani.style.fontSize = mevcutAyarlar.yaziBoyutu + 'px'; // canlı yazı boyutu
    document.body.classList.toggle('kod-gizli', !mevcutAyarlar.kodBloklari); // kod görünürlüğü
    document.body.classList.toggle('link-adresi-gizli', !mevcutAyarlar.linkAdresleriniGoster); // baskıda link adresi
    const footer = document.querySelector('.sayfa-alt-bilgi'); // belge alt bilgisi
    if (footer) footer.hidden = !mevcutAyarlar.footerGoster; // ekranda, baskıda ve HTML çıktıda ortak görünürlük
}

// Önizlemedeki tüm canlı ayar kontrollerini tek ayar nesnesine dönüştürür
function canliAyarlariOku() {
    return ayarlariDogrula({ // form değerlerini ortak doğrulayıcıdan geçir
        ...mevcutAyarlar, // popup'ta kalan otomatik yazdır gibi alanları koru
        yaziBoyutu: document.getElementById('canliYaziBoyutu').value, // yazı boyutu
        kagitBoyutu: document.getElementById('canliKagitBoyutu').value, // kâğıt boyutu
        yonlendirme: document.getElementById('canliYonlendirme').value, // yön
        kenarBosluk: document.getElementById('canliKenarBosluk').value, // kenar boşluğu
        kodBloklari: document.getElementById('canliKodBloklari').checked, // kod blokları
        footerGoster: document.getElementById('canliFooterGoster').checked, // belge imzası
        linkAdresleriniGoster: document.getElementById('canliLinkAdresleri').checked // link adresleri
    });
}

// Belgedeki tüm resimlerin yüklenmesini süre sınırıyla bekler
async function belgeResimleriniBekle() {
    const tumResimler = Array.from(document.querySelectorAll('#yazdirmaAlani .mesaj-blogu:not(.mesaj-secilmedi) img')); // yalnız çıktıya seçilmiş mesajların resimleri
    await Promise.all(tumResimler.map(async (resim) => { // her resmi bağımsız bekle ve decode et
        if (!resim.complete) { // ağ yüklemesi henüz bitmediyse
            await new Promise((coz) => { // load/error/timeout yarışı
                let tamamlandi = false; // tek sonuç kilidi
                const bitir = () => { // dinleyici ve timer temizliği
                    if (tamamlandi) return; // önceki sonuç geldiyse çık
                    tamamlandi = true; // kilitle
                    clearTimeout(zamanlayici); // timer'ı temizle
                    resim.removeEventListener('load', bitir); // başarı dinleyicisini kaldır
                    resim.removeEventListener('error', bitir); // hata dinleyicisini kaldır
                    coz(); // beklemeyi tamamla
                };
                const zamanlayici = setTimeout(bitir, 5000); // uzak resimler için azami beş saniye
                resim.addEventListener('load', bitir, { once: true }); // yüklenme
                resim.addEventListener('error', bitir, { once: true }); // hata da akışı durdurmaz
            });
        }
        if (resim.complete && resim.naturalWidth > 0 && typeof resim.decode === 'function') { // yüklenmiş geçerli raster
            try { await resim.decode(); } catch (decodeHata) {} // decode reddi baskı akışını durdurmaz
        }
    }));
}

// Seçim ve resim hazırlığı tamamlandıktan sonra yazdırma penceresini açar
async function yazdirmayaHazirlaVeYazdir() {
    const veri = gecerliSecimVerisi(); // boş seçimi engelle
    if (!veri) return; // seçim yoksa çık
    await belgeResimleriniBekle(); // eksik resimle erken baskıyı önle
    var eksikResimler = Array.from(document.querySelectorAll('#yazdirmaAlani .mesaj-blogu:not(.mesaj-secilmedi) img')).filter(function(resim) { return !resim.complete || resim.naturalWidth === 0; });
    if (eksikResimler.length) {
        toastGoster(eksikResimler.length + ' görsel yüklenemedi; eksik çıktı oluşmaması için yazdırma durduruldu.', 'hata');
        return;
    }
    window.print(); // tarayıcının yazdırma penceresi
}

// Sayfa yüklendiğinde konuşma verisini oku ve göster
document.addEventListener('DOMContentLoaded', async () => { // DOM hazır olduğunda
    temelSayfaKontrolleriniBagla(); // veri hatasında dahi kapatma davranışını hazırla
    yuklemeMetniniGuncelle('Konuşma verisi okunuyor...'); // durum güncelle

    // URL'deki oturum kimliği bu sekmenin hangi konuşma paketini okuyacağını belirler
    const aramaParametreleri = new URLSearchParams(window.location.search); // URL parametreleri
    const oturumKimligi = aramaParametreleri.get('oturum') || ''; // önizleme sekmesine özel kimlik
    if (aramaParametreleri.has('oturum') && !yazdirmaOturumKimligiGecerliMi(oturumKimligi)) { // bozuk parametre varsa eski anahtarlara düşme
        onizlemeHatasiGoster('Yazdırma oturumu geçersiz. AI konuşmasından yeni bir önizleme oluşturun.'); // ölü eylem bırakmadan hata göster
        return; // storage okuma
    }
    const oturumAnahtari = oturumKimligi ? yazdirmaOturumAnahtari(oturumKimligi) : ''; // storage anahtarı

    // chrome.storage.local'dan yalnız bu sekmeye ait veriyi oku (try-catch)
    let depolanmisVeri = {}; // kayıtlı veri
    try { // erişim denemesi
        if (oturumAnahtari) { // güncel oturumlu akış
            aktifOturumAnahtari = oturumAnahtari; // okuma hatasında dahi Kapat bu paketi temizleyebilsin
            const oturumKaydi = await chrome.storage.local.get(oturumAnahtari); // yalnız kendi paketi oku
            depolanmisVeri = oturumKaydi[oturumAnahtari] || {}; // paket yoksa boş nesne kullan
            const buyukOturum = depolanmisVeri.konusmaVerisi && (depolanmisVeri.veriBoyutu || veriBoyutuHesapla(depolanmisVeri.konusmaVerisi)) > SESSION_YEDEK_UST_SINIR; // F5 yedeği için güvenli sınır
            if (depolanmisVeri.konusmaVerisi && !buyukOturum) { // küçük oturumda eski oku-ve-sil akışını koru
                chrome.storage.local.remove(oturumAnahtari).catch(() => {}); // oku-ve-hemen-sil: yalnız kendi paketini kaldır
            }
        } else { // önceki sürümden açık kalan doğrudan yazdırma sayfası için uyumluluk
            eskiYazdirmaAkisi = true; // yalnız bu dal eski global anahtarların sahibidir
            depolanmisVeri = await chrome.storage.local.get(['konusmaVerisi', 'yazdirAyarlari']); // eski ortak anahtarları oku
            if (depolanmisVeri.konusmaVerisi) { // eski veri varsa
                chrome.storage.local.remove(['konusmaVerisi', 'yazdirAyarlari']).catch(() => {}); // eski taşıma verisini temizle
            }
        }
    } catch (okumaHata) { // storage erişilemezse
        onizlemeHatasiGoster('Storage erişim hatası: ' + okumaHata.message); // eylemleri kapatıp güvenli hata göster
        return;
    }

    let konusma = depolanmisVeri.konusmaVerisi; // konuşma verisi
    let ayarlar = ayarlariDogrula(depolanmisVeri.yazdirAyarlari || {}); // yazdırma ayarları

    // F5 dayanıklılığı: storage boşsa bu sekmenin sessionStorage yedeğinden geri yükle
    // (sessionStorage sekmeye özeldir — multi-tab race condition korumasını bozmaz)
    if (!konusma) { // storage'dan veri gelmedi (muhtemelen F5)
        try { // sessionStorage okuma denemesi
            const yedek = sessionStorage.getItem('aiChatPrinterYedek:' + (oturumKimligi || 'eski')); // bu sekmenin ve oturumun yedeği
            if (yedek) { // yedek varsa
                const cozulmus = JSON.parse(yedek); // JSON çöz
                konusma = cozulmus.konusmaVerisi; // konuşma geri geldi
                ayarlar = ayarlariDogrula(cozulmus.yazdirAyarlari || {}); // ayarlar doğrulanarak geri geldi
            }
        } catch (yedekHata) {} // yedek bozuksa normal hata akışına düş
    } else if (!oturumAnahtari || (depolanmisVeri.veriBoyutu || veriBoyutuHesapla(konusma)) <= SESSION_YEDEK_UST_SINIR) { // küçük konuşmayı sekmeye yedekle
        try { // quota aşımında sessizce vazgeç (davranış eskisi gibi kalır)
            sessionStorage.setItem('aiChatPrinterYedek:' + (oturumKimligi || 'eski'), JSON.stringify({ konusmaVerisi: konusma, yazdirAyarlari: ayarlar })); // sekme ve oturum içi yedek
        } catch (yedekHata) {} // büyük konuşma sessionStorage'a sığmayabilir — kritik değil
    }

    if (!konusma || !konusma.mesajlar || konusma.mesajlar.length === 0) { // veri yoksa
        onizlemeHatasiGoster('Konuşma verisi bulunamadı. Lütfen AI sayfasından tekrar yazdır butonuna tıklayın.'); // ölü eylem bırakmadan hata göster
        return;
    }

    mevcutKonusma = konusma; // global referans (kopyala için)

    yuklemeMetniniGuncelle('İçerik işleniyor (' + konusma.mesajSayisi + ' mesaj)...'); // durum güncelle

    // Kaynak bilgisini merkezi site sözleşmesinden belirle
    const kaynak = konusma.kaynak || 'gemini'; // ham kaynak alanı
    const kaynakBilgi = kaynakSiteBilgisi(kaynak); // bilinen veya tarafsız kaynak bilgisi
    const yapayZekaAdi = kaynakBilgi.ad; // etiket metni
    const yapayZekaSinif = kaynakBilgi.kaynak; // CSS sınıfı
    const kaynakSite = kaynakBilgi.hostname; // site adresi
    sayfaAyarlariUygula(ayarlar); // tüm sayfa ve içerik ayarlarını tek noktadan uygula

    // Başlık ve tarih bilgisini yaz (tümü textContent — XSS-safe)
    const konusmaBasligi = konusma.baslik || kaynakBilgi.baslik;
    document.getElementById('konusmaBasligi').textContent = konusmaBasligi;
    document.getElementById('konusmaTarihi').textContent = (konusma.tarih || '') + ' ' + (konusma.saat || '');
    document.title = konusmaBasligi; // PDF dosya adı
    document.getElementById('mesajSayisi').textContent = konusma.mesajSayisi + ' mesaj';
    document.getElementById('kaynakSite').textContent = kaynakSite;
    document.getElementById('onizlemeOzeti').textContent = kaynakBilgi.gorunenAd + ' · ' + konusma.mesajSayisi + ' mesaj'; // kontrol çubuğu özeti

    // Mesajları render et
    const mesajlarAlani = document.getElementById('mesajlarAlani'); // mesajlar container
    let mesajSirasi = 0; // mesaj numaralandırma sayacı
    let tabloVarMi = false; // geniş tablo kontrolü için

    konusma.mesajlar.forEach((mesaj, mesajIndex) => { // her mesajı işle
        mesajSirasi++; // sıra numarasını artır

        const mesajBlogu = document.createElement('div'); // mesaj bloğu oluştur
        mesajBlogu.className = 'mesaj-blogu'; // CSS sınıfı
        mesajBlogu.dataset.mesajIndex = String(mesajIndex); // export filtresi için orijinal indeks
        mesajBlogu.dataset.rol = mesaj.rol === 'kullanici' ? 'kullanici' : 'yapay-zeka'; // rol bazlı toplu seçim anahtarı

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
                if (!guvenliResimKaynagiMi(src)) return; // yalnız raster data URI veya gerçek HTTPS URL
                const resimElementi = document.createElement('img'); // img oluştur
                resimElementi.src = src; // güvenli kaynak
                resimElementi.className = 'mesaj-resim'; // CSS sınıfı
                resimElementi.loading = 'eager'; // yazdırma öncesi görünmeyen resimler de yüklensin
                resimElementi.decoding = 'async'; // decode ana thread'i gereksiz bloklamasın
                resimElementi.referrerPolicy = 'no-referrer'; // uzak görsele konuşma URL'sini gönderme
                resimElementi.alt = (resim.alt && typeof resim.alt === 'string') ? resim.alt : 'Görsel'; // alt metin
                resimElementi.addEventListener('error', () => { resimElementi.alt = 'Görsel yüklenemedi: ' + resimElementi.alt; }, { once: true }); // mevcut handler atamadan yükleme hatasını gizle
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

    // Canlı ayar çubuğu bağlantıları
    const canliYaziBoyutu = document.getElementById('canliYaziBoyutu'); // yazı boyutu select
    const canliKagitBoyutu = document.getElementById('canliKagitBoyutu'); // kâğıt boyutu select
    const canliYonlendirme = document.getElementById('canliYonlendirme'); // yön select
    const canliKenarBosluk = document.getElementById('canliKenarBosluk'); // kenar boşluğu select
    const canliKodBloklari = document.getElementById('canliKodBloklari'); // kod blokları toggle
    const canliFooterGoster = document.getElementById('canliFooterGoster'); // footer toggle
    const canliLinkAdresleri = document.getElementById('canliLinkAdresleri'); // link adresleri toggle
    const mesajSecimModu = document.getElementById('mesajSecimModu'); // mesaj seçim modu toggle
    const tumunuSecKaldir = document.getElementById('tumunuSecKaldir'); // tümünü seç/kaldır butonu
    const secimAraclari = document.getElementById('secimAraclari'); // rol bazlı seçim araçları

    canliYaziBoyutu.value = ayarlar.yaziBoyutu || '13'; // kayıtlı boyutu yansıt
    canliKagitBoyutu.value = ayarlar.kagitBoyutu; // kayıtlı kâğıdı yansıt
    canliYonlendirme.value = ayarlar.yonlendirme; // kayıtlı yönü yansıt
    canliKenarBosluk.value = ayarlar.kenarBosluk; // kayıtlı kenar boşluğunu yansıt
    canliKodBloklari.checked = ayarlar.kodBloklari !== false; // kayıtlı kod bloğu ayarını yansıt
    canliFooterGoster.checked = ayarlar.footerGoster !== false; // kayıtlı footer ayarını yansıt
    canliLinkAdresleri.checked = ayarlar.linkAdresleriniGoster !== false; // kayıtlı link ayarını yansıt

    const canliAyarDegisti = async () => { // tüm canlı ayarlar için ortak değişim akışı
        const yeniAyarlar = canliAyarlariOku(); // formu doğrulanmış ayara dönüştür
        sayfaAyarlariUygula(yeniAyarlar); // önizleme ve @page stilini anında güncelle
        const basari = await ayarlariKaydet(yeniAyarlar); // popup ile kalıcı olarak eşitle
        if (!basari) toastGoster('Ayar kalıcı olarak kaydedilemedi; bu önizlemede uygulanmaya devam ediyor.', 'hata'); // yalnız gerçek kayıt hatasını bildir
    };
    [canliYaziBoyutu, canliKagitBoyutu, canliYonlendirme, canliKenarBosluk, canliKodBloklari, canliFooterGoster, canliLinkAdresleri].forEach((kontrol) => { // tüm ayar kontrolleri
        kontrol.addEventListener('change', canliAyarDegisti); // tek değişim sözleşmesi
    });
    mesajSecimModu.addEventListener('change', () => { // seçim modu aç/kapat
        document.body.classList.toggle('secim-modu-acik', mesajSecimModu.checked); // checkbox görünürlüğü
        secimAraclari.classList.toggle('gizli-buton', !mesajSecimModu.checked); // seçim araçlarının görünürlüğü
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

    // Yalnız belirtilen rolü seçer ve diğer mesajları çıktıdan çıkarır
    const yalnizRoluSec = (rol) => { // rol: kullanici | yapay-zeka
        document.querySelectorAll('.mesaj-blogu').forEach((blok) => { // tüm mesaj blokları
            const secili = blok.dataset.rol === rol; // hedef rol mü
            const kutu = blok.querySelector('.mesaj-secim-kutusu'); // seçim kutusu
            if (kutu) kutu.checked = secili; // checkbox durumunu eşitle
            blok.classList.toggle('mesaj-secilmedi', !secili); // çıktı durumunu eşitle
        });
        secimBilgisiniGuncelle(); // sayaç ve özet
    };
    document.getElementById('yalnizKullaniciSec').addEventListener('click', () => yalnizRoluSec('kullanici')); // yalnız kullanıcı mesajları
    document.getElementById('yalnizYapayZekaSec').addEventListener('click', () => yalnizRoluSec('yapay-zeka')); // yalnız AI mesajları
    secimBilgisiniGuncelle(); // ilk seçim ve eylem durumunu senkronla

    // Geniş tablo varsa landscape önerisi göster
    if (tabloVarMi) { // tablo içeren mesaj varsa
        setTimeout(() => { // render sonrası
            toastGoster('Geniş tablo bulundu. Üstteki Yön ayarından “Yatay” seçilerek çıktı genişletilebilir.', 'bilgi'); // doğrudan uygulanabilir ipucu
        }, 1200);
    }

    // Loading overlay'i gizle
    yuklemeyiGizle();

    // Storage temizliği zaten oku-anında yapıldı (multi-tab race condition koruması)
    // Bu noktada storage zaten boş, ek temizleme gereksiz

    // Otomatik yazdır — tüm resimlerin yüklenmesini bekle, sonra print
    if (ayarlar.otomatikYazdir) { // otomatik yazdır açıksa
        setTimeout(() => yazdirmayaHazirlaVeYazdir(), 220); // manuel yolla aynı seçim + yükleme + decode bariyerini kullan
    }

    // Kontrol butonları
    document.getElementById('yazdirTetikle').addEventListener('click', yazdirmayaHazirlaVeYazdir); // boş seçim ve eksik resim korumalı yazdır

    // Markdown kopyala (mesaj seçimine saygılı)
    document.getElementById('markdownKopyala').addEventListener('click', async () => { // markdown butonu
        const veri = gecerliSecimVerisi(); // boş olmayan seçili mesajlarla filtreli veri
        if (!veri) return; // veri yoksa çık
        const md = konusmayiMarkdowneDonustur(veri, mevcutAyarlar.footerGoster); // footer tercihine uyan markdown string
        const basari = await panoyaKopyala(md); // panoya kopyala
        if (basari) toastGoster('Markdown panoya kopyalandı.', 'basari'); // başarı bildirimi
        else toastGoster('Kopyalama başarısız. Tarayıcı izinlerini kontrol edin.', 'hata'); // hata
    });

    // Düz metin kopyala (mesaj seçimine saygılı)
    document.getElementById('metinKopyala').addEventListener('click', async () => { // metin butonu
        const veri = gecerliSecimVerisi(); // boş olmayan seçili mesajlarla filtreli veri
        if (!veri) return; // veri yoksa çık
        const metin = konusmayiDuzMetneDonustur(veri, mevcutAyarlar.footerGoster); // footer tercihine uyan düz metin
        const basari = await panoyaKopyala(metin); // panoya kopyala
        if (basari) toastGoster('Düz metin panoya kopyalandı.', 'basari'); // başarı
        else toastGoster('Kopyalama başarısız. Tarayıcı izinlerini kontrol edin.', 'hata'); // hata
    });

    // Tüm konuşmayı dosya olarak indir (MD veya TXT) — panoya kopyalamanın dosya karşılığı
    const konusmayiDosyaIndir = (format) => { // format: 'md' | 'txt'
        const veri = gecerliSecimVerisi(); // boş olmayan seçili mesajlarla filtreli veri
        if (!veri) return; // veri yoksa çık
        const icerik = format === 'md' ? konusmayiMarkdowneDonustur(veri, mevcutAyarlar.footerGoster) : konusmayiDuzMetneDonustur(veri, mevcutAyarlar.footerGoster); // formata ve footer tercihine göre içerik
        const mimeType = format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8'; // MIME tipi
        const dosyaAdi = guvenliDosyaTemeli(veri) + '.' + format; // dış girdiyi yeniden FS-güvenli doğrula
        dosyayaIndir(icerik, dosyaAdi, mimeType); // ortak indirme yardımcısı
        toastGoster('İndirildi: ' + dosyaAdi, 'basari'); // bildirim
    };
    document.getElementById('markdownIndir').addEventListener('click', () => konusmayiDosyaIndir('md')); // MD indir butonu
    document.getElementById('metinIndir').addEventListener('click', () => konusmayiDosyaIndir('txt')); // TXT indir butonu

    // Tek dosya HTML olarak indir — mevcut render + gömülü CSS (kendi kendine yeterli belge)
    document.getElementById('htmlIndir').addEventListener('click', async () => { // HTML indir butonu
        const veri = gecerliSecimVerisi(); // dosya adı ve boş seçim kontrolü
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
        const htmlDokumani = document.implementation.createHTMLDocument(veri.baslik || 'AI Konuşması'); // string birleştirmeden güvenli belge oluştur
        htmlDokumani.documentElement.lang = 'tr'; // belge dili
        const karakterSeti = htmlDokumani.createElement('meta'); // karakter seti
        karakterSeti.setAttribute('charset', 'utf-8'); // UTF-8
        htmlDokumani.head.prepend(karakterSeti); // başa ekle
        const viewport = htmlDokumani.createElement('meta'); // responsive viewport
        viewport.name = 'viewport'; // meta adı
        viewport.content = 'width=device-width, initial-scale=1.0'; // mobil görünüm
        htmlDokumani.head.appendChild(viewport); // head'e ekle
        const stil = htmlDokumani.createElement('style'); // gömülü CSS
        stil.textContent = cssMetni + '\n.yazdirma-alani{margin:32px auto;}\n' + document.getElementById('dinamikSayfaStili').textContent; // görünüm + dinamik @page ayarı
        htmlDokumani.head.appendChild(stil); // head'e ekle
        htmlDokumani.body.className = mevcutAyarlar.linkAdresleriniGoster ? '' : 'link-adresi-gizli'; // link adresi tercihi
        htmlDokumani.body.appendChild(htmlDokumani.importNode(alanKlon, true)); // sanitize edilmiş belge klonunu ekle
        const htmlBelge = '<!DOCTYPE html>\n' + htmlDokumani.documentElement.outerHTML; // güvenli DOM'u serialize et
        const dosyaAdi = guvenliDosyaTemeli(veri) + '.html'; // dosya adı
        dosyayaIndir(htmlBelge, dosyaAdi, 'text/html;charset=utf-8'); // indir
        toastGoster('İndirildi: ' + dosyaAdi, 'basari'); // bildirim
    });

    // JSON olarak indir — yapılandırılmış ham veri (arşivleme / başka araçlara aktarım)
    document.getElementById('jsonIndir').addEventListener('click', () => { // JSON indir butonu
        const veri = gecerliSecimVerisi(); // boş olmayan seçili mesajlarla filtreli veri
        if (!veri) return; // veri yoksa çık
        const dosyaAdi = guvenliDosyaTemeli(veri) + '.json'; // güvenli dosya adı
        dosyayaIndir(JSON.stringify(veri, null, 2), dosyaAdi, 'application/json;charset=utf-8'); // okunabilir JSON indir
        toastGoster('İndirildi: ' + dosyaAdi, 'basari'); // bildirim
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

// Boş seçimi kullanıcıya bildirir ve yalnız çıktı üretilebilir veriyi döndürür
function gecerliSecimVerisi() {
    const veri = seciliKonusmaVerisi(); // güncel seçim
    if (!veri || !Array.isArray(veri.mesajlar) || veri.mesajlar.length === 0) { // çıktı üretilemezse
        toastGoster('Çıktı için en az bir mesaj seçilmelidir.', 'hata'); // somut yönlendirme
        return null; // işlemi durdur
    }
    return veri; // geçerli seçim
}

// Dışa aktarım dosya adını son noktada yeniden güvenli hâle getirir
function guvenliDosyaTemeli(veri) {
    return basligiTemizle(veri?.baslik || 'AI Konuşması', veri?.kaynak || '') || 'AI Konuşması'; // Unicode başlığı koruyup FS-yasaklı karakterleri temizle
}

// Ayar çubuğundaki seçim sayacını ve toplu buton etiketini günceller
function secimBilgisiniGuncelle() {
    const bilgi = document.getElementById('secimBilgisi'); // sayaç alanı
    const tumunuButon = document.getElementById('tumunuSecKaldir'); // toplu buton
    const secimModu = document.getElementById('mesajSecimModu'); // seçim modu toggle
    if (!bilgi || !tumunuButon || !secimModu) return; // elementler yoksa çık
    const toplam = document.querySelectorAll('.mesaj-blogu').length; // toplam mesaj
    const secili = toplam - document.querySelectorAll('.mesaj-blogu.mesaj-secilmedi').length; // seçili mesaj
    bilgi.textContent = secimModu.checked ? secili + ' / ' + toplam + ' mesaj seçili' : ''; // sayaç yalnız seçim modunda görünür
    tumunuButon.textContent = secili === toplam ? 'Tümünü Kaldır' : 'Tümünü Seç'; // duruma göre etiket
    const kaynakBilgi = kaynakSiteBilgisi(mevcutKonusma?.kaynak || 'ai'); // merkezi kaynak bilgisi
    const ozet = document.getElementById('onizlemeOzeti'); // üst özet alanı
    if (ozet) ozet.textContent = kaynakBilgi.gorunenAd + ' · ' + secili + '/' + toplam + ' mesaj'; // seçimin çıktı üzerindeki etkisini görünür yap
    CIKTI_EYLEM_KIMLIKLERI.forEach((kimlik) => { // tüm çıktı eylemlerini eşitle
        const buton = document.getElementById(kimlik); // ilgili buton
        if (buton) buton.disabled = secili === 0; // boş belgede işlem yapılmasın
    });
}

// Sayfayı kapat — storage temizle + chrome.tabs.remove
async function sayfayiKapat() {
    try { // storage temizleme denemesi
        if (aktifOturumAnahtari) await chrome.storage.local.remove(aktifOturumAnahtari); // yalnız bu sekmenin veri paketini temizle
        else if (eskiYazdirmaAkisi) await chrome.storage.local.remove(['konusmaVerisi', 'yazdirAyarlari']); // yalnız eski akışın ortak anahtarlarını temizle
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
// Regex tabanlı + ilk DOLU text node aranır (whitespace node'lar ve boşluksuz prefix startsWith'i kaçırıyordu)
function prefixTemizleDOM(element) {
    const prefixKalip = /^\s*(Siz şunu dediniz:|Siz şunu söylediniz:|You said:)\s*/; // bilinen prefix'ler
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT); // text node'ları tara
    let dugum = walker.nextNode(); // ilk text node
    while (dugum && !dugum.textContent.trim()) dugum = walker.nextNode(); // whitespace node'ları atla — ilk dolu node'u bul
    if (dugum && prefixKalip.test(dugum.textContent)) { // prefix ile başlıyorsa
        dugum.textContent = dugum.textContent.replace(prefixKalip, ''); // prefix'i kaldır
        if (!dugum.textContent.trim()) { // node tamamen boşaldıysa (prefix kendi bloğundaydı)
            const blok = dugum.parentElement; // sarmalayan element
            if (blok && blok !== element && !blok.textContent.trim()) blok.remove(); // boş kalan bloğu at (görsel boşluk kalmasın)
        }
    }
}

// Konuşma verisini düz metne dönüştürür (clipboard için)
function konusmayiDuzMetneDonustur(veri, footerGoster) {
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

    if (footerGoster !== false) metin += '\n\nBu çıktı AI Chat Printer eklentisi ile oluşturulmuştur.\n'; // kullanıcı isterse footer ekle
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

                    // Yalnız kod dili sınıflarını koru; kaynak sitenin iç UI sınıfları önizleme sınıflarıyla çakışamaz
                    if ((cocuk.tagName === 'PRE' || cocuk.tagName === 'CODE') && cocuk.className && typeof cocuk.className === 'string') {
                        const guvenliSiniflar = cocuk.className.split(/\s+/).filter((sinifAdi) => /^language-[a-z0-9_+-]{1,40}$/i.test(sinifAdi)); // dil sınıfı whitelist'i
                        if (guvenliSiniflar.length > 0) yeniElement.className = guvenliSiniflar.join(' '); // yalnız güvenli sınıfları kopyala
                    }

                    // A etiketi için href (güvenli şemalar: http/https/mailto/tel)
                    if (cocuk.tagName === 'A' && cocuk.getAttribute('href')) {
                        const href = cocuk.getAttribute('href') || '';
                        let guvenliBaglanti = false; // şema sonucu
                        try { // URL ayrıştırıcısıyla protokol denetimi
                            const protokol = new URL(href).protocol.toLowerCase(); // mutlak URL protokolü
                            guvenliBaglanti = ['http:', 'https:', 'mailto:', 'tel:'].includes(protokol); // izinli şemalar
                        } catch (hata) {} // göreli veya bozuk URL bilinçli reddedilir
                        if (guvenliBaglanti) {
                            yeniElement.setAttribute('href', href);
                            if (/^https?:/i.test(href)) {
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
                        let guvenliHttps = false; // URL sonucu
                        try { guvenliHttps = new URL(src).protocol === 'https:'; } catch (hata) {} // yalnız gerçek HTTPS URL
                        if (guvenliDataUri || guvenliHttps) { // sadece güvenli kaynak (blob: kaldırıldı — cross-origin'de ölü + CSP dışı)
                            yeniElement.setAttribute('src', src); // güvenli src
                        } else { // kaynaksız kırık img üretme
                            continue; // güvenli olmayan resmi tamamen atla
                        }
                        yeniElement.setAttribute('alt', cocuk.getAttribute('alt') || 'Görsel');
                        yeniElement.setAttribute('loading', 'eager');
                        yeniElement.setAttribute('decoding', 'async');
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
