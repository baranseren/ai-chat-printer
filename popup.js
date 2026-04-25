// Popup script - AI konuşmasını çıkarıp yazdırma sayfasını açar

// Varsayılan ayarlar (ortak-yardimcilar.js content script tarafı içindir; popup tarafında burada tekrar tanımlı)
const VARSAYILAN_POPUP_AYARLAR = { // popup tarafındaki varsayılanlar
    kodBloklari: true, // kod blokları dahil
    otomatikYazdir: true, // otomatik yazdır
    yaziBoyutu: '13', // normal yazı boyutu
    footerGoster: true // eklenti imzasını göster (false = footer'ı kaldır)
};

// Sayfa yüklendiğinde çalış
document.addEventListener('DOMContentLoaded', async () => { // DOM hazır olduğunda
    const yazdirButonu = document.getElementById('yazdirButonu'); // yazdır butonu
    const kodBloklariCheck = document.getElementById('kodBloklari'); // kod blokları toggle
    const otomatikYazdirCheck = document.getElementById('otomatikYazdir'); // otomatik yazdır toggle
    const yaziBoyutuSelect = document.getElementById('yaziBoyutu'); // yazı boyutu select
    const footerGosterCheck = document.getElementById('footerGoster'); // footer toggle

    // Kalıcı ayarları yükle ve UI'ya yansıt
    try { // storage erişim denemesi
        const kayit = await chrome.storage.sync.get(['kullaniciAyarlari']); // sync storage'dan oku
        const ayarlar = { ...VARSAYILAN_POPUP_AYARLAR, ...(kayit.kullaniciAyarlari || {}) }; // varsayılanları override et
        kodBloklariCheck.checked = ayarlar.kodBloklari; // toggle durumu
        otomatikYazdirCheck.checked = ayarlar.otomatikYazdir; // toggle durumu
        yaziBoyutuSelect.value = ayarlar.yaziBoyutu; // select değeri
        footerGosterCheck.checked = ayarlar.footerGoster !== false; // varsayılan true
    } catch (yukleHata) { // storage erişilemezse varsayılan kalır
        console.warn('AI Chat Printer: Ayar yükleme başarısız:', yukleHata.message); // uyarı
    }

    // Aktif sekmeyi proaktif kontrol et — desteklenmeyen sitedeyse bilgi ver
    const DESTEKLENEN_URLLER = ['gemini.google.com', 'claude.ai', 'chatgpt.com', 'grok.com']; // tek doğru kaynak
    try { // sekme bilgisi
        const [aktif] = await chrome.tabs.query({ active: true, currentWindow: true }); // aktif sekme
        const url = aktif?.url || ''; // URL
        const desteklenenSite = DESTEKLENEN_URLLER.some((domain) => url.includes(domain)); // desteklenen mi
        if (!desteklenenSite) { // değilse uyar
            durumGoster('bilgi', 'Bu sayfa desteklenmiyor. Eklenti gemini.google.com, claude.ai, chatgpt.com ve grok.com sayfalarında çalışır.'); // bilgi mesajı
            yazdirButonu.disabled = true; // yazdır butonunu disable et
            yazdirButonu.style.opacity = '0.5'; // görsel feedback
            yazdirButonu.style.cursor = 'not-allowed'; // imleç değişimi
        }
    } catch (sekmeHata) { // tabs API hatası — görmezden gel, normal akış devam etsin
        console.warn('AI Chat Printer: Sekme kontrolü başarısız:', sekmeHata.message); // uyarı
    }

    // Ayar değiştiğinde otomatik kalıcı kaydet + feedback göster
    const ayarKaydet = async () => { // ayarları kaydeden iç fonksiyon
        const ayarlar = { // mevcut UI ayarları
            kodBloklari: kodBloklariCheck.checked, // kod blokları dahil mi
            otomatikYazdir: otomatikYazdirCheck.checked, // otomatik yazdır mı
            yaziBoyutu: yaziBoyutuSelect.value, // yazı boyutu
            footerGoster: footerGosterCheck.checked // footer göster
        };
        try { // storage erişim denemesi
            await chrome.storage.sync.set({ kullaniciAyarlari: ayarlar }); // sync storage'a yaz
            durumGoster('bilgi', 'Ayar kaydedildi.'); // kullanıcıya feedback
            setTimeout(() => { // 1.5sn sonra durum alanını gizle (yazdır butonu aktifse etkilemez)
                const du = document.getElementById('durumAlani');
                if (du && du.classList.contains('bilgi')) du.classList.remove('gorunur');
            }, 1500);
        } catch (kayitHata) { // erişim başarısızsa
            console.warn('AI Chat Printer: Ayar kaydetme başarısız:', kayitHata.message); // uyarı
            durumGoster('hata', 'Ayar kaydedilemedi.'); // hata feedback
        }
    };
    kodBloklariCheck.addEventListener('change', ayarKaydet); // toggle değişimi
    otomatikYazdirCheck.addEventListener('change', ayarKaydet); // toggle değişimi
    yaziBoyutuSelect.addEventListener('change', ayarKaydet); // select değişimi
    footerGosterCheck.addEventListener('change', ayarKaydet); // footer toggle değişimi

    // Yazdır butonuna tıklama olayı
    yazdirButonu.addEventListener('click', async () => { // tıklama dinleyici
        yazdirButonu.disabled = true; // butonu devre dışı bırak
        butonMetniGuncelle(yazdirButonu, 'Çıkarılıyor...'); // SVG'yi koruyarak metni güncelle
        durumGoster('bilgi', 'Konuşma içeriği çıkarılıyor...'); // bilgi mesajı göster

        try {
            // Aktif sekmeyi al
            const [aktifSekme] = await chrome.tabs.query({ active: true, currentWindow: true }); // aktif sekme bilgisi

            // Desteklenen site kontrolü (DRY — yukarıdaki DESTEKLENEN_URLLER ile aynı)
            const desteklenenSite = DESTEKLENEN_URLLER.some((domain) => (aktifSekme.url || '').includes(domain)); // URL kontrolü
            if (!desteklenenSite) { // desteklenmeyen site
                durumGoster('hata', 'Bu eklenti gemini.google.com, claude.ai, chatgpt.com ve grok.com sayfalarında çalışır.'); // hata mesajı
                butonuSifirla(); // butonu eski haline getir
                return;
            }

            // Content script'e mesaj gönder — context kaybolmuşsa yakalama
            let yanit; // response bekleme
            try { // content script iletişim denemesi
                yanit = await chrome.tabs.sendMessage(aktifSekme.id, { islem: 'konusmayiCikar' }); // konuşma çıkar isteği
            } catch (iletisimHata) { // content script yanıt vermediyse
                durumGoster('hata', 'Content script yüklenmemiş. Sayfayı yenileyip (F5) tekrar deneyin.'); // kullanıcı rehberi
                butonuSifirla(); // butonu sıfırla
                return;
            }

            if (!yanit) { // boş yanıt
                durumGoster('hata', 'Sayfadan yanıt alınamadı. Sayfayı yenileyip (F5) tekrar deneyin.'); // rehber
                butonuSifirla(); // butonu sıfırla
                return;
            }

            if (yanit.hata) { // hata varsa
                durumGoster('hata', yanit.hata); // hata mesajını göster
                butonuSifirla(); // butonu sıfırla
                return;
            }

            if (!yanit.mesajlar || yanit.mesajlar.length === 0) { // mesaj yoksa
                durumGoster('hata', 'Konuşmada mesaj bulunamadı. Bir sohbet açık olduğundan emin olun.'); // uyarı
                butonuSifirla(); // butonu sıfırla
                return;
            }

            // Ayarları oku (UI'dan)
            const ayarlar = { // kullanıcı tercihleri
                kodBloklari: kodBloklariCheck.checked, // kod blokları dahil mi
                otomatikYazdir: otomatikYazdirCheck.checked, // otomatik yazdır mı
                yaziBoyutu: yaziBoyutuSelect.value, // yazı boyutu
                footerGoster: footerGosterCheck.checked // footer göster
            };

            // Ayarları kalıcı olarak kaydet (bu tıklamada değişmiş olabilir)
            try { // sync storage denemesi
                await chrome.storage.sync.set({ kullaniciAyarlari: ayarlar }); // kalıcı kaydet
            } catch (syncHata) { // başarısızsa görmezden gel
                console.warn('AI Chat Printer: Sync kaydı başarısız:', syncHata.message); // uyarı
            }

            // Veriyi chrome.storage.local'a kaydet
            await chrome.storage.local.set({ // geçici veri kaydet
                konusmaVerisi: yanit, // konuşma içeriği
                yazdirAyarlari: ayarlar // yazdırma ayarları
            });

            durumGoster('basarili', yanit.mesajSayisi + ' mesaj çıkarıldı. Yazdırma sayfası açılıyor...'); // başarı mesajı

            // Yazdırma sayfasını aç
            chrome.tabs.create({ url: chrome.runtime.getURL('yazdir.html') }); // yeni sekmede aç

        } catch (hata) { // hata yakalandıysa
            console.error('AI Chat Printer hata:', hata); // konsola yaz
            durumGoster('hata', 'Bir hata oluştu: ' + hata.message); // kullanıcıya göster
            butonuSifirla(); // butonu sıfırla
        }
    });
});

// Durum mesajını gösterir
function durumGoster(tip, mesaj) { // tip: basarili, hata, bilgi
    const durumAlani = document.getElementById('durumAlani'); // durum alanı
    durumAlani.className = 'durum gorunur ' + tip; // CSS sınıflarını ayarla
    durumAlani.textContent = mesaj; // mesaj metnini yaz
}

// Butonu varsayılan haline döndürür (SVG'yi koruyarak)
function butonuSifirla() {
    const yazdirButonu = document.getElementById('yazdirButonu'); // buton referansı
    yazdirButonu.disabled = false; // butonu aktif et
    butonMetniGuncelle(yazdirButonu, 'Konuşmayı Yazdır'); // SVG'yi koruyarak metni geri yükle
}

// Butonun metnini değiştirir — içindeki SVG'yi korur (ilk text node'u günceller)
function butonMetniGuncelle(buton, yeniMetin) {
    let metinNode = null; // mevcut text node
    for (const cocuk of buton.childNodes) { // çocukları tara
        if (cocuk.nodeType === Node.TEXT_NODE && cocuk.textContent.trim()) { // dolu text node
            metinNode = cocuk; // bulundu
            break;
        }
    }
    if (metinNode) { // mevcut text node varsa
        metinNode.textContent = ' ' + yeniMetin; // güncelle (baştaki boşluk SVG ile mesafe için)
    } else { // yoksa yeni text node ekle (SVG'den sonra)
        buton.appendChild(document.createTextNode(' ' + yeniMetin)); // yeni text node ekle
    }
}
